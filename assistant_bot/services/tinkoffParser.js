// services/tinkoffParser.js
// Чистый парсер выписки Тинькофф (CSV) — без Telegram, без БД, без знания бюджета.
// Раскладывает строки по смысловым корзинам. Решение «куда деть» (трата/конверт/бюджет)
// и дедуп — снаружи, в слое применения (нужен контекст бюджета).

// ---------- маппинг «Категория» Тинькофф -> категория бюджета ----------
// (категории должны совпадать с budgetCore.CATEGORIES)
const CATEGORY_MAP = {
  'супермаркеты': 'Еда', 'рестораны': 'Еда', 'фастфуд': 'Еда', 'кафе': 'Еда', 'кофейни': 'Еда',
  'заправки': 'Транспорт', 'транспорт': 'Транспорт', 'такси': 'Транспорт', 'автоуслуги': 'Транспорт', 'каршеринг': 'Транспорт',
  'связь': 'Связь', 'телеком': 'Связь',
  'жкх': 'Жильё/КУ', 'коммунальные платежи': 'Жильё/КУ', 'дом и ремонт': 'Жильё/КУ',
  'аптеки': 'Здоровье', 'здоровье': 'Здоровье', 'медицинские услуги': 'Здоровье', 'тренировки': 'Здоровье', 'красота': 'Здоровье',
  'развлечения': 'Развлечения', 'кино': 'Развлечения',
  'различные товары': 'Покупки', 'спорттовары': 'Покупки', 'одежда и обувь': 'Покупки',
  'фото и копицентры': 'Покупки', 'маркетплейсы': 'Покупки', 'электроника': 'Покупки', 'книги': 'Покупки', 'цветы': 'Покупки',
};

// подстраховка по MCC, когда «Категория» пустая или незнакомая
const MCC_MAP = {
  '5411': 'Еда', '5499': 'Еда', '5462': 'Еда', '5814': 'Еда', '5812': 'Еда', '5813': 'Еда',
  '5541': 'Транспорт', '5542': 'Транспорт', '4121': 'Транспорт', '7542': 'Транспорт', '7523': 'Транспорт',
  '4814': 'Связь', '4816': 'Связь', '4812': 'Связь',
  '7997': 'Здоровье', '8011': 'Здоровье', '8021': 'Здоровье', '5912': 'Здоровье',
  '5941': 'Покупки', '5651': 'Покупки', '5732': 'Покупки', '5999': 'Покупки', '5993': 'Покупки', '7338': 'Покупки', '5945': 'Покупки',
};

// движение между своими счетами / не-деньги — пропуск при любом знаке
const INTERNAL_PATTERNS = [
  /между своими счетами/i,
  /перевод для закрытия накопительн/i,
  /перевод с накопительного/i,
  /на накопительный счёт/i,
  /капитализац/i,
];
// внешнее пополнение карты реальными деньгами -> увеличить бюджет
const TOPUP_PATTERNS = [
  /пополнение через/i,
  /пополнение\.?\s*счёта/i,
  /внесение наличных/i,
];

function mapCategory(tinkoffCategory, mcc) {
  const key = String(tinkoffCategory || '').trim().toLowerCase();
  if (CATEGORY_MAP[key]) return CATEGORY_MAP[key];
  const m = MCC_MAP[String(mcc || '').trim()];
  if (m) return m;
  return 'Прочее';
}

// ---------- числа / даты Тинькофф ----------
function parseRuAmount(raw) {
  const cleaned = String(raw || '').replace(/[\s ]/g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}
function parseDateTime(raw) {
  const m = String(raw || '').trim().match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
  if (!m) return null;
  const [, dd, mm, yyyy, hh = '00', mi = '00', ss = '00'] = m;
  return { iso: `${yyyy}-${mm}-${dd}`, ts: `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}` };
}

// ---------- CSV ----------
function splitCsvLine(line, delimiter = ';') {
  const out = [];
  let field = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') { if (line[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === delimiter) { out.push(field); field = ''; }
    else field += ch;
  }
  out.push(field);
  return out;
}
function splitCsvRecords(text) {
  const records = [];
  let cur = '', inQuotes = false;
  const t = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch === '"') { inQuotes = !inQuotes; cur += ch; }
    else if (ch === '\n' && !inQuotes) { if (cur.trim() !== '') records.push(cur); cur = ''; }
    else cur += ch;
  }
  if (cur.trim() !== '') records.push(cur);
  return records;
}

const COLS = {
  datetime: ['дата операции'],
  status: ['статус'],
  amount: ['сумма операции'],
  category: ['категория'],
  mcc: ['mcc'],
  description: ['описание'],
};
function buildHeaderIndex(headerCells) {
  const norm = headerCells.map((h) => String(h || '').trim().toLowerCase());
  const idx = {};
  for (const [field, names] of Object.entries(COLS)) {
    idx[field] = norm.findIndex((h) => names.some((n) => h === n));
  }
  return idx;
}
const normText = (s) => String(s || '').trim().replace(/\s+/g, ' ');

// ---------- основной разбор ----------
// Возвращает корзины (суммы трат/переводов — положительные):
//   expenses:     [{key,date,ts,amount,tinkoffCategory,category,mcc,note}]  обычные покупки
//   transfersOut: [{key,date,ts,amount,note}]  исходящие переводы людям/орг — спросить
//   transfersIn:  [{key,date,ts,amount,note}]  входящие переводы от людей — спросить (доход?)
//   topups:       [{key,date,ts,amount,note}]  внешние пополнения — в бюджет
//   skipped:      [{ts,amount,note,reason}]    failed|internal|income|unparsable
function parse(text) {
  const records = splitCsvRecords(text);
  if (!records.length) return empty();
  const header = splitCsvLine(records[0]);
  const ix = buildHeaderIndex(header);
  for (const need of ['datetime', 'status', 'amount', 'description']) {
    if (ix[need] < 0) throw new Error(`CSV: не найдена колонка «${COLS[need][0]}». Это точно выписка Тинькофф?`);
  }

  const res = empty();
  res.meta = { rows: records.length - 1, header };

  for (let r = 1; r < records.length; r++) {
    const cells = splitCsvLine(records[r]);
    const get = (f) => (ix[f] >= 0 ? cells[ix[f]] : '');
    const dt = parseDateTime(get('datetime'));
    const amount = parseRuAmount(get('amount'));
    const note = normText(get('description'));
    const status = String(get('status') || '').trim().toUpperCase();
    const tinkoffCategory = String(get('category') || '').trim();
    const mcc = String(get('mcc') || '').trim();

    if (!dt || !Number.isFinite(amount)) { res.skipped.push({ ts: dt ? dt.ts : get('datetime'), amount, note, reason: 'unparsable' }); continue; }
    if (status && status !== 'OK') { res.skipped.push({ ts: dt.ts, amount, note, reason: 'failed' }); continue; }
    if (INTERNAL_PATTERNS.some((re) => re.test(note))) { res.skipped.push({ ts: dt.ts, amount, note, reason: 'internal' }); continue; }

    const positive = Math.round(Math.abs(amount) * 100) / 100;
    const key = `tinkoff:${dt.ts}|${amount}|${note}`;
    const base = { key, date: dt.iso, ts: dt.ts, amount: positive, note };
    const isTransfer = tinkoffCategory.toLowerCase() === 'переводы';

    if (amount >= 0) {
      // входящие деньги
      if (TOPUP_PATTERNS.some((re) => re.test(note))) res.topups.push(base);
      else if (isTransfer) res.transfersIn.push(base);
      else res.skipped.push({ ts: dt.ts, amount, note, reason: 'income' });
      continue;
    }

    // расход
    if (isTransfer) { res.transfersOut.push(base); continue; }
    res.expenses.push({ ...base, tinkoffCategory, mcc, category: mapCategory(tinkoffCategory, mcc) });
  }

  res.topups.sort((a, b) => b.amount - a.amount);
  return res;
}

function empty() {
  return { expenses: [], transfersOut: [], transfersIn: [], topups: [], skipped: [], meta: { rows: 0 } };
}

module.exports = { parse, mapCategory, parseRuAmount, parseDateTime, INTERNAL_PATTERNS, TOPUP_PATTERNS, CATEGORY_MAP, MCC_MAP };
