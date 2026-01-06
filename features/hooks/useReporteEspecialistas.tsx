import {
  collection,
  getAggregateFromServer,
  average,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
  getCountFromServer,
} from 'firebase/firestore';
import {
  DataEstadisticas,
  DataGraficoTendencia,
  Evaluaciones,
  GraficoTendenciaNiveles,
  GraficoPieChart,
  Region,
  User,
  UserEstudiante,
} from '../types/types';
import { useGlobalContext, useGlobalContextDispatch } from '../context/GlolbalContext';
import { AppAction } from '../actions/appAction';
import { currentMonth, currentYear } from '@/fuctions/dates';
import { calcularEstadisticasOptimizadas } from '@/fuctions/funcione-calculo-estadistica';

export const useReporteEspecialistas = () => {
  const dispatch = useGlobalContextDispatch();
  const { currentUserData } = useGlobalContext();
  const db = getFirestore();

  const getDataGraficoPieChart = async (
    idEvaluacion: string,
    mes: number,
    evaluacion: Evaluaciones,
    filtroGenero?: string,
    filtroRegion?: string,
    yearSelected?: number
  ) => {
    console.log('evaluacion', evaluacion);
    console.log('filtroGenero', filtroGenero);
    console.log('filtroRegion', filtroRegion);
    try {
      dispatch({ type: AppAction.LOADER_DATA_GRAFICO_PIE_CHART, payload: true });
      const dataGraficoPieChart: GraficoPieChart[] = [];
      const coll = collection(
        db,
        `/evaluaciones/${idEvaluacion}/estudiantes-evaluados/${yearSelected}/${mes}`
      );

      // Crear query para el total con los mismos filtros que se aplicarán a los niveles
      const condicionesTotal: any[] = [];
      if (filtroGenero) {
        condicionesTotal.push(where('genero', '==', filtroGenero));
      }
      if (filtroRegion) {
        condicionesTotal.push(where('region', '==', Number(filtroRegion)));
      }

      const queryTotal = condicionesTotal.length > 0
        ? query(coll, ...condicionesTotal)
        : coll;

      const cantidadDocumentos = await getCountFromServer(queryTotal);

      if (cantidadDocumentos.data().count > 0) {
        // Validar que exista nivelYPuntaje en la evaluación
        if (!evaluacion.nivelYPuntaje || evaluacion.nivelYPuntaje.length === 0) {
          console.warn('No se encontraron niveles y puntajes en la evaluación');
          dispatch({
            type: AppAction.DATA_GRAFICO_PIE_CHART,
            payload: [],
          });
          return;
        }

        // Crear queries dinámicamente basadas en nivelYPuntaje
        const queriesPorNivel: Record<string, any> = {};
        const snapshotsPorNivel: Record<string, any> = {};
        const nivelesData: Array<{ nivel: string; cantidadDeEstudiantes: number }> = [];

        // Procesar cada nivel de nivelYPuntaje
        for (const nivelData of evaluacion.nivelYPuntaje) {
          const nivelNombre = nivelData.nivel?.toLowerCase() || '';
          const minPuntaje = nivelData.min || 0;
          const maxPuntaje = nivelData.max || Number.MAX_SAFE_INTEGER;

          // Construir condiciones de filtro
          const condicionesWhere: any[] = [];

          // Agregar condición de puntaje según el nivel
          if (nivelNombre === 'previo al inicio') {
            condicionesWhere.push(where('puntaje', '<=', maxPuntaje));
            condicionesWhere.push(where('puntaje', '>=', 0));
          } else {
            condicionesWhere.push(where('puntaje', '<=', maxPuntaje));
            condicionesWhere.push(where('puntaje', '>=', minPuntaje));
          }

          // Agregar filtro de género si está presente
          if (filtroGenero) {
            condicionesWhere.push(where('genero', '==', filtroGenero));
          }

          // Agregar filtro de región si está presente
          if (filtroRegion) {
            condicionesWhere.push(where('region', '==', Number(filtroRegion)));
          }

          // Crear query con todas las condiciones
          const q = query(
            collection(db, `/evaluaciones/${idEvaluacion}/estudiantes-evaluados/${yearSelected}/${mes}`),
            ...condicionesWhere
          );

          queriesPorNivel[nivelNombre] = q;
        }

        // Ejecutar todas las queries y obtener los conteos
        for (const nivelData of evaluacion.nivelYPuntaje) {
          const nivelNombre = nivelData.nivel?.toLowerCase() || '';
          if (queriesPorNivel[nivelNombre]) {
            const snapshot = await getCountFromServer(queriesPorNivel[nivelNombre]);
            snapshotsPorNivel[nivelNombre] = snapshot.data().count;
            nivelesData.push({
              nivel: nivelData.nivel || nivelNombre,
              cantidadDeEstudiantes: snapshot.data().count,
            });
          }
        }

        // Calcular la diferencia entre el total y la suma de estudiantes por nivel
        // Esta diferencia incluye estudiantes con puntaje null y otros casos no contados
        const totalDocumentos = cantidadDocumentos.data().count;
        const sumaPorNiveles = nivelesData.reduce((suma, nivel) => suma + nivel.cantidadDeEstudiantes, 0);
        const diferencia = totalDocumentos - sumaPorNiveles;

        // Si hay diferencia positiva, agregarla al nivel "previo al inicio"
        if (diferencia > 0) {
          const nivelPrevioAlInicio = nivelesData.find(n => n.nivel.toLowerCase() === 'previo al inicio');
          if (nivelPrevioAlInicio) {
            nivelPrevioAlInicio.cantidadDeEstudiantes += diferencia;
          } else {
            // Si no existe el nivel "previo al inicio", agregarlo
            nivelesData.push({
              nivel: 'previo al inicio',
              cantidadDeEstudiantes: diferencia,
            });
          }
        }

        // Crear objeto para el gráfico de pie chart
        const objetoGraficoPieChart = {
          mes: mes,
          niveles: nivelesData,
        };
        dataGraficoPieChart.push(objetoGraficoPieChart);
        const dataGraficoPieChartOrdenada = dataGraficoPieChart.sort(
          (a, b) => a.mes - b.mes
        );

        dispatch({
          type: AppAction.DATA_GRAFICO_PIE_CHART,
          payload: dataGraficoPieChartOrdenada,
        });
      }
    } catch (error) {
      console.error('Error al obtener datos para gráfico de tendencia:', error);
    } finally {
      dispatch({ type: AppAction.LOADER_DATA_GRAFICO_PIE_CHART, payload: false });
    }
  };
  const getDataParaGraficoTendencia = async (rangoMes: number[], idEvaluacion: string, evaluacion?: Evaluaciones, yearSelected?: number) => {
    dispatch({ type: AppAction.LOADER_GRAFICOS, payload: true });
    dispatch({ type: AppAction.DATA_GRAFICO_TENDENCIA, payload: [] });
    dispatch({ type: AppAction.DATA_GRAFICO_TENDENCIA_NIVELES, payload: [] });
    const dataGraficoTendencia: DataGraficoTendencia[] = [];
    const dataGraficoTendenciaNiveles: GraficoTendenciaNiveles[] = [];
    // Validar que rangoMes sea un array válido
    if (!rangoMes || !Array.isArray(rangoMes) || rangoMes.length === 0) {
      console.warn('rangoMes no es válido o está vacío:', rangoMes);
      return dataGraficoTendencia;
    }

    // Si no se pasa evaluacion, intentar obtenerla
    let evaluacionData = evaluacion;
    if (!evaluacionData) {
      try {
        const evaluacionDoc = await getDoc(doc(db, 'evaluaciones', idEvaluacion));
        if (evaluacionDoc.exists()) {
          evaluacionData = evaluacionDoc.data() as Evaluaciones;
        }
      } catch (error) {
        console.error('Error al obtener evaluación:', error);
      }
    }

    // Validar que exista nivelYPuntaje en la evaluación
    if (!evaluacionData?.nivelYPuntaje || evaluacionData.nivelYPuntaje.length === 0) {
      console.warn('No se encontraron niveles y puntajes en la evaluación');
      dispatch({ type: AppAction.LOADER_GRAFICOS, payload: false });
      return dataGraficoTendencia;
    }

    try {
      const promesas = rangoMes.map(async (mes) => {
        const coll = collection(
          db,
          `/evaluaciones/${idEvaluacion}/estudiantes-evaluados/${yearSelected}/${mes}`
        );
        const cantidadDocumentos = await getCountFromServer(coll);
        console.log('cantidadDocumentos', cantidadDocumentos.data().count);
        if (cantidadDocumentos.data().count > 0 && evaluacionData?.nivelYPuntaje) {
          // Crear queries dinámicamente basadas en nivelYPuntaje
          const queriesPorNivel: Record<string, any> = {};
          const nivelesData: Array<{ nivel: string; cantidadDeEstudiantes: number }> = [];

          // Procesar cada nivel de nivelYPuntaje
          for (const nivelData of evaluacionData.nivelYPuntaje) {
            const nivelNombre = nivelData.nivel?.toLowerCase() || '';
            const minPuntaje = nivelData.min || 0;
            const maxPuntaje = nivelData.max || Number.MAX_SAFE_INTEGER;

            // Crear query según el nivel
            let q;
            if (nivelNombre === 'previo al inicio') {
              // Para "previo al inicio", usar >= 0
              q = query(
                collection(db, `/evaluaciones/${idEvaluacion}/estudiantes-evaluados/${yearSelected}/${mes}`),
                where('puntaje', '<=', maxPuntaje),
                where('puntaje', '>=', 0)
              );
            } else {
              // Para otros niveles, usar el rango completo
              q = query(
                collection(db, `/evaluaciones/${idEvaluacion}/estudiantes-evaluados/${yearSelected}/${mes}`),
                where('puntaje', '<=', maxPuntaje),
                where('puntaje', '>=', minPuntaje)
              );
            }

            queriesPorNivel[nivelNombre] = q;
          }

          // Ejecutar todas las queries y obtener los conteos
          for (const nivelData of evaluacionData.nivelYPuntaje) {
            const nivelNombre = nivelData.nivel?.toLowerCase() || '';
            if (queriesPorNivel[nivelNombre]) {
              const snapshot = await getCountFromServer(queriesPorNivel[nivelNombre]);
              nivelesData.push({
                nivel: nivelData.nivel || nivelNombre,
                cantidadDeEstudiantes: snapshot.data().count,
              });
            }
          }

          // Calcular la diferencia entre el total y la suma de estudiantes por nivel
          // Esta diferencia incluye estudiantes con puntaje null y otros casos no contados
          const totalDocumentos = cantidadDocumentos.data().count;
          const sumaPorNiveles = nivelesData.reduce((suma, nivel) => suma + nivel.cantidadDeEstudiantes, 0);
          const diferencia = totalDocumentos - sumaPorNiveles;

          // Si hay diferencia positiva, agregarla al nivel "previo al inicio"
          if (diferencia > 0) {
            const nivelPrevioAlInicio = nivelesData.find(n => n.nivel.toLowerCase() === 'previo al inicio');
            if (nivelPrevioAlInicio) {
              nivelPrevioAlInicio.cantidadDeEstudiantes += diferencia;
            } else {
              // Si no existe el nivel "previo al inicio", agregarlo
              nivelesData.push({
                nivel: 'previo al inicio',
                cantidadDeEstudiantes: diferencia,
              });
            }
          }

          // Crear objeto para el gráfico de tendencia por niveles
          const objetoGraficoTendenciaNiveles = {
            mes: mes,
            niveles: nivelesData,
          };
          dataGraficoTendenciaNiveles.push(objetoGraficoTendenciaNiveles);
          const dataGraficoTendenciaNivelesOrdenada = dataGraficoTendenciaNiveles.sort(
            (a, b) => a.mes - b.mes
          );

          dispatch({
            type: AppAction.DATA_GRAFICO_TENDENCIA_NIVELES,
            payload: dataGraficoTendenciaNivelesOrdenada,
          });
        }

        // Agregar al array dataGraficoTendenciaNiveles
        const snapshot = await getAggregateFromServer(coll, {
          averagePopulation: average('puntaje'),
        });
        const puntajeMedia = snapshot.data().averagePopulation;
        /* console.log('puntajeMedia', puntajeMedia); */
        if (puntajeMedia !== null) {
          dataGraficoTendencia.push({ mes, puntajeMedia });
        }
      });

      await Promise.all(promesas);

      // Ordenar por ID (mes) de forma ascendente
      const dataGraficoTendenciaOrdenada = dataGraficoTendencia.sort((a, b) => a.mes - b.mes);

      dispatch({ type: AppAction.LOADER_GRAFICOS, payload: false });
      dispatch({ type: AppAction.DATA_GRAFICO_TENDENCIA, payload: dataGraficoTendenciaOrdenada });
    } catch (error) {
      console.error('Error al obtener datos para gráfico de tendencia:', error);
      throw error;
    }
  };

  const getAllReporteDeDirectores = async (idEvaluacion: string, month: number) => {
    const pathRef = collection(db, `/evaluaciones/${idEvaluacion}/${currentYear}-${month}`);
    const querySnapshot = await getDocs(pathRef);

    const docentesDelDirector: User[] = [];
    querySnapshot.forEach((doc) => {
      docentesDelDirector.push(doc.data() as User);
    });
    dispatch({ type: AppAction.ALL_EVALUACIONES_ESTUDIANTES, payload: docentesDelDirector });
    return docentesDelDirector;
  };
  const getAllReporteDeDirectoresToDocentes = async (idEvaluacion: string, month: number) => {
    const pathRef = collection(
      db,
      `/evaluaciones-docentes/${idEvaluacion}/${currentYear}-${month}`
    );
    const querySnapshot = await getDocs(pathRef);

    const docentesDelDirector: User[] = [];
    querySnapshot.forEach((doc) => {
      docentesDelDirector.push(doc.data() as User);
    });
    dispatch({ type: AppAction.ALL_EVALUACIONES_DIRECTOR_DOCENTE, payload: docentesDelDirector });
    console.log('docentesDelDirector', docentesDelDirector);
    return docentesDelDirector;
  };

  const reporteEspecialistaDeDocente = async (idEvaluacion: string, month: number) => {
    const reporteDeEvaluacionesDocentes = await getAllReporteDeDirectoresToDocentes(
      idEvaluacion,
      month
    );
    const acumuladoPorPregunta: Record<
      string,
      { id: string; a: number; b: number; c: number; d?: number; total: number }
    > = {};

    // Si no hay datos, inicializar con valores en cero
    if (!reporteDeEvaluacionesDocentes || reporteDeEvaluacionesDocentes.length === 0) {
      dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: [] });
      return;
    }

    reporteDeEvaluacionesDocentes.forEach((director) => {
      if (director.resultados && Array.isArray(director.resultados)) {
        director.resultados.forEach((reporte) => {
          const idPregunta = String(reporte.id);
          if (!idPregunta) return;

          // Detectar si la alternativa 'd' existe en esta pregunta
          let tieneD = typeof reporte.d === 'number';

          if (!acumuladoPorPregunta[idPregunta]) {
            acumuladoPorPregunta[idPregunta] = tieneD
              ? { id: idPregunta, a: 0, b: 0, c: 0, d: 0, total: 0 }
              : { id: idPregunta, a: 0, b: 0, c: 0, total: 0 };
          }

          // Acumular valores
          acumuladoPorPregunta[idPregunta].a += reporte.a || 0;
          acumuladoPorPregunta[idPregunta].b += reporte.b || 0;
          acumuladoPorPregunta[idPregunta].c += reporte.c || 0;
          if (tieneD) {
            acumuladoPorPregunta[idPregunta].d! += reporte.d || 0;
          }
        });
      }
    });

    // Calcular totales
    Object.values(acumuladoPorPregunta).forEach((obj) => {
      obj.total = obj.a + obj.b + obj.c + (typeof obj.d === 'number' ? obj.d : 0);
    });

    const resultado = Object.values(acumuladoPorPregunta);
    console.log('acumulado por pregunta', resultado);

    dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: resultado });
    return resultado;
  };

  const restablecerFiltrosDeEspecialista = (idEvaluacion: string, month: number, yearSelected: number) => {
    /*     dispatch({ type: AppAction.DATA_FILTRADA_ESPECIALISTA_DIRECTOR_TABLA, payload: [] }); */

    getEstadisticaGlobal(idEvaluacion, month, yearSelected);
    dispatch({ type: AppAction.REPORTE_DIRECTOR, payload: [] });
  };
  const reporteParaTablaDeEspecialista = async (
    data: User[],
    {
      region,
      area,
      genero,
      caracteristicaCurricular,
      distrito,
    }: {
      region: string;
      area: string;
      genero: string;
      caracteristicaCurricular: string;
      distrito: string;
    },
    month: number,
    idEvaluacion: string,
    yearSelected: number
  ) => {
    console.log('data', data);
    /* se usara la funcion getAllReporteDeDirectoreToAdmin */
    const dataDirectores = await getAllReporteDeDirectoreToAdmin(idEvaluacion, month, yearSelected);//me retorna todos los directores
    const dataFiltrada = dataDirectores?.filter((estudiante) => {
      // Crear un objeto con los filtros que tienen valor
      const filtrosActivos = {
        ...(region && { region: String(estudiante.region) === region }),
        ...(area && { area: String(estudiante.area) === area }),
        ...(genero && { genero: String(estudiante.genero) === String(genero) }),
        ...(caracteristicaCurricular && {
          caracteristicaCurricular:
            String(estudiante.caracteristicaCurricular) === String(caracteristicaCurricular),
        }),
        ...(distrito && { distrito: String(estudiante.distrito) === String(distrito) }),
      };

      // Si no hay filtros activos, retornar true para incluir todos los estudiantes
      if (Object.keys(filtrosActivos).length === 0) return true;

      // Verificar que todos los filtros activos sean verdaderos
      return Object.values(filtrosActivos).every((filtro) => filtro === true);
    });
    const acumuladoPorPregunta: Record<
      string,
      { id: string; a: number; b: number; c: number; d?: number; total: number }
    > = {};
    // Primero, analizar todos los directores para encontrar el patrón más común
    const directoresConDatos = dataFiltrada.filter(
      (director) =>
        director.reporteEstudiantes &&
        Array.isArray(director.reporteEstudiantes) &&
        director.reporteEstudiantes.length > 0
    );

    // Validar que hay directores con datos antes de continuar
    if (directoresConDatos.length === 0) {
      const resultadoVacio: any[] = [];
      dispatch({ type: AppAction.REPORTE_DIRECTOR, payload: resultadoVacio });
      return dataFiltrada;
    }

    // Contar frecuencia de cantidad de preguntas
    const frecuenciaPorCantidad: Record<number, number> = {};
    const directoresPorCantidad: Record<number, typeof directoresConDatos> = {};

    directoresConDatos.forEach((director) => {
      const cantidadPreguntas = director.reporteEstudiantes!.length;
      frecuenciaPorCantidad[cantidadPreguntas] =
        (frecuenciaPorCantidad[cantidadPreguntas] || 0) + 1;

      if (!directoresPorCantidad[cantidadPreguntas]) {
        directoresPorCantidad[cantidadPreguntas] = [];
      }
      directoresPorCantidad[cantidadPreguntas].push(director);
    });

    // Encontrar la cantidad de preguntas más común
    const cantidadesPreguntasDisponibles = Object.keys(frecuenciaPorCantidad);

    if (cantidadesPreguntasDisponibles.length === 0) {
      const resultadoVacio: any[] = [];
      dispatch({ type: AppAction.REPORTE_DIRECTOR, payload: resultadoVacio });
      return dataFiltrada;
    }

    const cantidadMasComun = cantidadesPreguntasDisponibles.reduce((a, b) =>
      frecuenciaPorCantidad[parseInt(a)] > frecuenciaPorCantidad[parseInt(b)] ? a : b
    );

    const directoresValidos = directoresPorCantidad[parseInt(cantidadMasComun)] || [];

    // Procesar solo los directores válidos
    directoresValidos.forEach((director) => {
      if (director.reporteEstudiantes && Array.isArray(director.reporteEstudiantes)) {
        director.reporteEstudiantes.forEach((reporte) => {
          const idPregunta = String(reporte.id);
          if (!idPregunta) {
            return;
          }

          // Detectar si la alternativa 'd' existe en esta pregunta
          let tieneD = typeof reporte.d === 'number';

          if (!acumuladoPorPregunta[idPregunta]) {
            acumuladoPorPregunta[idPregunta] = tieneD
              ? { id: idPregunta, a: 0, b: 0, c: 0, d: 0, total: 0 }
              : { id: idPregunta, a: 0, b: 0, c: 0, total: 0 };
          }

          // Acumular valores
          acumuladoPorPregunta[idPregunta].a += reporte.a || 0;
          acumuladoPorPregunta[idPregunta].b += reporte.b || 0;
          acumuladoPorPregunta[idPregunta].c += reporte.c || 0;
          if (tieneD) {
            acumuladoPorPregunta[idPregunta].d! += reporte.d || 0;
          }
        });
      }
    });

    // Calcular totales
    Object.values(acumuladoPorPregunta).forEach((obj) => {
      obj.total = obj.a + obj.b + obj.c + (typeof obj.d === 'number' ? obj.d : 0);
    });

    const resultado = Object.values(acumuladoPorPregunta);

    dispatch({ type: AppAction.REPORTE_DIRECTOR, payload: resultado });
    return dataFiltrada;
  };

  const reporteFiltrosEspecialistaDirectores = (
    data: User[],
    {
      area,
      genero,
      caracteristicaCurricular,
      distrito,
    }: { area: string; genero: string; caracteristicaCurricular: string; distrito: string }
  ) => {
    console.log('data', data); //data son todos los docentes de la region, se filtra todos los docentes con sus datos personales y los datos de las evaluaciones echas a sus estudiantes.

    const dataFiltrada = data?.filter((estudiante) => {
      // Crear un objeto con los filtros que tienen valor
      const filtrosActivos = {
        ...(area && { area: String(estudiante.area) === area }),
        ...(genero && { genero: estudiante.genero === genero }),
        ...(caracteristicaCurricular && {
          caracteristicaCurricular:
            estudiante.caracteristicaCurricular === caracteristicaCurricular,
        }),
        ...(distrito && { distrito: estudiante.distrito === distrito }),
      };

      // Si no hay filtros activos, retornar true para incluir todos los estudiantes
      if (Object.keys(filtrosActivos).length === 0) return true;

      // Verificar que todos los filtros activos sean verdaderos
      return Object.values(filtrosActivos).every((filtro) => filtro === true);
    });

    const acumuladoPorPregunta: Record<
      string,
      { id: string; a: number; b: number; c: number; d?: number; total: number }
    > = {};

    dataFiltrada.forEach((director) => {
      if (director.resultados && Array.isArray(director.resultados)) {
        director.resultados.forEach((reporte) => {
          const idPregunta = String(reporte.id);
          if (!idPregunta) return;

          // Detectar si la alternativa 'd' existe en esta pregunta
          let tieneD = typeof reporte.d === 'number';

          if (!acumuladoPorPregunta[idPregunta]) {
            acumuladoPorPregunta[idPregunta] = tieneD
              ? { id: idPregunta, a: 0, b: 0, c: 0, d: 0, total: 0 }
              : { id: idPregunta, a: 0, b: 0, c: 0, total: 0 };
          }

          // Acumular valores
          acumuladoPorPregunta[idPregunta].a += reporte.a || 0;
          acumuladoPorPregunta[idPregunta].b += reporte.b || 0;
          acumuladoPorPregunta[idPregunta].c += reporte.c || 0;
          if (tieneD) {
            acumuladoPorPregunta[idPregunta].d! += reporte.d || 0;
          }
        });
      }
    });

    // Calcular totales
    Object.values(acumuladoPorPregunta).forEach((obj) => {
      obj.total = obj.a + obj.b + obj.c + (typeof obj.d === 'number' ? obj.d : 0);
    });

    const resultado = Object.values(acumuladoPorPregunta);
    dispatch({ type: AppAction.DATA_ESTADISTICAS, payload: resultado });
    return dataFiltrada;
  };

  const getAllReporteDeDirectoreToAdmin = async (idEvaluacion: string, month: number, yearSelected: number) => {
    const q = query(collection(db, 'usuarios'), where('rol', '==', 2));

    const directores = await getDocs(q);
    console.log('cantidad total de directores', directores.size); //esto se creo solo para saber el total de directores que exite en la coleccion de usuarios

    const pathRef = collection(db, `/evaluaciones/${idEvaluacion}/${yearSelected}-${month}`);
    const querySnapshot = await getDocs(pathRef); //me traigo todos los directores que se encuentran en esta coleccion de una evaluacion especifica
    console.log('tamanio de la coleccion', querySnapshot.size);
    const docentesDelDirector: User[] = [];
    querySnapshot.forEach((doc) => {
      docentesDelDirector.push(doc.data() as User);
    });

    console.log('docentesDelDirector', docentesDelDirector);
    dispatch({ type: AppAction.ALL_EVALUACIONES_DIRECTOR_DOCENTE, payload: docentesDelDirector });
    return docentesDelDirector;
  };

  const getEstadisticaGlobal = async (idEvaluacion: string, month: number, yearSelected: number) => {
    try {
      dispatch({ type: AppAction.LOADER_REPORTE_POR_PREGUNTA, payload: true });
      const pathData = `/evaluaciones/${idEvaluacion}/estadisticas-graficos/`;

      const docRef = doc(db, pathData, `${yearSelected}-${month}`);
      const docSnap = await getDoc(docRef);

      // Verificar si el documento existe y tiene datos
      if (docSnap.exists() && docSnap.data()) {
        const acumuladoGlobal = docSnap.data()?.acumuladoGlobal;
        // Dispatch de los datos solo si existen
        dispatch({
          type: AppAction.DATA_ESTADISTICA_EVALUACION,
          payload: acumuladoGlobal || [],
        });
      } else {
        console.log('No se encontraron datos en el documento');
        // Dispatch con array vacío si no hay datos
        dispatch({
          type: AppAction.DATA_ESTADISTICA_EVALUACION,
          payload: [],
        });
      }
    } catch (error) {
      console.error('Error al obtener estadísticas globales:', error);
      // En caso de error, dispatch con array vacío
      dispatch({
        type: AppAction.DATA_ESTADISTICA_EVALUACION,
        payload: [],
      });
    } finally {
      // Siempre desactivar el loader, sin importar si hubo éxito o error
      dispatch({ type: AppAction.LOADER_REPORTE_POR_PREGUNTA, payload: false });
    }
  };
  //creo que esta funcion se esta usando para el especialista y directores, tengo que verificar en caso alguna pagina comienze a fallar y comienze a dar error
  const reporteEspecialistaDeEstudiantes = async (
    idEvaluacion: string,
    month: number,
    currentUserData: User,
    yearSelected: number
  ) => {
    /* const reporteDeEstudiantes = await getAllReporteDeDirectoresToDocentes(idEvaluacion, month) */
    const reporteDeEstudiantes = await getAllReporteDeDirectoreToAdmin(idEvaluacion, month, yearSelected);

    const acumuladoPorPregunta: Record<
      string,
      { id: string; a: number; b: number; c: number; d?: number; total: number }
    > = {};

    // Primero, analizar todos los directores para encontrar el patrón más común
    const directoresConDatos = reporteDeEstudiantes.filter(
      (director) =>
        director.reporteEstudiantes &&
        Array.isArray(director.reporteEstudiantes) &&
        director.reporteEstudiantes.length > 0
    );

    // Validar que hay directores con datos antes de continuar
    if (directoresConDatos.length === 0) {
      const resultadoVacio: any[] = [];
      dispatch({ type: AppAction.REPORTE_DIRECTOR, payload: resultadoVacio });
      return resultadoVacio;
    }

    // Contar frecuencia de cantidad de preguntas
    const frecuenciaPorCantidad: Record<number, number> = {};
    const directoresPorCantidad: Record<number, typeof directoresConDatos> = {};

    directoresConDatos.forEach((director) => {
      const cantidadPreguntas = director.reporteEstudiantes!.length;
      frecuenciaPorCantidad[cantidadPreguntas] =
        (frecuenciaPorCantidad[cantidadPreguntas] || 0) + 1;

      if (!directoresPorCantidad[cantidadPreguntas]) {
        directoresPorCantidad[cantidadPreguntas] = [];
      }
      directoresPorCantidad[cantidadPreguntas].push(director);
    });

    // Encontrar la cantidad de preguntas más común
    const cantidadesPreguntasDisponibles = Object.keys(frecuenciaPorCantidad);

    if (cantidadesPreguntasDisponibles.length === 0) {
      const resultadoVacio: any[] = [];
      dispatch({ type: AppAction.REPORTE_DIRECTOR, payload: resultadoVacio });
      return resultadoVacio;
    }

    const cantidadMasComun = cantidadesPreguntasDisponibles.reduce((a, b) =>
      frecuenciaPorCantidad[parseInt(a)] > frecuenciaPorCantidad[parseInt(b)] ? a : b
    );

    const directoresValidos = directoresPorCantidad[parseInt(cantidadMasComun)] || [];

    // Log detallado de directores descartados
    if (directoresConDatos.length !== directoresValidos.length) {
      directoresConDatos.forEach((director, index) => {
        const cantidadPreguntas = director.reporteEstudiantes!.length;
        const esValido = cantidadPreguntas === parseInt(cantidadMasComun);
        if (!esValido) {
          /*  console.log(`  - Director ${index + 1} (${director.dni}): ${cantidadPreguntas} preguntas (esperado: ${cantidadMasComun})`) */
        }
      });
    }
    /*  calcularEstadisticasOptimizadas(directoresValidos) */
    // Procesar solo los directores válidos
    directoresValidos.forEach((director, directorIndex) => {
      if (director.reporteEstudiantes && Array.isArray(director.reporteEstudiantes)) {
        director.reporteEstudiantes.forEach((reporte) => {
          const idPregunta = String(reporte.id);
          if (!idPregunta) {
            /* console.log('⚠️ WARNING: Pregunta sin ID encontrada:', reporte) */
            return;
          }

          // Detectar si la alternativa 'd' existe en esta pregunta
          let tieneD = typeof reporte.d === 'number';

          if (!acumuladoPorPregunta[idPregunta]) {
            acumuladoPorPregunta[idPregunta] = tieneD
              ? { id: idPregunta, a: 0, b: 0, c: 0, d: 0, total: 0 }
              : { id: idPregunta, a: 0, b: 0, c: 0, total: 0 };
          }

          // Acumular valores
          acumuladoPorPregunta[idPregunta].a += reporte.a || 0;
          acumuladoPorPregunta[idPregunta].b += reporte.b || 0;
          acumuladoPorPregunta[idPregunta].c += reporte.c || 0;
          if (tieneD) {
            acumuladoPorPregunta[idPregunta].d! += reporte.d || 0;
          }
        });
      }
    });

    // Calcular totales
    Object.values(acumuladoPorPregunta).forEach((obj) => {
      obj.total = obj.a + obj.b + obj.c + (typeof obj.d === 'number' ? obj.d : 0);
    });

    const resultado = Object.values(acumuladoPorPregunta);

    // Validación final
    if (directoresValidos.length > 0 && parseInt(cantidadMasComun) === resultado.length) {
      /*  console.log('✅ ÉXITO: Las longitudes coinciden correctamente') */
      console.log('probando si es la logica rorrecta', resultado);
    } else if (directoresValidos.length === 0) {
      console.warn('⚠️ ADVERTENCIA: No hay directores válidos para procesar');
    } else {
      console.warn(
        '⚠️ ADVERTENCIA: Aún hay inconsistencia en las longitudes, puede haber preguntas duplicadas o faltantes'
      );
    }

    /* dispatch({ type: AppAction.REPORTE_DIRECTOR, payload: resultado });
    return resultado; */
  };

  const getAllDirectores = async (idEvaluacion: string, month: number) => {
    try {
      console.log('month', month);
      /*  const q = query(collection(db, "usuarios"), where("dniDirector", "==", `${currentUserData.dni}`)); */
      const q = query(collection(db, 'usuarios'), where('rol', '==', 2));

      const querySnapshot = await getDocs(q);

      const docentesDelDirector: string[] = [];
      querySnapshot.forEach((doc) => {
        docentesDelDirector.push(doc.id); //aqui se van agregar los 1500 directores pero solo los id
      });
      // Convertimos el forEach en un array de promesas
      const promesasEvaluaciones = docentesDelDirector.map(async (docente) => {
        const pathRefEstudiantes = collection(
          db,
          `/usuarios/${docente}/${idEvaluacion}/${currentYear}/${month}`
        );
        const snapshot = await getDocs(pathRefEstudiantes);
        const evaluacionesDocente: UserEstudiante[] = [];

        snapshot.forEach((doc) => {
          evaluacionesDocente.push(doc.data() as UserEstudiante);
        });

        return evaluacionesDocente;
      });

      // Esperamos a que todas las promesas se resuelvan
      const resultadosEvaluaciones = await Promise.all(promesasEvaluaciones);

      // Aplanamos el array de arrays en un solo array
      const todasLasEvaluaciones = resultadosEvaluaciones.flat();
      console.log('todasLasEvaluaciones', todasLasEvaluaciones);

      return todasLasEvaluaciones;
    } catch (error) {
      console.error('Error en reporteDirectorEstudiantes:', error);
      throw error;
    }
  };

  const generarReporteAllDirectores = async (
    idEvaluacion: string,
    month: number,
    currentUserData: User
  ) => {
    const directores = await getAllDirectores(idEvaluacion, month);

    const acumuladoPorPregunta: Record<
      string,
      { id: string; a: number; b: number; c: number; d?: number; total: number }
    > = {};
    console.log('estudiantes', directores.length);
    /* directores.forEach(estudiante => {
      if (estudiante.respuestas && Array.isArray(estudiante.respuestas)) {
        estudiante.respuestas.forEach(respuesta => {
          const idPregunta = String(respuesta.id)
          if (!idPregunta) return
          // Detectar si la alternativa 'd' existe en esta pregunta
          let tieneD = false
          if (respuesta.alternativas && Array.isArray(respuesta.alternativas)) {
            tieneD = respuesta.alternativas.some(alt => alt.alternativa === 'd')
          }
          if (!acumuladoPorPregunta[idPregunta]) {
            acumuladoPorPregunta[idPregunta] = tieneD
              ? { id: idPregunta, a: 0, b: 0, c: 0, d: 0, total: 0 }
              : { id: idPregunta, a: 0, b: 0, c: 0, total: 0 }
          }
          if (respuesta.alternativas && Array.isArray(respuesta.alternativas)) {
            respuesta.alternativas.forEach(alternativa => {
              if (alternativa.selected) {
                switch (alternativa.alternativa) {
                  case 'a':
                    acumuladoPorPregunta[idPregunta].a += 1
                    break
                  case 'b':
                    acumuladoPorPregunta[idPregunta].b += 1
                    break
                  case 'c':
                    acumuladoPorPregunta[idPregunta].c += 1
                    break
                  case 'd':
                    if (typeof acumuladoPorPregunta[idPregunta].d === 'number') {
                      acumuladoPorPregunta[idPregunta].d! += 1
                    }
                    break
                  default:
                    break
                }
              }
            })
          }
        })
      }
    })
    Object.values(acumuladoPorPregunta).forEach(obj => {
      obj.total = obj.a + obj.b + obj.c + (typeof obj.d === 'number' ? obj.d : 0)
    })
    const resultado = Object.values(acumuladoPorPregunta)
    console.log('acumulado por pregunta', resultado)
   


    //enviaremos el valor de resultado a la base de datos de los directores
    //collection    /    documento     /    subcollection  /    documento  /    subcollection  /    documento
    //evaluaciones  /id de la evaluacion/    año y mes     / todos los directores

    console.log('currentUserData', currentUserData)
    const myDirector = await getDoc(doc(db, `usuarios`, `${currentUserData.dni}`))
    myDirector.exists() && await setDoc(doc(db, `evaluaciones/${idEvaluacion}/${currentYear}-${month}`, `${currentUserData.dni}`), {
      ...myDirector.data(),
      reporteEstudiantes: resultado
    }) */

    /* return resultado */
  };

  const getReporteEspecialistaPorUgel = async (idEvaluacion: string, month: number, yearSelected: number) => {
    try {
      if (currentUserData.region) {
        const pathRef = collection(db, `/evaluaciones/${idEvaluacion}/${yearSelected}-${month}/`);
        /* const pathRef = collection(db, `/evaluaciones/${idEvaluacion}/${2025}-${10}/`); */
        const q = query(pathRef, where('region', '==', currentUserData.region));
        const querySnapshot = await getDocs(q);
        const directoresUgel: User[] = [];
        querySnapshot.forEach((doc) => {
          directoresUgel.push(doc.data() as User);
        });
        console.log('directoresUgel', directoresUgel);
        const estadisticas = calcularEstadisticasOptimizadas(directoresUgel);
        console.log('estadisticas', estadisticas);
        return directoresUgel;
      }
    } catch (error) {
      console.error('Error en getReporteEspecialistaPorUgel:', error);
      throw error;
    }
  };
  return {
    getAllDirectores,
    getReporteEspecialistaPorUgel,
    generarReporteAllDirectores,
    getAllReporteDeDirectores,
    reporteParaTablaDeEspecialista,
    reporteEspecialistaDeEstudiantes,
    getAllReporteDeDirectoresToDocentes,
    reporteEspecialistaDeDocente,
    reporteFiltrosEspecialistaDirectores,
    getDataParaGraficoTendencia,
    getEstadisticaGlobal,
    getAllReporteDeDirectoreToAdmin,
    getDataGraficoPieChart,
    restablecerFiltrosDeEspecialista,
  };
};
