import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useReporteDocente } from '@/features/hooks/useReporteDocente';
import {
  Alternativa,
  DataEstadisticas,
  Estudiante,
  PreguntasRespuestas,
} from '@/features/types/types';
import { useRouter } from 'next/router';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  ChartData,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { RiLoader4Line } from 'react-icons/ri';
import * as XLSX from 'xlsx';
import { MdDeleteForever } from 'react-icons/md';
import DeleteEstudiante from '@/modals/deleteEstudiante';
import styles from './reporte.module.css';
import { currentMonth, getAllMonths, getMonthName } from '@/fuctions/dates';
import { ordernarAscDsc } from '@/fuctions/regiones';
import { read, utils, writeFile } from 'xlsx';
import { exportEstudiantesToExcel } from '@/features/utils/excelExport';
import { useGenerarPDFReporte } from '@/features/hooks/useGenerarPDFReporte';
import Link from 'next/link';
import ReporteEvaluacionPorPregunta from './reporteEvaluacionPorPregunta';
import PieChartComponent from '@/components/reportes/PieChartComponent';
import { generarDataGraficoPiechart } from '@/features/utils/generar-data-grafico-piechart';
import { TablaPreguntas } from '@/components/tabla-preguntas';
import { calculoNivel } from '@/features/utils/calculoNivel';
import GraficoTendenciaColegio from '@/components/grafico-tendencia';
import CorregirPuntajesModal from '@/modals/corregirPuntajes';
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

const Reportes = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [showTable, setShowtable] = useState<boolean>(true);
  const [showDeleteEstudiante, setShowDeleteEstudiante] = useState<boolean>(false);
  const [showCorregirPuntajesModal, setShowCorregirPuntajesModal] = useState<boolean>(false);
  const route = useRouter();
  const {
    estudiantes,
    currentUserData,
    dataEstadisticas,
    preguntasRespuestas,
    evaluacion,
    loaderPages,
    loaderReporteDirector,
    warningEvaEstudianteSinRegistro,
  } = useGlobalContext();
  const {
    estudiantesQueDieronExamen,
    filtroEstudiantes,
    estadisticasEstudiantesDelDocente,
    datosPorMes,
    mesesConDataDisponibles,
    añosConDataDisponibles,
    obtenerAñosConData,
    promedioGlobal,
    estudiantesQueDieronExamenPorMes,
    corregirPuntajesEstudiantes,
    loaderCorreccionPuntajes,
    correccionPuntajesExitoso,
    setCorreccionPuntajesExitoso,
    correccionPuntajesError,
    setCorreccionPuntajesError
  } = useReporteDocente();
  const { getPreguntasRespuestas, getEvaluacion } = useAgregarEvaluaciones();
  const [idEstudiante, setIdEstudiante] = useState<string>('');
  const [yearSelected, setYearSelected] = useState<string>('');
  const [monthSelected, setMonthSelected] = useState<number>(currentMonth);
  const [order, setOrder] = useState<number>(0);
  const handleShowTable = () => {
    setShowtable(!showTable);
  };

  const handleExportToExcel = () => {
    setLoading(true);
    try {
      const fileName = `estudiantes_${currentUserData.dni}_${getMonthName(monthSelected)}.xlsx`;
      exportEstudiantesToExcel(estudiantes, fileName);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
    } finally {
      setLoading(false);
    }
  };

  // Crear un mapa optimizado de preguntas por ID para evitar búsquedas repetidas O(1) en lugar de O(n)
  const preguntasMap = useMemo(() => {
    const map = new Map<string, PreguntasRespuestas>();
    preguntasRespuestas.forEach((pregunta) => {
      if (pregunta.id) {
        map.set(pregunta.id, pregunta);
      }
    });
    return map;
  }, [preguntasRespuestas]);

  // Ordenar dataEstadisticas por el order de las preguntas correspondientes
  const dataEstadisticasOrdenadas = useMemo(() => {
    if (!dataEstadisticas || !preguntasRespuestas.length) return dataEstadisticas;

    return [...dataEstadisticas].sort((a, b) => {
      const preguntaA = preguntasMap.get(a.id || '');
      const preguntaB = preguntasMap.get(b.id || '');

      const orderA = preguntaA?.order || 0;
      const orderB = preguntaB?.order || 0;

      return orderA - orderB;
    });
  }, [dataEstadisticas, preguntasMap]);

  // Crear array de objetos con toda la información necesaria para el reporte
  const reporteCompleto = useMemo(() => {
    if (!dataEstadisticasOrdenadas || !preguntasRespuestas.length) return [];

    return dataEstadisticasOrdenadas.map((dat, index) => {
      const pregunta = preguntasMap.get(dat.id || '');

      return {
        pregunta: pregunta?.pregunta || 'Pregunta no encontrada',
        actuacion: pregunta?.preguntaDocente || 'Actuación no encontrada',
        order: pregunta?.order || index + 1, // Se usa la propiedad 'order' para ordenar
        id: dat.id || '',
        dataEstadistica: dat, // Contiene a, b, c, d, total
        respuesta: pregunta?.respuesta || '',
        index: index + 1,
        graficoImagen: '', // Se llenará después de renderizar el gráfico
      };
    });
  }, [dataEstadisticasOrdenadas, preguntasMap]);

  // Hook para generar PDF con imágenes
  const {
    graficosImagenes,
    imagenesGeneradas,
    loadingPDF,
    reporteCompletoConImagenes,
    convertirGraficoAImagen,
    handleGenerarPDF
  } = useGenerarPDFReporte({
    reporteCompleto,
    currentUserData,
    titulo: 'Reporte de Evaluación',
    tipoUsuario: 'Docente',
    monthSelected
  });

  // Función para detectar si toda la evaluación tiene 3 o 4 opciones
  const detectarNumeroOpciones = useMemo(() => {
    if (!dataEstadisticas || dataEstadisticas.length === 0) return 4; // Por defecto 4

    // Verificar si todas las preguntas tienen la opción D con valores válidos
    const todasTienenOpcionD = dataEstadisticas.every(
      (dat) => dat.d !== null && dat.d !== undefined && dat.d > 0
    );

    // Verificar si todas las preguntas NO tienen la opción D
    const ningunaTieneOpcionD = dataEstadisticas.every(
      (dat) => dat.d === null || dat.d === undefined || dat.d === 0
    );

    // Si todas tienen opción D, es de 4 opciones
    if (todasTienenOpcionD) return 4;

    // Si ninguna tiene opción D, es de 3 opciones
    if (ningunaTieneOpcionD) return 3;

    // Si hay mezcla, mostrar advertencia y usar 4 por defecto
    console.warn(
      'Advertencia: La evaluación tiene preguntas con diferente número de opciones. Usando 4 opciones por defecto.'
    );
    return 4;
  }, [dataEstadisticas]);

  useEffect(() => {
    const idExamen = route.query.idExamen as string;
    if (idExamen) {
      obtenerAñosConData(idExamen);
      getPreguntasRespuestas(idExamen);
      getEvaluacion(`${idExamen}`);
    }
  }, [route.query.idExamen, currentUserData.dni]);

  useEffect(() => {
    if (evaluacion.añoDelExamen && !yearSelected) {
      setYearSelected(evaluacion.añoDelExamen);
    }
  }, [evaluacion.añoDelExamen]);

  useEffect(() => {
    const idExamen = route.query.idExamen as string;
    if (idExamen && yearSelected) {
      estudiantesQueDieronExamenPorMes(evaluacion, estudiantes, yearSelected);
      estadisticasEstudiantesDelDocente(evaluacion, monthSelected, preguntasRespuestas, yearSelected);
    }
  }, [route.query.idExamen, currentUserData.dni, evaluacion.id, yearSelected, monthSelected]);

  // Mostrar en consola el array completo con las imágenes

  const handleValidateRespuesta = (data: PreguntasRespuestas) => {
    const rta: Alternativa | undefined = data.alternativas?.find((r) => r.selected === true);
    if (rta?.alternativa) {
      if (rta.alternativa.toLowerCase() === data.respuesta?.toLowerCase()) {
        return <div className={styles.correctAnswer}>si</div>;
      } else {
        return <div className={styles.incorrectAnswer}>no</div>;
      }
    }
  };

  const handleShowModalDelete = () => {
    setShowDeleteEstudiante(!showDeleteEstudiante);
  };

  const handleShowCorregirPuntajesModal = () => {
    setShowCorregirPuntajesModal(!showCorregirPuntajesModal);
  };

  const handleCorregirPuntajes = () => {
    corregirPuntajesEstudiantes(`${currentUserData.dni}`, evaluacion, monthSelected, estudiantes, preguntasRespuestas, yearSelected);
  };

  const handleCerrarModalExito = () => {
    setCorreccionPuntajesExitoso(false);
    setShowCorregirPuntajesModal(false);
  };

  const handleCerrarModalError = () => {
    setCorreccionPuntajesError(false);
    setShowCorregirPuntajesModal(false);
  };
  const handleChangeMonth = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonthSelected(Number(e.target.value));
  };
  const handleChangeYear = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYearSelected(e.target.value);
  };
  const handleChangeOrder = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrder(Number(e.target.value));
  };
  const handleOrder = () => {
    filtroEstudiantes(estudiantes as Estudiante[], order);
  };

  // Verificar si existen valores válidos para puntaje y nivel
  const hasValidPuntajeNivel = () => {
    return estudiantes?.some(
      (estudiante) =>
        estudiante.puntaje !== undefined &&
        estudiante.puntaje !== null &&
        estudiante.nivel !== undefined &&
        estudiante.nivel !== null &&
        estudiante.nivel !== ''
    );
  };

  // Verificar si existen valores válidos para puntaje
  const hasValidPuntaje = () => {
    return estudiantes?.some(
      (estudiante) =>
        estudiante.puntaje !== undefined &&
        estudiante.puntaje !== null &&
        !isNaN(estudiante.puntaje)
    );
  };

  // Verificar si existen valores válidos para nivel
  const hasValidNivel = () => {
    return estudiantes?.some(
      (estudiante) =>
        estudiante.nivel !== undefined &&
        estudiante.nivel !== null &&
        estudiante.nivel !== '' &&
        estudiante.nivel !== 'sin clasificar'
    );
  };

  /* console.log('dataEstadisticasOrdenadas', dataEstadisticasOrdenadas)
  console.log('preguntasMap',preguntasMap) */
  return (
    <>
      {showDeleteEstudiante && (
        <DeleteEstudiante
          estudiantes={estudiantes}
          idExamen={`${route.query.idExamen}`}
          idEstudiante={idEstudiante}
          monthSelected={monthSelected}
          handleShowModalDelete={handleShowModalDelete}
        />
      )}
      <CorregirPuntajesModal
        isOpen={showCorregirPuntajesModal}
        onClose={handleShowCorregirPuntajesModal}
        onConfirm={handleCorregirPuntajes}
        loading={loaderCorreccionPuntajes}
        success={correccionPuntajesExitoso}
        onCloseSuccess={handleCerrarModalExito}
        error={correccionPuntajesError}
        onCloseError={handleCerrarModalError}
      />
      {loaderReporteDirector ? (
        <div className={styles.loaderContainer}>
          <div className={styles.loaderContent}>
            <RiLoader4Line className={styles.loaderIcon} />
            <span className={styles.loaderText}>...cargando</span>
          </div>
        </div>
      ) : (
        <div className={styles.container}>
          <div className={styles.content}>
            <div className={styles.headerActions}>
              {/* <div className={styles.toggleButtonContainer}>
                <div onClick={handleShowTable} className={styles.toggleButton}>
                  {showTable ? 'ocultar tabla de estudiantes' : 'mostrar tabla de estudiantes'}
                </div>
              </div> */}
              <div className={styles.exportButtonsContainer}>
                {showTable && (
                  <button
                    onClick={handleExportToExcel}
                    disabled={loading || !estudiantes || estudiantes.length === 0}
                    className={styles.exportButton}
                  >
                    {loading ? <RiLoader4Line className={styles.loaderIcon} /> : 'Exportar a Excel'}
                  </button>
                )}
                <button
                  onClick={handleGenerarPDF}
                  disabled={loading || loadingPDF || reporteCompletoConImagenes.length === 0 || !imagenesGeneradas}
                  className={`${styles.pdfButton} ${loadingPDF
                    ? styles.pdfButtonLoading
                    : !imagenesGeneradas
                      ? styles.pdfButtonGenerating
                      : styles.pdfButtonReady
                    }`}
                >
                  {loadingPDF ? (
                    <>
                      <RiLoader4Line className={styles.loaderIcon} />
                      <span>Generando PDF...</span>
                    </>
                  ) : !imagenesGeneradas ? (
                    <>
                      <RiLoader4Line className={styles.loaderIcon} />
                      <span>Preparando gráficos...</span>
                    </>
                  ) : (
                    <>
                      <span>📄</span>
                      <span>Generar PDF</span>
                    </>
                  )}
                </button>
                {
                  evaluacion.tipoDeEvaluacion === '1' && (
                    <button
                      onClick={handleShowCorregirPuntajesModal}
                      className={styles.corregirButton}
                    >
                      <span>🔧</span>
                      <span>Corregir Puntajes</span>
                    </button>
                  )
                }
                {/* <button 
                  onClick={handleShowCorregirPuntajesModal}
                  className={styles.corregirButton}
                >
                  <span>🔧</span>
                  <span>Corregir Puntajes</span>
                </button> */}
              </div>
            </div>
            {showTable ? (
              <>
                <div className={styles.exportContainer}>
                  <div className={styles.controlSection}>
                    <div className={styles.controlGroup}>
                      <label className={styles.controlLabel}>Ordenar por:</label>
                      <div className={styles.controlInputs}>
                        <select
                          onChange={handleChangeOrder}
                          className={styles.modernSelect}
                          aria-label="Seleccionar orden de clasificación"
                        >
                          <option value="">-- Seleccionar orden --</option>
                          {ordernarAscDsc.map((order) => (
                            <option key={order.id} value={order.id}>
                              {order.name}
                            </option>
                          ))}
                        </select>
                        <button
                          className={styles.modernButton}
                          onClick={handleOrder}
                          disabled={!order}
                        >
                          Ordenar
                        </button>
                      </div>
                    </div>

                    <div className={styles.controlGroup}>
                      <label className={styles.controlLabel}>Seleccionar año:</label>
                      <select
                        onChange={handleChangeYear}
                        value={yearSelected}
                        className={styles.modernSelect}
                        aria-label="Seleccionar año para el reporte"
                      >
                        <option value="">-- Año --</option>
                        {Array.from({ length: new Date().getFullYear() - 2025 + 1 }, (_, i) => (2025 + i).toString()).map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.controlGroup}>
                      <label className={styles.controlLabel}>Seleccionar mes:</label>
                      <select
                        id="monthSelect"
                        onChange={handleChangeMonth}
                        value={monthSelected}
                        className={styles.modernSelect}
                        aria-label="Seleccionar mes para el reporte"
                      >
                        <option value="">-- Mes --</option>
                        {getAllMonths.filter(m => mesesConDataDisponibles.includes(m.id)).map((month) => (
                          <option key={month.id} value={month.id}>
                            {month.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <TablaPreguntas
                  estudiantes={estudiantes}
                  preguntasRespuestas={preguntasRespuestas}
                  warningEvaEstudianteSinRegistro={warningEvaEstudianteSinRegistro || undefined}
                  onDeleteEstudiante={(dni) => {
                    handleShowModalDelete();
                    setIdEstudiante(dni);
                  }}
                  linkToEdit={`/docentes/evaluaciones/secundaria/pruebas/prueba/reporte/actualizar-evaluacion?idExamen=${route.query.idExamen}&mes=${monthSelected}`}
                  customColumns={{
                    showPuntaje: hasValidPuntaje(),
                    showNivel: hasValidNivel(),
                  }}
                  className={styles.tableWrapper}
                />
              </>
            ) : null}

            {evaluacion.tipoDeEvaluacion === '1' ? (
              <div className={styles.graficosContainer}>
                <GraficoTendenciaColegio
                  evaluacion={evaluacion}
                  datosPorMes={datosPorMes}
                  mesesConDataDisponibles={mesesConDataDisponibles}
                  promedioGlobal={promedioGlobal}
                  monthSelected={monthSelected}
                  dataGraficoTendenciaNiveles={[
                    generarDataGraficoPiechart(estudiantes, monthSelected, evaluacion),
                  ]}
                />
              </div>

            ) : null}

            {/* <GraficoTendenciaColegio estudiantes={estudiantes} monthSelected={monthSelected} evaluacion={evaluacion} /> */}
            <ReporteEvaluacionPorPregunta
              dataEstadisticasOrdenadas={dataEstadisticasOrdenadas}
              preguntasMap={preguntasMap}
              detectarNumeroOpciones={detectarNumeroOpciones}
              warningEvaEstudianteSinRegistro={warningEvaEstudianteSinRegistro || undefined}
              convertirGraficoAImagen={convertirGraficoAImagen}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Reportes;
Reportes.Auth = PrivateRouteDocentes;
