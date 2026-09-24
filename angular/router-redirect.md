# router-redirect

Evitar que la ruta padre se muestre en blanco antes de redirigir a la ruta hija por defecto, con rutas standalone y un guard funcional.

`app.routes.ts`:

```typescript
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
        loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
        children: [
          {
            path: '',
            redirectTo: 'profile',
            pathMatch: 'full',
          },
          {
            path: 'profile',
            loadComponent: () => import('./profile/profile.component').then((m) => m.ProfileComponent),
          },
          {
            path: 'user-management',
            loadComponent: () =>
              import('./user-management/user-management.component').then((m) => m.UserManagementComponent),
          },
          {
            path: 'role-management',
            loadComponent: () =>
              import('./role-management/role-management.component').then((m) => m.RoleManagementComponent),
          },
        ],
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'token-verify',
    loadComponent: () =>
      import('./two-factor-verification/two-factor-verification.component').then(
        (m) => m.TwoFactorVerificationComponent,
      ),
  },
];
```

`auth.guard.ts`:

```typescript
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated() ? true : router.parseUrl('/login');
};
```

El `redirectTo: 'dashboard'` con `pathMatch: 'full'` en la ruta vacía evita que se renderice una pantalla en blanco al entrar a la ruta padre sin ruta hija. Lo mismo aplica al redirect de `dashboard` hacia `profile`. `loadComponent`/`loadChildren` mantienen cada rama de la ruta en su propio chunk cargado de forma perezosa.
