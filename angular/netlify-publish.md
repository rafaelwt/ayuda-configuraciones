# Solucionar error 404 "Page Not Found" al refrescar en Angular desplegado en Netlify

## Problema

Al desplegar una aplicación Angular en Netlify, al refrescar la página (F5) o acceder directamente a una ruta como `tusitio.netlify.app/productos`, aparece el error:

```
Page Not Found
Looks like you've followed a broken link or entered a URL that doesn't exist on this site.
```

Esto ocurre porque Angular usa enrutamiento del lado del cliente (client-side routing). Cuando refrescas, Netlify busca un archivo real en esa ruta en el servidor, y como no existe, devuelve un 404.

## Solución

Crear un archivo llamado `_redirects` (sin extensión) dentro de la carpeta `public/` de tu proyecto Angular.

### Paso 1: Crear el archivo `_redirects`

Desde Angular v18, los archivos estáticos del proyecto van en `public/` y se copian automáticamente a la salida del build sin necesidad de declararlos en `angular.json`. Crea el archivo en `public/_redirects` con el siguiente contenido:

```
/*    /index.html   200
```

Esta regla le dice a Netlify: "para cualquier ruta que no encuentres, sirve `index.html` con código 200", permitiendo que Angular maneje el enrutamiento.

> En proyectos anteriores a Angular v18 (que usan `src/assets/`), crea el archivo en `src/_redirects` y agrégalo a la sección `assets` de `angular.json`:
>
> ```json
> "assets": [
>   "src/favicon.ico",
>   "src/assets",
>   "src/_redirects"
> ]
> ```

### Paso 2: Verificar

1. Ejecuta el build:

   ```bash
   ng build
   ```

2. Verifica que el archivo `_redirects` exista dentro de `dist/tu-proyecto/browser/`.

3. Despliega nuevamente en Netlify.

4. Ahora al refrescar cualquier ruta, la página debería cargar correctamente.

## Alternativa: usar `netlify.toml`

En lugar del archivo `_redirects`, puedes crear un archivo `netlify.toml` en la raíz del proyecto con:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Ambas opciones logran el mismo resultado.
