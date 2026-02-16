#!/bin/bash

# Script para crear un subset de la base de datos de Firestore
# Solo incluye las colecciones necesarias para probar crearPuntajeEestudiantesProgresiva

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Creando Subset de Firestore${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Variables
EVALUACION_ID="7aN8fAxS4SQAlm9CTIlX"
USUARIO_ID="YSd3Gak0ytNE427UGD5TlhZ146b2"
MES="10"
ANO="2025"
OUTPUT_FILE="firestore-subset-export.json"

echo -e "${YELLOW}Configuración:${NC}"
echo "  - Evaluación ID: $EVALUACION_ID"
echo "  - Usuario ID: $USUARIO_ID"
echo "  - Mes: $MES"
echo "  - Año: $ANO"
echo "  - Archivo de salida: $OUTPUT_FILE"
echo ""

# Verificar si firestore-export está instalado
if ! command -v firestore-export &> /dev/null; then
    echo -e "${YELLOW}⚠️  firestore-export no está instalado${NC}"
    echo "Instalando firestore-export..."
    npm install -g node-firestore-import-export
fi

echo -e "${GREEN}✓ Iniciando exportación del subset...${NC}"
echo ""

# Crear archivo JSON temporal con la estructura
cat > subset-paths.txt << EOF
/evaluaciones/$EVALUACION_ID/estudiantes-evaluados/$ANO/$MES
/evaluaciones/$EVALUACION_ID/preguntas-respuestas
/usuarios/$USUARIO_ID
EOF

echo -e "${BLUE}Rutas a exportar:${NC}"
cat subset-paths.txt
echo ""

# Nota: Este script requiere que tengas configuradas las credenciales de Firebase
# Puedes usar gcloud CLI o las credenciales de servicio

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}INSTRUCCIONES MANUALES:${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "Para crear el subset manualmente desde Firebase Console:"
echo ""
echo "1. Ve a Firebase Console > Firestore Database"
echo ""
echo "2. Exporta las siguientes colecciones/documentos:"
echo ""
echo -e "${GREEN}   a) Estudiantes evaluados:${NC}"
echo "      /evaluaciones/$EVALUACION_ID/estudiantes-evaluados/$ANO/$MES"
echo ""
echo -e "${GREEN}   b) Preguntas y respuestas:${NC}"
echo "      /evaluaciones/$EVALUACION_ID/preguntas-respuestas"
echo ""
echo -e "${GREEN}   c) Usuario para autenticación:${NC}"
echo "      /usuarios/$USUARIO_ID"
echo ""
echo "3. Usa el comando de Firebase CLI:"
echo ""
echo -e "${BLUE}   gcloud firestore export gs://[BUCKET]/subset \\${NC}"
echo -e "${BLUE}     --collection-ids=estudiantes-evaluados,preguntas-respuestas,usuarios${NC}"
echo ""
echo "4. O usa este comando para exportar todo y luego filtrar:"
echo ""
echo -e "${BLUE}   firebase firestore:export firestore-export${NC}"
echo ""
echo -e "${YELLOW}========================================${NC}"
echo ""

# Limpiar archivo temporal
rm subset-paths.txt

echo -e "${GREEN}✓ Script completado${NC}"
echo ""
echo "Nota: Este script proporciona las rutas necesarias."
echo "Usa Firebase CLI o Console para realizar la exportación real."
