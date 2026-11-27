# Reactive Forms vs Signal Forms (Angular 22)

Comparación práctica usando el mismo caso: **alta de usuario** con `nombre`, `password` y `repetirPassword`.

Estado al momento de escribir (octubre 2026): Signal Forms son **estables desde Angular 22.0** (junio 2026). Viven en el entry point `@angular/forms/signals`, separado de `@angular/forms`. Angular 22 requiere TypeScript 6.

---

## Glosario rápido

| Término | Qué es | Ejemplo |
|---|---|---|
| **Field tree** | Lo que devuelve `form()`. Árbol que calca la forma del modelo. Cada campo invocado como función da su estado como signals. | `f.nombre().value()`, `f.nombre().errors()` |
| **Schema** | Función (2º argumento de `form()`) donde declaras validaciones y lógica, separadas del modelo. | `form(model, p => { required(p.nombre); })` |
| **Path tipado** | `p.nombre` dentro del schema. No es un string: si lo escribes mal, el build falla. | `required(p.nombrre)` → error de compilación |
| **`valueOf`** | Helper dentro de `validate()` para leer reactivamente otro campo. | `valueOf(p.password)` |
| **`FormValueControl`** | Interfaz que reemplaza a `ControlValueAccessor` para controles custom. Solo exige `value = model()`. | ver §5 |
| **`[formField]`** | Directiva que enlaza un input (nativo o custom) con un campo del field tree. Reemplaza a `formControlName`. | `<input [formField]="f.nombre" />` |

---

## 1. Definir el formulario

### Antes — Reactive Forms

```ts
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-crear-usuario',
  imports: [ReactiveFormsModule],
  templateUrl: './crear-usuario.html',
})
export class CrearUsuario {
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    repetirPassword: ['', Validators.required],
  });

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    console.log(this.form.getRawValue());
  }
}
```

```html
<form [formGroup]="form" (ngSubmit)="guardar()">
  <input formControlName="nombre" placeholder="Nombre" />
  <input type="password" formControlName="password" placeholder="Contraseña" />
  <input type="password" formControlName="repetirPassword" placeholder="Repetir contraseña" />
  <button [disabled]="form.invalid">Crear</button>
</form>
```

### Ahora — Signal Forms

```ts
import { Component, signal } from '@angular/core';
import { form, FormField, required, minLength } from '@angular/forms/signals';

@Component({
  selector: 'app-crear-usuario',
  imports: [FormField],
  templateUrl: './crear-usuario.html',
})
export class CrearUsuario {
  // El modelo ES la fuente de verdad. Signal plano, tipado por inferencia.
  model = signal({
    nombre: '',
    password: '',
    repetirPassword: '',
  });

  f = form(this.model, (p) => {
    required(p.nombre, { message: 'El nombre es obligatorio' });
    minLength(p.nombre, 3, { message: 'Mínimo 3 caracteres' });
    required(p.password, { message: 'La contraseña es obligatoria' });
    minLength(p.password, 8, { message: 'Mínimo 8 caracteres' });
    required(p.repetirPassword, { message: 'Repite la contraseña' });
  });

  guardar() {
    if (this.f().invalid()) return;
    console.log(this.f().value()); // tipado igual que el modelo
  }
}
```

```html
<form novalidate (submit)="guardar(); $event.preventDefault()">
  <input [formField]="f.nombre" placeholder="Nombre" />
  <input type="password" [formField]="f.password" placeholder="Contraseña" />
  <input type="password" [formField]="f.repetirPassword" placeholder="Repetir contraseña" />
  <button [disabled]="f().invalid()">Crear</button>
</form>
```

**Diferencias que importan**

- No hay `FormGroup`, `FormControl` ni `FormBuilder`. El tipo sale del objeto inicial del signal.
- `p.nombre` es un path tipado; `form.get('nombre')` era un string sin verificar.
- Los mensajes de error viven en la regla (`{ message }`), no se reconstruyen en el template.
- `novalidate` en el `<form>` evita que el navegador muestre sus propios tooltips.
- Import desde `@angular/forms/signals`. Olvidar `FormField` en `imports` hace que `[formField]` no haga nada, sin error.

---

## 2. Mostrar errores

### Antes

```html
@if (form.controls.nombre.touched && form.controls.nombre.errors) {
  @if (form.controls.nombre.hasError('required')) {
    <span>Obligatorio</span>
  }
  @if (form.controls.nombre.hasError('minlength')) {
    <span>Mínimo {{ form.controls.nombre.getError('minlength').requiredLength }} caracteres</span>
  }
}
```

### Ahora

```html
@if (f.nombre().touched() && f.nombre().invalid()) {
  @for (e of f.nombre().errors(); track e.kind) {
    <span>{{ e.message }}</span>
  }
}
```

Cada error es un objeto `{ kind: string, message?: string }`. No hace falta `markAllAsTouched()` ni un pipe de traducción de errores.

---

## 3. Validación cruzada: password === repetirPassword

### Antes — validador a nivel de grupo

Un `ValidatorFn` de control no ve a sus hermanos, así que la regla iba en el `FormGroup` (o se usaba `control.parent`, que es frágil).

```ts
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordsIguales(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const pass = group.get('password')?.value;
    const rep = group.get('repetirPassword')?.value;
    return pass === rep ? null : { passwordMismatch: true };
  };
}
```

```ts
form = this.fb.nonNullable.group(
  {
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    repetirPassword: ['', Validators.required],
  },
  { validators: passwordsIguales() } // el error queda en el GRUPO
);
```

```html
@if (form.hasError('passwordMismatch') && form.controls.repetirPassword.touched) {
  <span>Las contraseñas no coinciden</span>
}
```

Problema clásico: el error está en el grupo, así que `repetirPassword` sigue siendo "válido" por sí solo. Para pintarlo en rojo había que hacer `setErrors` a mano.

### Ahora — `validate()` en el campo con `valueOf`

```ts
import { form, required, minLength, validate } from '@angular/forms/signals';

f = form(this.model, (p) => {
  required(p.nombre, { message: 'El nombre es obligatorio' });
  minLength(p.nombre, 3, { message: 'Mínimo 3 caracteres' });
  required(p.password, { message: 'La contraseña es obligatoria' });
  minLength(p.password, 8, { message: 'Mínimo 8 caracteres' });
  required(p.repetirPassword, { message: 'Repite la contraseña' });

  // Reactivo a AMBOS campos: se re-evalúa cuando cambia password o repetirPassword
  validate(p.repetirPassword, ({ value, valueOf }) => {
    if (value() !== valueOf(p.password)) {
      return { kind: 'passwordMismatch', message: 'Las contraseñas no coinciden' };
    }
    return null;
  });

  // Validación custom de un solo campo: reglas de complejidad
  validate(p.password, ({ value }) => {
    const v = value();
    if (!/[A-Z]/.test(v)) return { kind: 'mayuscula', message: 'Debe tener una mayúscula' };
    if (!/[0-9]/.test(v)) return { kind: 'numero', message: 'Debe tener un número' };
    return null;
  });
});
```

```html
<!-- Mismo bucle genérico de errores, nada especial -->
@if (f.repetirPassword().touched()) {
  @for (e of f.repetirPassword().errors(); track e.kind) {
    <span>{{ e.message }}</span>
  }
}
```

El error queda en `repetirPassword`, donde el usuario lo espera. En algunos artículos verás `customError({ kind, message })`; es un helper que construye el mismo objeto, devolver el objeto plano funciona igual.

Si realmente necesitas un error a nivel de formulario (no de campo), existe `validateTree(p, ctx => …)`.

---

## 4. Reaccionar a cambios (`valueChanges`)

### Antes — RxJS + limpieza de suscripción

```ts
import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';

private destroyRef = inject(DestroyRef);
usernameSugerido = signal('');

constructor() {
  this.form.controls.nombre.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    takeUntilDestroyed(this.destroyRef),
  ).subscribe((nombre) => {
    this.usernameSugerido.set(this.generarUsername(nombre));
  });
}
```

### Ahora — el valor ya es un signal

```ts
import { computed, effect } from '@angular/core';
import { debounce } from '@angular/forms/signals';

// Derivar algo del valor → computed
usernameSugerido = computed(() => this.generarUsername(this.f.nombre().value()));

// Efecto secundario (servicio, log, analytics) → effect
constructor() {
  effect(() => {
    const nombre = this.f.nombre().value();
    console.log('nombre cambió:', nombre);
  });
}

// El debounceTime(300) tiene equivalente declarativo en el schema:
f = form(this.model, (p) => {
  debounce(p.nombre, 300);        // el modelo se actualiza 300 ms después de la última tecla
  // debounce(p.nombre, 'blur');  // o solo al salir del campo
  // ...resto de reglas
});
```

Si tienes pipelines RxJS complejos (`switchMap` a un endpoint, combinar streams), puedes seguir usándolos: `toObservable(computed(() => this.f.nombre().value()))`. Pero para la mayoría de formularios `computed`/`effect` alcanzan.

---

## 5. Componente personalizado: `ControlValueAccessor` → `FormValueControl`

Caso: input de contraseña con botón mostrar/ocultar.

### Antes — `ControlValueAccessor`

```ts
import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-password-input',
  template: `
    <input
      [type]="visible ? 'text' : 'password'"
      [value]="valor"
      [disabled]="disabled"
      (input)="onInput($event)"
      (blur)="onTouched()" />
    <button type="button" (click)="visible = !visible">👁</button>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordInput),
      multi: true,
    },
  ],
})
export class PasswordInput implements ControlValueAccessor {
  valor = '';
  visible = false;
  disabled = false;
  onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(v: string): void { this.valor = v ?? ''; }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }

  onInput(e: Event) {
    this.valor = (e.target as HTMLInputElement).value;
    this.onChange(this.valor);
  }
}
```

```html
<app-password-input formControlName="password" />
```

Cuatro métodos, `forwardRef`, provider `multi`, y para mostrar los errores dentro del componente había que inyectar `NgControl` con un truco en el constructor.

### Ahora — `FormValueControl`

```ts
import { Component, model, input, output, signal } from '@angular/core';
import {
  FormValueControl,
  ValidationError,
  WithOptionalFieldTree,
} from '@angular/forms/signals';

@Component({
  selector: 'app-password-input',
  template: `
    <input
      [type]="visible() ? 'text' : 'password'"
      [value]="value()"
      [disabled]="disabled()"
      [class.invalid]="invalid()"
      [attr.aria-invalid]="invalid()"
      (input)="value.set($any($event.target).value)"
      (blur)="touch.emit()" />
    <button type="button" (click)="visible.set(!visible())">👁</button>

    @if (touched() && invalid()) {
      @for (e of errors(); track e.kind) {
        <small class="error">{{ e.message }}</small>
      }
    }
  `,
})
export class PasswordInput implements FormValueControl<string> {
  value = model('');            // único requisito de la interfaz
  visible = signal(false);

  // Opcionales: solo declaras los que tu control usa.
  // La directiva [formField] los rellena automáticamente.
  disabled = input(false);
  invalid = input(false);
  touched = input(false);
  touch = output<void>();       // avisa el blur al formulario
  errors = input<readonly WithOptionalFieldTree<ValidationError>[]>([]);
}
```

```html
<app-password-input [formField]="f.password" />
<app-password-input [formField]="f.repetirPassword" />
```

Sin provider, sin `forwardRef`, sin `writeValue`. El componente recibe `errors`, `disabled`, `required`, `minLength`, etc. como inputs normales.

Regla de la documentación oficial: **el control no valida, solo muestra**. Las reglas van en el schema.

**Compatibilidad para migrar gradualmente**

- Un `FormValueControl` funciona también con `formControlName` en formularios reactivos y con `ngModel`. Los controles nuevos, hazlos así.
- Los `ControlValueAccessor` viejos (propios o de librerías) se pueden bindear con `[formField]` directamente; Angular 22 los adaptó. No hay que reescribirlos para empezar.
- `@angular/forms/signals/compat` ofrece `compatForm` para embeber un `FormGroup`/`FormControl` reactivo existente dentro de un modelo de signal forms.

---

## 6. Lo que suele olvidarse

### Submit

**Antes:** `(ngSubmit)` + `markAllAsTouched()` + chequear `form.invalid`. Si el backend devolvía "nombre duplicado", `setErrors` manual.

**Ahora:** `submit()` marca todo como touched, no ejecuta si el form es inválido, bloquea doble submit, y aplica los errores que devuelve tu callback al campo que indiques.

```ts
import { submit } from '@angular/forms/signals';

guardar() {
  submit(this.f, async (form) => {
    const dto = form().value();
    const res = await this.api.crearUsuario(dto);
    if (res.error === 'NOMBRE_DUPLICADO') {
      return [{ kind: 'duplicado', message: 'Ese nombre ya existe', fieldTree: form.nombre }];
    }
    return undefined; // sin errores
  });
}
```

```html
<button [disabled]="f().invalid() || f().submitting()">
  {{ f().submitting() ? 'Guardando…' : 'Crear' }}
</button>
```

### Deshabilitar campos

**Antes:** `this.form.controls.repetirPassword.disable()` imperativo, porque `[disabled]` junto a `formControlName` lanzaba la advertencia famosa. Además `form.value` excluía los deshabilitados (`getRawValue()` para verlos).

**Ahora:** regla declarativa y reactiva en el schema:

```ts
import { disabled } from '@angular/forms/signals';

disabled(p.repetirPassword, ({ valueOf }) => valueOf(p.password).length < 8);
```

También `readonly(path, fn)` y `hidden(path, fn)` con la misma firma.

### Validación asíncrona (nombre disponible)

**Antes:** `AsyncValidatorFn` devolviendo `Observable`, con `debounceTime` + `switchMap` dentro, y `control.pending` para el spinner.

**Ahora:** `validateHttp` (o `validateAsync` para operaciones no HTTP) en el schema. Forma aproximada, revisa la firma exacta en la guía *Async operations* de angular.dev:

```ts
import { validateHttp, debounce } from '@angular/forms/signals';

debounce(p.nombre, 300); // no disparar una request por tecla

validateHttp(p.nombre, {
  request: ({ value }) => `/api/usuarios/disponible?nombre=${value()}`,
  errors: (resp: { disponible: boolean }) =>
    resp.disponible ? null : { kind: 'tomado', message: 'Ese nombre ya está en uso' },
});
```

Estado pendiente: `f.nombre().pending()`.

### setValue / patchValue / reset

**Antes:**

```ts
this.form.patchValue({ nombre: 'rafael' });
this.form.setValue({ nombre: 'rafael', password: '', repetirPassword: '' });
this.form.reset();
```

**Ahora:** el modelo es el signal, se toca como cualquier signal.

```ts
this.model.update((m) => ({ ...m, nombre: 'rafael' }));              // patch
this.f.nombre().value.set('rafael');                                   // campo a campo
this.model.set({ nombre: '', password: '', repetirPassword: '' });     // volver al inicial
this.f().reset();                                                      // limpia touched/dirty y errores de parseo
```

Actualiza siempre inmutablemente (`set`/`update`). `this.model().nombre = 'x'` no dispara reactividad.

### Valores nulos en el modelo

En Reactive Forms era normal `FormControl<string | null>`. En Signal Forms `undefined` significa "el campo no existe". Inicializa siempre con un valor: `''`, `0`, `false`, o `null` explícito si tipas `signal<{ edad: number | null }>({ edad: null })`. Esto conviene planearlo desde el DTO.

### Arrays (FormArray)

Ya no existe `FormArray`. Es un array dentro del signal:

```ts
import { applyEach, required } from '@angular/forms/signals';

model = signal({ nombre: '', telefonos: [{ numero: '' }] });

f = form(this.model, (p) => {
  applyEach(p.telefonos, (t) => {
    required(t.numero, { message: 'Número obligatorio' });
  });
});

agregarTelefono() {
  this.model.update((m) => ({ ...m, telefonos: [...m.telefonos, { numero: '' }] }));
}
```

```html
@for (tel of f.telefonos; track $index) {
  <input [formField]="tel.numero" />
}
<button type="button" (click)="agregarTelefono()">Agregar teléfono</button>
```

### Reutilizar validaciones entre formularios

```ts
import { schema, apply, required, minLength } from '@angular/forms/signals';

export const passwordSchema = schema<string>((path) => {
  required(path, { message: 'La contraseña es obligatoria' });
  minLength(path, 8, { message: 'Mínimo 8 caracteres' });
});

// En cualquier formulario:
f = form(this.model, (p) => {
  apply(p.password, passwordSchema);
});
```

---

## Resumen

| Aspecto | Reactive Forms | Signal Forms |
|---|---|---|
| Fuente de verdad | `FormGroup` | `signal` con el modelo |
| Tipado | `nonNullable.group` + genéricos | inferido del objeto inicial |
| Validaciones | `Validators.x` en el control | `required(p.x)` en el schema |
| Error cruzado | validador de grupo | `validate(p.x, ({ value, valueOf }) => …)` |
| Reaccionar a cambios | `valueChanges` + RxJS | `computed` / `effect`, `debounce()` |
| Control custom | `ControlValueAccessor` + provider | `FormValueControl` con `value = model()` |
| Deshabilitar | `.disable()` imperativo | `disabled(p.x, fn)` declarativo |
| Submit | `(ngSubmit)` + checks manuales | `submit(f, async …)` |
| Async | `AsyncValidatorFn` | `validateHttp` / `validateAsync` |
| Arrays | `FormArray` | array en el signal + `applyEach` |
| Nulos | `string \| null` por defecto | `undefined` = campo ausente; inicializar siempre |

### Cuándo seguir con Reactive Forms

- Codebase grande ya en Reactive Forms donde reescribir no paga.
- Pipelines RxJS pesados sobre `valueChanges`.
- Librerías de terceros que exigen instancias de `FormGroup`.

Ambos coexisten en Angular 22. Para formularios nuevos, Signal Forms.

---

## Fuentes

- [What's new in Angular 22.0? — Ninja Squad](https://blog.ninja-squad.com/2026/06/03/what-is-new-angular-22.0)
- [Angular Signal Forms Tutorial (v22) — Muhammad Ahsan Ayaz, Google Developer Experts](https://medium.com/google-developer-experts/angular-signal-forms-tutorial-v22-4d6b72a306e3)
- [Custom Controls — angular.dev](https://angular.dev/guide/forms/signals/custom-controls)
- [Signal Forms: Complete Guide — Angular In Depth](https://angularindepth.com/article/signal-forms-complete-guide/)
- [Angular 22 Headed Toward Stable Release — Angular In Depth](https://angularindepth.com/article/ng-news-26-14-linkedsignal-write-back-error-boundaries/)
- [Reactive Forms to Signal Forms: A Practical Migration Guide — ITNEXT](https://itnext.io/reactive-forms-to-signal-forms-a-practical-migration-guide-for-angular-45458d609ab8)
- [All About Angular's New Signal Forms — Angular Architects](https://www.angulararchitects.io/?p=31231)

Documentación oficial relacionada (angular.dev → Guides → Forms → Signal Forms):

- [Overview](https://angular.dev/guide/forms/signals/overview)
- [Validation](https://angular.dev/guide/forms/signals/validation)
- [Cross-field logic](https://angular.dev/guide/forms/signals/cross-field-logic)
- [Form submission](https://angular.dev/guide/forms/signals/form-submission)
- [Async operations](https://angular.dev/guide/forms/signals/async-operations)
- [Schemas](https://angular.dev/guide/forms/signals/schemas)
- [Migrating from Reactive Forms](https://angular.dev/guide/forms/signals/migration)
- [Comparison with other form systems](https://angular.dev/guide/forms/signals/comparison)
