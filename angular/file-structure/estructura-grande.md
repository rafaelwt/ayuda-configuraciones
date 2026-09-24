# Estructura del proyecto (grande)

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
│   ├── layout/                       # shell de la app (ver nota de layout)
│   │   ├── shell/                    # contenedor con <router-outlet>
│   │   ├── topbar/
│   │   ├── sidebar/
│   │   ├── footer/
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
│   └── app.routes.ts                 # monta el shell y carga las features como hijas
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

## Nota de layout

`layout/` contiene el shell: la parte fija que envuelve todas las páginas (barra superior, menú lateral, pie y el componente contenedor con `<router-outlet>`). Su contenido depende de la plantilla de UI que use el proyecto:

- **Si el proyecto usa una plantilla que trae su propio layout** (por ejemplo, una plantilla de PrimeNG con topbar, sidebar, menú y un servicio de estado del layout), respeta la estructura y los nombres de la plantilla dentro de `layout/`.
- **Si el proyecto no usa plantilla, o su plantilla no trae layout**, identifica las piezas del shell que ya existan, estén donde estén (`shared/`, la raíz de `app/` u otra carpeta), y muévelas a `layout/`, cada una en su propia carpeta y conservando sus nombres. En un proyecto nuevo, créalas directamente en `layout/`.
- Los nombres del árbol (`shell/`, `navbar/`, `topbar/`…) son solo ejemplos.

## Qué va en cada carpeta

- `core/`: servicios singleton (`@Service()`), guards globales, interceptors, el `ErrorHandler` global, el estado global (sesión) y los modelos que usan varias features. Nunca componentes.
- `layout/`: el shell de la app. Se usa una sola vez, por eso no va en `shared/`.
- `shared/`: componentes presentacionales, directivas, pipes, validators y funciones puras que usan 2 o más features. Un componente compartido cuyo uso no sea obvio lleva un `README.md` en su carpeta.
- `features/<nombre>/`:
  - `components/`: un componente por carpeta.
  - `models/`: interfaces y tipos propios de la feature.
  - `services/`: acceso HTTP de la feature, nombrado por responsabilidad (`product-api.ts`).
  - `<nombre>-state.ts`: estado de la feature, solo si lo necesita.
  - `<nombre>.routes.ts`: rutas de la feature.

## Guards y resolvers

- Globales (aplican a varias features, como `auth-guard.ts`): en `core/guards/`.
- De toda una feature: en la raíz de la feature, junto a `<nombre>.routes.ts`.
- De una sola ruta: junto al componente de esa ruta.

## Reglas de dependencia

- `features/` puede importar de `core/` y `shared/`.
- `layout/` puede importar de `core/` y `shared/`, nunca de `features/`.
- Una feature nunca importa de otra feature (ni componentes, ni servicios, ni estado, ni modelos). Si algo se comparte, se mueve a `shared/` (UI, validators, utils) o a `core/` (servicios, estado y modelos).
- `shared/` nunca importa de `features/` ni de `layout/`.
- Un servicio vive en `core/` o en una feature, nunca en los dos.

## Estado

- El estado se maneja con servicios basados en signals. No se usa NgRx ni otra librería de estado.
- Estado global (sesión, usuario autenticado): `core/auth/auth-state.ts`, con `@Service()` (provisto en root por defecto).
- Estado de una feature: `features/<nombre>/<nombre>-state.ts`, con `@Service({ autoProvided: false })`, provisto en `providers` de la ruta raíz de la feature en `<nombre>.routes.ts`, para que viva y muera con la feature.
- Cada servicio de estado expone signals de solo lectura (`asReadonly()`) y `computed()`. Solo el propio servicio modifica su estado.
- Los servicios de estado llaman a los de `services/`. Los componentes no hacen HTTP directamente.

## Roles de los componentes

- Componentes enrutados (páginas): inyectan servicios de estado y servicios, y pasan datos a sus hijos.
- Resto de componentes: presentacionales, reciben por `input()` y emiten por `output()`.

## Formularios (recomendado, no obligatorio)

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

## Formularios multipaso (recomendado)

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
