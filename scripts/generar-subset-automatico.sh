#!/bin/bash

# Script automatizado para generar subset de Firestore desde latest-db-export
# Autor: Script generado automáticamente
# Uso: ./scripts/generar-subset-automatico.sh

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Generador Automático de Subset${NC}"
echo -e "${BLUE}  Firestore Database${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Variables de configuración
INPUT_FILE="latest-db-export"
OUTPUT_FILE="firestore-subset.json"
SCRIPT_DIR="scripts"
FILTER_SCRIPT="$SCRIPT_DIR/firestore-subset-filter.js"

# Verificar que existe el archivo de entrada
echo -e "${YELLOW}🔍 Verificando archivo de entrada...${NC}"
if [ ! -f "$INPUT_FILE" ]; then
    echo -e "${RED}❌ Error: No se encontró el archivo '$INPUT_FILE'${NC}"
    echo ""
    echo "Por favor, asegúrate de que el archivo 'latest-db-export' existe en el directorio actual."
    echo ""
    exit 1
fi

# Obtener tamaño del archivo de entrada
INPUT_SIZE=$(du -h "$INPUT_FILE" | cut -f1)
echo -e "${GREEN}✓ Archivo encontrado: $INPUT_FILE ($INPUT_SIZE)${NC}"
echo ""

# Verificar que existe Node.js
echo -e "${YELLOW}🔍 Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js no está instalado${NC}"
    echo ""
    echo "Por favor, instala Node.js desde: https://nodejs.org/"
    echo ""
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js instalado: $NODE_VERSION${NC}"
echo ""

# Verificar que existe el script de filtrado
echo -e "${YELLOW}🔍 Verificando script de filtrado...${NC}"
if [ ! -f "$FILTER_SCRIPT" ]; then
    echo -e "${RED}❌ Error: No se encontró el script '$FILTER_SCRIPT'${NC}"
    echo ""
    echo "Por favor, asegúrate de que el archivo existe."
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Script de filtrado encontrado${NC}"
echo ""

# Mostrar configuración
echo -e "${BLUE}📋 Configuración:${NC}"
echo "  • Archivo de entrada: $INPUT_FILE"
echo "  • Archivo de salida: $OUTPUT_FILE"
echo "  • Evaluación ID: 7aN8fAxS4SQAlm9CTIlX"
echo "  • Usuario ID: YSd3Gak0ytNE427UGD5TlhZ146b2"
echo "  • Mes: 10"
echo "  • Año: 2025"
echo ""

# Confirmar antes de proceder
echo -e "${YELLOW}⚠️  Este proceso puede tomar varios minutos dependiendo del tamaño del archivo.${NC}"
echo ""
read -p "¿Deseas continuar? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
    echo -e "${YELLOW}Operación cancelada por el usuario.${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}🚀 Iniciando generación del subset...${NC}"
echo ""

# Ejecutar el script de filtrado
echo -e "${BLUE}⏳ Procesando archivo (esto puede tomar varios minutos)...${NC}"
echo ""

# Ejecutar con captura de tiempo
START_TIME=$(date +%s)

if node "$FILTER_SCRIPT" "$INPUT_FILE" "$OUTPUT_FILE"; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✅ Subset generado exitosamente!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    
    # Mostrar estadísticas
    if [ -f "$OUTPUT_FILE" ]; then
        OUTPUT_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
        echo -e "${BLUE}📊 Estadísticas:${NC}"
        echo "  • Tamaño original: $INPUT_SIZE"
        echo "  • Tamaño subset: $OUTPUT_SIZE"
        echo "  • Tiempo de procesamiento: ${DURATION}s"
        echo "  • Archivo generado: $OUTPUT_FILE"
        echo ""
        
        echo -e "${GREEN}🎯 Siguiente paso:${NC}"
        echo "  Importa el subset al emulador con:"
        echo ""
        echo -e "${BLUE}  firebase emulators:start --import=./$OUTPUT_FILE --export-on-exit${NC}"
        echo ""
    fi
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  ❌ Error al generar el subset${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo "Revisa los mensajes de error anteriores para más detalles."
    echo ""
    exit 1
fi
