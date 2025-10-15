
### Ejemplo de script para desplegar una aplicación web y reiniciar Nginx

```bash
#!/bin/bash
set -e
SRC="/home/ubuntu/ftp/uploads/front/vos"
DST="/var/www/vos"
echo "🚀 Deploy FRONT..."
sudo rsync -av --delete "$SRC/" "$DST/"
echo "✅ FRONT actualizado."
echo "🚀 Reiniciando Nginx...
sudo systemctl restart nginx
echo "✅ Nginx reiniciado."
```

### Darle permisos de ejecución

```bash 
chmod +x deploy_vos.sh
```
### verificar permisos
```bash
ls -l deploy_vos.sh
```
### Ejecutar el script
```bash
./deploy_vos.sh
```