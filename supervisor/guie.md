### 🔍 1. Ubica el archivo supervisord.conf principal

```bash
sudo find / -name supervisord.conf
### o
sudo find / -name supervisord.conf 2>/dev/null

```
Rutas comunes:

- /etc/supervisor/supervisord.conf
- /etc/supervisord.conf
- /usr/local/etc/supervisord.conf

🛠 2. Verifica dónde se crean los archivos de servicios
Abre el archivo encontrado:
```bash
sudo nano /ruta/que/encontraste/supervisord.conf

```
Busca esta sección:

```bash
[include]
files = /etc/supervisor/conf.d/*.conf
```
✅ Nota: En esa ruta (/etc/supervisor/conf.d/) es donde debes crear un archivo .conf por cada servicio que quieras supervisar.


### 🛠 3. Comandos útiles de supervisorctl

```bash
# Ver estado de todos los procesos
sudo supervisorctl status

# Iniciar un servicio
sudo supervisorctl start [nombre_del_servicio]

# Detener un servicio
sudo supervisorctl stop [nombre_del_servicio]

# Reiniciar un servicio
sudo supervisorctl restart [nombre_del_servicio]

```

### 🔄 4. Si agregas o cambias un servicio

```bash
sudo supervisorctl reread     # Detecta nuevos archivos .conf
sudo supervisorctl update     # Aplica los nuevos cambios
sudo supervisorctl start [nombre_del_servicio]  # Si es nuevo

```

### 📄 5. Notas extra

- Los ejecutables deben estar en el directorio /opt/mi_app/app/
- Los logs se crean en el directorio /opt/mi_app/logs/
- El archivo core.conf debe estar en el directorio /etc/supervisor/conf.d/




