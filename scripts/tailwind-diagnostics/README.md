# Diagnósticos de Tailwind CSS IntelliSense

Ejecuta con Node.js desde cualquier directorio, apuntando a un proyecto que use Tailwind:

```bash
node /ruta/a/tailwind-diagnostics.mjs --root /ruta/al/proyecto
```

Lee los diagnósticos del servidor de lenguaje de la extensión **Tailwind CSS IntelliSense** de VS Code y muestra las sugerencias de reemplazo incluidas en sus mensajes. No modifica archivos ni instala dependencias. Busca la extensión instalada en los directorios habituales de VS Code; si está en otra ubicación, pasa `--server /ruta/a/dist/tailwindServer.js`. Por defecto examina `src/` si existe, o el proyecto entero; usa `--dir RUTA` para elegir otra carpeta y `--timeout MILISEGUNDOS` para ampliar la espera.

Salida: `archivo:línea:columna [código] mensaje`. Código de salida: `0` sin avisos, `1` con avisos, `2` si no pudo completar la revisión (si vence el tiempo, igual muestra los diagnósticos obtenidos). Ejecuta `--help` para ver las opciones.
