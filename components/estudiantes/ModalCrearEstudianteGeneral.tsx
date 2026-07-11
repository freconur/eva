import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { RiCloseLine, RiUserAddLine, RiLoader4Line } from 'react-icons/ri';
import { gradosDeColegio, sectionByGrade, genero } from '@/fuctions/regiones';
import { EstudianteImportado } from '@/features/types/estudiante';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { toast } from 'react-toastify';

interface ModalCrearEstudianteGeneralProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'create' | 'edit';
    estudianteData?: {
        dni?: string;
        nombresApellidos?: string;
        grado?: string | number;
        seccion?: string;
        genero?: string;
    } | null;
    onSuccess?: () => void;
}

const ModalCrearEstudianteGeneral: React.FC<ModalCrearEstudianteGeneralProps> = ({
    isOpen,
    onClose,
    mode = 'create',
    estudianteData,
    onSuccess,
}) => {
    const { crearEstudianteIndividual, actualizarEstudiante, loaderCrearEstudiantes } = useAgregarEvaluaciones();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && estudianteData) {
                reset({
                    dni: estudianteData.dni || '',
                    nombresApellidos: estudianteData.nombresApellidos || '',
                    grado: estudianteData.grado !== undefined ? String(estudianteData.grado) : '',
                    seccion: estudianteData.seccion || '',
                    genero: estudianteData.genero || '',
                });
            } else {
                reset({
                    dni: '',
                    nombresApellidos: '',
                    grado: '',
                    seccion: '',
                    genero: '',
                });
            }
            setErrorMessage(null);
        }
    }, [isOpen, mode, estudianteData, reset]);

    const onSubmit = async (data: any) => {
        try {
            setErrorMessage(null);

            const estudiante: EstudianteImportado = {
                id: data.dni,
                dni: data.dni,
                nombresApellidos: data.nombresApellidos.trim(),
                grado: data.grado,
                seccion: data.seccion,
                genero: data.genero,
                isValid: true,
                errors: [],
            };

            if (mode === 'edit') {
                await actualizarEstudiante(estudiante);
                toast.success('Estudiante actualizado exitosamente');
                if (onSuccess) {
                    onSuccess();
                }
                handleClose();
            } else {
                await crearEstudianteIndividual(estudiante);
                toast.success('Estudiante creado exitosamente');
                if (onSuccess) {
                    onSuccess();
                }
                // Reset form fields but preserve grade/section/gender to facilitate multi-student registration
                reset({
                    dni: '',
                    nombresApellidos: '',
                    grado: data.grado,
                    seccion: data.seccion,
                    genero: data.genero,
                });
            }
        } catch (error: any) {
            console.error('Error al procesar estudiante:', error);
            setErrorMessage(error.message || `Error al ${mode === 'edit' ? 'actualizar' : 'crear'} el estudiante`);
            toast.error(error.message || `Error al ${mode === 'edit' ? 'actualizar' : 'crear'} el estudiante`);
        }
    };

    const handleClose = () => {
        reset();
        setErrorMessage(null);
        onClose();
    };

    let container: HTMLElement | null = null;
    if (typeof window !== "undefined") {
        container = document.getElementById("portal-modal");
    }

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm animate-backdrop-fade">
            <style>{`
                @keyframes backdropFadeIn {
                    from { opacity: 0; backdrop-filter: blur(0px); }
                    to { opacity: 1; backdrop-filter: blur(4px); }
                }
                @keyframes modalEntrance {
                    from { opacity: 0; transform: scale(0.95) translateY(15px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-backdrop-fade {
                    animation: backdropFadeIn 0.2s ease-out forwards;
                }
                .animate-modal-entrance {
                    animation: modalEntrance 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
            `}</style>
            <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl animate-modal-entrance">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <h3 className="flex items-center text-lg font-bold text-gray-800">
                        <RiUserAddLine className="mr-2 text-colorTercero text-xl" />
                        {mode === 'edit' ? 'Editar Estudiante' : 'Agregar Nuevo Estudiante'}
                    </h3>
                    <button
                        onClick={handleClose}
                        className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        aria-label="Cerrar"
                    >
                        <RiCloseLine className="text-2xl" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                    {errorMessage && (
                        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                            {errorMessage}
                        </div>
                    )}

                    {/* DNI */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
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
                            placeholder="Ingrese 8 dígitos de DNI"
                            disabled={mode === 'edit'}
                            className={`w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-colorTercero focus:ring-2 focus:ring-colorTercero focus:ring-opacity-20 outline-none transition-all ${
                                mode === 'edit' ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100' : 'bg-white'
                            }`}
                        />
                        {errors.dni && (
                            <span className="mt-1 block text-xs text-red-500">{errors.dni.message as string}</span>
                        )}
                    </div>

                    {/* Nombres y Apellidos */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            Nombres y Apellidos *
                        </label>
                        <input
                            {...register('nombresApellidos', {
                                required: 'Los nombres y apellidos son requeridos',
                                minLength: { value: 2, message: 'Debe tener al menos 2 caracteres' },
                                maxLength: { value: 100, message: 'Máximo 100 caracteres' },
                            })}
                            type="text"
                            placeholder="Ej: Pérez Quispe, Juan Carlos"
                            className="w-full rounded-xl border border-gray-200 p-3 text-sm bg-white focus:border-colorTercero focus:ring-2 focus:ring-colorTercero focus:ring-opacity-20 outline-none transition-all"
                        />
                        {errors.nombresApellidos && (
                            <span className="mt-1 block text-xs text-red-500">
                                {errors.nombresApellidos.message as string}
                            </span>
                        )}
                    </div>

                    {/* Grado y Sección */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                Grado *
                            </label>
                            <select
                                {...register('grado', { required: 'El grado es requerido' })}
                                className="w-full rounded-xl border border-gray-200 p-3 text-sm bg-white focus:border-colorTercero focus:ring-2 focus:ring-colorTercero focus:ring-opacity-20 outline-none transition-all"
                            >
                                <option value="">-- Seleccione --</option>
                                {gradosDeColegio.map((grado) => (
                                    <option key={grado.id} value={grado.id}>
                                        {grado.name}
                                    </option>
                                ))}
                            </select>
                            {errors.grado && (
                                <span className="mt-1 block text-xs text-red-500">{errors.grado.message as string}</span>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                Sección *
                            </label>
                            <select
                                {...register('seccion', { required: 'La sección es requerida' })}
                                className="w-full rounded-xl border border-gray-200 p-3 text-sm bg-white focus:border-colorTercero focus:ring-2 focus:ring-colorTercero focus:ring-opacity-20 outline-none transition-all"
                            >
                                <option value="">-- Seleccione --</option>
                                {sectionByGrade.map((seccion) => (
                                    <option key={seccion.id} value={seccion.id}>
                                        {seccion.name.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                            {errors.seccion && (
                                <span className="mt-1 block text-xs text-red-500">
                                    {errors.seccion.message as string}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Género */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            Género *
                        </label>
                        <select
                            {...register('genero', { required: 'El género es requerido' })}
                            className="w-full rounded-xl border border-gray-200 p-3 text-sm bg-white focus:border-colorTercero focus:ring-2 focus:ring-colorTercero focus:ring-opacity-20 outline-none transition-all"
                        >
                            <option value="">-- Seleccione --</option>
                            {genero.map((gen) => (
                                <option key={gen.id} value={gen.id}>
                                    {gen.name.toUpperCase()}
                                </option>
                            ))}
                        </select>
                        {errors.genero && (
                            <span className="mt-1 block text-xs text-red-500">{errors.genero.message as string}</span>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end space-x-3 border-t border-gray-100 pt-4 mt-6">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loaderCrearEstudiantes}
                            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-colorTercero hover:bg-opacity-90 rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                        >
                            {loaderCrearEstudiantes ? (
                                <RiLoader4Line className="mr-2 animate-spin text-lg" />
                            ) : (
                                <RiUserAddLine className="mr-2" />
                            )}
                            {loaderCrearEstudiantes ? 'Procesando...' : mode === 'edit' ? 'Guardar Cambios' : 'Registrar Estudiante'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return container ? createPortal(modalContent, container) : null;
};

export default ModalCrearEstudianteGeneral;
