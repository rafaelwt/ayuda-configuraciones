# Generar contraseñas seguras en Linux

## Usando OpenSSL

```bash
# Contraseña de 24 caracteres en base64
openssl rand -base64 24

# Contraseña de 32 caracteres en base64
openssl rand -base64 32

# Contraseña en hexadecimal (solo letras y números)
openssl rand -hex 16
```

## Usando /dev/urandom

```bash
# Contraseña alfanumérica de 20 caracteres
tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 20; echo

# Contraseña con caracteres especiales de 24 caracteres
tr -dc 'A-Za-z0-9!@#$%&*_+=' < /dev/urandom | head -c 24; echo
```

## Usando pwgen

```bash
# Instalar pwgen
sudo apt install pwgen

# Contraseña segura de 20 caracteres
pwgen -s 20 1

# Contraseña segura con símbolos
pwgen -sy 20 1
```

## Referencia rápida

| Comando | Ejemplo de salida | Uso recomendado |
|---|---|---|
| `openssl rand -base64 24` | `a3Bf9kLm2xPq7wRt1yNz4vHj` | Tokens, API keys |
| `openssl rand -hex 16` | `4f8a1b3c9d2e7f6a0b5c8d1e` | Hashes, identificadores |
| `tr -dc ... < /dev/urandom` | `kP9$mR2!xL7@nW4#` | Contraseñas de usuario |
| `pwgen -sy 20 1` | `aB3$kL9!mN2@pQ7#wX` | Contraseñas con símbolos |
