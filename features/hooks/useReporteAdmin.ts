import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { collection, doc, getDoc, getDocs, updateDoc, onSnapshot, query, where, documentId } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { toast } from 'react-toastify';
import { db, functions } from '@/firebase/firebase.config';
import { useGlobalContext, useGlobalContextDispatch } from '@/features/context/GlolbalContext';
import { AppAction } from '@/features/actions/appAction';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { useCrearEstudiantesDeDocente } from '@/features/hooks/useCrearEstudiantesDeDocente';
import { useExportExcel } from '@/features/hooks/useExportExcel';
import { useCrearPuntajeProgresiva } from '@/features/hooks/useCrearPuntajeProgresiva';
import { useReporteEspecialistas } from '@/features/hooks/useReporteEspecialistas';
import { distritosPuno } from '@/fuctions/provinciasPuno';
import { currentMonth } from '@/fuctions/dates';
import { PreguntasRespuestas } from '@/features/types/types';
import { exportDirectorDocenteDataToExcel } from '@/features/utils/excelExport';

export const useReporteAdmin = () => {
  const route = useRouter();
  const dispatch = useGlobalContextDispatch();
  const {
    currentUserData,
    preguntasRespuestas,
    allEvaluacionesDirectorDocente,
    evaluacion,
    dataGraficoTendenciaNiveles,
    dataGraficoUgelStacked,
    loaderDataGraficoUgelStacked,
    dataGraficoPieChart,
  } = useGlobalContext();

  // --- SUB-HOOKS INICIALIZACIÓN ---
  const { getPreguntasRespuestas, getEvaluacion } = useAgregarEvaluaciones();
  const {
    loading: loadingCrearEstudiantes,
    ejecutarCrearEstudiantes,
    limpiarEstado: limpiarEstadoCrearEstudiantes,
    obtenerMensajeResumen,
  } = useCrearEstudiantesDeDocente();
  
  const { exportEstudiantesToExcel, exportEstudiantesParaExcelFronted } = useExportExcel();
  
  const {
    loading: loadingCrearPuntajeProgresiva,
    ejecutarCrearPuntajeProgresiva,
    limpiarEstado: limpiarEstadoCrearPuntajeProgresiva,
    obtenerMensajeResumen: obtenerMensajeResumenPuntajeProgresiva,
  } = useCrearPuntajeProgresiva();

  const {
    reporteParaTablaDeEspecialista,
    getEstadisticaGlobal,
    getDataGraficoPieChart,
    getReporteEspecialistaPorUgel,
    getDataGraficoUgelStacked,
    getAllReporteDeDirectoreToAdmin,
  } = useReporteEspecialistas();

  // --- ESTADOS LOCALES ---
  const [filtros, setFiltros] = useState({
    region: '',
    distrito: '',
    genero: '',
    area: '',
  });

  const [distritosDisponibles, setDistritosDisponibles] = useState<string[]>([]);
  const [rangoMes, setRangoMes] = useState<number[]>([]);
  const [dataDirectoresBar, setDataDirectoresBar] = useState<any[]>([]);
  const [loadingDirectoresBar, setLoadingDirectoresBar] = useState(false);
  const [chartColumns, setChartColumns] = useState(2);
  const [questionColumns, setQuestionColumns] = useState(2);
  const [dataReportePreguntas, setDataReportePreguntas] = useState<any[]>([]);
  const [loadingReportePreguntas, setLoadingReportePreguntas] = useState(false);

  // Drill-down para docentes
  const [fullDocentesData, setFullDocentesData] = useState<any[] | null>(null);
  const [selectedRange, setSelectedRange] = useState<string | null>(null);
  const [selectedDirectorStatus, setSelectedDirectorStatus] = useState<'participo' | 'no_participo' | 'all' | null>(null);
  const [searchTermDirector, setSearchTermDirector] = useState('');
  const [selectedRegionDirector, setSelectedRegionDirector] = useState<string>('all');
  const [pageSizeDirector, setPageSizeDirector] = useState<number | 'all'>(100);
  const [consolidationStatus, setConsolidationStatus] = useState<any>(null);
  const [loadingConsolidado, setLoadingConsolidado] = useState(false);
  const [loadingProfesoresBuckets, setLoadingProfesoresBuckets] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);

  const [monthSelected, setMonthSelected] = useState(currentMonth);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2025 + 1 }, (_, i) => 2025 + i);
  const [yearSelected, setYearSelected] = useState(currentYear);
  const [syncedId, setSyncedId] = useState<string | null>(null);

  const drillDownRef = useRef<HTMLDivElement>(null);
  const directorsDetailRef = useRef<HTMLDivElement>(null);

  // --- SINCRONIZACIÓN DE DISTRITOS SEGÚN LA REGION ---
  useEffect(() => {
    if (filtros.region) {
      const provinciaEncontrada = distritosPuno.find((p) => p.id === Number(filtros.region));
      setDistritosDisponibles(provinciaEncontrada ? provinciaEncontrada.distritos : []);
    } else {
      setDistritosDisponibles([]);
    }
  }, [filtros.region]);

  const handleChangeFiltros = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltros(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // --- SINCRONIZACIÓN INICIAL CON EL MES Y AÑO DEL EXAMEN ---
  useEffect(() => {
    const currentId = route.query.idEvaluacion as string;
    if (evaluacion && evaluacion.id === currentId && syncedId !== currentId) {
      let synced = false;
      if (evaluacion.mesDelExamen) {
        const mesId = Number(evaluacion.mesDelExamen);
        if (!isNaN(mesId)) {
          setMonthSelected(mesId);
          synced = true;
        }
      }
      if (evaluacion.añoDelExamen) {
        const anioId = Number(evaluacion.añoDelExamen);
        if (!isNaN(anioId)) {
          setYearSelected(anioId);
          synced = true;
        }
      }
      if (synced) {
        setSyncedId(currentId);
      }
    }
  }, [evaluacion, route.query.idEvaluacion, syncedId]);

  // --- OBTENER PREGUNTAS Y DETALLES INICIALES ---
  useEffect(() => {
    if (route.query.idEvaluacion) {
      getPreguntasRespuestas(`${route.query.idEvaluacion}`);
      getEvaluacion(`${route.query.idEvaluacion}`);
    }
  }, [currentUserData?.dni, route.query.idEvaluacion]);

  // --- LISTENER DEL ESTADO DE CONSOLIDACIÓN ---
  useEffect(() => {
    const idEval = route.query.idEvaluacion;
    if (!idEval || monthSelected === undefined || !yearSelected) return;

    const statusRef = doc(db, `evaluaciones/${idEval}/estado_consolidacion`, `${yearSelected}_${monthSelected}`);
    
    const unsubscribe = onSnapshot(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setConsolidationStatus(data);
        
        if (data.status === 'completed') {
           setTimeout(() => {
             loadConsolidado();
             fetchBarGraphicsData();
             fetchReportePreguntas();
             getReporteEspecialistaPorUgel(String(idEval), monthSelected, yearSelected);
           }, 1000);
        }
      } else {
        setConsolidationStatus(null);
      }
    });

    return () => unsubscribe();
  }, [route.query.idEvaluacion, monthSelected, yearSelected]);

  // --- CARGA DE REPORTES POR UGEL ---
  useEffect(() => {
    if (route.query.idEvaluacion) {
      getReporteEspecialistaPorUgel(`${route.query.idEvaluacion}`, monthSelected, yearSelected);
    }
  }, [`${route.query.idEvaluacion}`, monthSelected, currentUserData?.region, yearSelected]);

  // --- MANEJADORES DE ACCIÓN ---
  const handleChangeYear = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYearSelected(Number(e.target.value));
  };

  const handleRangoChange = (mesInicio: number, mesFin: number, año: number, mesesIds: number[]) => {
    setRangoMes(mesesIds);
  };

  const handleFiltrar = () => {
    reporteParaTablaDeEspecialista(
      allEvaluacionesDirectorDocente,
      {
        region: filtros.region,
        area: filtros.area,
        genero: filtros.genero,
        distrito: filtros.distrito,
      },
      monthSelected,
      `${route.query.idEvaluacion}`,
      yearSelected
    );
  };

  useEffect(() => {
    if (route.query.idEvaluacion && allEvaluacionesDirectorDocente.length > 0) {
      handleFiltrar();
    }
  }, [filtros, monthSelected, yearSelected, allEvaluacionesDirectorDocente.length]);

  useEffect(() => {
    if (route.query.idEvaluacion && evaluacion?.nivelYPuntaje) {
      getDataGraficoPieChart(
        `${route.query.idEvaluacion}`,
        monthSelected,
        evaluacion,
        undefined,
        filtros.region || undefined,
        yearSelected
      );
      getDataGraficoUgelStacked(
        `${route.query.idEvaluacion}`,
        monthSelected,
        evaluacion,
        yearSelected
      );
      getEstadisticaGlobal(`${route.query.idEvaluacion}`, monthSelected, yearSelected);
    }
  }, [route.query.id, route.query.idEvaluacion, currentUserData?.dni, monthSelected, filtros.region, yearSelected, evaluacion]);

  // --- CARGA DE REPORTES PRINCIPALES ---
  const fetchBarGraphicsData = async () => {
    const idEval = route.query.idEvaluacion;
    if (!idEval || monthSelected === undefined || !yearSelected) return;
    setLoadingDirectoresBar(true);
    try {
      const isRealtime = (evaluacion as any)?.realtimeEnabled === true;
      if (isRealtime) {
        const collRef = collection(db, `evaluaciones/${idEval}/consolidados_realtime_directores`);
        const snap = await getDocs(collRef);
        
        if (snap.empty) {
          setDataDirectoresBar([]);
          return;
        }

        const activeDirectors = snap.docs.map(doc => ({
          dniDirector: doc.id,
          ...doc.data()
        }));

        const missingProfileDirectors = activeDirectors.filter((d: any) => !d.nombres || !d.apellidos || !d.institucion);
        const missingDirectorIds = missingProfileDirectors.map(d => d.dniDirector);

        const directorDetails = new Map<string, any>();
        
        if (missingDirectorIds.length > 0) {
          const batches = [];
          for (let i = 0; i < missingDirectorIds.length; i += 30) {
            batches.push(missingDirectorIds.slice(i, i + 30));
          }

          const promesasDirectores = batches.map(async (chunk) => {
            const q = query(collection(db, 'usuarios'), where(documentId(), 'in', chunk));
            const snapDocentes = await getDocs(q);
            snapDocentes.forEach(d => {
              directorDetails.set(d.id, d.data());
            });
          });

          await Promise.all(promesasDirectores);
        }

        const nivelesConfig = evaluacion?.nivelYPuntaje || [];

        const formattedDirectors = activeDirectors.map((director: any) => {
          const detail = directorDetails.get(director.dniDirector) || {};
          
          const mappedNiveles = nivelesConfig.map((n: any) => {
            const nivelNombre = n.nivel || 'Sin Nombre';
            let cantidad = 0;
            if (director.niveles && typeof director.niveles === 'object' && director.niveles[nivelNombre] !== undefined) {
              cantidad = director.niveles[nivelNombre];
            } else if (director[`niveles.${nivelNombre}`] !== undefined) {
              cantidad = director[`niveles.${nivelNombre}`];
            }
            return {
              id: n.id,
              nivel: nivelNombre,
              cantidadDeEstudiantes: cantidad
            };
          });

          const totalEstudiantes = director.totalEstudiantes || 0;
          const sumaPuntajes = director.sumaPuntajes || 0;
          const promedioGlobal = totalEstudiantes > 0 ? Math.round((sumaPuntajes / totalEstudiantes) * 100) / 100 : 0;

          return {
            dniDirector: director.dniDirector,
            nombres: director.nombres || detail.nombres || 'Director',
            apellidos: director.apellidos || detail.apellidos || 'N/A',
            institucion: director.institucion || detail.institucion || 'N/A',
            region: director.region || detail.region || 'N/A',
            totalEstudiantes,
            promedioGlobal,
            niveles: mappedNiveles
          };
        });

        formattedDirectors.sort((a, b) => b.promedioGlobal - a.promedioGlobal);
        setDataDirectoresBar(formattedDirectors);
        return;
      }

      const consolidadoRef = doc(db, `evaluaciones/${idEval}/consolidados`, `directores_${yearSelected}_${monthSelected}`);
      const consolidadoSnap = await getDoc(consolidadoRef);

      if (consolidadoSnap.exists()) {
        const { url } = consolidadoSnap.data();
        if (url) {
          const cacheBuster = `?t=${Date.now()}`;
          const response = await fetch(url + cacheBuster);
          const res = await response.json();
          if (res.success && Array.isArray(res.data)) {
            setDataDirectoresBar(res.data);
            return;
          }
        }
      }
      setDataDirectoresBar([]);
    } catch (error) {
      console.error('❌ Error al cargar directores:', error);
      setDataDirectoresBar([]);
    } finally {
      setLoadingDirectoresBar(false);
    }
  };

  const loadConsolidado = async () => {
    const idEval = route.query.idEvaluacion;
    if (!idEval || monthSelected === undefined || !yearSelected) return;

    setLoadingProfesoresBuckets(true);
    try {
      const isRealtime = (evaluacion as any)?.realtimeEnabled === true;
      if (isRealtime) {
        const collRef = collection(db, `evaluaciones/${idEval}/consolidados_realtime_profesores`);
        const snap = await getDocs(collRef);
        
        if (snap.empty) {
          setFullDocentesData([]);
          return;
        }

        const activeTeachers = snap.docs.map(doc => ({
          dniDocente: doc.id,
          ...doc.data()
        }));

        const missingProfileTeachers = activeTeachers.filter((t: any) => !t.nombres || !t.apellidos || !t.institucion);
        const missingTeacherIds = missingProfileTeachers.map(t => t.dniDocente);

        const teacherDetails = new Map<string, any>();
        
        if (missingTeacherIds.length > 0) {
          const batches = [];
          for (let i = 0; i < missingTeacherIds.length; i += 30) {
            batches.push(missingTeacherIds.slice(i, i + 30));
          }

          const promesasDocentes = batches.map(async (chunk) => {
            const q = query(collection(db, 'usuarios'), where(documentId(), 'in', chunk));
            const snapDocentes = await getDocs(q);
            snapDocentes.forEach(d => {
              teacherDetails.set(d.id, d.data());
            });
          });

          await Promise.all(promesasDocentes);
        }

        const nivelesConfig = evaluacion?.nivelYPuntaje || [];

        const formattedTeachers = activeTeachers.map((teacher: any) => {
          const detail = teacherDetails.get(teacher.dniDocente) || {};
          
          const mappedNiveles = nivelesConfig.map((n: any) => {
            const nivelNombre = n.nivel || 'Sin Nombre';
            let cantidad = 0;
            if (teacher.niveles && typeof teacher.niveles === 'object' && teacher.niveles[nivelNombre] !== undefined) {
              cantidad = teacher.niveles[nivelNombre];
            } else if (teacher[`niveles.${nivelNombre}`] !== undefined) {
              cantidad = teacher[`niveles.${nivelNombre}`];
            }
            return {
              id: n.id,
              nivel: nivelNombre,
              cantidadDeEstudiantes: cantidad
            };
          });

          const totalEstudiantes = teacher.totalEstudiantes || 0;
          const sumaPuntajes = teacher.sumaPuntajes || 0;
          const promedioGlobal = totalEstudiantes > 0 ? Math.round((sumaPuntajes / totalEstudiantes) * 100) / 100 : 0;

          const satNivel = mappedNiveles.find((n: any) => n.nivel?.toLowerCase().includes('satisfactorio'));
          const satCount = satNivel ? satNivel.cantidadDeEstudiantes : 0;
          const porcentajeSatisfactorio = totalEstudiantes > 0 ? Math.round((satCount / totalEstudiantes) * 100) : 0;

          return {
            dniDocente: teacher.dniDocente,
            nombres: teacher.nombres || detail.nombres || 'Docente',
            apellidos: teacher.apellidos || detail.apellidos || 'N/A',
            institucion: teacher.institucion || detail.institucion || 'N/A',
            region: teacher.region || detail.region || 'N/A',
            totalEstudiantes,
            promedioGlobal,
            porcentajeSatisfactorio,
            niveles: mappedNiveles,
            participo: true
          };
        });

        formattedTeachers.sort((a, b) => b.promedioGlobal - a.promedioGlobal);
        setFullDocentesData(formattedTeachers);
        return;
      }

      const consolidadoRef = doc(db, `evaluaciones/${idEval}/consolidados`, `profesores_${yearSelected}_${monthSelected}`);
      const consolidadoSnap = await getDoc(consolidadoRef);

      if (consolidadoSnap.exists()) {
        const { url } = consolidadoSnap.data();
        if (url) {
          const cacheBuster = `?t=${Date.now()}`;
          const response = await fetch(url + cacheBuster);
          const res = await response.json();
          if (res.success && Array.isArray(res.data)) {
            setFullDocentesData(res.data);
            return;
          }
        }
      }
      setFullDocentesData(null);
    } catch (error) {
      console.error('❌ Error al cargar docentes:', error);
    } finally {
      setLoadingProfesoresBuckets(false);
    }
  };

  const fetchReportePreguntas = async (filtrosOverride?: typeof filtros) => {
    const idEval = route.query.idEvaluacion;
    if (!idEval || monthSelected === undefined || !yearSelected) return;
    setLoadingReportePreguntas(true);

    const isRealtime = (evaluacion as any)?.realtimeEnabled === true;
    const currentFiltros = filtrosOverride || filtros;

    try {
      if (isRealtime && preguntasRespuestas && preguntasRespuestas.length > 0) {
        const promesasPreguntas = preguntasRespuestas.map(async (pregunta) => {
          const qId = pregunta.id;
          
          let shardsRef;
          if (currentFiltros.region && currentFiltros.region !== 'all' && currentFiltros.region !== '' &&
              currentFiltros.distrito && currentFiltros.distrito !== 'all' && currentFiltros.distrito !== '') {
            shardsRef = collection(
              db,
              `evaluaciones/${idEval}/consolidados_realtime/preguntas_${yearSelected}_${monthSelected}/items/${qId}/regiones/${currentFiltros.region}/distritos/${currentFiltros.distrito}/shards`
            );
          } else if (currentFiltros.region && currentFiltros.region !== 'all' && currentFiltros.region !== '') {
            shardsRef = collection(
              db,
              `evaluaciones/${idEval}/consolidados_realtime/preguntas_${yearSelected}_${monthSelected}/items/${qId}/regiones/${currentFiltros.region}/shards`
            );
          } else {
            shardsRef = collection(
              db,
              `evaluaciones/${idEval}/consolidados_realtime/preguntas_${yearSelected}_${monthSelected}/items/${qId}/shards`
            );
          }
          
          const shardsSnap = await getDocs(shardsRef);
          let total = 0;
          const alternativasAcum: Record<string, number> = {};

          if (Array.isArray(pregunta.alternativas)) {
            pregunta.alternativas.forEach((alt) => {
              const altId = String(alt.alternativa || (alt as any).id || '').toUpperCase();
              if (altId) alternativasAcum[altId] = 0;
            });
          }

          shardsSnap.forEach((doc) => {
            const shardData = doc.data();
            for (const [key, val] of Object.entries(shardData)) {
              if (key === 'total') {
                total += val as number;
              } else {
                const uKey = key.toUpperCase();
                alternativasAcum[uKey] = (alternativasAcum[uKey] || 0) + (val as number);
              }
            }
          });

          return {
            id: qId,
            total,
            ...alternativasAcum,
            alternativas: Array.isArray(pregunta.alternativas)
              ? pregunta.alternativas.map((alt) => {
                  const altId = String(alt.alternativa || (alt as any).id || '').toUpperCase();
                  return {
                    id: altId,
                    cantidad: alternativasAcum[altId] || 0,
                    esCorrecta: altId === String(pregunta.respuesta || '').toUpperCase(),
                    descripcion: alt.descripcion || '',
                  };
                })
              : [],
          };
        });

        const resultadoPreguntas = await Promise.all(promesasPreguntas);
        setDataReportePreguntas(resultadoPreguntas);
        return;
      }

      const consolidadoRef = doc(db, `evaluaciones/${idEval}/consolidados`, `preguntas_${yearSelected}_${monthSelected}`);
      const consolidadoSnap = await getDoc(consolidadoRef);

      if (consolidadoSnap.exists()) {
        const { url } = consolidadoSnap.data();
        if (url) {
          const cacheBuster = `?t=${Date.now()}`;
          const response = await fetch(url + cacheBuster);
          const res = await response.json();
          if (res.success && Array.isArray(res.data)) {
            setDataReportePreguntas(res.data);
            return;
          }
        }
      }
      setDataReportePreguntas([]);
    } catch (error) {
      console.error('❌ Error al cargar preguntas:', error);
      setDataReportePreguntas([]);
    } finally {
      setLoadingReportePreguntas(false);
    }
  };

  // --- CARGA INICIAL DE DATOS AL CAMBIAR PERIODO ---
  useEffect(() => {
    const idEval = route.query.idEvaluacion;
    if (!idEval || monthSelected === undefined || !yearSelected) return;

    const loadAllConsolidados = async () => {
      await Promise.all([
        loadConsolidado(),
        fetchBarGraphicsData(),
        fetchReportePreguntas()
      ]);
    };

    loadAllConsolidados();
  }, [route.query.idEvaluacion, monthSelected, yearSelected, preguntasRespuestas, evaluacion]);

  // --- MANEJADORES DE UI ---
  const handleBarClick = (range: string) => {
    setSelectedRange(range);
    setTimeout(() => {
      drillDownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleDirectorSegmentClick = (status: 'participo' | 'no_participo' | 'all') => {
    setSelectedDirectorStatus(status);
    setTimeout(() => {
      directorsDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleRestablecerFiltros = () => {
    const defaultFiltros = {
      region: '',
      distrito: '',
      genero: '',
      area: '',
    };
    setFiltros(defaultFiltros);
    const isRealtime = (evaluacion as any)?.realtimeEnabled === true;
    if (isRealtime) {
      fetchReportePreguntas(defaultFiltros);
    }
  };

  const handleSaveMeta = async (newMeta: number) => {
    const idEval = route.query.idEvaluacion;
    if (!idEval) return;

    try {
      const evalRef = doc(db, 'evaluaciones', String(idEval));
      await updateDoc(evalRef, {
        metaSatisfactorio: newMeta
      });

      dispatch({
        type: AppAction.EVALUACION,
        payload: {
          ...evaluacion,
          metaSatisfactorio: newMeta
        }
      });
      toast.success('✅ Meta global actualizada exitosamente.');
    } catch (error) {
      console.error('❌ Error al guardar meta global:', error);
      toast.error('❌ Error al guardar la meta global.');
    }
  };

  const handleFiltrarPreguntas = async () => {
    const isRealtime = (evaluacion as any)?.realtimeEnabled === true;
    if (isRealtime) {
      await fetchReportePreguntas();
      toast.success('✅ Reporte de preguntas filtrado en tiempo real.');
      return;
    }

    const idEval = route.query.idEvaluacion;
    if (!idEval || monthSelected === undefined || !yearSelected) return;

    setLoadingReportePreguntas(true);
    try {
      const callPreguntas = httpsCallable(functions, 'getDataReporteEvaluacionPorPreguntas', { timeout: 540000 });
      const result = await callPreguntas({
        idEvaluacion: idEval,
        año: yearSelected,
        mes: monthSelected,
        region: filtros.region
      });
      const resData = (result.data as any);
      if (resData.success && Array.isArray(resData.data)) {
        setDataReportePreguntas(resData.data);
        toast.success('✅ Reporte de preguntas procesado.');
      } else {
        toast.warn('⚠️ No se obtuvieron datos para las preguntas.');
      }
    } catch (error) {
      console.error('❌ Error en Cloud Function preguntas:', error);
      toast.error('❌ Error al procesar reporte de preguntas.');
    } finally {
      setLoadingReportePreguntas(false);
    }
  };

  const handleGenerarConsolidado = async () => {
    const idEval = route.query.idEvaluacion;
    if (!idEval || monthSelected === undefined || !yearSelected) return;

    const isProcessing = consolidationStatus?.status === 'processing';
    
    const message = isProcessing
      ? `⚠️ El proceso parece haberse detenido en ${consolidationStatus?.progress || 0}%. ¿Deseas FORZAR el reinicio de la consolidación?`
      : '🚀 ¿Deseas generar la consolidación completa de datos en SEGUNDO PLANO?\n\n' +
        'Esto se ejecutará en el servidor. Podrás cerrar la pestaña y el proceso continuará.';

    const confirmacion = window.confirm(message);
    if (!confirmacion) return;

    setLoadingConsolidado(true);
    try {
      const callOrchestrator = httpsCallable(functions, 'startFullConsolidation', { timeout: 540000 });
      toast.info('⏳ Iniciando proceso en segundo plano...');
      
      callOrchestrator({
        idEvaluacion: idEval,
        año: yearSelected,
        mes: monthSelected
      }).catch(err => {
        console.error("Error al iniciar orquestador:", err);
      });

      toast.success(isProcessing ? '🚀 Reinicio forzado enviado.' : '🚀 Proceso delegado al servidor.');
    } catch (error: any) {
      console.error('❌ Error al invocar orquestador:', error);
      toast.error(`Error: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoadingConsolidado(false);
    }
  };

  const handleDetenerConsolidado = async () => {
    const idEval = route.query.idEvaluacion;
    if (!idEval || monthSelected === undefined || !yearSelected) return;

    const confirmed = window.confirm('🛑 ¿Deseas DETENER el proceso de consolidación?');
    if (!confirmed) return;

    try {
      const statusRef = doc(db, `evaluaciones/${idEval}/estado_consolidacion`, `${yearSelected}_${monthSelected}`);
      await updateDoc(statusRef, { 
        status: 'stopped',
        message: 'Proceso detenido por el usuario.',
        endTime: new Date()
      });
      toast.info('🛑 Petición de parada enviada.');
    } catch (error: any) {
      console.error('Error stopping:', error);
      toast.error('Error al detener el proceso.');
    }
  };

  // --- MEMOS CALCULADOS ---
  const filteredDocentesByRange = useMemo(() => {
    if (!fullDocentesData || !selectedRange) return [];

    const match = selectedRange.match(/(\d+)-(\d+)%/);
    if (!match) return [];

    const min = parseFloat(match[1]);
    const max = parseFloat(match[2]);

    return fullDocentesData.filter((doc: any) => {
      const satNivel = doc.niveles?.find((n: any) => n.nivel?.toLowerCase().includes('satisfactorio'));
      const satCount = satNivel ? satNivel.cantidadDeEstudiantes : 0;
      const totalEst = doc.totalEstudiantes || 0;
      const percentage = totalEst > 0 ? (satCount / totalEst) * 100 : 0;

      return percentage >= min && percentage <= max;
    });
  }, [fullDocentesData, selectedRange]);

  const computedDocentesBuckets = useMemo(() => {
    if (!fullDocentesData || fullDocentesData.length === 0) return [];
    
    const ranges = [
      { label: '0-20%', min: 0, max: 20, color: '#ef4444' },
      { label: '20-40%', min: 20, max: 40, color: '#f97316' },
      { label: '40-60%', min: 40, max: 60, color: '#eab308' },
      { label: '60-80%', min: 60, max: 80, color: '#84cc16' },
      { label: '80-100%', min: 80, max: 101, color: '#22c55e' },
    ];

    const counts = ranges.map(r => ({ rango: r.label, cantidad: 0, color: r.color }));

    fullDocentesData.forEach(doc => {
      const satNivel = doc.niveles?.find((n: any) => n.nivel?.toLowerCase().includes('satisfactorio'));
      const satCount = satNivel ? satNivel.cantidadDeEstudiantes : 0;
      const totalEst = doc.totalEstudiantes || 0;
      const percentage = totalEst > 0 ? (satCount / totalEst) * 100 : 0;

      const rangeIdx = ranges.findIndex(r => percentage >= r.min && percentage < r.max);
      if (rangeIdx !== -1) {
        counts[rangeIdx].cantidad++;
      }
    });

    return counts;
  }, [fullDocentesData]);

  const filteredDirectoresByStatus = useMemo(() => {
    if (!dataDirectoresBar) return [];
    
    let filtered = dataDirectoresBar;
    
    if (selectedDirectorStatus && selectedDirectorStatus !== 'all') {
      filtered = dataDirectoresBar.filter(d => {
        const isParticipante = !!d.participo || (d.totalEstudiantes > 0);
        return selectedDirectorStatus === 'participo' ? isParticipante : !isParticipante;
      });
    }

    if (selectedRegionDirector !== 'all') {
      filtered = filtered.filter(d => String(d.region) === selectedRegionDirector);
    }

    if (!searchTermDirector.trim()) return filtered;

    const term = searchTermDirector.toLowerCase().trim();
    return filtered.filter(d => 
      d.dniDirector?.toLowerCase().includes(term) ||
      d.nombres?.toLowerCase().includes(term) ||
      d.apellidos?.toLowerCase().includes(term) ||
      d.institucion?.toLowerCase().includes(term)
    );
  }, [dataDirectoresBar, selectedDirectorStatus, searchTermDirector, selectedRegionDirector]);

  const directoresStats = useMemo(() => {
    if (!dataDirectoresBar) return { participo: 0, no_participo: 0, total: 0 };
    
    const baseList = selectedRegionDirector === 'all' 
      ? dataDirectoresBar 
      : dataDirectoresBar.filter(d => String(d.region) === selectedRegionDirector);

    const participoCount = baseList.filter(d => !!d.participo || (d.totalEstudiantes > 0)).length;
    
    return {
      participo: participoCount,
      no_participo: baseList.length - participoCount,
      total: baseList.length
    };
  }, [dataDirectoresBar, selectedRegionDirector]);

  const hasPieChartData = useMemo(() => {
    const sourceData = (Array.isArray(dataGraficoPieChart) && dataGraficoPieChart.length > 0) 
      ? dataGraficoPieChart 
      : dataGraficoTendenciaNiveles;

    if (!sourceData || !Array.isArray(sourceData)) return false;
    
    const datosMes = sourceData.find((item: any) => item.mes === monthSelected);
    if (!datosMes || !datosMes.niveles) return false;

    const total = datosMes.niveles.reduce((acc: number, n: any) => acc + (n.cantidadDeEstudiantes || 0), 0);
    return total > 0;
  }, [dataGraficoPieChart, dataGraficoTendenciaNiveles, monthSelected]);

  // --- EXPORTAR EXCEL ---
  const handleExportEstudiantesToExcel = async () => {
    try {
      const rta = await exportEstudiantesToExcel(`${route.query.idEvaluacion}`, monthSelected, yearSelected);
      if (rta && typeof rta === 'string' && (rta.startsWith('http://') || rta.startsWith('https://'))) {
        window.open(rta, '_blank');
      }
      toast.success('✅ Estudiantes obtenidos exitosamente');
    } catch (error: any) {
      toast.error(`❌ Error al obtener estudiantes: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleExportEstudiantesToExcelFronted = async () => {
    try {
      await exportEstudiantesParaExcelFronted(`${route.query.idEvaluacion}`, monthSelected);
      toast.success('✅ Estudiantes exportados exitosamente');
    } catch (error: any) {
      toast.error(`❌ Error al exportar estudiantes: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleCrearEstudiantes = async () => {
    try {
      const confirmacion = window.confirm(
        '⚠️ ADVERTENCIA: Esta operación puede tomar hasta 9 minutos.\n\n' +
        '¿Estás seguro de que quieres continuar con la creación de estudiantes de docentes?\n\n' +
        'Esta acción procesará todos los docentes del sistema.'
      );
      if (!confirmacion) return;

      limpiarEstadoCrearEstudiantes();
      await ejecutarCrearEstudiantes(`${monthSelected}`, `${route.query.idEvaluacion}`);
      alert('✅ Estudiantes de docentes creados exitosamente!\n\n' + obtenerMensajeResumen());
    } catch (error: any) {
      alert(`❌ Error al crear estudiantes de docentes:\n${error.message || 'Error'}`);
    }
  };

  const handleCrearPuntajeProgresiva = async () => {
    try {
      const confirmacion = window.confirm(
        '⚠️ ADVERTENCIA: Esta operación puede tomar varios minutos.\n\n' +
        '¿Estás seguro de que quieres continuar con la generación de puntaje progresiva?\n\n' +
        'Esta acción procesará todos los estudiantes del sistema.'
      );
      if (!confirmacion) return;

      limpiarEstadoCrearPuntajeProgresiva();
      await ejecutarCrearPuntajeProgresiva(`${monthSelected}`, `${route.query.idEvaluacion}`, evaluacion, preguntasRespuestas);
      alert('✅ Puntaje progresiva generado exitosamente!\n\n' + obtenerMensajeResumenPuntajeProgresiva());
    } catch (error: any) {
      alert(`❌ Error al generar puntaje progresiva:\n${error.message || 'Error'}`);
    }
  };

  const handleExportToExcel = async () => {
    const confirmacion = window.confirm(
      '¿Deseas generar un archivo Excel con los datos de las evaluaciones?\n\n' +
      'Esta acción descargará un archivo con todos los datos disponibles.'
    );
    if (!confirmacion) return;

    setLoadingExport(true);
    try {
      const resultado = await getAllReporteDeDirectoreToAdmin(`${route.query.idEvaluacion}`, monthSelected, yearSelected);
      if (!resultado || resultado.length === 0) {
        alert('No hay datos disponibles para exportar');
        return;
      }
      const fileName = `evaluaciones_director_docente_${new Date().toISOString().split('T')[0]}.xlsx`;
      exportDirectorDocenteDataToExcel(resultado, fileName);
      alert('Archivo Excel exportado exitosamente');
    } catch (error) {
      alert('Error al exportar los datos. Por favor, inténtalo de nuevo.');
    } finally {
      setLoadingExport(false);
    }
  };

  return {
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
    setSelectedRange,
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
    handleFiltrar,
    handleRestablecerFiltros,
    handleBarClick,
    handleDirectorSegmentClick,
    handleSaveMeta,
    handleFiltrarPreguntas,
    handleGenerarConsolidado,
    handleDetenerConsolidado,
    handleExportEstudiantesToExcel,
    handleExportEstudiantesToExcelFronted,
    handleCrearEstudiantes,
    handleCrearPuntajeProgresiva,
    computedDocentesBuckets,
    filteredDocentesByRange,
    filteredDirectoresByStatus,
    directoresStats,
    hasPieChartData,
    drillDownRef,
    directorsDetailRef,
    loadingCrearEstudiantes,
    loadingCrearPuntajeProgresiva,
    loadingProfesoresBuckets,
    handleExportToExcel,
    loadConsolidado,
    fetchBarGraphicsData,
    fetchReportePreguntas,
  };
};
