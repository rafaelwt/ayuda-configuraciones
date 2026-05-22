# Configuración de Claude MCP

Este documento contiene los comandos para configurar los servidores MCP (Model Context Protocol) en Claude Code.

> **Instalación global (todos los proyectos):** Por defecto, `claude mcp add` instala el servidor solo en el **proyecto actual** (scope `local`). Si quieres que el servidor esté disponible de forma **global** en todos tus proyectos, agrega el flag `-s user` (forma corta de `--scope user`). Por ejemplo, para Context7:
>
> ```bash
> claude mcp add -s user --transport http context7 https://mcp.context7.com/mcp
> ```
>
> Los comandos de abajo se muestran sin ese flag (scope local); agrega `-s user` a cualquiera de ellos si lo quieres global.

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

### Ruta de configuración del archivo

El archivo de configuración de los servidores MCP se encuentra en el directorio del usuario (`HOME`), con el mismo nombre en todos los sistemas:

> **Windows 11:** `C:\Users\<TuUsuario>\.claude.json`
>
> **Linux:** `~/.claude.json`  (equivale a `/home/<TuUsuario>/.claude.json`)
>
> **macOS:** `~/.claude.json`  (equivale a `/Users/<TuUsuario>/.claude.json`)

El formato correcto del archivo usa la clave **`mcpServers`** en la raíz (no anidada bajo `mcp`):

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "type": "stdio",
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"]
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
```

---

## Referencias

- [Conectar Claude Code a herramientas vía MCP (Docs oficiales)](https://code.claude.com/docs/en/mcp)
- [Chrome DevTools MCP](https://github.com/anthropics/chrome-devtools-mcp)
- [Context7](https://mcp.context7.com/)
- [OpenCode MCP](./opencode-mcp.md)