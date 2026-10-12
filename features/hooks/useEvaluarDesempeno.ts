import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import useEvaluacionDesempenoBase, { RoleType } from '@/features/hooks/useEvaluacionDesempenoBase';
import { PRDocentes, User } from '@/features/types/types';
import { useEvidencias } from '@/features/hooks/evaluar-especialista/useEvidencias';
import { useRetroalimentacionDinamica } from '@/features/hooks/evaluar-especialista/useRetroalimentacionDinamica';
import { getUniquePhases } from '@/features/utils/phaseUtils';

const defaultEscala = [
  { value: 0, alternativa: '0', descripcion: 'No evidencia' },
  { value: 1, alternativa: '1', descripcion: 'En proceso' },
  { value: 2, alternativa: '2', descripcion: 'Logrado' },
];

export interface UseEvaluarDesempenoOptions {
  role: RoleType; // 'director' | 'especialista' | 'admin'
  collectionName: 'evaluaciones-docentes' | 'evaluaciones-director' | 'evaluaciones-especialista' | string;
  evaluadoRoleLabel?: string; // 'Docente' | 'Director' | 'Especialista'
  queryParamKeys?: string[]; // e.g. ['idDocente', 'dniDocente', 'dni']
}

export const useEvaluarDesempeno = ({
  role,
  collectionName,
  evaluadoRoleLabel = 'Evaluado',
  queryParamKeys = ['idDirector', 'dniDirector', 'idDocente', 'dniDocente', 'dni'],
}: UseEvaluarDesempenoOptions) => {
  const router = useRouter();
  const evaluacionId = router.query.id ? `${router.query.id}` : '';

  const {
    getPreguntaRespuestaDocentes,
    dimensionesEspecialistas,
    dataEvaluacionDocente,
    currentUserData,
    evaluadosEspecialista,
    warningDataDocente,
    loaderSalvarPregunta,
  } = useGlobalContext();

  const {
    getDataEvaluacion,
    getDimensiones,
    getPreguntasRespuestas,
    getEvaluados,
    getParrillaEvaluados,
    buscarUsuario,
    guardarEvaluacion,
    getHistorialEvaluado,
    getSessionData,
    uploadEvidencia,
    deleteEvidencia,
    updateConfiguracionCamposRetro,
  } = useEvaluacionDesempenoBase({
    role,
    collectionName,
  });

  const isAutoreporte = false;

  // ── Evaluado Seleccionado y Sesión ─────────────────────────────────────────
  const [dataDirector, setDataDirector] = useState<User>({});
  const [dataEspecialista, setDataEspecialista] = useState<User>({});
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // ── Estado Principal del Formulario ────────────────────────────────────────
  const [originalPR, setOriginalPR] = useState<PRDocentes[]>([]);
  const [copyPR, setCopyPR] = useState<PRDocentes[]>([]);
  const [fechaMonitoreo, setFechaMonitoreo] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [horaInicio, setHoraInicio] = useState<string>('');
  const [horaFinal, setHoraFinal] = useState<string>('');
  const [emailEspecialista, setEmailEspecialista] = useState<string>('');
  const [celularEspecialista, setCelularEspecialista] = useState<string>('');
  const [emailMonitor, setEmailMonitor] = useState<string>('');
  const [celularMonitor, setCelularMonitor] = useState<string>('');
  const [tituloReporte, setTituloReporte] = useState<string>('');
  const [selectedFaseId, setSelectedFaseId] = useState<string>('');
  const [loadingFase, setLoadingFase] = useState<boolean>(false);
  const isDataLoadedRef = useRef(false);

  // ── Búsqueda y Dropdown ────────────────────────────────────────────────────
  const [dniDocente, setDniDocente] = useState<string>('');
  const [todosLosEvaluados, setTodosLosEvaluados] = useState<User[]>([]);
  const [especialistasFiltrados, setEspecialistasFiltrados] = useState<User[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [historialEspecialista, setHistorialEspecialista] = useState<User[]>([]);
  const [showSessionSelector, setShowSessionSelector] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // ── Fases Disponibles ──────────────────────────────────────────────────────
  const fasesDisponibles = useMemo(() => {
    return getUniquePhases(dataEvaluacionDocente, evaluadosEspecialista);
  }, [dataEvaluacionDocente, evaluadosEspecialista]);

  // Establecer fase por defecto
  useEffect(() => {
    if (!selectedFaseId && dataEvaluacionDocente?.faseActualID) {
      const matching = fasesDisponibles.find(
        (f) =>
          f.id === dataEvaluacionDocente.faseActualID ||
          f.nombre.toLowerCase() === dataEvaluacionDocente.faseNombre?.toLowerCase()
      );
      setSelectedFaseId(matching ? matching.id : dataEvaluacionDocente.faseActualID);
    } else if (!selectedFaseId && fasesDisponibles.length > 0) {
      setSelectedFaseId(fasesDisponibles[0].id);
    }
  }, [dataEvaluacionDocente?.faseActualID, dataEvaluacionDocente?.faseNombre, fasesDisponibles, selectedFaseId]);

  // Cargar datos de la evaluación y sus subcolecciones
  useEffect(() => {
    if (!evaluacionId) return;
    const unsubDoc = getDataEvaluacion(evaluacionId);
    const unsubDims = getDimensiones(evaluacionId);
    const unsubPreg = getPreguntasRespuestas(evaluacionId);
    const unsubEval = getEvaluados(evaluacionId);

    return () => {
      if (typeof unsubDoc === 'function') unsubDoc();
      if (typeof unsubDims === 'function') unsubDims();
      if (typeof unsubPreg === 'function') unsubPreg();
      if (typeof unsubEval === 'function') unsubEval();
    };
  }, [evaluacionId, getDataEvaluacion, getDimensiones, getPreguntasRespuestas, getEvaluados]);

  // Inicializar copyPR con preguntas de la evaluación
  useEffect(() => {
    if (getPreguntaRespuestaDocentes?.length > 0 && copyPR.length === 0) {
      setOriginalPR([...getPreguntaRespuestaDocentes]);
      setCopyPR(getPreguntaRespuestaDocentes);
    }
  }, [getPreguntaRespuestaDocentes, copyPR.length]);

  // Cargar datos del monitor
  useEffect(() => {
    if (currentUserData) {
      setEmailMonitor(currentUserData.email || '');
      setCelularMonitor(currentUserData.celular || '');
    }
  }, [currentUserData?.dni]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Sub-Hooks ──────────────────────────────────────────────────────────────
  const {
    retroalimentacionDinamica,
    setRetroalimentacionDinamica,
    handleAddFeedbackField,
    handleRemoveFeedbackField,
    handleChangeFeedbackLabel,
    handleChangeFeedbackDescription,
    handleChangeFeedbackValue,
  } = useRetroalimentacionDinamica({
    dataEvaluacionDocente,
    dataEspecialista,
    isDataLoadedRef,
    evaluacionId,
    updateConfiguracionCamposRetro,
  });

  const dniTarget = dataDirector?.dni || undefined;

  const { uploadingMap, handleUploadEvidencia, handleDeleteEvidencia } = useEvidencias({
    copyPR,
    setCopyPR,
    uploadEvidenciaFn: uploadEvidencia,
    deleteEvidenciaFn: deleteEvidencia,
    evaluacionId,
    currentSessionId,
    dniTarget,
  });

  // ── Sincronizar Respuestas de la Sesión Cargada ────────────────────────────
  useEffect(() => {
    if (
      dataDirector.dni &&
      dataEspecialista &&
      (dataEspecialista.dni === dataDirector.dni ||
        (dataEspecialista as any).docenteDni === dataDirector.dni ||
        (dataEspecialista as any).directorDni === dataDirector.dni ||
        (dataEspecialista as any).evaluadoDni === dataDirector.dni) &&
      !isDataLoadedRef.current
    ) {
      if (dataEspecialista.resultadosSeguimientoRetroalimentacion) {
        const basePR = originalPR.length > 0 ? originalPR : copyPR;
        const copyPRConRespuestas = basePR.map((pregunta) => {
          const respuesta = dataEspecialista.resultadosSeguimientoRetroalimentacion?.find(
            (r: any) =>
              (r.order !== undefined &&
                pregunta.order !== undefined &&
                String(r.order) === String(pregunta.order)) ||
              (r.id && pregunta.id && String(r.id) === String(pregunta.id))
          );
          if (respuesta?.alternativas && respuesta.alternativas.length > 0) {
            return {
              ...pregunta,
              alternativas: respuesta.alternativas.map((alt: any) => ({
                ...alt,
                selected: !!alt.selected,
              })),
              evidencias: respuesta.evidencias || [],
            };
          }
          return {
            ...pregunta,
            alternativas: pregunta.alternativas?.map((a) => ({ ...a, selected: false })),
            evidencias: [],
          };
        });
        setCopyPR(copyPRConRespuestas);
      }

      if (dataEspecialista.fechaMonitoreo) setFechaMonitoreo(dataEspecialista.fechaMonitoreo);
      if (dataEspecialista.horaInicio) setHoraInicio(dataEspecialista.horaInicio);
      if (dataEspecialista.horaFinal) setHoraFinal(dataEspecialista.horaFinal);
      if (dataEspecialista.email) setEmailEspecialista(dataEspecialista.email);
      if (dataEspecialista.celular) setCelularEspecialista(dataEspecialista.celular);
      if (dataEspecialista.datosMonitor?.email) setEmailMonitor(dataEspecialista.datosMonitor.email);
      if (dataEspecialista.datosMonitor?.celular) setCelularMonitor(dataEspecialista.datosMonitor.celular);
      if (dataEspecialista.tituloReporte) setTituloReporte(dataEspecialista.tituloReporte);

      const targetId = dataEspecialista.idFase || (dataEspecialista as any).faseActualID;
      const targetNombre = dataEspecialista.faseNombre;
      if (targetId || targetNombre) {
        const matchingFase = fasesDisponibles.find(
          (f) => f.id === targetId || (targetNombre && f.nombre.toLowerCase() === targetNombre.toLowerCase())
        );
        if (matchingFase) {
          setSelectedFaseId(matchingFase.id);
        }
      }

      isDataLoadedRef.current = true;
    }
  }, [dataEspecialista, dataDirector.dni, originalPR, copyPR, fasesDisponibles]);

  // Al seleccionar evaluado, capturar hora y datos de contacto iniciales
  useEffect(() => {
    if (dataDirector.dni) {
      if (!horaInicio) {
        const now = new Date();
        setHoraInicio(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
        setFechaMonitoreo(now.toISOString().split('T')[0]);
      }
      setEmailEspecialista(dataDirector.email || '');
      setCelularEspecialista(dataDirector.celular || '');
    } else {
      isDataLoadedRef.current = false;
    }
  }, [dataDirector.dni]);

  // ── Auto-Carga desde Parámetros de URL ──────────────────────────────────────
  useEffect(() => {
    let queryDni: string | undefined;
    for (const key of queryParamKeys) {
      const val = router.query[key];
      if (val && typeof val === 'string' && val.trim().length >= 8) {
        queryDni = val.trim();
        break;
      }
    }

    if (queryDni && (!dataDirector.dni || dataDirector.dni !== queryDni)) {
      const loadUserFromUrl = async () => {
        const user = await buscarUsuario(queryDni!);
        if (user) {
          setDataDirector(user);
          setDniDocente(user.dni || '');
          if (evaluacionId) {
            const history = await getHistorialEvaluado(evaluacionId, user.dni || '');
            setHistorialEspecialista(history);

            // Verificar si hay sesión en la fase actual
            const targetPhase = selectedFaseId || dataEvaluacionDocente?.faseActualID;
            const session = targetPhase
              ? history.find((h) => h.idFase === targetPhase || (h as any).faseActualID === targetPhase)
              : history[0];

            if (session && session.id) {
              setCurrentSessionId(session.id);
              setDataEspecialista(session);
            }
          }
        }
      };
      loadUserFromUrl();
    }
  }, [router.query, evaluacionId, queryParamKeys, dataDirector.dni, selectedFaseId, dataEvaluacionDocente?.faseActualID]);

  // ── Handlers de Búsqueda ───────────────────────────────────────────────────
  const handleChangeDocente = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDniDocente(value);

    if (value.trim() === '') {
      setEspecialistasFiltrados(todosLosEvaluados);
    } else {
      const term = value.toLowerCase();
      const filtered = todosLosEvaluados.filter(
        (u) =>
          u.dni?.toLowerCase().includes(term) ||
          u.nombres?.toLowerCase().includes(term) ||
          u.apellidos?.toLowerCase().includes(term)
      );
      setEspecialistasFiltrados(filtered);
    }

    if (!showDropdown) setShowDropdown(true);

    if (dataDirector.dni) {
      setDataDirector({});
      setDataEspecialista({});
      setCopyPR([...originalPR]);
      setEmailEspecialista('');
      setCelularEspecialista('');
      setRetroalimentacionDinamica([]);
      setCurrentSessionId(null);
      isDataLoadedRef.current = false;
    }
  };

  const handleInputClick = async () => {
    setShowDropdown(true);
    if (todosLosEvaluados.length === 0) {
      const all = await getParrillaEvaluados();
      const sorted = (all || []).sort((a, b) =>
        (a.apellidos || '').localeCompare(b.apellidos || '', 'es', { sensitivity: 'base' })
      );
      setTodosLosEvaluados(sorted);
      setEspecialistasFiltrados(sorted);
    }
  };

  const selectUserAndLoadHistory = async (user: User) => {
    setDataDirector(user);
    setDniDocente(user.dni || '');
    setShowDropdown(false);
    isDataLoadedRef.current = false;

    if (evaluacionId && user.dni) {
      const history = await getHistorialEvaluado(evaluacionId, user.dni);
      setHistorialEspecialista(history);

      if (history.length > 0) {
        const targetPhaseId = selectedFaseId || dataEvaluacionDocente?.faseActualID;
        const phaseSession = targetPhaseId
          ? history.find((h) => h.idFase === targetPhaseId || (h as any).faseActualID === targetPhaseId)
          : null;

        if (phaseSession && phaseSession.id) {
          handleContinueEvaluation(phaseSession.id, phaseSession);
        } else {
          setShowSessionSelector(true);
        }
      } else {
        setCurrentSessionId(null);
        setDataEspecialista({});
      }
    }
  };

  const handleSelectEspecialista = (esp: User) => {
    selectUserAndLoadHistory(esp);
  };

  const handleBuscarDocente = async () => {
    if (!dniDocente.trim()) return;
    const found = await buscarUsuario(dniDocente.trim());
    if (found) {
      selectUserAndLoadHistory(found);
    }
  };

  const handleStartNewEvaluation = () => {
    setCurrentSessionId(null);
    setDataEspecialista({});
    setShowSessionSelector(false);
    const cleanPR = originalPR.map((p) => ({
      ...p,
      alternativas: p.alternativas?.map((a) => ({ ...a, selected: false })) || [],
      evidencias: [],
    }));
    setCopyPR(cleanPR);
    setRetroalimentacionDinamica([]);
    setHoraInicio('');
    isDataLoadedRef.current = false;
  };

  const handleContinueEvaluation = (sessionId: string, sessionObj?: User) => {
    setCurrentSessionId(sessionId);
    setShowSessionSelector(false);
    isDataLoadedRef.current = false;

    if (sessionObj) {
      setDataEspecialista(sessionObj);
    } else {
      const foundInHistory = historialEspecialista.find((h) => h.id === sessionId);
      if (foundInHistory) {
        setDataEspecialista(foundInHistory);
      } else if (evaluacionId) {
        getSessionData(evaluacionId, sessionId, (data) => setDataEspecialista(data));
      }
    }
  };

  const handleCerrarEspecialista = () => {
    isDataLoadedRef.current = false;
    setDataDirector({});
    setDataEspecialista({});
    setRetroalimentacionDinamica([]);
    setFechaMonitoreo(new Date().toISOString().split('T')[0]);
    setHoraInicio('');
    setHoraFinal('');
    setEmailEspecialista('');
    setCelularEspecialista('');
    setEmailMonitor(currentUserData?.email || '');
    setCelularMonitor(currentUserData?.celular || '');
    setTituloReporte('');
    setCopyPR([...originalPR]);
    setCurrentSessionId(null);
    setDniDocente('');
    setHistorialEspecialista([]);
    setShowSessionSelector(false);
    setShowDropdown(false);

    // Limpiar query params de la URL sin recargar la página
    if (evaluacionId) {
      router.replace({ pathname: router.pathname, query: { id: evaluacionId } }, undefined, {
        shallow: true,
      });
    }
  };

  // ── Cambio de Fase ─────────────────────────────────────────────────────────
  const handleFaseChange = async (newFaseId: string) => {
    setSelectedFaseId(newFaseId);
    const targetDni = dataDirector?.dni;
    if (!evaluacionId || !targetDni) return;

    const targetFaseObj = fasesDisponibles.find((f) => f.id === newFaseId);
    const targetNombre = targetFaseObj?.nombre?.trim().toLowerCase();

    setLoadingFase(true);
    try {
      const history = await getHistorialEvaluado(evaluacionId, targetDni);
      const foundSession = history.find((h) => {
        if (h.idFase === newFaseId || (h as any).faseActualID === newFaseId) return true;
        if (targetNombre && h.faseNombre && h.faseNombre.trim().toLowerCase() === targetNombre) return true;
        return false;
      });

      if (foundSession && foundSession.id) {
        setCurrentSessionId(foundSession.id);
        setDataEspecialista(foundSession);
        isDataLoadedRef.current = false;
      } else {
        setCurrentSessionId(null);
        setDataEspecialista({});
        const basePR = originalPR.length > 0 ? originalPR : copyPR;
        const cleanPR = basePR.map((p) => ({
          ...p,
          alternativas: p.alternativas?.map((a) => ({ ...a, selected: false })) || [],
          evidencias: [],
        }));
        setCopyPR(cleanPR);
        setRetroalimentacionDinamica([]);
        setFechaMonitoreo(new Date().toISOString().split('T')[0]);
        setHoraInicio('');
        setHoraFinal('');
        setTituloReporte('');
        isDataLoadedRef.current = false;
      }
    } catch (error) {
      console.error('Error al cambiar de fase:', error);
    } finally {
      setTimeout(() => {
        setLoadingFase(false);
      }, 300);
    }
  };

  // ── Evaluación y Guardado ──────────────────────────────────────────────────
  const handleCheckedRespuesta = (value: string, preguntaIndex: number) => {
    const escalaActual: any[] =
      (dataEvaluacionDocente?.escala?.length ?? 0) > 0
        ? (dataEvaluacionDocente!.escala as any[])
        : defaultEscala;

    setCopyPR((prev) => {
      const updated = [...prev];
      updated[preguntaIndex] = {
        ...updated[preguntaIndex],
        alternativas: escalaActual.map((escala: any) => ({
          ...escala,
          selected: (escala.alternativa || '').toString() === value.toString(),
        })),
      };
      return updated;
    });
  };

  const getSelectedFaseOverride = () => {
    const targetFaseObj =
      fasesDisponibles.find((f) => f.id === selectedFaseId) ||
      (dataEvaluacionDocente?.faseActualID
        ? { id: dataEvaluacionDocente.faseActualID, nombre: dataEvaluacionDocente.faseNombre || '' }
        : undefined);
    return targetFaseObj ? { idFase: targetFaseObj.id, faseNombre: targetFaseObj.nombre } : undefined;
  };

  const _guardarEvaluacion = async () => {
    if (!dataDirector.dni || !evaluacionId) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const finalTime = horaFinal || now;
    if (!horaFinal) setHoraFinal(now);

    const startTime = horaInicio || now;
    if (!horaInicio) setHoraInicio(now);

    const monitorData = {
      ...currentUserData,
      email: emailMonitor,
      celular: celularMonitor,
      cargo: currentUserData?.cargo || (role === 'director' ? 'DIRECTOR' : 'ESPECIALISTA'),
    };

    const savedId = await guardarEvaluacion(
      evaluacionId,
      copyPR,
      { ...dataDirector, email: emailEspecialista, celular: celularEspecialista },
      retroalimentacionDinamica,
      fechaMonitoreo,
      startTime,
      finalTime,
      monitorData,
      tituloReporte || dataEvaluacionDocente?.name || `EVALUACIÓN DE DESEMPEÑO`,
      false,
      currentSessionId || undefined,
      getSelectedFaseOverride()
    );

    if (!currentSessionId && savedId) setCurrentSessionId(savedId);
    return savedId;
  };

  const handleSalvarPreguntaDocente = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const savedId = await _guardarEvaluacion();
    if (savedId) handleCerrarEspecialista();
  };

  const handleGuardarClick = async () => {
    const savedId = await _guardarEvaluacion();
    if (savedId) handleCerrarEspecialista();
  };

  const allQuestionsAnswered =
    copyPR.length > 0 &&
    copyPR.every((pregunta) => pregunta.alternativas?.some((alt) => alt.selected === true));

  const currentEscala: any[] =
    (dataEvaluacionDocente?.escala?.length ?? 0) > 0
      ? (dataEvaluacionDocente!.escala as any[])
      : defaultEscala;

  return {
    isAutoreporte,
    currentUserData,
    dataDirector,
    dataEspecialista,
    dataEvaluacionDocente,
    dimensionesEspecialistas,
    copyPR,
    fechaMonitoreo,
    setFechaMonitoreo,
    horaInicio,
    setHoraInicio,
    horaFinal,
    setHoraFinal,
    emailEspecialista,
    setEmailEspecialista,
    celularEspecialista,
    setCelularEspecialista,
    emailMonitor,
    setEmailMonitor,
    celularMonitor,
    setCelularMonitor,
    tituloReporte,
    setTituloReporte,
    currentSessionId,
    currentEscala,
    selectedFaseId,
    setSelectedFaseId,
    fasesDisponibles,
    handleFaseChange,
    loadingFase,
    dniDocente,
    especialistasFiltrados,
    showDropdown,
    searchRef,
    historialEspecialista,
    showSessionSelector,
    handleChangeDocente,
    handleInputClick,
    handleSelectEspecialista,
    handleBuscarDocente,
    handleStartNewEvaluation,
    handleContinueEvaluation,
    handleCerrarEspecialista,
    handleCheckedRespuesta,
    handleSalvarPreguntaDocente,
    handleGuardarClick,
    allQuestionsAnswered,
    uploadingMap,
    handleUploadEvidencia,
    handleDeleteEvidencia,
    retroalimentacionDinamica,
    handleAddFeedbackField,
    handleRemoveFeedbackField,
    handleChangeFeedbackLabel,
    handleChangeFeedbackDescription,
    handleChangeFeedbackValue,
    warningDataDocente,
    loaderSalvarPregunta,
    evaluadoRoleLabel,
    evaluacionId,
  };
};

export default useEvaluarDesempeno;
