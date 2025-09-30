import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useReporteDirectores } from '@/features/hooks/useReporteDirectores';
import { useRouter } from 'next/router';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
} from '@/fuctions/regiones';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { DataEstadisticas, PreguntasRespuestas, UserEstudiante } from '@/features/types/types';
import { RiLoader4Line } from 'react-icons/ri';
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

const Reporte = () => {
  const dispatch = useGlobalContextDispatch();
  const [filtros, setFiltros] = useState({
    grado: '',
    seccion: '',
    orden: '',
    genero: '',
  });
  const [loadingMonth, setLoadingMonth] = useState<boolean>(false);
  const [estudiantesOriginales, setEstudiantesOriginales] = useState<UserEstudiante[]>([]);


  const handleChangeFiltros = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value,
    });
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      grado: '',
      seccion: '',
      orden: '',
      genero: '',
    });
    
    // Restaurar todos los estudiantes originales
    const estudiantesARestaurar = estudiantesOriginales.length > 0 ? estudiantesOriginales : estudiantes;
    dispatch({ 
      type: AppAction.DATA_FILTRADA_DIRECTOR_TABLA, 
      payload: estudiantesARestaurar 
    });
    setEstudiantes(estudiantesARestaurar);
  };
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
    filtrosParaReporteDirector
  } = useReporteDirectores();
  const {
    currentUserData,
    reporteDirector,
    preguntasRespuestas,
    loaderReporteDirector,
    allRespuestasEstudiantesDirector,
    dataFiltradaDirectorTabla,
    evaluacion,
  } = useGlobalContext();
  const { getPreguntasRespuestas, getEvaluacion } = useAgregarEvaluaciones();
  const route = useRouter();
  const [monthSelected, setMonthSelected] = useState(currentMonth);

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

  const handleFiltrar = () => {
    // Verificar si hay filtros seleccionados
    const hayFiltrosSeleccionados = filtros.grado || filtros.seccion || filtros.genero || filtros.orden;
    
    // Usar estudiantes originales como base para el filtrado
    const baseEstudiantes = estudiantesOriginales.length > 0 ? estudiantesOriginales : estudiantes;
    
    if (hayFiltrosSeleccionados && baseEstudiantes.length > 0) {
      // Aplicar filtros usando la función del hook
      const estudiantesFiltrados = filtrosParaReporteDirector(baseEstudiantes, filtros);
      
      // Actualizar el estado global con los datos filtrados
      dispatch({ 
        type: AppAction.DATA_FILTRADA_DIRECTOR_TABLA, 
        payload: estudiantesFiltrados 
      });
      
      // También actualizar el estado local de estudiantes para que se refleje en la tabla
      setEstudiantes(estudiantesFiltrados);
    } else {
      // Si no hay filtros, restaurar todos los estudiantes originales
      const estudiantesARestaurar = estudiantesOriginales.length > 0 ? estudiantesOriginales : baseEstudiantes;
      dispatch({ 
        type: AppAction.DATA_FILTRADA_DIRECTOR_TABLA, 
        payload: estudiantesARestaurar 
      });
      setEstudiantes(estudiantesARestaurar);
    }
  };
  useEffect(() => {
    currentUserData.dni &&
      reporteDirectorEstudiantes(
        `${route.query.idEvaluacion}`,
        monthSelected,
        currentUserData,
        evaluacion
      );
    
    
  }, [route.query.id, route.query.idEvaluacion, currentUserData.dni]);
useEffect(() => {
  getGrados();
},[])
  useEffect(() => {
    getAllEvaluacionesDeEstudiantesPorMes(evaluacion);
  }, [evaluacion.id]);

  // Guardar estudiantes originales cuando se cargan
  useEffect(() => {
    if (estudiantes.length > 0 && estudiantesOriginales.length === 0) {
      setEstudiantesOriginales([...estudiantes]);
    }
  }, [estudiantes, estudiantesOriginales.length]);


console.log('estudiantes', estudiantes);

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
    });
    // Limpiar estudiantes originales para que se recarguen
    setEstudiantesOriginales([]);

    try {
      // Actualizar el mes seleccionado
      setMonthSelected(newMonth);
      
      // La función reporteDirectorEstudiantes se ejecutará automáticamente 
      // por el useEffect que depende de monthSelected
      // Solo necesitamos esperar un momento para que se complete
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error al cambiar mes:', error);
    } finally {
      setLoadingMonth(false);
    }
  };

  useEffect(() => {
    if (monthSelected && currentUserData.dni && evaluacion.id) {
      reporteDirectorEstudiantes(
        `${route.query.idEvaluacion}`,
        monthSelected,
        currentUserData,
        evaluacion
      ).finally(() => {
        setLoadingMonth(false);
      });
    }
  }, [monthSelected, currentUserData.dni, evaluacion.id]);

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
                  onChange={handleChangeMonth}
                  value={getAllMonths[monthSelected]?.name || ''}
                  disabled={loadingMonth}
                  id=""
                >
                  <option value="">Mes</option>
                  {getAllMonths.slice(0, currentMonth + 1).map((mes) => (
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
                disabled={true}
              >
                <option value="">{convertGrade(`${evaluacion.grado}`)}</option>
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
              <select className={styles.select} onChange={handleChangeFiltros} name="orden" id="">
                <option value="">ordernar por</option>
                {ordernarAscDsc.map((orden) => (
                  <option key={orden.id} value={orden.name}>
                    {orden.name}
                  </option>
                ))}
              </select>
              <button className={styles.filterButton} onClick={handleFiltrar}>
                Filtrar
              </button>
              <button className={styles.clearButton} onClick={handleLimpiarFiltros}>
                Limpiar
              </button>
            </div>

           
          <TablaPreguntas
            estudiantes={estudiantes}
            preguntasRespuestas={preguntasRespuestas}
            warningEvaEstudianteSinRegistro={undefined}
            /* warningEvaEstudianteSinRegistro={warningEvaEstudianteSinRegistro || undefined} */

            linkToEdit={`/docentes/evaluaciones/tercerNivel/pruebas/prueba/reporte/actualizar-evaluacion?idExamen=${route.query.idExamen}&mes=${monthSelected}`}
            customColumns={{
              showPuntaje: hasValidPuntaje(),
              showNivel: hasValidNivel(),
            }}
            className={styles.tableWrapper}
          />
        
          {isLoading ? (
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
              <ReporteEvaluacionPorPregunta
                dataEstadisticasOrdenadas={reporteDirectorOrdenado}
                preguntasMap={preguntasMap}
                detectarNumeroOpciones={detectarNumeroOpciones}
                warningEvaEstudianteSinRegistro={ undefined}
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
