#!/bin/bash

# ==============================================================================
# Script: start-dev-suite.sh
# Propósito: Iniciar el entorno de desarrollo local con la base de datos de ~6GB.
# Configuración: Programador Senior - Optimización de recursos y persistencia.
# ==============================================================================

# --- ANÁLISIS DE MEMORIA ---
# Firestore Emulator es "memory-resident". 5.8 GB de exportación comprimida
# pueden expandirse significativamente en la JVM. 
# Se asignan 16GB de Heap para evitar 'OutOfMemoryError' y pausas largas de GC.

export JAVA_TOOL_OPTIONS="-Xmx16G -Xms8G -XX:+UseG1GC -XX:+UseStringDeduplication -XX:MaxGCPauseMillis=200"
export NODE_OPTIONS="--max-old-space-size=8192"

# Aumentamos el cache de Firestore para manejar el volumen de datos
export FIRESTORE_EMULATOR_CACHE_SIZE=8192

# --- CONFIGURACIÓN DE RUTAS ---
# Definimos las rutas de importación
FULL_DB_PATH="./latest-db-export"
SUBSET_DB_PATH="./latest-subset-export"

# Lógica de selección:
# 1. Si se pasa el argumento --full, usamos la base pesada.
# 2. Si no, usamos el subset si existe.
# 3. Si no existe nada, damos error.

IMPORT_PATH="$SUBSET_DB_PATH"

if [[ "$1" == "--full" ]]; then
    IMPORT_PATH="$FULL_DB_PATH"
    echo "⚠️  MODO FULL: Cargando base de datos pesada (5.8 GB)..."
elif [ -d "$SUBSET_DB_PATH" ]; then
    IMPORT_PATH="$SUBSET_DB_PATH"
    echo "🚀 MODO SUBSET: Cargando base de datos ligera (Recomendado)..."
elif [ -d "$FULL_DB_PATH" ]; then
    IMPORT_PATH="$FULL_DB_PATH"
    echo "⚠️  AVISO: No se encontró subset, cargando base de datos FULL..."
else
    echo "❌ [ERROR] No se encontró ningún directorio de datos ($SUBSET_DB_PATH o $FULL_DB_PATH)."
    echo "Pista: Ejecuta './scripts/load-subset.sh' para generar el subset primero."
    exit 1
fi

# Definimos la carpeta de exportación (mantenemos la misma que importamos para persistencia)
EXPORT_PATH="$IMPORT_PATH"

# --- VERIFICACIÓN DE ENTORNO ---
# (Ya verificamos arriba, pero mantenemos estructura limpia)

echo "----------------------------------------------------------------"
echo "⚡️ FIREBASE EMULATOR SUITE - MODO OPTIMIZADO"
echo "----------------------------------------------------------------"
echo "📦 Base de Datos: $IMPORT_PATH"
echo "🧠 Java Heap: 16GB (Max) / 8GB (Initial)"
echo "🟢 Node.js Heap: 8GB"
echo "🛠  Emuladores: Auth, Firestore, Functions, PubSub"
echo "💾 Persistencia: Los cambios se guardarán en $EXPORT_PATH al salir."
echo "----------------------------------------------------------------"

# Nota para el desarrollador: 
# Si el comando falla por 'pubsub', asegúrate de haberlo agregado a tu firebase.json.
# Se recomienda usar --inspect-functions si necesitas debuggear el backend.

firebase emulators:start \
    --import="$IMPORT_PATH" \
    --export-on-exit="$EXPORT_PATH" \
    --only auth,firestore,functions,pubsub

