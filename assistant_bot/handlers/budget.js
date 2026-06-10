// handlers/budget.js
// Бюджет в Telegram: команды, инлайн-меню, диалоговые флоу.
// Вся арифметика — в services/budgetCore. Состояние диалога держим в памяти
// (один пользователь), поэтому хранимые данные бюджета остаются чистыми.

const { loadKey, saveKey } = require('../db');
const c = require('../services/budgetCore');
const { escHtml } = require('../utils');

const HTML = { parse_mode: 'HTML' };

// ---------- состояние диалога (в памяти) ----------
const sessions = new Map();
const getState = (id) => sessions.get(id) || { state: 'main' };
const setState = (id, s) => sessions.set(id, s);
const resetState = (id) => sessions.set(id, { state: 'main' });

// ---------- БД ----------
async function load() {
  return c.normalize(await loadKey('budget'));
}
async function save(data) {
  await saveKey('budget', data);
}
// загрузка + автоматический «переход дня» (экономия → копилка), персистится сразу
async function loadRollover() {
  const data = await load();
  if (c.isConfigured(data)) {
    const before = data.today_date;
    c.applyDayTransition(data);
    if (data.today_date !== before) await save(data);
  }
  return data;
}

// ---------- клавиатуры ----------
const B = (text, data) => ({ text, callback_data: data });
const kb = (rows) => ({ parse_mode: 'HTML', reply_markup: { inline_keyboard: rows } });

// Клавиатура выбора категории. prefix = 'pcat' (личные) или 'ccat' (корп).
function categoryKb(prefix) {
  const rows = [];
  for (let i = 0; i < c.CATEGORIES.length; i += 3) {
    rows.push(
      c.CATEGORIES.slice(i, i + 3).map((cat) => B(cat, `b:${prefix}:${cat}`))
    );
  }
  rows.push([B('❌ Отмена', 'b:main')]);
  return kb(rows);
}

const MAIN_ROWS = [
  [B('💳 Расход', 'b:personal'), B('🏢 Корп', 'b:corp')],
  [B('📋 Расходы', 'b:expenses'), B('🐷 Копилка', 'b:pig_menu')],
  [B('✅ Обязательные', 'b:mand'), B('⚙️ Ещё', 'b:more')],
];
const MORE_ROWS = [
  [B('📊 Отчёт', 'b:report'), B('📅 Период', 'b:period')],
  [B('💼 Баланс', 'b:balance'), B('🏢 Долг', 'b:debt')],
  [B('⚙️ Настройки бюджета', 'b:budget_menu')],
  [B('🔄 Новый период', 'b:new_period')],
  [B('◀️ Назад', 'b:main')],
];
const mainKb = () => kb(MAIN_ROWS);
const backMain = (rows = []) => kb([...rows, [B('◀️ В меню', 'b:main')]]);

// ---------- рендеры (чистые строки) ----------
function statusBlock(data) {
  const limit = data.today_limit_adjusted || 0;
  const spent = data.today_spent || 0;
  const rem = limit - spent;
  const pig = data.piggybank || 0;
  let s =
    `📊 Сегодня потрачено: ${c.money(spent)} из ${c.money(limit)}\n` +
    `${rem >= 0 ? '✅' : '⚠️'} Осталось сегодня: ${c.money(Math.max(0, rem))}\n` +
    `🐷 Копилка: ${c.money(pig)}`;
  if (rem < 0) s += `\n⚠️ Перерасход ${c.money(Math.abs(rem))} — вычтется из завтрашнего лимита`;
  return s;
}
function hubText(data) {
  return `🗝️ <b>Бюджет</b>\n\n${statusBlock(data)}`;
}
function personalRecorded(data, amount, category) {
  const limit = data.today_limit_adjusted || 0;
  const spent = data.today_spent || 0;
  const rem = limit - spent;
  const pig = data.piggybank || 0;
  let s =
    `${rem >= 0 ? '✅' : '⚠️'} <b>Личная трата записана</b>\n\n` +
    `📌 Категория: ${escHtml(category)}\n` +
    `💸 Сумма: ${c.money(amount)}\n\n` +
    `📊 Потрачено сегодня: ${c.money(spent)} из ${c.money(limit)}\n`;
  s += rem >= 0
    ? `✅ Осталось сегодня: <b>${c.money(rem)}</b>\n`
    : `⚠️ Перерасход: <b>${c.money(Math.abs(rem))}</b> — вычтется завтра\n`;
  s += `🐷 Копилка: ${c.money(pig)}`;
  return s;
}
function corpRecorded(data, amount, category) {
  return (
    `🏢 <b>Корпоративная трата записана</b>\n\n` +
    `📌 Категория: ${escHtml(category)}\n` +
    `💸 Сумма: ${c.money(amount)}\n` +
    `🏢 Всего корп. за период: ${c.money(data.corporate_total || 0)}\n\n` +
    `<i>(Личный лимит не затронут)</i>\n\n` +
    statusBlock(data)
  );
}
function reportText(data) {
  const personalTotal = c.sumAmount(data.personal_expenses);
  const mandTotal = c.mandatoryTotal(data);
  const cats = c.categoryBreakdown(data.personal_expenses);
  let catStr;
  if (!cats.length) {
    catStr = '  нет трат';
  } else {
    catStr = cats.slice(0, 8).map((t) => {
      const pct = personalTotal > 0 ? Math.round((t.sum / personalTotal) * 100) : 0;
      return `  • ${escHtml(t.category)}: ${c.money(t.sum)} <i>(${pct}%)</i>`;
    }).join('\n');
    if (cats.length > 8) catStr += `\n  <i>…и ещё ${cats.length - 8} кат.</i>`;
  }
  return (
    `📊 <b>Отчёт за период</b>\n\n` +
    `💰 Бюджет: ${c.money(data.monthly_budget)}\n` +
    `📋 Обязательные: ${c.money(mandTotal)}\n\n` +
    `💳 <b>Личные траты: ${c.money(personalTotal)}</b>\n` +
    `По категориям:\n${catStr}\n\n` +
    `🏢 <b>Корпоративные: ${c.money(data.corporate_total || 0)}</b>\n` +
    `<i>(не влияют на личный лимит)</i>\n\n` +
    `🐷 <b>Копилка: ${c.money(data.piggybank || 0)}</b>\n\n` +
    `📆 Дневной лимит: ${c.money(data.daily_limit || 0)}\n` +
    statusBlock(data)
  );
}
function periodText(data) {
  if (!c.isConfigured(data)) return '❌ Бюджет ещё не настроен. Нажми /бюджет.';
  const today = c.todayStr();
  const daysTotal = c.daysBetween(data.start_date, data.end_date) + 1;
  const elapsed = Math.max(0, c.daysBetween(data.start_date, today));
  const left = Math.max(1, daysTotal - elapsed);
  const mandTotal = c.mandatoryTotal(data);
  return (
    `📅 <b>Период</b>\n\n` +
    `${c.fmtRu(data.start_date)} — ${c.fmtRu(data.end_date)} (${daysTotal} дн.)\n` +
    `Прошло: ${elapsed}, осталось: ${left}\n\n` +
    `💰 Бюджет: ${c.money(data.monthly_budget)}\n` +
    `📋 Обязательные: ${c.money(mandTotal)}\n` +
    `✨ Свободно: ${c.money((data.monthly_budget || 0) - mandTotal)}\n` +
    `📆 Дневной лимит: ${c.money(data.daily_limit || 0)}`
  );
}
function breakdownText(data, type, period) {
  const isPersonal = type === 'personal';
  const list = isPersonal ? data.personal_expenses : data.corporate_expenses;
  const icon = isPersonal ? '💳' : '🏢';
  const label = isPersonal ? 'Личные расходы' : 'Корпоративные расходы';
  const periodLabels = { today: 'сегодня', week: 'за 7 дней', month: 'за месяц', all: 'за весь период' };
  const filtered = c.filterByPeriod(list, period);
  if (!filtered.length) {
    return `📋 <b>${icon} ${label}</b>\n<i>${periodLabels[period]}</i>\n\nЗаписей нет.`;
  }
  const total = c.sumAmount(filtered);
  const cats = c.categoryBreakdown(filtered);
  let s = `📋 <b>${icon} ${label}</b>\n<i>${periodLabels[period]}</i>\n\n`;
  cats.slice(0, 12).forEach((t) => {
    const bars = total > 0 ? Math.max(1, Math.round((t.sum / total) * 10)) : 0;
    s += `${'▰'.repeat(bars)}${'▱'.repeat(10 - bars)} ${escHtml(t.category)} — ${c.money(t.sum)}\n`;
  });
  if (cats.length > 12) s += `<i>…и ещё ${cats.length - 12}</i>\n`;
  s += `\n${icon} <b>Всего: ${c.money(total)}</b>`;
  return s;
}
function mandListText(data) {
  const m = data.mandatory_expenses || [];
  if (!m.length) return '📋 <b>Обязательные расходы</b>\n\nСписок пуст.';
  let s = '📋 <b>Обязательные расходы</b>\n\n';
  m.forEach((e) => {
    const mark = e.paid ? '✅' : '⬜';
    const fact = e.paid ? ` <i>(факт ${c.money(e.paid_amount)})</i>` : '';
    s += `${mark} ${escHtml(e.name)} — ${c.money(e.amount)}${fact}\n`;
  });
  s += `\nИтого: <b>${c.money(c.mandatoryTotal(data))}</b>`;
  return s;
}
function debtText(data) {
  const debt = c.corporateDebt(data);
  const compensated = c.corporateCompensated(data);
  const total = data.corporate_total || 0;
  return (
    `🏢 <b>Корпоративный долг</b>\n\n` +
    `💰 Всего корп. трат: ${c.money(total)}\n` +
    `✅ Компенсировано: ${c.money(compensated)}\n` +
    `📌 <b>К компенсации: ${c.money(debt)}</b>` +
    (debt <= 0 ? '\n\n<i>Долгов нет — всё компенсировано!</i>' : '')
  );
}
function balanceText(data) {
  const s = c.computeSummary(data);
  const rem = s.remaining;
  return (
    `💼 <b>Баланс</b>\n\n` +
    `📊 Лимит сегодня: ${c.money(s.today_limit)}\n` +
    `${rem >= 0 ? '✅' : '⚠️'} Осталось сегодня: <b>${c.money(Math.max(0, rem))}</b>` +
    (rem < 0 ? ` <i>(перерасход ${c.money(Math.abs(rem))})</i>` : '') + `\n` +
    `✨ Свободно за период: ${c.money(s.free)}\n` +
    `🐷 Копилка: ${c.money(s.piggybank)}\n` +
    `📅 Дней осталось: ${s.days_left ?? '—'}`
  );
}
function budgetMenuText(data) {
  const mandTotal = c.mandatoryTotal(data);
  const items = (data.mandatory_expenses || []).length
    ? data.mandatory_expenses.map((e) => `  • ${escHtml(e.name)}: ${c.money(e.amount)}`).join('\n')
    : '  (нет)';
  return (
    `⚙️ <b>Настройки бюджета</b>\n\n` +
    `💰 Общий бюджет: <b>${c.money(data.monthly_budget)}</b>\n` +
    `📋 Обязательные: <b>${c.money(mandTotal)}</b>\n` +
    `✨ Свободно: <b>${c.money((data.monthly_budget || 0) - mandTotal)}</b>\n` +
    `📆 Дневной лимит: <b>${c.money(data.daily_limit || 0)}</b>\n\n` +
    `Обязательные расходы:\n${items}`
  );
}

// ---------- регистрация ----------
function register(bot, isAllowed, deny) {
  const send = (chatId, text, opts = HTML) => bot.sendMessage(chatId, text, opts);
  async function edit(q, text, opts = HTML) {
    try {
      await bot.editMessageText(text, { chat_id: q.message.chat.id, message_id: q.message.message_id, ...opts });
    } catch {
      await bot.sendMessage(q.message.chat.id, text, opts);
    }
  }

  function startSetup(chatId) {
    setState(chatId, { state: 'setup_budget' });
    return send(chatId,
      '👋 <b>Настроим бюджет</b>\n\n💰 Какой общий бюджет на период?\nОтправь число в рублях, например: <code>150000</code>');
  }

  // ---- быстрый помощник: записать личную трату с категорией ----
  async function commitPersonal(chatId, data, amount, category, note) {
    c.applyDayTransition(data);
    c.addPersonalExpense(data, amount, category, note || '');
    await save(data);
    resetState(chatId);
    // Правки/удаление трат — на сайте Ясности (всё редактируется там)
    return send(chatId, personalRecorded(data, amount, category), mainKb());
  }
  async function commitCorp(chatId, data, amount, category, note) {
    c.applyDayTransition(data);
    c.addCorporateExpense(data, amount, category, note || '');
    await save(data);
    resetState(chatId);
    return send(chatId, corpRecorded(data, amount, category), mainKb());
  }

  // ---- показать выбор категории ----
  function askPersonalCategory(chatId, amount, note) {
    setState(chatId, { state: 'personal_pick_cat', amount, note: note || '' });
    const noteHint = note ? `\n📝 Заметка: <i>${escHtml(note)}</i>` : '';
    return send(chatId, `💳 <b>${c.money(amount)}</b>${noteHint}\n\n🏷 Выбери категорию:`, categoryKb('pcat'));
  }
  function askCorpCategory(chatId, amount, note) {
    setState(chatId, { state: 'corp_pick_cat', amount, note: note || '' });
    const noteHint = note ? `\n📝 Заметка: <i>${escHtml(note)}</i>` : '';
    return send(chatId, `🏢 <b>${c.money(amount)}</b>${noteHint}\n\n🏷 Выбери категорию:`, categoryKb('ccat'));
  }

  // ================= КОМАНДЫ =================

  // /бюджет — главный хаб
  bot.onText(/^\/бюджет(?:@\w+)?\s*$/i, async (msg) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    const chatId = msg.chat.id;
    try {
      const data = await loadRollover();
      if (!c.isConfigured(data)) return startSetup(chatId);
      resetState(chatId);
      send(chatId, hubText(data), mainKb());
    } catch (e) { console.error('/бюджет', e); send(chatId, '❌ Ошибка загрузки бюджета.'); }
  });

  // /расход [сумма] [заметка]
  bot.onText(/^\/расход(?:@\w+)?(?:\s+([\s\S]+))?$/i, async (msg, m) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    const chatId = msg.chat.id;
    try {
      const data = await loadRollover();
      if (!c.isConfigured(data)) return startSetup(chatId);
      const rest = (m[1] || '').trim();
      if (!rest) {
        setState(chatId, { state: 'personal_amount' });
        return send(chatId, '💳 <b>Личная трата</b>\n\nВведи сумму (и опционально заметку через пробел):\n<code>500</code> или <code>500 такси домой</code>');
      }
      const parts = rest.match(/^(\S+)(?:\s+([\s\S]+))?$/);
      let amount;
      try { amount = c.parseAmount(parts[1]); } catch {
        return send(chatId, '❌ Не понял сумму. Пример: <code>/расход 500</code> или <code>/расход 500 такси</code>');
      }
      if (amount <= 0) return send(chatId, '❌ Сумма должна быть больше нуля.');
      const note = (parts[2] || '').trim();
      return askPersonalCategory(chatId, amount, note);
    } catch (e) { console.error('/расход', e); resetState(chatId); send(chatId, '❌ Ошибка. Попробуй ещё раз.'); }
  });

  // /корп [сумма] [заметка]
  bot.onText(/^\/корп(?:@\w+)?(?:\s+([\s\S]+))?$/i, async (msg, m) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    const chatId = msg.chat.id;
    try {
      const data = await loadRollover();
      if (!c.isConfigured(data)) return startSetup(chatId);
      const rest = (m[1] || '').trim();
      if (!rest) {
        setState(chatId, { state: 'corp_amount' });
        return send(chatId, '🏢 <b>Корпоративная трата</b>\n\nВведи сумму (и опционально заметку через пробел):\n<code>2500</code> или <code>2500 бензин</code>');
      }
      const parts = rest.match(/^(\S+)(?:\s+([\s\S]+))?$/);
      let amount;
      try { amount = c.parseAmount(parts[1]); } catch {
        return send(chatId, '❌ Не понял сумму. Пример: <code>/корп 2500</code> или <code>/корп 2500 бензин</code>');
      }
      if (amount <= 0) return send(chatId, '❌ Сумма должна быть больше нуля.');
      const note = (parts[2] || '').trim();
      return askCorpCategory(chatId, amount, note);
    } catch (e) { console.error('/корп', e); resetState(chatId); send(chatId, '❌ Ошибка. Попробуй ещё раз.'); }
  });

  // /расходы
  bot.onText(/^\/расходы(?:@\w+)?\s*$/i, async (msg) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    const chatId = msg.chat.id;
    try {
      const data = await loadRollover();
      if (!c.isConfigured(data)) return startSetup(chatId);
      send(chatId, breakdownText(data, 'personal', 'all'), kb([
        [B('💳 Личные', 'b:exp:personal:all'), B('🏢 Корп', 'b:exp:corp:all')],
        [B('Сегодня', 'b:exp:personal:today'), B('Неделя', 'b:exp:personal:week'), B('Месяц', 'b:exp:personal:month')],
        [B('◀️ В меню', 'b:main')],
      ]));
    } catch (e) { console.error('/расходы', e); send(chatId, '❌ Ошибка.'); }
  });

  // /отмена
  bot.onText(/^\/отмена(?:@\w+)?\s*$/i, async (msg) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    const chatId = msg.chat.id;
    try {
      const data = await loadRollover();
      const list = data.personal_expenses || [];
      if (!list.length) return send(chatId, 'Нет личных трат для отмены.', mainKb());
      const last = list[list.length - 1];
      send(chatId,
        `↩️ <b>Отменить последнюю трату?</b>\n\n📌 ${escHtml(last.category)}\n💸 ${c.money(last.amount)}\n📅 ${c.fmtRu(last.date)}`,
        kb([[B('✅ Да, удалить', 'b:undo_yes'), B('❌ Отмена', 'b:undo_no')]]));
    } catch (e) { console.error('/отмена', e); send(chatId, '❌ Ошибка.'); }
  });

  // /копилка [сумма]  (без аргумента — меню; с аргументом — установить значение)
  bot.onText(/^\/копилка(?:@\w+)?(?:\s+(.+))?$/i, async (msg, m) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    const chatId = msg.chat.id;
    try {
      const data = await loadRollover();
      const arg = (m[1] || '').trim();
      if (!arg) {
        return send(chatId, pigMenuText(data), pigMenuKb(data));
      }
      let val;
      try { val = c.parseAmount(arg); } catch { return send(chatId, '❌ Формат: <code>/копилка 5000</code>'); }
      const r = c.piggybankSet(data, val);
      await save(data);
      const sign = r.diff >= 0 ? '+' : '';
      send(chatId,
        `🐷 <b>Копилка обновлена</b>\n\nБыло: ${c.money(r.old)}\nСтало: ${c.money(r.value)}\nИзменение: ${sign}${c.money(r.diff)}`,
        mainKb());
    } catch (e) { console.error('/копилка', e); send(chatId, '❌ Ошибка.'); }
  });

  // /обязательные
  bot.onText(/^\/обязательные(?:@\w+)?\s*$/i, async (msg) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    const chatId = msg.chat.id;
    try {
      const data = await loadRollover();
      if (!c.isConfigured(data)) return startSetup(chatId);
      send(chatId, mandListText(data), backMain([[B('✅ Оплатить', 'b:pay'), B('➕ Добавить', 'b:add_mand')]]));
    } catch (e) { console.error('/обязательные', e); send(chatId, '❌ Ошибка.'); }
  });

  // /оплатить [название]
  bot.onText(/^\/оплатить(?:@\w+)?(?:\s+(.+))?$/i, async (msg, m) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    const chatId = msg.chat.id;
    try {
      const data = await loadRollover();
      if (!c.isConfigured(data)) return startSetup(chatId);
      const m2 = data.mandatory_expenses || [];
      if (!m2.length) return send(chatId, 'Обязательных расходов нет.', mainKb());
      const name = (m[1] || '').trim().toLowerCase();
      if (name) {
        const idx = m2.findIndex((e) => e.name.toLowerCase().includes(name));
        if (idx === -1) return send(chatId, `❌ Не нашёл «${escHtml(m[1].trim())}». Открой список:`, payListKb(data));
        return askMandActual(chatId, m2, idx);
      }
      send(chatId, '✅ <b>Оплата обязательного расхода</b>\n\nВыбери расход:', payListKb(data));
    } catch (e) { console.error('/оплатить', e); send(chatId, '❌ Ошибка.'); }
  });

  // /отчёт
  bot.onText(/^\/отчёт(?:@\w+)?\s*$/i, async (msg) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    const chatId = msg.chat.id;
    try {
      const data = await loadRollover();
      if (!c.isConfigured(data)) return startSetup(chatId);
      send(chatId, reportText(data), mainKb());
    } catch (e) { console.error('/отчёт', e); send(chatId, '❌ Ошибка.'); }
  });
  // алиас без буквы ё
  bot.onText(/^\/отчет(?:@\w+)?\s*$/i, async (msg) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    const chatId = msg.chat.id;
    try { const data = await loadRollover(); if (!c.isConfigured(data)) return startSetup(chatId); send(chatId, reportText(data), mainKb()); }
    catch (e) { console.error('/отчет', e); send(chatId, '❌ Ошибка.'); }
  });

  // /период
  bot.onText(/^\/период(?:@\w+)?\s*$/i, async (msg) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    const chatId = msg.chat.id;
    try { const data = await loadRollover(); send(chatId, periodText(data), mainKb()); }
    catch (e) { console.error('/период', e); send(chatId, '❌ Ошибка.'); }
  });

  // /долг — сумма к компенсации
  bot.onText(/^\/долг(?:@\w+)?\s*$/i, async (msg) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    const chatId = msg.chat.id;
    try {
      const data = await loadRollover();
      if (!c.isConfigured(data)) return startSetup(chatId);
      send(chatId, debtText(data), mainKb());
    } catch (e) { console.error('/долг', e); send(chatId, '❌ Ошибка.'); }
  });

  // /баланс — краткая сводка
  bot.onText(/^\/баланс(?:@\w+)?\s*$/i, async (msg) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    const chatId = msg.chat.id;
    try {
      const data = await loadRollover();
      if (!c.isConfigured(data)) return startSetup(chatId);
      send(chatId, balanceText(data), mainKb());
    } catch (e) { console.error('/баланс', e); send(chatId, '❌ Ошибка.'); }
  });

  // /помощь — сгруппированный список команд
  bot.onText(/^\/помощь(?:@\w+)?\s*$/i, async (msg) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    const chatId = msg.chat.id;
    send(chatId,
      `📖 <b>Справка по командам</b>\n\n` +
      `<b>Главное меню</b>\n` +
      `/бюджет — открыть хаб бюджета\n\n` +
      `<b>Траты</b>\n` +
      `/расход — добавить личную трату\n` +
      `/корп — добавить корпоративную трату\n` +
      `/отмена — отменить последнюю личную трату\n\n` +
      `<b>Сводки</b>\n` +
      `/баланс — остаток, копилка, дни\n` +
      `/долг — сумма к компенсации\n` +
      `/расходы — разбивка трат по категориям\n` +
      `/отчёт — полный отчёт за период\n` +
      `/период — даты и лимиты периода\n\n` +
      `<b>Управление</b>\n` +
      `/копилка — меню копилки\n` +
      `/обязательные — список обязательных расходов\n` +
      `/оплатить — отметить обязательный расход оплаченным\n\n` +
      `<b>Быстрый ввод</b>\n` +
      `Просто отправь <b>число</b> — перейдёт к добавлению личной траты.\n` +
      `Например: <code>500</code> или <code>1200 такси</code>`,
      HTML);
  });

  // ---- helpers нуждающиеся в bot ----
  function pigMenuText(data) {
    const rem = c.remaining(data);
    const deficit = rem < 0 ? `\n⚠️ Дефицит дня: ${c.money(Math.abs(rem))}` : '';
    return `🐷 <b>Копилка: ${c.money(data.piggybank || 0)}</b>${deficit}\n\n💰 <b>Пополнить</b> — добавить доход\n📤 <b>Списать</b> — покрыть перерасход, увеличив лимит дня`;
  }
  function pigMenuKb() {
    return kb([
      [B('💰 Пополнить', 'b:pig_add'), B('📤 Списать', 'b:pig_spend')],
      [B('◀️ В меню', 'b:main')],
    ]);
  }
  function payListKb(data) {
    const rows = (data.mandatory_expenses || []).map((e, i) => [
      B(`${e.paid ? '✅' : '⬜'} ${e.name} — ${c.money(e.amount)}`, `b:pay:${i}`),
    ]);
    rows.push([B('◀️ В меню', 'b:main')]);
    return kb(rows);
  }
  function delListKb(data) {
    const rows = (data.mandatory_expenses || []).map((e, i) => [
      B(`❌ ${e.name} (${c.money(e.amount)})`, `b:del_mand:${i}`),
    ]);
    rows.push([B('◀️ Назад', 'b:budget_menu')]);
    return kb(rows);
  }
  function askMandActual(chatId, mandatory, idx) {
    const expense = mandatory[idx];
    setState(chatId, { state: 'mand_pay_amount', mandIdx: idx });
    return send(chatId,
      `✅ <b>${escHtml(expense.name)}</b>\n\nЗаложено: <b>${c.money(expense.amount)}</b>\n\nВведи фактическую сумму оплаты:\n<i>(или отправь «.» чтобы списать заложенную)</i>`);
  }

  // ================= CALLBACK-КНОПКИ =================
  bot.on('callback_query', async (q) => {
    if (!q.data || !q.data.startsWith('b:')) return;
    if (!isAllowed({ from: q.from, chat: q.message && q.message.chat })) {
      return bot.answerCallbackQuery(q.id, { text: 'Нет доступа' }).catch(() => {});
    }
    const chatId = q.message.chat.id;
    bot.answerCallbackQuery(q.id).catch(() => {});
    const action = q.data.slice(2);
    try {
      const data = await loadRollover();

      if (action === 'main') { resetState(chatId); return edit(q, hubText(data), mainKb()); }
      if (action === 'more') return edit(q, '⚙️ <b>Ещё</b>', kb(MORE_ROWS));

      if (action === 'personal') { setState(chatId, { state: 'personal_amount' }); return edit(q, '💳 <b>Личная трата</b>\n\nВведи сумму (и опционально заметку через пробел):\n<code>500</code> или <code>500 такси домой</code>'); }
      if (action === 'corp') { setState(chatId, { state: 'corp_amount' }); return edit(q, '🏢 <b>Корпоративная трата</b>\n\nВведи сумму (и опционально заметку через пробел):\n<code>2500</code> или <code>2500 бензин</code>'); }

      if (action.startsWith('pcat:')) {
        const st = getState(chatId);
        const category = action.slice(5);
        if (!category || st.state !== 'personal_pick_cat') return edit(q, hubText(data), mainKb());
        await commitPersonal(chatId, data, st.amount || 0, category, st.note || '');
        return;
      }
      if (action.startsWith('ccat:')) {
        const st = getState(chatId);
        const category = action.slice(5);
        if (!category || st.state !== 'corp_pick_cat') return edit(q, hubText(data), mainKb());
        await commitCorp(chatId, data, st.amount || 0, category, st.note || '');
        return;
      }

      if (action === 'expenses') {
        return edit(q, breakdownText(data, 'personal', 'all'), kb([
          [B('💳 Личные', 'b:exp:personal:all'), B('🏢 Корп', 'b:exp:corp:all')],
          [B('Сегодня', 'b:exp:personal:today'), B('Неделя', 'b:exp:personal:week'), B('Месяц', 'b:exp:personal:month')],
          [B('◀️ В меню', 'b:main')],
        ]));
      }
      if (action.startsWith('exp:')) {
        const [, type, period] = action.split(':');
        const other = type === 'personal' ? 'corp' : 'personal';
        return edit(q, breakdownText(data, type, period), kb([
          [B(type === 'personal' ? '🏢 Корп' : '💳 Личные', `b:exp:${other}:${period}`)],
          [B('Сегодня', `b:exp:${type}:today`), B('Неделя', `b:exp:${type}:week`), B('Месяц', `b:exp:${type}:month`), B('Всё', `b:exp:${type}:all`)],
          [B('◀️ В меню', 'b:main')],
        ]));
      }

      if (action === 'pig_menu') return edit(q, pigMenuText(data), pigMenuKb());
      if (action === 'pig_add') { setState(chatId, { state: 'pig_add' }); return edit(q, `💰 <b>Пополнение копилки</b>\n\nСейчас: ${c.money(data.piggybank || 0)}\n\nВведи сумму пополнения:`); }
      if (action === 'pig_spend') {
        if ((data.piggybank || 0) <= 0) return edit(q, '🐷 Копилка пуста — нечего списывать.', mainKb());
        setState(chatId, { state: 'pig_spend' });
        const rem = c.remaining(data);
        const deficit = rem < 0 ? `\n⚠️ Дефицит сегодня: ${c.money(Math.abs(rem))}` : '';
        return edit(q, `📤 <b>Списать из копилки</b>\n\n🐷 Доступно: ${c.money(data.piggybank || 0)}${deficit}\n\nВведи сумму — она увеличит лимит сегодня:`);
      }

      if (action === 'undo') {
        const list = data.personal_expenses || [];
        if (!list.length) return edit(q, 'Нет личных трат для отмены.', mainKb());
        const last = list[list.length - 1];
        return edit(q, `↩️ <b>Отменить последнюю трату?</b>\n\n📌 ${escHtml(last.category)}\n💸 ${c.money(last.amount)}\n📅 ${c.fmtRu(last.date)}`,
          kb([[B('✅ Да, удалить', 'b:undo_yes'), B('❌ Отмена', 'b:undo_no')]]));
      }
      if (action === 'undo_yes') {
        const removed = c.undoLastPersonal(data);
        if (!removed) return edit(q, 'Нет трат для отмены.', mainKb());
        await save(data);
        return edit(q, `✅ Трата отменена: <b>${escHtml(removed.category)}</b> — ${c.money(removed.amount)}\n\n${statusBlock(data)}`, mainKb());
      }
      if (action === 'undo_no') return edit(q, 'Отмена.', mainKb());
      // Быстрая отмена прямо из сообщения-подтверждения (без промежуточного экрана)
      if (action === 'undo_last_direct') {
        const removed = c.undoLastPersonal(data);
        if (!removed) return edit(q, '↩️ Нет трат для отмены.', mainKb());
        await save(data);
        return edit(q, `↩️ <b>Отменено</b>\n\n📌 ${escHtml(removed.category)} — ${c.money(removed.amount)}\n\n${statusBlock(data)}`, mainKb());
      }

      if (action === 'mand') return edit(q, mandListText(data), backMain([[B('✅ Оплатить', 'b:pay'), B('➕ Добавить', 'b:add_mand')]]));
      if (action === 'report') return edit(q, reportText(data), mainKb());
      if (action === 'period') return edit(q, periodText(data), mainKb());
      if (action === 'balance') return edit(q, balanceText(data), mainKb());
      if (action === 'debt') return edit(q, debtText(data), mainKb());

      if (action === 'budget_menu') {
        return edit(q, budgetMenuText(data), kb([
          [B('💰 Изменить бюджет', 'b:budget_change')],
          [B('➕ Добавить обязательный', 'b:add_mand')],
          [B('🗑 Удалить обязательный', 'b:del_mand')],
          [B('✅ Оплатить обязательный', 'b:pay')],
          [B('◀️ В меню', 'b:main')],
        ]));
      }
      if (action === 'budget_change') { setState(chatId, { state: 'budget_change' }); return edit(q, `💰 <b>Изменить общий бюджет</b>\n\nТекущий: <b>${c.money(data.monthly_budget)}</b>\n\nВведи сумму изменения:\n• Добавить: <code>15000</code>\n• Уменьшить: <code>-10000</code>`); }
      if (action === 'add_mand') { setState(chatId, { state: 'budget_mand_name' }); return edit(q, '➕ <b>Новый обязательный расход</b>\n\nВведи название:'); }
      if (action === 'del_mand') {
        if (!(data.mandatory_expenses || []).length) return edit(q, 'Обязательных расходов нет.', kb([[B('◀️ Назад', 'b:budget_menu')]]));
        return edit(q, '🗑 <b>Удалить обязательный расход</b>\n\nВыбери:', delListKb(data));
      }
      if (action.startsWith('del_mand:')) {
        const idx = parseInt(action.split(':')[1], 10);
        const removed = c.removeMandatory(data, idx);
        if (!removed) return edit(q, 'Расход не найден.', mainKb());
        await save(data);
        return edit(q, `✅ Удалено: <b>${escHtml(removed.name)}</b> — ${c.money(removed.amount)}\n\n📆 Новый дневной лимит: <b>${c.money(data.daily_limit)}</b>\n\n${statusBlock(data)}`, mainKb());
      }

      if (action === 'pay') {
        if (!(data.mandatory_expenses || []).length) return edit(q, 'Обязательных расходов нет.', mainKb());
        return edit(q, '✅ <b>Оплата обязательного расхода</b>\n\nВыбери расход:', payListKb(data));
      }
      if (action.startsWith('pay:')) {
        const idx = parseInt(action.split(':')[1], 10);
        const m2 = data.mandatory_expenses || [];
        if (idx < 0 || idx >= m2.length) return edit(q, 'Расход не найден.', mainKb());
        return askMandActual(chatId, m2, idx);
      }

      if (action === 'new_period') {
        return edit(q, '🔄 <b>Новый период</b>\n\nНастройки бюджета и обязательные расходы <b>сохранятся</b>.\nВсе траты и копилка будут <b>обнулены</b>.\n\nПродолжить?',
          kb([[B('✅ Начать', 'b:new_period_yes'), B('❌ Отмена', 'b:main')]]));
      }
      if (action === 'new_period_yes') { setState(chatId, { state: 'new_period_date' }); return edit(q, '📅 <b>Новый период</b>\n\nВведи дату <b>начала</b>:\nФормат: <code>ДД.ММ.ГГГГ</code>, например <code>01.07.2026</code>'); }

      if (action === 'reset') {
        return edit(q, '⚠️ <b>Сброс бюджета</b>\n\nВсе данные будут удалены: траты, копилка, настройки.\nПодтвердить?',
          kb([[B('✅ Да, сбросить', 'b:reset_yes'), B('❌ Отмена', 'b:reset_no')]]));
      }
      if (action === 'reset_yes') { await save(c.emptyBudget()); resetState(chatId); return edit(q, '🗑 Данные удалены.\n\nНапиши /бюджет чтобы настроить заново.'); }
      if (action === 'reset_no') return edit(q, 'Отмена. Ничего не изменилось.', mainKb());

      // неизвестное действие — тихо вернуть в меню
      return edit(q, hubText(data), mainKb());
    } catch (e) {
      console.error('budget callback', e);
      resetState(chatId);
      send(chatId, '❌ Ошибка. Вернулся в меню.', mainKb());
    }
  });

  // ================= ТЕКСТОВЫЕ СООБЩЕНИЯ (флоу + быстрый ввод) =================
  bot.on('message', async (msg) => {
    if (!msg.text) return;                  // голос/файлы — не здесь
    if (msg.text.startsWith('/')) return;   // команды — через onText
    if (!isAllowed(msg)) return;            // чужие — молча
    const chatId = msg.chat.id;
    const st = getState(chatId);
    const text = msg.text.trim();

    // в главном меню реагируем только на числа/выражения (быстрый ввод)
    if ((st.state === 'main' || !st.state) && !/\d/.test(text)) return;

    try {
      const data = await loadRollover();
      switch (st.state) {
        case 'personal_amount': {
          // Формат: «сумма» или «сумма заметка»
          const partsP = text.match(/^(\S+)(?:\s+([\s\S]+))?$/);
          let amount; try { amount = c.parseAmount(partsP ? partsP[1] : text); } catch { return send(chatId, '❌ Введи число, например: 500'); }
          if (amount <= 0) return send(chatId, '❌ Сумма должна быть больше нуля.');
          const note = partsP && partsP[2] ? partsP[2].trim() : '';
          return askPersonalCategory(chatId, amount, note);
        }
        case 'personal_pick_cat': {
          // Ждём нажатия кнопки — текст игнорируем, напоминаем про кнопки
          const noteHint = st.note ? `\n📝 Заметка: <i>${escHtml(st.note)}</i>` : '';
          return send(chatId, `💳 <b>${c.money(st.amount || 0)}</b>${noteHint}\n\n🏷 Пожалуйста, выбери категорию кнопкой:`, categoryKb('pcat'));
        }
        case 'corp_amount': {
          // Формат: «сумма» или «сумма заметка»
          const partsC = text.match(/^(\S+)(?:\s+([\s\S]+))?$/);
          let amount; try { amount = c.parseAmount(partsC ? partsC[1] : text); } catch { return send(chatId, '❌ Введи число, например: 2500'); }
          if (amount <= 0) return send(chatId, '❌ Сумма должна быть больше нуля.');
          const note = partsC && partsC[2] ? partsC[2].trim() : '';
          return askCorpCategory(chatId, amount, note);
        }
        case 'corp_pick_cat': {
          // Ждём нажатия кнопки — текст игнорируем, напоминаем про кнопки
          const noteHint = st.note ? `\n📝 Заметка: <i>${escHtml(st.note)}</i>` : '';
          return send(chatId, `🏢 <b>${c.money(st.amount || 0)}</b>${noteHint}\n\n🏷 Пожалуйста, выбери категорию кнопкой:`, categoryKb('ccat'));
        }
        case 'pig_add': {
          let amount = c.parseArithmetic(text);
          if (amount === null) { try { amount = c.parseAmount(text); } catch { return send(chatId, '❌ Введи число, например: 5000'); } }
          if (amount <= 0) return send(chatId, '❌ Введи число больше нуля.');
          const r = c.piggybankAdd(data, amount);
          await save(data); resetState(chatId);
          return send(chatId, `💰 <b>Копилка пополнена</b>\n\nБыло: ${c.money(r.old)}\nДобавлено: +${c.money(amount)}\n🐷 Стало: <b>${c.money(r.value)}</b>`, mainKb());
        }
        case 'pig_spend': {
          let amount = c.parseArithmetic(text);
          if (amount === null) { try { amount = c.parseAmount(text); } catch { return send(chatId, '❌ Введи число, например: 1500'); } }
          if (amount <= 0) return send(chatId, '❌ Введи число больше нуля.');
          const r = c.piggybankWithdraw(data, amount);
          if (!r.ok) return send(chatId, `❌ В копилке только ${c.money(r.piggybank)} — введи сумму не больше.`);
          await save(data); resetState(chatId);
          return send(chatId, `📤 <b>Списано из копилки</b>\n\nИспользовано: ${c.money(amount)}\n🐷 Осталось: ${c.money(r.piggybank)}\n\n${statusBlock(data)}`, mainKb());
        }
        case 'mand_pay_amount': {
          const idx = st.mandIdx || 0;
          const m2 = data.mandatory_expenses || [];
          if (idx < 0 || idx >= m2.length) { resetState(chatId); return send(chatId, 'Расход не найден.', mainKb()); }
          let actual;
          if (text === '.') actual = Number(m2[idx].amount) || 0;
          else { try { actual = c.parseAmount(text); } catch { return send(chatId, '❌ Введи число, например: 9500\nИли «.» чтобы списать заложенную сумму.'); } }
          const res = c.payMandatory(data, idx, actual);
          await save(data); resetState(chatId);
          let s = `✅ <b>${escHtml(res.name)}</b> — оплачено\n\nЗаложено: ${c.money(res.budgeted)}\nФакт: <b>${c.money(res.actual)}</b>\n`;
          if (res.diff > 0) s += `🐷 Сэкономлено → копилка: <b>+${c.money(res.diff)}</b>\n`;
          else if (res.diff < 0) s += `⚠️ Перерасход vs план: <b>${c.money(Math.abs(res.diff))}</b>\n`;
          s += `\n🐷 Копилка: ${c.money(res.piggybank)}`;
          return send(chatId, s, mainKb());
        }
        case 'budget_change': {
          let delta; try { delta = c.parseAmount(text); } catch { return send(chatId, '❌ Введи число. Например <code>15000</code> или <code>-10000</code>'); }
          const r = c.changeBudget(data, delta);
          if (!r.ok) return send(chatId, '❌ Бюджет не может быть нулевым или отрицательным.');
          await save(data); resetState(chatId);
          const sign = delta >= 0 ? '+' : '';
          return send(chatId, `✅ <b>Бюджет обновлён</b>\n\nБыло: ${c.money(r.old)}\nИзменение: ${sign}${c.money(delta)}\nСтало: <b>${c.money(r.value)}</b>\n\n📆 Новый дневной лимит: <b>${c.money(data.daily_limit)}</b>\n\n${statusBlock(data)}`, mainKb());
        }
        case 'budget_mand_name': {
          setState(chatId, { state: 'budget_mand_amt', mandName: text });
          return send(chatId, `✅ Название: <b>${escHtml(text)}</b>\n\n💰 Введи сумму этого расхода:`);
        }
        case 'budget_mand_amt': {
          let amount; try { amount = c.parseAmount(text); } catch { return send(chatId, '❌ Введи положительное число, например: 10000'); }
          if (amount <= 0) return send(chatId, '❌ Введи положительное число, например: 10000');
          const name = st.mandName || 'Без названия';
          c.addMandatory(data, name, amount);
          await save(data); resetState(chatId);
          return send(chatId, `✅ <b>Обязательный расход добавлен</b>\n\n📌 ${escHtml(name)}: ${c.money(amount)}\n\n📆 Новый дневной лимит: <b>${c.money(data.daily_limit)}</b>\n\n${statusBlock(data)}`, mainKb());
        }
        case 'new_period_date': {
          let startISO; try { startISO = c.parseRuDate(text); } catch { return send(chatId, '❌ Неверный формат. Введи <code>ДД.ММ.ГГГГ</code>, например <code>01.07.2026</code>'); }
          setState(chatId, { state: 'new_period_end', newStart: startISO });
          return send(chatId, `✅ Начало: <b>${c.fmtRu(startISO)}</b>\n\n📅 Теперь введи <b>конечную дату</b>:\nФормат: <code>ДД.ММ.ГГГГ</code>`);
        }
        case 'new_period_end': {
          let endISO; try { endISO = c.parseRuDate(text); } catch { return send(chatId, '❌ Неверный формат. Введи <code>ДД.ММ.ГГГГ</code>, например <code>31.07.2026</code>'); }
          const startISO = st.newStart;
          if (!startISO) { setState(chatId, { state: 'new_period_date' }); return send(chatId, '❌ Что-то пошло не так. Введи дату начала заново:'); }
          if (endISO <= startISO) return send(chatId, `❌ Конечная дата должна быть позже начальной (${c.fmtRu(startISO)}).`);
          const r = c.startPeriod(data, startISO, endISO);
          await save(data); resetState(chatId);
          const daysTotal = c.daysBetween(startISO, endISO) + 1;
          const mandTotal = c.mandatoryTotal(data);
          return send(chatId,
            `🎉 <b>Новый период начат!</b>\n\n💰 Бюджет: ${c.money(data.monthly_budget)}\n📋 Обязательные: ${c.money(mandTotal)}\n✨ Свободно: ${c.money(data.monthly_budget - mandTotal)}\n📅 Период: ${c.fmtRu(startISO)} — ${c.fmtRu(endISO)} (${daysTotal} дн.)\n📆 Дневной лимит: <b>${c.money(data.daily_limit)}</b>\n\n${statusBlock(data)}`,
            mainKb());
        }

        // ---- первичная настройка ----
        case 'setup_budget': {
          let budget; try { budget = c.parseAmount(text); } catch { return send(chatId, '❌ Введи число, например: 150000'); }
          if (budget <= 0) return send(chatId, '❌ Бюджет должен быть больше нуля.');
          setState(chatId, { state: 'setup_mandatory', monthly: budget, buffer: [] });
          return send(chatId, `✅ Бюджет: <b>${c.money(budget)}</b>\n\n📋 Теперь введи обязательные расходы по одному:\n<code>Название сумма</code> — например <code>Аренда 30000</code>\n\nКогда закончишь — напиши <b>готово</b>\nЕсли их нет — напиши <b>0</b>`);
        }
        case 'setup_mandatory': {
          const lowered = text.toLowerCase();
          const buffer = st.buffer || [];
          if (['готово', 'done', 'всё', 'все'].includes(lowered)) {
            if (!buffer.length) return send(chatId, 'Добавь хотя бы один расход или напиши <b>0</b>, если их нет.');
            setState(chatId, { state: 'setup_date', monthly: st.monthly, buffer });
            const items = buffer.map((e) => `• ${escHtml(e.name)}: ${c.money(e.amount)}`).join('\n');
            return send(chatId, `✅ Обязательные расходы:\n${items}\n<b>Итого: ${c.money(c.sumAmount(buffer))}</b>\n\n📅 С какой даты считать период?\nФормат: <code>ДД.ММ.ГГГГ</code>`);
          }
          if (text === '0') {
            setState(chatId, { state: 'setup_date', monthly: st.monthly, buffer: [] });
            return send(chatId, '✅ Обязательных расходов нет.\n\n📅 С какой даты считать период?\nФормат: <code>ДД.ММ.ГГГГ</code>');
          }
          const mm = text.match(/^(.+?)\s+(\d[\d\s,.]*)$/);
          if (!mm) return send(chatId, '❌ Формат: <code>Название сумма</code>\nНапример <code>Аренда 30000</code>\nИли напиши <b>готово</b> / <b>0</b>');
          let amount; try { amount = c.parseAmount(mm[2]); } catch { return send(chatId, '❌ Не понял сумму. Пример: <code>Аренда 30000</code>'); }
          buffer.push({ name: mm[1].trim(), amount });
          setState(chatId, { state: 'setup_mandatory', monthly: st.monthly, buffer });
          const items = buffer.map((e) => `• ${escHtml(e.name)}: ${c.money(e.amount)}`).join('\n');
          return send(chatId, `✅ Добавлено: <b>${escHtml(mm[1].trim())}</b> — ${c.money(amount)}\n\nСписок:\n${items}\n\nДобавь ещё или напиши <b>готово</b>`);
        }
        case 'setup_date': {
          let startISO; try { startISO = c.parseRuDate(text); } catch { return send(chatId, '❌ Неверный формат. Введи <code>ДД.ММ.ГГГГ</code>, например <code>01.06.2026</code>'); }
          setState(chatId, { state: 'setup_end_date', monthly: st.monthly, buffer: st.buffer, startISO });
          return send(chatId, `✅ Начало: <b>${c.fmtRu(startISO)}</b>\n\n📅 Теперь введи <b>конечную дату</b>:\nФормат: <code>ДД.ММ.ГГГГ</code>`);
        }
        case 'setup_end_date': {
          let endISO; try { endISO = c.parseRuDate(text); } catch { return send(chatId, '❌ Неверный формат. Введи <code>ДД.ММ.ГГГГ</code>, например <code>15.06.2026</code>'); }
          const startISO = st.startISO;
          if (endISO <= startISO) return send(chatId, `❌ Конечная дата должна быть позже начальной (${c.fmtRu(startISO)}).`);
          const r = c.setupBudget(data, st.monthly, st.buffer || [], startISO, endISO);
          await save(data); resetState(chatId);
          const daysTotal = c.daysBetween(startISO, endISO) + 1;
          const mandTotal = c.mandatoryTotal(data);
          return send(chatId,
            `🎉 <b>Бюджет настроен!</b>\n\n💰 Бюджет: ${c.money(data.monthly_budget)}\n📋 Обязательные: ${c.money(mandTotal)}\n✨ Свободно: ${c.money(data.monthly_budget - mandTotal)}\n📅 Период: ${c.fmtRu(startISO)} — ${c.fmtRu(endISO)} (${daysTotal} дн.)\n📆 Дневной лимит: <b>${c.money(data.daily_limit)}</b>\n<i>${r.comment}</i>\n\n${statusBlock(data)}`,
            mainKb());
        }

        case 'main':
        default: {
          if (!c.isConfigured(data)) return; // не настроено — игнор
          const arith = c.parseArithmetic(text);
          if (arith !== null) {
            return askPersonalCategory(chatId, arith, '');
          }
          let amount; try { amount = c.parseAmount(text); } catch { return; }
          if (amount <= 0) return;
          return askPersonalCategory(chatId, amount, '');
        }
      }
    } catch (e) {
      console.error('budget message', e);
      resetState(chatId);
      send(chatId, '❌ Что-то пошло не так. Вернулся в меню.', mainKb());
    }
  });
}

// addPersonalExpense для голосового ввода (handlers/voice.js)
async function recordVoiceExpense(amount, category, type = 'personal') {
  const data = c.normalize(await loadKey('budget'));
  if (!c.isConfigured(data)) throw new Error('Бюджет не настроен');
  c.applyDayTransition(data);
  const tx = type === 'corp'
    ? c.addCorporateExpense(data, amount, category)
    : c.addPersonalExpense(data, amount, category);
  await saveKey('budget', data);
  return { tx, data };
}

module.exports = { register, recordVoiceExpense };
