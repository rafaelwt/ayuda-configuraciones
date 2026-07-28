# RustFS — S3-compatible object storage

Local object storage for the **auth-gateway** project (`~/Development/chezbrand/cubre-app/auth-gateway`).
Replaces MinIO, which moved to AGPLv3 and stripped features from its community edition.
RustFS is Apache 2.0.

## Endpoints

| Service | URL | Notes |
| --- | --- | --- |
| S3 API | http://localhost:9000 | What auth-gateway talks to |
| Console | http://localhost:9011 | Web UI — **not** 9001, see below |

The console is published on **9011** because host port 9001 is already taken by
the `mariadb-mcp` container. Inside the container it still listens on 9001; only
the host mapping differs.

## Credentials

Stored in `.env` (git-ignored, `chmod 600`). These are **not** user accounts —
RustFS reads them as environment variables and treats them as the root
credentials, the same way MinIO uses `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD`.
There is no user-creation step.

They were generated with:

```bash
AK="rustfsadmin$(openssl rand -hex 3)"
SK="$(openssl rand -base64 24)"
```

The access key is deliberately project-neutral: this instance is shared
infrastructure, not dedicated to any single application.

The image falls back to `rustfsadmin`/`rustfsadmin` when these are unset — never
leave that in place on anything reachable by others.

### Rotating credentials

Both sides must be updated together — the container will not accept the old keys
after a recreate, and any client still holding them stops authenticating.

```bash
# 1. new values here
cd ~/docker/rust-fs
printf 'RUSTFS_ACCESS_KEY=rustfsadmin%s\nRUSTFS_SECRET_KEY=%s\n' \
  "$(openssl rand -hex 3)" "$(openssl rand -base64 24)" > .env
chmod 600 .env

# 2. pick them up
docker compose up -d --force-recreate

# 3. mirror them into every client (e.g. auth-gateway)
#    MINIO_ACCESS_KEY / MINIO_SECRET_KEY
```

Buckets and objects live in the `./data` bind mount, so they survive a recreate
untouched. Rotating keys does not touch stored data.

## First-time setup

Only `docker-compose.yml`, `README.md`, `.env.example` and `.gitignore` are
meant to be shared. `.env`, `data/` and `logs/` are machine-local and must never
be copied between machines.

```bash
cp .env.example .env
chmod 600 .env

# fill in your own credentials
AK="rustfsadmin$(openssl rand -hex 3)"
SK="$(openssl rand -base64 24)"
printf 'RUSTFS_ACCESS_KEY=%s\nRUSTFS_SECRET_KEY=%s\n' "$AK" "$SK" > .env

docker compose up -d
```

Two things to check before starting:

- **Host UID.** `docker-compose.yml` pins `user: "1000:1000"`. If `id -u` returns
  something else on your machine, change it to match or the container cannot
  write to `data/`.
- **Free ports.** 9000 and 9011 must be available (`ss -lntp | rg '9000|9011'`).

Then point your application at `http://localhost:9000` with the credentials from
your own `.env`.

## Usage

```bash
docker compose up -d        # start
docker compose logs -f      # follow logs
docker compose down         # stop (data survives in ./data)
docker compose down -v      # stop and delete volumes
```

## Layout

```
docker-compose.yml   service definition
.env                 credentials (git-ignored)
data/                object storage — buckets live here
logs/                server logs
```

`data/` and `logs/` are bind mounts owned by the host user (UID 1000).

### Why `user: "1000:1000"`

The image defaults to UID/GID **10001** and cannot write to bind mounts owned by
someone else. The official docs suggest `chown -R 10001:10001 data logs`, which
needs root. Running the container as the host UID is the alternative the same
docs offer, and it has a practical advantage: files under `data/` stay owned by
your user instead of a UID that only root can clean up.

If you ever run this as a different host user, change that line to match
`id -u`:`id -g`.

## Gateway configuration

The gateway's `MinioStorageService` works against RustFS unchanged — it only
uses standard S3 calls. Relevant vars in the gateway's `.env`:

```ini
MINIO_ENDPOINT='localhost'
MINIO_PORT=9000
MINIO_ACCESS_KEY='<RUSTFS_ACCESS_KEY>'
MINIO_SECRET_KEY='<RUSTFS_SECRET_KEY>'
MINIO_BUCKET_NAME='polizas'
```

The `polizas` bucket is created automatically on gateway startup
(`MinioStorageService.onModuleInit`) if it does not exist.

## Verified compatibility

Tested against this instance with the AWS SDK v3 — the same client the gateway
uses. All operations the gateway performs:

| Operation | Result |
| --- | --- |
| `CreateBucket` (auto-provisioning on boot) | pass |
| `PutObject` | pass |
| `GetObject` + `transformToByteArray` | pass |
| **Presigned URL (SigV4)** | pass — HTTP 200 |
| `DeleteObject` | pass |

Presigned URLs were the main compatibility risk, since S3 implementations
sometimes differ on signature handling. They work.

## Caveats

- **SNSD mode** (single node, single disk) — no redundancy. Fine for
  development; a production deployment needs a real topology (SNMD or MNMD).
- Pinned to `rustfs/rustfs:latest`. For reproducibility, pin a digest or an
  explicit tag instead. Current digest:
  `sha256:84ce557a0245a06a9aae5516f55ee0f007fca78d41df356f419306fdc0cb168c`
- RustFS is a young project (2024–2025). Validate thoroughly before trusting it
  with production data.
