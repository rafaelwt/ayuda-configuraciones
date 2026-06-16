# Fix para parpadeo en Chrome/Brave con KDE Wayland + NVIDIA

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
- Cable o monitor defectuoso
- Cambio a X11

La causa real es el uso por parte de Chromium del protocolo de Wayland de **gestión de color** (`wp_color_manager_v1`), en la combinación:

```text
KDE Plasma Wayland + NVIDIA + Chrome/Brave + protocolo de color wp_color_manager_v1
```

La negociación de gestión de color entre Chromium y el compositor (KWin) sobre NVIDIA provoca el parpadeo. Al desactivar que Chromium use ese protocolo, el conflicto desaparece.

## Solución aplicada

Se desactiva únicamente la función de gestión de color de Chromium mediante un flag, sin tocar la aceleración gráfica.

> **Nota:** versiones anteriores de esta guía usaban `--disable-gpu-compositing`. Ese flag también quitaba el parpadeo, pero movía el ensamblado de capas (compositing) al CPU. El flag actual es mejor: **conserva el 100% de la aceleración gráfica** (compositing por GPU, decodificación de video, WebGL), porque solo desactiva el protocolo de color.

Se crea un archivo de flags para Chrome y otro para Brave.

### Chrome

Archivo:

```bash
~/.config/chrome-flags.conf
```

Contenido (una sola línea):

```text
--disable-features=WaylandWpColorManagerV1
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

Contenido (una sola línea):

```text
--disable-features=WaylandWpColorManagerV1
```

Comando para crearlo o editarlo:

```bash
nano ~/.config/brave-flags.conf
```

> **Importante:** asegúrate de que cada archivo tenga **solo** esta línea. Si quedó un `--disable-gpu` o `--disable-gpu-compositing` de una configuración anterior, elimínalo para no perder aceleración gráfica sin necesidad.

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
--disable-features=WaylandWpColorManagerV1
```

Ejemplo válido:

```text
/opt/google/chrome/google-chrome --disable-features=WaylandWpColorManagerV1 ...
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
--disable-features=WaylandWpColorManagerV1
```

Ejemplo válido:

```text
/opt/brave-bin/brave --disable-features=WaylandWpColorManagerV1 ...
```

Si aparece el flag en `Command Line`, la configuración quedó aplicada correctamente.

### Comprobar que la aceleración sigue activa

A diferencia de los flags antiguos, este no debería desactivar nada de la GPU. Para confirmarlo, abrir:

```text
chrome://gpu
```

Verificar que sigan en verde (Hardware accelerated):

- Video Decode
- WebGL / WebGL2
- Compositing

## Cómo eliminar el fix

Cuando se actualice el driver de NVIDIA, KDE Plasma o Chromium/Chrome/Brave, conviene probar si el problema ya fue corregido.

Para quitar el fix:

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
--disable-features=WaylandWpColorManagerV1
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
--disable-features=WaylandWpColorManagerV1
```

```bash
nano ~/.config/brave-flags.conf
```

Contenido:

```text
--disable-features=WaylandWpColorManagerV1
```

Cerrar y reabrir los navegadores:

```bash
pkill chrome
pkill brave
```

## Consideración sobre HDR y color

Este flag desactiva la gestión de color de Chromium. Para uso normal de navegación no se nota ninguna diferencia. Sin embargo, si usas un monitor con **HDR activado** o trabajas con perfiles de color precisos (edición de foto/video en el navegador), los colores podrían verse ligeramente distintos. En ese caso, conviene reevaluar tras cada actualización para volver a habilitar el color en cuanto el bug esté corregido.

## Nota final

Este fix mantiene Wayland. No requiere cambiar a X11.

Es un workaround limpio, reversible y limitado solo a navegadores Chromium. No modifica la configuración global de KDE ni del sistema, y **conserva la aceleración gráfica completa**.