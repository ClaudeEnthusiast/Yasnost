require('dotenv').config();

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  TELEGRAM_USER_ID: parseInt(process.env.TELEGRAM_USER_ID, 10),

  DB_HOST: process.env.DB_HOST || '/var/run/postgresql',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_NAME: process.env.DB_NAME || 'yasnost',
  DB_USER: process.env.DB_USER || 'yasnost',
  DB_PASSWORD: process.env.DB_PASSWORD || undefined,

  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || null,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || null,

  TIMEZONE: process.env.TIMEZONE || 'Europe/Moscow',
  DAILY_BRIEF_HOUR: process.env.DAILY_BRIEF_HOUR || '9',
  WEEKLY_REPORT_DAY: process.env.WEEKLY_REPORT_DAY || '0',
  WEEKLY_REPORT_HOUR: process.env.WEEKLY_REPORT_HOUR || '20',
};
