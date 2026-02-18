# Paso 5: Crear la Distribución CloudFront

> CloudFront es el CDN de AWS. Es el punto de entrada único a tu aplicación: sirve el SPA con HTTPS, maneja las rutas de Angular y más adelante puede rutear al backend.

---

## Step 1 — Choose a Plan

1. Ir a **CloudFront** en la consola de AWS
2. Clic en **Create distribution**
3. Seleccionar **Free** ($0/month — 1M requests / 100GB)
4. Si más adelante necesitás más capacidad, podés subir de plan en cualquier momento
5. Clic en **Next**

## Step 2 — Get Started

1. **Distribution name:** nombre descriptivo (ej: `mi-spa-angular`)
2. **Description:** opcional, dejarlo vacío
3. **Distribution type:** dejar **Single website or app**
4. **Route 53 managed domain:** escribir tu dominio (ej: `tudominio.com`) y clic en **Check domain**
5. Clic en **Next**

## Step 3 — Specify Origin

1. **Origin type:** seleccionar **Amazon S3**
2. **S3 bucket:** seleccionar tu bucket de la lista
3. CloudFront configurará el acceso al bucket (OAC) y la bucket policy automáticamente
4. Clic en **Next**

## Step 4 — Enable Security

1. Dejar las opciones de seguridad por defecto
2. **Monitor mode:** dejarlo activado (solo observa tráfico sospechoso sin bloquearlo, cuando estés listo podés desactivarlo para que empiece a bloquear)
3. Clic en **Next**

## Step 5 — Get TLS Certificate

1. CloudFront provisiona el certificado TLS automáticamente para tu dominio de Route 53
2. Verificar que el dominio y certificado estén correctos
3. Clic en **Next**

## Step 6 — Review and Create

1. Revisar el resumen de la configuración
2. Clic en **Create distribution**
3. Esperar entre **5 y 15 minutos** hasta que el estado cambie de **Deploying** a **Enabled**

---

## Configuración Post-Creación

### Apuntar el Dominio a CloudFront

1. En la pestaña **General** de tu distribución, clic en **Route domains to CloudFront**
2. Esto crea automáticamente el registro DNS en Route 53

### Verificar Redirect HTTP → HTTPS

1. Ir a la pestaña **Behaviors**
2. Seleccionar el behavior default y clic en **Edit**
3. Verificar que **Viewer protocol policy** esté en **Redirect HTTP to HTTPS**
4. Si no lo está, cambiarlo y guardar

### Configurar SPA Routing (Error Pages)

Esto es **fundamental** para que las rutas de Angular funcionen (ej: `/dashboard`, `/login`). Sin esto, al refrescar una ruta con F5, CloudFront devuelve `AccessDenied` porque el archivo no existe en S3.

1. Ir a la pestaña **Error pages**
2. Clic en **Create custom error response**
3. Crear estas dos reglas:

**Regla 1:**
- HTTP error code: **403**
- Customize error response: **Yes**
- Response page path: `/index.html`
- HTTP response code: **200**

**Regla 2:**
- HTTP error code: **404**
- Customize error response: **Yes**
- Response page path: `/index.html`
- HTTP response code: **200**

---
