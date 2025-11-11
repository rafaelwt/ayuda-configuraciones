## Comandos útiles de Laravel — Colas y Horizon

Resumen de los comandos más usados en producción y para debug de colas en Laravel. Incluye Horizon y los comandos de la cola nativa.

| Comando | Descripción |
|--------:|:------------|
| `php artisan horizon` | Inicia el dashboard y los procesos de Horizon (gestiona los workers y colas). Ideal en entornos donde se usa Horizon para monitorizar y balancear workers. |
| `php artisan horizon:terminate` | Termina y reinicia todos los procesos de Horizon. Muy útil tras un deploy para que Horizon recargue el nuevo código y la configuración. |
| `php artisan queue:work` | Ejecuta un worker que procesa trabajos en cola en tiempo real. Útil si no se usa Horizon o para trabajos puntuales en entornos simples. |
| `php artisan queue:restart` | Envía una señal a los workers para que se reinicien de forma ordenada y carguen el nuevo código (no mata trabajos en curso). Úsalo después de deploys. |
| `php artisan queue:flush` | Elimina todos los jobs fallidos registrados (resetea la lista de fallidos). Úsalo con precaución en producción. |
| `php artisan queue:failed` | Muestra la lista de jobs fallidos con su ID, conexión, cola y error. Primera herramienta para debugging. |
| `php artisan queue:forget {id}` | Elimina un job fallido específico por su ID (obtenido con `queue:failed`). |
| `php artisan queue:retry {id}` | Reintenta ejecutar un job fallido por su ID. También acepta varios IDs o `all` para reintentar todo. |

### Ejemplos rápidos

- Reiniciar Horizon tras un deploy (asegura que cargue el nuevo código):

	`php artisan horizon:terminate`

- Ejecutar un worker en primer plano (útil para debugging o contenedores sin Horizon):

	`php artisan queue:work --tries=3 --sleep=3 --timeout=90`

- Ver y reintentar un job fallido:

	`php artisan queue:failed`
	`php artisan queue:retry 5`

- Eliminar un job fallido concreto:

	`php artisan queue:forget 5`

### Buenas prácticas y notas

- En producción prefiera Horizon si necesita monitorización, balancing automático y métricas. Horizon facilita la administración de múltiples procesos y configuración por entorno.
- Use `horizon:terminate` o `queue:restart` después de despliegues para asegurar que los workers carguen los cambios sin interrumpir innecesariamente trabajos en curso.
- Controle la política de reintentos y timeouts por job (`--tries`, `--timeout`) para evitar trabajos que queden colgados indefinidamente.
- Mantenga limpia la lista de fallidos y analice los errores antes de forzar borrados (`queue:flush` o `queue:forget`).
- En entornos con alta carga, combine Horizon con supervisores del sistema (/systemd, supervisor) para asegurar reinicios automáticos y puesta en marcha tras reboot.

### Referencias rápidas

- Documentación oficial de Horizon y colas: https://laravel.com/docs/ (buscar "Horizon" y "queues").

---

_Documento generado y formateado: lista de comandos y recomendaciones para uso en producción y debugging._

