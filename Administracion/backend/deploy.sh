#!/bin/bash

# Script interactivo para desplegar a Cloud Run
# Uso: bash deploy.sh

echo "🚀 Cloud Run Deployment Script"
echo "=============================="
echo ""

# Solicitar valores
read -p "Ingresa tu PROJECT_ID: " PROJECT_ID
read -p "Ingresa la REGION (default: us-central1): " REGION
REGION=${REGION:-us-central1}

read -p "Ingresa el nombre del servicio (default: fichaje-backend): " SERVICE_NAME
SERVICE_NAME=${SERVICE_NAME:-fichaje-backend}

read -p "Ingresa INSTANCE_CONNECTION_NAME (PROJECT_ID:REGION:INSTANCE_NAME): " INSTANCE_CONNECTION_NAME
read -sp "Ingresa DB_USER: " DB_USER
echo ""
read -sp "Ingresa DB_PASS: " DB_PASS
echo ""
read -p "Ingresa DB_NAME (default: fichajes_db): " DB_NAME
DB_NAME=${DB_NAME:-fichajes_db}

read -p "Usar IP privada (true/false, default: false): " USE_PRIVATE_IP
USE_PRIVATE_IP=${USE_PRIVATE_IP:-false}

echo ""
echo "📋 Configuración:"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service: $SERVICE_NAME"
echo "  Instance Connection: $INSTANCE_CONNECTION_NAME"
echo "  Database: $DB_NAME"
echo "  Private IP: $USE_PRIVATE_IP"
echo ""

read -p "¿Continuar con el despliegue? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
  echo "❌ Despliegue cancelado"
  exit 0
fi

echo ""
echo "⏳ Desplegando a Cloud Run..."
echo ""

# Ejecutar despliegue
gcloud run deploy $SERVICE_NAME \
  --project=$PROJECT_ID \
  --source=. \
  --region=$REGION \
  --platform=managed \
  --memory=512Mi \
  --cpu=1 \
  --timeout=60 \
  --allow-unauthenticated \
  --set-env-vars="INSTANCE_CONNECTION_NAME=$INSTANCE_CONNECTION_NAME,DB_USER=$DB_USER,DB_PASS=$DB_PASS,DB_NAME=$DB_NAME,USE_PRIVATE_IP=$USE_PRIVATE_IP"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Despliegue completado exitosamente"
  echo ""
  SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)' --project=$PROJECT_ID)
  echo "📍 URL del servicio: $SERVICE_URL"
  echo ""
  echo "Próximos pasos:"
  echo "1. Probar health check: curl $SERVICE_URL/"
  echo "2. Registrar fichaje: curl -X POST $SERVICE_URL/api/fichajes -H 'Content-Type: application/json' -d '{\"empleado_id\":\"EMP-001\",\"tipo_fichaje\":\"ENTRADA\"}'"
  echo "3. Ver logs: gcloud run logs read $SERVICE_NAME --limit 50 --region=$REGION"
else
  echo ""
  echo "❌ Error durante el despliegue"
  exit 1
fi
