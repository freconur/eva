import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { MdClose, MdDragIndicator } from 'react-icons/md';
import { Evaluaciones, PreguntasRespuestas } from '@/features/types/types';
import { EtapaMatrizConfig } from '@/components/modals/ConfigurarMatrizModal';
import styles from './QuestionDetailPopover.module.css';

export interface QuestionDetailPopoverProps {
  order: number;
  initialEtapa?: string;
  coords: { x: number; y: number };
  onClose: () => void;
  evaluacionEdi?: Evaluaciones | null;
  evaluacionEp1?: Evaluaciones | null;
  evaluacionEp2?: Evaluaciones | null;
  etapas?: EtapaMatrizConfig[];
  evaluacionesPorEtapa?: Array<{ etapa: EtapaMatrizConfig; evaluacion: Evaluaciones | null }>;
  preguntas: PreguntasRespuestas[];
  gradoName?: string;
}

export const QuestionDetailPopover: React.FC<QuestionDetailPopoverProps> = ({
  order,
  initialEtapa,
  coords,
  onClose,
  evaluacionEdi,
  evaluacionEp1,
  evaluacionEp2,
  etapas = [],
  evaluacionesPorEtapa = [],
  preguntas = [],
  gradoName = '',
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  const effectiveEtapas = useMemo(() => {
    if (etapas && etapas.length > 0) return etapas;
    const list: EtapaMatrizConfig[] = [];
    if (evaluacionEdi) list.push({ id: 'edi', codigo: 'EDI', nombre: 'EDI' });
    if (evaluacionEp1) list.push({ id: 'ep1', codigo: 'EP1', nombre: 'EP1' });
    if (evaluacionEp2) list.push({ id: 'ep2', codigo: 'EP2', nombre: 'EP2' });
    return list;
  }, [etapas, evaluacionEdi, evaluacionEp1, evaluacionEp2]);

  const [selectedEtapa, setSelectedEtapa] = useState<string>(() => {
    if (initialEtapa) return initialEtapa;
    if (effectiveEtapas.length > 0) return effectiveEtapas[0].id;
    if (evaluacionEdi) return 'edi';
    if (evaluacionEp1) return 'ep1';
    if (evaluacionEp2) return 'ep2';
    return 'ep1';
  });

  const [adjustedCoords, setAdjustedCoords] = useState(coords);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const hasUserMovedRef = useRef<boolean>(false);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  }>({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  useEffect(() => {
    hasUserMovedRef.current = false;
    setAdjustedCoords({ x: coords.x, y: coords.y });
  }, [coords.x, coords.y, order]);

  useLayoutEffect(() => {
    if (hasUserMovedRef.current) return;
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      let newX = adjustedCoords.x;
      let newY = adjustedCoords.y;

      if (rect.right > window.innerWidth - 16) {
        newX = Math.max(16, window.innerWidth - rect.width - 16);
      }
      if (rect.left < 16) {
        newX = 16;
      }
      if (rect.bottom > window.innerHeight - 16) {
        newY = Math.max(16, window.innerHeight - rect.height - 16);
      }
      if (rect.top < 16) {
        newY = 16;
      }

      if (newX !== adjustedCoords.x || newY !== adjustedCoords.y) {
        setAdjustedCoords({ x: newX, y: newY });
      }
    }
  }, [adjustedCoords.x, adjustedCoords.y, selectedEtapa]);

  const handleHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Solo clic principal o touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // No iniciar arrastre si se hace clic en botones interactivos (como el botón cerrar)
    if ((e.target as HTMLElement).closest('button')) return;

    e.preventDefault();
    setIsDragging(true);
    isDraggingRef.current = true;
    hasUserMovedRef.current = true;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: adjustedCoords.x,
      initialY: adjustedCoords.y,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = moveEvent.clientX - dragStartRef.current.startX;
      const deltaY = moveEvent.clientY - dragStartRef.current.startY;

      const rect = popoverRef.current?.getBoundingClientRect();
      const popoverWidth = rect?.width || 440;
      const popoverHeight = rect?.height || 260;

      const minX = 8;
      const minY = 8;
      const maxX = Math.max(minX, window.innerWidth - popoverWidth - 8);
      const maxY = Math.max(minY, window.innerHeight - popoverHeight - 8);

      const targetX = dragStartRef.current.initialX + deltaX;
      const targetY = dragStartRef.current.initialY + deltaY;

      const clampedX = Math.max(minX, Math.min(targetX, maxX));
      const clampedY = Math.max(minY, Math.min(targetY, maxY));

      setAdjustedCoords({ x: clampedX, y: clampedY });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      isDraggingRef.current = false;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isDraggingRef.current) return;
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const currentQ = useMemo(() => {
    return (
      preguntas.find(
        (p, idx) => (p.order !== undefined ? Number(p.order) : idx + 1) === order
      ) || null
    );
  }, [preguntas, order]);

  const selectedStageQuestion = useMemo(() => {
    if (!currentQ) return null;
    if ((currentQ as any)?.preguntasPorEtapa?.[selectedEtapa]) {
      return (currentQ as any).preguntasPorEtapa[selectedEtapa];
    }
    if (selectedEtapa === 'edi') return (currentQ as any)?.ediPregunta || currentQ;
    if (selectedEtapa === 'ep1') return (currentQ as any)?.ep1Pregunta || currentQ;
    if (selectedEtapa === 'ep2') return (currentQ as any)?.ep2Pregunta || currentQ;
    return currentQ;
  }, [currentQ, selectedEtapa]);

  const questionCode = `P${order < 10 ? `0${order}` : order}`;

  return (
    <div
      ref={popoverRef}
      className={`${styles.questionPopover} ${isDragging ? styles.questionPopoverDragging : ''}`}
      style={{
        top: adjustedCoords.y,
        left: adjustedCoords.x,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header arrastrable */}
      <div
        className={`${styles.questionPopoverHeader} ${
          isDragging ? styles.questionPopoverHeaderDragging : ''
        }`}
        onPointerDown={handleHeaderPointerDown}
        title="Arrastra para mover el popup"
      >
        <div className={styles.questionPopoverTitleGroup}>
          <MdDragIndicator className={styles.dragHandleIcon} />
          <span className={styles.questionNumberBadge}>{questionCode}</span>
          <div className={styles.questionPopoverTitleWrapper}>
            <h4 className={styles.questionPopoverTitle}>Pregunta {questionCode}</h4>
            <span className={styles.questionPopoverSubtitle}>
              {gradoName ? gradoName : 'Ítem Pedagógico'}
            </span>
          </div>
        </div>
        <button
          type="button"
          className={styles.popoverCloseBtn}
          onClick={onClose}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Cerrar"
          title="Cerrar"
        >
          <MdClose />
        </button>
      </div>

      {/* Tabs de Etapas (EDI, EP1, EP2, EP3, EP4...) */}
      {effectiveEtapas.length > 0 && (
        <div className={styles.questionEtapaTabs}>
          {effectiveEtapas.map((etapa) => {
            const isActive = selectedEtapa === etapa.id;
            const evalItem =
              evaluacionesPorEtapa?.find((e) => e.etapa.id === etapa.id)?.evaluacion ||
              (etapa.id === 'edi'
                ? evaluacionEdi
                : etapa.id === 'ep1'
                ? evaluacionEp1
                : etapa.id === 'ep2'
                ? evaluacionEp2
                : null);

            return (
              <button
                key={etapa.id}
                type="button"
                className={`${styles.questionEtapaTab} ${
                  isActive
                    ? etapa.id === 'edi'
                      ? styles.questionEtapaTabActiveEdi
                      : etapa.id === 'ep2'
                      ? styles.questionEtapaTabActiveEp2
                      : styles.questionEtapaTabActiveEp1
                    : ''
                }`}
                onClick={() => setSelectedEtapa(etapa.id)}
                title={evalItem ? `Ver pregunta en ${evalItem.nombre}` : `Ver pregunta en ${etapa.codigo}`}
              >
                <span>{etapa.codigo}</span>
                {evalItem && <span className={styles.questionEtapaTag}>Asignada</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Cuerpo del Popover */}
      <div className={styles.questionPopoverBody}>
        {/* Actuación Pedagógica */}
        <div className={styles.questionSectionBox}>
          <div className={styles.questionSectionHeader}>
            <span className={styles.sectionIcon}>🎯</span>
            <span className={styles.sectionTitle}>Actuación:</span>
          </div>
          <p className={styles.actuacionText}>
            {selectedStageQuestion?.preguntaDocente ||
              currentQ?.preguntaDocente ||
              'Sin actuación pedagógica registrada para este ítem.'}
          </p>
        </div>

        {/* Pregunta / Enunciado */}
        <div className={styles.questionSectionBox}>
          <div className={styles.questionSectionHeader}>
            <span className={styles.sectionIcon}>📝</span>
            <span className={styles.sectionTitle}>Pregunta:</span>
          </div>
          <p className={styles.preguntaText}>
            {selectedStageQuestion?.pregunta ||
              currentQ?.pregunta ||
              'Sin enunciado registrado para esta pregunta.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuestionDetailPopover;
