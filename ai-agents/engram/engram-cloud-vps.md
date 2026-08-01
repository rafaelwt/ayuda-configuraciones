# Engram Cloud — Instalación en VPS

Servidor propio de Engram Cloud con Postgres, autenticación por token y reverse proxy con TLS.

**Requisitos:** VPS con Docker + Docker Compose, un dominio apuntando al VPS, reverse proxy (nginx/caddy) ya funcionando.

---

## 1. Directorio y secretos

```bash
mkdir -p /opt/engram && cd /opt/engram
for n in PG JWT TOKEN ADMIN; do echo "$n=$(openssl rand -hex 32)"; done
```

Guardá esos 4 valores a mano, los vas a pegar ahora.

## 2. Archivo `.env`

```bash
touch .env && chmod 600 .env
nano .env
```

```dotenv
POSTGRES_USER=engram
POSTGRES_PASSWORD=<PG>
POSTGRES_DB=engram_cloud

ENGRAM_DATABASE_URL=postgres://engram:<PG>@postgres:5432/engram_cloud?sslmode=disable
ENGRAM_JWT_SECRET=<JWT>
ENGRAM_CLOUD_TOKEN=<TOKEN>
ENGRAM_CLOUD_ADMIN=<ADMIN>
ENGRAM_CLOUD_ALLOWED_PROJECTS=*
ENGRAM_CLOUD_HOST=0.0.0.0
ENGRAM_CLOUD_MAX_PUSH_BYTES=8388608
ENGRAM_PORT=18080
```

**Puntos críticos:**

- `<PG>` va en **dos lugares**: `POSTGRES_PASSWORD` y dentro de `ENGRAM_DATABASE_URL`. Si no coinciden, el servicio cloud no conecta.
- Los 4 secretos deben ser **distintos entre sí**.
- `ENGRAM_CLOUD_TOKEN` es el bearer token de sync (clientes). `ENGRAM_CLOUD_ADMIN` es el del dashboard.
- `ENGRAM_CLOUD_ALLOWED_PROJECTS=*` permite cualquier proyecto. Es lo cómodo para una instancia personal. Si vas a compartir el server, usá lista explícita: `proyecto-a,proyecto-b` (sin espacios).
- **Nunca** pongas `ENGRAM_CLOUD_INSECURE_NO_AUTH=1`. Es solo para smoke test local y no se puede combinar con `ENGRAM_CLOUD_TOKEN`.

## 3. `docker-compose.yml`

```bash
cat > /opt/engram/docker-compose.yml << 'EOF'
services:
  postgres:
    image: postgres:16-alpine
    container_name: engram-cloud-postgres
    restart: unless-stopped
    env_file:
      - .env
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 3s
      retries: 10
    ports:
      - "127.0.0.1:5433:5432"
    volumes:
      - engram-cloud-pg:/var/lib/postgresql/data

  cloud:
    image: ghcr.io/gentleman-programming/engram:latest
    container_name: engram-cloud
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    env_file:
      - .env
    ports:
      - "127.0.0.1:18080:18080"
    command: ["cloud", "serve"]

volumes:
  engram-cloud-pg:
EOF
```

**Por qué así:**

- Imagen oficial de GHCR, no build desde fuente. Los builds de desarrollo tienen bugs conocidos.
- Puertos publicados en `127.0.0.1`, nunca `0.0.0.0`. La exposición pública va por el reverse proxy con TLS. `ENGRAM_CLOUD_HOST=0.0.0.0` es el bind *dentro* del contenedor, eso sí va así.
- El `healthcheck` en postgres es obligatorio: sin él, el `depends_on: condition: service_healthy` falla al levantar.

## 4. Levantar

```bash
cd /opt/engram
echo ".env" >> .gitignore
docker compose pull
docker compose up -d
docker compose logs --tail 20 cloud
```

Buscá `listening on 0.0.0.0:18080`.

```bash
docker compose ps
curl -i http://127.0.0.1:18080/dashboard/login
```

Debe devolver `200` con un formulario que pide token. Si redirige directo al dashboard sin pedir nada, quedó en modo inseguro.

## 5. Reverse proxy

Apuntá tu dominio al puerto local:

```
https://tu-dominio.com  →  http://127.0.0.1:18080
```

Verificá desde el navegador: `https://tu-dominio.com/dashboard/login` debe mostrar la pantalla de Sign In.

## 6. Dashboard

Entrá con el valor de `ENGRAM_CLOUD_ADMIN`.

---

## Backup de secretos

Los 4 secretos existen **solo** en `/opt/engram/.env`. Si el VPS se muere, no hay recuperación.

```bash
cat /opt/engram/.env
```

Copialos a tu gestor de contraseñas. Hacelo ahora, no después.

Backup de la base:

```bash
docker exec engram-cloud-postgres pg_dump -U engram engram_cloud > ~/engram_$(date +%F).sql
```

---

## Operación

Todos los comandos desde `/opt/engram`:

```bash
docker compose ps                        # estado
docker compose logs -f cloud             # logs en vivo
docker compose up -d --force-recreate cloud   # aplicar cambios del .env
docker compose pull && docker compose up -d   # actualizar imagen
docker compose down                      # bajar (conserva datos)
```

`docker compose down -v` borra el volumen con todas las memorias. No lo uses salvo que quieras empezar de cero.

### Rotar el token de sync

```bash
cd /opt/engram
openssl rand -hex 32          # copiá el resultado
nano .env                     # reemplazá SOLO la línea ENGRAM_CLOUD_TOKEN
docker compose up -d --force-recreate cloud
```

Después actualizá el token en cada PC cliente.

---

## Nota: usuarios gestionados

`engram cloud bootstrap admin` está roto en los builds actuales — falla al escribir el evento de auditoría por una clave de metadata rechazada, incluso sin `--issue-token`. Peor: en el primer intento deja el principal creado, y el reintento se rechaza por FK contra `cloud_auth_audit_log`.

**No hace falta.** Los tokens de `.env` (`ENGRAM_CLOUD_TOKEN` / `ENGRAM_CLOUD_ADMIN`) funcionan perfectamente. Los principals gestionados son una capa opcional encima.

Si algún día lo arreglan upstream y querés reintentar tras un intento fallido, hay que limpiar en este orden:

```bash
docker exec -it engram-cloud-postgres psql -U engram -d engram_cloud -c "
DELETE FROM cloud_project_grants WHERE principal_id = <id>;
DELETE FROM cloud_auth_audit_log WHERE target_principal_id = <id>;
DELETE FROM cloud_principals WHERE id = <id>;
"
```
