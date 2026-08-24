# Auditoría de seguridad: tokens en el navegador

Pegá el bloque de abajo a tu agente (Claude Code, Cursor, Copilot) con el proyecto abierto.

Sirve para cualquier SPA con API propia: **Angular/React/Vue** contra **.NET, Node, Java, Python**.

---

## PROMPT

```
Auditá la seguridad de la autenticación de este proyecto. Es una SPA con una
API propia.

REGLA QUE NO SE NEGOCIA: no afirmes nada sin verificarlo en el código. Si no
podés comprobar algo, decilo en vez de suponerlo. Mostrame archivo y línea de
cada hallazgo.

Varios puntos piden mandar peticiones reales. Si no podés levantar el servidor
en este entorno, el estado es NO VERIFICADO, no CUMPLE. Haber leído el código
no es lo mismo que haberlo visto responder.

Durante toda la auditoría tratá el ACCESS TOKEN y el REFRESH TOKEN como dos
cosas distintas: dónde vive cada uno, cómo se valida, cuánto dura, cómo se
borra. Nunca digas "el token" sin aclarar cuál.

Revisá estos diez puntos, en orden. Para cada uno: decime si CUMPLE, NO CUMPLE,
NO VERIFICADO o NO APLICA, con la evidencia.

1. DÓNDE VIVE CADA TOKEN
   Buscá localStorage, sessionStorage y document.cookie en el frontend.
   Un XSS que ejecute JavaScript en el origen de la app lee lo que haya en
   localStorage y lo exfiltra. El atacante después usa ese token desde donde
   quiera, durante toda su vida útil. Si está ahí, es el hallazgo más grave y
   todo lo demás es secundario.
   Lo correcto: cookie HttpOnly + Secure + SameSite, que el servidor escribe y
   JavaScript no puede leer.
   Aclaración que tiene que quedar en el informe: HttpOnly no cierra el vector
   XSS, lo achica. Un XSS activo igual puede hacer peticiones con credenciales
   desde la pestaña de la víctima. Pasás de "roban el token y lo usan desde
   afuera" a "usan la sesión mientras dura el XSS". Por eso HttpOnly y access
   tokens cortos van juntos.

2. POR QUÉ VÍAS ACEPTA EL SERVIDOR UN TOKEN
   No busques solo Authorization: Bearer. Buscá TODAS las vías: header
   Authorization, cookies, headers personalizados (x-token, x-auth), query
   params (?token=), body, y cualquier middleware o filtro que extraiga
   credenciales. Listalas.
   Si migrás a cookies pero el backend sigue leyendo el header, no cerraste
   nada: un script inyectado puede escribir ese header.
   Probalo de verdad: mandá un token válido por cada vía que encontraste y
   mirá si responde 200. Si alguna responde 200 y no debería, no está cerrado.

3. EL REFRESH TOKEN: ¿EXISTE, SE USA, ROTA?
   Tres preguntas separadas.
   a) ¿Existe? Buscá el nombre de la variable en los dos lados. Caso
      frecuente: el backend lo firma y el frontend no lo menciona nunca. Si es
      así, está muerto.
   b) ¿Se usa? Sin refresh, un access token corto obliga a re-loguearse todo el
      tiempo, y eso empuja a alargarlo, que es lo peligroso.
   c) ¿Rota? Un refresh que dura 30 días y no cambia al usarse, robado una sola
      vez (de un log, de un backup de Redis, de un dump de base) da 30 días de
      acceso. Lo correcto es rotación en cada uso más detección de
      reutilización: si aparece un refresh ya consumido, se invalida toda la
      familia. Esto requiere estado en el servidor; si no está, decilo como
      decisión pendiente, no como detalle.
   Verificá también que el refresh viaje en una cookie con Path acotado al
   endpoint que lo usa, así no acompaña al resto del tráfico.

4. EL CHEQUEO DE SESIÓN AL ARRANCAR
   Este es el que rompe la migración y cuesta encontrar.
   Buscá dónde la app decide si estás logueado al cargar. Si consulta
   almacenamiento local ("¿hay token?") en vez de preguntarle al servidor, con
   HttpOnly va a responder "no estás logueado" para siempre — sin error, sin
   log, sin nada.
   Puede estar en más de un lugar: el guard de rutas, el componente raíz, un
   inicializador, un interceptor. Buscá TODOS.
   Lo correcto: un endpoint tipo GET /auth/me que solo valida, y el estado sale
   del código HTTP (200 o 401).

5. EL CIERRE DE SESIÓN
   ¿Hay endpoint en el backend, o el frontend solo borra su almacenamiento?
   Con HttpOnly, JavaScript NO puede borrar la cookie: sin endpoint, cerrar
   sesión no hace nada y la sesión sigue viva.
   Revisá que el frontend realmente ejecute la llamada — si usa observables o
   promesas, que no quede sin suscribir o sin await.
   Al borrar la cookie, TODOS los atributos (Domain, Path, Secure, HttpOnly,
   SameSite) tienen que ser idénticos a los del alta. Si uno solo no coincide,
   el navegador ignora el borrado y no avisa. Compará el código que escribe con
   el que borra, atributo por atributo.
   Si hay rotación de refresh (punto 3c), el logout tiene que invalidar la
   familia en el servidor, no solo borrar la cookie.

6. LÍMITE DE INTENTOS DE LOGIN
   No alcanza con que el código exista: verificá que se EJECUTE.
   Error clásico: el middleware se registra después de montar las rutas, así
   que nunca corre. Probalo mandando más intentos fallidos que el límite y
   mirá si en algún momento responde 429. Si todos dan 400 o 401, no funciona.
   Revisá también el valor configurado: un límite de 500 no limita nada.
   DETRÁS DE UN PROXY (Cloudflare, nginx, un balanceador): si el limitador se
   keyea por IP y la app no confía en los headers del proxy (trust proxy en
   Express/NestJS, ForwardedHeaders en .NET, CF-Connecting-IP en Cloudflare),
   la IP que ve es la del proxy. Resultado: o todos los usuarios comparten un
   bucket y a los diez intentos fallidos de cualquiera todo el mundo recibe
   429, o no discrimina nada. La prueba desde localhost da CUMPLE y en
   producción no funciona. Verificá la configuración del proxy y, si podés,
   probá mandando X-Forwarded-For con IPs distintas.
   Preguntá también si el límite es por IP, por cuenta, o ambos. Solo por IP
   no frena un ataque distribuido contra una cuenta.

7. LOS SECRETOS Y LA VALIDACIÓN DEL JWT
   ¿Qué pasa si la variable de entorno del secreto JWT no está?
   Si el código tiene un valor por defecto, la app arranca igual firmando
   tokens con un secreto que está en el repositorio. Cualquiera que vea el
   código puede fabricar un token válido, y no hay ninguna señal de que pasó.
   Lo correcto: en producción, fallar al arrancar nombrando lo que falta.
   Verificá que el secreto del refresh sea DISTINTO del de acceso: con el
   mismo, un refresh token robado sirve como access token.
   Verificá la fuerza: un HS256 con un secreto corto se rompe offline con
   hashcat en horas. Mínimo 32 bytes aleatorios.
   Y verificá cómo se VALIDA el token, no solo cómo se firma:
   - Que la librería no acepte alg: none ni permita confusión de algoritmo
     (HS256 firmado con la clave pública de RS256). Buscá que el algoritmo
     esperado esté fijado explícitamente.
   - Que valide exp, iss y aud. Varias librerías solo los validan si les pasás
     las opciones; sin opciones, un token vencido o de otra app puede pasar.

8. LOS ERRORES, ¿QUÉ DEVUELVEN?
   Buscá dónde se arma la respuesta de error. Si manda el mensaje de la
   excepción al cliente, estás filtrando rutas del servidor, nombres de
   módulos y a veces fragmentos de consultas SQL.
   Revisá el helper de errores y también el handler global: pueden tener
   criterios distintos y uno tapar al otro.
   Lo correcto: en producción, mensaje genérico al cliente y detalle al log.
   Los errores de negocio ("Usuario no existe") sí pueden ser explícitos.

9. CORS
   Si front y API comparten origen (mismo host y puerto, o el front se sirve
   desde la API), este punto NO APLICA. Decilo y seguí.
   Si no comparten origen: con cookies, el navegador exige
   Access-Control-Allow-Origin con el origen exacto (no *) y
   Access-Control-Allow-Credentials: true. Revisá cómo se decide el origen
   permitido: si es dinámico (refleja el Origin que llega), cualquier sitio
   puede hacer peticiones con credenciales. Revisá también los métodos y
   headers permitidos, y que el preflight OPTIONS no pase por el middleware
   de autenticación.
   Igual que el rate limit: no alcanza con que esté configurado. Mandá una
   petición con Origin de otro dominio y mirá qué responde.

10. ATRIBUTOS DE LAS COOKIES
    Por cada cookie de sesión, listá Domain, Path, Secure, HttpOnly y
    SameSite tal como salen en el Set-Cookie real, no como están en el código.
    - Domain: si está seteado (por ejemplo .empresa.com), la cookie se comparte
      con TODOS los subdominios. En un sistema multi-tenant por subdominio eso
      cruza tenants. Lo habitual es no setear Domain (cookie host-only).
    - SameSite: Strict es más seguro pero no manda la cookie en navegaciones
      top-level desde otro sitio. Un link en un email hacia la app llega sin
      cookie, /auth/me da 401 y el usuario va al login aunque tenía sesión.
      Por eso mucha gente termina en Lax, y con Lax cualquier GET que cambie
      estado queda expuesto a CSRF. Combinación razonable: access en Lax (y
      auditar que no haya GETs mutantes), refresh en Strict con Path acotado,
      porque el refresh solo se usa por XHR y nunca en una navegación.
      Informá cuál se eligió y si la elección es consciente.

TRES COSAS MÁS, rápidas:
- Consultas SQL: ¿parámetros o concatenación de input? Buscá interpolación de
  variables dentro de strings de consulta.
- Contraseñas: ¿hasheadas con bcrypt/argon2, o guardadas en claro?
- Headers de seguridad: ¿hay algo que los ponga (helmet en Node, middleware
  equivalente en .NET)?

SOBRE CSRF: si la autenticación usa cookies, verificá explícitamente el modelo
same-site/cross-site: qué SameSite tiene cada cookie, cómo está CORS, y qué
endpoints cambian estado y con qué método. SameSite bien puesto reduce mucho
el riesgo, pero no asumas que la app está "cubierta" sin mirar la arquitectura
real: un subdominio hermano comprometido es same-site, y un GET que muta
estado con Lax es CSRF-able. NO agregues librerías de CSRF sin comprobar que
haga falta — varias están sin mantenimiento.

PRUEBA DE CONCURRENCIA: si podés levantar el servidor, lanzá cinco peticiones
simultáneas con el access token vencido y el refresh válido. Tiene que haber
UN solo refresh en el backend, no cinco. Si hay cinco y el refresh rota, las
cuatro últimas van a fallar por reutilización y la sesión se cae sola.

MATRIZ DE ATAQUE, al final del informe. Una línea por pregunta, respondida
con lo que encontraste, no con lo que debería ser:
- XSS en la app → ¿obtiene el access token? ¿el refresh?
- XSS en la app → ¿puede usar la sesión mientras está activo? ¿por cuánto?
- Access token robado → ¿cuánto tiempo sirve?
- Refresh token robado → ¿genera nuevas sesiones? ¿se detecta?
- Logout → ¿qué invalida realmente en el servidor?
- CSRF → ¿qué endpoints quedan expuestos con el SameSite actual?
- CORS mal configurado → ¿qué permite desde otro origen?
- Secreto JWT comprometido → ¿se pueden fabricar tokens? ¿se notaría?
- Subdominio hermano comprometido → ¿qué alcanza?

FORMATO DE LA RESPUESTA:
Una tabla con los diez puntos y su estado (CUMPLE / NO CUMPLE / NO VERIFICADO
/ NO APLICA). Después, por cada NO CUMPLE: qué encontraste (con archivo y
línea), por qué importa, y cómo se arregla. Ordenado por gravedad, no por
número de punto. Después la matriz de ataque.

NO ARREGLES NADA TODAVÍA. Primero quiero ver el diagnóstico completo.
```

---

## Si el diagnóstico confirma que hay que migrar

Segundo prompt, después de leer el primero:

```
Migrá la autenticación a cookies HttpOnly. Antes de escribir código, tené en
cuenta esto:

EL ORDEN IMPORTA
Backend y frontend tienen que salir juntos. Si el backend deja de leer el
header antes de que el frontend mande cookies, nadie entra.
Si necesitás desplegar por separado, dejá el backend aceptando cookie O header
por un tiempo, y sacá el header recién cuando el frontend esté arriba.
Si podés desplegar los dos a la vez, mejor corte directo: mientras se aceptan
las dos vías, el vector viejo sigue abierto.

ATRIBUTOS DE LAS COOKIES
- HttpOnly siempre.
- Secure: en producción siempre. En desarrollo, Chrome y Firefox tratan
  http://localhost como contexto seguro, así que las cookies Secure sí viajan
  ahí. Donde NO viajan es en http://192.168.x.x o un nombre de LAN sobre HTTP.
  Si desarrollás sobre localhost, dejá Secure activo en todos lados y evitá
  una diferencia más entre dev y producción.
- SameSite: access en Lax, refresh en Strict. Ver punto 10 de la auditoría
  para el porqué. Si elegís Strict para el access, sabé que los links externos
  hacia la app van a llegar sin sesión.
- Sin Domain (host-only), salvo que necesites compartir la cookie entre
  subdominios a propósito. En multi-tenant por subdominio, nunca.
- El refresh token con Path acotado al endpoint que lo usa.
- Derivá los atributos de UN SOLO lugar, compartido entre escribir y borrar.
  Si al borrar no coinciden exactamente, el navegador ignora el borrado y no
  te dice nada.

REFRESH TOKEN
Rotación en cada uso. El endpoint de refresh emite un par nuevo (access +
refresh) e invalida el anterior. Guardá los refresh emitidos (o su hash) con
un identificador de familia; si llega uno ya consumido, invalidá la familia
completa: alguien lo robó o hay un bug de concurrencia, y en los dos casos
querés enterarte.

DESARROLLO EN ANGULAR: EL PROXY
Este punto se pasa por alto y hace perder mucho tiempo.
En desarrollo, Angular sirve en :4200 y la API en otro puerto. Son orígenes
distintos, así que el navegador aplica CORS: sin withCredentials en el front
y sin Allow-Origin exacto más Allow-Credentials en la API, la respuesta se
descarta y el login parece roto solo en local.

Ojo con el diagnóstico: NO es SameSite. localhost:4200 y localhost:3000 son
orígenes distintos pero el mismo site, y las cookies no distinguen puerto.
Con SameSite=Strict la cookie igual viaja entre esos dos. Lo que rompe es
CORS. Importa saberlo porque si después tenés app.empresa.com contra
api.empresa.com, el problema es el mismo (CORS) y la solución es la misma
(mismo origen o CORS con credenciales bien configurado), no tocar SameSite.

La solución en dev NO es configurar CORS a mano ni relajar nada: es un proxy
en el dev server, para que dev sea mismo-origen igual que producción y CORS
no exista en ninguno de los dos:

  proxy.conf.json:
  {
    "/api": {
      "target": "http://localhost:PUERTO_DE_TU_API",
      "secure": false,
      "changeOrigin": false
    }
  }

  angular.json → architect → serve → options:
  "proxyConfig": "proxy.conf.json"

  environment.ts: apiUrl pasa a "" (cadena vacía), así las URLs quedan
  relativas y salen por el proxy.

Dos detalles:
- changeOrigin en false. Mantener el Host como localhost:4200 es lo que
  preserva el mismo-origen de punta a punta.
- Hay que REINICIAR el dev server para que tome el proxy. Si no, la prueba da
  falso negativo.

En .NET el equivalente es servir el frontend desde el mismo host, o usar el
proxy de SPA del propio ASP.NET.

FRONTEND: LO QUE MÁS FALLA
- El estado de sesión ya no puede ser "¿tengo token?". Usá tres estados:
  autenticado, no autenticado, y todavía-no-pregunté. El tercero es el que
  falta siempre.
- Si varios guards consultan la sesión a la vez, compartí una sola petición en
  vuelo. Si no, hacés tres llamadas idénticas al arrancar.
- Todas las peticiones necesitan enviar credenciales (withCredentials en
  Angular, credentials: 'include' en fetch). Con el proxy en dev y mismo
  origen en producción no hace falta, pero ponelo igual: si algún día la API
  se mueve de origen, no querés descubrirlo por esto.
- Ante un 401: refrescar una vez, reintentar una vez, y cerrar sesión si el
  refresco también falla.
- Para cortar el bucle infinito NO uses un contador en un servicio compartido:
  se pisa entre peticiones concurrentes. Marcá la petición misma (en Angular,
  HttpContextToken) tanto en la llamada de refresco como en el reintento, y
  también en la llamada a /auth/me del arranque: un 401 ahí es "no hay
  sesión", no "hay que refrescar".
- Si varias peticiones dan 401 a la vez, que compartan UN solo refresco. Con
  rotación esto deja de ser optimización y pasa a ser obligatorio: cinco
  refresh concurrentes con el mismo token disparan la detección de
  reutilización y tiran la sesión.
- Sacá cualquier location.reload() del manejo de 401: destruye el redirect a
  la pantalla de login y cualquier dato sin guardar.

CÓMO VERIFICAR (no alcanza con que compile)
1. Iniciar sesión entra.
2. Refrescar con F5 mantiene la sesión ← el que más se rompe y peor se nota:
   parece que anda hasta que refrescás.
3. Esperar a que expire el access token y seguir navegando sin interrupción.
   En vez de esperar, borrá la cookie del access token dejando la del refresh.
   Es la misma condición y es inmediato.
4. Con el access borrado, disparar varias peticiones a la vez (abrir una
   pantalla que haga cuatro o cinco llamadas). En el log del backend tiene
   que haber UN refresh. Si hay más de uno, el punto anterior está mal.
5. Cerrar sesión, y confirmar que una petición posterior da 401. Y que el
   refresh viejo, si lo guardaste, también da 401.
6. Abrir la app desde un link externo (pegá la URL en otro sitio, o mandátela
   por chat) con sesión activa. Si el access está en Strict, vas a llegar
   deslogueado; confirmá que es lo que querés.
7. En la consola del navegador: localStorage sin tokens, y document.cookie
   sin mostrarlos.
8. En la pestaña Application/Storage del navegador, mirá los atributos reales
   de cada cookie. Tienen que coincidir con lo que decidiste arriba.
9. Alguna pantalla que ya existía sigue funcionando.
10. Si hay proxy adelante en producción (Cloudflare, nginx): probar el rate
    limit ahí, no en localhost.

LO QUE ESTA MIGRACIÓN NO RESUELVE
Cerrar sesión borra la cookie e invalida el refresh, pero el access token en
sí sigue siendo válido hasta que expire. Si alguien lo copió antes, lo puede
usar ese rato.
Revocarlo de verdad exige guardar los access invalidados en algún lado (Redis)
y consultarlo en CADA petición, más decidir qué hacer si ese almacén se cae.
Decidilo a conciencia: con access de 15 minutos, refresh con rotación y el
vector de robo ya cerrado, puede no valer la pena. Pero que sea una decisión,
no un olvido.

Y HttpOnly no te protege de un XSS activo: mientras el script corre en la
pestaña de la víctima, puede usar la sesión. Lo que te protege de eso es no
tener XSS (CSP, sanitización, no usar innerHTML con input). La migración
cierra la exfiltración; el resto sigue siendo tu problema.
```

---

## Qué esperar

De una auditoría así salieron, en un proyecto real, cinco problemas que ya
estaban ahí y nadie había visto:

| Hallazgo | Por qué no se notaba |
|---|---|
| Token en localStorage | Funcionaba perfecto |
| Refresh token firmado y nunca usado | El backend lo emitía, el front lo ignoraba |
| Límite de login que nunca se ejecutaba | Registrado después de las rutas |
| La app arrancaba sin secretos, con el default del repo | No fallaba ni avisaba |
| Los errores devolvían rutas del servidor | Solo se veía leyendo una respuesta de error |

Ninguno daba error. Todos aparecieron al medir.

Con los puntos agregados en esta versión, los candidatos a sumarse a esa tabla
son: rate limit que cuenta la IP del proxy, refresh que no rota, cookie con
Domain compartida entre tenants, y JWT que no valida `exp` porque nadie le
pasó las opciones. Ninguno de esos da error tampoco.
