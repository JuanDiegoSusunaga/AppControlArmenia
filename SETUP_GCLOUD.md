# Setup Guide: Google Cloud Build, Secret Manager & Deploy

Este documento te guía paso a paso para configurar Secret Manager, IAM, y el Cloud Build trigger.

## Requisitos previos

- Tener `gcloud` CLI instalado y autenticado
- Tener permisos en el proyecto GCP para:
  - Crear secrets en Secret Manager
  - Modificar IAM policies
  - Crear Cloud Build triggers

## Paso 1: Verificar autenticación y proyecto

```bash
gcloud auth list
gcloud config get-value project
```

Si no estás autenticado:
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

## Paso 2: Crear el secreto en Secret Manager

```bash
# Crear el secreto (si no existe)
gcloud secrets create APP_DB_PASSWORD --replication-policy="automatic" 2>/dev/null || echo "Secret already exists"

# Añadir la contraseña de forma segura (desde stdin, no queda en historial)
read -s -p "Introduce la contraseña de la BD: " DBPASS
echo
echo -n "$DBPASS" | gcloud secrets versions add APP_DB_PASSWORD --data-file=-
unset DBPASS

# Verificar que el secreto fue creado
gcloud secrets describe APP_DB_PASSWORD
gcloud secrets versions access latest --secret="APP_DB_PASSWORD" | head -c 10
echo "... (output truncated for security)"
```

## Paso 3: Conceder acceso al Cloud Build Service Account

```bash
# Obtener el número del proyecto
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')
echo "Project Number: $PROJECT_NUMBER"

# Determinar el Cloud Build Service Account
# (intenta ambas formas; una debería existir)
SA1="service-${PROJECT_NUMBER}@gcp-sa-cloudbuild.iam.gserviceaccount.com"
SA2="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

echo "Checking service accounts..."
gcloud iam service-accounts describe "$SA1" --project=$(gcloud config get-value project) 2>/dev/null && \
  { CLOUDBUILD_SA="$SA1"; echo "Using: $SA1"; } || \
gcloud iam service-accounts describe "$SA2" --project=$(gcloud config get-value project) 2>/dev/null && \
  { CLOUDBUILD_SA="$SA2"; echo "Using: $SA2"; } || \
  { echo "ERROR: Could not find Cloud Build service account"; exit 1; }

# Otorgar permiso de lectura de secretos
echo "Granting Secret Manager access to $CLOUDBUILD_SA..."
gcloud secrets add-iam-policy-binding APP_DB_PASSWORD \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/secretmanager.secretAccessor"

echo "Done!"
```

## Paso 4: Crear o actualizar el Cloud Build Trigger

### Opción A: Usando gcloud (CLI)

```bash
PROJECT_ID=$(gcloud config get-value project)

# Crear un nuevo trigger (si no existe)
gcloud beta builds triggers create github \
  --name="deploy-backend-to-cloud-run" \
  --repo-owner="JuanDiegoSusunaga" \
  --repo-name="AppControlArmenia" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml" \
  --project="$PROJECT_ID"

echo "Trigger created! Next: push to main or manually run the trigger."
```

**Nota**: Si la integración GitHub no está conectada a Cloud Build, este comando fallará. En ese caso, usa la Opción B (UI).

### Opción B: Usando Google Cloud Console (UI)

1. Abre [Cloud Console → Cloud Build → Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Haz click en **"Create Trigger"**
3. Configura:
   - **Name**: `deploy-backend-to-cloud-run`
   - **Event**: Push to a branch
   - **Repository**: Selecciona `AppControlArmenia` (necesita GitHub App conectada)
   - **Branch**: `^main$`
   - **Build configuration**: Cloud Build configuration file (yaml)
   - **Cloud Build configuration file location**: `cloudbuild.yaml`
   - **Substitutions** (opcional): Deja en blanco; el pipeline leerá `_DB_PASS` desde Secret Manager
4. Haz click en **"Create"**

## Paso 5: Probar el trigger

### Opción A: Push a main (activa el trigger automáticamente)

```bash
cd /workspaces/AppControlArmenia
git push  # Si hay cambios, esto activa el trigger automáticamente
```

### Opción B: Ejecución manual desde gcloud

```bash
# Sin pasar _DB_PASS (usa Secret Manager)
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_INSTANCE_CONNECTION_NAME="juan-diego-susunaga:us-central1:controldeobranexus",_DB_USER="app_user",_DB_NAME="controldeobranexus",_USE_PRIVATE_IP="true" \
  .
```

### Opción C: Ejecución manual desde consola (UI)

1. Ve a Cloud Build → Triggers
2. Selecciona el trigger
3. Haz click en **"Run"**
4. Espera a que se complete

## Paso 6: Revisar logs

```bash
# Listar builds recientes
gcloud builds list --limit=5

# Ver logs de un build específico (reemplaza BUILD_ID)
BUILD_ID=$(gcloud builds list --limit=1 --format='value(id)')
gcloud builds log "$BUILD_ID"

# O abre en consola:
# https://console.cloud.google.com/cloud-build/builds
```

## Solución de problemas

### Error: "Dockerfile not found"
- Verifica que `cloudbuild.yaml` esté en la raíz del repo
- Verifica que `Administracion/backend/Dockerfile` existe
- Solución: El `cloudbuild.yaml` ya está corregido; haz push nuevamente

### Error: "Secret not found"
- Verifica que `APP_DB_PASSWORD` existe: `gcloud secrets describe APP_DB_PASSWORD`
- Verifica que Cloud Build SA tiene acceso: `gcloud secrets get-iam-policy APP_DB_PASSWORD`

### Error: "Permission denied"
- Verifica que tu cuenta tiene `roles/secretmanager.admin` o permisos equivalentes
- Verifica que el Cloud Build SA tiene `roles/secretmanager.secretAccessor`

### Error: "Repository not connected"
- La integración GitHub → Cloud Build no está configurada
- Solución: Ve a Cloud Build → Settings → GitHub App y conecta tu repositorio

## Resumen rápido

```bash
# 1. Crear secreto
gcloud secrets create APP_DB_PASSWORD --replication-policy="automatic"
read -s -p "Password: " P && echo -n "$P" | gcloud secrets versions add APP_DB_PASSWORD --data-file=- && unset P

# 2. Dar acceso
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')
CLOUDBUILD_SA="service-${PROJECT_NUMBER}@gcp-sa-cloudbuild.iam.gserviceaccount.com"
gcloud secrets add-iam-policy-binding APP_DB_PASSWORD --member="serviceAccount:${CLOUDBUILD_SA}" --role="roles/secretmanager.secretAccessor"

# 3. Crear trigger
gcloud beta builds triggers create github --name="deploy-backend-to-cloud-run" --repo-owner="JuanDiegoSusunaga" --repo-name="AppControlArmenia" --branch-pattern="^main$" --build-config="cloudbuild.yaml"

# 4. Probar
cd /workspaces/AppControlArmenia && git push
```

---

**Más información**: 
- [Google Cloud Secret Manager Docs](https://cloud.google.com/secret-manager/docs)
- [Cloud Build Docs](https://cloud.google.com/build/docs)
- [Cloud Run Docs](https://cloud.google.com/run/docs)
