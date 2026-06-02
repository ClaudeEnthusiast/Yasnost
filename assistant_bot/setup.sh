#!/bin/bash
set -e

echo "=== Assistant Bot Setup ==="

# 1. Зависимости системы
echo "[1/4] Проверяю ffmpeg..."
if ! command -v ffmpeg &> /dev/null; then
  echo "Устанавливаю ffmpeg..."
  apt-get update -q && apt-get install -y ffmpeg
else
  echo "ffmpeg уже установлен"
fi

# 2. Node зависимости
echo "[2/4] npm install..."
npm install

# 3. Проверяю .env
if [ ! -f .env ]; then
  echo ""
  echo "⚠️  Файл .env не найден!"
  echo "Создаю из шаблона — заполни его вручную:"
  cp .env.example .env
  echo ""
  cat .env
  echo ""
  echo "Отредактируй: nano .env"
  echo "Затем запусти: npm start"
  exit 0
fi

# 4. Проверяю обязательные переменные
source .env
if [ -z "$BOT_TOKEN" ] || [ "$BOT_TOKEN" = "your_bot_token_from_BotFather" ]; then
  echo "❌ BOT_TOKEN не задан в .env"
  exit 1
fi
if [ -z "$TELEGRAM_USER_ID" ] || [ "$TELEGRAM_USER_ID" = "your_numeric_id" ]; then
  echo "❌ TELEGRAM_USER_ID не задан в .env"
  exit 1
fi

echo "[4/4] Запускаю бота..."
npm start
