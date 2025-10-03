import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { PRDocentes, respuestaPsicolinguistica } from '@/features/types/types';
import { RiLoader4Line, RiSkipForwardLine, RiCloseLine } from 'react-icons/ri';
import { usePsicolinguistica } from '@/features/hooks/usePsicolinguistica';
import { useState, useEffect } from 'react';
import UseEvaluacionDocentes from '@/features/hooks/UseEvaluacionDocentes';
import UseEvaluacionDirectores from '@/features/hooks/UseEvaluacionDirectores';
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas';
import Link from 'next/link';
import { IoArrowBack } from 'react-icons/io5';
import styles from './evaluarEspecialista.module.css';

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
  } = useGlobalContext();
  const [originalPR, setOriginalPR] = useState<PRDocentes[]>([]);
  const [copyPR, setCopyPR] = useState<PRDocentes[]>([]);
  const [dniDocente, setDniDocente] = useState<string>('');
  const [autoNavigate, setAutoNavigate] = useState<boolean>(true);

  const { actualizarPreguntasPsicolinguistica } = usePsicolinguistica();
  const {
    buscarEspecialista,
    guardarEvaluacionEspecialistas,
    resetEspecialista,
    agregarObservacionEspecialistas,
    getPreguntasRespuestasEspecialistas,
  } = UseEvaluacionEspecialistas();

  // Cargar datos de la evaluación al montar el componente
  useEffect(() => {
    if (router.query.id) {
      getPreguntasRespuestasEspecialistas(`${router.query.id}`);
    }
  }, [router.query.id]);

  // Actualizar copyPR cuando getPreguntaRespuestaDocentes cambie
  useEffect(() => {
    if (getPreguntaRespuestaDocentes && getPreguntaRespuestaDocentes.length > 0) {
      setOriginalPR([...getPreguntaRespuestaDocentes]);
      setCopyPR(getPreguntaRespuestaDocentes);
    }
  }, [getPreguntaRespuestaDocentes]);

  //FUNCION DECTECCION DE CAMBIO DEL VALOR DE CHECKED
  const handleCheckedRespuesta = (
    e: React.ChangeEvent<HTMLInputElement>,
    preguntaIndex: number
  ) => {
    if (copyPR[preguntaIndex].alternativas)
      copyPR[preguntaIndex] = {
        ...copyPR[preguntaIndex],
        alternativas: [
          {
            alternativa: 'a',
            value: copyPR[preguntaIndex].alternativas[0].value,
            descripcion: copyPR[preguntaIndex].alternativas[0].descripcion,
            selected: e.target.value === 'a' ? true : false,
          },
          {
            alternativa: 'b',
            value: copyPR[preguntaIndex].alternativas[1].value,
            descripcion: copyPR[preguntaIndex].alternativas[1].descripcion,
            selected: e.target.value === 'b' ? true : false,
          },
          {
            alternativa: 'c',
            value: copyPR[preguntaIndex].alternativas[2].value,
            descripcion: copyPR[preguntaIndex].alternativas[2].descripcion,
            selected: e.target.value === 'c' ? true : false,
          },
          {
            alternativa: 'd',
            value: copyPR[preguntaIndex].alternativas[3].value,
            descripcion: copyPR[preguntaIndex].alternativas[3].descripcion,
            selected: e.target.value === 'd' ? true : false,
          },
        ],
      };
    actualizarPreguntasPsicolinguistica(preguntasPsicolinguistica);

    // Navegación automática si está habilitada
    if (autoNavigate && preguntaIndex < copyPR.length - 1) {
      setTimeout(() => {
        const nextQuestionElement = document.getElementById(`question-${preguntaIndex + 1}`);
        if (nextQuestionElement) {
          // Obtener la altura real del header fijo dinámicamente
          const searchSection = document.querySelector(`.${styles.searchSection}`);
          const headerHeight = searchSection ? searchSection.getBoundingClientRect().height : 120;

          // Calcular la posición del elemento considerando el header fijo y un margen adicional
          const elementPosition = nextQuestionElement.offsetTop - headerHeight - 20; // 20px de margen adicional

          window.scrollTo({
            top: Math.max(0, elementPosition), // Asegurar que no sea negativo
            behavior: 'smooth',
          });
        }
      }, 300); // Pequeño delay para mejor UX
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
                onClick={() => {
                  const event = {
                    target: { value: alter.alternativa },
                  } as React.ChangeEvent<HTMLInputElement>;
                  handleCheckedRespuesta(event, preguntaIndex);
                }}
              >
                <div className={styles.radioContainer}>
                  <input
                    className={styles.radioInput}
                    type="radio"
                    name={`${data[preguntaIndex]?.order}`}
                    value={alter.alternativa}
                    checked={alter.selected}
                    onChange={(e) => handleCheckedRespuesta(e, preguntaIndex)}
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

  const activeButtonGuardar = () => {
    // Verificar si todas las preguntas tienen al menos una respuesta seleccionada
    return copyPR.every((pregunta) => pregunta.alternativas?.some((alt) => alt.selected === true));
  };


  const handleSalvarPreguntaDocente = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (dataDirector.dni && router.query.id) {
      guardarEvaluacionEspecialistas(`${router.query.id}`, copyPR, dataDirector);
      setCopyPR([...originalPR]);
      resetEspecialista();
      // Redirigir de vuelta a la página anterior
      /* router.back() */
    }
  };

  const handleGuardarClick = () => {
    if (dataDirector.dni && router.query.id) {
      guardarEvaluacionEspecialistas(`${router.query.id}`, copyPR, dataDirector);
      setCopyPR([...originalPR]);
      resetEspecialista();
      // Redirigir de vuelta a la página anterior
      /* router.back() */
    }
  };

  const handleChangeDocente = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDniDocente(e.target.value);
  };

  const handleBuscardDocente = () => {
    buscarEspecialista(dniDocente);
  };

  const handleCerrarEspecialista = () => {
    resetEspecialista();
    setDniDocente('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        {/* Header */}
        {/* <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerTop}>
              <div className={styles.headerLeft}>
                <Link 
                  href={`/admin/especialistas/evaluaciones-especialistas/evaluacion/${router.query.id}`} 
                  className={styles.backLink}
                >
                  <IoArrowBack className={styles.backIcon} />
                  Volver
                </Link>
              </div>
              <h1 className={styles.title}>Evaluación de Especialista</h1>
            </div>
          </div>
        </div> */}

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
                  ) : (
                    <div className={styles.specialistFoundForm}>
                      <div className={styles.specialistHeader}>
                        <h3 className={styles.specialistFoundTitle}>Especialista encontrado</h3>
                        <button
                          onClick={handleCerrarEspecialista}
                          className={styles.closeButton}
                          title="Cerrar especialista"
                        >
                          <RiCloseLine className={styles.closeIcon} />
                        </button>
                      </div>
                      <div className={styles.specialistInputsContainer}>
                        <div className={styles.specialistInputGroup}>
                          <label className={styles.specialistInputLabel}>DNI</label>
                          <input
                            className={styles.specialistInputDni}
                            type="text"
                            value={dataDirector.dni}
                            readOnly
                          />
                        </div>
                        <div className={styles.specialistInputGroup}>
                          <label className={styles.specialistInputLabel}>Nombres y Apellidos</label>
                          <input
                            className={styles.specialistInput}
                            type="text"
                            value={`${dataDirector.nombres?.toUpperCase()} ${dataDirector.apellidos?.toUpperCase()}`}
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
                  )}

                  {/* Director Info - Solo mostrar cuando no hay especialista encontrado */}

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

                {/* Form */}
                <form onSubmit={handleSalvarPreguntaDocente} className={styles.form}>
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
