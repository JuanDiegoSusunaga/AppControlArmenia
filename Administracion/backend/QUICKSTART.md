# 🚀 Quick Start - Despliegue en Cloud Run

## En 5 minutos

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/JuanDiegoSusunaga/AppControlArmenia.git
cd AppControlArmenia/Administracion/backend
```

### Paso 2: Configurar credenciales de GCP

```bash
gcloud init
gcloud auth login
gcloud config set project TU_PROJECT_ID
```

### Paso 3: Crear instancia Cloud SQL (si no existe)

```bash
# Crear instancia
gcloud sql instances create postgresql-instance \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Crear BD
gcloud sql databases create fichajes_db --instance=postgresql-instance

# Crear usuario
gcloud sql users create postgres --instance=postgresql-instance --password
# (Seguir prompts para ingresar contraseña)

# Obtener Connection Name (IMPORTANTE)
gcloud sql instances describe postgresql-instance \
  --format='value(connectionName)'
# Copiar este valor: PROJECT_ID:us-central1:postgresql-instance
```

### Paso 4: Ejecutar script de despliegue

```bash
bash deploy.sh
```

Cuando solicite:
- **PROJECT_ID**: Tu ID de GCP
- **REGION**: us-central1 (Enter)
- **SERVICE_NAME**: fichaje-backend (Enter)
- **INSTANCE_CONNECTION_NAME**: Pegar el valor del paso anterior
- **DB_USER**: postgres
- **DB_PASS**: La contraseña que creaste
- **DB_NAME**: fichajes_db (Enter)
- **USE_PRIVATE_IP**: false (Enter)

### Paso 5: ✅ Listo

Tu backend estará disponible en: `https://fichaje-backend-xxxxx-uc.a.run.app`

---

## Alternativa: Despliegue Manual

```bash
gcloud run deploy fichaje-backend \
  --source=. \
  --region=us-central1 \
  --memory=512Mi \
  --cpu=1 \
  --timeout=60 \
  --allow-unauthenticated \
  --set-env-vars="INSTANCE_CONNECTION_NAME=YOUR_CONNECTION_NAME,DB_USER=postgres,DB_PASS=YOUR_PASSWORD,DB_NAME=fichajes_db"
```

---

## Probar la API

```bash
# Health check
curl https://fichaje-backend-xxxxx-uc.a.run.app/

# Registrar fichaje
curl -X POST https://fichaje-backend-xxxxx-uc.a.run.app/api/fichajes \
  -H "Content-Type: application/json" \
  -d '{
    "empleado_id": "EMP-001",
    "tipo_fichaje": "ENTRADA",
    "actividad": "Obra",
    "latitud": 4.533,
    "longitud": -75.675
  }'

# Ver logs
gcloud run logs read fichaje-backend --limit 50
```

---

## Despliegue Automático (CI/CD)

1. Conectar repositorio a Cloud Build: https://console.cloud.google.com/cloud-build/repositories
2. Crear trigger en Cloud Build
3. Configurar variables de sustitución:
   ```
   _INSTANCE_CONNECTION_NAME = tu-proyecto:us-central1:postgresql-instance
   _DB_USER = postgres
   _DB_PASS = tu-contraseña
   _DB_NAME = fichajes_db
   ```
4. Hacer push a main: `git push origin main`
5. Cloud Build se ejecutará automáticamente

---

## Documentación Completa

- 📖 **DEPLOYMENT_GUIDE.md** - Guía detallada
- 🔧 **TECHNICAL_SPECS.md** - Especificaciones técnicas
- ✅ **VERIFICATION_CHECKLIST.md** - Verificación de configuración

---

## Troubleshooting Rápido

### Error: "Connection refused"
```bash
# Verificar que Cloud SQL instance está activa
gcloud sql instances list

# Verificar credenciales
gcloud sql users list --instance=postgresql-instance
```

### Error: "Cloud SQL Connector error"
```bash
# Verificar que INSTANCE_CONNECTION_NAME es correcto
gcloud sql instances describe postgresql-instance --format='value(connectionName)'

# Actualizar variable en Cloud Run
gcloud run deploy fichaje-backend \
  --set-env-vars=INSTANCE_CONNECTION_NAME=VALOR_CORRECTO
```

### Ver logs
```bash
gcloud run logs read fichaje-backend --limit 50 --follow
```

---

**¿Necesitas ayuda?** Ver DEPLOYMENT_GUIDE.md para troubleshooting detallado.
