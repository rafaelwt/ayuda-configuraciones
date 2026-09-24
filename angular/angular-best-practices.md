You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Do NOT set `standalone: true` inside Angular decorators. It's the default since Angular v19.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly in `@Component`. `OnPush` is the default since Angular v22 (`ChangeDetectionStrategy.Default` is deprecated in favor of `Eager`).
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Imports

- Do NOT use barrel files (`index.ts`)
- Use direct imports: `import { X } from './path/to/x'`
- Do NOT import `CommonModule`; import only the directives and pipes the template uses, such as `AsyncPipe` or `DatePipe`

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`, `form()`, `[formField]`) for new forms. They are stable since Angular v22 and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms (i.e. maintaining existing code), prefer Reactive forms instead of Template-driven ones; use `[ngValue]` on Reactive Forms `<select>` options to preserve non-string types
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.
- Separate `.ts` and `.html` files for substantial templates

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- For new code, prefer `toSignal()`, `resource()`, or `httpResource()` over the async pipe; reach for the async pipe only when a value must stay an Observable
- Do not assume globals like (`new Date()`) are available.
- Do not write arrow functions in templates (they are not supported).

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service()` decorator over `@Injectable({ providedIn: 'root' })` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection
