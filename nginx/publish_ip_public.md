### publicar sin  dominio (IP pública)

> sudo nano /etc/nginx/sites-available/mi-app

```bash
server {
    listen 80;
    server_name _;

    root /var/www/mi-app;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    access_log /var/log/nginx/mi-app.access.log;
    error_log /var/log/nginx/mi-app.error.log;
}
```

### Habilitar el sitio y reiniciar Nginx
```bash
sudo ln -s /etc/nginx/sites-available/mi-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```


### Confirma qué sitios están activos
```bash
ls -l /etc/nginx/sites-enabled/
```

### Crea un respaldo con copia directa
```bash
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak
```

### Desactiva el sitio por defecto
```bash
sudo rm /etc/nginx/sites-enabled/default
sudo systemctl reload nginx
```


### Para restaurar el sitio por defecto
```bash
sudo cp /etc/nginx/sites-available/default.bak /etc/nginx/sites-available/default
sudo ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/
sudo systemctl reload nginx
````