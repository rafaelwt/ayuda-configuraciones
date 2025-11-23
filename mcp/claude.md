# Configuración de Claude MCP

Este documento contiene los comandos para configurar los servidores MCP (Model Context Protocol) en Claude Code.

## Servidores Disponibles

### Chrome DevTools

Integración con Chrome DevTools para debugging y análisis de aplicaciones web.

```bash
claude mcp add chrome-devtools npx chrome-devtools-mcp@latest
```

### Context7

Servicio de contexto extendido para mejorar las capacidades de Claude.

```bash
claude mcp add --transport http context7 https://mcp.context7.com/mcp
```

## Uso

Una vez agregados los servidores MCP, estarán disponibles automáticamente en tus sesiones de Claude Code.

## Referencias

- [Documentación oficial de Claude MCP](https://docs.anthropic.com/claude/docs)
- [Chrome DevTools MCP](https://github.com/anthropics/chrome-devtools-mcp)
- [Context7](https://mcp.context7.com/)