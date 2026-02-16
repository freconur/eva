#!/bin/bash

# Script para generar subset desde latest-db-export local
# Similar a load-subset.sh pero usando el export local en lugar de producción

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Generar Subset desde Export Local${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Determinar la raíz del proyecto
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"

EXPORT_PATH="$PROJECT_ROOT/latest-db-export"
SUBSET_PATH="$PROJECT_ROOT/latest-subset-export"

# Verificar que existe el export
if [ ! -d "$EXPORT_PATH" ]; then
    echo -e "${RED}❌ Error: No se encontró $EXPORT_PATH${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Export encontrado: $EXPORT_PATH${NC}"
echo ""

# Limpiar subset anterior
echo -e "${YELLOW}🧹 Limpiando subset anterior...${NC}"
rm -rf "$SUBSET_PATH"

# Ir a la raíz del proyecto
cd "$PROJECT_ROOT"

# Iniciar emulador con el export completo
echo -e "${BLUE}🔥 Iniciando emulador con export completo...${NC}"
echo -e "${YELLOW}   (Esto puede tomar 2-5 minutos)${NC}"
echo ""

firebase emulators:start --only firestore --import="$EXPORT_PATH" &
EMULATOR_PID=$!

# Esperar a que el emulador esté listo
echo -e "${YELLOW}⏳ Esperando a que Firestore esté listo...${NC}"
while ! nc -z localhost 8080 2>/dev/null; do   
  sleep 1
  echo -n "."
done
echo ""
echo -e "${GREEN}✅ Firestore listo${NC}"
echo ""

# Esperar un poco más para asegurar que todo esté cargado
sleep 3

# Ejecutar script de filtrado
echo -e "${BLUE}🔄 Generando subset filtrado...${NC}"
node "$SCRIPT_DIR/generate-subset-from-emulator.js"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al generar subset${NC}"
    kill $EMULATOR_PID 2>/dev/null
    exit 1
fi

# Exportar subset
echo ""
echo -e "${BLUE}💾 Exportando subset a $SUBSET_PATH...${NC}"
firebase emulators:export "$SUBSET_PATH" --force

# Detener emulador
echo ""
echo -e "${YELLOW}🛑 Deteniendo emulador...${NC}"
kill $EMULATOR_PID 2>/dev/null
wait $EMULATOR_PID 2>/dev/null

# Mostrar estadísticas
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Subset generado exitosamente${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

EXPORT_SIZE=$(du -sh "$EXPORT_PATH" 2>/dev/null | cut -f1)
SUBSET_SIZE=$(du -sh "$SUBSET_PATH" 2>/dev/null | cut -f1)

echo -e "${BLUE}📊 Estadísticas:${NC}"
echo "  • Export original: $EXPORT_SIZE"
echo "  • Subset generado: $SUBSET_SIZE"
echo "  • Ubicación: $SUBSET_PATH"
echo ""
echo -e "${GREEN}🎯 Siguiente paso:${NC}"
echo "  Usa el subset con:"
echo -e "${BLUE}  firebase emulators:start --import=./latest-subset-export --export-on-exit${NC}"
echo ""
