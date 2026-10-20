import React from 'react';
import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes';
import EvaluacionesListContainer from '@/components/evaluaciones-desempeno/containers/EvaluacionesListContainer';

const EvaluacionesDocentesAdminIndex = () => {
  return (
    <EvaluacionesListContainer
      role="especialista"
      title="Evaluaciones de Desempeño Docente"
      collectionName="evaluaciones-docentes"
      baseDetailRoute="/admin/evaluaciones-docentes/evaluacion"
      canCreate={true}
    />
  );
};

EvaluacionesDocentesAdminIndex.Auth = PrivateRouteAdmins;
export default EvaluacionesDocentesAdminIndex;
