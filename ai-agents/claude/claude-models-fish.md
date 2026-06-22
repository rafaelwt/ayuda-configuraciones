# Claude Code con modelos custom en Fish

Un wrapper por modelo (`claude-deepseek`, `claude-kimi`, ...) que usa ese proveedor, sin tocar tu `claude` normal.
Para agregar otro modelo más adelante, pegas un bloque nuevo debajo con otro nombre.

---

## 1. Crear el archivo de wrappers

```fish
mkdir -p ~/.config/fish/functions
nano ~/.config/fish/functions/claude-models.fish
```

Pega los bloques que quieras (reemplaza cada `TU_API_KEY_...` por tu clave real).

**DeepSeek:**

```fish
function claude-deepseek
    set -lx ANTHROPIC_BASE_URL https://api.deepseek.com/anthropic
    set -lx ANTHROPIC_AUTH_TOKEN "TU_API_KEY_DEEPSEEK"
    set -lx ANTHROPIC_MODEL "deepseek-v4-pro[1m]"
    set -lx ANTHROPIC_DEFAULT_OPUS_MODEL "deepseek-v4-pro[1m]"
    set -lx ANTHROPIC_DEFAULT_SONNET_MODEL "deepseek-v4-pro[1m]"
    set -lx ANTHROPIC_DEFAULT_HAIKU_MODEL "deepseek-v4-flash"
    set -lx CLAUDE_CODE_SUBAGENT_MODEL "deepseek-v4-flash"
    set -lx CLAUDE_CODE_EFFORT_LEVEL max

    command claude $argv
end
```

**Kimi:**

```fish
function claude-kimi
    set -lx ANTHROPIC_BASE_URL https://api.moonshot.ai/anthropic
    set -lx ANTHROPIC_AUTH_TOKEN "TU_API_KEY_MOONSHOT"
    set -lx ANTHROPIC_MODEL kimi-k2.7-code
    set -lx ANTHROPIC_DEFAULT_OPUS_MODEL kimi-k2.7-code
    set -lx ANTHROPIC_DEFAULT_SONNET_MODEL kimi-k2.7-code
    set -lx ANTHROPIC_DEFAULT_HAIKU_MODEL kimi-k2.7-code
    set -lx CLAUDE_CODE_SUBAGENT_MODEL kimi-k2.7-code
    set -lx ENABLE_TOOL_SEARCH false
    set -lx CLAUDE_CODE_AUTO_COMPACT_WINDOW 262144

    command claude $argv
end
```

Guarda en nano: `Ctrl+O`, `Enter`, `Ctrl+X`.

`set -lx` = variable **local** a la función y **exportada** al proceso hijo. Solo existe mientras corre ese wrapper; tu `claude` normal no se ve afectado.

> No subas ni compartas este archivo: contiene tus API keys.

---

## 2. Cargar las funciones

Abre una terminal nueva, o:

```fish
source ~/.config/fish/functions/claude-models.fish
```

Verifica:

```fish
type claude-deepseek
type claude-kimi
```

---

## 3. Uso

```fish
cd /ruta/de/tu/proyecto
claude-deepseek            # usa DeepSeek
claude-kimi                # usa Kimi
claude                     # tu Claude normal, sin cambios
```

---

## 4. Revertir

Borra el bloque que quieras del archivo y abre una terminal nueva.
Para quitar una función solo de la sesión actual:

```fish
functions -e claude-kimi
```

---

## Notas

- No instala ningún modelo localmente; Claude Code sigue siendo el cliente.
- El proveedor entrega el modelo vía API compatible con Anthropic.
- `command claude` fuerza el binario real, evitando choques con alias o funciones llamadas `claude`.
