# Nivel 1: Polling con `setInterval` (antipatrón)

> Resumen: el enfoque más ingenuo para hacer polling en Angular. Funciona, pero arrastra varios problemas que los siguientes niveles van resolviendo.
>
> Rama: `origin/1-bad-polling`

## El problema

Este nivel es el punto de partida y sirve para ver **qué está mal**. Para refrescar las métricas cada 5 segundos se usa `setInterval` dentro de `ngOnInit` y se llama a `HttpClient` con `subscribe`. Los problemas:

1. **Detección de cambios global (Zone.js).** Zone.js parchea `setInterval`, así que cada tick dispara un ciclo de detección de cambios sobre todo el árbol de componentes, haya o no datos nuevos.
2. **Peticiones que se amontonan.** Si el servidor tarda más que el intervalo en responder (por ejemplo, 7 s de retraso frente a 5 s de intervalo), el temporizador lanza otra petición sin esperar a la anterior. Las peticiones se solapan y pueden llegar desordenadas.
3. **Fuga de memoria.** El intervalo nunca se cancela. Si el componente se destruye (por ejemplo, al navegar a otra ruta), el `setInterval` sigue ejecutándose y manteniendo vivas las referencias al componente.
4. **Sin manejo de errores.** Si la API falla, `isLoading` queda en `true` para siempre y el usuario no recibe ninguna indicación.
5. **Código imperativo.** El ciclo de vida, el estado y la lógica de red están mezclados a mano.

## Código completo

### `src/app/pages/dashboard/dashboard.ts`

```ts
import { DatePipe, DecimalPipe, UpperCasePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ServerMetrics } from '../../models/server-metrics';
import { MetricsService } from '../../services/metrics.service';

/**
 * ❌ ANTIPATRÓN: Polling con setInterval
 *
 * Problemas:
 * 1. setInterval dispara detección de cambios en TODA la app (Zone Pollution)
 * 2. Si el componente se destruye, el interval sigue ejecutándose (Memory Leak)
 * 3. Las peticiones HTTP se amontonan si la anterior no ha terminado
 * 4. No hay manejo de errores
 * 5. Lógica imperativa difícil de mantener
 */
@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe, UpperCasePipe],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  private readonly _metricsService = inject(MetricsService);

  metrics = signal<ServerMetrics | null>(null);
  isLoading = signal(false);
  readonly pollingMethod = signal('setInterval (❌ Antipatrón)');

  ngOnInit() {
    this.fetchData();

    setInterval(() => {
      this.fetchData();
    }, 5000);
  }

  private fetchData() {
    this.isLoading.set(true);
    this._metricsService.fetchMetrics().subscribe((data) => {
      this.metrics.set(data);
      this.isLoading.set(false);
    });
    // ❌ Sin manejo de errores: si falla, isLoading queda en true para siempre
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

### `src/app/services/metrics.service.ts`

```ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ServerMetrics } from '../models/server-metrics';

@Injectable({ providedIn: 'root' })
export class MetricsService {
  private readonly _http = inject(HttpClient);
  private readonly _apiUrl = 'http://localhost:3001/api/metrics';

  fetchMetrics(): Observable<ServerMetrics> {
  return this._http.get<ServerMetrics>(this._apiUrl);
  }
}
```

### `src/app/app.config.ts`

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { mockApiInterceptor } from './interceptors/mock-api.interceptor';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors(environment.useBackend ? [] : [mockApiInterceptor])
    ),
  ],
};
```

### `src/environments/environment.ts`

```ts
/**
 * useBackend: true  → las peticiones van al servidor Express (npm run server).
 *                     Verás las peticiones en la pestaña Red de DevTools.
 * useBackend: false → se usa el interceptor mock (no hace falta levantar el backend).
 */
export const environment = {
  useBackend: true,
};
```

> El template `dashboard.html` es el mismo en todas las ramas (salvo el nivel 5, que añade un bloque de error), por lo que no se repite aquí.

### Notas sobre el código de esta rama

- El servicio apunta directamente a `http://localhost:3001/api/metrics` (el servidor Express, que tiene CORS habilitado). Por eso funciona sin necesidad del proxy.
- `angular.json` de esta rama declara `"proxyConfig": "proxy.conf.json"` en `serve`, pero el archivo `proxy.conf.json` **no existe** en esta rama (se añade recién en el nivel 4). Si `ng serve` se queja del archivo faltante, es esa la causa; no se ha modificado aquí para mantener el código tal como está en la rama.

## Cómo funciona

- `ngOnInit()` llama a `fetchData()` una vez de inmediato y luego programa `setInterval(..., 5000)`.
- `fetchData()` activa `isLoading`, se suscribe al observable de `HttpClient` y, al recibir datos, actualiza el signal `metrics` y desactiva `isLoading`.
- La suscripción no se guarda ni se cancela: no hay `unsubscribe`, ni `ngOnDestroy`, ni `clearInterval`.
- No hay `error` callback en `subscribe`: el comentario `// ❌ Sin manejo de errores` lo señala explícitamente.
- Nota: `useBackend: true` en `environment.ts` desactiva el interceptor mock y envía las peticiones al servidor Express real, de modo que se ven en la pestaña Network.

## Limitaciones

| Problema | Se resuelve en |
|---|---|
| Peticiones solapadas | [Nivel 2](./02-rxjs-polling.md) (`switchMap`) |
| Fuga de memoria al destruir el componente | [Nivel 2](./02-rxjs-polling.md) (`takeUntilDestroyed`) |
| Ticks que disparan detección de cambios global | [Nivel 3](./03-optimized-polling.md) (`runOutsideAngular`) o una app zoneless ([Nivel 4](./04-resource-polling.md)) |
| Sin manejo de errores ni reintentos | [Nivel 5](./05-resilient-polling.md) |

## Cómo ejecutarlo

```bash
git switch 1-bad-polling   # o: git checkout -b 1-bad-polling origin/1-bad-polling
npm install
npm run server             # terminal 1: Express en http://localhost:3001
npm start                  # terminal 2: Angular en http://localhost:4200
```

Qué observar en DevTools (pestaña **Network**, filtro `metrics`):

- Una petición `GET /api/metrics` cada 5 segundos.
- Para ver el solapamiento, apunta temporalmente el servicio a `http://localhost:3001/api/metrics?delay=7000` (el servidor admite el parámetro `delay` en milisegundos). Cada petición tardará 7 s y verás varias en estado *pending* a la vez.
- Navega a otra ruta o destruye el componente y comprueba que las peticiones siguen saliendo (fuga).
- Detén el servidor: `Actualizando...` queda visible indefinidamente.

---

[← Anterior](./README.md) | [Índice](./README.md) | [Siguiente →](./02-rxjs-polling.md)
