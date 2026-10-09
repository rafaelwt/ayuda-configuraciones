# SonarQube local con Docker + MCP para agentes

Servidor SonarQube Community Build en Docker, scanner por proyecto y servidor MCP para que Claude Code (u otro agente) consulte issues, métricas y quality gates. Esta guía documenta una instalación real y funcional; sirve tanto para reproducirla como para que un agente configure un proyecto nuevo contra un servidor ya existente.

> **Si sos un agente y el servidor ya está corriendo**, saltá directo a [Configurar un proyecto nuevo](#configurar-un-proyecto-nuevo). Estado del servidor: `curl -s http://127.0.0.1:9100/api/system/status`.

## Arquitectura

| Pieza | Qué hace | Dónde corre | Credencial |
|---|---|---|---|
| **Servidor** (`server/`) | Almacena y muestra resultados | Docker, `127.0.0.1:9100` | admin (web) |
| **Scanner** | Lee el código y publica el análisis | En la carpeta del proyecto | token de análisis **por proyecto** |
| **MCP** (`mcp/`) | Expone el servidor a agentes de IA (solo lectura y triage) | Docker, `127.0.0.1:9101` | token de **usuario** vía header |

El servidor nunca accede a las carpetas de los proyectos. El scanner va al código y manda el reporte por HTTP. El MCP **no escanea**: consulta.

## Quick path (instalación desde cero)

1. Servidor:
   ```bash
   mkdir -p ~/docker/sonarqube && cp server/compose.yml server/.env.example ~/docker/sonarqube/
   cd ~/docker/sonarqube && mv .env.example .env && chmod 600 .env
   # editar .env: puerto libre y POSTGRES_PASSWORD aleatorio
   docker compose up -d
   ```
   Esperar `"status":"UP"` en `http://127.0.0.1:9100/api/system/status` (1 a 2 minutos). Entrar con `admin / admin` y cambiar la contraseña.
2. Tokens (ver [Tokens](#tokens)): un token de usuario y uno de análisis por proyecto. Guardarlos en `~/docker/sonarqube/.tokens` con permisos `600`.
3. MCP:
   ```bash
   mkdir -p ~/docker/sonarqube-mcp && cp mcp/compose.yml ~/docker/sonarqube-mcp/
   cd ~/docker/sonarqube-mcp && docker compose up -d
   ```
4. Registrar el MCP en Claude Code, global para el usuario:
   ```bash
   claude mcp add --transport http --scope user sonarqube http://localhost:9101/mcp \
     --header "Authorization: Bearer <SONAR_USER_TOKEN>"
   claude mcp list   # debe figurar sonarqube conectado
   ```
5. Configurar cada proyecto (siguiente sección).

## Configurar un proyecto nuevo

### 1. Crear el proyecto y su token en el servidor

Por web (`Projects → Create`) o por API con el token de usuario:

```bash
B=http://127.0.0.1:9100; UT=<SONAR_USER_TOKEN>
curl -s -u "$UT:" -X POST "$B/api/projects/create" -d project=<key> -d name='<Nombre>' -d mainBranch=main
curl -s -u "$UT:" -X POST "$B/api/user_tokens/generate" -d name=<key>-analysis -d type=PROJECT_ANALYSIS_TOKEN -d projectKey=<key>
```

El token se muestra **una sola vez**. Agregarlo a `~/docker/sonarqube/.tokens` como `SONAR_TOKEN_<KEY>=...`.

### 2. Elegir el scanner según el build del proyecto

| Proyecto | Scanner | Comando |
|---|---|---|
| Node / TypeScript (NestJS, Angular, React…) | SonarScanner for npm | `pnpm dlx @sonar/scan` (o `npx @sonar/scan`) |
| Maven | plugin incluido | `mvn sonar:sonar` |
| Gradle | plugin incluido | `gradle sonar` |
| .NET | `dotnet-sonarscanner` | el CLI genérico **no** analiza C# |
| PHP, Go, Python, mixto | SonarScanner CLI | imagen `sonarsource/sonar-scanner-cli` montando el repo en `/usr/src` |

No instalar el scanner desde el AUR: va atrasado y la documentación oficial no lo menciona.

### 3. `sonar-project.properties` en la raíz del repo

Plantilla para Node/TS con specs colocados junto al código:

```properties
sonar.projectKey=<key>
sonar.projectName=<Nombre>

sonar.sources=src
sonar.tests=src
sonar.test.inclusions=**/*.spec.ts
sonar.exclusions=**/node_modules/**,dist/**,coverage/**,**/*.d.ts

sonar.typescript.tsconfigPaths=tsconfig.json
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.coverage.exclusions=src/main.ts

sonar.sourceEncoding=UTF-8
```

Ajustes por framework:

- **Angular**: `sonar.typescript.tsconfigPaths=tsconfig.app.json,tsconfig.spec.json`, lcov en `coverage/<nombre-proyecto-angular>/lcov.info`, excluir `src/environments/**`.
- **NestJS con carpeta `test/` de e2e**: `sonar.tests=src,test` y agregar `test/**` a `sonar.test.inclusions`.

### 4. Cobertura en formato lcov

Sonar solo lee `lcov`. Sin esto reporta 0 % aunque haya tests.

- **Vitest**: en `vitest.config.ts`
  ```ts
  coverage: { provider: 'v8', reporter: ['text', 'lcov'], include: ['src/**/*.ts'], exclude: ['src/**/*.spec.ts', 'src/main.ts'] }
  ```
  Requiere `@vitest/coverage-v8` **en la misma versión que `vitest`** (`pnpm ls vitest`). Una versión distinta produce un reporte vacío sin error.
- **Angular (`@angular/build:unit-test`)**: script en `package.json`
  ```json
  "test:cov": "ng test --coverage --coverage-reporters=lcov --coverage-reporters=text-summary"
  ```
  Los flags de array van con `=`; la forma con espacios falla con `Unknown arguments`.
- **Jest**: `coverageReporters: ['text', 'lcov']`.

### 5. Ejecutar el análisis

Desde la raíz del proyecto, en dos pasos:

```bash
set -a; source ~/docker/sonarqube/.tokens; set +a     # fish: ver abajo
pnpm test:cov
pnpm dlx @sonar/scan -Dsonar.host.url=http://127.0.0.1:9100 -Dsonar.token=$SONAR_TOKEN_<KEY>
```

```fish
for l in (cat ~/docker/sonarqube/.tokens); set -gx (string split -m1 = $l); end
```

Termina con `ANALYSIS SUCCESSFUL` y la URL del dashboard. Agregar `.scannerwork/` al `.gitignore`.

### Checklist

- [ ] Proyecto creado en el servidor y token de análisis guardado en `.tokens`
- [ ] `sonar-project.properties` versionado en la raíz
- [ ] Specs declarados como tests (`sonar.test.inclusions`)
- [ ] Cobertura en lcov generada y ruta correcta en `sonar.javascript.lcov.reportPaths`
- [ ] `.scannerwork/` y `coverage/` ignorados en git
- [ ] Scan termina en `ANALYSIS SUCCESSFUL` y el dashboard muestra cobertura distinta de 0 %

## Tokens

| Tipo | Para qué | Dónde se usa |
|---|---|---|
| **User Token** | leer la API, MCP | header `Authorization: Bearer` |
| **Project Analysis Token** | publicar análisis de **un** proyecto | `-Dsonar.token` del scanner |

Crear o revocar: `http://127.0.0.1:9100/account/security`. Nunca van dentro de un repositorio. Para el scope `project` de Claude Code usar `'Authorization: Bearer ${SONAR_USER_TOKEN}'` con comillas simples, y la variable en la shell de cada integrante.

## MCP: qué puede y qué no

Puede: buscar issues por proyecto, severidad y estado; leer métricas y quality gate; mostrar reglas; marcar issues como falso positivo o aceptado; listar hotspots.
No puede: ejecutar un scan. Para re-analizar después de corregir, correr el scanner (paso 5) y luego verificar con el MCP.

Scopes de `claude mcp add`: `local` (default, solo esa carpeta), `project` (`.mcp.json` versionado, para el equipo), `user` (todos los proyectos del usuario, recomendado aquí).

## Decisiones de esta instalación

| Decisión | Por qué |
|---|---|
| Postgres propio sin `ports:` | aislado en la red `sonarnet`; nadie más lo alcanza |
| Puerto `127.0.0.1:9100` | 9000 estaba ocupado; solo local |
| Tag de imagen fijo, no `latest` | las actualizaciones migran la base de datos; se eligen a mano |
| MCP en compose aparte, red externa `sonarqube_sonarnet` | habla con el servidor por `http://sonarqube:9000`; mismo patrón que otros MCP |
| MCP sin token en el compose | en modo HTTP el token va en el header del cliente (`SONARQUBE_TOKEN` está deprecado para HTTP) |
| No se usa la guía "try out" de la doc | usa base H2 embebida sin volúmenes; se pierde todo |
| SonarQube CLI (`sonar`) descartado | orientado a Cloud/pago; sin soporte documentado para Community Build |

## Problemas conocidos

| Síntoma | Causa | Solución |
|---|---|---|
| `MissingObjectException: Missing blob` en SCM Publisher | `multi-pack-index` generado por `git maintenance`; JGit lo lee mal | `git repack -a -d` y borrar `.git/objects/pack/multi-pack-index` (en submódulos, bajo `.git/modules/<nombre>/`) |
| Cobertura `0/0` o `Unknown%` | `@vitest/coverage-v8` en versión distinta a `vitest` | instalar la versión exacta que muestra `pnpm ls vitest` |
| `Unknown arguments: coverage` en `ng test` | flags de array sin `=` | `--coverage-reporters=lcov` |
| `Could not resolve 1 file paths ... environment.ts` | archivo excluido en `sonar.exclusions` pero presente en el lcov | esperado; o excluirlo también en la config de cobertura |
| `fd` no encuentra `lcov.info` | `coverage/` está en `.gitignore` y `fd` lo respeta | `fd -I lcov.info` |
| MCP responde `000` justo después de `up -d` | contenedor aún arrancando | esperar unos segundos; `401` sin token y `200` con token es lo correcto |
| Quality gate `OK` sin condiciones en el primer scan | el gate "Sonar way" evalúa código nuevo y aún no hay línea base | normal; evalúa desde el segundo análisis |

## Referencias

- Instalación Docker: https://docs.sonarsource.com/sonarqube-community-build/server-installation/from-docker-image/set-up-and-start-container
- SonarScanner for npm: https://docs.sonarsource.com/sonarqube-community-build/analyzing-source-code/scanners/npm/using
- Cobertura JS/TS: https://docs.sonarsource.com/sonarqube-community-build/analyzing-source-code/test-coverage/javascript-typescript-test-coverage
- MCP Server: https://docs.sonarsource.com/sonarqube-mcp-server/setup/self-hosted
