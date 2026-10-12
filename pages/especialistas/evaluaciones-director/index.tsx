import React from 'react';
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista';
import EvaluacionesListContainer from '@/components/evaluaciones-desempeno/containers/EvaluacionesListContainer';
import { useGlobalContext } from '@/features/context/GlolbalContext';

const EvaluacionesDirectoresIndex = () => {
  const { currentUserData } = useGlobalContext();
  const isAdmin =
    currentUserData?.rol === 4 ||
    currentUserData?.rol === 0 ||
    currentUserData?.perfil?.rol === 4 ||
    currentUserData?.perfil?.rol === 0;

  return (
    <EvaluacionesListContainer
      role="especialista"
      title="Evaluaciones de Desempeño del Directivo"
      collectionName="evaluaciones-director"
      baseDetailRoute="/especialistas/evaluaciones-director/evaluacion"
      canCreate={isAdmin}
    />
  );
};

EvaluacionesDirectoresIndex.Auth = PrivateRouteEspecialista;
export default EvaluacionesDirectoresIndex;