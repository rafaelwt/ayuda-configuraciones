# 🧹 Guía Completa de Limpieza y Reinicio de Contenedores Docker

Esta guía explica cómo detener, limpiar y reiniciar tu entorno Docker paso a paso.  
Ideal cuando el entorno presenta errores, consume demasiado espacio o necesita un reinicio completo.

---

## ⚠️ Advertencia

> ⚠️ **IMPORTANTE:** Estos comandos pueden **eliminar contenedores, imágenes y volúmenes**, lo que implica la pérdida de datos persistentes.  
> Antes de ejecutarlos en un entorno de producción, realiza una **copia de seguridad** de tus volúmenes y bases de datos.

---

## 🧩 1. Detener los contenedores activos

Detén todos los contenedores definidos en tu archivo `docker-compose.yml`:

```bash
docker-compose down
```

Esto:
- Detiene y elimina los contenedores creados por `docker-compose`.
- Mantiene los volúmenes e imágenes existentes.

Si deseas eliminar también los volúmenes y redes asociadas:

```bash
docker-compose down -v --remove-orphans
```

---

## 🗑️ 2. Eliminar todos los contenedores

Elimina **todos los contenedores** (en ejecución o detenidos):

```bash
docker rm -f $(docker ps -aq)
```

📘 **Explicación:**
- `docker ps -aq` lista todos los IDs de contenedores.
- `docker rm -f` los elimina de manera forzada.

---

## 💾 3. Eliminar todos los volúmenes

Elimina todos los **volúmenes locales** (almacenamiento persistente):

```bash
docker volume rm $(docker volume ls -q)
```

📘 **Nota:**  
Esto borrará los datos almacenados en los volúmenes (por ejemplo, bases de datos).  
Verifica primero los volúmenes existentes:

```bash
docker volume ls
```

---

## 🧼 4. Limpiar recursos no utilizados

Limpia imágenes, redes, caché de compilación y contenedores detenidos:

```bash
docker system prune -f
```

Para una limpieza completa (incluyendo volúmenes huérfanos):

```bash
docker system prune -a --volumes -f
```

📘 **Parámetros:**
- `-a`: elimina imágenes no utilizadas por ningún contenedor.
- `--volumes`: elimina volúmenes no usados.
- `-f`: evita la confirmación interactiva.

---

## 🚀 5. Reconstruir y reiniciar los contenedores

Una vez limpio el entorno, vuelve a construir y levantar los contenedores:

```bash
docker-compose up -d --build
```

Esto:
- Reconstruye las imágenes si hubo cambios en el Dockerfile.
- Levanta los servicios en segundo plano.

Verifica el estado de los contenedores activos:

```bash
docker ps
```

---

## 📊 6. (Opcional) Verificar el uso de espacio

Antes o después de la limpieza, puedes revisar cuánto espacio ocupa Docker:

```bash
docker system df
```

Esto mostrará el uso de espacio por contenedores, imágenes, volúmenes y caché.

---

## 💡 Recomendaciones finales

- Utiliza estos pasos principalmente en **entornos de desarrollo o pruebas**.  
- En **producción**, evita borrar volúmenes y revisa los nombres antes de ejecutar comandos masivos.
- Si solo necesitas reiniciar un servicio específico:
  ```bash
  docker-compose rm -f nombre_servicio
  docker-compose up -d nombre_servicio
  ```
- Si manejas múltiples proyectos, ejecuta los comandos desde el directorio correcto o especifica el archivo Compose:
  ```bash
  docker-compose -f /ruta/a/docker-compose.yml down
  ```

---

## ✅ Ejemplo de limpieza completa y reinicio rápido

```bash
docker-compose down -v --remove-orphans
docker rm -f $(docker ps -aq)
docker volume rm $(docker volume ls -q)
docker system prune -a --volumes -f
docker-compose up -d --build
```

---

## 🧠 Comando de limpieza rápida (versión segura)

Si solo deseas limpiar contenedores y caché sin borrar volúmenes:

```bash
docker-compose down
docker system prune -f
docker-compose up -d
```

---
