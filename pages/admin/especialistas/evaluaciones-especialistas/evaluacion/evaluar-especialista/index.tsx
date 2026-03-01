import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { useGlobalContext, useGlobalContextDispatch } from '@/features/context/GlolbalContext';
import { AppAction } from '@/features/actions/appAction';

import { PRDocentes, respuestaPsicolinguistica, User, RetroalimentacionDinamica, CampoRetroalimentacionConfig } from '@/features/types/types';
import { MdAssignment, MdCloudUpload, MdPeople, MdDelete, MdFilePresent } from 'react-icons/md';

import { RiLoader4Line, RiCloseLine } from 'react-icons/ri';

import { usePsicolinguistica } from '@/features/hooks/usePsicolinguistica';
import React, { useState, useEffect, useRef } from 'react';
import UseEvaluacionDocentes from '@/features/hooks/UseEvaluacionDocentes';
import UseEvaluacionDirectores from '@/features/hooks/UseEvaluacionDirectores';
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas';
import Link from 'next/link';
import { IoArrowBack } from 'react-icons/io5';
import styles from './evaluarEspecialista.module.css';
import { regionTexto } from '@/fuctions/regiones';

const EvaluarEspecialista = () => {
  const router = useRouter();
  const { loaderSalvarPregunta } = useGlobalContext();
  const dispatch = useGlobalContextDispatch();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();
  const {
    preguntasPsicolinguistica,
    dataDirector,
    warningDataDocente,
    getPreguntaRespuestaDocentes,
    dimensionesEspecialistas,
    dataEvaluacionDocente,
    currentUserData,
  } = useGlobalContext();
  const [originalPR, setOriginalPR] = useState<PRDocentes[]>([]);
  const [copyPR, setCopyPR] = useState<PRDocentes[]>([]);
  const [dniDocente, setDniDocente] = useState<string>('');
  const [retroalimentacionDinamica, setRetroalimentacionDinamica] = useState<RetroalimentacionDinamica[]>([]);
  const [fechaMonitoreo, setFechaMonitoreo] = useState<string>(new Date().toISOString().split('T')[0]);
  const [horaInicio, setHoraInicio] = useState<string>('');
  const [horaFinal, setHoraFinal] = useState<string>('');
  const [emailEspecialista, setEmailEspecialista] = useState<string>('');
  const [celularEspecialista, setCelularEspecialista] = useState<string>('');
  const [emailMonitor, setEmailMonitor] = useState<string>('');
  const [celularMonitor, setCelularMonitor] = useState<string>('');
  const [uploadingMap, setUploadingMap] = useState<{ [key: string]: boolean }>({});
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [historialEspecialista, setHistorialEspecialista] = useState<User[]>([]);
  const [showSessionSelector, setShowSessionSelector] = useState<boolean>(false);
  const [todosLosEspecialistas, setTodosLosEspecialistas] = useState<User[]>([]);
  const [especialistasFiltrados, setEspecialistasFiltrados] = useState<User[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const isDataLoadedRef = useRef(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const { actualizarPreguntasPsicolinguistica } = usePsicolinguistica();
  const {
    buscarEspecialista,
    guardarEvaluacionEspecialistas,
    resetEspecialista,
    agregarObservacionEspecialistas,
    getPreguntasRespuestasEspecialistas,
    getDimensionesEspecialistas,
    getDataEvaluacion,
    dataEspecialista,
    getDataSeguimientoRetroalimentacionEspecialista,
    uploadEvidencia,
    deleteEvidencia,
    updateConfiguracionCamposRetro,
    getHistorialEspecialista,
    getTodosLosEspecialistas,
  } = UseEvaluacionEspecialistas();


  // Determinar si es modo autorreporte (el especialista se evalúa a sí mismo)
  const isAutoreporte = currentUserData?.rol === 1;

  // Cargar datos del monitor inicialmente
  useEffect(() => {
    if (currentUserData) {
      setEmailMonitor(currentUserData.email || '');
      setCelularMonitor(currentUserData.celular || '');
    }
  }, [currentUserData?.dni]);

  // Si es autorreporte, auto-cargar el propio especialista
  useEffect(() => {
    if (isAutoreporte && currentUserData?.dni && router.query.id && !dataDirector.dni) {
      buscarEspecialista(currentUserData.dni);
      if (router.query.id) {
        getDataSeguimientoRetroalimentacionEspecialista(`${router.query.id}`, currentUserData.dni);
      }
    }
  }, [isAutoreporte, currentUserData?.dni, router.query.id]);

  // Cargar datos de la evaluación al montar el componente
  useEffect(() => {
    if (router.query.id) {
      getPreguntasRespuestasEspecialistas(`${router.query.id}`);
      getDimensionesEspecialistas(`${router.query.id}`);
      getDataEvaluacion(`${router.query.id}`);
    }
  }, [router.query.id]);

  useEffect(() => {
    if (getPreguntaRespuestaDocentes && getPreguntaRespuestaDocentes.length > 0 && copyPR.length === 0) {
      setOriginalPR([...getPreguntaRespuestaDocentes]);
      setCopyPR(getPreguntaRespuestaDocentes);
    }
  }, [getPreguntaRespuestaDocentes, copyPR.length]);


  useEffect(() => {
    // Solo disparar si dataDirector.dni existe y no hemos cargado PARA ESTE ESPECIALISTA aún
    if (dataDirector.dni && dataEspecialista && dataEspecialista.dni === dataDirector.dni && !isDataLoadedRef.current) {
      if (dataEspecialista.resultadosSeguimientoRetroalimentacion) {
        // Mapear respuestas guardadas a las preguntas actuales
        const copyPRConRespuestas = copyPR.map((pregunta) => {
          const respuestaEspecialista = dataEspecialista.resultadosSeguimientoRetroalimentacion?.find(
            (respuesta: any) => respuesta.order === pregunta.order
          );
          if (respuestaEspecialista && respuestaEspecialista.alternativas) {
            return {
              ...pregunta,
              alternativas: pregunta.alternativas?.map((alternativa) => ({
                ...alternativa,
                selected: (respuestaEspecialista.alternativas as any[])?.find(
                  (alt: any) => alt.alternativa === alternativa.alternativa
                )?.selected || false
              })),
              evidencias: respuestaEspecialista.evidencias || []
            };
          }
          return pregunta;
        });
        setCopyPR(copyPRConRespuestas);
      }

      // Cargar datos de monitoreo
      if (dataEspecialista.fechaMonitoreo) setFechaMonitoreo(dataEspecialista.fechaMonitoreo);
      if (dataEspecialista.horaInicio) setHoraInicio(dataEspecialista.horaInicio);
      if (dataEspecialista.horaFinal) setHoraFinal(dataEspecialista.horaFinal);
      if (dataEspecialista.email) setEmailEspecialista(dataEspecialista.email);
      if (dataEspecialista.celular) setCelularEspecialista(dataEspecialista.celular);
      if (dataEspecialista.datosMonitor?.email) setEmailMonitor(dataEspecialista.datosMonitor.email);
      if (dataEspecialista.datosMonitor?.celular) setCelularMonitor(dataEspecialista.datosMonitor.celular);

      isDataLoadedRef.current = true; // Marcar como cargado la PR y monitoreo
    }
  }, [dataEspecialista, dataDirector.dni, copyPR.length]);

  // Sync Efecto dedicado a la Retroalimentación (Merge reactivo entre Molde Global y Data Especialista)
  useEffect(() => {

    // Proceder inmediatamente si el objeto de evaluación global base ya esta disponible. 
    // Es la verdad absoluta, no debe esperar a que se elija un especialista para mostrar la estructura base.
    if (dataEvaluacionDocente) {

      // 1. Obtener el molde global.
      // Si el context global no ha cargado los verdaderos datos, `camposRetroalimentacion` será undefined y usaremos []
      const camposGlobales = dataEvaluacionDocente.camposRetroalimentacion || [];

      // 2. Obtener data que ya tiene cargada este especialista
      let dataGuardada = dataEspecialista.retroalimentacionDinamica || [];
      if (isDataLoadedRef.current && retroalimentacionDinamica.length > 0) {
        dataGuardada = retroalimentacionDinamica;
      }

      // 3. Cruzar información: El molde manda.
      const fusion = camposGlobales.map(campoConfig => {
        // Tolerancia: si el campo viene de una evaluación antigua, será un simple string. Lo convertimos a objeto al vuelo.
        const esString = typeof campoConfig === 'string';
        const etiquetaNormalizada = esString ? (campoConfig as string) : (campoConfig as CampoRetroalimentacionConfig).etiqueta;
        const descripcionNormalizada = esString ? '' : (campoConfig as CampoRetroalimentacionConfig).descripcion;

        const guardado = dataGuardada.find(r => r.etiqueta === etiquetaNormalizada);
        if (guardado) return { ...guardado, descripcion: descripcionNormalizada }; // Ya existía y tiene data, inyectamos la config de descripción actualizada

        // Si es un campo legado (primera carga) y no estaba en la dinámica, lo buscamos en el modelo viejo de dataEspecialista
        if (etiquetaNormalizada === 'AVANCES') return { etiqueta: etiquetaNormalizada, descripcion: descripcionNormalizada, contenido: dataEspecialista.avancesRetroalimentacion || '' };
        if (etiquetaNormalizada === 'DIFICULTADES') return { etiqueta: etiquetaNormalizada, descripcion: descripcionNormalizada, contenido: dataEspecialista.dificultadesRetroalimentacion || '' };
        if (etiquetaNormalizada === 'COMPROMISOS') return { etiqueta: etiquetaNormalizada, descripcion: descripcionNormalizada, contenido: dataEspecialista.compromisosRetroalimentacion || '' };

        // Es un campo nuevo del molde global que el especialista aún no responde
        return { etiqueta: etiquetaNormalizada, descripcion: descripcionNormalizada, contenido: '' };
      });

      // Solo actualizamos el estado si ha cambiado realmente la estructura o hubo un merge de nuevos campos
      setRetroalimentacionDinamica(fusion);
    }
  }, [dataEvaluacionDocente, dataEspecialista]);

  // Capturar hora de inicio cuando se encuentra al especialista (solo si es nuevo)
  useEffect(() => {
    if (dataDirector.dni) {
      if (!horaInicio) {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const dateString = now.toISOString().split('T')[0];
        setHoraInicio(timeString);
        setFechaMonitoreo(dateString);
      }
      setEmailEspecialista(dataDirector.email || '');
      setCelularEspecialista(dataDirector.celular || '');
    } else {
      isDataLoadedRef.current = false; // Resetear flag si no hay especialista
    }
  }, [dataDirector.dni]);

  const handleAutoSave = async (
    currentPR = copyPR,
    currentFeedback = retroalimentacionDinamica
  ) => {
    if (!router.query.id || !dataDirector.dni) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const monitorData = { ...currentUserData, email: emailMonitor, celular: celularMonitor };

    const savedId = await guardarEvaluacionEspecialistas(
      `${router.query.id}`,
      currentPR,
      { ...dataDirector, email: emailEspecialista, celular: celularEspecialista },
      currentFeedback,
      fechaMonitoreo,
      horaInicio,
      now,
      monitorData,
      true, // silent: true
      currentSessionId || undefined
    );

    if (!currentSessionId && savedId) {
      setCurrentSessionId(savedId);
    }
  };


  const activeButtonGuardar = () => {
    return copyPR.every((pregunta) => pregunta.alternativas?.some((alt) => alt.selected === true));
  };


  const handleSalvarPreguntaDocente = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (dataDirector.dni && router.query.id) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      setHoraFinal(now);

      const especialistaActualizado = {
        ...dataDirector,
        email: emailEspecialista,
        celular: celularEspecialista
      };

      const datosMonitorActualizados = {
        ...currentUserData,
        email: emailMonitor,
        celular: celularMonitor
      };

      const savedId = await guardarEvaluacionEspecialistas(
        `${router.query.id}`,
        copyPR,
        especialistaActualizado,
        retroalimentacionDinamica,
        fechaMonitoreo,
        horaInicio,
        now, // Usar la hora capturada justo antes
        datosMonitorActualizados,
        false,
        currentSessionId || undefined
      );

      if (!currentSessionId && savedId) {
        setCurrentSessionId(savedId);
      }

      if (savedId) {
        handleCerrarEspecialista();
      }
    }
  };

  const handleGuardarClick = async () => {
    if (dataDirector.dni && router.query.id) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      setHoraFinal(now);

      const especialistaActualizado = {
        ...dataDirector,
        email: emailEspecialista,
        celular: celularEspecialista
      };

      const datosMonitorActualizados = {
        ...currentUserData,
        email: emailMonitor,
        celular: celularMonitor
      };

      const savedId = await guardarEvaluacionEspecialistas(
        `${router.query.id}`,
        copyPR,
        especialistaActualizado,
        retroalimentacionDinamica,
        fechaMonitoreo,
        horaInicio,
        now, // Usar la hora capturada justo antes
        datosMonitorActualizados,
        false,
        currentSessionId || undefined
      );

      if (!currentSessionId && savedId) {
        setCurrentSessionId(savedId);
      }

      if (savedId) {
        handleCerrarEspecialista();
      }
    }
  };

  const handleChangeDocente = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDniDocente(value);

    // Filtrar localmente
    if (value.trim() === '') {
      setEspecialistasFiltrados(todosLosEspecialistas);
    } else {
      const term = value.toLowerCase();
      const filtered = todosLosEspecialistas.filter(esp =>
        esp.dni?.toLowerCase().includes(term) ||
        esp.nombres?.toLowerCase().includes(term) ||
        esp.apellidos?.toLowerCase().includes(term)
      );
      setEspecialistasFiltrados(filtered);
    }

    if (!showDropdown) setShowDropdown(true);

    // Si el usuario está escribiendo, limpiamos el estado previo para evitar auto-llenados visuales
    if (dataEspecialista.dni || dataDirector.dni) {
      resetEspecialista();
      setCopyPR([...originalPR]);
      setEmailEspecialista('');
      setCelularEspecialista('');
      setRetroalimentacionDinamica([]);
    }
  };

  const handleInputClick = async () => {
    setShowDropdown(true);
    if (todosLosEspecialistas.length === 0) {
      const all = await getTodosLosEspecialistas();
      const sorted = (all || []).sort((a, b) =>
        (a.apellidos || '').localeCompare(b.apellidos || '', 'es', { sensitivity: 'base' })
      );
      setTodosLosEspecialistas(sorted);
      setEspecialistasFiltrados(sorted);
    }
  };

  const handleSelectEspecialista = (esp: User) => {
    setDniDocente(esp.dni || '');
    setShowDropdown(false);
    buscarEspecialistaFromSelection(esp.dni || '');
  };

  const buscarEspecialistaFromSelection = async (dni: string) => {
    buscarEspecialista(dni);
    if (router.query.id) {
      getDataSeguimientoRetroalimentacionEspecialista(`${router.query.id}`, dni);
      const history = await getHistorialEspecialista(`${router.query.id}`, dni);
      setHistorialEspecialista(history);
      if (history.length > 0) {
        setShowSessionSelector(true);
      } else {
        setCurrentSessionId(null);
      }
    }
  };

  const handleBuscardDocente = async () => {
    buscarEspecialista(dniDocente);
    if (router.query.id) {
      getDataSeguimientoRetroalimentacionEspecialista(`${router.query.id}`, dniDocente);
      const history = await getHistorialEspecialista(`${router.query.id}`, dniDocente);
      setHistorialEspecialista(history);
      if (history.length > 0) {
        setShowSessionSelector(true);
      } else {
        // Si no hay historia, es una nueva evaluación automática
        setCurrentSessionId(null);
      }
    }
  };

  const handleStartNewEvaluation = () => {
    setCurrentSessionId(null);
    setShowSessionSelector(false);
    // Resetear estados locales para empezar de cero
    setCopyPR([...originalPR]);
    setRetroalimentacionDinamica([]);
    setHoraInicio(''); // Se capturará en el primer auto-save o al detectar cambios
  };

  const handleContinueEvaluation = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setShowSessionSelector(false);
    if (router.query.id) {
      getDataSeguimientoRetroalimentacionEspecialista(`${router.query.id}`, sessionId);
    }
  };

  const handleCerrarEspecialista = () => {
    isDataLoadedRef.current = false;
    resetEspecialista();
    setDniDocente('');
    setRetroalimentacionDinamica([]);
    setFechaMonitoreo(new Date().toISOString().split('T')[0]);
    setHoraInicio('');
    setHoraFinal('');
    setEmailEspecialista('');
    setCelularEspecialista('');
    setEmailMonitor(currentUserData?.email || '');
    setCelularMonitor(currentUserData?.celular || '');
    setCopyPR([...originalPR]);
    setCurrentSessionId(null);
    setHistorialEspecialista([]);
    setShowSessionSelector(false);
    setEspecialistasFiltrados(todosLosEspecialistas);
    setShowDropdown(false);
  };

  const defaultEscala = [
    { value: 0, alternativa: '0', descripcion: 'No evidencia' },
    { value: 1, alternativa: '1', descripcion: 'En proceso' },
    { value: 2, alternativa: '2', descripcion: 'Logrado' },
  ];

  const currentEscala =
    dataEvaluacionDocente?.escala && dataEvaluacionDocente.escala.length > 0
      ? dataEvaluacionDocente.escala
      : defaultEscala;

  //FUNCION DECTECCION DE CAMBIO DEL VALOR DE CHECKED
  const handleCheckedRespuesta = (
    value: string,
    preguntaIndex: number
  ) => {
    const updatedCopyPR = [...copyPR];

    // Reconstruir alternativas basándose en la escala actual
    updatedCopyPR[preguntaIndex] = {
      ...updatedCopyPR[preguntaIndex],
      alternativas: currentEscala.map((escala) => ({
        ...escala,
        selected: (escala.alternativa || '').toString() === value.toString(),
      })),
    };



    setCopyPR(updatedCopyPR);
  };

  const handleUploadEvidencia = async (e: React.ChangeEvent<HTMLInputElement>, preguntaIndex: number) => {
    const file = e.target.files?.[0];
    const pregunta = copyPR[preguntaIndex];
    const dniTarget = dataEspecialista?.dni || dataDirector?.dni;
    console.log("=== INICIO UPLOAD EVIDENCIA ===", { file, preguntaIndex, pregunta, evaluacionId: router.query.id, especialistaDni: dniTarget });

    if (!file || !router.query.id || !dniTarget || !pregunta) {
      console.warn("Faltan datos para subir la evidencia", {
        hasFile: !!file,
        hasEvaluacionId: !!router.query.id,
        hasEspecialistaDni: !!dniTarget,
        hasPregunta: !!pregunta
      });
      return;
    }

    try {
      console.log("Iniciando subida de archivo...");
      setUploadingMap(prev => ({ ...prev, [pregunta.id || '']: true }));
      // Usar sessionId si existe, sino DNI (fallback)
      const folderId = currentSessionId || dniTarget;
      const nuevaEvidencia = await uploadEvidencia(file, `${router.query.id}`, folderId, pregunta.id || '');

      console.log("URL de evidencia obtenida:", nuevaEvidencia);

      const updatedCopyPR = [...copyPR];
      const evidenciasActuales = updatedCopyPR[preguntaIndex].evidencias || [];
      const updatedPregunta = {
        ...updatedCopyPR[preguntaIndex],
        evidencias: [...evidenciasActuales, nuevaEvidencia]
      };
      updatedCopyPR[preguntaIndex] = updatedPregunta;
      setCopyPR(updatedCopyPR);

      console.log("=== FIN UPLOAD EVIDENCIA EXITOSO ===");
    } catch (error) {
      console.error("=== ERROR UPLOAD EVIDENCIA ===", error);
    } finally {
      setUploadingMap(prev => ({ ...prev, [pregunta.id || '']: false }));
    }
  };



  const handleDeleteEvidencia = async (preguntaIndex: number, evidenciaIndex: number) => {
    const pregunta = copyPR[preguntaIndex];
    const evidencia = pregunta.evidencias?.[evidenciaIndex];
    if (!evidencia) return;

    try {
      // Extraer la ruta del storage de la URL
      const decodedUrl = decodeURIComponent(evidencia.url);
      const storagePath = decodedUrl.split('/o/')[1].split('?')[0];

      await deleteEvidencia(storagePath);

      const updatedCopyPR = [...copyPR];
      const nuevasEvidencias = [...(updatedCopyPR[preguntaIndex].evidencias || [])];
      nuevasEvidencias.splice(evidenciaIndex, 1);
      updatedCopyPR[preguntaIndex] = {
        ...updatedCopyPR[preguntaIndex],
        evidencias: nuevasEvidencias
      };
      setCopyPR(updatedCopyPR);
    } catch (error) {
      console.error("Error delete:", error);
    }
  };


  // Funciones Retroalimentación Dinámica

  const handleAddFeedbackField = async () => {
    const updated = [...retroalimentacionDinamica, { etiqueta: 'NUEVA SECCIÓN', descripcion: '', contenido: '' }];
    setRetroalimentacionDinamica(updated);

    // Guardar cambio global en el molde de la evaluación
    if (router.query.id) {
      const nuevaConfig = updated.map(f => ({ etiqueta: f.etiqueta, descripcion: f.descripcion || '' }));
      await updateConfiguracionCamposRetro(`${router.query.id}`, nuevaConfig);
    }

  };

  const handleRemoveFeedbackField = async (index: number) => {
    const updated = [...retroalimentacionDinamica];
    updated.splice(index, 1);
    setRetroalimentacionDinamica(updated);

    // Guardar cambio global en el molde de la evaluación
    if (router.query.id) {
      const nuevaConfig = updated.map(f => ({ etiqueta: f.etiqueta, descripcion: f.descripcion || '' }));
      await updateConfiguracionCamposRetro(`${router.query.id}`, nuevaConfig);
    }

  };

  const handleChangeFeedbackLabel = async (index: number, newLabel: string) => {
    const updated = [...retroalimentacionDinamica];
    const anteriorLabel = updated[index].etiqueta;
    const nuevoLabel = newLabel.toUpperCase();
    updated[index].etiqueta = nuevoLabel;
    setRetroalimentacionDinamica(updated);

    // Si ha cambiado la etiqueta, actualizar el molde global de forma silenciosa
    if (router.query.id && anteriorLabel !== nuevoLabel) {
      const nuevaConfig = updated.map(f => ({ etiqueta: f.etiqueta, descripcion: f.descripcion || '' }));
      await updateConfiguracionCamposRetro(`${router.query.id}`, nuevaConfig, true);
    }
  };

  const handleChangeFeedbackDescription = async (index: number, newDescription: string) => {
    const updated = [...retroalimentacionDinamica];
    const anteriorDescripcion = updated[index].descripcion;
    updated[index].descripcion = newDescription;
    setRetroalimentacionDinamica(updated);

    // Si ha cambiado la descripción, la debouncemos al molde global
    if (router.query.id && anteriorDescripcion !== newDescription) {
      const nuevaConfig = updated.map(f => ({ etiqueta: f.etiqueta, descripcion: f.descripcion || '' }));
      await updateConfiguracionCamposRetro(`${router.query.id}`, nuevaConfig, true);
    }
  };

  const handleChangeFeedbackValue = (index: number, newValue: string) => {
    const updated = [...retroalimentacionDinamica];
    updated[index].contenido = newValue;
    setRetroalimentacionDinamica(updated);
  };

  const handleManualSaveFeedback = () => {
    handleAutoSave();
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        {/* Content */}
        <div className={styles.content}>
          <div className={styles.contentInner}>
            {loaderSalvarPregunta ? (
              <div className={styles.loadingContainer}>
                <RiLoader4Line className={styles.loadingIcon} />
                <span className={styles.loadingText}>Guardando evaluación...</span>
              </div>
            ) : (
              <>
                {/* Search Section — oculto en modo autorreporte (rol 1) */}
                <div className={styles.searchSection}>
                  {!dataDirector.dni && !isAutoreporte ? (
                    <div className={styles.searchForm}>
                      <div className={styles.searchInputContainer} ref={searchRef}>
                        <label className={styles.searchLabel}>Búsqueda de Especialista</label>
                        <input
                          name="dni"
                          className={styles.searchInput}
                          type="text"
                          placeholder="Nombre, apellidos o DNI"
                          value={dniDocente}
                          onChange={handleChangeDocente}
                          onClick={handleInputClick}
                          autoComplete="off"
                        />

                        {showDropdown && (
                          <div className={styles.searchDropdown}>
                            {especialistasFiltrados.length > 0 ? (
                              especialistasFiltrados.map((esp) => (
                                <div
                                  key={esp.id}
                                  className={styles.dropdownItem}
                                  onClick={() => handleSelectEspecialista(esp)}
                                >
                                  <div className={styles.dropdownItemMain}>
                                    {esp.apellidos?.toUpperCase()} {esp.nombres?.toUpperCase()}
                                  </div>
                                  <div className={styles.dropdownItemSub}>
                                    DNI: {esp.dni}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className={styles.noResults}>No se encontraron especialistas</div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className={styles.searchActions}>
                        <button
                          disabled={dniDocente.length === 0}
                          onClick={handleBuscardDocente}
                          className={styles.searchButton}
                        >
                          Buscar
                        </button>
                      </div>

                      {showSessionSelector && (
                        <div className={styles.sessionSelectorContainer}>
                          <h4 className={styles.sessionSelectorTitle}>Se encontraron evaluaciones previas:</h4>
                          <div className={styles.sessionOptions}>
                            <button onClick={handleStartNewEvaluation} className={styles.newSessionButton}>
                              Iniciar Nueva Evaluación
                            </button>
                            <div className={styles.historyList}>
                              <p className={styles.historyListTitle}>O continuar una anterior:</p>
                              {historialEspecialista.map((evaluacion, index) => (
                                <button
                                  key={evaluacion.id}
                                  onClick={() => handleContinueEvaluation(evaluacion.id!)}
                                  className={styles.historyItemButton}
                                >
                                  {evaluacion.fechaMonitoreo || 'Sin fecha'} - Puntaje: {evaluacion.calificacion || 0}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.premiumInfoContainer}>
                      {dataEvaluacionDocente?.faseNombre && (
                        <div className={styles.phaseBanner}>
                          <MdAssignment />
                          <span>Etapa de Evaluación Actual: <strong>{dataEvaluacionDocente.faseNombre}</strong></span>
                        </div>
                      )}
                      {!isAutoreporte && (
                        <>
                          <div className={styles.infoSectionHeader}>
                            <h3 className={styles.infoSectionTitle}>DATOS DEL(A) MONITOREADO (A):</h3>
                            <button
                              onClick={handleCerrarEspecialista}
                              className={styles.closeButton}
                              title="Cerrar especialista"
                            >
                              <RiCloseLine className={styles.closeIcon} />
                            </button>
                          </div>

                          <div className={styles.infoTable}>
                            <div className={styles.infoRow}>
                              <div className={styles.infoLabel}>UGEL:</div>
                              <div className={styles.infoValue}>{regionTexto(String(dataDirector.region || '')) || 'UGEL 01'}</div>
                            </div>
                            <div className={styles.infoRow}>
                              <div className={styles.infoLabel}>APELLIDOS Y NOMBRES:</div>
                              <div className={styles.infoValue}>{`${dataDirector.apellidos?.toUpperCase()} ${dataDirector.nombres?.toUpperCase()}`}</div>
                            </div>
                            <div className={styles.infoRowGroup}>
                              <div className={styles.infoRowItem}>
                                <div className={styles.infoLabel}>DNI:</div>
                                <div className={styles.infoValue}>{dataDirector.dni}</div>
                              </div>
                              <div className={styles.verticalRowItem}>
                                <div className={styles.labelVertical}>E-MAIL:</div>
                                <div className={styles.infoValue}>
                                  <textarea
                                    className={styles.compactTextarea}
                                    value={emailEspecialista}
                                    onChange={(e) => setEmailEspecialista(e.target.value)}
                                    placeholder="Ingrese e-mail"
                                    rows={2}
                                  />
                                </div>
                              </div>
                              <div className={styles.verticalRowItem}>
                                <div className={styles.labelVertical}>Nº CELULAR:</div>
                                <div className={styles.infoValue}>
                                  <textarea
                                    className={styles.compactTextarea}
                                    value={celularEspecialista}
                                    onChange={(e) => setCelularEspecialista(e.target.value)}
                                    placeholder="Ingrese celular"
                                    rows={2}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className={styles.infoSectionDivider}>DATOS DEL MONITOR:</div>

                          <div className={styles.infoTable}>
                            <div className={styles.infoRow}>
                              <div className={styles.infoLabel}>APELLIDOS Y NOMBRES:</div>
                              <div className={styles.infoValue}>{`${currentUserData?.apellidos?.toUpperCase() || ''} ${currentUserData?.nombres?.toUpperCase() || ''}`}</div>
                            </div>
                            <div className={styles.infoRowGroup}>
                              <div className={styles.infoRowItem}>
                                <div className={styles.infoLabelSmall}>DNI:</div>
                                <div className={styles.infoValueSmall}>{currentUserData?.dni || ''}</div>
                              </div>
                              <div className={styles.infoRowItem}>
                                <div className={styles.infoLabelSmall}>CARGO:</div>
                                <div className={styles.infoValueSmall}>{currentUserData?.cargo || 'MONITOR'}</div>
                              </div>
                              <div className={styles.verticalRowItem}>
                                <div className={styles.labelVertical}>E-MAIL:</div>
                                <div className={styles.infoValueSmall}>
                                  <textarea
                                    className={styles.compactTextarea}
                                    value={emailMonitor}
                                    onChange={(e) => setEmailMonitor(e.target.value)}
                                    placeholder="Ingrese e-mail"
                                    rows={2}
                                  />
                                </div>
                              </div>
                              <div className={styles.verticalRowItem}>
                                <div className={styles.labelVertical}>Nº CELULAR:</div>
                                <div className={styles.infoValueSmall}>
                                  <textarea
                                    className={styles.compactTextarea}
                                    value={celularMonitor}
                                    onChange={(e) => setCelularMonitor(e.target.value)}
                                    placeholder="Ingrese celular"
                                    rows={2}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className={styles.infoSectionDivider}>FECHA Y DURACIÓN:</div>

                          <div className={styles.infoTable}>
                            <div className={styles.infoRowGroup}>
                              <div className={styles.infoRowItem}>
                                <div className={styles.infoLabel}>FECHA:</div>
                                <div className={styles.infoValue}>
                                  <input
                                    type="date"
                                    className={styles.infoInput}
                                    value={fechaMonitoreo}
                                    onChange={(e) => setFechaMonitoreo(e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className={styles.infoRowItem}>
                                <div className={styles.infoLabel}>HORA INICIO:</div>
                                <div className={styles.infoValue}>
                                  <input
                                    type="time"
                                    className={styles.infoInput}
                                    value={horaInicio}
                                    onChange={(e) => setHoraInicio(e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className={styles.infoRowItem}>
                                <div className={styles.infoLabel}>FECHA FINAL:</div>
                                <div className={styles.infoValue}>
                                  <input
                                    type="time"
                                    className={styles.infoInput}
                                    value={horaFinal}
                                    onChange={(e) => setHoraFinal(e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Error Messages */}
                      <div className={styles.errorContainer}>
                        {warningDataDocente?.length > 0 && (
                          <div className={styles.errorMessage}>
                            <span className={styles.errorText}>{warningDataDocente}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form con Tabla */}
                <form onSubmit={handleSalvarPreguntaDocente} className={styles.form}>

                  <div className={styles.tableContainer}>
                    <table className={styles.evaluationTable}>
                      <thead>
                        <tr>
                          <th className={styles.colNumber}>№</th>
                          <th className={styles.colCriterio}>CRITERIO</th>
                          {currentEscala.map((escala) => (
                            <th key={escala.alternativa} className={styles.colValue}>
                              {escala.value}
                            </th>
                          ))}
                          {dataEvaluacionDocente?.activarEvidencias && (
                            <th className={styles.evidenceHeader}>EVIDENCIA</th>
                          )}

                        </tr>
                      </thead>
                      <tbody>
                        {dimensionesEspecialistas && dimensionesEspecialistas.length > 0 ? (
                          dimensionesEspecialistas.map((dimension) => {
                            const preguntasDimension = copyPR.filter(
                              (p) => p.dimensionId === dimension.id
                            );
                            if (preguntasDimension.length === 0) return null;

                            return (
                              <React.Fragment key={dimension.id}>
                                <tr className={styles.dimensionRow}>
                                  <td colSpan={2 + currentEscala.length + (dataEvaluacionDocente?.activarEvidencias ? 1 : 0)} className={styles.dimensionTitle}>
                                    {dimension.nombre}
                                  </td>

                                </tr>
                                {preguntasDimension.map((pregunta) => {
                                  const realIndex = copyPR.findIndex((p) => p.id === pregunta.id);
                                  return (
                                    <tr key={pregunta.id} id={`question-${realIndex}`} className={styles.questionRow}>
                                      <td className={styles.cellNumber}>{pregunta.order}</td>
                                      <td className={styles.cellCriterio}>{pregunta.criterio}</td>
                                      {currentEscala.map((escala) => {
                                        const val = escala.alternativa || '';
                                        const alt = pregunta.alternativas?.find(
                                          (a) => a.alternativa === val
                                        );
                                        return (
                                          <td key={val} className={styles.cellRadio}>
                                            <input
                                              type="radio"
                                              name={`question-${pregunta.id}`}
                                              value={val}
                                              checked={alt?.selected || false}
                                              onChange={() => {
                                                handleCheckedRespuesta(val, realIndex);
                                              }}
                                              className={styles.radioInput}
                                            />
                                          </td>

                                        );
                                      })}
                                      {dataEvaluacionDocente?.activarEvidencias && (
                                        <td className={styles.evidenceCell}>
                                          <div className={styles.evidenceContainer}>

                                            {pregunta.requiereEvidencia && (
                                              <div className={styles.evidenceList}>
                                                {pregunta.evidencias?.map((ev, idx) => (
                                                  <div key={idx} className={styles.evidenceItem}>
                                                    <div className={styles.fileDetails}>
                                                      {ev.tipo.startsWith('image/') ? (
                                                        <a href={ev.url} target="_blank" rel="noopener noreferrer" className={styles.thumbnailLink}>
                                                          <div className={styles.thumbnailContainer}>
                                                            <img src={ev.url} alt={ev.nombre} className={styles.thumbnail} />
                                                          </div>
                                                        </a>
                                                      ) : (
                                                        <MdFilePresent className={styles.fileIcon} />
                                                      )}
                                                      <a href={ev.url} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                                                        {ev.nombre.length > 15 ? ev.nombre.substring(0, 15) + '...' : ev.nombre}
                                                      </a>
                                                      <span className={styles.fileMetaInfo}>
                                                        ({ev.tipo.split('/')[1] || ev.tipo})
                                                      </span>
                                                    </div>
                                                    <button type="button" onClick={() => handleDeleteEvidencia(realIndex, idx)} className={styles.deleteFileButton}>
                                                      <MdDelete />
                                                    </button>
                                                  </div>
                                                ))}

                                                {uploadingMap[pregunta.id || ''] ? (
                                                  <div className={styles.localLoader}>
                                                    <RiLoader4Line className={styles.spinner} />
                                                    <span>Subiendo...</span>
                                                  </div>
                                                ) : (
                                                  <label className={`${styles.uploadButton} ${!(dataEspecialista?.dni || dataDirector?.dni) ? styles.uploadButtonDisabled : ''}`}>
                                                    <MdCloudUpload /> subir evidencia
                                                    <input
                                                      type="file"
                                                      style={{ display: 'none' }}
                                                      disabled={!(dataEspecialista?.dni || dataDirector?.dni)}
                                                      onChange={(e) => handleUploadEvidencia(e, realIndex)}
                                                    />
                                                  </label>
                                                )}
                                              </div>
                                            )}

                                          </div>
                                        </td>

                                      )}

                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })
                        ) : (
                          copyPR.map((pregunta, index) => (
                            <tr key={pregunta.id} id={`question-${index}`} className={styles.questionRow}>
                              <td className={styles.cellNumber}>{index + 1}</td>
                              <td className={styles.cellCriterio}>{pregunta.criterio}</td>
                              {currentEscala.map((escala) => {
                                const val = escala.alternativa || '';
                                const alt = pregunta.alternativas?.find(
                                  (a) => (a.alternativa || '').toString() === val.toString()
                                );
                                return (
                                  <td key={val} className={styles.cellRadio}>
                                    <input
                                      type="radio"
                                      name={`question-${pregunta.id}`}
                                      value={val}
                                      checked={alt?.selected || false}
                                      onChange={() => {
                                        handleCheckedRespuesta(val, index);
                                      }}
                                      className={styles.radioInput}
                                    />
                                  </td>
                                );
                              })}
                              {dataEvaluacionDocente?.activarEvidencias && (
                                <td className={styles.evidenceCell}>
                                  <div className={styles.evidenceContainer}>
                                    {pregunta.requiereEvidencia && (
                                      <span className={styles.evidenceDescription}>
                                        {pregunta.descripcionEvidencia || 'Cargar evidencia'}
                                      </span>
                                    )}
                                    {pregunta.requiereEvidencia && (
                                      <div className={styles.evidenceList}>
                                        {pregunta.evidencias?.map((ev, idx) => (
                                          <div key={idx} className={styles.evidenceItem}>
                                            <div className={styles.fileDetails}>
                                              {ev.tipo.startsWith('image/') ? (
                                                <a href={ev.url} target="_blank" rel="noopener noreferrer" className={styles.thumbnailLink}>
                                                  <div className={styles.thumbnailContainer}>
                                                    <img src={ev.url} alt={ev.nombre} className={styles.thumbnail} />
                                                  </div>
                                                </a>
                                              ) : (
                                                <MdFilePresent className={styles.fileIcon} />
                                              )}
                                              <a href={ev.url} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                                                {ev.nombre.length > 15 ? ev.nombre.substring(0, 15) + '...' : ev.nombre}
                                              </a>
                                              <span className={styles.fileMetaInfo}>
                                                ({ev.tipo.split('/')[1] || ev.tipo})
                                              </span>
                                            </div>
                                            <button type="button" onClick={() => handleDeleteEvidencia(index, idx)} className={styles.deleteFileButton}>
                                              <MdDelete />
                                            </button>
                                          </div>
                                        ))}

                                        {uploadingMap[pregunta.id || ''] ? (
                                          <div className={styles.localLoader}>
                                            <RiLoader4Line className={styles.spinner} />
                                            <span>Subiendo...</span>
                                          </div>
                                        ) : (
                                          <label className={`${styles.uploadButton} ${!(dataEspecialista?.dni || dataDirector?.dni) ? styles.uploadButtonDisabled : ''}`}>
                                            <MdCloudUpload /> {!(dataEspecialista?.dni || dataDirector?.dni) ? 'Seleccione especialista' : 'Subir archivo'}
                                            <input
                                              type="file"
                                              style={{ display: 'none' }}
                                              disabled={!(dataEspecialista?.dni || dataDirector?.dni)}
                                              onChange={(e) => handleUploadEvidencia(e, index)}
                                            />
                                          </label>
                                        )}
                                      </div>
                                    )}

                                  </div>
                                </td>

                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Retroalimentación Cualitativa Dinámica */}
                  <div className={styles.feedbackSection}>
                    <div className={styles.feedbackHeader}>
                      <h3 className={styles.feedbackTitle}>RETROALIMENTACIÓN CUALITATIVA</h3>
                      {!isAutoreporte && (
                        <div className={styles.feedbackActions}>
                          <button
                            type="button"
                            onClick={handleAddFeedbackField}
                            className={styles.addFieldButton}
                          >
                            + Agregar campo
                          </button>
                        </div>
                      )}
                    </div>

                    <div className={styles.feedbackGrid}>
                      {retroalimentacionDinamica.map((item, index) => (
                        <div key={index} className={styles.feedbackGroup}>
                          <div className={styles.labelWrapper}>
                            <input
                              className={styles.editableLabel}
                              value={item.etiqueta}
                              onChange={(e) => handleChangeFeedbackLabel(index, e.target.value)}
                              placeholder="Título del campo..."
                              readOnly={isAutoreporte}
                            />
                            {!isAutoreporte && (
                              <button
                                type="button"
                                onClick={() => handleRemoveFeedbackField(index)}
                                className={styles.removeFieldButton}
                                title="Eliminar campo"
                              >
                                <RiCloseLine />
                              </button>
                            )}
                          </div>

                          {/* Textarea descriptiva: editable para admin/monitor, solo lectura para especialista */}
                          {item.descripcion && (
                            <div className={styles.descriptionWrapper}>
                              <textarea
                                className={styles.editableDescription}
                                value={item.descripcion || ''}
                                onChange={(e) => !isAutoreporte && handleChangeFeedbackDescription(index, e.target.value)}
                                placeholder="Ej. Aquí debe detallar en qué situaciones el especialista presentó un déficit..."
                                rows={2}
                                readOnly={isAutoreporte}
                              />
                            </div>
                          )}

                          <textarea
                            className={styles.feedbackTextarea}
                            placeholder={`Describa ${item.etiqueta.toLowerCase()}...`}
                            value={item.contenido}
                            onChange={(e) => handleChangeFeedbackValue(index, e.target.value)}
                            rows={4}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      {!loaderSalvarPregunta && (
        <div className={styles.bottomButtonContainer}>
          <div className={styles.bottomButtonWrapper}>
            <div className={styles.bottomButtonContainerInner}>
              <button type="button" onClick={handleGuardarClick} className={styles.saveButton} disabled={isAutoreporte}>
                Guardar Evaluación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluarEspecialista;
