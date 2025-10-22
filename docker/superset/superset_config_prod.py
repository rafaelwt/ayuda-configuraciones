# superset/superset_config.py
import os

# Nombre de la aplicación
APP_NAME = 'Pago al paso 24/7'

# Habilitar Jinja y templates
FEATURE_FLAGS = {
    "ENABLE_TEMPLATE_PROCESSING": True,
    "ALERT_REPORTS": True,
    "SSH_TUNNELING": True,
}

# Configuración de seguridad para SQL
ENABLE_TEMPLATE_PROCESSING = True
ALLOW_CTAS = True
ALLOW_CVAS = True
ALLOW_DML = True
ALLOW_RUN_ASYNC = True

# Logs para debugging
ENABLE_TIME_ROTATE = False
LOG_LEVEL = "INFO"
