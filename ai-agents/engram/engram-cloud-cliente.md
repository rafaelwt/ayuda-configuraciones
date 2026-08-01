# Engram Cloud — Conectar una PC

Conectar cualquier máquina (Linux, macOS, Windows 11) a tu servidor Engram Cloud.

**Datos que necesitás a mano:**

- URL del servidor: `https://tu-dominio.com`
- El `ENGRAM_CLOUD_TOKEN` del `.env` del VPS (es **el mismo para todas las máquinas**, no se genera uno por PC)

---

## 1. Instalar engram

Seguí las instrucciones del proyecto para tu sistema. Verificá:

```
engram version
```

## 2. Configurar el servidor

Igual en los tres sistemas:

```
engram cloud config --server https://tu-dominio.com
```

## 3. Guardar el token

Esta parte cambia según el shell.

### Linux / macOS — fish

```fish
echo 'set -x ENGRAM_CLOUD_TOKEN <token>' > ~/.engram-env.fish
chmod 600 ~/.engram-env.fish
echo 'test -f ~/.engram-env.fish; and source ~/.engram-env.fish' >> ~/.config/fish/config.fish
source ~/.engram-env.fish
```

### macOS / Linux — zsh o bash

```bash
echo 'export ENGRAM_CLOUD_TOKEN=<token>' > ~/.engram-env
chmod 600 ~/.engram-env
echo '[ -f ~/.engram-env ] && source ~/.engram-env' >> ~/.zshrc   # o ~/.bashrc
source ~/.engram-env
```

En macOS el shell por defecto es zsh. Si no sabés cuál usás: `echo $SHELL`.

### Windows 11 — PowerShell

Persistente a nivel usuario:

```powershell
[Environment]::SetEnvironmentVariable('ENGRAM_CLOUD_TOKEN', '<token>', 'User')
```

Cerrá y abrí PowerShell para que tome efecto. Verificá:

```powershell
$env:ENGRAM_CLOUD_TOKEN.Substring(0,12)
```

> Solo para la sesión actual: `$env:ENGRAM_CLOUD_TOKEN = "<token>"`

### Verificar

```
engram cloud status
```

Tiene que decir `configured` y `Auth status: ready`.

## 4. Enrolar el proyecto

```
engram cloud enroll <nombre-del-proyecto>
```

Para ver los nombres exactos de tus proyectos locales:

```
engram projects list
```

## 5. Sincronizar

**PC con las memorias (subir):**

```
engram sync --cloud --project <nombre>
```

**PC nueva o vacía (bajar):**

```
engram sync --cloud --status --project <nombre>
engram sync --cloud --import --project <nombre>
```

Verificar en cualquier momento:

```
engram sync --cloud --status --project <nombre>
```

`Local chunks` y `Remote chunks` iguales con `Pending import: 0` = todo al día.

---

## Cuidados de sintaxis

**Un comando por línea.** Si pegás dos comandos juntos sin salto de línea, se concatenan y creás proyectos fantasma. Ejemplo real:

```
engram cloud enroll mi-proyectoexport ENGRAM_CLOUD_TOKEN=abc...
→ enrola un proyecto llamado "mi-proyectoexport" y el token nunca se carga
```

**fish no usa `export`.** Es `set -x VAR valor`. Y `${VAR:0:12}` no existe en fish; usá `echo $VAR | cut -c1-12`.

**PowerShell no usa `export` ni `set -x`.** Es `$env:VAR = "valor"`.

---

## Trabajar en varias PCs

El sync **no es en tiempo real**. Cada máquina sube y baja cuando vos se lo pedís.

Rutina recomendada:

```
engram sync --cloud --import --project <nombre>    # al empezar
...trabajás...
engram sync --cloud --project <nombre>             # al terminar
```

Si te olvidás y las historias divergen:

```
engram conflicts list --project <nombre>
engram conflicts stats --project <nombre>
```

**El nombre del proyecto debe coincidir exacto entre máquinas.** Engram lo detecta por el directorio de trabajo, así que si la carpeta se llama distinto en otra PC, vas a crear un proyecto separado. Pasá siempre `--project <nombre>` explícito para evitarlo.

---

## Agregar otro proyecto

Con `ENGRAM_CLOUD_ALLOWED_PROJECTS=*` en el servidor, no se toca el VPS:

```
engram cloud enroll <otro-proyecto>
engram sync --cloud --project <otro-proyecto>
```

Si el servidor usa lista explícita, primero hay que agregarlo al `.env` del VPS y hacer `docker compose up -d --force-recreate cloud`.

---

## Errores comunes

| Código | Causa | Solución |
|---|---|---|
| `blocked_unenrolled` | Falta el enroll | `engram cloud enroll <nombre>` |
| `auth_required` | Token ausente o desactualizado | Revisá la variable de entorno contra el `.env` del VPS |
| `cloud_config_error` | Endpoint mal configurado | `engram cloud config --server https://...` |
| `policy_forbidden` | Proyecto fuera del allowlist | Revisá `ENGRAM_CLOUD_ALLOWED_PROJECTS` en el VPS |
| `paused` | Sync pausado desde el dashboard | Reactivalo en el panel |
| `transport_failed` | Red / proxy | Probá `curl -I https://tu-dominio.com/dashboard/login` |

Casi siempre `blocked_unenrolled` es un nombre de proyecto mal escrito. Verificá con `engram projects list`.

---

## Limpieza de proyectos duplicados

Engram detecta proyectos por directorio, así que aparecen variantes (`mi-proyecto` y `mi-proyecto-`).

```
engram projects list
engram projects consolidate --all --dry-run    # preview, no toca nada
engram projects consolidate --all              # fusiona
engram delete project <nombre> --hard          # borrar uno que no sirve
```

Hacelo **antes** de sincronizar, así no subís basura.
