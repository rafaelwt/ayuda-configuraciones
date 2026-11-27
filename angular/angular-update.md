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

Nota: el builder por defecto desde Angular v18 es `@angular/build` (application builder introducido en v17), no `@angular-devkit/build-angular`. `ng update` migra el `angular.json` y el código automáticamente (por ejemplo, la migración de detección de cambios `OnPush`/`Eager` en Angular v22); no hace falta instalar paquetes `@next` manualmente.

## Verificar paquetes desactualizados

```bash
npm outdated
```

## Actualizar paquetes de terceros con `npm-check-updates`

> **Importante:** excluye siempre `@angular/*` al usar `npm-check-updates`. Los paquetes de Angular deben actualizarse con `ng update` para ejecutar sus migraciones automáticas.

```bash
# Ver qué paquetes de terceros se pueden actualizar (excluyendo Angular)
npx npm-check-updates -x "@angular/*"

# Actualizar package.json solo para dependencias de terceros
npx npm-check-updates -u -x "@angular/*"

# Elegir interactivamente qué paquetes actualizar
npx npm-check-updates -i -x "@angular/*"
```

Si se usa con frecuencia, se puede instalar globalmente como `ncu`:

```bash
npm install -g npm-check-updates
ncu -x "@angular/*"
ncu -u -x "@angular/*"
```
