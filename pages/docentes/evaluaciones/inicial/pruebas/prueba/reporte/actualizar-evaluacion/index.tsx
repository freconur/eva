import { useRouter } from 'next/router';
import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes';
import ActualizarEvaluacionForm from '@/components/evaluar/ActualizarEvaluacionForm';

/**
 * Página envoltorio para la edición/actualización de evaluaciones de estudiantes.
 * Utiliza el componente reutilizable ActualizarEvaluacionForm para mantener compatibilidad con la URL directa.
 */
const ActualizarEvaluacionPage = () => {
  const router = useRouter();
  const { idExamen, idEstudiante, mes } = router.query;

  if (!idExamen || !idEstudiante || !mes) {
    return null; // Esperar a que los parámetros de la ruta estén listos
  }

  return (
    <ActualizarEvaluacionForm
      idExamen={idExamen as string}
      idEstudiante={idEstudiante as string}
      mes={mes as string}
      isInsideDrawer={false}
    />
  );
};

export default ActualizarEvaluacionPage;
ActualizarEvaluacionPage.Auth = PrivateRouteDocentes;