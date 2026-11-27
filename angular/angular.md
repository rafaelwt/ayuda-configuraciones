# angular (Angular 22+)

Guías y referencias enfocadas en **Angular 22+** (standalone, zoneless y `OnPush` por defecto, `@Service()`, Signal Forms y Resource API).

## Buenas prácticas

Ver [`angular-best-practices.md`](./angular-best-practices.md) y la documentación oficial: https://angular.dev/style-guide

## Error al ejecutar comandos de Angular en Windows

Si PowerShell bloquea la ejecución de scripts (por ejemplo `ng` no se reconoce o da error de política de ejecución), ejecutar en PowerShell:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## Si el auto-import no funciona al crear un proyecto nuevo

Revisar que `tsconfig.json` esté bien configurado y que el editor use el servicio de lenguaje de Angular (extensión [Angular Language Service](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template) en VS Code).

## Índice de `angular/`

- [`angular-best-practices.md`](./angular-best-practices.md) — reglas de estilo y buenas prácticas para generar código Angular 22+
- [`angular-update.md`](./angular-update.md) — cómo actualizar Angular, Angular Material y dependencias de terceros
- [`angular-build.md`](./angular-build.md) — environments y build de producción (`@angular/build`)
- [`netlify-publish.md`](./netlify-publish.md) — solucionar 404 y configurar el publish directory en Netlify
- [`multi-request.md`](./multi-request.md) — combinar varias peticiones con `rxResource` y `forkJoin`
- [`subscribe-form-value.md`](./subscribe-form-value.md) — select dependiente con Signal Forms + `rxResource` (y alternativa Reactive Forms)
- [`router-redirect.md`](./router-redirect.md) — redirecciones de rutas, wildcard y guards funcionales
- [`docs/signal-forms-vs-reactive.md`](./docs/signal-forms-vs-reactive.md) — guía comparativa práctica de Reactive Forms vs Signal Forms (Angular 22+)
- [`polling-angular/`](./polling-angular/README.md) — guía por niveles de polling en Angular (de `setInterval` a `httpResource` y polling resiliente)
- [`file-structure/`](./file-structure/) — estructura de carpetas, `AGENTS.md` y refactorización de componentes para proyectos grandes y medianos
  - [`file-structure/estructura-grande.md`](./file-structure/estructura-grande.md)
  - [`file-structure/estructura-mediana.md`](./file-structure/estructura-mediana.md)
  - [`file-structure/agents-grande.md`](./file-structure/agents-grande.md)
  - [`file-structure/agents-mediana.md`](./file-structure/agents-mediana.md)
  - [`file-structure/refactor-componentes.md`](./file-structure/refactor-componentes.md)
