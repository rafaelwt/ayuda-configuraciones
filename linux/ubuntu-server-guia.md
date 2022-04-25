### Guia de configuracion para un servidor ubuntu
[Configurar Ip](https://linuxize.com/post/how-to-configure-static-ip-address-on-ubuntu-20-04/#:~:text=Configuring%20Static%20IP%20address%20on%20Ubuntu%20Desktop,-Setting%20up%20a&text=Depending%20on%20the%20interface%20you,IP%20address%2C%20Netmask%20and%20Gateway.)
1. Activar ssh
   > sudo apt install openssh-server
2. Instalar Servidor FTP
   1. >sudo apt update
   2. > sudo apt install vsftpd
####Verificar el servicio
>sudo systemctl status vsftpd   

### Instalar cgi
[cgi](https://noviello.it/es/como-instalar-y-configurar-los-scripts-cgi-de-apache2-en-ubuntu-18-04/)
Configuración de Apache 2
Después de instalar Apache2, lo primero que debe hacer es habilitar el módulo CGI para Apache2. Desde la terminal:

sudo a2enmod cgi
Luego reiniciamos Apache2:

sudo service apache2 restart
Creemos la carpeta cgi-bin:

sudo mkdir /var/www/cgi-bin 

### Solucion de errores en phyton cgi
[env](https://stackoverflow.com/questions/3655306/ubuntu-usr-bin-env-python-no-such-file-or-directory)

>sudo ln -s /usr/bin/python3 /usr/bin/python

### ver errores apache 
>tail -f /var/log/apache2/error.log

### Instalr pycurl
>sudo apt-get install -y python-pycurl