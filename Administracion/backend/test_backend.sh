#!/bin/bash

# Script para probar el backend localmente
# Uso: bash test_backend.sh

BASE_URL="http://localhost:8080"

echo "🔍 Probando Backend Fichaje..."
echo "================================"

# Test 1: Health check
echo ""
echo "Test 1: Health Check (GET /)"
curl -s -X GET "$BASE_URL/" | python3 -m json.tool
echo ""

# Test 2: Health endpoint
echo "Test 2: Health Endpoint (GET /health)"
curl -s -X GET "$BASE_URL/health" | python3 -m json.tool
echo ""

# Test 3: Registrar fichaje ENTRADA
echo "Test 3: Registrar Fichaje ENTRADA (POST /api/fichajes)"
curl -s -X POST "$BASE_URL/api/fichajes" \
  -H "Content-Type: application/json" \
  -d '{
    "empleado_id": "EMP-001",
    "tipo_fichaje": "ENTRADA",
    "actividad": "Obra Consorcio Principal",
    "latitud": 4.533000,
    "longitud": -75.675000
  }' | python3 -m json.tool
echo ""

# Test 4: Registrar fichaje SALIDA
echo "Test 4: Registrar Fichaje SALIDA (POST /api/fichajes)"
curl -s -X POST "$BASE_URL/api/fichajes" \
  -H "Content-Type: application/json" \
  -d '{
    "empleado_id": "EMP-001",
    "tipo_fichaje": "SALIDA",
    "actividad": "Obra Consorcio Principal",
    "latitud": 4.533100,
    "longitud": -75.675100
  }' | python3 -m json.tool
echo ""

# Test 5: Obtener fichajes de empleado
echo "Test 5: Obtener Fichajes de Empleado (GET /api/fichajes/EMP-001)"
curl -s -X GET "$BASE_URL/api/fichajes/EMP-001" | python3 -m json.tool
echo ""

# Test 6: Error - Fichaje sin datos requeridos
echo "Test 6: Error - Fichaje sin tipo_fichaje (POST /api/fichajes)"
curl -s -X POST "$BASE_URL/api/fichajes" \
  -H "Content-Type: application/json" \
  -d '{
    "empleado_id": "EMP-002"
  }' | python3 -m json.tool
echo ""

echo "================================"
echo "✅ Pruebas completadas"
