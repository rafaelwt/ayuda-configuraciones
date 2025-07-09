# Comandos Git para Ramas y Submódulos

## Clonar una Rama Específica

```bash
git clone -b responsive <repo_url> <folder_name>
```

Este comando permite clonar un repositorio Git especificando una rama concreta:
- `-b responsive`: Indica la rama que queremos clonar (en este caso "responsive")
- `<repo_url>`: URL del repositorio (ejemplo: https://github.com/usuario/repositorio.git)
- `<folder_name>`: Nombre de la carpeta local donde se clonará el repositorio

**Cuándo usar**: Cuando necesitas trabajar específicamente con una rama del repositorio que no es la principal (main/master).

## Actualizar e Inicializar Submódulos

```bash
git submodule update --init <folder_name>
```

Este comando inicializa y actualiza los submódulos Git dentro de un repositorio:
- `--init`: Inicializa los submódulos que aún no han sido inicializados
- `<folder_name>`: Nombre del submódulo específico a actualizar (opcional, si se omite se actualizan todos)

**Cuándo usar**: Después de clonar un repositorio que contiene submódulos, o cuando necesitas asegurarte de que los submódulos están actualizados a la versión correcta.

## Comandos Adicionales para Submódulos

### Clonar un Repositorio con sus Submódulos

```bash
git clone --recurse-submodules <repo_url>
```

Clona un repositorio e inicializa todos sus submódulos automáticamente.

### Actualizar Todos los Submódulos a la Última Versión

```bash
git submodule update --remote
```

Actualiza todos los submódulos a la última versión disponible en sus respectivos repositorios remotos.

