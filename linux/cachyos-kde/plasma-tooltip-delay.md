# Quitar el retraso de las previsualizaciones en KDE Plasma

## Problema
Las previsualizaciones de ventanas (y los tooltips en general) tardan en aparecer al pasar el ratón. **No es lentitud del sistema**: Plasma trae un retraso artificial de **700 ms** por defecto.

## Solución
Pon el retraso a 150 ms (ajústalo a tu gusto: 25–150 es buen rango):

```bash
kwriteconfig6 --file ~/.config/plasmarc --group PlasmaToolTips --key Delay 150
```

Reinicia plasmashell para aplicar el cambio:

```bash
kquitapp6 plasmashell && kstart plasmashell
```

> ⚠️ Evita `0`: desactiva **todos** los tooltips.

## Verificar
Lee el valor actual:

```bash
kreadconfig6 --file ~/.config/plasmarc --group PlasmaToolTips --key Delay
```

Debe devolver `150`. O mira el archivo:

```bash
cat ~/.config/plasmarc
```

```ini
[PlasmaToolTips]
Delay=150
```

## Volver al valor por defecto (700 ms)
Borra la clave:

```bash
kwriteconfig6 --file ~/.config/plasmarc --group PlasmaToolTips --key Delay --delete
```

Reinicia plasmashell de nuevo.
