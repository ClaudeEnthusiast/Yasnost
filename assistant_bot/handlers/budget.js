const { loadKey, saveKey } = require('../db');
const { escMd, nextId, todayStr } = require('../utils');

const CATEGORY_MAP = {
  'еда': ['еда', 'обед', 'ужин', 'завтрак', 'кафе', 'ресторан', 'кофе', 'продукты', 'магазин', 'lunch', 'dinner'],
  'транспорт': ['такси', 'метро', 'автобус', 'uber', 'бензин', 'парковка', 'транспорт', 'поезд'],
  'связь': ['телефон', 'интернет', 'связь', 'мобильный', 'симка'],
  'офис': ['офис', 'канцелярия', 'печать', 'бумага', 'картридж'],
  'жильё': ['аренда', 'квартира', 'коммунальные', 'жкх', 'ипотека'],
  'здоровье': ['аптека', 'врач', 'клиника', 'лекарства', 'спорт', 'фитнес'],
  'развлечения': ['кино', 'театр', 'клуб', 'концерт', 'игры'],
};

function autoCategory(comment) {
  if (!comment) return 'прочее';
  const lower = comment.toLowerCase();
  for (const [cat, words] of Object.entries(CATEGORY_MAP)) {
    if (words.some((w) => lower.includes(w))) return cat;
  }
  return 'прочее';
}

async function addExpense(amount, category, comment, source = 'text') {
  const data = await loadKey('transactions');
  const arr = Array.isArray(data) ? data : [];
  const tx = {
    id: nextId(arr),
    date: todayStr(),
    amount: Math.round(parseFloat(amount) * 100) / 100,
    category: category || autoCategory(comment),
    comment: comment || '',
    source,
  };
  arr.push(tx);
  await saveKey('transactions', arr);
  return tx;
}

function register(bot, isAllowed, deny) {
  // /расход 500 такси до аэропорта
  bot.onText(/\/расход (\d+(?:[.,]\d+)?)\s*(.*)?/, async (msg, match) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    const amount = parseFloat(match[1].replace(',', '.'));
    const comment = (match[2] || '').trim();

    try {
      const tx = await addExpense(amount, autoCategory(comment), comment);
      bot.sendMessage(
        msg.chat.id,
        `💸 *${escMd(amount.toLocaleString('ru-RU'))} ₽* записано\\!\n` +
        `📂 ${escMd(tx.category)}${comment ? `\n💬 ${escMd(comment)}` : ''}`,
        { parse_mode: 'MarkdownV2' }
      );
    } catch (err) {
      console.error(err);
      bot.sendMessage(msg.chat.id, '❌ Ошибка при записи расхода.');
    }
  });

  // /расход без аргументов
  bot.onText(/^\/расход$/, (msg) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    bot.sendMessage(msg.chat.id, 'Укажи сумму:\n/расход 500 такси до аэропорта');
  });

  // /бюджет
  bot.onText(/\/бюджет/, async (msg) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    try {
      const data = await loadKey('transactions');
      const arr = Array.isArray(data) ? data : [];

      const now = new Date();
      const monthStr = now.toISOString().slice(0, 7);
      const monthTx = arr.filter((t) => t.date && t.date.startsWith(monthStr));

      if (monthTx.length === 0) {
        return bot.sendMessage(msg.chat.id, '💼 Расходов за этот месяц нет\\.', { parse_mode: 'MarkdownV2' });
      }

      const total = monthTx.reduce((s, t) => s + t.amount, 0);
      const byCat = {};
      monthTx.forEach((t) => {
        byCat[t.category] = (byCat[t.category] || 0) + t.amount;
      });

      const monthName = now.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
      let text = `💼 *Расходы: ${escMd(monthName)}*\n\n`;
      text += `💰 Итого: *${escMd(total.toLocaleString('ru-RU'))} ₽*\n\n`;

      Object.entries(byCat)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, sum]) => {
          const bar = '█'.repeat(Math.round((sum / total) * 10));
          text += `${escMd(bar)} ${escMd(cat)}: ${escMd(sum.toLocaleString('ru-RU'))} ₽\n`;
        });

      text += `\n_Транзакций: ${monthTx.length}_`;
      bot.sendMessage(msg.chat.id, text, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(err);
      bot.sendMessage(msg.chat.id, '❌ Ошибка при загрузке бюджета.');
    }
  });
}

module.exports = { register, addExpense, autoCategory };
