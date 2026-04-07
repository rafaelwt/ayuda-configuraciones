---
name: rest-api-design
description: >
  Guía de convenciones y buenas prácticas para diseñar, nombrar y revisar endpoints REST API.
  Usar este skill cada vez que el usuario pida diseñar endpoints, crear rutas REST, revisar
  la estructura de URIs, definir controladores con rutas HTTP, o cuando esté trabajando en
  la capa de API de cualquier proyecto (Spring Boot, .NET, Express, Laravel, etc.).
  También activar cuando el usuario mencione "endpoint", "ruta", "URI", "REST", "API naming",
  "resource naming", "versionado de API", o pida feedback sobre la estructura de sus URLs.
---

# REST API Design — Convenciones y Buenas Prácticas

Este skill proporciona reglas claras para nombrar y estructurar endpoints RESTful de forma
consistente, legible y mantenible. Aplicar estas reglas al diseñar nuevos endpoints o al
revisar endpoints existentes.

## Anatomía de un Endpoint

```
<protocol>://<host>:<port>/<app_context>/<version>/<resource>/<id>
```

| Componente     | Ejemplo           | Rol                                        |
|----------------|-------------------|---------------------------------------------|
| Protocol       | `https://`        | Esquema de comunicación                     |
| Host           | `api.example.com` | Dominio o IP                                |
| Port           | `443`             | Puerto (omitido si es el estándar)          |
| App Context    | `store`           | Contexto raíz de la aplicación              |
| Version        | `v1`              | Versión del API                             |
| Resource       | `items`           | Recurso (sustantivo, plural)                |
| ID / Parameter | `{item-id}`       | Identificador del recurso específico        |

**Orden obligatorio:** App Context → Version → Resource. No invertir version y app context.

## Reglas fundamentales

### 1. Sustantivos, nunca verbos

El método HTTP ya expresa la acción. La URI solo identifica el recurso.

```
# MAL
POST   /store/v1/createItems
GET    /store/v1/getEmployees/{id}
DELETE /store/v1/deleteOrders/{id}

# BIEN
POST   /store/v1/items
GET    /store/v1/employees/{id}
DELETE /store/v1/orders/{id}
```

### 2. Plural siempre (excepto singletons)

```
# MAL
/store/v1/item/{id}

# BIEN
/store/v1/items/{id}
/store/v1/employees/{id}/address     ← singleton: singular
```

Un singleton es un recurso donde lógicamente solo existe uno por padre (address, profile, config).

### 3. Guiones (`-`) para separar palabras

No usar underscores, camelCase ni palabras pegadas.

```
# MAL
/store/v1/vendormanagement
/store/v1/inventory_management
/store/v1/itemManagement

# BIEN
/store/v1/vendor-management
/store/v1/inventory-management
/store/v1/item-management
```

### 4. Barras para jerarquía, sin trailing slash

```
# MAL
/store/v1/items/

# BIEN
/store/v1/items
```

### 5. Sin extensiones de archivo en la URI

Negociar formato vía headers (`Accept`, `Content-Type`).

```
# MAL
/store/v1/items.json

# BIEN
/store/v1/items
```

### 6. Versionar siempre

Incluir versión en el path para permitir evolución sin romper clientes.

```
/store/v1/items/{id}
/store/v2/items/{id}     ← breaking changes
```

Estrategias alternativas (menos comunes): query param (`?version=1`), header (`X-API-Version: 1`),
content negotiation (`Accept: application/vnd.api.v1+json`).

### 7. Query params para filtrar, ordenar y paginar

No crear endpoints separados para variantes de consulta.

```
GET /store/v1/items?group=124
GET /store/v1/employees?department=IT&region=USA
GET /store/v1/orders?status=pending&sort=created_at&page=2&size=20
```

## Mapeo HTTP → CRUD

| Método  | Operación       | URI Ejemplo         |
|---------|-----------------|---------------------|
| GET     | Leer            | `/employees/{id}`   |
| POST    | Crear           | `/employees`        |
| PUT     | Reemplazar todo | `/employees/{id}`   |
| PATCH   | Actualizar parcial | `/employees/{id}`|
| DELETE  | Eliminar        | `/employees/{id}`   |

## Patrones comunes

### Búsquedas complejas

Cuando los filtros superan lo que query params puede expresar cómodamente, usar un
sub-recurso de búsqueda con POST:

```
# Simple → GET con query params
GET /store/v1/employees?department=IT&role=dev

# Complejo → POST /search
POST /store/v1/employees/search
{
  "department": "IT",
  "hire_date": { "from": "2023-01-01", "to": "2024-12-31" },
  "skills": ["java", "spring"],
  "sort": { "field": "name", "order": "asc" }
}
```

### Usuario autenticado en el path

```
# Alias "me" (recomendado para APIs públicas — GitHub, Google, Spotify lo usan)
GET /v1/users/me
GET /v1/users/me/orders

# Recurso singular (APIs de contexto único)
GET /v1/user/orders

# Implícito desde token JWT (sin path explícito)
GET /v1/orders          ← el backend filtra por el usuario del token
```

### Recursos anidados vs. planos

Anidar solo cuando hay relación directa padre-hijo. No anidar más de 2 niveles.

```
# BIEN — relación clara
GET /store/v1/employees/{emp-id}/addresses

# MAL — anidamiento excesivo
GET /store/v1/departments/{dept-id}/employees/{emp-id}/addresses/{addr-id}/history

# MEJOR — aplanar con IDs directos
GET /store/v1/addresses/{addr-id}/history
```

## Checklist de revisión

Al revisar endpoints existentes, verificar:

1. ¿Las URIs usan sustantivos en plural? (excepto singletons)
2. ¿No hay verbos CRUD en el path?
3. ¿Se usan guiones para separar palabras?
4. ¿No hay trailing slashes?
5. ¿No hay extensiones de archivo (.json, .xml)?
6. ¿La API está versionada?
7. ¿Los filtros van como query params (o POST /search si son complejos)?
8. ¿El orden es `/<app_context>/<version>/<resource>`?
9. ¿El anidamiento no supera 2 niveles?
10. ¿Los métodos HTTP corresponden a la operación correcta?
