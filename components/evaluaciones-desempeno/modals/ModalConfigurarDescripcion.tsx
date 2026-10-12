import React from 'react';
import ConfigurarDescripcionEspecialistas from '@/modals/ConfigurarDescripcionEspecialistas';
import { ModalConfigurarDescripcionProps } from '../types';

export const ModalConfigurarDescripcion: React.FC<ModalConfigurarDescripcionProps> = ({
  idEvaluacion,
  collectionName,
  descripcionActual,
  onClose,
  onSuccess,
  handleShowConfigurarDescripcion,
}) => {
  return (
    <ConfigurarDescripcionEspecialistas
      idEvaluacion={idEvaluacion}
      collectionName={collectionName}
      descripcionActual={descripcionActual}
      onClose={onClose}
      onSuccess={onSuccess}
      handleShowConfigurarDescripcion={handleShowConfigurarDescripcion}
    />
  );
};

export default ModalConfigurarDescripcion;
