# Cloud Build Fix - Configuración Correcta

## ⚠️ El Error que Encontramos

El problema fue que los archivos tenían **formato Markdown con backticks** en lugar de código puro:

```
❌ INCORRECTO:
```pip-requirements
flask==3.0.0
...
```

✅ CORRECTO:
flask==3.0.0
...
```

## 🔧 Lo que se Corrigió

1. **requirements.txt** - Removidos los backticks de markdown
2. **Dockerfile** - Removidos los backticks de markdown  
3. **cloudbuild.yaml** - Actualizado para:
   - Región: `europe-west1` (donde está tu Cloud Run)
   - Ruta correcta del Dockerfile: `Administracion/backend/Dockerfile`
   - Servicio: `appcontrolarmenia`

## 📋 Configurar Cloud Build Trigger

Sigue estos pasos en Google Cloud Console:

### 1. Ir a Cloud Build > Triggers
```
https://console.cloud.google.com/cloud-build/triggers
```

### 2. Editar o Crear el Trigger

**Si ya existe:**
- Click en el trigger existente
- Edit
- Modificar lo siguiente:

**Si no existe:**
- New Trigger
- Conectar repositorio: `AppControlArmenia`

### 3. Configurar el Trigger

**Build configuration:**
- Seleccionar: `Cloud Build configuration file`
- Archivo: `cloudbuild.yaml` (la raíz del repositorio)

**Substitution variables:**

En la sección "Substitution variables", agregar:

```
_INSTANCE_CONNECTION_NAME = tu-proyecto:europe-west1:postgresql-instance
_DB_USER = postgres
_DB_PASS = tu-contraseña-segura
_DB_NAME = fichajes_db
```

### 4. Guardar el Trigger

Click en "Create" o "Save"

## 🚀 Verificar que Funciona

1. Hacer un push a main:
```bash
git push origin main
```

2. El trigger se ejecutará automáticamente
3. Ver progreso en: Cloud Build > History
4. Si falla, ver logs detallados

## 📊 Verificar Logs si falla de nuevo

```bash
# Ver últimos 50 logs
gcloud builds log --limit=50

# Ver logs de un build específico
gcloud builds log BUILD_ID --stream

# Ver todos los builds
gcloud builds list
```

## 🐛 Troubleshooting

### Error: "File not found: cloudbuild.yaml"
- Solución: Asegurarse de que `cloudbuild.yaml` está en la **raíz** del repositorio

### Error: "docker: not found"
- Solución: El error debería resolverse con `gcloud build` (ya incluido)

### Error: "permission denied"
- Solución: Cloud Build necesita permisos. En Cloud Console:
  1. Ir a IAM & Admin > IAM
  2. Buscar "Cloud Build" service account
  3. Agregar rol: "Cloud Run Admin" + "Service Account User"

### El servicio no inicia
- Verificar variables de entorno en Cloud Run
- Ver logs: `gcloud run logs read appcontrolarmenia --limit=50`

## ✅ Próximos Pasos

1. Asegurarse de que Cloud SQL instance existe:
```bash
gcloud sql instances list
```

2. Obtener INSTANCE_CONNECTION_NAME correcta:
```bash
gcloud sql instances describe postgresql-instance \
  --format='value(connectionName)'
```

3. Actualizar el trigger con los valores reales

4. Hacer push a main → Cloud Build debería ejecutarse

## 📝 Commit Realizado

Commit: `702834d`
- ✅ requirements.txt corregido
- ✅ Dockerfile corregido
- ✅ cloudbuild.yaml (backend) corregido
- ✅ cloudbuild.yaml (raíz) creado

---

**Si aún falla después de esto, por favor compartir los logs de Cloud Build.**
