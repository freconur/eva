#!/bin/bash

# ==============================================================================
# Script: load-users-only.sh
# Propósito: Crear un subset que contenga la colección de usuarios (500 docs), grados y caracteristica-curricular.
# ==============================================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"
SUBSET_PATH="$PROJECT_ROOT/latest-subset-export"

echo "🧹 Limpiando cualquier export anterior..."
rm -rf "$SUBSET_PATH"

echo "🛑 Asegurando que no haya emuladores corriendo..."
fuser -k 8080/tcp 8085/tcp 9099/tcp 5001/tcp 4400/tcp 4000/tcp 2>/dev/null

echo "🔥 Iniciando emulador de Firestore..."
cd "$PROJECT_ROOT"
firebase emulators:start --only firestore &
EMULATOR_PID=$!

sleep 5

echo "👥 Clonando usuarios, grados y característica-curricular desde producción..."
node "$SCRIPT_DIR/clone-users.js"

echo "💾 Guardando subset en $SUBSET_PATH..."
firebase emulators:export "$SUBSET_PATH" --force

echo "🛑 Deteniendo emulador..."
kill $EMULATOR_PID

echo "✨ HECHO! Ahora tienes una base de datos con usuarios, grados, característica-curricular y regiones."
echo "Ejecuta ./start-dev-suite.sh para entrar."
