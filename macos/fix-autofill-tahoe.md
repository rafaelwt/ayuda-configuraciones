# Fix: Ícono "Apps" lento en macOS Tahoe

## Problema
Al presionar el ícono **Apps** (el reemplazo de Launchpad en Tahoe), tarda mucho en abrir y hay que hacer clic varias veces.

## Causa
El autorrelleno heurístico de Tahoe (AutoFill en todas las apps) escanea los campos de texto al abrir vistas como Apps —que incluye una barra de búsqueda— y bloquea la interfaz.

## Solución
```bash
defaults write -g NSAutoFillHeuristicControllerEnabled -bool false
```
Reiniciar o cerrar sesión para aplicar.

**Efecto:** desactiva las sugerencias de autorrelleno fuera de Safari. El autocompletado en Safari sigue funcionando.

## Revertir
```bash
defaults delete -g NSAutoFillHeuristicControllerEnabled
```
Reiniciar o cerrar sesión.

> Tip: probar revertirlo tras actualizaciones grandes de macOS, por si Apple corrige el problema.