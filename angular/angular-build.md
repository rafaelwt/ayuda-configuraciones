# Build y environments

### Generar los archivos de environments

Desde Angular v15 los proyectos nuevos no incluyen `src/environments/` por defecto. Si el proyecto no los tiene, se generan con:

```bash
ng generate environments
```

Esto crea `src/environments/environment.ts` (usado tal cual en producción) y `src/environments/environment.development.ts`, y agrega el `fileReplacements` correspondiente en la configuración `development` de `angular.json` (no en `production`):

```json
"configurations": {
  "development": {
    "fileReplacements": [
      {
        "replace": "src/environments/environment.ts",
        "with": "src/environments/environment.development.ts"
      }
    ]
  }
}
```

### Build

`ng build` compila en modo producción por defecto (no hace falta pasar `--configuration production`):

```bash
ng build
```

El application builder (`@angular/build`, por defecto desde Angular v17) ya aplica hashing a los nombres de los archivos de salida en producción sin necesidad de pasar `--output-hashing` manualmente; usa ese flag solo si necesitas cambiar explícitamente el comportamiento por defecto.
