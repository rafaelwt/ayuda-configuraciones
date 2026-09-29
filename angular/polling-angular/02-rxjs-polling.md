# Nivel 2: Polling declarativo con RxJS

> Resumen: `timer` + `switchMap` + `takeUntilDestroyed` convierten el polling en un flujo declarativo, sin solapamientos ni fugas.
>
> Rama: `origin/2-rxjs-polling`

## El problema

Respecto al [nivel 1](./01-bad-polling.md), este nivel corrige tres cosas:

- **Peticiones amontonadas:** `switchMap` cancela la petición pendiente cuando el temporizador emite de nuevo.
- **Fuga de memoria:** `takeUntilDestroyed()` cancela la suscripción cuando el componente se destruye, sin `ngOnDestroy` ni `Subject`.
- **Código imperativo:** el flujo se lee de arriba abajo (temporizador, marcar carga, pedir datos, guardar en el signal) y el estado se guarda en un signal.

Sigue sin resolver el manejo de errores y el costo de la detección de cambios con Zone.js.

## Código completo

### `src/app/pages/dashboard/dashboard.ts`

```ts
import { Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, UpperCasePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, timer, tap, finalize } from 'rxjs';
import { ServerMetrics } from '../../models/server-metrics';
import { MetricsService } from '../../services/metrics.service';

/**
 * ✅ MEJOR: Polling declarativo con RxJS
 *
 * Mejoras respecto al antipatrón:
 * 1. timer(0, 5000) → emite inmediatamente y luego cada 5s
 * 2. switchMap → cancela la petición anterior si la nueva empieza (evita amontonamiento)
 * 3. takeUntilDestroyed() → limpieza automática al destruir el componente (sin memory leaks)
 * 4. Usa un servicio inyectado en vez de HttpClient directo
 * 5. Estilo declarativo: el flujo se lee de arriba a abajo
 */
@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe, UpperCasePipe],
  templateUrl: './dashboard.html',
})
export class DashboardComponent {
  private metricsService = inject(MetricsService);

  metrics = signal<ServerMetrics | null>(null);
  isLoading = signal(false);
  pollingMethod = signal('RxJS timer + switchMap (✅ Declarativo)');

  // ✅ El polling se define como un flujo reactivo declarativo
  private polling$ = timer(0, 5000)
    .pipe(
      tap(() => this.isLoading.set(true)),
      switchMap(() => this.metricsService.fetchMetrics()),
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed()
    )
    .subscribe((data) => {
      this.metrics.set(data);
      this.isLoading.set(false);
    });

  // --- UI Helpers ---
  protected statusClass = () => {
    const status = this.metrics()?.status;
    switch (status) {
      case 'healthy':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'degraded':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'critical':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

  protected statusDotClass = () => {
    const status = this.metrics()?.status;
    switch (status) {
      case 'healthy':
        return 'bg-emerald-400';
      case 'degraded':
        return 'bg-amber-400';
      case 'critical':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };
}
```

> Los demás archivos (`app.config.ts`, `environment.ts`, `metrics.service.ts`) son equivalentes a los del [nivel 1](./01-bad-polling.md#código-completo); el servicio solo cambia el formato (`private http`, `private apiUrl`, sin `_`) y mantiene la URL `http://localhost:3001/api/metrics`.

### Notas sobre el código de esta rama

- `polling$` no es un observable sino la `Subscription` que devuelve `.subscribe(...)`, a pesar del sufijo `$`. Se mantiene tal cual está en la rama.
- `isLoading.set(false)` aparece dos veces (en `finalize` y en `subscribe`): la del `subscribe` es la que apaga el indicador tras cada respuesta; `finalize` solo se ejecuta cuando el flujo termina o se cancela (por ejemplo, al destruir el componente).
- Igual que en el nivel 1, `angular.json` referencia `proxy.conf.json`, que todavía no existe en esta rama. Además, `package.json` tiene la clave `"server"` duplicada (inofensiva).
- No hay manejo de errores: si una petición falla, el error se propaga, el flujo termina y **el polling se detiene**, con `isLoading` ya en `true`.

## Cómo funciona

- `timer(0, 5000)`: emite a los 0 ms (carga inicial inmediata) y después cada 5 segundos. Sustituye la combinación "llamada inicial + `setInterval`".
- `tap(() => this.isLoading.set(true))`: efecto secundario que marca el estado de carga en cada ciclo.
- `switchMap(() => this.metricsService.fetchMetrics())`: por cada emisión del temporizador cambia a una nueva petición y **cancela la anterior** si aún estaba en vuelo.
- `takeUntilDestroyed()`: sin argumentos funciona porque el `pipe` se construye en un inicializador de campo, dentro de un contexto de inyección. Completa el flujo al destruirse el componente.
- `.subscribe((data) => this.metrics.set(data))`: el resultado va a un signal, que consume la plantilla.

### `switchMap` frente a `exhaustMap`

| Operador | Comportamiento si el timer emite con una petición en vuelo | Cuándo elegirlo |
|---|---|---|
| `switchMap` | Cancela la petición pendiente y lanza una nueva | Solo importa el dato más reciente. Riesgo: si el servidor tarda siempre más que el intervalo, nunca se llega a mostrar una respuesta. |
| `exhaustMap` | Ignora la nueva emisión hasta que termine la petición actual | Peticiones costosas o no idempotentes. Riesgo: el intervalo efectivo se estira si el servidor es lento. |

Esta rama usa `switchMap`; `exhaustMap` es una alternativa válida según el caso.

## Limitaciones

- Los ticks de `timer` siguen ocurriendo dentro de la zona de Angular: con Zone.js, cada tick dispara detección de cambios en toda la app. Se aborda en el [nivel 3](./03-optimized-polling.md).
- Sin manejo de errores ni reintentos: se aborda en el [nivel 5](./05-resilient-polling.md).
- Se sigue necesitando `subscribe` y RxJS explícito; el [nivel 4](./04-resource-polling.md) lo simplifica con la Resource API.

## Cómo ejecutarlo

```bash
git switch 2-rxjs-polling
npm install
npm run server   # terminal 1
npm start        # terminal 2
```

En DevTools (Network, filtro `metrics`):

- Una petición cada 5 segundos.
- Con `?delay=7000` en la URL del servicio, cada petición nueva **cancela** la anterior: verás peticiones en estado *canceled* en lugar de acumularse.
- Al navegar fuera del dashboard, las peticiones dejan de salir.

---

[← Anterior](./01-bad-polling.md) | [Índice](./README.md) | [Siguiente →](./03-optimized-polling.md)
