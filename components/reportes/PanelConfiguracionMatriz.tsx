import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MdSettings,
  MdSave,
  MdCheckCircle,
  MdSchool,
  MdCategory,
  MdAddCircleOutline,
  MdDeleteOutline,
  MdErrorOutline,
  MdTableChart,
  MdArrowForward,
} from 'react-icons/md';
import { RiLoader4Line } from 'react-icons/ri';
import { Evaluaciones } from '@/features/types/types';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { getCategoriasParaGrado, categoriaTransform } from '@/fuctions/categorias';
import { gradosDeColegio, getGradoTexto } from '@/fuctions/regiones';
import {
  EtapaMatrizConfig,
  GradoConfigAssignment,
  getEtapasFromConfig,
} from '@/components/modals/ConfigurarMatrizModal';
import styles from './PanelConfiguracionMatriz.module.css';

interface PanelConfiguracionMatrizProps {
  evaluaciones: Evaluaciones[];
  configGrados: Record<string, GradoConfigAssignment>;
  onSaveConfig: (gradoId: number, categoriaId: number, config: GradoConfigAssignment) => Promise<void>;
  selectedGrado: number;
  setSelectedGrado: (gradoId: number) => void;
  selectedCategoria: number;
  setSelectedCategoria: (categoriaId: number) => void;
  onNavigateToTabla?: () => void;
  loadingConfig?: boolean;
}

export const PanelConfiguracionMatriz: React.FC<PanelConfiguracionMatrizProps> = ({
  evaluaciones = [],
  configGrados = {},
  onSaveConfig,
  selectedGrado,
  setSelectedGrado,
  selectedCategoria,
  setSelectedCategoria,
  onNavigateToTabla,
  loadingConfig = false,
}) => {
  const { categorias: contextCategorias } = useGlobalContext();
  const [etapas, setEtapas] = useState<EtapaMatrizConfig[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
  }, [selectedGrado, categoriasDisponibles, selectedCategoria, setSelectedCategoria]);

  // Al cambiar grado, categoría o la configuración entrante, actualizar las etapas
  useEffect(() => {
    const key = `${selectedGrado}_${selectedCategoria}`;
    const currentCfg = configGrados[key] || configGrados[String(selectedGrado)] || {};
    const loadedEtapas = getEtapasFromConfig(currentCfg);
    setEtapas(loadedEtapas);
    setSaveSuccess(false);

    // Advertencia preventiva si la configuración previa tenía duplicados
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

  // Filtrar evaluaciones que coincidan con el grado y categoría seleccionados
  const evalsDeGradoYCat = evaluaciones.filter(
    (ev) => Number(ev.grado) === selectedGrado && Number(ev.categoria) === selectedCategoria
  );
  const otrasEvals = evaluaciones.filter(
    (ev) => !(Number(ev.grado) === selectedGrado && Number(ev.categoria) === selectedCategoria)
  );

  const nombreGrado = getGradoTexto(selectedGrado);
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
      }, 3500);
    } catch (error) {
      console.error('Error al guardar configuración de matriz:', error);
      setErrorMessage('Ocurrió un error inesperado al intentar guardar la configuración.');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, onSaveConfig, selectedGrado, selectedCategoria, etapas, evaluaciones]);

  // Renderizador de opciones con deshabilitación preventiva de duplicados
  const renderEvaluacionOptions = (currentEtapaId: string) => {
    const getEtapaAsignada = (evalId?: string) =>
      evalId
        ? etapas.find((et) => et.id !== currentEtapaId && Boolean(et.evaluacionId) && et.evaluacionId === evalId)
        : undefined;

    return (
      <>
        <option value="">-- Sin evaluación asignada --</option>
        {evalsDeGradoYCat.length > 0 && (
          <optgroup label={`Evaluaciones de ${nombreGrado} - ${nombreCategoria.toUpperCase()}`}>
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

  return (
    <div className={styles.container}>
      {/* Header del Panel */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIconBadge}>
            <MdSettings />
          </div>
          <div>
            <h2 className={styles.title}>Configuración de Etapas de Evaluación</h2>
            <p className={styles.subtitle}>
              Asigna y gestiona qué evaluación corresponde a cada etapa (EDI, EP1, EP2, EP3...) para este grado y área.
            </p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.scopeBadge}>
            <span className={styles.scopeDot} />
            <span>{nombreGrado} • {nombreCategoria}</span>
          </div>
          {onNavigateToTabla && (
            <button
              type="button"
              className={styles.shortcutBtn}
              onClick={onNavigateToTabla}
              title="Ir directamente a la Tabla Comparativa"
            >
              <MdTableChart />
              <span>Ver Tabla</span>
            </button>
          )}
        </div>
      </div>

      {/* Selectores de Grado y Área sincronizados */}
      <div className={styles.selectorsRow}>
        <div className={styles.selectGroup}>
          <label htmlFor="panel-select-grado" className={styles.selectLabel}>
            <MdSchool className={styles.selectLabelIcon} />
            <span>Grado Escolar:</span>
          </label>
          <select
            id="panel-select-grado"
            value={selectedGrado}
            onChange={(e) => setSelectedGrado(Number(e.target.value))}
            disabled={loadingConfig || isSaving}
            className={styles.selectInput}
          >
            {gradosDeColegio.map((g) => {
              const tieneAlgunaConfig = Object.keys(configGrados).some(
                (k) => k === String(g.id) || k.startsWith(`${g.id}_`)
              );
              return (
                <option key={g.id} value={g.id}>
                  {g.name.toUpperCase()} {tieneAlgunaConfig ? '✓ (Configurado)' : ''}
                </option>
              );
            })}
          </select>
        </div>

        <div className={styles.selectGroup}>
          <label htmlFor="panel-select-categoria" className={styles.selectLabel}>
            <MdCategory className={styles.selectLabelIcon} />
            <span>Área / Categoría:</span>
          </label>
          <select
            id="panel-select-categoria"
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(Number(e.target.value))}
            disabled={loadingConfig || isSaving}
            className={styles.selectInput}
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

      {/* Sección de Gestión de Etapas */}
      <div className={styles.etapasSection}>
        <div className={styles.etapasHeaderRow}>
          <div className={styles.etapasHeaderLeft}>
            <p className={styles.sectionHint}>
              Etapas de evaluación para <strong>{nombreGrado}</strong> - <strong>{nombreCategoria.toUpperCase()}</strong>:
            </p>
            <span className={styles.etapasCountBadge}>
              {etapas.length} {etapas.length === 1 ? 'etapa' : 'etapas'}
            </span>
          </div>

          {/* Botón Destacado de Nueva Etapa */}
          <button
            type="button"
            className={styles.addEtapaHeaderBtn}
            onClick={handleAddEtapa}
            disabled={isSaving}
            title={`Agregar nueva etapa progresiva (EP${nextStageNum})`}
          >
            <MdAddCircleOutline className={styles.addIcon} />
            <span>+ Agregar Etapa (EP{nextStageNum})</span>
          </button>
        </div>

        {/* Lista de Tarjetas de Etapa */}
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
                  disabled={isSaving}
                  className={styles.evalSelect}
                  aria-label={`Seleccionar evaluación para ${etapa.nombre}`}
                >
                  {renderEvaluacionOptions(etapa.id)}
                </select>
                {etapas.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => handleRemoveEtapa(etapa.id)}
                    disabled={isSaving}
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
          className={styles.addEtapaBottomBtn}
          onClick={handleAddEtapa}
          disabled={isSaving}
        >
          <MdAddCircleOutline />
          <span>Agregar otra Etapa de Evaluación (EP{nextStageNum})</span>
        </button>
      </div>

      {/* Alertas de Error y Éxito */}
      {errorMessage && (
        <div className={styles.errorBanner}>
          <MdErrorOutline className={styles.errorIcon} />
          <span>{errorMessage}</span>
        </div>
      )}

      {saveSuccess && (
        <div className={styles.successBanner}>
          <MdCheckCircle />
          <span>¡Asignación guardada con éxito para {nombreGrado} - {nombreCategoria.toUpperCase()}!</span>
        </div>
      )}

      {/* Pie de página con acciones principales */}
      <div className={styles.footerRow}>
        <div className={styles.footerHint}>
          Los cambios se guardan y sincronizan automáticamente para la Matriz Regional.
        </div>
        <div className={styles.footerButtons}>
          {onNavigateToTabla && (
            <button
              type="button"
              className={styles.viewTablaBtn}
              onClick={onNavigateToTabla}
              disabled={isSaving}
            >
              <MdTableChart />
              <span>Ver Tabla Comparativa</span>
              <MdArrowForward />
            </button>
          )}

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
      </div>
    </div>
  );
};

export default PanelConfiguracionMatriz;
