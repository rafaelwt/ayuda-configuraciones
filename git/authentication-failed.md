### Problemas de autenticación en Git

## Cambiar la URL del repositorio remoto

Si estás experimentando problemas de autenticación, puede ser útil cambiar la URL del repositorio remoto para usar HTTPS:

```bash
git remote set-url origin https://github.com/username/repositorio.git
```

> Reemplaza `username` y `repositorio` con tu nombre de usuario y nombre del repositorio.

## Gestión de credenciales

Git ofrece diferentes opciones para almacenar tus credenciales y evitar tener que introducirlas en cada operación:

### Almacenamiento temporal en memoria

Almacena las credenciales en memoria durante un tiempo limitado (por defecto 15 minutos):

```bash
git config --global credential.helper cache
```

Para cambiar el tiempo de caducidad (por ejemplo, a 3600 segundos = 1 hora):

```bash
git config --global credential.helper 'cache --timeout=3600'
```

### Almacenamiento permanente

Guarda las credenciales permanentemente en un archivo de texto plano:

```bash
git config --global credential.helper store
```

> **Nota de seguridad**: Este método almacena las credenciales en texto plano en `~/.git-credentials` (Linux/Mac) o en `%USERPROFILE%\.git-credentials` (Windows).

## Solución para tokens de acceso personal (GitHub)

Si GitHub rechaza tu contraseña, probablemente necesites usar un token de acceso personal:

1. Ve a GitHub → Settings → Developer settings → Personal access tokens
2. Genera un nuevo token con los permisos necesarios
3. Usa este token como contraseña cuando Git te solicite credenciales

## Verificar la configuración actual

Para ver qué método de almacenamiento de credenciales estás usando:

```bash
git config --global --get credential.helper
```