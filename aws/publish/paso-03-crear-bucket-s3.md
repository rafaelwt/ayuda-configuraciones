# Paso 2: Crear el Bucket S3 y Subir el Build de Angular

---

## 2.1 — Crear el Bucket

1. Ir a **S3** en la consola de AWS
2. Clic en **Create bucket**
3. **Bucket name:** usar el nombre de tu dominio (ej: `miapp.com`)
4. **AWS Region:** elegir la más cercana (ej: `us-east-1`)
5. **Block all public access:** dejarlo **activado** (CloudFront accederá con OAC, no necesitamos acceso público)
6. Dejar el resto por defecto
7. Clic en **Create bucket**

> **Tip:** Nombrar el bucket igual que el dominio es una convención, no un requisito técnico.

## 2.2 — Subir el Build de Angular

### Desde la consola web

1. Entrar al bucket creado
2. Clic en **Upload**
3. Subir **todo el contenido** de la carpeta `dist/tu-proyecto/browser/` (no la carpeta en sí, sino su contenido)
4. Clic en **Upload**

La estructura dentro del bucket debería verse así:

```
/
├── index.html
├── favicon.ico
├── assets/
│   └── ...
├── main-XXXX.js
├── polyfills-XXXX.js
└── styles-XXXX.css
```

### Desde AWS CLI (alternativa)

```bash
aws s3 sync ./dist/tu-proyecto/browser/ s3://miapp.com --delete
```

> El flag `--delete` elimina archivos en S3 que ya no existen en tu build local.

## 2.3 — Verificar la Subida

1. Dentro del bucket, confirmar que `index.html` está en la raíz
2. Verificar que las carpetas `assets/` y los archivos `.js` y `.css` estén presentes

---