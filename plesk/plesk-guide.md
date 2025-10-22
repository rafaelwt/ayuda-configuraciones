# 🧩 Cómo copiar y pegar en VIM sobre SSH desde Windows

Esta guía es **muy importante** si trabajas con **Plesk cPanel** o accedes a tu servidor mediante **SSH** y necesitas copiar o pegar texto desde tu **portapapeles local (Windows)** hacia el editor **VIM** remoto.

---

## 📋 Copiar texto desde Windows

1. Selecciona el texto que deseas copiar.
2. Usa uno de los siguientes métodos:
   - **Ctrl + C** → método estándar.
   - Si **Ctrl + C no funciona**, usa:
     👉 **Ctrl + Insert** para copiar correctamente.

---

## 📥 Pegar texto en VIM (SSH)

Cuando estés dentro del terminal o en **VIM**:
1. Coloca el cursor en la posición donde deseas pegar el texto.
2. Usa:
   - **Ctrl + V** → si funciona, úsalo normalmente.
   - Si **Ctrl + V no funciona**, usa:
     👉 **Shift + Insert** para pegar el texto.

---

## 💡 Nota

En **Plesk cPanel**, estos atajos funcionan correctamente y son la forma recomendada de copiar y pegar texto entre tu **Windows local** y el **servidor remoto**.

---

### ✅ Resumen rápido

| Acción | Atajo principal | Alternativa si no funciona |
|--------|------------------|-----------------------------|
| Copiar | `Ctrl + C` | `Ctrl + Insert` |
| Pegar  | `Ctrl + V` | `Shift + Insert` |

---

© Guía práctica para administradores que usan SSH y VIM en entornos Plesk / Linux.
