# subcribeFormValue

Escuchar el cambio de un campo (`num_sec_ao`) para cargar dinámicamente la lista de unidades organizacionales de un select dependiente.

## Con Reactive Forms

```typescript
interface AreaOrganizacionalSeleccion {
  nsec_usuario: number;
  nsec_poa: string;
  nsec_tipo_organigrama: string;
  nro_ao: string;
}

export class MiComponente {
  private destroyRef = inject(DestroyRef);
  private organigramaService = inject(OrganigramaService);

  forma = new FormGroup({
    num_sec_ao: new FormControl<string | null>(null),
    num_sec: new FormControl<string | null>(null),
  });

  constructor() {
    this.forma.controls.num_sec_ao.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          this.arrayUO = [];
          this.forma.controls.num_sec.setValue(null);
        }),
        filter((value): value is string => value !== null),
        map((value): AreaOrganizacionalSeleccion => {
          const [nsec_poa, nsec_tipo_organigrama, nro_ao] = value.trim().split('|').map((v) => v.trim());
          return { nsec_usuario: 0, nsec_poa, nsec_tipo_organigrama, nro_ao };
        }),
        switchMap((value) =>
          this.organigramaService.traerListaUnidadOrganizacional(value).pipe(
            // El catchError va dentro del switchMap, no fuera: si estuviera
            // fuera, un error cancelaría la suscripción completa y las
            // siguientes selecciones del usuario dejarían de disparar la
            // carga. Al capturarlo aquí, solo se pierde esa emisión y el
            // stream de valueChanges sigue vivo para la próxima selección.
            catchError((err) => {
              console.error(err);
              return of(null);
            }),
          ),
        ),
      )
      .subscribe((valor) => {
        if (valor !== null) {
          this.traerListaUnidadOrganizacional(valor);
        }
      });
  }
}
```

## Alternativa con Signal Forms y `rxResource`

Para formularios nuevos, Signal Forms más un `resource` evitan la suscripción manual: el `resource` reacciona solo cuando cambian sus `params`, y expone `value()`, `isLoading()` y `error()` como signals.

```typescript
export class MiComponente {
  private organigramaService = inject(OrganigramaService);

  protected readonly forma = form(signal({ num_sec_ao: '', num_sec: '' }));

  private unidadesResource = rxResource({
    params: () => {
      const value = this.forma.num_sec_ao().value();
      return value ? parseSeleccion(value) : undefined;
    },
    stream: ({ params }) => this.organigramaService.traerListaUnidadOrganizacional(params),
  });

  protected readonly unidadesOrganizacionales = computed(() => this.unidadesResource.value() ?? []);
  protected readonly cargandoUnidades = this.unidadesResource.isLoading;
}

function parseSeleccion(value: string) {
  const [nsec_poa, nsec_tipo_organigrama, nro_ao] = value.trim().split('|').map((v) => v.trim());
  return { nsec_usuario: 0, nsec_poa, nsec_tipo_organigrama, nro_ao };
}
```

Cuando `params` devuelve `undefined`, el `resource` queda en estado `idle` y no dispara la petición; así se reemplaza el `filter(value => value !== null)` del ejemplo con RxJS.
