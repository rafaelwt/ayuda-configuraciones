# Guía: MCP de SQL Server (solo lectura) en Claude Code

Conecta Claude Code a una base de datos **SQL Server** (compatible con
versiones antiguas como **SQL Server 2012**) usando el servidor MCP
[farahsaleem1995/mssql-mcp-server](https://github.com/farahsaleem1995/mssql-mcp-server).

> **Qué permite:** consultas `SELECT`, listar tablas y ver esquemas.
> **Qué NO permite:** INSERT, UPDATE, DELETE ni ejecutar stored procedures.
> Es de **solo lectura** por diseño (seguro para usar sobre una base real).

---

## Requisitos previos

- **Node.js 18 o superior** instalado (`node --version` para comprobar).
- **Git** instalado.
- **Claude Code** instalado y funcionando.
- Acceso de red al servidor SQL y sus credenciales (ver más abajo).

---

## Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/farahsaleem1995/mssql-mcp-server.git
cd mssql-mcp-server
```

## Paso 2 — Instalar dependencias

```bash
npm install
```

## Paso 3 — Configurar la conexión a la base de datos

Crea tu archivo de configuración a partir de la plantilla:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus datos. Las variables son:

```
# IP o nombre del servidor donde corre SQL Server.
# Si esta en otro equipo, pon su IP/host real (NO localhost).
DB_SERVER=192.168.X.X
DB_PORT=1433

# Base de datos y credenciales (autenticacion SQL, no Windows).
DB_DATABASE=BD_VUT
DB_USER=tu_usuario
DB_PASSWORD=tu_password

# Recomendado para SQL Server antiguo (2012): evita fallos de TLS.
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

### Notas importantes de conexión

- **SQL en otro servidor:** usa su IP o nombre real en `DB_SERVER`, nunca
  `localhost`. Tu máquina debe poder alcanzarlo por red en el puerto 1433
  (firewall abierto).
- **Autenticación:** debe ser autenticación SQL (usuario + contraseña). La
  instancia tiene que tener habilitado el modo mixto.
- **SQL Server 2012:** deja `DB_ENCRYPT=false` y
  `DB_TRUST_SERVER_CERTIFICATE=true`. Node intenta cifrado TLS por defecto,
  que suele fallar contra versiones antiguas.

## Paso 4 — Arrancar el servidor MCP

Para uso normal (compila y ejecuta):

```bash
npm run build
npm start
```

O en modo desarrollo (recompila al vuelo, útil para probar):

```bash
npm run dev
```

El servidor queda escuchando en `http://localhost:3001`.

## Paso 5 — Verificar que conectó

En consola debe aparecer:

```
[db] Connected to SQL Server
```

Y este comando debe responder OK:

```bash
curl http://localhost:3001/health
```

## Paso 6 — Agregar el MCP a Claude Code

```bash
claude mcp add --transport sse mssql http://localhost:3001/sse
```

## Paso 7 — Comprobar en Claude Code

```bash
claude mcp list
```

Debe aparecer `mssql` como conectado. Dentro de una sesión de Claude
Code, escribe `/mcp` para ver las herramientas disponibles:
`list_tables`, `get_schema` y la consulta de solo lectura.

Ya puedes pedirle a Claude cosas como *"lista las tablas"*, *"muéstrame
el esquema de la tabla ADM_usuario"* o *"consulta los primeros registros
de..."*.

---

## Mantener el servidor activo

El servidor corre como un proceso en tu terminal: si cierras la ventana,
se detiene. Para dejarlo funcionando en segundo plano de forma estable,
puedes usar **pm2**:

```bash
npm install -g pm2
pm2 start npm --name mssql-mcp -- start
pm2 save
```

Comandos útiles de pm2: `pm2 logs mssql-mcp`, `pm2 restart mssql-mcp`,
`pm2 stop mssql-mcp`.

---

## Quitar el MCP (si lo necesitas)

```bash
claude mcp remove mssql
```

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| No conecta a la base | Sin acceso de red / firewall | Verifica que alcanzas el servidor en el 1433 |
| Error de login | Falta autenticación SQL o usuario incorrecto | Activa modo mixto; revisa usuario/contraseña |
| Error de TLS/cifrado | Cifrado activado contra SQL antiguo | `DB_ENCRYPT=false`, `DB_TRUST_SERVER_CERTIFICATE=true` |
| `mssql` no aparece en `/mcp` | El servidor no está corriendo | Arráncalo antes de registrar y vuelve a comprobar |
| Falla `npm run build` | Node demasiado antiguo | Actualiza a Node 18+ |
