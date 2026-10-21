import React from 'react';
import { useRouter } from 'next/router';
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista';
import { ReporteGeneralDesempenoContainer } from '@/components/evaluaciones-desempeno/containers';

const ReporteDirectoresEspecialistaPage = () => {
  const router = useRouter();
  const idEvaluacion = (router.query.idEvaluacion as string) || (router.query.id as string) || '';

  return (
    <ReporteGeneralDesempenoContainer
      id={idEvaluacion}
      collectionName="evaluaciones-director"
      role="especialista"
      targetTitle="Directores Evaluados"
      targetNoun="directores"
      targetNounSingular="Director"
      backHref={`/especialistas/evaluaciones-director/evaluacion/${idEvaluacion}`}
    />
  );
};

export default ReporteDirectoresEspecialistaPage;
ReporteDirectoresEspecialistaPage.Auth = PrivateRouteEspecialista;
