#!/bin/bash

# 🔒 Script de Verificación de Seguridad para EVA
# Uso: ./scripts/security-check.sh

echo "🔒 VERIFICACIÓN DE SEGURIDAD - PROYECTO EVA"
echo "=============================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar errores
show_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
}

# Función para mostrar advertencias
show_warning() {
    echo -e "${YELLOW}⚠️  ADVERTENCIA: $1${NC}"
}

# Función para mostrar éxito
show_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Verificar archivos sensibles en el staging area
echo "📋 Verificando archivos en staging area..."
SENSITIVE_FILES=$(git diff --cached --name-only | grep -E "(\.env|firebase\.json|\.firebaserc|admin-user|firestore-debug|asignar|create-admin|creacion-usuario|start-emulator|eva-ugel\.json|apphosting\.yaml)")

if [ ! -z "$SENSITIVE_FILES" ]; then
    show_error "Archivos sensibles detectados en staging area:"
    echo "$SENSITIVE_FILES"
    echo ""
    echo "🚨 ACCIÓN REQUERIDA:"
    echo "   git reset HEAD <archivo>  # Para remover del staging"
    echo "   git checkout -- <archivo> # Para restaurar el archivo"
    exit 1
else
    show_success "No se detectaron archivos sensibles en staging area"
fi

# Verificar archivos sensibles en el directorio de trabajo
echo ""
echo "📁 Verificando archivos sensibles en directorio de trabajo..."
WORKING_SENSITIVE=$(find . -maxdepth 1 -name "*.env*" -o -name "firebase.json" -o -name ".firebaserc" -o -name "admin-user.json" -o -name "firestore-debug.log" -o -name "asignar*.js" -o -name "create-admin*.js" -o -name "creacion-usuario.js" -o -name "start-emulator*.sh" -o -name "eva-ugel.json" -o -name "apphosting.yaml" 2>/dev/null)

if [ ! -z "$WORKING_SENSITIVE" ]; then
    show_warning "Archivos sensibles detectados en directorio de trabajo:"
    echo "$WORKING_SENSITIVE"
    echo ""
    echo "💡 RECOMENDACIÓN:"
    echo "   Estos archivos están protegidos por .gitignore"
    echo "   pero asegúrate de no agregarlos manualmente"
fi

# Verificar archivos de exportación de Firebase
echo ""
echo "🔥 Verificando exportaciones de Firebase..."
FIREBASE_EXPORTS=$(find . -maxdepth 1 -name "firebase-export-*" -type d 2>/dev/null)

if [ ! -z "$FIREBASE_EXPORTS" ]; then
    show_warning "Directorios de exportación de Firebase detectados:"
    echo "$FIREBASE_EXPORTS"
    echo ""
    echo "💡 RECOMENDACIÓN:"
    echo "   Estos directorios contienen datos sensibles"
    echo "   y están protegidos por .gitignore"
fi

# Verificar archivos de configuración local
echo ""
echo "⚙️  Verificando archivos de configuración local..."
LOCAL_CONFIGS=$(find . -maxdepth 1 -name "*local*" -o -name "*config*" 2>/dev/null | grep -v node_modules)

if [ ! -z "$LOCAL_CONFIGS" ]; then
    show_warning "Archivos de configuración local detectados:"
    echo "$LOCAL_CONFIGS"
fi

# Verificar logs
echo ""
echo "📝 Verificando archivos de log..."
LOGS=$(find . -maxdepth 1 -name "*.log" 2>/dev/null)

if [ ! -z "$LOGS" ]; then
    show_warning "Archivos de log detectados:"
    echo "$LOGS"
    echo ""
    echo "💡 RECOMENDACIÓN:"
    echo "   Los archivos de log están protegidos por .gitignore"
fi

# Verificar estado de Git
echo ""
echo "📊 Estado de Git:"
git status --porcelain

# Verificar archivos ignorados
echo ""
echo "🚫 Archivos ignorados por .gitignore:"
git status --ignored --porcelain | head -10

# Resumen final
echo ""
echo "=============================================="
echo "🔒 RESUMEN DE VERIFICACIÓN DE SEGURIDAD"
echo "=============================================="

if [ -z "$SENSITIVE_FILES" ]; then
    show_success "✅ VERIFICACIÓN EXITOSA"
    echo "   Puedes proceder con el commit de forma segura"
    echo ""
    echo "💡 RECOMENDACIONES:"
    echo "   - Siempre ejecuta este script antes de hacer commit"
    echo "   - Revisa git status antes de git add"
    echo "   - Mantén actualizado el archivo .gitignore"
    echo "   - Consulta SECURITY.md para más información"
else
    show_error "❌ VERIFICACIÓN FALLIDA"
    echo "   Corrige los problemas antes de hacer commit"
    exit 1
fi

echo ""
echo "🔗 Recursos de seguridad:"
echo "   - SECURITY.md: Guía completa de seguridad"
echo "   - .gitignore: Archivos protegidos"
echo "   - README.md: Instrucciones de configuración" 