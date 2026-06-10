// ИИ-дайджест: команда /новости + отправка по крону (см. jobs/newsDigest.js).
const { loadKey, saveKey } = require('../db');
const { collectNews, formatDigest, normLink } = require('../services/news');

const SEEN_KEY = 'news_seen';
const SEEN_CAP = 600;

async function loadSeen() {
  const data = await loadKey(SEEN_KEY);
  return Array.isArray(data) ? data : [];
}

async function saveSeen(list) {
  await saveKey(SEEN_KEY, list.slice(-SEEN_CAP));
}

function headerFor(now, label) {
  const d = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `ИИ-дайджест · ${label} ${dd}.${mm}`;
}

// Кроновая отправка: только непоказанное за окно, молчит если пусто.
async function sendNewsDigest(bot, chatId, label) {
  const seenList = await loadSeen();
  const seen = new Set(seenList);
  const { items, errors } = await collectNews({ windowMs: 24 * 3600 * 1000, seen });
  if (errors.length) console.warn('[news] недоступны:', errors.join(', '));
  if (items.length === 0) { console.log('[news] свежего нет, молчим'); return false; }
  const text = formatDigest(items, headerFor(new Date(), label));
  await bot.sendMessage(chatId, text, { parse_mode: 'HTML', disable_web_page_preview: true });
  await saveSeen(seenList.concat(items.map((it) => normLink(it.link))));
  return true;
}

function register(bot, isAllowed, deny) {
  bot.onText(/^\/(новости|news)\b/i, async (msg) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    const chatId = msg.chat.id;
    try {
      const sent = await sendNewsDigest(bot, chatId, 'сейчас');
      if (!sent) {
        // По команде показываем и уже виденное — пользователь явно попросил.
        const { items } = await collectNews({ windowMs: 24 * 3600 * 1000 });
        if (items.length === 0) return bot.sendMessage(chatId, 'За сутки ничего заметного не нашлось.');
        await bot.sendMessage(chatId, formatDigest(items, headerFor(new Date(), 'за 24 часа')),
          { parse_mode: 'HTML', disable_web_page_preview: true });
      }
    } catch (err) {
      console.error('[news] ошибка:', err.message);
      bot.sendMessage(chatId, 'Не получилось собрать новости: ' + err.message);
    }
  });
}

module.exports = { register, sendNewsDigest };
