# PostgreSQL - Comandos y Configuraciones

## Administración de Esquemas

```sql
-- Eliminar todas las tablas y funciones
DROP SCHEMA public CASCADE;
CREATE SCHEMA public; 
```

## Información del Sistema

```sql
-- Versión de la Base de Datos
SELECT version();

-- Extensiones disponibles
SELECT * FROM pg_available_extensions ORDER BY name;

-- Activar encriptación
CREATE EXTENSION pgcrypto;
```

## Gestión de Conexiones

### Cerrar Conexiones Activas

```sql
SELECT 
    pg_terminate_backend(pid) 
FROM 
    pg_stat_activity 
WHERE 
    -- No cerrar mi propia conexión
    pid <> pg_backend_pid()
    -- No cerrar conexiones a otras bases de datos
    AND datname = 'your_database';
```

### Bloquear Conexiones a una Base de Datos

```sql
UPDATE pg_database SET datallowconn = 'false' WHERE datname = 'your_database';
```

## Configuración de DBLink

### Instalación en CentOS 7

1. Verificar si está instalada la extensión dblink:
   ```bash
   ls /var/postgresql-10/share/extension/dblink--1.2.sql
   ```

2. Instalar dblink:
   ```bash
   yum install postgres*contrib 
   ```

3. Ejecutar la siguiente consulta en la base de datos origen:
   ```sql
   CREATE EXTENSION dblink;
   ```

4. Configurar el archivo `pg_hba.conf`:
   - Para conexión de una base de datos a otra del mismo servidor:
     ```
     # "local" is for Unix domain socket connections only 
     local   all     all
     ```
   - Para conexión remota en otro servidor:
     ```
     # IPv4 local connections:
     host    all     all     0.0.0.0/0     md5 
     ```

5. Reiniciar el servicio PostgreSQL:
   ```bash
   systemctl restart postgresql-10
   ```

6. Ejemplos de consultas:
   - Desde el mismo servidor:
     ```sql
     SELECT correlativo, fecha_orden FROM 
         dblink('dbname=DbPrueba', 'SELECT correlativo, fecha_orden FROM cm_orden_compra') AS tabla
     (correlativo int, fecha_orden date);
     ```