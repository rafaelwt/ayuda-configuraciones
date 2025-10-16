# generar_ssl


# pem to crt 

openssl x509 -in trusted.pem -clrtrust -out normal.pem


# pem and key
openssl rsa -in privkey.pem -out llave.key


