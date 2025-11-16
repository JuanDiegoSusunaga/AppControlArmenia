# Especificaciones Técnicas - Backend Fichaje

## Arquitectura

```
┌─────────────────────────────────────────┐
│         Cliente (App Móvil)              │
│       React Native / Expo                │
└──────────────────┬──────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────┐
│        Cloud Run Service                 │
│  - Flask Application                    │
│  - Python 3.11-slim                     │
│  - Gunicorn (1 worker)                  │
│  - Cloud SQL Connector                  │
└──────────────────┬──────────────────────┘
                   │ IAM Service Account
                   ▼
┌─────────────────────────────────────────┐
│         Google Cloud SQL                 │
│      PostgreSQL 15                       │
│    (Conexión certificada)               │
└─────────────────────────────────────────┘
```

## Stack Tecnológico

| Componente | Versión | Propósito |
|-----------|---------|----------|
| Python | 3.11 | Runtime |
| Flask | 3.0.0 | Framework Web |
| Gunicorn | 21.2.0 | WSGI Server |
| cloud-sql-python-connector | 1.6.1 | Conexión segura a Cloud SQL |
| pg8000 | 1.30.5 | Driver PostgreSQL puro Python |
| flask-cors | 4.0.0 | Cross-Origin Resource Sharing |
| python-dotenv | 1.0.0 | Variables de entorno |

## Cloud Run Specifications

| Parámetro | Valor | Justificación |
|-----------|-------|---------------|
| Memory | 512 MB | Suficiente para Flask + Cloud SQL Connector |
| CPU | 1 | Recomendado para aplicaciones Python sincrónicas |
| Timeout | 60s | Máximo para Cloud Run |
| Min instances | 0 | Escalado automático desde 0 |
| Concurrency | Default (80) | Manejada por workers de Gunicorn |
| Workers | 1 | Cloud Run recomienda 1 worker por CPU |

## Seguridad

### Authentication
- **Cloud SQL Connector**: Usa IAM Service Account
- **SSL/TLS**: Automático entre Cloud Run y Cloud SQL
- **Certificados**: Manejados automáticamente por Google Cloud

### Network
- Cloud Run: Endpoint público con HTTPS automático
- Cloud SQL: IP privada (recomendado con VPC Connector)
- Conexión: Certificada y encriptada

### Secretos
- **Variables de entorno**: Configuradas en Cloud Run
- **Credenciales DB**: No se hardcodean en código
- **Secrets Manager**: Recomendado para producción

## Endpoints API

| Método | Ruta | Descripción | Status |
|--------|------|-------------|--------|
| GET | / | Health check | 200/503 |
| GET | /health | Health check + DB | 200/503 |
| POST | /api/fichajes | Registrar fichaje | 201/400/500 |
| GET | /api/fichajes/{id} | Obtener fichajes | 200/500 |

## Base de Datos

### Schema
```sql
CREATE TABLE fichajes (
    id SERIAL PRIMARY KEY,
    empleado_id VARCHAR(50) NOT NULL,
    tipo VARCHAR(20) NOT NULL,  -- ENTRADA o SALIDA
    actividad TEXT,
    latitud FLOAT,
    longitud FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Índices (Recomendados)
```sql
CREATE INDEX idx_empleado_id ON fichajes(empleado_id);
CREATE INDEX idx_created_at ON fichajes(created_at DESC);
```

## Performance

### Optimizaciones Implementadas
1. **Cloud SQL Connector** - Conexiones IAM, sin credenciales en texto
2. **Gunicorn sync worker** - Eficiente para I/O-bound operations
3. **Connection pooling** - Manejado automáticamente por connector
4. **Logging estructurado** - Para debugging rápido
5. **Health checks** - Para Cloud Run autoscaling

### Benchmarks esperados
- Health check: < 50ms
- Registrar fichaje: 100-300ms (dependiendo de BD)
- Obtener fichajes: 200-500ms

## Monitoreo

### Métricas en Cloud Console
- Invocaciones por segundo
- Latencia P50/P95/P99
- Error rate
- Memoria utilizada
- CPU utilizada

### Logs
- Structurado con Python logging module
- Accesible vía `gcloud run logs read`
- Integración con Cloud Logging

### Alertas (Recomendadas)
- Error rate > 5%
- Latencia P99 > 30s
- Out of memory errors

## Escalado

### Automático
- Min instances: 0 (costo cero cuando no se usa)
- Max instances: 100 (configurable)
- Target CPU: 60% (default)

### Manual
```bash
gcloud run deploy --max-instances 10
gcloud run deploy --min-instances 1  # Para evitar cold starts
```

## CI/CD Pipeline

```
GitHub Push
    ↓
Cloud Build Trigger
    ↓
Build Image (Dockerfile)
    ↓
Push a Container Registry
    ↓
Deploy a Cloud Run
    ↓
Health Check
    ↓
Service Available
```

### Tiempo de despliegue
- Build: 2-5 minutos
- Push: < 1 minuto
- Deploy: < 1 minuto
- **Total: 5-10 minutos**

## Recuperación ante Errores

### Connection Lost
- Cloud SQL Connector: Reintento automático
- Cloud Run: Reinicia automáticamente si falla
- Timeout: 60 segundos

### Database Errors
- Connection errors: Logged y retorna 500
- SQL errors: Logged y retorna 500
- Validation errors: Retorna 400

### Memory Pressure
- Cloud Run: Límite de 512 MB
- Si se excede: Instancia se reinicia
- Implementar caching si es necesario

## Configuración de Producción

```bash
# Cloud Run
gcloud run deploy fichaje-backend \
  --region us-central1 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60 \
  --max-instances 100 \
  --min-instances 0 \
  --vpc-connector projects/PROJECT/locations/us-central1/connectors/vpc-connector

# Cloud SQL
gcloud sql instances create postgresql-instance \
  --database-version POSTGRES_15 \
  --tier db-custom-2-7680 \
  --region us-central1 \
  --enable-bin-log \
  --backup

# Enable CloudSQL Admin API
gcloud services enable sqladmin.googleapis.com
```

## Referencias

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Python Connector](https://github.com/GoogleCloudPlatform/cloud-sql-python-connector)
- [Flask Production Deployment](https://flask.palletsprojects.com/deploying/)
- [Gunicorn Configuration](https://docs.gunicorn.org/)
