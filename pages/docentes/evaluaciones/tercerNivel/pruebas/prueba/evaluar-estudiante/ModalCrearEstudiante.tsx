import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { RiCloseLine, RiUserAddLine } from 'react-icons/ri';
import { gradosDeColegio, sectionByGrade, genero } from '@/fuctions/regiones';
import { EstudianteImportado } from '@/features/types/estudiante';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import Loader from '@/components/loader/loader';
import styles from './ModalImportarEstudiantes.module.css';

interface ModalCrearEstudianteProps {
    isOpen: boolean;
    onClose: () => void;
    gradoEvaluacion: string;
    mode?: 'create' | 'edit';
    estudianteData?: {
        dni: string;
        nombresApellidos: string;
        grado: string;
        seccion: string;
        genero: string;
    };
    onSuccess?: () => void; // Callback para notificar éxito
}

const ModalCrearEstudiante: React.FC<ModalCrearEstudianteProps> = ({
    isOpen,
    onClose,
    gradoEvaluacion,
    mode = 'create',
    estudianteData,
    onSuccess,
}) => {
    const { crearEstudianteIndividual, actualizarEstudiante, loaderCrearEstudiantes } = useAgregarEvaluaciones();
    const [showSuccess, setShowSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    // Resetear el formulario cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && estudianteData) {
                // Modo edición: pre-llenar con datos del estudiante
                reset({
                    dni: estudianteData.dni,
                    nombresApellidos: estudianteData.nombresApellidos,
                    grado: estudianteData.grado,
                    seccion: estudianteData.seccion,
                    genero: estudianteData.genero,
                });
            } else {
                // Modo creación: formulario vacío
                reset({
                    dni: '',
                    nombresApellidos: '',
                    grado: gradoEvaluacion || '',
                    seccion: '',
                    genero: '',
                });
            }
            setShowSuccess(false);
            setErrorMessage(null);
        }
    }, [isOpen, gradoEvaluacion, mode, estudianteData, reset]);

    const onSubmit = async (data: any) => {
        try {
            setErrorMessage(null);

            const estudiante: EstudianteImportado = {
                id: data.dni,
                dni: data.dni,
                nombresApellidos: data.nombresApellidos,
                grado: data.grado,
                seccion: data.seccion,
                genero: data.genero,
                isValid: true,
                errors: [],
            };

            // Llamar a la función apropiada según el modo
            if (mode === 'edit') {
                await actualizarEstudiante(estudiante);
            } else {
                await crearEstudianteIndividual(estudiante);
            }

            // Mostrar mensaje de éxito
            setShowSuccess(true);

            // Notificar al componente padre
            if (onSuccess) {
                onSuccess();
            }

            // Cerrar el modal después de 2 segundos
            setTimeout(() => {
                setShowSuccess(false);
                reset();
                onClose();
            }, 2000);
        } catch (error: any) {
            console.error('Error al procesar estudiante:', error);
            setErrorMessage(error.message || `Error al ${mode === 'edit' ? 'actualizar' : 'crear'} el estudiante`);
        }
    };

    const handleClose = () => {
        reset();
        setShowSuccess(false);
        setErrorMessage(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={handleClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                {/* Header del modal */}
                <div className={styles.modalHeader}>
                    <div className={styles.headerContent}>
                        <h2 className={styles.modalTitle}>
                            <RiUserAddLine style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            {mode === 'edit' ? 'Editar Estudiante' : 'Crear Estudiante'}
                        </h2>
                    </div>

                    <button
                        className={styles.closeButton}
                        onClick={handleClose}
                        aria-label="Cerrar modal"
                    >
                        <RiCloseLine className={styles.closeIcon} />
                    </button>
                </div>

                {/* Contenido del modal */}
                <div className={styles.modalBody}>
                    {showSuccess ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px 20px',
                            color: '#10B981',
                        }}>
                            <div style={{
                                fontSize: '48px',
                                marginBottom: '16px',
                            }}>✓</div>
                            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                                ¡Estudiante {mode === 'edit' ? 'actualizado' : 'creado'} exitosamente!
                            </h3>
                            <p style={{ color: '#6B7280' }}>
                                El estudiante ha sido {mode === 'edit' ? 'actualizado' : 'registrado'} correctamente
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)}>
                            {/* Mensaje de error */}
                            {errorMessage && (
                                <div style={{
                                    backgroundColor: '#FEE2E2',
                                    border: '1px solid #EF4444',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    marginBottom: '20px',
                                    color: '#DC2626',
                                    fontSize: '14px',
                                }}>
                                    {errorMessage}
                                </div>
                            )}

                            {/* Campo DNI */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    marginBottom: '6px',
                                    color: '#374151',
                                }}>
                                    DNI *
                                </label>
                                <input
                                    {...register('dni', {
                                        required: 'El DNI es requerido',
                                        minLength: { value: 8, message: 'El DNI debe tener 8 dígitos' },
                                        maxLength: { value: 8, message: 'El DNI debe tener 8 dígitos' },
                                        pattern: { value: /^[0-9]+$/, message: 'El DNI solo debe contener números' },
                                    })}
                                    type="text"
                                    placeholder="Ingrese el DNI"
                                    disabled={mode === 'edit'}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #D1D5DB',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        backgroundColor: mode === 'edit' ? '#F3F4F6' : 'white',
                                        cursor: mode === 'edit' ? 'not-allowed' : 'text',
                                    }}
                                />
                                {errors.dni && (
                                    <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                        {errors.dni.message as string}
                                    </span>
                                )}
                            </div>

                            {/* Campo Nombres y Apellidos */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    marginBottom: '6px',
                                    color: '#374151',
                                }}>
                                    Nombres y Apellidos *
                                </label>
                                <input
                                    {...register('nombresApellidos', {
                                        required: 'Los nombres y apellidos son requeridos',
                                        minLength: { value: 2, message: 'Debe tener al menos 2 caracteres' },
                                        maxLength: { value: 100, message: 'Máximo 100 caracteres' },
                                    })}
                                    type="text"
                                    placeholder="Ingrese nombres y apellidos"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #D1D5DB',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                    }}
                                />
                                {errors.nombresApellidos && (
                                    <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                        {errors.nombresApellidos.message as string}
                                    </span>
                                )}
                            </div>

                            {/* Campo Grado */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    marginBottom: '6px',
                                    color: '#374151',
                                }}>
                                    Grado *
                                </label>
                                <select
                                    {...register('grado', { required: 'El grado es requerido' })}
                                    disabled
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #D1D5DB',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        backgroundColor: '#F3F4F6',
                                        cursor: 'not-allowed',
                                    }}
                                >
                                    <option value="">-- Seleccione un grado --</option>
                                    {gradosDeColegio.map((grado) => (
                                        <option key={grado.id} value={grado.id}>
                                            {grado.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.grado && (
                                    <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                        {errors.grado.message as string}
                                    </span>
                                )}
                            </div>

                            {/* Campo Sección */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    marginBottom: '6px',
                                    color: '#374151',
                                }}>
                                    Sección *
                                </label>
                                <select
                                    {...register('seccion', { required: 'La sección es requerida' })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #D1D5DB',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                    }}
                                >
                                    <option value="">-- Seleccione una sección --</option>
                                    {sectionByGrade.map((seccion) => (
                                        <option key={seccion.id} value={seccion.id}>
                                            {seccion.name.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                                {errors.seccion && (
                                    <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                        {errors.seccion.message as string}
                                    </span>
                                )}
                            </div>

                            {/* Campo Género */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    marginBottom: '6px',
                                    color: '#374151',
                                }}>
                                    Género *
                                </label>
                                <select
                                    {...register('genero', { required: 'El género es requerido' })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #D1D5DB',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                    }}
                                >
                                    <option value="">-- Seleccione un género --</option>
                                    {genero.map((gen) => (
                                        <option key={gen.id} value={gen.id}>
                                            {gen.name.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                                {errors.genero && (
                                    <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                        {errors.genero.message as string}
                                    </span>
                                )}
                            </div>

                            {/* Botones */}
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                justifyContent: 'flex-end',
                            }}>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#F3F4F6',
                                        color: '#374151',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loaderCrearEstudiantes}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: loaderCrearEstudiantes ? '#9CA3AF' : '#3B82F6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: loaderCrearEstudiantes ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    <RiUserAddLine />
                                    {loaderCrearEstudiantes ? (mode === 'edit' ? 'Actualizando...' : 'Creando...') : (mode === 'edit' ? 'Actualizar Estudiante' : 'Crear Estudiante')}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Loader overlay */}
                {loaderCrearEstudiantes && (
                    <div className={styles.loaderOverlay}>
                        <Loader
                            size="large"
                            variant="spinner"
                            text="Creando estudiante..."
                            color="#3b82f6"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModalCrearEstudiante;
