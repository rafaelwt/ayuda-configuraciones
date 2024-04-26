### Crear el archivo launch.json

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Nest Framework",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug", "--", "--inspect-brk"],
      "autoAttachChildProcesses": true,
      "restart": true,
      "sourceMaps": true,
      "stopOnEntry": false,
      "console": "integratedTerminal"
    }
  ]
}
```

### Solucion error : Delete `␍`eslintprettier/prettier

1. Abrir el archivo .eslintrc.js
2. Buscar la propiedad rules
3. Dentro de rules buscar la regla `prettier/prettier`

```
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    "prettier/prettier": [
      "error",
      { endOfLine: "auto" }
    ],
  },
```
