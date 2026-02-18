# Extra: Configurar www.tudominio.com

> Hacer que `www.tu-dominio.com` funcione y apunte al mismo sitio que `tu-dominio.com`.

---

## Paso 1 — Agregar CNAME en CloudFront

1. Ir a **CloudFront** → seleccionar tu distribución
2. Pestaña **General** → **Settings** → **Edit**
3. En **Alternate domain names (CNAME)**, clic en **Add item**
4. Agregar `www.tu-dominio.com`
5. Guardar cambios

## Paso 2 — Crear Registro en Route 53

1. Ir a **Route 53** → **Hosted zones**
2. Seleccionar la zona **tu-dominio.com** y clic en **View details**
3. Clic en **Create record**
4. Configurar:
   - **Record name:** `www`
   - **Record type:** `A`
   - Activar **Alias**
   - **Route traffic to:** Alias to CloudFront distribution
   - Seleccionar tu distribución
5. Clic en **Create records**

## Paso 3 — Verificar

Esperar unos minutos y probar:

```
https://www.tu-dominio.com
```

Debería mostrar el mismo sitio que `https://tu-dominio.com`.

---
