# Polling en Angular: guía por niveles

Cinco implementaciones del mismo dashboard de métricas, de la más ingenua a la más resiliente. Cada nivel vive en su propia rama y tiene su guía con el código completo.

## ¿Qué es el polling y cuándo usarlo?

**Polling** es cuando el cliente pregunta al servidor, cada cierto intervalo, si hay datos nuevos.

Casos típicos: dashboards y métricas casi en tiempo real, estado de procesamiento (pedidos, archivos), notificaciones simples.

| Técnica | Ventaja | Cuándo elegirla |
|---|---|---|
| Polling | Simple, funciona sobre HTTP normal, fácil de escalar y depurar | Datos que cambian cada varios segundos; no se requiere latencia mínima |
| SSE (Server-Sent Events) | El servidor empuja datos por una conexión unidireccional | Flujo de eventos del servidor al cliente |
| WebSockets | Comunicación bidireccional de baja latencia | Chat, juegos, colaboración en tiempo real. Puede ser excesivo para algo como el estado de un archivo |

## Niveles

| Nivel | Rama | Técnica | Problema que resuelve | Guía |
|---|---|---|---|---|
| 1 | `1-bad-polling` | `setInterval` + `subscribe` | Punto de partida: muestra los problemas (solapamiento, fuga de memoria, sin errores, detección de cambios global) | [01-bad-polling](./01-bad-polling.md) |
| 2 | `2-rxjs-polling` | `timer` + `switchMap` + `takeUntilDestroyed` | Cancela peticiones pendientes, evita fugas y declara el flujo | [02-rxjs-polling](./02-rxjs-polling.md) |
| 3 | `3-optimized-polling` | `runOutsideAngular` + `ngZone.run` | Una sola detección de cambios por dato nuevo (solo con Zone.js) | [03-optimized-polling](./03-optimized-polling.md) |
| 4 | `4-resource-polling` | `toSignal(interval)` + `httpResource` + `linkedSignal` | Menos código, cancelación automática, sin parpadeo, apto para zoneless | [04-resource-polling](./04-resource-polling.md) |
| 5 | `5-resilient-polling` | `rxResource` + `retry` con backoff + `catchError` | Resiliencia ante caídas del servidor | [05-resilient-polling](./05-resilient-polling.md) |

## Resumen rápido

| Herramienta | Para qué sirve |
|---|---|
| `timer(0, period)` | Emite de inmediato y luego cada `period` ms |
| `switchMap` | Cancela la petición pendiente cuando llega una nueva emisión |
| `exhaustMap` | Alternativa: ignora emisiones nuevas mientras haya una petición en vuelo |
| `takeUntilDestroyed()` | Cancela la suscripción al destruir el componente (necesita contexto de inyección o un `DestroyRef`) |
| `httpResource` | Petición HTTP reactiva basada en signals |
| `rxResource` | Recurso con `stream` de RxJS (`retry`, `catchError`, `timeout`...) |
| `linkedSignal` | Mantiene el valor anterior durante la recarga para evitar parpadeos |
| `runOutsideAngular` | Solo con Zone.js: evita que los ticks del temporizador disparen detección de cambios |
| `retry` con backoff | Reintentos con espera creciente para no saturar un servidor caído |

## ¿Qué nivel elegir?

- **Proyecto nuevo o Angular 19+ (o superior):** empieza en el **nivel 4**. Si el panel es crítico (finanzas, monitorización de producción), sube al **nivel 5**.
- **Código existente o migración gradual:** usa el **nivel 2**. Añade el **nivel 3** solo si la app usa Zone.js y notas el costo de la detección de cambios.
- **Nivel 1:** no lo uses; está para entender qué evitar.

## Preparar el repositorio

Requisitos: Node.js y npm.

```bash
git fetch origin
git switch <rama>          # por ejemplo: 4-resource-polling
npm install
npm run server             # terminal 1: API mock Express en http://localhost:3001
npm start                  # terminal 2: Angular en http://localhost:4200
```

- El servidor (`server/index.js`) expone `GET /api/metrics`. Admite `?delay=<ms>` para simular latencia (por ejemplo, `?delay=7000`).
- `src/environments/environment.ts` tiene `useBackend: true`: las peticiones van al servidor real y se ven en la pestaña **Network**. Con `false` se usa un interceptor mock sin necesidad del servidor.
- `main` contiene la base (UI compartida, API mock y dashboard sin implementar). Cada rama numerada añade la implementación de su nivel.
- Las guías se leen sin cambiar de rama: el código está copiado de cada una.

Nota: algunas ramas presentan detalles a revisar al ejecutarlas (por ejemplo, un `proxy.conf.json` referenciado pero ausente en las ramas 1 a 3). Cada guía los señala en su sección de notas.

## Créditos

Estas guías se basan en el contenido y el código de **DominiCode**:

- Video: [Polling en Angular](https://www.youtube.com/watch?v=rBOoCgY5fpc)
- Canal: [@DominiCode](https://www.youtube.com/@DominiCode)
- Repositorio original: [domini-code/ng_polling](https://github.com/domini-code/ng_polling)

---

[Empezar con el nivel 1 →](./01-bad-polling.md)
