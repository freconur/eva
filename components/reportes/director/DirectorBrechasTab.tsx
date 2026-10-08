import React, { useState, useEffect, useMemo } from 'react';
import {
  MdBubbleChart,
  MdFactCheck,
  MdAssignment,
  MdClass,
  MdRestartAlt,
} from 'react-icons/md';
import { Evaluaciones, PreguntasRespuestas } from '@/features/types/types';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { getCategoriasParaGrado } from '@/fuctions/categorias';
import CustomFilterDropdown, { FilterOption } from '@/components/reportes/CustomFilterDropdown';
import { DirectorMetricasResumen } from './types';
import { useEvaluacionesMatriz } from './useEvaluacionesMatriz';
import DirectorBurbujasTab from './DirectorBurbujasTab';
import DirectorDecisionesTab from './DirectorDecisionesTab';
import DirectorCategoriaTabs, {
  EmptyCategoriaState,
  formatCategoriaLabel,
} from './DirectorCategoriaTabs';
import tabsStyles from './DirectorTabsNav.module.css';

interface DirectorBrechasTabProps {
  metricas: DirectorMetricasResumen;
  preguntas: PreguntasRespuestas[];
  evaluacion?: Evaluaciones;
  evaluacionesDb?: Evaluaciones[];
  initialGrado?: number | string;
  initialSeccion?: string;
  onSelectEvaluacion?: (idEvaluacion: string, mesDelExamen?: number) => void;
  onOpenQuestionDetail: (order: number, coords: { x: number; y: number }) => void;
  onOpenGuiaBurbujas: () => void;
  onOpenGuiaDecisiones: () => void;
  onOpenBaremoModal?: () => void;
}

export const DirectorBrechasTab: React.FC<DirectorBrechasTabProps> = ({
  metricas,
  preguntas,
  evaluacion,
  evaluacionesDb = [],
  initialGrado,
  initialSeccion,
  onSelectEvaluacion,
  onOpenQuestionDetail,
  onOpenGuiaBurbujas,
  onOpenGuiaDecisiones,
}) => {
  const { categorias: contextCategorias } = useGlobalContext();

  const [subTab, setSubTab] = useState<'burbujas' | 'decisiones'>('burbujas');
  const [selectedSeccion, setSelectedSeccion] = useState<string>(
    initialSeccion && initialSeccion.trim() ? initialSeccion : 'all'
  );

  // Grado actual de la evaluación o del filtro
  const currentGrado = evaluacion?.grado !== undefined
    ? Number(evaluacion.grado)
    : initialGrado !== undefined && initialGrado !== ''
    ? Number(initialGrado)
    : 2;

  // Estado de categoría de área curricular activa (por defecto la de la evaluación o la 1 = LEE)
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number>(() => {
    if (evaluacion?.categoria !== undefined && evaluacion?.categoria !== null) {
      return Number(evaluacion.categoria);
    }
    return 1;
  });

  // Mantener sincronizada la pestaña de categoría cuando se cargue o cambie la evaluación
  useEffect(() => {
    if (evaluacion?.categoria !== undefined && evaluacion?.categoria !== null) {
      setSelectedCategoriaId(Number(evaluacion.categoria));
    }
  }, [evaluacion?.categoria]);

  // 1. Integración de configuraciones/matriz_resultados para EDI, EP1, EP2
  const {
    selectedEtapa,
    etapaOptions,
    handleSelectEtapa,
    handleSelectCategoria,
    matrizConfigGrados,
  } = useEvaluacionesMatriz({
    evaluacion,
    evaluacionesDb,
    selectedCategoriaId,
    onSelectEvaluacion,
  });

  // Categorías de área curricular disponibles según el grado y nivel (Primaria vs Secundaria vs Inicial)
  const categoriasDisponibles = useMemo(() => {
    return getCategoriasParaGrado(currentGrado, contextCategorias, evaluacionesDb);
  }, [currentGrado, contextCategorias, evaluacionesDb]);

  // Categorías con configuración asignada en este grado para botones de recuperación
  const configuredCategories = useMemo(() => {
    return categoriasDisponibles.filter((cat) => {
      const assignment = matrizConfigGrados[`${currentGrado}_${cat.id}`];
      return !!(assignment && (assignment.ediId || assignment.ep1Id || assignment.ep2Id));
    });
  }, [categoriasDisponibles, matrizConfigGrados, currentGrado]);

  // Verificar si la categoría actualmente seleccionada tiene asignación o evaluación activa
  const selectedCategoryAssignment = matrizConfigGrados[`${currentGrado}_${selectedCategoriaId}`];
  const isSelectedCategoryConfigured = !!(
    selectedCategoryAssignment &&
    (selectedCategoryAssignment.ediId || selectedCategoryAssignment.ep1Id || selectedCategoryAssignment.ep2Id)
  );

  const hasActiveEvaluationForCategory =
    (evaluacion?.categoria !== undefined && Number(evaluacion.categoria) === selectedCategoriaId) ||
    isSelectedCategoryConfigured;

  // Handler al hacer clic en una pestaña de categoría de área
  const handleCategoriaChange = (catId: number) => {
    setSelectedCategoriaId(catId);
    handleSelectCategoria(catId);
  };

  // 2. Opciones dinámicas para el filtro de sección del colegio
  const seccionOptions: FilterOption[] = useMemo(() => {
    const list: FilterOption[] = [
      {
        value: 'all',
        label: `Todas las secciones (${metricas.secciones.length} aulas)`,
        badge: `${metricas.totalIe?.totalEstudiantes || 0} eval.`,
        badgeType: 'neutral',
      },
    ];

    metricas.secciones.forEach((sec) => {
      list.push({
        value: String(sec.id),
        label: sec.nombre,
        badge: `${sec.totalEstudiantes} eval.`,
        badgeType: sec.criticas > 0 ? 'warning' : 'neutral',
      });
    });

    return list;
  }, [metricas.secciones, metricas.totalIe?.totalEstudiantes]);

  // 3. Filtrar métricas por sección seleccionada si no es 'all'
  const filteredMetricas = useMemo<DirectorMetricasResumen>(() => {
    if (selectedSeccion === 'all') return metricas;

    const matched = metricas.secciones.filter(
      (sec) => String(sec.id) === String(selectedSeccion)
    );

    if (matched.length > 0) {
      const sec = matched[0];
      return {
        ...metricas,
        secciones: matched,
        kpis: {
          totalCritico: sec.criticas,
          totalAlto: sec.altas,
          totalMedio: sec.medias,
          totalBajo: sec.bajas,
          avgPrev: sec.avgPrev,
        },
      };
    }

    return metricas;
  }, [metricas, selectedSeccion]);

  // Nombre formateado de la categoría activa para mensajes de estado
  const currentCategoryObj = categoriasDisponibles.find((c) => Number(c.id) === selectedCategoriaId);
  const currentCategoryName = currentCategoryObj
    ? formatCategoriaLabel(currentCategoryObj.categoria)
    : `ÁREA ${selectedCategoriaId}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
      {/* 1. Selector de Pestañas de Áreas Curriculares según el Nivel Educativo (Primaria / Secundaria) */}
      <DirectorCategoriaTabs
        grado={currentGrado}
        selectedCategoriaId={selectedCategoriaId}
        onSelectCategoria={handleCategoriaChange}
        matrizConfigGrados={matrizConfigGrados}
        evaluacionesDb={evaluacionesDb}
      />

      {/* Si el área seleccionada no tiene evaluaciones asignadas, mostrar estado vacío accesible */}
      {!hasActiveEvaluationForCategory ? (
        <div
          key={`empty_${selectedCategoriaId}`}
          className={tabsStyles.tabContentPanel}
          role="tabpanel"
          tabIndex={0}
        >
          <EmptyCategoriaState
            categoriaName={currentCategoryName}
            grado={currentGrado}
            configuredCategories={configuredCategories}
            onSelectCategoria={handleCategoriaChange}
          />
        </div>
      ) : (
        <>
          {/* ESPACIO DE TRABAJO DEL ÁREA CURRICULAR SELECCIONADA (MASTER WORKSPACE CARD) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mt-1 mb-4">
            {/* Cabecera / Barra de Herramientas del Área Activa */}
            <div className="bg-gradient-to-r from-slate-50/90 via-slate-50 to-blue-50/30 border-b border-slate-200/80 p-3 sm:p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5">
                {/* Izquierda: Badge de Área + Switcher de Enfoque (Matriz de Burbujas vs. Decisiones) */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-900 text-xs sm:text-sm font-bold shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    <span className="text-slate-500 font-semibold">Área:</span>
                    <span className="text-blue-900 font-extrabold">{currentCategoryName}</span>
                  </div>

                  <div
                    className="inline-flex items-center p-1 bg-white rounded-xl border border-slate-200/90 shadow-2xs h-[42px]"
                    role="tablist"
                    aria-label="Enfoque de análisis pedagógico"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={subTab === 'burbujas'}
                      onClick={() => setSubTab('burbujas')}
                      className={`h-full inline-flex items-center gap-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer outline-none ${
                        subTab === 'burbujas'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                      title="Visualización gráfica de criticidad por aula"
                    >
                      <MdBubbleChart className="w-4 h-4 shrink-0" />
                      <span className="whitespace-nowrap">Matriz de Burbujas</span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={subTab === 'decisiones'}
                      onClick={() => setSubTab('decisiones')}
                      className={`h-full inline-flex items-center gap-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer outline-none ${
                        subTab === 'decisiones'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                      title="Panel de toma de decisiones e intervención pedagógica"
                    >
                      <MdFactCheck className="w-4 h-4 shrink-0" />
                      <span className="whitespace-nowrap">Decisiones</span>
                      {filteredMetricas.kpis.totalCritico > 0 && (
                        <span
                          className={`px-1.5 py-0.5 text-[11px] font-bold rounded-full transition-colors shrink-0 ${
                            subTab === 'decisiones'
                              ? 'bg-white/20 text-white'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {filteredMetricas.kpis.totalCritico} críticas
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Derecha: Filtros Contextuales de Evaluación (EDI, EP1, EP2) y Sección */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <CustomFilterDropdown
                    label="Evaluación:"
                    icon={<MdAssignment style={{ color: '#2563eb', fontSize: '1.15rem' }} />}
                    value={selectedEtapa}
                    options={etapaOptions}
                    onChange={handleSelectEtapa}
                    minWidth={195}
                  />

                  <CustomFilterDropdown
                    label="Sección:"
                    icon={<MdClass style={{ color: '#2563eb', fontSize: '1.15rem' }} />}
                    value={selectedSeccion}
                    options={seccionOptions}
                    onChange={(val) => setSelectedSeccion(val)}
                    minWidth={210}
                    showSearch={seccionOptions.length > 5}
                  />

                  {selectedSeccion !== 'all' && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 h-[38px] rounded-xl text-xs font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 transition-colors shadow-2xs cursor-pointer"
                      onClick={() => setSelectedSeccion('all')}
                      title="Mostrar todas las secciones de la institución educativa"
                    >
                      <MdRestartAlt className="w-4 h-4 shrink-0" />
                      <span className="hidden sm:inline">Todas las aulas</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Contenido dinámico del área seleccionada */}
            <div
              key={`${selectedCategoriaId}_${selectedEtapa}_${subTab}_${evaluacion?.id || ''}`}
              className="p-4 sm:p-5"
              role="tabpanel"
              tabIndex={0}
            >
              {subTab === 'burbujas' ? (
                <DirectorBurbujasTab
                  metricas={filteredMetricas}
                  preguntas={preguntas}
                  evaluacion={evaluacion}
                  onOpenQuestionDetail={onOpenQuestionDetail}
                  onOpenGuiaModal={onOpenGuiaBurbujas}
                />
              ) : (
                <DirectorDecisionesTab
                  metricas={filteredMetricas}
                  preguntas={preguntas}
                  onOpenQuestionDetail={onOpenQuestionDetail}
                  onOpenGuiaModal={onOpenGuiaDecisiones}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DirectorBrechasTab;
