import { EvaluacionCurricular } from '@/features/types/types';
import React, { useState } from 'react'
import { createPortal } from 'react-dom';
import styles from './styles.module.css';
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular';

interface Props {
  evaluacion: EvaluacionCurricular,
  handleShowInputUpdate: () => void
}

const UpdateEvaluacionCoberturaCurricular = ({evaluacion, handleShowInputUpdate}:Props) => { 
  const [name, setName] = useState(evaluacion.name || '');
  const { updateEvaluacionCurricular } = useEvaluacionCurricular()
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      /* updateEvaluacionCurricular(`${evaluacion.id}`, name) */
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
          <h1 className={styles.modalTitle}>Actualizar cobertura curricular</h1>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.inputContainer}>
            <label className={styles.modalText}>Nivel Curricular:</label>
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

export default UpdateEvaluacionCoberturaCurricular