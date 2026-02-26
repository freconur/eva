import { useGlobalContext } from '@/features/context/GlolbalContext'
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { PRDocentes } from '@/features/types/types'
import { RiLoader4Line, RiSkipForwardLine, RiCloseLine } from 'react-icons/ri'
import { usePsicolinguistica } from '@/features/hooks/usePsicolinguistica'
import Link from 'next/link'
import { IoArrowBack } from 'react-icons/io5'
import Loader from '@/components/loader/loader'
import styles from '../evaluar-especialista/evaluarEspecialista.module.css'

const ACtualizarEvaluacion = () => {
    const router = useRouter()
    const {
        getPreguntasRespuestasEspecialistas,
        getDataSeguimientoRetroalimentacionEspecialista,
        guardarEvaluacionEspecialistas,
        resetEspecialista,
        dataEspecialista,
        updateEvaluacionEspecialistaSeguimientoRetroalimentacion,
        valueLoader,
        getDataEvaluacion
    } = UseEvaluacionEspecialistas()
    const {
        getPreguntaRespuestaDocentes,
        loaderSalvarPregunta,
        dataDirector,
        dataEvaluacionDocente,
        currentUserData
    } = useGlobalContext()

    const [originalPR, setOriginalPR] = useState<PRDocentes[]>([])
    const [copyPR, setCopyPR] = useState<PRDocentes[]>([])
    const [autoNavigate, setAutoNavigate] = useState<boolean>(true)
    const [avances, setAvances] = useState<string>('')
    const [dificultades, setDificultades] = useState<string>('')
    const [compromisos, setCompromisos] = useState<string>('')
    const [fechaMonitoreo, setFechaMonitoreo] = useState<string>('')
    const [horaInicio, setHoraInicio] = useState<string>('')
    const [horaFinal, setHoraFinal] = useState<string>('')
    const [emailEspecialista, setEmailEspecialista] = useState<string>('')
    const [celularEspecialista, setCelularEspecialista] = useState<string>('')
    const [emailMonitor, setEmailMonitor] = useState<string>('')
    const [celularMonitor, setCelularMonitor] = useState<string>('')

    useEffect(() => {
        getPreguntasRespuestasEspecialistas(`${router.query.idEvaluacion}`)
        getDataSeguimientoRetroalimentacionEspecialista(`${router.query.idEvaluacion}`, `${router.query.dni}`)
        getDataEvaluacion(`${router.query.idEvaluacion}`)
    }, [router.query.dni, router.query.idEvaluacion])

    // Actualizar copyPR cuando getPreguntaRespuestaDocentes cambie
    useEffect(() => {
        if (getPreguntaRespuestaDocentes && getPreguntaRespuestaDocentes.length > 0) {
            setOriginalPR([...getPreguntaRespuestaDocentes])
            setCopyPR(getPreguntaRespuestaDocentes)
        }
    }, [getPreguntaRespuestaDocentes])

    // Cargar las respuestas y retroalimentación del especialista
    useEffect(() => {
        if (dataEspecialista && copyPR.length > 0) {
            if (dataEspecialista.resultadosSeguimientoRetroalimentacion) {
                const respuestasEspecialista = dataEspecialista.resultadosSeguimientoRetroalimentacion;
                const copyPRConRespuestas = copyPR.map((pregunta) => {
                    const respuestaEspecialista = respuestasEspecialista.find(
                        (respuesta) => respuesta.order === pregunta.order
                    );
                    if (respuestaEspecialista && respuestaEspecialista.alternativas) {
                        return {
                            ...pregunta,
                            alternativas: pregunta.alternativas?.map((alternativa) => ({
                                ...alternativa,
                                selected: respuestaEspecialista.alternativas?.find(
                                    (alt) => alt.alternativa === alternativa.alternativa
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
    }, [dataEspecialista, copyPR.length])


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
    const handleAlternativeChange = (preguntaIndex: number, value: string) => {
        setCopyPR(prevPR => {
            const newPR = [...prevPR];

            // Reconstruir alternativas basándose en la escala actual
            newPR[preguntaIndex] = {
                ...newPR[preguntaIndex],
                alternativas: currentEscala.map((escala) => ({
                    ...escala,
                    selected: (escala.alternativa || '').toString() === value.toString(),
                })),
            };

            return newPR;
        });
    };

    //FUNCION PARA ACTUALIZAR LA EVALUACION
    const handleUpdateEvaluacion = async () => {
        if (!dataEspecialista || !router.query.idEvaluacion || !router.query.dni) {
            console.error('Faltan datos necesarios para actualizar la evaluación');
            return;
        }

        try {
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            setHoraFinal(now);
            // Crear el objeto actualizado con las nuevas respuestas
            const especialistaActualizado = {
                ...dataEspecialista,
                resultadosSeguimientoRetroalimentacion: copyPR.map(pregunta => ({
                    order: pregunta.order,
                    criterio: pregunta.criterio,
                    alternativas: pregunta.alternativas?.filter(alt => alt.selected) || []
                })),
                avancesRetroalimentacion: avances,
                dificultadesRetroalimentacion: dificultades,
                compromisosRetroalimentacion: compromisos,
                fechaMonitoreo: fechaMonitoreo,
                horaInicio: horaInicio,
                horaFinal: now,
                email: emailEspecialista,
                celular: celularEspecialista,
                datosMonitor: {
                    ...(dataEspecialista.datosMonitor || currentUserData || {}),
                    email: emailMonitor,
                    celular: celularMonitor
                }
            };

            await updateEvaluacionEspecialistaSeguimientoRetroalimentacion(
                router.query.idEvaluacion as string,
                router.query.dni as string,
                especialistaActualizado
            );

            // Opcional: mostrar mensaje de éxito o redirigir
            console.log('Evaluación actualizada exitosamente');
        } catch (error) {
            console.error('Error al actualizar la evaluación:', error);
        }
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
                                {/* Redesigned Header Section */}
                                <div className={styles.searchSection}>
                                    {dataEspecialista.dni ? (
                                        <div className={styles.premiumInfoContainer}>
                                            <div className={styles.infoSectionHeader}>
                                                <h3 className={styles.infoSectionTitle}>DATOS DEL(A) MONITOREADO (A):</h3>
                                            </div>

                                            <div className={styles.infoTable}>
                                                <div className={styles.infoRow}>
                                                    <div className={styles.infoLabel}>UGEL:</div>
                                                    <div className={styles.infoValue}>{dataEspecialista.institucion || 'UGEL 01'}</div>
                                                </div>
                                                <div className={styles.infoRow}>
                                                    <div className={styles.infoLabel}>APELLIDOS Y NOMBRES:</div>
                                                    <div className={styles.infoValue}>{`${dataEspecialista.apellidos?.toUpperCase()} ${dataEspecialista.nombres?.toUpperCase()}`}</div>
                                                </div>
                                                <div className={styles.infoRowGroup}>
                                                    <div className={styles.infoRowItem}>
                                                        <div className={styles.infoLabel}>DNI:</div>
                                                        <div className={styles.infoValue}>{dataEspecialista.dni}</div>
                                                    </div>
                                                    <div className={styles.infoRowItem}>
                                                        <div className={styles.infoLabel}>E-MAIL:</div>
                                                        <div className={styles.infoValue}>
                                                            <input
                                                                type="email"
                                                                className={styles.infoInput}
                                                                value={emailEspecialista}
                                                                onChange={(e) => setEmailEspecialista(e.target.value)}
                                                                placeholder="Ingrese e-mail"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className={styles.infoRowItem}>
                                                        <div className={styles.infoLabel}>Nº CELULAR:</div>
                                                        <div className={styles.infoValue}>
                                                            <input
                                                                type="tel"
                                                                className={styles.infoInput}
                                                                value={celularEspecialista}
                                                                onChange={(e) => setCelularEspecialista(e.target.value)}
                                                                placeholder="Ingrese celular"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={styles.infoSectionDivider}>DATOS DEL MONITOR:</div>

                                            <div className={styles.infoTable}>
                                                <div className={styles.infoRow}>
                                                    <div className={styles.infoLabel}>APELLIDOS Y NOMBRES:</div>
                                                    <div className={styles.infoValue}>
                                                        {`${dataEspecialista.datosMonitor?.apellidos?.toUpperCase() || ''} ${dataEspecialista.datosMonitor?.nombres?.toUpperCase() || ''}`}
                                                    </div>
                                                </div>
                                                <div className={styles.infoRowGroup}>
                                                    <div className={styles.infoRowItem}>
                                                        <div className={styles.infoLabelSmall}>DNI:</div>
                                                        <div className={styles.infoValueSmall}>{dataEspecialista.datosMonitor?.dni || ''}</div>
                                                    </div>
                                                    <div className={styles.infoRowItem}>
                                                        <div className={styles.infoLabelSmall}>CARGO:</div>
                                                        <div className={styles.infoValueSmall}>{dataEspecialista.datosMonitor?.cargo || 'MONITOR'}</div>
                                                    </div>
                                                    <div className={styles.infoRowItem}>
                                                        <div className={styles.infoLabelSmall}>E-MAIL:</div>
                                                        <div className={styles.infoValueSmall}>
                                                            <input
                                                                type="email"
                                                                className={styles.infoInput}
                                                                value={emailMonitor}
                                                                onChange={(e) => setEmailMonitor(e.target.value)}
                                                                placeholder="Ingrese e-mail"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className={styles.infoRowItem}>
                                                        <div className={styles.infoLabelSmall}>Nº CELULAR:</div>
                                                        <div className={styles.infoValueSmall}>
                                                            <input
                                                                type="tel"
                                                                className={styles.infoInput}
                                                                value={celularMonitor}
                                                                onChange={(e) => setCelularMonitor(e.target.value)}
                                                                placeholder="Ingrese celular"
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
                                    ) : (
                                        <div className={styles.searchForm}>
                                            <div className={styles.searchInputContainer}>
                                                <label className={styles.searchLabel}>Cargando datos del especialista...</label>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Form con Tabla (Updated to match EvaluarEspecialista) */}
                                <form className={styles.form}>

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
                                                {copyPR.map((pregunta, index) => (
                                                    <tr key={pregunta.id} id={`question-${index}`} className={styles.questionRow}>
                                                        <td className={styles.cellNumber}>{index + 1}</td>
                                                        <td className={styles.cellCriterio}>{pregunta.criterio}</td>
                                                        {currentEscala.map((escala) => {
                                                            const val = (escala.alternativa || '').toString();
                                                            const isSelected = pregunta.alternativas?.find(
                                                                (alt) => alt.alternativa?.toString() === val
                                                            )?.selected;
                                                            return (
                                                                <td key={val} className={styles.cellRadio}>
                                                                    <input
                                                                        type="radio"
                                                                        name={`question-${pregunta.id}`}
                                                                        value={val}
                                                                        checked={isSelected || false}
                                                                        onChange={() => handleAlternativeChange(index, val)}
                                                                        className={styles.radioInput}
                                                                    />
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
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
                            <button
                                type="button"
                                className={styles.saveButton}
                                onClick={handleUpdateEvaluacion}
                                disabled={valueLoader}
                            >
                                {valueLoader ? (
                                    <>
                                        <Loader
                                            size="small"
                                            variant="spinner"
                                            color="#ffffff"
                                        />
                                        <span>Actualizando...</span>
                                    </>
                                ) : (
                                    "Actualizar Evaluación"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ACtualizarEvaluacion