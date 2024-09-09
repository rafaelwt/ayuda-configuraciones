### debug in nestjs crear launch.json

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

### Version nueva si no funciona la anterior

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "args": ["${workspaceFolder}/src/main.ts"],
      "runtimeArgs": [
        "--nolazy",
        "-r",
        "ts-node/register",
        "-r",
        "tsconfig-paths/register"
      ],
      "sourceMaps": true,
      "envFile": "${workspaceFolder}/.env",
      "cwd": "${workspaceRoot}",
      "console": "integratedTerminal"
    }
  ]
}
```
