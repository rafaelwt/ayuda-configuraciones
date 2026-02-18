# Paso 8: Crear el Servicio en App Runner

> App Runner toma tu imagen Docker de ECR y la despliega automáticamente con balanceador de carga, auto-scaling y HTTPS incluidos.

---

## 8.1 — Acceder a App Runner

1. Ir a **App Runner** en la consola de AWS
2. Clic en **Create service**

## 8.2 — Configurar el Source

1. **Repository type:** seleccionar **Container registry**
2. **Provider:** seleccionar **Amazon ECR**
3. **Container image URI:** clic en **Browse** y seleccionar tu repositorio `tu-nombre-api` con tag `latest`
4. **Deployment trigger:** seleccionar **Automatic** (App Runner despliega automáticamente cuando detecta una nueva imagen en ECR)
5. **ECR access role:** seleccionar **Create new service role** (primera vez no hay roles existentes)
6. Clic en **Next**

## 8.3 — Configurar el Servicio

1. **Service name:** `tu-nombre-api`
2. **CPU:** 0.5 vCPU
3. **Memory:** 1 GB
4. **Port:** `8080`

### Variables de Entorno

Clic en **Add environment variable** y agregar las esenciales para que la API arranque:

| Key | Value |
|-----|-------|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__DefaultConnection` | `Server=tu-rds-endpoint;user id=tu_user;password=tu_password;Database=tu_base_de_datos;Ssl Mode=Require` |
| `ApiAuth__SecretKey` | tu clave JWT real (mínimo 32 caracteres) |
| `BasicAuth__Password` | tu password |
| `TZ` | `America/La_Paz` (tu zona horaria) |

> **Zona horaria:** La variable `TZ` define la zona horaria del contenedor. Por defecto es UTC. Cambiala según tu ubicación, por ejemplo: `America/Buenos_Aires`, `America/Mexico_City`, `America/Bogota`, `America/Santiago`, etc. Podés ver la lista completa de zonas válidas en [Wikipedia - List of tz database time zones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).

> En ASP.NET Core, los `__` (doble guión bajo) representan niveles de jerarquía en la configuración (equivale a `:` en appsettings.json). Podés agregar o modificar variables después, App Runner hace un redeploy automático.

### Auto Scaling

1. **Minimum instances:** `1`
2. **Maximum instances:** `4`
3. **Max concurrency:** `100` (requests por instancia antes de escalar)

### Health Check

1. **Protocol:** `TCP` (si no tenés endpoint `/health` en tu API)
2. **Timeout:** 5 seconds
3. **Interval:** 10 seconds

> Si agregaste `app.MapGet("/health", ...)` en tu código, cambiá Protocol a `HTTP` y Path a `/health`.

## 8.4 — Configurar Security

1. **Instance role:** dejarlo vacío por ahora
2. **AWS KMS key:** dejar **Use an AWS-owned key**
3. **WAF:** dejarlo desactivado

## 8.5 — Configurar Networking (Conexión a RDS)

Tu API necesita acceder al RDS que está en una VPC.

1. **Incoming network traffic:** dejar **Public endpoint**
2. **Outgoing network traffic:** cambiar a **Custom VPC**
3. Clic en **Add new** para crear un VPC Connector

### Crear VPC Connector

1. **VPC Connector name:** `vpc-connector-tu-nombre-api`
2. **VPC:** seleccionar la VPC donde está tu RDS
3. **Subnets:** seleccionar las subnets de tu RDS. Para encontrarlas:
   - Ir a **RDS** → menú lateral → **Subnet groups**
   - Ahí verás las subnets asociadas a tu instancia
   - Seleccionar al menos la subnet de la AZ donde está tu RDS, y 1 o 2 más para mayor disponibilidad
4. **Security group:** seleccionar el mismo security group de tu RDS
5. Clic en **Add**

> **Importante:** El security group del RDS debe permitir tráfico entrante en el puerto **5432** desde sí mismo. Si tenés una regla con source `sg-xxxxx` (el mismo SG), ya está cubierto.

## 8.6 — Observability

1. **Tracing with AWS X-Ray:** dejarlo desactivado
2. Clic en **Next**

## 8.7 — Review and Create

1. Revisar toda la configuración
2. Clic en **Create & deploy**
3. App Runner desplegará tu API. Esto tarda entre **3 y 10 minutos**
4. El estado cambiará de **Operation in progress** a **Running**

## 8.8 — Verificar el Deploy

App Runner asigna una URL automática con HTTPS:

```
https://xxxxx.us-east-1.awsapprunner.com
```

Probá accediendo a algún endpoint de tu API para verificar que funcione y conecte al RDS.

---

## Troubleshooting

**Si el servicio falla al arrancar:**
1. En App Runner, ir a la pestaña **Logs**
2. Revisar los **Application logs** para ver el error
3. Errores comunes:
   - `IDX10703: key length is zero` → Falta la variable `ApiAuth__SecretKey`
   - `Connection refused` → Verificar VPC Connector y security groups
   - Puerto incorrecto → Verificar que sea `8080`

**Si no conecta a RDS:**
1. Verificar que el VPC Connector use la misma VPC que el RDS
2. Verificar que las subnets incluyan la AZ donde está el RDS
3. Verificar que el security group del RDS permita tráfico en puerto 5432

**Variables de entorno:**
Podés agregar, modificar o eliminar variables en cualquier momento desde la configuración del servicio. App Runner hace un redeploy automático al guardar cambios.

---
