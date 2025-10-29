# Guía de ngrok

## Configuración inicial

### Agregar token de autenticación

Para agregar tu token de autenticación de ngrok, utiliza el siguiente comando en la terminal:

```bash
ngrok config add-authtoken TU_TOKEN_AQUI
```

> **Nota:** Reemplaza `TU_TOKEN_AQUI` con tu token real obtenido desde el [panel de ngrok](https://dashboard.ngrok.com/get-started/your-authtoken).

## Ubicación del archivo de configuración

Una vez configurado el token, el archivo de configuración se guarda en las siguientes ubicaciones según tu sistema operativo:

### Linux

```bash
cat ~/.ngrok2/ngrok.yml
```

### Windows

```
C:\Users\{TU_USUARIO}\AppData\Local\ngrok\ngrok.yml
```

> **Nota:** Reemplaza `{TU_USUARIO}` con tu nombre de usuario de Windows.

## Comandos útiles

### Iniciar un túnel HTTP

```bash
ngrok http 8080
```

### Iniciar un túnel HTTPS

```bash
ngrok http 8080 --scheme=https
```

### Ver la interfaz web de ngrok

Una vez iniciado, puedes acceder a la interfaz web en: `http://127.0.0.1:4040`

---

**Recursos adicionales:**
- [Documentación oficial de ngrok](https://ngrok.com/docs)
- [Panel de control](https://dashboard.ngrok.com/)