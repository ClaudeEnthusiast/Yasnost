// migrate-budget.js — одноразовая миграция бюджета из БД budget_bot → yasnost app_state['budget'].
// Запуск на сервере:  node migrate-budget.js [--force]
// Без --force не перезаписывает уже существующий ключ budget (идемпотентно/безопасно).

const { Pool } = require('pg');
const c = require('./services/budgetCore');

const FORCE = process.argv.includes('--force');

const yasnost = new Pool({ host: '127.0.0.1', port: 5432, database: 'yasnost', user: 'yasnost', password: 'yasnost123' });
const budgetbot = new Pool({ host: '127.0.0.1', port: 5432, database: 'budget_bot', user: 'budget_bot', password: 'budget123' });

(async () => {
  try {
    const ex = await yasnost.query("SELECT data FROM app_state WHERE key='budget'");
    if (ex.rows.length && !FORCE) {
      const cur = c.normalize(ex.rows[0].data);
      console.log('⚠️  Ключ budget уже есть в yasnost — миграция пропущена (запусти с --force для перезаписи).');
      console.log(`    текущее: бюджет ${cur.monthly_budget}, личных трат ${cur.personal_expenses.length}, копилка ${cur.piggybank}`);
      await yasnost.end(); await budgetbot.end();
      process.exit(0);
    }

    const src = await budgetbot.query('SELECT data FROM budget WHERE id=1');
    if (!src.rows.length) {
      console.log('❌ В budget_bot нет строки id=1 — нечего мигрировать.');
      await yasnost.end(); await budgetbot.end();
      process.exit(1);
    }
    const raw = src.rows[0].data;
    const clean = c.normalize(raw);

    console.log('Источник (budget_bot):');
    console.log(`  monthly_budget : ${raw.monthly_budget}`);
    console.log(`  piggybank      : ${raw.piggybank}`);
    console.log(`  daily_limit    : ${raw.daily_limit}`);
    console.log(`  personal=${(raw.personal_expenses || []).length}  corp=${(raw.corporate_expenses || []).length}  mandatory=${(raw.mandatory_expenses || []).length}`);
    console.log(`  отброшены UI-поля: state, chat_id, _temp_*, mandatory_buffer`);

    await yasnost.query(
      `INSERT INTO app_state (key, data, updated_at) VALUES ('budget', $1::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET data = $1::jsonb, updated_at = NOW()`,
      [JSON.stringify(clean)]
    );

    const chk = await yasnost.query("SELECT data FROM app_state WHERE key='budget'");
    const got = c.normalize(chk.rows[0].data);
    const paid = got.mandatory_expenses.filter((e) => e.paid).length;
    console.log('\n✅ Записано в yasnost app_state[budget]:');
    console.log(`  monthly_budget : ${got.monthly_budget}`);
    console.log(`  piggybank      : ${got.piggybank}`);
    console.log(`  daily_limit    : ${got.daily_limit}   today_limit_adj=${got.today_limit_adjusted}  today_spent=${got.today_spent}`);
    console.log(`  personal=${got.personal_expenses.length}  corp=${got.corporate_expenses.length}  mandatory=${got.mandatory_expenses.length} (оплачено ${paid})`);
    console.log(`  период: ${got.start_date} → ${got.end_date}`);

    await yasnost.end(); await budgetbot.end();
    process.exit(0);
  } catch (e) {
    console.error('❌ Миграция упала:', e.message);
    process.exit(1);
  }
})();
