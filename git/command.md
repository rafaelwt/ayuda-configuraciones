Si un archivo ya esta rastreado por git y queremos que deje de estarlo

```
git rm --cached <file>
git add .
git commit -m "Remove file from tracking"
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


### Dejar de rastrear un archivo

```bash
git rm --cached <file>
```


