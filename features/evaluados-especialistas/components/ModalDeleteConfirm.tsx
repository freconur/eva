import React from 'react';
import { MdWarning } from 'react-icons/md';
import styles from '../styles.module.css';

interface ModalDeleteConfirmProps {
	showConfirmDelete: boolean;
	evaluacionToDelete: { id: string; name: string } | null;
	isDeleting: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export const ModalDeleteConfirm: React.FC<ModalDeleteConfirmProps> = ({
	showConfirmDelete,
	evaluacionToDelete,
	isDeleting,
	onClose,
	onConfirm,
}) => {
	if (!showConfirmDelete) return null;

	return (
		<div className={styles.modalOverlay} onClick={() => !isDeleting && onClose()}>
			<div className={styles.modalContent} style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
				<div className={styles.modalBody}>
					<div className={styles.modalConfirm}>
						<MdWarning className={styles.modalConfirmIcon} />
						<h3 className={styles.modalConfirmTitle}>¿Eliminar evaluación?</h3>
						<p className={styles.modalConfirmText}>
							Estás a punto de eliminar la evaluación de <strong>{evaluacionToDelete?.name}</strong>.
							Esta acción no se puede deshacer.
						</p>
						<div className={styles.modalActions}>
							<button
								className={styles.cancelButton}
								onClick={onClose}
								disabled={isDeleting}
							>
								Cancelar
							</button>
							<button
								className={styles.confirmDeleteButton}
								onClick={onConfirm}
								disabled={isDeleting}
							>
								{isDeleting ? 'Eliminando...' : 'Eliminar permanentemente'}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
