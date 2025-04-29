# Instalar Python 3.13
Se puede instalar la versión que se desee, por ejemplo, Python 3.13 sin afectar la versión por defecto de Python del
sistema operativo.
```bash
sudo apt update
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update
# Por ejemplo, para instalar Python 3.11:
sudo apt install python3.13 python3.13-venv python3.13-dev

# Crear entorno virtual
python3.13 -m venv venv

# Activar entorno virtual
source venv/bin/activate

# Desactivar entorno virtual
deactivate

# Instalar pip
sudo apt install python3-pip
```
