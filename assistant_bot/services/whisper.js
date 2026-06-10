// services/whisper.js
// Транскрипция через локальный self-hosted сервис faster-whisper (127.0.0.1:8001).
// Без внешних ключей. faster-whisper сам декодирует ogg/opus (через PyAV), ffmpeg не нужен.

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../config');

const WHISPER_URL = process.env.WHISPER_URL || 'http://127.0.0.1:8001';

async function downloadVoice(bot, fileId) {
  const fileInfo = await bot.getFile(fileId);
  const url = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${fileInfo.file_path}`;
  const outPath = path.join('/tmp', `voice_${fileId}.ogg`);
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(outPath, Buffer.from(res.data));
  return outPath;
}

async function transcribe(filePath) {
  const res = await axios.post(`${WHISPER_URL}/transcribe`, { path: filePath }, { timeout: 120000 });
  if (res.data && typeof res.data.text === 'string') return res.data.text;
  throw new Error((res.data && res.data.error) || 'whisper: пустой ответ');
}

async function whisperHealthy() {
  try {
    const r = await axios.get(`${WHISPER_URL}/health`, { timeout: 3000 });
    return !!(r.data && r.data.ok);
  } catch {
    return false;
  }
}

function cleanup(...paths) {
  paths.forEach((p) => {
    try { if (p && fs.existsSync(p)) fs.unlinkSync(p); } catch {}
  });
}

module.exports = { downloadVoice, transcribe, whisperHealthy, cleanup };
