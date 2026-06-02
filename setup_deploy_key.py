import paramiko, os

HOST = "89.22.231.102"
PASSWORD = os.environ["VPS_PASS"]

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username="root", password=PASSWORD)

def run(cmd):
    _, out, err = client.exec_command(cmd)
    out.channel.recv_exit_status()
    return out.read().decode().strip()

# Генерируем deploy-ключ
run("ssh-keygen -t ed25519 -C 'github-actions-yasnost' -f /root/.ssh/deploy_key -N ''")

# Добавляем публичный ключ в authorized_keys
run("cat /root/.ssh/deploy_key.pub >> /root/.ssh/authorized_keys")
run("chmod 600 /root/.ssh/authorized_keys")

# Показываем приватный ключ — он пойдёт в GitHub Secrets
private_key = run("cat /root/.ssh/deploy_key")
print("\n" + "="*60)
print("ПРИВАТНЫЙ КЛЮЧ — скопируй целиком в GitHub Secret VPS_SSH_KEY:")
print("="*60)
print(private_key)
print("="*60 + "\n")

client.close()
