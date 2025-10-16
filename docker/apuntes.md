# Apuntes Docker

## Gestión de Imágenes

### Crear y Construir Imágenes
```bash
# Crear una imagen a partir de un Dockerfile
docker build --tag [nombreImagen]:[tagName] .

# Crear una imagen a partir de un archivo con otro nombre
docker build -t [NombreImagen] -f [nombreArchivo] .

# Convertir un contenedor en una imagen
docker commit [nombreContenedor] [nombreDeLaImagenResultante]
```

### Buscar y Gestionar Imágenes
```bash
# Buscar imágenes
docker images | grep [NombreImagen]

# Ver historia de la imagen
docker history -H [NombreImagen]

# Eliminar una imagen docker
docker rmi [NombreImagen]
docker images -q | xargs docker rmi
```

## Gestión de Contenedores

### Ejecutar Contenedores
```bash
# Correr una imagen
docker run -d --name [aliasName] [NombreImagen]      # -d para correr en background

# Sobreescribir el CMD al correr la imagen sin Dockerfile
docker run -d --name [aliasName] [NombreImagen] [ComandoCmd]   # ejm: python script.py

# Destruir contenedores automáticamente con --rm
docker run --rm -ti --name [aliasName] [NombreImagen]

# Variable de entorno desde el contenedor
docker run -dti -e "prueba=123" --name [NombreContenedor] [NombreImagen]     # -dti si es un sistema operativo, si no usar -d

# Limitar la memoria de un contenedor
docker run -d -m "500mb" --name [nombreContenedor] [NombreImagen]

# Limitar el CPU
docker run -d -m "1gb" --cpuset-cpus 0-1 --name [nombreContenedor] [NombreImagen]
```

### Acceder y Monitorear Contenedores
```bash
# Acceder a la terminal del contenedor
docker exec -ti [NombreContenedor] bash
docker exec -u root -ti [NombreContenedor] bash   # ingresar como usuario root

# Ver el log del contenedor
docker logs -f [NombreContenedor]

# Ver info e IP del contenedor
docker inspect [NombreContenedor]

# Ver cantidad de recursos que está usando un contenedor (memoria y CPU)
docker stats [NombreContenedor]
```

### Eliminar Contenedores
```bash
# Eliminar un contenedor específico
docker rm -fv [NombreImagen]

# Eliminar todos los contenedores
docker ps -q | xargs docker rm -f
docker ps -a -q | xargs docker rm -f
```

## Dockerfile

### Instrucciones Comunes
```dockerfile
# COPY y ADD (add agrega una url y descarga los datos)
COPY folder .

# ENV / WORKDIR / EXPOSE
ENV contenido prueba
RUN echo "$contenido" > /var/www/html/prueba.html

WORKDIR /var/www/html

EXPOSE 8080      # Para exponer un puerto

# LABEL / USER / VOLUME
LABEL version=1.0  # metadata de la imagen
```

## Transferencia de Archivos

```bash
# De la máquina host al contenedor
docker cp [rutaArchivoHost] [nombreContenedor]:/tmp         # /tmp -> rutaContainer

# Del contenedor a la máquina host
docker cp [nombreContenedor]:/tmp [rutaHost]          # /tmp -> rutaArchivo
```

## Volúmenes

### Tipos de Volúmenes
- Host
- Anónimos
- Named volumes

```bash
# Ver ruta de Docker info carpeta root
docker info | grep -i root

# Host - Guardar datos de base de datos MySQL en /opt/mysql en el host
docker run -d --name db -p 3306:3306 -e "MYSQL_ROOT=123" -v /opt/mysql:/var/lib/mysql

# Anónimo (crea un folder anónimo, no recomendable)
docker run -d --name db -p 3306:3306 -e "MYSQL_ROOT=123" -v /var/lib/mysql

# Ver volúmenes
docker volume ls

# Crear volumen
docker volume create [nombreVolumen]

# Asignar volumen a un contenedor
docker run -d --name db -p 3306:3306 -e "MYSQL_ROOT=123" -v [nombreVolumen]:/var/lib/mysql

# Eliminar volúmenes
docker rm -fv [nombreContenedor]
docker volume rm [nombreVolumen]

# Eliminar los volúmenes que no se estén usando o son dangling
docker volume ls -f dangling=true | xargs docker volume rm
```

## Redes

### Tipos de Redes
- Bridge
- Host
- None
- Overlay

```bash
# Ver redes en Docker
docker network ls

# Ver info e inspeccionar la red Docker
docker network inspect bridge

# Crear una red en Docker
docker network create test-network
docker network create -d bridge --subnet 172.124.10.0/24 --gateway 172.124.10.1 test-network

# Crear contenedor en una red distinta
docker run --network test-network

# Ping a otro contenedor de la misma red
docker exec [nombreContenedor] bash -c "ping 192.168.1.3"

# Ping por nombre en una red personalizada
docker exec [nombreContenedor] bash -c "ping nombreContenedorDestino"

# Conectar contenedores en diferentes redes
docker network connect [nombreRed] [nombreContenedor]

# Desconectar un contenedor de una red
docker network disconnect [nombreRed] [nombreContenedor]

# Eliminar una red (no debe tener contenedores conectados)
docker network rm [nombreRed]

# Asignar IP a un contenedor
docker run --network [nombreRed] --ip 192.168.1.2 -d --name [nombreContenedor] -ti centos
```

### Tipos Específicos de Redes

```bash
# Red Host - Asigna la misma red que la máquina al contenedor
docker run --network host -d --name test1 -ti centos

# Red None - Para crear un contenedor sin red
docker run --network none --name hola -ti centos
```

## Docker Compose

```bash
# Iniciar compose
docker-compose up -d

# Eliminar el container creado con Docker Compose
docker-compose down

# Crear docker-compose con otro nombre
docker-compose -p [nombreProyecto] -f docker-compose.yml up -d

# Usar nombre distinto en docker-compose -f
docker-compose -f [nombreDocker-compose].yml up -d

# Ver opciones Docker-Compose
docker-compose

# Ver log de Docker-Compose
docker-compose logs -f
```