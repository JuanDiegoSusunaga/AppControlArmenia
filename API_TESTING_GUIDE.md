# AppControlArmenia API Testing Guide

## Service Information
- **Status**: ✅ DEPLOYED AND LIVE
- **Region**: us-central1
- **Platform**: Google Cloud Run (Managed)
- **Access**: Public (unauthenticated)

## Get the Service URL

```bash
# In Cloud Shell:
gcloud run services describe appcontrolarmenia \
  --region us-central1 \
  --format='value(status.url)'
```

This will return: `https://appcontrolarmenia-XXXXX-uc.a.run.app`

## API Endpoints

### 1. Health Check (GET /)
**Purpose**: Verify the service is running

```bash
curl https://appcontrolarmenia-XXXXX-uc.a.run.app/
```

**Expected Response** (200 OK):
```json
{
  "status": "OK",
  "message": "Backend funcionando correctamente",
  "timestamp": "2025-11-16T17:50:49.714617",
  "version": "1.0.0"
}
```

---

### 2. Database Health Check (GET /health)
**Purpose**: Verify database connectivity

```bash
curl https://appcontrolarmenia-XXXXX-uc.a.run.app/health
```

**Expected Response** (200 OK):
```json
{
  "status": "healthy",
  "database": "connected"
}
```

---

### 3. Register a Fichaje (POST /api/fichajes)
**Purpose**: Create a new check-in/check-out record

```bash
curl -X POST https://appcontrolarmenia-XXXXX-uc.a.run.app/api/fichajes \
  -H "Content-Type: application/json" \
  -d '{
    "empleado_id": "EMP001",
    "tipo_fichaje": "ENTRADA",
    "actividad": "Inicio de turno",
    "latitud": 10.3931,
    "longitud": -61.1634
  }'
```

**Request Fields**:
- `empleado_id` (required): Employee ID (string)
- `tipo_fichaje` (required): Type - must be "ENTRADA" (check-in) or "SALIDA" (check-out)
- `actividad` (optional): Activity description (string)
- `latitud` (optional): Latitude (float)
- `longitud` (optional): Longitude (float)

**Expected Response** (201 Created):
```json
{
  "success": true,
  "mensaje": "Fichaje registrado exitosamente",
  "fichaje_id": 1,
  "timestamp": "2025-11-16T17:50:49.714617"
}
```

---

### 4. Get Fichajes for Employee (GET /api/fichajes/{empleado_id})
**Purpose**: Retrieve all check-in/check-out records for an employee

```bash
curl https://appcontrolarmenia-XXXXX-uc.a.run.app/api/fichajes/EMP001
```

**Expected Response** (200 OK):
```json
{
  "fichajes": [
    {
      "id": 1,
      "empleado_id": "EMP001",
      "tipo": "ENTRADA",
      "actividad": "Inicio de turno",
      "latitud": 10.3931,
      "longitud": -61.1634,
      "created_at": "2025-11-16T17:50:49.714617"
    }
  ],
  "total": 1
}
```

---

## Database Schema

The API automatically creates the `fichajes` table on first run:

```sql
CREATE TABLE fichajes (
  id SERIAL PRIMARY KEY,
  empleado_id VARCHAR(50) NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  actividad TEXT,
  latitud FLOAT,
  longitud FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

---

## Environment Variables (Cloud Run)

The service uses these environment variables (auto-set by Cloud Build):

| Variable | Value | Source |
|----------|-------|--------|
| `INSTANCE_CONNECTION_NAME` | `juan-diego-susunaga:us-central1:controldeobranexus` | cloudbuild.yaml |
| `DB_USER` | `app_user` | cloudbuild.yaml |
| `DB_NAME` | `controldeobranexus` | cloudbuild.yaml |
| `USE_PRIVATE_IP` | `true` | cloudbuild.yaml |
| `DB_PASS` | `[from APP_DB_PASSWORD secret]` | Secret Manager |
| `PORT` | `8080` | Default (Cloud Run) |

---

## CI/CD Pipeline

Every push to `main` branch automatically:

1. ✅ Triggers Cloud Build
2. ✅ Builds Docker image from `Administracion/backend/Dockerfile`
3. ✅ Runs tests in container
4. ✅ Pushes image to `gcr.io/controldeobranexus/appcontrolarmenia-backend`
5. ✅ Deploys to Cloud Run in `us-central1`
6. ✅ Service URL remains the same (updates in-place)

Build status: https://console.cloud.google.com/cloud-build/builds?project=controldeobranexus

---

## Troubleshooting

### Service returns 503 (Service Unavailable)
- Check database connection: `curl https://appcontrolarmenia-XXXXX-uc.a.run.app/health`
- Verify Cloud SQL instance is running
- Check Cloud Run logs: `gcloud run logs read appcontrolarmenia --region=us-central1 --limit=50`

### Database Connection Errors
- Verify `APP_DB_PASSWORD` secret exists
- Check Cloud Run service account has `secretmanager.secretAccessor` role
- Verify Cloud SQL instance name and connection string

### Permission Denied on Secret
```bash
# Re-grant permissions
PROJECT_NUMBER=$(gcloud projects describe controldeobranexus --format='value(projectNumber)')
CLOUD_RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding APP_DB_PASSWORD \
  --member="serviceAccount:${CLOUD_RUN_SA}" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Next Steps

- Monitor deployments: https://console.cloud.google.com/run?project=controldeobranexus
- View logs: `gcloud run logs read appcontrolarmenia --region=us-central1`
- Update code → push to main → auto-deploy!
