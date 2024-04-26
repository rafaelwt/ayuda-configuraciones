Si un archivo ya esta rastreado por git y queremos que deje de estarlo

```
git rm --cached <file>
git add .
git commit -m "Remove file from tracking"
```
