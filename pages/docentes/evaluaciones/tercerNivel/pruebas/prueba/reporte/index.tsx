import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useReporteDocente } from '@/features/hooks/useReporteDocente';
import { Alternativa, DataEstadisticas, PreguntasRespuestas } from '@/features/types/types';
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
    loaderPages,
    loaderReporteDirector,
    warningEvaEstudianteSinRegistro,
  } = useGlobalContext();
  const { estudiantesQueDieronExamen, filtroEstudiantes, estadisticasEstudiantesDelDocente } =
    useReporteDocente();
  const { getPreguntasRespuestas } = useAgregarEvaluaciones();
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
        nombreDocente: `${currentUserData.nombres || ''} ${currentUserData.apellidos || ''}`.trim() || 'Docente',
        fecha: new Date().toLocaleDateString('es-ES')
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
    const todasTienenOpcionD = dataEstadisticas.every(dat => 
      dat.d !== null && dat.d !== undefined && dat.d > 0
    );
    
    // Verificar si todas las preguntas NO tienen la opción D
    const ningunaTieneOpcionD = dataEstadisticas.every(dat => 
      dat.d === null || dat.d === undefined || dat.d === 0
    );
    
    // Si todas tienen opción D, es de 4 opciones
    if (todasTienenOpcionD) return 4;
    
    // Si ninguna tiene opción D, es de 3 opciones
    if (ningunaTieneOpcionD) return 3;
    
    // Si hay mezcla, mostrar advertencia y usar 4 por defecto
    console.warn('Advertencia: La evaluación tiene preguntas con diferente número de opciones. Usando 4 opciones por defecto.');
    return 4;
  }, [dataEstadisticas]);

  const iterateData = (data: DataEstadisticas, respuesta: string) => {
    // Usar el número de opciones detectado globalmente
    const numOpciones = detectarNumeroOpciones;

    // Calcular porcentajes para cada opción
    const calcularPorcentaje = (valor: number | undefined) => {
      if (valor === null || valor === undefined) return 0;
      return data.total === 0 ? 0 : ((100 * Number(valor)) / Number(data.total));
    };

    // Calcular porcentajes sin redondear
    const porcentajeARaw = calcularPorcentaje(data.a || 0);
    const porcentajeBRaw = calcularPorcentaje(data.b || 0);
    const porcentajeCRaw = calcularPorcentaje(data.c || 0);
    const porcentajeDRaw = numOpciones === 4 ? calcularPorcentaje(data.d || 0) : 0;

    if (numOpciones === 3) {
      // Para 3 opciones: redondear las primeras 2 y calcular la tercera
      const porcentajeA = Math.round(porcentajeARaw);
      const porcentajeB = Math.round(porcentajeBRaw);
      const porcentajeC = Math.max(0, 100 - porcentajeA - porcentajeB);

      // Crear etiquetas solo para las 3 opciones
      const labels = [`a (${porcentajeA}%)`, `b (${porcentajeB}%)`, `c (${porcentajeC}%)`];

      return {
        labels: labels,
        datasets: [
          {
            label: 'estadisticas de respuesta',
            data: [data.a, data.b, data.c],
            backgroundColor: [
              'rgba(52, 152, 219, 0.7)',   // Azul azulado
              'rgba(46, 204, 113, 0.7)',   // Verde esmeralda
              'rgba(155, 89, 182, 0.7)',   // Púrpura
            ],
            borderColor: [
              'rgb(52, 152, 219)',         // Azul azulado
              'rgb(46, 204, 113)',         // Verde esmeralda
              'rgb(155, 89, 182)',         // Púrpura
            ],
            borderWidth: 2,
          },
        ],
      };
    } else {
      // Para 4 opciones: redondear las primeras 3 y calcular la cuarta
      const porcentajeA = Math.round(porcentajeARaw);
      const porcentajeB = Math.round(porcentajeBRaw);
      const porcentajeC = Math.round(porcentajeCRaw);
      const porcentajeD = Math.max(0, 100 - porcentajeA - porcentajeB - porcentajeC);

      // Crear etiquetas para las 4 opciones
      const labels = [`a (${porcentajeA}%)`, `b (${porcentajeB}%)`, `c (${porcentajeC}%)`, `d (${porcentajeD}%)`];

      return {
        labels: labels,
        datasets: [
          {
            label: 'estadisticas de respuesta',
            data: [data.a, data.b, data.c, data.d],
            backgroundColor: [
              'rgba(52, 152, 219, 0.7)',   // Azul azulado
              'rgba(46, 204, 113, 0.7)',   // Verde esmeralda
              'rgba(155, 89, 182, 0.7)',   // Púrpura
              'rgba(230, 126, 34, 0.7)',   // Naranja
            ],
            borderColor: [
              'rgb(52, 152, 219)',         // Azul azulado
              'rgb(46, 204, 113)',         // Verde esmeralda
              'rgb(155, 89, 182)',         // Púrpura
              'rgb(230, 126, 34)',         // Naranja
            ],
            borderWidth: 2,
          },
        ],
      };
    }
  };

  useEffect(() => {
    const idExamen = route.query.idExamen as string;
    if (idExamen) {
      estadisticasEstudiantesDelDocente(idExamen, monthSelected);
      getPreguntasRespuestas(idExamen);
      setMonthSelected(currentMonth);
    }
  }, [route.query.idExamen, currentUserData.dni]);



  useEffect(() => {
    const idExamen = route.query.idExamen as string;
    if (idExamen) {
      estadisticasEstudiantesDelDocente(idExamen, monthSelected);
    }
  }, [monthSelected]);

  // Crear un mapa optimizado de preguntas por ID para evitar búsquedas repetidas O(1) en lugar de O(n)
  const preguntasMap = useMemo(() => {
    const map = new Map<string, PreguntasRespuestas>();
    preguntasRespuestas.forEach(pregunta => {
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
        graficoImagen: '' // Se llenará después de renderizar el gráfico
      };
    });
  }, [dataEstadisticasOrdenadas, preguntasMap]);

  // Mostrar en consola la estructura del array generado
  console.log('Reporte Completo:', reporteCompleto);

  // Estado para almacenar las imágenes de los gráficos
  const [graficosImagenes, setGraficosImagenes] = useState<{[key: string]: string}>({});

  // Función para convertir el gráfico a imagen con mejor calidad
  const convertirGraficoAImagen = useCallback((idPregunta: string, canvasRef: HTMLCanvasElement | null) => {
    if (!canvasRef) return;
    
    try {
      // Crear un canvas temporal con dimensiones fijas para mejor calidad
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
      // Dimensiones fijas para el PDF (más grandes para mejor calidad)
      const pdfWidth = 600;
      const pdfHeight = 400;
      
      tempCanvas.width = pdfWidth;
      tempCanvas.height = pdfHeight;
      
      if (tempCtx) {
        // Copiar el contenido del canvas original al temporal
        tempCtx.drawImage(canvasRef, 0, 0, pdfWidth, pdfHeight);
        
        // Convertir a base64 con mejor calidad
        const base64 = tempCanvas.toDataURL('image/png', 1.0);
        
        setGraficosImagenes(prev => ({
          ...prev,
          [idPregunta]: base64
        }));
      }
    } catch (error) {
      console.error('Error al convertir gráfico a imagen:', error);
    }
  }, []);

  // Actualizar reporteCompleto cuando se generen las imágenes de los gráficos
  const reporteCompletoConImagenes = useMemo(() => {
    return reporteCompleto.map(item => ({
      ...item,
      graficoImagen: graficosImagenes[item.id] || ''
    }));
  }, [reporteCompleto, graficosImagenes]);

  // Mostrar en consola el array completo con las imágenes
  console.log('Reporte Completo con Imágenes:', reporteCompletoConImagenes);

  const options = {
    plugins: {
      legend: {
        position: 'center' as const,
      },
      title: {
        display: true,
        text: 'estadistica de respuestas',
      },
    },
  };

  // Función optimizada para renderizar pregunta usando el mapa
  const renderPregunta = useCallback((idPregunta: string) => {
    const pregunta = preguntasMap.get(idPregunta);
    if (!pregunta) {
      return <p>Pregunta no encontrada</p>;
    }
    return (
      <>
        <h3 className={styles.questionTitle}>
          {pregunta.pregunta}
        </h3>
        <h4 className={styles.questionSubtitle}>
          <strong>Actuación</strong>: {pregunta.preguntaDocente}
        </h4>
      </>
    );
  }, [preguntasMap]);

  // Función optimizada para obtener respuesta usando el mapa
  const obtenerRespuestaPorId = useCallback((idPregunta: string): string => {
    const pregunta = preguntasMap.get(idPregunta);
    return pregunta?.respuesta || '';
  }, [preguntasMap]);

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
    console.log('order', order);
    filtroEstudiantes(estudiantes, order);
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

  console.log('estudiantes', estudiantes);
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
                      <label className={styles.controlLabel}>
                        Ordenar por:
                      </label>
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
                      <label className={styles.controlLabel}>
                        Seleccionar mes:
                      </label>
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

                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead className={styles.tableHeader}>
                      <tr>
                        <th></th>
                        <th>#</th>
                        <th>N-A</th>
                        <th>r.c</th>
                        <th>t.p.</th>
                        {hasValidPuntaje() && <th>puntaje</th>}
                        {hasValidNivel() && <th>nivel</th>}
                        {preguntasRespuestas.map((pr, index) => {
                          return (
                            <th key={pr.order}>
                              <button className={styles.questionButton} popoverTarget={`${pr.order}`}>
                                {/* {pr.order} */}
                                {index + 1}
                              </button>
                              <div
                                className={styles.questionPopover}
                                popover="auto"
                                id={`${pr.order}`}
                              >
                                <div>
                                  <span>
                                    {/* {pr.order}. Actuación: */}
                                    {index + 1}. Actuación:
                                  </span>
                                  <span>{pr.preguntaDocente}</span>
                                </div>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className={styles.tableBody}>
                      {!warningEvaEstudianteSinRegistro ? (
                        estudiantes?.map((dir, index) => {
                          return (
                            <tr key={index}>
                              <td>
                                <MdDeleteForever
                                  onClick={() => {
                                    handleShowModalDelete();
                                    setIdEstudiante(`${dir.dni}`);
                                  }}
                                  className={styles.deleteIcon}
                                />
                              </td>
                              <td>{index + 1}</td>
                              <td>
                                
                                <Link
                                  href={`/docentes/evaluaciones/tercerNivel/pruebas/prueba/reporte/actualizar-evaluacion?idExamen=${route.query.idExamen}&idEstudiante=${dir.dni}&mes=${monthSelected}`}
                                >
                                  {dir.nombresApellidos}
                                </Link>
                              </td>
                              <td>{dir.respuestasCorrectas}</td>
                              <td>{dir.totalPreguntas}</td>
                              {hasValidPuntaje() && <td>{dir.puntaje}</td>}
                              {hasValidNivel() && <td>{dir.nivel}</td>}
                              {dir.respuestas?.map((res) => {
                                return <td key={res.order}>{handleValidateRespuesta(res)}</td>;
                              })}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <th></th>
                          <th className={styles.warningContainer}>
                            {warningEvaEstudianteSinRegistro}
                          </th>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
            <h1 className={styles.title}>Reporte de Evaluación</h1>
            <div className={styles.reportContainer}>
              {warningEvaEstudianteSinRegistro ? (
                <div className={styles.warningContainer}>{warningEvaEstudianteSinRegistro}</div>
              ) : (
                dataEstadisticasOrdenadas?.map((dat, index) => {
                  const pregunta = preguntasMap.get(dat.id || '');
                  const numeroOrden = pregunta?.order || index + 1;
                  return (
                    <div key={dat.id || index} className={styles.questionCard}>
                      {/* Header de la pregunta */}
                      <div className={styles.questionHeader}>
                        <div className={styles.questionNumber}>
                          <span className={styles.numberBadge}>{index + 1}</span>
                        </div>
                        <div className={styles.questionContent}>
                          {renderPregunta(`${dat.id}`)}
                        </div>
                      </div>

                                              {/* Contenedor principal del gráfico y estadísticas */}
                        <div className={styles.analyticsContainer}>
                          {/* Gráfico principal */}
                          <div className={styles.chartSection}>
                            <div className={styles.chartHeader}>
                              <h4 className={styles.chartTitle}>Distribución de Respuestas</h4>
                              <div className={styles.chartLegend}>
                                <span className={styles.legendItem}>
                                  <span className={`${styles.legendColor} ${styles.legendColorA}`}></span>
                                  Opción A
                                </span>
                                <span className={styles.legendItem}>
                                  <span className={`${styles.legendColor} ${styles.legendColorB}`}></span>
                                  Opción B
                                </span>
                                <span className={styles.legendItem}>
                                  <span className={`${styles.legendColor} ${styles.legendColorC}`}></span>
                                  Opción C
                                </span>
                                {detectarNumeroOpciones === 4 && (
                                  <span className={styles.legendItem}>
                                    <span className={`${styles.legendColor} ${styles.legendColorD}`}></span>
                                    Opción D
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className={styles.chartWrapper}>
                              <Bar
                                options={{
                                  ...options,
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    ...options.plugins,
                                    legend: {
                                      display: false,
                                    },
                                    title: {
                                      display: false,
                                    },
                                  },
                                }}
                                data={iterateData(
                                  dat,
                                  obtenerRespuestaPorId(`${dat.id}`)
                                )}
                                width={600}
                                height={400}
                                ref={(chartRef) => {
                                  if (chartRef && chartRef.canvas) {
                                    setTimeout(() => {
                                      convertirGraficoAImagen(dat.id || '', chartRef.canvas);
                                    }, 100);
                                  }
                                }}
                              />
                            </div>
                          </div>

                          {/* Contenedor de estadísticas y respuesta correcta */}
                          <div className={styles.bottomPanelsContainer}>
                            {/* Panel de estadísticas */}
                            {/* <div className={styles.statsPanel}>
                              <div className={styles.statsHeader}>
                                <h4 className={styles.statsTitle}>Estadísticas Detalladas</h4>
                                <div className={styles.totalResponses}>
                                  Total: <strong>{dat.total}</strong> respuestas
                                </div>
                              </div>

                              <div className={styles.statsGrid}>
                                {(() => {
                                  const total = Number(dat.total);
                                  if (total === 0) return null;
                                  
                                  const aPercent = Math.round((100 * Number(dat.a)) / total);
                                  const bPercent = Math.round((100 * Number(dat.b)) / total);
                                  const cPercent = Math.round((100 * Number(dat.c)) / total);
                                  
                                  let adjustedPercent = 0;
                                  if (dat.d) {
                                    adjustedPercent = 100 - (aPercent + bPercent + cPercent);
                                  } else {
                                    adjustedPercent = 100 - (aPercent + bPercent);
                                  }
                                  
                                  return (
                                    <>
                                      <div className={styles.statItem}>
                                        <div className={styles.statHeader}>
                                          <span className={styles.statLabel}>Opción A</span>
                                          <span className={styles.statPercentage}>{aPercent}%</span>
                                        </div>
                                        <div className={styles.statBar}>
                                          <div 
                                            className={`${styles.statBarFill} ${styles.statBarFillA}`} 
                                            style={{ width: `${aPercent}%` }}
                                          ></div>
                                        </div>
                                        <div className={styles.statCount}>{dat.a} respuestas</div>
                                      </div>

                                      <div className={styles.statItem}>
                                        <div className={styles.statHeader}>
                                          <span className={styles.statLabel}>Opción B</span>
                                          <span className={styles.statPercentage}>{bPercent}%</span>
                                        </div>
                                        <div className={styles.statBar}>
                                          <div 
                                            className={`${styles.statBarFill} ${styles.statBarFillB}`} 
                                            style={{ width: `${bPercent}%` }}
                                          ></div>
                                        </div>
                                        <div className={styles.statCount}>{dat.b} respuestas</div>
                                      </div>

                                      <div className={styles.statItem}>
                                        <div className={styles.statHeader}>
                                          <span className={styles.statLabel}>Opción C</span>
                                          <span className={styles.statPercentage}>{cPercent}%</span>
                                        </div>
                                        <div className={styles.statBar}>
                                          <div 
                                            className={`${styles.statBarFill} ${styles.statBarFillC}`} 
                                            style={{ width: `${cPercent}%` }}
                                          ></div>
                                        </div>
                                        <div className={styles.statCount}>{dat.c} respuestas</div>
                                      </div>

                                      {dat.d && (
                                        <div className={styles.statItem}>
                                          <div className={styles.statHeader}>
                                            <span className={styles.statLabel}>Opción D</span>
                                            <span className={styles.statPercentage}>{adjustedPercent}%</span>
                                          </div>
                                          <div className={styles.statBar}>
                                            <div 
                                              className={`${styles.statBarFill} ${styles.statBarFillD}`} 
                                              style={{ width: `${adjustedPercent}%` }}
                                            ></div>
                                          </div>
                                          <div className={styles.statCount}>{dat.d} respuestas</div>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </div> */}

                            {/* Panel de respuesta correcta */}
                            <div className={styles.answerPanel}>
                              <span className={styles.answerText}>
                                <strong>Respuesta correcta:</strong> {obtenerRespuestaPorId(`${dat.id}`)}
                              </span>
                            </div>
                          </div>
                        </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Reportes;
Reportes.Auth = PrivateRouteDocentes;
