import React from 'react';
import AgregarPreguntasRespuestasEspecialistas from '@/modals/AgregarPreguntasRespuestasEspecialistas';
import { ModalAgregarPreguntaProps } from '../types';

export const ModalAgregarPregunta: React.FC<ModalAgregarPreguntaProps> = ({
  idEvaluacion,
  collectionName,
  dimensiones,
  escala,
  onClose,
  onSuccess,
  handleShowModalPreguntas,
}) => {
  return (
    <AgregarPreguntasRespuestasEspecialistas
      idEvaluacion={idEvaluacion}
      collectionName={collectionName}
      dimensiones={dimensiones}
      escala={escala}
      onClose={onClose}
      onSuccess={onSuccess}
      handleShowModalPreguntas={handleShowModalPreguntas}
    />
  );
};

export default ModalAgregarPregunta;
