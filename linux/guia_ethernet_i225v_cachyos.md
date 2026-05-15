# Guía: Fijar Intel I225-V a 100 Mbps en CachyOS/Linux

## Solución directa

```bash
# 1. Instalar ethtool
sudo pacman -S ethtool

# 2. Identificar tu interfaz de red
ip link

# 3. Ver conexiones de NetworkManager
nmcli connection show

# 4. Aplicar configuración persistente
# Reemplaza "Wired connection 1" por el nombre real de tu conexión
sudo nmcli connection modify "Wired connection 1" \
  802-3-ethernet.speed 100 \
  802-3-ethernet.duplex full \
  802-3-ethernet.auto-negotiate yes

# 5. Reiniciar la conexión
sudo nmcli connection down "Wired connection 1"
sudo nmcli connection up "Wired connection 1"
```

**Esta configuración es permanente**: se guarda en el perfil de NetworkManager y persiste después de reiniciar.

**Nota:** en este equipo se mantiene `auto-negotiate yes` porque con `autoneg off` la interfaz perdió el enlace físico.

---

## Verificar

```bash
sudo ethtool enp5s0
```

**Esperado:**

```text
Advertised link modes:  100baseT/Full
Speed: 100Mb/s
Duplex: Full
Auto-negotiation: on
Link detected: yes
```

---

## Cómo volver a automático

```bash
sudo nmcli connection modify "Wired connection 1" \
  802-3-ethernet.speed 0 \
  802-3-ethernet.duplex "" \
  802-3-ethernet.auto-negotiate yes

sudo nmcli connection down "Wired connection 1"
sudo nmcli connection up "Wired connection 1"
```

---

## Resumen técnico

- `ethtool` permite cambiar la velocidad en caliente, pero sus cambios se pierden al reiniciar.
- `NetworkManager` guarda la configuración en el perfil de red.
- En este caso, la configuración estable fue:
  - Velocidad: `100 Mbps`
  - Dúplex: `full`
  - Autonegociación: `yes`
- No se usó un servicio `systemd` porque NetworkManager es la forma más limpia de persistir esta configuración en CachyOS/KDE.
