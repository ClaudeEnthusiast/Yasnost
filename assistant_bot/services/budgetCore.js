// services/budgetCore.js
// Чистая логика бюджета — без Telegram и без БД.
// Портирована один-в-один из budget_bot.py (см. спецификацию).
// Используется и ассистент-ботом, и yasnost-api. Идентичная копия лежит в обоих проектах —
// при изменении логики держать копии синхронными.

const TZ = 'Europe/Moscow';

// --- Дата «сегодня» в часовом поясе пользователя (МСК), формат YYYY-MM-DD ---
function todayStr(tz = TZ) {
  return new Date().toLocaleDateString('en-CA', { timeZone: tz });
}

// --- Округление половин к чётному (как Python round / format :.0f) ---
function roundHalfEven(n) {
  if (!Number.isFinite(n)) return 0;
  const floor = Math.floor(n);
  const diff = n - floor;
  if (Math.abs(diff - 0.5) < 1e-9) return floor % 2 === 0 ? floor : floor + 1;
  return Math.round(n);
}

function round2(n) {
  if (!Number.isFinite(n)) return 0;
  return roundHalfEven(n * 100) / 100;
}

// --- Форматирование денег: "150 000 ₽", "-10 000 ₽" ---
function money(amount) {
  const v = roundHalfEven(amount || 0);
  const sign = v < 0 ? '-' : '';
  const grouped = Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return sign + grouped + ' ₽';
}

// --- Парсинг суммы: "1500", "1 500", "1500,50" -> number; кидает при мусоре ---
function parseAmount(text) {
  const cleaned = String(text).replace(/\s+/g, '').replace(/,/g, '.');
  if (cleaned === '') throw new Error('empty');
  const n = Number(cleaned);
  if (!Number.isFinite(n)) throw new Error('not a number');
  return n;
}

// --- Безопасный калькулятор: только + - * / ( ) и десятичные числа.
//     Возвращает результат ТОЛЬКО если есть оператор и результат > 0, иначе null. ---
function parseArithmetic(text) {
  const expr = String(text).replace(/\s+/g, '').replace(/,/g, '.');
  if (!/^[\d.+\-*/()]+$/.test(expr)) return null;
  if (!/[+\-*/]/.test(expr)) return null;

  let pos = 0;
  const peek = () => expr[pos];

  function parseExpr() {
    let v = parseTerm();
    if (v === null) return null;
    while (peek() === '+' || peek() === '-') {
      const op = expr[pos++];
      const r = parseTerm();
      if (r === null) return null;
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }
  function parseTerm() {
    let v = parseFactor();
    if (v === null) return null;
    while (peek() === '*' || peek() === '/') {
      const op = expr[pos++];
      const r = parseFactor();
      if (r === null) return null;
      v = op === '*' ? v * r : v / r;
    }
    return v;
  }
  function parseFactor() {
    if (peek() === '+') { pos++; return parseFactor(); }
    if (peek() === '-') { pos++; const f = parseFactor(); return f === null ? null : -f; }
    if (peek() === '(') {
      pos++;
      const v = parseExpr();
      if (v === null || peek() !== ')') return null;
      pos++;
      return v;
    }
    const start = pos;
    while (pos < expr.length && /[\d.]/.test(expr[pos])) pos++;
    if (pos === start) return null;
    const num = Number(expr.slice(start, pos));
    if (!Number.isFinite(num)) return null;
    return num;
  }

  const result = parseExpr();
  if (result === null || pos !== expr.length) return null;
  if (Number.isFinite(result) && result > 0) return result;
  return null;
}

// --- Пустой бюджет (чистые финансовые поля, без UI-состояния) ---
function emptyBudget() {
  return {
    monthly_budget: 0,
    mandatory_expenses: [],
    start_date: null,
    end_date: null,
    daily_limit: 0,
    piggybank: 0,
    corporate_total: 0,
    today_date: null,
    today_spent: 0,
    today_limit_adjusted: 0,
    personal_expenses: [],
    corporate_expenses: [],
    imported_keys: [],
  };
}

// --- Нормализация: гарантирует типы/дефолты, отбрасывает посторонние поля ---
function normalize(data) {
  const d = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  const num = (v, def) => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
  };
  const mand = (Array.isArray(d.mandatory_expenses) ? d.mandatory_expenses : []).map((e) => {
    const out = { name: String(e && e.name != null ? e.name : ''), amount: num(e && e.amount, 0) };
    if (e && e.envelope) {
      out.envelope = true;
      out.spent = num(e.spent, 0);
    } else if (e && e.paid) {
      out.paid = true;
      out.paid_amount = num(e.paid_amount, 0);
      out.paid_date = e.paid_date || null;
    }
    if (e && e.due) out.due = String(e.due);
    return out;
  });
  const exp = (list, isCorp) =>
    (Array.isArray(list) ? list : []).map((e) => {
      const o = {
        date: e && e.date ? String(e.date) : null,
        amount: num(e && e.amount, 0),
        category: String(e && e.category != null ? e.category : ''),
        note: String(e && e.note != null ? e.note : ''),
      };
      if (e && e.id != null) o.id = e.id;
      if (e && e.mandatory) o.mandatory = true;
      if (e && e.envelope) o.envelope = String(e.envelope);   // имя конверта (для истории/дедупа)
      if (e && e.import_key) o.import_key = String(e.import_key); // ключ импорта (защита от повторного импорта)
      if (isCorp) o.compensated = num(e && e.compensated, 0);
      return o;
    });
  return {
    monthly_budget: num(d.monthly_budget, 0),
    mandatory_expenses: mand,
    start_date: d.start_date || null,
    end_date: d.end_date || null,
    daily_limit: num(d.daily_limit, 0),
    piggybank: num(d.piggybank, 0),
    corporate_total: num(d.corporate_total, 0),
    today_date: d.today_date || null,
    today_spent: num(d.today_spent, 0),
    today_limit_adjusted: num(d.today_limit_adjusted, 0),
    personal_expenses: exp(d.personal_expenses, false),
    corporate_expenses: exp(d.corporate_expenses, true),
    balance: num(d.balance, 0),
    imported_keys: Array.isArray(d.imported_keys) ? d.imported_keys.map(String) : [],
  };
}

// --- Эффективная сумма обязательного расхода ---
//   конверт (envelope): резерв = max(план, факт) — пока не превышен план, лимит стабилен;
//                        превышение факта сразу урезает свободные средства;
//   оплачен один раз (paid): факт;
//   иначе: план.
function mandatoryEffective(e) {
  if (e && e.envelope) return Math.max(Number(e.amount) || 0, Number(e.spent) || 0);
  if (e && e.paid) return Number(e.paid_amount) || 0;
  return Number(e && e.amount) || 0;
}

function isConfigured(data) {
  return !!(data && data.start_date && data.end_date && data.monthly_budget > 0);
}

// --- Даты ---
function parseISO(s) {
  const [y, m, d] = String(s).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}
function daysBetween(aISO, bISO) {
  return Math.round((parseISO(bISO) - parseISO(aISO)) / 86400000);
}
function fmtRu(iso) {
  if (!iso) return '—';
  const [y, m, d] = String(iso).split('-');
  return `${d}.${m}.${y}`;
}
function parseRuDate(s) {
  const m = String(s).trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) throw new Error('bad date');
  const d = +m[1], mo = +m[2], y = +m[3];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
    throw new Error('bad date');
  }
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// --- Расчёт дневного лимита ---
function calcDailyLimit(monthlyBudget, mandatory, startDate, endDate, today = todayStr()) {
  const totalMandatory = (mandatory || []).reduce((s, e) => s + mandatoryEffective(e), 0);
  const free = monthlyBudget - totalMandatory;
  const daysTotal = daysBetween(startDate, endDate) + 1;
  const daysElapsed = Math.max(0, daysBetween(startDate, today));
  const daysLeft = Math.max(1, daysTotal - daysElapsed);
  return {
    daily_limit: round2(free / daysLeft),
    comment: `Свободный остаток ${money(free)} на ${daysLeft} дней`,
    days_left: daysLeft,
    days_total: daysTotal,
    free,
  };
}

// --- Пересчёт лимита с сохранением накопленного переноса (carryover) ---
function recalcAndApplyLimit(data, today = todayStr()) {
  if (!data.start_date || !data.end_date) return data;
  const r = calcDailyLimit(data.monthly_budget, data.mandatory_expenses, data.start_date, data.end_date, today);
  const oldDaily = data.daily_limit || 0;
  const carryover = (data.today_limit_adjusted || 0) - oldDaily;
  data.daily_limit = r.daily_limit;
  data.today_limit_adjusted = r.daily_limit + carryover;
  return data;
}

// --- Переход на новый день: экономия -> копилка, перерасход -> минус завтрашнему лимиту ---
function applyDayTransition(data, today = todayStr()) {
  if (data.today_date && data.today_date !== today) {
    const yLimit = Number.isFinite(data.today_limit_adjusted) ? data.today_limit_adjusted : (data.daily_limit || 0);
    const ySpent = data.today_spent || 0;
    const delta = yLimit - ySpent;
    if (delta > 0) data.piggybank = (data.piggybank || 0) + delta;
    data.today_limit_adjusted = (data.daily_limit || 0) + Math.min(0, delta);
    data.today_spent = 0;
    data.today_date = today;
  } else if (!data.today_date) {
    data.today_date = today;
    data.today_limit_adjusted = data.daily_limit || 0;
    data.today_spent = 0;
  }
  return data;
}

// --- Стабильные id записей: защита от рассинхрона позиций при параллельных правках (бот ↔ сайт) ---
function nextId(data) {
  let max = 0;
  const scan = (list) => (list || []).forEach((e) => { const n = Number(e && e.id); if (Number.isFinite(n) && n > max) max = n; });
  scan(data.personal_expenses); scan(data.corporate_expenses);
  return max + 1;
}
function ensureIds(data) {
  let max = 0, changed = false;
  const scan = (list) => (list || []).forEach((e) => { const n = Number(e && e.id); if (Number.isFinite(n) && n > max) max = n; });
  scan(data.personal_expenses); scan(data.corporate_expenses);
  const assign = (list) => (list || []).forEach((e) => { if (e && !Number.isFinite(Number(e.id))) { e.id = ++max; changed = true; } });
  assign(data.personal_expenses); assign(data.corporate_expenses);
  return changed;
}

// --- Операции с тратами (caller обязан заранее вызвать applyDayTransition) ---
function addPersonalExpense(data, amount, category, note, today = todayStr()) {
  const tx = { id: nextId(data), date: today, amount, category: String(category || ''), note: String(note || '') };
  data.personal_expenses.push(tx);
  data.today_spent = (data.today_spent || 0) + amount;
  data.balance = round2((data.balance || 0) - amount);
  return tx;
}
function addCorporateExpense(data, amount, category, note, today = todayStr()) {
  const tx = { id: nextId(data), date: today, amount, category: String(category || ''), note: String(note || ''), compensated: 0 };
  data.corporate_expenses.push(tx);
  data.corporate_total = (data.corporate_total || 0) + amount;
  return tx;
}
function undoLastPersonal(data, today = todayStr()) {
  if (!data.personal_expenses.length) return null;
  const last = data.personal_expenses.pop();
  if (last.date === today && !last.mandatory) data.today_spent = Math.max(0, (data.today_spent || 0) - last.amount);
  return last;
}

// --- Пересчёт today_spent из истории (после правок/удалений). Обязательные не учитываются. ---
function recomputeTodaySpent(data) {
  const t = data.today_date;
  if (!t) { data.today_spent = 0; return; }
  data.today_spent = (data.personal_expenses || [])
    .filter((e) => e.date === t && !e.mandatory)
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
}

// --- Редактирование/удаление личного расхода по индексу ---
function editPersonalExpense(data, idx, patch, today = todayStr()) {
  const list = data.personal_expenses || [];
  if (idx < 0 || idx >= list.length) return null;
  const e = list[idx];
  if (e.mandatory) { if (patch.date != null) { e.date = String(patch.date); recomputeTodaySpent(data); return e; } return null; } // обязательные: только дата
  if (patch.amount != null && Number.isFinite(Number(patch.amount))) { data.balance = round2((data.balance || 0) + ((Number(e.amount) || 0) - Number(patch.amount))); e.amount = Number(patch.amount); }
  if (patch.date != null) e.date = String(patch.date);
  if (patch.category != null) e.category = String(patch.category);
  if (patch.note != null) e.note = String(patch.note);
  recomputeTodaySpent(data);
  return e;
}
function removePersonalAt(data, idx) {
  const list = data.personal_expenses || [];
  if (idx < 0 || idx >= list.length) return null;
  const removed = list.splice(idx, 1)[0];
  if (removed) data.balance = round2((data.balance || 0) + (Number(removed.amount) || 0));
  recomputeTodaySpent(data);
  return removed;
}

// --- Корпоративные: редактирование, удаление, компенсация, долг ---
function editCorporateExpense(data, idx, patch) {
  const list = data.corporate_expenses || [];
  if (idx < 0 || idx >= list.length) return null;
  const e = list[idx];
  if (patch.amount != null && Number.isFinite(Number(patch.amount))) e.amount = Number(patch.amount);
  if (patch.date != null) e.date = String(patch.date);
  if (patch.category != null) e.category = String(patch.category);
  if (patch.note != null) e.note = String(patch.note);
  if (patch.compensated != null && Number.isFinite(Number(patch.compensated))) {
    e.compensated = Math.max(0, Math.min(Number(patch.compensated), Number(e.amount) || 0));
  }
  data.corporate_total = sumAmount(data.corporate_expenses);
  return e;
}
function removeCorporateAt(data, idx) {
  const list = data.corporate_expenses || [];
  if (idx < 0 || idx >= list.length) return null;
  const removed = list.splice(idx, 1)[0];
  data.corporate_total = sumAmount(data.corporate_expenses);
  return removed;
}
// Компенсировать корп-расход: добавить сумму к compensated (или полностью, если amount пуст)
function compensateCorporate(data, idx, amount) {
  const list = data.corporate_expenses || [];
  if (idx < 0 || idx >= list.length) return null;
  const e = list[idx];
  const cap = Number(e.amount) || 0;
  const add = (amount == null || amount === '') ? (cap - (Number(e.compensated) || 0)) : Number(amount);
  e.compensated = Math.max(0, Math.min((Number(e.compensated) || 0) + add, cap));
  return e;
}
function corporateCompensated(data) {
  return (data.corporate_expenses || []).reduce((s, e) => s + (Number(e.compensated) || 0), 0);
}
function corporateDebt(data) {
  return (data.corporate_expenses || []).reduce((s, e) => s + Math.max(0, (Number(e.amount) || 0) - (Number(e.compensated) || 0)), 0);
}
// Распределить компенсацию одной суммой по корп-расходам (старые сначала, до исчерпания суммы)
function applyCorporateCompensation(data, amount) {
  let left = Number(amount) || 0;
  if (!(left > 0)) return { applied: 0, leftover: 0 };
  let applied = 0;
  for (const e of (data.corporate_expenses || [])) {
    if (left <= 0) break;
    const cap = Number(e.amount) || 0;
    const comp = Number(e.compensated) || 0;
    const room = cap - comp;
    if (room <= 0) continue;
    const add = Math.min(room, left);
    e.compensated = round2(comp + add);
    left = round2(left - add);
    applied = round2(applied + add);
  }
  return { applied, leftover: round2(left) };
}

// --- Копилка ---
function piggybankSet(data, value) {
  const old = data.piggybank || 0;
  data.piggybank = value;
  return { old, value, diff: value - old };
}
function piggybankAdd(data, amount) {
  const old = data.piggybank || 0;
  data.piggybank = old + amount;
  return { old, value: data.piggybank };
}
function piggybankWithdraw(data, amount) {
  const pig = data.piggybank || 0;
  if (amount > pig) return { ok: false, piggybank: pig };
  data.piggybank = pig - amount;
  data.today_limit_adjusted = (data.today_limit_adjusted || 0) + amount;
  return { ok: true, piggybank: data.piggybank };
}

// --- Обязательные расходы ---
function payMandatory(data, idx, actual, today = todayStr()) {
  const m = data.mandatory_expenses;
  if (idx < 0 || idx >= m.length) return null;
  const expense = m[idx];
  const budgeted = Number(expense.amount) || 0;
  // История: личная трата с флагом mandatory. НЕ увеличивает today_spent и НЕ идёт в копилку.
  data.personal_expenses.push({ date: today, amount: actual, category: 'Обязательные', note: expense.name, mandatory: true });
  data.balance = round2((data.balance || 0) - actual);
  m[idx] = { ...expense, paid: true, paid_amount: actual, paid_date: today };
  // Обязательные обременяют бюджет по ФАКТУ: освободившееся (план−факт) размазывается
  // по оставшимся дням через пересчёт дневного лимита (копилку не трогаем).
  recalcAndApplyLimit(data, today);
  const diff = round2(budgeted - actual);
  return { name: expense.name, budgeted, actual, diff, piggybank: data.piggybank || 0 };
}
// Откат оплаты обязательного (снять paid, удалить запись истории, пересчитать лимит)
function unpayMandatory(data, idx, today = todayStr()) {
  const m = data.mandatory_expenses;
  if (idx < 0 || idx >= m.length) return null;
  const e = m[idx];
  if (!e.paid) return null;
  // удалить последнюю mandatory-запись истории с этим именем
  for (let i = data.personal_expenses.length - 1; i >= 0; i--) {
    const p = data.personal_expenses[i];
    if (p.mandatory && p.note === e.name) { data.personal_expenses.splice(i, 1); break; }
  }
  data.balance = round2((data.balance || 0) + (Number(e.paid_amount) || 0));
  m[idx] = { name: e.name, amount: Number(e.amount) || 0 };
  recalcAndApplyLimit(data, today);
  return m[idx];
}
function addMandatory(data, name, amount, today = todayStr()) {
  data.mandatory_expenses.push({ name: String(name), amount });
  recalcAndApplyLimit(data, today);
}
function removeMandatory(data, idx, today = todayStr()) {
  const m = data.mandatory_expenses;
  if (idx < 0 || idx >= m.length) return null;
  const removed = m.splice(idx, 1)[0];
  recalcAndApplyLimit(data, today);
  return removed;
}
function editMandatory(data, idx, patch, today = todayStr()) {
  const m = data.mandatory_expenses;
  if (idx < 0 || idx >= m.length) return null;
  const e = m[idx];
  if (patch.name != null) e.name = String(patch.name);
  if (patch.amount != null && Number.isFinite(Number(patch.amount))) e.amount = Number(patch.amount);
  if (patch.due !== undefined) { if (patch.due) e.due = String(patch.due); else delete e.due; }
  recalcAndApplyLimit(data, today);
  return e;
}

// --- Конверты (envelopes): обязательный расход с несколькими списаниями за период ---
function findMandatoryByName(data, name) {
  const n = String(name || '').trim().toLowerCase();
  return (data.mandatory_expenses || []).findIndex((e) => String(e.name || '').trim().toLowerCase() === n);
}
// Превратить обязательный расход в конверт (перенести разовую оплату в накопленный факт)
function ensureEnvelope(data, idx) {
  const e = data.mandatory_expenses[idx];
  if (!e || e.envelope) return e;
  e.envelope = true;
  e.spent = e.paid ? (Number(e.paid_amount) || 0) : 0;
  delete e.paid; delete e.paid_amount; delete e.paid_date;
  return e;
}
// Списание в конверт: копит факт, пишет запись истории (mandatory — не ест дневной лимит),
// пересчитывает дневной лимит. extra — доп. поля записи (import_key и т.п.).
function addEnvelopeCharge(data, idx, amount, note, today = todayStr(), extra = {}) {
  const m = data.mandatory_expenses;
  if (idx < 0 || idx >= m.length) return null;
  const e = ensureEnvelope(data, idx);
  const amt = round2(amount);
  e.spent = round2((Number(e.spent) || 0) + amt);
  data.balance = round2((data.balance || 0) - amt);
  data.personal_expenses.push({
    id: nextId(data), date: today, amount: amt,
    category: 'Обязательные', note: `${e.name}${note ? ': ' + note : ''}`,
    mandatory: true, envelope: e.name, ...extra,
  });
  recalcAndApplyLimit(data, today);
  return { name: e.name, spent: e.spent, planned: Number(e.amount) || 0, overspent: round2(Math.max(0, e.spent - (Number(e.amount) || 0))) };
}

// --- Бюджет: изменение на дельту (как в budget_bot) ---
function changeBudget(data, delta, today = todayStr()) {
  const old = data.monthly_budget || 0;
  const next = old + delta;
  if (next <= 0) return { ok: false, old };
  data.monthly_budget = next;
  data.balance = round2((data.balance || 0) + delta);
  recalcAndApplyLimit(data, today);
  return { ok: true, old, value: next };
}

// --- Периоды ---
function setupBudget(data, monthly, mandatoryList, startISO, endISO, today = todayStr()) {
  data.monthly_budget = monthly;
  data.mandatory_expenses = (mandatoryList || []).map((e) => ({ name: String(e.name), amount: Number(e.amount) || 0 }));
  data.start_date = startISO;
  data.end_date = endISO;
  data.piggybank = 0;
  data.corporate_total = 0;
  data.personal_expenses = [];
  data.corporate_expenses = [];
  data.today_date = null;
  data.today_spent = 0;
  data.today_limit_adjusted = 0;
  const r = calcDailyLimit(monthly, data.mandatory_expenses, startISO, endISO, today);
  data.daily_limit = r.daily_limit;
  applyDayTransition(data, today);
  return r;
}
function startPeriod(data, startISO, endISO, today = todayStr()) {
  data.start_date = startISO;
  data.end_date = endISO;
  data.personal_expenses = [];
  data.corporate_expenses = [];
  // конверты переносим в новый период: план сохраняем, накопленный факт обнуляем
  data.mandatory_expenses = data.mandatory_expenses.map((e) =>
    e.envelope ? { name: e.name, amount: e.amount, envelope: true, spent: 0 } : { name: e.name, amount: e.amount });
  data.corporate_total = 0;
  data.piggybank = 0;
  data.today_date = null;
  data.today_spent = 0;
  data.today_limit_adjusted = 0;
  const r = calcDailyLimit(data.monthly_budget, data.mandatory_expenses, startISO, endISO, today);
  data.daily_limit = r.daily_limit;
  applyDayTransition(data, today);
  return r;
}

// --- Производные значения / отчёты ---
function remaining(data) {
  return (data.today_limit_adjusted || 0) - (data.today_spent || 0);
}
function mandatoryTotal(data) {
  return (data.mandatory_expenses || []).reduce((s, e) => s + mandatoryEffective(e), 0);
}
// Плановая сумма обязательных (для справки/прогресса)
function mandatoryPlanned(data) {
  return (data.mandatory_expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
}
// Остаток по конвертам: [{name, planned, spent, left}] (left>0 — недотрачено, <0 — перерасход)
function envelopeLeftover(data) {
  return (data.mandatory_expenses || [])
    .filter((e) => e.envelope)
    .map((e) => {
      const planned = Number(e.amount) || 0, spent = Number(e.spent) || 0;
      return { name: e.name, planned, spent, left: round2(planned - spent) };
    });
}
function sumAmount(list) {
  return (list || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
}
function categoryBreakdown(list) {
  const map = {};
  (list || []).forEach((e) => {
    map[e.category] = (map[e.category] || 0) + (Number(e.amount) || 0);
  });
  return Object.entries(map)
    .map(([category, sum]) => ({ category, sum }))
    .sort((a, b) => b.sum - a.sum);
}
function topCategories(list, n = 5) {
  return categoryBreakdown(list).slice(0, n);
}
function filterByPeriod(list, period, today = todayStr()) {
  if (period === 'all') return (list || []).slice();
  let cutoff;
  if (period === 'today') {
    cutoff = today;
    return (list || []).filter((e) => e.date === today);
  }
  if (period === 'week') {
    cutoff = new Date(parseISO(today) - 6 * 86400000).toISOString().slice(0, 10);
  } else if (period === 'month') {
    cutoff = today.slice(0, 8) + '01';
  } else {
    return (list || []).slice();
  }
  return (list || []).filter((e) => e.date && e.date >= cutoff);
}
function groupByDate(list) {
  const map = {};
  (list || []).forEach((e) => {
    (map[e.date] = map[e.date] || []).push(e);
  });
  return map;
}

// --- Сводка для API/фронтенда ---
function computeSummary(data, today = todayStr()) {
  const mandTotal = mandatoryTotal(data);
  const personalTotal = sumAmount(data.personal_expenses);
  let daysLeft = null, daysTotal = null;
  if (data.start_date && data.end_date) {
    daysTotal = daysBetween(data.start_date, data.end_date) + 1;
    daysLeft = Math.max(1, daysTotal - Math.max(0, daysBetween(data.start_date, today)));
  }
  const personalSpent = (data.personal_expenses || []).filter((e) => !e.mandatory).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const unpaidObligations = (data.mandatory_expenses || []).filter((e) => !e.envelope && !e.paid).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const available = (data.balance || 0) - unpaidObligations;
  const expectedOnHand = data.balance || 0;
  return {
    monthly_budget: data.monthly_budget || 0,
    available: round2(available),
    available_daily: daysLeft ? round2(available / daysLeft) : round2(available),
    expected_on_hand: round2(expectedOnHand),
    unpaid_obligations: round2(unpaidObligations),
    personal_spent: round2(personalSpent),
    mandatory_total: mandTotal,
    mandatory_planned: mandatoryPlanned(data),
    free: (data.monthly_budget || 0) - mandTotal,
    daily_limit: data.daily_limit || 0,
    today_limit: data.today_limit_adjusted || 0,
    today_spent: data.today_spent || 0,
    remaining: remaining(data),
    piggybank: data.piggybank || 0,
    corporate_total: data.corporate_total || 0,
    corporate_compensated: corporateCompensated(data),
    corporate_debt: corporateDebt(data),
    personal_total: personalTotal,
    start_date: data.start_date,
    end_date: data.end_date,
    today_date: data.today_date,
    days_left: daysLeft,
    days_total: daysTotal,
  };
}

// --- Категории расходов (список + свои). Используются ботом и фронтом. ---
const CATEGORIES = [
  'Еда', 'Транспорт', 'Связь', 'Жильё/КУ', 'Здоровье',
  'Развлечения', 'Покупки', 'Переводы', 'Подписки', 'Обязательные', 'Прочее',
];
// Автокатегория по тексту (для миграции/быстрого ввода)
const CATEGORY_KEYWORDS = {
  'Еда': ['еда', 'обед', 'ужин', 'завтрак', 'кафе', 'ресторан', 'кофе', 'продукт', 'пятероч', 'магаз', 'дюрюм', 'голубик', 'вб дом', 'вкусвилл', 'перекрест'],
  'Транспорт': ['такси', 'метро', 'автобус', 'uber', 'бензин', 'парковк', 'транспорт', 'поезд', 'яндекс карт', 'каршеринг', 'то автомоб'],
  'Связь': ['телефон', 'интернет', 'связь', 'мобильн', 'симка', 'мтс', 'билайн', 'мегафон'],
  'Жильё/КУ': ['аренда', 'квартир', 'коммунал', 'жкх', 'ипотек', 'ку', 'свет', 'газ', 'вода'],
  'Здоровье': ['аптек', 'врач', 'клиник', 'лекарств', 'спорт', 'фитнес', 'ddx', 'браслет'],
  'Развлечения': ['кино', 'театр', 'клуб', 'концерт', 'игр', 'бар'],
  'Подписки': ['подписк', 'айфон', 'icloud', 'яндекс плюс', 'нетфликс', 'spotify'],
  'Переводы': ['перевод', 'маме', 'родител', 'кредитк'],
};
function autoCategory(text) {
  const lower = String(text || '').toLowerCase();
  if (!lower) return 'Прочее';
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return cat;
  }
  return 'Прочее';
}

module.exports = {
  TZ,
  todayStr,
  roundHalfEven,
  round2,
  money,
  parseAmount,
  parseArithmetic,
  emptyBudget,
  normalize,
  nextId,
  ensureIds,
  isConfigured,
  parseISO,
  daysBetween,
  fmtRu,
  parseRuDate,
  calcDailyLimit,
  recalcAndApplyLimit,
  applyDayTransition,
  addPersonalExpense,
  addCorporateExpense,
  undoLastPersonal,
  recomputeTodaySpent,
  editPersonalExpense,
  removePersonalAt,
  editCorporateExpense,
  removeCorporateAt,
  compensateCorporate,
  applyCorporateCompensation,
  corporateCompensated,
  corporateDebt,
  piggybankSet,
  piggybankAdd,
  piggybankWithdraw,
  payMandatory,
  unpayMandatory,
  addMandatory,
  removeMandatory,
  editMandatory,
  findMandatoryByName,
  ensureEnvelope,
  addEnvelopeCharge,
  envelopeLeftover,
  changeBudget,
  setupBudget,
  startPeriod,
  remaining,
  mandatoryTotal,
  mandatoryPlanned,
  mandatoryEffective,
  sumAmount,
  categoryBreakdown,
  topCategories,
  filterByPeriod,
  groupByDate,
  computeSummary,
  CATEGORIES,
  autoCategory,
};
