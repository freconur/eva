#!/bin/bash

# Script para iniciar Firebase Emulator con el export completo
# El emulador de Firebase puede manejar exports grandes eficientemente

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Firebase Emulator con Import${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Verificar que existe el directorio de export
if [ ! -d "latest-db-export" ]; then
    echo -e "${YELLOW}❌ Error: No se encontró el directorio 'latest-db-export'${NC}"
    echo ""
    echo "Por favor, asegúrate de que el directorio existe en la raíz del proyecto."
    exit 1
fi

echo -e "${GREEN}✓ Directorio de export encontrado${NC}"
echo ""

# Contar archivos
FILE_COUNT=$(find latest-db-export -type f | wc -l)
echo -e "${BLUE}📊 Información del export:${NC}"
echo "  • Archivos totales: $FILE_COUNT"
echo "  • Ubicación: ./latest-db-export"
echo ""

echo -e "${YELLOW}⚠️  NOTA IMPORTANTE:${NC}"
echo "El emulador de Firebase importará TODA la base de datos."
echo "Esto puede tomar varios minutos y consumir bastante memoria."
echo ""
echo -e "${BLUE}Opciones:${NC}"
echo "  1. Importar todo y usar el emulador completo"
echo "  2. Cancelar y crear un subset manualmente"
echo ""

read -p "¿Deseas continuar con la importación completa? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
    echo -e "${YELLOW}Operación cancelada.${NC}"
    echo ""
    echo -e "${BLUE}Para crear un subset, necesitarás:${NC}"
    echo "  1. Usar Firebase CLI para exportar solo las colecciones necesarias"
    echo "  2. O filtrar manualmente los datos después de importar"
    echo ""
    exit 0
fi

echo ""
echo -e "${GREEN}🚀 Iniciando Firebase Emulator...${NC}"
echo ""

# Iniciar emulador con import
firebase emulators:start --import=./latest-db-export --export-on-exit
