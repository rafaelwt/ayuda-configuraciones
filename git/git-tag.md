# Git Tags

## Listar tags

```bash
# Listar todos los tags
git tag

# Listar tags con patrón
git tag -l "v1.*"
```

## Crear tags

```bash
# Tag ligero (solo nombre)
git tag <tag_name>

# Tag anotado (recomendado - incluye mensaje, autor, fecha)
git tag -a <tag_name> -m "Mensaje del tag"

# Tag en un commit específico
git tag -a <tag_name> <commit_hash> -m "Mensaje del tag"
```

## Ver información

```bash
git show <tag_name>
```

## Subir tags al remoto

```bash
# Subir un tag específico
git push origin <tag_name>

# Subir todos los tags
git push origin --tags

# Subir ramas y tags juntos
git push origin main develop --tags
```

## Eliminar tags

```bash
# Eliminar tag local
git tag -d <tag_name>

# Eliminar tag remoto
git push origin --delete <tag_name>
# Alternativa
git push origin :refs/tags/<tag_name>
```

## Trabajar con tags

```bash
# Checkout a un tag (estado detached HEAD)
git checkout <tag_name>

# Crear rama desde un tag
git checkout -b <branch_name> <tag_name>
```
