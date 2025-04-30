### Ejemplo de core.conf

```bash
[program:mi_app]
process_name=%(program_name)s_%(process_num)02d
command=dotnet /opt/mi_app/app/WebApi.dll
directory=/opt/mi_app/app
autostart=true
autorestart=true
stopsignal=INT
stopasgroup=true
killasgroup=true
numprocs=1
redirect_stderr=true
stderr_logfile=/opt/mi_app/logs/mi_app.err.log
stdout_logfile=/opt/mi_app/logs/mi_app.out.log
environment=ASPNETCORE_ENVIRONMENT=Production


```
