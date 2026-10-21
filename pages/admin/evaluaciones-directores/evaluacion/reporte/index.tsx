import React from 'react';
import { useRouter } from 'next/router';
import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes';
import { ReporteGeneralDesempenoContainer } from '@/components/evaluaciones-desempeno/containers';

const ReporteDirectoresAdminPage = () => {
  const router = useRouter();
  const idEvaluacion = (router.query.idEvaluacion as string) || (router.query.id as string) || '';

  return (
    <ReporteGeneralDesempenoContainer
      id={idEvaluacion}
      collectionName="evaluaciones-director"
      role="admin"
      targetTitle="Directores Evaluados"
      targetNoun="directores"
      targetNounSingular="Director"
      backHref={`/admin/evaluaciones-directores/evaluacion/${idEvaluacion}`}
    />
  );
};

export default ReporteDirectoresAdminPage;
ReporteDirectoresAdminPage.Auth = PrivateRouteAdmins;
