# Actualizar Node con nvm manteniendo servicios en PM2

Guía rápida para hacer una minor update de Node en un servidor Ubuntu que usa `nvm` y tiene servicios corriendo en PM2, sin perder la configuración.

## Contexto

- Gestor de versiones: **nvm**
- Gestor de procesos: **PM2**
- Tipo de update: **minor** (misma major version, mismo ABI de Node → no hay que recompilar módulos nativos)

## Pasos

### 1. Guardar el estado actual de PM2

```bash
pm2 save
```

Esto escribe `~/.pm2/dump.pm2` con la lista de procesos configurados. Es el archivo que PM2 usa para restaurar los servicios después.

### 2. Backup del dump (por seguridad)

```bash
cp ~/.pm2/dump.pm2 ~/.pm2/dump.pm2.backup
```

### 3. Instalar la nueva versión de Node

```bash
nvm install <nueva-version>
nvm use <nueva-version>
nvm alias default <nueva-version>
```

### 4. Instalar PM2 en la nueva versión de Node

Con nvm, cada versión de Node tiene sus propios paquetes globales. Hay que reinstalar PM2:

```bash
npm install -g pm2
```

### 5. Recargar el daemon de PM2

```bash
pm2 update
```

Este comando:

- Mata el daemon viejo (que seguía corriendo con la versión anterior de Node)
- Levanta uno nuevo con la nueva versión
- Restaura todos los procesos desde `dump.pm2`

Hay un pequeño downtime de segundos mientras reinicia los procesos.

### 6. Verificar

```bash
node -v      # debe mostrar la nueva versión
pm2 -v
pm2 list     # todos los servicios online
pm2 logs --lines 30
```

## Checklist resumido

```bash
pm2 save
cp ~/.pm2/dump.pm2 ~/.pm2/dump.pm2.backup
nvm install <nueva-version>
nvm use <nueva-version>
nvm alias default <nueva-version>
npm install -g pm2
pm2 update
pm2 list
```

## Si algo sale mal

Restaurar el dump anterior:

```bash
cp ~/.pm2/dump.pm2.backup ~/.pm2/dump.pm2
pm2 resurrect
```

O volver a la versión anterior de Node:

```bash
nvm use <version-anterior>
nvm alias default <version-anterior>
pm2 update
```

## Notas

- **Solo para updates minor/patch**. En un cambio major (ej: 20.x → 22.x) conviene además correr `npm rebuild` en cada proyecto con módulos nativos.
- Si después de reiniciar el servidor PM2 no levanta solo, hay que regenerar el startup script con la nueva versión activa:
  ```bash
  pm2 unstartup
  pm2 startup
  pm2 save
  ```
