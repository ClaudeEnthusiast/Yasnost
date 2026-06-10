// Локальный тест чистой логики бюджета. Запуск: node budgetCore.test.js
const c = require('./budgetCore');

let passed = 0, failed = 0;
function eq(actual, expected, label) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { passed++; }
  else { failed++; console.log(`FAIL: ${label}\n   expected ${e}\n   got      ${a}`); }
}
function approx(actual, expected, label, eps = 0.005) {
  if (Math.abs(actual - expected) < eps) { passed++; }
  else { failed++; console.log(`FAIL: ${label} expected ~${expected} got ${actual}`); }
}
function throws(fn, label) {
  try { fn(); failed++; console.log(`FAIL: ${label} (did not throw)`); }
  catch { passed++; }
}

// money
eq(c.money(150000), '150 000 ₽', 'money 150000');
eq(c.money(-10000), '-10 000 ₽', 'money -10000');
eq(c.money(6744.6), '6 745 ₽', 'money 6744.6');
eq(c.money(0), '0 ₽', 'money 0');

// parseAmount
approx(c.parseAmount('1500'), 1500, 'parseAmount 1500');
approx(c.parseAmount('1 500'), 1500, 'parseAmount "1 500"');
approx(c.parseAmount('1500,50'), 1500.5, 'parseAmount 1500,50');
approx(c.parseAmount('1500.50'), 1500.5, 'parseAmount 1500.50');
throws(() => c.parseAmount('1.5к'), 'parseAmount 1.5к throws');
throws(() => c.parseAmount('abc'), 'parseAmount abc throws');

// parseArithmetic
approx(c.parseArithmetic('100+50'), 150, 'arith 100+50');
approx(c.parseArithmetic('2*3'), 6, 'arith 2*3');
approx(c.parseArithmetic('1 000 + 500'), 1500, 'arith spaces');
approx(c.parseArithmetic('(10+5)*2'), 30, 'arith parens');
eq(c.parseArithmetic('100'), null, 'arith bare number -> null');
eq(c.parseArithmetic('abc'), null, 'arith abc -> null');
eq(c.parseArithmetic('-5'), null, 'arith -5 -> null (<=0)');
eq(c.parseArithmetic('5-10'), null, 'arith 5-10 -> null (<=0)');

// calcDailyLimit — проверка на РЕАЛЬНЫХ данных (должно дать 3186.58)
const real = c.calcDailyLimit(
  130750,
  [{ name: 'Кредитка', amount: 50000 }, { name: 'КУ', amount: 10000 }, { name: 'Айфон', amount: 12511 }, { name: 'ТО', amount: 10000 }, { name: 'Бензин', amount: 10000 }],
  '2026-06-01', '2026-06-15', '2026-06-04'
);
approx(real.daily_limit, 3186.58, 'real daily_limit = 3186.58');
eq(real.days_left, 12, 'real days_left = 12');
eq(real.days_total, 15, 'real days_total = 15');

// applyDayTransition — экономия уходит в копилку, завтрашний лимит = базовый
{
  const d = c.normalize({ daily_limit: 3000, today_limit_adjusted: 3000, today_spent: 1000, piggybank: 100, today_date: '2026-06-03' });
  c.applyDayTransition(d, '2026-06-04');
  approx(d.piggybank, 2100, 'transition: piggybank += leftover 2000');
  approx(d.today_limit_adjusted, 3000, 'transition: new limit = base (economy not carried)');
  eq(d.today_spent, 0, 'transition: today_spent reset');
  eq(d.today_date, '2026-06-04', 'transition: today_date updated');
}
// applyDayTransition — перерасход переносится в минус завтрашнему лимиту
{
  const d = c.normalize({ daily_limit: 3000, today_limit_adjusted: 3000, today_spent: 4000, piggybank: 100, today_date: '2026-06-03' });
  c.applyDayTransition(d, '2026-06-04');
  approx(d.piggybank, 100, 'overspend: piggybank unchanged');
  approx(d.today_limit_adjusted, 2000, 'overspend: new limit = base - 1000');
}

// payMandatory — экономия идёт в копилку, today_spent не растёт
{
  const d = c.normalize({
    mandatory_expenses: [{ name: 'КУ', amount: 10000 }],
    piggybank: 0, today_spent: 500, today_limit_adjusted: 3000,
  });
  const res = c.payMandatory(d, 0, 5106, '2026-06-04');
  approx(res.diff, 4894, 'payMandatory diff');
  approx(d.piggybank, 4894, 'payMandatory saving -> piggybank');
  eq(d.today_spent, 500, 'payMandatory does NOT increase today_spent');
  eq(d.mandatory_expenses[0].paid, true, 'payMandatory marks paid');
  eq(d.personal_expenses[0].category, 'Обяз: КУ', 'payMandatory logs Обяз: category');
}

// piggybankWithdraw — увеличивает лимит дня
{
  const d = c.normalize({ piggybank: 5000, today_limit_adjusted: 3000, today_spent: 4000 });
  const res = c.piggybankWithdraw(d, 1000);
  eq(res.ok, true, 'withdraw ok');
  approx(d.piggybank, 4000, 'withdraw reduces piggybank');
  approx(d.today_limit_adjusted, 4000, 'withdraw raises today limit');
  const res2 = c.piggybankWithdraw(d, 999999);
  eq(res2.ok, false, 'withdraw over balance rejected');
}

// normalize отбрасывает UI-поля
{
  const d = c.normalize({ state: 'main', chat_id: 123, _temp_amount: 5, mandatory_buffer: [{ x: 1 }], monthly_budget: 100, piggybank: 50 });
  eq(d.state, undefined, 'normalize drops state');
  eq(d.chat_id, undefined, 'normalize drops chat_id');
  eq(d._temp_amount, undefined, 'normalize drops _temp_amount');
  eq(d.mandatory_buffer, undefined, 'normalize drops mandatory_buffer');
  approx(d.monthly_budget, 100, 'normalize keeps monthly_budget');
}

// changeBudget — дельта, запрет ухода в <= 0
{
  const d = c.normalize({ monthly_budget: 100000, start_date: '2026-06-01', end_date: '2026-06-15', daily_limit: 1000, today_limit_adjusted: 1000 });
  const r = c.changeBudget(d, 15000, '2026-06-04');
  eq(r.ok, true, 'changeBudget +15000 ok');
  approx(d.monthly_budget, 115000, 'changeBudget applies delta');
  const r2 = c.changeBudget(d, -999999, '2026-06-04');
  eq(r2.ok, false, 'changeBudget reject <=0');
}

// parseRuDate
eq(c.parseRuDate('01.06.2026'), '2026-06-01', 'parseRuDate');
throws(() => c.parseRuDate('31.02.2026'), 'parseRuDate invalid');
eq(c.fmtRu('2026-06-15'), '15.06.2026', 'fmtRu');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
