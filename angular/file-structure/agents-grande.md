# AGENTS.md

## Stack y convenciones de Angular

- Angular 22, 100 % standalone. No uses `NgModule`. No escribas `standalone: true`: ya es el valor por defecto.
- Bootstrap con `bootstrapApplication(App, appConfig)`. Los providers globales van en `app.config.ts`.
- Rutas en archivos `*.routes.ts`. Cada feature se carga con lazy loading desde `app.routes.ts` (`loadChildren` o `loadComponent`).
- Inputs y outputs con `input()`, `output()` y `model()`. Estado local con `signal()` y `computed()`.
- Estado compartido con servicios basados en signals. No uses NgRx ni otras librerías de estado.
- Servicios con `@Service()` (provisto en root por defecto). Para un servicio que se provee en una ruta o componente, `@Service({ autoProvided: false })`. Usa `@Injectable` solo si necesitas `useClass`, `useValue`, `useFactory` o un scope como `'platform'`.
- Inyección con `inject()`, no por constructor (`@Service` no admite inyección por constructor).
- Zoneless y `OnPush` son el comportamiento por defecto: no agregues `zone.js`, `provideZoneChangeDetection` ni la propiedad `changeDetection`. Todo estado que deba actualizar la vista va en signals.
- Control flow nativo en templates: `@if`, `@for` (siempre con `track`), `@switch`. No uses `*ngIf` ni `*ngFor`.
- Guards e interceptors funcionales (`CanActivateFn`, `HttpInterceptorFn`). Los interceptors se registran con `provideHttpClient(withInterceptors([...]))`.
- Crea artefactos con `ng generate` y respeta los nombres que genera el CLI (convención Angular 20+: sin sufijo `.component`).

## Convenciones de archivos

Los artefactos que genera el CLI conservan el nombre que les da (`ng g guard auth` → `auth-guard.ts`). Los archivos que no genera el CLI usan sufijo con punto (`*.routes.ts`, `*.model.ts`).

| Archivo | Contenido |
| --- | --- |
| `<nombre>.ts` en la carpeta de un componente | Componente standalone (`@Component`), clase sin sufijo (`Dashboard`) |
| `<nombre>.ts` en `directives/` | Directiva standalone (`@Directive`), clase sin sufijo (`Highlight`) |
| `*-pipe.ts` | `@Pipe` standalone que implementa `PipeTransform`, clase con sufijo (`DateFormatPipe`) |
| Servicios (`auth.ts`, `product-api.ts`) | Clase `@Service()` sin sufijo (`Auth`, `ProductApi`), nombrada por su responsabilidad |
| `*-state.ts` | Servicio `@Service()` que guarda estado en signals |
| `*-guard.ts` | Guard funcional (`const authGuard: CanActivateFn`) con `inject()`. Nunca clases |
| `*-resolver.ts` | `const xResolver: ResolveFn<T>` con `inject()` |
| `*-interceptor.ts` | `const xInterceptor: HttpInterceptorFn` |
| `*.routes.ts` | `Routes` con `export default` (salvo `app.routes.ts`, que conserva el `export const routes` del CLI) |
| `*.model.ts` | Solo `interface` y `type`, sin lógica |
| `*.validator.ts` | Función que devuelve un `ValidatorFn` |
| `*.form.ts` | Fábrica pura de `FormGroup` (ver Formularios) |
| `*.modes.ts` | Tipos y helpers de crear/editar de un formulario multipaso |
| `*.spec.ts` | Test (Vitest) |
| Archivos en `utils/` | Funciones puras exportadas, sin estado ni `inject()` |

## Reglas generales

- Un solo idioma para nombres de archivos, carpetas y símbolos. Usa el que ya use el proyecto; si no está definido, pregunta antes de crear archivos.
- La carpeta de una feature se llama igual que su ruta (`features/products/` → `/products`).
- No dejes código sin referencias: si un componente, ruta o servicio deja de usarse, elimínalo en el mismo cambio. No crees stubs "para después".
- Constantes como objeto `as const` o tipo unión, no como clases con `static readonly`.
- Path alias: agrega en `compilerOptions.paths` de `tsconfig.json` la entrada `"@/*": ["./src/*"]` (el CLI no la crea). Entre carpetas de primer nivel (`core/`, `layout/`, `shared/`, `features/`) importa con `@/app/...`. Dentro de la misma feature usa rutas relativas.

## Estructura del proyecto (grande)

Proyecto Angular 22 standalone, sin NgModules y sin NgRx.

```
src/
├── app/
│   ├── core/
│   │   ├── auth/
│   │   │   ├── auth.ts               # servicio: login, logout, token
│   │   │   └── auth-state.ts         # estado global de sesión
│   │   ├── guards/
│   │   │   └── auth-guard.ts
│   │   ├── interceptors/
│   │   │   └── auth-interceptor.ts
│   │   ├── models/                   # interfaces que usan varias features
│   │   ├── i18n/                     # opcional: configuración de traducciones
│   │   └── error-handler.ts          # ErrorHandler global
│   ├── layout/                       # layout principal (ver nota de layout)
│   │   ├── header/
│   │   ├── sidebar/
│   │   ├── footer/
│   │   ├── layout.ts                 # layout principal con <router-outlet> (+ .html, .css)
│   │   └── layout-state.ts           # opcional: menú abierto, tema, etc.
│   ├── shared/
│   │   ├── components/
│   │   │   ├── empty-state/          # + README.md si su uso no es obvio
│   │   │   └── spinner/
│   │   ├── directives/
│   │   │   └── debounce.ts
│   │   ├── pipes/
│   │   │   └── currency-format-pipe.ts
│   │   ├── validators/
│   │   │   └── age.validator.ts
│   │   └── utils/                    # funciones puras
│   ├── features/
│   │   ├── admin/
│   │   │   ├── components/
│   │   │   │   └── admin-dashboard/  # .ts, .html, .css, .spec.ts
│   │   │   ├── services/
│   │   │   │   └── admin-api.ts
│   │   │   ├── admin-guard.ts        # guard de toda la feature
│   │   │   └── admin.routes.ts
│   │   ├── user/
│   │   │   ├── components/
│   │   │   │   ├── user-profile/
│   │   │   │   └── user-settings/
│   │   │   ├── models/
│   │   │   │   └── user.model.ts
│   │   │   ├── services/
│   │   │   │   └── user-api.ts
│   │   │   ├── user-state.ts
│   │   │   └── user.routes.ts
│   │   └── products/
│   │       ├── components/
│   │       │   ├── product-list/
│   │       │   └── product-details/  # + product-details-resolver.ts
│   │       ├── models/
│   │       ├── services/
│   │       │   └── product-api.ts
│   │       └── products.routes.ts
│   ├── app.ts
│   ├── app.html
│   ├── app.css
│   ├── app.config.ts
│   └── app.routes.ts                 # monta Layout y carga las features como hijas
├── environments/
├── styles/                           # parciales globales (variables, tipografía)
├── main.ts
├── index.html
└── styles.css                        # importa los parciales de styles/
public/                               # archivos estáticos (no uses src/assets/)
└── i18n/                             # opcional: es.json, en.json…
docs/                                 # opcional: documentación del proyecto
deploy/                               # opcional: scripts y notas de despliegue
```

### Nota de layout

`layout/` contiene el layout principal de la app y sus piezas fijas:

- `layout.ts` (+ `.html`, `.css`): el layout principal. Su template tiene el header, sidebar y footer y un `<router-outlet>` donde se cargan las páginas. Vive directamente en `layout/`.
- `header/`, `footer/`, `sidebar/` y demás piezas fijas: un componente por carpeta.

Según el caso:

- **Proyecto nuevo:** `App` solo contiene `<router-outlet />`. `app.routes.ts` monta `Layout` y carga como hijas las páginas que llevan layout. Las que no lo llevan (por ejemplo, un login a pantalla completa) van fuera de `Layout`.
- **Proyecto existente:** el componente raíz `App` (`app.ts`, `app.html`, `app.spec.ts`) nunca se mueve. Si su template contiene el header y el footer como HTML, se deja así: crear `Layout` o convertir ese HTML en componentes es una tarea aparte. Solo se mueven a `layout/` los componentes de layout que ya existan como componentes propios (un header, un footer, un menú), estén donde estén, cada uno en su carpeta y con su nombre.
- **Proyecto con plantilla de UI que trae su propio layout** (por ejemplo, una plantilla de PrimeNG con topbar, sidebar, menú y un servicio de estado del layout): respeta la estructura y los nombres de la plantilla dentro de `layout/`.

### Qué va en cada carpeta

- `core/`: servicios singleton (`@Service()`), guards globales, interceptors, el `ErrorHandler` global, el estado global (sesión) y los modelos que usan varias features. Nunca componentes.
- `layout/`: el layout principal y sus piezas fijas (header, sidebar y footer). Se usan una sola vez, por eso no van en `shared/`.
- `shared/`: componentes presentacionales, directivas, pipes, validators y funciones puras que usan 2 o más features. Un componente compartido cuyo uso no sea obvio lleva un `README.md` en su carpeta.
- `features/<nombre>/`:
  - `components/`: un componente por carpeta.
  - `models/`: interfaces y tipos propios de la feature.
  - `services/`: acceso HTTP de la feature, nombrado por responsabilidad (`product-api.ts`).
  - `<nombre>-state.ts`: estado de la feature, solo si lo necesita.
  - `<nombre>.routes.ts`: rutas de la feature.

### Guards y resolvers

- Globales (aplican a varias features, como `auth-guard.ts`): en `core/guards/`.
- De toda una feature: en la raíz de la feature, junto a `<nombre>.routes.ts`.
- De una sola ruta: junto al componente de esa ruta.

### Reglas de dependencia

- `features/` puede importar de `core/` y `shared/`.
- `layout/` puede importar de `core/` y `shared/`, nunca de `features/`.
- Una feature nunca importa de otra feature (ni componentes, ni servicios, ni estado, ni modelos). Si algo se comparte, se mueve a `shared/` (UI, validators, utils) o a `core/` (servicios, estado y modelos).
- `shared/` nunca importa de `features/` ni de `layout/`.
- Un servicio vive en `core/` o en una feature, nunca en los dos.

### Estado

- El estado se maneja con servicios basados en signals. No se usa NgRx ni otra librería de estado.
- Estado global (sesión, usuario autenticado): `core/auth/auth-state.ts`, con `@Service()` (provisto en root por defecto).
- Estado de una feature: `features/<nombre>/<nombre>-state.ts`, con `@Service({ autoProvided: false })`, provisto en `providers` de la ruta raíz de la feature en `<nombre>.routes.ts`, para que viva y muera con la feature.
- Cada servicio de estado expone signals de solo lectura (`asReadonly()`) y `computed()`. Solo el propio servicio modifica su estado.
- Los servicios de estado llaman a los de `services/`. Los componentes no hacen HTTP directamente.

### Roles de los componentes

- Componentes enrutados (páginas): inyectan servicios de estado y servicios, y pasan datos a sus hijos.
- Resto de componentes: presentacionales, reciben por `input()` y emiten por `output()`.

### Formularios (recomendado, no obligatorio)

Cuando el mismo formulario se necesita en más de un lugar, su construcción se extrae a un archivo `<nombre>.form.ts` junto al componente. Casos típicos:

- Un formulario multipaso donde el padre valida los pasos sin montarlos.
- Un formulario que se usa para crear y para editar.
- Validaciones que se quieren testear sin montar el componente.

Contenido del archivo `<nombre>.form.ts`:

- `build<Nombre>Form(fb: FormBuilder, ...valoresPorDefecto): FormGroup`: única fuente del schema y los validators.
- Funciones puras opcionales para reglas condicionales (habilitar o deshabilitar controles según otros valores) o para calcular la validez de datos sin montar el componente (`compute<Nombre>Validity`).
- El componente llama a `build<Nombre>Form` en lugar de definir el `fb.group` dentro de la clase.
- Su test va en `<nombre>.form.spec.ts`.

Si el formulario es simple y solo lo usa un componente, se define dentro del componente.

### Formularios multipaso (recomendado)

Para formularios largos divididos en pasos (wizard):

```
features/customers/components/customer-form/
├── customer-form.ts              # padre: orquesta pasos, navegación y envío
├── customer-form.html
├── customer-form.css
├── customer-form.modes.ts        # tipos y helpers de crear/editar
├── customer-form-state.ts        # datos acumulados entre pasos
├── customer-form-resolver.ts     # carga los datos en modo editar
└── steps/
    ├── personal-data/
    │   ├── personal-data.ts      # + .html, .css
    │   ├── personal-data.form.ts
    │   └── personal-data.form.spec.ts
    └── addresses/                # misma forma
```

- Cada paso es un componente con su propio `*.form.ts`.
- El servicio de estado del formulario se provee en `providers` de la ruta del formulario, así los datos se descartan al salir.
- El padre calcula si cada paso es válido con `compute<Paso>Validity` sobre los datos del estado, sin montar el componente del paso.
- `*.modes.ts` concentra las diferencias entre crear y editar: valores iniciales, campos bloqueados y qué endpoint se llama.

## Componentes: un archivo o separado

Un componente va EN UN SOLO ARCHIVO solo si cumple TODO esto:

1. Es presentacional: recibe datos por `input()` y emite por `output()`. No inyecta servicios (ninguna clase `@Service` o `@Injectable` del proyecto, incluidos los de estado), no hace HTTP y no inyecta `Router` ni `ActivatedRoute`. Solo puede inyectar `ElementRef`, `DestroyRef` o `ChangeDetectorRef`, y usar `RouterLink` en el template.
2. Su template tiene 15 líneas o menos.
3. Sus estilos tienen 10 líneas o menos, o no tiene estilos.

Si no cumple alguna condición, o hay dudas, va SEPARADO. Las páginas siempre van separadas.

- Separado (por defecto): `ng g c <ruta>/<nombre>` genera la carpeta `<nombre>/` con `<nombre>.ts`, `.html`, `.css` y `.spec.ts`.
- Un solo archivo: `ng g c <ruta>/<nombre> --inline-template --inline-style`.
- Todo componente vive en su propia carpeta, junto a su `.spec.ts`.
- Si al modificar un componente de un solo archivo deja de cumplir el criterio, sepáralo en ese mismo cambio sin tocar su lógica.

## Verificación

Después de cualquier cambio ejecuta `ng build` y `ng test --watch=false`. No des una tarea por terminada con errores de build o tests fallidos.
