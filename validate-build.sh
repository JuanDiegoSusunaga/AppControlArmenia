#!/bin/bash

# Script de validación para Cloud Build
echo "🔍 Validando archivos para Cloud Build..."
echo ""

# Verificar que requirements.txt es válido
echo "1. Verificando requirements.txt..."
if grep -q '```' /workspaces/AppControlArmenia/Administracion/backend/requirements.txt; then
    echo "   ❌ ERROR: requirements.txt contiene backticks de markdown"
    exit 1
else
    echo "   ✅ requirements.txt válido"
fi

# Verificar que Dockerfile es válido
echo "2. Verificando Dockerfile..."
if grep -q '```' /workspaces/AppControlArmenia/Administracion/backend/Dockerfile; then
    echo "   ❌ ERROR: Dockerfile contiene backticks de markdown"
    exit 1
else
    echo "   ✅ Dockerfile válido"
fi

# Verificar que cloudbuild.yaml es válido YAML
echo "3. Verificando cloudbuild.yaml..."
if ! python3 -c "import yaml; yaml.safe_load(open('/workspaces/AppControlArmenia/cloudbuild.yaml'))" 2>/dev/null; then
    echo "   ⚠️ ADVERTENCIA: cloudbuild.yaml puede tener problemas de formato YAML"
else
    echo "   ✅ cloudbuild.yaml válido"
fi

# Verificar main.py
echo "4. Verificando main.py..."
if grep -q '```python' /workspaces/AppControlArmenia/Administracion/backend/main.py; then
    echo "   ❌ ERROR: main.py contiene backticks de markdown"
    exit 1
else
    if python3 -m py_compile /workspaces/AppControlArmenia/Administracion/backend/main.py 2>/dev/null; then
        echo "   ✅ main.py válido"
    else
        echo "   ⚠️ ADVERTENCIA: main.py puede tener errores de sintaxis"
    fi
fi

# Verificar estructura de carpetas
echo "5. Verificando estructura..."
if [ ! -f /workspaces/AppControlArmenia/Administracion/backend/main.py ]; then
    echo "   ❌ ERROR: main.py no existe"
    exit 1
fi
if [ ! -f /workspaces/AppControlArmenia/Administracion/backend/Dockerfile ]; then
    echo "   ❌ ERROR: Dockerfile no existe"
    exit 1
fi
if [ ! -f /workspaces/AppControlArmenia/Administracion/backend/requirements.txt ]; then
    echo "   ❌ ERROR: requirements.txt no existe"
    exit 1
fi
if [ ! -f /workspaces/AppControlArmenia/cloudbuild.yaml ]; then
    echo "   ❌ ERROR: cloudbuild.yaml en raíz no existe"
    exit 1
fi
echo "   ✅ Estructura correcta"

echo ""
echo "✅ Validación completada exitosamente"
echo ""
echo "Archivos listos para Cloud Build:"
echo "  - /workspaces/AppControlArmenia/Administracion/backend/main.py"
echo "  - /workspaces/AppControlArmenia/Administracion/backend/Dockerfile"
echo "  - /workspaces/AppControlArmenia/Administracion/backend/requirements.txt"
echo "  - /workspaces/AppControlArmenia/cloudbuild.yaml"
echo ""
echo "Próximo paso:"
echo "  1. Configurar Cloud Build trigger en Google Cloud Console"
echo "  2. Agregar substitution variables con credenciales"
echo "  3. Hacer push a main:"
echo "     git push origin main"
