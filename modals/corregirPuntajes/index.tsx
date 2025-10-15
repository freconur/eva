import React from 'react';
import Loader from '@/components/loader/loader';
import styles from './corregirPuntajes.module.css';

interface CorregirPuntajesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  success: boolean;
  onCloseSuccess: () => void;
  error: boolean;
  onCloseError: () => void;
}

const CorregirPuntajesModal: React.FC<CorregirPuntajesModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  success,
  onCloseSuccess,
  error,
  onCloseError
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Corregir Puntajes</h2>
        </div>
        
        <div className={styles.modalBody}>
          {success ? (
            <div className={styles.successContainer}>
              <div className={styles.successIconContainer}>
                <span className={styles.successIcon}>✅</span>
              </div>
              <p className={styles.successMessage}>
                Se ha actualizado los puntajes de los estudiantes.
              </p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <div className={styles.errorIconContainer}>
                <span className={styles.errorIcon}>❌</span>
              </div>
              <p className={styles.errorMessage}>
                Parece que algo salió mal, intenta de nuevo, si el problema persiste contacta al administrador.
              </p>
            </div>
          ) : !loading ? (
            <div className={styles.messageContainer}>
              <div className={styles.iconContainer}>
                <span className={styles.icon}>🔧</span>
              </div>
              <p className={styles.message}>
                Esta opción te permitirá actualizar de manera correcta los puntajes de los estudiantes evaluados, 
                dale a corregir para actualizar.
              </p>
            </div>
          ) : (
            <div className={styles.loaderContainer}>
              <Loader 
                size="medium" 
                variant="spinner" 
                text="Corrigiendo puntajes..." 
                color="#3b82f6"
              />
            </div>
          )}
        </div>
        
        {!loading && !success && !error && (
          <div className={styles.modalFooter}>
            <button 
              className={styles.cancelButton}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button 
              className={styles.confirmButton}
              onClick={onConfirm}
            >
              Corregir
            </button>
          </div>
        )}
        
        {success && (
          <div className={styles.modalFooter}>
            <button 
              className={styles.okButton}
              onClick={onCloseSuccess}
            >
              OK
            </button>
          </div>
        )}

        {error && (
          <div className={styles.modalFooter}>
            <button 
              className={styles.okButton}
              onClick={onCloseError}
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CorregirPuntajesModal;
