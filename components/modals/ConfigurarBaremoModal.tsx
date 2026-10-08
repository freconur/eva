import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  MdTune,
  MdClose,
  MdSave,
  MdCheckCircle,
  MdErrorOutline,
  MdRefresh,
} from 'react-icons/md';
import { RiLoader4Line } from 'react-icons/ri';
import { toast } from 'react-toastify';
import styles from './ConfigurarBaremoModal.module.css';

export interface BaremoDecisiones {
  critico: number; // Porcentaje mínimo para nivel Crítico (por defecto 60)
  alto: number;    // Porcentaje mínimo para nivel Alto (por defecto 50)
  medio: number;   // Porcentaje mínimo para nivel Medio (por defecto 40)
}

export const DEFAULT_BAREMO_DECISIONES: BaremoDecisiones = {
  critico: 60,
  alto: 50,
  medio: 40,
};

interface ConfigurarBaremoModalProps {
  isOpen: boolean;
  onClose: () => void;
  baremo: BaremoDecisiones;
  onSave: (newBaremo: BaremoDecisiones) => Promise<void>;
}

export const ConfigurarBaremoModal: React.FC<ConfigurarBaremoModalProps> = ({
  isOpen,
  onClose,
  baremo,
  onSave,
}) => {
  const [mounted, setMounted] = useState(false);
  const [critico, setCritico] = useState<number>(baremo.critico ?? DEFAULT_BAREMO_DECISIONES.critico);
  const [alto, setAlto] = useState<number>(baremo.alto ?? DEFAULT_BAREMO_DECISIONES.alto);
  const [medio, setMedio] = useState<number>(baremo.medio ?? DEFAULT_BAREMO_DECISIONES.medio);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const criticoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sincronizar estado cuando se abra el modal o cambie el baremo exterior
  useEffect(() => {
    if (isOpen) {
      setCritico(baremo.critico ?? DEFAULT_BAREMO_DECISIONES.critico);
      setAlto(baremo.alto ?? DEFAULT_BAREMO_DECISIONES.alto);
      setMedio(baremo.medio ?? DEFAULT_BAREMO_DECISIONES.medio);
      setSaveSuccess(false);

      // Autofocus en el primer input
      setTimeout(() => {
        criticoInputRef.current?.focus();
        criticoInputRef.current?.select();
      }, 50);
    }
  }, [isOpen, baremo]);

  // Validación de lógica pedagógica y matemática de los cortes
  const validationError = (() => {
    if (isNaN(critico) || isNaN(alto) || isNaN(medio)) {
      return 'Todos los valores deben ser números válidos.';
    }
    if (critico <= 0 || alto <= 0 || medio <= 0) {
      return 'Los porcentajes deben ser mayores a 0%.';
    }
    if (critico > 100) {
      return 'El porcentaje Crítico no puede superar el 100%.';
    }
    if (critico <= alto) {
      return 'El umbral Crítico debe ser estrictamente mayor al umbral Alto.';
    }
    if (alto <= medio) {
      return 'El umbral Alto debe ser estrictamente mayor al umbral Medio.';
    }
    return null;
  })();

  const isValid = !validationError;

  const handleSave = useCallback(async () => {
    if (isSaving || !isValid) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const newBaremo: BaremoDecisiones = {
        critico: Math.round(critico),
        alto: Math.round(alto),
        medio: Math.round(medio),
      };
      await onSave(newBaremo);
      setSaveSuccess(true);
      toast.success('Baremo de decisiones guardado en Firestore');
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (error) {
      console.error('Error al guardar baremo:', error);
      toast.error('No se pudo guardar el baremo en Firestore');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, isValid, critico, alto, medio, onSave, onClose]);

  // Atajos de teclado: Escape y Enter
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && !isSaving && isValid) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, isValid, handleSave, onClose]);

  // Bloquear scroll de fondo mientras el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleResetDefaults = () => {
    setCritico(DEFAULT_BAREMO_DECISIONES.critico);
    setAlto(DEFAULT_BAREMO_DECISIONES.alto);
    setMedio(DEFAULT_BAREMO_DECISIONES.medio);
  };

  if (!isOpen || !mounted) return null;

  const portalTarget =
    (typeof document !== 'undefined' && (document.fullscreenElement as HTMLElement)) ||
    (typeof document !== 'undefined' ? document.body : null);

  if (!portalTarget) return null;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="baremo-modal-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <header className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.iconBadge}>
              <MdTune />
            </div>
            <div>
              <h2 id="baremo-modal-title" className={styles.title}>
                Configurar Baremo de Alertas y Decisiones
              </h2>
              <p className={styles.subtitle}>
                Ajusta los umbrales de % rezago (Previo al Inicio) para la priorización pedagógica
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            title="Cerrar modal (Esc)"
          >
            <MdClose />
          </button>
        </header>

        {/* Cuerpo */}
        <div className={styles.body}>
          {/* Banner Explicativo */}
          <div className={styles.infoBanner}>
            Los porcentajes corresponden a la proporción de estudiantes en el nivel{' '}
            <strong>Previo al Inicio</strong> respecto al total evaluado. Cambiar estos
            valores recalculará en tiempo real las alertas de todas las UGELs e ítems en la matriz.
          </div>

          {/* Vista Previa en Vivo */}
          <div className={styles.previewSection}>
            <span className={styles.previewLabel}>Vista Previa del Baremo Resultante</span>
            <div className={styles.previewBar}>
              <div className={`${styles.previewCard} ${styles.previewCardCritico}`}>
                <span className={styles.previewCardTitle}>🔴 Críticas</span>
                <span className={styles.previewCardRange}>
                  {isValid ? `≥ ${critico}%` : '---'}
                </span>
              </div>
              <div className={`${styles.previewCard} ${styles.previewCardAlto}`}>
                <span className={styles.previewCardTitle}>🟠 Altas</span>
                <span className={styles.previewCardRange}>
                  {isValid ? `${alto}% – ${critico - 1}%` : '---'}
                </span>
              </div>
              <div className={`${styles.previewCard} ${styles.previewCardMedio}`}>
                <span className={styles.previewCardTitle}>🟡 Medias</span>
                <span className={styles.previewCardRange}>
                  {isValid ? `${medio}% – ${alto - 1}%` : '---'}
                </span>
              </div>
              <div className={`${styles.previewCard} ${styles.previewCardBajo}`}>
                <span className={styles.previewCardTitle}>🟢 Bajas</span>
                <span className={styles.previewCardRange}>
                  {isValid ? `< ${medio}%` : '---'}
                </span>
              </div>
            </div>
          </div>

          {/* Formulario de Umbrales */}
          <div className={styles.formGrid}>
            {/* Umbral Crítico */}
            <div className={styles.thresholdRow}>
              <div className={styles.thresholdTagGroup}>
                <span className={styles.thresholdDot}>🔴</span>
                <span className={styles.thresholdTagText}>Crítico (≥)</span>
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrefix}>A partir de</span>
                <input
                  ref={criticoInputRef}
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={isNaN(critico) ? '' : critico}
                  onChange={(e) => setCritico(parseInt(e.target.value, 10))}
                  className={styles.numberInput}
                  disabled={isSaving}
                />
                <span className={styles.inputSuffix}>%</span>
              </div>
            </div>

            {/* Umbral Alto */}
            <div className={styles.thresholdRow}>
              <div className={styles.thresholdTagGroup}>
                <span className={styles.thresholdDot}>🟠</span>
                <span className={styles.thresholdTagText}>Alto (≥)</span>
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrefix}>A partir de</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={isNaN(alto) ? '' : alto}
                  onChange={(e) => setAlto(parseInt(e.target.value, 10))}
                  className={styles.numberInput}
                  disabled={isSaving}
                />
                <span className={styles.inputSuffix}>%</span>
              </div>
            </div>

            {/* Umbral Medio */}
            <div className={styles.thresholdRow}>
              <div className={styles.thresholdTagGroup}>
                <span className={styles.thresholdDot}>🟡</span>
                <span className={styles.thresholdTagText}>Medio (≥)</span>
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrefix}>A partir de</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={isNaN(medio) ? '' : medio}
                  onChange={(e) => setMedio(parseInt(e.target.value, 10))}
                  className={styles.numberInput}
                  disabled={isSaving}
                />
                <span className={styles.inputSuffix}>%</span>
              </div>
            </div>

            {/* Nivel Bajo (Automático) */}
            <div className={styles.thresholdRow}>
              <div className={styles.thresholdTagGroup}>
                <span className={styles.thresholdDot}>🟢</span>
                <span className={styles.thresholdTagText}>Bajo (&lt;)</span>
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.readOnlyBadge}>
                  {isValid ? `< ${medio}% (Automático)` : 'Menor a Medio'}
                </span>
              </div>
            </div>
          </div>

          {/* Mensajes de Validación / Éxito */}
          {validationError && (
            <div className={styles.errorBanner}>
              <MdErrorOutline style={{ fontSize: '1.25rem', flexShrink: 0 }} />
              <span>{validationError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className={styles.successBanner}>
              <MdCheckCircle style={{ fontSize: '1.25rem', flexShrink: 0 }} />
              <span>¡Baremo actualizado exitosamente en Firestore!</span>
            </div>
          )}
        </div>

        {/* Pie de Modal */}
        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={handleResetDefaults}
            disabled={isSaving}
            title="Restablecer a valores por defecto (60%, 50%, 40%)"
          >
            <MdRefresh style={{ verticalAlign: 'text-bottom', marginRight: '4px' }} />
            Valores por defecto
          </button>

          <div className={styles.footerActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={isSaving || !isValid}
            >
              {isSaving ? (
                <>
                  <RiLoader4Line className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <MdSave />
                  <span>Guardar Baremo</span>
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    portalTarget
  );
};

export default ConfigurarBaremoModal;
