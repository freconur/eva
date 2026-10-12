import React from 'react';
import ConfigurarEscalaEspecialistas from '@/modals/ConfigurarEscalaEspecialistas';
import { ModalConfigurarEscalaProps } from '../types';

export const ModalConfigurarEscala: React.FC<ModalConfigurarEscalaProps> = ({
  idEvaluacion,
  collectionName,
  escalaActual,
  onClose,
  onSuccess,
  handleShowConfigurarEscala,
}) => {
  return (
    <ConfigurarEscalaEspecialistas
      idEvaluacion={idEvaluacion}
      collectionName={collectionName}
      escalaActual={escalaActual}
      onClose={onClose}
      onSuccess={onSuccess}
      handleShowConfigurarEscala={handleShowConfigurarEscala}
    />
  );
};

export default ModalConfigurarEscala;
