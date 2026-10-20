import React from 'react';
import { useRouter } from 'next/router';
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores';
import { ReporteGeneralDesempenoContainer } from '@/components/evaluaciones-desempeno/containers';

const ReporteDocentesDirectoresPage = () => {
  const router = useRouter();
  const idEvaluacion = (router.query.idEvaluacion as string) || (router.query.id as string) || '';

  return (
    <ReporteGeneralDesempenoContainer
      id={idEvaluacion}
      collectionName="evaluaciones-docentes"
      role="director"
      targetTitle="Docentes Evaluados"
      targetNoun="docentes"
      targetNounSingular="Docente"
      backHref={`/directores/evaluaciones-docentes/evaluacion/${idEvaluacion}`}
    />
  );
};

export default ReporteDocentesDirectoresPage;
ReporteDocentesDirectoresPage.Auth = PrivateRouteDirectores;