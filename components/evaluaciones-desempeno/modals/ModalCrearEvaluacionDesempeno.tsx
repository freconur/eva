import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { RiLoader4Line } from 'react-icons/ri';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import useEvaluacionDesempenoBase from '@/features/hooks/useEvaluacionDesempenoBase';
import { ModalBaseProps } from '../types';
import { DEFAULT_ESCALA_DIRECTOR, DEFAULT_NIVELES_DIRECTOR } from '@/features/types/types';
import styles from '@/modals/crearEvaluacionEspecialista/crearEvaluacionDocentes.module.css';

export interface ModalCrearEvaluacionDesempenoProps extends ModalBaseProps {
  title?: string;
  onSuccess?: () => void;
  handleShowModalCrearEvaluacion?: () => void;
}

export const ModalCrearEvaluacionDesempeno: React.FC<ModalCrearEvaluacionDesempenoProps> = ({
  collectionName = 'evaluaciones-docentes',
  title,
  onClose,
  onSuccess,
  handleShowModalCrearEvaluacion,
}) => {
  const { loaderModales } = useGlobalContext();
  const { createEvaluacion } = useEvaluacionDesempenoBase({ collectionName });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeHandler = onClose || handleShowModalCrearEvaluacion;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      categoria: '',
      faseNombre: 'Fase Diagnóstica',
    },
  });

  const onSubmit = handleSubmit(async (data: any) => {
    try {
      const isDirector = collectionName.includes('director');
      await createEvaluacion({
        name: data.name.trim(),
        categoria: String(data.categoria).trim(),
        faseNombre: String(data.faseNombre || '').trim() || 'Fase Diagnóstica',
        active: false,
        ...(isDirector
          ? {
              escala: DEFAULT_ESCALA_DIRECTOR,
              niveles: DEFAULT_NIVELES_DIRECTOR,
              nivelYPuntaje: DEFAULT_NIVELES_DIRECTOR,
            }
          : {}),
      });
      reset();
      if (onSuccess) onSuccess();
      if (closeHandler) closeHandler();
    } catch (error) {
      console.error('Error al crear evaluación:', error);
    }
  });

  if (!mounted || typeof window === 'undefined') return null;

  const container = document.getElementById('portal-modal') || document.body;

  const displayTitle =
    title ||
    (collectionName.includes('docente')
      ? 'Crear Evaluación de Docente'
      : collectionName.includes('director')
      ? 'Crear Evaluación de Director'
      : 'Crear Evaluación de Especialista');

  return createPortal(
    <div
      className={styles.containerModal}
      onClick={(e) => e.target === e.currentTarget && closeHandler?.()}
      onKeyDown={(e) => e.key === 'Escape' && closeHandler?.()}
    >
      <div className={styles.containerSale}>
        <div className={styles.closeModalContainer}>
          <div className={styles.close} onClick={closeHandler}>
            cerrar
          </div>
        </div>

        <h3 className={styles.title}>{displayTitle}</h3>

        <form onSubmit={onSubmit}>
          <div className="w-full my-4">
            <p className="text-sm font-medium text-slate-700 mb-2">Nombre de la evaluación</p>
            <input
              {...register('name', {
                required: { value: true, message: 'nombre de evaluación es requerido' },
                minLength: { value: 2, message: 'nombre debe tener un minimo de 2 caracteres' },
                maxLength: { value: 50, message: 'nombre debe tener un maximo de 50 caracteres' },
              })}
              autoFocus
              className={styles.inputNombresDni}
              type="text"
              placeholder="Ej. Evaluación de Desempeño Q1"
            />
            {errors.name && (
              <span className="text-red-500 text-xs mt-1 block">
                {errors.name.message as string}
              </span>
            )}
          </div>

          <div className="w-full mb-4">
            <p className="text-sm font-medium text-slate-700 mb-2">Nombre de la primera etapa / fase</p>
            <input
              {...register('faseNombre', {
                required: { value: true, message: 'nombre de la etapa es requerido' },
                minLength: { value: 2, message: 'debe tener un mínimo de 2 caracteres' },
                maxLength: { value: 50, message: 'debe tener un máximo de 50 caracteres' },
              })}
              className={styles.inputNombresDni}
              type="text"
              placeholder="Ej. Octubre, Ronda I, Diagnóstica..."
            />
            {errors.faseNombre && (
              <span className="text-red-500 text-xs mt-1 block">
                {errors.faseNombre.message as string}
              </span>
            )}
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium text-slate-700 mb-2">Categoría</p>
            <select
              {...register('categoria', {
                required: { value: true, message: 'categoria es requerido' },
              })}
              className="w-full rounded-lg border-1.5 border-slate-200 outline-none p-3 bg-slate-50 text-slate-900 focus:bg-white focus:border-indigo-500 transition-all text-sm appearance-none cursor-pointer"
              style={{ border: '1.5px solid #e2e8f0' }}
            >
              <option value="">Seleccione una categoría</option>
              <option value="SEGUIMIENTO">SEGUIMIENTO</option>
              <option value="RETROALIMENTACIÓN">RETROALIMENTACIÓN</option>
            </select>
            {errors.categoria && (
              <span className="text-red-500 text-xs mt-1 block">
                {errors.categoria.message as string}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || loaderModales}
            className={styles.buttonCrearEvaluacion}
          >
            {isSubmitting || loaderModales ? (
              <div className="flex items-center justify-center gap-2">
                <RiLoader4Line className="animate-spin text-xl text-white" />
                <span>Guardando...</span>
              </div>
            ) : (
              'Guardar'
            )}
          </button>
        </form>
      </div>
    </div>,
    container
  );
};

export default ModalCrearEvaluacionDesempeno;
