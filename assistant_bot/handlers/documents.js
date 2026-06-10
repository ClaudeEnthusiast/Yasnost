const { generateDocument } = require('../services/claude');
const { buildDocument } = require('../services/docx');
const config = require('../config');

const TYPE_NAMES = { kp: 'КП', nda: 'NDA', contract: 'Договор' };

async function generateAndSend(bot, chatId, type, description) {
  if (!config.ANTHROPIC_API_KEY) {
    return bot.sendMessage(chatId, '⚠️ Генерация документов недоступна. Задай ANTHROPIC_API_KEY в .env');
  }

  const status = await bot.sendMessage(chatId, '⏳ Генерирую документ через Claude...');

  try {
    const docData = await generateDocument(type, description);
    const buffer = await buildDocument(docData);

    const prefix = TYPE_NAMES[type] || 'Документ';
    const today = new Date().toISOString().slice(0, 10);
    const filename = `${prefix}_${today}.docx`;

    await bot.deleteMessage(chatId, status.message_id).catch(() => {});
    await bot.sendDocument(
      chatId,
      buffer,
      {},
      {
        filename,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }
    );
  } catch (err) {
    console.error('Document generation error:', err);
    await bot.deleteMessage(chatId, status.message_id).catch(() => {});
    bot.sendMessage(chatId, `❌ Ошибка генерации: ${err.message}`);
  }
}

function register(bot, isAllowed, deny) {
  bot.onText(/\/кп (.+)/, async (msg, match) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    await generateAndSend(bot, msg.chat.id, 'kp', match[1].trim());
  });

  bot.onText(/^\/кп$/, (msg) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    bot.sendMessage(msg.chat.id, 'Опиши сделку:\n/кп Складское помещение 500м² в Химках, цена 15 млн');
  });

  bot.onText(/\/нда (.+)/, async (msg, match) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    await generateAndSend(bot, msg.chat.id, 'nda', match[1].trim());
  });

  bot.onText(/^\/нда$/, (msg) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    bot.sendMessage(msg.chat.id, 'Опиши стороны и предмет соглашения:\n/нда ООО Ромашка и ООО Партнёр, проект по реновации');
  });

  bot.onText(/\/договор (.+)/, async (msg, match) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    await generateAndSend(bot, msg.chat.id, 'contract', match[1].trim());
  });

  bot.onText(/^\/договор$/, (msg) => {
    if (!isAllowed(msg)) return deny(msg.chat.id);
    bot.sendMessage(msg.chat.id, 'Опиши условия договора:\n/договор Аренда офиса 200м², 3 года, 250 тыс/мес');
  });
}

module.exports = { register, generateAndSend };
