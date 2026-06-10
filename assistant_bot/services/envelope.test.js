// Тесты конвертов (envelopes). Запуск: node envelope.test.js
const c = require('./budgetCore');
let passed = 0, failed = 0;
function approx(a, e, label, eps = 0.005) { if (Math.abs(a - e) < eps) passed++; else { failed++; console.log(`FAIL ${label}: exp ~${e} got ${a}`); } }
function eq(a, e, label) { if (JSON.stringify(a) === JSON.stringify(e)) passed++; else { failed++; console.log(`FAIL ${label}: exp ${JSON.stringify(e)} got ${JSON.stringify(a)}`); } }

// mandatoryEffective: конверт = max(план, факт)
eq(c.mandatoryEffective({ envelope: true, amount: 10000, spent: 3000 }), 10000, 'env effective = plan when under');
eq(c.mandatoryEffective({ envelope: true, amount: 10000, spent: 12000 }), 12000, 'env effective = spent when over');
eq(c.mandatoryEffective({ paid: true, amount: 10000, paid_amount: 5106 }), 5106, 'paid effective = paid_amount');
eq(c.mandatoryEffective({ amount: 10000 }), 10000, 'plain effective = plan');

// normalize сохраняет конверт + метки импорта
{
  const d = c.normalize({
    mandatory_expenses: [{ name: 'Бензин', amount: 10000, envelope: true, spent: 7714.84 }],
    personal_expenses: [{ date: '2026-06-06', amount: 100, category: 'Еда', note: 'x', import_key: 'tinkoff:abc', mandatory: true, envelope: 'Бензин' }],
  });
  eq(d.mandatory_expenses[0].envelope, true, 'normalize keeps envelope flag');
  approx(d.mandatory_expenses[0].spent, 7714.84, 'normalize keeps spent');
  eq(d.personal_expenses[0].import_key, 'tinkoff:abc', 'normalize keeps import_key');
  eq(d.personal_expenses[0].envelope, 'Бензин', 'normalize keeps envelope name on expense');
}

// addEnvelopeCharge: копит факт, не растит today_spent, конвертит paid->envelope
{
  const d = c.normalize({
    monthly_budget: 132000, start_date: '2026-06-01', end_date: '2026-06-15',
    mandatory_expenses: [{ name: 'Бензин', amount: 10000 }],
    today_spent: 500, today_date: '2026-06-06',
  });
  const r1 = c.addEnvelopeCharge(d, 0, 4000.43, 'Роснефть', '2026-06-06', { import_key: 'k1' });
  approx(r1.spent, 4000.43, 'charge1 spent');
  const r2 = c.addEnvelopeCharge(d, 0, 3714.41, 'Роснефть', '2026-06-06', { import_key: 'k2' });
  approx(r2.spent, 7714.84, 'charge2 accumulates');
  eq(d.mandatory_expenses[0].envelope, true, 'line became envelope');
  eq(d.today_spent, 500, 'envelope charge does NOT touch today_spent');
  eq(d.personal_expenses.length, 2, 'two history records pushed');
  eq(d.personal_expenses[0].mandatory, true, 'history record is mandatory');
  eq(d.personal_expenses[0].import_key, 'k1', 'history carries import_key');
}

// конверт под планом резервирует план; перерасход режет свободные
{
  const mk = (spent) => c.normalize({
    monthly_budget: 100000, start_date: '2026-06-01', end_date: '2026-06-10',
    mandatory_expenses: [{ name: 'Бензин', amount: 10000, envelope: true, spent }],
  });
  const under = c.calcDailyLimit(100000, mk(3000).mandatory_expenses, '2026-06-01', '2026-06-10', '2026-06-01');
  approx(under.free, 90000, 'under-plan: free reserves full plan (100k-10k)');
  const over = c.calcDailyLimit(100000, mk(15000).mandatory_expenses, '2026-06-01', '2026-06-10', '2026-06-01');
  approx(over.free, 85000, 'over-plan: free reduced by actual (100k-15k)');
}

// payMandatory одноразовый по-прежнему работает (обратная совместимость)
{
  const d = c.normalize({ mandatory_expenses: [{ name: 'Аренда', amount: 30000 }], start_date: '2026-06-01', end_date: '2026-06-15' });
  const res = c.payMandatory(d, 0, 30000, '2026-06-02');
  eq(d.mandatory_expenses[0].paid, true, 'one-off pay still marks paid');
  eq(res.actual, 30000, 'one-off pay actual');
}

// startPeriod сохраняет конверт, обнуляет факт
{
  const d = c.normalize({
    monthly_budget: 100000,
    mandatory_expenses: [{ name: 'Бензин', amount: 10000, envelope: true, spent: 7714 }, { name: 'Аренда', amount: 30000, paid: true, paid_amount: 30000 }],
  });
  c.startPeriod(d, '2026-07-01', '2026-07-15', '2026-07-01');
  eq(d.mandatory_expenses[0].envelope, true, 'startPeriod keeps envelope flag');
  eq(d.mandatory_expenses[0].spent, 0, 'startPeriod resets spent');
  eq(d.mandatory_expenses[0].amount, 10000, 'startPeriod keeps plan');
  eq(d.mandatory_expenses[1].paid, undefined, 'startPeriod clears one-off paid');
}

// envelopeLeftover
{
  const d = c.normalize({ mandatory_expenses: [{ name: 'Бензин', amount: 10000, envelope: true, spent: 7714 }, { name: 'Аренда', amount: 30000 }] });
  const lo = c.envelopeLeftover(d);
  eq(lo.length, 1, 'leftover only envelopes');
  approx(lo[0].left, 2286, 'leftover plan-spent');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
