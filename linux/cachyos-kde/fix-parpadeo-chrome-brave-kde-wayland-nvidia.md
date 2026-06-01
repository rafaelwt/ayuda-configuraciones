# Fix temporal para parpadeo en Chrome/Brave con KDE Wayland + NVIDIA

## Contexto

Sistema probado:

- CachyOS Linux
- KDE Plasma Wayland
- NVIDIA GeForce RTX 4060
- Configuración con dos monitores
- Chrome y Brave basados en Chromium

## Problema

En KDE Plasma usando Wayland, Chrome y Brave presentaban parpadeo visual en el segundo monitor.

El problema aparecía especialmente al mover el mouse rápido sobre ciertos elementos de páginas web, por ejemplo elementos con `hover`, sombras, animaciones, cambios de fondo o transiciones CSS.

El monitor principal funcionaba correctamente. El problema solo se veía en el segundo monitor.

## Diagnóstico

El problema no estaba relacionado con:

- Resolución
- Frecuencia de refresco
- Perfil de color
- Cable o monitor defectuoso
- Cambio a X11

La causa más probable era la composición acelerada por GPU de Chromium en la combinación:

```text
KDE Plasma Wayland + NVIDIA + dos monitores + Chrome/Brave + GPU compositing
```

La prueba que confirmó el diagnóstico fue iniciar Chrome con:

```bash
google-chrome-stable --disable-gpu-compositing
```

Al usar ese flag, el parpadeo desapareció.

## Solución aplicada

Se creó un archivo de flags para Chrome y otro para Brave.

### Chrome

Archivo:

```bash
~/.config/chrome-flags.conf
```

Contenido:

```text
--disable-gpu-compositing
```

Comando para crearlo o editarlo:

```bash
nano ~/.config/chrome-flags.conf
```

### Brave

Archivo:

```bash
~/.config/brave-flags.conf
```

Contenido:

```text
--disable-gpu-compositing
```

Comando para crearlo o editarlo:

```bash
nano ~/.config/brave-flags.conf
```

Después de crear o modificar estos archivos, cerrar completamente los navegadores:

```bash
pkill chrome
pkill brave
```

Luego abrirlos normalmente desde el menú de KDE.

## Verificación

### Chrome

Abrir:

```text
chrome://version
```

Buscar la línea:

```text
Command Line
```

Debe aparecer:

```text
--disable-gpu-compositing
```

Ejemplo válido:

```text
/opt/google/chrome/google-chrome --disable-gpu-compositing ...
```

### Brave

Abrir:

```text
brave://version
```

Buscar la línea:

```text
Command Line
```

Debe aparecer:

```text
--disable-gpu-compositing
```

Ejemplo válido:

```text
/opt/brave-bin/brave --disable-gpu-compositing ...
```

Si aparece el flag en `Command Line`, la configuración quedó aplicada correctamente.

## Cómo eliminar el fix temporal

Cuando se actualice el driver de NVIDIA, KDE Plasma o Chromium/Chrome/Brave, conviene probar si el problema ya fue corregido.

Para quitar el fix temporal:

```bash
rm ~/.config/chrome-flags.conf
rm ~/.config/brave-flags.conf
```

Cerrar los navegadores:

```bash
pkill chrome
pkill brave
```

Abrir Chrome y Brave normalmente desde KDE.

## Cómo comprobar si ya fue corregido

Después de eliminar los archivos:

1. Abrir Chrome o Brave.
2. Entrar a `chrome://version` o `brave://version`.
3. Verificar que ya no aparezca:

```text
--disable-gpu-compositing
```

4. Mover el navegador al segundo monitor.
5. Probar páginas donde antes aparecía el parpadeo.
6. Pasar el mouse rápido sobre elementos con `hover`.

### Resultado esperado

Si ya no parpadea sin el flag, el bug probablemente fue corregido por una actualización de NVIDIA, KDE o Chromium.

### Si el problema vuelve

Volver a crear los archivos:

```bash
nano ~/.config/chrome-flags.conf
```

Contenido:

```text
--disable-gpu-compositing
```

```bash
nano ~/.config/brave-flags.conf
```

Contenido:

```text
--disable-gpu-compositing
```

Cerrar y reabrir los navegadores:

```bash
pkill chrome
pkill brave
```

## Nota final

Este fix mantiene Wayland. No requiere cambiar a X11.

Es un workaround limpio, reversible y limitado solo a navegadores Chromium. No modifica la configuración global de KDE ni del sistema.
