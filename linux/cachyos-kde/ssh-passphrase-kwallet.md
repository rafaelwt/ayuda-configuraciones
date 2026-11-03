# SSH sin pedir passphrase en CachyOS (KDE Plasma)

Objetivo: que **todas** tus llaves SSH se carguen solas al iniciar sesión y que la
passphrase quede guardada en **KWallet** (el llavero de KDE). Escribes la passphrase
una sola vez por llave y no te la vuelve a pedir, aunque reinicies.

> **¿Por qué hoy solo se carga la de GitHub?** `ssh-add` sin argumentos solo carga las
> llaves con nombre estándar (`id_ed25519`, `id_rsa`, `id_ecdsa`...). Las llaves con
> otro nombre (`id_servidor`, `trabajo_ed25519`, etc.) se ignoran. Esta guía carga
> todas las que tengan su `.pub` en `~/.ssh`.

---

## 0. Revisión previa

```bash
echo $SSH_AUTH_SOCK          # qué agente estás usando ahora
ls ~/.ssh/*.pub              # las llaves que tienes
```

Busca y **elimina** cualquier arranque manual del agente en tus archivos de shell,
porque chocaría con el que configuraremos:

```bash
grep -n "ssh-agent\|ssh-add" ~/.bashrc ~/.bash_profile ~/.zshrc ~/.profile \
  ~/.config/fish/config.fish ~/.config/fish/conf.d/*.fish 2>/dev/null
```

Si aparece algo como `eval $(ssh-agent)` o `ssh-add`, bórralo o coméntalo.

---

## 1. Instalar paquetes

```bash
sudo pacman -S --needed ksshaskpass kwalletmanager kwallet-pam openssh
```

| Paquete | Para qué sirve |
|---|---|
| `ksshaskpass` | Ventana gráfica que pide la passphrase y la guarda en KWallet |
| `kwalletmanager` | Aplicación para ver y administrar KWallet |
| `kwallet-pam` | Desbloquea KWallet automáticamente al iniciar sesión |
| `openssh` | Trae `ssh-agent` y su servicio de systemd |

---

## 2. Activar el agente SSH (servicio de usuario)

El paquete `openssh` ya trae dos unidades: `ssh-agent.socket` y `ssh-agent.service`.
La que se activa es el **socket**: systemd arranca el agente la primera vez que alguien
lo usa.

```bash
systemctl --user enable --now ssh-agent.socket
systemctl --user status ssh-agent.socket      # debe decir "active (listening)"
```

> ⚠️ **No crees un `ssh-agent.service` propio** en `~/.config/systemd/user/`. Taparía
> el del paquete y el agente intentaría abrir el mismo socket que `ssh-agent.socket`.
> Si ya creaste uno, bórralo y corre `systemctl --user daemon-reload`.

---

## 3. Variables de entorno de la sesión

Crea `~/.config/environment.d/ssh.conf`:

```bash
mkdir -p ~/.config/environment.d
cat > ~/.config/environment.d/ssh.conf <<'EOF'
SSH_AUTH_SOCK=${XDG_RUNTIME_DIR}/ssh-agent.socket
SSH_ASKPASS=/usr/bin/ksshaskpass
SSH_ASKPASS_REQUIRE=prefer
EOF
```

Esto vale para toda la sesión de Plasma y para cualquier shell (bash, zsh o fish).

---

## 4. (Opcional) Script que carga TODAS las llaves

> Los pasos 4 y 5 son **opcionales**. Sin ellos, el paso 6 (`AddKeysToAgent yes`) carga
> cada llave la primera vez que la usas, tomando la passphrase de KWallet. Hazlos solo si
> quieres que todas las llaves estén en el agente desde que inicias sesión.

```bash
mkdir -p ~/.local/bin
cat > ~/.local/bin/ssh-add-all <<'EOF'
#!/usr/bin/env bash
# Carga en el agente cada llave privada de ~/.ssh que tenga su .pub
for pub in "$HOME"/.ssh/*.pub; do
  key="${pub%.pub}"
  [ -f "$key" ] && ssh-add -q "$key" </dev/null
done
EOF
chmod +x ~/.local/bin/ssh-add-all
```

El `</dev/null` obliga a `ssh-add` a usar `ksshaskpass`, que lee la passphrase guardada
en KWallet.

---

## 5. (Opcional) Ejecutarlo al iniciar sesión

```bash
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/ssh-add-all.desktop <<EOF
[Desktop Entry]
Type=Application
Name=SSH add all keys
Exec=$HOME/.local/bin/ssh-add-all
X-KDE-autostart-phase=2
EOF
```

---

## 6. Configurar `~/.ssh/config`

Agrega al **inicio** del archivo:

```
Host *
  AddKeysToAgent yes
```

Así, si alguna llave no se cargó al iniciar, se agrega al agente la primera vez que
la uses.

> **Muchas llaves y servidores:** con varias llaves en el agente, algunos servidores
> responden `Too many authentication failures`, porque SSH prueba todas. Para evitarlo,
> indica qué llave usa cada host:
>
> ```
> Host github.com
>   IdentityFile ~/.ssh/id_ed25519
>   IdentitiesOnly yes
>
> Host mi-servidor
>   HostName 192.168.1.50
>   User rafael
>   IdentityFile ~/.ssh/id_servidor
>   IdentitiesOnly yes
> ```

---

## 7. KWallet se desbloquea solo

Para que tampoco te pida la contraseña de KWallet al iniciar sesión:

1. Abre **KWalletManager**.
2. El wallet debe llamarse **`kdewallet`**.
3. Su contraseña debe ser **la misma que tu contraseña de usuario de Linux**.
   Puedes cambiarla en *Wallet → Change Password*.
4. Debe usar cifrado **Blowfish** (es el predeterminado; GPG no sirve para el desbloqueo automático).

> ⚠️ El desbloqueo automático **no funciona** si usas *inicio de sesión automático*
> o huella digital, porque PAM nunca recibe tu contraseña.

---

## 8. Aplicar y guardar las passphrases

1. **Cierra sesión y vuelve a entrar** (o reinicia).
2. Aparecerá una ventana de `ksshaskpass` **por cada llave** con passphrase: al iniciar
   sesión si hiciste los pasos 4–5, o la primera vez que uses cada llave (`ssh mi-servidor`)
   si no.
3. Escribe la passphrase y marca **"Remember password"**.

Desde ahí no te vuelve a preguntar.

---

## 9. Verificar

```bash
echo $SSH_AUTH_SOCK                # → /run/user/1000/ssh-agent.socket
echo $SSH_ASKPASS                  # → /usr/bin/ksshaskpass
ssh -T git@github.com              # → Hi rafaelwt! You've successfully authenticated...
```

Prueba final: **reinicia** y conéctate (`ssh mi-servidor`). Debe entrar sin pedir nada.
Con los pasos 4–5, `ssh-add -l` muestra todas tus llaves desde el inicio; sin ellos,
cada llave aparece después de usarla por primera vez.

---

## Solución de problemas

| Síntoma | Causa probable / solución |
|---|---|
| `SSH_AUTH_SOCK` apunta a otra ruta (`/run/user/1000/gcr/ssh`, `/tmp/ssh-...`) | Hay otro agente activo (gnome-keyring o un `eval $(ssh-agent)` en tu shell). Desactívalo: `systemctl --user disable --now gcr-ssh-agent.socket` y revisa el paso 0. |
| `ssh-add -l` → *Could not open a connection to your authentication agent* | El socket no está activo: `systemctl --user status ssh-agent.socket` (paso 2). |
| Pide la passphrase en la terminal, no en una ventana | Falta `SSH_ASKPASS` o `SSH_ASKPASS_REQUIRE`: revisa el paso 3 y cierra sesión. |
| Pide la contraseña de KWallet al iniciar | La contraseña del wallet no coincide con la de tu usuario, o usas inicio automático (paso 7). |
| Una llave no se carga | Su `.pub` no está en `~/.ssh`. Regénerala con `ssh-keygen -y -f ~/.ssh/LLAVE > ~/.ssh/LLAVE.pub`. |
| Ver o borrar passphrases guardadas | KWalletManager → `kdewallet` → carpeta **ksshaskpass**. |
