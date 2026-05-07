import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useReporteDirectores } from '@/features/hooks/useReporteDirectores';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  sectionByGrade,
  ordernarAscDsc,
  genero,
  convertGrade,
  converSeccion,
  gradosDeColegio,
} from '@/fuctions/regiones';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { DataEstadisticas, PreguntasRespuestas, UserEstudiante } from '@/features/types/types';
import { RiLoader4Line, RiSettings4Line } from 'react-icons/ri';
import styles from './Reporte.module.css';
import { currentMonth, getAllMonths } from '@/fuctions/dates';
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores';
import { useGlobalContextDispatch } from '@/features/context/GlolbalContext';
import { AppAction } from '@/features/actions/appAction';
import { generarPDFReporte } from '@/features/utils/pdfExportEstadisticasDocentes';
import { useGenerarPDFReporte } from '@/features/hooks/useGenerarPDFReporte';
import { TablaPreguntas } from '@/components/tabla-preguntas';
import GraficoTendenciaColegio from '@/components/grafico-tendencia';
import { generarDataGraficoPiechart } from '@/features/utils/generar-data-grafico-piechart';
import ReporteEvaluacionPorPregunta from '@/pages/docentes/evaluaciones/tercerNivel/pruebas/prueba/reporte/reporteEvaluacionPorPregunta';
import Loader from '@/components/loader/loader';
ChartJS.register(
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

// Guardias persistentes fuera del componente para sobrevivir a re-montajes accidentales
let globalLastFetchParams = "";
let globalLastFetchTrendParams = "";

const Reporte = () => {
  const dispatch = useGlobalContextDispatch();
  const route = useRouter();
  const [filtros, setFiltros] = useState({
    grado: (route.query.grado as string) || '',
    seccion: (route.query.seccion as string) || '',
    orden: (route.query.orden as string) || '',
    genero: (route.query.genero as string) || '',
    nivel: (route.query.nivel as string) || '',
  });
  const [loadingMonth, setLoadingMonth] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const configRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú de configuración al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (configRef.current && !configRef.current.contains(event.target as Node)) {
        setShowConfig(false);
      }
    };

    if (showConfig) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showConfig]);

  const [columnasVisibles, setColumnasVisibles] = useState({
    showRC: true,
    showTP: true,
    showPuntaje: true,
    showNivel: true,
    showDniDocente: false // Por defecto oculto para directores a menos que lo activen
  });

  const [yearSelected, setYearSelected] = useState<number>(() => {
    const y = route.query.year;
    return y ? Number(y) : new Date().getFullYear();
  });

  const [monthSelected, setMonthSelected] = useState<number>(() => {
    const m = route.query.mes;
    return m ? Number(m) : currentMonth;
  });

  const updateQuery = useCallback((params: Record<string, any>) => {
    if (!route.isReady) return;

    const newQuery = { ...route.query, ...params };
    Object.keys(newQuery).forEach(key => {
      if (newQuery[key] === '' || newQuery[key] === undefined || newQuery[key] === null) {
        delete newQuery[key];
      }
    });

    route.push({ pathname: route.pathname, query: newQuery }, undefined, { shallow: true });
  }, [route]);

  // Sincronizar estados locales con la URL cuando esta cambie
  useEffect(() => {
    if (route.isReady) {
      setFiltros({
        grado: (route.query.grado as string) || '',
        seccion: (route.query.seccion as string) || '',
        orden: (route.query.orden as string) || '',
        genero: (route.query.genero as string) || '',
        nivel: (route.query.nivel as string) || '',
      });
      if (route.query.year) setYearSelected(Number(route.query.year));
      if (route.query.mes) setMonthSelected(Number(route.query.mes));
    }
  }, [route.query, route.isReady]);

  useEffect(() => {
    console.log("EVA-LOG: >>> Componente Reporte MONTADO <<<");
    return () => console.log("EVA-LOG: <<< Componente Reporte DESMONTADO <<<");
  }, []);

  const yearsAvailable = useMemo(() => {
    const startYear = 2025;
    const endYear = new Date().getFullYear();
    const years = [];
    for (let i = startYear; i <= endYear; i++) {
      years.push(i);
    }
    return years;
  }, []);


  // Eliminar el bloque de aquí porque está antes de la inicialización de currentUserData

  const handleChangeFiltros = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
    updateQuery({ [name]: value });
  };

  const toggleColumna = (columna: keyof typeof columnasVisibles) => {
    setColumnasVisibles(prev => ({
      ...prev,
      [columna]: !prev[columna]
    }));
  };

  // Eliminado de aquí para moverse después de la inicialización de currentUserData

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
  const {
    reporteToTableDirector,
    reporteDirectorEstudiantes,
    getGrados,
    estudiantes,
    setEstudiantes,
    getAllEvaluacionesDeEstudiantesPorMes,
    datosPorMes,
    promedioGlobal,
    mesesConDataDisponibles,
    warning,
    setIsLoading,
    isLoading,
    filtrosParaReporteDirector,
    obtenerCoberturaDirector
  } = useReporteDirectores();

  // Ya no usamos useRef locales, sino las variables globales de arriba para diagnosticar re-montajes
  const lastFetchParams = { current: globalLastFetchParams };
  const lastFetchTrendParams = { current: globalLastFetchTrendParams };

  // Función para actualizar los guardias globales
  const setGlobalFetchParams = (val: string) => {
    globalLastFetchParams = val;
    lastFetchParams.current = val;
  };

  const setGlobalTrendParams = (val: string) => {
    globalLastFetchTrendParams = val;
    lastFetchTrendParams.current = val;
  };

  const availableSections = useMemo(() => {
    const baseList = estudiantes;
    if (!baseList || baseList.length === 0) return [];

    // Extraer IDs de secciones únicas de los estudiantes cargados originalmente para el mes/año
    const uniqueSectionIds = Array.from(new Set(baseList.map(e => String(e.seccion))));

    // Filtrar la lista maestra de secciones para incluir solo las que tienen datos
    return sectionByGrade.filter(seccion => uniqueSectionIds.includes(String(seccion.id)));
  }, [estudiantes]);

  // Cálculo de promedios y distribución por sección para el gráfico comparativo
  const promedioPorSeccion = useMemo(() => {
    if (availableSections.length < 2) return [];

    return availableSections.map(seccionObj => {
      const seccionId = String(seccionObj.id);
      const estudiantesSeccion = estudiantes.filter(est => String(est.seccion) === seccionId);

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
        seccion: seccionObj.name.toUpperCase(),
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
  }, [estudiantes, availableSections]);
  const {
    currentUserData,
    reporteDirector,
    preguntasRespuestas,
    loaderReporteDirector,
    allRespuestasEstudiantesDirector,
    dataFiltradaDirectorTabla,
    evaluacion,
    estudiantesDeEvaluacion,
  } = useGlobalContext();

  // Auto-seleccionar grado de la evaluación para Directores
  useEffect(() => {
    const gradoEvaluacion = evaluacion?.grado;
    if (currentUserData?.rol === 2 && gradoEvaluacion && !filtros.grado) {
      const gradoFormatted = convertGrade(String(gradoEvaluacion));
      setFiltros((prev: any) => ({ ...prev, grado: gradoFormatted }));
      updateQuery({ grado: gradoFormatted });
    }
  }, [currentUserData?.rol, evaluacion, filtros.grado, updateQuery, setFiltros]);

  // Bloque movido abajo para evitar errores de referencia
  const nivelesLeyenda: any[] = ((evaluacion as any)?.niveles?.length > 0)
    ? (evaluacion as any).niveles
    : [
        { nombre: 'satisfactorio', color: 'var(--satisfactorio)' },
        { nombre: 'en proceso', color: 'var(--en-proceso)' },
        { nombre: 'en inicio', color: 'var(--inicio)' },
        { nombre: 'previo al inicio', color: 'var(--previo-al-inicio)' }
      ];

  const handleLimpiarFiltros = () => {
    setFiltros({
      grado: currentUserData?.rol === 2 ? filtros.grado : '',
      seccion: '',
      orden: '',
      genero: '',
      nivel: '',
    });
    updateQuery({ 
      grado: currentUserData?.rol === 2 ? filtros.grado : '', 
      seccion: '', 
      orden: '', 
      genero: '', 
      nivel: '' 
    });
  };

  const { getPreguntasRespuestas, getEvaluacion } = useAgregarEvaluaciones();
  // const route = useRouter(); // Ya definido arriba
  // const [monthSelected, setMonthSelected] = useState(currentMonth); // Ya definido arriba

  // Función para detectar si toda la evaluación tiene 3 o 4 opciones
  const detectarNumeroOpciones = useMemo(() => {
    if (!reporteDirector || reporteDirector.length === 0) return 4; // Por defecto 4

    // Verificar si todas las preguntas tienen la opción D con valores válidos
    const todasTienenOpcionD = reporteDirector.every(
      (dat: DataEstadisticas) => dat.d !== null && dat.d !== undefined && dat.d > 0
    );

    // Verificar si todas las preguntas NO tienen la opción D
    const ningunaTieneOpcionD = reporteDirector.every(
      (dat: DataEstadisticas) => dat.d === null || dat.d === undefined || dat.d === 0
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
  }, [reporteDirector]);
  const preguntasMap = useMemo(() => {
    const map = new Map<string, PreguntasRespuestas>();
    preguntasRespuestas.forEach((pregunta) => {
      if (pregunta.id) {
        map.set(pregunta.id, pregunta);
      }
    });
    return map;
  }, [preguntasRespuestas]);
  const preguntasOrdenadas = useMemo(() => {
    return [...(preguntasRespuestas || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [preguntasRespuestas]);

  // Ordenar reporteDirector por el order de las preguntas correspondientes
  const reporteDirectorOrdenado = useMemo(() => {
    if (!reporteDirector || !preguntasOrdenadas.length) return reporteDirector;

    // Crear un mapa de estadísticas por ID de pregunta
    const estadisticasMap = new Map<string, any>();
    reporteDirector.forEach((stat) => {
      if (stat.id) {
        estadisticasMap.set(stat.id, stat);
      }
    });

    // Crear un array sincronizado basado en preguntasRespuestas
    const reporteSincronizado = preguntasOrdenadas.map((pregunta) => {
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
          d: pregunta.alternativas?.some((alt) => alt.alternativa === 'd') ? 0 : undefined,
          total: 0,
        };
      }
    });

    return reporteSincronizado;
  }, [reporteDirector, preguntasOrdenadas]);

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
        graficoImagen: '', // Se llenará después de renderizar el gráfico
      };
    });
  }, [reporteDirectorOrdenado, preguntasMap]);
  const {
    graficosImagenes,
    imagenesGeneradas,
    loadingPDF,
    reporteCompletoConImagenes,
    convertirGraficoAImagen,
    handleGenerarPDF,
    limpiarImagenes
  } = useGenerarPDFReporte({
    reporteCompleto,
    currentUserData,
    titulo: 'Reporte de Evaluación - Directores',
    tipoUsuario: 'Director',
    monthSelected
  });
  // Limpiar dataFiltradaDirectorTabla cuando el componente se monta
  useEffect(() => {
    dispatch({ type: AppAction.DATA_FILTRADA_DIRECTOR_TABLA, payload: [] });
  }, [dispatch]);

  useEffect(() => {
    //me trae las preguntas y respuestas para los graficos
    getPreguntasRespuestas(`${route.query.idEvaluacion}`);
    getEvaluacion(`${route.query.idEvaluacion}`);
  }, [currentUserData.dni, route.query.idEvaluacion]);

  // Memoizar el filtrado de estudiantes para evitar loops infinitos
  const estudiantesFiltrados = useMemo(() => {
    return filtrosParaReporteDirector(estudiantes, filtros);
  }, [estudiantes, filtros, filtrosParaReporteDirector]);

  // Sincronizar el estado global cuando cambian los estudiantes filtrados
  useEffect(() => {
    dispatch({
      type: AppAction.DATA_FILTRADA_DIRECTOR_TABLA,
      payload: estudiantesFiltrados
    });
  }, [estudiantesFiltrados, dispatch]);

  // Efecto principal para cargar los datos del reporte cuando cambian los filtros de tiempo o la evaluación
  useEffect(() => {
    const currentFetchKey = `${route.query.idEvaluacion}-${monthSelected}-${yearSelected}-${evaluacion.id}`;

    if (currentUserData.dni && evaluacion.id && monthSelected !== undefined) {
      // Si los parámetros de identidad/tiempo no han cambiado, no volver a leer de Firestore
      if (lastFetchParams.current === currentFetchKey) {
        console.log("EVA-LOG: Filtro aplicado en memoria (estudiantes)");
        return;
      }

      console.log("EVA-LOG: Iniciando carga de estudiantes...", {
        motivo: "Cambio de parámetros detectado",
        keyAntigua: lastFetchParams.current,
        keyNueva: currentFetchKey
      });
      setGlobalFetchParams(currentFetchKey);

      reporteDirectorEstudiantes(
        `${route.query.idEvaluacion}`,
        monthSelected,
        yearSelected,
        currentUserData,
        evaluacion
      ).then((alumnos) => {
        if (evaluacion.id) {
          obtenerCoberturaDirector(evaluacion, alumnos);
        }
      }).finally(() => {
        setLoadingMonth(false);
      });
    }
  }, [route.query.idEvaluacion, currentUserData.dni, yearSelected, monthSelected, evaluacion.id, obtenerCoberturaDirector, reporteDirectorEstudiantes]);
  useEffect(() => {
    getGrados();
  }, [])
  useEffect(() => {
    const trendKey = `${evaluacion.id}-${yearSelected}`;
    if (evaluacion.id) {
      if (lastFetchTrendParams.current === trendKey) {
        console.log("EVA-LOG: Filtro aplicado en memoria (tendencia)");
        return;
      }
      console.log("EVA-LOG: Iniciando carga de tendencia anual (CF)...");
      setGlobalTrendParams(trendKey);
      getAllEvaluacionesDeEstudiantesPorMes(evaluacion, yearSelected);
    }
  }, [evaluacion.id, yearSelected, getAllEvaluacionesDeEstudiantesPorMes]);

  // Asegurar que el mes seleccionado sea válido para el nuevo año (COMENTADO TEMPORALMENTE PARA EVITAR SALTOS)
  /* useEffect(() => {
    if (mesesConDataDisponibles.length > 0 && route.isReady) {
      const mesEnUrl = route.query.mes ? Number(route.query.mes) : null;
      if (!mesesConDataDisponibles.includes(monthSelected)) {
        const nuevoMes = mesesConDataDisponibles[0];
        console.log(`EVA-LOG: Bloqueado salto de mes automático de ${monthSelected} a ${nuevoMes}`);
        // setMonthSelected(nuevoMes);
      }
    }
  }, [mesesConDataDisponibles, monthSelected, route.query.mes, route.isReady]); */






  const handleChangeMonth = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLoadingMonth(true);
    const selectedMonth = getAllMonths.find((mes) => mes.name === e.target.value);
    const newMonth = selectedMonth ? selectedMonth.id : currentMonth;

    // Limpiar las imágenes de gráficos cuando cambie el mes
    limpiarImagenes();
    // Limpiar filtros cuando cambie el mes
    setFiltros({
      grado: '',
      seccion: '',
      orden: '',
      genero: '',
      nivel: '',
    });


    try {
      // Actualizar el mes seleccionado
      setMonthSelected(newMonth);
      updateQuery({ mes: newMonth });

      // La función reporteDirectorEstudiantes se ejecutará automáticamente 
      // por el useEffect que depende de monthSelected
    } catch (error) {
      console.error('Error al cambiar mes:', error);
      setLoadingMonth(false);
    }
  };

  const handleChangeYear = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value);
    setYearSelected(val);
    updateQuery({ year: val });
  };

  // Eliminado: el efecto de arriba ya maneja la carga de datos por mes/año de forma consolidada

  // Crear un mapa optimizado de preguntas por ID para evitar búsquedas repetidas O(1) en lugar de O(n)


  // Memorizar las preguntas ordenadas por la propiedad order


  // Hook para generar PDF con imágenes

  return (
    <>
      {loaderReporteDirector ? (
        <div className={styles.loaderContainer}>
          <div className={styles.loaderContent}>
            <RiLoader4Line className={styles.loaderIcon} />
            <span className={styles.loaderText}>...cargando</span>
          </div>
        </div>
      ) : (
        <div className={styles.mainContainer}>
          <div className={styles.content}>
            <div className={styles.selectContainer}>
              {/* <button
                onClick={handleGenerarPDF}
                disabled={
                  loadingPDF || reporteCompletoConImagenes.length === 0 || !imagenesGeneradas
                }
                className={`${styles.pdfButton} ${
                  loadingPDF
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
              </button> */}

              <div className={styles.selectWrapper}>
                <select
                  className={styles.select}
                  onChange={handleChangeYear}
                  value={yearSelected}
                >
                  {yearsAvailable.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.selectWrapper}>
                <select
                  className={styles.select}
                  onChange={handleChangeMonth}
                  value={getAllMonths[monthSelected]?.name || ''}
                  disabled={loadingMonth}
                  id=""
                >
                  <option value="">Mes</option>
                  {getAllMonths.filter(mes => mesesConDataDisponibles.includes(mes.id)).map((mes) => (
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
                name="nivel"
                className={styles.select}
                onChange={handleChangeFiltros}
                value={filtros.nivel}
              >
                <option value="">Nivel</option>
                {evaluacion.nivelYPuntaje?.map((nivel) => (
                  <option key={nivel.id} value={nivel.nivel}>
                    {nivel.nivel}
                  </option>
                ))}
              </select>

              <select
                name="grado"
                className={styles.select}
                onChange={handleChangeFiltros}
                value={filtros.grado}
                disabled={currentUserData.rol === 2}
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
                {availableSections.map((seccion) => (
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
              <select className={styles.select} onChange={handleChangeFiltros} name="orden" id="">
                <option value="">ordernar por</option>
                {ordernarAscDsc.map((orden) => (
                  <option key={orden.id} value={orden.name}>
                    {orden.name}
                  </option>
                ))}
              </select>

              <div className={styles.configContainer} ref={configRef}>
                <button 
                  className={styles.configButton} 
                  onClick={() => setShowConfig(!showConfig)}
                  title="Configurar columnas"
                >
                  <RiSettings4Line />
                  Columnas
                </button>

                {showConfig && (
                  <div className={styles.configMenu}>
                    <span className={styles.configTitle}>Visibilidad de Columnas</span>
                    <div className={styles.configList}>
                      <label className={styles.configItem}>
                        <input 
                          type="checkbox" 
                          checked={columnasVisibles.showRC} 
                          onChange={() => toggleColumna('showRC')} 
                        />
                        <span>Respuestas Correctas (RC)</span>
                      </label>
                      <label className={styles.configItem}>
                        <input 
                          type="checkbox" 
                          checked={columnasVisibles.showTP} 
                          onChange={() => toggleColumna('showTP')} 
                        />
                        <span>Total Preguntas (TP)</span>
                      </label>
                      <label className={styles.configItem}>
                        <input 
                          type="checkbox" 
                          checked={columnasVisibles.showPuntaje} 
                          onChange={() => toggleColumna('showPuntaje')} 
                        />
                        <span>Puntaje</span>
                      </label>
                      <label className={styles.configItem}>
                        <input 
                          type="checkbox" 
                          checked={columnasVisibles.showNivel} 
                          onChange={() => toggleColumna('showNivel')} 
                        />
                        <span>Nivel (Logro)</span>
                      </label>
                      <label className={styles.configItem}>
                        <input 
                          type="checkbox" 
                          checked={columnasVisibles.showDniDocente} 
                          onChange={() => toggleColumna('showDniDocente')} 
                        />
                        <span>DNI Docente</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <button className={styles.clearButton} onClick={handleLimpiarFiltros}>
                Limpiar Filtros
              </button>
            </div>


            {isLoading || loadingMonth ? (
              <div className={styles.loaderContainer}>
                <Loader
                  size="large"
                  variant="spinner"
                  text="Cargando datos..."
                  color="#10b981"
                />
              </div>
            ) : (
              <>
                {/* Leyenda de Niveles */}
                <div className={styles.legendContainer}>
                  <span className={styles.legendTitle}>LEYENDA DE NIVELES:</span>
                  {(nivelesLeyenda as any[]).map((nivel: any, index: number) => (
                    <div key={index} className={styles.legendItem}>
                      <div 
                        className={styles.legendCircle} 
                        style={{ backgroundColor: nivel.color }}
                      ></div>
                      <span className={styles.legendLabel}>{nivel.nombre}</span>
                    </div>
                  ))}
                </div>

                <TablaPreguntas
                  estudiantes={estudiantesFiltrados}
                  preguntasRespuestas={preguntasRespuestas}
                  warningEvaEstudianteSinRegistro={undefined}
                  /* warningEvaEstudianteSinRegistro={warningEvaEstudianteSinRegistro || undefined} */

                  linkToEdit={`/docentes/evaluaciones/tercerNivel/pruebas/prueba/reporte/actualizar-evaluacion?idExamen=${route.query.idExamen}&mes=${monthSelected}`}
                  customColumns={{
                    showPuntaje: columnasVisibles.showPuntaje,
                    showNivel: columnasVisibles.showNivel,
                    showRC: columnasVisibles.showRC,
                    showTP: columnasVisibles.showTP,
                    showDniDocente: columnasVisibles.showDniDocente
                  }}
                  className={styles.tableWrapper}
                />

                {evaluacion.tipoDeEvaluacion === '1' ? (
                  <div className={styles.graficosContainer}>
                    <GraficoTendenciaColegio
                      evaluacion={evaluacion}
                      datosPorMes={datosPorMes}
                      mesesConDataDisponibles={mesesConDataDisponibles}
                      promedioGlobal={promedioGlobal}
                      monthSelected={monthSelected}
                      promedioPorSeccion={promedioPorSeccion}
                      evaluados={estudiantes.length}
                      pendientes={estudiantesDeEvaluacion.length}
                      listaPendientes={estudiantesDeEvaluacion}
                      dataGraficoTendenciaNiveles={[
                        generarDataGraficoPiechart(estudiantesFiltrados, monthSelected, evaluacion),
                      ]}
                    />
                  </div>
                ) : null}
                <ReporteEvaluacionPorPregunta
                  dataEstadisticasOrdenadas={reporteDirectorOrdenado}
                  preguntasMap={preguntasMap}
                  detectarNumeroOpciones={detectarNumeroOpciones}
                  warningEvaEstudianteSinRegistro={undefined}
                  convertirGraficoAImagen={convertirGraficoAImagen}
                />
              </>
            )}
          </div>

        </div>
      )}
    </>
  );
};

export default Reporte;
Reporte.Auth = PrivateRouteDirectores;
