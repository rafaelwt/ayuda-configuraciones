# Guía: Configurar servidor PostgreSQL remoto en Ubuntu 22

> Esta guía asume que tienes una máquina Ubuntu 22 en algún servidor (o VM) y deseas que PostgreSQL acepte conexiones externas.

---

## ⚙️ Nota sobre la versión

En esta guía se usa la ruta `/etc/postgresql/{version}/main/`, donde `{version}` corresponde a la versión instalada de PostgreSQL (por ejemplo, `14`, `15`, `16`, etc.).

Puedes verificar tu versión con:

```bash
psql --version
```

Y listar las carpetas disponibles:

```bash
ls /etc/postgresql/
```

Reemplaza `{version}` en los comandos por el número correcto según tu instalación.

---

## 1. Actualizar e instalar PostgreSQL

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

Esto instalará PostgreSQL y componentes adicionales útiles.  
Luego puedes verificar que el servicio esté activo:

```bash
service postgresql status
```

---

## 2. Modificar `postgresql.conf` para escuchar conexiones externas

Edita el archivo de configuración principal:

```bash
sudo vim /etc/postgresql/{version}/main/postgresql.conf
```

Busca la línea:

```text
#listen_addresses = 'localhost'
```

y cámbiala a:

```text
listen_addresses = '*'
```

Dejar el `*` le dice a PostgreSQL que escuche en **todos** los interfaces de red. (Si quisieras restringirlo, podrías poner una IP específica.)

---

## 3. Modificar `pg_hba.conf` para permitir autenticación remota

Edita el archivo de control de accesos:

```bash
sudo vim /etc/postgresql/{version}/main/pg_hba.conf
```

Localiza la sección que dice algo como:

```text
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
```

Reemplázala (o agrega debajo) con algo como:

```text
# Permitir desde cualquier IP (ojo con la seguridad)
host    all             all             0.0.0.0/0               md5
```

Con esto, aceptas conexiones desde cualquier dirección IPv4 con autenticación MD5 (usuario + contraseña). **Advertencia**: esto abre el acceso bastante ampliamente, considera usar rangos específicos o redes confiables.

---

## 4. Configurar el firewall

Si tienes `ufw` activo (o cualquier firewall), necesitas permitir el puerto por el que PostgreSQL escucha (por defecto, **5432**):

```bash
sudo ufw allow 5432/tcp
```

Verifica que la regla se haya agregado:

```bash
sudo ufw status
```

---

## 5. Reiniciar PostgreSQL

Para que los cambios surtan efecto:

```bash
sudo service postgresql restart
```

O también:

```bash
sudo systemctl restart postgresql
```

---

## 6. Acceso inicial y configuración del usuario `postgres`

Por defecto, PostgreSQL crea un usuario llamado `postgres` **sin contraseña** y usa autenticación local del sistema.

### Acceder por primera vez:

```bash
sudo -i -u postgres
psql
```

Verás el prompt de PostgreSQL:
```
postgres=#
```

### Asignar contraseña al usuario `postgres`

Dentro del prompt de PostgreSQL (no en la terminal del sistema), ejecuta:

```sql
\password postgres
```

Te pedirá escribir y confirmar una nueva contraseña. Luego puedes salir:

```sql
\q
exit
```

### Probar la conexión con contraseña

```bash
psql -h localhost -U postgres -d postgres -W
```

---

## 7. Crear un nuevo usuario y base de datos

Usar el usuario `postgres` para todo no es recomendable. Es mejor crear un usuario propio para tus aplicaciones.

1. Entra al prompt de PostgreSQL:
   ```bash
   sudo -i -u postgres
   psql
   ```

2. Crea un nuevo usuario con contraseña:
   ```sql
   CREATE USER miapp_user WITH PASSWORD 'mi_password_seguro';
   ```

3. Crea una base de datos para ese usuario:
   ```sql
   CREATE DATABASE miapp_db OWNER miapp_user;
   ```

4. Concede privilegios:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE miapp_db TO miapp_user;
   ```

5. Sal del cliente:
   ```sql
   \q
   exit
   ```

Luego podrás conectarte así:

```bash
psql -h localhost -U miapp_user -d miapp_db -W
```

---

## 8. Opciones de fortalecimiento (recomendadas)

Para no dejar el servidor vulnerable, considera:

- En lugar de `0.0.0.0/0`, permitir solo rangos IP específicos (por ejemplo `192.168.1.0/24`) en `pg_hba.conf`.
- Usar SSL/TLS para cifrar la conexión entre cliente y servidor.
- Cambiar el puerto por defecto (5432) a uno no estándar.
- Usar VPN u otros túneles seguros si el servidor está en internet público.
- Limitar usuarios y privilegios en la base de datos (principio de menor privilegio).
- Monitorear logs de conexiones fallidas o patrones extraños.
