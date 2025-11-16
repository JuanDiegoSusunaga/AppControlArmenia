# AppControlArmenia CI/CD - Complete Setup & Validation Checklist

## ✅ Deployment Status: LIVE AND OPERATIONAL

- **Service**: appcontrolarmenia
- **Region**: us-central1
- **Platform**: Google Cloud Run (Managed)
- **Access**: Public (unauthenticated)
- **Database**: PostgreSQL 17 (Cloud SQL)
- **Backend**: Python 3.11 + Flask + Gunicorn

---

## 📋 Setup Checklist

### Prerequisites Completed ✅
- [x] GitHub repository connected to Google Cloud Build
- [x] Cloud Build trigger "Nexus" created and linked
- [x] Cloud SQL instance running (`juan-diego-susunaga:us-central1:controldeobranexus`)
- [x] PostgreSQL database `controldeobranexus` created
- [x] Database user `app_user` created with password

### Google Cloud APIs Enabled ✅
- [x] Cloud Build API
- [x] Cloud Run API
- [x] Cloud SQL Admin API
- [x] Secret Manager API
- [x] Container Registry API

### Secrets & IAM Configured ✅
- [x] Secret `APP_DB_PASSWORD` created in Secret Manager
- [x] Cloud Build service account has `secretmanager.secretAccessor` role
- [x] Cloud Run service account has `secretmanager.secretAccessor` role
- [x] Cloud Run service has `roles/run.invoker` for `allUsers` (public access)

### Docker & Deployment ✅
- [x] Dockerfile optimized for Cloud Run (Python 3.11-slim, Gunicorn, port 8080)
- [x] requirements.txt with correct dependency versions
- [x] cloudbuild.yaml configured (4-step pipeline)
- [x] First successful build completed (commit: a71757e)
- [x] Service deployed and publicly accessible

---

## 🚀 CI/CD Pipeline Flow

```
Developer pushes to main
    ↓
GitHub webhook triggers Cloud Build
    ↓
Step 0: Docker build image from Administracion/backend/Dockerfile
    ├─ Installs system dependencies (build-essential, libpq-dev, gcc)
    ├─ Installs Python dependencies from requirements.txt
    ├─ Copies application code
    ├─ Sets EXPOSE 8080
    └─ CMD: gunicorn --bind 0.0.0.0:8080 --workers 1 main:app
    ↓
Step 1: Push to gcr.io with commit SHA tag
    ├─ Image: gcr.io/controldeobranexus/appcontrolarmenia-backend:{SHORT_SHA}
    └─ Example: gcr.io/controldeobranexus/appcontrolarmenia-backend:a71757e
    ↓
Step 2: Push to gcr.io with latest tag
    └─ Image: gcr.io/controldeobranexus/appcontrolarmenia-backend:latest
    ↓
Step 3: Deploy to Cloud Run
    ├─ Service: appcontrolarmenia
    ├─ Region: us-central1
    ├─ Memory: 512Mi
    ├─ CPU: 1
    ├─ Cloud SQL connection: juan-diego-susunaga:us-central1:controldeobranexus
    ├─ Environment variables from cloudbuild.yaml substitutions
    ├─ DB_PASS from Secret Manager (APP_DB_PASSWORD:latest)
    └─ Public access: --allow-unauthenticated
    ↓
Service URL: https://appcontrolarmenia-XXXXX-uc.a.run.app
    ✅ LIVE and accepting requests
```

---

## 📁 Repository Structure

```
AppControlArmenia/
├── cloudbuild.yaml                    # Main CI/CD pipeline
├── API_TESTING_GUIDE.md               # API documentation
├── SETUP_GCLOUD.md                    # Initial setup instructions
├── scripts/
│   └── grant-cloud-run-permissions.sh # Helper script for IAM
└── Administracion/
    └── backend/
        ├── main.py                    # Flask application
        ├── Dockerfile                 # Container definition
        ├── requirements.txt           # Python dependencies
        └── [test scripts, docs, etc]
```

---

## 🔧 Key Configuration Files

### cloudbuild.yaml
**Location**: `/workspaces/AppControlArmenia/cloudbuild.yaml`

**Steps**:
1. Docker build with `-f Administracion/backend/Dockerfile`
2. Push image with commit SHA tag
3. Push image with latest tag
4. Deploy to Cloud Run with:
   - Cloud SQL connection
   - Secret Manager for DB_PASS
   - Public access enabled

**Substitutions**:
- `_INSTANCE_CONNECTION_NAME`: Cloud SQL instance connection string
- `_DB_USER`: Database user (app_user)
- `_DB_NAME`: Database name (controldeobranexus)
- `_USE_PRIVATE_IP`: Use private IP for Cloud SQL (true)
- `_DB_PASS_SECRET_NAME`: Secret name (APP_DB_PASSWORD)

### requirements.txt
**Location**: `/workspaces/AppControlArmenia/Administracion/backend/requirements.txt`

**Dependencies**:
- Flask 3.0.0 (web framework)
- Gunicorn 21.2.0 (WSGI server)
- cloud-sql-python-connector 1.18.5 (Cloud SQL connection)
- pg8000 1.30.5 (PostgreSQL driver)
- SQLAlchemy 2.0.23 (ORM)
- Flask-CORS 4.0.0 (CORS support)
- Python-dotenv 1.0.0 (environment variables)
- Flask-JWT-Extended 4.5.3 (JWT auth)
- Marshmallow 3.20.1 (data validation)

### Dockerfile
**Location**: `/workspaces/AppControlArmenia/Administracion/backend/Dockerfile`

**Key Features**:
- Base image: `python:3.11-slim` (lightweight)
- System dependencies: build-essential, gcc, libpq-dev
- Python optimization: PYTHONUNBUFFERED, PYTHONDONTWRITEBYTECODE
- Minimal layer count for fast builds
- Gunicorn with 1 worker (Cloud Run managed)
- Port 8080 (Cloud Run default)

---

## 🔑 Secrets & IAM

### Secret: APP_DB_PASSWORD
**Location**: Google Cloud Secret Manager
**Value**: Database password for `app_user`
**Access**:
- Cloud Build SA: `service-382485340614@gcp-sa-cloudbuild.iam.gserviceaccount.com`
- Cloud Run SA: `382485340614-compute@developer.gserviceaccount.com`

### Cloud Run IAM Bindings
```bash
# Public access (allUsers can invoke)
roles/run.invoker → allUsers

# Service can read secrets
roles/secretmanager.secretAccessor → 
  - Cloud Build SA
  - Cloud Run SA
```

---

## ✅ Service Verification

### 1. Health Check
```bash
curl https://appcontrolarmenia-XXXXX-uc.a.run.app/
```
**Expected**: HTTP 200 with status "OK"

### 2. Database Connection
```bash
curl https://appcontrolarmenia-XXXXX-uc.a.run.app/health
```
**Expected**: HTTP 200 with `"database": "connected"`

### 3. Register Fichaje
```bash
curl -X POST https://appcontrolarmenia-XXXXX-uc.a.run.app/api/fichajes \
  -H "Content-Type: application/json" \
  -d '{"empleado_id":"EMP001","tipo_fichaje":"ENTRADA","latitud":10.39,"longitud":-61.16}'
```
**Expected**: HTTP 201 with `"success": true`

### 4. Retrieve Fichajes
```bash
curl https://appcontrolarmenia-XXXXX-uc.a.run.app/api/fichajes/EMP001
```
**Expected**: HTTP 200 with array of fichajes

---

## 📊 Monitoring & Logs

### View Cloud Build Status
```bash
# List recent builds
gcloud builds list --limit=10

# View specific build logs
gcloud builds log BUILD_ID --stream

# Watch build in real-time
gcloud builds log BUILD_ID --stream --tail=20
```

### View Cloud Run Logs
```bash
# Recent logs (last 50 entries)
gcloud run logs read appcontrolarmenia --region=us-central1 --limit=50

# Stream logs (follow mode)
gcloud run logs read appcontrolarmenia --region=us-central1 --stream

# Logs from specific time
gcloud run logs read appcontrolarmenia --region=us-central1 --since=1h
```

### Cloud Console Links
- **Cloud Build**: https://console.cloud.google.com/cloud-build/builds?project=controldeobranexus
- **Cloud Run**: https://console.cloud.google.com/run?project=controldeobranexus
- **Secret Manager**: https://console.cloud.google.com/security/secret-manager?project=controldeobranexus
- **Cloud SQL**: https://console.cloud.google.com/sql/instances?project=controldeobranexus

---

## 🔄 Deployment Workflow

### Deploy a Change
1. Edit code in your local machine or dev container
2. Commit: `git add . && git commit -m "feature: description"`
3. Push: `git push origin main`
4. Cloud Build automatically triggers
5. Build runs ~3-5 minutes
6. Service updates at same URL
7. Zero downtime deployment ✅

### Force Rebuild (no code changes)
```bash
git commit --allow-empty -m "trigger: rebuild"
git push origin main
```

### Manual Build Trigger
```bash
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_DB_PASS_SECRET_NAME=APP_DB_PASSWORD
```

---

## 🛠️ Troubleshooting

### Build Fails: "Module not found"
**Cause**: Missing dependency in requirements.txt
**Fix**: Add to requirements.txt, commit, push (auto-triggers rebuild)

### Build Fails: "Permission denied on secret"
**Cause**: Cloud Run SA doesn't have access to secret
**Fix**: 
```bash
PROJECT_NUMBER=$(gcloud projects describe controldeobranexus --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding APP_DB_PASSWORD \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Service returns 503
**Cause**: Database not reachable
**Fix**: 
```bash
# Check database is running
gcloud sql instances describe controldeobranexus

# Verify Cloud SQL connection
gcloud run logs read appcontrolarmenia --region=us-central1 --limit=20 | grep -i "error\|connection"
```

### Service is slow
**Current Config**: 1 CPU, 512Mi memory
**Increase**:
```bash
gcloud run deploy appcontrolarmenia \
  --region=us-central1 \
  --memory=1Gi \
  --cpu=2
```

---

## 📝 Next Steps

1. **Monitor deployments**: Watch https://console.cloud.google.com/run
2. **Add more endpoints**: Edit `main.py` → push to main
3. **Scale if needed**: Adjust memory/CPU in Cloud Run
4. **Add authentication**: Implement JWT or OAuth in Flask app
5. **Set up custom domain**: Configure Cloud Run custom domain
6. **Add load balancer**: Use Cloud Load Balancer if multi-region needed

---

## 🎯 Success Indicators

- ✅ Service URL is publicly accessible
- ✅ Health check returns 200 OK
- ✅ Database health check shows connected
- ✅ Can create fichajes (POST)
- ✅ Can retrieve fichajes (GET)
- ✅ Every git push triggers build
- ✅ Deployments complete without manual intervention

**Your CI/CD pipeline is now PRODUCTION READY!** 🚀
