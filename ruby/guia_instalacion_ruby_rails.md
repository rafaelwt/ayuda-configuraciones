# 🚀 Guía de Instalación de Ruby y Ruby on Rails usando `rbenv`

## 🧱 Paso 1: Actualiza el sistema e instala dependencias

```bash
sudo apt update
sudo apt upgrade
sudo apt install build-essential libssl-dev libreadline-dev zlib1g-dev
```

---

## 💎 Paso 2: Instala `rbenv` para gestionar versiones de Ruby

```bash
git clone https://github.com/rbenv/rbenv.git ~/.rbenv
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(rbenv init -)"' >> ~/.bashrc
source ~/.bashrc
```

---

## 🔌 Paso 3: Instala el plugin `ruby-build` para `rbenv`

```bash
git clone https://github.com/rbenv/ruby-build.git ~/.rbenv/plugins/ruby-build
```

---

## 📦 Paso 4: Instala Ruby con `rbenv`

Lista de versiones disponibles:

```bash
rbenv install -l
```

Instalación de una versión específica:

```bash
rbenv install <version_de_ruby>
rbenv global <version_de_ruby>
```

Reemplaza `<version_de_ruby>` por la versión que desees, por ejemplo: `3.2.2`.

---

## 🛠️ Paso 5: Instala Ruby on Rails

Con Ruby ya instalado:

```bash
gem install rails
```

---

## ✅ Paso 6: Verifica la instalación

```bash
ruby --version
rails --version
```
