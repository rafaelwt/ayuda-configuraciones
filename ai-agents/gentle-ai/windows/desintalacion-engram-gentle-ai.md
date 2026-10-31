# Guía de desinstalación: Engram + gentle-ai en Windows 11

Deja el equipo como estaba antes de instalar, sin rastro de Engram, gentle-ai, GGA, Go ni jq. Necesitas la carpeta `respaldo-gentle-ai` que creaste en el Paso 0 de la guía de instalación.

> **Regla de oro:** cada recuadro es **UN solo comando**. Cópialo, pégalo, pulsa Enter y espera a que termine antes de pasar al siguiente.

> **Ojo:** el Paso 6 borra para siempre las memorias guardadas por Engram.

Si un comando de borrar responde "not found", "No MCP server" o "no existe", **no es un error**: significa que eso ya no estaba.

## Lo que aprendimos al probarlo (léelo)

Al probar esta guía, `gentle-ai uninstall --all` hizo tres cosas peligrosas:

1. Modificó la configuración de **otros programas** (OpenCode, Pi), aunque solo se había instalado para Claude Code. Les borró ajustes que eran del usuario.
2. **Borró todos los permisos** de `settings.json` de Claude Code, no solo los que había añadido.
3. Borró la skill `skill-creator` **entera**, aunque era del usuario y existía antes.

Por eso esta guía **nunca usa `--all`** y **restaura todo desde tu respaldo**, sin confiar solo en el desinstalador.

---

## Paso 1. Preparar

**Cierra Claude Code** (todas sus ventanas) y abre PowerShell.

Comprueba que tu respaldo existe. Debe responder `True`:

```powershell
Test-Path "$env:USERPROFILE\respaldo-gentle-ai\settings.json"
```

Si responde `False`, **detente**: sin respaldo no se puede garantizar que todo quede como antes.

## Paso 2. Desinstalar gentle-ai de Claude Code

Quita lo que gentle-ai puso **solo en Claude Code**. Primero enseña lo que va a quitar y pide confirmación:

```powershell
gentle-ai uninstall --agent claude-code
```

Este comando con `--agent claude-code` no se probó: la prueba usó `--all`. Por eso los pasos siguientes restauran todo desde el respaldo, haga lo que haga el desinstalador.

## Paso 3. Quitar Engram de Claude Code

Quita el plugin de Engram:

```powershell
claude plugin uninstall engram@engram
```

Quita la tienda de plugins de Engram:

```powershell
claude plugin marketplace remove engram
```

Quita el servidor MCP de Engram (si dice "No MCP server", ya estaba quitado):

```powershell
claude mcp remove engram -s user
```

Borra la caché del plugin:

```powershell
Remove-Item "$env:USERPROFILE\.claude\plugins\cache\engram" -Recurse -Force -ErrorAction SilentlyContinue
```

## Paso 4. Restaurar tu configuración de Claude Code

Recupera tus ajustes originales, incluidos tus permisos:

```powershell
Copy-Item "$env:USERPROFILE\respaldo-gentle-ai\settings.json" "$env:USERPROFILE\.claude\settings.json" -Force
```

Borra las skills actuales, que mezclan las tuyas con las de gentle-ai:

```powershell
Remove-Item "$env:USERPROFILE\.claude\skills" -Recurse -Force -ErrorAction SilentlyContinue
```

Recupera tus skills originales, si tenías:

```powershell
if (Test-Path "$env:USERPROFILE\respaldo-gentle-ai\skills") { Copy-Item "$env:USERPROFILE\respaldo-gentle-ai\skills" "$env:USERPROFILE\.claude\skills" -Recurse }
```

Recupera tu CLAUDE.md original, o bórralo si antes no tenías:

```powershell
if (Test-Path "$env:USERPROFILE\respaldo-gentle-ai\CLAUDE.md") { Copy-Item "$env:USERPROFILE\respaldo-gentle-ai\CLAUDE.md" "$env:USERPROFILE\.claude\CLAUDE.md" -Force } else { Remove-Item "$env:USERPROFILE\.claude\CLAUDE.md" -Force -ErrorAction SilentlyContinue }
```

Borra las carpetas `agents`, `output-styles` y `themes`, solo si no existían antes:

```powershell
foreach ($c in 'agents','output-styles','themes') { if (-not (Select-String -Path "$env:USERPROFILE\respaldo-gentle-ai\carpetas.txt" -Pattern "^$c$" -Quiet)) { Remove-Item "$env:USERPROFILE\.claude\$c" -Recurse -Force -ErrorAction SilentlyContinue } }
```

## Paso 5. Restaurar otros programas

Si no usas OpenCode, Pi o Codex, estos comandos no hacen nada.

Recupera la configuración de OpenCode:

```powershell
if (Test-Path "$env:USERPROFILE\respaldo-gentle-ai\opencode.json") { Copy-Item "$env:USERPROFILE\respaldo-gentle-ai\opencode.json" "$env:USERPROFILE\.config\opencode\opencode.json" -Force }
```

Recupera la configuración de Pi:

```powershell
if (Test-Path "$env:USERPROFILE\respaldo-gentle-ai\pi-settings.json") { Copy-Item "$env:USERPROFILE\respaldo-gentle-ai\pi-settings.json" "$env:USERPROFILE\.pi\agent\settings.json" -Force }
```

Recupera la configuración de Codex:

```powershell
if (Test-Path "$env:USERPROFILE\respaldo-gentle-ai\codex-config.toml") { Copy-Item "$env:USERPROFILE\respaldo-gentle-ai\codex-config.toml" "$env:USERPROFILE\.codex\config.toml" -Force }
```

## Paso 6. Borrar programas y datos

Detén Engram si quedó abierto:

```powershell
Get-Process engram -ErrorAction SilentlyContinue | Stop-Process -Force
```

Borra el programa gentle-ai:

```powershell
Remove-Item "$env:USERPROFILE\go\bin\gentle-ai.exe" -Force -ErrorAction SilentlyContinue
```

Borra el programa Engram:

```powershell
Remove-Item "$env:USERPROFILE\go\bin\engram.exe" -Force -ErrorAction SilentlyContinue
```

Borra la copia de Engram que gentle-ai pudo haber descargado:

```powershell
Remove-Item "$env:LOCALAPPDATA\engram" -Recurse -Force -ErrorAction SilentlyContinue
```

Borra GGA. Si la carpeta `bin` no existía antes, la borra entera; si existía, solo quita los archivos de GGA:

```powershell
if ((Get-Content "$env:USERPROFILE\respaldo-gentle-ai\bin-existia.txt") -eq 'False') { Remove-Item "$env:USERPROFILE\bin" -Recurse -Force -ErrorAction SilentlyContinue } else { Remove-Item "$env:USERPROFILE\bin\gga*", "$env:USERPROFILE\bin\lib\gga" -Recurse -Force -ErrorAction SilentlyContinue }
```

Borra la configuración de GGA:

```powershell
Remove-Item "$env:APPDATA\gga" -Recurse -Force -ErrorAction SilentlyContinue
```

Borra las memorias de Engram:

```powershell
Remove-Item "$env:USERPROFILE\.engram" -Recurse -Force -ErrorAction SilentlyContinue
```

Borra el estado y las copias internas de gentle-ai:

```powershell
Remove-Item "$env:USERPROFILE\.gentle-ai" -Recurse -Force -ErrorAction SilentlyContinue
```

Borra los archivos temporales:

```powershell
Remove-Item "$env:TEMP\gentle-ai-*", "$env:TEMP\gentleman-guardian-angel" -Recurse -Force -ErrorAction SilentlyContinue
```

## Paso 7. Desinstalar Go y jq

Salta este paso si ya usabas Go o jq antes de la guía de instalación.

Borra los paquetes que descargó Go. Hazlo **antes** de desinstalar Go; si no, cuesta borrarlos:

```powershell
go clean -modcache
```

Borra la caché de compilación de Go:

```powershell
go clean -cache
```

Desinstala Go. Windows pedirá permiso de administrador: pulsa **Sí**.

```powershell
winget uninstall --id GoLang.Go -e
```

Desinstala jq:

```powershell
winget uninstall --id jqlang.jq -e
```

Borra la carpeta de trabajo de Go:

```powershell
Remove-Item "$env:USERPROFILE\go" -Recurse -Force -ErrorAction SilentlyContinue
```

Borra los ajustes de Go:

```powershell
Remove-Item "$env:APPDATA\go" -Recurse -Force -ErrorAction SilentlyContinue
```

Borra los restos de la caché de Go:

```powershell
Remove-Item "$env:LOCALAPPDATA\go-build" -Recurse -Force -ErrorAction SilentlyContinue
```

## Paso 8. Restaurar el PATH

El desinstalador de Go **no** quita `go\bin` del PATH, y GGA añadió `%USERPROFILE%\bin`. Este comando deja el PATH exactamente como estaba:

```powershell
[Environment]::SetEnvironmentVariable("Path", (Get-Content "$env:USERPROFILE\respaldo-gentle-ai\path.txt" -Raw).TrimEnd("`r","`n"), "User")
```

**Cierra PowerShell y ábrelo de nuevo** antes del Paso 9.

## Paso 9. Comprobar que no queda rastro

Comprueba que los programas ya no existen. **No debe aparecer nada:**

```powershell
Get-Command go, engram, gentle-ai, gga, jq -ErrorAction SilentlyContinue
```

Comprueba que las carpetas ya no existen. **Las 7 respuestas deben ser `False`:**

```powershell
Test-Path "$env:USERPROFILE\.engram", "$env:USERPROFILE\.gentle-ai", "$env:LOCALAPPDATA\engram", "$env:USERPROFILE\go", "$env:APPDATA\gga", "$env:APPDATA\go", "C:\Program Files\Go"
```

Comprueba que tus ajustes son idénticos al respaldo. **Debe responder `True`:**

```powershell
(Get-FileHash "$env:USERPROFILE\respaldo-gentle-ai\settings.json").Hash -eq (Get-FileHash "$env:USERPROFILE\.claude\settings.json").Hash
```

Compara las carpetas de `.claude` con el respaldo. **No debe aparecer nada:**

```powershell
Compare-Object (Get-Content "$env:USERPROFILE\respaldo-gentle-ai\carpetas.txt") (Get-ChildItem "$env:USERPROFILE\.claude" -Name)
```

Compara los plugins con el respaldo. **No debe aparecer nada:**

```powershell
Compare-Object (Get-Content "$env:USERPROFILE\respaldo-gentle-ai\plugins.txt") (claude plugin list)
```

Comprueba que el PATH es idéntico al original. **Debe responder `True`:**

```powershell
[Environment]::GetEnvironmentVariable("Path","User") -ceq (Get-Content "$env:USERPROFILE\respaldo-gentle-ai\path.txt" -Raw).TrimEnd("`r","`n")
```

Comprueba los servidores MCP. Deben ser los mismos de `mcp.txt`, que está en la carpeta del respaldo, y no debe aparecer `engram`:

```powershell
claude mcp list
```

## Paso 10. Borrar el respaldo

Haz esto solo cuando todo lo del Paso 9 haya salido bien:

```powershell
Remove-Item "$env:USERPROFILE\respaldo-gentle-ai" -Recurse -Force
```

Listo: el equipo queda como si Engram y gentle-ai nunca hubieran existido.
