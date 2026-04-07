# REST API — Naming Conventions y Buenas Prácticas

## Anatomía de un Endpoint RESTful

```
http://localhost:9999/restfulservices/v1/users/{id}
 ──┬──  ─────┬───── ─┬── ───────┬────── ─┬─ ──┬── ─┬──
    │         │       │          │         │    │    │
Protocol    Host    Port   App Context  Version │  Parameter
                                            Resource
```

| Componente         | Ejemplo            | Descripción                                      |
|--------------------|--------------------|--------------------------------------------------|
| **Protocol**       | `http://`          | Esquema de comunicación (`http`, `https`)         |
| **Host**           | `localhost`        | Nombre de dominio o IP del servidor               |
| **Port**           | `9999`             | Puerto de escucha del servicio                    |
| **App Context**    | `restfulservices`  | Contexto raíz de la aplicación                    |
| **Version**        | `v1`               | Versión del API                                   |
| **Resource**       | `users`            | Recurso al que se accede (sustantivo, plural)     |
| **Parameter**      | `{id}`             | Identificador del recurso específico              |

> **Estructura general:**  
> `<protocol>://<host>:<port>/<app_context>/<version>/<resource>/<id>`
>
> **Nota:** El app context va **antes** de la versión. Si la API no tiene app context explícito,
> se usa directamente `/<version>/<resource>/<id>`.

---

## 1. Usar sustantivos, NO verbos

El recurso principal en REST se llama **resource**. Las URIs deben nombrar recursos con sustantivos, nunca indicar operaciones CRUD.

### ❌ Mal

```
POST   /store/v1/CreateItems/{item-id}
GET    /store/v1/getEmployees/{emp-id}
PUT    /store/v1/update-prices/{price-id}
DELETE /store/v1/deleteOrders/{order-id}
```

### ✅ Bien

```
POST   /store/v1/items
GET    /store/v1/employees/{emp-id}
PUT    /store/v1/prices/{price-id}
DELETE /store/v1/orders/{order-id}
```

> El **método HTTP** ya indica la acción; el URI solo identifica el recurso.

---

## 2. Usar sustantivos en plural

Usar plural siempre, excepto para recursos **singleton** (un solo elemento lógico).

### ❌ Mal

```
/store/v1/item/{item-id}
/store/v1/employee/{emp-id}/address
```

### ✅ Bien

```
/store/v1/items/{item-id}
/store/v1/employees/{emp-id}/address    ← "address" es singleton, va en singular
```

---

## 3. Usar guiones (`-`) para legibilidad

No usar underscores (`_`), camelCase, ni palabras juntas. Los guiones mejoran la legibilidad en segmentos largos.

### ❌ Mal

```
/store/v1/vendormanagement/{vendor-id}
/store/v1/inventory_management
/store/v1/itemManagement/{item-id}/productType
```

### ✅ Bien

```
/store/v1/vendor-management/{vendor-id}
/store/v1/inventory-management
/store/v1/item-management/{item-id}/product-type
```

---

## 4. Barras (`/`) para jerarquía, sin barra final

Las barras indican relación jerárquica entre recursos. Nunca terminar con `/`.

### ❌ Mal

```
/store/v1/items/
```

### ✅ Bien

```
/store/v1/items
```

---

## 5. No usar extensiones de archivo

El formato de respuesta se negocia vía headers (`Accept`, `Content-Type`), no en la URI.

### ❌ Mal

```
/store/v1/items.json
/store/v1/products.xml
```

### ✅ Bien

```
/store/v1/items
/store/v1/products
```

> Usar el header `Accept: application/json` o `Accept: application/xml` en su lugar.

---

## 6. Versionar siempre las APIs

El versionado permite evolucionar la API sin romper clientes existentes.

```
/store/v1/items/{item-id}          ← versión original
/store/v2/employees/{emp-id}       ← breaking changes en v2
```

**Estrategias comunes de versionado:**

| Estrategia     | Ejemplo                                  |
|----------------|------------------------------------------|
| URI Path       | `/store/v1/items`                    |
| Query Param    | `/store/items?version=1`                 |
| Header         | `X-API-Version: 1`                       |
| Content-Type   | `Accept: application/vnd.api.v1+json`    |

> La más usada y visible es **URI Path** (`/v1/...`).

---

## 7. Query params para filtrar, ordenar y paginar

No crear endpoints adicionales. Usar query parameters sobre la colección existente.

```
GET /store/v1/items?group=124
GET /store/v1/employees?department=IT&region=USA
GET /store/v1/orders?status=pending&sort=created_at&page=2&size=20
```

---

## 8. Mapeo de métodos HTTP a operaciones CRUD

| Método   | Operación | URI Ejemplo              | Descripción                         |
|----------|-----------|--------------------------|-------------------------------------|
| `GET`    | Read      | `/employees/8345`        | Obtener empleado con id 8345        |
| `POST`   | Create    | `/employees`             | Crear un nuevo empleado             |
| `PUT`    | Update    | `/employees/8345`        | Actualizar empleado completo        |
| `PATCH`  | Partial   | `/employees/8345`        | Actualizar campos específicos       |
| `DELETE` | Delete    | `/employees/8345`        | Eliminar empleado con id 8345       |

---

## Observaciones de la comunidad

### ¿Búsquedas complejas con GET o POST?

`GET` es el estándar para consultas, pero tiene limitaciones:

- Los query strings tienen límite de longitud (~2048 caracteres en algunos navegadores/servidores).
- Criterios complejos con filtros anidados se vuelven difíciles de expresar.

**Opciones para búsquedas complejas:**

```
# Opción 1: GET con query params (simple)
GET /v1/employees?department=IT&region=USA&role=dev

# Opción 2: POST a un sub-recurso de búsqueda (complejo)
POST /v1/employees/search
Content-Type: application/json

{
  "department": "IT",
  "hire_date": { "from": "2023-01-01", "to": "2024-12-31" },
  "skills": ["java", "spring"],
  "sort": { "field": "name", "order": "asc" }
}
```

> `POST /search` no es puramente RESTful pero es un patrón ampliamente aceptado y práctico.

---

### ¿Cómo representar al usuario autenticado en el path?

Cuando necesitas acceder a los recursos del usuario logueado, hay varias convenciones:

```
# Opción 1: Alias "me" (más común y recomendada)
GET /v1/users/me
GET /v1/users/me/orders

# Opción 2: Recurso singular "user"
GET /v1/user
GET /v1/user/orders

# Opción 3: Resolver desde el token (sin path explícito)
GET /v1/profile          ← el backend resuelve el usuario desde el JWT
GET /v1/orders           ← filtra automáticamente por el usuario autenticado
```

**Regla de oro:**

| Enfoque     | Cuándo usarlo                                              |
|-------------|-------------------------------------------------------------|
| `/users/me` | APIs públicas donde los usuarios también pueden ver otros   |
| `/user`     | APIs donde solo existe contexto del propio usuario          |
| Desde token | Endpoints donde el contexto del usuario es implícito        |

> `/users/me` es la convención más extendida (GitHub, Google, Spotify la usan).
