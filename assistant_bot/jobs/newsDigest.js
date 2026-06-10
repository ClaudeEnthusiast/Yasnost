const cron = require('node-cron');
const config = require('../config');
const { sendNewsDigest } = require('../handlers/news');

// Утро 9:05 (после дейли-брифа в 9:00) и вечер 21:00 МСК.
const MORNING = process.env.NEWS_MORNING_CRON || '5 9 * * *';
const EVENING = process.env.NEWS_EVENING_CRON || '0 21 * * *';

function init(bot) {
  const run = (label) => async () => {
    console.log(`[cron] ИИ-дайджест (${label}) → отправка...`);
    try {
      await sendNewsDigest(bot, config.TELEGRAM_USER_ID, label);
    } catch (err) {
      console.error('[cron] Ошибка ИИ-дайджеста:', err.message);
    }
  };
  cron.schedule(MORNING, run('утро'), { timezone: config.TIMEZONE });
  cron.schedule(EVENING, run('вечер'), { timezone: config.TIMEZONE });
  console.log(`📰 ИИ-дайджест: утро «${MORNING}», вечер «${EVENING}» (${config.TIMEZONE})`);
}

module.exports = { init };
