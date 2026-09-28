# Guía: Monorepo con Git Worktree para trabajar con varios agentes

## Objetivo

Esta guía describe una estrategia para mantener frontend y backend dentro de un único repositorio Git, permitiendo que varios agentes trabajen en paralelo sin mezclar sus cambios.

La estructura base es:

```text
<nombre-proyecto>/
├── backend/
└── frontend/
```

La estrategia es:

> **Un único repositorio Git + una rama por tarea + un Git worktree por tarea (un agente por worktree).**

> Si backend y frontend deben ser repositorios independientes (permisos, releases o CI separados), ver la guía complementaria: *Repositorios independientes con Git Submodules y Meta-Repo*.

---

## 0. Prerrequisitos

Antes del primer commit:

1. **Crear un `.gitignore`** acorde al stack de cada componente. Como mínimo debe excluir dependencias, artefactos de build y secretos. Por ejemplo:

   ```gitignore
   # Dependencias y builds (ajustar según stack)
   node_modules/
   dist/
   target/
   bin/
   obj/

   # Secretos
   .env
   .env.*
   !.env.example
   ```

2. **Versionar un `.env.example`** por componente con las variables necesarias, pero sin valores reales.

3. **Crear un archivo de instrucciones para agentes** en la raíz (`AGENTS.md`, `CLAUDE.md` o el que use tu agente) que explique la estructura del repo, los comandos de build/test y las reglas de trabajo (ver sección 5). Al estar versionado, aparecerá automáticamente en cada worktree.

Sin el `.gitignore`, un `git add .` inicial puede incluir `node_modules/`, builds o archivos `.env` con secretos en el historial.

---

## 1. Crear el monorepo

Desde la raíz del proyecto:

```bash
cd <nombre-proyecto>

git init -b main
git add .
git status   # revisar que no se incluyan dependencias, builds ni .env
git commit -m "chore: initial commit"
```

`-b main` fija el nombre de la rama inicial (disponible desde Git 2.28). Sin él, Git usa el valor de `init.defaultBranch` o, si no está configurado, `master`, y los comandos de esta guía que asumen `main` fallarían.

La estructura queda:

```text
<nombre-proyecto>/
├── .git/
├── .gitignore
├── AGENTS.md
├── backend/
└── frontend/
```

Esto ya es un monorepo.

No es obligatorio usar Nx, Turborepo, pnpm workspaces u otra herramienta para que sea un monorepo.

---

## 2. Por qué no conviene ejecutar varios agentes en el mismo working tree

Un **working tree** es la carpeta con los archivos del checkout actual sobre la que se edita (por ejemplo, `<nombre-proyecto>/` después de clonar).

Si dos agentes trabajan directamente en `<nombre-proyecto>/`, por ejemplo:

```text
Agente A → backend/
Agente B → frontend/
```

ambos comparten el mismo working tree. Por eso `git diff` puede mostrar simultáneamente cambios de `backend/` y `frontend/`.

También comparten:

- staging area;
- archivos modificados;
- rama activa;
- estado del repositorio.

Aunque trabajen en carpetas distintas, Git sigue viendo un único working tree. Un `git add .` o un `git stash` de un agente afecta el trabajo del otro.

---

## 3. Solución: Git Worktree por tarea

`git worktree` permite tener varias copias de trabajo del mismo repositorio, cada una con una rama distinta.

Se recomienda crear **un worktree por tarea**, no por componente: las ramas por tarea son cortas y se integran limpias, mientras que ramas de larga vida como `agent/backend` se alejan de `main` con el tiempo.

### Convención de nombres

Para no confundir los worktrees con otros clones o repositorios (por ejemplo, un repo llamado `<nombre-proyecto>-backend`), se agrupan en una carpeta hermana:

```text
workspace/
├── <nombre-proyecto>/           ← worktree principal (main)
└── <nombre-proyecto>.wt/        ← worktrees de tareas
    ├── payment-api/
    ├── payment-ui/
    └── security-audit/
```

### Crear los worktrees

Desde el worktree principal:

```bash
cd <nombre-proyecto>

git worktree add ../<nombre-proyecto>.wt/payment-api    -b feat/payment-api
git worktree add ../<nombre-proyecto>.wt/payment-ui     -b feat/payment-ui
git worktree add ../<nombre-proyecto>.wt/security-audit -b audit/security
```

Cada worktree contiene el repositorio completo (`backend/` y `frontend/`) en su propia rama:

```text
Agente A → <nombre-proyecto>.wt/payment-api     → feat/payment-api
Agente B → <nombre-proyecto>.wt/payment-ui      → feat/payment-ui
Agente C → <nombre-proyecto>.wt/security-audit  → audit/security
```

### Variante: worktree por componente

Si se prefiere un agente fijo por componente:

```bash
git worktree add ../<nombre-proyecto>.wt/backend  -b agent/backend
git worktree add ../<nombre-proyecto>.wt/frontend -b agent/frontend
```

En ese caso conviene integrar y actualizar esas ramas con frecuencia (ver sección 8).

### Una rama solo puede estar activa en un worktree

Git no permite tener la misma rama en dos worktrees a la vez. Si `feat/payment-api` está activa en su worktree, no se puede hacer `git switch feat/payment-api` en el principal. Esto es intencional y evita que dos copias modifiquen la misma rama.

---

## 4. Preparar cada worktree: lo que Git no copia

Un worktree nuevo solo contiene los **archivos versionados**. No incluye:

- archivos `.env` (están en `.gitignore`);
- dependencias instaladas (`node_modules/`, paquetes restaurados, etc.);
- artefactos de build;
- bases de datos locales o volúmenes.

Además, si dos agentes levantan servidores o `docker compose` en paralelo, **chocarán los puertos del host**.

### Parametrizar puertos

En `compose.yaml`, usar variables con valores por defecto:

```yaml
services:
  backend:
    ports:
      - "${BACKEND_PORT:-8080}:8080"
  frontend:
    ports:
      - "${FRONTEND_PORT:-4200}:4200"
```

Docker Compose lee automáticamente el `.env` de la carpeta del proyecto, así que cada worktree puede tener sus propios puertos y su propio nombre de proyecto.

### Script para crear worktrees

Un script como `scripts/new-worktree.sh` automatiza la preparación. Ejecutarlo desde el worktree principal:

```bash
#!/usr/bin/env bash
# Uso: scripts/new-worktree.sh <tarea> [rama] [offset-de-puertos]
# Ejemplo: scripts/new-worktree.sh payment-api feat/payment-api 1
set -euo pipefail

TASK="$1"
BRANCH="${2:-feat/$TASK}"
OFFSET="${3:-1}"

ROOT="$(git rev-parse --show-toplevel)"
NAME="$(basename "$ROOT")"
DEST="$ROOT/../$NAME.wt/$TASK"

git -C "$ROOT" worktree add "$DEST" -b "$BRANCH"

# Copiar archivos no versionados necesarios
for f in backend/.env frontend/.env; do
  if [ -f "$ROOT/$f" ]; then
    cp "$ROOT/$f" "$DEST/$f"
  fi
done

# Variables propias del worktree para Docker Compose
cat >> "$DEST/.env" <<EOF
COMPOSE_PROJECT_NAME=$NAME-$TASK
BACKEND_PORT=$((8080 + OFFSET))
FRONTEND_PORT=$((4200 + OFFSET))
EOF

echo "Worktree listo en $DEST"
echo "Falta instalar dependencias según el stack (npm ci, mvn, dotnet restore, etc.)."
```

`COMPOSE_PROJECT_NAME` evita que los contenedores, redes y volúmenes de distintos worktrees se pisen entre sí; las variables de puerto evitan el choque en el host.

---

## 5. Asignar agentes

Cada agente se ejecuta **desde la raíz de su worktree**:

```bash
cd ../<nombre-proyecto>.wt/payment-api
claude   # o pi, codex, etc.
```

Si la tarea es solo de backend, se indica en el prompt o en `AGENTS.md` que el agente debe limitarse a `backend/`.

### El aislamiento entre carpetas es por convención

`git status` y `git diff` sin argumentos muestran **todo** el worktree, aunque se ejecuten dentro de `backend/`. Y nada impide que el agente edite `frontend/`. Lo que sí queda aislado es el worktree completo respecto a los demás agentes.

Para acotar comandos a una carpeta se usa un **pathspec**: el patrón de rutas que reciben comandos como `git add` o `git diff`. Por ejemplo, `git diff -- backend/src` muestra solo los cambios bajo esa ruta.

Los pathspecs se interpretan **relativos al directorio actual**, salvo que empiecen con `:/`, que los hace relativos a la raíz del repo:

```bash
# Desde la raíz del worktree
git diff -- backend/
git add backend/

# Desde dentro de backend/
git diff -- .
git add .

# Desde cualquier carpeta
git diff -- :/backend
git add :/backend
```

> Error común: ejecutar `git add backend/` estando **dentro** de `backend/`. Git busca `backend/backend/` y responde `pathspec 'backend/' did not match any files`.

### Ejemplo de flujo de un agente

```bash
git status
git diff -- :/backend
git add :/backend
git commit -m "feat: implement payment validation"
```

### Reglas sugeridas para `AGENTS.md`

- Trabajar solo dentro del worktree asignado.
- Limitarse a la carpeta indicada en la tarea (`backend/` o `frontend/`).
- Usar pathspecs explícitos en `git add` (evitar `git add .` desde la raíz si solo se tocó un componente).
- No usar `git stash` (ver sección 6).
- No hacer `git switch` a otras ramas.

---

## 6. Qué queda aislado y qué se comparte

Cada worktree tiene:

- working directory independiente;
- rama independiente;
- staging area independiente;
- archivos modificados independientes.

Todos comparten:

- el historial y los objetos Git;
- las ramas y tags (una rama creada en un worktree es visible en los demás);
- la configuración del repo (`.git/config`);
- los hooks;
- **el stash**: un `git stash` en un worktree aparece en `git stash list` de todos.

Conceptualmente:

```text
                    mismo repositorio
                           │
             ┌─────────────┼──────────────┐
             │             │              │
           main    feat/payment-api  feat/payment-ui
             │             │              │
        worktree 0     worktree 1     worktree 2
```

---

## 7. Ver los worktrees activos

```bash
git worktree list
```

Ejemplo:

```text
/path/<nombre-proyecto>                  abc1234 [main]
/path/<nombre-proyecto>.wt/payment-api   def5678 [feat/payment-api]
/path/<nombre-proyecto>.wt/payment-ui    9a0b123 [feat/payment-ui]
```

---

## 8. Integrar los cambios

### Actualizar la rama de la tarea antes de integrar

Si `main` avanzó mientras el agente trabajaba, conviene incorporar esos cambios en la rama de la tarea y resolver conflictos ahí.

**Con repositorio remoto** (el caso habitual), incorporar `origin/main`, no la rama local `main`:

```bash
cd ../<nombre-proyecto>.wt/payment-api
git fetch origin
git rebase origin/main   # o: git merge origin/main
```

`git fetch` actualiza `origin/main`, pero no mueve la rama local `main`. Además, desde el worktree de la tarea no se puede actualizar `main`: está activa en el worktree principal, así que `git switch main` falla y `git fetch origin main:main` se niega a modificarla. Por eso la referencia confiable es `origin/main`.

**Sin remoto** (flujo solo local), la fuente de verdad es la rama local `main`:

```bash
git rebase main          # o: git merge main
```

### Integrar en main

Desde el worktree principal, primero actualizar `main` y luego integrar:

```bash
cd <nombre-proyecto>
git switch main
git pull --ff-only       # si se trabaja con remoto
git merge feat/payment-api
git merge feat/payment-ui
git push                 # si se trabaja con remoto
```

`--ff-only` evita que el `pull` cree un merge inesperado si el `main` local tuviera commits propios; en ese caso falla y obliga a revisar.

También se pueden usar Pull Requests, que es lo recomendable si hay revisión humana o CI. En ese flujo la integración ocurre en el remoto y basta con que la rama de la tarea esté actualizada contra `origin/main`.

Si se usa la variante por componente (`agent/backend`, `agent/frontend`), estas ramas deben actualizarse con `origin/main` (o `main`, sin remoto) después de cada integración para que no diverjan.

---

## 9. Eliminar worktrees

Después de integrar o guardar los cambios:

```bash
git worktree remove ../<nombre-proyecto>.wt/payment-api
```

Si el worktree tiene cambios sin commit, Git se niega a eliminarlo. `--force` lo elimina igual, **descartando esos cambios**:

```bash
git worktree remove --force ../<nombre-proyecto>.wt/payment-api
```

Luego, si la rama ya no se necesita:

```bash
git branch -d feat/payment-api   # falla si la rama no fue integrada
```

Si se borró la carpeta de un worktree manualmente, limpiar las referencias obsoletas:

```bash
git worktree prune
```

---

## 10. Ventajas

- Un único historial del producto.
- Backend y frontend pueden cambiar en un mismo commit (cambios atómicos).
- Fácil coordinación de cambios transversales.
- Un solo clon del repositorio lógico.
- Los agentes pueden trabajar en paralelo, cada uno en su worktree.
- `git diff` separado por worktree.
- No requiere separar artificialmente frontend y backend en repos distintos.
- Compatible con cualquier stack tecnológico.

---

## 11. Desventajas

- Backend y frontend comparten permisos Git.
- El historial contiene cambios de ambos componentes.
- Las ramas pertenecen al mismo repositorio.
- Cada worktree necesita su propia instalación de dependencias (más espacio en disco y tiempo de preparación).
- En CI, sin filtros por ruta, un cambio en backend dispara también el build del frontend. Conviene configurar los pipelines para ejecutarse solo cuando cambian archivos del componente. Por ejemplo, en GitHub Actions:

  ```yaml
  on:
    push:
      paths:
        - "backend/**"
  ```

- Si en el futuro se quiere separar backend o frontend como repositorios independientes, hay que extraer su historial.

Para separar más adelante:

```bash
# git filter-repo (se instala aparte) sobre un clon nuevo
git filter-repo --subdirectory-filter backend

# o, con herramientas incluidas en Git
git subtree split --prefix=backend -b backend-only
```

---

## 12. Cuándo elegir esta estrategia

Usar monorepo + worktrees cuando:

- backend y frontend forman parte del mismo producto;
- suelen evolucionar juntos;
- es útil hacer cambios atómicos que afecten ambos;
- no se necesitan permisos Git distintos;
- el principal problema es permitir trabajo paralelo de varios agentes.

---

# Recomendación

Para:

```text
<nombre-proyecto>/
├── backend/
└── frontend/
```

si ambos componentes forman parte del mismo producto y no necesitan ser repositorios independientes, usar:

> **Monorepo + una rama por tarea + un worktree por tarea, con un agente por worktree.**

Acompañarlo de:

- un `.gitignore` y `.env.example` desde el primer commit;
- un `AGENTS.md` con las reglas de trabajo;
- un script que cree worktrees con `.env` y puertos propios.

No hace falta introducir submodules únicamente para separar el `git diff` de varios agentes.
