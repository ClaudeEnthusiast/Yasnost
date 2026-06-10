const { loadKey, saveKey } = require('../db');
const { escMd, nextId, formatDate, todayStr } = require('../utils');

const PRIORITY_MAP = {
  срочно: 'urgent', срочный: 'urgent', срочная: 'urgent', срочное: 'urgent',
  важно: 'important', важный: 'important', важная: 'important', важное: 'important',
  обычно: 'normal', обычный: 'normal',
};

const PRIORITY_LABELS = { urgent: '🔴', important: '🟡', normal: '⚪' };

const MONTHS = { янв:1,фев:2,мар:3,апр:4,май:5,мая:5,июн:6,июл:7,авг:8,сен:9,окт:10,ноя:11,дек:12 };
const WEEKDAYS = { понедельник:1,вторник:2,среда:3,четверг:4,пятница:5,суббота:6,воскресенье:0 };

function fmt(d) { return d.toISOString().slice(0,10); }

function parseDate(str) {
  const today = new Date();
  const s = str.toLowerCase().replace(/[.,]/g, '');
  if (s === 'завтра') { const d = new Date(today); d.setDate(d.getDate()+1); return fmt(d); }
  if (s === 'послезавтра') { const d = new Date(today); d.setDate(d.getDate()+2); return fmt(d); }
  if (s === 'сегодня') return fmt(today);
  for (const [name, wd] of Object.entries(WEEKDAYS)) {
    if (s.startsWith(name.slice(0,4))) {
      const d = new Date(today);
      const diff = (wd - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      return fmt(d);
    }
  }
  const dotMatch = str.match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?$/);
  if (dotMatch) {
    const y = dotMatch[3] ? parseInt(dotMatch[3]) : today.getFullYear();
    return y + '-' + dotMatch[2].padStart(2,'0') + '-' + dotMatch[1].padStart(2,'0');
  }
  const ruMatch = str.match(/^(\d{1,2})\s+([а-яё]+)/i);
  if (ruMatch) {
    const month = MONTHS[ruMatch[2].toLowerCase().slice(0,3)];
    if (month) {
      const y = today.getFullYear();
      return y + '-' + String(month).padStart(2,'0') + '-' + ruMatch[1].padStart(2,'0');
    }
  }
  return null;
}

function dueDefault() {
  const d = new Date(); d.setDate(d.getDate()+7); return fmt(d);
}

function parseTaskText(raw) {
  let text = raw.trim();
  let priority = 'normal';
  let due = dueDefault();

  for (const [kw, val] of Object.entries(PRIORITY_MAP)) {
    const pattern = '(?:^|\s)' + kw + '(?:\s|$)';
    const re = new RegExp(pattern, 'i');
    if (re.test(text)) { priority = val; text = text.replace(re, ' ').trim(); break; }
  }

  text = text.replace(/\bв\s+\d{1,2}[:.]\d{2}\b/gi, '').trim();

  const datePatterns = [
    /до\s+(\d{1,2}\.\d{1,2}(?:\.\d{4})?)/i,
    /до\s+(\d{1,2}\s+[а-яё]+)/i,
    /до\s+(завтра|послезавтра|сегодня|понедельник|вторник|сред[ау]|четверг|пятниц[ау]|суббот[ау]|воскресень[ея])/i,
    /(?:^|\s)(\d{1,2}\.\d{1,2}(?:\.\d{4})?)(?:\s|$)/,
    /(?:^|\s)(завтра|послезавтра|сегодня)(?:\s|$)/i,
    /(?:^|\s)(понедельник|вторник|сред[ау]|четверг|пятниц[ау]|суббот[ау]|воскресень[ея])(?:\s|$)/i,
  ];
  for (const re of datePatterns) {
    const m = text.match(re);
    if (m) {
      const parsed = parseDate(m[1]);
      if (parsed) { due = parsed; text = text.replace(m[0], ' ').trim(); break; }
    }
  }

  text = text.replace(/\s{2,}/g, ' ').trim();
  return { title: text, priority, due };
}

async function createTask(titleRaw, dueOverride) {
  const { title, priority, due } = parseTaskText(titleRaw);
  const cards = await loadKey('cards');
  const arr = Array.isArray(cards) ? cards : [];
  const card = {
    id: nextId(arr),
    title,
    desc: '',
    status: 'todo',
    priority,
    due: dueOverride || due,
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
  const icon = overdue ? '🔴' : (c.status === 'in_progress' ? '🔄' : (PRIORITY_LABELS[c.priority] || '⚪'));
  const overdueFlag = overdue ? '‼ ' : '';
  const due = c.due ? (' · ' + overdueFlag + escMd(formatDate(c.due))) : '';
  return icon + ' \[' + c.id + '\] ' + escMd(c.title) + due;
}

function register(bot, isAllowed, deny) {

  bot.onText(/\/задача (.+)/, async (msg, match) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    try {
      const { title, priority, due } = parseTaskText(match[1]);
      if (!title) return bot.sendMessage(msg.chat.id, 'Укажи текст задачи\.',  { parse_mode: 'MarkdownV2' });
      const cards = await loadKey('cards');
      const arr = Array.isArray(cards) ? cards : [];
      const card = { id: nextId(arr), title, desc: '', status: 'todo', priority, due, notes: '', docs: 0, checklist: [], createdAt: todayStr() };
      arr.push(card);
      await saveKey('cards', arr);
      const prioText = priority !== 'normal' ? (' ' + PRIORITY_LABELS[priority]) : '';
      bot.sendMessage(msg.chat.id,
        '✅ *' + escMd(title) + '*' + prioText + '\n📅 ' + escMd(formatDate(due)),
        { parse_mode: 'MarkdownV2' });
    } catch(err) { console.error(err); bot.sendMessage(msg.chat.id, '❌ Ошибка\.', { parse_mode: 'MarkdownV2' }); }
  });

  bot.onText(/^\/задача$/, (msg) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    const lines = [
      '`/задача Текст \[приоритет\] \[срок\]`',
      '',
      '_Примеры:_',
      '`/задача Позвонить клиенту`',
      '`/задача Отправить КП срочно до 15\.06`',
      '`/задача Встреча важно до пятницы`',
    ];
    bot.sendMessage(msg.chat.id, lines.join('\n'), { parse_mode: 'MarkdownV2' });
  });

  bot.onText(/^\/задачи$/, async (msg) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    try {
      const cards = await loadKey('cards');
      const arr = Array.isArray(cards) ? cards : [];
      const active = arr
        .filter(c => c.status !== 'done')
        .sort((a,b) => {
          if (!a.due && !b.due) return 0;
          if (!a.due) return 1;
          if (!b.due) return -1;
          return a.due.localeCompare(b.due);
        });
      if (!active.length) return bot.sendMessage(msg.chat.id, '🎉 Нет активных задач');
      const text = active.map(c => formatCard(c)).join('\n');
      bot.sendMessage(msg.chat.id, text, { parse_mode: 'MarkdownV2' });
    } catch(err) { console.error(err); bot.sendMessage(msg.chat.id, '❌ Ошибка\.', { parse_mode: 'MarkdownV2' }); }
  });

  bot.onText(/\/готово (\d+)/, async (msg, match) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    try {
      const id = parseInt(match[1]);
      const cards = await loadKey('cards');
      const arr = Array.isArray(cards) ? cards : [];
      const card = arr.find(c => c.id === id);
      if (!card) return bot.sendMessage(msg.chat.id, '❓ Задача не найдена');
      card.status = 'done';
      await saveKey('cards', arr);
      bot.sendMessage(msg.chat.id, '✅ *' + escMd(card.title) + '*', { parse_mode: 'MarkdownV2' });
    } catch(err) { console.error(err); bot.sendMessage(msg.chat.id, '❌ Ошибка\.', { parse_mode: 'MarkdownV2' }); }
  });
}

module.exports = { register, createTask };
