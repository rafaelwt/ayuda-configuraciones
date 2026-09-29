# Nivel 5: Polling resiliente con `rxResource` y backoff exponencial

> Resumen: `rxResource` permite usar operadores de RxJS en el loader. Con `retry` con espera exponencial y `catchError` con valor de reserva, el polling sobrevive a caídas del servidor.
>
> Rama: `origin/5-resilient-polling`

## El problema

El [nivel 4](./04-resource-polling.md) simplifica el polling, pero ante un fallo no reintenta ni informa al usuario. En un panel crítico (monitorización, sistemas financieros) eso no basta. Este nivel añade:

- **`rxResource`:** igual que `httpResource`, pero el `stream` devuelve un `Observable`, así que se pueden aplicar operadores de RxJS.
- **`retry` con backoff exponencial:** en vez de reintentar de inmediato (lo que agrava la carga de un servidor caído), espera cada vez más entre intentos, con un máximo de reintentos.
- **`catchError` con valor de reserva:** el flujo del recurso no termina en error y el polling sigue vivo para el ciclo siguiente.
- **Estados de error en la interfaz** (`hasError`) y `linkedSignal` contra el parpadeo.
- Los estilos por estado pasan a constantes y `computed`.

## Código completo

### `src/app/pages/dashboard/dashboard.ts`

```ts
import { DatePipe, DecimalPipe, UpperCasePipe } from '@angular/common';
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { catchError, interval, of, retry, timer } from 'rxjs';
import { ServerMetrics } from '../../models/server-metrics';
import { MetricsService } from '../../services/metrics.service';

/** Clases CSS por estado para badge y dot (evita repetir lógica y mejora tree-shaking). */
const STATUS_BADGE_CLASS: Record<ServerMetrics['status'] | 'unknown', string> = {
  healthy: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  degraded: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  critical: 'bg-red-500/10 text-red-400 border border-red-500/20',
  unknown: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
};
const STATUS_DOT_CLASS: Record<ServerMetrics['status'] | 'unknown', string> = {
  healthy: 'bg-emerald-400',
  degraded: 'bg-amber-400',
  critical: 'bg-red-400',
  unknown: 'bg-gray-400',
};

/**
 * 🛡️ NIVEL EXPERTO: Resiliencia con rxResource + Backoff Exponencial
 *
 * Este nivel añade manejo inteligente de errores al polling:
 *
 * 1. rxResource → Como httpResource, pero con control total de RxJS en el loader.
 *    Permite usar operadores como retry, catchError, timeout, etc.
 *
 * 2. retry con Backoff Exponencial → Si una petición falla, no reintenta
 *    inmediatamente. Espera 1s, luego 2s, luego 4s, luego 8s...
 *    Esto evita saturar un servidor que ya está caído.
 *
 * 3. catchError → Si tras 5 reintentos sigue fallando, captura el error
 *    y devuelve un objeto de fallback. El polling principal NO se rompe.
 *
 * 4. linkedSignal → Sigue evitando el flickering como en la rama anterior.
 *
 * Este patrón es esencial para aplicaciones en producción donde
 * la red puede ser inestable o los servidores pueden tener caídas temporales.
 */
@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe, UpperCasePipe],
  templateUrl: './dashboard.html',
})
export class DashboardComponent {
  
  pollingMethod = signal('rxResource + Backoff Exponencial (🛡️ Resiliente)');
 
  private readonly _metricsService = inject(MetricsService);

  // 1️⃣ Trigger de polling
  private pollTrigger = toSignal(interval(5000), { initialValue: 0 });

  // 2️⃣ rxResource: control total de RxJS para resiliencia
  private rawResource = rxResource<ServerMetrics | null, { poll: number }>({
    params: () => ({ poll: this.pollTrigger() }),
    stream: () => {
      return this._metricsService.fetchMetrics().pipe(
        // 🛡️ Backoff Exponencial: reintentos inteligentes
        retry({
          count: 5,
          delay: (_error: unknown, retryCount: number) =>
            timer(Math.pow(2, retryCount) * 1000),
        }),
        catchError((err: unknown) => {
          console.error('❌ Error definitivo tras 5 reintentos:', err instanceof Error ? err.message : err);
          return of(null);
        })
      );
    },
  }); 

  // 3️⃣ linkedSignal: anti-flickering
  metrics = linkedSignal<ServerMetrics | null | undefined, ServerMetrics | null>({
    source: () => this.rawResource.value(),
    computation: (newVal, previous) => newVal ?? previous?.value ?? null,
  });

  // 4️⃣ Estados del recurso
  isLoading = this.rawResource.isLoading;
  hasError = this.rawResource.error;

  // --- UI Helpers: computed evita re-ejecución en cada change detection ---
  protected statusClass = computed(() =>
    STATUS_BADGE_CLASS[this.metrics()?.status ?? 'unknown']
  );
  protected statusDotClass = computed(() =>
    STATUS_DOT_CLASS[this.metrics()?.status ?? 'unknown']
  );
}
```

### `src/app/pages/dashboard/dashboard.html` (bloque añadido)

Solo cambia este bloque, insertado antes de `<!-- Method badge -->`; el resto del template es el mismo que en los demás niveles.

```html
  <!-- Error indicator (solo rama resilient) -->
  @if (hasError()) {
    <div class="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
      <div class="flex items-center gap-2 text-sm text-red-400">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <span>Error de conexión — se reintentará automáticamente con backoff exponencial</span>
      </div>
    </div>
  }
```

### `proxy.conf.json`

```json
{
  "/api": {
    "target": "http://localhost:3001",
    "secure": false
  }
}
```

Igual que en el nivel 4. Esta rama consume el servicio `MetricsService` (`http://localhost:3001/api/metrics`, URL absoluta), por lo que el proxy no interviene en la petición; se mantiene por la configuración de `angular.json`.

## Notas sobre el código de esta rama

Al contrastar comentarios y comportamiento real, hay tres inconsistencias (el código se mantiene tal cual está):

1. **Los tiempos de espera reales.** El comentario habla de `1s, 2s, 4s, 8s...`, pero en `retry({ delay })` el contador `retryCount` empieza en `1`, así que `Math.pow(2, retryCount) * 1000` produce `2s, 4s, 8s, 16s, 32s`. Para obtener `1s, 2s, 4s...` habría que usar `Math.pow(2, retryCount - 1)`.
2. **El polling puede interrumpir los reintentos.** Cada 5 segundos `pollTrigger` cambia, lo que reinicia el recurso y cancela el `stream` en curso. Con esperas acumuladas de 2 + 4 + 8 + ... segundos, es probable que un nuevo ciclo empiece antes de agotar los 5 reintentos. Verifícalo en Network con el servidor detenido.
3. **`hasError()` nunca se activa.** `catchError` devuelve `of(null)`, por lo que el recurso no llega a estado de error y `error()` queda `undefined`. Como consecuencia, el bloque de error de `dashboard.html` no se mostraría con este código. Para usarlo habría que relanzar el error (`throwError`) o exponer una señal aparte.

## Cómo funciona

- **`rxResource({ params, stream })`:** `params` lee `pollTrigger()` (un `toSignal(interval(5000), { initialValue: 0 })`); cuando cambia, el recurso ejecuta `stream` de nuevo.
- **`retry({ count: 5, delay })`:** hasta 5 reintentos; `delay` devuelve un `timer(...)` con la espera exponencial. Reintentar de inmediato ante un servidor caído solo empeora la situación; el backoff le da tiempo a recuperarse.
- **`catchError(... of(null))`:** si se agotan los reintentos, registra el error con `console.error` y emite `null` como valor de reserva; el polling continúa en el siguiente ciclo.
- **`linkedSignal`:** conserva la última métrica válida (`newVal ?? previous?.value ?? null`) mientras el recurso recarga o devuelve `null`.
- **`isLoading` y `hasError`:** los estados del recurso se exponen a la plantilla.
- **`computed` + constantes:** `STATUS_BADGE_CLASS` y `STATUS_DOT_CLASS` reemplazan los `switch` de niveles anteriores; `computed` evita recalcular en cada detección de cambios.

## Limitaciones (y cuándo puede ser excesivo)

- Es el nivel con más código y más conceptos. Para dashboards internos o de bajo riesgo, el [nivel 4](./04-resource-polling.md) suele bastar.
- Reservado para paneles críticos, sistemas financieros o entornos con red inestable.
- Aún hay decisiones abiertas: añadir jitter, un tiempo máximo de espera, `timeout` por petición, y un indicador visible de "datos obsoletos".
- Si necesitas actualizaciones en tiempo real de baja latencia o comunicación bidireccional, considera WebSockets o SSE en lugar de polling.

## Cómo ejecutarlo

```bash
git switch 5-resilient-polling
npm install
npm run server   # terminal 1
npm start        # terminal 2
```

En DevTools (Network, filtro `metrics`):

- Con el servidor activo: una petición cada 5 segundos.
- Detén el servidor con la app abierta: observa las peticiones fallidas, la consola con el `console.error` y, si aplica, la separación entre reintentos (2 s, 4 s, 8 s...). La última métrica permanece visible.
- Vuelve a levantar el servidor: los datos se recuperan solos.

---

[← Anterior](./04-resource-polling.md) | [Índice](./README.md) | [Siguiente →](./README.md)
