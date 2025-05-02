
# Guía de Configuración del Usuario `svcapps` para Producción

Esta guía explica cómo crear un usuario de sistema llamado `svcapps` para administrar aplicaciones personalizadas (Node.js, .NET Core, Go, etc.) de forma segura, incluyendo integración con PM2, Cockpit, acceso por SFTP y control limitado de servicios.

---

## ✅ 1. Crear el usuario `svcapps`

```bash
sudo adduser svcapps --gecos "Usuario para apps P@P" --disabled-password
sudo passwd svcapps
sudo chsh -s /bin/bash svcapps
```

- Esto crea `/home/svcapps` y le asigna el shell `/bin/bash`.
- Establece una contraseña segura cuando se solicite.

---

## ✅ 2. Crear estructura de carpetas por lenguaje

```bash
sudo mkdir -p /opt/apps/node_apps
sudo mkdir -p /opt/apps/core_apps
sudo mkdir -p /opt/apps/golang_apps
sudo chown -R svcapps:svcapps /opt/apps
```

---

## ✅ 3. Permitir uso restringido de `sudo` para servicios que empiecen con `app-`

Esto permite que `svcapps` use `systemctl` solo para sus propios servicios:

```bash
echo 'svcapps ALL=(ALL) NOPASSWD: /bin/systemctl start app-*, /bin/systemctl stop app-*, /bin/systemctl restart app-*' | sudo tee /etc/sudoers.d/svcapps-app > /dev/null
sudo chmod 440 /etc/sudoers.d/svcapps-app
```

---

## ✅ 4. Acceso a Cockpit

- Asegúrate de que el servicio `cockpit` esté instalado y activo.
- `svcapps` podrá iniciar sesión en https://<IP>:9090 con su contraseña.
- Cockpit respetará las reglas de `sudo` para limitar lo que puede hacer.

---

## ✅ 5. Acceso por SFTP (vía OpenSSH)

- Asegúrate de tener OpenSSH Server activo:
  
```bash
sudo systemctl enable ssh
sudo systemctl start ssh
```

- Luego puedes conectar por VPN + SFTP con:

```
sftp svcapps@<IP>
```

---

## ✅ 6. Buenas prácticas

- Crea nuevas carpetas como `svcapps` para evitar problemas de permisos.
  
```bash
sudo su - svcapps
mkdir /opt/apps/node_apps/pap-nueva
```

- Mantén el control de servicios aislado por prefijos (`pap-`).
- Revisa los logs de systemd y PM2 para monitorear tus apps.

---

## 📁 Estructura final esperada

```
/opt/apps/
├── node_apps/
│   └── pap-web/
├── core_apps/
│   └── pap-billing/
└── golang_apps/
    └── pap-parser/
```

---

© Rafael W.T. – Configuración profesional para entorno de producción
