# multi-request

Cómo combinar varias peticiones que deben resolverse juntas, con `forkJoin` y limpieza automática de la suscripción.

## Con RxJS

```typescript
export class MiComponente {
  private destroyRef = inject(DestroyRef);
  private choferService = inject(ChoferService);
  private areaService = inject(AreaService);
  private vehiculoService = inject(VehiculoService);
  private containerService = inject(ContainerService);

  cargarData(): void {
    forkJoin({
      chofer: this.choferService.getChoferByIdPersona(),
      areas: this.areaService.traerAreas(),
      vehiculos: this.vehiculoService.traerVehiculos(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ chofer, areas, vehiculos }) => {
          this.objChofer = chofer;
          this.arrayAreas = areas;
          this.arrayVehiculos = vehiculos;
          this.containerService.ok();
        },
        error: (error) => {
          console.error(error);
          this.containerService.error();
        },
      });
  }
}
```

`takeUntilDestroyed(this.destroyRef)` reemplaza al patrón `takeUntil(this.unsubscribe$)`. Si se llama en el constructor (contexto de inyección), no hace falta pasar `destroyRef` explícitamente: `takeUntilDestroyed()`.

## Alternativa con signals

Para nuevo código, en lugar de suscribirse manualmente conviene exponer los datos como signals con `rxResource` (o `toSignal` si ya tienes un observable combinado):

```typescript
export class MiComponente {
  private choferService = inject(ChoferService);
  private areaService = inject(AreaService);
  private vehiculoService = inject(VehiculoService);

  private dataResource = rxResource({
    stream: () =>
      forkJoin({
        chofer: this.choferService.getChoferByIdPersona(),
        areas: this.areaService.traerAreas(),
        vehiculos: this.vehiculoService.traerVehiculos(),
      }),
  });

  protected readonly chofer = computed(() => this.dataResource.value()?.chofer);
  protected readonly areas = computed(() => this.dataResource.value()?.areas ?? []);
  protected readonly vehiculos = computed(() => this.dataResource.value()?.vehiculos ?? []);
  protected readonly loading = this.dataResource.isLoading;
}
```

`rxResource` gestiona la suscripción, el estado de carga (`isLoading`) y los errores (`error`) automáticamente; no requiere `takeUntilDestroyed`.
