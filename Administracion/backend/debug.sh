#!/bin/bash

# Script para debugging y pruebas en Cloud Run
# Uso: bash debug.sh

SERVICE_NAME="fichaje-backend"

echo "🔍 Cloud Run Debugging & Testing"
echo "=============================="
echo ""

read -p "Ingresa el nombre del servicio (default: fichaje-backend): " SERVICE_INPUT
SERVICE_NAME=${SERVICE_INPUT:-fichaje-backend}

read -p "Ingresa la REGION (default: us-central1): " REGION
REGION=${REGION:-us-central1}

read -p "Ingresa tu PROJECT_ID: " PROJECT_ID

echo ""
echo "1️⃣ Ver configuración del servicio:"
gcloud run services describe $SERVICE_NAME --region=$REGION --format=yaml --project=$PROJECT_ID
echo ""

echo "2️⃣ Ver últimos 50 logs:"
gcloud run logs read $SERVICE_NAME --limit 50 --region=$REGION --project=$PROJECT_ID
echo ""

echo "3️⃣ Ver métricas:"
gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format='value(status)'
echo ""

echo "4️⃣ Obtener URL del servicio:"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)' --project=$PROJECT_ID)
echo "URL: $SERVICE_URL"
echo ""

read -p "¿Deseas probar la API? (y/n): " TEST_API
if [ "$TEST_API" = "y" ]; then
  echo ""
  echo "Probando endpoints..."
  echo ""
  
  echo "5️⃣ Health Check:"
  curl -s -X GET "$SERVICE_URL/" | python3 -m json.tool
  echo ""
  
  echo "6️⃣ Health endpoint:"
  curl -s -X GET "$SERVICE_URL/health" | python3 -m json.tool
  echo ""
  
  echo "7️⃣ Test de registrar fichaje:"
  curl -s -X POST "$SERVICE_URL/api/fichajes" \
    -H "Content-Type: application/json" \
    -d '{
      "empleado_id": "EMP-TEST",
      "tipo_fichaje": "ENTRADA",
      "actividad": "Test"
    }' | python3 -m json.tool
fi

echo ""
echo "✅ Debugging completado"
