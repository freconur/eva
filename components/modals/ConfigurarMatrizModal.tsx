import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  MdSettings,
  MdClose,
  MdSave,
  MdCheckCircle,
  MdSchool,
  MdCategory,
  MdAddCircleOutline,
  MdDeleteOutline,
  MdErrorOutline,
} from 'react-icons/md';
import { RiLoader4Line } from 'react-icons/ri';
import { Evaluaciones } from '@/features/types/types';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { getCategoriasParaGrado, categoriaTransform } from '@/fuctions/categorias';
import { gradosDeColegio, getGradoTexto } from '@/fuctions/regiones';
import styles from './ConfigurarMatrizModal.module.css';

export interface EtapaMatrizConfig {
  id: string; // ej: 'edi', 'ep1', 'ep2', 'ep3', 'ep4'
  codigo: string; // ej: 'EDI', 'EP1', 'EP2', 'EP3'
  nombre: string; // ej: 'Evaluación Diagnóstica / de Inicio', 'Evaluación Progresiva 3'
  subtitulo?: string;
  evaluacionId?: string;
}

export interface GradoConfigAssignment {
  gradoId?: number;
  categoriaId?: number;
  ediId?: string;
  ep1Id?: string;
  ep2Id?: string;
  etapas?: EtapaMatrizConfig[];
  updatedAt?: string;
  [key: string]: any;
}

/**
 * Obtiene la lista de etapas para una configuración dada,
 * garantizando compatibilidad hacia atrás con registros antiguos (ediId, ep1Id, ep2Id).
 */
export const getEtapasFromConfig = (config?: GradoConfigAssignment): EtapaMatrizConfig[] => {
  if (config?.etapas && Array.isArray(config.etapas) && config.etapas.length > 0) {
    return config.etapas.map((e) => ({
      ...e,
      id: e.id || e.codigo.toLowerCase(),
      codigo: e.codigo || e.id.toUpperCase(),
      evaluacionId: e.evaluacionId || '',
    }));
  }

  // Base estándar inicial: EDI, EP1, EP2
  const baseEtapas: EtapaMatrizConfig[] = [
    {
      id: 'edi',
      codigo: 'EDI',
      nombre: 'Evaluación Diagnóstica / de Inicio',
      subtitulo: 'Línea base al inicio del periodo (opcional)',
      evaluacionId: config?.ediId || '',
    },
    {
      id: 'ep1',
      codigo: 'EP1',
      nombre: 'Evaluación Progresiva 1',
      subtitulo: 'Primer hito de avance pedagógico (opcional)',
      evaluacionId: config?.ep1Id || '',
    },
    {
      id: 'ep2',
      codigo: 'EP2',
      nombre: 'Evaluación Progresiva 2',
      subtitulo: 'Segundo hito de avance (opcional / puede dejarse pendiente)',
      evaluacionId: config?.ep2Id || '',
    },
  ];

  // Si existen claves directas adicionales como ep3Id, ep4Id en el config, agregarlas
  if (config) {
    Object.keys(config).forEach((key) => {
      const match = key.match(/^ep(\d+)Id$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > 2) {
          const id = `ep${num}`;
          if (!baseEtapas.some((b) => b.id === id)) {
            baseEtapas.push({
              id,
              codigo: `EP${num}`,
              nombre: `Evaluación Progresiva ${num}`,
              subtitulo: `Hito ${num} de avance pedagógico (opcional)`,
              evaluacionId: String(config[key] || ''),
            });
          }
        }
      }
    });
  }

  return baseEtapas;
};

interface ConfigurarMatrizModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluaciones: Evaluaciones[];
  configGrados: Record<string, GradoConfigAssignment>;
  onSaveConfig: (gradoId: number, categoriaId: number, config: GradoConfigAssignment) => Promise<void>;
  initialGradoId?: number;
  initialCategoriaId?: number;
}

export const ConfigurarMatrizModal: React.FC<ConfigurarMatrizModalProps> = ({
  isOpen,
  onClose,
  evaluaciones = [],
  configGrados = {},
  onSaveConfig,
  initialGradoId = 2,
  initialCategoriaId = 2,
}) => {
  const { categorias: contextCategorias } = useGlobalContext();
  const [mounted, setMounted] = useState<boolean>(false);
  const [selectedGrado, setSelectedGrado] = useState<number>(initialGradoId);
  const [selectedCategoria, setSelectedCategoria] = useState<number>(initialCategoriaId || 2);
  const [etapas, setEtapas] = useState<EtapaMatrizConfig[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectGradoRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Autofocus y sincronización al abrir
  useEffect(() => {
    if (isOpen) {
      setSelectedGrado(initialGradoId);
      if (initialCategoriaId) {
        setSelectedCategoria(initialCategoriaId);
      }
      setTimeout(() => {
        selectGradoRef.current?.focus();
      }, 100);
      setSaveSuccess(false);
      setErrorMessage(null);
    }
  }, [isOpen, initialGradoId, initialCategoriaId]);

  // Categorías disponibles para el grado actual
  const categoriasDisponibles = getCategoriasParaGrado(
    selectedGrado,
    contextCategorias,
    evaluaciones
  );

  // Asegurar que selectedCategoria sea válida para el grado seleccionado
  useEffect(() => {
    if (categoriasDisponibles.length > 0) {
      const existe = categoriasDisponibles.some((c) => Number(c.id) === Number(selectedCategoria));
      if (!existe) {
        setSelectedCategoria(Number(categoriasDisponibles[0].id));
      }
    }
  }, [selectedGrado, categoriasDisponibles, selectedCategoria]);

  // Al cambiar grado, categoría o la configuración entrante, actualizar las etapas
  useEffect(() => {
    const key = `${selectedGrado}_${selectedCategoria}`;
    const currentCfg = configGrados[key] || configGrados[String(selectedGrado)] || {};
    const loadedEtapas = getEtapasFromConfig(currentCfg);
    setEtapas(loadedEtapas);
    setSaveSuccess(false);

    // Advertencia preventiva si la configuración ya tenía evaluaciones repetidas
    const idsAsignados = loadedEtapas
      .map((et) => (et.evaluacionId || '').trim())
      .filter(Boolean);
    const idDuplicado = idsAsignados.find(
      (id, index) => idsAsignados.indexOf(id) !== index
    );
    if (idDuplicado) {
      setErrorMessage(
        'Atención: esta configuración tiene evaluaciones repetidas entre etapas. Asigna pruebas distintas para cada etapa antes de guardar.'
      );
    } else {
      setErrorMessage(null);
    }
  }, [selectedGrado, selectedCategoria, configGrados]);

  // Modificar la evaluación asignada a una etapa con validación de no repetición
  const handleUpdateEvaluacion = (etapaId: string, evaluacionId: string) => {
    setErrorMessage(null);
    setSaveSuccess(false);

    if (evaluacionId) {
      const etapaEnUso = etapas.find(
        (et) => et.id !== etapaId && et.evaluacionId === evaluacionId
      );
      if (etapaEnUso) {
        const evalObj = evaluaciones.find((e) => e.id === evaluacionId);
        const evalNombre = evalObj?.nombre || 'La evaluación seleccionada';
        setErrorMessage(
          `No se puede repetir la evaluación: "${evalNombre}" ya está asignada en la etapa ${etapaEnUso.codigo}. Por favor, selecciona una prueba diferente.`
        );
        return;
      }
    }

    setEtapas((prev) =>
      prev.map((et) => (et.id === etapaId ? { ...et, evaluacionId } : et))
    );
  };

  // Número de la siguiente etapa sugerida (ej. EP3, EP4...)
  const nextStageNum = useMemo(() => {
    let nextNum = 1;
    etapas.forEach((et) => {
      const match = et.codigo.match(/EP\s*(\d+)/i) || et.id.match(/ep(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= nextNum) {
          nextNum = num + 1;
        }
      }
    });
    return nextNum <= 2 ? 3 : nextNum;
  }, [etapas]);

  // Agregar una nueva etapa dinámica (sugiere EP3, luego EP4, etc.)
  const handleAddEtapa = () => {
    setErrorMessage(null);
    const newId = `ep${nextStageNum}`;
    const newEtapa: EtapaMatrizConfig = {
      id: newId,
      codigo: `EP${nextStageNum}`,
      nombre: `Evaluación Progresiva ${nextStageNum}`,
      subtitulo: `Hito ${nextStageNum} de avance pedagógico`,
      evaluacionId: '',
    };

    setEtapas((prev) => [...prev, newEtapa]);
    setSaveSuccess(false);
  };

  // Eliminar una etapa
  const handleRemoveEtapa = (etapaId: string) => {
    if (etapas.length <= 1) return;
    setErrorMessage(null);
    setEtapas((prev) => prev.filter((et) => et.id !== etapaId));
    setSaveSuccess(false);
  };

  // Guardar configuración completa en Firestore
  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setErrorMessage(null);

    // Validación estricta: No permitir guardar con evaluaciones repetidas entre etapas
    const idsAsignados = etapas
      .map((et) => (et.evaluacionId || '').trim())
      .filter(Boolean);

    const idDuplicado = idsAsignados.find(
      (id, index) => idsAsignados.indexOf(id) !== index
    );

    if (idDuplicado) {
      const evalObj = evaluaciones.find((e) => e.id === idDuplicado);
      const evalNombre = evalObj?.nombre || 'Una evaluación';
      const etapasConDuplicado = etapas
        .filter((et) => (et.evaluacionId || '').trim() === idDuplicado)
        .map((et) => et.codigo)
        .join(' y ');

      setErrorMessage(
        `No se puede guardar: "${evalNombre}" está repetida entre las etapas ${etapasConDuplicado}. Cada etapa debe contar con una evaluación única.`
      );
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const cleanConfig: GradoConfigAssignment = {
        gradoId: selectedGrado,
        categoriaId: selectedCategoria,
        etapas: etapas.map((et) => ({
          id: et.id.trim(),
          codigo: et.codigo.trim(),
          nombre: et.nombre.trim(),
          subtitulo: (et.subtitulo || '').trim(),
          evaluacionId: (et.evaluacionId || '').trim(),
        })),
        updatedAt: new Date().toISOString(),
      };

      // Mapear campos directos retrocompatibles (ediId, ep1Id, ep2Id, ep3Id...)
      etapas.forEach((et) => {
        const val = (et.evaluacionId || '').trim();
        if (et.id === 'edi') {
          if (val) cleanConfig.ediId = val;
        } else if (et.id === 'ep1') {
          if (val) cleanConfig.ep1Id = val;
        } else if (et.id === 'ep2') {
          if (val) cleanConfig.ep2Id = val;
        } else {
          if (val) cleanConfig[`${et.id}Id`] = val;
        }
      });

      await onSaveConfig(selectedGrado, selectedCategoria, cleanConfig);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error al guardar configuración de matriz:', error);
      setErrorMessage('Ocurrió un error inesperado al intentar guardar la configuración.');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, onSaveConfig, selectedGrado, selectedCategoria, etapas, evaluaciones]);

  // Manejo de atajos de teclado: Escape y Enter
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && !isSaving) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, handleSave, onClose]);

  if (!isOpen || !mounted) return null;

  // Filtrar evaluaciones que coincidan con el grado y categoría seleccionados
  const evalsDeGradoYCat = evaluaciones.filter(
    (ev) => Number(ev.grado) === selectedGrado && Number(ev.categoria) === selectedCategoria
  );
  const otrasEvals = evaluaciones.filter(
    (ev) => !(Number(ev.grado) === selectedGrado && Number(ev.categoria) === selectedCategoria)
  );

  const nombreCategoria = categoriaTransform(selectedCategoria, contextCategorias);

  const getBadgeClass = (id: string) => {
    const cleanId = id.toLowerCase();
    if (cleanId === 'edi') return styles.badgeEdi;
    if (cleanId === 'ep1') return styles.badgeEp1;
    if (cleanId === 'ep2') return styles.badgeEp2;
    if (cleanId === 'ep3') return styles.badgeEp3;
    if (cleanId === 'ep4') return styles.badgeEp4;
    return styles.badgeGeneric;
  };

  const renderEvaluacionOptions = (currentEtapaId: string) => {
    // Buscar si alguna otra etapa ya tiene asignada esta evaluación
    const getEtapaAsignada = (evalId?: string) =>
      evalId
        ? etapas.find((et) => et.id !== currentEtapaId && Boolean(et.evaluacionId) && et.evaluacionId === evalId)
        : undefined;

    return (
      <>
        <option value="">-- Sin evaluación asignada --</option>
        {evalsDeGradoYCat.length > 0 && (
          <optgroup label={`Evaluaciones de ${getGradoTexto(selectedGrado)} - ${nombreCategoria.toUpperCase()}`}>
            {evalsDeGradoYCat.map((ev) => {
              const asignada = getEtapaAsignada(ev.id);
              const isDisabled = Boolean(asignada);
              return (
                <option key={ev.id} value={ev.id} disabled={isDisabled}>
                  {ev.nombre} {ev.active ? '● Activa' : '○ Borrador'}
                  {isDisabled ? ` (⚠️ Ya asignada en ${asignada?.codigo})` : ''}
                </option>
              );
            })}
          </optgroup>
        )}
        {otrasEvals.length > 0 && (
          <optgroup label="Otras evaluaciones registradas">
            {otrasEvals.map((ev) => {
              const asignada = getEtapaAsignada(ev.id);
              const isDisabled = Boolean(asignada);
              return (
                <option key={ev.id} value={ev.id} disabled={isDisabled}>
                  {ev.nombre} ({getGradoTexto(ev.grado)} - {categoriaTransform(ev.categoria, contextCategorias)})
                  {isDisabled ? ` (⚠️ Ya asignada en ${asignada?.codigo})` : ''}
                </option>
              );
            })}
          </optgroup>
        )}
      </>
    );
  };

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.iconBadge}>
              <MdSettings />
            </div>
            <div>
              <h2 className={styles.title}>Configurar Evaluaciones por Grado y Área</h2>
              <p className={styles.subtitle}>
                Asigna y gestiona las etapas evaluativas (EDI, EP1, EP2, EP3...) para este grado y categoría
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <MdClose />
          </button>
        </header>

        {/* Body */}
        <div className={styles.body}>
          {/* Selectores de Grado y Categoría en 2 columnas */}
          <div className={styles.formRow}>
            {/* Selector de Grado */}
            <div className={styles.formGroup}>
              <label htmlFor="modal-select-grado" className={styles.label}>
                <MdSchool className={styles.labelIcon} />
                <span>Grado Escolar:</span>
              </label>
              <select
                id="modal-select-grado"
                ref={selectGradoRef}
                value={selectedGrado}
                onChange={(e) => setSelectedGrado(Number(e.target.value))}
                className={styles.select}
              >
                {gradosDeColegio.map((g) => {
                  const tieneAlgunaConfig = Object.keys(configGrados).some(
                    (k) => k === String(g.id) || k.startsWith(`${g.id}_`)
                  );
                  return (
                    <option key={g.id} value={g.id}>
                      {g.name.toUpperCase()} {tieneAlgunaConfig ? '✓' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Selector de Categoría / Área */}
            <div className={styles.formGroup}>
              <label htmlFor="modal-select-categoria" className={styles.label}>
                <MdCategory className={styles.labelIcon} />
                <span>Categoría / Área:</span>
              </label>
              <select
                id="modal-select-categoria"
                value={selectedCategoria}
                onChange={(e) => setSelectedCategoria(Number(e.target.value))}
                className={styles.select}
              >
                {categoriasDisponibles.map((cat) => {
                  const key = `${selectedGrado}_${cat.id}`;
                  const configurado = !!configGrados[key];
                  return (
                    <option key={cat.id} value={cat.id}>
                      {cat.categoria.toUpperCase()} {configurado ? '✓ (Configurado)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Cabecera de Etapas con la NUEVA FEATURE A PRIMERA VISTA */}
          <div className={styles.etapasHeaderRow}>
            <div className={styles.etapasHeaderLeft}>
              <span className={styles.sectionHint}>
                Etapas para <strong>{getGradoTexto(selectedGrado)}</strong> - <strong>{nombreCategoria.toUpperCase()}</strong>:
              </span>
              <span className={styles.etapasCountBadge}>
                {etapas.length} {etapas.length === 1 ? 'etapa' : 'etapas'}
              </span>
            </div>

            {/* Botón Destacado: Visible inmediatamente sin scroll */}
            <button
              type="button"
              className={styles.addEtapaHeaderBtn}
              onClick={handleAddEtapa}
              title={`Agregar nueva etapa progresiva (EP${nextStageNum})`}
            >
              <MdAddCircleOutline className={styles.addIcon} />
              <span>+ Agregar Etapa (EP{nextStageNum})</span>
            </button>
          </div>

          {/* Lista Dinámica de Etapas (filas horizontales compactas) */}
          <div className={styles.etapasList}>
            {etapas.map((etapa) => (
              <div key={etapa.id} className={styles.slotCard}>
                <div className={styles.slotLeft}>
                  <span className={`${styles.slotBadge} ${getBadgeClass(etapa.id)}`}>
                    {etapa.codigo}
                  </span>
                  <div className={styles.slotTitleGroup}>
                    <span className={styles.slotTitle}>{etapa.nombre}</span>
                    {etapa.subtitulo && (
                      <span className={styles.slotSubtitle}>{etapa.subtitulo}</span>
                    )}
                  </div>
                </div>

                <div className={styles.slotRight}>
                  <select
                    value={etapa.evaluacionId || ''}
                    onChange={(e) => handleUpdateEvaluacion(etapa.id, e.target.value)}
                    className={styles.select}
                  >
                    {renderEvaluacionOptions(etapa.id)}
                  </select>
                  {etapas.length > 1 && (
                    <button
                      type="button"
                      className={styles.removeEtapaBtn}
                      onClick={() => handleRemoveEtapa(etapa.id)}
                      title={`Eliminar etapa ${etapa.codigo}`}
                      aria-label={`Eliminar etapa ${etapa.codigo}`}
                    >
                      <MdDeleteOutline />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Botón inferior complementario */}
          <button
            type="button"
            className={styles.addEtapaBtn}
            onClick={handleAddEtapa}
          >
            <MdAddCircleOutline />
            <span>Agregar otra Etapa de Evaluación (EP{nextStageNum})</span>
          </button>

          {errorMessage && (
            <div className={styles.errorBanner}>
              <MdErrorOutline className={styles.errorIcon} />
              <span>{errorMessage}</span>
            </div>
          )}

          {saveSuccess && (
            <div className={styles.successBanner}>
              <MdCheckCircle />
              <span>¡Asignación guardada con éxito para {getGradoTexto(selectedGrado)} - {nombreCategoria.toUpperCase()}!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerHint}>
            <small>Presiona <strong>Enter</strong> para guardar o <strong>Esc</strong> para salir</small>
          </div>
          <div className={styles.footerButtons}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSaving}
            >
              Cerrar
            </button>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <RiLoader4Line className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <MdSave />
                  <span>Guardar Asignación</span>
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
};

export default ConfigurarMatrizModal;
