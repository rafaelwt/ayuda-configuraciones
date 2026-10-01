# Estructura del proyecto (grande)

API ASP.NET Core (.NET 10) con Clean Architecture en 4 proyectos: `Domain`, `Application`, `Infrastructure` y `Web`. Incluye REST, gRPC opcional, jobs en segundo plano e integraciones con servicios externos (SOAP/REST).

Los nombres `Orders`, `Customers`, `Catalogs` y `ExternalProvider` son ejemplos: reemplázalos por los del negocio.

```
<Solution>.slnx
Directory.Build.props                 # TargetFramework, Nullable, ImplicitUsings, TreatWarningsAsErrors
Directory.Packages.props              # versiones de NuGet centralizadas (Central Package Management)
global.json                           # fija la versión del SDK
.editorconfig                         # estilo y reglas de analizadores
.env.example                          # variables para producción (nunca el .env real)
Dockerfile
docker-compose.yml
README.md
src/
├── Domain/                           # núcleo: no depende de nadie
│   ├── Common/
│   │   ├── Entity.cs                 # clase base (Id, igualdad)
│   │   ├── Result.cs                 # Result / Result<T> + Error
│   │   └── DomainException.cs
│   ├── Orders/                       # una carpeta por agregado
│   │   ├── Order.cs                  # entidad raíz con su comportamiento
│   │   ├── OrderLine.cs
│   │   ├── OrderStatus.cs            # enum del agregado
│   │   ├── OrderErrors.cs            # errores de negocio del agregado
│   │   └── OrderConstants.cs
│   ├── Customers/
│   │   ├── Customer.cs
│   │   └── TaxId.cs                  # value object
│   └── Domain.csproj
├── Application/                      # casos de uso: depende solo de Domain
│   ├── Common/
│   │   ├── Abstractions/             # puertos transversales que implementa Infrastructure
│   │   │   ├── IDbContext.cs
│   │   │   ├── ICurrentUser.cs
│   │   │   ├── IDateTimeProvider.cs
│   │   │   ├── IEmailSender.cs
│   │   │   ├── INotificationSender.cs
│   │   │   └── IFileStorage.cs
│   │   ├── Models/
│   │   │   ├── ApiResponse.cs        # envoltorio de respuesta estándar
│   │   │   └── PagedResult.cs
│   │   ├── Behaviors/                # opcional: validación/logging alrededor de los casos de uso
│   │   └── Utils/                    # funciones puras
│   ├── Features/
│   │   ├── Orders/
│   │   │   ├── CreateOrder/          # un caso de uso por carpeta
│   │   │   │   ├── CreateOrderRequest.cs
│   │   │   │   ├── CreateOrderResponse.cs
│   │   │   │   ├── CreateOrderValidator.cs
│   │   │   │   └── CreateOrderUseCase.cs   # + ICreateOrderUseCase si se necesita
│   │   │   ├── CancelOrder/
│   │   │   ├── GetOrder/
│   │   │   ├── Abstractions/         # puertos propios de la feature
│   │   │   │   ├── IOrderRepository.cs
│   │   │   │   └── IOrderDocumentBuilder.cs
│   │   │   ├── Jobs/                 # jobs de la feature (lógica, no la planificación)
│   │   │   │   └── ProcessPendingOrdersJob.cs
│   │   │   └── OrderMappings.cs
│   │   ├── Customers/
│   │   │   ├── RegisterCustomer/
│   │   │   ├── VerifyTaxId/
│   │   │   └── Abstractions/
│   │   │       └── ICustomerRepository.cs
│   │   ├── Catalogs/                 # tablas de catálogo (CRUD simple)
│   │   │   ├── CatalogItemDto.cs
│   │   │   ├── ICatalogRepository.cs # genérico: un repo para N catálogos
│   │   │   ├── CatalogService.cs
│   │   │   └── SyncCatalogs/         # caso de uso complejo dentro de la feature
│   │   └── Identity/                 # usuarios, roles, menús
│   │       ├── Login/
│   │       ├── Users/
│   │       └── Abstractions/
│   │           └── ITokenGenerator.cs
│   ├── DependencyInjection.cs        # AddApplication(): use cases, validators, jobs
│   └── Application.csproj
├── Infrastructure/                   # adaptadores: implementa los puertos de Application
│   ├── Persistence/
│   │   ├── DbContext.cs              # conexión + helpers (Dapper/EF)
│   │   ├── Repositories/
│   │   │   ├── OrderRepository.cs    # nombrado por agregado, no por tabla
│   │   │   ├── CustomerRepository.cs
│   │   │   └── CatalogRepository.cs
│   │   └── Migrations/               # o scripts SQL / stored procedures versionados
│   ├── Integrations/
│   │   └── ExternalProvider/         # una carpeta por sistema externo
│   │       ├── ExternalProviderClient.cs     # HTTP/SOAP: envía y recibe
│   │       ├── ExternalProviderOptions.cs    # URLs, timeouts, reintentos
│   │       ├── ExternalProviderResponseParser.cs
│   │       ├── Contracts/            # DTOs del proveedor (nunca salen de esta carpeta)
│   │       └── Templates/            # plantillas XML/JSON embebidas (EmbeddedResource)
│   ├── Documents/                    # generación de PDF/Excel/XML
│   │   ├── Pdf/
│   │   │   ├── PdfReportFactory.cs   # selecciona el reporte según el tipo
│   │   │   ├── PdfReportBase.cs
│   │   │   └── Reports/
│   │   │       └── OrderReport.cs
│   │   └── Excel/
│   ├── Security/
│   │   ├── JwtOptions.cs
│   │   ├── JwtTokenGenerator.cs      # implementa ITokenGenerator
│   │   └── CertificateLoader.cs
│   ├── Messaging/
│   │   ├── SmtpEmailSender.cs
│   │   └── TelegramNotificationSender.cs
│   ├── BackgroundJobs/
│   │   └── HangfireSetup.cs          # storage y registro de jobs recurrentes
│   ├── Common/
│   │   ├── DateTimeProvider.cs
│   │   └── Compression/
│   ├── DependencyInjection.cs        # AddInfrastructure(config): repos, clients, options
│   └── Infrastructure.csproj
└── Web/                              # host: HTTP, gRPC, composición
    ├── Endpoints/                    # o Controllers/, uno por recurso
    │   ├── Orders/
    │   │   └── OrdersController.cs
    │   ├── Customers/
    │   ├── Catalogs/
    │   │   └── CatalogsController.cs # GET /catalogs/{catalogName}
    │   ├── Identity/
    │   └── HealthController.cs
    ├── Grpc/
    │   ├── Protos/
    │   │   └── orders.proto
    │   └── OrdersGrpcService.cs
    ├── Middlewares/
    │   └── ExceptionHandlingMiddleware.cs   # o IExceptionHandler + ProblemDetails
    ├── Filters/
    │   └── DashboardAuthorizationFilter.cs
    ├── Auth/
    │   └── CurrentUser.cs            # implementa ICurrentUser leyendo los claims
    ├── Extensions/
    │   ├── SwaggerExtensions.cs
    │   ├── AuthExtensions.cs
    │   └── ObservabilityExtensions.cs  # Serilog + OpenTelemetry
    ├── Properties/
    │   └── launchSettings.json
    ├── appsettings.json              # valores no sensibles
    ├── appsettings.Development.example.json
    ├── appsettings.Serilog.json
    ├── Program.cs                    # solo composición: AddApplication, AddInfrastructure, pipeline
    ├── Web.http
    └── Web.csproj
tests/
├── Domain.Tests/                     # reglas de entidades y value objects
├── Application.Tests/                # casos de uso y validators con dobles de los puertos
│   └── Features/
│       └── Orders/
│           └── CreateOrderUseCaseTests.cs
├── Infrastructure.Tests/             # integración: repos (Testcontainers), parsers de proveedores
├── Web.Tests/                        # endpoints con WebApplicationFactory
└── Architecture.Tests/               # reglas de dependencia (NetArchTest / ArchUnitNET)
docs/                                 # opcional: decisiones (ADR), integraciones, SQL
deploy/                               # opcional: scripts y notas de despliegue
```

## Qué va en cada proyecto

- `Domain/`: entidades, value objects, enums, constantes y errores de negocio, agrupados por agregado. Sin NuGet de infraestructura, sin `IOptions`, sin claims, sin certificados, sin HTTP.
- `Application/`: casos de uso, DTOs de entrada/salida, validators y los **puertos** (interfaces) que necesita. Sabe *qué* hacer, no *cómo* se persiste ni con quién se habla.
- `Infrastructure/`: implementaciones de los puertos: base de datos, clientes de servicios externos, PDF, correo, JWT, Hangfire. Las clases `*Options` de configuración viven aquí, junto a quien las usa.
- `Web/`: controllers/endpoints, gRPC, middlewares, filtros y `Program.cs`. Traduce HTTP ↔ casos de uso. Sin lógica de negocio.

## Features y casos de uso

- `Application/Features/<Feature>/` agrupa todo lo de una funcionalidad: casos de uso, DTOs, validators, puertos y jobs. Se organiza por funcionalidad, no por tipo (`Services/`, `DTOs/`, `Interfaces/` globales).
- Un caso de uso por carpeta: `<Verbo><Sustantivo>/` con su `Request`, `Response`, `Validator` y `UseCase`. Abrir la carpeta cuenta toda la historia de esa operación.
- Operaciones CRUD simples sin reglas (catálogos, tablas de parámetros) no necesitan un caso de uso por operación: un `Service` por feature o un repositorio genérico basta.
- La interfaz `I<Nombre>UseCase` es opcional. Créala solo si hay más de una implementación o si otro caso de uso la consume y necesitas sustituirla en tests.

## Puertos (interfaces)

- Un puerto que usa una sola feature: en `Features/<Feature>/Abstractions/`.
- Un puerto que usan varias features (correo, notificaciones, reloj, usuario actual, almacenamiento): en `Common/Abstractions/`.
- Los nombres no llevan carpetas con prefijo `I` (`IRepositories/`, `IServices/`). La `I` va en el archivo, no en la carpeta.

## Integraciones externas

- Cada sistema externo tiene su carpeta en `Infrastructure/Integrations/<Proveedor>/` con su cliente, opciones, parser y contratos.
- Los DTOs del proveedor (`Contracts/`) nunca salen de esa carpeta: el cliente los traduce a modelos de Application.
- Las plantillas (XML/JSON) van como `EmbeddedResource` del proyecto `Infrastructure`, no copiadas en `Web/Assets/`.
- Los errores de transporte (timeout, servicio no disponible) se convierten en un resultado tipado (`Result` con un `Error` conocido) para que el caso de uso decida, por ejemplo, entrar en modo contingencia.
- Los reintentos y timeouts se configuran en el `HttpClient` (`AddStandardResilienceHandler` / Polly), no en bucles manuales.

## Estrategias y fábricas

Cuando el comportamiento cambia según un tipo (tipo de documento, canal, proveedor):

- La interfaz (`I<Algo>Strategy`) va en Application, en la feature que la usa.
- Las implementaciones van junto al adaptador que las necesita (Persistence, Documents, Integrations), en una carpeta `Strategies/`.
- Regístralas con keyed services (`AddKeyedScoped<IStrategy, Impl>(key)`) en vez de un `switch` en una fábrica manual.

## Jobs en segundo plano

- La **lógica** del job es un caso de uso o una clase en `Features/<Feature>/Jobs/`. No conoce Hangfire.
- La **planificación** (cron, storage, dashboard) vive en `Infrastructure/BackgroundJobs/` y se registra desde `AddInfrastructure()`.
- Usa un solo mecanismo: Hangfire **o** `BackgroundService`, no los dos para el mismo tipo de tarea.

## Inyección de dependencias

- Cada capa expone su extensión: `AddApplication()` en `Application/DependencyInjection.cs` y `AddInfrastructure(configuration)` en `Infrastructure/DependencyInjection.cs`.
- `Program.cs` solo compone: `builder.Services.AddApplication().AddInfrastructure(builder.Configuration).AddWeb();`.
- Elige el ciclo de vida a propósito: `Singleton` para clientes sin estado y opciones, `Scoped` para lo que usa la conexión o el usuario actual, `Transient` para lo liviano. No todo `Scoped` por costumbre.
- Valida las opciones al arrancar: `AddOptions<T>().BindConfiguration("Section").ValidateDataAnnotations().ValidateOnStart()`.

## Respuestas y errores

- Los casos de uso devuelven `Result<T>`; no lanzan excepciones para errores de negocio esperados.
- `Web` traduce `Result` a HTTP: éxito → 200/201, validación → 400, no encontrado → 404, conflicto → 409, servicio externo caído → 503.
- Las excepciones no controladas las captura un único `IExceptionHandler` (o middleware) y responde con `ProblemDetails`. Un error inesperado es 500, no 400.

## Configuración y secretos

- `appsettings.json` solo lleva valores no sensibles. Los secretos van en User Secrets (desarrollo) y variables de entorno o un vault (producción).
- `appsettings.Development.json`, `.env`, certificados (`.p12`, `.pfx`) y `logs/` están en `.gitignore`. Se versiona solo el `.example`.
- Los certificados se cargan desde una ruta o secreto configurado, nunca desde una carpeta del repositorio.

## Reglas de dependencia

- `Domain` no referencia ningún proyecto.
- `Application` referencia solo `Domain`.
- `Infrastructure` referencia `Application` (y por ella `Domain`).
- `Web` referencia `Application` e `Infrastructure` (esta última solo para la composición en `Program.cs`).
- Una feature no usa los casos de uso, repositorios ni DTOs de otra. Si algo se comparte, se mueve a `Common/` o a `Domain/`.
- Los controllers no inyectan repositorios ni `DbContext`: solo casos de uso o servicios de Application.
- Estas reglas se verifican con tests en `Architecture.Tests/`, no solo por convención.

## Convenciones de nombres

- Clases por responsabilidad y en singular: `OrderRepository`, `CreateOrderUseCase`, `ExternalProviderClient`.
- Sin prefijos de tabla (`Tbl…`) ni de capa en el nombre de la clase. El nombre del agregado basta.
- Un tipo por archivo, archivo con el mismo nombre que el tipo.
- Rutas REST en plural y kebab-case: `/api/v1/orders`, `/api/v1/catalogs/{catalog-name}`.
- Endpoints de desarrollo o certificación en un controller propio, registrado solo en `Development` (`if (app.Environment.IsDevelopment())`).

## Tests

- `tests/` refleja la estructura de `src/`: `Features/Orders/CreateOrderUseCaseTests.cs` prueba `Features/Orders/CreateOrder/`.
- Application se prueba con dobles de los puertos (NSubstitute/Moq o fakes a mano).
- Infrastructure se prueba contra dependencias reales en contenedor (Testcontainers) y con respuestas grabadas del proveedor externo.
- Web se prueba con `WebApplicationFactory<Program>`.
