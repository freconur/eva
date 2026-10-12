import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { RiLoader4Line } from 'react-icons/ri';
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores';

const EvaluarDocenteRedirect = () => {
  const router = useRouter();
  const { dniDocente, idEvaluacion, id } = router.query;

  useEffect(() => {
    if (router.isReady) {
      const evalId = (idEvaluacion as string) || (id as string) || '';
      const docDni = (dniDocente as string) || '';
      router.replace(
        `/directores/evaluaciones-docentes/evaluacion/evaluar-docente?id=${evalId}&idDocente=${docDni}`
      );
    }
  }, [router.isReady, dniDocente, idEvaluacion, id, router]);

  return (
    <PrivateRouteDirectores>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RiLoader4Line className="text-4xl text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Redirigiendo a la nueva ficha de evaluación...</p>
      </div>
    </PrivateRouteDirectores>
  );
};

export default EvaluarDocenteRedirect;
