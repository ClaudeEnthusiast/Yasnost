import paramiko, os

HOST = "89.22.231.102"
PASSWORD = os.environ["VPS_PASS"]

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username="root", password=PASSWORD)

def run(cmd):
    _, out, _ = client.exec_command(cmd)
    out.channel.recv_exit_status()
    return out.read().decode().strip()

# Если ключ уже есть — просто читаем, иначе генерируем
existing = run("cat /root/.ssh/deploy_key 2>/dev/null")
if not existing:
    run("ssh-keygen -t ed25519 -C 'github-actions-yasnost' -f /root/.ssh/deploy_key -N ''")
    run("cat /root/.ssh/deploy_key.pub >> /root/.ssh/authorized_keys")
    run("chmod 600 /root/.ssh/authorized_keys")
    key = run("cat /root/.ssh/deploy_key")
else:
    key = existing

print(key)
client.close()
