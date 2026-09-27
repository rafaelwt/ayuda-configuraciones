# Guía para escribir README

Guía personal para crear el `README.md` de cualquier proyecto nuevo. No es una plantilla rígida: es un menú. Se eligen las secciones según el tipo de proyecto y se mantienen vivas junto al código.

---

## Tabla de contenidos

- [Principios](#principios)
- [Idioma](#idioma)
- [Elegir el nivel del README](#elegir-el-nivel-del-readme)
- [Secciones: qué poner y cómo](#secciones-qué-poner-y-cómo)
- [Monorepos: README raíz vs. README por app](#monorepos-readme-raíz-vs-readme-por-app)
- [Badges](#badges)
- [Qué NO va en el README](#qué-no-va-en-el-readme)
- [Plantilla mínima](#plantilla-mínima)
- [Plantilla estándar](#plantilla-estándar)
- [Extras para open source](#extras-para-open-source)
- [Checklist antes de dar por terminado el README](#checklist-antes-de-dar-por-terminado-el-readme)
- [Mantenimiento](#mantenimiento)

---

## Principios

1. **El README es la puerta de entrada, no el manual.** Debe responder rápido tres preguntas: ¿qué es esto?, ¿cómo lo levanto?, ¿dónde encuentro más información?
2. **"Justo lo suficiente".** Si una sección del README crece más de una pantalla, probablemente debe irse a `docs/` y dejar solo un enlace.
3. **Escribirlo para el "yo del futuro".** Dentro de seis meses no vas a recordar qué variable de entorno faltaba ni por qué se eligió cierta librería.
4. **Cada dato tiene una fuente de verdad.** Versiones, variables y comandos salen de los archivos del proyecto (`package.json`, `.env.example`, `docker-compose.yml`…). El README los resume y se verifica contra ellos; nunca se escribe de memoria.
5. **Lo que se puede ejecutar, se prueba, y se declara si se probó.** Los pasos de instalación se validan en un entorno limpio, y el README dice cuándo fue la última verificación.
6. **Un README desactualizado es peor que uno corto**, porque engaña. Cada PR que cambie setup, configuración o arquitectura debe tocar el README.

---

## Idioma

Definir el idioma **antes** de escribir y mantenerlo en todo el README.

| Caso | Idioma |
|---|---|
| Proyecto de un cliente o equipo hispanohablante | Español |
| Open source público | Inglés |
| Equipo mixto | El idioma de trabajo acordado por el equipo |

- **Nunca mezclar** idiomas en los encabezados ni en el texto de un mismo README.
- Los nombres de variables, comandos, carpetas y endpoints se dejan **tal como están en el código**, aunque el README esté en español.
- Si el README está en español, los encabezados pueden llevar tildes: GitHub genera el ancla igual (`## Configuración` → `#configuración`).

---

## Elegir el nivel del README

| Tipo de proyecto | Nivel | Secciones aproximadas |
|---|---|---|
| Script, POC, repo de práctica | Mínimo | 3–4 |
| Proyecto de cliente / herramienta interna | Mínimo o estándar | 6–8 |
| Sistema de larga vida, varios desarrolladores | Estándar | 8–11 |
| Monorepo | Estándar en la raíz + mínimo por app | Ver [Monorepos](#monorepos-readme-raíz-vs-readme-por-app) |
| Open source público | Estándar + extras | 10–15 |

> **POC** (Proof of Concept, prueba de concepto): un prototipo rápido para validar que algo funciona. Ejemplo: probar si una API externa responde como se espera antes de construir la integración completa.

---

## Secciones: qué poner y cómo

### 1. Título y descripción corta — *obligatoria*

Nombre del proyecto y **una o dos frases** que digan qué hace y para quién. Opcional: logo, captura de pantalla y [badges](#badges).

```markdown
# Gestor de Tareas

Aplicación web para que equipos pequeños organicen sus tareas por proyecto y reciban recordatorios de vencimiento.
```

### 2. Tabla de contenidos — *si el README supera ~4 secciones*

Enlaces internos a cada sección. GitHub genera un ancla por cada encabezado.

> **Ancla** (anchor): identificador que permite saltar a una parte de la página. El encabezado `## Getting Started` se enlaza con `[Getting Started](#getting-started)`: minúsculas, espacios cambiados por guiones, sin signos de puntuación.

### 3. Acerca del proyecto (About) — *obligatoria*

Qué problema resuelve, a quién va dirigido y cómo funciona **a alto nivel**. Sin detalles de implementación.

### 4. Funcionalidades — *recomendada*

Lista o tabla corta. Qué hace cada funcionalidad, no cómo está hecha.

```markdown
| Funcionalidad | Descripción |
|---|---|
| Tableros por proyecto | Cada proyecto tiene su tablero con columnas personalizables |
| Recordatorios | Envía un aviso por correo antes de que venza una tarea |
```

### 5. Stack tecnológico — *obligatoria*

Tecnologías principales **con versión**, porque la versión suele ser la causa de los errores al levantar el proyecto. Las versiones **no se escriben de memoria**: se copian de su fuente de verdad.

| Tecnología | Fuente de verdad de la versión |
|---|---|
| Node.js | Campo `engines` de `package.json` o archivo `.nvmrc` |
| Angular, NestJS y librerías JS | `dependencies` de `package.json` |
| Java / Spring Boot | `pom.xml` o `build.gradle` (versión de Java y del parent de Spring Boot) |
| .NET | `global.json` (SDK) y `<TargetFramework>` del `.csproj` |
| PostgreSQL, Redis y otros servicios | Tag de la imagen en `docker-compose.yml` |

> **`engines`**: campo de `package.json` que declara qué versión de Node requiere el proyecto. Ejemplo: `"engines": { "node": ">=22" }`.
>
> **`.nvmrc`**: archivo que contiene solo la versión de Node (por ejemplo `22`). Al ejecutar `nvm use` en la carpeta, nvm cambia automáticamente a esa versión.

```markdown
| Capa | Tecnología |
|---|---|
| Frontend | Angular <versión> |
| Backend | NestJS <versión> / Node <versión> |
| Base de datos | PostgreSQL <versión> |
| Infraestructura | Docker Compose |
```

### 6. Arquitectura — *recomendada en proyectos no triviales*

Vista de pájaro: qué componentes existen y cómo se comunican. Preferir **Mermaid** sobre imágenes exportadas.

> **Mermaid**: sintaxis de texto que GitHub/GitLab renderizan como diagrama. Vive dentro del Markdown, así que se versiona con el código y se edita sin abrir otra herramienta.

**Diagrama de componentes** — qué piezas hay y cómo se conectan:

````markdown
```mermaid
graph LR
    U[Usuario] --> FE[Frontend]
    FE --> API[API]
    API --> DB[(Base de datos)]
    API --> EXT[Servicio externo]
```
````

**Diagrama de secuencia** — para flujos importantes, donde importa el orden de los pasos.

> **Diagrama de secuencia**: muestra quién le habla a quién y en qué orden a lo largo del tiempo. Ejemplo: en un login, el usuario envía credenciales al frontend, el frontend llama a la API, la API consulta la base y devuelve un token.

````markdown
```mermaid
sequenceDiagram
    actor U as Usuario
    participant FE as Frontend
    participant API
    participant DB as Base de datos
    U->>FE: Ingresa credenciales
    FE->>API: POST /auth/login
    API->>DB: Buscar usuario
    DB-->>API: Usuario
    API-->>FE: Token JWT
    FE-->>U: Redirige al panel
```
````

Regla práctica: **un diagrama de componentes en el README** y, si hay flujos críticos (autenticación, pagos, sincronizaciones), **sus diagramas de secuencia en `docs/`** con un enlace.

Si el proyecto usa Clean/Hexagonal Architecture, basta una o dos frases explicando la regla de dependencias y enlazar a `docs/architecture.md` para el detalle.

### 7. Estructura del proyecto — *recomendada*

Solo las carpetas importantes y su propósito. No pegar el árbol completo.

```text
src/
├── domain/          # Entidades y reglas de negocio, sin dependencias externas
├── application/     # Casos de uso
├── infrastructure/  # Repositorios, clientes HTTP, ORM
└── presentation/    # Controladores / endpoints
```

### 8. Primeros pasos (Getting Started) — *obligatoria y la más importante*

Desde cero, sin asumir nada. Incluir:

- **Requisitos previos** con versión (tomada de su fuente de verdad).
- **Clonar** el repositorio y entrar a la carpeta.
- **Instalar dependencias.**
- **Configurar variables de entorno** (referencia a la sección Configuración).
- **Levantar servicios** (base de datos, etc.).
- **Migraciones / datos semilla.**
- **Ejecutar** y cómo verificar que funciona (URL, endpoint de health).
- **Línea de verificación**: cuándo y en qué entorno se probaron estos pasos por última vez.

````markdown
> Setup verificado por última vez: <AAAA-MM> · <sistema operativo> + Docker <versión>

```bash
git clone <url-del-repo>
cd <proyecto>
cp .env.example .env
docker compose up -d db
npm install
npm run migration:run
npm run start:dev
# Verificar: http://localhost:3000/health debe responder {"status":"ok"}
```
````

Si los pasos **no** se probaron en un entorno limpio, decirlo explícitamente:

```markdown
> ⚠️ Setup no verificado en entorno limpio.
```

> **Datos semilla** (seed): datos iniciales que se cargan en la base para poder probar. Ejemplo: un usuario administrador y algunos registros de prueba.

### 9. Configuración — *obligatoria si hay variables de entorno*

Tabla con **todas** las variables. Nunca valores reales de producción.

**Si son pocas (≤ 10)**, una sola tabla:

```markdown
| Variable | Descripción | Obligatoria | Ejemplo |
|---|---|---|---|
| `DATABASE_URL` | Cadena de conexión a la base de datos | Sí | `postgresql://user:pass@localhost:5432/app` |
| `JWT_SECRET` | Clave para firmar tokens | Sí | `cambiar-en-produccion` |
| `LOG_LEVEL` | Nivel de logs | No | `info` |
```

**Si son muchas**, agruparlas por integración con un subtítulo por grupo (y el mismo orden y comentarios en `.env.example`):

```markdown
#### Base de datos
| Variable | Descripción | Obligatoria | Ejemplo |
|---|---|---|---|
| `DATABASE_URL` | ... | Sí | ... |

#### Correo (SMTP)
| Variable | Descripción | Obligatoria | Ejemplo |
|---|---|---|---|
| `SMTP_HOST` | ... | Sí | ... |
```

**Cómo evitar que la tabla se desincronice:**

1. **La fuente de verdad es un esquema de validación en el código**, no el README. La app valida sus variables al arrancar y no inicia si falta una obligatoria.

   > **Esquema de validación**: definición en código de qué variables existen, su tipo y si son obligatorias. Ejemplo: en NestJS, `ConfigModule` con un esquema Joi o Zod que exige `DATABASE_URL`; si no está, la app se detiene con un error claro. En Spring se logra con `@ConfigurationProperties` + `@Validated`; en .NET, con `IOptions` + `ValidateOnStart()`.

2. **`.env.example` refleja el esquema**, y **la tabla del README refleja `.env.example`**.

3. **Se verifica con un comando**, no de memoria. Compara los nombres de `.env.example` con los que aparecen entre backticks en el README (no imprime nada si coinciden):

   ```bash
   diff <(grep -oE '^[A-Z][A-Z0-9_]*' .env.example | sort -u) \
        <(grep -oE '`[A-Z][A-Z0-9_]*`' README.md | tr -d '`' | sort -u)
   ```

   Requiere bash o zsh (no funciona en `sh`). Si falta una variable en el README, aparece con `<`; si sobra, con `>`. Revisar a mano los falsos positivos (otras palabras en mayúsculas entre backticks). En proyectos Node, también se puede comparar contra las variables que el código realmente usa:

   ```bash
   rg -o --no-filename 'process\.env\.([A-Z0-9_]+)' -r '$1' src | sort -u
   ```

   > **rg** (ripgrep): buscador de texto por línea de comandos, similar a `grep` pero mucho más rápido y que respeta `.gitignore`. Ejemplo: `rg "TODO" src` lista todos los TODO del código.

### 10. Scripts / comandos útiles — *recomendada*

Tests, lint, build, generación de código. Ahorra tener que leer el `package.json`, `pom.xml` o `.csproj`.

```markdown
| Comando | Qué hace |
|---|---|
| `npm run test` | Tests unitarios |
| `npm run test:e2e` | Tests end-to-end |
| `npm run lint` | Revisión de estilo |
| `npm run build` | Build de producción |
```

> **Lint**: herramienta que revisa el código en busca de errores de estilo o patrones problemáticos sin ejecutarlo. Ejemplo: ESLint avisando de una variable declarada pero nunca usada.

### 11. Despliegue — *recomendada*

Resumen de cómo se despliega (manual, CI/CD, a qué servidor) y enlace a `docs/deployment.md` si es largo.

> **CI/CD** (Integración Continua / Despliegue Continuo): automatización que ejecuta tests y despliega cada vez que se sube código. Ejemplo: un workflow de GitHub Actions que corre los tests y, si pasan, publica la imagen Docker en el servidor.

### 12. Seguridad — *si aplica*

Reglas prácticas para quien toque el código: cómo se gestionan los secretos, cómo funciona la autenticación, qué nunca se debe commitear. **No** documentar detalles que expongan la infraestructura (IPs, puertos internos, nombres de usuarios reales).

### 13. Solución de problemas (Troubleshooting) — *muy recomendada*

Los errores típicos al levantar o usar el proyecto. Cada entrada con **formato fijo: síntoma, causa y solución**, para que se lea de un vistazo. Se va llenando con el tiempo: cada vez que alguien se traba, se agrega una entrada.

```markdown
#### `ECONNREFUSED 127.0.0.1:5432` al iniciar la API
- **Síntoma:** la API no arranca y muestra `ECONNREFUSED` en el puerto 5432.
- **Causa:** el contenedor de la base de datos no está corriendo.
- **Solución:** `docker compose up -d db` y volver a iniciar la API.
```

Usar el mensaje de error literal en el título: es lo que la gente copia y busca con `Ctrl+F`.

### 14. Documentación adicional — *recomendada*

Enlaces a `docs/`, diagramas de secuencia, colección de Postman/Bruno, Swagger y ADR.

> **ADR** (Architecture Decision Record): nota corta que registra una decisión técnica, su contexto y sus consecuencias. Ejemplo: `docs/adr/003-usar-redis-para-cache.md` explicando por qué se eligió Redis como caché y qué alternativas se descartaron.

### 15. Licencia — *obligatoria en open source; en proyectos privados, indicar "Privado"*

Solo el tipo y un enlace al archivo `LICENSE`.

### 16. Autor / contacto — *opcional*

Nombre y forma de contacto. En proyectos privados, útil para indicar quién mantiene el sistema.

---

## Monorepos: README raíz vs. README por app

> **Monorepo**: un solo repositorio que contiene varias aplicaciones o paquetes. Ejemplo: `apps/web` (frontend), `apps/api` (backend) y `packages/shared` (tipos compartidos) en el mismo repo.

**Regla: nada se repite, todo se enlaza.** Cada dato vive en un solo README y los demás apuntan a él.

| README de la raíz | README de cada app o paquete |
|---|---|
| Qué es el sistema completo y para quién | Qué hace esta app dentro del sistema (1–2 frases) |
| Diagrama de cómo se conectan las piezas | Su stack con versiones |
| Requisitos globales (Node, Docker, gestor de paquetes) | Su configuración y tabla de variables (`.env.example` propio) |
| Cómo levantar **todo** el sistema de una vez | Cómo levantar **solo** esta app |
| Comandos globales (build, test, lint de todo el repo) | Sus comandos específicos |
| Índice con enlace a cada app | Su solución de problemas |
| Despliegue general, licencia, contacto | Enlace de vuelta al README raíz |

Índice sugerido en el README raíz:

```markdown
## Aplicaciones

| App | Descripción | Documentación |
|---|---|---|
| `apps/web` | Frontend | [README](apps/web/README.md) |
| `apps/api` | API REST | [README](apps/api/README.md) |
| `packages/shared` | Tipos y utilidades compartidas | [README](packages/shared/README.md) |
```

Y al inicio del README de cada app:

```markdown
> Parte del sistema <nombre>. Ver el [README principal](../../README.md) para la visión general y cómo levantar todo.
```

---

## Badges

> **Badge**: pequeña imagen tipo etiqueta que muestra un estado del proyecto (versión, build, licencia). Van justo debajo del título. La fuente más usada es [shields.io](https://shields.io).

**Cuatro reglas:**

1. **La versión del badge es la del proyecto, no la de un ejemplo.** Se copia de su fuente de verdad (ver [Stack tecnológico](#5-stack-tecnológico--obligatoria)). Si el proyecto usa Angular 22, el badge dice 22; nunca se deja la versión de otro README o de esta guía. Basta con la versión mayor (`22`, no `22.0.3`).
2. **Repo privado → solo badges estáticos** (y el de CI de GitHub). Los dinámicos de shields.io aparecen rotos porque no pueden leer el repo.
3. **Un solo estilo** en todo el README.
4. **Entre 3 y 8 badges.** Más que eso es ruido.

Para sacar la versión rápido en proyectos Node:

```bash
node -p "require('./package.json').dependencies['@angular/core']"   # ej: ^22.0.3 → badge "22"
node -p "require('./package.json').engines.node"                    # ej: >=24   → badge "24"
```

Formato básico:

```markdown
![<Etiqueta>](https://img.shields.io/badge/<ETIQUETA>-<MENSAJE>-<COLOR>?logo=<LOGO>&logoColor=white)
```

<details>
<summary><strong>Referencia completa de badges</strong> (tipos, sintaxis, ejemplos, CI, centrado)</summary>

### Tipos

| Tipo | Qué muestra | ¿Funciona en repos privados? |
|---|---|---|
| **Estático** | Texto fijo que tú defines (stack, estado, "Privado") | Sí, siempre |
| **Dinámico** | Datos que shields.io lee del repo (licencia, versión, último commit) | Solo en repos públicos |
| **De CI** | Estado del último build/tests (GitHub Actions, GitLab CI) | GitHub lo muestra a quien tenga acceso al repo |

> **Badge estático vs. dinámico**: el estático es como un cartel impreso (siempre dice lo mismo); el dinámico es como un marcador en vivo (se actualiza solo). Ejemplo: un badge estático sigue diciendo la versión que escribiste aunque actualices; uno dinámico de release cambia solo al publicar una nueva versión.

### Sintaxis de la URL estática

```text
https://img.shields.io/badge/<ETIQUETA>-<MENSAJE>-<COLOR>?logo=<LOGO>&logoColor=white&style=<ESTILO>
```

- **Espacios**: usar `_` o `%20`.
- **Guion literal**: escribir `--`.
- **Guion bajo literal**: escribir `__`.
- **Color**: nombre (`green`, `blue`, `red`, `orange`) o hexadecimal sin `#` (`DD0031`).
- **Logo**: el *slug* del ícono en [Simple Icons](https://simpleicons.org).

> **Slug**: versión de un nombre en minúsculas y sin espacios, pensada para URLs. Ejemplo: "Spring Boot" → `springboot`, ".NET" → `dotnet`. Si un logo no aparece, buscar el slug exacto en simpleicons.org.

### Badges de stack (reemplazar `<versión>` con la de su fuente de verdad)

```markdown
![Angular](https://img.shields.io/badge/Angular-<versión>-DD0031?logo=angular&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-<versión>-E0234E?logo=nestjs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-<versión>-5FA04E?logo=nodedotjs&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-<versión>-6DB33F?logo=springboot&logoColor=white)
![.NET](https://img.shields.io/badge/.NET-<versión>-512BD4?logo=dotnet&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-<versión>-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
```

### Badges de estado

```markdown
![Estado](https://img.shields.io/badge/estado-en_producción-brightgreen)
![Estado](https://img.shields.io/badge/estado-en_desarrollo-orange)
![Licencia](https://img.shields.io/badge/licencia-privada-lightgrey)
```

### Estilos (`&style=`)

| Estilo | Aspecto |
|---|---|
| `flat` (por defecto) | Bordes redondeados, sobrio |
| `flat-square` | Esquinas rectas, más moderno |
| `for-the-badge` | Grande, en mayúsculas; ideal para la fila del stack |
| `plastic` | Con degradado, look antiguo |

### Badges dinámicos (solo repos públicos)

```markdown
![Licencia](https://img.shields.io/github/license/<usuario>/<repo>)
![Release](https://img.shields.io/github/v/release/<usuario>/<repo>)
![Último commit](https://img.shields.io/github/last-commit/<usuario>/<repo>)
![Issues](https://img.shields.io/github/issues/<usuario>/<repo>)
```

> **Release**: versión publicada y etiquetada del proyecto en GitHub. Ejemplo: `v1.2.0` con sus notas de cambios.

### Badge de CI (GitHub Actions)

```markdown
[![CI](https://github.com/<usuario>/<repo>/actions/workflows/ci.yml/badge.svg)](https://github.com/<usuario>/<repo>/actions)
```

Se puede copiar desde GitHub: pestaña **Actions** → elegir el workflow → menú `···` → **Create status badge**.

> **Workflow**: archivo YAML en `.github/workflows/` que define una automatización. Ejemplo: `ci.yml` que ejecuta los tests en cada push.

### Centrar logo y badges

```html
<p align="center">
  <img src="docs/logo.png" alt="Logo" width="120">
</p>

<h1 align="center"><Nombre del Proyecto></h1>

<p align="center">
  <img alt="Angular" src="https://img.shields.io/badge/Angular-<versión>-DD0031?logo=angular&logoColor=white&style=for-the-badge">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-<versión>-4169E1?logo=postgresql&logoColor=white&style=for-the-badge">
</p>
```

### Buenas prácticas adicionales

- Agruparlos por fila: primero estado (CI, versión, licencia) y luego stack.
- Actualizar los estáticos cuando cambie una versión mayor; un badge que miente es peor que ninguno.
- Siempre con texto alternativo (`![Angular](...)`, no `![](...)`).

</details>

---

## Qué NO va en el README

- Secretos, contraseñas, tokens o IPs reales.
- Documentación completa de la API (va en Swagger/OpenAPI o en `docs/`).
- Changelog detallado (va en `CHANGELOG.md`).
- Guía de contribución larga (va en `CONTRIBUTING.md`).
- El árbol completo de carpetas.
- Explicaciones de implementación línea por línea.
- En un monorepo: información que ya está en el README de otra app o en el de la raíz (se enlaza, no se copia).

> **Changelog**: registro de cambios por versión. Ejemplo: "v1.2.0 — Se agregó exportación a PDF; se corrigió el filtro por fecha".

---

## Plantilla mínima

Para proyectos internos, privados, o el README de cada app dentro de un monorepo.

````markdown
# <Nombre del Proyecto>

![Estado](https://img.shields.io/badge/estado-en_desarrollo-orange)
![Licencia](https://img.shields.io/badge/licencia-privada-lightgrey)
![<Tecnología>](https://img.shields.io/badge/<Tecnología>-<versión>-<color>?logo=<slug>&logoColor=white)

Una o dos frases: qué hace y para quién.

## Acerca de

Problema que resuelve y funcionamiento a alto nivel.

## Stack

| Capa | Tecnología |
|---|---|
| | <nombre> <versión> |

## Primeros pasos

> Setup verificado por última vez: <AAAA-MM> · <entorno>

### Requisitos
- 

### Instalación
```bash

```

### Verificar
- 

## Configuración

| Variable | Descripción | Obligatoria | Ejemplo |
|---|---|---|---|
| | | | |

## Comandos útiles

| Comando | Qué hace |
|---|---|
| | |

## Solución de problemas

#### <mensaje de error literal>
- **Síntoma:** 
- **Causa:** 
- **Solución:** 

---
Privado — Propietario: <nombre> · Mantenido por: <nombre>
````

---

## Plantilla estándar

Para sistemas medianos, de larga vida, o el README raíz de un monorepo (en ese caso, agregar la sección **Aplicaciones** con el índice y quitar lo que pertenece a cada app).

````markdown
# <Nombre del Proyecto>

<!-- Opcional: logo y captura de pantalla -->

[![CI](https://github.com/<usuario>/<repo>/actions/workflows/ci.yml/badge.svg)](https://github.com/<usuario>/<repo>/actions)
![Estado](https://img.shields.io/badge/estado-en_producción-brightgreen)
![Licencia](https://img.shields.io/badge/licencia-privada-lightgrey)
![<Tecnología>](https://img.shields.io/badge/<Tecnología>-<versión>-<color>?logo=<slug>&logoColor=white)

Una o dos frases: qué hace y para quién.

## Tabla de contenidos

- [Acerca de](#acerca-de)
- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Primeros pasos](#primeros-pasos)
- [Configuración](#configuración)
- [Comandos útiles](#comandos-útiles)
- [Despliegue](#despliegue)
- [Seguridad](#seguridad)
- [Solución de problemas](#solución-de-problemas)
- [Documentación adicional](#documentación-adicional)
- [Licencia](#licencia)

## Acerca de

## Funcionalidades

| Funcionalidad | Descripción |
|---|---|
| | |

## Stack

| Capa | Tecnología |
|---|---|
| | <nombre> <versión> |

## Arquitectura

```mermaid
graph LR
    A[Cliente] --> B[API]
    B --> C[(Base de datos)]
```

Flujos principales: ver [docs/flows.md](docs/flows.md) (diagramas de secuencia).

## Estructura del proyecto

```text

```

## Primeros pasos

> Setup verificado por última vez: <AAAA-MM> · <entorno>

### Requisitos

### Instalación

```bash

```

### Verificar

## Configuración

<!-- Si son muchas variables, agrupar por integración con un subtítulo por grupo -->

| Variable | Descripción | Obligatoria | Ejemplo |
|---|---|---|---|
| | | | |

## Comandos útiles

| Comando | Qué hace |
|---|---|
| | |

## Despliegue

## Seguridad

## Solución de problemas

#### <mensaje de error literal>
- **Síntoma:** 
- **Causa:** 
- **Solución:** 

## Documentación adicional

- [Arquitectura detallada](docs/architecture.md)
- [Flujos (diagramas de secuencia)](docs/flows.md)
- [Decisiones técnicas (ADR)](docs/adr/)
- API: `<url-de-swagger>`

## Licencia

Privado / MIT / ...
````

---

## Extras para open source

Agregar sobre la plantilla estándar (y escribir el README en inglés):

- **Badges dinámicos** (release, licencia, último commit).
- **Cómo contribuir**: resumen de 3–5 pasos y enlace a `CONTRIBUTING.md`.
- **Roadmap / Próximos pasos**: lista corta de lo que viene; da ideas a quien quiera contribuir.
- **Agradecimientos**: personas, librerías o recursos que ayudaron.
- **Contribuidores**: lista o enlace a la página de contribuidores de GitHub.

---

## Checklist antes de dar por terminado el README

**Contenido**
- [ ] El idioma está definido y es consistente en todo el README.
- [ ] La descripción corta se entiende sin conocer el proyecto.
- [ ] No hay secretos, IPs ni credenciales reales.
- [ ] Ninguna sección ocupa más de una pantalla sin necesidad.
- [ ] Está indicado cómo verificar que el proyecto quedó funcionando.

**Fuentes de verdad**
- [ ] Las versiones del stack (y de los badges) se copiaron de `package.json`, `engines`, `.nvmrc`, `pom.xml`, `global.json` o `docker-compose.yml`, no de memoria.
- [ ] Ejecuté el comando de comparación entre `.env.example` y la tabla de configuración, y no hay diferencias.

**Verificación del setup** (marcar una)
- [ ] Probé los pasos de Getting Started en un entorno limpio y actualicé la línea "Setup verificado por última vez".
- [ ] No lo probé, y el README lo dice explícitamente ("Setup no verificado en entorno limpio").

**Forma**
- [ ] Los diagramas Mermaid renderizan bien en GitHub/GitLab.
- [ ] Los flujos críticos tienen diagrama de secuencia (en el README o en `docs/`).
- [ ] Cada entrada de solución de problemas tiene síntoma, causa y solución.
- [ ] Los badges cargan, usan un solo estilo y son entre 3 y 8.
- [ ] Los enlaces internos, a `docs/` y (en monorepos) entre READMEs funcionan.

---

## Mantenimiento

- Revisar el README en cada PR que cambie dependencias, variables de entorno, comandos o arquitectura.
- Cada error nuevo que alguien resuelva → nueva entrada en Solución de problemas (síntoma, causa, solución).
- Al actualizar una versión mayor del stack → actualizar tabla de stack y badges.
- Una vez por release: releer el README completo, volver a correr el comando de variables y, si se puede, repetir el setup en limpio y actualizar la línea de verificación.
- Si una sección crece demasiado, moverla a `docs/` y dejar un enlace.
