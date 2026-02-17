### Verificar que en el angular.json se encuentre la configuración de los environments

```json
   "configurations": {
            "production": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ],
            },

          },

```

### build

> ng build --configuration production --output-hashing=all
