#!/bin/bash

# Script para ejecutar emulador de Firebase con base de datos de 2.5GB
echo "🚀 Iniciando emulador de Firebase con base de datos de 2.5GB..."

# Configuración de memoria optimizada para base de datos grande
export JAVA_TOOL_OPTIONS="-Xmx20G -Xms8G -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+UseStringDeduplication"
export NODE_OPTIONS="--max-old-space-size=10240"
export FIRESTORE_EMULATOR_CACHE_SIZE=4096

echo "💾 Configuración de memoria:"
echo "  - Java Heap: 20GB (máximo), 8GB (inicial)"
echo "  - Node.js: 10GB"
echo "  - Base de datos: 2.5GB"
echo "  - Memoria disponible: $(free -h | grep Mem | awk '{print $7}')"
echo ""

# Directorio de la base de datos
#IMPORT_PATH="./eva-ugel-emulator-firestore/2025-08-30T23:48:52_3980"
IMPORT_PATH="./eva-ugel-emulator-firestore/persistent-data-15"
EXPORT_DIR="./eva-ugel-emulator-firestore/persistent-data-16"

# Verificar que existe la base de datos
if [ ! -d "$IMPORT_PATH" ]; then
    echo "❌ ERROR: No se encontró el directorio de la base de datos: $IMPORT_PATH"
    exit 1
fi

# Crear directorio para datos persistentes
mkdir -p "$EXPORT_DIR"

echo "📂 Base de datos: $IMPORT_PATH"
echo "💾 Datos persistentes: $EXPORT_DIR"
echo "⚠️  Iniciando emulador... (puede tomar varios minutos)"
echo ""

# Iniciar emulador de Firebase
firebase emulators:start \
  --project evaluaciones-ugel \
  --import="$IMPORT_PATH" \
  --export-on-exit="$EXPORT_DIR" \
  --only=firestore,auth,functions

echo ""
echo "✅ Emulador terminado"
echo "💾 Los cambios han sido guardados en: $EXPORT_DIR"
