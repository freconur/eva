#!/bin/bash

# Script para correr funciones en LOCAL conectadas a FIRESTORE PRODUCCIÓN
echo "🚀 Iniciando Cloud Functions en modo local -> Datos de Producción"

# 1. Configurar la ruta a tus credenciales (usando el archivo que ya tienes)
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/eva-ugel.json"

# 2. Asegurarse de que NO esté apuntando al emulador de Firestore
unset FIRESTORE_EMULATOR_HOST

echo "🔑 Usando credenciales: $GOOGLE_APPLICATION_CREDENTIALS"
echo "📡 Conectando a la base de datos real de Firebase..."

# 3. Iniciar solo las funciones
# Usamos --project para asegurar que el contexto sea el correcto
firebase emulators:start --only functions --project evaluaciones-ugel
