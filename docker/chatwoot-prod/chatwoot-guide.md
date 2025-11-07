# 🔐 Guía de Recuperación de Usuario y Contraseña en Chatwoot (Docker)

Esta guía te ayudará a recuperar el **usuario (correo)** y **contraseña** del administrador en una instalación de **Chatwoot ejecutándose con Docker**.

---

## 🧠 Prerrequisitos

Antes de comenzar, asegúrate de:

- Tener acceso al servidor o máquina donde corre Chatwoot.
- Docker y Docker Compose instalados.
- Tu contenedor `chatwoot_rails` en ejecución.

Puedes verificarlo con:

```bash
docker ps
```

Deberías ver una línea similar a:

```
chatwoot_rails   bundle exec rails s -p 3000 -b 0.0.0.0
```

---

## 🧩 1. Ingresar al contenedor Rails

Ejecuta el siguiente comando (ajusta el nombre si tu contenedor se llama distinto):

```bash
docker exec -it chatwoot_rails bash
```

Si no conoces el nombre exacto del contenedor, puedes obtenerlo con:

```bash
docker ps
```

---

## 💻 2. Abrir la consola de Rails

Dentro del contenedor, abre la consola de Rails:

```bash
bundle exec rails console
```

Esto abrirá un entorno interactivo Ruby (verás algo como `irb(main):001:0>`).

---

## 👀 3. Ver todos los usuarios registrados

Ejecuta el siguiente comando dentro de la consola de Rails:
Remover role ya que solo es para la version premium

```ruby
User.all.pluck(:id, :name, :email, :role)
```

Esto mostrará una lista de todos los usuarios, por ejemplo:

```
=> [[1, "Admin Chatwoot", "admin@example.com", "administrator"],
    [2, "Soporte", "soporte@empresa.com", "agent"]]
```

👉 Busca el usuario con `role: "administrator"`.  
Ese es tu **correo de acceso principal**.

---

## 🔑 4. Resetear la contraseña del usuario administrador

Usa el correo del administrador que obtuviste en el paso anterior:

```ruby
u = User.find_by(email: "admin@example.com")
u.password = "NuevaContraseñaSegura2025!"
u.password_confirmation = "NuevaContraseñaSegura2025!"
u.save!
```

Si devuelve `true`, el cambio fue exitoso ✅

---

## 🧰 5. (Opcional) Crear un nuevo usuario administrador

Si no tienes acceso a ningún usuario existente o prefieres crear uno nuevo:

```ruby
User.create!(
  name: "Nuevo Admin",
  email: "nuevo_admin@empresa.com",
  password: "ContraseñaSegura2025!",
  password_confirmation: "ContraseñaSegura2025!",
  role: "administrator",
  confirmed_at: Time.now
)
```

 
---

## 🔁 Activar / Confirmar un usuario existente

Si tienes un usuario creado pero no confirmado (por ejemplo un agente nuevo), puedes confirmarlo desde la consola de Rails con el siguiente snippet:

```ruby
user = User.find_by(email: 'nuevoagente@empresa.com')
user.confirm
user.save!
```
Esto marcará la cuenta como confirmada (activa). Sustituye el correo por el del usuario que quieres activar.

Para cambiar el password entrar al a consola SuperAdmin

---

## 🚪 6. Salir y reiniciar Chatwoot

Sal de la consola de Rails y del contenedor:

```bash
exit
exit
```

Luego reinicia el servicio Rails:

```bash
docker-compose restart rails
```

O si quieres reiniciar todo el stack:

```bash
docker-compose down && docker-compose up -d
```

---

## 🔓 7. Acceder al panel

Abre tu navegador e ingresa a tu instancia de Chatwoot:

```
http://localhost:7000
```

o el dominio donde está desplegado (por ejemplo `https://chat.miempresa.com`).

Usa el **correo** y la **nueva contraseña** configurados.

---

## ⚙️ 8. Comando rápido para listar usuarios desde el host

Si prefieres no entrar al contenedor manualmente, puedes listar los correos de los usuarios directamente desde tu host con:

```bash
docker exec -it chatwoot_rails bundle exec rails runner "puts User.all.pluck(:id, :email, :role).map { |u| u.join(' | ') }"
```

Ejemplo de salida:

```
1 | admin@example.com | administrator
2 | soporte@empresa.com | agent
```

---

## ✅ Resumen rápido de comandos

```bash
docker exec -it chatwoot_rails bash
bundle exec rails console
User.all.pluck(:id, :name, :email, :role)
u = User.find_by(email: "admin@example.com")
u.password = "NuevaContraseñaSegura2025!"
u.password_confirmation = "NuevaContraseñaSegura2025!"
u.save!
exit
exit
docker-compose restart rails
```

---
