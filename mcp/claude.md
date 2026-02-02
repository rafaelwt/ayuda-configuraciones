# Configuración de Claude MCP

Este documento contiene los comandos para configurar los servidores MCP (Model Context Protocol) en Claude Code.

## Servidores Disponibles

### Chrome DevTools

Integración con Chrome DevTools para debugging y análisis de aplicaciones web.

```bash
# Linux mac os
claude mcp add chrome-devtools npx chrome-devtools-mcp@latest
# Windows
claude mcp add chrome-devtools cmd /c npx chrome-devtools-mcp@latest
```

### Context7

Servicio de contexto extendido para mejorar las capacidades de Claude.

```bash
claude mcp add --transport http context7 https://mcp.context7.com/mcp
```

### Angular mcp

```bash
claude mcp add angular-cli -- npx -y @angular/cli mcp
# windows
claude mcp add angular-cli -- cmd /c npx -y @angular/cli mcp
```

### Stack Overflow

```bash
claude mcp add stack-mcp-server -- npx mcp-remote mcp.stackoverflow.com
# windows
claude mcp add stack-mcp-server -- cmd /c npx mcp-remote mcp.stackoverflow.com
```

### PrimeNG MCP

```bash
  # Windows
  claude mcp add primeng -- cmd /c npx -y @primeng/mcp

  # Linux/macOS
  claude mcp add primeng -- npx -y @primeng/mcp
```

## Uso

Una vez agregados los servidores MCP, estarán disponibles automáticamente en tus sesiones de Claude Code.

### Ruta de configuración den windows 11

Para usuarios de Windows 11, la configuración de MCP se almacena en la siguiente ruta:

> C:\Users\<TuUsuario>\.claude.json

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
      "mariadb": {
        "url": "http://localhost:9001/sse",
        "transport": "sse"
      }
    }
  }
}
```

## Ruta mac os

> : ~/.local/bin/claude

Next: Run claude --help to get started

⚠ Setup notes:
• Native installation exists but ~/.local/bin is not in your PATH. Run:

```bash
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
```

## Referencias

- [Chrome DevTools MCP](https://github.com/anthropics/chrome-devtools-mcp)
- [Context7](https://mcp.context7.com/)
