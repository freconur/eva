import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  MdClose,
  MdDonutLarge,
  MdAdd,
  MdDeleteOutline,
  MdRestartAlt,
  MdCheck,
  MdInfoOutline,
} from 'react-icons/md';
import { RiLoader4Line } from 'react-icons/ri';
import styles from './configurarNivelesActuacion.module.css';
import {
  NivelActuacionItem,
  useNivelesActuacionesConfig,
  DEFAULT_NIVELES_ACTUACIONES,
  validarNivelesActuacion,
} from '@/features/hooks/useNivelesActuacionesConfig';
import { useGlobalContext } from '@/features/context/GlolbalContext';

export interface ConfigurarNivelesActuacionModalProps {
  showModal: boolean;
  handleClose: () => void;
  onSuccess?: () => void;
}

const PALETA_SUGERIDA = [
  '#9ca3af', // Plomo (0 = Por desarrollar)
  '#9f4242', // Café (1 = Iniciándose)
  '#f97316', // Naranja (2 = Consolidación)
  '#8cb346', // Verde (3 o 4 = Autonomía)
  '#2563eb', // Azul Institucional
  '#8b5cf6', // Púrpura
  '#ef4444', // Rojo Coral
  '#06b6d4', // Cian
];

export const ConfigurarNivelesActuacionModal: React.FC<ConfigurarNivelesActuacionModalProps> = ({
  showModal,
  handleClose,
  onSuccess,
}) => {
  const [container, setContainer] = useState<Element | null>(null);
  const { niveles, loading, isSaving, guardarNiveles, restaurarValoresSugeridos } =
    useNivelesActuacionesConfig();
  const { currentUserData } = useGlobalContext();

  const [localNiveles, setLocalNiveles] = useState<NivelActuacionItem[]>(DEFAULT_NIVELES_ACTUACIONES);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  // Portal container
  useEffect(() => {
    setContainer(document.getElementById('portal-modal') || document.body);
  }, []);

  // Sincronizar niveles desde Firestore cuando se abre el modal
  useEffect(() => {
    if (showModal && niveles && niveles.length > 0) {
      setLocalNiveles(JSON.parse(JSON.stringify(niveles)));
      setErrorValidacion(null);
    }
  }, [showModal, niveles]);

  // Autofocus y tecla Escape
  useEffect(() => {
    if (!showModal) return;

    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 120);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal, isSaving, handleClose]);

  if (!showModal || !container) return null;

  // Handlers para editar un campo del nivel
  const handleUpdateNivel = (index: number, patch: Partial<NivelActuacionItem>) => {
    setErrorValidacion(null);
    setLocalNiveles((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  // Agregar nuevo nivel
  const handleAddNivel = () => {
    setErrorValidacion(null);
    setLocalNiveles((prev) => {
      const nextId = prev.length > 0 ? Math.max(...prev.map((n) => n.id)) + 1 : 1;
      const lastMax = prev.length > 0 ? Math.max(...prev.map((n) => n.max)) : 0;
      const nuevo: NivelActuacionItem = {
        id: nextId,
        key: `nivel_${nextId}`,
        nombre: `Nuevo Nivel ${nextId}`,
        min: lastMax + 1,
        max: lastMax + 1,
        color: PALETA_SUGERIDA[(nextId - 1) % PALETA_SUGERIDA.length] || '#2563eb',
        descripcion: 'Descripción pedagógica del nuevo nivel formativo.',
      };
      return [...prev, nuevo];
    });
  };

  // Eliminar nivel
  const handleDeleteNivel = (index: number) => {
    if (localNiveles.length <= 2) {
      setErrorValidacion('Debe conservar al menos dos niveles en la escala formativa.');
      return;
    }
    setErrorValidacion(null);
    setLocalNiveles((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Restaurar plantilla sugerida institucional
  const handleRestaurar = () => {
    setErrorValidacion(null);
    const sugeridos = restaurarValoresSugeridos();
    setLocalNiveles(JSON.parse(JSON.stringify(sugeridos)));
  };

  // Guardar en Firestore
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const val = validarNivelesActuacion(localNiveles);
    if (!val.valido) {
      setErrorValidacion(val.error || 'La configuración presenta errores.');
      return;
    }

    const res = await guardarNiveles(localNiveles, currentUserData?.email);
    if (res.ok) {
      onSuccess?.();
      handleClose();
    } else {
      setErrorValidacion(res.error || 'No se pudo guardar la configuración.');
    }
  };

  return createPortal(
    <div
      className={styles.modalOverlay}
      data-testid="configurar-niveles-actuacion-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) handleClose();
      }}
    >
      <div className={styles.modalContent} role="dialog" aria-modal="true">
        {/* Cabecera */}
        <div className={styles.modalHeader}>
          <div className="flex items-center gap-3">
            <div className={styles.headerIconWrapper}>
              <MdDonutLarge className="animate-spin-slow" />
            </div>
            <div className={styles.titleArea}>
              <h3 className={styles.modalTitle}>Configurar Niveles por Actuación</h3>
              <p className={styles.modalSubtitle}>
                Escala global de progresión continua para todas las evaluaciones progresivas
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            disabled={isSaving}
            aria-label="Cerrar modal"
          >
            <MdClose />
          </button>
        </div>

        {/* Banner Informativo */}
        <div className={styles.bannerInfo}>
          <MdInfoOutline className={styles.bannerIcon} />
          <div>
            <strong>Escala Global Progresiva:</strong> Define la denominación, rango de aciertos requeridos
            y color de los 4 niveles de logro formativo (<em>Por desarrollo</em>, <em>Iniciándose</em>,{' '}
            <em>Consolidación</em> y <em>Autonomía</em>). Esta escala se aplica automáticamente en la Diana
            Polar y los reportes evolutivos.
          </div>
        </div>

        {/* Error de validación en caso de inconsistencia */}
        {errorValidacion && (
          <div className="mx-6 mt-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center justify-between">
            <span>{errorValidacion}</span>
            <button
              type="button"
              onClick={() => setErrorValidacion(null)}
              className="text-rose-500 hover:text-rose-800 ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Formulario y listado de niveles */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <div className={styles.modalBody}>
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <RiLoader4Line className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-xs">Cargando configuración global...</span>
              </div>
            ) : (
              localNiveles.map((nivel, idx) => {
                return (
                  <div key={nivel.id || `lvl-${idx}`} className={styles.levelCard}>
                    {/* Encabezado del Nivel */}
                    <div className={styles.levelCardHeader}>
                      <div className="flex items-center gap-2">
                        <span
                          className={styles.levelBadgeNumber}
                          style={{ backgroundColor: nivel.color }}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Nivel {idx + 1}
                        </span>
                      </div>

                      {/* Previsualización en Vivo */}
                      <div className="flex items-center gap-2">
                        <span
                          className={styles.previewPill}
                          style={{
                            backgroundColor: `${nivel.color}18`,
                            color: nivel.color,
                            borderColor: `${nivel.color}40`,
                          }}
                        >
                          <span
                            className={styles.previewDot}
                            style={{ backgroundColor: nivel.color }}
                          />
                          <span>{nivel.nombre || 'Sin nombre'}</span>
                          <span className="text-[10px] opacity-75">
                            ({nivel.min} a {nivel.max} aciertos)
                          </span>
                        </span>

                        {localNiveles.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteNivel(idx)}
                            className={styles.deleteLevelBtn}
                            title="Eliminar este nivel"
                            aria-label={`Eliminar nivel ${nivel.nombre}`}
                          >
                            <MdDeleteOutline />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Campos de Edición */}
                    <div className={styles.levelFormGrid}>
                      {/* Nombre */}
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Nombre del Nivel</label>
                        <input
                          ref={idx === 0 ? firstInputRef : undefined}
                          type="text"
                          value={nivel.nombre}
                          onChange={(e) => handleUpdateNivel(idx, { nombre: e.target.value })}
                          className={styles.input}
                          placeholder="Ej. Por desarrollo"
                          required
                        />
                      </div>

                      {/* Rango de Aciertos */}
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Aciertos (Min - Max)</label>
                        <div className={styles.rangeInputs}>
                          <input
                            type="number"
                            min={0}
                            max={nivel.max}
                            value={nivel.min}
                            onChange={(e) =>
                              handleUpdateNivel(idx, { min: parseInt(e.target.value, 10) || 0 })
                            }
                            className={styles.numberInput}
                            title="Aciertos mínimos para alcanzar este nivel"
                          />
                          <span className="text-slate-400 font-bold text-xs">-</span>
                          <input
                            type="number"
                            min={nivel.min}
                            max={20}
                            value={nivel.max}
                            onChange={(e) =>
                              handleUpdateNivel(idx, { max: parseInt(e.target.value, 10) || 0 })
                            }
                            className={styles.numberInput}
                            title="Aciertos máximos para este nivel"
                          />
                        </div>
                      </div>

                      {/* Selector de Color */}
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Color Identificador</label>
                        <div className={styles.colorPickerWrapper}>
                          <input
                            type="color"
                            value={nivel.color}
                            onChange={(e) => handleUpdateNivel(idx, { color: e.target.value })}
                            className={styles.colorButton}
                            title="Seleccionar color personalizado"
                          />
                          {/* Mini paleta sugerida */}
                          <div className="flex items-center gap-1">
                            {PALETA_SUGERIDA.slice(0, 4).map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => handleUpdateNivel(idx, { color: c })}
                                className="w-4 h-4 rounded-full border border-white shadow-2xs cursor-pointer transition-transform hover:scale-125"
                                style={{ backgroundColor: c }}
                                title={`Aplicar color ${c}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Descripción Pedagógica Opcional */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Descripción Pedagógica / Criterio Formativo</label>
                      <input
                        type="text"
                        value={nivel.descripcion || ''}
                        onChange={(e) => handleUpdateNivel(idx, { descripcion: e.target.value })}
                        className={styles.input}
                        placeholder="Orientación sobre el grado de dominio del estudiante..."
                      />
                    </div>
                  </div>
                );
              })
            )}

            {/* Acciones secundarias en barra de herramientas */}
            <div className={styles.toolbarActions}>
              <button
                type="button"
                onClick={handleAddNivel}
                className={styles.secondaryBtn}
                title="Añadir un nuevo nivel a la escala"
              >
                <MdAdd className="text-blue-600" />
                <span>Agregar Nivel</span>
              </button>

              <button
                type="button"
                onClick={handleRestaurar}
                className={styles.secondaryBtn}
                title="Restaurar a los 4 niveles recomendados: Por desarrollo, Iniciándose, Consolidación, Autonomía"
              >
                <MdRestartAlt className="text-slate-500" />
                <span>Restaurar Plantilla Sugerida</span>
              </button>
            </div>
          </div>

          {/* Pie de Acciones */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={isSaving || loading}
            >
              {isSaving ? (
                <>
                  <RiLoader4Line className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <MdCheck className="w-4 h-4" />
                  <span>Guardar Configuración Global</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    container
  );
};

export default ConfigurarNivelesActuacionModal;
