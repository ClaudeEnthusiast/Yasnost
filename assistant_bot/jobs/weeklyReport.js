const cron = require('node-cron');
const config = require('../config');
const { loadKey } = require('../db');
const c = require('../services/budgetCore');
const { generateWeeklyReport } = require('../services/claude');
const { escMd, todayStr } = require('../utils');

async function sendWeeklyReport(bot) {
  const cardsRaw = await loadKey('cards');
  const cards = Array.isArray(cardsRaw) ? cardsRaw : [];
  const budget = c.normalize(await loadKey('budget'));

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);
  const today = todayStr();

  const personalWeek = (budget.personal_expenses || []).filter((t) => t.date && t.date >= weekAgoStr);
  const corpWeek = (budget.corporate_expenses || []).filter((t) => t.date && t.date >= weekAgoStr);
  const personalTotal = personalWeek.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const corpTotal = corpWeek.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const byCategory = personalWeek.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + (Number(t.amount) || 0);
    return acc;
  }, {});

  const reportData = {
    period: `${weekAgoStr} — ${today}`,
    tasks: {
      total: cards.length,
      todo: cards.filter((x) => x.status === 'todo').length,
      in_progress: cards.filter((x) => x.status === 'in_progress').length,
      done: cards.filter((x) => x.status === 'done').length,
      overdue: cards.filter((x) => x.status !== 'done' && x.due && x.due < today).length,
    },
    budget: {
      daily_limit: budget.daily_limit || 0,
      piggybank: budget.piggybank || 0,
      personal_week: personalTotal,
      corporate_week: corpTotal,
      by_category: byCategory,
    },
  };

  let reportText;
  if (config.ANTHROPIC_API_KEY) {
    reportText = await generateWeeklyReport(reportData);
  } else {
    const catStr = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, v]) => `  • ${k}: ${c.money(v)}`)
      .join('\n') || '  нет трат';
    reportText =
      `Период: ${reportData.period}\n\n` +
      `Задачи: ${reportData.tasks.todo} в очереди, ${reportData.tasks.in_progress} в работе, ` +
      `${reportData.tasks.done} выполнено, ${reportData.tasks.overdue} просрочено\n\n` +
      `Личные траты за неделю: ${c.money(personalTotal)}\n${catStr}\n\n` +
      `Корпоративные: ${c.money(corpTotal)}\n🐷 Копилка: ${c.money(budget.piggybank || 0)}`;
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

module.exports = { init, sendWeeklyReport };
