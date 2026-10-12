import React from 'react';
import UpdateDimensionEspecialistas from '@/modals/UpdateDimensionEspecialistas';
import { ModalUpdateDimensionProps } from '../types';

export const ModalUpdateDimension: React.FC<ModalUpdateDimensionProps> = ({
  idEvaluacion,
  collectionName,
  dimensionUpdate,
  onClose,
  onSuccess,
  handleShowUpdateDimension,
}) => {
  return (
    <UpdateDimensionEspecialistas
      idEvaluacion={idEvaluacion}
      collectionName={collectionName}
      dimensionUpdate={dimensionUpdate}
      onClose={onClose}
      onSuccess={onSuccess}
      handleShowUpdateDimension={handleShowUpdateDimension}
    />
  );
};

export default ModalUpdateDimension;
