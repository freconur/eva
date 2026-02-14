/**
 * ARCHIVO DE ENTRADA PRINCIPAL - CLOUD FUNCTIONS
 */
import * as admin from 'firebase-admin';

try {
  admin.initializeApp();
} catch (e: any) {
  console.error('❌ Error al inicializar Firebase Admin:', e.message);
}

// Exportamos de forma individual para máxima compatibilidad con el emulador
export { crearEstudianteDeDocente } from './crearEstudianteDeDocente';
export { crearEstudianteDeDocenteFrontend } from './crearEstudianteDeDocenteFrontend';
export { crearPuntajeEestudiantesProgresiva } from './crearPuntajeEestudiantesProgresiva';
export { traerTodosEstudiantesEvaluados } from './traerTodosEstudiantesEvaluados';
export { crearUsuario } from './crearUsuario';
export { actualizarUsuario } from './actualizarUsuario';
export { borrarUsuario } from './borrarUsuario';
export { crearDirectoresMasivo } from './crearDirectoresMasivo';
export { crearDocentesMasivo } from './crearDocentesMasivo';

try {
  const { getListCollectionsEvaluacionesPorMes } = require('./getListCollectionsEvaluacionesPorMes');
  exports.getListCollectionsEvaluacionesPorMes = getListCollectionsEvaluacionesPorMes;
} catch (e: any) {
  console.error('❌ Error al cargar getListCollectionsEvaluacionesPorMes:', e.message);
}
