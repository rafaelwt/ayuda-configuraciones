# Hillstone Secure Connect en CachyOS 

CachyOS (kernel 7.1.3-cachyos, Plasma 6 Wayland, fish shell) con `o_HillstoneSecureConnect_5.7.1.12488_ff64cf12.run`.

**El truco:** el instalador solo verifica que `/etc/os-release` diga Ubuntu ≥ 18.04 o CentOS ≥ 7. No hay incompatibilidad real — se disfraza el sistema, se instala, y se restaura. No hace falta instalar ninguna dependencia: el cliente trae todo lo que necesita.

---

## 1. Verificar descarga y dar permisos

```fish
cd ~/Downloads
md5sum o_HillstoneSecureConnect_5.7.1.12488_ff64cf12.run
# debe dar: bfc7a440fa1c952553e83cddba2fe0ab

chmod +x o_HillstoneSecureConnect_5.7.1.12488_ff64cf12.run
```

## 2. Snapshot (opcional pero recomendado)

```fish
sudo snapper create -d "Antes de Hillstone"
```

## 3. Respaldar os-release y disfrazarse de Ubuntu

```fish
sudo cp -a /etc/os-release /etc/os-release.bak

printf '%s\n' \
  'NAME="Ubuntu"' \
  'VERSION="22.04 LTS (Jammy Jellyfish)"' \
  'ID=ubuntu' \
  'ID_LIKE=debian' \
  'PRETTY_NAME="Ubuntu 22.04 LTS"' \
  'VERSION_ID="22.04"' \
  'VERSION_CODENAME=jammy' | sudo tee /etc/os-release > /dev/null
```

> Nota fish: no uses heredocs (`<< EOF`), fish no los soporta — por eso el `printf`.

## 4. Instalar

```fish
sudo env QT_QPA_PLATFORM=xcb ./o_HillstoneSecureConnect_5.7.1.12488_ff64cf12.run -v
```

- `QT_QPA_PLATFORM=xcb` → necesario en sesión Wayland (el cliente es Qt5, corre vía XWayland).
- `-v` → muestra debug; busca `productType: ubuntu` para confirmar que el disfraz pasó.

Se instala en `/opt/HillstoneSecureConnect` y termina con `Installer status: 0`.

## 5. Restaurar la identidad de CachyOS (¡no saltar!)

```fish
sudo mv /etc/os-release.bak /etc/os-release
cat /etc/os-release   # debe decir CachyOS
```

## 6. Verificar el servicio

```fish
sudo systemctl daemon-reload
systemctl status HillstoneSecureConnect.service   # debe estar active (running)
```

El instalador registra `HillstoneSecureConnect.service` habilitado (arranca en cada boot). Si prefieres arrancarlo solo cuando uses la VPN:

```fish
sudo systemctl disable HillstoneSecureConnect.service
sudo systemctl start HillstoneSecureConnect.service   # manual, antes de usar el cliente
```

## 7. Usar

En la app: **Add** → datos del servidor VPN → conectar. Comprobar túnel:

```fish
ip addr | grep -A3 -iE 'tun|vpn'
```

Para lanzar el cliente después (si el ícono del menú no abre en Wayland):

```fish
QT_QPA_PLATFORM=xcb /opt/HillstoneSecureConnect/bin/HillstoneSecureConnect
```

> Si el texto de los campos no se ve, salta a la sección 8.

---

## 8. Arreglar texto invisible (tema oscuro de Plasma)

**Síntoma:** la app abre bien, pero en los diálogos (p. ej. *Add Connection*) el texto de los campos no se ve a menos que lo selecciones — texto blanco sobre fondo blanco.

**Causa:** el cliente hereda la paleta oscura de KDE Plasma (`~/.config/kdeglobals`), pero dibuja sus campos con fondo blanco fijo. El `-style fusion` que ya trae el lanzador **no** basta, y renombrar `~/.config/Trolltech.conf` tampoco lo arregla (probado).

**Solución probada:** aislar la app de la configuración de tema del usuario con un `XDG_CONFIG_HOME` propio.

```fish
# 1. Crear directorio de config persistente (NO usar /tmp: se borra al reiniciar)
mkdir -p ~/.config-hillstone

# 2. Probar que se ve bien
env XDG_CONFIG_HOME=/home/linux/.config-hillstone /opt/HillstoneSecureConnect/bin/HillstoneSecureConnect -style fusion
```

**Hacerlo permanente** (lanzador propio, sin tocar el del sistema):

```fish
cp /usr/share/applications/HillstoneSecureConnect.desktop ~/.local/share/applications/
```

Editar la copia (`nano ~/.local/share/applications/HillstoneSecureConnect.desktop`) y reemplazar la línea `Exec=` por:

```
Exec=env XDG_CONFIG_HOME=/home/linux/.config-hillstone /opt/HillstoneSecureConnect/bin/HillstoneSecureConnect -style fusion
```

> Ajusta `/home/linux` a tu usuario real. El lanzador de `~/.local/share/applications/` tiene prioridad sobre el del sistema.

Después, cerrar cualquier instancia abierta de la app y refrescar el caché de lanzadores:

```fish
pkill -f HillstoneSecureConnect   # "Operation not permitted" en el PID del servicio root es normal, ignorar
update-desktop-database ~/.local/share/applications 2>/dev/null
kbuildsycoca6 2>/dev/null; or kbuildsycoca5 2>/dev/null
```

Si el menú sigue abriendo la versión con texto invisible, **reiniciar el PC** resuelve ambas cosas (instancias viejas + caché de Plasma).

**Verificar que el lanzador nuevo se está usando** (con la app abierta):

```fish
cat /proc/(pgrep -u $USER -f HillstoneSecureConnect | head -1)/environ | tr '\0' '\n' | grep XDG_CONFIG_HOME
```

Si devuelve la ruta, la app arrancó con la variable correcta.

> Nota: con `XDG_CONFIG_HOME` aislado, la app guarda sus ajustes en `~/.config-hillstone` en vez de `~/.config`. Las conexiones VPN se guardan aparte en `~/Documents/HillstoneSecureConnect`, así que no se pierden.

---

## Desinstalar / revertir

- Desinstalador propio: `/opt/HillstoneSecureConnect/MaintenanceTool`
- O revertir todo con el snapshot: `sudo snapper list` → `sudo snapper undochange NUMERO..0`