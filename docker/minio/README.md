# MinIO para Producción

Este es un archivo docker-compose básico para ejecutar MinIO en un entorno de producción.

## Requisitos previos

- Docker y Docker Compose instalados en tu VPS
- Puertos 9000 y 9001 disponibles

## Iniciar MinIO

```bash
docker-compose up -d
```

## Acceso

- **API S3**: http://tu-ip-o-dominio:9000
- **Consola Web**: http://tu-ip-o-dominio:9001

## Credenciales por defecto

- **Usuario**: minioadmin
- **Contraseña**: minioadmin

⚠️ **IMPORTANTE**: Cambia las credenciales por defecto antes de exponer el servicio a internet.

## Configuración de seguridad recomendada

Para un entorno de producción, deberías:

1. Modificar las variables de entorno en el docker-compose.yml para cambiar el usuario y contraseña
2. Configurar TLS/SSL para conexiones seguras
3. Configurar un proxy inverso como Nginx
4. Implementar políticas de IAM

## Migración a AWS

Para una futura migración a AWS S3:
- MinIO es compatible con la API de S3, lo que facilita la migración
- Puedes usar herramientas como `mc` (MinIO Client) para mover datos de MinIO a AWS S3

## Persistencia de datos

Los datos y la configuración se almacenan en tu máquina local en las siguientes ubicaciones:

- **Datos**: `./minio/data/` (relativo al directorio del docker-compose.yml)
- **Configuración**: `./minio/config/` (relativo al directorio del docker-compose.yml)

Estas carpetas se crearán automáticamente cuando inicies el servicio.

Si deseas cambiar la ubicación, modifica las rutas en la sección `volumes:` del docker-compose.yml.