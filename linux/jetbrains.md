# Guía Moderna: Instalar IDEs de JetBrains en CachyOS / Arch Linux

Guía recomendada para instalar cualquier IDE de JetBrains descargado como `.tar.gz` en:

- CachyOS
- Arch Linux
- KDE Plasma 6
- Wayland/X11

Compatible con:
- DataGrip
- IntelliJ IDEA
- Rider
- GoLand
- WebStorm
- PyCharm
- CLion
- RustRover
- PhpStorm
- etc.

---

# Filosofía Correcta

La forma moderna y recomendada actualmente es:

- instalar en `/opt`
- usar launcher nativo ELF
- dejar que JetBrains cree el Desktop Entry
- NO usar launchers `.sh`
- NO crear `.desktop` manualmente

---

# Paso 1 — Descargar IDE

Descargar desde:

https://www.jetbrains.com/

Ejemplo:

```text
datagrip-2026.1.3.tar.gz
```

---

# Paso 2 — Extraer archivo

Ir a Downloads:

```bash
cd ~/Downloads
```

Extraer:

```bash
tar -xzf datagrip-2026.1.3.tar.gz
```

Verificar:

```bash
ls
```

Resultado esperado:

```text
DataGrip-2026.1.3
```

---

# Paso 3 — Mover a /opt

Mover carpeta:

```bash
sudo mv DataGrip-2026.1.3 /opt/datagrip
```

Resultado final:

```text
/opt/datagrip
```

---

# Paso 4 — Dar permisos al launcher nativo

```bash
chmod +x /opt/datagrip/bin/datagrip
```

---

# Paso 5 — Crear launcher CLI

Usar el launcher nativo ELF:

```bash
sudo ln -s /opt/datagrip/bin/datagrip /usr/local/bin/datagrip
```

---

# Paso 6 — Abrir IDE

Abrir desde terminal:

```bash
datagrip
```

---

# IMPORTANTE — Sobre CTRL+C

Si ejecutas:

```bash
datagrip
```

desde terminal y haces:

```text
CTRL + C
```

el IDE se cerrará.

Esto es comportamiento NORMAL en Linux porque el proceso está ligado al shell actual.

No es un error.

---

# Paso 7 — Crear Desktop Entry correctamente

Dentro del IDE ir a:

```text
⚙ Settings → Create Desktop Entry...
```

o:

```text
Tools → Create Desktop Entry...
```

---

# Configuración recomendada

Dejar desmarcado:

```text
Create the entry for all users
```

Presionar:

```text
OK
```

JetBrains creará automáticamente:

```text
~/.local/share/applications/jetbrains-datagrip.desktop
```

---

# Paso 8 — Corregir launcher moderno

JetBrains actualmente todavía genera:

```ini
Exec="/opt/datagrip/bin/datagrip.sh"
```

Eso produce warning moderno:

```text
The IDE seems to be launched with a script launcher
Please consider switching to a native launcher
```

---

# Solución correcta

Editar:

```bash
nano ~/.local/share/applications/jetbrains-datagrip.desktop
```

Buscar:

```ini
Exec="/opt/datagrip/bin/datagrip.sh" %f
```

Reemplazar por:

```ini
Exec="/opt/datagrip/bin/datagrip" %f
```

Guardar:
- CTRL + O
- Enter
- CTRL + X

---

# Paso 9 — Refrescar KDE Plasma

```bash
kbuildsycoca6 --noincremental
```

---

# Paso 10 — Verificar integración

Abrir menú KDE.

Buscar:

```text
DataGrip
```

Debe:
- aparecer correctamente
- abrir normal
- no mostrar warnings
- integrarse correctamente con Plasma

---

# Estructura Final Correcta

## Instalación

```text
/opt/datagrip
```

## Launcher CLI

```text
/usr/local/bin/datagrip
```

## Desktop Entry

```text
~/.local/share/applications/jetbrains-datagrip.desktop
```

---

# Ejemplo Final Correcto del Desktop Entry

```ini
[Desktop Entry]
Version=1.0
Type=Application
Name=DataGrip
Icon=/opt/datagrip/bin/datagrip.svg
Exec="/opt/datagrip/bin/datagrip" %f
Comment=IDE for Databases and SQL
Categories=Development;IDE;
Terminal=false
StartupWMClass=jetbrains-datagrip
StartupNotify=true
```

---

# Cómo actualizar el IDE

Descargar nueva versión.

Eliminar versión anterior:

```bash
sudo rm -rf /opt/datagrip
```

Mover nueva versión:

```bash
sudo mv DataGrip-2026.2 /opt/datagrip
```

No necesitas recrear:
- symlink
- desktop entry

porque apuntan a rutas fijas.

---

# Cómo desinstalar

```bash
sudo rm -rf /opt/datagrip
sudo rm /usr/local/bin/datagrip
rm ~/.local/share/applications/jetbrains-datagrip.desktop
```

---

# IDEs comunes

| IDE | Carpeta | Launcher |
|---|---|---|
| IntelliJ IDEA | `/opt/intellij` | `idea` |
| DataGrip | `/opt/datagrip` | `datagrip` |
| Rider | `/opt/rider` | `rider` |
| GoLand | `/opt/goland` | `goland` |
| WebStorm | `/opt/webstorm` | `webstorm` |
| PyCharm | `/opt/pycharm` | `pycharm` |
| CLion | `/opt/clion` | `clion` |

---

# Conclusión

La forma moderna y correcta actualmente es:

- instalar en `/opt`
- usar launcher nativo ELF
- dejar que JetBrains cree el Desktop Entry
- corregir `Exec=` al launcher nativo
- refrescar KDE Plasma

Con esto obtienes:
- integración limpia
- launcher CLI
- mejor compatibilidad Wayland
- menos warnings
- experiencia similar a Windows y macOS
