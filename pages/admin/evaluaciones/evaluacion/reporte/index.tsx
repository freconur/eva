import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useRouter } from 'next/router';
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useColorsFromCSS } from '@/features/hooks/useColorsFromCSS';
import { ModoOrganizarModal } from '@/components/reportes/ModoOrganizarModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { PreguntasRespuestas } from '@/features/types/types';
import { RiLoader4Line } from 'react-icons/ri';
import styles from './Reporte.module.css';
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista';
import AcordeonGraficosTendencia from '@/components/reportes/AcordeonGraficosTendencia';
import AcordeonReportePregunta from '@/components/reportes/AcordeonReportePregunta';
import PieChartComponent from '@/components/reportes/PieChartComponent';
import BarChartDirectores from '@/components/reportes/BarChartDirectores';
import ParticipacionDirectoresChart from '@/components/reportes/ParticipacionDirectoresChart';
import BarChartDocentes from '@/components/reportes/BarChartDocentes';
import BarChartDocentesBuckets from '@/components/reportes/BarChartDocentesBuckets';
import BarChartDocenteDetalle from '@/components/reportes/BarChartDocenteDetalle';
import BarChartUgelStacked from '@/components/reportes/BarChartUgelStacked';

// Modularized Components
import HeaderControlesReporte from '@/components/reportes/HeaderControlesReporte';
import TablaParticipacionDirectores from '@/components/reportes/TablaParticipacionDirectores';

// Hook
import { useReporteAdmin } from '@/features/hooks/useReporteAdmin';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
  plugins: {
    legend: {
      position: 'center' as const,
    },
    title: {
      display: true,
      text: 'estadistica de respuestas',
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: 'rgba(59, 130, 246, 0.5)',
      borderWidth: 2,
      cornerRadius: 12,
      displayColors: true,
      titleFont: {
        size: 16,
        weight: 'bold' as const,
        family: "'Inter', 'Helvetica', 'Arial', sans-serif",
      },
      bodyFont: {
        size: 14,
        family: "'Inter', 'Helvetica', 'Arial', sans-serif",
      },
      padding: 16,
      titleSpacing: 8,
      bodySpacing: 8,
      boxPadding: 8,
      callbacks: {
        title: function (context: any) {
          return `📊 Alternativa: ${context[0].label.toUpperCase()}`;
        },
        label: function (context: any) {
          const value = context.parsed.y;
          const dataset = context.dataset;
          const total = Array.isArray(dataset.data)
            ? dataset.data.reduce((a: number, b: number) => a + b, 0)
            : 0;
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
          return [
            `👥 Cantidad: ${value.toLocaleString('es-PE')}`,
            `📈 Porcentaje: ${percentage}%`,
            `📊 Total: ${total.toLocaleString('es-PE')}`,
          ];
        },
        labelColor: function (context: any) {
          const dataset = context.dataset;
          const index = context.dataIndex;
          const borderColor = Array.isArray(dataset.borderColor)
            ? dataset.borderColor[index]
            : (typeof dataset.borderColor === 'string' ? dataset.borderColor : '#6b7280');
          const backgroundColor = Array.isArray(dataset.backgroundColor)
            ? dataset.backgroundColor[index]
            : (typeof dataset.backgroundColor === 'string' ? dataset.backgroundColor : '#6b7280');

          return {
            borderColor: borderColor,
            backgroundColor: backgroundColor,
            borderWidth: 3,
            borderRadius: 4,
          };
        },
      },
    },
  },
  scales: {
    x: {
      ticks: {
        color: function (context: any) {
          const chart = context.chart;
          const dataset = chart.data.datasets[0];
          const index = context.index;
          const bgColor = Array.isArray(dataset.backgroundColor)
            ? dataset.backgroundColor[index]
            : (typeof dataset.backgroundColor === 'string' ? dataset.backgroundColor : '');
          if (bgColor.includes('34, 197, 94') || bgColor.includes('rgb(34, 197, 94)')) {
            return '#22c55e';
          }
          return '#374151';
        },
        font: {
          size: 13,
          weight: '600' as const,
          family: "'Inter', 'Helvetica', 'Arial', sans-serif",
        },
      },
    },
  },
};

const Reporte = () => {
  const router = useRouter();
  const {
    currentUserData,
    preguntasRespuestas,
    loaderReporteDirector,
    evaluacion,
    dataGraficoTendenciaNiveles,
    dataGraficoUgelStacked,
    loaderDataGraficoUgelStacked,
  } = useGlobalContext();

  const {
    filtros,
    setFiltros,
    distritosDisponibles,
    loadingExport,
    rangoMes,
    setRangoMes,
    dataDirectoresBar,
    loadingDirectoresBar,
    chartColumns,
    setChartColumns,
    questionColumns,
    setQuestionColumns,
    dataReportePreguntas,
    loadingReportePreguntas,
    fullDocentesData,
    selectedRange,
    selectedDirectorStatus,
    setSelectedDirectorStatus,
    searchTermDirector,
    setSearchTermDirector,
    selectedRegionDirector,
    setSelectedRegionDirector,
    pageSizeDirector,
    setPageSizeDirector,
    consolidationStatus,
    loadingConsolidado,
    monthSelected,
    setMonthSelected,
    yearSelected,
    years,
    handleChangeYear,
    handleChangeFiltros,
    handleRangoChange,
    handleRestablecerFiltros,
    handleBarClick,
    handleDirectorSegmentClick,
    handleSaveMeta,
    handleFiltrarPreguntas,
    handleGenerarConsolidado,
    handleDetenerConsolidado,
    handleExportEstudiantesToExcel,
    handleExportEstudiantesToExcelFronted,
    computedDocentesBuckets,
    filteredDocentesByRange,
    filteredDirectoresByStatus,
    directoresStats,
    hasPieChartData,
    drillDownRef,
    directorsDetailRef,
    loadingCrearEstudiantes,
    loadingProfesoresBuckets,
    handleExportToExcel,
    loadConsolidado,
    fetchBarGraphicsData,
    fetchReportePreguntas,
  } = useReporteAdmin();

  const { prepareBarChartData } = useColorsFromCSS();

  const defaultLayout = [
    'pie_chart',
    'ugel_stacked',
    'directores_bar',
    'docentes_bar',
    'docentes_buckets',
    'participacion_directores',
  ];

  const defaultVisibility = [
    'pie_chart',
    'ugel_stacked',
    'directores_bar',
    'docentes_bar',
    'docentes_buckets',
    'participacion_directores',
    'docente_detalle',
    'graficos_tendencia',
    'reporte_preguntas',
    'tabla_directores',
  ];

  const [ordenGraficos, setOrdenGraficos] = useState<string[]>(defaultLayout);
  const [elementosVisibles, setElementosVisibles] = useState<string[]>(defaultVisibility);
  const [mounted, setMounted] = useState(false);
  const [isOrganizerOpen, setIsOrganizerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (evaluacion?.id) {
      const savedLayout = localStorage.getItem(`report-layout-order-${evaluacion.id}`);
      if (savedLayout) {
        try {
          const parsed = JSON.parse(savedLayout);
          if (Array.isArray(parsed) && parsed.length === defaultLayout.length) {
            setOrdenGraficos(parsed);
          }
        } catch (e) {
          console.error("Error loading layout order:", e);
        }
      }

      const savedVisibility = localStorage.getItem(`report-layout-visibility-${evaluacion.id}`);
      if (savedVisibility) {
        try {
          const parsed = JSON.parse(savedVisibility);
          if (Array.isArray(parsed)) {
            setElementosVisibles(parsed);
          }
        } catch (e) {
          console.error("Error loading layout visibility:", e);
        }
      }
    }
  }, [evaluacion?.id, defaultLayout.length]);

  const renderChart = (idGrafico: string) => {
    const gridItemClass = chartColumns === 1 
      ? styles.gridItemFull 
      : chartColumns === 2 
      ? styles.gridItemHalf 
      : styles.gridItemThird;

    const chartNode = (() => {
      switch (idGrafico) {
        case 'pie_chart':
          return evaluacion.tipoDeEvaluacion === '1' && (
            <PieChartComponent
              monthSelected={monthSelected}
              yearSelected={yearSelected}
              dataGraficoTendenciaNiveles={dataGraficoTendenciaNiveles}
              filtros={filtros}
              onFilterChange={(name, value) => {
                setFiltros(prev => ({ ...prev, [name]: value }));
              }}
            />
          );
        case 'ugel_stacked':
          return evaluacion.tipoDeEvaluacion === '1' && (
            loaderDataGraficoUgelStacked ? (
              <div className={styles.loaderContainer} style={{ minHeight: '300px' }}>
                <div className={styles.loaderContent}>
                  <RiLoader4Line className={styles.loaderIcon} />
                  <span className={styles.loaderText}>Procesando comparativa regional...</span>
                </div>
              </div>
            ) : (
              dataGraficoUgelStacked && dataGraficoUgelStacked.length > 0 && (
                <BarChartUgelStacked data={dataGraficoUgelStacked} />
              )
            )
          );
        case 'directores_bar':
          return evaluacion.tipoDeEvaluacion === '1' && (
            loadingDirectoresBar ? (
              <div className={styles.loaderContainer} style={{ minHeight: '300px' }}>
                <div className={styles.loaderContent}>
                  <RiLoader4Line className={styles.loaderIcon} />
                  <span className={styles.loaderText}>Procesando analytics de directores...</span>
                </div>
              </div>
            ) : (
              dataDirectoresBar && dataDirectoresBar.length > 0 && (
                <BarChartDirectores data={dataDirectoresBar} />
              )
            )
          );
        case 'docentes_bar':
          return evaluacion.tipoDeEvaluacion === '1' && !loadingProfesoresBuckets && fullDocentesData && fullDocentesData.length > 0 && (
            <BarChartDocentes data={fullDocentesData} />
          );
        case 'docentes_buckets':
          return evaluacion.tipoDeEvaluacion === '1' && (
            loadingProfesoresBuckets ? (
              <div className={styles.loaderContainer} style={{ minHeight: '200px' }}>
                <div className={styles.loaderContent}>
                  <RiLoader4Line className={styles.loaderIcon} />
                  <span className={styles.loaderText}>Cargando distribución de docentes...</span>
                </div>
              </div>
            ) : (
              computedDocentesBuckets.length > 0 && (
                <BarChartDocentesBuckets
                  data={computedDocentesBuckets}
                  totalDocentes={fullDocentesData?.length || 0}
                  onBarClick={handleBarClick}
                />
              )
            )
          );
        case 'participacion_directores':
          return evaluacion.tipoDeEvaluacion === '1' && (
            loadingDirectoresBar ? (
              <div className={styles.loaderContainer} style={{ minHeight: '300px' }}>
                <div className={styles.loaderContent}>
                  <RiLoader4Line className={styles.loaderIcon} />
                  <span className={styles.loaderText}>Cargando participación...</span>
                </div>
              </div>
            ) : (
              dataDirectoresBar && dataDirectoresBar.length > 0 && (
                <ParticipacionDirectoresChart 
                  data={dataDirectoresBar} 
                  onSegmentClick={handleDirectorSegmentClick}
                />
              )
            )
          );
        default:
          return null;
      }
    })();

    if (!chartNode) return null;

    return (
      <div key={idGrafico} className={gridItemClass}>
        {chartNode}
      </div>
    );
  };

  const iterateData = (data: any, respuesta: string) => {
    const chartData = prepareBarChartData(data, respuesta);
    if (chartData && chartData.labels) {
      chartData.labels = chartData.labels.map((label: string) => label.toUpperCase());
    }
    return chartData;
  };

  const preguntasOrdenadas = useMemo(() => {
    return [...(preguntasRespuestas || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [preguntasRespuestas]);

  const preguntasMap = useMemo(() => {
    const map = new Map<string, PreguntasRespuestas>();
    preguntasOrdenadas.forEach((pregunta) => {
      if (pregunta.id) {
        map.set(pregunta.id, pregunta);
      }
    });
    return map;
  }, [preguntasOrdenadas]);

  const iterarPregunta = useCallback(
    (idPregunta: string) => {
      const pregunta = preguntasMap.get(idPregunta);
      if (!pregunta) {
        return <p>Pregunta no encontrada</p>;
      }
      return (
        <>
          <h3 className="text-slate-500 mr-2">{pregunta.pregunta}</h3>
          <h3 className="text-slate-500 mr-2">
            <span className="text-colorSegundo mr-2 font-semibold">Actuación:</span>{' '}
            {pregunta.preguntaDocente}
          </h3>
        </>
      );
    },
    [preguntasMap]
  );

  const obtenerRespuestaPorId = useCallback(
    (idPregunta: string): string => {
      const pregunta = preguntasMap.get(idPregunta);
      return pregunta?.respuesta || '';
    },
    [preguntasMap]
  );

  if (loaderReporteDirector || !evaluacion) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.loaderContent}>
          <RiLoader4Line className={styles.loaderIcon} />
          <span className={styles.loaderText}>...cargando</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.mainContainer}>
        <main>
          <HeaderControlesReporte
            evaluacion={evaluacion}
            styles={styles}
            monthSelected={monthSelected}
            setMonthSelected={setMonthSelected}
            yearSelected={yearSelected}
            years={years}
            handleChangeYear={handleChangeYear}
            chartColumns={chartColumns}
            setChartColumns={setChartColumns}
            loadingExportEstudiantes={loadingCrearEstudiantes || loadingExport}
            handleExportEstudiantesToExcel={handleExportEstudiantesToExcel}
            loadingExport={loadingExport}
            handleExportToExcel={handleExportToExcel}
            currentUserData={currentUserData}
            loadConsolidado={loadConsolidado}
            fetchBarGraphicsData={fetchBarGraphicsData}
            fetchReportePreguntas={fetchReportePreguntas}
            handleGenerarConsolidado={handleGenerarConsolidado}
            loadingConsolidado={loadingConsolidado}
            hasPieChartData={hasPieChartData}
            consolidationStatus={consolidationStatus}
            handleDetenerConsolidado={handleDetenerConsolidado}
            onOpenOrganizer={() => setIsOrganizerOpen(true)}
          />

          <div className={styles.chartsGrid}>
            {(mounted ? ordenGraficos : defaultLayout)
              .filter((id) => elementosVisibles.includes(id))
              .map((idGrafico) => renderChart(idGrafico))}
          </div>

          {/* Detalle de Docentes (Leaderboard Stacked) */}
          <div ref={drillDownRef}>
            {elementosVisibles.includes('docente_detalle') && selectedRange && filteredDocentesByRange.length > 0 && (
              <BarChartDocenteDetalle
                data={filteredDocentesByRange}
                selectedRange={selectedRange || ''}
                metaSatisfactorio={evaluacion?.metaSatisfactorio || 80}
                onSaveMeta={handleSaveMeta}
              />
            )}
          </div>

          {elementosVisibles.includes('graficos_tendencia') && evaluacion.tipoDeEvaluacion === '1' && (
            <AcordeonGraficosTendencia
              rangoMes={rangoMes}
              monthSelected={monthSelected}
              yearSelected={yearSelected}
              setRangoMes={setRangoMes}
              onRangoChange={handleRangoChange}
              idEvaluacion={`${router.query.idEvaluacion}`}
            />
          )}

          {/* Componente de acordeón para reporte por pregunta */}
          {elementosVisibles.includes('reporte_preguntas') && (
            <AcordeonReportePregunta
              preguntasMap={preguntasMap}
              iterarPregunta={iterarPregunta}
              obtenerRespuestaPorId={obtenerRespuestaPorId}
              iterateData={iterateData}
              options={options}
              filtros={filtros}
              distritosDisponibles={distritosDisponibles}
              handleChangeFiltros={handleChangeFiltros}
              handleRestablecerFiltros={handleRestablecerFiltros}
              handleFiltrar={handleFiltrarPreguntas}
              yearSelected={yearSelected}
              dataReportePreguntas={dataReportePreguntas}
              loadingReportePreguntas={loadingReportePreguntas}
              questionColumns={questionColumns}
              setQuestionColumns={setQuestionColumns}
              globalStyles={styles}
              mostrarDistrito={(evaluacion as any)?.realtimeEnabled === true}
            />
          )}

          {/* Detalle de Directores (Participación) */}
          {elementosVisibles.includes('tabla_directores') && (
            <TablaParticipacionDirectores
              styles={styles}
              directorsDetailRef={directorsDetailRef}
              selectedDirectorStatus={selectedDirectorStatus}
              setSelectedDirectorStatus={setSelectedDirectorStatus}
              selectedRegionDirector={selectedRegionDirector}
              setSelectedRegionDirector={setSelectedRegionDirector}
              pageSizeDirector={pageSizeDirector}
              setPageSizeDirector={setPageSizeDirector}
              searchTermDirector={searchTermDirector}
              setSearchTermDirector={setSearchTermDirector}
              filteredDirectoresByStatus={filteredDirectoresByStatus}
              directoresStats={directoresStats}
            />
          )}
        </main>

        <ModoOrganizarModal
          isOpen={isOrganizerOpen}
          onClose={() => setIsOrganizerOpen(false)}
          ordenGraficos={ordenGraficos}
          onOrderChange={(newOrder) => {
            setOrdenGraficos(newOrder);
            if (evaluacion?.id) {
              localStorage.setItem(`report-layout-order-${evaluacion.id}`, JSON.stringify(newOrder));
            }
          }}
          defaultLayout={defaultLayout}
          elementosVisibles={elementosVisibles}
          onVisibilityChange={(newVisible) => {
            setElementosVisibles(newVisible);
            if (evaluacion?.id) {
              localStorage.setItem(`report-layout-visibility-${evaluacion.id}`, JSON.stringify(newVisible));
            }
          }}
          defaultVisibility={defaultVisibility}
        />
      </div>
    </>
  );
};

export default Reporte;
Reporte.Auth = PrivateRouteEspecialista;
