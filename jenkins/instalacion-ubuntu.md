# Instalación de Jenkins en Ubuntu 24.04 - Guía Completa

## ¿Qué es Jenkins?

Jenkins es un servidor de automatización de código abierto y una de las herramientas CI/CD más populares. Se utiliza para automatizar tareas de desarrollo de software, como pruebas de cambios de código, empaquetado y despliegue en las diferentes etapas del SDLC (Software Development Life Cycle).

### Características Principales:
- **Automatización de Pipelines**: Define procesos CI/CD como código
- **Extensibilidad**: Soporta más de 1,500 plugins para varias integraciones (Git, Docker, Kubernetes)
- **Builds Distribuidos**: Ejecuta trabajos en múltiples máquinas para escalabilidad
- **Integración Fácil**: Funciona con numerosas herramientas y plataformas (Maven, Gradle, GitHub)
- **Interfaz Amigable**: UI web simple para gestión y monitoreo de trabajos
- **Soporte de Comunidad**: Actualizaciones regulares y documentación extensa

## Prerrequisitos

Antes de comenzar con la instalación, asegúrate de tener:
- Sistema Ubuntu 24.04 con al menos 1GB de RAM
- Privilegios de usuario root o sudo

## Instalación de Jenkins en Ubuntu 24.04

### Paso 1: Actualizar el Sistema

Es recomendable actualizar los paquetes del sistema antes de instalar nuevo software:

```bash
sudo apt update
sudo apt upgrade
```

Esto actualiza el índice de paquetes y luego instala nuevas versiones de todo lo instalado.

### Paso 2: Instalar Java

Jenkins requiere Java para funcionar. Jenkins soporta oficialmente **Java 11** y **Java 17**. Instalaremos **OpenJDK 17**, que es la versión recomendada para Ubuntu 24.04.

```bash
sudo apt install openjdk-17-jdk
```

Verificar la instalación:

```bash
java -version
```

Deberías ver una salida similar a:

```
openjdk version "17.0.x"
OpenJDK Runtime Environment (build 17.0.x+xx)
OpenJDK 64-Bit Server VM (build 17.0.x+xx, mixed mode)
```

### Paso 3: Agregar Repositorio de Jenkins

Importar la clave GPG de Jenkins:

```bash
sudo wget -O /usr/share/keyrings/jenkins-keyring.asc https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key
```

Agregar el repositorio de Jenkins a sources.list:

```bash
sudo sh -c 'echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian binary/ > /etc/apt/sources.list.d/jenkins.list'
```

### Paso 4: Instalar Jenkins

Jenkins no está disponible en los repositorios por defecto de Ubuntu, por lo que necesitamos usar el repositorio que acabamos de agregar.

Actualizar la lista de paquetes e instalar Jenkins:

```bash
sudo apt update
sudo apt install jenkins
```

Una vez instalado, Jenkins se iniciará automáticamente como servicio.

### Paso 5: Iniciar y Habilitar Jenkins

Iniciar Jenkins:

```bash
sudo systemctl start jenkins
```

Habilitar Jenkins para que se inicie automáticamente al arrancar:

```bash
sudo systemctl enable jenkins
```

Verificar el estado de Jenkins:

```bash
sudo systemctl status jenkins
```

Deberías ver una salida indicando que Jenkins está activo y ejecutándose.

### Paso 6: Configurar el Firewall

Jenkins se ejecuta en el puerto **8080** por defecto. Si tu servidor tiene un firewall integrado, debes permitir tráfico en este puerto.

Para usuarios de **UFW** (Uncomplicated Firewall):

```bash
sudo ufw allow 8080
sudo ufw reload
```

Si usas otro firewall como iptables, asegúrate de que permita tráfico en el puerto 8080.

Verificar el estado de UFW:

```bash
sudo ufw status
```

### Paso 7: Acceder a la Interfaz Web de Jenkins

Jenkins está ahora instalado y ejecutándose en tu servidor. Para completar la configuración, accede a la interfaz web de Jenkins:

```
http://tu-ip-del-servidor:8080
```

Si ejecutas Jenkins localmente:

```
http://localhost:8080
```

### Paso 8: Configurar Jenkins

En el primer acceso a Jenkins, te pedirá una contraseña de administrador inicial. Para obtener esta contraseña, ejecuta:

```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Verás una cadena larga de caracteres. Copia esta contraseña y pégala en la pantalla de configuración de Jenkins.

Después de ingresar la contraseña inicial, Jenkins te llevará a la página **Personalizar Jenkins**. Aquí se te pedirá instalar plugins. Se recomienda instalar los plugins sugeridos para la funcionalidad básica de Jenkins.

Haz clic en **Instalar plugins sugeridos** para comenzar el proceso.

Jenkins instalará automáticamente los plugins más comúnmente utilizados, lo que puede tomar unos minutos dependiendo de la velocidad de tu servidor.

### Paso 9: Crear el Primer Usuario Administrador

Una vez que los plugins estén instalados, Jenkins te pedirá **crear el primer usuario administrador**. Completa los campos requeridos:

- **Usuario**: Nombre de usuario para la cuenta de administrador
- **Contraseña**: Contraseña segura
- **Confirmar contraseña**: Repetir la contraseña
- **Nombre completo**: Nombre completo del usuario
- **Dirección de correo electrónico**: Email del usuario

Esta cuenta servirá como usuario administrador de Jenkins.

Después de crear el usuario, haz clic en **Guardar y Finalizar**.

¡Has instalado exitosamente Jenkins en Ubuntu 24.04!

## Creación de un Pipeline Simple con Jenkins

Crear tu primer pipeline básico en Jenkins es una excelente manera de comenzar con la automatización. Un pipeline de Jenkins define los pasos de tu proceso CI/CD como código, que puede ser controlado por versiones y reutilizado fácilmente.

### Pasos para Crear un Pipeline Básico:

1. **Crear Nuevo Item**: En tu dashboard de Jenkins, haz clic en "Nuevo Item"

2. **Configurar el Job**:
   - Nombra tu trabajo (ej: "Demo")
   - Selecciona "Pipeline" como tipo de proyecto
   - Haz clic en "OK"

3. **Configurar el Pipeline**:
   - Desplázate hacia abajo hasta la sección Pipeline
   - En el dropdown "Definition", selecciona "Pipeline script"
   - En el cuadro de texto que aparece, ingresa un script de pipeline básico

### Ejemplo de Pipeline Básico:

```groovy
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                echo 'Building...'
            }
        }
        stage('Test') {
            steps {
                echo 'Testing...'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying...'
            }
        }
    }
}
```

### Explicación del Pipeline:

- **pipeline {}**: Define todo el pipeline
- **agent any**: Ejecuta el pipeline en cualquier agente de Jenkins disponible
- **stages {}**: Lista las etapas del pipeline
- **stage('Build')**, **stage('Test')**, **stage('Deploy')**: Define etapas individuales para construir, probar y desplegar
- **steps {}**: Las acciones reales que ocurren dentro de cada etapa (en este caso, declaraciones echo simples)

### Ejecutar el Pipeline:

1. Una vez que hayas escrito el script del pipeline, haz clic en **Guardar**
2. En el dashboard del trabajo, haz clic en **Build Now** para ejecutar el pipeline
3. Puedes ver el progreso en la sección "Build History" a la izquierda
4. Haz clic en el número de build para ver la **salida de consola** y verificar el resultado de cada etapa

### Visualización del Pipeline:

Después de que el build esté completo, haz clic en el número de build y luego en "Pipeline Steps" o "Pipeline Graph".

Jenkins representará visualmente el pipeline, mostrando cada etapa y si pasó o falló.

## Comandos Útiles de Jenkins

### Gestión del Servicio:

```bash
# Iniciar Jenkins
sudo systemctl start jenkins

# Detener Jenkins
sudo systemctl stop jenkins

# Reiniciar Jenkins
sudo systemctl restart jenkins

# Ver estado de Jenkins
sudo systemctl status jenkins

# Habilitar inicio automático
sudo systemctl enable jenkins

# Deshabilitar inicio automático
sudo systemctl disable jenkins
```

### Logs de Jenkins:

```bash
# Ver logs en tiempo real
sudo journalctl -u jenkins -f

# Ver logs recientes
sudo journalctl -u jenkins --since "1 hour ago"
```

### Configuración de Jenkins:

```bash
# Directorio de configuración
/var/lib/jenkins/

# Archivo de configuración principal
/var/lib/jenkins/config.xml

# Directorio de plugins
/var/lib/jenkins/plugins/

# Directorio de trabajos
/var/lib/jenkins/jobs/
```

## Solución de Problemas Comunes

### Jenkins no inicia:

1. Verificar que Java esté instalado correctamente:
   ```bash
   java -version
   ```

2. Verificar los logs de Jenkins:
   ```bash
   sudo journalctl -u jenkins -f
   ```

3. Verificar que el puerto 8080 esté disponible:
   ```bash
   sudo netstat -tlnp | grep 8080
   ```

### Problemas de Firewall:

Si no puedes acceder a Jenkins desde el navegador:

1. Verificar que el firewall permita el puerto 8080:
   ```bash
   sudo ufw status
   ```

2. Si es necesario, abrir el puerto:
   ```bash
   sudo ufw allow 8080
   ```

### Problemas de Permisos:

Si Jenkins no puede escribir en su directorio:

```bash
sudo chown -R jenkins:jenkins /var/lib/jenkins
sudo chmod 755 /var/lib/jenkins
```

---

**Referencias:**
- [Guía oficial de instalación de Jenkins](https://www.cherryservers.com/blog/install-jenkins-ubuntu)
- [Documentación oficial de Jenkins](https://www.jenkins.io/doc/)
