### Instalar Nats

```bash
curl -sf https://binaries.nats.dev/nats-io/nats-server/v2@v2.10.20 | sh
```

### Mover el binario a un directorio del PATH

```bash
sudo mv <path_descarga> /usr/local/bin/
```

### Agregar el path a la variable de entorno

Se debe agregar si no reconoce el comando `nats-server`

```bash
echo 'export PATH=$PATH:/usr/local/bin' >> ~/.bashrc
source ~/.bashrc
```

### Ejecuta el servidor

Ahora deberías poder ejecutar el servidor desde cualquier lugar con:

```bash
# Esto debería mostrar la versión instalada.
nats-server -v
# Iniciar el servidor
nats-server
```

### Instalar nats cli

```bash
curl -sf https://binaries.nats.dev/nats-io/natscli/nats@latest | sh
```

Copiar o mover a un directorio del PATH

```bash
sudo mv <path_descarga> /usr/local/bin/
```

### Archivo de congifuración

```bash
sudo nano /etc/nats/nats.conf
```

```conf
# Archivo de configuración de nats
# Configuración del puerto de escucha
listen: 0.0.0.0:4222

# Puerto del panel HTTP para monitoreo
http_port: 8222

# Configuración de usuarios (opcional)
authorization {
  users = [
    { user: "admin", password: "admin123" }
  ]
}

# Configuración de JetStream (opcional)
jetstream: true
```

### Verifivar la configuración antes de iniciar el servidor

```bash
nats-server -t -c /etc/nats/nats.conf
```

### Iniciar el servidor con el archivo de configuración

```bash
nats-server -c /etc/nats/nats.conf
```
