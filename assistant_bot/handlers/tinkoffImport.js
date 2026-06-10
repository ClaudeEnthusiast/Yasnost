// handlers/tinkoffImport.js
// Импорт выписки Тинькофф (CSV) из Telegram-документа.
// Поток: документ -> парс -> план -> вопросы по неясному (с запоминанием) -> применение -> отчёт.
// Вся арифметика — в budgetCore; классификация/применение — в tinkoffApply. Здесь только Telegram.

const { loadKey, saveKey } = require('../db');
const c = require('../services/budgetCore');
const { parse } = require('../services/tinkoffParser');
const { planImport, applyPlan } = require('../services/tinkoffApply');
const { escHtml } = require('../utils');

const HTML = { parse_mode: 'HTML' };
const B = (text, data) => ({ text, callback_data: data });
const kb = (rows) => ({ parse_mode: 'HTML', reply_markup: { inline_keyboard: rows } });
const m = (n) => c.money(n);

// Сид-правила (пользователь задал явно). Контрагенты дополняются ответами в диалоге;
// паттерны заданы в коде (по подстроке описания + диапазону суммы).
const DEFAULT_RULES = {
  counterparts: {
    'Сергей М.': 'income',            // подработка -> в бюджет
    'АО "РЕСУРС"': 'env:КУ',          // ЖКХ -> конверт КУ
    'Илья Ш.': 'expense:Покупки',     // себе на банки Озон/ВБ -> покупка
  },
  patterns: [
    { match: 'яндекс|yandex', minAmount: 12000, maxAmount: 13000, action: 'env:Айфон' }, // рассрочка айфона
    { match: '(^|[^а-яё])вб([^а-яё]|$)|wildberries|вайлдберриз', action: 'expense:Покупки' },
    { match: 'озон|ozon', action: 'expense:Покупки' },
  ],
};

// Сессии импорта в памяти (один пользователь). Храним разобранный CSV + очередь вопросов.
const sessions = new Map();

async function loadBudget() { return c.normalize(await loadKey('budget')); }
async function loadRules() {
  const r = (await loadKey('import_rules')) || {};
  // паттерны всегда из кода; запомненные ответы по контрагентам — поверх дефолтных
  return { counterparts: { ...DEFAULT_RULES.counterparts, ...(r.counterparts || {}) }, patterns: DEFAULT_RULES.patterns };
}
// сохраняем только выученные правила по контрагентам (паттерны живут в коде)
async function saveRules(rules) { await saveKey('import_rules', { counterparts: rules.counterparts || {} }); }

function isCsv(doc) {
  if (!doc) return false;
  const name = String(doc.file_name || '').toLowerCase();
  const mime = String(doc.mime_type || '').toLowerCase();
  return name.endsWith('.csv') || mime.includes('csv') || (name.includes('operations') && name.endsWith('.txt'));
}

// Скачать файл документа в строку (UTF-8, со снятием BOM).
function downloadText(bot, fileId) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const stream = bot.getFileStream(fileId);
    stream.on('data', (d) => chunks.push(d));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8').replace(/^﻿/, '')));
    stream.on('error', reject);
  });
}

// Конверты бюджета -> кнопки (idx -> имя)
function envelopeButtons(budget, qIdx) {
  const rows = [];
  const envs = (budget.mandatory_expenses || []).map((e, i) => ({ i, name: e.name }));
  for (let k = 0; k < envs.length; k += 2) {
    rows.push(envs.slice(k, k + 2).map((e) => B(`📦 ${e.name}`, `imp:r:${qIdx}:env:${e.i}`)));
  }
  return rows;
}

function buildQueue(plan, applyDry) {
  // вопросы: конфликты конвертов -> внешние пополнения -> исходящие переводы -> входящие переводы
  const q = [];
  (applyDry.conflicts || []).forEach((cf) => q.push({ kind: 'conflict', name: cf.name, idx: cf.idx, manual: cf.manual, csvTotal: cf.csvTotal }));
  (plan.topupsAsk || []).forEach((t) => q.push({ kind: 'topup', key: t.key, note: t.note, amount: t.amount, date: t.date }));
  plan.transfersAsk.forEach((g) => q.push({ kind: 'out', counterpart: g.counterpart, total: g.total, count: g.items.length, items: g.items }));
  (plan.collisionAsk || []).forEach((x) => q.push({ kind: 'collision', key: x.key, note: x.note, amount: x.amount, date: x.date, match: x.match, category: x.category }));
  plan.incomeAsk.forEach((g) => q.push({ kind: 'in', counterpart: g.counterpart, total: g.total, count: g.items.length, items: g.items }));
  return q;
}

function summaryText(plan, applyDry, queueLen) {
  const newTotal = plan.expensesNew.reduce((s, e) => s + e.amount, 0);
  const envCount = Object.values(plan.envelopeCharges).reduce((s, b) => s + b.items.length, 0);
  const autoTopup = plan.topups.reduce((s, t) => s + t.amount, 0);
  const askTopup = (plan.topupsAsk || []).reduce((s, t) => s + t.amount, 0);
  let s = `📄 <b>Выписка Тинькофф разобрана</b>\n\n`;
  s += `🆕 Новых трат: <b>${plan.expensesNew.length}</b> на ${m(newTotal)}\n`;
  s += `📦 В конверты: <b>${envCount}</b> списаний\n`;
  if (autoTopup) s += `💰 Подработка → бюджет: <b>+${m(autoTopup)}</b>\n`;
  if (askTopup) s += `💵 Пополнения на подтверждение: <b>${m(askTopup)}</b>\n`;
  s += `♻️ Дублей пропущу: <b>${plan.expensesDup.length}</b>\n`;
  if (queueLen) s += `\n❓ Нужно разобрать <b>${queueLen}</b> неясных — давай по одному.`;
  else s += `\n✅ Неясного нет — можно применять.`;
  return s;
}

function questionText(q) {
  if (q.kind === 'conflict') {
    return `❓ <b>Конверт «${escHtml(q.name)}»</b>\n\nВручную уже оплачено <b>${m(q.manual)}</b>.\nВ выписке те же операции на <b>${m(q.csvTotal)}</b>.\n\nЗаменить ручное на выписку или оставить как есть?`;
  }
  if (q.kind === 'topup') {
    return `💵 <b>Пополнение «${escHtml(q.note)}»</b>\n${c.fmtRu(q.date)} — <b>${m(q.amount)}</b>\n\nЭто новые деньги в бюджет или уже заложено в план периода?`;
  }
  if (q.kind === 'collision') {
    return `🔀 <b>Похоже на дубль</b>\n\nИз выписки: «${escHtml(q.note)}» — <b>${m(q.amount)}</b> (${c.fmtRu(q.date)})\nУже в системе: «${escHtml(q.match.note)}» — ${m(q.match.amount)}\n\nЭто одна и та же трата?`;
  }
  const dir = q.kind === 'out' ? 'Исходящий перевод' : 'Входящий перевод';
  const lines = q.items.slice(0, 6).map((it) => `   ${c.fmtRu(it.date)} — ${m(it.amount)}`).join('\n');
  return `❓ <b>${dir}: «${escHtml(q.counterpart)}»</b>\n${q.count} шт. на <b>${m(q.total)}</b>\n${lines}\n\nКуда отнести?`;
}

function questionKb(q, budget, qIdx) {
  if (q.kind === 'conflict') {
    return kb([
      [B('🔁 Заменить выпиской', `imp:c:${qIdx}:replace`), B('✋ Оставить ручное', `imp:c:${qIdx}:keep`)],
    ]);
  }
  if (q.kind === 'topup') {
    return kb([
      [B('💰 + в бюджет', `imp:tp:${qIdx}:add`), B('📋 Уже в плане', `imp:tp:${qIdx}:skip`)],
    ]);
  }
  if (q.kind === 'collision') {
    return kb([
      [B('✅ Одна и та же (пропустить)', `imp:col:${qIdx}:same`)],
      [B('➕ Разные (внести обе)', `imp:col:${qIdx}:diff`)],
    ]);
  }
  if (q.kind === 'in') {
    return kb([
      [B('💰 В бюджет (доход)', `imp:r:${qIdx}:inc`), B('⏭ Пропустить', `imp:r:${qIdx}:skip`)],
    ]);
  }
  // исходящий: конверты + личная трата + пропуск
  const rows = envelopeButtons(budget, qIdx);
  rows.push([B('💳 Личная трата', `imp:r:${qIdx}:exp`), B('⏭ Пропустить', `imp:r:${qIdx}:skip`)]);
  return kb(rows);
}

function register(bot, isAllowed, deny) {
  const send = (chatId, text, opts = HTML) => bot.sendMessage(chatId, text, opts);
  async function edit(q, text, opts = HTML) {
    try { await bot.editMessageText(text, { chat_id: q.message.chat.id, message_id: q.message.message_id, ...opts }); }
    catch { await bot.sendMessage(q.message.chat.id, text, opts); }
  }

  // показать следующий вопрос или финальное подтверждение
  function step(chatId, target) {
    const st = sessions.get(chatId);
    if (!st) return;
    if (st.cursor >= st.queue.length) {
      const txt = `✅ <b>Всё разобрано.</b>\n\nПрименить импорт к бюджету?`;
      const markup = kb([[B('✅ Применить', 'imp:apply'), B('❌ Отмена', 'imp:cancel')]]);
      return target ? edit(target, txt, markup) : send(chatId, txt, markup);
    }
    const q = st.queue[st.cursor];
    const txt = questionText(q);
    const markup = questionKb(q, st.budget, st.cursor);
    return target ? edit(target, txt, markup) : send(chatId, txt, markup);
  }

  // ---- приём документа ----
  bot.on('document', async (msg) => {
    if (!isAllowed(msg)) return; // чужим молча
    if (!isCsv(msg.document)) return; // не CSV — не наш документ
    const chatId = msg.chat.id;
    const status = await send(chatId, '⏳ Читаю выписку…');
    try {
      const budget = await loadBudget();
      if (!c.isConfigured(budget)) {
        return bot.editMessageText('❌ Сначала настрой бюджет: /бюджет', { chat_id: chatId, message_id: status.message_id });
      }
      const text = await downloadText(bot, msg.document.file_id);
      const rules = await loadRules();
      const parsed = parse(text);
      const plan = planImport(budget, parsed, rules);
      // сухой прогон, чтобы выявить конфликты конвертов (не мутируем рабочий бюджет)
      const dryBudget = c.normalize(JSON.parse(JSON.stringify(budget)));
      const applyDry = applyPlan(dryBudget, planImport(dryBudget, parsed, rules), c.todayStr());

      const queue = buildQueue(plan, applyDry);
      sessions.set(chatId, { parsed, rules, queue, cursor: 0, forceEnvelopes: [], rememberedRules: { counterparts: {} }, topupDecisions: {}, collisionDecisions: {}, budget });

      await bot.editMessageText(summaryText(plan, applyDry, queue.length), { chat_id: chatId, message_id: status.message_id, parse_mode: 'HTML' });
      return step(chatId, null);
    } catch (e) {
      console.error('tinkoff import', e);
      try { await bot.editMessageText(`❌ Не смог разобрать файл: ${e.message}`, { chat_id: chatId, message_id: status.message_id }); }
      catch { send(chatId, `❌ Не смог разобрать файл: ${e.message}`); }
    }
  });

  // ---- кнопки импорта ----
  bot.on('callback_query', async (cbq) => {
    if (!cbq.data || !cbq.data.startsWith('imp:')) return; // не наши — мимо (budget слушает b:)
    if (!isAllowed({ from: cbq.from, chat: cbq.message && cbq.message.chat })) {
      return bot.answerCallbackQuery(cbq.id, { text: 'Нет доступа' }).catch(() => {});
    }
    bot.answerCallbackQuery(cbq.id).catch(() => {});
    const chatId = cbq.message.chat.id;
    const st = sessions.get(chatId);
    const parts = cbq.data.split(':'); // imp:<type>:...
    const type = parts[1];

    if (!st && type !== 'cancel') return edit(cbq, '⌛ Сессия импорта истекла. Пришли выписку заново.');

    try {
      if (type === 'cancel') { sessions.delete(chatId); return edit(cbq, '❌ Импорт отменён. Ничего не изменено.'); }

      if (type === 'tp') { // пополнение: +в бюджет / уже в плане
        const q = st.queue[parseInt(parts[2], 10)];
        if (q && q.key) st.topupDecisions[q.key] = parts[3] === 'add' ? 'add' : 'skip';
        st.cursor++;
        return step(chatId, cbq);
      }

      if (type === 'col') { // совпадение с ручной записью: одна и та же / разные
        const q = st.queue[parseInt(parts[2], 10)];
        if (q && q.key) st.collisionDecisions[q.key] = parts[3] === 'diff' ? 'diff' : 'same';
        st.cursor++;
        return step(chatId, cbq);
      }

      if (type === 'r' || type === 'c') {
        const qIdx = parseInt(parts[2], 10);
        const action = parts[3];
        const q = st.queue[qIdx];
        if (!q) return step(chatId, cbq);

        if (type === 'c') { // конфликт конверта
          if (action === 'replace') st.forceEnvelopes.push(q.name);
          // 'keep' — ничего не делаем (выписка по этому конверту пропущена)
        } else { // r — разбор перевода
          if (action === 'skip') {
            st.rememberedRules.counterparts[q.counterpart] = 'ignore';
          } else if (action === 'inc') {
            st.rememberedRules.counterparts[q.counterpart] = 'income';
          } else if (action === 'exp') {
            st.rememberedRules.counterparts[q.counterpart] = 'expense';
          } else if (action === 'env') {
            const envIdx = parseInt(parts[4], 10);
            const envName = (st.budget.mandatory_expenses[envIdx] || {}).name;
            if (envName) st.rememberedRules.counterparts[q.counterpart] = `env:${envName}`;
          }
        }
        st.cursor++;
        return step(chatId, cbq);
      }

      if (type === 'apply') {
        await edit(cbq, '⏳ Применяю…');
        // финальные правила = сохранённые + ответы из диалога (паттерны — из кода)
        const rules = { counterparts: { ...st.rules.counterparts, ...st.rememberedRules.counterparts }, patterns: st.rules.patterns };
        const budget = await loadBudget();
        const plan = planImport(budget, st.parsed, rules);
        // внешние пополнения: одобренные -> в бюджет, «уже в плане» -> только пометить seen
        const markSeen = [];
        for (const t of (plan.topupsAsk || [])) {
          if (st.topupDecisions[t.key] === 'add') plan.topups.push(t);
          else markSeen.push(t.key);
        }
        // совпадения перевод↔ручная запись: «разные» -> внести, «одна и та же» -> пометить seen
        for (const x of (plan.collisionAsk || [])) {
          if (st.collisionDecisions[x.key] === 'diff') plan.expensesNew.push({ ...x, tinkoffCategory: 'Переводы' });
          else markSeen.push(x.key);
        }
        const res = applyPlan(budget, plan, c.todayStr(), { forceEnvelopes: new Set(st.forceEnvelopes), markSeen });
        await saveKey('budget', budget);
        await saveRules(rules);
        sessions.delete(chatId);
        return edit(cbq, reportText(budget, plan, res), HTML);
      }
    } catch (e) {
      console.error('tinkoff import cb', e);
      sessions.delete(chatId);
      return edit(cbq, '❌ Ошибка при импорте. Ничего не применено, попробуй заново.');
    }
  });
}

function reportText(budget, plan, res) {
  const s = c.computeSummary(budget);
  const newTotal = res.expensesAdded.reduce((a, e) => a + e.amount, 0);
  let t = `✅ <b>Импорт применён</b>\n\n`;
  t += `🆕 Внесено трат: <b>${res.expensesAdded.length}</b> на ${m(newTotal)}\n`;
  if (res.envelopeCharged.length) {
    const byEnv = {};
    res.envelopeCharged.forEach((e) => { byEnv[e.name] = (byEnv[e.name] || 0) + e.amount; });
    t += `📦 В конверты: ${Object.entries(byEnv).map(([n, v]) => `${escHtml(n)} +${m(v)}`).join(', ')}\n`;
  }
  if (res.budgetAdded) t += `💰 Бюджет пополнен: <b>+${m(res.budgetAdded)}</b>\n`;
  if (res.skippedDup) t += `♻️ Пропущено дублей: ${res.skippedDup}\n`;
  if (res.conflicts && res.conflicts.length) {
    t += `⚠️ Не тронуты (уже оплачены вручную): ${res.conflicts.map((cf) => escHtml(cf.name)).join(', ')}\n`;
  }
  t += `\n📊 Бюджет: ${m(s.monthly_budget)}\n`;
  t += `📆 Лимит сегодня: ${m(s.today_limit)} · потрачено ${m(s.today_spent)} · осталось <b>${m(s.remaining)}</b>\n`;
  t += `🐷 Копилка: ${m(s.piggybank)}\n`;
  const lo = c.envelopeLeftover(budget).filter((e) => e.spent > 0);
  if (lo.length) t += `\nКонверты: ${lo.map((e) => `${escHtml(e.name)} ${m(e.spent)}/${m(e.planned)}`).join(' · ')}`;
  return t;
}

module.exports = { register };
