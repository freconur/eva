import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { PRDocentes, respuestaPsicolinguistica, User } from '@/features/types/types';
import { RiLoader4Line, RiCloseLine } from 'react-icons/ri';
import { usePsicolinguistica } from '@/features/hooks/usePsicolinguistica';
import React, { useState, useEffect } from 'react';
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
  const [avances, setAvances] = useState<string>('');
  const [dificultades, setDificultades] = useState<string>('');
  const [compromisos, setCompromisos] = useState<string>('');
  const [fechaMonitoreo, setFechaMonitoreo] = useState<string>(new Date().toISOString().split('T')[0]);
  const [horaInicio, setHoraInicio] = useState<string>('');
  const [horaFinal, setHoraFinal] = useState<string>('');
  const [emailEspecialista, setEmailEspecialista] = useState<string>('');
  const [celularEspecialista, setCelularEspecialista] = useState<string>('');
  const [emailMonitor, setEmailMonitor] = useState<string>('');
  const [celularMonitor, setCelularMonitor] = useState<string>('');

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
  } = UseEvaluacionEspecialistas();

  // Cargar datos del monitor inicialmente
  useEffect(() => {
    if (currentUserData) {
      setEmailMonitor(currentUserData.email || '');
      setCelularMonitor(currentUserData.celular || '');
    }
  }, [currentUserData?.dni]);

  // Cargar datos de la evaluación al montar el componente
  useEffect(() => {
    if (router.query.id) {
      getPreguntasRespuestasEspecialistas(`${router.query.id}`);
      getDimensionesEspecialistas(`${router.query.id}`);
      getDataEvaluacion(`${router.query.id}`);
    }
  }, [router.query.id]);

  useEffect(() => {
    if (getPreguntaRespuestaDocentes && getPreguntaRespuestaDocentes.length > 0) {
      setOriginalPR([...getPreguntaRespuestaDocentes]);
      setCopyPR(getPreguntaRespuestaDocentes);
    }
  }, [getPreguntaRespuestaDocentes]);

  // Cargar evaluación existente si se encuentra (Smart Search)
  useEffect(() => {
    // Solo disparar si dataDirector.dni existe (búsqueda confirmada) y coincide con dataEspecialista
    if (dataDirector.dni && dataEspecialista && dataEspecialista.dni === dataDirector.dni) {
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
              }))
            };
          }
          return pregunta;
        });
        setCopyPR(copyPRConRespuestas);
      }

      // Cargar retroalimentación cualitativa
      if (dataEspecialista.avancesRetroalimentacion) setAvances(dataEspecialista.avancesRetroalimentacion);
      if (dataEspecialista.dificultadesRetroalimentacion) setDificultades(dataEspecialista.dificultadesRetroalimentacion);
      if (dataEspecialista.compromisosRetroalimentacion) setCompromisos(dataEspecialista.compromisosRetroalimentacion);

      // Cargar datos de monitoreo
      if (dataEspecialista.fechaMonitoreo) setFechaMonitoreo(dataEspecialista.fechaMonitoreo);
      if (dataEspecialista.horaInicio) setHoraInicio(dataEspecialista.horaInicio);
      if (dataEspecialista.horaFinal) setHoraFinal(dataEspecialista.horaFinal);
      if (dataEspecialista.email) setEmailEspecialista(dataEspecialista.email);
      if (dataEspecialista.celular) setCelularEspecialista(dataEspecialista.celular);
      if (dataEspecialista.datosMonitor?.email) setEmailMonitor(dataEspecialista.datosMonitor.email);
      if (dataEspecialista.datosMonitor?.celular) setCelularMonitor(dataEspecialista.datosMonitor.celular);
    }
  }, [dataEspecialista, dataDirector.dni]);

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
    }
  }, [dataDirector.dni]);


  const activeButtonGuardar = () => {
    return copyPR.every((pregunta) => pregunta.alternativas?.some((alt) => alt.selected === true));
  };


  const handleSalvarPreguntaDocente = (e: React.ChangeEvent<HTMLFormElement>) => {
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

      guardarEvaluacionEspecialistas(
        `${router.query.id}`,
        copyPR,
        especialistaActualizado,
        avances,
        dificultades,
        compromisos,
        fechaMonitoreo,
        horaInicio,
        now, // Usar la hora capturada justo antes
        datosMonitorActualizados
      );
      setCopyPR([...originalPR]);
      setAvances('');
      setDificultades('');
      setCompromisos('');
      setDniDocente('');
      setHoraInicio('');
      setHoraFinal('');
      setEmailEspecialista('');
      setCelularEspecialista('');
      setEmailMonitor(currentUserData?.email || '');
      setCelularMonitor(currentUserData?.celular || '');
      resetEspecialista();
    }
  };

  const handleGuardarClick = () => {
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

      guardarEvaluacionEspecialistas(
        `${router.query.id}`,
        copyPR,
        especialistaActualizado,
        avances,
        dificultades,
        compromisos,
        fechaMonitoreo,
        horaInicio,
        now, // Usar la hora capturada justo antes
        datosMonitorActualizados
      );
      setCopyPR([...originalPR]);
      setAvances('');
      setDificultades('');
      setCompromisos('');
      setDniDocente('');
      setHoraInicio('');
      setHoraFinal('');
      setEmailEspecialista('');
      setCelularEspecialista('');
      setEmailMonitor(currentUserData?.email || '');
      setCelularMonitor(currentUserData?.celular || '');
      resetEspecialista();
    }
  };

  const handleChangeDocente = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDniDocente(value);

    // Si el usuario está escribiendo, limpiamos el estado previo para evitar auto-llenados visuales
    if (dataEspecialista.dni || dataDirector.dni) {
      resetEspecialista();
      setCopyPR([...originalPR]);
      setAvances('');
      setDificultades('');
      setCompromisos('');
      setEmailEspecialista('');
      setCelularEspecialista('');
    }
  };

  const handleBuscardDocente = () => {
    buscarEspecialista(dniDocente);
    if (router.query.id) {
      getDataSeguimientoRetroalimentacionEspecialista(`${router.query.id}`, dniDocente);
    }
  };

  const handleCerrarEspecialista = () => {
    resetEspecialista();
    setDniDocente('');
    setAvances('');
    setDificultades('');
    setCompromisos('');
    setFechaMonitoreo(new Date().toISOString().split('T')[0]);
    setHoraInicio('');
    setHoraFinal('');
    setEmailEspecialista('');
    setCelularEspecialista('');
    setEmailMonitor(currentUserData?.email || '');
    setCelularMonitor(currentUserData?.celular || '');
    setCopyPR([...originalPR]);
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
                {/* Search Section */}
                <div className={styles.searchSection}>
                  {!dataDirector.dni ? (
                    <div className={styles.searchForm}>
                      <div className={styles.searchInputContainer}>
                        <label className={styles.searchLabel}>Número de DNI</label>
                        <input
                          name="dni"
                          className={styles.searchInput}
                          type="number"
                          placeholder="Ingrese el DNI del especialista"
                          onChange={handleChangeDocente}
                          maxLength={8}
                        />
                        <div className={styles.inputCounter}>{dniDocente.length}/8</div>
                      </div>
                      <div className={styles.searchActions}>
                        <button
                          disabled={dniDocente.length !== 8}
                          onClick={handleBuscardDocente}
                          className={styles.searchButton}
                        >
                          Buscar Especialista
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.premiumInfoContainer}>
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
                    </div>
                  )}

                  {/* Error Messages */}
                  <div className={styles.errorContainer}>
                    {dniDocente.length !== 8 && dniDocente.length > 0 && (
                      <div className={styles.errorMessage}>
                        <span className={styles.errorText}>
                          El DNI debe tener exactamente 8 dígitos
                        </span>
                      </div>
                    )}
                    {warningDataDocente?.length > 0 && (
                      <div className={styles.errorMessage}>
                        <span className={styles.errorText}>{warningDataDocente}</span>
                      </div>
                    )}
                  </div>
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
                              {escala.alternativa}
                            </th>
                          ))}
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
                                  <td colSpan={5} className={styles.dimensionTitle}>
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
                                        handleCheckedRespuesta(val, index);
                                      }}
                                      className={styles.radioInput}
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Retroalimentación Cualitativa */}
                  <div className={styles.feedbackSection}>
                    <div className={styles.feedbackGroup}>
                      <label className={styles.feedbackLabel}>AVANCES:</label>
                      <textarea
                        className={styles.feedbackTextarea}
                        placeholder="Describa los avances observados..."
                        value={avances}
                        onChange={(e) => setAvances(e.target.value)}
                      />
                    </div>
                    <div className={styles.feedbackGroup}>
                      <label className={styles.feedbackLabel}>DIFICULTADES:</label>
                      <textarea
                        className={styles.feedbackTextarea}
                        placeholder="Describa las dificultades encontradas..."
                        value={dificultades}
                        onChange={(e) => setDificultades(e.target.value)}
                      />
                    </div>
                    <div className={styles.feedbackGroup}>
                      <label className={styles.feedbackLabel}>COMPROMISOS:</label>
                      <textarea
                        className={styles.feedbackTextarea}
                        placeholder="Describa los compromisos asumidos..."
                        value={compromisos}
                        onChange={(e) => setCompromisos(e.target.value)}
                      />
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
              <button type="button" onClick={handleGuardarClick} className={styles.saveButton}>
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
