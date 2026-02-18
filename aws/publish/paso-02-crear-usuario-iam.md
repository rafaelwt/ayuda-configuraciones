# Paso 2: Crear Usuario IAM

---

## 2.1 — Acceder a IAM

1. Ir a **IAM** en la consola de AWS
2. En el menú lateral, ir a **Users** → **Create user**

## 2.2 — Crear el Usuario

1. **User name:** `deploy-spa` (o el nombre que prefieras)
2. **NO** marcar "Provide user access to the AWS Management Console" (este usuario es solo para CLI y CI/CD)
3. Clic en **Next**

## 2.3 — Asignar Permisos

1. Seleccionar **Attach policies directly**
2. Buscar y seleccionar estas políticas:
   - `AmazonS3FullAccess` — para subir el build al bucket
   - `CloudFrontFullAccess` — para crear/invalidar la distribución
   - `AWSCertificateManagerFullAccess` — para gestionar el certificado SSL
   - `AmazonRoute53FullAccess` — para configurar los registros DNS
3. Clic en **Next** → **Create user**

> **Nota:** Estas son políticas amplias para simplificar el setup inicial. Más adelante podés restringirlas a solo los recursos específicos de tu proyecto.

## 2.4 — Crear Access Keys (para CLI y GitHub Actions)

1. Entrar al usuario recién creado
2. Ir a la pestaña **Security credentials**
3. En **Access keys**, clic en **Create access key**
4. Seleccionar **Command Line Interface (CLI)**
5. Confirmar y clic en **Create access key**
6. **Guardar el Access Key ID y Secret Access Key** en un lugar seguro (solo se muestran una vez)

## 2.5 — Configurar AWS CLI Local

```bash
aws configure
```

Ingresar:
- **AWS Access Key ID:** el que guardaste
- **AWS Secret Access Key:** el que guardaste
- **Default region name:** `us-east-1`
- **Default output format:** `json`

Verificar que funcione:

```bash
aws sts get-caller-identity
```

Deberías ver el ARN del usuario `deploy-spa`.

---

