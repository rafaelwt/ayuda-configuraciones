https://www.cyberciti.biz/faq/how-to-install-and-use-nginx-on-centos-7-rhel-7/

Instalacion y configuracion en centOS
1.- sudo yum install nginx
Activar Servicio
2.- $ sudo systemctl enable nginx
Comandos nginx
3.- Start Nginx command
$ sudo systemctl start nginx

Stop Nginx command
$ sudo systemctl stop nginx

Restart Nginx command
$ sudo systemctl restart nginx

4.– Open port 80 and 443 using firewall-cmd
You must open and enable port 80 and 443 using the firewall-cmd command:
$ sudo firewall-cmd --permanent --zone=public --add-service=http
$ sudo firewall-cmd --permanent --zone=public --add-service=https
$ sudo firewall-cmd --reload

5.- Test it
Verify that port 80 or 443 opened using ss command:
$ sudo ss -tulpn


 Open firewall ports
Add Firewall rule to allow the port to accept packets:

# firewall-cmd --zone=public --add-port=8081/tcp --permanent
success
# firewall-cmd --reload
success
# iptables-save | grep 8081
-A IN_public_allow -p tcp -m tcp --dport 8081 -m conntrack --ctstate NEW -j ACCEPT

