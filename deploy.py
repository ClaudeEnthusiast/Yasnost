import paramiko
import os

HOST = "89.22.231.102"
USER = "root"
PASSWORD = os.environ.get("VPS_PASS") or input("Пароль VPS: ")
DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")
REMOTE_DIR = "/var/www/yasnost"

def run(client, cmd):
    print(f"  $ {cmd}")
    _, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(f"    {out}")
    if err: print(f"    [err] {err}")
    return out

print("=== Подключаемся к серверу ===")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD)
print("  Подключено!")

print("\n=== Создаём папку для сайта ===")
run(client, f"mkdir -p {REMOTE_DIR}")

print("\n=== Загружаем файлы (SFTP) ===")
sftp = client.open_sftp()
for root, dirs, files in os.walk(DIST_DIR):
    rel_root = os.path.relpath(root, DIST_DIR)
    remote_root = REMOTE_DIR if rel_root == "." else f"{REMOTE_DIR}/{rel_root.replace(os.sep, '/')}"
    try:
        sftp.mkdir(remote_root)
    except OSError:
        pass
    for file in files:
        local_path  = os.path.join(root, file)
        remote_path = f"{remote_root}/{file}"
        print(f"  → {remote_path}")
        sftp.put(local_path, remote_path)
sftp.close()
print("  Файлы загружены!")

# nginx конфиг НЕ перезаписываем — он уже содержит блок /api/
# Просто убеждаемся что symlink стоит и nginx запущен
print("\n=== nginx ===")
run(client, "rm -f /etc/nginx/sites-enabled/default")
run(client, "ln -sf /etc/nginx/sites-available/yasnost /etc/nginx/sites-enabled/yasnost")
run(client, "nginx -t && systemctl reload nginx")

print("\n=== Готово! ===")
print(f"  Открывай: http://{HOST}")
client.close()
