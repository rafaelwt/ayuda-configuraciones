# Migración MariaDB Windows → Linux

## BACKUP: Cómo se hizo en Windows (contenedor <container-name>)

```bash
# Ejecutar desde Windows (PowerShell o Git Bash)
docker exec <container-name> mysqldump -u root -proot \
  --single-transaction --quick --routines --events --triggers \
  -B <database1> <database2> <database3> \
  2>/dev/null | gzip > <container-name>_full_backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

**Parámetros usados:**
- `-u root -proot` — usuario y contraseña del contenedor
- `--single-transaction` — permite backup consistente sin bloquear tablas
- `--quick` — evita cargar todo en memoria en tablas grandes
- `--routines` — incluye stored procedures y funciones
- `--events` — incluye eventos del scheduler
- `--triggers` — incluye triggers
- `-B` — respaldar múltiples bases de datos
- `gzip` — comprime el resultado

**Bases de datos excluidas:**
- `information_schema` — tabla virtual del sistema
- `performance_schema` — tabla virtual de métricas
- Las bases de datos personalizadas que no quieras respaldar

---

## 1. Copiar el backup (por USB o el método que prefieras)

Copia el archivo `<container-name>_full_backup_YYYYMMDD_HHMMSS.sql.gz` a tu servidor Linux por el medio que te sea más cómodo (USB, rsync, etc).

## 2. En el servidor Linux, crear el mismo docker-compose

```yaml
version: '3.8'

services:
  <container-name>:
    image: mariadb:10.3.34
    container_name: <container-name>
    command: --default-authentication-plugin=mysql_native_password
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: <database-name>
      MYSQL_USER: <username>
      MYSQL_PASSWORD: root
      TZ: 'America/La_Paz'
    ports:
      - "3306:3306"
    volumes:
      - ./database/mysql:/var/lib/mysql
```

## 3. Levantar el contenedor (sin datos aún)

```bash
docker-compose up -d
```

## 4. Restaurar el backup

```bash
gunzip < <container-name>_full_backup_YYYYMMDD_HHMMSS.sql.gz | docker exec -i <container-name> mysql -u root -proot
```

O si prefieres verificar antes:

```bash
# Ver contenido del backup (opcional)
gunzip -c <container-name>_full_backup_YYYYMMDD_HHMMSS.sql.gz | less

# Restaurar
gunzip < <container-name>_full_backup_YYYYMMDD_HHMMSS.sql.gz | docker exec -i <container-name> mysql -u root -proot
```

## 5. Verificar la restauración

```bash
# Entrar al contenedor
docker exec -it <container-name> mysql -u root -proot

# Ver bases de datos
SHOW DATABASES;

# Salir
EXIT;
```

## Notas importantes

- El backup incluye todas las bases de datos excepto `information_schema` y `performance_schema` (son del sistema)
- La base de datos `mysql` también se restauró (contiene usuarios y permisos)
- Si prefieres instalar MariaDB sin Docker, usa `mysql -u root -proot < backup.sql` directamente