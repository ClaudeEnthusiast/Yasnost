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

// Claude иногда оборачивает JSON в ```-блоки несмотря на инструкцию — снимаем.
function parseJson(text) {
  let t = String(text || '').trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  return JSON.parse(t);
}

// Разбор намерения из текста (для голосовых команд после транскрипции).
async function detectIntent(text) {
  const res = await client().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: `Ты роутер намерений личного ассистента. Отвечай ТОЛЬКО валидным JSON без markdown.
Намерения: task, expense, document, question.
Формат:
{ "intent": "task|expense|document|question",
  "extracted": {
    // task:     { "title": "...", "due": "YYYY-MM-DD или null" }
    // expense:  { "amount": число, "category": "...", "comment": "..." }
    // document: { "type": "kp|nda|contract", "description": "..." }
    // question: {}
  } }`,
    messages: [{ role: 'user', content: text }],
  });
  return parseJson(res.content[0].text);
}

async function generateDocument(type, description) {
  const typeNames = { kp: 'коммерческое предложение', nda: 'NDA', contract: 'договор' };
  const res = await client().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: `Ты юридический консультант (инвестиции в недвижимость).
Генерируй профессиональные документы на русском. Отвечай ТОЛЬКО валидным JSON без markdown.
Формат:
{ "title": "Заголовок", "subtitle": "Подзаголовок", "date": "дата прописью",
  "parties": "стороны сделки", "sections": [{ "heading": "Раздел", "text": "Текст..." }],
  "footer": "Реквизиты / подпись" }`,
    messages: [{ role: 'user', content: 'Создай ' + (typeNames[type] || 'документ') + ': ' + description }],
  });
  return parseJson(res.content[0].text);
}

async function generateWeeklyReport(data) {
  const res = await client().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: 'Ты личный бизнес-ассистент. Анализируй недельную активность. Пиши кратко на русском. Без markdown-заголовков, только текст с эмодзи.',
    messages: [{ role: 'user', content: 'Данные за неделю:\n\n' + JSON.stringify(data, null, 2) + '\n\nКраткий аналитический отчёт.' }],
  });
  return res.content[0].text;
}

async function answerQuestion(text) {
  const res = await client().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: 'Ты личный ассистент. Отвечай кратко на русском. Без markdown.',
    messages: [{ role: 'user', content: text }],
  });
  return res.content[0].text;
}

module.exports = { detectIntent, generateDocument, generateWeeklyReport, answerQuestion };
