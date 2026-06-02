import paramiko, os

HOST = "89.22.231.102"
PASSWORD = os.environ["VPS_PASS"]

def run(client, cmd):
    _, stdout, stderr = client.exec_command(cmd, timeout=15)
    stdout.channel.recv_exit_status()
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    print(f"$ {cmd}")
    if out: print(out)
    if err: print("[err]", err)
    print()

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username="root", password=PASSWORD)

run(client, "systemctl is-active yasnost-api")
run(client, "journalctl -u yasnost-api -n 30 --no-pager")
run(client, "curl -s http://127.0.0.1:3001/api/health")
run(client, "curl -s -X PUT http://127.0.0.1:3001/api/cards -H 'Content-Type: application/json' -d '[]'")
run(client, "curl -s http://127.0.0.1:3001/api/cards")
run(client, "curl -sv http://89.22.231.102/api/health 2>&1 | tail -20")
run(client, "cat /etc/nginx/sites-available/yasnost")

client.close()
