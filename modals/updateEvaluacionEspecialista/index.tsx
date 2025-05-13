import { CrearEvaluacionDocente } from '@/features/types/types';
import React, { useState } from 'react'
import { createPortal } from 'react-dom';
import styles from './styles.module.css';
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas';

interface Props {
  evaluacion: CrearEvaluacionDocente,
  handleShowInputUpdate: () => void
}

const UpdateEvaluacionEspecialista = ({evaluacion, handleShowInputUpdate}:Props) => { 
  const [name, setName] = useState(evaluacion.name || '');
  const { updateEvaluacionEspecialista } = UseEvaluacionEspecialistas()
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      updateEvaluacionEspecialista(`${evaluacion.id}`, name)
      handleShowInputUpdate()
    } catch (error) {
      console.error('Error al actualizar:', error);
    }
  };

  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }
  return container 
  ? createPortal(
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div onClick={handleShowInputUpdate} className={styles.modalClose}>
          cerrar
        </div>
        <div className={styles.modalHeader}>
          <h1 className={styles.modalTitle}>Actualizar evaluación de desempeño</h1>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.inputContainer}>
            <label className={styles.modalText}>Nombre:</label>
            <input 
              type="text" 
              value={name}
              onChange={handleChange}
              className={styles.modalInput}
            />
          </div>
          <button 
            onClick={handleSubmit}
            className={styles.submitButton}
          >
            Actualizar
          </button>
        </div>
      </div>
    </div>,
    container
  )
  : null
}

export default UpdateEvaluacionEspecialista