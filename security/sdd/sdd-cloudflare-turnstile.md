# SDD — Integración Cloudflare Turnstile (Managed Mode)

> Spec-Driven Development: **spec** (requisitos verificables) → **plan** (decisiones técnicas) → **tasks** (unidades de trabajo con gates).
> El agente primero genera/valida la spec, y recién después implementa.
> Documento agnóstico al framework: aplica a cualquier stack frontend (SPA, SSR, MPA) y backend (Node, .NET, Java, PHP, Go, etc.).

---

## `/specify` — Especificación

### Contexto

Los formularios sensibles (registro, login, contacto) son vulnerables a bots.
Se integrará Cloudflare Turnstile en modo **managed** como capa anti-abuse.

### Requisitos (formato EARS)

#### FR-1: Renderizado del widget

- WHEN el usuario abre un formulario sensible, THE SYSTEM SHALL cargar el
  script oficial `https://challenges.cloudflare.com/turnstile/v0/api.js`
  y renderizar el widget Turnstile con una **site key configurable por entorno**.

#### FR-2: Gating del submit

- WHILE no exista un token válido emitido por el widget,
  THE SYSTEM SHALL mantener **deshabilitado** el envío del formulario.

#### FR-3: Token de un solo uso

- WHEN un envío se completa (éxito o error del backend),
  THE SYSTEM SHALL **resetear el widget**, ya que los tokens son single-use.

#### FR-4: Verificación server-side (fail-closed)

- WHEN el backend recibe un POST de un formulario protegido,
  THE SYSTEM SHALL verificar el token contra
  `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`
  **ANTES** de ejecutar cualquier lógica de negocio.
- IF la verificación falla, expira por timeout, hay error de red o la
  respuesta es inválida/malformada, THEN THE SYSTEM SHALL **rechazar la
  petición** (fail-closed, HTTP 403).

#### FR-5: Gestión de secretos

- THE SYSTEM SHALL leer la **secret key** desde variable de entorno
  (o el mecanismo de secretos propio del entorno de despliegue).
- THE SYSTEM SHALL NOT versionar la secret key en el repositorio.

#### NFR-1: Entorno de desarrollo

- En dev, THE SYSTEM SHALL usar las claves de prueba documentadas por Cloudflare:
  - Site key: `1x00000000000000000000AA`
  - Secret key: `1x0000000000000000000000000000000AA`
- Alternativa: incluir `localhost` en los hostnames del widget real.

### Criterios de aceptación

- [ ] Submit deshabilitado sin token; habilitado al resolverse el challenge.
- [ ] Reenvío tras un submit exitoso requiere resolver un **nuevo** challenge.
- [ ] Petición sin token o con token reutilizado → **403**.
- [ ] Timeout simulado de siteverify → **403** (nunca procesa el form).
- [ ] Búsqueda de la secret key en el repo **no arroja resultados**.
- [ ] Si existe CSP: `challenges.cloudflare.com` permitido en
      `script-src`, `frame-src` y `connect-src`.

### Restricciones / Notas

- **Site key y secret key funcionan en par**: mezclar claves de widgets
  distintos falla siempre la verificación.
- Fuera de alcance: rate limiting, WAF rules, otros CAPTCHAs.

---

## `/plan` — Decisiones técnicas (plantilla agnóstica)

> El agente completa esta tabla según el stack del proyecto. Las decisiones
> son de arquitectura, no de framework: cualquier stack debe poder cumplirlas.

| Área | Decisión (patrón) | Implementación concreta |
|---|---|---|
| Frontend | Componente/módulo reutilizable que encapsula el widget: carga lazy del script, expone el token al formulario, ofrece operación `reset()` | *(a definir por el agente según el stack)* |
| Backend | Middleware / filtro / guard / interceptor que intercepta los endpoints protegidos y verifica el token **antes** del handler; cliente HTTP con **timeout acotado** (p. ej. 5s) | *(a definir)* |
| Config frontend | Site key inyectada por entorno mediante el mecanismo de configuración del build (env vars, config file, etc.) | *(a definir)* |
| Config backend | Secret key vía variable de entorno; documentada en un template de config (p. ej. `.env.example`) **sin valor** | *(a definir)* |
| Errores | Cualquier fallo de verificación → 403 con cuerpo de error estructurado (recomendado: RFC 9457 problem details) | *(a definir)* |

---

## `/tasks` — Plan de trabajo

| # | Capa | Tarea | Gate |
|---|---|---|---|
| 1 | Frontend | Componente/módulo wrapper del widget + carga del script | Widget visible en dev |
| 2 | Frontend | Integrar en los 3 formularios con gating del submit | — |
| 3 | Frontend | Reset post-envío en éxito **y** error | — |
| 4 | Backend | Servicio/función de verificación siteverify con timeout | — |
| 5 | Backend | Interceptor fail-closed + tests (token inválido, timeout, reuse) | Tests en verde |
| 6 | Infra | Variables de entorno + CSP si aplica | Criterios de aceptación ✓ |

---

## Notas sobre el enfoque SDD

Los *gotchas* del prompt original ("los tokens son de un solo uso", "las claves
funcionan en par") se convierten en **requisitos verificables con criterios de
aceptación** — así el agente no puede "olvidarlos" a mitad de implementación,
porque el gate final los chequea explícitamente. El fail-closed deja de ser una
instrucción de estilo para ser un FR con casos de prueba concretos (timeout → 403).

La spec y las tasks son **estables entre stacks**: solo la columna
"Implementación concreta" del plan cambia según el proyecto. Esto permite
reutilizar el mismo documento en cualquier repo — el agente rellena el plan
en fase 2 según el framework detectado, y se aprueba en el phase gate.
