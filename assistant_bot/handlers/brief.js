const { loadKey } = require('../db');
const { escMd, formatDate, todayStr } = require('../utils');

async function sendBrief(bot, chatId) {
  const [cardsRaw, txRaw] = await Promise.all([
    loadKey('cards'),
    loadKey('transactions'),
  ]);

  const cards = Array.isArray(cardsRaw) ? cardsRaw : [];
  const transactions = Array.isArray(txRaw) ? txRaw : [];

  const today = todayStr();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const active = cards
    .filter((c) => c.status === 'todo' || c.status === 'in_progress')
    .sort((a, b) => {
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due.localeCompare(b.due);
    });

  const overdue = active.filter((c) => c.due && c.due < today);
  const dueToday = active.filter((c) => c.due === today);
  const upcoming = active.filter((c) => !c.due || c.due > today);
  const doneCount = cards.filter((c) => c.status === 'done').length;
  const yesterdayTx = transactions.filter((t) => t.date === yesterdayStr);
  const yesterdayTotal = yesterdayTx.reduce((s, t) => s + t.amount, 0);

  let text = `☀️ *Доброе утро\\!*\n_${escMd(formatDate(today))}_\n\n`;

  if (overdue.length > 0) {
    text += `🔴 *Просрочено \\(${overdue.length}\\):*\n`;
    overdue.forEach((c) => {
      const days = Math.floor((new Date(today) - new Date(c.due)) / 86400000);
      text += `  \\[${c.id}\\] ${escMd(c.title)} \\(${days}д\\)\n`;
    });
    text += '\n';
  }

  if (dueToday.length > 0) {
    text += `🟡 *Сегодня \\(${dueToday.length}\\):*\n`;
    dueToday.forEach((c) => {
      text += `  \\[${c.id}\\] ${escMd(c.title)}\n`;
    });
    text += '\n';
  }

  if (upcoming.length > 0) {
    text += `📋 *Предстоит \\(${upcoming.length}\\):*\n`;
    upcoming.slice(0, 5).forEach((c) => {
      const due = c.due ? ` — ${escMd(formatDate(c.due))}` : '';
      text += `  \\[${c.id}\\] ${escMd(c.title)}${due}\n`;
    });
    if (upcoming.length > 5) text += `  _\\.\\.\\. и ещё ${upcoming.length - 5}_\n`;
    text += '\n';
  }

  if (active.length === 0) {
    text += `✅ Активных задач нет\\!\n\n`;
  }

  if (yesterdayTx.length > 0) {
    text += `💸 *Вчера потрачено: ${escMd(yesterdayTotal.toLocaleString('ru-RU'))} ₽*\n`;
    yesterdayTx.slice(0, 4).forEach((t) => {
      text += `  ${escMd(t.comment || t.category)} — ${escMd(t.amount.toLocaleString('ru-RU'))} ₽\n`;
    });
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
