import { createPortal } from 'react-dom';
import styles from './configurarNivelesPorDominio.module.css';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { AlternativasDocente, DimensionEspecialista, NivelYPuntaje, PRDocentes } from '@/features/types/types';
import { RiLoader4Line, RiDeleteBin6Line, RiAddLine, RiAwardLine, RiCheckLine, RiFileCopyLine, RiMagicLine } from 'react-icons/ri';
import React, { useEffect, useState } from 'react';
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas';

interface Props {
  handleShowModal: () => void;
  idEvaluacion: string;
  dimensiones: DimensionEspecialista[];
  preguntas?: PRDocentes[];
  escala?: AlternativasDocente[];
  initialDimensionId?: string;
}

const DEFAULT_LEVELS_TEMPLATE = [
  { nivel: 'Inicio', min: 0, max: 4, color: '#94a3b8', id: 1 },
  { nivel: 'Proceso', min: 5, max: 8, color: '#f59e0b', id: 2 },
  { nivel: 'Logrado', min: 9, max: 12, color: '#10b981', id: 3 },
];

const ConfigurarNivelesPorDominio = ({
  handleShowModal,
  idEvaluacion,
  dimensiones = [],
  preguntas = [],
  escala = [],
  initialDimensionId,
}: Props) => {
  const { loaderModales } = useGlobalContext();
  const { updateDimensionNiveles, updateAllDimensionesNiveles } = UseEvaluacionEspecialistas();

  const [selectedDimId, setSelectedDimId] = useState<string>(
    initialDimensionId || dimensiones[0]?.id || ''
  );

  // Mapa de niveles en memoria: { [dimId]: NivelYPuntaje[] }
  const [domainLevelsMap, setDomainLevelsMap] = useState<{ [dimId: string]: NivelYPuntaje[] }>({});

  const maxQuestionValue = Math.max(1, ...(escala.map((e) => Number(e.value) || 0) || [3]));

  // Inicializar mapa de niveles con los datos de cada dimensión
  useEffect(() => {
    const initialMap: { [dimId: string]: NivelYPuntaje[] } = {};
    dimensiones.forEach((dim) => {
      if (!dim.id) return;
      if (dim.niveles && dim.niveles.length > 0) {
        initialMap[dim.id] = dim.niveles;
      } else {
        // Sugerir niveles por defecto calculados según la cantidad de criterios de este dominio
        const countQuestions = preguntas.filter((p) => p.dimensionId === dim.id).length || 1;
        const maxScore = countQuestions * maxQuestionValue;
        const step = Math.max(1, Math.floor(maxScore / 3));

        initialMap[dim.id] = [
          { nivel: 'Inicio', min: 0, max: step, color: '#94a3b8', id: 1 },
          { nivel: 'Proceso', min: step + 1, max: step * 2, color: '#f59e0b', id: 2 },
          { nivel: 'Logrado', min: step * 2 + 1, max: maxScore, color: '#10b981', id: 3 },
        ];
      }
    });
    setDomainLevelsMap(initialMap);

    if (!selectedDimId && dimensiones.length > 0 && dimensiones[0]?.id) {
      setSelectedDimId(dimensiones[0].id);
    }
  }, [dimensiones, preguntas, escala]);

  const currentDimension = dimensiones.find((d) => d.id === selectedDimId);
  const currentLevels: NivelYPuntaje[] = (selectedDimId && domainLevelsMap[selectedDimId]) || [];

  const currentQuestionsCount = preguntas.filter((p) => p.dimensionId === selectedDimId).length;
  const currentMaxScore = Math.max(1, currentQuestionsCount * maxQuestionValue);

  const handleAddLevel = () => {
    if (!selectedDimId) return;
    const nextId = currentLevels.length > 0 ? Math.max(...currentLevels.map((n) => n.id || 0)) + 1 : 1;
    const lastMax = currentLevels.length > 0 ? Math.max(...currentLevels.map((n) => n.max || 0)) : -1;

    const updated = [
      ...currentLevels,
      {
        nivel: '',
        min: lastMax + 1,
        max: lastMax + 3,
        color: '#6366f1',
        id: nextId,
      },
    ];

    setDomainLevelsMap({
      ...domainLevelsMap,
      [selectedDimId]: updated,
    });
  };

  const handleRemoveLevel = (index: number) => {
    if (!selectedDimId) return;
    const updated = currentLevels.filter((_, i) => i !== index);
    setDomainLevelsMap({
      ...domainLevelsMap,
      [selectedDimId]: updated,
    });
  };

  const handleLevelChange = (index: number, field: keyof NivelYPuntaje, value: any) => {
    if (!selectedDimId) return;
    const updated = [...currentLevels];
    updated[index] = { ...updated[index], [field]: value };
    setDomainLevelsMap({
      ...domainLevelsMap,
      [selectedDimId]: updated,
    });
  };

  const handleSuggestRanges = () => {
    if (!selectedDimId) return;
    const count = currentQuestionsCount || 1;
    const maxScore = count * maxQuestionValue;
    const step = Math.max(1, Math.floor(maxScore / 3));

    const suggested: NivelYPuntaje[] = [
      { nivel: 'Inicio', min: 0, max: step, color: '#94a3b8', id: 1 },
      { nivel: 'Proceso', min: step + 1, max: step * 2, color: '#f59e0b', id: 2 },
      { nivel: 'Logrado', min: step * 2 + 1, max: maxScore, color: '#10b981', id: 3 },
    ];

    setDomainLevelsMap({
      ...domainLevelsMap,
      [selectedDimId]: suggested,
    });
  };

  const handleCopyToAllDomains = () => {
    if (!selectedDimId || currentLevels.length === 0) return;
    if (
      window.confirm(
        '¿Deseas aplicar estos mismos niveles y colores a todos los demás dominios de la evaluación?'
      )
    ) {
      const newMap: { [dimId: string]: NivelYPuntaje[] } = {};
      dimensiones.forEach((dim) => {
        if (!dim.id) return;
        newMap[dim.id] = JSON.parse(JSON.stringify(currentLevels));
      });
      setDomainLevelsMap(newMap);
    }
  };

  const handleSaveCurrentDomain = async () => {
    if (!selectedDimId) return;
    try {
      await updateDimensionNiveles(idEvaluacion, selectedDimId, currentLevels);
      handleShowModal();
    } catch (err) {
      console.error('Error al guardar niveles del dominio:', err);
    }
  };

  const handleSaveAllDomains = async () => {
    try {
      const payload = dimensiones
        .filter((d) => d.id && domainLevelsMap[d.id])
        .map((d) => ({
          idDimension: d.id as string,
          niveles: domainLevelsMap[d.id as string],
        }));

      await updateAllDimensionesNiveles(idEvaluacion, payload);
      handleShowModal();
    } catch (err) {
      console.error('Error al guardar todos los niveles de dominios:', err);
    }
  };

  let container;
  if (typeof window !== 'undefined') {
    container = document.getElementById('portal-modal') || document.body;
  }

  return container
    ? createPortal(
        <div className={styles.containerModal}>
          {loaderModales ? (
            <div className={styles.loaderContainer}>
              <RiLoader4Line className={styles.loaderIcon} />
              <p className={styles.loaderText}>guardando niveles por dominio...</p>
            </div>
          ) : (
            <div className={styles.containerSale}>
              <div className={styles.closeModalContainer}>
                <div className={styles.titleGroup}>
                  <RiAwardLine style={{ color: '#2563eb', fontSize: '1.4rem' }} />
                  <h3 className={styles.title}>Niveles de Logro por Dominio</h3>
                </div>
                <div className={styles.close} onClick={handleShowModal}>
                  cerrar
                </div>
              </div>

              <div className={styles.description}>
                Configura los rangos de puntaje y niveles de logro específicos para cada uno de los dominios evaluados.
              </div>

              {dimensiones.length === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyStateTitle}>Aún no hay dominios registrados</p>
                  <p>Crea dominios en la evaluación antes de configurar sus niveles de logro.</p>
                </div>
              ) : (
                <>
                  {/* Selector / Tabs de cada Dominio existente */}
                  <div className={styles.domainTabsScroll}>
                    {dimensiones.map((dim, idx) => {
                      const isActive = dim.id === selectedDimId;
                      const hasSavedLevels = dim.niveles && dim.niveles.length > 0;
                      const critCount = preguntas.filter((p) => p.dimensionId === dim.id).length;

                      return (
                        <button
                          key={dim.id || idx}
                          type="button"
                          className={`${styles.domainTabBtn} ${isActive ? styles.domainTabBtnActive : ''}`}
                          onClick={() => dim.id && setSelectedDimId(dim.id)}
                        >
                          <span>{dim.nombre || `Dominio ${idx + 1}`}</span>
                          <span
                            className={`${styles.domainTabBadge} ${isActive ? styles.domainTabBadgeActive : ''}`}
                          >
                            {critCount} crit
                          </span>
                          {hasSavedLevels && <RiCheckLine className={styles.tabCheck} title="Niveles configurados" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Resumen del Dominio Seleccionado */}
                  {currentDimension && (
                    <div className={styles.domainInfoCard}>
                      <div className={styles.domainInfoLeft}>
                        <span className={styles.domainInfoTitle}>
                          {currentDimension.nombre}
                        </span>
                        <span className={styles.domainInfoMeta}>
                          {currentQuestionsCount} criterios asignados · Escala máx por criterio: {maxQuestionValue} pts · <strong>Puntaje máximo: {currentMaxScore} pts</strong>
                        </span>
                      </div>
                      <div className={styles.domainInfoActions}>
                        <button
                          type="button"
                          className={styles.btnSecondaryAction}
                          onClick={handleSuggestRanges}
                          title="Calcular rangos sugeridos proporcionales al puntaje máximo"
                        >
                          <RiMagicLine /> Sugerir rangos
                        </button>
                        {dimensiones.length > 1 && (
                          <button
                            type="button"
                            className={styles.btnSecondaryAction}
                            onClick={handleCopyToAllDomains}
                            title="Copiar estos niveles a todos los demás dominios"
                          >
                            <RiFileCopyLine /> Copiar a todos
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Lista de Niveles del Dominio Activo */}
                  <div className={styles.optionsList}>
                    {currentLevels.length === 0 ? (
                      <div className={styles.emptyState}>
                        <p className={styles.emptyStateTitle}>Sin niveles definidos</p>
                        <p>Haz clic en "Añadir nivel" o "Sugerir rangos" para empezar.</p>
                      </div>
                    ) : (
                      currentLevels.map((nivel, index) => (
                        <div key={index} className={styles.optionRow}>
                          <div className={styles.levelInputGroup}>
                            <label className={styles.label}>Nivel de Logro</label>
                            <input
                              type="text"
                              className={styles.input}
                              placeholder="Ej: Inicio, Proceso, Logrado..."
                              value={nivel.nivel}
                              onChange={(e) => handleLevelChange(index, 'nivel', e.target.value)}
                            />
                          </div>
                          <div className={styles.rangeInputGroup}>
                            <label className={styles.label}>Puntaje Mín</label>
                            <input
                              type="number"
                              className={styles.input}
                              value={nivel.min ?? 0}
                              onChange={(e) =>
                                handleLevelChange(index, 'min', Number(e.target.value))
                              }
                            />
                          </div>
                          <div className={styles.rangeInputGroup}>
                            <label className={styles.label}>Puntaje Máx</label>
                            <input
                              type="number"
                              className={styles.input}
                              value={nivel.max ?? 0}
                              onChange={(e) =>
                                handleLevelChange(index, 'max', Number(e.target.value))
                              }
                            />
                          </div>
                          <div className={styles.colorInputGroup}>
                            <label className={styles.label}>Color</label>
                            <input
                              type="color"
                              className={`${styles.input} ${styles.colorInput}`}
                              value={nivel.color || '#3b82f6'}
                              onChange={(e) => handleLevelChange(index, 'color', e.target.value)}
                            />
                          </div>
                          <button
                            type="button"
                            className={styles.removeButton}
                            onClick={() => handleRemoveLevel(index)}
                            title="Eliminar nivel"
                          >
                            <RiDeleteBin6Line />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Acciones del Footer */}
                  <div className={styles.actions}>
                    <button type="button" className={styles.addButton} onClick={handleAddLevel}>
                      <RiAddLine /> Añadir nivel
                    </button>
                    <div className={styles.submitActions}>
                      <button
                        type="button"
                        className={styles.submitButton}
                        onClick={handleSaveCurrentDomain}
                        title="Guardar niveles para el dominio seleccionado actualmente"
                      >
                        Guardar este dominio
                      </button>
                      {dimensiones.length > 1 && (
                        <button
                          type="button"
                          className={styles.submitAllButton}
                          onClick={handleSaveAllDomains}
                          title="Guardar cambios de todos los dominios a la vez"
                        >
                          Guardar todos ({dimensiones.length})
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>,
        container
      )
    : null;
};

export default ConfigurarNivelesPorDominio;
