#!/bin/bash

# ==============================================================================
# Script: load-evaluacion-subset.sh
# Propósito: Crear un subset desde latest-db-export con solo las colecciones
#            necesarias para probar crearPuntajeEestudiantesProgresiva
# ==============================================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"
EXPORT_PATH="$PROJECT_ROOT/latest-db-export"
SUBSET_PATH="$PROJECT_ROOT/latest-subset-export"

echo "🧹 Limpiando cualquier export anterior..."
rm -rf "$SUBSET_PATH"

echo "🛑 Asegurando que no haya emuladores corriendo..."
fuser -k 8080/tcp 8085/tcp 9099/tcp 5001/tcp 4400/tcp 4000/tcp 2>/dev/null

echo "🔥 Iniciando emulador de Firestore con import completo..."
echo "   (Esto puede tomar 2-5 minutos para cargar ~5.8GB)"
cd "$PROJECT_ROOT"
firebase emulators:start --only firestore --import="$EXPORT_PATH" &
EMULATOR_PID=$!

echo "⏳ Esperando a que Firestore esté listo..."
while ! nc -z localhost 8080 2>/dev/null; do
  sleep 1
  echo -n "."
done
echo ""
echo "✅ Firestore listo!"
echo ""

# Esperar un poco más para asegurar que la importación termine
echo "⏳ Esperando a que termine la importación completa..."
sleep 15

echo "🔄 Filtrando colecciones necesarias..."
node "$SCRIPT_DIR/filter-evaluacion-data.js"

echo "💾 Guardando subset en $SUBSET_PATH..."
firebase emulators:export "$SUBSET_PATH" --force

echo "🛑 Deteniendo emulador..."
kill $EMULATOR_PID

echo ""
echo "✨ HECHO! Subset generado exitosamente."
echo ""
echo "📊 Contenido del subset:"
echo "   • /evaluaciones/7aN8fAxS4SQAlm9CTIlX/estudiantes-evaluados/2025/10"
echo "   • /evaluaciones/7aN8fAxS4SQAlm9CTIlX/preguntas-respuestas"
echo "   • /usuarios/YSd3Gak0ytNE427UGD5TlhZ146b2"
echo ""
echo "🚀 Siguiente paso:"
echo "   firebase emulators:start --import=./latest-subset-export --export-on-exit"
echo ""
