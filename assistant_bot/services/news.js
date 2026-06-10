// Новости ИИ на русском — без LLM и без платных API.
// Источник — Google News RSS (hl=ru): выдаёт русскоязычные заголовки по запросу,
// включая новости про Claude/Anthropic из первых рук (Хабр, 3DNews, Код Дурова и т.п.).
const axios = require('axios');

// Каждая секция — это поисковый запрос Google News. Порядок = порядок в дайджесте.
// `when` — окно свежести Google News (Nd = N дней). `cap` — макс. новостей в секции.
const SECTIONS = [
  { label: '🔵 Claude · Anthropic', q: 'Anthropic OR Claude', when: '4d', cap: 5, pinned: true },
  { label: 'OpenAI · ChatGPT',       q: 'OpenAI OR ChatGPT',   when: '2d', cap: 3 },
  { label: 'Gemini · Google · DeepMind', q: 'Gemini OR DeepMind OR "Google AI"', when: '2d', cap: 3 },
  { label: 'ИИ — главное',           q: '"искусственный интеллект" OR нейросети', when: '1d', cap: 3 },
];

// Прямая лента Хабра по ИИ (русская, без Google News) — для глубины.
const DIRECT_FEEDS = [
  { label: 'Хабр · ИИ', url: 'https://habr.com/ru/rss/hub/artificial_intelligence/articles/?fl=ru', cap: 2 },
];

function gnewsUrl(q, when) {
  const query = encodeURIComponent(`${q} when:${when}`);
  return `https://news.google.com/rss/search?q=${query}&hl=ru&gl=RU&ceid=RU:ru`;
}

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

// RSS (<item>) и Atom (<entry>).
function parseFeed(xml) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const b of blocks) {
    const rawTitle = decodeEntities(pick(b, 'title'));
    let link = decodeEntities(pick(b, 'link'));
    if (!link) {
      const alt = b.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)
        || b.match(/<link[^>]*href=["']([^"']+)["']/i);
      link = alt ? decodeEntities(alt[1]) : '';
    }
    const dateRaw = pick(b, 'pubDate') || pick(b, 'published') || pick(b, 'updated') || pick(b, 'dc:date');
    const ts = Date.parse(decodeEntities(dateRaw)) || 0;
    if (rawTitle && link) items.push({ rawTitle, link, ts });
  }
  return items;
}

// Google News отдаёт заголовок в виде «Заголовок - Издание». Отделяем издание.
function splitTitle(rawTitle) {
  const idx = rawTitle.lastIndexOf(' - ');
  if (idx > 0 && idx > rawTitle.length - 60) {
    return { title: rawTitle.slice(0, idx).trim(), pub: rawTitle.slice(idx + 3).trim() };
  }
  return { title: rawTitle, pub: '' };
}

function normTitle(t) {
  return String(t).toLowerCase().replace(/[«»"'`.,!?:;()\-—\s]+/g, ' ').trim();
}

// Собирает русскоязычные новости. seen — Set нормализованных заголовков, что уже слали.
async function collectNews({ windowMs = 26 * 3600 * 1000, seen = new Set(), totalCap = 16 } = {}) {
  const since = Date.now() - windowMs;
  const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; YasnostBot/1.0)' };

  const tasks = [
    ...SECTIONS.map((s) => ({ ...s, url: gnewsUrl(s.q, s.when) })),
    ...DIRECT_FEEDS,
  ];

  const results = await Promise.allSettled(tasks.map(async (t) => {
    const res = await axios.get(t.url, { timeout: 20000, responseType: 'text', headers });
    const parsed = parseFeed(String(res.data))
      .filter((it) => it.ts === 0 || it.ts >= since)
      .map((it) => ({ ...it, ...splitTitle(it.rawTitle) }))
      .filter((it) => it.title && !seen.has(normTitle(it.title)));
    parsed.sort((a, b) => b.ts - a.ts);
    return parsed.slice(0, t.cap).map((it) => ({ title: it.title, pub: it.pub, link: it.link, ts: it.ts, source: t.label }));
  }));

  const out = [];
  const dedupe = new Set();
  const errors = [];
  results.forEach((r, i) => {
    if (r.status !== 'fulfilled') { errors.push(tasks[i].label); return; }
    for (const it of r.value) {
      const key = normTitle(it.title);
      if (dedupe.has(key)) continue;
      dedupe.add(key);
      out.push(it);
    }
  });
  return { items: out.slice(0, totalCap), errors };
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Telegram-HTML дайджест, сгруппированный по секциям (порядок секций сохраняется).
function formatDigest(items, header) {
  const order = [...SECTIONS.map((s) => s.label), ...DIRECT_FEEDS.map((f) => f.label)];
  const bySource = new Map();
  for (const it of items) {
    if (!bySource.has(it.source)) bySource.set(it.source, []);
    bySource.get(it.source).push(it);
  }
  const lines = [`🤖 <b>${escHtml(header)}</b>`];
  for (const label of order) {
    const list = bySource.get(label);
    if (!list || !list.length) continue;
    lines.push('');
    lines.push(`<b>${escHtml(label)}</b>`);
    for (const it of list) {
      const pub = it.pub ? ` <i>— ${escHtml(it.pub)}</i>` : '';
      lines.push(`• <a href="${escHtml(it.link)}">${escHtml(it.title)}</a>${pub}`);
    }
  }
  return lines.join('\n');
}

module.exports = { collectNews, formatDigest, normTitle, SECTIONS };
