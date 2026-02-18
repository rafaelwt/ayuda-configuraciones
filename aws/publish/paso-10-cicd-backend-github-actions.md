# Paso 10: CI/CD del Backend con GitHub Actions

> Cada vez que hagas push a la rama `main`, GitHub Actions buildeará tu API .NET, creará la imagen Docker, la subirá a ECR y App Runner desplegará automáticamente.

---

## 10.1 — Agregar Secrets en GitHub

1. Ir a tu repositorio del backend en GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Clic en **New repository secret** y agregar estos 3 secrets:

| Name | Valor |
|------|-------|
| `AWS_ACCESS_KEY_ID` | El Access Key ID de tu usuario IAM |
| `AWS_SECRET_ACCESS_KEY` | El Secret Access Key de tu usuario IAM |
| `ECR_REPOSITORY` | El URI de tu repositorio ECR (ej: `TU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/tu-nombre-api`) |

> El URI del repositorio ECR lo encontrás en **ECR** → tu repositorio → columna **URI**.

## 10.2 — Crear el Workflow

1. En tu repositorio, crear la carpeta `.github/workflows/` si no existe
2. Crear el archivo `deploy.yml`:

```yaml
name: Deploy API to ECR

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and Push Docker image
        run: |
          docker build -t tu-nombre-api .
          docker tag tu-nombre-api:latest ${{ secrets.ECR_REPOSITORY }}:latest
          docker push ${{ secrets.ECR_REPOSITORY }}:latest
```

> **Eso es todo.** App Runner detecta automáticamente la nueva imagen en ECR y despliega solo. No necesitás un paso extra para forzar el deploy.

## 10.3 — Hacer Push y Verificar

1. Hacer commit y push del archivo `deploy.yml` a la rama `main`
2. Ir a la pestaña **Actions** en GitHub y verificar que el workflow se ejecute correctamente
3. Cuando termine en verde, ir a **App Runner** y verificar que inicie un nuevo deploy automáticamente
4. Esperar a que el servicio vuelva a estado **Running**
5. Probar `https://tu-dominio.com/api/values`

---

## ¿Cómo funciona el flujo completo?

```
Push a main → GitHub Actions → Docker build → Push a ECR → App Runner detecta → Deploy automático
```

No necesitás invalidar caché ni hacer nada manual. Todo es automático.

---

## Resumen Final — Todo lo que se logró

```
https://tu-dominio.com
        │
   CloudFront (CDN + HTTPS + WAF)
        │
        ├── /* (default)  →  S3 (Angular SPA)
        │                     └── CI/CD: Push a main → GitHub Actions → S3 sync → CloudFront invalidation
        │
        └── api/*          →  App Runner (API .NET)
                               └── CI/CD: Push a main → GitHub Actions → ECR push → App Runner auto-deploy
```

