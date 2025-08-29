#!/bin/bash

# Script para iniciar emulador con datos persistentes
echo "🚀 Iniciando emulador de Firebase con datos persistentes..."

# Configuración de memoria para Java
export JAVA_TOOL_OPTIONS="-Xmx16G -Xms4G -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
export NODE_OPTIONS="--max-old-space-size=8192"
export FIRESTORE_EMULATOR_CACHE_SIZE=2048

# Directorio de datos persistentes
EXPORT_DIR="./eva-ugel-emulator-firestore/persistent-data"

# Verificar si existen datos persistentes
if [ ! -d "$EXPORT_DIR" ] || [ -z "$(ls -A $EXPORT_DIR 2>/dev/null)" ]; then
    echo "❌ No se encontraron datos persistentes en: $EXPORT_DIR"
    echo "💡 Ejecuta primero: ./start-emulator-optimized.sh"
    exit 1
fi

echo "💾 Cargando datos persistentes desde: $EXPORT_DIR"
echo "💾 Los cambios se seguirán guardando en: $EXPORT_DIR"
echo ""

# Ejecutar el emulador con datos persistentes
echo "🔥 Iniciando emulador de Firebase..."
echo "📊 Cargando base de datos persistente..."

firebase emulators:start \
  --project evaluaciones-ugel \
  --import="$EXPORT_DIR" \
  --export-on-exit="$EXPORT_DIR" \
  --only=firestore,auth,functions

echo "✅ Emulador terminado"
echo "💾 Los cambios han sido guardados en: $EXPORT_DIR"
