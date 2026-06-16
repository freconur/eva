import { useRouter } from 'next/router';
import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes';
import EvaluarEstudianteForm from '@/components/evaluar/EvaluarEstudianteForm';

/**
 * Página envoltorio para la evaluación de estudiantes de secundaria.
 * Utiliza el componente reutilizable EvaluarEstudianteForm para mantener compatibilidad con la URL directa.
 */
const EvaluarEstudiantePage = () => {
  const router = useRouter();
  const { idExamen } = router.query;

  if (!idExamen) {
    return null; // Esperar a que la ruta esté lista
  }

  return (
    <EvaluarEstudianteForm 
      idExamen={idExamen as string} 
      isInsideDrawer={false} 
    />
  );
};

export default EvaluarEstudiantePage;
EvaluarEstudiantePage.Auth = PrivateRouteDocentes;
