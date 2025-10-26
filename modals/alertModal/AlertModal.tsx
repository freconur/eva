import { createPortal } from "react-dom"
import styles from './AlertModal.module.css'

interface Props {
  message: string
  handleClose: () => void
}

const AlertModal = ({ message, handleClose }: Props) => {
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }

  return container
    ? createPortal(
      <div className={styles.containerModal}>
        <div className={styles.containerSale}>
          <div className={styles.header}>
            <h3 className={styles.title}>Advertencia</h3>
            <div className={styles.close} onClick={handleClose}>×</div>
          </div>
          <p className={styles.message}>
            {message}
          </p>
          <div className={styles.buttonContainer}>
            <button onClick={handleClose} className={styles.buttonAccept}>
              ACEPTAR
            </button>
          </div>
        </div>
      </div>,
      container
    )
    : null
}

export default AlertModal

