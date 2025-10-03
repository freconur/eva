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
    const { getPreguntaRespuestaDocentes, loaderSalvarPregunta, dataDirector } = useGlobalContext()
    const { getPreguntasRespuestasEspecialistas, getDataSeguimientoRetroalimentacionEspecialista, guardarEvaluacionEspecialistas, resetEspecialista, dataEspecialista,updateEvaluacionEspecialistaSeguimientoRetroalimentacion, valueLoader } = UseEvaluacionEspecialistas()
    
    const [originalPR, setOriginalPR] = useState<PRDocentes[]>([])
    const [copyPR, setCopyPR] = useState<PRDocentes[]>([])
    const [autoNavigate, setAutoNavigate] = useState<boolean>(true)

    useEffect(() => {
        getPreguntasRespuestasEspecialistas(`${router.query.idEvaluacion}`)
        getDataSeguimientoRetroalimentacionEspecialista(`${router.query.idEvaluacion}`, `${router.query.dni}`)
    },[router.query.dni, router.query.idEvaluacion])

    // Actualizar copyPR cuando getPreguntaRespuestaDocentes cambie
    useEffect(() => {
        if (getPreguntaRespuestaDocentes && getPreguntaRespuestaDocentes.length > 0) {
            setOriginalPR([...getPreguntaRespuestaDocentes])
            setCopyPR(getPreguntaRespuestaDocentes)
        }
    }, [getPreguntaRespuestaDocentes])

    // Cargar las respuestas previamente seleccionadas del especialista
    useEffect(() => {
        if (dataEspecialista?.resultadosSeguimientoRetroalimentacion && copyPR.length > 0) {
            const respuestasEspecialista = dataEspecialista.resultadosSeguimientoRetroalimentacion;
            
            // Crear una copia de copyPR con las respuestas del especialista
            const copyPRConRespuestas = copyPR.map((pregunta) => {
                // Buscar la respuesta correspondiente del especialista
                const respuestaEspecialista = respuestasEspecialista.find(
                    (respuesta) => respuesta.order === pregunta.order
                );
                
                if (respuestaEspecialista && respuestaEspecialista.alternativas) {
                    // Actualizar las alternativas con las selecciones del especialista
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
    }, [dataEspecialista?.resultadosSeguimientoRetroalimentacion, copyPR.length])


    //FUNCION DECTECCION DE CAMBIO DEL VALOR DE CHECKED
    const handleAlternativeChange = (preguntaIndex: number, alternativaIndex: number) => {
        console.log('Cambiando alternativa:', preguntaIndex, alternativaIndex);
        setCopyPR(prevPR => {
            const newPR = [...prevPR];
            const pregunta = newPR[preguntaIndex];
            
            // Desmarcar todas las alternativas de esta pregunta
            pregunta.alternativas = pregunta.alternativas?.map(alt => ({
                ...alt,
                selected: false
            }));
            
            // Marcar solo la alternativa seleccionada
            if (pregunta.alternativas && pregunta.alternativas[alternativaIndex]) {
                pregunta.alternativas[alternativaIndex].selected = true;
            }
            
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
            // Crear el objeto actualizado con las nuevas respuestas
            const especialistaActualizado = {
                ...dataEspecialista,
                resultadosSeguimientoRetroalimentacion: copyPR.map(pregunta => ({
                    order: pregunta.order,
                    criterio: pregunta.criterio,
                    alternativas: pregunta.alternativas?.filter(alt => alt.selected) || []
                }))
            };

            await updateEvaluacionEspecialistaSeguimientoRetroalimentacion(
                router.query.idEvaluacion as string,
                router.query.dni as string,
                especialistaActualizado
            );

            // Opcional: mostrar mensaje de éxito o redirigir
            console.log('Evaluación actualizada exitosamente');
            // Aquí podrías agregar un toast de éxito o redirección
        } catch (error) {
            console.error('Error al actualizar la evaluación:', error);
        }
    };

    //FUNCION PARA QUE ME CREE LAS RESPUESTAS DE SI O NO
    const preguntaRespuestaFunction = (data: PRDocentes[], preguntaIndex: number) => {
        return (
            <>
                {data.length >= 0 &&
                    data[preguntaIndex]?.alternativas?.map((alter, index) => {
                        return (
                            <div
                                key={index}
                                className={styles.alternativeItem}
                                onClick={() => handleAlternativeChange(preguntaIndex, index)}
                            >
                                <div className={styles.radioContainer}>
                                    <input
                                        className={styles.radioInput}
                                        type="radio"
                                        name={`${data[preguntaIndex]?.order}`}
                                        value={alter.alternativa}
                                        checked={alter.selected}
                                        onChange={() => handleAlternativeChange(preguntaIndex, index)}
                                    />
                                </div>
                                <div className={styles.alternativeContent}>
                                    <label className={styles.alternativeLabel}>
                                        <span className={styles.alternativeLetter}>{`${alter.alternativa})`}</span>
                                        <span className={styles.alternativeDescription}>{alter.descripcion}</span>
                                    </label>
                                </div>
                            </div>
                        );
                    })}
            </>
        );
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
                                    {dataEspecialista.dni ? (
                                        <div className={styles.specialistFoundForm}>
                                            <div className={styles.specialistHeader}>
                                                <h3 className={styles.specialistFoundTitle}>Especialista seleccionado</h3>
                                            </div>
                                            <div className={styles.specialistInputsContainer}>
                                                <div className={styles.specialistInputGroup}>
                                                    <label className={styles.specialistInputLabel}>DNI</label>
                                                    <input
                                                        className={styles.specialistInputDni}
                                                        type="text"
                                                        value={dataEspecialista.dni}
                                                        readOnly
                                                    />
                                                </div>
                                                <div className={styles.specialistInputGroup}>
                                                    <label className={styles.specialistInputLabel}>Nombres y Apellidos</label>
                                                    <input
                                                        className={styles.specialistInput}
                                                        type="text"
                                                        value={`${dataEspecialista.nombres?.toUpperCase()} ${dataEspecialista.apellidos?.toUpperCase()}`}
                                                        readOnly
                                                    />
                                                </div>
                                                <div className={styles.specialistToggleWrapper}>
                                                    <div className={styles.toggleWrapper}>
                                                        <label className={styles.toggleLabel}>
                                                            <input
                                                                type="checkbox"
                                                                checked={autoNavigate}
                                                                onChange={(e) => setAutoNavigate(e.target.checked)}
                                                                className={styles.toggleInput}
                                                            />
                                                            <span className={styles.toggleSlider}>
                                                                <RiSkipForwardLine
                                                                    className={styles.toggleIcon}
                                                                    title="Navegación automática"
                                                                />
                                                            </span>
                                                        </label>
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

                                {/* Form */}
                                <form  className={styles.form}>
                                    {/* All Questions */}
                                    <div className={styles.questionsContainer}>
                                        {copyPR.map((pregunta, index) => (
                                            <div key={index} id={`question-${index}`} className={styles.questionCard}>
                                                <h3 className={styles.questionTitle}>
                                                    {`${index + 1}) ${pregunta.criterio}`}
                                                </h3>
                                                <div className={styles.alternativesContainer}>
                                                    {preguntaRespuestaFunction(copyPR, index)}
                                                </div>
                                            </div>
                                        ))}
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