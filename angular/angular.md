# angular

## Buenas prácticas

Ver [`angular-best-practices.md`](./angular-best-practices.md) y la guía oficial: https://angular.dev/best-practices

## Error al ejecutar comandos de Angular en Windows

Si PowerShell bloquea la ejecución de scripts (por ejemplo `ng` no se reconoce o da error de política de ejecución), ejecutar en PowerShell:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## Si el auto-import no funciona al crear un proyecto nuevo

Revisar que `tsconfig.json` esté bien configurado y que el editor use el servicio de lenguaje de Angular (extensión [Angular Language Service](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template) en VS Code).

## Índice de `angular/`

- [`angular-best-practices.md`](./angular-best-practices.md) — reglas de estilo y buenas prácticas para generar código Angular
- [`angular-update.md`](./angular-update.md) — cómo actualizar Angular, Angular Material y dependencias
- [`angular-build.md`](./angular-build.md) — environments y build de producción
- [`netlify-publish.md`](./netlify-publish.md) — solucionar 404 al desplegar en Netlify
- [`multi-request.md`](./multi-request.md) — combinar varias peticiones con `forkJoin`
- [`subcribeFormValue.md`](./subcribeFormValue.md) — select dependiente escuchando cambios de un formulario
- [`router-redirect.md`](./router-redirect.md) — redirecciones de rutas para evitar pantallas en blanco
- [`file-structure/`](./file-structure/) — estructura de carpetas y agentes para proyectos grandes y medianos
  - [`file-structure/estructura-grande.md`](./file-structure/estructura-grande.md)
  - [`file-structure/estructura-mediana.md`](./file-structure/estructura-mediana.md)
  - [`file-structure/agents-grande.md`](./file-structure/agents-grande.md)
  - [`file-structure/agents-mediana.md`](./file-structure/agents-mediana.md)
  - [`file-structure/refactor-componentes.md`](./file-structure/refactor-componentes.md)
