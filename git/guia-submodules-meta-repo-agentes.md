# Guía: Repositorios independientes con Git Submodules y Meta-Repo

## Objetivo

Esta guía describe una estrategia donde backend y frontend son repositorios Git completamente independientes, pero existe un repositorio padre que los agrupa para facilitar:

- desarrollo local;
- trabajo con agentes;
- documentación;
- Docker Compose;
- scripts;
- coordinación de versiones;
- reproducción de un conjunto exacto de commits.

La estructura conceptual es:

```text
<nombre-proyecto>/
├── backend/   → repositorio independiente
└── frontend/  → repositorio independiente
```

La estrategia es:

> **Backend y frontend independientes + un meta-repo que los referencia mediante Git Submodules.**

> Si backend y frontend no necesitan ser independientes y el objetivo es solo que varios agentes trabajen en paralelo, ver la guía complementaria: *Monorepo con Git Worktree para trabajar con varios agentes*.

### Términos

- **Submodule**: repositorio Git que vive dentro de otro repositorio como una carpeta, pero con historial propio. Por ejemplo, `backend/` dentro del meta-repo.
- **Superproject**: el repositorio que contiene submodules. En esta guía, el meta-repo.
- **Gitlink**: entrada especial en el árbol del superproject que guarda solo el SHA del commit del submodule, no sus archivos. Por ejemplo, `git ls-tree HEAD backend` muestra algo como `160000 commit 47ab92c...  backend`.
- **Detached HEAD**: estado en que el repositorio apunta directamente a un commit en lugar de a una rama. Los commits hechos así no pertenecen a ninguna rama y es fácil perderlos.

---

## 1. Repositorios involucrados

En GitHub, GitLab o similar normalmente existirán tres repositorios:

```text
<nombre-proyecto>              ← meta-repo
<nombre-proyecto>-backend      ← repo independiente
<nombre-proyecto>-frontend     ← repo independiente
```

El meta-repo puede contener:

```text
<nombre-proyecto>/
├── README.md
├── AGENTS.md
├── compose.yaml
├── Makefile
├── docs/
├── scripts/
├── backend/     → submodule
└── frontend/    → submodule
```

---

## 2. Crear los repositorios independientes

Primero crear normalmente los repositorios backend y frontend.

**Cada uno debe tener al menos un commit** (por ejemplo, un `README.md` y un `.gitignore`). Git no puede agregar como submodule un repositorio vacío, porque no hay ningún commit al cual apuntar.

Cada repositorio tiene:

- su propio historial;
- sus propias ramas;
- sus propios tags;
- sus propios releases;
- su propio CI/CD;
- sus propios permisos;
- sus propios commits.

---

## 3. Crear el meta-repo

Crear el repositorio padre y configurar su remoto **antes** de agregar los submodules:

```bash
mkdir <nombre-proyecto>
cd <nombre-proyecto>

git init -b main
git remote add origin <url-meta-repo>
```

`-b main` fija el nombre de la rama inicial (disponible desde Git 2.28). Sin él, Git usa el valor de `init.defaultBranch` o, si no está configurado, `master`, y el `git push -u origin main` de más abajo fallaría porque la rama `main` no existiría.

### Usar URLs relativas

Se recomienda registrar los submodules con URLs relativas al remoto del meta-repo. Así el submodule hereda el host y el protocolo (SSH o HTTPS) con el que se clonó el meta-repo, y funciona igual para quien usa SSH, para quien usa HTTPS y en CI.

Por ejemplo, si el remoto del meta-repo es:

```text
git@github.com:<org>/<nombre-proyecto>.git
```

entonces `../<nombre-proyecto>-backend.git` se resuelve como:

```text
git@github.com:<org>/<nombre-proyecto>-backend.git
```

Agregar los submodules, indicando la rama a seguir con `-b`:

```bash
git submodule add -b main ../<nombre-proyecto>-backend.git  backend
git submodule add -b main ../<nombre-proyecto>-frontend.git frontend
```

`-b main` registra la rama en `.gitmodules`, lo que permite luego actualizar a lo último de esa rama (sección 11). El nombre debe coincidir con la rama real de cada repo hijo: si alguno usa `master` u otra, indicarla en su `-b`.

Luego:

```bash
git add .
git commit -m "chore: add backend and frontend submodules"
git push -u origin main
```

Git crea el archivo `.gitmodules`:

```ini
[submodule "backend"]
	path = backend
	url = ../<nombre-proyecto>-backend.git
	branch = main
[submodule "frontend"]
	path = frontend
	url = ../<nombre-proyecto>-frontend.git
	branch = main
```

La estructura queda:

```text
<nombre-proyecto>/
├── .git/
├── .gitmodules
├── backend/
└── frontend/
```

`backend/` y `frontend/` siguen siendo repositorios Git independientes. El meta-repo guarda qué commit exacto está utilizando de cada uno.

Si ya se agregaron con URL absoluta, se puede editar `.gitmodules` y ejecutar:

```bash
git submodule sync --recursive
```

---

## 4. Qué guarda realmente el meta-repo

Conceptualmente:

```text
<nombre-proyecto>
│
├── backend  → commit a1b2c3d
└── frontend → commit e4f5a6b
```

El meta-repo no trata los archivos internos de backend y frontend como archivos propios. Guarda un gitlink por submodule: una referencia a un commit concreto.

Esto permite representar un snapshot exacto del sistema. Por ejemplo, etiquetando un commit del meta-repo:

```text
release-2026.10

backend  → 47ab92c
frontend → 91fd218
```

---

## 5. Configuración recomendada

Estas opciones reducen los errores más comunes con submodules. Pueden aplicarse por repo o de forma global (`--global`):

```bash
# pull, switch y checkout actualizan los submodules automáticamente
git config submodule.recurse true

# bloquea el push del meta-repo si referencia commits de submodules no publicados
git config push.recurseSubmodules check

# git status muestra un resumen de commits nuevos en cada submodule
git config status.submoduleSummary true

# git diff muestra el diff interno de los submodules en lugar de solo el SHA
git config diff.submodule diff
```

`submodule.recurse` no aplica a `git clone`; para clonar se sigue necesitando `--recurse-submodules`.

---

## 6. Clonar y mantener actualizado el proyecto

Clonar con submodules:

```bash
git clone --recurse-submodules <url-meta-repo>
```

Si ya se clonó sin los submodules:

```bash
git submodule update --init --recursive
```

### Después de cada `git pull` del meta-repo

Sin `submodule.recurse true`, un `git pull` en el meta-repo actualiza los gitlinks pero **no mueve el contenido de los submodules**. `git status` mostrará `modified: backend` aunque nadie lo haya tocado. Para sincronizar:

```bash
git pull
git submodule update --init --recursive
```

---

## 7. Evitar trabajar accidentalmente en detached HEAD

Después de clonar o de `git submodule update`, cada submodule queda en detached HEAD, apuntando al commit que fija el meta-repo.

Antes de comenzar una tarea, verificar:

```bash
cd backend
git status
git branch --show-current   # vacío = detached HEAD
```

Hay dos formas seguras de empezar:

**Crear la rama de la tarea desde el commit fijado** (el meta-repo no ve ningún cambio hasta que haya commits nuevos):

```bash
git switch -c feat/<nombre-tarea>
```

**Actualizar a lo último de `main` de forma consciente**:

```bash
git switch main
git pull
```

En este caso el submodule puede quedar en un commit distinto del que fija el meta-repo, y la raíz mostrará `modified: backend`. Es esperable: habrá que actualizar la referencia (sección 10) o volver al commit fijado con `git submodule update`.

No conviene hacer commits importantes sin verificar en qué rama está el submodule.

---

## 8. Trabajar solamente en backend

```bash
cd backend
git switch -c feat/payment-validation
```

Modificar archivos y hacer commit:

```bash
git add .
git commit -m "feat: implement payment validation"
git push -u origin feat/payment-validation
```

También puede hacerse desde la raíz del meta-repo:

```bash
git -C backend status
git -C backend diff
```

---

## 9. Trabajar solamente en frontend

```bash
cd frontend
git switch -c feat/payment-ui

git add .
git commit -m "feat: implement payment UI"
git push -u origin feat/payment-ui
```

Desde la raíz:

```bash
git -C frontend status
git -C frontend diff
```

---

## 10. Actualizar la referencia en el meta-repo

Supongamos que backend avanzó de `commit A` a `commit B` y ese commit ya está publicado (idealmente integrado en `main` del backend).

Desde la raíz del meta-repo:

```bash
git status            # muestra: modified: backend (new commits)
git add backend
git commit -m "chore: update backend version"
```

Si también cambió frontend:

```bash
git add backend frontend
git commit -m "chore: update application versions"
```

Ese commit del meta-repo representa la combinación exacta:

```text
backend  → commit B
frontend → commit F
```

### Publicar en el orden correcto

El meta-repo nunca debe publicarse antes que los submodules: quien lo clone recibiría una referencia a un commit que no existe en el remoto.

```bash
# Empuja primero los submodules con commits pendientes y luego el meta-repo
git push --recurse-submodules=on-demand
```

Con `push.recurseSubmodules check` configurado (sección 5), un `git push` normal se bloquea si falta publicar algún submodule.

---

## 11. Traer lo último de las ramas remotas

Para llevar los submodules a lo último de la rama configurada en `.gitmodules`:

```bash
# Hace fetch y mueve cada submodule al último commit de la rama configurada.
# El submodule queda en detached HEAD y el meta-repo lo verá como modificado.
git submodule update --remote
```

`--remote` no modifica el gitlink del meta-repo: solo cambia el commit que tiene checkout cada submodule. El gitlink se actualiza cuando se hace `git add` y commit en la raíz (ver abajo).

Existe también una variante con `--merge` (o `--rebase`):

```bash
# Solo si deliberadamente quieres integrar upstream
# en la rama actualmente activa de cada submodule:
git submodule update --remote --merge
```

`--merge` fusiona el último commit remoto **dentro de la rama que esté activa en el submodule**. Si el submodule está en `feat/x`, `main` terminará mezclado en `feat/x`. Antes de usarlo, verificar la rama de cada submodule:

```bash
git submodule foreach 'git branch --show-current'
```

Luego registrar las nuevas referencias en el meta-repo:

```bash
git add backend frontend
git commit -m "chore: bump backend and frontend to latest main"
```

---

## 12. Varios agentes

### Agente global

Se ejecuta desde la raíz del meta-repo:

```bash
cd <nombre-proyecto>
claude   # o pi, codex, etc.
```

Puede leer `backend/`, `frontend/`, `docs/` y `compose.yaml`. Es útil para:

- contratos API;
- integración frontend/backend;
- documentación;
- Docker Compose;
- revisión global.

Desde la raíz, `git status` y `git diff` solo muestran `modified: backend`, sin detalle. Para que el agente entienda la estructura, incluir en la raíz un `AGENTS.md` (o `CLAUDE.md`, según el agente) que indique, por ejemplo:

- que `backend/` y `frontend/` son submodules con repositorio propio;
- que los commits de código se hacen dentro de cada submodule, no en la raíz;
- que para ver cambios se usa `git -C backend diff` o `git diff --submodule=diff`;
- que la raíz solo registra referencias, docs, compose y scripts.

Cada repositorio hijo puede tener además su propio `AGENTS.md` con los comandos de build y test del componente.

### Agente backend

Se ejecuta desde `<nombre-proyecto>/backend/`. Ve el repositorio backend de forma independiente y su `git diff` solo corresponde al backend.

### Agente frontend

Se ejecuta desde `<nombre-proyecto>/frontend/`. Su `git diff` solo corresponde al frontend.

### Varios agentes en el mismo componente

Si dos agentes necesitan trabajar a la vez en backend, vuelve el problema de compartir un working tree. La solución es usar `git worktree`, pero **en un clon independiente del repo hijo**, no en el meta-repo:

```bash
cd workspace
git clone <url-backend> <nombre-proyecto>-backend
cd <nombre-proyecto>-backend

git worktree add ../<nombre-proyecto>-backend.wt/payment-api -b feat/payment-api
git worktree add ../<nombre-proyecto>-backend.wt/refunds     -b feat/refunds
```

No se recomienda crear worktrees del meta-repo: la documentación de Git advierte que el soporte de submodules en múltiples checkouts está incompleto y desaconseja tener varios checkouts de un superproject.

Para la preparación de cada worktree (`.env`, dependencias, puertos), ver la sección 4 de la guía de monorepo + worktrees.

---

## 13. Qué verá Git desde la raíz

Desde el meta-repo:

```bash
git status
```

Git no trata los archivos internos de los submodules como archivos del padre. Puede indicar:

```text
modified:   backend (new commits)
modified:   frontend (modified content)
```

- `new commits`: el submodule está en un commit distinto del registrado.
- `modified content`: el submodule tiene cambios sin commit.

Para ver el detalle:

```bash
git -C backend diff
git -C frontend diff

# o todo junto desde la raíz
git diff --submodule=diff
```

Estado resumido de todos los submodules:

```bash
git submodule status
```

---

## 14. CI del meta-repo

Si el meta-repo tiene su propio pipeline (por ejemplo, tests de integración con `compose.yaml`), el checkout debe incluir los submodules y tener acceso a los tres repositorios.

En GitHub Actions, por ejemplo:

```yaml
- uses: actions/checkout@v4
  with:
    submodules: recursive
    token: ${{ secrets.SUBMODULES_TOKEN }}   # credencial con lectura en los repos hijos
```

Si los submodules son públicos, no se necesitan credenciales adicionales.

Si son repositorios privados distintos, el workflow necesita una credencial con acceso explícito a esos repositorios. El `GITHUB_TOKEN` del meta-repo está limitado al repositorio que ejecuta el workflow y **no debe asumirse como suficiente**, aunque los repos estén en la misma organización. Opciones:

- **Fine-grained PAT** (Personal Access Token con permisos por repositorio) de mínimo privilegio: por ejemplo, solo lectura de *Contents* en los dos repos hijos.
- **Token de GitHub App** instalada en los repos necesarios, generado en el propio workflow.
- **Clave SSH** mediante la opción `ssh-key` de `actions/checkout`. Una *deploy key* solo da acceso a un repositorio, así que para varios repos hijos suele usarse la clave de un usuario de máquina con lectura en todos ellos.

Las URLs relativas (sección 3) hacen que los submodules usen el mismo protocolo que el checkout del meta-repo: si `actions/checkout` clona por HTTPS con el token, los submodules también se clonan por HTTPS con ese token; si se usa `ssh-key`, se clonan por SSH.

---

## 15. Quitar un submodule

```bash
git submodule deinit -f backend   # quita la configuración local y vacía la carpeta
git rm -f backend                 # quita el gitlink y la entrada de .gitmodules
rm -rf .git/modules/backend       # borra la copia interna del repositorio
git commit -m "chore: remove backend submodule"
```

---

## 16. Independizar backend y frontend del meta-repo

Backend y frontend ya son independientes desde el primer día. Si en el futuro se decide eliminar el meta-repo, **no hay que extraer historial**: se siguen usando los repos hijos directamente.

```bash
git clone <url-backend>
git clone <url-frontend>
```

El historial, ramas, tags y releases siguen intactos.

Lo que sí se pierde son los archivos propios del meta-repo. Antes de eliminarlo, mover a donde corresponda:

- `compose.yaml` y scripts de entorno local;
- `docs/` transversales;
- `AGENTS.md` de la raíz;
- el pipeline de integración, si existe.

---

## 17. Ventajas

- Backend y frontend tienen historiales independientes.
- Permisos independientes.
- CI/CD independiente.
- Releases y tags independientes.
- Los agentes pueden trabajar en cada repo sin mezclar `git diff`.
- El meta-repo da contexto completo del producto a un agente global.
- Se puede reproducir una combinación exacta de versiones.
- Backend y frontend pueden independizarse completamente sin migrar historial.
- Útil cuando cada componente tiene ciclo de vida propio.

---

## 18. Costes, riesgos y mitigaciones

Submodules añaden coordinación. Un cambio transversal puede requerir:

```text
1. commit backend
2. push backend
3. commit frontend
4. push frontend
5. actualizar referencias en meta-repo
6. commit y push del meta-repo
```

Los problemas más comunes y cómo mitigarlos:

| Problema | Mitigación |
|---|---|
| Se clona sin submodules | `git clone --recurse-submodules` o `git submodule update --init --recursive` |
| Tras un `pull`, los submodules no se mueven | `git config submodule.recurse true` |
| Commits hechos en detached HEAD | Verificar rama antes de trabajar; `git switch -c feat/<tarea>` (sección 7) |
| El meta-repo referencia un commit no publicado | `git push --recurse-submodules=on-demand` o `push.recurseSubmodules check` |
| Se actualiza un submodule pero no el meta-repo | `git status` en la raíz antes de cerrar la tarea; `status.submoduleSummary true` |
| Problemas de acceso por SSH/HTTPS | URLs relativas en `.gitmodules` |
| Cambios que requieren PRs coordinados en backend y frontend | Integrar primero en cada repo hijo y luego un PR en el meta-repo que actualice ambas referencias |

---

## 19. Submodules no sustituyen Worktree

Son herramientas para problemas distintos.

**Git Worktree** resuelve: varios working trees del mismo repositorio.

**Git Submodule** resuelve: componer varios repositorios Git independientes dentro de otro repositorio.

No conviene usar submodules únicamente para separar el `git diff`. Si se quiere independencia real entre backend y frontend, los submodules son una opción válida, y pueden combinarse con worktrees dentro de cada repo hijo cuando haya varios agentes por componente (sección 12).

---

## 20. Cuándo elegir esta estrategia

Usar repos independientes + submodules cuando:

- backend y frontend deben ser repositorios independientes;
- tienen releases distintos;
- tienen pipelines distintos;
- pueden evolucionar de manera separada;
- pueden tener permisos distintos;
- podrían reutilizarse o desplegarse por separado;
- se quiere conservar la posibilidad de eliminar el repositorio padre en el futuro;
- se quiere un repo coordinador para levantar y documentar el sistema completo.

---

# Recomendación

Para:

```text
<nombre-proyecto>/
├── backend/
└── frontend/
```

si el requisito es:

> **Backend y frontend deben seguir siendo repositorios completamente independientes, pero quiero un punto de entrada común para agentes, documentación, scripts y entorno local.**

entonces una estructura razonable es:

```text
<nombre-proyecto>             ← meta-repo
├── AGENTS.md
├── backend/                  ← submodule
├── frontend/                 ← submodule
├── compose.yaml
├── docs/
└── scripts/
```

Con:

- URLs relativas y rama configurada en `.gitmodules`;
- `submodule.recurse` y `push.recurseSubmodules check` activados;
- un `AGENTS.md` en la raíz que explique cómo trabajar con los submodules;
- worktrees dentro de cada repo hijo si hay varios agentes por componente.

En GitHub existirán normalmente:

```text
<nombre-proyecto>
<nombre-proyecto>-backend
<nombre-proyecto>-frontend
```

El meta-repo coordina. Backend y frontend siguen siendo independientes. Si en el futuro el meta-repo deja de ser necesario, puede eliminarse sin migrar el historial de los otros dos repositorios, moviendo antes sus archivos propios.
