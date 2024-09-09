### Configuracion para node nestjs con see

```bash
http {
    # Otras configuraciones http aquí...

    map $http_upgrade $connection_upgrade {
        default upgrade;
        ''      close;
    }

    upstream nestjs_upstream {
        server 127.0.0.1:3000; # Ajusta esto al puerto de tu aplicación NestJS
        keepalive 64;
    }

    server {
        listen 80;
        server_name tudominio.com;

        location / {
            proxy_pass http://nestjs_upstream;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            proxy_set_header Host $host;

            # Configuraciones específicas para SSE
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Incrementa los timeouts para SSE
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;

            # Deshabilita el buffering para SSE
            proxy_buffering off;
        }
    }
}

```
