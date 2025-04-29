# Instalación y Configuración de Cockpit en Ubuntu 24.04

Cockpit es una interfaz web que permite gestionar servidores Linux de forma sencilla. A través de su panel, puedes supervisar el rendimiento del sistema, gestionar servicios, usuarios, almacenamiento, redes y más.

## Requisitos Previos

- Un servidor con Ubuntu 24.04.
- Acceso a una cuenta de usuario con privilegios de `sudo`.
- Opcional: Un dominio apuntando al servidor (por ejemplo, `cockpit.ejemplo.com`).

## Pasos de Instalación

### 1. Actualizar el Índice de Paquetes

```bash
sudo apt update
```

### 2. Instalar Cockpit

```bash
sudo apt install cockpit -y
```

### 3. Habilitar Cockpit para que Inicie al Arrancar

```bash
sudo systemctl enable cockpit.socket
```

### 4. Iniciar el Servicio de Cockpit

```bash
sudo systemctl start cockpit
```

### 5. Verificar el Estado del Servicio

```bash
sudo systemctl status cockpit
```

Deberías ver una salida indicando que el servicio está activo y en ejecución.

## Acceso a la Interfaz Web

Abre tu navegador y dirígete a:

```
https://<IP-del-servidor>:9090
```

> **Nota:** Es posible que recibas una advertencia de seguridad debido al certificado autofirmado. Puedes proceder de manera segura o configurar un certificado SSL válido (ver sección siguiente).

## Configurar SSL con Let's Encrypt (Opcional)

Para asegurar la conexión con un certificado válido:

1. Instala Certbot:

   ```bash
   sudo apt install certbot -y
   ```

2. Obtén y configura el certificado SSL:

   ```bash
   sudo certbot certonly --standalone -d cockpit.ejemplo.com
   ```

3. Crea un enlace simbólico al certificado para Cockpit:

   ```bash
   sudo ln -s /etc/letsencrypt/live/cockpit.ejemplo.com/fullchain.pem /etc/cockpit/ws-certs.d/0-cockpit.cert
   sudo ln -s /etc/letsencrypt/live/cockpit.ejemplo.com/privkey.pem /etc/cockpit/ws-certs.d/0-cockpit.key
   ```

4. Reinicia el servicio de Cockpit:

   ```bash
   sudo systemctl restart cockpit
   ```

## Crear un Usuario No Root para Acceder a Cockpit

Es recomendable utilizar un usuario con privilegios de `sudo` en lugar de `root`:

```bash
sudo adduser cockpit_admin
sudo usermod -aG sudo cockpit_admin
```

Luego, accede a la interfaz web con este usuario.

## Extensiones Adicionales

Para gestionar contenedores con Podman desde Cockpit:

```bash
sudo apt install cockpit-podman -y
```

## Recursos Adicionales

- [Documentación Oficial de Cockpit](https://cockpit-project.org/running)
- [Guía de Instalación en Vultr](https://docs.vultr.com/how-to-install-cockpit-on-ubuntu-24-04)

---

¡Con esto, tienes una guía completa para instalar y configurar Cockpit en Ubuntu 24.04!
