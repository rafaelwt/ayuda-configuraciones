# Crear opción “Open With Warp” en Dolphin KDE Plasma 6

Esta guía agrega una opción personalizada al menú contextual de Dolphin para abrir carpetas directamente en Warp Terminal, similar a “Open in Terminal” de Windows 11.

Compatible con:
- KDE Plasma 6
- Dolphin
- Warp Terminal en Arch Linux / CachyOS

---

# 1. Crear la carpeta de servicemenus

```bash
mkdir -p ~/.local/share/kio/servicemenus
```

Verificar:

```bash
ls -ld ~/.local/share/kio/servicemenus
```

---

# 2. Crear el archivo del menú contextual

```bash
nano ~/.local/share/kio/servicemenus/open-with-warp.desktop
```

---

# 3. Pegar la configuración

```ini
[Desktop Entry]
Type=Service
MimeType=inode/directory;
Actions=openWarpHere

[Desktop Action openWarpHere]
Name=Open With Warp
Icon=utilities-terminal
Exec=warp-terminal "file://%f"
```

---

# 4. Dar permisos de ejecución

```bash
chmod +x ~/.local/share/kio/servicemenus/open-with-warp.desktop
```

---

# 5. Reconstruir caché de KDE Plasma 6

```bash
kbuildsycoca6
```

---

# 6. Reiniciar Dolphin

```bash
killall dolphin && dolphin &
```

---

# Resultado esperado

Ahora al hacer click derecho sobre una carpeta en Dolphin debería aparecer:

```text
Open With Warp
```

Y abrirá Warp directamente en el directorio seleccionado.

---

# Explicación técnica

Warp Terminal actualmente espera rutas en formato URL:

```text
file:///home/linux/Downloads
```

No funciona correctamente con rutas normales:

```text
/home/linux/Downloads
```

Por eso esta configuración funciona:

```ini
Exec=warp-terminal "file://%f"
```

Y estas configuraciones NO funcionan correctamente en la versión actual de Warp Linux:

```ini
Exec=warp-terminal %f
```

```ini
Exec=warp-terminal --working-directory %f
```

El argumento `--working-directory` no está soportado actualmente por el CLI de Warp Linux.

---

# Verificar manualmente

Puedes probar Warp manualmente:

```bash
warp-terminal "file:///home/linux"
```

o:

```bash
warp-terminal "file:///home/linux/Downloads"
```

Si Warp abre correctamente en esos directorios, entonces la integración funcionará correctamente en Dolphin.