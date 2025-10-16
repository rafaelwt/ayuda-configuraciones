problemas de proxy reversa
https://stackoverflow.com/questions/23948527/13-permission-denied-while-connecting-to-upstreamnginx

setsebool -P httpd_can_network_connect 1


ver log de errores

tail -30 /var/log/nginx/error.log
