const whisper = require('../services/whisper');
const { detectIntent, answerQuestion } = require('../services/claude');
const { createTask } = require('./tasks');
const { addExpense, autoCategory } = require('./budget');
const { generateAndSend } = require('./documents');
const { escMd } = require('../utils');
const config = require('../config');

function register(bot, isAllowed, deny) {
  bot.on('message', async (msg) => {
    if (!msg.voice) return;
    if (!isAllowed(msg)) return deny(msg.chat.id);

    if (!config.OPENAI_API_KEY) {
      return bot.sendMessage(
        msg.chat.id,
        '⚠️ Голосовой ввод недоступен. Задай OPENAI_API_KEY в .env'
      );
    }

    const status = await bot.sendMessage(msg.chat.id, '🎤 Распознаю речь...');
    let oggPath, mp3Path;

    try {
      oggPath = await whisper.downloadVoice(bot, msg.voice.file_id);
      mp3Path = await whisper.convertToMp3(oggPath);
      const text = await whisper.transcribe(mp3Path);

      await bot.editMessageText(
        `🎤 _${escMd(text)}_`,
        { chat_id: msg.chat.id, message_id: status.message_id, parse_mode: 'MarkdownV2' }
      );

      // Without Claude — fallback to task creation
      if (!config.ANTHROPIC_API_KEY) {
        const card = await createTask(text);
        return bot.sendMessage(
          msg.chat.id,
          `✅ Создал задачу: *${escMd(card.title)}*`,
          { parse_mode: 'MarkdownV2' }
        );
      }

      const result = await detectIntent(text);

      switch (result.intent) {
        case 'task': {
          const { title, due } = result.extracted || {};
          const card = await createTask(title || text, due || null);
          bot.sendMessage(
            msg.chat.id,
            `✅ Задача: *${escMd(card.title)}*\n📅 Срок: ${escMd(card.due)}`,
            { parse_mode: 'MarkdownV2' }
          );
          break;
        }

        case 'expense': {
          const { amount, category, comment } = result.extracted || {};
          if (!amount) {
            bot.sendMessage(msg.chat.id, '❓ Не понял сумму. Попробуй: /расход 500 такси');
            break;
          }
          const tx = await addExpense(amount, category || autoCategory(comment), comment, 'voice');
          bot.sendMessage(
            msg.chat.id,
            `💸 *${escMd(String(tx.amount))} ₽* — ${escMd(tx.category)}`,
            { parse_mode: 'MarkdownV2' }
          );
          break;
        }

        case 'document': {
          const { type, description } = result.extracted || {};
          await generateAndSend(bot, msg.chat.id, type || 'contract', description || text);
          break;
        }

        default: {
          const answer = await answerQuestion(text);
          bot.sendMessage(msg.chat.id, answer);
          break;
        }
      }
    } catch (err) {
      console.error('Voice handler error:', err);
      bot.sendMessage(msg.chat.id, `❌ Ошибка: ${err.message}`);
    } finally {
      whisper.cleanup(oggPath, mp3Path);
    }
  });
}

module.exports = { register };
