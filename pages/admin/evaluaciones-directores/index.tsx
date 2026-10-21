import React from 'react';
import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes';
import EvaluacionesListContainer from '@/components/evaluaciones-desempeno/containers/EvaluacionesListContainer';

const EvaluacionesDirectoresAdminPage = () => {
  return (
    <EvaluacionesListContainer
      role="director"
      title="Evaluaciones de Desempeño del Directivo"
      collectionName="evaluaciones-director"
      baseDetailRoute="/admin/evaluaciones-directores/evaluacion"
      canCreate={true}
    />
  );
};

EvaluacionesDirectoresAdminPage.Auth = PrivateRouteAdmins;
export default EvaluacionesDirectoresAdminPage;
