const { loadKey, saveKey } = require('../db');
const c = require('../services/budgetCore');
const { escMd, formatDate, todayStr } = require('../utils');

async function sendBrief(bot, chatId) {
  const cardsRaw = await loadKey('cards');
  const cards = Array.isArray(cardsRaw) ? cardsRaw : [];

  const today = todayStr();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const active = cards
    .filter((x) => x.status === 'todo' || x.status === 'in_progress')
    .sort((a, b) => {
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due.localeCompare(b.due);
    });

  const overdue = active.filter((x) => x.due && x.due < today);
  const dueToday = active.filter((x) => x.due === today);
  const upcoming = active.filter((x) => !x.due || x.due > today);
  const doneCount = cards.filter((x) => x.status === 'done').length;

  let text = `☀️ *Доброе утро\\!*\n_${escMd(formatDate(today))}_\n\n`;

  if (overdue.length > 0) {
    text += `🔴 *Просрочено \\(${overdue.length}\\):*\n`;
    overdue.forEach((x) => {
      const days = Math.floor((new Date(today) - new Date(x.due)) / 86400000);
      text += `  \\[${x.id}\\] ${escMd(x.title)} \\(${days}д\\)\n`;
    });
    text += '\n';
  }
  if (dueToday.length > 0) {
    text += `🟡 *Сегодня \\(${dueToday.length}\\):*\n`;
    dueToday.forEach((x) => { text += `  \\[${x.id}\\] ${escMd(x.title)}\n`; });
    text += '\n';
  }
  if (upcoming.length > 0) {
    text += `📋 *Предстоит \\(${upcoming.length}\\):*\n`;
    upcoming.slice(0, 5).forEach((x) => {
      const due = x.due ? ` — ${escMd(formatDate(x.due))}` : '';
      text += `  \\[${x.id}\\] ${escMd(x.title)}${due}\n`;
    });
    if (upcoming.length > 5) text += `  _\\.\\.\\. и ещё ${upcoming.length - 5}_\n`;
    text += '\n';
  }
  if (active.length === 0) text += `✅ Активных задач нет\\!\n\n`;

  // ---- Бюджет ----
  const budget = c.normalize(await loadKey('budget'));
  if (c.isConfigured(budget)) {
    const before = budget.today_date;
    c.applyDayTransition(budget);
    if (budget.today_date !== before) await saveKey('budget', budget); // фиксируем закрытие дня
    const limit = budget.today_limit_adjusted || 0;
    const spent = budget.today_spent || 0;
    const rem = limit - spent;
    text += `💰 *Бюджет на сегодня*\n`;
    text += `Лимит ${escMd(c.money(limit))} · потрачено ${escMd(c.money(spent))}\n`;
    text += `${rem >= 0 ? '✅' : '⚠️'} Осталось ${escMd(c.money(Math.max(0, rem)))} · 🐷 ${escMd(c.money(budget.piggybank || 0))}\n`;

    const yTx = (budget.personal_expenses || []).filter((t) => t.date === yesterdayStr);
    if (yTx.length > 0) {
      const yTotal = yTx.reduce((s, t) => s + (Number(t.amount) || 0), 0);
      text += `\n💸 *Вчера потрачено: ${escMd(c.money(yTotal))}*\n`;
      yTx.slice(0, 4).forEach((t) => { text += `  ${escMd(t.category)} — ${escMd(c.money(t.amount))}\n`; });
    }
    text += '\n';
  }

  text += `_Выполнено всего: ${doneCount} задач_`;
  await bot.sendMessage(chatId, text, { parse_mode: 'MarkdownV2' });
}

function register(bot, isAllowed, deny) {
  bot.onText(/\/бриф/, async (msg) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    try {
      await sendBrief(bot, msg.chat.id);
    } catch (err) {
      console.error(err);
      bot.sendMessage(msg.chat.id, '❌ Ошибка при загрузке сводки.');
    }
  });
}

module.exports = { register, sendBrief };
