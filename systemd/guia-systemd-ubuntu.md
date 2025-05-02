# 🛠️ Guía para crear servicios con `systemd` en Ubuntu

Esta guía explica cómo crear, habilitar y gestionar servicios en Ubuntu utilizando `systemd`. Ideal para ejecutar aplicaciones como servicios en segundo plano (Go, Node.js, Python, etc.).

---

## 📁 1. Ubicación de archivos de servicios

Crear directorio para servicios:

```bash
sudo mkdir -p /etc/systemd/system/
```

Crear directorioa para aplicaciones:

```bash
sudo mkdir -p /opt/<appname>/
```
Copiar binario:

```bash
sudo cp <appname> /opt/<appname>/
```

Asignar permisos y propietario:

```bash
# Asignar permisos de ejecución al archivo
sudo chmod 755 /opt/<appname>/<appname>

# Asignar permisos de acceso al directorio
sudo chmod 755 /opt/<appname>/

# Cambiar el propietario al usuario del servicio (ejemplo: linux:linux)
sudo chown <usuario>:<grupo> /opt/<appname>/<appname>
sudo chown <usuario>:<grupo> /opt/<appname>/
```





Los servicios personalizados se definen en:

```bash
/etc/systemd/system/
```

Cada servicio debe tener un archivo con extensión `.service`.

## ✏️ 2. Crear un nuevo servicio

Ejemplo: Supongamos que tienes un binario en `/opt/<appname>/<appname>`.

```bash
sudo nano /etc/systemd/system/<appname>.service
```

## 📄 3. Contenido del archivo de servicio



Para obtener la lista de usuarios y grupos puedes usar:

```bash
cat /etc/passwd
cat /etc/group
```

Para saber el usuario y grupo del sistema puedes usar:

```bash
whoami
groups
```

Para saber a que grupo pertenece el usuario puedes usar:

```bash
groups youruser
## o
id youruser
```

El archivo debe tener el siguiente contenido:

```bash
[Unit]
Description=<appname> Service
After=network.target

[Service]
Type=simple
ExecStart=/opt/<appname>/<appname>
WorkingDirectory=/opt/<appname>/
User=youruser
Group=youruser
LimitNOFILE=65536
StandardOutput=journal
StandardError=journal
SyslogIdentifier=<appname>
Restart=on-failure
RestartSec=5s
# StartLimitIntervalSec=60
StartLimitBurst=3

# Control de recursos (ajustable)
# MemoryMax=256M
# CPUQuota=50%

[Install]
WantedBy=multi-user.target

```

### 🔄 4. Habilitar y arrancar el servicio

```bash
# Recargar la configuración de systemd
sudo systemctl daemon-reexec
sudo systemctl daemon-reload

# Habilitar para que inicie al arrancar el sistema
sudo systemctl enable <appname>

# Iniciar el servicio
sudo systemctl start <appname>

```

⚙️ 5. Comandos útiles

```bash
# Ver el estado del servicio
sudo systemctl status <appname>

# Iniciar el servicio
sudo systemctl start <appname>

# Detener el servicio
sudo systemctl stop <appname>

# Reiniciar el servicio
sudo systemctl restart <appname>

# Ver logs del servicio
sudo journalctl -u <appname> -f

# Eliminar logs del servicio
sudo journalctl -u <appname> --vacuum-time=1s

```


🔁 6. Editar o actualizar el servicio

Si editas el archivo .service, debes recargar la configuración y reiniciar:
```bash
# Si editaste el archivo .service
sudo systemctl daemon-reload

# Reinicia el servicio para aplicar cambios
sudo systemctl restart <appname>
```


✅ 7. Actualizar tu aplicación (binario o código)

Si hiciste una nueva compilación de tu aplicación (por ejemplo un nuevo binario en /opt/<appname>/<appname>), sigue estos pasos:

```bash
# 1. Detener el servicio
sudo systemctl stop <appname>

# 2. Reemplazar el binario (ejemplo)
sudo cp <appname>_nuevo /opt/<appname>/<appname>
sudo chmod +x /opt/<appname>/<appname>

# 3. Reiniciar el servicio
sudo systemctl start <appname>

# 4. Verificar el estado
sudo systemctl status <appname>
```

Asegúrate de que el archivo tenga permisos de ejecución (chmod +x).


🧹 8. Eliminar completamente un servicio
Si ya no necesitas el servicio y quieres eliminarlo del sistema:

```bash
# 1. Detener el servicio
sudo systemctl stop <appname>

# 2. Deshabilitarlo para que no se inicie al arrancar
sudo systemctl disable <appname>

# 3. Eliminar el archivo del servicio
sudo rm /etc/systemd/system/<appname>.service

# 4. Recargar systemd para que olvide el servicio
sudo systemctl daemon-reload

# 5. (Opcional) Verifica que ya no aparece
sudo systemctl status <appname>

```

🔄 9. Verificar logs del servicio

```bash
sudo journalctl -u <appname> -f

# Borra logs con más de 7 días
sudo journalctl --vacuum-time=7d

# Borra logs con más de 12 horas
sudo journalctl --vacuum-time=12h

# Borra logs con más de 2 semanas
sudo journalctl --vacuum-time=2w

# Borra logs con más de 1 mes
sudo journalctl --vacuum-time=1month

# Borra logs anteriores al 1 de enero de 2025
sudo journalctl --vacuum-time="2025-01-01 00:00:00"

```

Formatos válidos para --vacuum-time

| Formato               | Significado                    | Ejemplo                               |
| --------------------- | ------------------------------ | ------------------------------------- |
| 'xs'                  | segundos atrás                 | `--vacuum-time=60s`                   |
| 'xm'                  | minutos atrás                  | `--vacuum-time=60m`                   |
| `Xh`                  | X horas atrás                  | `--vacuum-time=6h`                    |
| `Xd`                  | X días atrás                   | `--vacuum-time=7d`                    |
| `Xw`                  | X semanas atrás                | `--vacuum-time=2w`                    |
| `Xm`                  | X meses atrás                  | `--vacuum-time=1month`                |
| `Xy`                  | X años atrás                   | `--vacuum-time=1y`                    |
| `YYYY-MM-DD HH:MM:SS` | Fecha y hora exacta (ISO 8601) | `--vacuum-time="2024-12-31 23:59:59"` |
