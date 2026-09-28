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
| `*.repository.ts` | Única capa con SQL o acceso a Redis del módulo. Convención de nombre única (sin `store`/`contract`/`port`). En `repositories/` cuando el módulo tiene más de uno |
| `rules/*.ts` | Funciones puras de decisión del módulo (policy, idempotencia, selección, alias…), sin I/O |
| `mappers/*.mapper.ts` | Traduce entre la forma cruda (fila de BD, respuesta de proveedor) y el tipo interno del módulo |
| `*.errors.ts` | Factories de `AppError` del módulo o integración (ver [Errores](#errores)) |
| `*.ports.ts` | Tokens de inyección y tipos que cruzan la frontera del módulo (los que otro módulo puede necesitar) |
| `dto/*.dto.ts` | Schemas Zod de entrada (body/query) del controller |
| `models/*.row.ts` | Forma cruda de una fila de MariaDB (`extends RowDataPacket`), una interfaz chica por consulta |
| `models/*.model.ts` | Schema Zod de dominio del módulo; el tipo se deriva con `z.infer` |
| `guards/*.guard.ts`, `decorators/*.decorator.ts` | Guards y decoradores de parámetro propios del módulo (no los genéricos de `core`/`common`) |
| `*.spec.ts` | Test unitario (Vitest), junto al archivo que prueba |
| `*.e2e-spec.ts` | Test end-to-end, en `test/` |

## Errores

- **Clasificación primero**: error **operacional** (esperable: recurso inexistente, datos inválidos, proveedor caído) → `AppError` con código estable desde una factory. Error **de programación o de sistema** (bug, pool agotado, memoria) → no se atrapa: se propaga y el filtro global lo registra y responde 500/503.
- Todo `AppError` se construye con una factory en el `*.errors.ts` del módulo o integración, o en `common/errors/errors.ts` si es genérico. Nunca `new AppError(...)` fuera de esos archivos. Una factory por código+mensaje, sin mensajes repetidos.
- `try/catch` solo para: (a) traducir una falla externa concreta y esperada en el borde (errno conocido de mysql2, respuesta o timeout del proveedor, excepción de una librería) a un `AppError` o señal interna; (b) absorber una falla con un plan alternativo (fail-open) — el único caso donde esa capa loguea. Nunca atrapar para relanzar, para "envolver por las dudas" ni `catch (e) { throw e; }`.
- El error de un request se loguea una sola vez, en el filtro global. Nada de log-and-rethrow en services, repositorios, guards ni integraciones.
- Fuera del contexto HTTP (cron, workers, consumidores) no hay filtro: el punto de entrada del job atrapa, registra con contexto y decide reintento/alerta.
- Filtro e interceptores transversales se registran una vez como `APP_FILTER`/`APP_INTERCEPTOR` en un módulo. Nunca `app.useGlobalFilters(new ...)` en `main.ts`, nunca `@UseFilters`/`@UseInterceptors` por controller.
- El dominio (services, repositorios, policies) y los guards, pipes y decoradores que aplican reglas del negocio lanzan el `AppError` del dominio, nunca `HttpException`/`NotFoundException`; el filtro traduce a HTTP. El dominio no conoce HTTP.
- Las excepciones HTTP nativas de Nest se usan solo para cuestiones del protocolo que el dominio no conoce (p. ej. rechazar un método no declarado o simular una ruta inexistente), en un helper de `common/http/` con nombre explícito (como `assertGetMethod` en `get-only.ts`), y así reproducen la misma respuesta que Nest da a una ruta que no existe.
- Mensajes y causas: nunca repiten el input del cliente (`User with ID ${id}`) ni valores de configuración (URLs, secretos, connection strings); la causa lleva una razón (`{ reason: 'invalid-url' }`), no la excepción cruda que contiene el valor. Nada de `details?: any`.
- Integraciones externas: timeout obligatorio en toda llamada; distinguir "el proveedor respondió con error" de "no respondió" (códigos distintos); reintentos con backoff solo en operaciones idempotentes (nunca en una que crea un recurso cobrable, p. ej. generar un QR de pago).
- Validación una sola vez en el borde (DTO Zod / schema de la respuesta del proveedor); lo ya validado viaja tipado — una función interna no recibe `unknown` ni revalida con `typeof`, ni existen validadores a mano para una forma que ya tiene schema.
- Un flujo con varios pasos se divide en métodos privados con nombre, uno por paso (leer, verificar, reservar, llamar al proveedor, confirmar); no un método con un `try/catch` por paso.
- No se escriben tests para ramas defensivas imposibles: si una rama no puede ocurrir porque el tipo o el schema la impide, se borra la rama, no se testea.

**No copiar de artículos genéricos:**

- `HttpException` (o subclases) lanzada desde un service, controller o guard de negocio (solo se admite en los helpers de protocolo de `common/http/`).
- `class-validator` — este proyecto valida con Zod (ver [Stack y convenciones de NestJS](#stack-y-convenciones-de-nestjs)).
- `app.useGlobalFilters(new ...)` en `main.ts`.
- `.toPromise()` sobre un `Observable` — usa `firstValueFrom`.
- Configuración vieja de `@nestjs/throttler` (`ThrottlerModule.forRoot({ ttl, limit })`) — la API actual usa un array de `throttlers`.

## Reglas generales

- Un solo idioma para nombres de archivos, carpetas y símbolos de código; los términos de dominio y el copy pueden ir en el idioma del negocio.
- `core/` nunca importa de `modules/`. `common/` nunca importa de `core/`, `modules/` ni `integrations/`.
- Un servicio o repositorio vive en un solo módulo; si dos módulos lo necesitan, se mueve a `common/` (código plano transversal sin módulo Nest, sin conocer el dominio) o a `core/` (infraestructura con su propio módulo Nest), o queda expuesto como puerto de un módulo (`*.ports.ts`) que el otro consume.
- Los tipos crudos de una API externa nunca salen de `integrations/`: los módulos de negocio solo ven los tipos de `*.ports.ts`.
- Comentarios: sin cabecera por archivo, clase o función; el nombre y los tipos ya dicen qué es. Un comentario solo cuando evita un error real (decisión no obvia, constante mágica del proveedor, restricción de seguridad), máximo 3 líneas seguidas, en presente, sin narrar historia. No repite lo que dice el tipo ni duplica lo que ya está en `docs/`.
- Tests honestos: nunca fuerces el código de producción para que un test pase (nada de tipos debilitados o duplicados, alias, reexports, shims, `any`, `as unknown as`, `@ts-ignore`). Actualiza los fixtures a los contratos reales. Los cambios de comportamiento siguen TDD: primero el test que falla.
- Tests: dobles tipados con `Pick<T, 'metodo'>` o una instancia real con dependencias falsas, sin casts. Datos inválidos a propósito: un único helper por archivo con nombre explícito (`asInvalidInput(value)`); `@ts-expect-error` solo para probar que algo NO compila. En producción, un cliente de terceros mal tipado se adapta en un helper con nombre explícito, nunca con un cast suelto.

## Estructura del proyecto

Convención común de la comunidad NestJS, no algo prescrito por la documentación oficial de Nest — Nest solo prescribe módulos por feature; `core/`, `common/`, `commands/` y la separación de `integrations/` son una convención adoptada, no un requisito del framework.

```
src/
├── main.ts
├── app.module.ts
├── core/
│   ├── config/
│   │   ├── env.ts                    # validación Zod de todo el .env al arrancar
│   │   ├── validate-boot.ts          # corre env.ts al boot y aborta el proceso si falla
│   │   └── config.module.ts          # provee la configuración vía un token/loader
│   ├── database/
│   │   ├── database.module.ts        # pool perezoso de mysql2 (provider MARIADB_POOL)
│   │   ├── mariadb-pool.ts
│   │   └── with-transaction.ts       # withTransaction(pool, work): begin/commit/rollback/release
│   ├── redis/
│   │   ├── redis.module.ts           # cliente perezoso de ioredis
│   │   └── redis-keys.ts
│   ├── rate-limit/                   # throttling global de la app: infraestructura, no negocio
│   │   └── rate-limit.module.ts
│   └── http/
│       ├── http-platform.module.ts   # registra el filtro/interceptor globales una sola vez (APP_FILTER/APP_INTERCEPTOR)
│       └── app-exception.filter.ts   # AppError -> HTTP, sin conocer ningún módulo de negocio
├── common/
│   ├── errors/
│   │   └── errors.ts                 # ERROR_CODES, HTTP_STATUS_BY_CODE, AppError
│   ├── utils/
│   │   └── money.ts                  # centavos (bigint): parse, formato, suma, comparación
│   ├── security/
│   │   └── <helper>.ts               # criptografía/tokens puros sin dependencias de módulo
│   └── http/
│       └── zod.pipe.ts               # ZodValidationPipe (.strict())
├── integrations/
│   ├── http/
│   │   ├── http-transport.ts         # fetch wrapper compartido por todos los clients externos
│   │   └── single-flight-token.ts    # caché + single-flight + renovación de token compartida
│   └── <proveedor>/
│       ├── <proveedor>.client.ts
│       ├── <proveedor>.types.ts      # tipos crudos de la API externa
│       ├── <proveedor>.mapper.ts     # respuesta cruda -> tipo interno
│       └── <proveedor>.local.ts      # simulador para desarrollo, sin llamar a la API real
├── modules/
│   └── <feature>/
│       ├── <feature>.module.ts
│       ├── <feature>.ports.ts
│       ├── <feature>.controller.ts
│       ├── <feature>.service.ts
│       ├── <feature>.errors.ts
│       ├── <feature>.repository.ts   # repositories/ si el módulo tiene más de uno
│       ├── dto/
│       │   └── <accion>.dto.ts
│       ├── models/
│       │   ├── <feature>.row.ts
│       │   └── <feature>.model.ts
│       ├── rules/                    # solo si el módulo tiene decisiones puras propias
│       │   └── <feature>.policy.ts
│       ├── mappers/                  # solo si el módulo mapea proveedor/fila -> tipo interno
│       │   └── <feature>.mapper.ts
│       ├── guards/                   # solo si el módulo tiene guards propios
│       └── decorators/               # solo si el módulo tiene decoradores propios
├── commands/
│   └── <nombre>.ts                   # entry points de comandos operativos (`pnpm <script>`)
└── events/                           # opcional: solo en apps event-driven (publishers/handlers/listeners)
```

### Qué va en cada carpeta

- `core/`: módulos y providers Nest de infraestructura transversal de toda la app — config, base de datos, cache/Redis, rate-limit, el módulo que registra el filtro global y el interceptor. Cada pieza tiene su propio `*.module.ts`. Nunca importa de `modules/`.
- `common/`: código plano reutilizable, sin módulo Nest — errores, utilidades, helpers de seguridad, pipes/guards/decoradores genéricos, helpers de protocolo HTTP. Nunca importa de `core/`, `modules/` ni `integrations/`.
- `integrations/`: la única capa que conoce las APIs externas. `integrations/http/` tiene la base compartida (transporte HTTP, caché de tokens); una carpeta por proveedor con su client, sus tipos crudos, su mapper y, si aplica, un simulador local.
- `modules/<feature>/`: una carpeta por feature de negocio, con la forma fija de la raíz (`*.module.ts`, controller, service, repositorio(s), `*.errors.ts`, `*.ports.ts`) y subcarpetas (`dto/`, `models/`, `rules/`, `mappers/`, `guards/`, `decorators/`) solo cuando el módulo las necesita.
- `commands/`: comandos que se ejecutan por fuera del servidor HTTP (migraciones de datos, tareas de operador).
- `events/` (opcional): solo cuando la app es event-driven; publishers/handlers/listeners, sin mezclarse con `modules/`.

### Capas (reglas)

```text
controller    recibe la petición, la delega al service, devuelve la respuesta; sin lógica de negocio
service       lógica de negocio del flujo; llama a repositorios, integraciones y rules
repository    única capa con SQL o acceso a Redis; devuelve datos (hechos), nunca decide negocio
              ni lanza errores de dominio: reporta lo que encontró y el service decide qué hacer
rules         funciones puras de decisión (clasificar, exponer o no un dato), sin I/O
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
- Transacciones: un helper compartido `withTransaction(pool, work)` en `core/database/with-transaction.ts` (begin/commit/rollback silencioso/release). Lo llama únicamente el repositorio agregado que necesita atomicidad. No hay Unit of Work: el resto de los repositorios usa `pool.execute(...)` directamente.
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
rg -n "from '.*modules/" src/core src/common
rg -n "from '.*(core|modules|integrations)/" src/common
rg -n 'new AppError\(' src --glob '!*.errors.ts' --glob '!*.spec.ts' --glob '!src/common/errors/errors.ts'
rg -n '@UseFilters|@UseInterceptors|useGlobalFilters' src
```

Las dos primeras son los límites de capa: `core/` nunca importa de `modules/`; `common/` nunca importa de `core/`, `modules/` ni `integrations/`.

Y estos, que hay que revisar caso por caso (no tienen que dar vacío):

```bash
rg -n 'new (HttpException|\w+Exception)\(' src --glob '!*.spec.ts' --glob '!src/common/http/**'   # vacío: solo el filtro y los helpers de protocolo de common/http/ pueden usarlas
rg -n 'catch \(' src --glob '!*.spec.ts'                             # cada uno traduce en un borde o es fail-open con log
rg -n ': unknown' src/modules src/integrations --glob '!*.spec.ts'   # solo en bordes (respuesta cruda de un proveedor o de la BD)
```

No des una tarea por terminada con errores de build, lint, tests fallidos, el typecheck en rojo o alguno de los greps con resultado.
