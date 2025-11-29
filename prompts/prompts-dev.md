# Prompts Recomendados para Desarrollo

Estos prompts los podés usar en cualquier proyecto. Copialos y adaptalos a tu código.

---

## Code Review

```
Revisá este PR buscando:
- Memory leaks y problemas de performance
- Casos borde sin manejar
- Violaciones de principios SOLID
- Inconsistencias con el estilo del repo (adjunto style guide)
```

---

## Migración de Código

```
Migrá este componente de React 18 a React 19:
- Convertí useEffect innecesarios a server components donde corresponda
- Usá las nuevas APIs de React 19 (use, useOptimistic)
- Mantené funcionalidad exacta
- Explicá cada cambio importante
```

---

## Documentación

```
Generá documentación profesional para esta función:
- JSDoc completo (@param, @returns, @throws, @example)
- README con ejemplos de uso
- Diagrama de flujo en Mermaid
- Lista de edge cases cubiertos
```

---

## Optimización de Performance

```
Optimizá esta función O(n²):
- Reducir complejidad temporal a O(n) o O(n log n)
- Usar estructuras de datos apropiadas (Set, Map, WeakMap)
- Explicar la ganancia de performance
- Incluir benchmark comparativo simple
```

---

## Testing

```
Escribí tests para esta función:
- Unit tests con Jest/Vitest
- Casos de éxito y error
- Edge cases (null, undefined, arrays vacíos, valores límite)
- Mocks para dependencias externas
- Coverage mínimo 80%
- funciones core 100% , 80% en resto, 0% en infra
```

---

## Debugging

```
Este código tiene un bug: [describir el comportamiento inesperado]

Analizá:
1. Qué está pasando exactamente
2. Por qué ocurre el bug
3. Cómo solucionarlo
4. Cómo prevenir bugs similares en el futuro
```

---

## Refactoring General

```
Refactorizá este código aplicando:
1. Principios SOLID
2. Early returns para reducir nesting
3. Extracción de funciones pequeñas y reutilizables
4. Nombres descriptivos para variables y funciones
5. Manejo de errores robusto
6. TypeScript con tipos estrictos
```

---

## Seguridad

```
Revisá este código buscando vulnerabilidades:
- Inyección SQL/NoSQL
- XSS (Cross-Site Scripting)
- CSRF
- Exposición de datos sensibles
- Validación de inputs insuficiente
- Dependencias desactualizadas con CVEs conocidos
```

---

## API Design

```
Diseñá un endpoint REST para [funcionalidad]:
- Método HTTP correcto
- Path siguiendo convenciones REST
- Request body con validación
- Response con códigos HTTP apropiados
- Manejo de errores consistente
- Documentación OpenAPI/Swagger
```

---

## SQL / Queries

```
Optimizá esta query SQL:
- Reducir tiempo de ejecución
- Usar índices apropiados
- Evitar N+1 queries
- Explicar el plan de ejecución
- Sugerir índices a crear si es necesario
```

---

## Git / Commits

```
Generá un mensaje de commit para estos cambios siguiendo Conventional Commits:
- Tipo: feat/fix/refactor/docs/test/chore
- Scope opcional
- Descripción concisa en imperativo
- Body explicando el "por qué" si es necesario
- Breaking changes si aplica
```

---

## Arquitectura

```
Proponé una arquitectura para [sistema/feature]:
- Diagrama de componentes
- Flujo de datos
- Patrones de diseño a usar
- Consideraciones de escalabilidad
- Trade-offs de cada decisión
- Flujos y diagramas con MERMAID
```

### Validaciones

```
 Agrega validaciones robustas a esta función:
Reglas específicas:
 - Email: formato válido con regex, no vacío
 - Password: mínimo 8 caracteres, al menos 1 mayúscula, 1 número, 1 símbolo
 - Age: número entre 18 y 120
 - etc.

 Comportamiento:
 - Si falta: throw Error con mensaje descriptivo del problema exacto
 - Si pasa: proceder a guardar
```
