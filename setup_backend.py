import paramiko, os, time

HOST = "89.22.231.102"
PASSWORD = os.environ["VPS_PASS"]

# ── Файлы для сервера ──────────────────────────────────────────────────────

PACKAGE_JSON = """{
  "name": "yasnost-api",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3"
  }
}
"""

SERVER_JS = r"""const express = require('express');
const { Pool }  = require('pg');

const app  = express();
app.use(express.json({ limit: '2mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Создаём таблицу при первом запуске
pool.query(`
  CREATE TABLE IF NOT EXISTS app_state (
    key        TEXT PRIMARY KEY,
    data       JSONB        NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )
`).then(() => console.log('DB table ready'));

// GET /api/cards — вернуть все карточки
app.get('/api/cards', async (req, res) => {
  try {
    const r = await pool.query("SELECT data FROM app_state WHERE key = 'cards'");
    res.json(r.rows[0]?.data ?? []);
  } catch (e) {
    console.error('GET /api/cards', e.message);
    res.status(500).json({ error: 'db_error' });
  }
});

// PUT /api/cards — сохранить весь массив карточек
app.put('/api/cards', async (req, res) => {
  try {
    const cards = req.body;
    if (!Array.isArray(cards)) return res.status(400).json({ error: 'expected array' });
    await pool.query(`
      INSERT INTO app_state (key, data, updated_at)
      VALUES ('cards', $1::jsonb, NOW())
      ON CONFLICT (key)
      DO UPDATE SET data = $1::jsonb, updated_at = NOW()
    `, [JSON.stringify(cards)]);
    res.json({ ok: true });
  } catch (e) {
    console.error('PUT /api/cards', e.message);
    res.status(500).json({ error: 'db_error' });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, '127.0.0.1', () => console.log(`Yasnost API :${PORT}`));
"""

SERVICE = """\
[Unit]
Description=Yasnost API
After=network.target postgresql.service

[Service]
Type=simple
WorkingDirectory=/opt/yasnost-api
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=3
Environment=DATABASE_URL=postgresql://yasnost:ysn_db_2026@localhost/yasnost
Environment=PORT=3001
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
"""

NGINX_CONF = """\
server {
    listen 80;
    server_name _;
    root /var/www/yasnost;
    index index.html;

    # API — проксируем на Node.js
    location /api/ {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host      $host;
        proxy_set_header   X-Real-IP $remote_addr;
    }

    # index.html — никогда не кэшировать
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }

    # assets — кэш 1 год (имя файла содержит хэш)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
"""

# ── Helpers ────────────────────────────────────────────────────────────────

def run(client, cmd, timeout=90):
    print(f"  $ {cmd[:90]}")
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    code = stdout.channel.recv_exit_status()
    out  = stdout.read().decode().strip()
    err  = stderr.read().decode().strip()
    if out: print(f"    {out[:300]}")
    if err and code != 0: print(f"    [err] {err[:300]}")
    return code

def write_file(sftp, path, content):
    with sftp.open(path, "w") as f:
        f.write(content)
    print(f"  wrote {path}")

# ── Main ───────────────────────────────────────────────────────────────────

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username="root", password=PASSWORD)
print("=== Подключились ===\n")

print("=== 1. PostgreSQL ===")
run(client, "apt-get install -y postgresql")
run(client, "systemctl start postgresql && systemctl enable postgresql")
run(client, "sudo -u postgres psql -c \"CREATE USER yasnost WITH PASSWORD 'ysn_db_2026';\" 2>/dev/null || true")
run(client, "sudo -u postgres psql -c \"CREATE DATABASE yasnost OWNER yasnost;\" 2>/dev/null || true")

print("\n=== 2. Node.js 20 ===")
run(client, "curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>&1 | tail -3", timeout=120)
run(client, "apt-get install -y nodejs", timeout=120)
run(client, "node -v && npm -v")

print("\n=== 3. API файлы ===")
run(client, "mkdir -p /opt/yasnost-api")
sftp = client.open_sftp()
write_file(sftp, "/opt/yasnost-api/package.json",                    PACKAGE_JSON)
write_file(sftp, "/opt/yasnost-api/server.js",                       SERVER_JS)
write_file(sftp, "/etc/systemd/system/yasnost-api.service",          SERVICE)
write_file(sftp, "/etc/nginx/sites-available/yasnost",               NGINX_CONF)
sftp.close()

print("\n=== 4. npm install ===")
run(client, "cd /opt/yasnost-api && npm install", timeout=120)

print("\n=== 5. Systemd ===")
run(client, "systemctl daemon-reload")
run(client, "systemctl enable yasnost-api")
run(client, "systemctl restart yasnost-api")

print("\n=== 6. nginx reload ===")
run(client, "nginx -t && systemctl reload nginx")

print("\n=== 7. Проверка ===")
time.sleep(3)
run(client, "systemctl is-active yasnost-api")
run(client, "curl -s http://127.0.0.1:3001/api/health")

print("\n=== Готово! Backend запущен ===")
client.close()
