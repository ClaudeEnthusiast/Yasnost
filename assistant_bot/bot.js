require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const { pool } = require('./db');

const tasks = require('./handlers/tasks');
const budget = require('./handlers/budget');
const documents = require('./handlers/documents');
const voice = require('./handlers/voice');
const brief = require('./handlers/brief');
const dailyBrief = require('./jobs/dailyBrief');
const weeklyReport = require('./jobs/weeklyReport');

if (!config.BOT_TOKEN) { console.error('BOT_TOKEN не задан'); process.exit(1); }
if (!config.TELEGRAM_USER_ID) { console.error('TELEGRAM_USER_ID не задан'); process.exit(1); }

const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

function isAllowed(msg) {
  return msg.from && msg.from.id === config.TELEGRAM_USER_ID;
}

function deny(chatId) {
  bot.sendMessage(chatId, '⛔ Нет доступа.');
}

// /start
bot.onText(/\/start/, (msg) => {
  if (!isAllowed(msg)) return deny(msg.chat.id);
  bot.sendMessage(
    msg.chat.id,
    `👋 *Привет\\! Я твой личный ассистент\\.*\n\n` +
    `*📋 Задачи*\n` +
    `/задача \\[текст\\] — добавить\n` +
    `/задачи — активные задачи\n` +
    `/готово \\[id\\] — выполнена\n\n` +
    `*💸 Бюджет*\n` +
    `/расход \\[сумма\\] \\[комментарий\\]\n` +
    `/бюджет — расходы за месяц\n\n` +
    `*📄 Документы*\n` +
    `/кп \\[описание\\] — коммерческое предложение\n` +
    `/нда \\[описание\\] — NDA\n` +
    `/договор \\[описание\\] — договор\n\n` +
    `*📊 Сводки*\n` +
    `/бриф — сводка прямо сейчас\n\n` +
    `🎤 _Голосовое — автоматически пойму что нужно_`,
    { parse_mode: 'MarkdownV2' }
  );
});

// Регистрация хендлеров
tasks.register(bot, isAllowed, deny);
budget.register(bot, isAllowed, deny);
documents.register(bot, isAllowed, deny);
brief.register(bot, isAllowed, deny);
voice.register(bot, isAllowed, deny);  // голос — последним (слушает все message)

// Крон-задачи
dailyBrief.init(bot);
weeklyReport.init(bot);

// Старт
pool.connect()
  .then((client) => {
    client.release();
    console.log('✅ PostgreSQL подключён');
    console.log(`✅ Разрешённый пользователь: ${config.TELEGRAM_USER_ID}`);
    console.log(`✅ Claude API: ${config.ANTHROPIC_API_KEY ? 'подключён' : '⚠️  не задан'}`);
    console.log(`✅ Whisper: ${config.OPENAI_API_KEY ? 'подключён' : '⚠️  не задан'}`);
    console.log('🤖 Бот запущен. Ожидаю сообщений...');
  })
  .catch((err) => {
    console.error('❌ Ошибка подключения к PostgreSQL:', err.message);
    process.exit(1);
  });
