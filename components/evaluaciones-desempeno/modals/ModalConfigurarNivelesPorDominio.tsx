import React from 'react';
import ConfigurarNivelesPorDominio from '@/modals/ConfigurarNivelesPorDominio';
import { ModalConfigurarNivelesPorDominioProps } from '../types';

export const ModalConfigurarNivelesPorDominio: React.FC<ModalConfigurarNivelesPorDominioProps> = ({
  idEvaluacion,
  collectionName,
  dimensiones,
  preguntas,
  escala,
  initialDimensionId,
  onClose,
  onSuccess,
  handleShowModal,
}) => {
  return (
    <ConfigurarNivelesPorDominio
      idEvaluacion={idEvaluacion}
      collectionName={collectionName}
      dimensiones={dimensiones}
      preguntas={preguntas}
      escala={escala}
      initialDimensionId={initialDimensionId}
      onClose={onClose}
      onSuccess={onSuccess}
      handleShowModal={handleShowModal}
    />
  );
};

export default ModalConfigurarNivelesPorDominio;
