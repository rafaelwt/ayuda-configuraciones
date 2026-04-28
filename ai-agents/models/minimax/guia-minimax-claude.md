# Guia de configuracion: MiniMax M2.7 en Claude Code

## Objetivo
Configurar Claude Code para usar el modelo MiniMax-M2.7 en lugar de Claude oficial.

---

# Seccion Linux

## 1. Verificar variables de entorno

printenv | grep ANTHROPIC

Si existen:

unset ANTHROPIC_AUTH_TOKEN
unset ANTHROPIC_BASE_URL

---

## 2. Verificar carpeta de configuracion existente

ls -la ~/.claude

---

## 3. Editar configuracion

nano ~/.claude/settings.json

---

## 4. Configuracion MiniMax
```json
{
  "alwaysThinkingEnabled": false,
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.minimax.io/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "TU_API_KEY_MINIMAX",
    "API_TIMEOUT_MS": "3000000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "ANTHROPIC_MODEL": "MiniMax-M2.7",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "MiniMax-M2.7",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "MiniMax-M2.7",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "MiniMax-M2.7"
  }
}
```

---

## 5. Guardar archivo

CTRL + O
ENTER
CTRL + X

---

## 6. Ejecutar Claude Code

claude

Aceptar acceso:

claude-trust

---

## 7. Verificar configuracion

/status
/model

Resultado esperado:

ANTHROPIC_BASE_URL: https://api.minimax.io/anthropic
Model: MiniMax-M2.7

---

# Seccion Windows (PowerShell)

## 1. Verificar variables de entorno

Get-ChildItem Env:ANTHROPIC*

---

## 2. Eliminar variables si existen

Remove-Item Env:ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue
Remove-Item Env:ANTHROPIC_BASE_URL -ErrorAction SilentlyContinue

---

## 3. Verificar carpeta de configuracion

dir $HOME\.claude

---

## 4. Editar configuracion

notepad $HOME\.claude\settings.json

---

## 5. Configuracion MiniMax
```json
{
  "alwaysThinkingEnabled": false,
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.minimax.io/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "TU_API_KEY_MINIMAX",
    "API_TIMEOUT_MS": "3000000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "ANTHROPIC_MODEL": "MiniMax-M2.7",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "MiniMax-M2.7",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "MiniMax-M2.7",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "MiniMax-M2.7"
  }
}
```
---

## 6. Ejecutar Claude Code

claude

Aceptar acceso:

claude-trust

---

## 7. Verificar configuracion

/status
/model

Resultado esperado:

ANTHROPIC_BASE_URL: https://api.minimax.io/anthropic
Model: MiniMax-M2.7

---

# Volver a Claude oficial (Linux y Windows)

Editar settings.json y dejar:
```json
{
  "alwaysThinkingEnabled": false
}
```
---

# Notas

- /model no cambia el proveedor
- El proveedor se define por ANTHROPIC_BASE_URL
- MiniMax usa compatibilidad con la API de Anthropic
- Puede haber diferencias respecto a Claude oficial