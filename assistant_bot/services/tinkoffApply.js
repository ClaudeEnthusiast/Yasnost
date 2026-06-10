// services/tinkoffApply.js
// Планирование импорта: по разобранному CSV и текущему бюджету решает, что куда.
// Только КЛАССИФИКАЦИЯ (без мутаций) — мутации делает бот после подтверждения.
// Дедуп двухуровневый:
//   1) по import_key (точная защита от повторного импорта тех же строк);
//   2) эвристика дата+сумма (±tol) против существующих записей — ловит ручной ввод.

const c = require('./budgetCore');

const AMOUNT_TOL = 1.0; // ₽: округления ручного ввода (555 vs 555.93)

// Найти конверт-обязательный по ключевым словам в имени.
function findEnvelope(budget, re) {
  const list = budget.mandatory_expenses || [];
  const i = list.findIndex((e) => re.test(String(e.name || '')));
  return i >= 0 ? { idx: i, name: list[i].name } : null;
}

// Правила «Категория Тинькофф -> конверт» (по смыслу, а не по мерчанту).
// Привязываемся к реально существующим конвертам в бюджете.
function envelopeRules(budget) {
  return [
    { test: (e) => /заправк/i.test(e.tinkoffCategory), env: findEnvelope(budget, /бензин|топлив|азс|заправк/i) },
    { test: (e) => /жкх|коммунал/i.test(e.tinkoffCategory), env: findEnvelope(budget, /^ку$|жкх|коммунал/i) },
  ].filter((r) => r.env); // только те, для которых конверт существует
}

// Индекс существующих записей для эвристического дедупа.
function buildExistingIndex(budget) {
  const items = (budget.personal_expenses || []).map((e, i) => ({
    i, date: e.date, amount: Number(e.amount) || 0, note: e.note || '', key: e.import_key || null, consumed: false,
  }));
  const keys = new Set([
    ...items.filter((x) => x.key).map((x) => x.key),
    ...(budget.imported_keys || []), // топапы и прежние импорты, не привязанные к записи-трате
  ]);
  return { items, keys };
}

// Поиск дубля: сперва по import_key, затем дата + |Δсумма| ≤ tol (с пометкой consumed).
function findDup(index, tx) {
  if (index.keys.has(tx.key)) return { type: 'key' };
  const cand = index.items.find(
    (x) => !x.consumed && x.date === tx.date && Math.abs(x.amount - tx.amount) <= AMOUNT_TOL
  );
  if (cand) { cand.consumed = true; return { type: 'heuristic', match: cand }; }
  return null;
}

// Паттерн-правило: { match:<regex-строка>, minAmount?, maxAmount?, action } применяется к описанию перевода.
// action: 'ignore' | 'income' | 'expense' | 'expense:<Категория>' | 'env:<Имя конверта>'
function matchPattern(patterns, note, amount) {
  for (const p of (patterns || [])) {
    if (!p.match || !p.action) continue;
    let re; try { re = new RegExp(p.match, 'i'); } catch { continue; }
    if (!re.test(note)) continue;
    if (p.minAmount != null && amount < p.minAmount) continue;
    if (p.maxAmount != null && amount > p.maxAmount) continue;
    return p.action;
  }
  return null;
}

// rules: { counterparts: { "<note>": <action> }, patterns: [<pattern>] } — запомненные ответы + паттерны.
// action: 'expense' | 'expense:<Кат>' | 'ignore' | 'income' | 'env:<имя>'
function planImport(budget, parsed, rules = {}) {
  const cp = rules.counterparts || {};
  const patterns = rules.patterns || [];
  const index = buildExistingIndex(budget);
  const envRules = envelopeRules(budget);

  const plan = {
    expensesNew: [],          // -> personal_expense (съедает лимит)
    expensesDup: [],          // пропуск (уже есть по ключу): {tx, dup}
    collisionAsk: [],         // перевод-трата совпал с ручной записью -> спросить: {..tx, match}
    envelopeCharges: {},       // name -> { idx, items:[], total }
    topups: [],               // -> бюджет (changeBudget +)
    transfersAsk: [],         // спросить: {counterpart, items, total, suggestion}
    incomeAsk: [],            // спросить про входящие переводы
    skipped: parsed.skipped,
  };

  const toEnvelope = (env, tx, srcCat) => {
    const b = (plan.envelopeCharges[env.name] = plan.envelopeCharges[env.name] || { idx: env.idx, name: env.name, items: [], total: 0 });
    b.items.push({ ...tx, srcCat });
    b.total = Math.round((b.total + tx.amount) * 100) / 100;
  };

  // 1) обычные траты: конверт по правилу / дубль / новая
  for (const e of parsed.expenses) {
    const rule = envRules.find((r) => r.test(e));
    if (rule) { toEnvelope(rule.env, e, e.tinkoffCategory); continue; }
    const dup = findDup(index, e);
    if (dup) plan.expensesDup.push({ tx: e, dup });
    else plan.expensesNew.push(e);
  }

  // 2) исходящие переводы — по запомненному правилу или спросить (сгруппировать по контрагенту)
  const askMap = new Map();
  for (const t of parsed.transfersOut) {
    if (index.keys.has(t.key)) continue; // уже импортировано — не переспрашиваем
    const decision = cp[t.note] || matchPattern(patterns, t.note, t.amount);
    if (decision === 'ignore') { plan.skipped.push({ ts: t.ts, amount: -t.amount, note: t.note, reason: 'rule:ignore' }); continue; }
    if (decision === 'income') { plan.topups.push({ ...t, asIncome: true }); continue; }
    if (decision && decision.indexOf('expense') === 0) {
      // перевод-трата (напр. себе на Озон/ВБ). Если совпал с существующей ручной записью
      // по дате+сумме — не решаем сами, а спрашиваем (это та же трата или разные?).
      const cat = decision.includes(':') ? decision.slice(decision.indexOf(':') + 1) : 'Переводы';
      const dup = findDup(index, t);
      if (dup && dup.type === 'key') { plan.expensesDup.push({ tx: { ...t, category: cat }, dup }); continue; }
      if (dup && dup.type === 'heuristic') {
        plan.collisionAsk.push({ ...t, category: cat, match: { note: dup.match.note, amount: dup.match.amount, date: dup.match.date } });
        continue;
      }
      plan.expensesNew.push({ ...t, category: cat, tinkoffCategory: 'Переводы' });
      continue;
    }
    if (decision && decision.startsWith('env:')) {
      const env = findEnvelope(budget, new RegExp(decision.slice(4).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
      if (env) { toEnvelope(env, t, 'Перевод'); continue; }
    }
    if (!askMap.has(t.note)) askMap.set(t.note, { counterpart: t.note, items: [], total: 0 });
    const g = askMap.get(t.note); g.items.push(t); g.total = Math.round((g.total + t.amount) * 100) / 100;
  }
  plan.transfersAsk = Array.from(askMap.values()).sort((a, b) => b.total - a.total);

  // 3) входящие переводы — по правилу или спросить
  const inMap = new Map();
  for (const t of parsed.transfersIn) {
    if (index.keys.has(t.key)) continue; // уже импортировано
    const decision = cp[t.note];
    if (decision === 'ignore') { plan.skipped.push({ ts: t.ts, amount: t.amount, note: t.note, reason: 'rule:ignore' }); continue; }
    if (decision === 'income') { plan.topups.push({ ...t, asIncome: true }); continue; }
    if (!inMap.has(t.note)) inMap.set(t.note, { counterpart: t.note, items: [], total: 0 });
    const g = inMap.get(t.note); g.items.push(t); g.total = Math.round((g.total + t.amount) * 100) / 100;
  }
  plan.incomeAsk = Array.from(inMap.values()).sort((a, b) => b.total - a.total);

  // 4) внешние пополнения («Пополнение через банк») — НЕ молча в бюджет:
  //    спрашиваем «+в бюджет или уже в плане?» (план периода юзер задаёт вручную и часто
  //    уже закладывает туда основной доход). Подтверждённые добавит applyPlan.
  plan.topupsAsk = parsed.topups.filter((t) => !index.keys.has(t.key));

  return plan;
}

// ---------- применение плана к бюджету (мутация) ----------
// Дедуп по imported_keys: повторная выгрузка ничего не задвоит.
// Конверт, по которому есть РУЧНАЯ разовая оплата (paid, ещё не envelope), не трогаем —
// кладём в conflicts, чтобы пользователь решил (заменить/пропустить) — защита первого импорта.
// opts.forceEnvelopes: Set имён конвертов, для которых разрешено применить поверх ручной оплаты.
function applyPlan(data, plan, today = c.todayStr(), opts = {}) {
  const imported = new Set(data.imported_keys || []);
  const force = opts.forceEnvelopes || new Set();
  const res = { expensesAdded: [], envelopeCharged: [], topupsApplied: [], budgetAdded: 0, skippedDup: 0, conflicts: [] };
  const mark = (k) => { if (k) imported.add(k); };

  // 1) обычные траты
  for (const e of plan.expensesNew) {
    if (e.key && imported.has(e.key)) { res.skippedDup++; continue; }
    data.personal_expenses.push({
      id: c.nextId(data), date: e.date, amount: c.round2(e.amount),
      category: e.category || 'Прочее', note: e.note || '', import_key: e.key,
    });
    data.balance = c.round2((data.balance || 0) - c.round2(e.amount));
    mark(e.key); res.expensesAdded.push(e);
  }
  c.recomputeTodaySpent(data);

  // 2) конверты
  for (const b of Object.values(plan.envelopeCharges)) {
    const line = data.mandatory_expenses[b.idx];
    if (!line) continue;
    if (line.paid && !line.envelope && !force.has(b.name)) {
      res.conflicts.push({ name: b.name, idx: b.idx, manual: Number(line.paid_amount) || 0, csvTotal: b.total, items: b.items });
      continue;
    }
    // при forced-замене ручной оплаты — сбрасываем её перед накоплением факта
    if (line.paid && !line.envelope && force.has(b.name)) { c.ensureEnvelope(data, b.idx); line.spent = 0; }
    for (const it of b.items) {
      if (it.key && imported.has(it.key)) { res.skippedDup++; continue; }
      c.addEnvelopeCharge(data, b.idx, it.amount, it.note, it.date, { import_key: it.key });
      mark(it.key); res.envelopeCharged.push({ name: b.name, ...it });
    }
  }

  // 3) пополнения -> бюджет (только подтверждённые: income-правила + одобренные внешние)
  for (const t of plan.topups) {
    if (t.key && imported.has(t.key)) { res.skippedDup++; continue; }
    c.changeBudget(data, t.amount, today);
    mark(t.key); res.budgetAdded = c.round2(res.budgetAdded + t.amount); res.topupsApplied.push(t);
  }

  // пометить «уже в плане» пополнения как seen — без изменения бюджета, чтобы не переспрашивать
  for (const k of (opts.markSeen || [])) mark(k);

  data.imported_keys = Array.from(imported);
  return res;
}

module.exports = { planImport, applyPlan, findEnvelope, AMOUNT_TOL };
