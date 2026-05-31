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


try {
  const { getListCollectionsEvaluacionesPorMes } = require('./getListCollectionsEvaluacionesPorMes');
  exports.getListCollectionsEvaluacionesPorMes = getListCollectionsEvaluacionesPorMes;
} catch (e: any) {
  console.error('❌ Error al cargar getListCollectionsEvaluacionesPorMes:', e.message);
}
