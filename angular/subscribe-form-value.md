# subscribe-form-value (select dependiente)

Escuchar el cambio de un campo (`num_sec_ao`) para limpiar el campo dependiente (`num_sec`) y cargar dinámicamente la lista de unidades organizacionales en Angular 22+.

## Recomendado (Angular 22+): Signal Forms + `rxResource`

Para formularios nuevos, Signal Forms (`@angular/forms/signals`) más un `rxResource` evitan la suscripción manual: el recurso reacciona automáticamente cuando cambian sus `params`, cancela peticiones anteriores y expone `value()`, `hasValue()`, `isLoading()` y `error()` como signals.

```typescript
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { disabled, form, FormField } from '@angular/forms/signals';

interface AreaOrganizacionalSeleccion {
  nsec_usuario: number;
  nsec_poa: string;
  nsec_tipo_organigrama: string;
  nro_ao: string;
}

@Component({
  selector: 'app-mi-componente',
  imports: [FormField],
  template: `
    <select [formField]="forma.num_sec_ao" (change)="limpiarUnidad()">
      <option value="">Seleccione área…</option>
      <!-- opciones de área -->
    </select>

    <!-- No pongas [disabled] junto a [formField] (error NG8022); decláralo en el schema con disabled(). -->
    <select [formField]="forma.num_sec">
      <option value="">Seleccione unidad…</option>
      @for (uo of unidadesOrganizacionales(); track uo.id) {
        <option [value]="uo.id">{{ uo.nombre }}</option>
      }
    </select>
  `,
})
export class MiComponente {
  private readonly organigramaApi = inject(OrganigramaApi);

  private readonly model = signal({ num_sec_ao: '', num_sec: '' });
  protected readonly forma = form(this.model, (p) => {
    disabled(p.num_sec, { when: () => this.cargandoUnidades() });
  });

  private readonly unidadesResource = rxResource({
    params: () => {
      const value = this.forma.num_sec_ao().value();
      return value ? parseSeleccion(value) : undefined;
    },
    stream: ({ params }) => this.organigramaApi.traerListaUnidadOrganizacional(params),
  });

  // Siempre comprueba hasValue(): leer value() cuando el recurso está en error lanza una excepción.
  protected readonly unidadesOrganizacionales = computed(() =>
    this.unidadesResource.hasValue() ? this.unidadesResource.value() : [],
  );
  protected readonly cargandoUnidades = this.unidadesResource.isLoading;
  protected readonly errorUnidades = this.unidadesResource.error;

  protected limpiarUnidad(): void {
    // Reinicia el select dependiente desde el evento en lugar de escribir signals dentro de un effect().
    this.forma.num_sec().value.set('');
  }
}

function parseSeleccion(value: string): AreaOrganizacionalSeleccion {
  const [nsec_poa, nsec_tipo_organigrama, nro_ao] = value.trim().split('|').map((v) => v.trim());
  return { nsec_usuario: 0, nsec_poa, nsec_tipo_organigrama, nro_ao };
}
```

Cuando `params` devuelve `undefined`, el `rxResource` queda en estado `idle` y no dispara la petición; así reemplaza el `filter(value => value !== null)` del enfoque con RxJS.

## Alternativa con Reactive Forms (código existente)

Si mantienes un formulario en Reactive Forms, usa `takeUntilDestroyed()` sin argumentos dentro del `constructor` (contexto de inyección) y guarda los resultados en un `signal()` para que funcione en Angular 22+ (zoneless + `OnPush` por defecto):

```typescript
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { catchError, filter, map, of, switchMap, tap } from 'rxjs';

interface AreaOrganizacionalSeleccion {
  nsec_usuario: number;
  nsec_poa: string;
  nsec_tipo_organigrama: string;
  nro_ao: string;
}

@Component({
  selector: 'app-mi-componente',
  imports: [ReactiveFormsModule],
  templateUrl: './mi-componente.html',
})
export class MiComponente {
  private readonly organigramaApi = inject(OrganigramaApi);

  protected readonly unidadesOrganizacionales = signal<UnidadOrganizacional[]>([]);

  protected readonly forma = new FormGroup({
    num_sec_ao: new FormControl<string | null>(null),
    num_sec: new FormControl<string | null>(null),
  });

  constructor() {
    this.forma.controls.num_sec_ao.valueChanges
      .pipe(
        // Dentro del constructor no hace falta pasar DestroyRef;
        // si la suscripción se creara fuera del constructor, pasa inject(DestroyRef).
        takeUntilDestroyed(),
        tap(() => {
          this.unidadesOrganizacionales.set([]);
          this.forma.controls.num_sec.setValue(null);
        }),
        filter((value): value is string => value !== null),
        map((value): AreaOrganizacionalSeleccion => {
          const [nsec_poa, nsec_tipo_organigrama, nro_ao] = value
            .trim()
            .split('|')
            .map((v) => v.trim());
          return { nsec_usuario: 0, nsec_poa, nsec_tipo_organigrama, nro_ao };
        }),
        switchMap((value) =>
          this.organigramaApi.traerListaUnidadOrganizacional(value).pipe(
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
      .subscribe((unidades) => {
        if (unidades !== null) {
          this.unidadesOrganizacionales.set(unidades);
        }
      });
  }
}
```
