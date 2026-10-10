import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  MdSettings,
  MdClose,
  MdSave,
  MdCheckCircle,
  MdSchool,
  MdCategory,
} from 'react-icons/md';
import { RiLoader4Line } from 'react-icons/ri';
import { Evaluaciones } from '@/features/types/types';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { getCategoriasParaGrado, categoriaTransform } from '@/fuctions/categorias';
import { gradosDeColegio, getGradoTexto } from '@/fuctions/regiones';
import styles from './ConfigurarMatrizModal.module.css';

export interface GradoConfigAssignment {
  gradoId?: number;
  categoriaId?: number;
  ediId?: string;
  ep1Id?: string;
  ep2Id?: string;
  updatedAt?: string;
}

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
  const [ediId, setEdiId] = useState<string>('');
  const [ep1Id, setEp1Id] = useState<string>('');
  const [ep2Id, setEp2Id] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

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

  // Al cambiar grado, categoría o la configuración entrante, actualizar los slots
  useEffect(() => {
    const key = `${selectedGrado}_${selectedCategoria}`;
    const currentCfg = configGrados[key] || configGrados[String(selectedGrado)] || {};
    setEdiId(currentCfg.ediId || '');
    setEp1Id(currentCfg.ep1Id || '');
    setEp2Id(currentCfg.ep2Id || '');
    setSaveSuccess(false);
  }, [selectedGrado, selectedCategoria, configGrados]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const cleanConfig: GradoConfigAssignment = {
        gradoId: selectedGrado,
        categoriaId: selectedCategoria,
        updatedAt: new Date().toISOString(),
      };
      if (ediId && ediId.trim()) cleanConfig.ediId = ediId.trim();
      if (ep1Id && ep1Id.trim()) cleanConfig.ep1Id = ep1Id.trim();
      if (ep2Id && ep2Id.trim()) cleanConfig.ep2Id = ep2Id.trim();

      await onSaveConfig(selectedGrado, selectedCategoria, cleanConfig);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error al guardar configuración de matriz:', error);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, onSaveConfig, selectedGrado, selectedCategoria, ediId, ep1Id, ep2Id]);

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

  const renderEvaluacionOptions = () => (
    <>
      <option value="">-- Sin evaluación asignada --</option>
      {evalsDeGradoYCat.length > 0 && (
        <optgroup label={`Evaluaciones de ${getGradoTexto(selectedGrado)} - ${nombreCategoria.toUpperCase()}`}>
          {evalsDeGradoYCat.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.nombre} {ev.active ? '● Activa' : '○ Borrador'}
            </option>
          ))}
        </optgroup>
      )}
      {otrasEvals.length > 0 && (
        <optgroup label="Otras evaluaciones registradas">
          {otrasEvals.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.nombre} ({getGradoTexto(ev.grado)} - {categoriaTransform(ev.categoria, contextCategorias)})
            </option>
          ))}
        </optgroup>
      )}
    </>
  );

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
                Asigna las evaluaciones para la combinación de Grado y Categoría seleccionada
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

          <p className={styles.sectionHint}>
            Asignación de evaluaciones para <strong>{getGradoTexto(selectedGrado)}</strong> - <strong>{nombreCategoria.toUpperCase()}</strong>:
          </p>

          {/* Slot 1: EDI */}
          <div className={styles.slotCard}>
            <div className={styles.slotHeader}>
              <span className={`${styles.slotBadge} ${styles.badgeEdi}`}>EDI</span>
              <div className={styles.slotTitleGroup}>
                <span className={styles.slotTitle}>Evaluación Diagnóstica / de Inicio</span>
                <span className={styles.slotSubtitle}>Línea base al inicio del periodo (opcional)</span>
              </div>
            </div>
            <select
              value={ediId}
              onChange={(e) => setEdiId(e.target.value)}
              className={styles.select}
            >
              {renderEvaluacionOptions()}
            </select>
          </div>

          {/* Slot 2: EP1 */}
          <div className={styles.slotCard}>
            <div className={styles.slotHeader}>
              <span className={`${styles.slotBadge} ${styles.badgeEp1}`}>EP1</span>
              <div className={styles.slotTitleGroup}>
                <span className={styles.slotTitle}>Evaluación Progresiva 1</span>
                <span className={styles.slotSubtitle}>Primer hito de avance pedagógico (opcional)</span>
              </div>
            </div>
            <select
              value={ep1Id}
              onChange={(e) => setEp1Id(e.target.value)}
              className={styles.select}
            >
              {renderEvaluacionOptions()}
            </select>
          </div>

          {/* Slot 3: EP2 */}
          <div className={styles.slotCard}>
            <div className={styles.slotHeader}>
              <span className={`${styles.slotBadge} ${styles.badgeEp2}`}>EP2</span>
              <div className={styles.slotTitleGroup}>
                <span className={styles.slotTitle}>Evaluación Progresiva 2</span>
                <span className={styles.slotSubtitle}>Segundo hito de avance (opcional / puede dejarse pendiente)</span>
              </div>
            </div>
            <select
              value={ep2Id}
              onChange={(e) => setEp2Id(e.target.value)}
              className={styles.select}
            >
              {renderEvaluacionOptions()}
            </select>
          </div>

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
