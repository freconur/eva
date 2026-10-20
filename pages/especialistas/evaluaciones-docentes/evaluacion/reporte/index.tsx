import React from 'react';
import { useRouter } from 'next/router';
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista';
import { ReporteGeneralDesempenoContainer } from '@/components/evaluaciones-desempeno/containers';

const ReporteDocentesEspecialistasPage = () => {
  const router = useRouter();
  const idEvaluacion = (router.query.idEvaluacion as string) || (router.query.id as string) || '';

  return (
    <ReporteGeneralDesempenoContainer
      id={idEvaluacion}
      collectionName="evaluaciones-docentes"
      role="especialista"
      targetTitle="Docentes Evaluados"
      targetNoun="docentes"
      targetNounSingular="Docente"
      backHref={`/especialistas/evaluaciones-docentes/evaluacion/${idEvaluacion}`}
    />
  );
};

export default ReporteDocentesEspecialistasPage;
ReporteDocentesEspecialistasPage.Auth = PrivateRouteEspecialista;