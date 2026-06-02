const cron = require('node-cron');
const config = require('../config');
const { loadKey } = require('../db');
const { generateWeeklyReport } = require('../services/claude');
const { escMd, todayStr } = require('../utils');

async function sendWeeklyReport(bot) {
  const [cardsRaw, txRaw] = await Promise.all([
    loadKey('cards'),
    loadKey('transactions'),
  ]);

  const cards = Array.isArray(cardsRaw) ? cardsRaw : [];
  const transactions = Array.isArray(txRaw) ? txRaw : [];

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);
  const today = todayStr();

  const weekTx = transactions.filter((t) => t.date >= weekAgoStr);
  const totalSpent = weekTx.reduce((s, t) => s + t.amount, 0);
  const byCategory = weekTx.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const reportData = {
    period: `${weekAgoStr} — ${today}`,
    tasks: {
      total: cards.length,
      todo: cards.filter((c) => c.status === 'todo').length,
      in_progress: cards.filter((c) => c.status === 'in_progress').length,
      done: cards.filter((c) => c.status === 'done').length,
      overdue: cards.filter((c) => c.status !== 'done' && c.due && c.due < today).length,
    },
    expenses: {
      total: totalSpent,
      transactions: weekTx.length,
      by_category: byCategory,
    },
  };

  let reportText;
  if (config.ANTHROPIC_API_KEY) {
    reportText = await generateWeeklyReport(reportData);
  } else {
    reportText =
      `Период: ${reportData.period}\n\n` +
      `Задачи: ${reportData.tasks.todo} в очереди, ${reportData.tasks.in_progress} в работе, ` +
      `${reportData.tasks.done} выполнено, ${reportData.tasks.overdue} просрочено\n\n` +
      `Расходы: ${totalSpent.toLocaleString('ru-RU')} ₽ (${weekTx.length} транзакций)`;
  }

  await bot.sendMessage(
    config.TELEGRAM_USER_ID,
    `📈 *Недельный отчёт*\n\n${escMd(reportText)}`,
    { parse_mode: 'MarkdownV2' }
  );
}

function init(bot) {
  const day = config.WEEKLY_REPORT_DAY || '0';
  const hour = config.WEEKLY_REPORT_HOUR || '20';

  cron.schedule(
    `0 ${hour} * * ${day}`,
    async () => {
      console.log('[cron] Недельный отчёт → отправка...');
      try {
        await sendWeeklyReport(bot);
      } catch (err) {
        console.error('[cron] Ошибка недельного отчёта:', err.message);
      }
    },
    { timezone: config.TIMEZONE }
  );

  const dayNames = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  console.log(`📅 Недельный отчёт: каждое ${dayNames[day] || day} в ${hour}:00 (${config.TIMEZONE})`);
}

module.exports = { init };
