---
name: secure-code-review
description: >
  Realiza una revisión de seguridad de código basada en estándares internacionales
  (OWASP ASVS, OWASP MASVS, OWASP Top Ten Proactive Controls, OWASP Secure Coding
  Practices, NIST SSDF SP 800-218, y PCI DSS cuando aplica). Actívala al revisar,
  auditar o escribir código que involucre autenticación, autorización, manejo de
  sesiones, validación de entradas, criptografía, almacenamiento o transmisión de
  datos sensibles, manejo de secretos/credenciales, pagos con tarjeta, o cualquier
  superficie expuesta (APIs, formularios, endpoints). También úsala cuando el usuario
  pida una "security review", "revisión de seguridad", "audit", "pentest de código",
  o cuando deba documentar/justificar el procedimiento de desarrollo seguro para un
  cuestionario o auditoría de cumplimiento.
---

# Revisión de Código Seguro (Secure Code Review)

## Propósito

Esta skill define el **procedimiento de desarrollo seguro** del equipo. Sirve para dos
cosas:

1. **Operar**: revisar código contra controles de seguridad reconocidos antes de hacer
   merge a producción.
2. **Documentar**: este archivo es evidencia auditable de que el equipo sigue un
   procedimiento de desarrollo seguro basado en estándares internacionales. Es la
   respuesta directa a preguntas de cuestionarios del tipo *"¿Se cuenta con un
   procedimiento de desarrollo seguro basado en estándares y buenas prácticas
   internacionales? Mencionar cuáles."*

## Estándares de referencia

El procedimiento se basa en:

- **OWASP ASVS** (Application Security Verification Standard) — apps web/API.
- **OWASP MASVS** (Mobile Application Security Verification Standard) — apps móviles.
- **OWASP Top Ten Proactive Controls** — controles que el desarrollador siempre debe aplicar.
- **OWASP Secure Coding Practices** — guía de codificación segura.
- **NIST SSDF (SP 800-218)** — marco de ciclo de vida de desarrollo seguro.
- **PCI DSS** — SOLO si la app procesa, almacena o transmite datos de tarjetas de pago.

> Ajusta esta lista a tu app real. Si NO manejas pagos con tarjeta, elimina PCI DSS.
> Si la app es solo web, MASVS no aplica; si es solo móvil, ASVS aplica parcialmente.

---

## Procedimiento de revisión

Al revisar un cambio o módulo, evalúa SIEMPRE estas categorías en orden. Para cada
hallazgo reporta: **categoría, severidad (Crítica/Alta/Media/Baja), archivo:línea,
evidencia, recomendación y control mapeado** (ej. "ASVS V2.1", "Proactive Control C5").

### 1. Validación de entradas (OWASP C5, ASVS V5)
- Toda entrada externa (usuario, API, archivos, parámetros) se valida con allow-list,
  no deny-list.
- Validación en servidor, nunca solo en cliente.
- Límites de tamaño/tipo/rango aplicados.

### 2. Codificación de salida y prevención de inyección (OWASP C4, ASVS V5)
- SQL/NoSQL: consultas parametrizadas o ORM; NUNCA concatenación de strings.
- XSS: codificación contextual en HTML/JS/atributos; CSP configurada.
- Inyección de comandos/LDAP/XML evitada; sin `eval` ni ejecución dinámica de input.

### 3. Autenticación (OWASP C6, ASVS V2, MASVS-AUTH)
- Contraseñas con hashing fuerte (bcrypt/scrypt/argon2), nunca texto plano ni MD5/SHA1.
- MFA disponible para cuentas sensibles.
- Sin credenciales por defecto ni hardcodeadas.
- Bloqueo/rate limiting ante fuerza bruta.

### 4. Gestión de sesiones (ASVS V3)
- Tokens/cookies con `HttpOnly`, `Secure`, `SameSite`.
- Expiración e invalidación correcta en logout.
- Regeneración de ID de sesión tras login.

### 5. Control de acceso / Autorización (OWASP C7, ASVS V4)
- Autorización verificada en servidor en CADA petición (no confiar en el cliente/UI).
- Sin IDOR: verificar que el usuario es dueño del recurso que solicita.
- Principio de mínimo privilegio.

### 6. Criptografía y datos sensibles (OWASP C8, ASVS V6/V9, MASVS-CRYPTO/STORAGE)
- TLS en tránsito; sin protocolos/cifrados obsoletos.
- Cifrado en reposo para datos sensibles.
- Algoritmos estándar; sin cripto casera.
- Sin datos sensibles en logs, URLs ni caché.

### 7. Manejo de secretos (NIST SSDF PW.4/PS.1)
- Sin API keys, tokens ni contraseñas en el código o el repo.
- Uso de gestor de secretos / variables de entorno.
- Revisar historial de git por secretos filtrados.

### 8. Manejo de errores y logging (OWASP C10, ASVS V7)
- Sin stack traces ni detalles internos expuestos al usuario.
- Logging de eventos de seguridad (sin datos sensibles en los logs).

### 9. Dependencias y configuración (NIST SSDF PW.4, ASVS V14)
- Dependencias sin vulnerabilidades conocidas (SCA: `npm audit`, `pip-audit`, etc.).
- Sin configuraciones inseguras por defecto; debug desactivado en prod.
- Headers de seguridad presentes (CSP, HSTS, X-Content-Type-Options).

### 10. PCI DSS (SOLO si hay datos de tarjeta)
- No se almacena CVV/CVC en ningún caso.
- PAN cifrado/tokenizado; nunca en logs.
- Segmentación del entorno de datos de tarjeta (CDE).

---

## Formato del reporte

Entrega siempre:

1. **Resumen ejecutivo**: nº de hallazgos por severidad y veredicto (apto/no apto para merge).
2. **Tabla de hallazgos**: severidad · ubicación · descripción · control mapeado · recomendación.
3. **Mapeo de cumplimiento**: qué estándares se verificaron y resultado.

Bloquea el merge si existe cualquier hallazgo **Crítico o Alto** sin mitigar.

## Referencias oficiales

- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
- OWASP MASVS: https://mas.owasp.org/MASVS/
- OWASP Proactive Controls: https://owasp.org/www-project-proactive-controls/
- OWASP Secure Coding Practices: https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/
- NIST SSDF SP 800-218: https://csrc.nist.gov/pubs/sp/800/218/final
- PCI DSS: https://www.pcisecuritystandards.org/
