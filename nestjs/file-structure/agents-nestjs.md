# AGENTS.md

## Stack y convenciones de NestJS

- NestJS 12, proyecto ESM (`"type": "module"` en `package.json`): los imports relativos llevan extensión `.js` (`import { Money } from './money.js'`).
- Validación con **Zod** (Standard Schema), no `class-validator`. Un pipe (`ZodValidationPipe`) valida el body con `.strict()`: cualquier campo extra devuelve 400.
- El schema Zod es la única fuente de verdad del tipo: el modelo se deriva con `z.infer<typeof schema>`, nunca se declara la `interface` a mano por separado.
- Variables de entorno validadas con Zod al arrancar. Si falta una obligatoria, el proceso no inicia (fail-fast, no falla en el primer uso).
- Sin ORM: SQL directo con `mysql2/promise` y un pool. Cada tabla (o grupo de tablas relacionadas) tiene un repositorio con sus consultas escritas a mano.
- Inyección de dependencias obligatoria: ningún provider usa `@Optional()` con una instancia por defecto oculta en el constructor. La selección de implementación (real vs. local, en memoria vs. Redis, etc.) vive en el `useFactory` del `*.module.ts` correspondiente.
- Los montos se manejan como centavos enteros (`bigint`), nunca como `number` de punto flotante.
- Test runner: Vitest. Los tests unitarios reemplazan los clients de integraciones externas con `Test.createTestingModule(...).overrideProvider(...)`; no hacen falta interfaces adicionales solo para poder mockear.

## Convenciones de archivos

| Archivo | Contenido |
| --- | --- |
| `*.module.ts` | Declara providers/controllers/imports/exports. Aquí vive el `useFactory` que elige implementación |
| `*.controller.ts` | Recibe la petición, delega al service, devuelve la respuesta. Sin lógica de negocio |
| `*.service.ts` | Lógica de negocio del flujo: llama a repositorios, integraciones y policies |
| `*.repository.ts` | Única capa con SQL o acceso a Redis del módulo. Convención de nombre única (sin `store`/`contract`/`port`) |
| `*.policy.ts` | Funciones puras de decisión (clasificar, exponer o no un dato), sin I/O |
| `*.errors.ts` | Errores de dominio del módulo (clases o factories de `AppError`) |
| `*.ports.ts` | Tokens de inyección y tipos que cruzan la frontera del módulo (los que otro módulo puede necesitar) |
| `dto/*.dto.ts` | Schemas Zod de entrada (body/query) del controller |
| `models/*.row.ts` | Forma cruda de una fila de MariaDB (`extends RowDataPacket`), una interfaz chica por consulta |
| `models/*.model.ts` | Schema Zod de dominio del módulo; el tipo se deriva con `z.infer` |
| `*.spec.ts` | Test unitario (Vitest), junto al archivo que prueba |
| `*.e2e-spec.ts` | Test end-to-end, en `test/` |

## Reglas generales

- Un solo idioma para nombres de archivos, carpetas y símbolos de código; los términos de dominio y el copy pueden ir en el idioma del negocio.
- `shared/` nunca importa de `modules/` ni de `integrations/`.
- Un servicio o repositorio vive en un solo módulo; si dos módulos lo necesitan, se mueve a `shared/` (si es transversal y no conoce el dominio) o queda expuesto como puerto de un módulo (`*.ports.ts`) que el otro consume.
- Los tipos crudos de una API externa nunca salen de `integrations/`: los módulos de negocio solo ven los tipos de `*.ports.ts`.
- Comentarios: sin cabecera por archivo, clase o función; el nombre y los tipos ya dicen qué es. Un comentario solo cuando evita un error real (decisión no obvia, constante mágica del proveedor, restricción de seguridad), máximo 3 líneas seguidas, en presente, sin narrar historia. No repite lo que dice el tipo ni duplica lo que ya está en `docs/`.
- Tests honestos: nunca fuerces el código de producción para que un test pase (nada de tipos debilitados o duplicados, alias, reexports, shims, `any`, `as unknown as`, `@ts-ignore`). Actualiza los fixtures a los contratos reales. Los cambios de comportamiento siguen TDD: primero el test que falla.
- Tests: dobles tipados con `Pick<T, 'metodo'>` o una instancia real con dependencias falsas, sin casts. Datos inválidos a propósito: un único helper por archivo con nombre explícito (`asInvalidInput(value)`); `@ts-expect-error` solo para probar que algo NO compila. En producción, un cliente de terceros mal tipado se adapta en un helper con nombre explícito, nunca con un cast suelto.

## Estructura del proyecto

```
src/
├── main.ts
├── app.module.ts
├── config/
│   ├── env.ts                    # validación Zod de todo el .env al arrancar
│   ├── validate-boot.ts          # corre env.ts al boot y aborta el proceso si falla
│   └── config.module.ts          # provee la configuración vía un token/loader
├── shared/
│   ├── database/
│   │   ├── database.module.ts    # pool perezoso de mysql2 (provider MARIADB_POOL)
│   │   ├── mariadb-pool.ts
│   │   └── with-transaction.ts   # withTransaction(pool, work): begin/commit/rollback/release
│   ├── redis/
│   │   ├── redis.module.ts       # cliente perezoso de ioredis
│   │   └── redis-keys.ts
│   ├── http/
│   │   ├── app-exception.filter.ts   # AppError -> HTTP, sin conocer ningún módulo de negocio
│   │   └── zod.pipe.ts               # ZodValidationPipe (.strict())
│   ├── errors/
│   │   └── errors.ts              # ERROR_CODES, HTTP_STATUS_BY_CODE, AppError
│   └── utils/
│       └── money.ts                # centavos (bigint): parse, formato, suma, comparación
├── integrations/
│   ├── http/
│   │   ├── http-transport.ts       # fetch wrapper compartido por todos los clients externos
│   │   └── single-flight-token.ts  # caché + single-flight + renovación de token compartida
│   └── <proveedor>/
│       ├── <proveedor>.client.ts
│       ├── <proveedor>.types.ts    # tipos crudos de la API externa
│       ├── <proveedor>.mapper.ts   # respuesta cruda -> tipo interno
│       └── <proveedor>.local.ts    # simulador para desarrollo, sin llamar a la API real
├── modules/
│   └── <feature>/
│       ├── <feature>.module.ts
│       ├── <feature>.ports.ts
│       ├── <feature>.controller.ts
│       ├── <feature>.service.ts
│       ├── <feature>.policy.ts
│       ├── <feature>.errors.ts
│       ├── <feature>.repository.ts
│       ├── dto/
│       │   └── <accion>.dto.ts
│       └── models/
│           ├── <feature>.row.ts
│           └── <feature>.model.ts
└── scripts/
    └── <nombre>.ts                 # entry points de comandos operativos (`pnpm <script>`)
```

### Qué va en cada carpeta

- `config/`: validación y carga de variables de entorno. Nada más.
- `shared/`: infraestructura transversal (pool de base de datos, cliente de Redis, filtro de excepciones, pipe de validación, errores compartidos, utilidades puras). No conoce ningún módulo de negocio.
- `integrations/`: la única capa que conoce las APIs externas. `integrations/http/` tiene la base compartida (transporte HTTP, caché de tokens); una carpeta por proveedor con su client, sus tipos crudos, su mapper y, si aplica, un simulador local.
- `modules/<feature>/`: una carpeta por feature de negocio, con su controller, service, repositorio(s), policy y errores propios.
- `scripts/`: comandos que se ejecutan por fuera del servidor HTTP (migraciones de datos, tareas de operador).

### Capas (reglas)

```text
controller    recibe la petición, la delega al service, devuelve la respuesta; sin lógica de negocio
service       lógica de negocio del flujo; llama a repositorios, integraciones y policies
repository    única capa con SQL o acceso a Redis; devuelve datos (hechos), nunca decide negocio
              ni lanza errores de dominio: reporta lo que encontró y el service decide qué hacer
policy        *.policy.ts: funciones puras de decisión (clasificar, exponer o no un dato), sin I/O
integrations  única capa que conoce las APIs externas; los módulos de negocio solo ven los tipos
              de *.ports.ts
```

### Inyección de dependencias

- Ningún provider usa `@Optional()` con un valor por defecto oculto en el constructor.
- La selección de implementación (real vs. local, en memoria vs. Redis, etc.) vive en el `useFactory` del `*.module.ts`, nunca en el constructor de la clase que la consume.
- Un repositorio con una sola implementación se inyecta por su propia clase (token implícito); no crees un `InjectionToken` ni una interfaz solo para poder mockearlo en tests (`overrideProvider` ya lo permite).
- Usa un token (`InjectionToken` o clase abstracta) solo cuando existe más de una implementación real entre las que el `useFactory` elige (un "puerto" de verdad), no como costumbre.

### SQL directo (sin ORM)

- Todo el SQL vive en archivos `*.repository.ts`, siempre con `pool.execute`/`connection.execute` y placeholders `?` (prepared statements). Nunca se interpola un valor en el string SQL; la única interpolación permitida es la lista de `?` de un `IN`, construida a partir de la cantidad de elementos.
- Transacciones: un helper compartido `withTransaction(pool, work)` en `shared/database/with-transaction.ts` (begin/commit/rollback silencioso/release). Lo llama únicamente el repositorio agregado que necesita atomicidad. No hay Unit of Work: el resto de los repositorios usa `pool.execute(...)` directamente.
- Si varios agregados (repositorios de distintos módulos) necesitan escribirse atómicamente en la misma operación, ese caso se resuelve explícitamente en el service que los orquesta (por ejemplo, pasando la misma conexión), nunca agregando un Unit of Work genérico.
- Cada módulo tiene su `models/*.row.ts` con las formas crudas de mysql2 (`extends RowDataPacket`), una interfaz chica por consulta. El repositorio nunca devuelve estas filas crudas: las mapea a un tipo de hechos antes de devolverlas al service.
- Errores de la base de datos relevantes para el negocio (por ejemplo, `ER_DUP_ENTRY`/`errno === 1062`) se traducen en el propio repositorio a una señal interna; el service decide si esa señal se expone al cliente.

## Verificación

Antes de dar una tarea por terminada, ejecuta esto y pega la salida:

```bash
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
npx tsc --noEmit -p tsconfig.json   # incluye los *.spec.ts
```

Y estos greps, que deben devolver vacío:

```bash
rg -n '@Optional\(\)' src
rg -n 'as unknown as|@ts-ignore|: any\b' src test   # incluye specs y e2e: cada resultado debe estar dentro de un helper con nombre explícito (asInvalidInput o el adaptador de un cliente de terceros)
rg -n 'from .*modules/' src/shared
```

No des una tarea por terminada con errores de build, lint, tests fallidos, el typecheck en rojo o alguno de los greps con resultado.
