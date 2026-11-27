# Windows 11 en QEMU/KVM con virt-manager (CachyOS)

Objetivo: una VM de Windows 11 completa (TPM 2.0, Secure Boot, drivers VirtIO y
guest tools), equivalente a lo que daba VMware + VMware Tools.

> **Estado de esta guía:** pasos 1 a 6 probados en la práctica (hasta que el
> instalador empezó a copiar archivos). Los pasos 7 y 8 (guest tools y carpetas
> compartidas) todavía no se probaron en esta máquina.

---

## 0. Antes de empezar: dónde guardar las VMs

**No guardes discos de VM en el subvolumen `@` de btrfs.** En CachyOS,
`/var/lib/libvirt/images` vive dentro de `@`, que es lo que snapper captura en cada
actualización:

- Cada snapshot "congela" los bloques del `.qcow2`. Cuando la VM escribe, btrfs no
  puede liberar los bloques viejos → el espacio crece en silencio (con 10 snapshots
  puedes tener varias versiones de un disco de 80 GB).
- Un rollback de `/` con snapper también revertiría las VMs a un estado viejo.

Usa un **disco aparte en ext4** (o, si no hay otro disco, un subvolumen btrfs propio
con `chattr +C`, fuera de los snapshots).

### Preparar el disco ext4 (borra todo el contenido del disco)

```bash
lsblk -f                                  # identify the disk, e.g. /dev/sda
sudo parted /dev/sdX -- mklabel gpt mkpart vms ext4 0% 100%
sudo mkfs.ext4 -L vms /dev/sdX1
sudo mkdir -p /vms
echo "UUID=$(sudo blkid -s UUID -o value /dev/sdX1) /vms ext4 defaults,noatime 0 2" | sudo tee -a /etc/fstab
sudo systemctl daemon-reload && sudo mount /vms
```

### Crear el pool de libvirt en ese disco

```bash
virsh -c qemu:///system pool-define-as vms dir --target /vms
virsh -c qemu:///system pool-start vms
virsh -c qemu:///system pool-autostart vms
```

(O en virt-manager: **Edit → Connection Details → Storage → `+`**, tipo `dir`.)

Usa el pool `vms` para los discos y las ISOs. Así libvirt los ve sin pedir permisos
sobre tu `home`.

---

## 1. Paquetes

```bash
sudo pacman -S swtpm edk2-ovmf   # TPM 2.0 emulado + firmware UEFI/Secure Boot
paru -S virtio-win               # ISO de drivers VirtIO (equivalente a VMware Tools)
```

- Sin `swtpm` no se puede agregar TPM 2.0 y el instalador dice que la PC no cumple
  los requisitos.
- El paquete `virtio-win` deja la ISO en **`/var/lib/libvirt/images/virtio-win.iso`**
  (no en `/usr/share/virtio`). Muévela al pool `vms` si usas el disco aparte.

Verificación:

```bash
pacman -Q swtpm edk2-ovmf
systemctl is-active libvirtd
virsh -c qemu:///system net-list --all   # 'default' active + autostart
```

> Si usas `ufw`, la red NAT de libvirt necesita permitir `virbr0`
> (`sudo ufw allow in on virbr0` y `sudo ufw route allow in on virbr0`).

## 2. ISO de Windows 11

Descárgala de <https://www.microsoft.com/software-download/windows11>, sección
**"Descargar imagen de disco (ISO) de Windows 11 para dispositivos x64"**. El link
dura 24 horas.

Muévela al pool para evitar el aviso de permisos:

```bash
sudo mv ~/Downloads/Windows11_*.iso /vms/
```

## 3. Crear la VM

1. **File → New Virtual Machine** → "Local install media" → Forward.
2. **Browse** → en la ventana *Locate ISO media volume* pulsa el botón de
   **refrescar (🔄)** si la ISO no aparece → elígela → **Choose Volume**.
   - Si no detecta el SO: destilda "Automatically detect" y escribe `Windows 11`.
3. Memoria **8192 MB** o más, **4 CPUs** o más.
4. Disco **80 GB** o más.
5. Nombre `win11` y **tilda "Customize configuration before install"** → Finish.

**No pulses "Begin Installation" todavía.**

## 4. Configurar el hardware (Apply después de cada cambio)

| Dispositivo | Qué poner |
|---|---|
| Overview | Chipset `Q35`, Firmware `UEFI` (ya viene así; con Windows 11 elige solo la variante Secure Boot) |
| `TPM vNone` | Type `Emulated`, Model `CRB`, **Version `2.0`** |
| `SATA Disk 1` → Advanced options | Disk bus `VirtIO` |
| `NIC` | Device model `virtio` |
| **Add Hardware → Storage** | "Select or create custom storage" → Manage → `virtio-win.iso`; Device type `CDROM device`, Bus `SATA` |

> **`TPM vNone` no significa que no haya TPM.** Viene como *Emulated / CRB* con la
> versión en "Hypervisor default". Fija `2.0` a mano para no depender del default.

### Orden de arranque (Boot Options)

Por defecto viene tildado solo el disco, que está vacío. Déjalo así:

```
☑ SATA CDROM 1   ← ISO de Windows, primero
☑ VirtIO Disk 1
☐ SATA CDROM 2   ← virtio-win
☐ NIC
```

## 5. Arrancar el instalador

**Begin Installation.** Aparece *"Press any key to boot from CD or DVD..."* durante
unos segundos: haz clic dentro de la ventana y pulsa una tecla. Si se pasa, reinicia
la VM.

## 6. "No hay disco": cargar drivers VirtIO

En *Select location to install Windows 11* la lista sale vacía. Es lo esperado:
Windows no trae el driver de disco VirtIO.

1. **Load Driver** → **Browse** → CD de virtio-win (normalmente `E:`).
2. **`viostor` → `w11` → `amd64`** → OK.
3. Selecciona **"Red Hat VirtIO SCSI controller"** → **Install**.
   (El botón dice *Install*, no *Next*: solo carga el driver, no instala Windows.)
4. **Recomendado:** repite **Load Driver** con **`NetKVM` → `w11` → `amd64`**
   ("Red Hat VirtIO Ethernet Adapter") para tener red durante la configuración
   inicial. Si la lista sale vacía, sigue sin red y se instala en el paso 7.
5. Selecciona **Drive 0 Unallocated Space** → **Next**. Windows crea las particiones.

En los reinicios **no pulses ninguna tecla**: si vuelve a salir *"Press any key to
boot from CD"*, ignóralo o arrancará el instalador desde cero.

## 7. Guest tools (equivalente a VMware Tools) — *no probado aún*

Ya dentro de Windows, abre el CD de virtio-win y ejecuta
**`virtio-win-guest-tools.exe`**. Instala todos los drivers VirtIO más el
**SPICE agent** y el **QEMU guest agent**.

Qué obtienes:

- ✅ Portapapeles compartido
- ✅ Resolución automática al redimensionar la ventana
- ✅ Apagado limpio desde el host
- ⚠️ Sin aceleración 3D útil (para eso: GPU passthrough)
- ⚠️ Arrastrar y soltar archivos funciona a medias: usa una carpeta compartida

Después puedes quitar los dos CDROM y dejar solo `VirtIO Disk 1` en el orden de
arranque.

## 8. Carpetas compartidas con virtiofs — *no probado aún*

1. VM apagada → **Memory** → tilda **Enable shared memory**.
2. **Add Hardware → Filesystem** → Driver `virtiofs`, Source path (carpeta del
   host), Target path (nombre, por ejemplo `compartida`).
3. En Windows: instala **WinFsp** (<https://winfsp.dev>) y activa el servicio
   **VirtIO-FS Service** (`services.msc` → Automático → Iniciar). Aparece como
   unidad `Z:`.

---

## Dónde vive cada parte de la VM

| Qué | Ruta |
|---|---|
| Disco virtual | `<pool>/win11.qcow2` |
| UEFI / Secure Boot | `/var/lib/libvirt/qemu/nvram/win11_VARS.fd` |
| TPM | `/var/lib/libvirt/swtpm/<uuid>/` |
| Configuración | `virsh -c qemu:///system dumpxml win11` |

### Mover el disco a otro lugar

Con la VM **apagada**: mueve el `.qcow2`, y en virt-manager → `VirtIO Disk 1`
cambia la ruta al archivo nuevo. NVRAM y TPM se quedan donde están.

### Borrar una VM con su disco (sin borrar las ISOs)

```bash
virsh -c qemu:///system destroy win11            # only if it is running
virsh -c qemu:///system undefine win11 --nvram --tpm --storage vda
```

No uses `--remove-all-storage` si la VM tiene ISOs conectadas: también las borra.
