import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './styles.module.css';
import useUsuario from '@/features/hooks/useUsuario';
import { User } from '@/features/types/types';

interface Props {
  currentUserData: User;
}

const ModalTipoGestion = ({ currentUserData }: Props) => {
  const [selected, setSelected] = useState<'publico' | 'privado' | null>(null);
  const [loading, setLoading] = useState(false);
  const { updateTipoGestion } = useUsuario();

  const handleConfirm = async () => {
    if (!selected || !currentUserData.dni) return;
    setLoading(true);
    await updateTipoGestion(currentUserData.dni, selected);
    setLoading(false);
  };

  let container: HTMLElement | null = null;
  if (typeof window !== 'undefined') {
    container = document.getElementById('portal-modal');
  }
  if (!container) return null;

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.headerIcon}>
              <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
              <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
            </svg>
          </div>
          <h2 className={styles.title}>Clasifica tu institución</h2>
          <p className={styles.subtitle}>
            Hola, <strong>{currentUserData.nombres}</strong>. Para brindarte estadísticas y reportes
            precisos, necesitamos saber el tipo de gestión de{' '}
            <strong>{currentUserData.institucion || 'tu institución'}</strong>.
          </p>
          <p className={styles.note}>Esta acción solo se realiza una vez.</p>
        </div>

        {/* Tarjetas de selección */}
        <div className={styles.cardGrid}>
          {/* Pública */}
          <button
            type="button"
            onClick={() => setSelected('publico')}
            className={`${styles.card} ${selected === 'publico' ? styles.cardSelectedPublic : ''}`}
          >
            <div className={`${styles.cardIconWrapper} ${styles.publicIcon}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.cardIcon}>
                <path fillRule="evenodd" d="M3 2.25a.75.75 0 000 1.5v16.5h-.75a.75.75 0 000 1.5H15v-18a.75.75 0 000-1.5H3zM6.75 19.5v-2.25a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v2.25h-4.5zm0-6.75a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75zm.75-3.75a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3zM18.75 19.5v-11.25a.75.75 0 00-.75-.75H15v12h3.75zM6.75 8.25a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Pública</h3>
            <p className={styles.cardDesc}>Institución educativa de gestión estatal</p>
            {selected === 'publico' && (
              <div className={styles.checkBadge}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.checkIcon}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>

          {/* Privada */}
          <button
            type="button"
            onClick={() => setSelected('privado')}
            className={`${styles.card} ${selected === 'privado' ? styles.cardSelectedPrivate : ''}`}
          >
            <div className={`${styles.cardIconWrapper} ${styles.privateIcon}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.cardIcon}>
                <path d="M5.223 2.25c-.497 0-.974.198-1.325.55l-1.3 1.298A3.75 3.75 0 007.5 9.75c.627.47 1.406.75 2.25.75.844 0 1.624-.28 2.25-.75.626.47 1.406.75 2.25.75.844 0 1.623-.28 2.25-.75a3.75 3.75 0 004.902-5.652l-1.3-1.299a1.875 1.875 0 00-1.325-.549H5.223z" />
                <path fillRule="evenodd" d="M3 20.25v-8.755c1.42.674 3.08.673 4.5 0A5.234 5.234 0 009.75 12c.804 0 1.568-.182 2.25-.506a5.234 5.234 0 002.25.506c.804 0 1.567-.182 2.25-.506 1.42.674 3.08.675 4.5.001v8.755h.75a.75.75 0 010 1.5H2.25a.75.75 0 010-1.5H3zm3-6a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v3a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75v-3zm8.25-.75a.75.75 0 00-.75.75v5.25c0 .414.336.75.75.75h3a.75.75 0 00.75-.75v-5.25a.75.75 0 00-.75-.75h-3z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Privada</h3>
            <p className={styles.cardDesc}>Institución educativa de gestión privada</p>
            {selected === 'privado' && (
              <div className={styles.checkBadge}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.checkIcon}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selected || loading}
            className={`${styles.confirmBtn} ${selected === 'publico' ? styles.confirmPublic : selected === 'privado' ? styles.confirmPrivate : ''}`}
          >
            {loading ? (
              <span className={styles.btnContent}>
                <span className={styles.spinner} />
                Guardando...
              </span>
            ) : (
              'Confirmar selección'
            )}
          </button>
          {!selected && (
            <p className={styles.hintText}>Selecciona una opción para continuar</p>
          )}
        </div>

      </div>
    </div>,
    container
  );
};

export default ModalTipoGestion;
