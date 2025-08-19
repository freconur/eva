import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useReporteDirectores } from '@/features/hooks/useReporteDirectores'
import { useRouter } from 'next/router'
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
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
import { gradosDeColegio, sectionByGrade, ordernarAscDsc, genero } from '@/fuctions/regiones'
import { Bar } from "react-chartjs-2"
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { Alternativa, DataEstadisticas, PreguntasRespuestas } from '@/features/types/types';
import { RiLoader4Line } from 'react-icons/ri';
import styles from './Reporte.module.css';
import { currentMonth, getAllMonths } from '@/fuctions/dates';
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores';
import { useGlobalContextDispatch } from '@/features/context/GlolbalContext';
import { AppAction } from '@/features/actions/appAction';
import { generarPDFReporte } from '@/features/utils/pdfExportEstadisticasDocentes';
import { useGenerarImagenesGraficos } from '@/features/utils/useGenerarImagenesGraficos';
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


const Reporte = () => {
  const dispatch = useGlobalContextDispatch();
  const [filtros, setFiltros] = useState({
    grado: '',
    seccion: '',
    orden: '',
    genero:''
  });
  const [loadingPDF, setLoadingPDF] = useState<boolean>(false);
  const [loadingMonth, setLoadingMonth] = useState<boolean>(false);
  
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  const handleChangeFiltros = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value
    });
  };



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
      const labels = [`A (${porcentajeA}%)`, `B (${porcentajeB}%)`, `C (${porcentajeC}%)`, `D (${porcentajeD}%)`];

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
  const { reporteDirectorData,reporteToTableDirector ,reporteDirectorEstudiantes,agregarDatosEstadisticosDirector } = useReporteDirectores()
  const { currentUserData, reporteDirector, preguntasRespuestas, loaderReporteDirector, allRespuestasEstudiantesDirector, dataFiltradaDirectorTabla } = useGlobalContext()
  const { getPreguntasRespuestas } = useAgregarEvaluaciones()
  const route = useRouter()
  const [monthSelected, setMonthSelected] = useState(currentMonth)
  
  // Función para detectar si toda la evaluación tiene 3 o 4 opciones
  const detectarNumeroOpciones = useMemo(() => {
    if (!reporteDirector || reporteDirector.length === 0) return 4; // Por defecto 4
    
    // Verificar si todas las preguntas tienen la opción D con valores válidos
    const todasTienenOpcionD = reporteDirector.every((dat: DataEstadisticas) => 
      dat.d !== null && dat.d !== undefined && dat.d > 0
    );
    
    // Verificar si todas las preguntas NO tienen la opción D
    const ningunaTieneOpcionD = reporteDirector.every((dat: DataEstadisticas) => 
      dat.d === null || dat.d === undefined || dat.d === 0
    );
    
    // Si todas tienen opción D, es de 4 opciones
    if (todasTienenOpcionD) return 4;
    
    // Si ninguna tiene opción D, es de 3 opciones
    if (ningunaTieneOpcionD) return 3;
    
    // Si hay mezcla, mostrar advertencia y usar 4 por defecto
    console.warn('Advertencia: La evaluación tiene preguntas con diferente número de opciones. Usando 4 opciones por defecto.');
    return 4;
  }, [reporteDirector]);


  
  // Limpiar dataFiltradaDirectorTabla cuando el componente se monta
  useEffect(() => {
    dispatch({ type: AppAction.DATA_FILTRADA_DIRECTOR_TABLA, payload: [] });
  }, [dispatch]);

  useEffect(() => {
//me trae las preguntas y respuestas para los graficos
    getPreguntasRespuestas(`${route.query.idEvaluacion}`)
  }, [currentUserData.dni, route.query.idEvaluacion])

  const handleFiltrar = () => {
    reporteToTableDirector(allRespuestasEstudiantesDirector,{grado: filtros.grado, seccion: filtros.seccion, orden: filtros.orden, genero: filtros.genero}, `${route.query.id}`, `${route.query.idEvaluacion}`)
  }
  useEffect(() => {
    currentUserData.dni &&reporteDirectorEstudiantes(`${route.query.idEvaluacion}`,monthSelected,currentUserData)
    /* reporteDirectorData(`${route.query.id}`, `${route.query.idEvaluacion}`) */
      }, [route.query.id, route.query.idEvaluacion, currentUserData.dni])

  const handleValidateRespuesta = (data: PreguntasRespuestas) => {
    const rta: Alternativa | undefined = data.alternativas?.find(
      (r) => r.selected === true
    );
    if (rta?.alternativa) {
      if (rta.alternativa.toLowerCase() === data.respuesta?.toLowerCase()) {
        return (
          <div className={styles.correctAnswer}>
            si
          </div>
        );
      } else {
        return (
          <div className={styles.incorrectAnswer}>
            no
          </div>
        );
      }
    }
  };

  // Lógica de paginación
  const totalPages = Math.ceil((dataFiltradaDirectorTabla?.length || 0) / itemsPerPage);
  
  const paginatedData = useMemo(() => {
    if (!dataFiltradaDirectorTabla || dataFiltradaDirectorTabla.length === 0) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return dataFiltradaDirectorTabla.slice(startIndex, endIndex);
  }, [dataFiltradaDirectorTabla, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
  };

  const handleLastPage = () => {
    setCurrentPage(totalPages);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Resetear a la primera página
  };

  // Resetear a la primera página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [dataFiltradaDirectorTabla]);
 
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
  const handleChangeMonth = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLoadingMonth(true);
    const selectedMonth = getAllMonths.find(mes => mes.name === e.target.value);
    setMonthSelected(selectedMonth ? selectedMonth.id : currentMonth);
    // Limpiar las imágenes de gráficos cuando cambie el mes
    limpiarImagenes();
    
    // Simular un pequeño delay para mostrar el loader
    setTimeout(() => {
      setLoadingMonth(false);
    }, 500);
  }

  useEffect(() => {
    reporteDirectorEstudiantes(`${route.query.idEvaluacion}`,monthSelected,currentUserData)
  },[monthSelected])

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

  // Memorizar las preguntas ordenadas por la propiedad order
  const preguntasOrdenadas = useMemo(() => {
    return [...(preguntasRespuestas || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [preguntasRespuestas]);
  
  // Ordenar reporteDirector por el order de las preguntas correspondientes
  const reporteDirectorOrdenado = useMemo(() => {
    if (!reporteDirector || !preguntasOrdenadas.length) return reporteDirector;
    
    // Crear un mapa de estadísticas por ID de pregunta
    const estadisticasMap = new Map<string, any>();
    reporteDirector.forEach(stat => {
      if (stat.id) {
        estadisticasMap.set(stat.id, stat);
      }
    });
    
    // Crear un array sincronizado basado en preguntasRespuestas
    const reporteSincronizado = preguntasOrdenadas.map(pregunta => {
      const estadistica = estadisticasMap.get(pregunta.id || '');
      if (estadistica) {
        return estadistica;
      } else {
        // Si no hay estadísticas para esta pregunta, crear una estructura vacía
        return {
          id: pregunta.id,
          a: 0,
          b: 0,
          c: 0,
          d: pregunta.alternativas?.some(alt => alt.alternativa === 'd') ? 0 : undefined,
          total: 0
        };
      }
    });
    
    return reporteSincronizado;
  }, [reporteDirector, preguntasOrdenadas]);

  // Hook para generar imágenes de gráficos
  const {
    graficosImagenes,
    imagenesGeneradas,
    obtenerRefGrafico,
    limpiarImagenes
  } = useGenerarImagenesGraficos({ reporteDirectorOrdenado });

  // Limpiar imágenes cuando cambie el mes
  useEffect(() => {
    limpiarImagenes();
  }, [monthSelected, limpiarImagenes]);

  // Crear array de objetos con toda la información necesaria para el reporte
  const reporteCompleto = useMemo(() => {
    if (!reporteDirectorOrdenado || !preguntasRespuestas.length) return [];
    
    return reporteDirectorOrdenado.map((dat, index) => {
      const pregunta = preguntasMap.get(dat.id || '');
      
      return {
        pregunta: pregunta?.pregunta || 'Pregunta no encontrada',
        actuacion: pregunta?.preguntaDocente || 'Actuación no encontrada',
        order: pregunta?.order || index + 1,
        id: dat.id || '',
        dataEstadistica: dat,
        respuesta: pregunta?.respuesta || '',
        index: index + 1,
        graficoImagen: '' // Se llenará después de renderizar el gráfico
      };
    });
  }, [reporteDirectorOrdenado, preguntasMap]);

  // Actualizar reporteCompleto cuando se generen las imágenes de los gráficos
  const reporteCompletoConImagenes = useMemo(() => {
    return reporteCompleto.map(item => ({
      ...item,
      graficoImagen: graficosImagenes[item.id] || ''
    }));
  }, [reporteCompleto, graficosImagenes]);



  // Función para generar PDF
  const handleGenerarPDF = async () => {
    setLoadingPDF(true);
    try {
      await generarPDFReporte(reporteCompletoConImagenes, {
        titulo: 'Reporte de Evaluación - Directores',
        nombreDocente: `${currentUserData.nombres || ''} ${currentUserData.apellidos || ''}`.trim() || 'Director',
        fecha: new Date().toLocaleDateString('es-ES')
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
    } finally {
      setLoadingPDF(false);
    }
  };

  // Función optimizada para renderizar pregunta usando el mapa
  const renderPregunta = useCallback((idPregunta: string) => {
    const pregunta = preguntasMap.get(idPregunta);
    if (!pregunta) {
      return <p>Pregunta no encontrada</p>;
    }
    return (
      <div className='grid gap-1'>
        <h3 className='text-slate-500 mr-2'>
          {/* <span className='text-colorSegundo mr-2 font-semibold'>{pregunta.order}.</span> */}
          {pregunta.pregunta}
        </h3>
        <h3 className='text-slate-500 mr-2'>
          <span className='text-colorSegundo mr-2 font-semibold'>Actuación:</span> 
          {pregunta.preguntaDocente}
        </h3>
      </div>
    );
  }, [preguntasMap]);

  // Función optimizada para obtener respuesta usando el mapa
  const obtenerRespuestaPorId = useCallback((idPregunta: string): string => {
    const pregunta = preguntasMap.get(idPregunta);
    return pregunta?.respuesta || '';
  }, [preguntasMap]);


  return (

    <>
      {
        loaderReporteDirector ?
          <div className={styles.loaderContainer}>
            <div className={styles.loaderContent}>
              <RiLoader4Line className={styles.loaderIcon} />
              <span className={styles.loaderText}>...cargando</span>
            </div>
          </div>
          :
          <div className={styles.mainContainer}>

            <div>
                <div className={styles.selectContainer}>
                  <button
                    onClick={handleGenerarPDF}
                    disabled={loadingPDF || reporteCompletoConImagenes.length === 0 || !imagenesGeneradas}
                    className={`${styles.pdfButton} ${
                      loadingPDF ? styles.pdfButtonLoading : 
                      !imagenesGeneradas ? styles.pdfButtonGenerating : 
                      styles.pdfButtonReady
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
                  
                  <div className={styles.selectWrapper}>
                    <select 
                      className={styles.select} 
                      onChange={handleChangeMonth}
                      value={getAllMonths[monthSelected]?.name || ''}
                      disabled={loadingMonth}
                      id="">
                      <option value="">Mes</option>
                        {getAllMonths.slice(0,currentMonth+1).map((mes) => (
                          <option key={mes.id} value={mes.name}>
                            {mes.name}
                          </option>
                        ))}
                      </select>
                    {loadingMonth && (
                      <div className={styles.monthLoader}>
                        <RiLoader4Line className={styles.loaderIcon} />
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.filtersContainer}>
                  <select
                    name="grado"
                    value={filtros.grado}
                    onChange={handleChangeFiltros}
                    className={styles.select}
                  >
                    <option value="">Grado</option>
                    {gradosDeColegio.map((grado) => (
                      <option key={grado.id} value={grado.id}>
                        {grado.name}
                      </option>
                    ))}
                  </select>

                  <select
                    name="seccion"
                    value={filtros.seccion}
                    onChange={handleChangeFiltros}
                    className={styles.select}
                  >
                    <option value="">Sección</option>
                    {sectionByGrade.map((seccion) => (
                      <option key={seccion.id} value={seccion.id}>
                        {seccion.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <select
                    name="genero"
                    value={filtros.genero}
                    onChange={handleChangeFiltros}
                    className={styles.select}
                  >
                    <option value="">Género</option>
                    {genero.map((gen) => (
                      <option key={gen.id} value={gen.id}>
                        {gen.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <select 
                  className={styles.select} 
                  onChange={handleChangeFiltros}
                  name="orden" 
                  id="">
                  <option value="">ordernar por</option>
                    {ordernarAscDsc.map((orden) => (
                      <option key={orden.id} value={orden.name}>
                        {orden.name}
                      </option>
                    ))}
                  </select>
                  <button className={styles.filterButton} onClick={handleFiltrar}>Filtrar</button>
                  
                </div>

                {/* Contenedor de la tabla */}
                <div className={styles.tableContainer}>
                  {dataFiltradaDirectorTabla && dataFiltradaDirectorTabla.length > 0 ? (
                    <table className={styles.table}>
                      <thead className={styles.tableHeader}>
                        <tr>
                          <th className={styles.tableHeaderCell}>#</th>
                          <th className={styles.tableHeaderCell}>Nombre y apellidos</th>
                          <th className={styles.tableHeaderCell}>Docente</th>
                          <th className={styles.tableHeaderCell}>R.C</th>
                          <th className={styles.tableHeaderCell}>T.P</th>
                          <th className={styles.tableHeaderCell}>Puntaje</th>
                          <th className={styles.tableHeaderCell}>Nivel</th>
                          {preguntasRespuestas.map((pr, index) => {
                            return (
                              <th key={pr.order} className={styles.tableHeaderCell}>
                                <button
                                  className={styles.popoverButton}
                                  popoverTarget={`${pr.order}`}
                                >
                                  {index + 1}
                                </button>
                                <div
                                  className={styles.popoverContent}
                                  popover="auto"
                                  id={`${pr.order}`}
                                >
                                  <div className="w-full">
                                    <span className={styles.popoverTitle}>
                                      {index + 1}. Actuación:
                                    </span>
                                    <span className={styles.popoverText}>
                                      {pr.preguntaDocente}
                                    </span>
                                  </div>
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.map((dir, index) => {
                          const globalIndex = (currentPage - 1) * itemsPerPage + index;
                          return (
                            <tr
                              key={globalIndex}
                              className={styles.tableRow}
                            >
                              <td className={styles.tableCell}>
                                {globalIndex + 1}
                              </td>
                              <td className={`${styles.tableCell} ${styles.tableCellName}`}>
                                {dir.nombresApellidos?.toUpperCase()}
                              </td>
                              <td className={`${styles.tableCell} ${styles.tableCellName}`}>
                                {dir.dniDocente?.toUpperCase()}
                              </td>
                              <td className={styles.tableCell}>
                                {dir.respuestasCorrectas}
                              </td>
                              <td className={styles.tableCell}>
                                {dir.totalPreguntas}
                              </td>
                              <td className={styles.tableCell}>
                                {dir.puntaje}
                              </td>
                              <td className={styles.tableCell}>
                                {dir.nivel}
                              </td>
                              {dir.respuestas?.map((res) => {
                                return (
                                  <td
                                    key={res.order}
                                    className={styles.tableCell}
                                  >
                                    {handleValidateRespuesta(res)}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className={styles.noDataContainer}>
                      <div className={styles.noDataMessage}>
                        <span>📊</span>
                        <p>No hay datos para mostrar</p>
                        <p>Intenta cambiar los filtros o seleccionar otro mes</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contenedor de paginación separado */}
                {dataFiltradaDirectorTabla && dataFiltradaDirectorTabla.length > 0 && (
                  <div className={styles.paginationContainer}>
                    <div className={styles.paginationInfo}>
                      <span>Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, dataFiltradaDirectorTabla?.length || 0)} de {dataFiltradaDirectorTabla?.length || 0} registros</span>
                    </div>
                    <div className={styles.paginationSettings}>
                      <label htmlFor="itemsPerPage" className={styles.itemsPerPageLabel}>
                        Mostrar:
                      </label>
                      <select
                        id="itemsPerPage"
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                        className={styles.itemsPerPageSelect}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span>por página</span>
                    </div>
                    <div className={styles.paginationControls}>
                      <button 
                        onClick={handleFirstPage} 
                        disabled={currentPage === 1}
                        className={styles.paginationButton}
                      >
                        ⏮️ Primera
                      </button>
                      <button 
                        onClick={handlePrevPage} 
                        disabled={currentPage === 1}
                        className={styles.paginationButton}
                      >
                        ◀️ Anterior
                      </button>
                      <span className={styles.pageInfo}>
                        Página {currentPage} de {totalPages}
                      </span>
                      <button 
                        onClick={handleNextPage} 
                        disabled={currentPage === totalPages || totalPages === 0}
                        className={styles.paginationButton}
                      >
                        Siguiente ▶️
                      </button>
                      <button 
                        onClick={handleLastPage} 
                        disabled={currentPage === totalPages || totalPages === 0}
                        className={styles.paginationButton}
                      >
                        Última ⏭️
                      </button>
                    </div>
                  </div>
                )}
              </div>

            <div className={styles.reportContainer}>
              <h1 className={styles.reportTitle}>reporte de evaluación</h1>
              <div>
                <div>
                  {
                    reporteDirectorOrdenado?.map((dat: DataEstadisticas, index: number) => {
                      // Encontrar la pregunta correspondiente por su id
                      const preguntaCorrespondiente = preguntasMap.get(dat.id || '');
                      
                      return (
                        <div key={index} className={styles.questionContainer}>
                          {index + 1}.{renderPregunta(dat.id || '')}
                          <div className={styles.chartContainer}>
                            <div className={styles.chartWrapper}>
                              <Bar className={styles.chart}
                                options={options}
                                data={iterateData(dat, obtenerRespuestaPorId(dat.id || ''))}
                                ref={obtenerRefGrafico(dat.id || '')}
                              />
                            </div>
                            {/* <div className={styles.statsContainer}>
                              {Object.entries(dat)
                                .filter(([key]) => key !== 'id' && key !== 'total')
                                .map(([key, value]) => (
                                  <p key={key}>
                                    {key}: {value} | {dat.total === 0 ? 0 : ((100 * Number(value)) / Number(dat.total)).toFixed(0)}%
                                  </p>
                                ))}
                            </div> */}
                            <div className={styles.answerContainer}>
                              respuesta:<span className={styles.answerText}>{obtenerRespuestaPorId(dat.id || '')}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            </div>
          </div>
      }
    </>
  )
}

export default Reporte
Reporte.Auth = PrivateRouteDirectores