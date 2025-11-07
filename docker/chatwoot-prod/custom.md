# 🚀 Guía de Personalización de Chatwoot

Esta guía te ayudará a personalizar Chatwoot con tus propias funcionalidades y desplegarlo usando Docker.

---

## 📋 Prerrequisitos

- Docker y Docker Compose instalados
- Node.js y pnpm instalados
- Git instalado

---

## 🔧 Pasos de Configuración

### 1️⃣ **Clonar el Repositorio**
```bash
git clone https://github.com/chatwoot/chatwoot.git
```

### 2️⃣ **Navegar al Proyecto**
```bash
cd chatwoot
```

### 3️⃣ **Instalar Dependencias**
```bash
pnpm install
```

### 4️⃣ **Personalizar el Código**
> ⚠️ **Importante**: Realiza los cambios necesarios en el código para adaptarlo a tu nueva funcionalidad.

**📁 Ubicación del Frontend:**
```
app/javascript/
```

### 5️⃣ **Construir el Proyecto**
```bash
pnpm exec vite build
# El build se genera en el directorio /app/public
```

### 6️⃣ **Configurar Docker Compose**
Modifica el archivo `docker-compose.yaml` y actualiza la sección de volúmenes:

```yaml
volumes:
  - ./public:/app/public
```

### 7️⃣ **Reconstruir el Contenedor**
```bash
docker compose up -d --build
```

### 8️⃣ **Verificar la Construcción**
```bash
docker compose exec rails ls -la /app/public
```

### 9️⃣ **compilar dentro del contenedor**

```bash
# Prepara los assets para la consola SuperAdmin
docker compose exec <contenedor> SKIP_VITE_BUILD=true RAILS_ENV=production bundle exec rake assets:precompile
```

---

## ✅ Verificación Final

Si todo está correcto, deberías ver los archivos construidos en el directorio `/app/public` del contenedor.

---

## 🆘 Solución de Problemas

- **Error de permisos**: Asegúrate de que Docker tenga permisos para acceder al directorio
- **Error de construcción**: Verifica que todas las dependencias estén instaladas correctamente
- **Contenedor no inicia**: Revisa los logs con `docker compose logs`

---
