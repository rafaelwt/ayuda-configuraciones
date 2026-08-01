# Engram Cloud — Actualizar el servidor

Actualizar la imagen del servidor Engram Cloud en el VPS.

**Repo:** https://github.com/Gentleman-Programming/engram
**Imagen:** `ghcr.io/gentleman-programming/engram`

Todos los comandos desde `/opt/engram`.

---

## 1. Backup primero (siempre)

```bash
cd /opt/engram
docker exec engram-cloud-postgres pg_dump -U engram engram_cloud > ~/engram_$(date +%F).sql
ls -lh ~/engram_*.sql
```

Verificá que el archivo no esté vacío antes de seguir.

## 2. Anotá la versión actual

Por si tenés que volver atrás:

```bash
docker inspect engram-cloud --format '{{.Image}}'
docker images --digests | grep engram
```

Guardá ese digest (`sha256:...`).

## 3. Actualizar

```bash
docker compose pull
docker compose up -d
docker compose logs --tail 30 cloud
```

`pull` baja la imagen nueva; `up -d` recrea solo los contenedores cuya imagen cambió. Postgres no se toca. El volumen de datos se conserva.

## 4. Verificar

```bash
docker compose ps
curl -i http://127.0.0.1:18080/dashboard/login
```

Y desde un cliente:

```
engram sync --cloud --status --project <nombre>
```

## 5. Limpiar imágenes viejas (opcional)

```bash
docker image prune -f
```

## Rollback

Si la versión nueva rompe algo, volvé al digest anterior editando el `docker-compose.yml`:

```yaml
image: ghcr.io/gentleman-programming/engram@sha256:<digest-viejo>
```

```bash
docker compose up -d --force-recreate cloud
```

Si además hubo migración de base que rompió datos:

```bash
docker compose down
docker volume rm engram_engram-cloud-pg
docker compose up -d postgres
sleep 10
cat ~/engram_<fecha>.sql | docker exec -i engram-cloud-postgres psql -U engram -d engram_cloud
docker compose up -d
```

## Sobre el tag `latest`

Hoy `:latest` se publica desde la rama de desarrollo — el binario lo confirma con el mensaje *"development builds do not map to a release version"*. Eso significa que un `pull` puede traerte cambios no estabilizados.

Si el proyecto empieza a publicar tags de versión, conviene fijarlos:

```yaml
image: ghcr.io/gentleman-programming/engram:v1.21.0
```

Y actualizar cambiando el número a propósito, en vez de que `latest` se mueva solo. Podés revisar los tags disponibles en la sección **Packages** del repo de GitHub.

## Actualizar Postgres

Cambiar de `postgres:16-alpine` a una major nueva (17, 18) **no es un `pull`**. Requiere dump, borrar el volumen, y restore. No lo hagas junto con una actualización de engram — un cambio a la vez.

---
