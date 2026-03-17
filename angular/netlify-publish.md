# Solucionar error 404 "Page Not Found" al refrescar en Angular desplegado en Netlify

## Problema

Al desplegar una aplicacion Angular en Netlify, al refrescar la pagina (F5) o acceder directamente a una ruta como `tusitio.netlify.app/productos`, aparece el error:

```
Page Not Found
Looks like you've followed a broken link or entered a URL that doesn't exist on this site.
```

Esto ocurre porque Angular usa enrutamiento del lado del cliente (client-side routing). Cuando refrescas, Netlify busca un archivo real en esa ruta en el servidor, y como no existe, devuelve un 404.

## Solucion

Crear un archivo llamado `_redirects` (sin extension) dentro de la carpeta `src/` de tu proyecto Angular.

### Paso 1: Crear el archivo `_redirects`

Crea el archivo en `src/_redirects` con el siguiente contenido:

```
/*    /index.html   200
```

Esta regla le dice a Netlify: "para cualquier ruta que no encuentres, sirve `index.html` con codigo 200", permitiendo que Angular maneje el enrutamiento.

### Paso 2: Agregar el archivo a los assets en `angular.json`

Para que el archivo `_redirects` se copie a la carpeta de build (`dist/`), debes agregarlo en la seccion `assets` de tu `angular.json`:

```json
"assets": [
  "src/favicon.ico",
  "src/assets",
  "src/_redirects"
]
```

### Paso 3: Verificar

1. Ejecuta el build de produccion:

   ```bash
   ng build --configuration production
   ```

2. Verifica que el archivo `_redirects` exista dentro de la carpeta `dist/tu-proyecto/browser/` (Angular 17+) o `dist/tu-proyecto/` (versiones anteriores).

3. Despliega nuevamente en Netlify.

4. Ahora al refrescar cualquier ruta, la pagina deberia cargar correctamente.

## Alternativa: usar `netlify.toml`

En lugar del archivo `_redirects`, puedes crear un archivo `netlify.toml` en la raiz del proyecto con:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Ambas opciones logran el mismo resultado.
