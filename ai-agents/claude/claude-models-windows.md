# Claude Code con modelos custom en Windows 11 (PowerShell)

Un wrapper por modelo (`claude-deepseek`, `claude-kimi`, ...) que usa ese proveedor, sin tocar tu `claude` normal.
Para agregar otro modelo más adelante, pegas un bloque nuevo debajo con otro nombre.

---

## 0. Permitir scripts (una sola vez)

Para que PowerShell cargue tu perfil:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

---

## 1. Editar tu perfil

```powershell
if (!(Test-Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force }
notepad $PROFILE
```

Pega los bloques que quieras (reemplaza cada `TU_API_KEY_...` por tu clave real).

**DeepSeek:**

```powershell
function claude-deepseek {
    $env:ANTHROPIC_BASE_URL            = "https://api.deepseek.com/anthropic"
    $env:ANTHROPIC_AUTH_TOKEN          = "TU_API_KEY_DEEPSEEK"
    $env:ANTHROPIC_MODEL               = "deepseek-v4-pro[1m]"
    $env:ANTHROPIC_DEFAULT_OPUS_MODEL  = "deepseek-v4-pro[1m]"
    $env:ANTHROPIC_DEFAULT_SONNET_MODEL = "deepseek-v4-pro[1m]"
    $env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "deepseek-v4-flash"
    $env:CLAUDE_CODE_SUBAGENT_MODEL    = "deepseek-v4-flash"
    $env:CLAUDE_CODE_EFFORT_LEVEL      = "max"
    try { claude @args }
    finally {
        Remove-Item Env:ANTHROPIC_BASE_URL, Env:ANTHROPIC_AUTH_TOKEN, Env:ANTHROPIC_MODEL, `
            Env:ANTHROPIC_DEFAULT_OPUS_MODEL, Env:ANTHROPIC_DEFAULT_SONNET_MODEL, `
            Env:ANTHROPIC_DEFAULT_HAIKU_MODEL, Env:CLAUDE_CODE_SUBAGENT_MODEL, `
            Env:CLAUDE_CODE_EFFORT_LEVEL -ErrorAction SilentlyContinue
    }
}
```

**Kimi:**

Si la URL `https://api.moonshot.ai/anthropic` no funciona, usa `https://api.kimi.com/coding/`.

```powershell
function claude-kimi {
    $env:ANTHROPIC_BASE_URL              = "https://api.kimi.com/coding/"
    $env:ANTHROPIC_API_KEY               = "TU_API_KEY_KIMI"
    $env:CLAUDE_CODE_AUTO_COMPACT_WINDOW = "262144"
    try { claude @args }
    finally {
        Remove-Item Env:ANTHROPIC_BASE_URL, Env:ANTHROPIC_API_KEY, `
            Env:CLAUDE_CODE_AUTO_COMPACT_WINDOW -ErrorAction SilentlyContinue
    }
}
```

Opcionales según el modelo que quieras usar:

```powershell
    $env:ANTHROPIC_MODEL               = "kimi-k2.7-code"
    $env:ANTHROPIC_DEFAULT_OPUS_MODEL  = "kimi-k2.7-code"
    $env:ANTHROPIC_DEFAULT_SONNET_MODEL = "kimi-k2.7-code"
    $env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "kimi-k2.7-code"
    $env:CLAUDE_CODE_SUBAGENT_MODEL    = "kimi-k2.7-code"
    $env:ENABLE_TOOL_SEARCH            = "false"
```

Si agregas variables opcionales, recuerda incluirlas también en el `Remove-Item` de la función.

Guarda y cierra el Bloc de notas.

En PowerShell las variables `$env:` viven en la sesión, así que el `try/finally` las **borra al terminar** para no afectar tu `claude` normal. (`@args` reenvía los argumentos.)

> No subas ni compartas tu perfil: contiene tus API keys.

---

## 2. Cargar los cambios

Abre una ventana nueva de PowerShell, o:

```powershell
. $PROFILE
```

Verifica:

```powershell
Get-Command claude-deepseek
Get-Command claude-kimi
```

---

## 3. Uso

```powershell
cd C:\ruta\de\tu\proyecto
claude-deepseek            # usa DeepSeek
claude-kimi                # usa Kimi
claude                     # tu Claude normal, sin cambios
```

---

## 4. Revertir

Borra el bloque que quieras de tu `$PROFILE` y abre una ventana nueva.
Para quitar una función solo de la sesión actual:

```powershell
Remove-Item Function:claude-kimi
```

---

## Notas

- No instala ningún modelo localmente; Claude Code sigue siendo el cliente.
- El proveedor entrega el modelo vía API compatible con Anthropic.
- Si agregas un modelo con una variable nueva, súmala también a la lista del `Remove-Item` de ese bloque.
- Funciona en PowerShell 7 y en Windows PowerShell 5.1.
