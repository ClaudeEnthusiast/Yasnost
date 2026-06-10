require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const { pool } = require('./db');

const tasks = require('./handlers/tasks');
const budget = require('./handlers/budget');
const documents = require('./handlers/documents');
const voice = require('./handlers/voice');
const brief = require('./handlers/brief');
const tinkoffImport = require('./handlers/tinkoffImport');
const news = require('./handlers/news');
const dailyBrief = require('./jobs/dailyBrief');
const weeklyReport = require('./jobs/weeklyReport');
const newsDigest = require('./jobs/newsDigest');

if (!config.BOT_TOKEN) { console.error('BOT_TOKEN'); process.exit(1); }
if (!config.TELEGRAM_USER_ID) { console.error('TELEGRAM_USER_ID'); process.exit(1); }

const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

function isAllowed(msg) {
  return msg.from && msg.from.id === config.TELEGRAM_USER_ID;
}
function deny(chatId) {
  bot.sendMessage(chatId, 'Нет доступа.');
}

bot.onText(/\/start/, (msg) => {
  if (!isAllowed(msg)) return deny(msg.chat.id);
  const text = [
    '<b>Личный Ассистент</b>',
    '',
    '<b>Задачи</b>',
    '/задача Текст [срочно|важно] [до 15.06]',
    '/задачи — активные',
    '/готово [id] — закрыть',
    '',
    '<b>Бюджет</b>',
    '/бюджет — статус и меню',
    '/расход 500 такси · /корп 2500 бензин',
    '/расходы · /отчёт · /копилка · /обязательные',
    '',
    '<b>Документы</b>',
    '/кп /нда /договор [описание]',
    '',
    '/бриф — сводка прямо сейчас',
    '/новости — ИИ-дайджест (авто: 9:05 и 21:00)',
  ].join('\n');
  bot.sendMessage(msg.chat.id, text, { parse_mode: 'HTML' });
});

tasks.register(bot, isAllowed, deny);
budget.register(bot, isAllowed, deny);
documents.register(bot, isAllowed, deny);
brief.register(bot, isAllowed, deny);
tinkoffImport.register(bot, isAllowed, deny);
news.register(bot, isAllowed, deny);
voice.register(bot, isAllowed, deny);

dailyBrief.init(bot);
weeklyReport.init(bot);
newsDigest.init(bot);

pool.connect()
  .then((client) => {
    client.release();
    console.log('PostgreSQL ok');
    console.log('User: ' + config.TELEGRAM_USER_ID);
    console.log('Claude: ' + (config.ANTHROPIC_API_KEY ? 'ok' : 'not set'));
    console.log('Whisper: self-hosted ' + (process.env.WHISPER_URL || 'http://127.0.0.1:8001'));
    console.log('Bot started.');
  })
  .catch((err) => { console.error('DB error:', err.message); process.exit(1); });
