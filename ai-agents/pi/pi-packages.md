# Paquetes de Pi

| Paquete | Rol opcional |
|---|---|
| `pi-intercom` | Comunicación entre sesiones cuando tu configuración de Pi lo soporta. |
| `pi-web-access` | Acceso web cuando una tarea lo necesita y tu política lo permite. |
| `pi-lens` | Superficies de inspección adicionales. |

---

## Detalles

### pi-intercom

Mensajería directa 1:1 entre sesiones de Pi en la misma máquina. Permite enviar contexto, hallazgos o solicitudes de una sesión a otra.

- **Versión:** 0.13.0
- **Autor:** nicopreme
- **Licencia:** MIT
- **Tipos:** extension, skill
- **Instalación:**
  ```bash
  pi install npm:pi-intercom
  ```

### pi-web-access

Búsqueda web, extracción de contenido, clonado de repositorios de GitHub, extracción de PDF, comprensión de videos de YouTube y análisis de video local para el agente de codificación Pi.

- **Versión:** 0.30.0
- **Autor:** nicopreme
- **Licencia:** MIT
- **Tipos:** extension
- **Instalación:**
  ```bash
  pi install npm:pi-web-access
  ```

### pi-lens

Retroalimentación de código en tiempo real para Pi: LSP, linters, formateadores, verificación de tipos, análisis estructural y más.

- **Versión:** 4.2.1
- **Autor:** apmantza
- **Licencia:** MIT
- **Tipos:** extension, skill
- **Instalación:**
  ```bash
  pi install npm:pi-lens
  ```