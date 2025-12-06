# Convenciones de Git (Conventional Commits)

Este documento describe las convenciones de commits que se utilizan en este proyecto, basadas en [Conventional Commits](https://www.conventionalcommits.org/).

## Formato General

```
<tipo>[ámbito opcional]: <descripción>

[cuerpo opcional]

[nota de pie opcional]
```

## Tipos de Commit

### `feat` - Nueva Funcionalidad
Cuando agregas una nueva característica o funcionalidad al proyecto.

```bash
git commit -m "feat: add user authentication endpoint"
git commit -m "feat(api): add pagination to invoice list"
```

### `fix` - Corrección de Errores
Cuando corriges un bug o error en el código.

```bash
git commit -m "fix: resolve null reference in invoice calculation"
git commit -m "fix(auth): correct JWT token expiration time"
```

### `refactor` - Refactorización
Cuando mejoras el código sin cambiar su funcionalidad (mejor legibilidad, rendimiento, estructura).

```bash
git commit -m "refactor: apply early return pattern to all controllers"
git commit -m "refactor(services): simplify SIAT response handling"
```

### `chore` - Tareas de Mantenimiento
Cambios en herramientas, configuración, dependencias, scripts de build, etc. No afecta el código de producción.

```bash
git commit -m "chore: update dependencies to latest versions"
git commit -m "chore(docker): update docker-compose configuration"
git commit -m "chore: add .gitignore for node_modules"
```

### `docs` - Documentación
Cambios solo en documentación (README, comentarios, guías).

```bash
git commit -m "docs: update API documentation for v1.0"
git commit -m "docs(readme): add installation instructions"
```

### `style` - Formato de Código
Cambios que no afectan la lógica (espacios, formato, punto y coma, etc.).

```bash
git commit -m "style: format code with prettier"
git commit -m "style: fix indentation in controllers"
```

### `test` - Pruebas
Agregar o modificar tests (unitarios, integración, etc.).

```bash
git commit -m "test: add unit tests for invoice service"
git commit -m "test(integration): add SIAT API integration tests"
```

### `perf` - Mejora de Rendimiento
Cambios que mejoran el rendimiento sin alterar funcionalidad.

```bash
git commit -m "perf: optimize database queries in report generation"
git commit -m "perf(cache): implement Redis caching for SIAT responses"
```

### `build` - Sistema de Build
Cambios en el sistema de build o dependencias externas (npm, dotnet, webpack, etc.).

```bash
git commit -m "build: upgrade to .NET 10.0"
git commit -m "build(deps): update Dapper to version 2.1.66"
```

### `ci` - Integración Continua
Cambios en archivos de configuración CI/CD (GitHub Actions, GitLab CI, Jenkins, etc.).

```bash
git commit -m "ci: add automated tests to GitHub Actions"
git commit -m "ci: configure Docker build pipeline"
```

### `revert` - Revertir Cambios
Cuando reviertes un commit anterior.

```bash
git commit -m "revert: revert feat: add user authentication endpoint"
```

## Ámbitos (Scope) Comunes para este Proyecto

Los ámbitos son opcionales pero ayudan a identificar qué parte del proyecto se modificó:

- `api` - Endpoints de la API
- `auth` - Autenticación/Autorización
- `db` - Base de datos
- `siat` - Integración con SIAT
- `pdf` - Generación de PDFs
- `email` - Sistema de correos
- `hangfire` - Trabajos en segundo plano
- `docker` - Configuración Docker
- `deps` - Dependencias

## Breaking Changes (Cambios Incompatibles)

Si un commit introduce cambios incompatibles con versiones anteriores, agregar `!` después del tipo/ámbito:

```bash
git commit -m "feat!: change authentication from JWT to OAuth2"
git commit -m "refactor(api)!: rename all endpoints to follow RESTful conventions"
```

O en el pie del mensaje:

```bash
git commit -m "feat: add new authentication system

BREAKING CHANGE: JWT authentication has been replaced with OAuth2.
All API clients must update their authentication flow.
"
```

## Ejemplos Completos

### Commit Simple
```bash
git commit -m "feat: add invoice PDF download endpoint"
```

### Commit con Ámbito
```bash
git commit -m "fix(siat): handle timeout errors in SOAP requests"
```

### Commit con Cuerpo
```bash
git commit -m "refactor: simplify SIAT service error handling

- Replace nested if-else with early returns
- Add argument validation
- Improve error messages
"
```

### Commit con Breaking Change
```bash
git commit -m "feat!: migrate to new SIAT API v2

BREAKING CHANGE: All SIAT endpoints now use v2 API.
Clients must update their integration code.

Migrated services:
- Facturación
- Sincronización
- Operaciones
"
```

## Buenas Prácticas

### ✅ Hacer

1. **Usa imperativo en presente**: "add" no "added" ni "adds"
2. **Primera letra en minúscula**: "feat: add feature" no "feat: Add feature"
3. **Sin punto final**: "fix: resolve bug" no "fix: resolve bug."
4. **Descripción concisa**: máximo 72 caracteres en la primera línea
5. **Un commit por cambio lógico**: no mezcles múltiples cambios no relacionados
6. **Commits atómicos**: cada commit debe compilar y pasar tests

### ❌ Evitar

1. ~~`git commit -m "changes"`~~ - Muy vago
2. ~~`git commit -m "WIP"`~~ - No hacer commits de trabajo en progreso a main
3. ~~`git commit -m "fix bug"`~~ - No especifica qué bug
4. ~~`git commit -m "update"`~~ - No dice qué se actualizó
5. ~~Commits gigantes~~ - Dividir en commits más pequeños

## Comandos Git Útiles

### Ver Historial de Commits
```bash
# Ver commits en una línea
git log --oneline

# Ver commits con gráfico
git log --oneline --graph --all

# Ver últimos 5 commits
git log -5

# Ver commits de un autor
git log --author="nombre"

# Ver commits por tipo
git log --grep="^feat"
```

### Modificar el Último Commit
```bash
# Cambiar mensaje del último commit
git commit --amend -m "nuevo mensaje"

# Agregar cambios al último commit (sin cambiar mensaje)
git add archivo.cs
git commit --amend --no-edit
```

### Revertir Cambios
```bash
# Revertir un commit específico (crea nuevo commit)
git revert <commit-hash>

# Revertir cambios sin commit
git revert --no-commit <commit-hash>
```

### Ver Cambios
```bash
# Ver diferencias no staged
git diff

# Ver diferencias staged
git diff --cached

# Ver diferencias de un archivo específico
git diff archivo.cs
```

## Ejemplo de Flujo Completo

```bash
# 1. Crear rama para nueva funcionalidad
git checkout -b feat/add-invoice-export

# 2. Hacer cambios en el código
# ... editar archivos ...

# 3. Ver qué cambió
git status
git diff

# 4. Agregar cambios al staging
git add src/Application/Services/InvoiceService.cs
git add src/Web/Controllers/InvoiceController.cs

# 5. Hacer commit con convención
git commit -m "feat(api): add invoice export to Excel endpoint

- Add ExportToExcel method in InvoiceService
- Create GET /api/v1/invoice/export/excel endpoint
- Use EPPlus library for Excel generation
"

# 6. Push de la rama
git push origin feat/add-invoice-export

# 7. Crear Pull Request en GitHub/GitLab
# ... crear PR desde la interfaz web ...
```

## Referencias

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Git Best Practices](https://git-scm.com/book/en/v2/Distributed-Git-Contributing-to-a-Project)
