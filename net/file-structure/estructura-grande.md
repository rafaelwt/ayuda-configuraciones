# Estructura del proyecto (grande)

API ASP.NET Core (.NET 10) con Clean Architecture en 4 proyectos (`Domain`, `Application`, `Infrastructure`, `Web`), acceso a datos con Dapper + stored procedures, integración con un servicio externo (SOAP/REST), jobs con Hangfire, gRPC y reportes PDF.

`<Modulo>` es el nombre de un módulo de negocio (por ejemplo `Ventas`) y `<Entidad>` el de una tabla o recurso (por ejemplo `Clientes`).

```
<Solucion>.slnx
Directory.Packages.props              # versiones de NuGet centralizadas
.editorconfig
.env.example                          # variables de producción (nunca el .env real)
.gitignore
Dockerfile
docker-compose.prod.yml
README.md
CLAUDE.md                             # opcional: guía para agentes
src/
├── Domain/                           # sin dependencias
│   ├── Constants/
│   │   ├── CoreConstants.cs          # constantes generales (estados, formatos)
│   │   ├── <Modulo>Constants.cs      # Status: SUCCESS, ERROR, EMPTY, TIMEOUT, SERVICE_UNAVAILABLE
│   │   └── Catalogos/                # un archivo por catálogo de códigos fijos
│   │       └── TipoDocumento.cs
│   ├── Enums/
│   │   └── <Modulo>Enum.cs
│   ├── Models/
│   │   ├── Data/                     # modelos transversales
│   │   │   ├── CoreResponse.cs       # CoreResponse / CoreResponse<T>
│   │   │   ├── RespuestaDB.cs        # resultado estándar de los stored procedures
│   │   │   ├── RespuestaError.cs
│   │   │   ├── RespuestaExterna.cs   # resultado estándar del servicio externo
│   │   │   └── RetryPolicy.cs
│   │   ├── <Modulo>/                 # modelos propios del módulo
│   │   │   └── <Entidad>.cs
│   │   └── GlobalModels.cs
│   ├── Utils/                        # funciones puras, sin dependencias externas
│   │   ├── DataUtils.cs
│   │   ├── ObjectUtils.cs
│   │   └── ValidationUtils.cs
│   └── Domain.csproj
├── Application/                      # lógica de negocio: depende solo de Domain
│   ├── DTOs/
│   │   ├── <Modulo>/
│   │   │   ├── ServiciosDB/          # DTOs de entrada/salida de los CRUD
│   │   │   └── ServiciosExternos/    # DTOs de las operaciones con el servicio externo
│   │   └── UtilModelsDTO.cs
│   ├── Interfaces/
│   │   ├── IData/                    # contratos de los contextos de datos
│   │   │   ├── IApplicationDbContext.cs
│   │   │   ├── IAppsettingsContext.cs
│   │   │   └── IExternalServicesContext.cs
│   │   ├── IRepositories/
│   │   │   ├── <Modulo>/
│   │   │   │   ├── ServiciosDB/
│   │   │   │   │   └── I<Entidad>Repository.cs
│   │   │   │   └── ServiciosExternos/
│   │   │   │       └── I<Operacion>Repository.cs
│   │   │   ├── IMailRepository.cs
│   │   │   ├── IReportsRepository.cs
│   │   │   └── INotificacionRepository.cs
│   │   ├── IServices/
│   │   │   ├── <Modulo>/
│   │   │   ├── ServiciosDB/
│   │   │   │   └── I<Entidad>Service.cs
│   │   │   └── Jobs/
│   │   │       └── I<Nombre>Job.cs
│   │   └── ISecurity/
│   │       └── IJwtTokenGenerator.cs
│   ├── Modules/                      # casos de uso de varios pasos
│   │   └── <Modulo>/
│   │       ├── Interfaces/
│   │       │   └── I<Accion><Entidad>UseCase.cs
│   │       ├── UseCases/
│   │       │   └── <Accion><Entidad>UseCase.cs   # EmitirDocumento, AnularDocumento…
│   │       └── Validators/           # validaciones de negocio del módulo
│   ├── Services/
│   │   ├── <Modulo>/                 # servicios que envuelven repos del servicio externo
│   │   ├── ServiciosDB/              # un servicio por recurso CRUD
│   │   │   ├── Administracion/       # usuarios, roles, menús
│   │   │   └── <Entidad>Service.cs
│   │   ├── Jobs/                     # lógica de los jobs (Hangfire los invoca)
│   │   │   ├── DailyActionsJob.cs
│   │   │   └── <Nombre>Job.cs
│   │   ├── FileService.cs
│   │   └── UtilService.cs
│   ├── Validators/                   # FluentValidation de los DTOs de entrada
│   │   ├── IValidatorFactory.cs
│   │   └── <Modulo>/
│   │       ├── Base<Nombre>Validations.cs   # reglas comunes reutilizables
│   │       └── <Request>Validator.cs
│   ├── Utils/
│   └── Application.csproj
├── Infrastructure/                   # implementaciones: depende de Application
│   ├── Constants/
│   │   ├── InfrastructureConstants.cs
│   │   └── ReportConstants.cs
│   ├── Persistence/                  # los tres contextos de datos
│   │   ├── ApplicationDbContext.cs   # MySQL/Dapper: ejecuta stored procedures
│   │   ├── AppsettingsContext.cs     # IOptions / IOptionsSnapshot
│   │   └── ExternalServicesContext.cs   # carga plantilla, envía SOAP/HTTP, parsea respuesta
│   ├── Repositories/
│   │   ├── <Modulo>/
│   │   │   ├── ServiciosDB/
│   │   │   │   ├── Administracion/
│   │   │   │   └── <Entidad>Repository.cs
│   │   │   ├── ServiciosExternos/
│   │   │   │   └── <Operacion>Repository.cs
│   │   │   └── Strategies/           # persistencia distinta según el tipo de documento
│   │   │       ├── <Tipo>Strategy.cs
│   │   │       └── PersistenceStrategyFactory.cs
│   │   ├── MailRepository.cs
│   │   ├── ReportsRepository.cs
│   │   └── NotificacionRepository.cs
│   ├── Factory/                      # selección del reporte PDF por tipo
│   │   ├── ReportsAbstract.cs
│   │   └── ReportsCreator.cs
│   ├── Reports/
│   │   └── <Modulo>/
│   │       ├── Custom/               # reportes personalizados por cliente
│   │       └── Rpt<Tipo>.cs
│   ├── Security/
│   │   ├── JwtIssuerOptions.cs
│   │   └── JwtTokenGenerator.cs      # implementa IJwtTokenGenerator
│   ├── Services/                     # servicios técnicos (XML, códigos, compresión)
│   │   ├── XmlBuilder.cs
│   │   ├── CodeGenerator.cs
│   │   ├── ExternalResponseProcessor.cs
│   │   └── TarGzipCompressor.cs
│   ├── Utils/
│   │   ├── CertificateUtils.cs
│   │   ├── ClaimsUtils.cs
│   │   ├── CryptoUtils.cs
│   │   ├── JsonSerializerHelper.cs
│   │   ├── QrCodeHelper.cs
│   │   └── XmlTemplateHelper.cs
│   └── Infrastructure.csproj
└── Web/                              # host: HTTP, gRPC, DI
    ├── Assets/
    │   ├── Images/                   # logos e imágenes de los reportes
    │   └── Templates/
    │       └── <Modulo>/             # plantillas XML/SOAP del servicio externo
    ├── Controllers/
    │   ├── Administracion/
    │   ├── ServiciosDB/              # CRUD de tablas
    │   │   └── <Entidad>Controller.cs
    │   ├── ServiciosExternos/        # endpoints de integración
    │   │   └── <Operacion>Controller.cs
    │   ├── DevTools/                 # solo Development
    │   ├── HealthController.cs
    │   └── UtilController.cs
    ├── Filters/
    │   └── HangfireJwtAuthorizationFilter.cs
    ├── GrpcServices/
    │   └── <Modulo>GrpcService.cs
    ├── Protos/
    │   └── <modulo>.proto
    ├── Ioc/
    │   ├── IocData.cs                # HttpClient y contextos de datos
    │   ├── IocRepository.cs          # repositorios y servicios de Infrastructure
    │   └── IocServices.cs            # servicios, use cases, validators, jobs
    ├── Middlewares/
    │   └── ErrorHandlingMiddleware.cs
    ├── Pages/                        # login del dashboard de Hangfire
    ├── Profiles/                     # AutoMapper / Mapster
    │   └── <Modulo>Profile.cs
    ├── Properties/
    │   └── launchSettings.json
    ├── appsettings.json
    ├── appsettings.Development.example.json
    ├── appsettings.Serilog.json
    ├── GlobalUsings.cs
    ├── Program.cs                    # DI, pipeline, registro de jobs recurrentes
    ├── Web.http
    └── Web.csproj
tests/
├── Application.Tests/
│   ├── Services/
│   ├── UseCases/
│   └── Validators/
└── Infrastructure.Tests/             # opcional: repos y parsers del servicio externo
docs/
├── sql/                              # stored procedures y scripts versionados
├── integracion/                      # documentación del servicio externo
└── pruebas/
```

## Qué va en cada proyecto

- `Domain/`: constantes, enums, modelos y utilidades puras. No referencia ningún proyecto ni paquete de infraestructura.
- `Application/`: DTOs, interfaces, servicios, casos de uso, validators y la lógica de los jobs. Define las interfaces de todo lo que implementa Infrastructure.
- `Infrastructure/`: contextos de datos, repositorios, reportes PDF, JWT y servicios técnicos (XML, compresión, generación de códigos).
- `Web/`: controllers, gRPC, middlewares, filtros, DI y archivos estáticos. Sin lógica de negocio.

## Contextos de datos (`Infrastructure/Persistence/`)

Hay tres estrategias de acceso a datos y cada una tiene su contexto y su interfaz en `Application/Interfaces/IData/`:

- `ApplicationDbContext`: base de datos vía Dapper. Todo pasa por stored procedures con métodos genéricos (`ExecuteProcedureWithParameter<T>`, `GetAllObjectWithParameters<T>`, `GetOneObjectWithParameters<T>`). Los parámetros se envían como objetos anónimos.
- `AppsettingsContext`: configuración. `IOptions<T>` para valores fijos e `IOptionsSnapshot<T>` para valores recargables.
- `ExternalServicesContext`: integración con el servicio externo. Carga la plantilla de `Web/Assets/Templates/`, reemplaza los placeholders, envía la petición, parsea la respuesta y detecta `ServiceUnavailable` para que el caso de uso decida (por ejemplo, entrar en contingencia).

Los repositorios nunca abren conexiones ni crean `HttpClient` por su cuenta: siempre usan el contexto.

## Servicio, repositorio o caso de uso

- **Repositorio** (`Infrastructure/Repositories/`): solo acceso a datos. Uno por tabla/recurso en `ServiciosDB/` y uno por grupo de operaciones del servicio externo en `ServiciosExternos/`.
- **Servicio** (`Application/Services/`): envuelve uno o más repositorios, valida y devuelve `CoreResponse`. Suficiente para un CRUD.
- **Caso de uso** (`Application/Modules/<Modulo>/UseCases/`): operación de varios pasos que coordina servicios, repositorios y el servicio externo (emitir, anular, sincronizar, subir pendientes). Un caso de uso por archivo, nombrado `<Accion><Entidad>UseCase`.

Regla práctica: si la operación es "leer/guardar una tabla", es un servicio. Si tiene pasos, reglas o llamadas externas, es un caso de uso.

## Validaciones

- `Application/Validators/<Modulo>/`: validators de FluentValidation para los DTOs de entrada. Las reglas comunes van en clases `Base<Nombre>Validations` y se reutilizan con `Include(...)`.
- `IValidatorFactory` resuelve el validator según el tipo de documento.
- `Application/Modules/<Modulo>/Validators/`: validaciones de negocio que necesitan datos (consultar la base, el estado de un registro).
- FluentValidation configurado en español (`ValidatorOptions.Global.LanguageManager.Culture`).

## Estrategias y fábricas

Cuando el comportamiento depende de un tipo (tipo de documento, sector, canal):

- La interfaz (`IPersistenceStrategy`, `IPersistenceStrategyFactory`) va en `Application/Interfaces/`.
- Las implementaciones van en `Infrastructure/Repositories/<Modulo>/Strategies/`, una por tipo.
- Los reportes PDF siguen el mismo patrón: `Factory/ReportsCreator.cs` elige la clase de `Reports/` según el tipo, y todas heredan de `ReportsAbstract`.

## Respuestas y errores

- Toda operación devuelve `CoreResponse` o `CoreResponse<T>`, con `status` (constantes de `<Modulo>Constants.Status`) y `errorList` opcional.
- Los controllers devuelven el `CoreResponse` tal cual, sin armar respuestas propias.
- `ErrorHandlingMiddleware` captura las excepciones no controladas y responde en formato `CoreResponse`.

## Controllers

- Ruta: `[Route("api/v{version:apiVersion}/[controller]")]` con `[ApiVersion(...)]`.
- Autenticación JWT por defecto: `[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]`.
- Los datos del usuario (id, empresa, etc.) se obtienen del token con `ClaimsUtils.GetTokenUserData(User)`, nunca del body.
- Los controllers inyectan servicios o casos de uso, nunca repositorios ni contextos.
- `DevTools/`: endpoints de prueba o certificación, solo disponibles en Development.

## Inyección de dependencias (`Web/Ioc/`)

- `IocData`: `HttpClient` (con `IHttpClientFactory`) y contextos de datos.
- `IocRepository`: repositorios y servicios técnicos de Infrastructure.
- `IocServices`: servicios, casos de uso, validators y jobs.
- Cada archivo expone un `AddDependency(this IServiceCollection services)` que se llama desde `Program.cs`.

## Jobs (Hangfire)

- La lógica de cada job es una clase en `Application/Services/Jobs/` con su interfaz en `Interfaces/IServices/Jobs/`.
- La planificación (cron, jobs encadenados) se registra en `Program.cs` con `RecurringJob.AddOrUpdate<IJob>(...)`.
- El dashboard (`/hangfire`) se protege con `HangfireJwtAuthorizationFilter` y la página de login de `Pages/`.

## Reglas de dependencia

- `Domain` no referencia ningún proyecto.
- `Application` referencia solo `Domain`.
- `Infrastructure` referencia `Application`.
- `Web` referencia `Application` e `Infrastructure`.
- Un repositorio nunca llama a un servicio ni a un caso de uso.
- Un caso de uso puede usar servicios y repositorios, pero nunca otro controller.
- Un módulo no usa los casos de uso de otro módulo. Si algo se comparte, se mueve a `Services/`.

## Configuración y secretos

- `appsettings.json` solo lleva valores no sensibles. Se versiona `appsettings.Development.example.json`, no el real.
- `.env`, `appsettings.Development.json`, `appsettings.Production.json`, certificados (`.p12`, `.pfx`) y `logs/` van en `.gitignore`.
- Los certificados se leen desde una ruta configurada (variable de entorno o volumen), no desde `Assets/`.
- Las clases de configuración se registran con `ValidateOnStart()` para fallar al arrancar si falta un valor.

## Convenciones de nombres

- Repositorios, servicios y controllers por recurso: `<Entidad>Repository`, `<Entidad>Service`, `<Entidad>Controller`. Sin prefijos de tabla (`Tbl…`).
- Casos de uso con verbo: `<Accion><Entidad>UseCase`.
- Reportes con prefijo `Rpt`: `Rpt<Tipo>.cs`.
- Jobs con sufijo `Job`: `<Nombre>Job.cs`.
- Un tipo por archivo, con el mismo nombre que el tipo.

## Tests

- `tests/Application.Tests/` refleja las carpetas de `Application/` (`Services/`, `UseCases/`, `Validators/`).
- Los servicios y casos de uso se prueban con dobles de las interfaces (`IRepositories`, `IData`).
- Los validators se prueban directamente con `TestValidate(...)`.
