# Backend Fichaje - Cloud Run Deployment Guide

Sistema de fichaje con backend en Flask, desplegable en Google Cloud Run con Cloud SQL.

## Tabla de Contenidos

- [Requisitos](#requisitos)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Configuración Local](#configuración-local)
- [Despliegue en Cloud Run](#despliegue-en-cloud-run)
- [API Endpoints](#api-endpoints)
- [Variables de Entorno](#variables-de-entorno)
- [Troubleshooting](#troubleshooting)

---

## Requisitos

### Para Desarrollo Local
- Python 3.11+
- pip
- PostgreSQL (local o en Cloud SQL)
- Docker (para probar la imagen)

### Para Cloud Run
- Cuenta de Google Cloud Platform (GCP)
- Proyecto en GCP
- Cloud SQL instance (PostgreSQL)
- Cloud Build habilitado
- Container Registry habilitado
- Permisos de Cloud Run Admin

---

## Estructura del Proyecto

```
backend/
├── main.py                 # Aplicación Flask principal
├── requirements.txt        # Dependencias Python
├── Dockerfile             # Configuración Docker para Cloud Run
├── cloudbuild.yaml        # Configuración de CI/CD en Cloud Build
├── .env.example           # Variables de entorno de ejemplo
├── .dockerignore           # Archivos a ignorar en la imagen Docker
└── README.md              # Este archivo
```

---

## Configuración Local

### 1. Clonar o descargar el proyecto

```bash
cd Administracion/backend
```

### 2. Crear entorno virtual

```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

Copiar `.env.example` a `.env`:

```bash
cp .env.example .env
```

Editar `.env` con tus valores reales:

```env
PORT=8080
INSTANCE_CONNECTION_NAME=tu-proyecto:us-central1:postgresql-instance
DB_USER=postgres
DB_PASS=tu-contraseña-segura
DB_NAME=fichajes_db
DB_PORT=5432
USE_PRIVATE_IP=false
FLASK_ENV=development
```

### 5. Ejecutar localmente

```bash
python main.py
```

La aplicación estará disponible en `http://localhost:8080`

Verificar salud del backend:
```bash
curl http://localhost:8080/
curl http://localhost:8080/health
```

---

## Despliegue en Cloud Run

### Opción 1: Despliegue Manual con gcloud CLI

#### Paso 1: Configurar gcloud

```bash
gcloud init
gcloud config set project TU_PROJECT_ID
```

#### Paso 2: Crear instancia de Cloud SQL (si no existe)

```bash
gcloud sql instances create postgresql-instance \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1
```

#### Paso 3: Crear usuario y base de datos

```bash
gcloud sql users create postgres --instance=postgresql-instance --password
gcloud sql databases create fichajes_db --instance=postgresql-instance
```

Obtener el INSTANCE_CONNECTION_NAME:

```bash
gcloud sql instances describe postgresql-instance --format='value(connectionName)'
```

#### Paso 4: Desplegar a Cloud Run

```bash
gcloud run deploy fichaje-backend \
  --source . \
  --region us-central1 \
  --platform managed \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60 \
  --allow-unauthenticated \
  --set-env-vars="INSTANCE_CONNECTION_NAME=PROJECT_ID:REGION:INSTANCE_NAME,DB_USER=postgres,DB_PASS=PASSWORD,DB_NAME=fichajes_db,USE_PRIVATE_IP=false"
```

### Opción 2: Despliegue Automático con Cloud Build (Recomendado)

#### Paso 1: Conectar repositorio a Cloud Build

1. Ir a Cloud Console > Cloud Build > Repositorios conectados
2. Conectar tu repositorio de GitHub
3. Seleccionar "AppControlArmenia"

#### Paso 2: Crear trigger de Cloud Build

1. Ir a Cloud Build > Triggers
2. Click en "Create Trigger"
3. Configurar:
   - **Name**: fichaje-backend-deploy
   - **Repository**: AppControlArmenia
   - **Branch**: ^main$
   - **Build configuration**: Cloud Build configuration file
   - **Location**: Administracion/backend/cloudbuild.yaml

#### Paso 3: Configurar variables de sustitución

En la configuración del trigger, añadir bajo "Substitution variables":

```
_INSTANCE_CONNECTION_NAME = tu-proyecto:us-central1:postgresql-instance
_DB_USER = postgres
_DB_PASS = tu-contraseña-segura
_DB_NAME = fichajes_db
_USE_PRIVATE_IP = false
```

#### Paso 4: Habilitar acceso a Cloud SQL

En el archivo `cloudbuild.yaml`, la instancia de Cloud Run necesita acceso a Cloud SQL. Esto se configura automáticamente con la variable `INSTANCE_CONNECTION_NAME` en los set-env-vars.

#### Paso 5: Hacer push a main

```bash
git add .
git commit -m "Deploy backend to Cloud Run"
git push origin main
```

Cloud Build se ejecutará automáticamente.

---

## API Endpoints

### Health Check

```bash
GET /
GET /health
```

**Response (200):**
```json
{
  "status": "OK",
  "message": "Backend funcionando correctamente",
  "timestamp": "2024-11-16T10:30:00.000000",
  "version": "1.0.0"
}
```

### Registrar Fichaje

```bash
POST /api/fichajes
Content-Type: application/json

{
  "empleado_id": "EMP-987",
  "tipo_fichaje": "ENTRADA",
  "actividad": "Obra Consorcio Principal",
  "latitud": 4.533000,
  "longitud": -75.675000
}
```

**Response (201):**
```json
{
  "success": true,
  "mensaje": "Fichaje registrado exitosamente",
  "fichaje_id": 1,
  "timestamp": "2024-11-16T10:30:00.000000"
}
```

### Obtener Fichajes de Empleado

```bash
GET /api/fichajes/{empleado_id}
```

**Response (200):**
```json
{
  "fichajes": [
    {
      "id": 1,
      "empleado_id": "EMP-987",
      "tipo": "ENTRADA",
      "actividad": "Obra Consorcio Principal",
      "latitud": 4.533000,
      "longitud": -75.675000,
      "created_at": "2024-11-16T10:30:00.000000"
    }
  ],
  "total": 1
}
```

---

## Variables de Entorno

| Variable | Descripción | Ejemplo | Requerida |
|----------|-------------|---------|-----------|
| `PORT` | Puerto de escucha | `8080` | No (default: 8080) |
| `INSTANCE_CONNECTION_NAME` | Nombre de conexión Cloud SQL | `project:region:instance` | **Sí** |
| `DB_USER` | Usuario de BD | `postgres` | **Sí** |
| `DB_PASS` | Contraseña de BD | `secure_password` | **Sí** |
| `DB_NAME` | Nombre de base de datos | `fichajes_db` | No (default: fichajes_db) |
| `DB_PORT` | Puerto PostgreSQL | `5432` | No (default: 5432) |
| `USE_PRIVATE_IP` | Usar IP privada de Cloud SQL | `false` o `true` | No (default: false) |
| `FLASK_ENV` | Entorno Flask | `production` o `development` | No (default: production) |

---

## Troubleshooting

### Error: "No module named 'google.cloud.sql.connector'"

**Solución**: Instalar dependencias correctamente:
```bash
pip install cloud-sql-python-connector[pg8000]
```

### Error: "Connection refused" en Cloud Run

**Soluciones**:
1. Verificar que `INSTANCE_CONNECTION_NAME` es correcto:
   ```bash
   gcloud sql instances describe postgresql-instance --format='value(connectionName)'
   ```
2. Verificar que el usuario y contraseña son correctos
3. Comprobar que Cloud SQL instance está corriendo:
   ```bash
   gcloud sql instances list
   ```

### Error: "BUILD FAILURE" en Cloud Build

1. Verificar logs:
   ```bash
   gcloud builds log --stream
   ```
2. Verificar que `cloudbuild.yaml` existe en la ruta correcta
3. Verificar permisos en el trigger de Cloud Build

### Error: "504 Gateway Timeout" desde el cliente

**Soluciones**:
1. Aumentar timeout en Cloud Run:
   ```bash
   gcloud run deploy fichaje-backend --timeout 60
   ```
2. Verificar que la BD responde rápidamente
3. Revisar logs: `gcloud run logs read fichaje-backend --limit 50`

### Verificar logs en Cloud Run

```bash
gcloud run logs read fichaje-backend --limit 50 --region us-central1
```

### Probar API desplegada

```bash
curl https://fichaje-backend-xxxxx-uc.a.run.app/
curl -X POST https://fichaje-backend-xxxxx-uc.a.run.app/api/fichajes \
  -H "Content-Type: application/json" \
  -d '{"empleado_id":"EMP-001","tipo_fichaje":"ENTRADA","actividad":"Obra"}'
```

---

## Mejores Prácticas para Cloud Run

1. **Usar Cloud SQL Connector** (ya implementado) - Más seguro que psycopg2 directo
2. **Escalar a 0** - Cloud Run cobra solo por lo que uses
3. **Health checks** - Ya implementados en `/health`
4. **Logging estructurado** - Implementado con logging module
5. **CORS habilitado** - Para aceitar solicitudes del frontend
6. **Manejo de errores** - Endpoints con errores apropiados

---

## Monitoreo

Visualizar métricas en Cloud Console:
```bash
gcloud run describe fichaje-backend --region us-central1
```

---

## Contacto y Soporte

Para problemas o preguntas, contacta al equipo de desarrollo.
