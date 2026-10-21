import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './styles.module.css';
import useUsuario from '@/features/hooks/useUsuario';
import { User } from '@/features/types/types';
import { toast } from 'react-toastify';

interface Props {
    userData: User;
    onClose: () => void;
    onSuccess: () => void;
}

const ModalUpdateCliente = ({ userData, onClose, onSuccess }: Props) => {
    const rolNum = Number(userData?.perfil?.rol ?? userData?.rol);
    const isOnlyContact = rolNum === 2 || rolNum === 3;

    const [formData, setFormData] = useState({
        nombres: userData.nombres || '',
        apellidos: userData.apellidos || '',
        email: userData.email || '',
        celular: userData.celular || '',
    });
    const [loading, setLoading] = useState(false);
    const { updateUsuarioById } = useUsuario();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !loading) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, loading]);

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
            const payload = isOnlyContact
                ? {
                    email: formData.email.trim(),
                    celular: formData.celular.trim(),
                }
                : {
                    nombres: formData.nombres.trim(),
                    apellidos: formData.apellidos.trim(),
                    email: formData.email.trim(),
                    celular: formData.celular.trim(),
                };

            const res = await updateUsuarioById(identifier, payload);
            if (res) {
                toast.success('Datos actualizados correctamente');
                onSuccess();
                onClose();
            }
        } catch (err: any) {
            console.error('Error al actualizar datos:', err);
            toast.error(err?.message || 'Error al actualizar los datos');
        } finally {
            setLoading(false);
        }
    };

    let container;
    if (typeof window !== 'undefined') {
        container = document.getElementById('portal-modal') || document.body;
    }

    if (!container) return null;

    return createPortal(
        <div className={styles.modalOverlay} onClick={(e) => {
            if (e.target === e.currentTarget && !loading) onClose();
        }}>
            <div className={styles.modalContainer}>
                <div className={styles.modalHeader}>
                    <div>
                        <h2 className={styles.modalTitle}>
                            {isOnlyContact ? 'Actualizar Información de Contacto' : 'Editar Mis Datos'}
                        </h2>
                        {isOnlyContact && (
                            <p className="text-xs text-slate-500 mt-1">
                                Complete o actualice su correo electrónico y número telefónico institucional.
                            </p>
                        )}
                    </div>
                    <button type="button" onClick={onClose} disabled={loading} className={styles.closeButton} aria-label="Cerrar modal">
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
                        <label className={styles.label}>
                            Nombres {isOnlyContact && <span className="text-xs text-slate-400 font-normal ml-1">(Oficial DNI)</span>}
                        </label>
                        <input
                            type="text"
                            name="nombres"
                            value={formData.nombres}
                            onChange={handleChange}
                            className={`${styles.input} ${isOnlyContact ? 'bg-slate-100 text-slate-500 cursor-not-allowed select-none' : ''}`}
                            placeholder="Ingrese sus nombres"
                            disabled={isOnlyContact}
                            required={!isOnlyContact}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            Apellidos {isOnlyContact && <span className="text-xs text-slate-400 font-normal ml-1">(Oficial DNI)</span>}
                        </label>
                        <input
                            type="text"
                            name="apellidos"
                            value={formData.apellidos}
                            onChange={handleChange}
                            className={`${styles.input} ${isOnlyContact ? 'bg-slate-100 text-slate-500 cursor-not-allowed select-none' : ''}`}
                            placeholder="Ingrese sus apellidos"
                            disabled={isOnlyContact}
                            required={!isOnlyContact}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Correo Electrónico (Email)</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={styles.input}
                            placeholder="Ingrese su correo electrónico (ej. nombre@gmail.com)"
                            autoFocus={isOnlyContact}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Nº Celular / Teléfono</label>
                        <input
                            type="tel"
                            name="celular"
                            value={formData.celular}
                            onChange={handleChange}
                            className={styles.input}
                            placeholder="Ingrese su número de celular (ej. 987654321)"
                        />
                    </div>
                    <div className={styles.formFooter}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
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
