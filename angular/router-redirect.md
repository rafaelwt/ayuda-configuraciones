# router-redirect

Evitar que la ruta padre se muestre en blanco antes de redirigir a la ruta hija por defecto, usando rutas standalone, lazy loading, convenciones de nombres de Angular 22+ y un guard funcional.

`app.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
        children: [
          {
            path: '',
            redirectTo: 'profile',
            pathMatch: 'full',
          },
          {
            path: 'profile',
            loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
          },
          {
            path: 'user-management',
            loadComponent: () =>
              import('./features/user-management/user-management').then((m) => m.UserManagement),
          },
          {
            path: 'role-management',
            loadComponent: () =>
              import('./features/role-management/role-management').then((m) => m.RoleManagement),
          },
        ],
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: 'token-verify',
    loadComponent: () =>
      import('./features/two-factor-verification/two-factor-verification').then(
        (m) => m.TwoFactorVerification,
      ),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
```

`core/guards/auth-guard.ts`:

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../auth/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return auth.isAuthenticated() ? true : router.parseUrl('/login');
};
```

Notas clave:

- El `redirectTo: 'dashboard'` con `pathMatch: 'full'` en la ruta vacía evita que se renderice una pantalla en blanco al entrar a la ruta padre sin ruta hija. Lo mismo aplica al redirect de `dashboard` hacia `profile`.
- La ruta wildcard `path: '**'` al final evita que URLs inexistentes dejen la aplicación en blanco (puede redirigir a `dashboard` o cargar un componente `NotFound`).
- `loadComponent`/`loadChildren` mantienen cada rama de la ruta en su propio chunk cargado de forma perezosa.
- Si quieres evitar incluso descargar el chunk lazy de una ruta protegida cuando el usuario no está autenticado, usa `canMatch: [authGuard]` (`CanMatchFn`) en lugar de `canActivate`.
