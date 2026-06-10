// Новости ИИ из RSS/Atom-лент — без LLM и без платных API.
// Парсер нарочно минимальный (axios + regex): хватает для title/link/date.
const axios = require('axios');

const FEEDS = [
  { name: 'OpenAI', url: 'https://openai.com/news/rss.xml', cap: 3 },
  { name: 'Google DeepMind', url: 'https://deepmind.google/blog/rss.xml', cap: 3 },
  { name: 'The Verge · AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', cap: 3 },
  { name: 'Ars Technica · AI', url: 'https://arstechnica.com/ai/feed/', cap: 3 },
  { name: 'TechCrunch · AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', cap: 3 },
  { name: 'Hacker News 100+', url: 'https://hnrss.org/newest?points=100&count=50', cap: 4, aiOnly: true },
  { name: 'Хабр · ИИ', url: 'https://habr.com/ru/rss/hub/artificial_intelligence/articles/?fl=ru', cap: 2 },
  { name: 'Simon Willison', url: 'https://simonwillison.net/atom/everything/', cap: 2 },
];

const AI_RE = /\b(ai|ии|llm|llms|gpt[-\s]?\d*|claude|anthropic|openai|chatgpt|gemini|deepmind|mistral|llama|qwen|deepseek|grok|copilot|stable diffusion|midjourney|neural|machine learning|deep learning|language model|genai|agentic|inference|transformer)\b/i;

function decodeEntities(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function pick(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1] : '';
}

// Поддерживает RSS (<item>) и Atom (<entry>).
function parseFeed(xml) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const b of blocks) {
    const title = decodeEntities(pick(b, 'title'));
    let link = decodeEntities(pick(b, 'link'));
    if (!link) {
      const alt = b.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)
        || b.match(/<link[^>]*href=["']([^"']+)["']/i);
      link = alt ? decodeEntities(alt[1]) : '';
    }
    const dateRaw = pick(b, 'pubDate') || pick(b, 'published') || pick(b, 'updated') || pick(b, 'dc:date');
    const ts = Date.parse(decodeEntities(dateRaw)) || 0;
    if (title && link) items.push({ title, link, ts });
  }
  return items;
}

function normLink(url) {
  return String(url).replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase();
}

// Собирает свежие новости со всех лент.
// windowMs — насколько в прошлое смотрим; seen — Set нормализованных ссылок, которые уже слали.
async function collectNews({ windowMs = 24 * 3600 * 1000, seen = new Set(), totalCap = 14 } = {}) {
  const since = Date.now() - windowMs;
  const results = await Promise.allSettled(FEEDS.map(async (f) => {
    const res = await axios.get(f.url, {
      timeout: 20000,
      responseType: 'text',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; YasnostBot/1.0)' },
    });
    let items = parseFeed(String(res.data))
      .filter((it) => it.ts === 0 || it.ts >= since)
      .filter((it) => !seen.has(normLink(it.link)));
    if (f.aiOnly) items = items.filter((it) => AI_RE.test(it.title));
    items.sort((a, b) => b.ts - a.ts);
    return items.slice(0, f.cap).map((it) => ({ ...it, source: f.name }));
  }));

  const all = [];
  const dedupe = new Set();
  const errors = [];
  results.forEach((r, i) => {
    if (r.status !== 'fulfilled') { errors.push(FEEDS[i].name); return; }
    for (const it of r.value) {
      const key = normLink(it.link);
      if (dedupe.has(key)) continue;
      dedupe.add(key);
      all.push(it);
    }
  });
  return { items: all.slice(0, totalCap), errors };
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Telegram-HTML дайджест, сгруппированный по источникам.
function formatDigest(items, header) {
  const bySource = new Map();
  for (const it of items) {
    if (!bySource.has(it.source)) bySource.set(it.source, []);
    bySource.get(it.source).push(it);
  }
  const lines = [`🤖 <b>${escHtml(header)}</b>`];
  for (const [source, list] of bySource) {
    lines.push('');
    lines.push(`<b>${escHtml(source)}</b>`);
    for (const it of list) lines.push(`• <a href="${escHtml(it.link)}">${escHtml(it.title)}</a>`);
  }
  return lines.join('\n');
}

module.exports = { collectNews, formatDigest, normLink, FEEDS };
