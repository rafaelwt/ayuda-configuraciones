# Guía: Acceso seguro a tu servidor Ubuntu con llaves SSH

Guía paso a paso para pasar de **login con contraseña como root** a **login con llaves SSH, sin contraseña y con usuario normal**.

> **Concepto base:** la **clave privada** se queda SIEMPRE en tu PC. Nunca se comparte.  
> La **clave pública** se copia a los servidores donde quieres entrar.  
> Piensa: privada = tu llave 🔒 / pública = la cerradura autorizada 🔓.

---

## Resumen del orden

La contraseña sigue activa hasta que las llaves ya funcionan. **Solo al final** se desactiva.

```
1. Entras con contraseña como root, como ahora.
2. Generas llaves en tu PC.
3. Creas un usuario normal en el servidor.
4. Copias la llave pública al servidor usando la contraseña.
5. Configuras ~/.ssh/config en tu PC.
6. Verificas que puedes entrar con la llave.
7. Endureces el servidor (desactivas root y contraseña).
8. Validas la configuración y reinicias SSH.
```

> 🛟 **Red de seguridad:** si en algún momento te quedas fuera del servidor (por un error de configuración o un firewall mal puesto), muchos proveedores de VPS (DigitalOcean, Hetzner, Vultr, etc.) ofrecen una **consola web** desde su panel. Esa consola **no pasa por SSH**, así que puedes entrar y arreglar el problema aunque SSH esté roto. Tenla siempre en mente como plan B.

---

## Paso 1 — Login actual con contraseña

Tu forma actual funciona, pero no es recomendable dejarla así permanentemente. La usamos solo como punto de partida.

```bash
ssh root@<ip>
```

Te pedirá la contraseña del servidor y entrarás como `root`.

> ⚠️ Mantén esta sesión abierta mientras configuras todo lo demás en otra terminal.  
> Así, si algo sale mal, no te quedas afuera.

---

## Paso 2 — Crear las llaves en TU PC, no en el servidor

Esto se ejecuta en tu **laptop** y en tu **PC de escritorio**.  
Cada máquina debe tener su propia llave.

### Opción recomendada: nombrar la llave por propósito

Es mejor no usar siempre el nombre genérico `id_ed25519`, porque podrías terminar mezclando llaves de GitHub, servidores, VPS, etc.

**En la laptop:**

```bash
ssh-keygen -t ed25519 -f ~/.ssh/servidor-vps -C "laptop-servidor-vps"
```

**En la PC de escritorio:**

```bash
ssh-keygen -t ed25519 -f ~/.ssh/servidor-vps -C "pc-escritorio-servidor-vps"
```

Explicación:

```bash
-t ed25519
```

Indica el tipo de llave. `ed25519` es una opción moderna y recomendable para SSH.

```bash
-f ~/.ssh/servidor-vps
```

Define el nombre del archivo de la llave.

```bash
-C "laptop-servidor-vps"
```

Agrega un comentario para identificar después de qué equipo viene esa llave.

> Cada PC genera su archivo `servidor-vps` dentro de su propio `~/.ssh/`, así que no se pisan entre sí. Lo que las diferencia en el servidor es el comentario `-C`, por eso conviene que sea distinto en cada máquina.

Cuando pregunte por la **passphrase**, pon una si quieres mayor seguridad.  
La passphrase protege tu clave privada si alguien copia el archivo de tu PC.

Esto crea dos archivos:

| Archivo | Qué es | ¿Se comparte? |
|---|---|---|
| `~/.ssh/servidor-vps` | Clave privada | ❌ Nunca |
| `~/.ssh/servidor-vps.pub` | Clave pública | ✅ Sí, va al servidor |

> Si prefieres usar la ruta por defecto, puedes ejecutar simplemente:
>
> ```bash
> ssh-keygen -t ed25519 -C "laptop"
> ```
>
> Pero para manejar varias llaves, es más limpio usar `-f`.

### Evitar teclear la passphrase en cada conexión (`ssh-agent`)

Si le pusiste passphrase a tu llave, tendrías que escribirla cada vez que te conectas. Para no hacerlo (y así no caer en la tentación de quitarle la passphrase), usa `ssh-agent`, que la recuerda mientras tu sesión esté abierta:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/servidor-vps
```

A partir de ahí, te conectas sin que te pida la passphrase hasta que cierres sesión o reinicies.

---

## Paso 3 — Crear un usuario normal en el servidor

No conviene usar `root` directamente para el trabajo diario.

Conectado como `root`, ejecuta:

```bash
adduser tunombre
usermod -aG sudo tunombre
```

- `adduser tunombre` crea el usuario.
- `usermod -aG sudo tunombre` le permite ejecutar comandos administrativos usando `sudo`.

Puedes probar el usuario así:

```bash
su - tunombre
sudo whoami
```

> Nota: `sudo` te pedirá la contraseña **del usuario `tunombre`** (la que pusiste en `adduser`), no la de root.

Si todo está bien, debería responder:

```bash
root
```

---

## Paso 4 — Copiar la llave pública al servidor

Desde **cada PC**, ejecuta:

```bash
ssh-copy-id -i ~/.ssh/servidor-vps.pub tunombre@<ip>
```

Esto usa SSH, **no FTP**.

Te pedirá la contraseña del usuario `tunombre`.  
Después copiará tu llave pública al archivo:

```bash
/home/tunombre/.ssh/authorized_keys
```

Repite el proceso desde la otra PC para que ambas llaves queden autorizadas.

> Tras ejecutarlo, conviene confirmar que la llave llegó. En el servidor, como `tunombre`:
>
> ```bash
> cat ~/.ssh/authorized_keys
> ```
>
> Deberías ver tu llave pública (una línea por máquina, con su comentario al final).

### ¿Por qué usar `-i`?

Porque si tienes varias llaves, `ssh-copy-id` puede elegir una llave por defecto que no necesariamente es la que quieres autorizar en este servidor.

Con `-i` indicas explícitamente cuál llave pública copiar:

```bash
ssh-copy-id -i ~/.ssh/servidor-vps.pub tunombre@<ip>
```

La llave pública no es secreta, pero conviene mantener ordenado el servidor y autorizar solo las llaves necesarias.

### Si `ssh-copy-id` no está disponible

Puedes copiar manualmente el contenido de la llave pública:

```bash
cat ~/.ssh/servidor-vps.pub
```

Luego, en el servidor, como `tunombre`:

```bash
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
```

Pegas la llave pública completa en una sola línea, guardas y ajustas permisos (ver sección [Permisos correctos](#permisos-correctos)).

---

## Paso 5 — Configurar `~/.ssh/config` en tu PC

Para no escribir siempre la IP, usuario y llave, crea o edita este archivo en tu PC:

```bash
nano ~/.ssh/config
```

Agrega:

```sshconfig
Host miservidor
    HostName <ip>
    User tunombre
    IdentityFile ~/.ssh/servidor-vps
    IdentitiesOnly yes
```

Ahora puedes conectarte así:

```bash
ssh miservidor
```

> Conviene proteger este archivo para que solo tú lo leas y escribas:
>
> ```bash
> chmod 600 ~/.ssh/config
> ```

Explicación:

| Opción | Para qué sirve |
|---|---|
| `Host miservidor` | Alias local para conectarte más fácil |
| `HostName <ip>` | IP o dominio real del servidor |
| `User tunombre` | Usuario con el que entrarás |
| `IdentityFile ~/.ssh/servidor-vps` | Llave privada que se usará |
| `IdentitiesOnly yes` | Evita que SSH pruebe otras llaves |

`IdentitiesOnly yes` es útil cuando tienes varias llaves, porque algunos servidores rechazan la conexión después de muchos intentos fallidos.

---

## Paso 6 — Verificar que entras con la llave

Antes de desactivar nada, prueba desde otra terminal:

```bash
ssh miservidor
```

O sin haber configurado el alias todavía:

```bash
ssh -i ~/.ssh/servidor-vps tunombre@<ip>
```

Si entra pidiéndote solo la **passphrase de tu llave** (o no pide nada si usas `ssh-agent` o no pusiste passphrase), funcionó.

Si te sigue pidiendo la contraseña del usuario del servidor, algo falló. Revisa:

```bash
ls -ld ~/.ssh
ls -l ~/.ssh/authorized_keys
```

Los permisos correctos deben ser los de la sección [Permisos correctos](#permisos-correctos).

También revisa que la llave pública esté realmente dentro de:

```bash
~/.ssh/authorized_keys
```

---

## Paso 7 — Endurecer el servidor: desactivar root y contraseña

Haz esto solo cuando ya comprobaste que puedes entrar con llave.

Conectado como `tunombre`, edita la configuración de SSH:

```bash
sudo nano /etc/ssh/sshd_config
```

Busca o agrega estas líneas:

```sshconfig
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
```

Explicación:

| Opción | Significado |
|---|---|
| `PermitRootLogin no` | Prohíbe entrar directamente como `root` |
| `PasswordAuthentication no` | Desactiva login por contraseña |
| `KbdInteractiveAuthentication no` | Evita autenticación interactiva por teclado |
| `PubkeyAuthentication yes` | Permite autenticación con llave pública |

> En sistemas antiguos también puedes ver:
>
> ```sshconfig
> ChallengeResponseAuthentication no
> ```
>
> En versiones modernas de OpenSSH, normalmente se usa `KbdInteractiveAuthentication no`.

> ⚠️ **Antes de guardar y salir**, recuerda el flujo seguro: **edita → valida → reinicia**.  
> Nunca reinicies SSH sin validar primero (lo haces en el Paso 8 con `sudo sshd -t`). Un solo error de sintaxis puede dejarte fuera.

---

## Paso 8 — Validar configuración antes de reiniciar SSH

Antes de reiniciar el servicio, valida que no haya errores de sintaxis:

```bash
sudo sshd -t
```

Si no muestra nada, la configuración es válida.

Ahora reinicia SSH:

```bash
sudo systemctl restart ssh
```

En Ubuntu normalmente el servicio se llama `ssh`.

En algunas distribuciones puede llamarse `sshd`:

```bash
sudo systemctl restart sshd
```

> ⚠️ No cierres tu sesión actual todavía.  
> Abre otra terminal y prueba conectarte:
>
> ```bash
> ssh miservidor
> ```
>
> Si funciona, ya puedes cerrar la sesión antigua.

---

## ¿Dónde se guardan las llaves en el servidor?

Todas las llaves públicas autorizadas viven en un solo archivo dentro de la carpeta del usuario:

```bash
~/.ssh/authorized_keys
```

Para el usuario `tunombre`, la ruta real sería:

```bash
/home/tunombre/.ssh/authorized_keys
```

Puntos importantes:

- Cada usuario tiene su propio `authorized_keys`.
- Cada llave pública ocupa una línea.
- El comentario final ayuda a identificar la máquina, por ejemplo `laptop-servidor-vps`.
- Esta ubicación es estándar de OpenSSH y aplica en Ubuntu, Debian, Fedora, Arch, etc.

### Permisos correctos

SSH puede ignorar el archivo si los permisos están demasiado abiertos.

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

También conviene verificar el dueño:

```bash
sudo chown -R tunombre:tunombre /home/tunombre/.ssh
```

> Estos son los permisos que se referencian en el resto de la guía. Si en cualquier paso dudas, vuelve aquí.

---

## Cómo eliminar una llave

Ejemplo: formateaste una PC, vendiste una laptop o perdiste el móvil.

1. Conéctate desde una máquina que todavía funcione.
2. Abre el archivo:

```bash
nano ~/.ssh/authorized_keys
```

3. Busca la línea por el comentario final, por ejemplo:

```bash
laptop-servidor-vps
```

4. Borra esa línea completa.
5. Guarda y cierra.

> Por eso es importante usar comentarios claros con `-C`.

---

## Mover archivos: usa SFTP, no FTP

- **FTP clásico** usa el puerto 21 y es inseguro: transmite todo, incluida la contraseña, **en texto plano** (sin cifrar). **No lo uses.** (Existe FTPS, que es FTP con cifrado TLS, pero no es lo mismo que SFTP ni hace falta aquí.)
- **SFTP** funciona sobre SSH, usa el mismo puerto SSH y las mismas llaves.

Si SSH funciona con tu llave, SFTP también debería funcionar.

### FileZilla

Configuración básica:

| Campo | Valor |
|---|---|
| Protocolo | SFTP - SSH File Transfer Protocol |
| Host | IP o dominio del servidor |
| Puerto | 22 o el puerto SSH que uses |
| Usuario | `tunombre` |
| Llave | Tu clave privada, por ejemplo `servidor-vps` |

En FileZilla:

1. Ve a **Edición → Configuración → Conexión → SFTP**.
2. Agrega tu archivo de clave privada.
3. Si te pide convertirla a `.ppk`, acepta.
4. Conéctate usando SFTP, no FTP.

> Algunas herramientas modernas ya aceptan llaves OpenSSH directamente.  
> La conversión a `.ppk` depende de la herramienta y la versión.

---

## Conectarse desde apps móviles como Termius

El servidor no sabe qué app usas. Solo verifica si tu clave privada corresponde a una clave pública autorizada.

Opción recomendada:

1. Genera una llave nueva dentro de Termius.
2. Copia la clave pública de Termius.
3. Agrégala al archivo del servidor:

```bash
~/.ssh/authorized_keys
```

Ventaja: si pierdes el móvil, solo borras esa línea.

Alternativa: importar tu clave privada existente al móvil.  
Es más cómodo, pero menos recomendable porque estás copiando la misma clave privada a otro dispositivo.

---

## Firewall con UFW

Antes de activar el firewall, permite SSH.

Si usas el puerto normal 22:

```bash
sudo ufw allow OpenSSH
sudo ufw enable
```

Verifica:

```bash
sudo ufw status
```

Si cambiaste SSH a otro puerto, por ejemplo `1986`, debes permitir ese puerto:

```bash
sudo ufw allow 1986/tcp
sudo ufw enable
sudo ufw status
```

> ⚠️ Si activas UFW sin permitir el puerto correcto de SSH, puedes bloquearte fuera del servidor. (Aquí es donde la consola web del proveedor te salva, ver el [Resumen del orden](#resumen-del-orden).)

---

## Fail2ban

`fail2ban` bloquea IPs que hacen demasiados intentos fallidos de login.

Instalación:

```bash
sudo apt update
sudo apt install fail2ban
```

Activar servicio:

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

Ver estado:

```bash
sudo systemctl status fail2ban
```

Aunque desactives login por contraseña, `fail2ban` sigue siendo útil para reducir ruido y ataques automatizados.

---

## Cambiar el puerto SSH

Cambiar el puerto SSH del `22` a otro puede reducir ruido de bots, pero **no reemplaza** las llaves ni una buena configuración.

Para cambiarlo:

```bash
sudo nano /etc/ssh/sshd_config
```

Ejemplo:

```sshconfig
Port 1986
```

Antes de reiniciar SSH, permite el puerto en UFW:

```bash
sudo ufw allow 1986/tcp
```

Valida configuración:

```bash
sudo sshd -t
```

Reinicia SSH:

```bash
sudo systemctl restart ssh
```

Conecta usando el puerto nuevo:

```bash
ssh -p 1986 tunombre@<ip>
```

O, si ya lo definiste en `~/.ssh/config` (ver abajo), simplemente:

```bash
ssh miservidor
```

O en `~/.ssh/config`:

```sshconfig
Host miservidor
    HostName <ip>
    User tunombre
    Port 1986
    IdentityFile ~/.ssh/servidor-vps
    IdentitiesOnly yes
```

---

## Checklist final de seguridad

Antes de cerrar tu sesión antigua, verifica:

- [ ] Puedes entrar con `ssh miservidor`.
- [ ] Puedes usar `sudo` con tu usuario normal.
- [ ] `PermitRootLogin no` está configurado.
- [ ] `PasswordAuthentication no` está configurado.
- [ ] `KbdInteractiveAuthentication no` está configurado.
- [ ] `PubkeyAuthentication yes` está configurado.
- [ ] Ejecutaste `sudo sshd -t` sin errores.
- [ ] UFW permite el puerto SSH correcto.
- [ ] Probaste la conexión desde otra terminal.
- [ ] Mantienes tu clave privada solo en tu PC.
- [ ] Cada dispositivo tiene su propia llave.
- [ ] Sabes cómo acceder a la consola web de tu proveedor por si te bloqueas.

---

## Glosario rápido

| Término | Qué es |
|---|---|
| SSH | Secure Shell. Conexión remota cifrada a la terminal del servidor. |
| SSL/TLS | Cifra conexiones web HTTPS. Es distinto de SSH, aunque ambos usan criptografía. |
| SFTP | Transferencia de archivos sobre SSH. Usa el mismo puerto y llaves que SSH. |
| Clave privada | Se queda en tu PC. Nunca se comparte. |
| Clave pública | Se copia al servidor dentro de `authorized_keys`. |
| Passphrase | Contraseña que protege tu clave privada. No es la contraseña del servidor. |
| `ssh-agent` | Programa que recuerda tu passphrase durante la sesión para no reescribirla. |
| `authorized_keys` | Archivo del servidor donde se guardan las llaves públicas autorizadas. |
| `sshd_config` | Archivo principal de configuración del servidor SSH. |
| UFW | Firewall simple para Ubuntu/Debian. |
| Fail2ban | Herramienta que bloquea IPs con muchos intentos fallidos. |
