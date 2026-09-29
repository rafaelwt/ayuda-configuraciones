# Nivel 3: `runOutsideAngular` para apps con Zone.js

> Resumen: se ejecuta el temporizador fuera de la zona de Angular y solo se vuelve a ella cuando llegan datos, para provocar una única detección de cambios por actualización.
>
> Rama: `origin/3-optimized-polling`

## El problema

El [nivel 2](./02-rxjs-polling.md) ya evita solapamientos y fugas, pero en una aplicación con **Zone.js** este comportamiento persiste: Zone.js parchea `setTimeout`, `setInterval` y, por extensión, los temporizadores de RxJS. Cada tick de `timer(0, 5000)` termina en un ciclo de detección de cambios sobre toda la aplicación, aunque aún no haya datos nuevos.

La solución: crear el temporizador con `ngZone.runOutsideAngular` y entrar de nuevo en la zona con `ngZone.run` solo cuando llega la respuesta. Así hay **un único ciclo de detección de cambios por cada dato nuevo**.

> Si tu aplicación es **zoneless** (sin Zone.js), este nivel no es necesario: no existe el problema.

## Código completo

### `src/app/pages/dashboard/dashboard.ts`

```ts
import { Component, inject, NgZone, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe, UpperCasePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, timer, tap } from 'rxjs';
import { ServerMetrics } from '../../models/server-metrics';
import { MetricsService } from '../../services/metrics.service';

/**
 * 🚀 OPTIMIZADO: runOutsideAngular para apps con Zone.js
 *
 * Cuando una app usa Zone.js, CADA tick de setInterval o timer
 * dispara un ciclo de detección de cambios en TODA la aplicación.
 * Con un polling de 5 segundos, eso son ciclos extras innecesarios.
 *
 * La solución:
 * 1. Ejecutar el timer FUERA de la zona Angular → no dispara Change Detection
 * 2. Solo volver a la zona para actualizar la UI con los datos nuevos
 *
 * Nota: Si tu app es Zoneless (Angular 19+), este paso NO es necesario.
 * Angular sin Zone.js no tiene este problema.
 */
@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe, UpperCasePipe],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  private metricsService = inject(MetricsService);
  private ngZone = inject(NgZone);

  metrics = signal<ServerMetrics | null>(null);
  isLoading = signal(false);
  pollingMethod = signal('runOutsideAngular + RxJS (🚀 Optimizado para Zone.js)');

  ngOnInit() {
    this.ngZone.runOutsideAngular(() => {
      timer(0, 5000)
        .pipe(
          tap(() => this.isLoading.set(true)),
          switchMap(() => this.metricsService.fetchMetrics()),
          takeUntilDestroyed()
        )
        .subscribe((data) => {
          // 🚀 Solo volvemos a la zona para actualizar la UI
          // Esto dispara UN SOLO ciclo de Change Detection, justo cuando hay datos nuevos
          this.ngZone.run(() => {
            this.metrics.set(data);
            this.isLoading.set(false);
          });
        });
    });
  }

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

### `src/app/app.config.ts`

```ts
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { mockApiInterceptor } from './interceptors/mock-api.interceptor';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // ⚠️ Esta rama usa Zone.js para demostrar la optimización con runOutsideAngular
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors(environment.useBackend ? [] : [mockApiInterceptor])
    ),
  ],
};
```

### `src/app/services/metrics.service.ts`

```ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ServerMetrics } from '../models/server-metrics';

@Injectable({ providedIn: 'root' })
export class MetricsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:4200/api/metrics';

  fetchMetrics(): Observable<ServerMetrics> {
    return this.http.get<ServerMetrics>(this.apiUrl);
  }
}
```

### Notas sobre el código de esta rama

- **Zone.js explícito.** Las ramas 1, 2, 4 y 5 no declaran `provideZoneChangeDetection`. Esta rama sí lo hace, con `{ eventCoalescing: true }`, y su comentario lo dice: es para poder demostrar la optimización. En versiones recientes de Angular, una app nueva es zoneless por defecto, por lo que hay que activar Zone.js de forma explícita.
- **Zone.js como dependencia.** El diff de `package.json` de esta rama añade `zone.js` a `dependencies`. Sin embargo, el `angular.json` de la rama no declara `"polyfills": ["zone.js"]` en las opciones de `build`. Comprueba en tu entorno que Zone.js se cargue realmente (por ejemplo, revisando `window.Zone` en la consola) para que la comparación tenga sentido.
- **URL del servicio.** El servicio apunta a `http://localhost:4200/api/metrics` (el puerto del servidor de desarrollo de Angular), no al 3001. Eso exige un proxy que reenvíe `/api` al 3001. `angular.json` declara `proxyConfig: "proxy.conf.json"`, pero ese archivo **no existe** en esta rama (se añade en el nivel 4; su contenido está en el [nivel 4](./04-resource-polling.md#código-completo)). Para ejecutar esta rama tal cual, hay que crear ese `proxy.conf.json` o cambiar la URL a `http://localhost:3001/api/metrics`.
- `this.isLoading.set(true)` en el `tap` se ejecuta fuera de la zona, así que no dispara por sí mismo un ciclo de detección de cambios. Con signals el indicador puede tardar en reflejarse hasta que ocurra otro ciclo; es un efecto de la optimización.
- **Posible error en tiempo de ejecución.** `takeUntilDestroyed()` sin argumentos exige un contexto de inyección (constructor o inicializador de campo). Aquí se llama dentro de `ngOnInit`, que no lo es, y Angular puede lanzar el error `NG0203`. En tal caso, la corrección sería inyectar `DestroyRef` y pasarlo: `takeUntilDestroyed(this.destroyRef)`. El código de la rama se mantiene sin modificar; conviene verificarlo al ejecutarla.
- Aquí ya no está `finalize` del nivel 2.

## Cómo funciona

- `ngZone.runOutsideAngular(() => { timer(0, 5000)... })`: el `timer` (que internamente usa `setInterval`) se registra fuera de la zona, así que sus ticks no activan detección de cambios.
- `takeUntilDestroyed()` cancela la suscripción al destruirse el componente.
- `this.ngZone.run(() => { this.metrics.set(data); this.isLoading.set(false); })`: al recibir la respuesta se vuelve a entrar en la zona, por lo que se produce un único ciclo de detección de cambios.

## Limitaciones

- Solo aporta valor en aplicaciones con Zone.js; en aplicaciones zoneless es código innecesario.
- El manejo manual de la zona añade complejidad y es fácil de olvidar.
- Sigue faltando el manejo de errores y los reintentos ([nivel 5](./05-resilient-polling.md)).
- Sigue siendo RxJS imperativo con `subscribe`; el [nivel 4](./04-resource-polling.md) lo reemplaza por la Resource API, apta para zoneless.

## Cómo ejecutarlo

```bash
git switch 3-optimized-polling
npm install
npm run server   # terminal 1
npm start        # terminal 2
```

En DevTools:

- **Network:** una petición cada 5 segundos (siempre que la URL del servicio sea alcanzable; ver las notas).
- **Angular DevTools > Profiler** (o `ng.profiler.timeChangeDetection()` en la consola en modo desarrollo): compara el número de ciclos de detección de cambios con el nivel 2. Aquí debería haber uno por respuesta en lugar de uno por tick.

---

[← Anterior](./02-rxjs-polling.md) | [Índice](./README.md) | [Siguiente →](./04-resource-polling.md)
