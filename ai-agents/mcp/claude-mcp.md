# Configuración de Claude MCP

Este documento contiene los comandos para configurar los servidores MCP (Model Context Protocol) en Claude Code y OpenCode.

## Servidores Disponibles

### Chrome DevTools

Integración con Chrome DevTools para debugging y análisis de aplicaciones web.

```bash
# Linux / macOS
claude mcp add chrome-devtools npx chrome-devtools-mcp@latest
# Windows
claude mcp add chrome-devtools cmd /c npx chrome-devtools-mcp@latest
```

### Context7

Servicio de contexto extendido para mejorar las capacidades de Claude.

```bash
claude mcp add --transport http context7 https://mcp.context7.com/mcp
```

### Angular MCP

```bash
# Linux / macOS
claude mcp add angular-cli -- npx -y @angular/cli mcp
# Windows
claude mcp add angular-cli -- cmd /c npx -y @angular/cli mcp
```

### PrimeNG MCP

```bash
# Linux / macOS
claude mcp add primeng -- npx -y @primeng/mcp
# Windows
claude mcp add primeng -- cmd /c npx -y @primeng/mcp
```

### PostgreSQL MCP

Integración con bases de datos PostgreSQL via servidor MCP local (SSE).

```bash
claude mcp add --transport sse postgres http://localhost:8000/sse
```

### MariaDB MCP

Integración con bases de datos MariaDB via servidor MCP local (SSE).

```bash
claude mcp add --transport sse mariadb http://localhost:9001/sse
```

---

## Configuración en OpenCode

OpenCode usa su propio archivo `opencode.json` para definir los servidores MCP. Soporta dos alcances: **global** (todos los proyectos) y **por proyecto**.

### Configuración Global

Aplica a todos los proyectos del usuario.

| SO | Ruta |
|---|---|
| Windows 11 | `C:\Users\<TuUsuario>\.config\opencode\opencode.json` |
| Linux / macOS | `~/.config/opencode/opencode.json` |

### Configuración por Proyecto

Agrega un `opencode.json` en la raíz del proyecto. Tiene mayor precedencia que la global.

```
<raiz-del-proyecto>/opencode.json
```

> Las configuraciones se **mergean**, no se reemplazan. La config de proyecto solo necesita definir lo que difiera de la global.

### Ejemplo completo `opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp"
    },
    "postgres": {
      "type": "remote",
      "url": "http://localhost:8000/sse"
    },
    "mariadb": {
      "type": "remote",
      "url": "http://localhost:9001/sse"
    },
    "angular-cli": {
      "type": "local",
      "command": ["npx", "-y", "@angular/cli", "mcp"]
    },
    "primeng": {
      "type": "local",
      "command": ["npx", "-y", "@primeng/mcp"]
    }
  }
}
```

> En Windows, para MCPs locales que requieran `cmd /c`, el array quedaría: `"command": ["cmd", "/c", "npx", "-y", "@primeng/mcp"]`.

### Agregar MCP via CLI de OpenCode

```bash
opencode mcp add
```

El comando es interactivo y te guía para elegir tipo (local/remoto), nombre y URL.

### Deshabilitar un MCP en un proyecto específico

Si tenés un MCP definido en la config global pero no lo querés en un proyecto concreto:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "context7": {
      "enabled": false
    }
  }
}
```

---

## Uso

Una vez agregados los servidores MCP, estarán disponibles automáticamente en tus sesiones de Claude Code u OpenCode.

### Ruta de configuración en Windows 11 (Claude Code)

Para usuarios de Windows 11, la configuración de MCP de Claude Code se almacena en:

> `C:\Users\<TuUsuario>\.claude.json`

```json
{
  "mcp": {
    "servers": {
      "chrome-devtools": {
        "type": "local",
        "command": "npx chrome-devtools-mcp@latest"
      },
      "context7": {
        "type": "http",
        "url": "https://mcp.context7.com/mcp"
      },
      "postgres": {
        "url": "http://localhost:8000/sse",
        "transport": "sse"
      },
      "mariadb": {
        "url": "http://localhost:9001/sse",
        "transport": "sse"
      }
    }
  }
}
```

## Ruta macOS (Claude Code)

> `~/.local/bin/claude`

⚠ Setup notes:
- Native installation exists but `~/.local/bin` is not in your PATH. Run:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
```

## Referencias

- [Chrome DevTools MCP](https://github.com/anthropics/chrome-devtools-mcp)
- [Context7](https://mcp.context7.com/)
- [OpenCode Docs - MCP Servers](https://opencode.ai/docs/mcp-servers/)
- [OpenCode Docs - Config](https://opencode.ai/docs/config/)