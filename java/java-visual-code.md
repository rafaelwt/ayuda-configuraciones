# Soluciones comunes en VS Code para proyectos Java / Spring Boot

## 1. Limpiar el Workspace del Java Language Server

Si la dependencia ya está presente en el proyecto, el servidor de lenguaje Java de VS Code puede tener un problema de configuración interna. Limpiar el workspace puede resolverlo.

1. Abre la Paleta de Comandos en VS Code (`Ctrl+Shift+P` o `Cmd+Shift+P`).
2. Escribe y selecciona **"Java: Clean the Java language server workspace"**.
3. Reinicia VS Code cuando se te solicite.

## 2. Error: `Valid cannot be resolved to a type` en Spring Boot

Este error ocurre cuando VS Code no encuentra la anotación `@Valid` (de `jakarta.validation` o `javax.validation`). Para solucionarlo:

### Verificar la dependencia en `pom.xml`

Asegúrate de tener la dependencia de validación en tu `pom.xml`:

**Spring Boot 3.x (Jakarta):**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

**Spring Boot 2.x (Javax):**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

### Pasos para resolver el error

1. Agrega la dependencia anterior a tu `pom.xml` si no la tienes.
2. Ejecuta `mvn clean install` o `./mvnw clean install` desde la terminal para descargar la dependencia.
3. Abre la Paleta de Comandos (`Ctrl+Shift+P`) y ejecuta **"Java: Clean the Java language server workspace"**.
4. Reinicia VS Code.

### Verificar el import correcto

Según tu versión de Spring Boot, usa el import correspondiente:

- **Spring Boot 3.x:** `import jakarta.validation.Valid;`
- **Spring Boot 2.x:** `import javax.validation.Valid;`