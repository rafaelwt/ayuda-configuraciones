# Opengrep: instalación, reglas y ejecución

Opengrep es un analizador estático (SAST) basado en patrones. Es un fork con licencia LGPL-2.1 de Semgrep 1.100: <https://github.com/opengrep/opengrep>.

- Versión de referencia de esta guía: **v1.30.2** (2026-10-07).
- Es una herramienta de **desarrollo y CI**. No se instala en servidores de producción.
- Complementa a SonarQube: las reglas propias se escriben en YAML en lugar de plugins Java.

---

## 1. Instalar Opengrep

### Paso 1.1: Ejecutar el instalador oficial (Linux/macOS)

```bash
curl -fsSL https://raw.githubusercontent.com/opengrep/opengrep/main/install.sh | bash
```

**Resultado esperado:** el binario queda en `~/.opengrep/cli/v1.30.2/` (junto con los archivos `.cert` y `.sig` de Cosign) y se crea el enlace `~/.local/bin/opengrep`.

> En Windows (PowerShell):
>
> ```powershell
> irm https://raw.githubusercontent.com/opengrep/opengrep/main/install.ps1 | iex
> ```

### Paso 1.2: Verificar la instalación

```bash
opengrep --version
```

**Resultado esperado:** imprime `1.30.2`. Si responde `command not found`, agregar `~/.local/bin` al `PATH`.

---

## 2. Descargar las reglas de la comunidad

El instalador **no incluye reglas**. Las reglas de la comunidad están en un repositorio aparte: <https://github.com/opengrep/opengrep-rules> (fork de `semgrep-rules` del 2024-12-13; GitHub no declara licencia, figura como `NOASSERTION`).

### Paso 2.1: Clonar las reglas fuera de tus proyectos

```bash
git clone --depth 1 https://github.com/opengrep/opengrep-rules ~/opengrep-rules
```

**Resultado esperado:** existe `~/opengrep-rules/` con carpetas por lenguaje, por ejemplo `typescript/{nestjs,angular,react,lang}`, `javascript/{express,jsonwebtoken,node-crypto,...}`, `python/`, `go/`, `java/`.

### Paso 2.2: Actualizar las reglas cuando haga falta

```bash
git -C ~/opengrep-rules pull
```

**Resultado esperado:** `Already up to date.` o la lista de archivos actualizados.

---

## 3. Crear reglas personalizadas

Las reglas propias se versionan **dentro de cada repositorio**, por ejemplo en `.opengrep/rules/`.

### Paso 3.1: Crear la carpeta de reglas del proyecto

```bash
mkdir -p .opengrep/rules
```

**Resultado esperado:** existe la carpeta `.opengrep/rules/` en la raíz del proyecto.

### Paso 3.2: Escribir la regla

Crear `.opengrep/rules/no-inline-app-error.yml`:

```yaml
rules:
  - id: no-inline-app-error
    languages: [typescript]
    severity: ERROR
    message: Use a factory from *.errors.ts
    pattern: new AppError(...)
```

**Resultado esperado:** el archivo existe y define una regla con `id`, `languages`, `severity`, `message` y `pattern`.

### Paso 3.3: Validar el YAML sin escanear

```bash
opengrep scan --validate -f .opengrep/rules
```

**Resultado esperado:** `Configuration is valid - found 0 configuration error(s), and 1 rule(s).` Si hay un error de sintaxis o un campo inválido, lo informa con el archivo y la línea.

### Paso 3.4: Crear un archivo de prueba anotado

Crear `.opengrep/rules/no-inline-app-error.ts` (mismo nombre base que la regla):

```typescript
// ruleid: no-inline-app-error
throw new AppError('USER_NOT_FOUND');

// ok: no-inline-app-error
throw userNotFound();
```

**Resultado esperado:** `// ruleid: <id>` marca la línea donde la regla **debe** dispararse; `// ok: <id>` marca la línea donde **no debe** dispararse.

### Paso 3.5: Probar las reglas

```bash
opengrep scan --test .opengrep/rules
```

**Resultado esperado:** `1/1: ✓ All tests passed`. Si la regla no salta donde dice `ruleid` o salta donde dice `ok`, la prueba falla e indica la línea.

---

## 4. Correr Opengrep

`-f` (equivalente a `-c` / `--config`) acepta:

| Fuente | Ejemplo |
|--------|---------|
| Archivo YAML | `-f .opengrep/rules/no-inline-app-error.yml` |
| Carpeta de `.yml`/`.yaml` | `-f ~/opengrep-rules/typescript` |
| URL de un archivo | `-f https://.../regla.yml` |
| Repositorio git (requiere `--experimental`) | `-f git+https://github.com/org/rules#<tag>` |

`-f` se puede repetir para combinar fuentes.

### Paso 4.1: Escanear con reglas de la comunidad y propias

```bash
opengrep scan -f ~/opengrep-rules/typescript -f .opengrep/rules src
```

**Resultado esperado:** lista de hallazgos de ambas fuentes, cada uno con archivo, línea, id de la regla y mensaje.

### Paso 4.2: Exportar a JSON

```bash
opengrep scan -f .opengrep/rules --json src > opengrep.json
```

**Resultado esperado:** se crea `opengrep.json` con los hallazgos en formato JSON.

### Paso 4.3: Exportar a SARIF

```bash
opengrep scan -f .opengrep/rules --sarif-output=opengrep.sarif src
```

**Resultado esperado:** se crea `opengrep.sarif`, apto para GitHub Code Scanning u otras herramientas que leen SARIF.

### Paso 4.4: Activar análisis taint dentro de cada archivo

```bash
opengrep scan -f ~/opengrep-rules/typescript --taint-intrafile src
```

**Resultado esperado:** las reglas de tipo taint (flujo de datos de una fuente a un sumidero) se evalúan entre funciones del mismo archivo.

### Paso 4.5: Usar reglas remotas fijadas en CI

```bash
opengrep scan --experimental -f git+https://github.com/opengrep/opengrep-rules#<commit> -f .opengrep/rules src
```

**Resultado esperado:** Opengrep clona las reglas en el commit indicado y escanea. Se clona en cada ejecución, por eso conviene en CI y no en local.

---

## Recomendaciones

- Reglas propias: versionadas en el repo (`.opengrep/rules/`), con su archivo de prueba al lado.
- Reglas de la comunidad: clon local fuera del repo, o `git+...#<commit>` en CI para que el resultado sea reproducible.
- Correr `--validate` y `--test` antes de agregar una regla nueva al pipeline.
