/**
 * ARCHIVO DE ENTRADA PRINCIPAL - CLOUD FUNCTIONS
 */
import * as admin from 'firebase-admin';

if (process.env.FUNCTIONS_EMULATOR === 'true') {
  if (process.env.CONNECT_TO_PROD === 'true') {
    console.log('📡 Desconectando variables del emulador para apuntar a PRODUCCIÓN (Firestore, Auth, Storage, etc.)...');
    const emulatorsToUnset = [
      'FIRESTORE_EMULATOR_HOST',
      'FIREBASE_AUTH_EMULATOR_HOST',
      'FIREBASE_STORAGE_EMULATOR_HOST',
      'FIREBASE_DATABASE_EMULATOR_HOST',
      'PUBSUB_EMULATOR_HOST'
    ];
    emulatorsToUnset.forEach(envVar => {
      delete process.env[envVar];
    });
  }
}

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
export { configurarSeguridad } from './configurarSeguridad';
export { resetearContrasena } from './resetearContrasena';
export { resetearContrasenasMasivo } from './resetearContrasenasMasivo';
export { recuperarContrasenaAutoservicio } from './recuperarContrasenaAutoservicio';
export { obtenerPreguntaSeguridad } from './obtenerPreguntaSeguridad';
export { validarCredencialesAutoservicio } from './validarCredencialesAutoservicio';
export { solicitarReseteoContrasena } from './solicitarReseteoContrasena';
export { crearDirectoresMasivo } from './crearDirectoresMasivo';
export { crearDocentesMasivo } from './crearDocentesMasivo';
export { leerEvaluacionesParaAdmin } from './leerEvaluacionesParaAdmin';
export { getReporteDirector } from './getReporteDirector';
export { getDataToDirectoresFromBarGraphics } from './getDataToDirectoresFromBarGraphics';
export { getDataToProfesoresFromBarGraphics } from './getDataToProfesoresFromBarGraphics';
export { getDataReporteEvaluacionPorPreguntas } from './getDataReporteEvaluacionPorPreguntas';
export { getDataReporteAgregadoPorRol } from './reportsAggregation';
export { startFullConsolidation } from './orchestrator';
export { obtenerMetricasConsumo } from './obtenerMetricasConsumo';



try {
  const { getListCollectionsEvaluacionesPorMes } = require('./getListCollectionsEvaluacionesPorMes');
  exports.getListCollectionsEvaluacionesPorMes = getListCollectionsEvaluacionesPorMes;
} catch (e: any) {
  console.error('❌ Error al cargar getListCollectionsEvaluacionesPorMes:', e.message);
}
