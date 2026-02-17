# Guia de Creacion de Bucket en AWS S3

## Paso 1: General Configuration

| Campo | Valor |
|-------|-------|
| AWS Region | Seleccionar la region mas cercana a los usuarios |
| Bucket type | General purpose |
| Bucket name | Nombre unico a nivel global (solo minusculas, numeros, puntos y guiones) |

El nombre del bucket debe ser unico en todo AWS. Debe tener entre 3 y 63 caracteres, comenzar y terminar con letra o numero.

## Paso 2: Object Ownership

| Campo | Valor recomendado |
|-------|-------------------|
| Object Ownership | ACLs disabled (recommended) |

Todos los objetos son propiedad de la cuenta del bucket. El acceso se controla unicamente con policies IAM. Esta es la opcion recomendada por AWS.

## Paso 3: Block Public Access

| Campo | Valor recomendado |
|-------|-------------------|
| Block all public access | Activado |
| Block new ACLs | Activado |
| Block any ACLs | Activado |
| Block new public bucket policies | Activado |
| Block any public bucket policies | Activado |

Para sistemas internos donde solo usuarios autenticados acceden a los archivos, se debe bloquear todo acceso publico. Los archivos se sirven a traves del backend usando credenciales IAM y presigned URLs temporales.

## Paso 4: Bucket Versioning

| Campo | Valor recomendado |
|-------|-------------------|
| Bucket Versioning | Enable |

Guarda todas las versiones de cada archivo. Si se sube un archivo con la misma key, la version anterior no se pierde y se puede recuperar. Util para auditoria y recuperacion ante errores.

Considerar que cada version ocupa espacio y se cobra. Se pueden configurar Lifecycle Rules para eliminar versiones antiguas automaticamente.

## Paso 5: Tags (opcional)

| Key | Value |
|-----|-------|
| proyecto | nombre-del-proyecto |
| ambiente | dev / staging / prod |

Los tags son pares clave-valor que ayudan a organizar recursos y filtrar costos en AWS Billing. Se pueden agregar hasta 50 tags por bucket.

## Paso 6: Default Encryption

| Campo | Valor recomendado |
|-------|-------------------|
| Encryption type | Server-side encryption with Amazon S3 managed keys (SSE-S3) |
| Bucket Key | Enable |

SSE-S3 proporciona encriptacion automatica en reposo sin costo adicional y sin configuracion en el codigo. Las otras opciones (SSE-KMS, DSSE-KMS) ofrecen mayor control sobre las llaves pero tienen costo adicional.

## Resumen

```
Region:          Segun ubicacion de usuarios
Type:            General purpose
ACLs:            Disabled (recommended)
Public Access:   Blocked (all)
Versioning:      Enabled
Encryption:      SSE-S3 (managed keys)
Bucket Key:      Enabled
Tags:            Segun proyecto y ambiente
```
