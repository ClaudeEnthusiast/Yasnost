function escMd(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

function dueIn7Days() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

function nextId(arr) {
  if (!arr || arr.length === 0) return 1;
  return Math.max(...arr.map((x) => x.id || 0)) + 1;
}

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = { escMd, dueIn7Days, nextId, formatDate, todayStr };
