// handlers/voice.js
// Голос → транскрипция (локальный faster-whisper) → разбор намерения (Claude) → действие.
// Транскрипция self-hosted (без внешних ключей). Для разбора намерения нужен ANTHROPIC_API_KEY.

const { detectIntent, answerQuestion } = require('../services/claude');
const { downloadVoice, transcribe, whisperHealthy, cleanup } = require('../services/whisper');
const { createTask } = require('./tasks');
const { recordVoiceExpense } = require('./budget');
const { generateAndSend } = require('./documents');
const { escHtml } = require('../utils');
const config = require('../config');

function register(bot, isAllowed, deny) {
  bot.on('message', async (msg) => {
    if (!msg.voice) return;
    if (!isAllowed(msg)) return deny(msg.chat.id);

    if (!config.ANTHROPIC_API_KEY) {
      return bot.sendMessage(msg.chat.id, '🎤 Нужен ANTHROPIC_API_KEY для разбора голосовой команды.');
    }
    if (!(await whisperHealthy())) {
      return bot.sendMessage(msg.chat.id, '🎤 Сервис распознавания недоступен (whisper-api). Попробуй позже.');
    }

    const status = await bot.sendMessage(msg.chat.id, '🎤 Обрабатываю...');
    let ogg;
    try {
      ogg = await downloadVoice(bot, msg.voice.file_id);
      const text = await transcribe(ogg);
      if (!text) {
        return bot.editMessageText('🎤 Не расслышал. Попробуй ещё раз.', { chat_id: msg.chat.id, message_id: status.message_id }).catch(() => {});
      }

      await bot.editMessageText('🎤 <i>' + escHtml(text) + '</i>', {
        chat_id: msg.chat.id, message_id: status.message_id, parse_mode: 'HTML',
      }).catch(() => {});

      const result = await detectIntent(text);
      const ex = result.extracted || {};

      switch (result.intent) {
        case 'task': {
          const card = await createTask(ex.title || text, ex.due || null);
          await bot.sendMessage(msg.chat.id, '✅ <b>' + escHtml(card.title) + '</b>', { parse_mode: 'HTML' });
          break;
        }
        case 'expense': {
          if (!ex.amount) { await bot.sendMessage(msg.chat.id, 'Не понял сумму. Например: «расход 500 такси».'); break; }
          try {
            const { tx } = await recordVoiceExpense(ex.amount, ex.category || ex.comment || 'Без категории', 'personal');
            await bot.sendMessage(msg.chat.id, '💸 <b>' + escHtml(String(tx.amount)) + ' ₽</b> — ' + escHtml(tx.category) + ' записано', { parse_mode: 'HTML' });
          } catch (e) {
            await bot.sendMessage(msg.chat.id, '⚠️ ' + e.message);
          }
          break;
        }
        case 'document': {
          await generateAndSend(bot, msg.chat.id, ex.type || 'contract', ex.description || text);
          break;
        }
        default: {
          const answer = await answerQuestion(text);
          await bot.sendMessage(msg.chat.id, answer);
        }
      }
    } catch (err) {
      console.error('Voice error:', err.message);
      await bot.sendMessage(msg.chat.id, '❌ Ошибка обработки голоса: ' + err.message);
    } finally {
      cleanup(ogg);
    }
  });
}

module.exports = { register };
