# Paso 1: Comprar el Dominio en Route 53

---

## 1.1 — Acceder a Route 53

1. Iniciar sesión en la [Consola de AWS](https://console.aws.amazon.com)
2. Buscar **Route 53** en la barra de búsqueda y seleccionarlo
3. Ir a **Registered domains** → **Register domains**

## 1.2 — Buscar y Seleccionar el Dominio

1. Escribir el nombre deseado (ej: `miapp`, `siatfactura`)
2. Seleccionar la extensión (`.com`, `.net`, `.io`, `.dev`, etc.)
3. Verificar disponibilidad
4. Seleccionar el dominio y clic en **Proceed to checkout**

> **Tip:** Elegí un nombre corto, fácil de recordar y sin caracteres especiales.

## 1.3 — Completar Datos de Contacto

1. Llenar nombre, dirección, email y teléfono del registrante
2. Dejar activado **Privacy Protection** (oculta tus datos del WHOIS)
3. Verificar que el email sea correcto

## 1.4 — Confirmar la Compra

1. Dejar activado **Auto-renew**
2. Revisar el resumen
3. Aceptar términos y clic en **Submit**

## 1.5 — Verificar el Registro

1. Revisar tu email y **confirmar** el enlace de verificación de AWS
2. Ir a **Route 53** → **Registered domains** y verificar estado **successful**
3. Ir a **Route 53** → **Hosted zones** y confirmar que se creó la zona automáticamente con los registros **NS** y **SOA**

> Estos registros NS y SOA se crean automáticamente. **No los modifiques ni elimines.**

---
