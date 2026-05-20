# Guía de instalación: MCP MariaDB Server con Docker en Linux

Instalación del servidor MCP de MariaDB con Docker, asumiendo que ya tienes una base de datos MariaDB corriendo por separado.

---

## Requisitos previos

- Docker y Docker Compose instalados
- MariaDB ya corriendo (otro contenedor, otro compose, o nativa)
- Git

---

## Paso 1: Clonar el repositorio

```bash
git clone https://github.com/MariaDB/mcp.git mariadb-mcp
cd mariadb-mcp
```

---

## Paso 2: Modificar el `docker-compose.yml`

El `docker-compose.yml` original del repo levanta dos servicios: una MariaDB de prueba y el MCP. Como ya tenemos nuestra propia MariaDB, eliminamos el servicio de la base de datos.

### Original del repo

```yaml
services:
  mariadb-server:
    image: mariadb:11
    container_name: mariadb
    environment:
      MARIADB_ROOT_PASSWORD: rootpassword123
      MARIADB_DATABASE: demo
      MARIADB_USER: user
      MARIADB_PASSWORD: password123
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mariadb-admin", "ping", "-h", "127.0.0.1", "-p'rootpassword123'"]
      interval: 5s
      timeout: 3s
      retries: 10
  mariadb-mcp:
    build: .
    container_name: mariadb-mcp
    env_file: .env
    ports:
      - "9001:9001"
    depends_on:
      mariadb-server:
        condition: service_healthy
```

### Reemplazar por

```yaml
services:
  mariadb-mcp:
    build: .
    container_name: mariadb-mcp
    env_file: .env
    ports:
      - "9001:9001"
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

### Qué cambió

- Eliminamos el servicio `mariadb-server` y su `depends_on` (no los necesitamos).
- Agregamos `extra_hosts` para que el contenedor del MCP pueda resolver `host.docker.internal` en Linux (ver Paso 5).

---

## Paso 3: Modificar `pyproject.toml`

El proyecto declara `sentence-transformers` como dependencia obligatoria, lo que arrastra ~3 GB de PyTorch + bibliotecas de NVIDIA aunque no se usen embeddings. Las movemos a un grupo opcional.

Edita `pyproject.toml`:

```toml
[project]
name = "mariadb-server"
version = "0.2.4"
description = "MariaDB MCP Server"
readme = "README.md"
requires-python = ">=3.11"
dependencies = [
    "asyncmy>=0.2.10",
    "fastmcp[websockets]==2.12.1",
    "python-dotenv>=1.1.0",
    "numpy>=1.26",
]

[project.optional-dependencies]
embeddings = [
    "google-genai>=1.15.0",
    "openai>=1.78.1",
    "sentence-transformers>=4.1.0",
    "tokenizers==0.21.2",
]
```

### Importante

- **`numpy` debe quedarse en `dependencies`**: el `server.py` lo importa al inicio sí o sí, sin él el contenedor no arranca.
- **`openai`, `google-genai` y `sentence-transformers` van a `optional-dependencies`**: `embeddings.py` las importa dentro de un `try/except ImportError`, así que el servidor levanta sin problema si faltan.

---

## Paso 4: Borrar el `uv.lock` (si existe)

```bash
rm -f uv.lock
```

`uv` lo regenerará durante el build con la nueva configuración.

---

## Paso 5: Crear el archivo `.env`

En la raíz del proyecto, crea un `.env`:

```dotenv
DB_HOST=host.docker.internal
DB_USER=root
DB_PASSWORD=root
DB_PORT=3306
MCP_READ_ONLY=true
MCP_MAX_POOL_SIZE=10
```

Ajusta `DB_USER` y `DB_PASSWORD` según tus credenciales. `DB_NAME` es opcional.

### Sobre `host.docker.internal` en Linux

En **Windows y macOS**, Docker Desktop resuelve `host.docker.internal` automáticamente. En **Linux con Docker nativo, NO**. Por eso en el Paso 2 agregamos:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

`extra_hosts` va en el **MCP** (no en MariaDB) porque quien necesita resolver ese nombre es el cliente que se conecta a la base, no el servidor. La línea `host.docker.internal:host-gateway` le dice a Docker que resuelva ese nombre a la IP del host de la máquina. Como tu MariaDB expone el puerto `3306` al host, esa ruta llega bien.

---

## Paso 6: Construir y levantar

```bash
docker compose build
docker compose up -d
```

### Verificar que arrancó bien

```bash
docker compose logs -f
```

Deberías ver:

```
config - INFO - Selected Embedding Provider: None
config - INFO - No EMBEDDING_PROVIDER selected... Disabling embedding features.
config - INFO - Read-only mode: True
```

Y **no** deben aparecer:

- `ModuleNotFoundError: No module named 'numpy'`
- `Can't connect to MySQL server on '...' (Name or service not known)`

Sal de los logs con `Ctrl+C`.

### Probar el endpoint

```bash
curl -i http://localhost:9001/sse
```

Si devuelve `200 OK` y se queda esperando, el MCP está funcionando.

---

## Comandos del día a día

```bash
# Levantar
docker compose up -d

# Detener
docker compose down

# Ver logs
docker compose logs -f

# Reiniciar tras cambiar el .env
docker compose restart

# Reconstruir tras cambiar código o pyproject.toml
docker compose up -d --build

# Ver estado
docker compose ps
```

---

## Troubleshooting

**`ModuleNotFoundError: No module named 'numpy'`**
Falta `numpy` en `dependencies` del `pyproject.toml`. Vuelve al Paso 3.

**`Can't connect to MySQL server on 'host.docker.internal' (Name or service not known)`**
Falta `extra_hosts` en el `docker-compose.yml`. Vuelve al Paso 2.

**El build descarga `nvidia-*`, `torch`, etc.**
- Verifica el `pyproject.toml` (Paso 3).
- Borra el `uv.lock` viejo (Paso 4).
- Confirma que el Dockerfile usa `uv sync --no-dev` sin `--extra embeddings`.

---
