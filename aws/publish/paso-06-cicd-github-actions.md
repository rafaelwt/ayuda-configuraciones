# Paso 6: CI/CD con GitHub Actions

> Cada vez que hagas push a la rama `main`, GitHub Actions buildeará tu proyecto Angular, subirá los archivos a S3 y limpiará la caché de CloudFront automáticamente.

---

## 6.1 — Agregar Secrets en GitHub

1. Ir a tu repositorio en GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Clic en **New repository secret** y agregar estos 3 secrets:

| Name | Valor |
|------|-------|
| `AWS_ACCESS_KEY_ID` | El Access Key ID del usuario IAM creado en el Paso 2 |
| `AWS_SECRET_ACCESS_KEY` | El Secret Access Key del usuario IAM |
| `CF_DISTRIBUTION_ID` | El ID de tu distribución CloudFront (lo encontrás en la pestaña General de tu distribución) |

## 6.2 — Crear el Workflow

1. En tu repositorio, crear la carpeta `.github/workflows/` si no existe
2. Crear el archivo `deploy.yml` dentro de esa carpeta:

```yaml
name: Deploy Angular to S3

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build -- --configuration=production

      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to S3
        run: aws s3 sync dist/tu-proyecto/browser s3://tu-bucket --delete

      - name: Invalidate CloudFront cache
        run: aws cloudfront create-invalidation --distribution-id ${{ secrets.CF_DISTRIBUTION_ID }} --paths "/*"
```

> **Importante:** Ajustá `dist/tu-proyecto/browser` al path real que genera tu `ng build` y `s3://tu-bucket` al nombre de tu bucket.

## 6.3 — Hacer Push y Verificar

1. Hacer commit y push del archivo `deploy.yml` a la rama `main`
2. Ir a la pestaña **Actions** en tu repositorio de GitHub
3. Deberías ver el workflow ejecutándose
4. Cuando termine en verde, verificar que los cambios se reflejen en `https://tudominio.com`

> La invalidación de CloudFront puede tardar unos minutos en propagarse a todos los edge locations.

---

## ¿Cómo funciona?

```
Push a main → GitHub Actions → npm ci → ng build → S3 sync → CloudFront invalidation
```

Cada push a `main` despliega automáticamente. Si querés desplegar solo cuando se hace merge de un PR, cambiá el trigger del workflow.

---