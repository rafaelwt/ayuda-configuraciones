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

---

## Desinstalar / revertir

- Desinstalador propio: `/opt/HillstoneSecureConnect/MaintenanceTool`
- O revertir todo con el snapshot: `sudo snapper list` → `sudo snapper undochange NUMERO..0`

