

#### 1. Crea un usuario dedicado para NATS


```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin nats
sudo mkdir -p /etc/nats
sudo chown -R nats:nats /etc/nats
```

crear /var/lib/nats para datos o logs:

```bash
sudo mkdir -p /var/lib/nats
sudo chown -R nats:nats /var/lib/nats
```


### Configurar para iniciar con systemd

```bash
sudo nano /etc/systemd/system/nats.service
```

contenido del archivo

```conf
[Unit]
Description=NATS Server
After=network.target

[Service]
ExecStart=/usr/local/bin/nats-server -c /etc/nats/nats-server.conf
Restart=always
User=nobody
Group=nogroup

[Install]
WantedBy=multi-user.target

```

### Iniciar el servicio

```bash
sudo systemctl start nats
# Habilitar el inicio con el sistema
sudo systemctl enable nats
# Verificar el estado
sudo systemctl status nats
# Verificar el log
journalctl -u nats
```

### Ejecuar se cambia el archivo .service

```bash
sudo systemctl daemon-reload
```

