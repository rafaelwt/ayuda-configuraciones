# Claude Code con modelos custom en macOS (zsh)

Un wrapper por modelo (`claude-deepseek`, `claude-kimi`, ...) que usa ese proveedor, sin tocar tu `claude` normal.
Para agregar otro modelo más adelante, pegas un bloque nuevo debajo con otro nombre.

El shell por defecto de macOS es **zsh**.

---

## 1. Editar tu configuración de zsh

Backup por si acaso:

```zsh
cp ~/.zshrc ~/.zshrc.bak 2>/dev/null || echo "Se creará al guardar"
```

Ábrelo:

```zsh
nano ~/.zshrc
```

Pega los bloques que quieras (reemplaza cada `TU_API_KEY_...` por tu clave real).

**DeepSeek:**

```zsh
claude-deepseek() {
  ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic" \
  ANTHROPIC_AUTH_TOKEN="TU_API_KEY_DEEPSEEK" \
  ANTHROPIC_MODEL="deepseek-v4-pro[1m]" \
  ANTHROPIC_DEFAULT_OPUS_MODEL="deepseek-v4-pro[1m]" \
  ANTHROPIC_DEFAULT_SONNET_MODEL="deepseek-v4-pro[1m]" \
  ANTHROPIC_DEFAULT_HAIKU_MODEL="deepseek-v4-flash" \
  CLAUDE_CODE_SUBAGENT_MODEL="deepseek-v4-flash" \
  CLAUDE_CODE_EFFORT_LEVEL="max" \
  command claude "$@"
}
```

**Kimi:**

```zsh
claude-kimi() {
  ANTHROPIC_BASE_URL="https://api.moonshot.ai/anthropic" \
  ANTHROPIC_AUTH_TOKEN="TU_API_KEY_MOONSHOT" \
  ANTHROPIC_MODEL="kimi-k2.7-code" \
  ANTHROPIC_DEFAULT_OPUS_MODEL="kimi-k2.7-code" \
  ANTHROPIC_DEFAULT_SONNET_MODEL="kimi-k2.7-code" \
  ANTHROPIC_DEFAULT_HAIKU_MODEL="kimi-k2.7-code" \
  CLAUDE_CODE_SUBAGENT_MODEL="kimi-k2.7-code" \
  ENABLE_TOOL_SEARCH="false" \
  CLAUDE_CODE_AUTO_COMPACT_WINDOW="262144" \
  command claude "$@"
}
```

Guarda en nano: `Ctrl+O`, `Enter`, `Ctrl+X`.

La sintaxis `VAR=valor command claude "$@"` define esas variables **solo** para esa ejecución. No quedan en tu sesión ni afectan a tu `claude` normal.

> No subas ni compartas tu `.zshrc`: contiene tus API keys.

---

## 2. Cargar los cambios

Abre una terminal nueva, o:

```zsh
source ~/.zshrc
```

Verifica:

```zsh
type claude-deepseek
type claude-kimi
```

---

## 3. Uso

```zsh
cd /ruta/de/tu/proyecto
claude-deepseek            # usa DeepSeek
claude-kimi                # usa Kimi
claude                     # tu Claude normal, sin cambios
```

---

## 4. Revertir

Borra el bloque que quieras de `~/.zshrc` y abre una terminal nueva.
Para quitar una función solo de la sesión actual:

```zsh
unset -f claude-kimi
```

---

## Notas

- No instala ningún modelo localmente; Claude Code sigue siendo el cliente.
- El proveedor entrega el modelo vía API compatible con Anthropic.
- `command claude` fuerza el binario real, evitando choques con alias o funciones llamadas `claude`.
