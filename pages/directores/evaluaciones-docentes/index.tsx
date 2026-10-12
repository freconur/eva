import React from 'react';
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores';
import EvaluacionesListContainer from '@/components/evaluaciones-desempeno/containers/EvaluacionesListContainer';
import { useGlobalContext } from '@/features/context/GlolbalContext';

const EvaluacionesDocentesIndex = () => {
  const { currentUserData } = useGlobalContext();
  const isAdmin =
    currentUserData?.rol === 4 ||
    currentUserData?.rol === 0 ||
    currentUserData?.perfil?.rol === 4 ||
    currentUserData?.perfil?.rol === 0;

  return (
    <EvaluacionesListContainer
      role="director"
      title="Evaluaciones de Desempeño Docente"
      collectionName="evaluaciones-docentes"
      baseDetailRoute="/directores/evaluaciones-docentes/evaluacion"
      canCreate={isAdmin}
    />
  );
};

EvaluacionesDocentesIndex.Auth = PrivateRouteDirectores;
export default EvaluacionesDocentesIndex;
