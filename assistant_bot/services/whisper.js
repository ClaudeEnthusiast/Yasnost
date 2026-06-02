const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const axios = require('axios');
const config = require('../config');

const execFileAsync = promisify(execFile);

let _openai = null;

function openai() {
  if (!_openai) {
    if (!config.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY не задан в .env');
    _openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  }
  return _openai;
}

async function downloadVoice(bot, fileId) {
  const fileInfo = await bot.getFile(fileId);
  const url = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${fileInfo.file_path}`;
  const outPath = path.join('/tmp', `voice_${fileId}.ogg`);

  const res = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(outPath, Buffer.from(res.data));
  return outPath;
}

async function convertToMp3(oggPath) {
  const mp3Path = oggPath.replace('.ogg', '.mp3');
  await execFileAsync('ffmpeg', [
    '-i', oggPath,
    '-ar', '16000',
    '-ac', '1',
    '-q:a', '3',
    mp3Path,
    '-y',
  ]);
  return mp3Path;
}

async function transcribe(filePath) {
  const res = await openai().audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: 'whisper-1',
    language: 'ru',
  });
  return res.text;
}

function cleanup(...paths) {
  paths.forEach((p) => {
    try {
      if (p && fs.existsSync(p)) fs.unlinkSync(p);
    } catch {}
  });
}

module.exports = { downloadVoice, convertToMp3, transcribe, cleanup };
