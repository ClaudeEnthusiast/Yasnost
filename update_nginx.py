import paramiko, os

HOST = "89.22.231.102"
PASSWORD = os.environ["VPS_PASS"]

CONF = (
    "server {\n"
    "    listen 80;\n"
    "    server_name _;\n"
    "    root /var/www/yasnost;\n"
    "    index index.html;\n\n"
    "    location = /index.html {\n"
    "        add_header Cache-Control \"no-cache, no-store, must-revalidate\";\n"
    "        add_header Pragma \"no-cache\";\n"
    "        expires 0;\n"
    "    }\n\n"
    "    location /assets/ {\n"
    "        expires 1y;\n"
    "        add_header Cache-Control \"public, immutable\";\n"
    "    }\n\n"
    "    location / {\n"
    "        try_files $uri $uri/ /index.html;\n"
    "    }\n"
    "}\n"
)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username="root", password=PASSWORD)

sftp = client.open_sftp()
with sftp.open("/etc/nginx/sites-available/yasnost", "w") as f:
    f.write(CONF)
sftp.close()

_, stdout, stderr = client.exec_command("nginx -t && systemctl reload nginx")
out = stdout.read().decode().strip()
err = stderr.read().decode().strip()
if out: print(out)
if err: print(err)
print("nginx обновлён — index.html больше не кэшируется")
client.close()
