# Paso 4: Crear Certificado SSL en ACM

> **ACM (AWS Certificate Manager)** es el servicio de AWS que te permite generar certificados SSL gratuitos para usar con CloudFront y otros servicios.

---

## 4.1 — Cambiar a Región us-east-1

Esto es **obligatorio**. CloudFront solo acepta certificados creados en `us-east-1` (N. Virginia).

1. En la consola de AWS, verificar que la región seleccionada sea **US East (N. Virginia) us-east-1**

## 4.2 — Solicitar el Certificado

1. Ir a **Certificate Manager (ACM)**
2. Clic en **Request a certificate**
3. Seleccionar **Request a public certificate** → **Next**
4. En **Domain names**, agregar:
   - `tudominio.com`
   - `*.tudominio.com` (wildcard, cubre todos los subdominios como `www`, `api`, etc.)
5. **Validation method:** seleccionar **DNS validation**
6. Clic en **Request**

## 4.3 — Validar el Certificado con DNS

ACM necesita verificar que el dominio es tuyo. Como tu dominio está en Route 53, esto es muy simple:

1. Entrar al certificado recién creado (estado **Pending validation**)
2. En la sección **Domains**, clic en **Create records in Route 53**
3. Confirmar y clic en **Create records**
4. Esperar unos minutos hasta que el estado cambie a **Issued**

> La validación suele tardar entre 5 y 30 minutos. Si después de 30 minutos sigue en "Pending", verificá que los registros CNAME se hayan creado en tu Hosted Zone de Route 53.

---
