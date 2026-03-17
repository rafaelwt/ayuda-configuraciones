# Cloudflare Tunnel (Windows) — Guía Básica

## 1. Instalar `cloudflared`

```bash
winget install --id Cloudflare.cloudflared
```

Verificar:

```bash
cloudflared --version
```

## 2. Exponer tu app Angular

Primero ejecuta tu app:

```bash
ng serve
```

Luego crea el túnel:

```bash
cloudflared tunnel --url http://localhost:4200
```

Obtendrás una URL pública como:

```
https://xxxx.trycloudflare.com
```

Esa URL abre tu Angular desde internet.

## 3. Permitir el dominio en Angular

Angular bloquea hosts externos. En `angular.json` agrega:

```json
"allowedHosts": [".trycloudflare.com"]
```

Luego reinicia Angular:

```bash
npm start
```

## 4. Error que puedes ignorar

Si aparece:

```
ERR Cannot determine default origin certificate path
```

No importa. Solo significa que no estás usando una cuenta Cloudflare. El túnel funciona igual.
