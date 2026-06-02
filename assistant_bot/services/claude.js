const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

let _client = null;

function client() {
  if (!_client) {
    if (!config.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY не задан в .env');
    _client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
  }
  return _client;
}

async function detectIntent(text) {
  const res = await client().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: `Ты роутер намерений для личного ассистента. Отвечай ТОЛЬКО валидным JSON без markdown-обёртки.

Намерения:
- task: создать задачу/напоминание/дело
- expense: записать расход/трату/покупку/оплату
- document: создать КП/NDA/договор
- question: всё остальное

Формат ответа:
{
  "intent": "task|expense|document|question",
  "extracted": {
    // task: { "title": "...", "due": "YYYY-MM-DD или null" }
    // expense: { "amount": число, "category": "...", "comment": "..." }
    // document: { "type": "kp|nda|contract", "description": "..." }
    // question: {}
  }
}`,
    messages: [{ role: 'user', content: text }],
  });

  const raw = res.content[0].text.trim();
  return JSON.parse(raw);
}

async function generateDocument(type, description) {
  const typeNames = {
    kp: 'коммерческое предложение',
    nda: 'NDA (соглашение о неразглашении)',
    contract: 'договор',
  };

  const res = await client().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: `Ты юридический консультант компании М.К ИНВЕСТ (инвестиции в недвижимость и активы).
Генерируй профессиональные деловые документы на русском языке.
Отвечай ТОЛЬКО валидным JSON без markdown-обёртки.

Формат:
{
  "title": "Заголовок",
  "subtitle": "Подзаголовок",
  "date": "дата прописью",
  "parties": "стороны сделки (если применимо)",
  "sections": [
    { "heading": "Название раздела", "text": "Текст раздела..." }
  ],
  "footer": "Реквизиты / подпись"
}`,
    messages: [{
      role: 'user',
      content: `Создай ${typeNames[type] || 'документ'}: ${description}`,
    }],
  });

  return JSON.parse(res.content[0].text.trim());
}

async function generateWeeklyReport(data) {
  const res = await client().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `Ты личный бизнес-ассистент. Анализируй недельную активность.
Пиши кратко и по делу на русском. Выдели главное, укажи риски, дай 1-2 рекомендации.
Не используй markdown-заголовки — только обычный текст с эмодзи.`,
    messages: [{
      role: 'user',
      content: `Данные за неделю:\n\n${JSON.stringify(data, null, 2)}\n\nСоставь краткий аналитический отчёт.`,
    }],
  });

  return res.content[0].text;
}

async function answerQuestion(text) {
  const res = await client().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: 'Ты личный ассистент. Отвечай кратко и по делу на русском языке. Не используй markdown.',
    messages: [{ role: 'user', content: text }],
  });

  return res.content[0].text;
}

module.exports = { detectIntent, generateDocument, generateWeeklyReport, answerQuestion };
