const cron = require('node-cron');
const config = require('../config');
const { sendNewsDigest } = require('../handlers/news');

// По умолчанию — каждый час. Переменные среды позволяют переопределить.
const HOURLY = process.env.NEWS_HOURLY_CRON || '0 * * * *';

function init(bot) {
  const run = async () => {
    const h = new Date().toLocaleString('en-US', { timeZone: config.TIMEZONE, hour: 'numeric', hour12: false });
    const label = h >= 6 && h < 12 ? 'утро' : h >= 12 && h < 18 ? 'день' : h >= 18 && h < 23 ? 'вечер' : 'ночь';
    console.log(`[cron] ИИ-дайджест (${label}) → отправка...`);
    try {
      await sendNewsDigest(bot, config.TELEGRAM_USER_ID, label);
    } catch (err) {
      console.error('[cron] Ошибка ИИ-дайджеста:', err.message);
    }
  };
  cron.schedule(HOURLY, run, { timezone: config.TIMEZONE });
  console.log(`📰 ИИ-дайджест: каждый час «${HOURLY}» (${config.TIMEZONE})`);
}

module.exports = { init };
