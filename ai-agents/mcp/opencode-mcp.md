# Configuración de MCP en OpenCode

OpenCode usa su propio archivo `opencode.json` para definir los servidores MCP. Soporta dos alcances: **global** (todos los proyectos) y **por proyecto**.

## Rutas de configuración

### Global

| SO            | Ruta                                                  |
| ------------- | ----------------------------------------------------- |
| Windows 11    | `C:\Users\<TuUsuario>\.config\opencode\opencode.json` |
| Linux / macOS | `~/.config/opencode/opencode.json`                    |

### Por Proyecto

Agrega un `opencode.json` en la raíz del proyecto. Tiene mayor precedencia que la global.

```
<raiz-del-proyecto>/opencode.json
```

> Las configuraciones se **mergean**, no se reemplazan. La config de proyecto solo necesita definir lo que difiera de la global.

## Ejemplo completo `opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "chrome-devtools": {
      "type": "local",
      "command": ["npx", "chrome-devtools-mcp@latest"]
    },
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
    "mariadb-mcp-server": {
      "type": "remote",
      "url": "http://localhost:9001/mcp"
    },
    "angular-cli": {
      "type": "local",
      "command": ["npx", "-y", "@angular/cli", "mcp"]
    },
    "primeng": {
      "type": "local",
      "command": ["npx", "-y", "@primeng/mcp"]
    },
    "MiniMax": {
      "type": "local",
      "command": ["uvx", "minimax-coding-plan-mcp", "-y"],
      "enabled": true,
      "environment": {
        "MINIMAX_API_KEY": "api_key",
        "MINIMAX_API_HOST": "https://api.minimax.io"
      }
    }
  }
}
```

> En Windows, para MCPs locales que requieran `cmd /c`, el array quedaría: `"command": ["cmd", "/c", "npx", "-y", "@primeng/mcp"]`.

## Agregar MCP via CLI de OpenCode

```bash
opencode mcp add
```

El comando es interactivo y te guía para elegir tipo (local/remoto), nombre y URL.

## MariaDB MCP por Streamable HTTP

Si configuraste el servidor MariaDB MCP con Streamable HTTP, usa la URL `/mcp`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "mariadb-mcp-server": {
      "type": "remote",
      "url": "http://localhost:9001/mcp"
    }
  }
}
```

Antes de usar esta opción, asegúrate de haber cambiado el `CMD` del Dockerfile y reconstruido la imagen como se indica en la [Guía MariaDB MCP](./guia-mcp-mariadb.md).

## Deshabilitar un MCP en un proyecto específico

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

## Referencias

- [OpenCode Docs - MCP Servers](https://opencode.ai/docs/mcp-servers/)
- [OpenCode Docs - Config](https://opencode.ai/docs/config/)
