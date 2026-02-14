#!/bin/bash

# ==============================================================================
# Script: load-subset.sh
# Propósito: Automatizar la creación del subset inicial.
# ==============================================================================

# Determinar la raíz del proyecto para que funcione desde cualquier carpeta
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"

SUBSET_PATH="$PROJECT_ROOT/latest-subset-export"

echo "🧹 Limpiando carpetas temporales..."
rm -rf "$SUBSET_PATH"

echo "🔥 Iniciando emuladores en segundo plano para poblar datos..."
# Iniciamos solo firestore para la carga
# Nos movemos a la raíz para que firebase detecte el firebase.json
cd "$PROJECT_ROOT"

firebase emulators:start --only firestore &
EMULATOR_PID=$!

# Esperar a que el emulador esté listo (puerto 8080)
echo "⏳ Esperando a que Firestore esté listo..."
while ! nc -z localhost 8080; do   
  sleep 1
done

echo "✅ Firestore listo. Ejecutando script de clonación..."
node "$SCRIPT_DIR/generate-subset.js"

echo "💾 Exportando subset a $SUBSET_PATH..."
firebase emulators:export "$SUBSET_PATH" --force


echo "🛑 Deteniendo emuladores..."
kill $EMULATOR_PID

echo "✨ Proceso completado. Ahora puedes usar ./start-dev-suite.sh para cargar el subset."
