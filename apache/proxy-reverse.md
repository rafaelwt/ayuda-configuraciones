### api en nodejs

```apache
<Location "/api">
    ProxyPass "http://127.0.0.1:3020/api"
    ProxyPassReverse "http://127.0.0.1:3020/api"

    # Si estás usando WebSockets (por el 'Upgrade'), necesitas esto:
    ProxyPreserveHost On
    RequestHeader set Upgrade %{HTTP:Upgrade}e env=HTTP_UPGRADE
    RequestHeader set Connection "upgrade"
</Location>

```apache