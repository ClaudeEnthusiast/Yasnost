const cron = require('node-cron');
const config = require('../config');
const { sendBrief } = require('../handlers/brief');

function init(bot) {
  const hour = config.DAILY_BRIEF_HOUR || '9';

  cron.schedule(
    `0 ${hour} * * *`,
    async () => {
      console.log(`[cron] Дейли-бриф → отправка...`);
      try {
        await sendBrief(bot, config.TELEGRAM_USER_ID);
      } catch (err) {
        console.error('[cron] Ошибка дейли-брифа:', err.message);
      }
    },
    { timezone: config.TIMEZONE }
  );

  console.log(`📅 Дейли-бриф: каждый день в ${hour}:00 (${config.TIMEZONE})`);
}

module.exports = { init };
