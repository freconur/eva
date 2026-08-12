import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas';
import { PRDocentes } from '@/features/types/types';
import { useEvidencias } from './useEvidencias';
import { useRetroalimentacionDinamica } from './useRetroalimentacionDinamica';
import { useBusquedaEspecialista } from './useBusquedaEspecialista';
import { db } from '@/firebase/firebase.config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

import { getUniquePhases } from '@/features/utils/phaseUtils';

const defaultEscala = [
    { value: 0, alternativa: '0', descripcion: 'No evidencia' },
    { value: 1, alternativa: '1', descripcion: 'En proceso' },
    { value: 2, alternativa: '2', descripcion: 'Logrado' },
];

export const useEvaluarEspecialista = () => {
    const router = useRouter();
    const evaluacionId = router.query.id ? `${router.query.id}` : '';

    const {
        getPreguntaRespuestaDocentes,
        dimensionesEspecialistas,
        dataEvaluacionDocente,
        currentUserData,
        dataDirector,
        evaluadosEspecialista,
    } = useGlobalContext();

    const {
        buscarEspecialista,
        guardarEvaluacionEspecialistas,
        resetEspecialista,
        getPreguntasRespuestasEspecialistas,
        getDimensionesEspecialistas,
        getDataEvaluacion,
        dataEspecialista,
        setDataEspecialista,
        getDataSeguimientoRetroalimentacionEspecialista,
        uploadEvidencia,
        deleteEvidencia,
        updateConfiguracionCamposRetro,
        getHistorialEspecialista,
        getTodosLosEspecialistas,
        getEspecialistasEvaluados,
    } = UseEvaluacionEspecialistas();

    // Condicional de rol
    const isAutoreporte = currentUserData?.rol === 1;

    // ── Estado principal ──────────────────────────────────────────────────────
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
    const [monitorDataFijo, setMonitorDataFijo] = useState<any>(null);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [selectedFaseId, setSelectedFaseId] = useState<string>('');
    const [loadingFase, setLoadingFase] = useState<boolean>(false);
    const isDataLoadedRef = useRef(false);

    // ── Fases disponibles ─────────────────────────────────────────────────────
    const fasesDisponibles = useMemo(() => {
        return getUniquePhases(dataEvaluacionDocente, evaluadosEspecialista);
    }, [dataEvaluacionDocente, evaluadosEspecialista]);

    // Establecer fase por defecto cuando se cargue la evaluación
    useEffect(() => {
        if (!selectedFaseId && dataEvaluacionDocente?.faseActualID) {
            const matching = fasesDisponibles.find(
                f => f.id === dataEvaluacionDocente.faseActualID ||
                     f.nombre.toLowerCase() === dataEvaluacionDocente.faseNombre?.toLowerCase()
            );
            setSelectedFaseId(matching ? matching.id : dataEvaluacionDocente.faseActualID);
        } else if (!selectedFaseId && fasesDisponibles.length > 0) {
            setSelectedFaseId(fasesDisponibles[0].id);
        }
    }, [dataEvaluacionDocente?.faseActualID, dataEvaluacionDocente?.faseNombre, fasesDisponibles, selectedFaseId]);

    // ── Sub-hooks ─────────────────────────────────────────────────────────────

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

    const dniTarget: string | undefined =
        dataEspecialista?.dni || dataDirector?.dni || undefined;

    const { uploadingMap, handleUploadEvidencia, handleDeleteEvidencia } = useEvidencias({
        copyPR,
        setCopyPR,
        uploadEvidenciaFn: uploadEvidencia,
        deleteEvidenciaFn: deleteEvidencia,
        evaluacionId,
        currentSessionId,
        dniTarget,
    });

    const {
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
        resetBusqueda,
    } = useBusquedaEspecialista({
        buscarEspecialista,
        resetEspecialista,
        getTodosLosEspecialistas,
        getHistorialEspecialista,
        getDataSeguimientoRetroalimentacionEspecialista,
        evaluacionId,
        selectedFaseId,
        dataEspecialista,
        dataDirector,
        dataEvaluacionDocente,
        setCopyPR,
        originalPR,
        setEmailEspecialista,
        setCelularEspecialista,
        setRetroalimentacionDinamica,
        setCurrentSessionId,
        setHoraInicio,
    });

    // Cambiar de fase y buscar automáticamente sesión existente o limpiar formulario
    const handleFaseChange = async (newFaseId: string) => {
        setSelectedFaseId(newFaseId);
        const targetDni = dataDirector?.dni || dataEspecialista?.dni || dataEspecialista?.especialistaDni;
        if (!evaluacionId || !targetDni) return;

        const targetFaseObj = fasesDisponibles.find(f => f.id === newFaseId);
        const targetNombre = targetFaseObj?.nombre?.trim().toLowerCase();

        setLoadingFase(true);
        try {
            const history = await getHistorialEspecialista(evaluacionId, targetDni);
            const foundSession = history.find(h => {
                if (h.idFase === newFaseId || h.faseActualID === newFaseId) return true;
                if (targetNombre && h.faseNombre && h.faseNombre.trim().toLowerCase() === targetNombre) return true;
                return false;
            });

            if (foundSession && foundSession.id) {
                setCurrentSessionId(foundSession.id);
                getDataSeguimientoRetroalimentacionEspecialista(evaluacionId, foundSession.id);
                isDataLoadedRef.current = false;
            } else {
                setCurrentSessionId(null);
                setDataEspecialista({});
                const basePR = originalPR.length > 0 ? originalPR : copyPR;
                const cleanPR = basePR.map(p => ({
                    ...p,
                    alternativas: p.alternativas?.map(a => ({ ...a, selected: false })) || [],
                    evidencias: []
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
            console.error("Error al cambiar de fase:", error);
        } finally {
            setTimeout(() => {
                setLoadingFase(false);
            }, 300);
        }
    };

    // ── Efectos ───────────────────────────────────────────────────────────────

    // Cargar datos del monitor al montar (solo para monitores, no para rol 1)
    useEffect(() => {
        if (currentUserData && !isAutoreporte) {
            setEmailMonitor(currentUserData.email || '');
            setCelularMonitor(currentUserData.celular || '');
        }
    }, [currentUserData?.dni]);

    // Auto-cargar el especialista si es modo autorreporte
    useEffect(() => {
        if (isAutoreporte && currentUserData?.dni && evaluacionId && !dataDirector.dni) {
            buscarEspecialista(currentUserData.dni);
            getDataSeguimientoRetroalimentacionEspecialista(evaluacionId, currentUserData.dni);
        }
    }, [isAutoreporte, currentUserData?.dni, evaluacionId, dataDirector.dni]);

    // Verificar si el especialista ya se autoevaluó en la fase actual para cargar su sesión
    useEffect(() => {
        if (!isAutoreporte || !currentUserData?.dni || !evaluacionId || !dataEvaluacionDocente?.faseActualID) return;

        const checkPreviousAutoreporte = async () => {
            try {
                const path = `/evaluaciones-especialista/${evaluacionId}/evaluados`;
                const q = query(
                    collection(db, path),
                    where("especialistaDni", "==", currentUserData.dni),
                    where("idFase", "==", dataEvaluacionDocente.faseActualID)
                );

                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    // Si hay una evaluación previa en esta fase, la cargamos (tomamos la más reciente)
                    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
                    setCurrentSessionId(lastDoc.id);
                    getDataSeguimientoRetroalimentacionEspecialista(evaluacionId, lastDoc.id);
                }
            } catch (error) {
                console.error("Error al buscar autoevaluación previa en la fase:", error);
            }
        };

        checkPreviousAutoreporte();
    }, [isAutoreporte, currentUserData?.dni, evaluacionId, dataEvaluacionDocente?.faseActualID]);

    // Cargar datos del monitor fijo para rol 1 (detrás del telón)
    useEffect(() => {
        if (!isAutoreporte) return;
        const MONITOR_ID = 'G7wxDbor8hYbaIRZJADR7NjdEtP2';
        const fetchMonitor = async () => {
            try {
                const monitorRef = doc(db, 'usuarios', MONITOR_ID);
                const monitorSnap = await getDoc(monitorRef);
                if (monitorSnap.exists()) {
                    const monitorData = monitorSnap.data();
                    setMonitorDataFijo(monitorData);
                    setEmailMonitor(monitorData.email || '');
                    setCelularMonitor(monitorData.celular || '');
                }
            } catch (error) {
                console.error('Error al cargar datos del monitor:', error);
            }
        };
        fetchMonitor();
    }, [isAutoreporte]);

    // Cargar preguntas, dimensiones, modelo de evaluación y evaluados
    useEffect(() => {
        if (evaluacionId) {
            getPreguntasRespuestasEspecialistas(evaluacionId);
            getDimensionesEspecialistas(evaluacionId);
            getDataEvaluacion(evaluacionId);
            getEspecialistasEvaluados(evaluacionId);
        }
    }, [evaluacionId]);

    // Inicializar copyPR al recibir preguntas del contexto
    useEffect(() => {
        if (getPreguntaRespuestaDocentes?.length > 0 && copyPR.length === 0) {
            setOriginalPR([...getPreguntaRespuestaDocentes]);
            setCopyPR(getPreguntaRespuestaDocentes);
        }
    }, [getPreguntaRespuestaDocentes, copyPR.length]);

    // Cargar respuestas guardadas del especialista seleccionado
    useEffect(() => {
        if (
            dataDirector.dni &&
            dataEspecialista &&
            (dataEspecialista.dni === dataDirector.dni || dataEspecialista.especialistaDni === dataDirector.dni) &&
            !isDataLoadedRef.current
        ) {
            if (dataEspecialista.resultadosSeguimientoRetroalimentacion) {
                const basePR = originalPR.length > 0 ? originalPR : copyPR;
                const copyPRConRespuestas = basePR.map(pregunta => {
                    const respuesta = dataEspecialista.resultadosSeguimientoRetroalimentacion?.find(
                        (r: any) => r.order === pregunta.order
                    );
                    if (respuesta?.alternativas) {
                        return {
                            ...pregunta,
                            alternativas: pregunta.alternativas?.map(alternativa => ({
                                ...alternativa,
                                selected:
                                    (respuesta.alternativas as any[])?.find(
                                        (alt: any) => alt.alternativa === alternativa.alternativa
                                    )?.selected || false,
                            })),
                            evidencias: respuesta.evidencias || [],
                        };
                    }
                    return {
                        ...pregunta,
                        alternativas: pregunta.alternativas?.map(a => ({ ...a, selected: false })),
                        evidencias: []
                    };
                });
                setCopyPR(copyPRConRespuestas);
            } else {
                const basePR = originalPR.length > 0 ? originalPR : copyPR;
                const cleanPR = basePR.map(p => ({
                    ...p,
                    alternativas: p.alternativas?.map(a => ({ ...a, selected: false })) || [],
                    evidencias: []
                }));
                setCopyPR(cleanPR);
            }

            if (dataEspecialista.fechaMonitoreo) setFechaMonitoreo(dataEspecialista.fechaMonitoreo);
            if (dataEspecialista.horaInicio) setHoraInicio(dataEspecialista.horaInicio);
            if (dataEspecialista.horaFinal) setHoraFinal(dataEspecialista.horaFinal);
            if (dataEspecialista.email) setEmailEspecialista(dataEspecialista.email);
            if (dataEspecialista.celular) setCelularEspecialista(dataEspecialista.celular);
            if (dataEspecialista.datosMonitor?.email) setEmailMonitor(dataEspecialista.datosMonitor.email);
            if (dataEspecialista.datosMonitor?.celular) setCelularMonitor(dataEspecialista.datosMonitor.celular);
            if (dataEspecialista.tituloReporte) setTituloReporte(dataEspecialista.tituloReporte);
            if (dataEspecialista.idFase || dataEspecialista.faseActualID || dataEspecialista.faseNombre) {
                const targetId = dataEspecialista.idFase || dataEspecialista.faseActualID;
                const targetNombre = dataEspecialista.faseNombre;
                const matchingFase = fasesDisponibles.find(
                    f => f.id === targetId || (targetNombre && f.nombre.toLowerCase() === targetNombre.toLowerCase())
                );
                if (matchingFase) {
                    setSelectedFaseId(matchingFase.id);
                }
            }

            isDataLoadedRef.current = true;
        }
    }, [dataEspecialista, dataDirector.dni, originalPR]);

    // Capturar hora de inicio al encontrar al especialista
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

    // ── Handlers principales ──────────────────────────────────────────────────

    const handleCheckedRespuesta = (value: string, preguntaIndex: number) => {
        const escalaActual: any[] =
            (dataEvaluacionDocente?.escala?.length ?? 0) > 0
                ? (dataEvaluacionDocente!.escala as any[])
                : defaultEscala;
        setCopyPR(prev => {
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
        const targetFaseObj = fasesDisponibles.find(f => f.id === selectedFaseId) || (
            dataEvaluacionDocente?.faseActualID
                ? { id: dataEvaluacionDocente.faseActualID, nombre: dataEvaluacionDocente.faseNombre || '' }
                : undefined
        );
        return targetFaseObj
            ? { idFase: targetFaseObj.id, faseNombre: targetFaseObj.nombre }
            : undefined;
    };

    const handleAutoSave = async (
        currentPR = copyPR,
        currentFeedback = retroalimentacionDinamica
    ) => {
        if (!evaluacionId || !dataDirector.dni) return;
        
        // Priorizar hora manual si existe, si no, capturar actual
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const finalTime = horaFinal || now;
        
        const monitorData = isAutoreporte && monitorDataFijo
            ? { ...monitorDataFijo, email: emailMonitor, celular: celularMonitor }
            : { ...currentUserData, email: emailMonitor, celular: celularMonitor };

        const savedId = await guardarEvaluacionEspecialistas(
            evaluacionId,
            currentPR,
            { ...dataDirector, email: emailEspecialista, celular: celularEspecialista },
            currentFeedback,
            fechaMonitoreo,
            horaInicio || now,
            finalTime,
            monitorData,
            tituloReporte,
            true,
            currentSessionId || undefined,
            getSelectedFaseOverride()
        );
        if (!currentSessionId && savedId) setCurrentSessionId(savedId);
    };

    const _guardarEvaluacion = async () => {
        if (!dataDirector.dni || !evaluacionId) return;
        
        // Capturar hora actual solo si no hay una manual
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        
        // Si horaFinal está vacía, actualizamos el estado con la hora actual
        const finalTime = horaFinal || now;
        if (!horaFinal) {
            setHoraFinal(now);
        }

        // Lo mismo para horaInicio por seguridad (aunque suele estar ya capturada)
        const startTime = horaInicio || now;
        if (!horaInicio) {
            setHoraInicio(now);
        }

        const monitorData = isAutoreporte && monitorDataFijo
            ? { ...monitorDataFijo, email: emailMonitor, celular: celularMonitor }
            : { ...currentUserData, email: emailMonitor, celular: celularMonitor };

        const savedId = await guardarEvaluacionEspecialistas(
            evaluacionId,
            copyPR,
            { ...dataDirector, email: emailEspecialista, celular: celularEspecialista },
            retroalimentacionDinamica,
            fechaMonitoreo,
            startTime,
            finalTime,
            monitorData,
            tituloReporte,
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
        if (savedId && !isAutoreporte) handleCerrarEspecialista();
    };

    const handleGuardarClick = async () => {
        const savedId = await _guardarEvaluacion();
        if (savedId && !isAutoreporte) handleCerrarEspecialista();
    };

    const handleCerrarEspecialista = () => {
        isDataLoadedRef.current = false;
        resetEspecialista();
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
        resetBusqueda();
    };

    const activeButtonGuardar = () =>
        copyPR.every(pregunta => pregunta.alternativas?.some(alt => alt.selected === true));

    // El botón de guardar se activa solo cuando todas las preguntas tienen una respuesta seleccionada
    const allQuestionsAnswered =
        copyPR.length > 0 &&
        copyPR.every(pregunta => pregunta.alternativas?.some(alt => alt.selected === true));

    const currentEscala: any[] =
        (dataEvaluacionDocente?.escala?.length ?? 0) > 0
            ? (dataEvaluacionDocente!.escala as any[])
            : defaultEscala;

    // ── Return ────────────────────────────────────────────────────────────────
    return {
        // Context
        isAutoreporte,
        currentUserData,
        dataDirector,
        dataEspecialista,
        dataEvaluacionDocente,
        dimensionesEspecialistas,
        // Estado principal
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
        // Fases
        selectedFaseId,
        setSelectedFaseId,
        fasesDisponibles,
        handleFaseChange,
        loadingFase,
        // Búsqueda
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
        // Evaluación
        handleCheckedRespuesta,
        handleSalvarPreguntaDocente,
        handleGuardarClick,
        handleAutoSave,
        activeButtonGuardar,
        allQuestionsAnswered,
        // Evidencias
        uploadingMap,
        handleUploadEvidencia,
        handleDeleteEvidencia,
        // Retroalimentación
        retroalimentacionDinamica,
        handleAddFeedbackField,
        handleRemoveFeedbackField,
        handleChangeFeedbackLabel,
        handleChangeFeedbackDescription,
        handleChangeFeedbackValue,
    };
};
