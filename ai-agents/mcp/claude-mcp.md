# Configuración de Claude MCP

Este documento contiene los comandos para configurar los servidores MCP (Model Context Protocol) en Claude Code.

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

## Uso

Una vez agregados los servidores MCP, estarán disponibles automáticamente en tus sesiones de Claude Code.

### Ruta de configuración en Windows 11

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

---

## Referencias

- [Chrome DevTools MCP](https://github.com/anthropics/chrome-devtools-mcp)
- [Context7](https://mcp.context7.com/)
- [OpenCode MCP](./opencode-mcp.md)