#!/bin/bash

# Script para correr funciones en LOCAL conectadas a FIRESTORE PRODUCCIÓN
echo "🚀 Iniciando Cloud Functions en modo local -> Datos de Producción"

# 1. Configurar la ruta a tus credenciales (usando el archivo que ya tienes)
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/eva-ugel.json"

# 2. Asegurar conexión limpia a producción
export CONNECT_TO_PROD=true
unset FIRESTORE_EMULATOR_HOST
unset FIREBASE_AUTH_EMULATOR_HOST
unset FIREBASE_STORAGE_EMULATOR_HOST
unset FIREBASE_DATABASE_EMULATOR_HOST
unset PUBSUB_EMULATOR_HOST

echo "🔑 Usando credenciales: $GOOGLE_APPLICATION_CREDENTIALS"
echo "📡 Conectando a servicios reales de Firebase (Firestore, Auth, Storage, etc.) en producción..."

# 3. Compilar Cloud Functions antes de iniciar
echo "📦 Compilando TypeScript de Cloud Functions..."
(cd functions && npm run build)

# 4. Iniciar solo las funciones
# Usamos --project para asegurar que el contexto sea el correcto
firebase emulators:start --only functions --project evaluaciones-ugel
