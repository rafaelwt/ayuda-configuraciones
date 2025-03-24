# Configuración de DocuSeal con PostgreSQL

Este documento describe cómo configurar DocuSeal para usar PostgreSQL como base de datos.

## Requisitos Previos

- Docker
- Docker Compose

## Configuración

### 1. Estructura del Proyecto

```
.
├── docker-compose.yml
└── docs/
    └── postgres.md
```

### 2. Configuración de Docker Compose

```yaml
services:
  app:
    image: docuseal/docuseal:latest
    ports:
      - 8050:3000
    volumes:
      - ./docuseal:/data/docuseal
    environment:
      - DATABASE_URL=postgresql://docuseal:docuseal@postgres:5432/docuseal
      - SECRET_KEY_BASE=0c2661c14e4e7d05b9526eeb13797282693ee756bbdac0171c13389a62bf3ddc155fcdcf477679ea99c210731d88f81dfbe6605f7fa782591c068171a5862642
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=docuseal
      - POSTGRES_PASSWORD=docuseal
      - POSTGRES_DB=docuseal
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
  pap-octane-network:
    external: true
    name: pap-network
```

## Variables de Entorno

### DocuSeal (app)
- `DATABASE_URL`: URL de conexión a PostgreSQL
  - Formato: `postgresql://usuario:contraseña@host:puerto/base_datos`
  - Ejemplo: `postgresql://docuseal:docuseal@postgres:5432/docuseal`
- `SECRET_KEY_BASE`: Clave secreta para la aplicación

### PostgreSQL
- `POSTGRES_USER`: Usuario de la base de datos
- `POSTGRES_PASSWORD`: Contraseña del usuario
- `POSTGRES_DB`: Nombre de la base de datos

## Iniciar los Servicios

```bash
docker-compose up -d
```

## Verificar la Instalación

1. Accede a DocuSeal en tu navegador: `http://localhost:8050`
2. Verifica que la aplicación se inicie correctamente
3. Los datos deberían persistir entre reinicios del contenedor

## Respaldo y Restauración

### Respaldo de la Base de Datos

```bash
docker-compose exec postgres pg_dump -U docuseal docuseal > backup.sql
```

### Restauración de la Base de Datos

```bash
docker-compose exec -T postgres psql -U docuseal docuseal < backup.sql
```

## Solución de Problemas

1. **Error de Conexión**
   - Verifica que PostgreSQL esté ejecutándose: `docker-compose ps`
   - Revisa los logs: `docker-compose logs postgres`

2. **Problemas de Persistencia**
   - Verifica que el volumen `postgres_data` se haya creado correctamente
   - Revisa los permisos del volumen

## Notas de Seguridad

- Cambia las contraseñas por defecto en un entorno de producción
- Considera usar variables de entorno para las credenciales sensibles
- Limita el acceso al puerto 5432 solo a los servicios necesarios

## Migración desde SQLite

Si estás migrando desde SQLite, asegúrate de:
1. Hacer un respaldo de tus datos actuales
2. Iniciar los nuevos servicios con PostgreSQL
3. Restaurar los datos si es necesario
