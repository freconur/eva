import React from 'react';
import AgregarDimensionEspecialistas from '@/modals/AgregarDimensionEspecialistas';
import { ModalAgregarDimensionProps } from '../types';

export const ModalAgregarDimension: React.FC<ModalAgregarDimensionProps> = ({
  idEvaluacion,
  collectionName,
  onClose,
  onSuccess,
  handleShowModalDimension,
}) => {
  return (
    <AgregarDimensionEspecialistas
      idEvaluacion={idEvaluacion}
      collectionName={collectionName}
      onClose={onClose}
      onSuccess={onSuccess}
      handleShowModalDimension={handleShowModalDimension}
    />
  );
};

export default ModalAgregarDimension;
