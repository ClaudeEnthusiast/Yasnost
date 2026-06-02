import paramiko, os

HOST = "89.22.231.102"
PASSWORD = os.environ["VPS_PASS"]

NGINX_CONF = """\
server {
    listen 80;
    server_name _;
    root /var/www/yasnost;
    index index.html;

    location /api/ {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host      $host;
        proxy_set_header   X-Real-IP $remote_addr;
    }

    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
"""

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username="root", password=PASSWORD)

sftp = client.open_sftp()
with sftp.open("/etc/nginx/sites-available/yasnost", "w") as f:
    f.write(NGINX_CONF)
sftp.close()

_, stdout, stderr = client.exec_command("nginx -t && systemctl reload nginx")
stdout.channel.recv_exit_status()
print(stderr.read().decode().strip())

_, stdout, _ = client.exec_command("curl -s http://89.22.231.102/api/health")
stdout.channel.recv_exit_status()
print("health check:", stdout.read().decode().strip())

client.close()
print("nginx fix applied")
