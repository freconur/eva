import React from 'react';
import ConfigurarFaseEspecialistas from '@/modals/ConfigurarFaseEspecialistas';
import { ModalConfigurarFaseProps } from '../types';

export const ModalConfigurarFase: React.FC<ModalConfigurarFaseProps> = ({
  idEvaluacion,
  collectionName,
  faseActual,
  onClose,
  onSuccess,
  handleShowConfigurarFase,
}) => {
  return (
    <ConfigurarFaseEspecialistas
      idEvaluacion={idEvaluacion}
      collectionName={collectionName}
      faseActual={faseActual}
      onClose={onClose}
      onSuccess={onSuccess}
      handleShowConfigurarFase={handleShowConfigurarFase}
    />
  );
};

export default ModalConfigurarFase;
