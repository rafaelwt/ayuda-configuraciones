# Portal Pattern (Teleport)

## El problema: Overflow Clipping

Cuando un contenedor tiene `overflow: auto`, `hidden` o `scroll`, los elementos hijos con `position: absolute` (como dropdowns, tooltips, popovers) se **recortan** en los bordes del contenedor.

```
+---------------------------+
| Contenedor (overflow:auto)|
|                           |
|   [Dropdown v]            |
|   +----------+            |  <-- El menu se recorta aqui
+---|  Opcion 1|------------+
    |  Opcion 2|   <-- Esta parte no se ve
    +----------+
```

CSS no permite que un hijo "escape" del overflow de su padre. Ni `z-index`, ni `position: fixed` resuelven todos los casos (fixed rompe el posicionamiento relativo al boton).

## La solucion: Portal

Mover el elemento flotante al `<body>` del documento, **fuera** del arbol DOM del contenedor con overflow. Una libreria de posicionamiento (Popper.js / Floating UI) calcula las coordenadas para que el menu aparezca alineado al boton original.

```
<body>
  <div style="overflow:auto">    <-- Contenedor con overflow
    [Dropdown v]                  <-- Solo el boton queda aqui
  </div>

  <div class="dropdown-menu">    <-- El menu se renderiza aqui, en el body
    Opcion 1
    Opcion 2
  </div>
</body>
```

El menu ya no es hijo del contenedor con overflow, asi que no se recorta.

## Implementacion por framework

### Angular - ng-bootstrap
```html
<!-- container="body" mueve el dropdown al <body> -->
<div ngbDropdown container="body">
  <button ngbDropdownToggle>Menu</button>
  <div ngbDropdownMenu>
    <button ngbDropdownItem>Opcion 1</button>
  </div>
</div>
```

### Angular - ng-select
```html
<!-- appendTo="body" mueve el panel de opciones al <body> -->
<ng-select [items]="items" appendTo="body"></ng-select>
```

### Angular - CDK Overlay
```typescript
// Angular CDK tiene un sistema completo de overlays/portales
import { Overlay } from '@angular/cdk/overlay';
import { Portal } from '@angular/cdk/portal';
```

### React
```jsx
// ReactDOM.createPortal renderiza hijos en un nodo DOM diferente
import { createPortal } from 'react-dom';

function Dropdown({ children }) {
  return createPortal(
    <div className="dropdown-menu">{children}</div>,
    document.body
  );
}
```

### Vue 3
```html
<!-- Teleport mueve el contenido al selector especificado -->
<Teleport to="body">
  <div class="dropdown-menu">
    <button>Opcion 1</button>
  </div>
</Teleport>
```

## Cuando usar Portal

| Situacion | Usar Portal? |
|-----------|-------------|
| Dropdown dentro de contenedor con overflow | Si |
| Dropdown en pagina normal sin overflow | No necesario |
| Modal/Dialog | Si (generalmente ya lo hacen por defecto) |
| Tooltip/Popover dentro de tabla scrolleable | Si |
| Dropdown en header/navbar fijo | No necesario |

## Librerias relacionadas

- **Popper.js / Floating UI**: Calcula la posicion optima del elemento flotante (arriba, abajo, izquierda, derecha) y maneja colisiones con los bordes del viewport. ng-bootstrap lo usa internamente.
- **Angular CDK Overlay**: Sistema completo de portales y overlays de Angular Material.

## Buscar mas informacion

- "CSS Portal pattern"
- "Angular CDK Overlay portal"
- "Dropdown overflow clipping solution"
- "Floating UI" (sucesor de Popper.js)
- "React createPortal"
- "Vue Teleport"

## Ejemplo real en este proyecto

En `pantalla-resultados.component.html`, el dropdown de refresh usaba un menu manual que se recortaba por el `overflow-auto` del contenedor fullscreen. Se soluciono migrando a `ngbDropdown` con `container="body"`:

```html
<div class="btn-group" ngbDropdown container="body">
  <button ngbDropdownToggle>Refresh</button>
  <div ngbDropdownMenu>
    <button ngbDropdownItem>30s</button>
    <button ngbDropdownItem>1m</button>
  </div>
</div>
```
