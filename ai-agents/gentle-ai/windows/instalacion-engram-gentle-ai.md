# Guía de instalación: Engram + gentle-ai en Windows 11

Probada el 30-10-2026 con Go 1.27.0, Engram 3.6.0, gentle-ai 4.1.1 y jq 1.8.2.

## Antes de empezar

**Orden:** primero **Engram**, después **gentle-ai**. gentle-ai trae Engram como componente: si no lo encuentra, descarga un binario sin firmar que a veces el antivirus bloquea. Si Engram ya está instalado desde el código fuente, se evita ese problema.

| Programa | Para qué sirve |
| --- | --- |
| Go | Compila Engram y gentle-ai |
| jq | Lo necesita el plugin de Engram para Claude Code |
| Engram | Memoria persistente para Claude Code |
| gentle-ai | Añade a Claude Code skills, agentes, persona, tema, permisos, Context7, Engram y GGA (revisor de commits) |

**Requisito:** Claude Code tiene que estar instalado y funcionando. gentle-ai no lo instala.

**Cómo abrir PowerShell:** pulsa la tecla Windows, escribe `PowerShell` y pulsa Enter. No hace falta abrirlo como administrador.

> **Regla de oro:** cada recuadro es **UN solo comando**. Cópialo, pégalo, pulsa Enter y **espera a que termine** antes de pasar al siguiente. Nunca pegues varios recuadros a la vez.

> **Aviso:** gentle-ai **sobrescribe las skills que tengan el mismo nombre** que las suyas. Por ejemplo, reemplaza tu `skill-creator`. El Paso 0 guarda una copia para poder recuperarlas.

---

## Paso 0. Copia de seguridad (no te lo saltes)

Este paso es lo que permite dejar todo como estaba al desinstalar.

Crea la carpeta del respaldo:

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\respaldo-gentle-ai"
```

Copia los ajustes de Claude Code (incluyen tus permisos):

```powershell
Copy-Item "$env:USERPROFILE\.claude\settings.json" "$env:USERPROFILE\respaldo-gentle-ai\settings.json"
```

Copia la configuración general de Claude Code:

```powershell
Copy-Item "$env:USERPROFILE\.claude.json" "$env:USERPROFILE\respaldo-gentle-ai\claude.json"
```

Copia tu CLAUDE.md global, si tienes uno (si no existe, el comando no hace nada):

```powershell
if (Test-Path "$env:USERPROFILE\.claude\CLAUDE.md") { Copy-Item "$env:USERPROFILE\.claude\CLAUDE.md" "$env:USERPROFILE\respaldo-gentle-ai\CLAUDE.md" }
```

Copia tus skills completas:

```powershell
if (Test-Path "$env:USERPROFILE\.claude\skills") { Copy-Item "$env:USERPROFILE\.claude\skills" "$env:USERPROFILE\respaldo-gentle-ai\skills" -Recurse }
```

Guarda la lista de carpetas que hay en `.claude`:

```powershell
Get-ChildItem "$env:USERPROFILE\.claude" -Name | Out-File "$env:USERPROFILE\respaldo-gentle-ai\carpetas.txt"
```

Guarda la lista de plugins:

```powershell
claude plugin list | Out-File "$env:USERPROFILE\respaldo-gentle-ai\plugins.txt"
```

Guarda la lista de servidores MCP:

```powershell
claude mcp list | Out-File "$env:USERPROFILE\respaldo-gentle-ai\mcp.txt"
```

Guarda tu PATH (la lista de carpetas donde Windows busca programas):

```powershell
[Environment]::GetEnvironmentVariable("Path","User") | Out-File "$env:USERPROFILE\respaldo-gentle-ai\path.txt"
```

Anota si ya existía la carpeta `bin` de tu usuario (GGA se instala ahí):

```powershell
Test-Path "$env:USERPROFILE\bin" | Out-File "$env:USERPROFILE\respaldo-gentle-ai\bin-existia.txt"
```

Copia la configuración de OpenCode, si lo usas. gentle-ai también la toca:

```powershell
if (Test-Path "$env:USERPROFILE\.config\opencode\opencode.json") { Copy-Item "$env:USERPROFILE\.config\opencode\opencode.json" "$env:USERPROFILE\respaldo-gentle-ai\opencode.json" }
```

Copia la configuración de Pi, si lo usas:

```powershell
if (Test-Path "$env:USERPROFILE\.pi\agent\settings.json") { Copy-Item "$env:USERPROFILE\.pi\agent\settings.json" "$env:USERPROFILE\respaldo-gentle-ai\pi-settings.json" }
```

Copia la configuración de Codex, si lo usas:

```powershell
if (Test-Path "$env:USERPROFILE\.codex\config.toml") { Copy-Item "$env:USERPROFILE\.codex\config.toml" "$env:USERPROFILE\respaldo-gentle-ai\codex-config.toml" }
```

---

## Paso 1. Instalar Go

Instala Go. Windows pedirá permiso de administrador: pulsa **Sí**.

```powershell
winget install --id GoLang.Go -e --accept-source-agreements --accept-package-agreements
```

**Cierra PowerShell y ábrelo de nuevo.** El instalador ya añade Go al PATH, pero PowerShell solo lo ve al reabrirlo.

Comprueba la versión. Debe ser `go1.25.10` o mayor:

```powershell
go version
```

## Paso 2. Instalar jq

Instala jq. Engram lo necesita para conectarse con Claude Code:

```powershell
winget install --id jqlang.jq -e --accept-source-agreements --accept-package-agreements
```

**Cierra PowerShell y ábrelo de nuevo.** Después comprueba:

```powershell
jq --version
```

`curl` no hace falta instalarlo: Windows 11 ya lo trae.

## Paso 3. Instalar Engram

Descarga y compila Engram. Tarda 1 o 2 minutos y muestra muchas líneas `go: downloading`, lo cual es normal:

```powershell
go install github.com/Gentleman-Programming/engram/v3/cmd/engram@latest
```

Comprueba que funciona:

```powershell
engram version
```

## Paso 4. Conectar Engram con Claude Code

Instala el plugin y el servidor MCP de Engram en Claude Code:

```powershell
engram setup claude-code
```

Cuando pregunte **`Add to allowlist? (y/N)`**, escribe `y` y pulsa Enter. Así Claude Code no pedirá permiso cada vez que use Engram.

## Paso 5. Instalar gentle-ai

Descarga y compila gentle-ai:

```powershell
go install github.com/gentleman-programming/gentle-ai/v4/cmd/gentle-ai@v4.1.1
```

Comprueba que funciona:

```powershell
gentle-ai version
```

## Paso 6. Configurar gentle-ai

**Opción A (recomendada): asistente visual.** Con las flechas y Enter elige **Claude Code** como agente, marca **Engram** entre los componentes y elige una persona:

```powershell
gentle-ai
```

**Opción B: sin asistente.** Primero mira qué cambiaría, sin tocar nada:

```powershell
gentle-ai install --agents claude-code --preset full-gentleman --dry-run
```

Si te parece bien, aplícalo:

```powershell
gentle-ai install --agents claude-code --preset full-gentleman
```

El preset `full-gentleman` instala esto:

- `CLAUDE.md` global (unos 77 KB de instrucciones)
- carpeta `.claude\agents`, carpeta `.claude\output-styles` y temas
- 8 skills
- un hook en `settings.json`
- **GGA** en `%USERPROFILE%\bin` (lo añade al PATH) y `%APPDATA%\gga`

Al terminar debe decir `Verification checks: 25 passed, 0 failed`. Si vuelve a preguntar `Add to allowlist? (y/N)`, responde `y`.

## Paso 7. Verificar

Revisa que gentle-ai está sano. Debe terminar en `Status: healthy`:

```powershell
gentle-ai doctor
```

Comprueba el servidor de Engram. Debe aparecer `engram: ... ✔ Connected`:

```powershell
claude mcp list
```

Comprueba el plugin. Debe aparecer `engram@engram` con `✔ enabled`:

```powershell
claude plugin list
```

Por último, **cierra Claude Code y ábrelo de nuevo** para que cargue todo.

**No borres la carpeta `respaldo-gentle-ai`.** La necesitarás para desinstalar.

---

## Actualizar Engram y gentle-ai

Esta sección **no se probó** en este equipo: los programas ya estaban desinstalados cuando se escribió. Se basa en la [documentación de gentle-ai](https://github.com/Gentleman-Programming/gentle-ai/blob/main/docs/usage.md) y en la [de Engram](https://github.com/Gentleman-Programming/engram).

**Orden:** igual que al instalar, primero **Engram** y después **gentle-ai**.

> **¿Por qué no usar `gentle-ai upgrade`?** Ese comando descarga binarios precompilados y reemplaza los actuales. El de Engram no está firmado y el antivirus puede bloquearlo. Si actualizas con `go install`, sigues usando el mismo método con el que instalaste.

**Cierra Claude Code** antes de empezar y abre PowerShell.

### 1. Ver si hay versiones nuevas

Mira qué versión de Engram tienes:

```powershell
engram version
```

Mira si hay una versión nueva de gentle-ai. Este comando solo informa, no instala nada:

```powershell
gentle-ai update
```

Las versiones nuevas de Engram salen en [sus releases](https://github.com/Gentleman-Programming/engram/releases).

### 2. Copia de seguridad rápida

Al actualizar, gentle-ai vuelve a escribir sus skills y ajustes. Guarda antes tus ajustes:

```powershell
Copy-Item "$env:USERPROFILE\.claude\settings.json" "$env:USERPROFILE\respaldo-gentle-ai\settings-antes-de-actualizar.json" -Force
```

### 3. Actualizar Engram

Descarga y compila la última versión de Engram:

```powershell
go install github.com/Gentleman-Programming/engram/v3/cmd/engram@latest
```

Comprueba la versión nueva:

```powershell
engram version
```

Actualiza el plugin de Engram en Claude Code. Si pregunta `Add to allowlist? (y/N)`, responde `y`:

```powershell
engram setup claude-code
```

### 4. Actualizar gentle-ai

Descarga y compila la última versión de gentle-ai. Aquí se usa `@latest`, no una versión fija:

```powershell
go install github.com/gentleman-programming/gentle-ai/v4/cmd/gentle-ai@latest
```

Comprueba la versión nueva:

```powershell
gentle-ai version
```

Mira qué cambiaría en Claude Code, sin tocar nada:

```powershell
gentle-ai sync --agents claude-code --dry-run
```

Aplica los cambios: skills, agentes e instrucciones pasan a la versión nueva. La documentación dice que este paso es obligatorio después de cada actualización:

```powershell
gentle-ai sync --agents claude-code
```

### 5. Verificar

Revisa que todo está sano. Debe terminar en `Status: healthy`:

```powershell
gentle-ai doctor
```

Comprueba que Engram sigue conectado:

```powershell
claude mcp list
```

Abre Claude Code de nuevo para que cargue la versión nueva.

**Si algo falla después de actualizar:** gentle-ai guarda una copia antes de cada cambio. Para ver las copias:

```powershell
gentle-ai restore --list
```

Para volver a la última copia:

```powershell
gentle-ai restore latest
```

---

## Problemas comunes

| Lo que ves | Qué hacer |
| --- | --- |
| `"go" / "jq" / "engram" no se reconoce...` | Cierra y abre PowerShell |
| `the Claude Code plugin requires jq in PATH` | Te saltaste el Paso 2 |
| `requires go >= 1.25.10` | `winget upgrade --id GoLang.Go -e` |
| El antivirus o Smart App Control bloquea `engram.exe` | No desactives la protección. Revísalo en Seguridad de Windows |
| `go install` parece quieto | Está compilando. Espera hasta 5 minutos |
| Claude Code no muestra Engram | Ciérralo del todo y ábrelo de nuevo |

Fuentes: [gentle-ai](https://github.com/Gentleman-Programming/gentle-ai) · [CLI de gentle-ai](https://github.com/Gentleman-Programming/gentle-ai/blob/main/docs/usage.md) · [Engram](https://github.com/Gentleman-Programming/engram) · [Instalación de Engram](https://github.com/Gentleman-Programming/engram/blob/main/docs/INSTALLATION.md)
