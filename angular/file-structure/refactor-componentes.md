# Refactor: separar template y estilos de componentes

Necesito refactorizar los componentes de este proyecto Angular 22 (standalone, sin NgModules). Hoy los componentes usan template y estilos en línea. Quiero separar los componentes grandes en archivos independientes y dejar los pequeños en un solo archivo. Es solo un cambio de estructura de archivos.

Junto a este prompt te envío un documento con la **estructura de referencia** del proyecto. Úsalo para ubicar cada componente y entender el rol de cada carpeta. NO reorganices el proyecto para que coincida con ese documento: solo mueve componentes a su propia carpeta como se indica abajo.

Si encuentras algún `@NgModule` o archivo `*.module.ts`, DETENTE y avísame: esta tarea asume un proyecto 100 % standalone.

## Alcance

Solo clases con `@Component` dentro de `src/app/**`. No toques servicios, directivas, pipes, guards, interceptors ni archivos de rutas, salvo para actualizar imports cuando muevas un componente.

## Criterio de clasificación

Deja el componente EN UN SOLO ARCHIVO solo si cumple TODO esto:

1. Es presentacional: recibe datos por `input()`/`@Input()` y emite por `output()`/`@Output()`. No inyecta servicios (ni con `inject()` ni por constructor), no hace llamadas HTTP y no inyecta `Router` ni `ActivatedRoute`. Cuenta como servicio cualquier clase `@Injectable` del proyecto, incluidos los servicios de estado. Solo se permite inyectar `ElementRef`, `DestroyRef` y `ChangeDetectorRef`, y usar `RouterLink` en el template.
2. Su template tiene 15 líneas o menos.
3. Sus estilos tienen 10 líneas o menos, o no tiene estilos.

Si no cumple alguna condición, o tienes dudas, SEPÁRALO. Los componentes enrutados (páginas) casi siempre se separan.

## Cómo separar

Para un componente en `product-list.ts`:

- Template → `product-list.html`, con `templateUrl: './product-list.html'`.
- Estilos → `product-list.css` (o la extensión que use el proyecto), con `styleUrl` si es un solo bloque. Si no tiene estilos, no crees el archivo.
- Los archivos nuevos usan el mismo nombre base que el `.ts` existente. Si el archivo es `product-list.component.ts`, crea `product-list.component.html` y `product-list.component.css`. NO renombres `.ts` ni `.spec.ts`.
- NO crees `.spec.ts` si no existía.
- Al mover el template, quita los escapes propios del string de TypeScript (`` \` ``, `\\`, `\$`) y elimina solo la indentación común del bloque. Nada más.
- Si un template usa interpolación de TypeScript `${...}`, NO lo muevas: márcalo en la tabla.

### Carpeta propia

Todo componente (separado o pequeño) debe quedar en su propia carpeta, junto con sus archivos y su `.spec.ts`.

- Una carpeta cuenta como propia si no contiene otro componente. Ejemplo: `features/dashboard/` con solo `dashboard.ts` y `dashboard.routes.ts` ya es su carpeta; no crees `features/dashboard/dashboard/`.
- Si una carpeta contiene 2 o más componentes, mueve cada uno a una subcarpeta con su nombre. Ejemplo: `features/products/components/product-list.ts` → `features/products/components/product-list/product-list.ts`.
- Actualiza solo los imports afectados: `loadComponent` y `component` en los `*.routes.ts`, `imports: []` de otros componentes y specs. Respeta el estilo de import que ya use el proyecto (path alias como `@/app/...` o rutas relativas).
- A los componentes pequeños solo se les mueve de carpeta si hace falta; su contenido no se toca.

## Restricciones

- NO cambies lógica, nombres de clases, selectores, inputs, outputs ni comportamiento.
- NO reformatees el código movido. NO ejecutes Prettier ni `lint --fix`.
- NO modifiques el contenido de los componentes clasificados como pequeños.
- Si el proyecto difiere de la estructura de referencia (archivos duplicados, carpetas fuera de lugar, dependencias entre features), NO lo corrijas: menciónalo en el resumen final.

## Pasos

1. Crea una rama `refactor/separar-componentes`.
2. Ejecuta `ng build` y `ng test --watch=false` y anota los errores o tests que YA fallaban.
3. Muéstrame una tabla: carpeta o feature | componente | ruta actual | ruta final | líneas template | líneas estilos | ¿presentacional? | clasificación | motivo. **Espera mi confirmación.**
4. Haz la separación y los movimientos de carpeta, una feature a la vez. Ejecuta `ng build` al terminar cada feature.
5. En `angular.json`, dentro de `schematics` del proyecto (si la entrada ya existe, modifícala), configura `@schematics/angular:component` con `"inlineTemplate": false` e `"inlineStyle": false`.
6. Ejecuta `ng build` y `ng test --watch=false`. Corrige solo los errores nuevos respecto al paso 2.
7. Dame un resumen por feature de archivos creados, modificados y movidos, los casos que dejaste sin mover y las diferencias que encontraste con la estructura de referencia.
