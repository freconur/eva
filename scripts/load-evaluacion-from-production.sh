#!/bin/bash

# ==============================================================================
# Script: load-evaluacion-from-production.sh
# Propósito: Crear un subset desde PRODUCCIÓN (como load-users-only.sh)
#            con solo las colecciones necesarias para probar la Cloud Function
# ==============================================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"
SUBSET_PATH="$PROJECT_ROOT/latest-subset-export"

echo "🧹 Limpiando cualquier export anterior..."
rm -rf "$SUBSET_PATH"

echo "🛑 Asegurando que no haya emuladores corriendo..."
fuser -k 8080/tcp 8085/tcp 9099/tcp 5001/tcp 4400/tcp 4000/tcp 2>/dev/null

echo "🔥 Iniciando emulador de Firestore VACÍO..."
cd "$PROJECT_ROOT"
firebase emulators:start --only firestore &
EMULATOR_PID=$!

echo "⏳ Esperando a que Firestore esté listo..."
sleep 5

echo "📦 Clonando datos específicos desde producción..."
node "$SCRIPT_DIR/clone-evaluacion-data.js"

echo "💾 Guardando subset en $SUBSET_PATH..."
firebase emulators:export "$SUBSET_PATH" --force

echo "🛑 Deteniendo emulador..."
kill $EMULATOR_PID

echo ""
echo "✨ HECHO! Subset generado exitosamente desde producción."
echo ""
echo "📊 Contenido del subset:"
echo "   • 1000 estudiantes de /evaluaciones/.../estudiantes-evaluados/2025/10"
echo "   • Preguntas-respuestas de la evaluación"
echo "   • 1 usuario para autenticación"
echo "   • 1 documento de evaluación"
echo ""
echo "🚀 Siguiente paso:"
echo "   firebase emulators:start --import=./latest-subset-export --export-on-exit"
echo ""
