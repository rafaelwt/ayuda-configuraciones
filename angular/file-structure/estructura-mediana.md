# Estructura del proyecto (mediana)

Proyecto Angular 22 standalone, sin NgModules.

```
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   └── auth-guard.ts
│   │   ├── interceptors/
│   │   │   └── auth-interceptor.ts
│   │   ├── models/                 # interfaces que usan varias features
│   │   ├── i18n/                   # opcional: configuración de traducciones
│   │   ├── auth.ts                 # servicio de autenticación
│   │   └── error-handler.ts        # ErrorHandler global
│   ├── layout/                     # layout principal (ver nota de layout)
│   │   ├── header/
│   │   ├── footer/
│   │   └── layout.ts               # layout principal con <router-outlet> (+ .html, .css)
│   ├── shared/
│   │   ├── components/
│   │   │   └── spinner/
│   │   ├── directives/
│   │   │   └── highlight.ts
│   │   ├── pipes/
│   │   │   └── date-format-pipe.ts
│   │   ├── validators/
│   │   │   └── age.validator.ts
│   │   └── utils/                  # funciones puras
│   ├── features/
│   │   ├── dashboard/
│   │   │   ├── dashboard.ts
│   │   │   ├── dashboard.html
│   │   │   ├── dashboard.css
│   │   │   ├── dashboard.spec.ts
│   │   │   └── dashboard.routes.ts
│   │   └── profile/
│   │       ├── profile.ts          # + .html, .css, .spec.ts
│   │       ├── profile.form.ts     # opcional (ver Formularios)
│   │       ├── profile-resolver.ts # resolver solo de esta ruta
│   │       ├── profile.model.ts
│   │       └── profile.routes.ts
│   ├── app.ts
│   ├── app.html
│   ├── app.css
│   ├── app.config.ts
│   └── app.routes.ts               # monta Layout y carga las features como hijas
├── environments/
├── main.ts
├── index.html
└── styles.css
public/                             # archivos estáticos (no uses src/assets/)
└── i18n/                           # opcional: es.json, en.json…
docs/                               # opcional: documentación del proyecto
deploy/                             # opcional: scripts y notas de despliegue
```

## Nota de layout

`layout/` contiene el layout principal de la app y sus piezas fijas:

- `layout.ts` (+ `.html`, `.css`): el layout principal. Su template tiene el header y footer y un `<router-outlet>` donde se cargan las páginas. Vive directamente en `layout/`.
- `header/`, `footer/` y demás piezas fijas: un componente por carpeta.

Según el caso:

- **Proyecto nuevo:** `App` solo contiene `<router-outlet />`. `app.routes.ts` monta `Layout` y carga como hijas las páginas que llevan layout. Las que no lo llevan (por ejemplo, un login a pantalla completa) van fuera de `Layout`.
- **Proyecto existente:** el componente raíz `App` (`app.ts`, `app.html`, `app.spec.ts`) nunca se mueve. Si su template contiene el header y el footer como HTML, se deja así: crear `Layout` o convertir ese HTML en componentes es una tarea aparte. Solo se mueven a `layout/` los componentes de layout que ya existan como componentes propios (un header, un footer, un menú), estén donde estén, cada uno en su carpeta y con su nombre.
- **Proyecto con plantilla de UI que trae su propio layout** (por ejemplo, una plantilla de PrimeNG con topbar, sidebar, menú y un servicio de estado del layout): respeta la estructura y los nombres de la plantilla dentro de `layout/`.

## Qué va en cada carpeta

- `core/`: servicios singleton (`@Service()`), guards globales, interceptors, el `ErrorHandler` global y los modelos que usan varias features. Nunca componentes.
- `layout/`: el layout principal y sus piezas fijas (header y footer). Se usan una sola vez, por eso no van en `shared/`.
- `shared/`: componentes presentacionales, directivas, pipes, validators y funciones puras que usan 2 o más features. Un componente compartido cuyo uso no sea obvio lleva un `README.md` en su carpeta.
- `features/<nombre>/`: una carpeta por feature, con su componente página, `<nombre>.routes.ts` y sus modelos propios (`<nombre>.model.ts`). Si la feature necesita subcomponentes, cada uno va en su propia subcarpeta dentro de la feature.

## Guards y resolvers

- Globales (aplican a varias features, como `auth-guard.ts`): en `core/guards/`.
- De toda una feature: en la raíz de la feature, junto a `<nombre>.routes.ts`.
- De una sola ruta: junto al componente de esa ruta.

## Reglas de dependencia

- `features/` puede importar de `core/` y `shared/`.
- `layout/` puede importar de `core/` y `shared/`, nunca de `features/`.
- Una feature nunca importa de otra feature. Si algo se comparte, se mueve a `shared/` (UI, validators, utils) o a `core/` (servicios y modelos).
- `shared/` nunca importa de `features/` ni de `layout/`.

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
