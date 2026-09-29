# Nivel 4: Resource API + Signals (`httpResource`)

> Resumen: un signal disparador (`toSignal(interval(...))`) más `httpResource` reemplazan `switchMap`, `subscribe` y `takeUntilDestroyed`. `linkedSignal` evita el parpadeo entre recargas.
>
> Rama: `origin/4-resource-polling`

## El problema

Los niveles 2 y 3 funcionan, pero exigen conocer bien RxJS (operadores, suscripciones, contexto de inyección) y, con Zone.js, cuidar la zona a mano. En este nivel:

- **No hay `switchMap`, `subscribe` ni `takeUntilDestroyed`.** `httpResource` es reactivo: cuando una señal que lee cambia, vuelve a pedir los datos y cancela la petición anterior.
- **Limpieza automática:** al destruirse el componente, el recurso se cancela.
- **Estados integrados:** `isLoading()`, `error()` y `value()` vienen con el recurso.
- **Compatible con apps zoneless:** las señales no dependen de Zone.js (la rama no declara `provideZoneChangeDetection`).
- **Sin parpadeo:** `linkedSignal` conserva el valor anterior mientras llega el nuevo. Sin él, `value()` pasaría a `undefined` durante cada recarga y la interfaz mostraría el estado vacío.

Para la mayoría de las aplicaciones modernas, este nivel es suficiente.

## Código completo

### `src/app/pages/dashboard/dashboard.ts`

```ts
import { Component, inject, linkedSignal, signal } from '@angular/core';
import { DatePipe, DecimalPipe, UpperCasePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { httpResource } from '@angular/common/http';
import { interval } from 'rxjs';
import { ServerMetrics } from '../../models/server-metrics';

/**
 * 🏆 EXCELENCIA: Resource API + Signals (Angular moderno)
 *
 * Este es el enfoque recomendado en Angular 20+:
 *
 * 1. toSignal(interval(5000)) → Convierte el intervalo RxJS en un Signal
 *    que se incrementa cada 5 segundos.
 *
 * 2. httpResource(() => { ... }) → Define un recurso HTTP reactivo.
 *    Cada vez que una dependencia (signal) cambia, se recarga automáticamente.
 *    La limpieza es automática: cuando el componente se destruye, el recurso se cancela.
 *
 * 3. linkedSignal → Evita el "flickering" (parpadeo) manteniendo el valor
 *    anterior mientras carga el nuevo. Sin esto, el recurso pondría el valor
 *    a undefined durante cada recarga.
 *
 * Ventajas:
 * - Zero RxJS boilerplate: no necesitas switchMap, takeUntilDestroyed, etc.
 * - Zoneless-ready: funciona perfecto sin Zone.js
 * - Estados integrados: isLoading(), error(), value() vienen gratis
 * - Cancelación automática: al destruir el componente, se cancela todo
 */
@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe, UpperCasePipe],
  templateUrl: './dashboard.html',
})
export class DashboardComponent {
  pollingMethod = signal('httpResource + linkedSignal (🏆 Angular Moderno)');

  // 1️⃣ Trigger de polling: un Signal que cambia cada 5 segundos

  private pollTrigger = toSignal(interval(5000), { initialValue: 0 });

  // 2️⃣ Recurso HTTP reactivo: se recarga cuando pollTrigger cambia
  //    httpResource espera una URL (no un Observable); hace el GET internamente
  private rawResource = httpResource<ServerMetrics>(() => {
    this.pollTrigger();
    return '/api/metrics';
  });

  // 3️⃣ linkedSignal: mantiene el valor anterior mientras carga el nuevo
  //    Esto evita el "flickering" → la UI no parpadea entre actualizaciones
  metrics = linkedSignal<ServerMetrics | undefined, ServerMetrics | null>({
    source: () => this.rawResource.value(),
    computation: (newVal, previous) => newVal ?? previous?.value ?? null,
  });

  // 4️⃣ Estado de carga discreto: viene gratis del recurso
  isLoading = this.rawResource.isLoading;

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

### `proxy.conf.json`

```json
{
  "/api": {
    "target": "http://localhost:3001",
    "secure": false
  }
}
```

### `angular.json` (fragmento añadido en `serve`)

```json
"options": {
  "proxyConfig": "proxy.conf.json"
},
```

### Notas sobre el código de esta rama

- `httpResource` usa la ruta relativa `'/api/metrics'` (no pasa por `MetricsService`). Por eso este nivel **sí necesita** el proxy: reenvía `/api` al servidor Express en el puerto 3001. Este es el primer nivel en el que `proxy.conf.json` existe en la rama.
- El comentario del componente dice "recomendado en Angular 20+" y en la lista de ventajas menciona `error()`, pero esta rama no muestra el error en la interfaz (eso llega en el nivel 5).
- El `toSignal(interval(5000), { initialValue: 0 })` emite el valor inicial al instante y el primero de `interval` a los 5 segundos; por eso el primer GET ocurre en la carga y luego cada 5 segundos.

## Cómo funciona

1. **Disparador:** `pollTrigger = toSignal(interval(5000), { initialValue: 0 })` es un signal que se incrementa cada 5 segundos. `toSignal` se desuscribe solo al destruirse el componente.
2. **Recurso:** `httpResource<ServerMetrics>(() => { this.pollTrigger(); return '/api/metrics'; })`. La función reactiva **lee** `pollTrigger()` (eso lo convierte en dependencia) y devuelve la URL. Cada cambio del disparador re-ejecuta la petición.
3. **Sin parpadeo:** `linkedSignal` con `computation: (newVal, previous) => newVal ?? previous?.value ?? null` devuelve el valor nuevo si existe y, en caso contrario, el anterior.
4. **Estado de carga:** `isLoading = this.rawResource.isLoading` se reutiliza directamente en la plantilla.

## Limitaciones

- **Sin reintentos ni backoff.** Si una petición falla, no se reintenta hasta el siguiente ciclo; el valor anterior se conserva gracias a `linkedSignal`.
- **El error no se muestra al usuario** en esta rama (`error()` existe pero no se usa en la plantilla).
- `httpResource` solo hace GET simples: si necesitas operadores de RxJS (`retry`, `timeout`, `catchError`...), usa `rxResource` en el [nivel 5](./05-resilient-polling.md).

## Cómo ejecutarlo

```bash
git switch 4-resource-polling
npm install
npm run server   # terminal 1: Express en http://localhost:3001
npm start        # terminal 2: Angular en http://localhost:4200 (usa proxy.conf.json)
```

En DevTools (Network, filtro `metrics`):

- Una petición `GET /api/metrics` inicial y luego cada 5 segundos, ahora hacia `localhost:4200` (el proxy la reenvía al 3001).
- Detén el servidor: la última métrica sigue visible (sin parpadeo) y no aparece ningún aviso de error.

---

[← Anterior](./03-optimized-polling.md) | [Índice](./README.md) | [Siguiente →](./05-resilient-polling.md)
