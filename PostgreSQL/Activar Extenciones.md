# Activar Extensiones en PostgreSQL

## Activar Crosstab en CentOS

Para PostgreSQL 10:

1. Instalar las extensiones:
   ```bash
   yum install postgresql10-contrib
   ```

2. Activar extensiones en `postgresql.conf`:
   ```
   shared_preload_libraries = 'pg_stat_statements'
   pg_stat_statements.track = all
   ```

3. Reiniciar el servicio:
   ```bash
   systemctl restart postgresql-10.service
   ```

4. Las extensiones necesarias se encuentran en:
   ```
   /usr/pgsql-10/share/extension/
   ```

## Activar TableFunc

Ejecutar la siguiente consulta:
```sql
CREATE EXTENSION tablefunc;
```