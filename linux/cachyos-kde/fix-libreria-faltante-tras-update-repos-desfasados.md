# Fix: "cannot open shared object file" después de actualizar CachyOS

## Contexto

Sistema probado:

- CachyOS Linux (repos `cachyos-*-v3` + repos de Arch)
- Caso real: 2026-11-16, Telegram dejó de abrir después de `pacman -Syu`

## Problema

Después de actualizar, una aplicación no abre. Lanzada desde la terminal muestra:

```
/usr/bin/Telegram: error while loading shared libraries: libplacebo.so.387: cannot open shared object file: No such file or directory
```

No falla solo esa app: falla todo lo que dependa de la librería rota (en este caso, todo lo que use `ffmpeg`).

## Causa

CachyOS no recompila todos los paquetes. Una parte viene optimizada en sus repos (`cachyos-extra-v3`) y el resto viene directo de los repos de Arch (`extra`). Pacman toma cada paquete del **primer repo** que lo tenga, y los de CachyOS tienen prioridad.

Si Arch recompila un paquete contra una versión nueva de una librería y CachyOS todavía no publicó esa librería, queda una mezcla incompatible:

| Paquete      | Repo usado          | Versión               |
| ------------ | ------------------- | --------------------- |
| `ffmpeg`     | `extra` (Arch)      | compilado contra libplacebo **387** |
| `libplacebo` | `cachyos-extra-v3`  | **7.360** (viejo)     |

Es un desfase temporal entre repos (horas o días), no un error tuyo.

## Diagnóstico

1. Ver el error real lanzando la app desde la terminal:

   ```bash
   /usr/bin/Telegram
   ```

2. Ver qué versión tenés instalada y qué ofrece cada repo:

   ```bash
   pacman -Q libplacebo
   pacman -Si libplacebo | grep -E "^(Repository|Version)"
   ```

   Si `extra` tiene una versión más nueva que `cachyos-*`, es este problema.

3. (Opcional) Ver qué binario pide la librería nueva:

   ```bash
   objdump -p /usr/lib/libavfilter.so | grep placebo
   ```

## Solución

Instalar la librería desde el repo de Arch:

```bash
sudo pacman -S extra/libplacebo
```

Si pacman rompe una dependencia, por ejemplo:

```
:: installing libplacebo (7.387.0-1) breaks dependency 'libplacebo.so=360-64' required by mpv
```

agregá ese paquete **en la misma transacción**, también desde `extra`:

```bash
sudo pacman -S extra/libplacebo extra/mpv
```

Repetí hasta que pacman no se queje más. Después volvé a probar la app.

## ¿Rompe el próximo update?

No.

- Mientras CachyOS siga con la versión vieja, `pacman -Syu` solo avisa y no toca nada:

  ```
  warning: libplacebo: local (7.387.0-1) is newer than cachyos-extra-v3 (7.360.1-7.1)
  ```

- Cuando CachyOS publique su build (por ejemplo `7.387.0-1.1`), esa versión es mayor y el update vuelve a pasar los paquetes a CachyOS solo.

## Regla rápida

> Si después de un update aparece `cannot open shared object file`, compará `pacman -Si <paquete>` entre repos e instalá desde `extra` el paquete atrasado, más cualquier paquete cuya dependencia se rompa, todo en un solo `pacman -S`.
