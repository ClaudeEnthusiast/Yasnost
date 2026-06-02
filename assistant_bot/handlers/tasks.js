const { loadKey, saveKey } = require('../db');
const { escMd, dueIn7Days, nextId, formatDate, todayStr } = require('../utils');

async function createTask(title, due) {
  const cards = await loadKey('cards');
  const arr = Array.isArray(cards) ? cards : [];
  const card = {
    id: nextId(arr),
    title,
    desc: '',
    status: 'todo',
    priority: 'normal',
    due: due || dueIn7Days(),
    notes: '',
    docs: 0,
    checklist: [],
    createdAt: todayStr(),
  };
  arr.push(card);
  await saveKey('cards', arr);
  return card;
}

function formatCard(c) {
  const today = todayStr();
  const overdue = c.due && c.due < today && c.status !== 'done';
  const icons = { todo: '📋', in_progress: '🔄', done: '✅' };
  const icon = overdue ? '🔴' : (icons[c.status] || '📋');

  let text = `${icon} \\[${c.id}\\] *${escMd(c.title)}*`;
  if (c.due) {
    const label = overdue
      ? ` \\(просрочено\\)`
      : c.due === today ? ' \\(сегодня\\)' : '';
    text += `\n📅 ${escMd(formatDate(c.due))}${label}`;
  }
  return text;
}

function register(bot, isAllowed, deny) {
  // /задача текст
  bot.onText(/\/задача (.+)/, async (msg, match) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    try {
      const card = await createTask(match[1].trim());
      bot.sendMessage(
        msg.chat.id,
        `✅ Задача добавлена\\!\n\n${formatCard(card)}`,
        { parse_mode: 'MarkdownV2' }
      );
    } catch (err) {
      console.error(err);
      bot.sendMessage(msg.chat.id, '❌ Ошибка при добавлении задачи.');
    }
  });

  // /задача без текста
  bot.onText(/^\/задача$/, (msg) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    bot.sendMessage(msg.chat.id, 'Укажи текст задачи:\n/задача Позвонить клиенту');
  });

  // /задачи
  bot.onText(/\/задачи/, async (msg) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    try {
      const cards = await loadKey('cards');
      const arr = Array.isArray(cards) ? cards : [];
      const active = arr.filter((c) => c.status === 'todo' || c.status === 'in_progress');

      if (active.length === 0) {
        return bot.sendMessage(msg.chat.id, '🎉 Нет активных задач\\!', { parse_mode: 'MarkdownV2' });
      }

      active.sort((a, b) => {
        if (!a.due && !b.due) return 0;
        if (!a.due) return 1;
        if (!b.due) return -1;
        return a.due.localeCompare(b.due);
      });

      bot.sendMessage(
        msg.chat.id,
        active.map(formatCard).join('\n\n'),
        { parse_mode: 'MarkdownV2' }
      );
    } catch (err) {
      console.error(err);
      bot.sendMessage(msg.chat.id, '❌ Ошибка при загрузке задач.');
    }
  });

  // /готово id
  bot.onText(/\/готово (\d+)/, async (msg, match) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    const id = parseInt(match[1], 10);
    try {
      const cards = await loadKey('cards');
      const arr = Array.isArray(cards) ? cards : [];
      const card = arr.find((c) => c.id === id);
      if (!card) {
        return bot.sendMessage(msg.chat.id, `❓ Задача \\[${id}\\] не найдена\\.`, { parse_mode: 'MarkdownV2' });
      }
      card.status = 'done';
      await saveKey('cards', arr);
      bot.sendMessage(
        msg.chat.id,
        `✅ *${escMd(card.title)}* — выполнена\\.`,
        { parse_mode: 'MarkdownV2' }
      );
    } catch (err) {
      console.error(err);
      bot.sendMessage(msg.chat.id, '❌ Ошибка при обновлении задачи.');
    }
  });
}

module.exports = { register, createTask, formatCard };
