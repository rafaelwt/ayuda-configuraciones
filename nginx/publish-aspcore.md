https://www.campusmvp.es/recursos/post/como-configurar-asp-net-core-2-1-en-linux-en-menos-de-10-minutos.aspx

https://medium.com/@setu677/how-to-host-asp-net-core-on-linux-using-nginx-85339560e929

// ========================================
### Correr directamente el dll ir a la carpeta donde esta el proyecto y ejecutar el siguiente comando
1.- dotnet CoreRESTServer.dll
Asisgnar perimisos
2.- chmod u+x CoreRESTServer.dll

// ========================================
Correr como servicio centos-7-rhel-7/
crear un archivo dentro de etc/systemd/system 
con el nombre del servicion y la extacion .service 
Después de guardar el archivo de definición del servicio, habilítalo utilizando este comando:

1.- sudo systemctl enable kestrel-coretest.service
Ahora ya puedes arrancar el servicio con:

2.- sudo systemctl start kestrel-coretest.service
Y verifica su estado con este comando:

sudo systemctl status kestrel-coretest.service
También puedes comprobar qué aplicaciones web se están ejecutando usando:

ps -A all | grep dotnet

## ===========Proxy reverso nginx =================
agregar la siguiente linea en el archivo nginx config
```bash
  server {
    listen 8080;
    location / {
  	proxy_pass http://localhost:5000;
  	proxy_http_version 1.1;
  	proxy_set_header Upgrade $http_upgrade;
  	proxy_set_header Connection keep-alive;
  	proxy_set_header Host $http_host;
  	proxy_cache_bypass $http_upgrade;
     }
   }
```
## ==== PROBLEMAS =================================
Si redirecciona al puerto 5001 con https usando nginx proxy reverso comentar la siguiente linea en el arhivo 
Startup.cs
     public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {

            //app.UseHttpsRedirection();
        }
