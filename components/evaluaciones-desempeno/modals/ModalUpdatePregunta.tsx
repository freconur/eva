import React from 'react';
import UpdatePreguntaRespuestaEspecialistas from '@/modals/updatePrEspecialistas';
import { ModalUpdatePreguntaProps } from '../types';

export const ModalUpdatePregunta: React.FC<ModalUpdatePreguntaProps> = ({
  idEvaluacion,
  collectionName,
  dataUpdate,
  dimensiones,
  escala,
  onClose,
  onSuccess,
  handleShowUpdateModal,
}) => {
  return (
    <UpdatePreguntaRespuestaEspecialistas
      idEvaluacion={idEvaluacion}
      collectionName={collectionName}
      dataUpdate={dataUpdate}
      dimensiones={dimensiones}
      escala={escala}
      onClose={onClose}
      onSuccess={onSuccess}
      handleShowUpdateModal={handleShowUpdateModal}
    />
  );
};

export default ModalUpdatePregunta;
