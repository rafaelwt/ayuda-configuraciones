# Paso 9: Conectar CloudFront `/api/*` a App Runner

> Configurar CloudFront para que las rutas `/api/*` se dirijan a tu API en App Runner, manteniendo un solo dominio para frontend y backend.

---

## 9.1 — Obtener el Dominio de App Runner

1. Ir a **App Runner** → seleccionar tu servicio `tu-nombre-api`
2. Copiar el **Default domain** (ej: `xxxxx.us-east-1.awsapprunner.com`)

## 9.2 — Agregar App Runner como Origin en CloudFront

1. Ir a **CloudFront** → seleccionar tu distribución
2. Ir a la pestaña **Origins**
3. Clic en **Create origin**
4. **Origin domain:** pegar el dominio de App Runner (`xxxxx.us-east-1.awsapprunner.com`)
5. **Protocol:** HTTPS only
6. **HTTPS port:** 443
7. **Name:** `origin-tu-nombre-api` (se autocompleta, podés dejarlo o cambiarlo)
8. Dejar el resto por defecto
9. Clic en **Create origin**

## 9.3 — Crear Behavior para `/api/*`

1. Ir a la pestaña **Behaviors**
2. Clic en **Create behavior**
3. Configurar:
   - **Path pattern:** `api/*`
   - **Origin:** seleccionar `origin-tu-nombre-api` (el que acabás de crear)
   - **Viewer protocol policy:** Redirect HTTP to HTTPS
   - **Allowed HTTP methods:** GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
   - **Cache policy:** `CachingDisabled` (no querés cachear respuestas del API)
   - **Origin request policy:** `AllViewerExceptHostHeader`
4. Clic en **Create behavior**

> **Importante:** El path pattern es `api/*` (sin `/` al inicio). CloudFront reenvía el path completo al origin, así que tu API recibe `/api/values` tal cual.

> **Origin request policy `AllViewerExceptHostHeader`:** Esto reenvía todos los headers del cliente (Authorization, Content-Type, etc.) al backend, excepto el Host header que se reemplaza por el dominio de App Runner. Sin esto, los headers de autenticación JWT no llegan a tu API.

## 9.4 — Esperar la Propagación

Los cambios en CloudFront tardan entre **5 y 15 minutos** en propagarse.

## 9.5 — Verificar

Probar accediendo a tu API a través de CloudFront:

```
https://tu-dominio.com/api/values
```

Deberías ver la misma respuesta que obtenés accediendo directo por App Runner.

---

## ¿Cómo queda la arquitectura?

```
https://tu-dominio.com
        │
   CloudFront
        │
        ├── /* (default)  →  S3 (Angular SPA)
        └── api/*          →  App Runner (API .NET)
```

Un solo dominio, sin CORS, HTTPS en todo.

---

## Troubleshooting

**Error 502 Bad Gateway:**
- Verificar que el origin domain de App Runner sea correcto
- Verificar que el protocolo sea HTTPS only

**Error 403:**
- Verificar que el path pattern sea `api/*` (sin `/` al inicio)

**Headers de Authorization no llegan:**
- Verificar que la Origin request policy sea `AllViewerExceptHostHeader`

**Respuestas cacheadas (datos viejos):**
- Verificar que la Cache policy sea `CachingDisabled`

---

