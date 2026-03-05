import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './styles.module.css';
import useUsuario from '@/features/hooks/useUsuario';
import { User } from '@/features/types/types';

interface Props {
    userData: User;
    onClose: () => void;
    onSuccess: () => void;
}

const ModalUpdateCliente = ({ userData, onClose, onSuccess }: Props) => {
    const [formData, setFormData] = useState({
        nombres: userData.nombres || '',
        apellidos: userData.apellidos || '',
    });
    const [loading, setLoading] = useState(false);
    const { updateUsuarioById } = useUsuario();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const identifier = userData.id || userData.dni;
        if (!identifier) return;

        setLoading(true);
        try {
            const res = await updateUsuarioById(identifier, formData);
            if (res) {
                onSuccess();
                onClose();
            }
        } finally {
            setLoading(false);
        }
    };

    let container;
    if (typeof window !== 'undefined') {
        container = document.getElementById('portal-modal');
    }

    if (!container) return null;

    return createPortal(
        <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Editar Mis Datos</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={styles.closeIcon}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Nombres</label>
                        <input
                            type="text"
                            name="nombres"
                            value={formData.nombres}
                            onChange={handleChange}
                            className={styles.input}
                            placeholder="Ingrese sus nombres"
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Apellidos</label>
                        <input
                            type="text"
                            name="apellidos"
                            value={formData.apellidos}
                            onChange={handleChange}
                            className={styles.input}
                            placeholder="Ingrese sus apellidos"
                            required
                        />
                    </div>
                    <div className={styles.formFooter}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={`${styles.button} ${styles.cancelButton}`}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={`${styles.button} ${styles.submitButton}`}
                            disabled={loading}
                        >
                            {loading ? (
                                <div className={styles.buttonContent}>
                                    <div className={styles.loader}></div>
                                    Guardando...
                                </div>
                            ) : (
                                'Guardar Cambios'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        container
    );
};

export default ModalUpdateCliente;
