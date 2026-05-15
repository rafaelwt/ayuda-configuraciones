# Configurar GitHub SSH en CachyOS / Arch Linux (Fish Shell)

## 1. Verificar si existen llaves SSH

```bash
ls -la ~/.ssh
```

---

## 2. Crear una nueva llave SSH

```bash
ssh-keygen -t ed25519 -C "tu-email@example.com"
```

Cuando pregunte:

```text
Enter file in which to save the key
```

presionar:

```text
Enter
```

Opcionalmente ingresar passphrase o presionar Enter para dejarla vacía.

---

## 3. Verificar que las llaves fueron creadas

```bash
ls -la ~/.ssh
```

Resultado esperado:

```text
id_ed25519
id_ed25519.pub
```

---

## 4. Iniciar ssh-agent en Fish shell

```bash
eval (ssh-agent -c)
```

---

## 5. Agregar la llave SSH

```bash
ssh-add ~/.ssh/id_ed25519
```

Resultado esperado:

```text
Identity added: /home/usuario/.ssh/id_ed25519
```

---

## 6. Mostrar la llave pública

```bash
cat ~/.ssh/id_ed25519.pub
```

Copiar todo el contenido.

Ejemplo:

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... tu-email@example.com
```

---

## 7. Agregar la llave en GitHub

Abrir:

```text
https://github.com/settings/keys
```

Seleccionar:

```text
New SSH key
```

Configurar:

```text
Title:
Mi Linux Desktop
```

```text
Key type:
Authentication Key
```

Pegar la llave pública y guardar.

---

## 8. Verificar conexión SSH con GitHub

```bash
ssh -T git@github.com
```

La primera vez preguntará:

```text
Are you sure you want to continue connecting?
```

Escribir:

```text
yes
```

Resultado esperado:

```text
Hi usuario! You've successfully authenticated...
```

---

## 9. Verificar remoto Git actual

Entrar al proyecto:

```bash
cd ~/ruta/proyecto
```

Verificar:

```bash
git remote -v
```

Si aparece:

```text
https://github.com/usuario/repositorio.git
```

continuar al siguiente paso.

---

## 10. Cambiar remoto HTTPS a SSH

```bash
git remote set-url origin git@github.com:usuario/repositorio.git
```

---

## 11. Verificar remoto actualizado

```bash
git remote -v
```

Resultado esperado:

```text
origin  git@github.com:usuario/repositorio.git (fetch)
origin  git@github.com:usuario/repositorio.git (push)
```

---

## 12. Probar Git Push

```bash
git push
```

Git ya no debería pedir:
- usuario
- password
- token
