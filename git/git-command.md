### Clonar un repositorio

```bash
git clone <repo_url>
```

### Trabajar con ramas en git

```bash
git branch # Listar ramas
git branch <branch_name> # Crear rama
git checkout <branch_name> # Cambiar a rama
git checkout -b <branch_name> # Crear y cambiar a rama
git merge <branch_name> # Fusionar rama
git branch -d <branch_name> # Eliminar rama

## usando switch
git switch <branch_name> # Cambiar a rama
git switch -c <branch_name>  # Crear y cambiar a rama
```



### Para fusionar una rama con la rama principal

```bash
git checkout main
git merge <branch_name>
```

### Subir la rama creada al github

```bash
git push origin <branch_name>
```

### Para borrar una rama en el repositorio remoto

```bash
git push origin --delete <branch_name>
```

### Listar ramas remotas

```bash
git branch -r
```

### Descargar una rama creada remotamente

```bash
# Clonar el repositorio
git clone https://github.com/usuario/repositorio.git

# Cambiar a la carpeta del repositorio
cd repositorio

# Ver ramas remotas
git branch -r

# Crear una rama local que rastree la rama remota
git checkout -b <local_branch_name> origin/<remote_branch_name>

# usando switch (método más moderno)
git switch -c <local_branch_name> origin/<remote_branch_name>


```


### Descargar una rama específica

```bash
# Descargar solo una rama específica
git fetch origin <branch_name>

# Cambiar a esa rama específica
git checkout <branch_name>

# O en un solo comando (descargar y cambiar)
git checkout -b <branch_name> origin/<branch_name>

# Usando switch (método moderno)
git switch -c <branch_name> origin/<branch_name>
```



### Si un archivo ya esta rastreado por git y queremos que deje de estarlo

```bash
git rm --cached <file>
git add .
git commit -m "Remove file from tracking"
```

### Resolver conflictos de merge conservando los cambios de la otra rama (theirs)

Cuando haces `git merge <branch_name>` desde `main` y aparecen conflictos, pero quieres conservar los cambios de la rama que estás fusionando.

> En un merge, `theirs` = la rama que estás fusionando, `ours` = la rama actual.

**Opción 1: Resolver archivo por archivo**

```bash
# 1. Ver archivos en conflicto
git status

# 2. Tomar la versión de la otra rama para cada archivo
git checkout --theirs <archivo>
# Ejemplo:
git checkout --theirs src/config/app.xml
git checkout --theirs src/models/users.sql

# 3. Marcar como resueltos (obligatorio)
git add <archivo>
# O todos a la vez:
git add -A

# 4. Finalizar el merge
git commit
```

**Opción 2: Rehacer el merge prefiriendo automáticamente la otra rama**

```bash
git merge --abort
git merge <branch_name> -X theirs
```

**Verificar que no queden conflictos**

```bash
# Buscar marcadores de conflicto en el código
git grep "<<<<<<<"
# Si no devuelve nada, el merge está limpio
```

> **Nota:** `git checkout --theirs` solo actualiza el archivo, no hace commit. Siempre ejecuta `git add` después de resolver un conflicto. En archivos XML o de configuración, conviene revisar manualmente que no se pierdan referencias.