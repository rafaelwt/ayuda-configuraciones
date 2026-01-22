# Guía: Conectar a PostgreSQL en AWS RDS

## Paso 1: Ir al Security Group del RDS

1. En la consola de AWS, ir a **EC2 → Security Groups**
2. Buscar el Security Group asociado a tu RDS (ej: `sg-0fea189be590795d3`)
3. Seleccionar el Security Group

## Paso 2: Editar las reglas de entrada

1. Seleccionar la pestaña **Inbound rules**
2. Clic en **Actions → Edit inbound rules**

## Paso 3: Agregar regla para PostgreSQL

1. Clic en **Add rule**
2. Configurar:
   - **Type:** PostgreSQL
   - **Protocol:** TCP (se llena automático)
   - **Port range:** 5432 (se llena automático)
   - **Source:** `0.0.0.0/0` (cualquier IP) o tu IP específica
   - **Description:** (opcional) ej: "TEMP TEST"
3. Clic en **Save rules**

> **Advertencia:** Usar `0.0.0.0/0` permite acceso desde cualquier IP. Para producción, usa tu IP específica.

---

## Verificar la conexión

### Windows (PowerShell)

```powershell
Test-NetConnection <endpoint-rds> -Port 5432
```

**Resultado esperado (éxito):**
```
TcpTestSucceeded : True
```

**Resultado fallido:**
```
TcpTestSucceeded : False
```

---

### Linux / macOS

```bash
nc -zv <endpoint-rds> 5432
```

**Resultado esperado (éxito):**
```
Connection to <endpoint-rds>... 5432 port [tcp/postgresql] succeeded!
```

**Resultado fallido:**
```
nc: connect to <endpoint-rds>... port 5432 (tcp) failed: Connection refused
```

---

### Alternativa universal (con PostgreSQL instalado)

```bash
psql -h <endpoint-rds> -p 5432 -U tu_usuario -d tu_base
```

---

## Solución de problemas

Si `TcpTestSucceeded: False` o la conexión falla, verifica:

1. El **Security Group** tiene la regla para puerto 5432
2. Tu IP está permitida en el Source de la regla
3. La instancia RDS tiene **Publicly Accessible: Yes**
