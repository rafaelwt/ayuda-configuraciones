### Crea carpetas necesarias
```bash 
sudo mkdir -p /opt/apps/app_name
sudo chmod -R 750 /opt/apps/app_name
``` 

### Crear un script para desplegar una aplicación web y reiniciar Nginx
```bash
sudo nano deploy_app.sh
```
### Ejemplo de script para desplegar una aplicación web y reiniciar Nginx

```bash

#!/bin/bash
set -e

SERVICE_NAME="app_name"
SRC="/home/ubuntu/ftp/uploads/dotnet/app_name"
DST="/opt/apps/app_name"

echo "🚀 Iniciando despliegue de $SERVICE_NAME..."

if systemctl is-active --quiet $SERVICE_NAME; then
  echo "⏹️ Deteniendo servicio $SERVICE_NAME..."
  sudo systemctl stop $SERVICE_NAME
else
  echo "ℹ️ El servicio $SERVICE_NAME no estaba en ejecución."
fi

echo "📦 Copiando archivos..."
sudo rsync -av --delete "$SRC/" "$DST/"

echo "🚀 Iniciando servicio $SERVICE_NAME..."
sudo systemctl start $SERVICE_NAME

echo "🔁 Verificando estado..."
sudo systemctl status $SERVICE_NAME --no-pager --lines=5

echo "✅ Despliegue completado con éxito."

```

### Darle permisos de ejecución
```bash
chmod +x deploy_app.sh
```
### verificar permisos
```bash
ls -l deploy_app.sh
```
### Ejecutar el script
```bash
./deploy_app.sh
```