import React from 'react';
import { useRouter } from 'next/router';
import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes';
import { ReporteGeneralDesempenoContainer } from '@/components/evaluaciones-desempeno/containers';

const ReporteDocentesAdminPage = () => {
  const router = useRouter();
  const idEvaluacion = (router.query.idEvaluacion as string) || (router.query.id as string) || '';

  return (
    <ReporteGeneralDesempenoContainer
      id={idEvaluacion}
      collectionName="evaluaciones-docentes"
      role="admin"
      targetTitle="Docentes Evaluados"
      targetNoun="docentes"
      targetNounSingular="Docente"
      backHref={`/admin/evaluaciones-docentes/evaluacion/${idEvaluacion}`}
    />
  );
};

export default ReporteDocentesAdminPage;
ReporteDocentesAdminPage.Auth = PrivateRouteAdmins;