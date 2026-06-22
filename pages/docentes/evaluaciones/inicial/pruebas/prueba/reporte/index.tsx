import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useReporteDocente } from '@/features/hooks/useReporteDocente';
import {
  Alternativa,
  DataEstadisticas,
  Estudiante,
  PreguntasRespuestas,
  UserEstudiante,
} from '@/features/types/types';
import { useRouter } from 'next/router';
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
import { RiLoader4Line, RiFileExcel2Line, RiFilePdfLine } from 'react-icons/ri';
import { IoIosArrowDown } from 'react-icons/io';
import { HiOutlineDownload } from 'react-icons/hi';
import * as XLSX from 'xlsx';
import { MdDeleteForever } from 'react-icons/md';
import DeleteEstudiante from '@/modals/deleteEstudiante';
import styles from './reporte.module.css';
import { currentMonth, getAllMonths, getMonthName } from '@/fuctions/dates';
import { ordernarAscDsc, converSeccion } from '@/fuctions/regiones';
import { read, utils, writeFile } from 'xlsx';
import { exportEstudiantesToExcel } from '@/features/utils/excelExport';
import { useGenerarPDFReporte } from '@/features/hooks/useGenerarPDFReporte';
import Link from 'next/link';
import ReporteEvaluacionPorPregunta from './reporteEvaluacionPorPregunta';
import PieChartComponent from '@/components/reportes/PieChartComponent';
import { generarDataGraficoPiechart } from '@/features/utils/generar-data-grafico-piechart';
import { TablaPreguntas } from '@/components/tabla-preguntas';
import { calculoNivel, calculoPreguntasCorrectas } from '@/features/utils/calculoNivel';
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
    estudiantes: estudiantesGlob,
    currentUserData,
    dataEstadisticas,
    preguntasRespuestas,
    evaluacion,
    loaderPages,
    loaderReporteDirector,
    warningEvaEstudianteSinRegistro,
    estudiantesDeEvaluacion,
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
  const { getPreguntasRespuestas, getEvaluacion, obtenerEstudianteDeEvaluacion } = useAgregarEvaluaciones();
  const [idEstudiante, setIdEstudiante] = useState<string>('');
  const [yearSelected, setYearSelected] = useState<string>((route.query.year as string) || '');
  const [monthSelected, setMonthSelected] = useState<number>(() => {
    const mesQuery = route.query.mes;
    if (mesQuery !== undefined && mesQuery !== "" && !Array.isArray(mesQuery)) {
      const val = Number(mesQuery);
      if (!isNaN(val)) return val;
    }
    return currentMonth;
  });
  const [levelSelected, setLevelSelected] = useState<string>((route.query.nivel as string) || '');
  const [sectionSelected, setSectionSelected] = useState<string>((route.query.seccion as string) || '');
  const [order, setOrder] = useState<number>(Number(route.query.order) || 0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Obtener estudiantes pendientes (no evaluados)
  useEffect(() => {
    if (evaluacion.id && monthSelected !== undefined && monthSelected !== null) {
      const unsubscribe = obtenerEstudianteDeEvaluacion(evaluacion, sectionSelected, `${monthSelected}`);
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluacion.id, monthSelected, sectionSelected]);

  // Obtener secciones únicas disponibles en la data
  const seccionesDisponibles = useMemo(() => {
    if (!estudiantesGlob) return [];
    const sections = estudiantesGlob
      .map(est => est.seccion)
      .filter((s): s is string => !!s && s !== '');
    return Array.from(new Set(sections)).sort();
  }, [estudiantesGlob]);

  // Sincronizar estados locales con la URL cuando esta cambie (ej. al navegar atrás/adelante)
  useEffect(() => {
    if (route.isReady) {
      if (route.query.year) setYearSelected(route.query.year as string);
      const mesQuery = route.query.mes;
      if (mesQuery !== undefined && mesQuery !== "" && !Array.isArray(mesQuery)) {
        const val = Number(mesQuery);
        if (!isNaN(val) && val !== monthSelected) setMonthSelected(val);
      }
      if (route.query.nivel) setLevelSelected(route.query.nivel as string);
      if (route.query.seccion) setSectionSelected(route.query.seccion as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.query, route.isReady]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Función para actualizar la URL con los filtros actuales
  const updateQuery = (params: Record<string, any>) => {
    if (!route.isReady) return; // No actualizar si el router no está listo

    const newQuery = { ...route.query, ...params };
    // Eliminar parámetros vacíos o nulos para mantener la URL limpia
    Object.keys(newQuery).forEach(key => {
      if (newQuery[key] === '' || newQuery[key] === undefined || newQuery[key] === null) {
        delete newQuery[key];
      }
    });

    // Solo navegar si hay un cambio real para evitar bucles o refrescos innecesarios
    route.push({ pathname: route.pathname, query: newQuery }, undefined, { shallow: true });
  };

  // Crear una versión de estudiantes sincronizada con la definición global o reconstruida a partir del mapa de respuestas
  const estudiantesBase = useMemo(() => {
    if (!estudiantesGlob || !preguntasRespuestas || !evaluacion) return [];

    return estudiantesGlob.map(est => {
      if (!est.respuestas) return est;

      let respuestasReconstruidas: PreguntasRespuestas[] = [];

      if (Array.isArray(est.respuestas)) {
        // Formato antiguo (Array de objetos)
        respuestasReconstruidas = est.respuestas.map(r => {
          const globalP = preguntasRespuestas.find(p =>
            (r.id && p.id === r.id) || (r.order !== undefined && p.order === r.order)
          );
          return { ...r, respuesta: globalP?.respuesta || r.respuesta };
        });
      } else if (typeof est.respuestas === 'object') {
        // Formato nuevo optimizado (Mapa/Objeto)
        respuestasReconstruidas = preguntasRespuestas.map(p => {
          const alternativaSeleccionada = (est.respuestas as any)[p.id || ''];
          const alternativasReconstruidas = p.alternativas?.map(alt => ({
            ...alt,
            selected: !!alt.alternativa && !!alternativaSeleccionada && alt.alternativa.toLowerCase() === alternativaSeleccionada.toLowerCase()
          })) || [];

          return {
            ...p,
            alternativas: alternativasReconstruidas
          };
        });
      }

      // 2. Recalcular respuestas correctas, puntaje y nivel dinámicamente para el reporte
      let tempEst = { ...est, respuestas: respuestasReconstruidas } as any;
      tempEst = calculoPreguntasCorrectas(tempEst);
      tempEst = calculoNivel(tempEst, evaluacion);

      return tempEst as (Estudiante | UserEstudiante);
    });
  }, [estudiantesGlob, preguntasRespuestas, evaluacion]);

  // Aplicar filtro por nivel y sección sobre los estudiantes base
  const estudiantes = useMemo(() => {
    const filterLevel = (route.query.nivel as string) || levelSelected;
    const filterSection = (route.query.seccion as string) || sectionSelected;

    let filtered = estudiantesBase;

    // Filtrar por nivel
    if (filterLevel) {
      filtered = filtered.filter(est => {
        if (!est.nivel) return false;
        const nivel = est.nivel.toLowerCase();
        const search = filterLevel.toLowerCase();
        if (search === 'inicio') {
          return nivel.includes('inicio') && !nivel.includes('previo');
        }
        return nivel.includes(search);
      });
    }

    // Filtrar por sección
    if (filterSection) {
      filtered = filtered.filter(est => est.seccion === filterSection);
    }

    // Aplicar ordenamiento
    const currentOrder = Number(route.query.order) || order;
    if (currentOrder !== 0) {
      filtered = [...filtered].sort((a, b) => {
        const valA = Number(a.puntaje) || 0;
        const valB = Number(b.puntaje) || 0;
        if (currentOrder === 1) return valA - valB; // Ascendente
        if (currentOrder === 2) return valB - valA; // Descendente
        return 0;
      });
    }

    return filtered;
  }, [estudiantesBase, levelSelected, sectionSelected, order, route.query.nivel, route.query.seccion, route.query.order]);

  // Calcular promedios y distribución por niveles por sección para el gráfico comparativo
  const promedioPorSeccion = useMemo(() => {
    if (seccionesDisponibles.length < 2) return [];

    return seccionesDisponibles.map(seccion => {
      // Usar estudiantesBase que tiene todos los alumnos del grado sin el filtro de sección de la UI
      const estudiantesSeccion = estudiantesBase.filter(est => est.seccion === seccion);

      const totalPuntaje = estudiantesSeccion.reduce((acc, est) => acc + (est.puntaje || 0), 0);
      const promedio = estudiantesSeccion.length > 0 ? totalPuntaje / estudiantesSeccion.length : 0;

      // Contar niveles
      const niveles = {
        satisfactorio: 0,
        proceso: 0,
        inicio: 0,
        previo: 0
      };

      estudiantesSeccion.forEach(est => {
        const nivel = (est.nivel || '').toLowerCase();
        if (nivel.includes('satisfactorio')) niveles.satisfactorio++;
        else if (nivel.includes('proceso')) niveles.proceso++;
        else if (nivel.includes('previo')) niveles.previo++;
        else if (nivel.includes('inicio')) niveles.inicio++;
      });

      return {
        seccion: converSeccion(Number(seccion))?.toUpperCase() || seccion,
        promedio: Number(promedio.toFixed(2)),
        cantidad: estudiantesSeccion.length,
        distribucion: niveles
      };
    })
      // Ordenar por el porcentaje de estudiantes en nivel Satisfactorio (de mayor a menor)
      .sort((a, b) => {
        const percA = a.cantidad > 0 ? (a.distribucion.satisfactorio / a.cantidad) : 0;
        const percB = b.cantidad > 0 ? (b.distribucion.satisfactorio / b.cantidad) : 0;
        return percB - percA;
      });
  }, [seccionesDisponibles, estudiantesBase]);

  const handleShowTable = () => {
    setShowtable(!showTable);
  };

  const handleExportToExcel = () => {
    setLoading(true);
    try {
      const fileName = `estudiantes_${currentUserData.dni}_${getMonthName(monthSelected)}.xlsx`;
      exportEstudiantesToExcel(estudiantes, fileName, preguntasRespuestas);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleExportarGrillaPDF = async () => {
    const { exportarGrillaHeatmapPDF } = await import('@/features/utils/exportarGrillaHeatmapPDF');

    setLoading(true);
    try {
      exportarGrillaHeatmapPDF({
        estudiantes,
        preguntasRespuestas,
        evaluacion,
        monthSelected,
        nombreDocente: `${currentUserData.nombres || ''} ${currentUserData.apellidos || ''}`.trim() || 'Docente'
      });
    } catch (error) {
      console.error('Error al exportar grilla:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para detectar si toda la evaluación tiene 3 o 4 opciones basándose en la configuración de preguntas
  const detectarNumeroOpciones = useMemo(() => {
    if (!preguntasRespuestas || preguntasRespuestas.length === 0) return 4; // Por defecto 4

    let maxOpciones = 3;
    preguntasRespuestas.forEach((p) => {
      // Excluir la opción dinámica "no respondió" del conteo de alternativas reales
      const altsReales = p.alternativas?.filter(
        (alt) => alt.descripcion?.toLowerCase() !== 'no respondio'
      ) || [];
      if (altsReales.length > maxOpciones) {
        maxOpciones = altsReales.length;
      }
    });

    return maxOpciones;
  }, [preguntasRespuestas]);

  useEffect(() => {
    const idExamen = route.query.idExamen as string;
    if (idExamen) {
      obtenerAñosConData(idExamen);
      getPreguntasRespuestas(idExamen);
      getEvaluacion(`${idExamen}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.query.idExamen, currentUserData.dni]);

  useEffect(() => {
    if (evaluacion.añoDelExamen && !yearSelected) {
      setYearSelected(evaluacion.añoDelExamen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluacion.añoDelExamen]);

  useEffect(() => {
    const idExamen = route.query.idExamen as string;
    if (idExamen && yearSelected && preguntasRespuestas && preguntasRespuestas.length > 0 && evaluacion.id) {
      estudiantesQueDieronExamenPorMes(evaluacion, estudiantesGlob, yearSelected);
      const unsubscribe = estadisticasEstudiantesDelDocente(evaluacion, monthSelected, preguntasRespuestas, yearSelected);
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.query.idExamen, currentUserData.dni, evaluacion.id, yearSelected, monthSelected, preguntasRespuestas]);

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
    const valStr = e.target.value;
    if (valStr === "") return; // No hacer nada si se selecciona el placeholder
    const val = Number(valStr);
    if (isNaN(val)) return;
    setMonthSelected(val);
    updateQuery({ mes: val, page: 1 });
  };
  const handleChangeYear = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setYearSelected(val);
    updateQuery({ year: val, page: 1 });
  };
  const handleChangeLevel = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setLevelSelected(val);
    updateQuery({ nivel: val, page: 1 });
  };
  const handleChangeSection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSectionSelected(val);
    updateQuery({ seccion: val, page: 1 });
  };
  const handleChangeOrder = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value);
    setOrder(val);
    updateQuery({ order: val });
  };

  const handleExportOption = (type: string) => {
    if (type === 'excel') {
      handleExportToExcel();
    } else if (type === 'pdf-tabla') {
      handleExportarGrillaPDF();
    } else if (type === 'pdf-preguntas') {
      handleGenerarPDF();
    }
    setIsOpen(false);
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
                <div className={styles.customDropdown} ref={dropdownRef}>
                  <button
                    className={`${styles.dropdownTrigger} ${isOpen ? styles.dropdownActive : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={loading || loadingPDF || !estudiantes || estudiantes.length === 0}
                  >
                    <HiOutlineDownload className={styles.dropdownIcon} />
                    <span>{loading || loadingPDF ? 'Procesando...' : 'Exportar Reporte'}</span>
                    <IoIosArrowDown className={`${styles.arrowIcon} ${isOpen ? styles.arrowRotate : ''}`} />
                  </button>

                  {isOpen && (
                    <div className={styles.dropdownMenu}>
                      {showTable && (
                        <>
                          <div
                            className={styles.dropdownItem}
                            onClick={() => handleExportOption('pdf-tabla')}
                          >
                            <RiFilePdfLine className={styles.itemIconPdf} />
                            <div className={styles.itemContent}>
                              <span className={styles.itemTitle}>Exportar Grilla PDF</span>
                              <span className={styles.itemDescription}>Reporte tabular de resultados</span>
                            </div>
                          </div>
                          <div
                            className={styles.dropdownItem}
                            onClick={() => handleExportOption('excel')}
                          >
                            <RiFileExcel2Line className={styles.itemIconExcel} />
                            <div className={styles.itemContent}>
                              <span className={styles.itemTitle}>Exportar a Excel</span>
                              <span className={styles.itemDescription}>Datos crudos para análisis</span>
                            </div>
                          </div>
                        </>
                      )}
                      <div
                        className={`${styles.dropdownItem} ${(!imagenesGeneradas || reporteCompletoConImagenes.length === 0) ? styles.itemDisabled : ''}`}
                        onClick={() => {
                          if (imagenesGeneradas && reporteCompletoConImagenes.length > 0) {
                            handleExportOption('pdf-preguntas');
                          }
                        }}
                      >
                        <RiFilePdfLine className={styles.itemIconQuestions} />
                        <div className={styles.itemContent}>
                          <span className={styles.itemTitle}>
                            {!imagenesGeneradas ? 'Preparando PDF Preguntas...' : 'Generar PDF Preguntas'}
                          </span>
                          <span className={styles.itemDescription}>Reporte gráfico detallado</span>
                        </div>
                        {!imagenesGeneradas && <RiLoader4Line className={styles.loaderIconSmall} />}
                      </div>
                    </div>
                  )}
                </div>

                {evaluacion.tipoDeEvaluacion === '1' && (
                  <button
                    onClick={handleShowCorregirPuntajesModal}
                    className={styles.corregirButton}
                  >
                    <span>🔧</span>
                    <span>Corregir Puntajes</span>
                  </button>
                )}
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
                          value={order}
                          className={styles.modernSelect}
                          aria-label="Seleccionar orden de clasificación"
                        >
                          <option value="0">-- Seleccionar orden --</option>
                          {ordernarAscDsc.map((order) => (
                            <option key={order.id} value={order.id}>
                              {order.name}
                            </option>
                          ))}
                        </select>
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
                        value={String(monthSelected)}
                        className={styles.modernSelect}
                        aria-label="Seleccionar mes para el reporte"
                      >
                        <option value="">-- Mes --</option>
                        {getAllMonths.map((month) => (
                          <option
                            key={month.id}
                            value={String(month.id)}
                            disabled={mesesConDataDisponibles.length > 0 && !mesesConDataDisponibles.includes(month.id)}
                          >
                            {month.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.controlGroup}>
                      <label className={styles.controlLabel}>Nivel Estudiante:</label>
                      <select
                        onChange={handleChangeLevel}
                        value={levelSelected}
                        className={styles.modernSelect}
                        aria-label="Filtrar por nivel de estudiante"
                      >
                        <option value="">Todos los niveles</option>
                        <option value="Satisfactorio">Satisfactorio</option>
                        <option value="Proceso">En Proceso</option>
                        <option value="Inicio">En Inicio</option>
                        <option value="Previo">Previo al Inicio</option>
                      </select>
                    </div>

                    {seccionesDisponibles.length > 0 && (
                      <div className={styles.controlGroup}>
                        <label className={styles.controlLabel}>Sección:</label>
                        <select
                          onChange={handleChangeSection}
                          value={sectionSelected}
                          className={styles.modernSelect}
                          aria-label="Filtrar por sección de estudiante"
                        >
                          <option value="">Todas las secciones</option>
                          {seccionesDisponibles.map((sec) => (
                            <option key={sec} value={sec}>
                              Sección {converSeccion(Number(sec))?.toUpperCase() || sec}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div id="tabla-estudiantes-pdf">
                  {evaluacion.nivelYPuntaje && evaluacion.nivelYPuntaje.length > 0 && (
                    <div className={styles.levelLegend}>
                      <span className={styles.levelLegendTitle}>Leyenda de Niveles:</span>
                      {[...evaluacion.nivelYPuntaje]
                        .sort((a, b) => (b.min || 0) - (a.min || 0))
                        .map((nivel, idx) => {
                          const lowerNivel = (nivel.nivel || '').toLowerCase();
                          const colorClass = lowerNivel.includes('satisfactorio')
                            ? styles.nivelSatisfactorio
                            : lowerNivel.includes('proceso')
                              ? styles.nivelEnProceso
                              : lowerNivel.includes('previo')
                                ? styles.nivelPrevioInicio
                                : lowerNivel.includes('inicio')
                                  ? styles.nivelEnInicio
                                  : '';

                          return (
                            <div key={idx} className={styles.levelLegendItem}>
                              <div
                                className={`${styles.levelLegendColor} ${colorClass}`}
                                style={{ backgroundColor: nivel.color }}
                              ></div>
                              <span>{nivel.nivel}</span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                  <TablaPreguntas
                    estudiantes={estudiantes}
                    preguntasRespuestas={preguntasRespuestas}
                    warningEvaEstudianteSinRegistro={warningEvaEstudianteSinRegistro || undefined}
                    onDeleteEstudiante={(dni) => {
                      handleShowModalDelete();
                      setIdEstudiante(dni);
                    }}
                    linkToEdit={`/docentes/evaluaciones/inicial/pruebas/prueba/reporte/actualizar-evaluacion?idExamen=${route.query.idExamen}&mes=${monthSelected}`}
                    customColumns={{
                      showPuntaje: hasValidPuntaje(),
                      showNivel: hasValidNivel(),
                    }}
                    className={styles.tableSection}
                    currentPage={Number(route.query.page) || 1}
                    itemsPerPage={route.query.limit === 'all' ? 'all' : (Number(Array.isArray(route.query.limit) ? route.query.limit[0] : route.query.limit) || 10)}
                    onPageChange={(page) => updateQuery({ page })}
                    onItemsPerPageChange={(limit) => updateQuery({ limit, page: 1 })}
                  />
                </div>
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
                  evaluados={estudiantes.length}
                  pendientes={estudiantesDeEvaluacion.length}
                  listaPendientes={estudiantesDeEvaluacion}
                  promedioPorSeccion={promedioPorSeccion}
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
