# Guía de centralización de logs — buenas prácticas

Documento de referencia y criterios de diseño para la observabilidad de logs.
No cubre instalación ni despliegue: cada equipo decide si instala en el host,
en contenedores o en Kubernetes. Aquí se define **qué debe cumplirse**, no
**cómo ejecutarlo**.

Aplica a cualquier lenguaje. Donde hay ejemplos concretos, son ilustrativos.

> **Versión:** 1.2 — **Última revisión:** octubre 2026. Las referencias a versiones, EOL de
> herramientas, librerías y semantic conventions deben verificarse al reutilizar
> este documento.

**Alcance.** Procesos de servidor (APIs, workers, jobs). Quedan fuera los logs
de navegador y de aplicaciones móviles: ahí no hay archivo ni agente, y se
envían por red a un endpoint de ingesta propio.

**Niveles normativos.** La guía usa tres niveles, al estilo de la RFC 2119 (la
convención que da significado fijo a MUST/SHOULD/MAY en las especificaciones):

| Nivel | Significado | Cómo aparece en el texto |
|---|---|---|
| **DEBE** | Requisito; incumplirlo bloquea el paso a producción | "siempre", "nunca", "obligatorio", "práctica crítica" |
| **DEBERÍA** | Valor por defecto; se puede desviar con justificación escrita | "preferir", "recomendado", "por defecto" |
| **PUEDE** | Opcional según volumen o contexto | "considerar", "si el volumen lo exige" |

**Fuente de verdad.** La sección 5 y el Anexo A son normativos. Las secciones
7 (antipatrones), 8 (checklist) y 9 (diagnóstico) son vistas derivadas: al
cambiar una regla se edita primero la sección 5 y después se propaga.

**Cómo leerla según el tamaño.** Con pocos servicios en un solo host, empezar
por el Anexo C (perfil mínimo) y volver al resto cuando haga falta.

---

## Resumen en nueve reglas

Si solo se lee una página, es esta. Cada regla remite a la sección que la
desarrolla.

1. La aplicación emite JSON por línea; el agente realiza el transporte (1).
2. Cada registro tiene timestamp UTC, severidad, mensaje y atributos con
   nombres y tipos definidos (Anexo A).
3. Los eventos usados en alertas tienen un identificador estable (5.1).
4. No se registran secretos ni cuerpos completos de peticiones; el agente
   aplica redacción adicional (5.1, 5.3).
5. Archivos o runtime tienen límites de almacenamiento; la rotación y la
   reapertura del archivo se verifican (5.1, 5.2).
6. Está definido qué sucede ante bloqueo, saturación, errores de parsing y
   rechazos del backend (5.1, 5.3, 5.4).
7. Checkpoints, colas y reintentos se configuran según la pérdida tolerable,
   sin prometer durabilidad de todo el recorrido (5.2, 5.4).
8. Antes de producción quedan definidos seguridad, retención y monitoreo
   independiente del pipeline (5.5, 5.6, 10).
9. La auditoría crítica se persiste junto con la operación de negocio; la
   correlación con trazas se comprueba cuando se habilita (5.1, 6).

---

## 1. Decisión de arquitectura

### Patrón adoptado

Se adopta el patrón que la especificación de OpenTelemetry denomina
**"Via File or Stdout Logs"** (también: *file-based collection*,
*agent-based collection*, *log shipping*).

```
App ──> archivo / stdout ──> Agente ──> Backend ──> UI
```

La alternativa descartada es **"Direct to Collector"**: la aplicación exporta
por red mediante un appender OTLP dentro del proceso.

Este patrón es el **adoptado por esta guía**; quien la tome como política
interna hereda la decisión. La especificación de
OpenTelemetry documenta ambos modelos con sus ventajas y desventajas; el
elegido aquí es compatible con esos modelos y es el predominante en la
industria para aplicaciones existentes.

**Nota sobre archivo vs stdout:** no son equivalentes. Un archivo proporciona
**persistencia local limitada** — sobrevive al reinicio del proceso y del
agente, pero se pierde con el nodo, con un volumen efímero o al rotar fuera
de la ventana retenida. Stdout no persiste por sí mismo: depende de que la
plataforma lo capture (el runtime de contenedores escribiéndolo a disco,
Kubernetes, CloudWatch), y esa captura tampoco garantiza durabilidad más allá
de lo que la plataforma retenga. En un proceso plano sin supervisor que
capture stdout, la salida se pierde: usar archivo. En ambos casos, la
durabilidad real la aporta la cadena completa hasta el backend (checkpoints,
cola persistente), no la capa de emisión.

### Criterios de la decisión

| Criterio | Via File/Stdout | Direct to Collector |
|---|---|---|
| Lógica de transporte en el código | Ninguna | SDK y appender OTLP en el proyecto |
| Dependencias de exportación en el build | Cero | Varias |
| Comportamiento con backend caído | Persistencia local + reintentos del agente | Buffers dentro del proceso |
| Inspección local | Disponible | No disponible salvo salida secundaria |
| Acoplamiento app–observabilidad | Bajo | Alto |
| Costo operativo | Parsing y rotación en el agente | Overhead de red en el proceso |

**Precisión importante:** "sin cambios de código" aplica al **transporte**, no
a la emisión. Adoptar logging estructurado sí puede requerir cambios en el
código — reemplazar concatenación (`log.info("Usuario " + id)`) por APIs
estructuradas, MDC o contextos — y eventualmente un encoder JSON. Lo que este
patrón elimina es el SDK de exportación y la lógica de red dentro del proceso.

**Principio rector:** la aplicación no debe saber que existe un backend de
observabilidad. Su única responsabilidad es emitir líneas bien formadas.

### Qué significa «desacoplado» (y qué no)

El reparto de responsabilidades es estricto: **la aplicación solo escribe, el
agente solo lee**. La aplicación no conoce al agente, ni al backend, ni la red;
el agente no ejecuta código de la aplicación.

Eso no elimina todo acoplamiento. Quedan tres puntos de contacto, y los tres
se gestionan de forma explícita:

| Punto de contacto | Riesgo si se ignora | Dónde se resuelve |
|---|---|---|
| **El formato de la línea** | Un cambio de nombre o de tipo de un campo rompe el parsing y las alertas | Contrato del registro (Anexo A) |
| **El lugar de escritura** (ruta, stdout, rotación) | El agente no encuentra el archivo o pierde líneas al rotar | 5.1 y 5.2 |
| **El comportamiento cuando escribir bloquea** | Disco lleno o stdout lento frenan a la aplicación | Política de bloqueo (5.1) |

El desacoplamiento es de **transporte y de ciclo de vida** (se puede cambiar
de backend o reiniciar el agente sin tocar la aplicación), no de **formato**:
el formato es el contrato entre ambos y se versiona como cualquier API.

### Cuándo revisar esta decisión

- **Serverless**: sin disco persistente ni nodo donde alojar un agente, hay
  dos vías válidas: (a) stdout capturado por la plataforma (p. ej. Lambda →
  CloudWatch Logs) y reenviado desde ahí al backend, o (b) envío directo desde
  el proceso. El envío directo es una opción, no la única.
- **Entornos gestionados** donde no se puede desplegar un proceso adicional
  junto a la aplicación ni la plataforma captura stdout de forma reenviable.
- **Frontend y móvil**: fuera de alcance; requieren envío por red.
- **Registros de auditoría** cuya pérdida es inaceptable: este pipeline no da
  esa garantía por sí solo (ver 5.1, "Auditoría").

---

## 2. Terminología

Usar los nombres correctos ahorra tiempo al buscar documentación y al
comunicarse entre equipos.

| Capa | Término técnico | Responsabilidad |
|---|---|---|
| 1 | *instrumentation*, *log appender / bridge* | Emitir el registro |
| 2 | *collection*, *log shipper*, *agent* | Leer y seguir el archivo |
| 3 | *processors*, *operators*, *transforms* | Parsear, enriquecer, filtrar |
| 4 | *protocol* | Transportar |
| 5 | *log backend*, *log store* | Almacenar e indexar |
| 6 | *query layer* | Buscar y visualizar |
| 7 | *alerting* | Notificar sobre condiciones |

Al conjunto de las capas 2–4 se le llama **observability pipeline** o
**telemetry pipeline**.

---

## 3. Topología del agente

| Topología | Descripción | Criterio de uso |
|---|---|---|
| **Node agent** | Un agente por host o nodo | Punto de partida cuando se controla el host/nodo |
| **Sidecar** | Un agente por instancia de app | Configuración distinta por aplicación, o plataformas sin acceso al nodo |
| **Gateway** | Capa central que recibe de los agentes | Punto único de egreso, escala |
| **Agent + Gateway** | Dos niveles combinados | Producción de gran tamaño |

**Práctica:** empezar con node agent **cuando se controla el host o nodo**.
En plataformas donde no hay acceso al nodo (PaaS, contenedores gestionados),
el sidecar o el mecanismo de captura de la propia plataforma son el punto de
partida. Introducir gateway solo cuando exista una razón concreta — muchos
nodos, control de egreso, o necesidad de aplicar políticas centralizadas.

---

## 4. Elección del collector

El collector debe elegirse **en función del backend**, no por preferencia
personal. Un agente ajeno al backend puede añadir traducción y dejar
funcionalidad sin usar; la excepción es OTLP, que hoy aceptan de forma nativa
la mayoría de los backends (ver 5.4), por lo que el OpenTelemetry Collector es
válido en casi todas las filas de la tabla.

| Backend | Collector natural | Razón |
|---|---|---|
| SigNoz | OpenTelemetry Collector | El backend es OTel-nativo, ingesta OTLP |
| Grafana Loki | Grafana Alloy | Reemplazo oficial de Promtail (EOL marzo 2026) |
| VictoriaLogs | vlagent | Agente nativo, buffering en disco, recolección directa en k8s. Vector sigue siendo válido si se necesita procesamiento más flexible |
| OpenSearch | Fluent Bit o Vector | Salida nativa en ambos |
| Indefinido / multi-backend | OpenTelemetry Collector | Opción neutral y portable |

**Práctica crítica:** un único agente por archivo. Dos agentes leyendo la misma
ruta es la causa más frecuente de logs duplicados.

---

## 5. Prácticas por capa

### 5.1 Emisión

En el proyecto se ajusta la **configuración del logging** y, si el código usa
concatenación de strings, las llamadas al logger para usar campos
estructurados. Lo que nunca entra al proyecto es lógica de transporte hacia
el backend.

El formato exacto de la línea (campos, nombres, tipos y un ejemplo
antes/después) está en el **Anexo A**; la librería recomendada para cada stack,
en el **Anexo B**.

- **No registrar secretos ni PII desde la aplicación.** Esta es la primera
  línea de defensa y se verifica en revisión de código. La redacción en el
  agente (5.3) es defensa en profundidad, no la protección principal.
- **Emitir JSON estructurado, un registro por línea.** Sin esto, el agente
  parsea con expresiones regulares: frágil, costoso y se rompe cuando alguien
  cambia el formato. Las excepciones y stack traces van **dentro de campos**
  del registro (p. ej. `exception.type`, `exception.message`,
  `exception.stacktrace`), nunca como líneas sueltas.
- **Usar campos, no concatenación.** Un identificador dentro de una cadena de
  texto no es consultable; como par clave-valor sí lo es.
- **Un evento por registro.** No agrupar varios hechos en una misma línea.
- **Identificador estable del evento.** Además del mensaje legible, cada
  evento relevante lleva un `event.name` (o `event.code`) constante — p. ej.
  `payment.webhook.rejected`. Es un campo de **cardinalidad baja**: un
  catálogo finito de tipos de evento, nunca valores dinámicos (IDs, montos,
  rutas concretas). El texto del mensaje puede cambiar por redacción,
  traducción o refactorización; las alertas y agregaciones dependen del
  identificador, nunca del texto. Nota de vigencia: las semantic conventions
  de OpenTelemetry marcaron como obsoleto el *atributo* `event.name` y lo
  sustituyeron por el campo `EventName` del LogRecord. En la línea JSON la
  clave se mantiene (el archivo no es OTLP); el agente la mapea a `EventName`
  cuando collector y backend lo soportan, y la deja como atributo cuando no.
- **Identificador único de registro cuando la deduplicación sea requisito.**
  El pipeline entrega at-least-once (ver 5.4): si el consumo aguas abajo
  necesita deduplicar, el registro debe llevar un ID único desde la emisión.
  **No usar un hash únicamente del contenido**: dos eventos legítimos e
  idénticos (dos reintentos del mismo webhook en el mismo segundo)
  colisionarían y la deduplicación destruiría datos válidos. Preferir un
  **UUID generado una sola vez en la emisión**, o un hash que incluya
  identidad de la instancia, timestamp de alta precisión y número de
  secuencia. Sin requisito de deduplicación, no añadirlo —
  es costo por línea sin uso.
- **Mensajes estables.** Lo que debe ser constante es la **plantilla** del
  mensaje; los datos variables van en atributos. Se admiten dos formas:
  texto fijo más atributos, o plantilla estructurada (`"Order {OrderId} paid"`
  en .NET), siempre que la librería emita cada valor también como campo. Con
  plantillas, el texto renderizado contiene el valor y deja de ser agrupable:
  o se emite la plantilla sin renderizar, o se agrupa por `event.name`. En
  ambos casos las alertas dependen de `event.name`, nunca del texto.
- **Límite de tamaño por registro y truncamiento.** Definir un tope (p. ej.
  stack traces de frameworks que superan decenas de KB) y una estrategia de
  truncamiento explícita. Un registro gigante puede exceder límites del
  pipeline o del backend y perderse completo en silencio.
- **Timestamp en UTC con formato ISO-8601** (o epoch con precisión declarada),
  incluyendo siempre la zona horaria de forma explícita. Los hosts deben tener
  **NTP sincronizado**: la mayoría de los problemas de timestamps desplazados
  se previenen aquí, no en el backend.
- **Configurar rotación siempre**: tamaño máximo por archivo, número de
  archivos históricos y tope total de tamaño. **Preferir el mecanismo
  rename/create** sobre copytruncate (ver 5.2). Objetivo: 2–3 días en disco
  local, suficiente margen si el agente se detiene.
- **Con rename/create, el escritor DEBE reabrir el archivo.** Al renombrar,
  el proceso conserva abierto el archivo antiguo y sigue escribiendo en él;
  el archivo nuevo queda vacío. Si rota la propia librería (Logback,
  Serilog, lumberjack), la reapertura es automática. Si rota un programa
  externo como `logrotate`, hay que avisar al proceso (una señal en
  `postrotate`) y que este reabra: en Pino, `destination.reopen()`. Si la
  aplicación no puede reabrir, las opciones son copytruncate con su ventana
  de riesgo o pasar a stdout. Se verifica con una rotación real: tras rotar,
  las líneas nuevas aparecen en el archivo nuevo.
- **Con stdout en contenedores, la rotación es del runtime, no de la
  aplicación**, y DEBE configurarse igual:
  - **Docker**: el driver `json-file` no limita el tamaño por defecto y puede
    llenar el disco. Fijar `max-size` y `max-file` (p. ej. `50m` × `5`) en
    `daemon.json` o por servicio en Compose, o usar el driver `local`.
  - **Líneas largas**: Docker parte en fragmentos toda línea de más de 16 KB.
    Un JSON de 40 KB llega como tres trozos que por separado no son JSON
    válido. O se mantiene el registro por debajo de 16 KB (ver límite de
    tamaño), o el agente recombina los fragmentos con su parser de
    contenedores antes de parsear el JSON.
  - **Kubernetes**: el kubelet rota por `containerLogMaxSize` (10 Mi por
    defecto) y `containerLogMaxFiles` (5). Un pico de volumen puede rotar y
    borrar archivos antes de que el agente los lea: subir los límites o
    reducir el volumen en origen.
- **Decidir qué pasa cuando escribir bloquea.** Si el disco se llena o nadie
  consume stdout, la escritura se detiene y con ella el hilo que registra.
  Hay dos políticas, y elegir una es obligatorio:
  - **No bloquear** (por defecto para logs operativos): appender asíncrono con
    cola acotada que descarta cuando se llena, y un contador de descartes
    visible. En Docker, `mode=non-blocking` con `max-buffer-size`.
    **Asíncrono no significa no bloqueante.** El `AsyncAppender` de Logback,
    por defecto (`neverBlock=false`), **bloquea** al hilo que registra cuando
    su cola se llena; su `discardingThreshold` solo descarta TRACE, DEBUG e
    INFO cuando queda menos del 20 % libre, y WARN/ERROR siguen esperando
    sitio. Para esta política hay que fijar `neverBlock=true` de forma
    explícita y aceptar los descartes. La política se **verifica con una
    prueba** (detener al consumidor o llenar el disco en un entorno de
    ensayo), no leyendo la configuración.
  - **Bloquear** (*backpressure*: el productor se frena hasta que el
    consumidor se pone al día): solo cuando perder el registro es peor que
    degradar el servicio.
  Lo que no se acepta es no saber cuál de las dos está activa. El modo
  asíncrono tiene un costo: lo que está en la cola se pierde si el proceso
  muere, así que se vacía (*flush*) en el apagado ordenado.
- **Niveles correctos.** `DEBUG` apagado en producción. **`ERROR` significa:
  la operación falló y no pudo recuperarse en su ámbito actual** (hubo retry
  o fallback exitoso → no es ERROR). Las alertas se disparan por condiciones
  agregadas — tasa, novedad, umbral por `event.name` — no por cada registro
  ERROR individual. Si todo es error, nada lo es. Cada equipo documenta su
  taxonomía concreta de niveles a partir de este criterio, para que sea
  aplicable en revisión de código.
- **Auditoría: clase aparte de los logs operativos.** Un registro de auditoría
  responde "quién hizo qué y cuándo" con valor legal o contable (un pago
  aprobado, una factura anulada, un cambio de permisos). Reglas propias:
  - Nunca se samplea ni se filtra.
  - Retención según la norma aplicable, no los 30–90 días operativos.
  - Acceso restringido y, cuando se exija, protección contra alteración.
  - Se marca con un campo propio (p. ej. `log.type: "audit"`) para enrutarlo
    a un destino distinto.
  - Si perder uno es inaceptable, **no depende solo de este pipeline**
    (at-least-once que degrada a best effort, ver 5.4): el evento se persiste
    en la base de datos dentro de la misma transacción que el hecho de
    negocio (tabla de auditoría o patrón *outbox*: se escribe en una tabla
    local y un proceso aparte lo publica después) y, además, puede emitirse
    como log.

**Atributos de recurso**, siguiendo las *semantic conventions* de
OpenTelemetry. Los cuatro son **obligatorios por política interna** de esta
guía (los niveles de requisito de la spec varían por atributo y por versión
de las convenciones; la política interna es la referencia operativa):

| Atributo | Propósito |
|---|---|
| `service.name` | Identificar el servicio |
| `service.version` | Correlacionar errores con despliegues |
| `deployment.environment.name` | Separar producción de staging |
| `service.instance.id` | Aislar la instancia concreta |

**Dónde se originan estos atributos depende de la plataforma:**

- **Preferentemente se inyectan en el agente** (capa de procesamiento),
  cuando la plataforma expone la metadata: Kubernetes vía labels/annotations,
  metadata de la nube. La aplicación no los emite y no viajan en cada línea
  del archivo.
- Si el agente no puede inferirlos (host plano, VPS, servicios gestionados
  sin metadata accesible), **el appender los incluye desde configuración** —
  variable de entorno inyectada en el despliegue, nunca hardcodeado. En ese
  caso **sí se repiten físicamente en cada línea del archivo local**: se
  acepta esa repetición en origen, y en la capa de procesamiento se
  **promueven a atributos de recurso** (y opcionalmente se eliminan del
  cuerpo) para no inflar el almacenamiento del backend.

Lo que no se acepta en ningún caso: escribirlos a mano en cada llamada al
logger, ni valores hardcodeados en el código.

### 5.2 Recolección

- **Multilínea solo cuando no se puede garantizar JSON por línea.** Si la
  aplicación emite JSON estructurado (5.1), el stack trace viaja dentro de un
  campo y la agrupación multilínea es innecesaria — configurarla además puede
  interferir con el parser. Multilínea aplica a lo que **no controlas**:
  aplicaciones legacy, logs de terceros, salida de frameworks que escriben
  texto libre. En esos casos es obligatoria: un stack trace de treinta líneas
  sin agrupación llega como treinta registros independientes, y el error queda
  ilegible justo cuando más se necesita. Debe definirse un patrón de inicio
  de registro y validarse con un error real.
- **Persistir la posición de lectura (checkpoints/offsets).** Es un mecanismo
  distinto de la cola de envío (5.4): el checkpoint evita **releer o saltar
  líneas** cuando el agente se reinicia. Sin él, cada reinicio duplica o
  pierde datos aunque la cola de exportación sea persistente. En el
  OpenTelemetry Collector esto es la extensión `file_storage` aplicada al
  receiver; cada collector tiene su equivalente (positions file, checkpoint
  dir). **Un checkpoint no es una confirmación de entrega**: registra hasta
  dónde se leyó, no hasta dónde se entregó. Si un componente posterior
  rechaza o pierde el lote, la posición ya avanzó y esas líneas no se
  releen. Hay que revisar cómo se propagan los errores hacia el lector: en
  el receiver `filelog` del OpenTelemetry Collector, `retry_on_failure`
  viene **desactivado** por defecto (ver tabla de valores por defecto en
  5.4).
- **Rotación: preferir rename/create y configurar según el collector, sin
  reglas de exclusión universales.**
  - **Excluir los archivos comprimidos** (`*.gz`, `*.zst`) **de la
    recolección continua.** La excepción es una carga histórica controlada:
    se hace con una configuración aparte, de una sola vez, en un collector
    que soporte leer comprimidos (`filelog` lee gzip) y asumiendo que puede
    duplicar lo ya ingerido.
  - Con **rename/create** (el mecanismo preferido), los collectors modernos
    rastrean el archivo por fingerprint/inode: el renombrado no genera
    duplicados, y excluir agresivamente los rotados puede **perder** las
    líneas escritas justo antes de la rotación. No excluir por defecto.
  - **copytruncate** debe evitarse cuando sea posible: abre una **ventana de
    riesgo** en cada rotación — lo escrito entre la copia y el truncado puede
    perderse si el collector no alcanza a leerlo o a recuperarlo desde la
    copia. Si es inevitable, configurar según las
    capacidades del collector: los que usan fingerprints pueden deduplicar la
    copia; en los que no, excluir los históricos evita reprocesamiento.
  - Documentar qué mecanismo usa cada fuente y validar el comportamiento con
    una rotación real.
- **Decidir el punto de arranque distinguiendo tres casos.** "Leer solo lo
  nuevo" no es una regla única: aplicada sin distinguir, se salta las
  primeras líneas de un archivo que ya tenía contenido cuando el agente lo
  vio.

  | Caso | Comportamiento correcto |
  |---|---|
  | **Instalación inicial** (archivos existentes, sin checkpoint) | Decisión explícita: desde el final si el histórico no interesa; desde el inicio si interesa, asumiendo el volumen de la carga |
  | **Archivo nuevo descubierto con el agente en marcha** (servicio recién desplegado, archivo tras rotación) | Siempre desde el inicio. Verificar que el collector lo hace así: el significado de la opción "desde el final" varía entre collectors |
  | **Reinicio con checkpoint** | Continuar desde la posición guardada; la opción de arranque no debe aplicarse |

  El caso peligroso es un reinicio **sin** checkpoint (volumen efímero,
  directorio borrado): el agente lo trata como instalación inicial y, con
  "desde el final", pierde todo lo escrito mientras estuvo detenido.
- **Verificar permisos de lectura** del usuario del agente sobre el directorio
  de logs. Es el fallo silencioso más común.
- **Montaje de solo lectura** donde la plataforma lo permita. La aplicación
  escribe, el agente únicamente lee.

### 5.3 Procesamiento

- **Configurar un límite de memoria en el agente.** Cuando el collector
  ofrezca un processor equivalente (p. ej. `memory_limiter` en el OTel
  Collector), colocarlo como **primer** processor del pipeline; en cualquier
  caso, complementar con límites de contenedor/cgroup o del servicio, que son
  la red de seguridad universal. Sin límite, un pico de volumen puede tumbar
  el agente por consumo excesivo.
- **Parsear al modelo de datos de OpenTelemetry**: timestamp, severidad,
  cuerpo, atributos, identificadores de traza. Un backend que recibe todo como
  texto plano con severidad uniforme no sirve para nada.
- **Mapear la severidad explícitamente.** Si todos los registros llegan con el
  mismo nivel, el mapeo no está configurado.
- **Enriquecer aquí, no en la aplicación.** Entorno, servicio, host y metadatos
  de infraestructura se añaden en esta capa (con la salvedad de plataforma
  descrita en 5.1), y los atributos que viajan repetidos desde el appender se
  promueven a atributos de recurso.
- **Controlar cardinalidad e indexación — la regla es específica por
  backend:**
  - En backends con modelo de streams/series (**Loki, VictoriaLogs**): campos
    de cardinalidad alta **por petición o por usuario** — `trace_id`,
    `request_id`, `user_id`, IPs — **nunca** como labels/stream fields. Cada
    valor único crea un stream nuevo y el costo explota. Van como contenido
    consultable del registro.
  - **La identidad de la instancia (`service.instance.id`, pod, host) es un
    caso distinto.** En VictoriaLogs, un stream por instancia es lo
    recomendado: agrupa los registros de un mismo origen. En Loki depende de
    la rotación: con instancias estables es aceptable; con pods efímeros que
    cambian en cada despliegue conviene llevarla como *structured metadata*
    (metadatos consultables que no crean streams) en lugar de label.
  - En backends de índice invertido (**OpenSearch/Elasticsearch**): indexar
    `trace_id` como keyword puede ser razonable y útil para correlación. Lo
    que se revisa ahí son los **mappings**: evitar dynamic mapping
    descontrolado, campos analizados innecesarios y explosión de campos.
  - En ambos casos: revisar explícitamente qué se convierte en dimensión de
    indexación antes de producción, no aceptar los defaults.
- **Filtrar y samplear antes de exportar.** El control de volumen más efectivo
  ocurre aquí, no en la retención del backend: descartar health checks y
  liveness probes, filtrar logs de acceso repetitivos sin valor operativo, y
  samplear `INFO` de endpoints de alto tráfico si el volumen lo exige.
  **Solo el sampling con probabilidad conocida permite extrapolar**:
  probabilístico o hash-based con tasa fija y registrada — p. ej. atributo
  `sampling.rate` definido como **probabilidad conservada, valor entre 0 y 1**
  (`0.1` = se conserva el 10 % de los registros; el conteo real se estima
  como conteo observado ÷ `sampling.rate`). Un filtro determinista ("solo
  ciertos usuarios") o un
  rate limiter reducen volumen pero **sus conteos no se pueden extrapolar** —
  usarlos sabiendo que las métricas derivadas de esos logs dejan de ser
  representativas. Los `ERROR` y `WARN` nunca se samplean.
- **Redactar datos sensibles antes de que salgan del perímetro.** PII, tokens,
  credenciales y números de tarjeta se eliminan en el agente. Esto es
  **defensa en profundidad**: la primera protección es no registrarlos desde
  la aplicación (5.1). Nunca delegar la redacción al backend: una vez
  almacenado, el dato ya se filtró.
- **Definir qué pasa con los registros defectuosos.** Sin política, cada
  collector hace algo distinto y casi siempre en silencio.

  | Defecto | Política |
  |---|---|
  | **JSON inválido** | No descartar: enviar la línea cruda como cuerpo, con un atributo de marca (p. ej. `log.parse_error: true`) y severidad sin mapear. Contar por servicio y alertar si la tasa sube |
  | **Tipo incorrecto en un campo** (contrato, Anexo A) | Conservar el registro; mover el valor a un campo alternativo o convertirlo a string, y contar la violación |
  | **Timestamp ausente, no parseable o imposible** (futuro, año 1970) | Usar la hora de lectura del agente como timestamp, conservar el valor original en un atributo y marcar el registro |
  | **Registro por encima del tamaño máximo** | Truncar con marca explícita (5.1), nunca descartar entero en silencio |
  | **Rechazo permanente del backend** (error 4xx: formato, límite, permisos) | No se reintenta: reintentar no lo arregla. Contar, registrar el motivo en los logs del agente y, si el volumen lo justifica, desviar a un destino de cuarentena (archivo local acotado) para diagnóstico |

  La cuarentena, si existe, tiene tope de tamaño y los mismos controles de
  acceso que los logs: contiene justo los registros que no pasaron por la
  redacción normal.
- **Agrupar en lotes** antes de exportar. Enviar registro por registro
  desperdicia red y capacidad de ingesta. **Un lote pendiente vive en
  memoria**: si el agrupamiento ocurre en un componente anterior a la cola
  persistente (el processor `batch` del OpenTelemetry Collector), lo que hay
  en el lote se pierde si el agente muere. Donde el exporter ofrezca
  agrupamiento integrado en su propia cola, preferirlo.

### 5.4 Transporte

- **Protocolo: OTLP por defecto; interfaz nativa cuando aporta algo
  concreto.** OTLP evita atadura a proveedor y hoy lo aceptan de forma nativa
  los backends OTel-nativos, Loki (desde la 3.0) y VictoriaLogs, además de
  ser el estándar para el tramo agent→gateway. La interfaz nativa se usa
  cuando el agente elegido es el del propio backend y ofrece funcionalidad
  que OTLP no cubre (Alloy→Loki con su push API, vlagent→VictoriaLogs,
  Fluent Bit→OpenSearch). Lo que se evita es **encadenar traducciones**
  (formato A → B → C entre agente, gateway y backend): cada conversión puede
  perder tipos, severidad o atributos de recurso.
- **Compresión activada: gzip por compatibilidad; zstd solo cuando ambos
  extremos lo soporten** (OTLP especifica gzip como mínimo interoperable;
  zstd depende de la implementación). La compresión no es gratuita — consume
  CPU y memoria — así que en agentes con recursos muy limitados debe medirse,
  pero en la generalidad de los casos el ahorro de egreso la justifica.
- **Reintentos con retroceso exponencial** activados, **con la ventana de
  reintento revisada**: en el OpenTelemetry Collector el retry expira por
  defecto a los ~5 minutos (`max_elapsed_time`); una caída de backend más
  larga descarta datos aunque la cola sea persistente. Ajustar el valor (o
  `0` para reintento indefinido, con disco dimensionado acorde).
- **Semántica de entrega: at-least-once solo en el tramo durable y validado;
  best effort en el resto. Nunca exactly-once.** La garantía no es del
  pipeline entero, sino de cada tramo, y solo vale donde hay persistencia
  comprobada:

  | Tramo | Qué lo protege | Dónde se pierde |
  |---|---|---|
  | Aplicación → archivo/stdout | Nada, salvo política de bloqueo (5.1) | Cola del appender asíncrono al morir el proceso; descartes por no bloquear |
  | Archivo → lectura del agente | Checkpoint persistente (5.2) | Rotación antes de leer; reinicio sin checkpoint |
  | Lectura → cola de envío | Normalmente nada: memoria | Lotes y buffers en memoria al morir el agente; errores de procesamiento; lote rechazado con la posición ya avanzada |
  | Cola de envío → backend | Cola persistente + reintentos | Cola o disco llenos; ventana de reintento expirada; rechazo permanente (4xx) |
  | Dentro del backend | Lo que garantice el backend | Límites de ingesta, rechazos por esquema |

  Lo que sí puede afirmarse: **lo que ya entró en una cola persistente se
  entrega al menos una vez mientras no se agoten cola, disco ni reintentos**,
  con posibles **duplicados** alrededor de reinicios (el agente reenvía lo no
  confirmado). Todo lo anterior a esa cola es best effort salvo que se
  demuestre lo contrario con una prueba: matar el agente bajo carga y contar
  lo que llega. Los consumidores aguas abajo asumen duplicados y huecos; si
  deduplicar es requisito, el registro lleva un identificador único desde la
  emisión (5.1).
- **Elegir un agente no activa sus mecanismos de durabilidad.** Varios vienen
  desactivados. Valores a comprobar **en la versión en uso** (la tabla
  caduca; la regla no):

  | Componente | Valor por defecto | Consecuencia |
  |---|---|---|
  | OTel Collector, receiver `filelog` | `retry_on_failure` desactivado | Si el siguiente componente falla, el lote leído se descarta |
  | OTel Collector, processor `batch` | Lotes en memoria | Fuera de la protección de la cola persistente |
  | OTel Collector, exporter | Cola en memoria salvo que se le asigne `storage`; reintento que expira a ~5 min | Pérdida al reiniciar y en caídas largas |
  | Grafana Alloy, `loki.write` | WAL (registro previo en disco) opcional, desactivado y marcado como experimental | Sin él, lo pendiente de envío está en memoria |
  | Logback, `AsyncAppender` | `neverBlock=false` | Bloquea a la aplicación con la cola llena |
- **Cola de envío persistente en disco**, no en memoria, **dimensionada en
  bytes: bytes ingeridos por segundo × duración máxima de interrupción
  esperada × margen de seguridad (~20–50 %)** por serialización, lotes y
  variaciones de tráfico. **Coordinar las cuotas de disco** de archivos de
  log, checkpoints y cola cuando comparten filesystem, para que no compitan
  hasta llenarlo. Una cola en memoria se pierde en cada reinicio del agente.
  Y una cola persistente tampoco garantiza entrega: se pierde si la cola o el
  disco se llenan, si expira la ventana de reintento o si el almacenamiento
  falla. Por eso el dimensionamiento y el monitoreo de descartes (5.5) son
  parte del diseño, no un extra.
- **TLS por defecto en todos los tramos**, también dentro de redes privadas
  (asumir red interna hostil es la práctica estándar actual). Se admiten
  **excepciones documentadas** — loopback/localhost, redes físicamente
  aisladas — registradas con su justificación, no decididas ad hoc.
- **Credenciales fuera del archivo de configuración**: variables de entorno o
  gestor de secretos.

### 5.5 Almacenamiento y consulta

- **Definir política de retención explícita** antes de producción. Entre 30 y
  90 días es lo habitual; sin política definida, el costo crece sin control.
  La retención es el segundo control de costo — el primero es el filtrado en
  la capa de procesamiento (5.3).
- **Considerar retención escalonada** si el volumen lo justifica: acceso rápido
  reciente, archivado frío para lo antiguo.
- **Alertas sobre condiciones, no solo tableros.** Un tablero que nadie mira no
  detecta incidentes. Las condiciones se expresan sobre `event.name`,
  severidad y tasas agregadas — nunca sobre el texto del mensaje.
- **Monitorear el propio agente con métricas concretas**: registros
  descartados/rechazados, ocupación de la cola, errores de exportación,
  retraso de lectura respecto a la escritura (*lag*), y espacio de disco de
  la cola y los checkpoints.
- **Evitar el monitoreo circular.** La salud del agente no puede depender
  únicamente de datos enviados por ese mismo agente: si muere, deja de
  reportar y el silencio parece salud. Añadir una **alerta de ausencia**
  (*dead man's switch*: se dispara cuando dejan de llegar datos esperados) o
  supervisar sus métricas por una ruta independiente (scraping externo,
  health endpoint consultado por el sistema de monitoreo). Si el pipeline de
  observabilidad se cae en silencio, la ausencia de logs se interpreta como
  ausencia de problemas.

### 5.6 Seguridad y control de acceso

TLS y secretos (5.4) protegen el canal. Faltan cuatro controles que no son
del canal:

- **Autenticar la ingesta.** El backend o el gateway DEBE rechazar envíos sin
  credencial. Sin esto, cualquiera con acceso de red puede inyectar registros
  falsos o saturar la ingesta. Una credencial por agente o por entorno (token
  o certificado de cliente), revocable sin afectar al resto.
- **Permisos de consulta por mínimo privilegio.** Los logs contienen datos de
  negocio aunque no haya PII. Definir quién puede leer qué: por entorno
  (producción separado de staging), por servicio o por equipo. El acceso de
  lectura a producción no es universal por defecto.
- **Aislamiento entre equipos o clientes** cuando el mismo backend sirve a
  varios (*multi-tenant*: una instalación compartida con datos separados por
  inquilino). El identificador de inquilino lo asigna el **agente o el
  gateway** a partir de la credencial, nunca la aplicación en la línea de
  log: un campo que escribe la aplicación se puede falsificar. La separación
  se hace con el mecanismo del backend (tenants, índices o cuentas
  distintas), no con un filtro en las consultas.
- **Proteger los datos locales.** Archivos de log, cola persistente,
  checkpoints y cuarentena contienen lo mismo que el backend, antes de la
  redacción. Permisos restrictivos (el archivo lo escribe la aplicación y lo
  lee solo el usuario del agente; la cola y los checkpoints son solo del
  agente), sin lectura para otros usuarios del host, y cifrado de disco
  cuando la norma aplicable lo exija.
- **Registrar el acceso a los logs** donde el backend lo permita: quién
  consultó producción y cuándo.

---

## 6. Correlación entre logs y trazas

Con lo anterior se obtiene búsqueda centralizada. El salto de valor real es
poder ir de una línea de log a la traza completa de esa petición.

**Práctica recomendada — enfoque híbrido:** usar la instrumentación automática
de OpenTelemetry únicamente para que inyecte el contexto de traza en el
contexto de diagnóstico del logger. La aplicación sigue escribiendo a archivo
o stdout y el agente sigue recolectando; la arquitectura no cambia.

Con eso, cada registro lleva su identificador de traza y de span, la capa de
procesamiento los mapea a los campos correspondientes del modelo de datos, y el
backend enlaza ambas señales automáticamente. Recordar la regla de
cardinalidad (5.3): `trace_id` nunca como label/stream field; su indexación
en backends de índice invertido se decide en el mapping.

**La correlación no se da por funcionando hasta validarla extremo a extremo.**
La inyección automática de `trace_id`/`span_id` depende de la combinación
concreta de lenguaje, logger e instrumentación, y su fallo típico es
silencioso: la traza existe, pero el log no lleva el identificador. La prueba
de aceptación es una petición real recorriendo: log en el backend → clic o
consulta → traza completa → span exacto donde ocurrió el evento.

Trazas y métricas se exportan **por su propia pipeline OTLP** — sea directa
al backend o pasando por el agente local y el gateway — mientras que **los
logs se mantienen por archivo/stdout**. Lo que no debe hacerse es duplicar la
ruta de los logs (archivo *y* OTLP directo a la vez): duplica el volumen y
rompe el desacoplamiento que motivó la decisión inicial.

---

## 7. Antipatrones

Ordenados por prioridad. **Crítico**: pérdida de datos, fuga de información o
caída del servicio. **Alto**: costo descontrolado o datos poco fiables.
**Medio**: degrada la utilidad de los logs.

| Antipatrón | Consecuencia | Prioridad |
|---|---|---|
| Sin rotación configurada | Disco lleno, caída del servicio | Crítico |
| Ingesta sin autenticación | Registros falsos inyectados o ingesta saturada por terceros | Crítico |
| Rotación externa sin reapertura del archivo | La aplicación sigue escribiendo en el archivo renombrado; el agente no ve nada nuevo | Crítico |
| Conectar producción con requisitos obligatorios pendientes | Datos reales sin TLS, sin control de acceso o sin monitoreo | Crítico |
| Salud del agente monitoreada solo por sus propios datos | Agente muerto = silencio interpretado como salud | Crítico |
| Sin checkpoint de posición de lectura | Duplicados o pérdida en cada reinicio del agente | Crítico |
| Confiar solo en la redacción del agente | El secreto ya se escribió; defensa única en vez de en profundidad | Crítico |
| Conectar producción sin reglas de redacción | Datos sensibles almacenados desde el día uno | Crítico |
| Cola de envío solo en memoria | Pérdida de datos en cada reinicio | Crítico |
| Sin límite de memoria en el agente | El agente cae bajo carga | Crítico |
| Stdout en contenedores sin límites del runtime | Disco lleno (Docker) o archivos rotados antes de leerse (Kubernetes) | Crítico |
| Auditoría enviada solo por el pipeline operativo | Registros con valor legal perdidos o sampleados | Crítico |
| Dos agentes sobre el mismo archivo | Registros duplicados, costo doble | Alto |
| Logs en texto plano libre | Parsing frágil, búsquedas lentas | Alto |
| Alertas y agregaciones sobre el texto del mensaje | Se rompen al cambiar el wording; usar `event.name` | Alto |
| IDs de alta cardinalidad como labels/stream fields | Explosión de streams y costo en Loki/VictoriaLogs | Alto |
| Dynamic mapping sin revisar en índice invertido | Explosión de campos y mappings rotos | Alto |
| Timestamps en hora local sin zona declarada | Correlación imposible entre servicios | Alto |
| copytruncate cuando rename/create era posible | Ventana de riesgo de pérdida en cada rotación | Alto |
| Asumir exactly-once del pipeline | Duplicados sin manejar en consumo y conteos incorrectos | Alto |
| `DEBUG` activo en producción | Ruido, costo y riesgo de filtrar datos | Alto |
| Cola persistente sin dimensionar ni monitorear | Falsa sensación de garantía de entrega | Alto |
| Ventana de reintento en su valor por defecto | Descarte silencioso en caídas largas del backend | Alto |
| Tráfico interno sin TLS "porque es red privada" | Perímetro único como defensa; excepciones sin documentar | Alto |
| Retención indefinida | Costo creciente sin control | Alto |
| Asumir que "asíncrono" significa "no bloqueante" | La aplicación se detiene con la cola del appender llena | Alto |
| Tratar el checkpoint como confirmación de entrega | Pérdida silenciosa cuando falla un componente posterior | Alto |
| Dar por activos los mecanismos de durabilidad del agente | Cola, WAL o reintentos desactivados por defecto | Alto |
| Sin política para JSON inválido o registros rechazados | Descartes silenciosos, distintos en cada collector | Alto |
| "Leer solo lo nuevo" aplicado a archivos nuevos o sin checkpoint | Primeras líneas o periodos enteros perdidos | Alto |
| Sin política definida para cuando escribir bloquea | La aplicación se frena con el disco lleno, o descarta sin que nadie lo sepa | Alto |
| El mismo campo con tipos distintos entre servicios | Conflictos de mapping y registros rechazados por el backend | Alto |
| Registros de más de 16 KB por stdout de Docker sin recombinar | JSON partido en fragmentos imposibles de parsear | Alto |
| Multilínea configurada sobre JSON por línea | Interferencia con el parser, registros corruptos | Medio |
| Datos variables dentro del mensaje | Imposible agrupar o contar eventos | Medio |
| Atributos de recurso escritos a mano en cada llamada al logger | Almacenamiento inflado e inconsistencia | Medio |
| Exclusiones de rotados sin conocer el mecanismo ni el collector | Pérdida o reprocesamiento según el caso | Medio |
| Health checks y probes sin filtrar | Volumen e ingesta pagados sin valor | Medio |
| Extrapolar conteos de logs filtrados o rate-limited | Métricas no representativas; solo el sampling probabilístico extrapola | Medio |

---

## 8. Checklist de aceptación

**Emisión**
- [ ] Sin PII ni secretos en los registros, verificado en revisión de código
      (primera línea de defensa)
- [ ] Salida en formato estructurado, un registro por línea
- [ ] Campos núcleo, nombres y tipos conformes al contrato del registro
      (Anexo A); catálogo de `event.name` publicado
- [ ] Excepciones y stack traces dentro de campos del registro
- [ ] `event.name`/`event.code` estable en los eventos relevantes para
      alertas y agregación
- [ ] Datos variables como atributos, no dentro del mensaje
- [ ] Límite de tamaño por registro y truncamiento definidos
- [ ] Timestamps en UTC / ISO-8601 con zona declarada, NTP en los hosts
- [ ] Rotación configurada con tope de tamaño total, rename/create preferido
- [ ] Con stdout en contenedores: límites del runtime configurados (Docker
      `max-size`/`max-file`, kubelet) y líneas de más de 16 KB resueltas
- [ ] Política ante bloqueo de escritura decidida (descartar o bloquear),
      configurada de forma explícita, **verificada con una prueba**, con
      contador de descartes y flush en el apagado
- [ ] Eventos de auditoría identificados, marcados y con persistencia propia
      cuando su pérdida es inaceptable
- [ ] Niveles de log revisados para producción, taxonomía documentada
      (criterio ERROR: fallo no recuperado en su ámbito)

**Recolección**
- [ ] Multilínea configurada **solo** para fuentes sin JSON, validada con un
      stack trace real
- [ ] Checkpoint de posición de lectura persistente configurado
- [ ] Punto de arranque definido para los tres casos: instalación inicial,
      archivo nuevo y reinicio con checkpoint
- [ ] Reapertura del archivo verificada con una rotación real cuando rota un
      programa externo
- [ ] Propagación de errores hacia el lector revisada (el checkpoint no
      avanza sobre lo no entregado, o la pérdida está aceptada por escrito)
- [ ] Mecanismo de rotación de cada fuente identificado; configuración del
      collector validada con una rotación real
- [ ] Archivos comprimidos excluidos de la recolección continua
- [ ] Un único agente por archivo
- [ ] Permisos de lectura verificados

**Procesamiento**
- [ ] Límite de memoria configurado (processor primero cuando exista;
      contenedor/cgroup o servicio como red de seguridad)
- [ ] Severidad y timestamp mapeados correctamente
- [ ] Atributos de recurso inyectados en el agente, o promovidos desde el
      appender según la plataforma
- [ ] Labels/streams sin IDs de alta cardinalidad; mappings del índice
      revisados según el backend
- [ ] Health checks y ruido conocido filtrados
- [ ] Sampling con probabilidad conocida y registrada si se extrapolan
      conteos; filtros deterministas identificados como no extrapolables
- [ ] Reglas de redacción aplicadas **antes de conectar producción**

**Transporte**
- [ ] Protocolo acorde al backend (OTLP o interfaz nativa soportada)
- [ ] Compresión activada (gzip; zstd solo con soporte en ambos extremos)
- [ ] Reintentos activos con ventana de reintento revisada
- [ ] Semántica at-least-once asumida aguas abajo; ID único de registro si la
      deduplicación es requisito
- [ ] Cola persistente en disco, dimensionada en bytes/s × interrupción
      esperada × margen 20–50 %
- [ ] Cuotas de disco de logs, checkpoints y cola coordinadas si comparten
      filesystem
- [ ] TLS por defecto en todos los tramos; excepciones documentadas
- [ ] Credenciales fuera del archivo de configuración
- [ ] Mecanismos de durabilidad del agente activados de forma explícita y
      comprobados en la versión en uso (cola, WAL, reintentos)
- [ ] Prueba de pérdida hecha: agente detenido bajo carga, conteo de lo
      emitido frente a lo recibido
- [ ] Política para JSON inválido, tipos incorrectos, timestamps imposibles y
      rechazos permanentes definida, con contadores

**Seguridad**
- [ ] Ingesta autenticada, con credenciales revocables por agente o entorno
- [ ] Permisos de consulta definidos por entorno, servicio o equipo
- [ ] Aislamiento entre inquilinos asignado por agente o gateway, si aplica
- [ ] Permisos restrictivos en archivos de log, cola, checkpoints y
      cuarentena

**Backend**
- [ ] Política de retención definida y documentada
- [ ] Alertas por condiciones agregadas sobre `event.name`/severidad/tasas
- [ ] Salud del agente monitoreada: descartes, cola, errores de exportación,
      lag de lectura, disco
- [ ] Alerta de ausencia (dead man's switch) o ruta de monitoreo
      independiente del propio agente
- [ ] Correlación validada extremo a extremo con una petición real:
      log → traza → span

---

## 9. Diagnóstico

| Síntoma | Causa habitual |
|---|---|
| No llega ningún registro | Ruta incorrecta o permisos insuficientes |
| No llega nada, pero la ruta es correcta | El agente solo lee lo nuevo y no hay escrituras |
| Registros duplicados | Dos agentes, patrones solapados o falta checkpoint de lectura |
| Faltan líneas tras reiniciar el agente | Checkpoint no persistente, o punto de arranque "solo lo nuevo" sin checkpoint |
| Faltan líneas alrededor de cada rotación | copytruncate (ventana de riesgo) o rotados excluidos con rename/create |
| Duplicados puntuales tras reinicios o caídas | Semántica at-least-once: reenvío de lo no confirmado; deduplicar por ID si es requisito |
| Stack traces fragmentados | Fuente sin JSON y sin configuración multilínea |
| Registros JSON corruptos o mezclados | Multilínea aplicada sobre una fuente JSON |
| Tras rotar, el archivo nuevo queda vacío y no llegan logs | El escritor no reabrió el archivo y sigue escribiendo en el renombrado |
| Faltan las primeras líneas de un servicio recién desplegado | Punto de arranque "desde el final" aplicado a un archivo nuevo |
| Falta todo un periodo tras recrear el agente | Checkpoint perdido (volumen efímero) con arranque "desde el final" |
| El agente no reporta errores, pero faltan registros | Lote descartado tras fallar un componente posterior, con la posición ya avanzada; o rechazos 4xx sin contar |
| La aplicación se bloquea pese a usar appender asíncrono | Cola llena con `neverBlock=false` (Logback) o equivalente |
| Registros grandes que desaparecen | Sin límite de tamaño/truncamiento; exceden tope del pipeline o backend |
| JSON inválido solo en registros largos (contenedores) | Docker partió la línea a los 16 KB y el agente no recombina |
| Faltan logs de un pod tras un pico de volumen | El kubelet rotó y borró archivos antes de que el agente los leyera |
| El backend rechaza registros de un servicio concreto | Un campo llega con tipo distinto al ya indexado (contrato, Anexo A) |
| La aplicación se vuelve lenta con el disco lleno o el agente caído | Escritura bloqueante sin política definida (5.1) |
| Faltan INFO/DEBUG en picos, sin errores en el agente | El appender asíncrono descarta al llenarse su cola; revisar su contador |
| Timestamp incorrecto o desplazado | Zona horaria no declarada, formato mal parseado o NTP sin sincronizar |
| Toda la severidad es idéntica | Mapeo de severidad no configurado |
| Alertas que dejaron de dispararse tras un deploy | Condición atada al texto del mensaje en vez de `event.name` |
| Pérdida durante picos de carga | Cola no persistente, mal dimensionada o sin reintentos |
| Pérdida en caídas largas del backend | Ventana de reintento expirada (default ~5 min) o disco de cola lleno |
| El agente se reinicia bajo carga | Falta límite de memoria |
| El backend se degrada al consultar | Alta cardinalidad como labels/streams, o mappings descontrolados |
| Métricas derivadas de logs no cuadran con la realidad | Conteos extrapolados desde filtros deterministas o rate limiting |
| Costo del backend creciendo | Health checks sin filtrar, sin retención, o `DEBUG` activo |

**Primer paso siempre:** revisar los logs y métricas del propio agente. Casi
siempre indican exactamente qué archivo no puede abrir, a qué destino no puede
conectarse o cuántos registros está descartando.

---

## 10. Orden de adopción

Cada etapa es verificable de forma independiente. No conviene saltar a la
última en el primer intento.

Este es un **orden de construcción y aprendizaje**, pensado para recorrerse
con tráfico de prueba o en un entorno de ensayo. No es un permiso para
conectar producción a mitad de camino.

**Puerta de producción:** ningún log de producción fluye al backend hasta que
se cumplan **todos los requisitos de nivel DEBE** del checklist (sección 8):
como mínimo redacción, TLS, ingesta autenticada, permisos de consulta,
retención, checkpoints, cola persistente y monitoreo independiente del
agente. Los de nivel DEBERÍA y PUEDE (sampling, correlación con trazas,
retención escalonada) pueden llegar después.

1. Recolección mínima funcionando — que llegue algo al backend, aunque sea
   texto crudo sin parsear.
2. Formato estructurado en la aplicación según el contrato del registro
   (Anexo A, librerías en el Anexo B) y parsing en el agente, incluyendo
   `event.name` en los eventos que alimentarán alertas.
3. Agrupación multilínea para fuentes sin JSON, validada con un error real.
4. Enriquecimiento con atributos de recurso y revisión de cardinalidad e
   indexación según el backend.
5. **Redacción de datos sensibles** — como mínimo reglas básicas (tarjetas,
   tokens, credenciales) antes de conectar cualquier fuente de producción,
   sumada a la verificación en código de que no se registran secretos.
6. Fiabilidad: checkpoints de lectura, cola persistente dimensionada,
   ventana de reintento revisada, compresión y TLS con sus excepciones
   documentadas. **Incluye el monitoreo de salud del agente** con alerta de
   ausencia por ruta independiente: sin él, las garantías de esta etapa no
   se pueden comprobar.
7. Filtrado de ruido y control de volumen (sampling con probabilidad
   conocida si se extrapolan conteos).
8. Correlación con trazas, validada extremo a extremo con una petición real.
9. Retención y alertas por condiciones agregadas sobre los eventos de la
   aplicación.

---

## Anexo A. Contrato del registro (formato de la línea)

### A.1 ¿Existe un formato estándar?

No hay un único estándar universal para "una línea JSON de log". Hay tres
referencias, y conviene saber qué es cada una:

| Referencia | Qué define | Cuándo usarla |
|---|---|---|
| **OpenTelemetry Log Data Model** | El modelo lógico: `Timestamp`, `SeverityText`/`SeverityNumber`, `Body`, `Attributes`, `Resource`, `TraceId`, `SpanId`, `EventName`. No fija cómo se escribe la línea en un archivo | Como destino: es a lo que el agente convierte cada línea (5.3) |
| **Semantic conventions de OpenTelemetry** | Los nombres de los atributos (`service.name`, `http.request.method`, `exception.type`) | Para nombrar cualquier campo que ya tenga nombre oficial |
| **ECS (Elastic Common Schema)** | Un esquema JSON concreto: `@timestamp`, `log.level`, `message`, `service.name`, `trace.id` | Cuando el backend es Elastic/OpenSearch o el stack lo trae de fábrica (Spring Boot) |

**Decisión de esta guía:** una línea JSON plana con un **núcleo fijo de
campos** (A.2) y el resto de atributos nombrados según las semantic
conventions. ECS es una alternativa válida si se adopta completa y en todos
los servicios. La regla es **un único contrato después de normalizar**: lo
que llega al backend cumple A.2 sin excepciones. Antes de normalizar pueden
coexistir formatos nativos distintos (A.5), siempre que cada formato de
entrada esté documentado y tenga su regla de mapeo. Lo que no se admite es
que dos esquemas distintos lleguen al backend.

### A.2 Campos núcleo

| Campo | Tipo | Nivel | Ejemplo | Destino en el modelo OTel |
|---|---|---|---|---|
| `timestamp` | string ISO-8601, UTC, milisegundos | DEBE | `"2026-10-02T18:03:11.482Z"` | `Timestamp` |
| `level` | string: `TRACE` `DEBUG` `INFO` `WARN` `ERROR` `FATAL` | DEBE | `"ERROR"` | `SeverityText` (y `SeverityNumber` en el agente) |
| `message` | string de plantilla estable (ver 5.1, "Mensajes estables") | DEBE | `"Webhook rejected: invalid signature"` | `Body` |
| `event.name` | string de un catálogo finito | DEBE en eventos que alimentan alertas | `"payment.webhook.rejected"` | `EventName` |
| `service.name` y demás atributos de recurso | string | DEBE (en la línea o inyectados por el agente, ver 5.1) | `"payments-api"` | `Resource` |
| `trace_id` / `span_id` | string hexadecimal de 32 / 16 caracteres | DEBE cuando hay traza activa | `"4bf92f35…4736"` | `TraceId` / `SpanId` |
| `exception.type` / `.message` / `.stacktrace` | string | DEBE cuando hay excepción | `"InvalidSignatureException"` | `Attributes` |
| Atributos de dominio | según A.4 | PUEDE | `"order.id": "8841"` | `Attributes` |

### A.3 Ejemplo antes y después

**Antes** (texto libre, hora local, datos dentro del mensaje):

```
2026-10-02 14:03:11 ERROR PaymentService - Webhook rechazado para pedido 8841 del comercio 17: firma inválida
```

Problemas: no se puede filtrar por pedido ni por comercio sin expresiones
regulares; la hora no declara zona; una alerta sobre el texto se rompe si
alguien corrige la redacción; no hay forma de saltar a la traza.

**Después** (una sola línea en el archivo; aquí se muestra con saltos para
leerla):

```json
{
  "timestamp": "2026-10-02T18:03:11.482Z",
  "level": "ERROR",
  "message": "Webhook rejected: invalid signature",
  "event.name": "payment.webhook.rejected",
  "service.name": "payments-api",
  "service.version": "1.8.2",
  "deployment.environment.name": "production",
  "service.instance.id": "payments-api-7f9c",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "span_id": "00f067aa0ba902b7",
  "order.id": "8841",
  "merchant.id": "17",
  "error.type": "invalid_signature"
}
```

Lo que ahora es posible: contar `payment.webhook.rejected` por `merchant.id`,
alertar cuando su tasa supera un umbral, y abrir la traza con el `trace_id`.
La hora local 14:03 (UTC−4) pasó a 18:03 UTC.

La misma línea con una excepción añade tres campos, y el stack trace viaja
como un único string con `\n` escapados:

```json
{"timestamp":"2026-10-02T18:03:11.482Z","level":"ERROR","message":"Webhook processing failed","event.name":"payment.webhook.failed","exception.type":"java.net.SocketTimeoutException","exception.message":"Read timed out","exception.stacktrace":"java.net.SocketTimeoutException: Read timed out\n\tat com.acme.BankClient.confirm(BankClient.java:88)\n\t..."}
```

### A.4 Reglas de nombres y tipos

- **Primero el nombre oficial.** Si las semantic conventions ya nombran el
  dato, se usa ese nombre (`http.response.status_code`, no `status` ni
  `httpStatus`).
- **Dominio propio con prefijo.** Minúsculas, separadas por puntos, con el
  namespace del dominio: `order.id`, `payment.method`, `invoice.number`.
- **Un campo, un tipo, en todos los servicios.** Ejemplo del fallo:
  un servicio emite `"order.id": 8841` (número) y otro `"order.id": "A-8841"`
  (texto); el backend indexa el primero como numérico y rechaza el segundo.
- **Los identificadores son siempre string**, aunque hoy sean numéricos.
- **Unidad en el nombre** para magnitudes: `duration_ms`, `payload.size_bytes`.
- **Booleanos y números con su tipo JSON**, no como texto (`true`, no `"true"`).
- **Sin objetos de forma libre.** No volcar el cuerpo de una petición ni un
  DTO completo: crea campos sin control y es la vía habitual por la que se
  filtra PII.
- **Catálogo de `event.name` publicado** (un archivo en el repositorio basta):
  nombre, significado, nivel y atributos esperados de cada evento.

### A.5 Dónde se normaliza

Cada librería trae sus propias claves (Anexo B, tabla de claves nativas). Hay
dos estrategias válidas:

| Estrategia | Ventaja | Costo |
|---|---|---|
| **Normalizar en la emisión** (configurar cada librería para emitir las claves de A.2) | Una sola regla de parsing en el agente; los archivos locales se leen igual en todos los servicios | Configuración inicial por stack |
| **Normalizar en el agente** (cada servicio emite su formato nativo y el agente lo mapea) | Cero configuración en la aplicación | Una regla de mapeo por formato; inspección local heterogénea |

**Recomendación:** normalizar en la emisión los seis campos núcleo. Con un
solo stack en toda la organización, normalizar en el agente es igual de
válido.

### A.6 Versionado del contrato

Añadir campos es compatible. Renombrar un campo, cambiar su tipo o retirar un
`event.name` es un **cambio incompatible**: rompe consultas y alertas. Se
anuncia, se emiten ambos nombres durante una ventana de transición y después
se retira el antiguo.

---

## Anexo B. Librerías recomendadas por stack

> Verificado en octubre de 2026. Es la parte del documento que más rápido
> caduca: comprobar versiones antes de reutilizarla.

Criterio de selección: emite JSON por línea sin dependencias de exportación,
permite campos estructurados, propaga contexto por petición y es la opción
con mayor adopción y mantenimiento activo en su ecosistema.

### B.1 Tabla de sugerencias

| Stack | Recomendada | Campos estructurados | Contexto por petición (equivalente de MDC) | `trace_id` en la línea | Alternativa y cuándo |
|---|---|---|---|---|---|
| **Spring Boot** (3.4 o superior) | Logging estructurado integrado (SLF4J + Logback), sin dependencias extra: `logging.structured.format.console=ecs` | API fluida de SLF4J: `log.atInfo().addKeyValue("order.id", id).log()` | `MDC.put(...)` | Micrometer Tracing o el agente Java de OpenTelemetry lo ponen en el MDC | `logstash-logback-encoder`: versiones anteriores a 3.4 o necesidad de enmascarado avanzado |
| **NestJS** | `nestjs-pino` + `pino-http` | Objeto como primer argumento: `logger.info({ 'order.id': id }, 'msg')` | Automático por petición (AsyncLocalStorage) | `@opentelemetry/instrumentation-pino` | `ConsoleLogger({ json: true })` integrado (NestJS 11+): servicios pequeños sin contexto por petición |
| **Node.js sin Nest** | `pino` (+ `pino-http` en APIs) | Igual que arriba | `logger.child({...})` y AsyncLocalStorage | `@opentelemetry/instrumentation-pino` | `winston`: solo si ya está en el proyecto; es más lento |
| **.NET** (8 o superior) | `ILogger<T>` en el código + **Serilog** como proveedor (`Serilog.AspNetCore`, `Serilog.Formatting.Compact`) | Plantillas de mensaje: `LogInformation("Order {OrderId} paid", id)` | `logger.BeginScope(...)` o `LogContext.PushProperty(...)` | Serilog lo toma de `Activity.Current` (claves `@tr` y `@sp`) | `AddJsonConsole()` integrado: servicios simples sin dependencias. `[LoggerMessage]` (generador de código) en rutas de alto tráfico |
| **Go** (1.21 o superior) | `log/slog` de la librería estándar con `slog.NewJSONHandler` | Pares clave-valor: `slog.Info("msg", "order.id", id)` | `logger.With(...)` y las variantes `InfoContext(ctx, ...)` | Manual: un handler propio de pocas líneas que lee el span del `context` | `zap` o `zerolog` como backend detrás de la API de slog: servicios de muy alto volumen |

MDC (*Mapped Diagnostic Context*) es el mapa clave-valor ligado al hilo o a la
petición que el logger añade a cada registro. Ejemplo: se guarda
`merchant.id=17` al entrar la petición y todas las líneas de esa petición lo
llevan sin repetirlo en cada llamada.

**Regla sobre la API en el código:** preferir la API estándar del ecosistema
cuando permite campos estructurados: SLF4J en Java, `ILogger<T>` en .NET,
`slog` en Go. Con ellas se puede cambiar el motor sin tocar las llamadas.
**NestJS es la excepción:** el `Logger` estándar de Nest no ofrece una forma
cómoda de pasar campos estructurados, así que los ejemplos usan `PinoLogger`
directamente. Es una dependencia aceptada y explícita: cambiar de motor en
NestJS sí implica tocar las llamadas.

**Lo que no se instala:** appenders o exporters OTLP de logs (por ejemplo
`opentelemetry-logback-appender`, `Serilog.Sinks.OpenTelemetry`, el bridge
`otelslog`). Son correctos, pero implementan el patrón "Direct to Collector"
descartado en la sección 1.

### B.2 Claves nativas de cada librería

Lo que emite cada una sin configurar, y por tanto lo que hay que renombrar
(en la emisión o en el agente, ver A.5):

| Librería | Tiempo | Nivel | Mensaje | Traza |
|---|---|---|---|---|
| Spring Boot (formato `ecs`) | `@timestamp` | `log.level` | `message` | `traceId`/`spanId` (Micrometer) o `trace_id`/`span_id` (agente OTel) |
| Pino | `time` (epoch en ms) | `level` numérico (`30` = info, `50` = error) | `msg` | `trace_id` / `span_id` |
| Serilog (formato compacto, CLEF) | `@t` | `@l` (se omite cuando es Information) | `@mt` (plantilla sin renderizar; `@m` con el formateador *Rendered*) | `@tr` / `@sp` |
| Go `slog` | `time` | `level` | `msg` | la que defina el handler propio |

Dos trampas frecuentes: el nivel numérico de Pino (si no se mapea, toda la
severidad llega igual) y el `@l` ausente de Serilog (la ausencia significa
INFO, no "desconocido").

**Excepciones.** Ninguna librería emite `exception.*` de fábrica; este es el
mapeo hacia el contrato (A.2):

| Librería | Cómo se registra | Qué emite | Mapeo a `exception.type` / `.message` / `.stacktrace` |
|---|---|---|---|
| Spring Boot (`ecs`) | `log.atError().setCause(ex)` | `error.type`, `error.message`, `error.stack_trace` | Renombrado directo, campo a campo |
| Pino | `logger.error({ err }, 'msg')` | Objeto `err` con `type`, `message`, `stack` | `err.type`, `err.message`, `err.stack` |
| Serilog (CLEF) | `logger.LogError(ex, "msg")` | `@x`: un único string con tipo, mensaje y stack | `@x` completo a `.stacktrace`; tipo y mensaje se extraen de su primera línea |
| Go `slog` | Manual: `"exception.message", err.Error()` | Solo lo que se pase; Go no genera stack trace en un `error` | Emitir ya con los nombres del contrato; `.stacktrace` solo si se captura a propósito |

### B.3 Configuración mínima por stack

**Spring Boot** (`application.yml`):

```yaml
logging:
  structured:
    format:
      console: ecs
    ecs:
      service:
        name: ${SERVICE_NAME}
        version: ${SERVICE_VERSION}
        environment: ${DEPLOY_ENV}
        node-name: ${HOSTNAME}
```

El formato `ecs` emite las claves de ECS (ver B.2). Para emitir las de A.2 sin
escribir un formateador propio, se renombran con
`logging.structured.json.rename`, o se mapean en el agente.

```java
log.atError()
   .setMessage("Webhook rejected: invalid signature")
   .addKeyValue("event.name", "payment.webhook.rejected")
   .addKeyValue("order.id", orderId)
   .log();
```

**NestJS** (`app.module.ts` y `main.ts`):

```ts
LoggerModule.forRoot({
  pinoHttp: {
    level: process.env.LOG_LEVEL ?? 'info',
    messageKey: 'message',
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    formatters: { level: (label) => ({ level: label.toUpperCase() }) },
    base: {
      'service.name': process.env.SERVICE_NAME,
      'service.version': process.env.SERVICE_VERSION,
      'deployment.environment.name': process.env.DEPLOY_ENV,
      'service.instance.id': process.env.HOSTNAME,
    },
    redact: ['req.headers.authorization', 'req.headers.cookie'],
    autoLogging: { ignore: (req) => req.url === '/health' },
  },
});

// main.ts
const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(Logger)); // Logger de 'nestjs-pino'
```

```ts
constructor(
  @InjectPinoLogger(PaymentsService.name) private readonly logger: PinoLogger,
) {}

this.logger.error(
  { 'event.name': 'payment.webhook.rejected', 'order.id': orderId },
  'Webhook rejected: invalid signature',
);
```

**.NET** (`Program.cs`):

```csharp
builder.Services.AddSerilog((services, cfg) => cfg
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("service.name", builder.Configuration["SERVICE_NAME"] ?? "unknown")
    .Enrich.WithProperty("service.version", builder.Configuration["SERVICE_VERSION"] ?? "unknown")
    .Enrich.WithProperty("deployment.environment.name", builder.Environment.EnvironmentName)
    .Enrich.WithProperty("service.instance.id", Environment.MachineName)
    .WriteTo.Console(new CompactJsonFormatter()));
```

`CompactJsonFormatter` emite la plantilla sin renderizar (`@mt`) y cada valor
como campo aparte, que es lo que pide la regla de mensajes estables.

```csharp
using (logger.BeginScope(new Dictionary<string, object>
{
    ["event.name"] = "payment.webhook.rejected",
    ["order.id"] = orderId,
}))
{
    logger.LogError("Webhook rejected: invalid signature");
}
```

**Go**:

```go
h := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
    Level: slog.LevelInfo,
    ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
        if len(groups) > 0 {
            return a
        }
        switch a.Key {
        case slog.TimeKey:
            a.Key = "timestamp"
            a.Value = slog.TimeValue(a.Value.Time().UTC())
        case slog.MessageKey:
            a.Key = "message"
        }
        return a
    },
})
slog.SetDefault(slog.New(h).With(
    "service.name", os.Getenv("SERVICE_NAME"),
    "service.version", os.Getenv("SERVICE_VERSION"),
    "deployment.environment.name", os.Getenv("DEPLOY_ENV"),
    "service.instance.id", os.Getenv("HOSTNAME"),
))

slog.ErrorContext(ctx, "Webhook rejected: invalid signature",
    "event.name", "payment.webhook.rejected",
    "order.id", orderID,
)
```

Los cuatro ejemplos incluyen los atributos de recurso porque suponen un host
sin metadata accesible para el agente (segundo caso de 5.1). Si el agente los
inyecta, se quitan de la configuración de la aplicación. En Spring Boot con
`ecs`, `node-name` se emite como `service.node.name` y se mapea a
`service.instance.id`.

### B.4 Rotación cuando se escribe a archivo

| Stack | Mecanismo |
|---|---|
| Spring Boot | Rota la propia librería, con reapertura automática. Logback integrado: `logging.logback.rollingpolicy.max-file-size`, `max-history` y `total-size-cap` |
| Node.js / NestJS | Fuera del proceso. Preferente: stdout con límites del runtime. Con archivo: `logrotate` en modo rename/create más una señal en `postrotate` que dispare `destination.reopen()` en Pino. Sin esa reapertura, la aplicación sigue escribiendo en el archivo renombrado |
| .NET | `Serilog.Sinks.File` con `rollingInterval`, `fileSizeLimitBytes` y `retainedFileCountLimit` |
| Go | Stdout con límites del runtime, o `lumberjack` como `io.Writer` del handler |

---

## Anexo C. Perfil mínimo (pocos servicios, un host)

Para un VPS o un host con Docker Compose y pocos servicios, la guía completa
sobra. Esto es lo que no se puede omitir y lo que puede esperar.

| Imprescindible desde el primer día | Referencia |
|---|---|
| JSON por línea con los campos núcleo | Anexo A |
| Sin secretos ni PII en el código, y redacción básica en el agente | 5.1, 5.3 |
| Límites de log del runtime (`max-size`/`max-file`) o rotación del archivo | 5.1 |
| Un único agente en el host, con checkpoint persistente | 5.2 |
| Límite de memoria del agente y cola persistente en disco | 5.3, 5.4 |
| TLS si el backend está en otro host | 5.4 |
| Ingesta autenticada y permisos restrictivos en archivos, cola y checkpoints | 5.6 |
| Reapertura del archivo verificada si rota un programa externo | 5.1 |
| Retención definida | 5.5 |
| Alerta de ausencia (dead man's switch) | 5.5 |

| Puede esperar | Cuándo deja de poder esperar |
|---|---|
| Gateway | Varios hosts o control central de egreso |
| Sampling | El volumen de INFO pesa en el costo |
| Retención escalonada | El almacenamiento reciente se queda corto |
| Correlación con trazas | Hay más de un servicio por petición |
| Compresión zstd, ajuste fino de lotes | Egreso o CPU del agente medidos como problema |
| Taxonomía de niveles documentada por equipo | Más de un equipo escribiendo servicios |
