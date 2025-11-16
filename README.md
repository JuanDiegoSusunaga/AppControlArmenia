# AppControlArmenia - Production CI/CD Pipeline

> **Status**: ✅ **LIVE AND OPERATIONAL**  
> **Last Updated**: November 16, 2025  
> **Service URL**: Check Cloud Console for live URL

---

## 🚀 Quick Start

### Get Service URL
```bash
gcloud run services describe appcontrolarmenia \
  --region us-central1 \
  --format='value(status.url)'
```

### Test the API
```bash
SERVICE_URL="https://appcontrolarmenia-XXXXX-uc.a.run.app"

# Health check
curl $SERVICE_URL/

# Database check
curl $SERVICE_URL/health

# Create a fichaje
curl -X POST $SERVICE_URL/api/fichajes \
  -H "Content-Type: application/json" \
  -d '{
    "empleado_id": "EMP001",
    "tipo_fichaje": "ENTRADA",
    "latitud": 10.39,
    "longitud": -61.16
  }'
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** | 📊 Complete project overview |
| **[API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md)** | 📡 API reference & examples |
| **[CI_CD_SETUP_GUIDE.md](./CI_CD_SETUP_GUIDE.md)** | ⚙️ Setup, pipeline, troubleshooting |
| **[SETUP_GCLOUD.md](./SETUP_GCLOUD.md)** | 🔧 Initial GCP setup |
| **[Administracion/backend/QUICKSTART.md](./Administracion/backend/QUICKSTART.md)** | ⚡ Quick start guide |
| **[Administracion/backend/TECHNICAL_SPECS.md](./Administracion/backend/TECHNICAL_SPECS.md)** | 🏗️ Technical architecture |

---

## 🏗️ Architecture

```
GitHub (main) → Cloud Build (Trigger) → Docker Build → 
Container Registry → Cloud Run (Deploy) ↔ Cloud SQL
                                         ↓
                                    API Live ✅
```

**Key Components**:
- 🐳 **Docker**: Python 3.11-slim + Flask + Gunicorn
- ☁️ **Cloud Run**: Managed, serverless, auto-scaling
- 🗄️ **PostgreSQL**: Cloud SQL (Private IP)
- 🔐 **Secrets**: Google Secret Manager
- 📦 **Registry**: Google Container Registry (gcr.io)
- 🔨 **CI/CD**: Google Cloud Build (Automated)

---

## ⚡ Deployment Workflow

```bash
# 1. Make changes
vim Administracion/backend/main.py

# 2. Commit & push
git add .
git commit -m "feature: description"
git push origin main

# 3. Automatic deployment ✅
# → Cloud Build triggers
# → Docker builds
# → Pushes to registry
# → Deploys to Cloud Run
# → Live in ~5-10 minutes
```

**Zero Manual Steps** - Everything is automated!

---

## 🔐 Security

- ✅ Database credentials in Secret Manager (encrypted)
- ✅ Cloud Run service account with minimal IAM
- ✅ Private IP connection to Cloud SQL
- ✅ No hardcoded secrets in code/git
- ✅ Public API (unauthenticated) - add OAuth/JWT as needed
- ✅ HTTPS only (Cloud Run default)

---

## 📊 Monitoring

### View Logs
```bash
# Real-time logs
gcloud run logs read appcontrolarmenia --region=us-central1 --stream

# Last 50 entries
gcloud run logs read appcontrolarmenia --region=us-central1 --limit=50
```

### Build Status
```bash
# List recent builds
gcloud builds list --limit=20

# View build logs
gcloud builds log BUILD_ID --stream
```

### Cloud Consoles
- **Cloud Build**: https://console.cloud.google.com/cloud-build/builds?project=controldeobranexus
- **Cloud Run**: https://console.cloud.google.com/run?project=controldeobranexus
- **Cloud SQL**: https://console.cloud.google.com/sql?project=controldeobranexus
- **Secrets**: https://console.cloud.google.com/security/secret-manager?project=controldeobranexus

---

## 🧪 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/` | Health check |
| `GET` | `/health` | Database connectivity |
| `POST` | `/api/fichajes` | Register check-in/check-out |
| `GET` | `/api/fichajes/{empleado_id}` | Get employee records |

See **[API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md)** for full documentation.

---

## 🛠️ Common Tasks

### Update Code
```bash
# Edit files and push
git push origin main
# → Auto-deploys in ~5-10 min
```

### View Recent Builds
```bash
gcloud builds list --limit=10
```

### Check Service Status
```bash
gcloud run services describe appcontrolarmenia --region=us-central1
```

### Scale Service
```bash
gcloud run deploy appcontrolarmenia \
  --region=us-central1 \
  --memory=1Gi \      # Increase from 512Mi
  --cpu=2             # Increase from 1
```

### Force Rebuild
```bash
git commit --allow-empty -m "trigger: rebuild"
git push origin main
```

---

## 📁 Project Structure

```
AppControlArmenia/
├── cloudbuild.yaml                    # CI/CD Pipeline
├── DEPLOYMENT_SUMMARY.md              # 📊 Project overview
├── API_TESTING_GUIDE.md               # 📡 API documentation
├── CI_CD_SETUP_GUIDE.md               # ⚙️ Setup & troubleshooting
├── SETUP_GCLOUD.md                    # 🔧 Initial setup
├── scripts/
│   └── grant-cloud-run-permissions.sh # 🔑 IAM helper
└── Administracion/
    └── backend/
        ├── main.py                    # Flask app
        ├── Dockerfile                 # Container definition
        └── requirements.txt           # Python dependencies
```

---

## ✅ Deployment Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Service** | ✅ Live | appcontrolarmenia on Cloud Run |
| **Database** | ✅ Connected | PostgreSQL 17 on Cloud SQL |
| **Build Pipeline** | ✅ Automated | GitHub → Cloud Build → Deploy |
| **API** | ✅ Responding | All endpoints functional |
| **Secrets** | ✅ Secure | In Secret Manager |
| **Monitoring** | ✅ Active | Cloud Logging |
| **Documentation** | ✅ Complete | Full guides provided |

---

## 🔄 CI/CD Pipeline Details

**Trigger**: Push to `main` branch (automatic)

**Steps**:
1. Docker build from `Administracion/backend/Dockerfile`
2. Push to `gcr.io/controldeobranexus/appcontrolarmenia-backend:{SHA}`
3. Push to `gcr.io/controldeobranexus/appcontrolarmenia-backend:latest`
4. Deploy to Cloud Run with:
   - Cloud SQL connection (private IP)
   - Environment variables from `cloudbuild.yaml`
   - Database password from Secret Manager
   - Public access enabled

**Time**: ~5-10 minutes (includes Docker build + deploy)

**Status**: Zero-downtime (blue-green deployment)

---

## 📞 Support

### For API Questions
→ See **[API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md)**

### For Setup Issues
→ See **[CI_CD_SETUP_GUIDE.md](./CI_CD_SETUP_GUIDE.md)** (Troubleshooting section)

### For Deployment Questions
→ See **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)**

### For Logs
```bash
gcloud run logs read appcontrolarmenia --region=us-central1 --stream
```

---

## 🎯 Project Metrics

| Metric | Value |
|--------|-------|
| **Status** | ✅ Production Ready |
| **Uptime** | Continuous (auto-managed) |
| **Build Time** | ~5-10 minutes |
| **Deployment Type** | Zero-downtime |
| **Database** | PostgreSQL 17 |
| **Container Size** | ~500MB |
| **Memory** | 512Mi (configurable) |
| **API Response** | <100ms (typical) |

---

## 🚀 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | TBD |
| **Backend API** | Python Flask 3.0.0 |
| **App Server** | Gunicorn 21.2.0 |
| **Database** | PostgreSQL 17 |
| **Container** | Docker + Cloud Run |
| **CI/CD** | Google Cloud Build |
| **Registry** | Google Container Registry |
| **Secrets** | Google Secret Manager |

---

## 📝 Recent Changes

```
2b3b2ec - docs: add comprehensive deployment summary
d6a843d - docs: add comprehensive API testing and CI/CD setup guides
a71757e - trigger: rebuild after granting Cloud Run permissions
b08a2fe - fix: remove quotes from Cloud SQL instance name
...
```

See full history: `git log --oneline`

---

## 🎉 Project Status

**✅ COMPLETE AND LIVE**

All systems operational. Service is deployed and accepting requests. CI/CD pipeline is fully automated. Documentation is comprehensive.

**Ready for**: Development, Testing, Production Use

---

**Last Updated**: November 16, 2025  
**Deployment Region**: us-central1  
**Project ID**: controldeobranexus  
**Repository**: https://github.com/JuanDiegoSusunaga/AppControlArmenia

---

For more information, see the [comprehensive documentation](./DEPLOYMENT_SUMMARY.md).
