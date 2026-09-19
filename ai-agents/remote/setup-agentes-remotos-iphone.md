# Controlar agentes de IA desde el iPhone

Guía para llegar a los agentes que corren en tu desktop desde el teléfono, sin abrir un
solo puerto a internet. **Verificada de punta a punta en una instalación real** sobre
CachyOS + KDE + fish, el 2026-09-18: conexión desde datos móviles, mosh activo,
notificación con la pantalla bloqueada, y todo volviendo solo después de un reinicio.

Host: desktop **CachyOS** (Arch, KDE Plasma 6, Wayland, fish) · Cliente: **iPhone** (app
Moshi) · Red: **Tailscale** · Multiplexor: **herdr**

> El texto marcado con ✅ **verificado** salió de esta ejecución real. Lo demás viene del
> video original y de los docs oficiales.

---

## Ruta rápida

Si ya entendés los conceptos y solo querés la secuencia, es esta. Cada fase tiene su
verificación más abajo.

```bash
# 1. Servidor SSH + mosh
sudo pacman -S --needed openssh mosh
sudo systemctl enable --now sshd

# 2. Tailscale
sudo pacman -S --needed tailscale
sudo systemctl enable --now tailscaled
sudo tailscale up                 # interactivo: login en el navegador
sudo tailscale set --ssh=false
#    + instalar Tailscale en el iPhone con LA MISMA cuenta

# 3. Firewall: entrada solo por el túnel
sudo ufw allow in on tailscale0 to any port 22 proto tcp
sudo ufw allow in on tailscale0 to any port 60000:61000 proto udp

# 4. Que nada muera al cerrar sesión
sudo loginctl enable-linger $USER

# 5. Multiplexor
curl -fsSL https://herdr.dev/install.sh | sh
herdr integration install claude      # repetir por cada agente que uses

# 6. Cliente y notificaciones
curl -fsSL https://getmoshi.app/install.sh | sh
moshi-hook host setup                                 # emite el QR de Easy Pair
moshi-hook install --target claude,codex,opencode,pi
moshi-hook service install                            # servicio persistente
moshi-hook status
```

---

## Los tres conceptos

Esto es lo único que hay que entender. El resto es instalación.

### 1. Tu conexión se va a cortar. Asumilo.

WiFi a datos, el ascensor, el subte, bloquear la pantalla. Si entrás por SSH y lanzás el
agente ahí nomás, cuando se caiga la conexión **se murió el proceso**, porque era hijo de
tu sesión.

La solución no es una conexión mágica. Es que **el trabajo no dependa de tu conexión**.
El agente vive del lado del servidor; vos entrás, te adjuntás a algo que ya está
corriendo, decidís y te vas.

> *"Se muere la sesión, se muere el hijo."*

### 2. SSH es cliente y servidor, y son cosas distintas

| | Dirección | Archivos | Ejemplo |
|---|---|---|---|
| **Cliente** | Sale de tu máquina | `~/.ssh/id_*`, `~/.ssh/config` | `git push`, entrar a tu VPS |
| **Servidor** | Entra a tu máquina | `~/.ssh/authorized_keys`, `sshd_config` | el iPhone llegando |

**Esta guía solo toca el servidor.** Tus llaves de GitHub y de tus VPS no se tocan: son
de cliente, dirección opuesta. ✅ **verificado**

### 3. Tres capas independientes, y es fácil confundirlas

| Capa | Quién la hace | De qué depende |
|---|---|---|
| **Llegar** | Tailscale (+ mosh) | La red privada |
| **Que el trabajo viva** | herdr | Lanzar el agente **dentro** de herdr |
| **Que te avise** | Hooks + demonio de moshi | De nada más |

Las tres funcionan por separado, y ahí está la trampa: **vas a recibir notificaciones de
agentes que no están en herdr, y a esos no los vas a poder atender desde el teléfono.**
Ver [Trampas verificadas](#trampas-verificadas).

---

## Por qué herdr y no una terminal común

Esto se entiende mejor probándolo. ✅ **verificado** con dos experimentos:

| Experimento | Resultado |
|---|---|
| Abrir una terminal en la PC, lanzar un agente, después entrar por Moshi | Moshi abre una **terminal limpia**. El agente no aparece por ningún lado |
| Abrir una terminal, lanzar `herdr`, trabajar en dos tabs, después entrar por Moshi | **Están ahí.** Se continúa el trabajo desde el teléfono |

### El mecanismo

Cuando Moshi se conecta, abre una **sesión SSH nueva**, y una sesión SSH nueva arranca
una shell nueva con su propio pty (el dispositivo de terminal).

Tu ventana de terminal en el escritorio es **otro proceso con otro pty**, atado a tu
sesión gráfica. Son dos árboles de procesos que no se conocen.

No es que Moshi "no encuentre" tu terminal: **no existe forma de que una sesión SSH tome
una ventana de terminal ajena.** Son cosas separadas a nivel del sistema operativo.

herdr cambia de quién es la propiedad:

| | Quién es dueño del pty | Consecuencia |
|---|---|---|
| **Terminal común** | La terminal misma | Cerrás la ventana, muere el proceso. Nadie más puede verlo |
| **herdr** | El **servidor** de herdr | Tu terminal es solo un **visor**. Cualquier otro visor —incluida una sesión SSH desde el teléfono— se conecta a lo mismo |

> **herdr separa el proceso de la pantalla que lo muestra.**

Cuando volvés a ver tus tabs desde el teléfono no estás "recuperando" tu terminal: estás
abriendo una **segunda ventana al mismo servidor**. Las dos son igual de válidas, ninguna
es la original.

Es la diferencia entre un pizarrón y un documento compartido. Lo escrito en el pizarrón
existe solo en esa sala. El documento vive en el servidor, y lo abre cualquier pantalla.

### La regla práctica

**La decisión se toma al lanzar, y no tiene vuelta atrás.** Si arrancaste algo fuera de
herdr, no hay forma práctica de meterlo adentro después: el proceso ya nació atado a ese
pty. La pregunta —*"¿puede que quiera tocar esto desde el teléfono?"*— hay que hacérsela
**antes** de escribir el comando, no cuando ya estás en la calle.

Y ojo con no confundir las dos capas:

| Para... | ¿Hace falta herdr? |
|---|---|
| Que te **avise** que algo pasó | ❌ No. Te llega igual, lo lances donde lo lances |
| Poder **continuar** el trabajo desde el teléfono | ✅ Sí, siempre |

En la práctica: **si vas a laburar en serio, abrí `herdr` primero y trabajá siempre ahí
adentro.** No cuesta nada y te saca la decisión de encima. Una terminal pelada dejala
para lo que sabés que se termina antes de que te levantes de la silla.

---

## Fase 0 — Diagnóstico (solo lectura)

Corré esto **antes de tocar nada**. Si algún resultado cae en la matriz de conflictos,
resolvelo primero.

```bash
# --- Servidor SSH ---
systemctl is-enabled sshd; systemctl is-active sshd
sudo ss -ltnp '( sport = :22 )'        # ¿QUIÉN escucha? (clave, ver §A)
eza -1 /etc/ssh/sshd_config.d/ 2>/dev/null
sudo sshd -T 2>/dev/null | rg -i '^(port|pubkeyauthentication|passwordauthentication)'

# --- Tailscale ---
command -v tailscale tailscaled
systemctl is-active tailscaled
tailscale status 2>&1 | head -20
sudo tailscale debug prefs 2>/dev/null | rg -i 'runssh|loggedout'

# --- Firewall ---
systemctl is-active ufw firewalld
sudo ufw status verbose 2>/dev/null

# --- Persistencia y energía ---
loginctl show-user "$USER" --property=Linger
hostnamectl chassis
busctl get-property org.freedesktop.login1 /org/freedesktop/login1 \
  org.freedesktop.login1.Manager IdleAction

# --- Herramientas ---
command -v tmux zellij herdr mosh mosh-server moshi-hook

# --- PATH en shell no interactiva (§H) ---
fish -c 'echo $fish_user_paths'
```

### Reporte esperado

| Check | ¿Conflicto? |
|---|---|
| Unidad SSH (`sshd` vs `ssh`) | §B |
| Proceso que escucha en :22 | §A si es `tailscaled` |
| `RunSSH` en prefs de Tailscale | §A si es `true` |
| Firewall activo (ufw / firewalld / ninguno) | §D si hay dos |
| `Linger` del usuario | — |
| Chasis y `IdleAction` de logind | §E |
| Multiplexores ya instalados | §C |
| `~/.local/bin` en el PATH universal | §H |

---

## Matriz de conflictos

### A. Tailscale SSH se come el puerto 22 *(el más caro de diagnosticar)*

`tailscale ssh` (la función) y tu servidor SSH con llaves **no conviven**. Si `RunSSH`
está en `true`, Tailscale atiende el 22 con identidad propia de tailnet y **no mira tu
`~/.ssh/authorized_keys`** — tu llave, aunque sea perfecta, no vale nada ahí.

**Síntoma:** la conexión se cuelga cerca de un minuto y después tira un error de
autenticación con una llave que está bien. Pista confirmatoria: cualquier otro puerto de
esa máquina responde al instante, el 22 es el único que muere.

**Decisión de esta guía:** vamos con llaves. Entonces:

```bash
sudo tailscale set --ssh=false
```

> **`--ssh=false` es POR NODO, no global.** ✅ **verificado** — lo apagás en la máquina
> donde Moshi necesita autenticarse con llave. Otros nodos de tu tailnet pueden seguir
> con Tailscale SSH prendido para acceso máquina a máquina. No es una decisión de todo o
> nada.

> Si esto se corre **remotamente** sobre una sesión que entró por Tailscale SSH: PARAR.
> Es la rama en la que estás sentado. Solo desde la consola física.

#### Verificación mejor que `ss`

El video usa `sudo ss -ltnp '( sport = :22 )'`. Funciona, pero **sin sudo te da un falso
negativo**: `sshd` corre como root y el kernel te oculta la columna del proceso. ✅
**verificado** (nos comimos ese falso negativo).

Esta es mejor, y no necesita privilegios:

```bash
timeout 5 bash -c 'exec 3<>/dev/tcp/127.0.0.1/22; head -1 <&3'
# → SSH-2.0-OpenSSH_10.5
```

Si Tailscale se apropiara del puerto, **el banner cambiaría**. Te lo dice el servidor
mismo, no una tabla que puede venir censurada por permisos.

### B. `ssh.service` vs `sshd.service`

En Debian/Ubuntu la unidad se llama `ssh` y el paquete `openssh-server`. **En
Arch/CachyOS la unidad es `sshd.service` y el paquete es `openssh`.** Si un tutorial dice
`apt install openssh-server` + `systemctl enable ssh`, acá falla — no está roto, está mal
traducido.

### C. Ya hay tmux o zellij corriendo

No hay conflicto real: herdr corre dentro de tu terminal existente. Pero dos multiplexores
que no se conocen entre sí es peor que uno. Si tenés sesiones tmux con trabajo vivo, no
las mates; dejalas terminar y empezá lo nuevo en herdr.

### D. Dos firewalls activos

ufw y firewalld escriben ambos sobre nftables y se pisan. Elegí uno:

- **Nada activo** → instalá ufw y aplicá la Fase 3.
- **ufw ya activo** → mirá `ufw status verbose` antes de tocar nada. Puede que
  `deny (incoming)` ya esté puesto, y entonces **solo agregás las dos reglas**, sin
  `ufw default` ni `ufw enable`. ✅ **verificado**
- **firewalld activo** → no instales ufw, usá su variante.
- **Ambos** → desactivá uno antes de seguir.

### E. La máquina se suspende (o bootea a Windows)

Si se suspende o se bootea a Windows, **no hay linger ni herdr que salve nada**. El
dual-boot no tiene arreglo: es una decisión de uso.

La suspensión sí, **pero verificá antes de enmascarar nada**, porque el mask tiene un
costo: ✅ **verificado**

```bash
hostnamectl chassis                    # desktop → no hay tapa que cerrar
busctl get-property org.freedesktop.login1 /org/freedesktop/login1 \
  org.freedesktop.login1.Manager IdleAction   # "ignore" → logind no la duerme
```

Y en KDE: Preferencias → Energía → *"Cuando esté inactivo: No hacer nada"*.

**logind tiene su propio `IdleAction`, independiente de lo que diga KDE.** Podés tener
KDE en "No hacer nada" y que logind la suspenda igual. Por eso se chequean los dos.

Si con eso ya no queda ningún disparador automático, **el mask es redundante**. Si aun
así lo querés como red de contención:

```bash
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
```

> ⚠️ Eso bloquea **también la suspensión manual**. El botón de suspender deja de
> funcionar. Reversible con `systemctl unmask`, pero saberlo antes evita el susto.

### F. Algo más ya ocupa el 22

Si `ss` muestra un contenedor u otro servicio en el 22, no lo desalojes por las tuyas. La
alternativa es mover sshd a otro puerto y declararlo en Moshi.

### G. Drop-ins en `/etc/ssh/sshd_config.d/`

Arch reparte configuración ahí. Antes de editar `sshd_config` a mano, leé qué está
efectivamente aplicado con `sudo sshd -T`. Nos importa que `pubkeyauthentication` esté en
`yes`.

### H. PATH de fish en shells no interactivas

Moshi y los hooks lanzan comandos por SSH, que abre una shell no interactiva. Si los
binarios viven en `~/.local/bin` y ese path solo se agrega en la parte interactiva de tu
config, el lanzamiento falla con "command not found".

```fish
fish_add_path -U ~/.local/bin        # -U = universal, vale en shells no interactivas
```

Verificación: `fish -c 'echo $fish_user_paths'` tiene que incluirlo.

---

## Fase 1 — Servidor SSH y Mosh

```bash
sudo pacman -S --needed openssh mosh
sudo systemctl enable --now sshd
```

**Verificación:** el banner del §A devuelve `SSH-2.0-OpenSSH_...`.

> **¿Hace falta mosh?** No es obligatorio — los docs de Moshi dicen *"mosh-server on the
> host if you want mosh transport"*, y el video no lo instala. Pero es lo que hace que la
> sesión sobreviva al cambio de WiFi a datos. Pesa un megabyte. En un setup cuyo caso de
> uso es el ascensor y el colectivo, va. ✅ **verificado funcionando**

---

## Fase 2 — Tailscale

```bash
sudo pacman -S --needed tailscale
sudo systemctl enable --now tailscaled
sudo tailscale up                  # interactivo: imprime una URL y espera
sudo tailscale set --ssh=false
```

Después: instalar Tailscale en el iPhone y loguear con **la misma cuenta**. Si usás una
distinta, son dos tailnets separadas y los dispositivos no se ven. Es el error más común.

**Verificación:** `tailscale status` lista **dos** máquinas. Que la app diga "Connected"
no alcanza — mirá desde el lado del desktop.

> `tailscaled` (el demonio) y `tailscale up` (el login) son dos pasos distintos. La
> interfaz `tailscale0` recién existe después del segundo, y la Fase 3 la necesita.

---

## Fase 3 — Firewall: entrada solo por el túnel

No es abrir SSH al mundo, es dejarlo entrar únicamente por la interfaz de la red privada.

```bash
sudo ufw allow in on tailscale0 to any port 22 proto tcp
sudo ufw allow in on tailscale0 to any port 60000:61000 proto udp   # mosh
sudo ufw status verbose
```

Si `ufw status` ya mostraba `Default: deny (incoming)` y el servicio activo, **no corras
`ufw default` ni `ufw enable`**. Ya está.

> **El display de ufw engaña.** ✅ **verificado** — la columna `From` va a decir
> `Anywhere` incluso en las reglas de interfaz. La restricción real es el
> `on tailscale0` del lado izquierdo. La regla está bien, ufw la muestra feo.

Mosh arranca la sesión sobre SSH y después se pasa a **UDP** en 60000–61000. Ese salto es
lo que hace que la sesión sobreviva al cambio de red. Sin ese rango, Moshi cae a SSH plano
y perdés justamente eso.

**Verificación:** desde el iPhone con Tailscale activo la conexión entra; desde una red
externa sin Tailscale, no.

---

## Fase 4 — Que nada muera

```bash
sudo loginctl enable-linger $USER
```

Sin linger, systemd mata tus servicios de usuario al cerrar sesión. **Y `moshi-hook` se
instala como servicio de usuario**, así que sin esto las notificaciones se cortan cada vez
que cerrás sesión, sin avisarte. ✅ **verificado** — es la dependencia menos obvia de toda
la guía.

Para la suspensión, ver §E: verificá antes de enmascarar.

**Verificación:** `loginctl show-user $USER --property=Linger` devuelve `Linger=yes`.

---

## Fase 5 — herdr

```bash
curl -fsSL https://herdr.dev/install.sh | sh
```

✅ **URL verificada** contra el sitio oficial. Instala a nivel usuario en `~/.local/bin`.

### Integraciones

```bash
herdr integration install <TARGET>
herdr integration status
```

Targets válidos ✅ **verificados** en v0.9.1: `pi`, `omp`, `claude`, `codex`, `copilot`,
`devin`, `droid`, `kimi`, `opencode`, `kilo`, `hermes`, `qodercli`, `qwen`, `cursor`,
`mastracode`, `antigravity-cli`, `grok`, `letta`.

Instalá solo los que uses. Son las que hacen que en el teléfono veas *bloqueado /
trabajando / terminado* en vez de adivinar mirando la pantalla.

> ⚠️ **herdr edita configs existentes y NO hace backup.** ✅ **verificado** — le escribe a
> `~/.claude/settings.json` y a `~/.codex/config.toml`. Los cambios son **aditivos** (los
> hooks se suman al array del evento, no lo reemplazan), pero hacé tu propia copia antes.

### Uso mínimo

| Acción | Comando / tecla |
|---|---|
| Lanzar o reatachar la sesión por defecto | `herdr` |
| Detach (los agentes siguen) | `ctrl+b q` |
| Listar sesiones | `herdr session list` |
| Reatachar una sesión puntual | `herdr session attach <nombre>` |
| Ver todos los keymaps | prefijo + `?` |
| Parar el servidor (**mata todo**) | `herdr server stop` |

| Acción | Qué pasa con tus agentes |
|---|---|
| Cerrar la terminal | **Siguen vivos** |
| Detach | **Siguen vivos** |
| `Ctrl+C` en un panel | Muere ese proceso |
| `herdr server stop` | **Mueren todos** |
| Reiniciar o apagar la máquina | **Mueren todos** |

**Verificación:** lanzar herdr, abrir un agente, detach, cerrar la terminal, abrir otra,
`herdr` → misma sesión, agente vivo. **Esta es la única prueba que valida el concepto
entero.** Si esto anda, el resto es interfaz.

> Si no te queda claro por qué un agente lanzado fuera de herdr no se ve desde el
> teléfono, está explicado en
> [Por qué herdr y no una terminal común](#por-qué-herdr-y-no-una-terminal-común).

---

## Fase 6 — Moshi + moshi-hook

1. Instalar **Moshi** desde la App Store.
2. En el host:

```bash
curl -fsSL https://getmoshi.app/install.sh | sh
```

✅ **URL verificada** contra los docs oficiales. En el primer arranque te pide tres
toggles; los defaults sirven. Dejá **`suppress-nested-agent-push` en `off`** si usás
orquestadores que delegan a subagentes: prendido te esconde sus pedidos de aprobación, y
un subagente trabado se ve igual que uno trabajando.

3. Emitir el QR:

```bash
moshi-hook host setup
```

Te va a preguntar **qué dirección debe usar Moshi**. Elegí el nombre **MagicDNS de
Tailscale** (`tu-host.tailXXXXX.ts.net`), no la IP ni una dirección de LAN: ✅
**verificado**

| Opción | Sirve desde afuera |
|---|---|
| MagicDNS de Tailscale | ✅ y sobrevive si sacás y volvés a agregar el dispositivo |
| IP de tailnet `100.x.y.z` | ✅ pero puede cambiar |
| IP de LAN / hostname | ❌ solo dentro de tu casa |

> ⚠️ **El QR es un token de acceso SSH temporal.** Cualquiera que lo escanee antes de que
> expire reclama acceso a tu host. No compartas pantalla, no lo pegues en un chat.

4. En la app: **Easy Pair** → escanear. La llave privada se genera **en el iPhone** y
   nunca sale; solo la pública sube al `authorized_keys` del host.

5. Instalar los hooks y arrancar el demonio:

```bash
moshi-hook install --target claude,codex,opencode,pi
moshi-hook service install
moshi-hook status
```

### Correcciones al video y a los docs ✅ **verificado**

| Lo que dice la fuente | Lo que es realmente |
|---|---|
| `moshi-hook install-service` / `install service` | **`moshi-hook service install`** |
| `moshi-hook serve` para dejarlo corriendo | `serve` es **primer plano**; usá `service install` |
| Hay que correr `moshi-hook pair --token` | **No hace falta si usaste Easy Pair.** Es un camino *alternativo*, no un paso adicional |
| El token está en Ajustes → Hooks | El binario dice **Ajustes → Integrations** |
| `mosh-hook` | **`moshi-hook`**, con "i". `mosh` y `moshi` son programas distintos |

Sobre el token: si el QR ya funcionó, `moshi-hook status` dice `paired` y guardó host ID y
secret. `pair --token` es para cuando NO usás Easy Pair.

> `moshi-hook install` sin `--target` instala hooks para **todos** los agentes
> soportados. Acotalo a los que usás.

**Qué sale de la máquina:** transcripciones, diffs y contenido de archivos viajan entre tu
máquina y el teléfono. A los servidores de Moshi van resúmenes cortos para armar las push.
Sin licencia Pro, `status` reporta `usage scope: direct` — las métricas de consumo van
directo al dispositivo pareado. ✅ **verificado**

---

## Trampas verificadas

Las cuatro cosas que nos costaron tiempo real. Leelas antes de diagnosticar nada.

### 1. Los hooks se cargan cuando ARRANCA la sesión del agente

**La más importante de todas.** Una sesión de agente que ya estaba corriendo cuando
instalaste los hooks **nunca los va a disparar**. Parece un setup roto y no lo es.

Después de `moshi-hook install`, **arrancá una sesión nueva** para probar. Nuestro primer
test falló contra una sesión de 3 horas de antigüedad.

### 2. Notificación y herdr son independientes

Los hooks viven en `~/.claude/settings.json`, que es **global de la máquina**. Cualquier
sesión de Claude Code los dispara: dentro de herdr, en una terminal pelada, por SSH.
**herdr no participa en el camino de la notificación.** ✅ **verificado**

La consecuencia: si lanzás un agente fuera de herdr y te vas de casa, **recibís el aviso
de que necesita tu aprobación y no vas a poder dársela** — no hay sesión a la cual
reatachar. Tenés la alarma sin el control, que es peor que no tener nada.

> **Regla:** agente del que te vas a alejar → adentro de herdr. Agente que mirás desde el
> escritorio → donde quieras, te notifica igual.

### 3. El log solo registra los fallos

`~/.local/state/moshi/hook.log` anota **fallos y recuperaciones**, no entregas exitosas.
**La ausencia de una línea no significa ausencia de notificación.** ✅ **verificado** —
usá `-v` si necesitás más.

Y la extensión de pi además está escrita para fallar en silencio: *"When the daemon is
absent the connect fails silently and the turn is never interrupted."*

### 4. Por datos móviles vas a ir por relay, y está bien

`tailscale status` va a mostrar `relay "xxx"` en vez de conexión directa. Es **esperado**:
las operadoras usan CGNAT y eso impide el peer-to-peer. Funciona, con un poco más de
latencia. No es algo que haya que arreglar. ✅ **verificado**

---

## Verificación final

### Que funciona

- [ ] El banner del :22 devuelve `SSH-2.0-OpenSSH_...`
- [ ] Tailscale SSH apagado en este nodo
- [ ] El 22 y el rango UDP solo entran por `tailscale0`
- [ ] Desde fuera del tailnet, el host no responde en el 22
- [ ] `Linger=yes`
- [ ] Sesión de herdr sobrevive a cerrar la terminal
- [ ] **iPhone con WiFi APAGADO, datos móviles** → Moshi → host → `herdr`
- [ ] `who` muestra `via mosh [PID]` ← prueba que mosh está activo, no SSH plano
- [ ] Agente **nuevo** lanzado desde el teléfono → llega la notificación con la pantalla
      bloqueada

> Probar con WiFi encendido no verifica nada: estarías probando tu red local.

### Que sobrevive un reinicio

- [ ] `sshd`, `tailscaled`, `ufw` activos solos
- [ ] `moshi-hook.service` (de usuario) activo solo
- [ ] Tailnet y pairing de Moshi intactos
- [ ] Volver a conectar desde el teléfono **sin tocar nada**

**Lo que NO sobrevive, y es correcto:** las sesiones de herdr y sus agentes. `linger` te
protege del **cierre de sesión**, no del reinicio ni del apagado. La prueba es que podés
volver a entrar sin configurar nada, no que el trabajo en vuelo se preserve.

> Si guardás scripts de verificación, **no los dejes en `/tmp`**: en Arch/CachyOS es
> tmpfs y se borra justo en el reinicio que querés verificar. ✅ **verificado** (casi nos
> pasa).

---

## Problemas conocidos

### `pi` no dispara notificaciones (abierto)

Con pi 0.85.1 y moshi-hook 0.3.26, el hook de pi no produce push. Claude Code sí.
1 de 4 integraciones; no bloquea el setup.

**Ya descartado con evidencia — no lo vuelvas a probar:**

| Hipótesis | Veredicto |
|---|---|
| Sesión de pi anterior a la instalación del hook | ❌ se reprodujo con sesión nueva |
| `XDG_RUNTIME_DIR` ausente → fallback a `/tmp/moshi-hook.sock` | ❌ está seteada en todos los contextos |
| Socket caído | ❌ acepta conexiones |
| Extensión no registrada en `settings.json` | ❌ pi hace *discovery* del directorio |
| Export mal formado | ❌ tiene `export default` igual que la de herdr |

**Por dónde seguir:** `pi --verbose` y mirar si descubre `moshi-hooks` al arrancar (salís
sin mandar prompt, no gasta tokens). Si lo descubre, sospechar del mapeo de eventos — la
extensión manda `AgentEnd` en `agent_settled`. Si no, forzarla con
`pi -e ~/.pi/agent/extensions/moshi-hooks.ts`. Hay también un replay de debug:
`moshi-hook pi-hook`.

### El poller de consumo falla para algunos agentes

`usage fetcher: repeated poll failures` para kimi y codex. Afecta solo la pantalla de
rate limits, no las notificaciones. Se apaga con `moshi-hook set usage-collection off`.

---

## Reglas de higiene

Fijate lo que instalamos, con todas las letras: **un demonio cuya única función es
despertarte.**

1. **Las notificaciones tienen horario.** El teléfono se calla de noche. Si un agente
   termina a las 4, te enterás a las 8.
2. **Si te despertás y atendés, no arrancás nada nuevo.** Solo desbloqueás lo que ya
   estaba.
3. **Esto es para dirigir, no para programar.** Si estás escribiendo código serio con el
   pulgar, algo falló en la planificación.

> **Si apagás la máquina cuando terminás**, estas reglas casi no te aplican: el demonio no
> puede despertarte si no hay máquina. Perdés dejar algo corriendo de noche, y conservás
> todo lo demás — el almuerzo, el trámite, el balcón. Que era el 80% del valor.

No es el tiempo, son 30 segundos. **Es la atención.** La pregunta no es si podés trabajar
desde cualquier lado: podés. Es si vas a poder dejar de trabajar en algún lado.

---

## Referencias

- herdr — https://herdr.dev · https://github.com/herdrdev/herdr
- Moshi — https://getmoshi.app/docs · install: https://getmoshi.app/docs/install
- Tailscale — https://tailscale.com/kb
- Bitácora de esta instalación — `odd/tasks/agentes-remotos-iphone.md`
