# Actualizar un proyecto Angular

## Actualizar `@angular/core` y `@angular/cli`

Actualiza una versión mayor a la vez, siguiendo la guía oficial: https://angular.dev/update-guide

```bash
ng update @angular/core @angular/cli
```

## Actualizar Angular Material (y CDK si se usa)

```bash
ng update @angular/material
ng update @angular/cdk
```

## Actualizar la CLI de Angular de forma global

```bash
npm uninstall -g @angular/cli
npm cache verify
npm install -g @angular/cli@latest
```

En macOS o Linux, antepón `sudo` si el usuario no tiene permisos de escritura globales en npm.

Nota: el builder por defecto desde Angular v17 es `@angular/build` (application builder), no `@angular-devkit/build-angular`. `ng update` migra el `angular.json` automáticamente; no hace falta instalar paquetes `@next` manualmente para pasar de uno a otro.

## Verificar paquetes desactualizados

```bash
npm outdated
```

## Actualizar paquetes con npm-check-updates

```bash
# Ver qué paquetes se pueden actualizar
npx npm-check-updates

# Actualizar package.json con las últimas versiones
npx npm-check-updates -u

# Elegir interactivamente qué paquetes actualizar
npx npm-check-updates -i
```

Si se usa con frecuencia, se puede instalar globalmente como `ncu`:

```bash
npm install -g npm-check-updates
ncu
ncu -u
```
