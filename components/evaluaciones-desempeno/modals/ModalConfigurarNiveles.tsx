import React from 'react';
import ConfigurarNivelesEspecialistas from '@/modals/ConfigurarNivelesEspecialistas';
import { ModalConfigurarNivelesProps } from '../types';

export const ModalConfigurarNiveles: React.FC<ModalConfigurarNivelesProps> = ({
  idEvaluacion,
  collectionName,
  nivelesActuales,
  onClose,
  onSuccess,
  handleShowConfigurarNiveles,
}) => {
  return (
    <ConfigurarNivelesEspecialistas
      idEvaluacion={idEvaluacion}
      collectionName={collectionName}
      nivelesActuales={nivelesActuales}
      onClose={onClose}
      onSuccess={onSuccess}
      handleShowConfigurarNiveles={handleShowConfigurarNiveles}
    />
  );
};

export default ModalConfigurarNiveles;
