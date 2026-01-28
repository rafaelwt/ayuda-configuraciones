# Spring Initializr – Guía de Creación de Proyecto

Guía mínima y estandarizada para crear nuevos proyectos **Spring Boot** usando **Spring Initializr**, siguiendo convenciones profesionales de Java, Gradle/Maven y Spring.

URL oficial: https://start.spring.io/

---

## 1. Configuración Base del Proyecto

Seleccionar los siguientes valores en **Spring Initializr**:

| Campo | Valor recomendado | Notas |
|------|-------------------|------|
| **Project** | Gradle – Groovy | Build rápido y ampliamente adoptado. Maven también válido |
| **Language** | Java | Lenguaje principal |
| **Spring Boot** | 4.0.2 (estable) | Evitar SNAPSHOT/Milestone en producción |
| **Packaging** | Jar | Ejecutable standalone |
| **Java** | 21 (LTS) | Java 17 también válido si hay restricciones |
| **Configuration** | Properties | YAML si: múltiples perfiles o configuración jerárquica compleja |

---

## 2. Convención de Nombres

### Reglas generales

- **Artifact y Name**: kebab-case (`agente-backend`)
- **Group y Package**: puntos, minúsculas (`bo.empresa.agente`)
- **Nunca** usar guiones en paquetes Java

---

## 3. Reglas por Campo

| Campo | Permite guiones | Convención | Ejemplo válido | Ejemplo inválido |
|------|------------------|-----------|----------------|------------------|
| **Group** | ❌ No | Dominio inverso + producto | `bo.empresa.agente` | `bo.empresa-agente` |
| **Artifact** | ✅ Sí | kebab-case | `agente-backend` | `agente_backend` |
| **Name** | ✅ Sí | Igual al artifact | `agente-backend` | `AgenteBackend` |
| **Package name** | ❌ No | Segmentos semánticos con puntos | `bo.empresa.agente.backend` | `bo.empresa.agente-backend` |

---

## 4. Formato Recomendado

### Group
El `group` representa el namespace Maven/Gradle y debe ser suficientemente específico:

```
{dominio-inverso}.{producto}
```

Ejemplos:
- `bo.empresa.agente`
- `com.empresa.pagos`
- `org.ejemplo.facturacion`

---

### Package Name
El `package name` es el namespace Java raíz:

```
{group}.{componente}
```

Ejemplos:
- `bo.empresa.agente.backend`
- `com.empresa.pagos.api`
- `com.empresa.facturacion.worker`

Separar por puntos cuando los conceptos sean distintos.

---

## 5. Ejemplo Completo

```
Project:      Gradle – Groovy
Language:     Java
Spring Boot:  4.0.2
Java:         21
Packaging:    Jar
Configuration: Properties

Group:        bo.empresa.agente
Artifact:     agente-backend
Name:         agente-backend
Description:  Backend empresa Agente
Package name: bo.empresa.agente.backend
```

---

## 6. Resultado Esperado

```
agente-backend/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── bo/empresa/agente/backend/
│   │   │       └── AgenteBackendApplication.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│       └── java/
│           └── bo/empresa/agente/backend/
│               └── AgenteBackendApplicationTests.java
├── build.gradle
├── settings.gradle
└── gradle/
```

---

## 7. Errores Comunes

- ❌ Usar guiones en paquetes Java (`bo.empresa.agente-backend`)
- ❌ Usar mayúsculas en `group` o `package name` (`Bo.empresa.Agente`)
- ❌ Pegar palabras sin semántica clara (`bo.empresa.agentebackend`)
- ❌ Usar versiones SNAPSHOT en producción

---

## 8. Dependencias Base Recomendadas

Según el tipo de proyecto:

**API REST:**
- Spring Web
- Spring Boot DevTools (desarrollo)
- Lombok
- Validation

**Con Base de Datos:**
- Spring Data JPA
- Driver de BD (PostgreSQL, MySQL, etc.)
- Flyway o Liquibase (migraciones)

**Seguridad:**
- Spring Security
- Spring Boot OAuth2 Resource Server

---

## 9. Nota Final

- `artifact` y `name` → orientados a build y despliegue  
- `group` y `package name` → orientados a organización y arquitectura  

Definir correctamente estos valores desde el inicio evita refactors innecesarios.

---

**Versión actualizada**: Enero 2026 - Spring Boot 4.x
