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
import { generarPDFReporte } from '@/features/utils/pdfExportEstadisticasDocentes';
import Link from 'next/link';
import ReporteEvaluacionPorPregunta from './reporteEvaluacionPorPregunta';
import PieChartComponent from '@/pages/admin/evaluaciones/evaluacion/reporte/PieChartComponent';
import { generarDataGraficoPiechart } from '@/features/utils/generar-data-grafico-piechart';
import { TablaPreguntas } from '@/components/tabla-preguntas';
import { calculoNivel } from '@/features/utils/calculoNivel';
import GraficoTendenciaColegio from '@/components/grafico-tendencia';
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
  const [loadingPDF, setLoadingPDF] = useState<boolean>(false);
  const [showTable, setShowtable] = useState<boolean>(true);
  const [showDeleteEstudiante, setShowDeleteEstudiante] = useState<boolean>(false);
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
    promedioGlobal,
    estudiantesQueDieronExamenPorMes,
  } = useReporteDocente();
  const { getPreguntasRespuestas, getEvaluacion } = useAgregarEvaluaciones();
  const [idEstudiante, setIdEstudiante] = useState<string>('');
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

  const handleGenerarPDF = async () => {
    setLoadingPDF(true);
    try {
      await generarPDFReporte(reporteCompletoConImagenes, {
        titulo: 'Reporte de Evaluación',
        nombreDocente:
          `${currentUserData.nombres || ''} ${currentUserData.apellidos || ''}`.trim() || 'Docente',
        fecha: new Date().toLocaleDateString('es-ES'),
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
    } finally {
      setLoadingPDF(false);
    }
  };

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
      estudiantesQueDieronExamenPorMes(evaluacion, estudiantes);
      estadisticasEstudiantesDelDocente(evaluacion, monthSelected);
      getPreguntasRespuestas(idExamen);
      setMonthSelected(currentMonth);
      getEvaluacion(`${idExamen}`);
    }
  }, [route.query.idExamen, currentUserData.dni, evaluacion.id]);

  useEffect(() => {
    const idExamen = route.query.idExamen as string;
    if (idExamen) {
      estudiantesQueDieronExamenPorMes(evaluacion, estudiantes);
      estadisticasEstudiantesDelDocente(evaluacion, monthSelected);
    }
  }, [monthSelected]);

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

  // Estado para almacenar las imágenes de los gráficos
  const [graficosImagenes, setGraficosImagenes] = useState<{ [key: string]: string }>({});

  // Función para convertir el gráfico a imagen con mejor calidad
  const convertirGraficoAImagen = useCallback(
    (idPregunta: string, canvasRef: HTMLCanvasElement | null) => {
      if (!canvasRef) return;

      try {
        // Crear un canvas temporal con dimensiones fijas para mejor calidad
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        // Dimensiones optimizadas para calidad y tamaño balanceado
        const pdfWidth = 900; // Reducido de 1200 a 900 para tamaño más compacto
        const pdfHeight = 600; // Reducido de 800 a 600 para tamaño más compacto

        tempCanvas.width = pdfWidth;
        tempCanvas.height = pdfHeight;

        if (tempCtx) {
          // Configurar el contexto para mejor calidad
          tempCtx.imageSmoothingEnabled = true;
          tempCtx.imageSmoothingQuality = 'high';

          // Configurar DPI para mejor calidad de impresión (300 DPI)
          const dpi = 300;
          const scaleFactor = dpi / 96; // 96 es el DPI estándar de pantalla
          
          // Aplicar el factor de escala para DPI
          tempCtx.scale(scaleFactor, scaleFactor);

          // Copiar el contenido del canvas original al temporal con escalado suave
          tempCtx.drawImage(canvasRef, 0, 0, pdfWidth / scaleFactor, pdfHeight / scaleFactor);

          // Convertir a base64 con máxima calidad
          const base64 = tempCanvas.toDataURL('image/png', 1.0);

          setGraficosImagenes((prev) => ({
            ...prev,
            [idPregunta]: base64,
          }));
        }
      } catch (error) {
        console.error('Error al convertir gráfico a imagen:', error);
      }
    },
    []
  );

  // Actualizar reporteCompleto cuando se generen las imágenes de los gráficos
  const reporteCompletoConImagenes = useMemo(() => {
    return reporteCompleto.map((item) => ({
      ...item,
      graficoImagen: graficosImagenes[item.id] || '',
    }));
  }, [reporteCompleto, graficosImagenes]);

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
  const handleChangeMonth = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonthSelected(Number(e.target.value));
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
                  disabled={loading || loadingPDF || reporteCompletoConImagenes.length === 0}
                  className={styles.pdfButton}
                >
                  {loadingPDF ? <RiLoader4Line className={styles.loaderIcon} /> : 'Generar PDF'}
                </button>
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
                      <label className={styles.controlLabel}>Seleccionar mes:</label>
                      <select
                        id="monthSelect"
                        onChange={handleChangeMonth}
                        value={monthSelected}
                        className={styles.modernSelect}
                        aria-label="Seleccionar mes para el reporte"
                      >
                        <option value={currentMonth}>{getMonthName(currentMonth)}</option>
                        {getAllMonths.slice(0, currentMonth + 1).map((month) => (
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
                  linkToEdit={`/docentes/evaluaciones/tercerNivel/pruebas/prueba/reporte/actualizar-evaluacion?idExamen=${route.query.idExamen}&mes=${monthSelected}`}
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
