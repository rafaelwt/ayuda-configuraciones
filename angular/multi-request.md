# multi-request

Cómo combinar varias peticiones HTTP que deben resolverse juntas en Angular 22+.

## Recomendado (Angular 22+): `rxResource` + `forkJoin`

Para código nuevo, conviene exponer los datos como signals con `rxResource`. Gestiona automáticamente la suscripción, la cancelación al destruir el componente, el estado de carga (`isLoading`) y los errores (`error`), sin necesidad de `takeUntilDestroyed`.

```typescript
import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-mi-componente',
  templateUrl: './mi-componente.html',
})
export class MiComponente {
  private readonly choferApi = inject(ChoferApi);
  private readonly areaApi = inject(AreaApi);
  private readonly vehiculoApi = inject(VehiculoApi);

  private readonly dataResource = rxResource({
    stream: () =>
      forkJoin({
        chofer: this.choferApi.getChoferByIdPersona(),
        areas: this.areaApi.traerAreas(),
        vehiculos: this.vehiculoApi.traerVehiculos(),
      }),
  });

  // Siempre comprueba hasValue() antes de leer value():
  // en Angular 20+, leer value() cuando el recurso está en error lanza una excepción.
  protected readonly chofer = computed(() =>
    this.dataResource.hasValue() ? this.dataResource.value().chofer : undefined,
  );
  protected readonly areas = computed(() =>
    this.dataResource.hasValue() ? this.dataResource.value().areas : [],
  );
  protected readonly vehiculos = computed(() =>
    this.dataResource.hasValue() ? this.dataResource.value().vehiculos : [],
  );
  protected readonly loading = this.dataResource.isLoading;
  protected readonly error = this.dataResource.error;

  recargar(): void {
    this.dataResource.reload();
  }
}
```

## Alternativa imperativa con RxJS (`forkJoin`)

Útil cuando la carga se dispara manualmente desde una acción del usuario (por ejemplo, un botón) y quieres ejecutar efectos colaterales como notificaciones o redirecciones. En Angular 22+ (zoneless y `OnPush` por defecto), guarda los resultados en **signals** para que la vista se actualice:

```typescript
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-mi-componente',
  templateUrl: './mi-componente.html',
})
export class MiComponente {
  private readonly destroyRef = inject(DestroyRef);
  private readonly choferApi = inject(ChoferApi);
  private readonly areaApi = inject(AreaApi);
  private readonly vehiculoApi = inject(VehiculoApi);
  private readonly container = inject(Container);

  protected readonly chofer = signal<Chofer | null>(null);
  protected readonly areas = signal<Area[]>([]);
  protected readonly vehiculos = signal<Vehiculo[]>([]);

  cargarData(): void {
    forkJoin({
      chofer: this.choferApi.getChoferByIdPersona(),
      areas: this.areaApi.traerAreas(),
      vehiculos: this.vehiculoApi.traerVehiculos(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ chofer, areas, vehiculos }) => {
          this.chofer.set(chofer);
          this.areas.set(areas);
          this.vehiculos.set(vehiculos);
          this.container.ok();
        },
        error: (error) => {
          console.error(error);
          this.container.error();
        },
      });
  }
}
```

`takeUntilDestroyed(this.destroyRef)` reemplaza al patrón `takeUntil(this.unsubscribe$)`. Si se llama en el constructor o en un inicializador de campo (contexto de inyección), no hace falta pasar `destroyRef` explícitamente: `takeUntilDestroyed()`.
