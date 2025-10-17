### . Instala Fail2ban

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Configurar Fail2ban

# Copiar el archivo de configuración
```bash
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
```

# Editar el archivo de configuración
```bash
sudo nano /etc/fail2ban/jail.local
```

# Configurar las reglas de Fail2ban
```bash
[sshd]
enabled = true
port = ssh
maxretry = 3
# -1 para banear indefinidamente
bantime = 1h
findtime = 10m

```

# Reiniciar Fail2ban
```bash
sudo systemctl restart fail2ban
```

# Verificar el estado de Fail2ban
```bash
sudo systemctl status fail2ban
```

# Verificar los logs de Fail2ban
```bash
sudo tail -f /var/log/fail2ban.log
```

# verificar que esté funcionando correctamente:
```bash
sudo fail2ban-client status sshd
```

respuesta de ejemplo:
```bash
Status for the jail: sshd
|- Filter
|  |- Currently failed: 0
|  `- Total failed: 5
`- Actions
   |- Currently banned: 1
   `- Total banned: 1
```