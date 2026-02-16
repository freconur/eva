/**
 * Script para filtrar un export completo de Firestore y crear un subset
 * con solo las colecciones necesarias para probar crearPuntajeEestudiantesProgresiva
 * 
 * Uso:
 *   node firestore-subset-filter.js <archivo-export-completo.json> <archivo-subset-salida.json>
 * 
 * Ejemplo:
 *   node firestore-subset-filter.js firestore-full-export.json firestore-subset.json
 */

const fs = require('fs');
const path = require('path');

// Configuración
const CONFIG = {
  evaluacionId: '7aN8fAxS4SQAlm9CTIlX',
  usuarioId: 'YSd3Gak0ytNE427UGD5TlhZ146b2',
  mes: '10',
  ano: '2025'
};

// Rutas que queremos mantener
const RUTAS_NECESARIAS = [
  `evaluaciones/${CONFIG.evaluacionId}/estudiantes-evaluados/${CONFIG.ano}/${CONFIG.mes}`,
  `evaluaciones/${CONFIG.evaluacionId}/preguntas-respuestas`,
  `usuarios/${CONFIG.usuarioId}`
];

console.log('🔍 Firestore Subset Filter');
console.log('==========================\n');

// Validar argumentos
if (process.argv.length < 4) {
  console.error('❌ Error: Faltan argumentos\n');
  console.log('Uso:');
  console.log('  node firestore-subset-filter.js <archivo-entrada.json> <archivo-salida.json>\n');
  console.log('Ejemplo:');
  console.log('  node firestore-subset-filter.js firestore-full.json firestore-subset.json\n');
  process.exit(1);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];

// Verificar que el archivo de entrada existe
if (!fs.existsSync(inputFile)) {
  console.error(`❌ Error: El archivo "${inputFile}" no existe\n`);
  process.exit(1);
}

console.log(`📂 Archivo de entrada: ${inputFile}`);
console.log(`📝 Archivo de salida: ${outputFile}\n`);

console.log('📋 Rutas a incluir en el subset:');
RUTAS_NECESARIAS.forEach((ruta, index) => {
  console.log(`   ${index + 1}. /${ruta}`);
});
console.log('');

try {
  // Leer el archivo JSON completo
  console.log('📖 Leyendo archivo de entrada...');
  const fullData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  
  // Crear objeto para el subset
  const subsetData = {};
  let totalDocumentos = 0;
  
  console.log('🔄 Filtrando datos...\n');
  
  // Función recursiva para filtrar datos
  function filtrarRuta(data, rutaActual = '') {
    if (!data || typeof data !== 'object') return null;
    
    const resultado = {};
    let encontrado = false;
    
    for (const [key, value] of Object.entries(data)) {
      const nuevaRuta = rutaActual ? `${rutaActual}/${key}` : key;
      
      // Verificar si esta ruta coincide con alguna de las necesarias
      const coincide = RUTAS_NECESARIAS.some(rutaNecesaria => {
        return nuevaRuta.startsWith(rutaNecesaria) || rutaNecesaria.startsWith(nuevaRuta);
      });
      
      if (coincide) {
        if (typeof value === 'object' && value !== null) {
          const subResultado = filtrarRuta(value, nuevaRuta);
          if (subResultado !== null) {
            resultado[key] = subResultado;
            encontrado = true;
            
            // Contar documentos
            if (value.__collections__) {
              totalDocumentos++;
            }
          }
        } else {
          resultado[key] = value;
          encontrado = true;
        }
      }
    }
    
    return encontrado ? resultado : null;
  }
  
  // Filtrar los datos
  const filtrado = filtrarRuta(fullData);
  
  if (!filtrado || Object.keys(filtrado).length === 0) {
    console.error('❌ Error: No se encontraron datos que coincidan con las rutas especificadas\n');
    console.log('Verifica que:');
    console.log('  1. El archivo de entrada contenga las rutas correctas');
    console.log('  2. Los IDs en CONFIG sean correctos');
    console.log('  3. El formato del export sea compatible\n');
    process.exit(1);
  }
  
  // Guardar el subset
  console.log('💾 Guardando subset...');
  fs.writeFileSync(outputFile, JSON.stringify(filtrado, null, 2), 'utf8');
  
  // Estadísticas
  const inputSize = fs.statSync(inputFile).size;
  const outputSize = fs.statSync(outputFile).size;
  const reduccion = ((1 - outputSize / inputSize) * 100).toFixed(2);
  
  console.log('\n✅ Subset creado exitosamente!\n');
  console.log('📊 Estadísticas:');
  console.log(`   • Tamaño original: ${(inputSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   • Tamaño subset: ${(outputSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   • Reducción: ${reduccion}%`);
  console.log(`   • Documentos incluidos: ~${totalDocumentos}\n`);
  
  console.log(`📁 Archivo guardado en: ${path.resolve(outputFile)}\n`);
  
} catch (error) {
  console.error('❌ Error al procesar el archivo:\n');
  console.error(error.message);
  console.error('\nDetalles del error:');
  console.error(error.stack);
  process.exit(1);
}
