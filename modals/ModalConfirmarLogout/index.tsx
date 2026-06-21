import React from 'react'
import { createPortal } from 'react-dom'
import { FiLogOut, FiAlertTriangle } from 'react-icons/fi'
import styles from './styles.module.css'

interface ModalConfirmarLogoutProps {
  onClose: () => void
  onConfirm: () => void
}

const ModalConfirmarLogout: React.FC<ModalConfirmarLogoutProps> = ({ onClose, onConfirm }) => {
  let container: HTMLElement | null = null;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }

  // Handle click on background overlay to close
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const content = (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modalCard}>
        <FiLogOut className={styles.headerIconBg} />
        
        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar modal">
          ×
        </button>

        <div className={styles.content}>
          <div className={styles.warningIconContainer}>
            <FiAlertTriangle />
          </div>

          <h3 className={styles.title}>¿Cerrar Sesión?</h3>
          <p className={styles.message}>
            Estás a punto de salir del sistema. ¿Estás seguro que deseas cerrar tu sesión?
          </p>

          <div className={styles.buttonGroup}>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>
              CANCELAR
            </button>
            <button className={`${styles.btn} ${styles.btnConfirm}`} onClick={onConfirm}>
              CERRAR SESIÓN
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return container ? createPortal(content, container) : null;
}

export default ModalConfirmarLogout
