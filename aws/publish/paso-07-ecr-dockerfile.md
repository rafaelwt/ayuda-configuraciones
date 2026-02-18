# Paso 7: Crear el ECR y Dockerfile para la API .NET

> **ECR (Elastic Container Registry)** es el Docker Hub privado de AWS. Acá subís las imágenes Docker de tu API y App Runner las toma para desplegar.

---

## 7.1 — Crear el Repositorio en ECR

1. Ir a **ECR (Elastic Container Registry)** en la consola de AWS
2. Clic en **Create repository**
3. **Visibility:** Private
4. **Repository name:** `tu-nombre-api` (ej: `mi-api-backend`)
5. Dejar el resto por defecto
6. Clic en **Create repository**
7. Copiar el **URI** del repositorio, lo vas a necesitar (tiene el formato: `TU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/tu-nombre-api`)

> Si tenés 2 APIs (web + mobile), creá un repositorio para cada una. Por ahora empezamos con una.

## 7.2 — Crear el Dockerfile

Crear un archivo `Dockerfile` en la raíz de tu proyecto .NET:

```dockerfile
# --- Build stage ---
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copiar csproj y restaurar dependencias
COPY *.csproj ./
RUN dotnet restore

# Copiar todo y publicar
COPY . ./
RUN dotnet publish -c Release -o /app/publish

# --- Runtime stage ---
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

# Puerto que expone la API
EXPOSE 8080

# Variable de entorno para ASP.NET Core
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "tu-nombre-proyecto.dll"]
```

> **Nota:** Reemplazá `tu-nombre-proyecto.dll` con el nombre real del assembly de tu proyecto. Podés verificarlo en el archivo `.csproj` en la propiedad `<AssemblyName>` o es el nombre del proyecto por defecto.

## 7.3 — Crear el .dockerignore

Crear un archivo `.dockerignore` en la raíz del proyecto:

```
bin/
obj/
.env
logs/
.git/
.vs/
*.md
```

## 7.4 — Probar el Build Local (Opcional)

Si tenés Docker instalado localmente, probá que el build funcione:

```bash
docker build -t tu-nombre-api .
docker run -p 8080:8080 tu-nombre-api
```

Verificar accediendo a `http://localhost:8080/health`

## 7.5 — Agregar Permisos de ECR al Usuario IAM

Tu usuario IAM necesita permisos para subir imágenes a ECR:

1. Ir a **IAM** → **Users** → seleccionar tu usuario
2. Pestaña **Permissions** → **Add permissions** → **Attach policies directly**
3. Buscar y agregar: **`AmazonEC2ContainerRegistryFullAccess`**
4. Guardar

## 7.6 — Subir la Imagen a ECR

### Obtener tu Account ID

```bash
aws sts get-caller-identity
```

El valor de **Account** en la respuesta es tu Account ID. También lo podés ver en el URI del repositorio ECR que creaste:

```
TU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/tu-nombre-api
└──────────┘
 Account ID
```

### Login en ECR

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin TU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

No necesitás usuario ni password. El comando genera un token temporal con las credenciales de tu AWS CLI. Debería responder **"Login Succeeded"**.

### Build, Tag y Push

```bash
# Build
docker build -t tu-nombre-api .

# Tag con el URI de ECR
docker tag tu-nombre-api:latest TU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/tu-nombre-api:latest

# Push
docker push TU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/tu-nombre-api:latest
```

## 7.7 — Verificar en ECR

1. Ir a **ECR** en la consola de AWS
2. Entrar al repositorio `tu-nombre-api`
3. Deberías ver la imagen con tag `latest` subida

---

