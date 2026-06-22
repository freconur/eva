import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { PreguntasRespuestas, UserEstudiante } from '@/features/types/types';
import { RiLoader4Line, RiArrowUpLine, RiPlayFill, RiPauseFill, RiUploadLine, RiCloseLine } from 'react-icons/ri';
import { gradosDeColegio, sectionByGrade, genero } from '@/fuctions/regiones';
import { currentYear, getMonthName } from '@/fuctions/dates';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './evaluarForm.module.css';
import ModalImportarEstudiantes from '../../pages/docentes/evaluaciones/secundaria/pruebas/prueba/evaluar-estudiante/ModalImportarEstudiantes';
import Loader from '@/components/loader/loader';
import { EstudianteImportado } from '@/features/types/estudiante';
import { convertGrade, converSeccion } from '@/fuctions/regiones';

interface EvaluarEstudianteFormProps {
  idExamen: string;
  isInsideDrawer?: boolean;
  onClose?: () => void;
}

const EvaluarEstudianteForm = ({
  idExamen,
  isInsideDrawer = false,
  onClose,
}: EvaluarEstudianteFormProps) => {
  const router = useRouter();

  // Estados del contexto global
  const {
    preguntasRespuestas,
    preguntasRespuestasEstudiante,
    sizePreguntas,
    loaderSalvarPregunta,
    evaluacion,
    estudiantesDeEvaluacion,
  } = useGlobalContext();

  // Estados locales
  const [nuevaSeccion, setNuevaSeccion] = useState<string>('');
  const [repuestasCorrectas, setRespuestasCorrectas] = useState(0);
  const [todasRespondidas, setTodasRespondidas] = useState(false);
  const [headerTop, setHeaderTop] = useState(isInsideDrawer ? 0 : 60); // Estado para el top del header
  const [contentPadding, setContentPadding] = useState(isInsideDrawer ? 10 : 20); // Estado para el padding del contenido
  const [showFloatingButton, setShowFloatingButton] = useState(false); // Estado para mostrar el botón flotante
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true); // Estado para controlar el avance automático
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar el modal de importar
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false); // Estado para mostrar mensaje de confirmación
  const [isClosingMessage, setIsClosingMessage] = useState(false); // Estado para animación de cierre
  const [confirmationData, setConfirmationData] = useState<{
    estudiantes: EstudianteImportado[];
    grado: string;
    seccion: string;
  } | null>(null); // Datos para el mensaje de confirmación
  const [resetModal, setResetModal] = useState<boolean>(false); // Estado para resetear el modal

  // Función para manejar el reset del modal
  const handleResetModal = () => {
    return resetModal;
  };

  // Hooks personalizados
  const {
    prEstudiantes,
    resetPRestudiantes,
    salvarPreguntRespuestaEstudiante,
    getEvaluacion,
    getPreguntasRespuestas,
    obtenerEstudianteDeEvaluacion,
    crearEstudiantesImportados,
    loaderCrearEstudiantes,
  } = useAgregarEvaluaciones();

  // Hook de formulario
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const watchAll = watch();

  /**
   * Valida si todos los datos del estudiante están completos
   */
  const validarDatosEstudiante = (formData: any): boolean => {
    return (
      formData.dni &&
      formData.nombresApellidos &&
      formData.grado &&
      formData.seccion &&
      formData.genero
    );
  };

  /**
   * Valida si todas las preguntas tienen al menos una respuesta seleccionada
   */
  const validarTodasRespondidas = (preguntas: PreguntasRespuestas[]): boolean => {
    const respondidas = preguntas.every((pregunta) =>
      pregunta.alternativas?.some((alternativa) => alternativa.selected === true)
    );
    return respondidas;
  };

  /**
   * Calcula el progreso de completitud del formulario
   */
  const calcularProgreso = (formData: any, preguntas: PreguntasRespuestas[]): number => {
    const totalCampos = 5; // DNI, nombres, grado, sección, género
    const totalPreguntas = preguntas.length;
    const totalElementos = totalCampos + totalPreguntas;

    let completados = 0;

    // Contar campos de datos completos
    if (formData.dni) completados++;
    if (formData.nombresApellidos) completados++;
    if (formData.grado) completados++;
    if (formData.seccion) completados++;
    if (formData.genero) completados++;

    // Contar preguntas respondidas
    preguntas.forEach((pregunta) => {
      if (pregunta.alternativas?.some((alt) => alt.selected)) {
        completados++;
      }
    });

    return totalElementos > 0 ? Math.round((completados / totalElementos) * 100) : 0;
  };

  /**
   * Valida si el formulario completo está listo para guardar
   */
  const validarFormularioCompleto = (formData: any, preguntas: PreguntasRespuestas[]): boolean => {
    const datosCompletos = validarDatosEstudiante(formData);
    const preguntasRespondidas = validarTodasRespondidas(preguntas);
    const completo = datosCompletos && preguntasRespondidas;
    setTodasRespondidas(completo);
    return completo;
  };

  /**
   * Cuenta el total de respuestas correctas en la evaluación
   */
  const contarRespuestasCorrectas = (preguntas: PreguntasRespuestas[]): number => {
    let correctas = 0;
    preguntas.forEach((pregunta) => {
      pregunta.alternativas?.forEach((alternativa) => {
        if (
          alternativa.selected === true &&
          alternativa.alternativa?.toLowerCase() === pregunta.respuesta?.toLowerCase()
        ) {
          correctas++;
        }
      });
    });
    setRespuestasCorrectas(correctas);
    return correctas;
  };

  /**
   * Maneja el envío del formulario de evaluación
   */
  const handleSubmitform = handleSubmit(async (data) => {
    if (!estudianteSeleccionado && estudiantesDeEvaluacion && estudiantesDeEvaluacion.length > 0) {
      alert('Por favor, selecciona un estudiante antes de guardar la evaluación.');
      return;
    }

    const respuestasCorrectas = contarRespuestasCorrectas(preguntasRespuestasEstudiante);

    const datosCompletos = {
      ...data,
      dni: estudianteSeleccionado?.dni || data.dni,
      nombresApellidos: estudianteSeleccionado?.nombresApellidos || data.nombresApellidos,
      grado: estudianteSeleccionado?.grado || data.grado,
      seccion: estudianteSeleccionado?.seccion || data.seccion,
      genero: estudianteSeleccionado?.genero || data.genero
    };

    await salvarPreguntRespuestaEstudiante(
      datosCompletos,
      idExamen,
      preguntasRespuestasEstudiante,
      respuestasCorrectas,
      sizePreguntas,
      evaluacion
    );

    getPreguntasRespuestas(idExamen);
    setRespuestasCorrectas(0);
    prEstudiantes(preguntasRespuestas);
    setTodasRespondidas(false);
    setEstudianteSeleccionado(null);
    reset();

    // Si está en el drawer y se guarda con éxito, también podemos notificar al callback
    if (isInsideDrawer && onClose) {
      onClose();
    }
  });

  /**
   * Maneja la selección de respuestas
   */
  const handleCheckedRespuesta = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name: preguntaOrder, value: alternativaSeleccionada } = e.target;

    preguntasRespuestasEstudiante?.forEach((pregunta) => {
      if (Number(pregunta.order) === Number(preguntaOrder)) {
        pregunta.alternativas?.forEach((alternativa) => {
          if (alternativa.descripcion?.length !== 0) {
            alternativa.selected = !!alternativa.alternativa && !!alternativaSeleccionada && alternativa.alternativa.toLowerCase() === alternativaSeleccionada.toLowerCase();
          }
        });
      }
    });

    prEstudiantes(preguntasRespuestasEstudiante);
    validarFormularioCompleto(watchAll, preguntasRespuestasEstudiante);
  };

  /**
   * Simula el evento de selección de respuesta para contenedores clickeables
   */
  const handleContenedorClick = (preguntaOrder: number, alternativaSeleccionada: string) => {
    const event = {
      target: {
        name: preguntaOrder.toString(),
        value: alternativaSeleccionada,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    handleCheckedRespuesta(event);
  };

  /**
   * Scroll helper dinámico
   */
  const getScrollContainer = () => {
    if (isInsideDrawer) {
      // Si está en el drawer, el scroll es del elemento contenedor del drawer (con clase styles.drawerContainer)
      return document.querySelector('[class*="drawerContainer"]') || window;
    }
    return document.querySelector('main')?.parentElement || window;
  };

  /**
   * Hace scroll automático a la siguiente pregunta
   */
  const scrollToNextQuestion = (preguntaIndex: number) => {
    if (!autoScrollEnabled) return;

    setTimeout(() => {
      const nextQuestionIndex = preguntaIndex + 1;
      const nextQuestionElement = document.getElementById(`pregunta-${nextQuestionIndex}`);

      if (nextQuestionElement) {
        const headerHeight = isInsideDrawer ? 200 : 260; // Altura del header aproximada
        const elementPosition = nextQuestionElement.offsetTop;
        const offsetPosition = elementPosition - headerHeight - 20;

        const scrollContainer = getScrollContainer();
        if (scrollContainer && scrollContainer !== window) {
          scrollContainer.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        } else {
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    }, 300);
  };

  /**
   * Hace scroll a una pregunta específica
   */
  const scrollToQuestion = (preguntaIndex: number) => {
    const questionElement = document.getElementById(`pregunta-${preguntaIndex}`);

    if (questionElement) {
      const headerHeight = isInsideDrawer ? 200 : 260;
      const elementPosition = questionElement.offsetTop;
      const offsetPosition = elementPosition - headerHeight - 20;

      const scrollContainer = getScrollContainer();
      if (scrollContainer && scrollContainer !== window) {
        scrollContainer.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      } else {
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  const scrollToTop = () => {
    const scrollContainer = getScrollContainer();
    if (scrollContainer && scrollContainer !== window) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const handleFormChange = () => {
    validarFormularioCompleto(watchAll, preguntasRespuestasEstudiante);
  };

  // Efectos para inicialización
  useEffect(() => {
    prEstudiantes(preguntasRespuestas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preguntasRespuestas]);

  useEffect(() => {
    if (!idExamen) return;

    const unsubscribeEvaluacion = getEvaluacion(idExamen);
    const unsubscribePreguntas = getPreguntasRespuestas(idExamen);

    return () => {
      if (unsubscribeEvaluacion) unsubscribeEvaluacion();
      if (unsubscribePreguntas) unsubscribePreguntas();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idExamen]);

  useEffect(() => {
    if (evaluacion?.grado) {
      reset({
        grado: evaluacion.grado
      });
    }
  }, [evaluacion?.grado, reset]);

  useEffect(() => {
    validarFormularioCompleto(watchAll, preguntasRespuestasEstudiante);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchAll, preguntasRespuestasEstudiante]);

  useEffect(() => {
    if (nuevaSeccion && estudiantesDeEvaluacion && estudiantesDeEvaluacion.length === 0) {
      setEstudianteSeleccionado(null);
      reset({
        dni: '',
        nombresApellidos: '',
        grado: evaluacion?.grado || '',
        seccion: nuevaSeccion,
        genero: ''
      });
    }
  }, [estudiantesDeEvaluacion, nuevaSeccion, evaluacion?.grado, reset]);

  useEffect(() => {
    if (!evaluacion?.id || !evaluacion?.grado) return;

    const unsubscribeEstudiantes = obtenerEstudianteDeEvaluacion(
      evaluacion,
      nuevaSeccion,
      `${evaluacion.mesDelExamen}`
    );

    return () => {
      if (unsubscribeEstudiantes) unsubscribeEstudiantes();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluacion?.id, evaluacion?.grado, nuevaSeccion]);

  // Manejar el scroll del layout para achicar la cabecera (solo si NO está en el drawer)
  useEffect(() => {
    if (isInsideDrawer) return;

    let ticking = false;
    const scrollContainer = getScrollContainer();

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = scrollContainer === window 
            ? window.scrollY 
            : (scrollContainer as HTMLElement).scrollTop;
            
          const maxScroll = 60;
          const newTop = Math.max(0, 60 - (scrollY / maxScroll) * 60);
          const newPadding = Math.max(0, 20 - (scrollY / maxScroll) * 20);

          setHeaderTop(newTop);
          setContentPadding(newPadding);

          ticking = false;
        });
        ticking = true;
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInsideDrawer]);

  // Mostrar el botón de flotante de volver al tope
  useEffect(() => {
    const scrollContainer = getScrollContainer();

    const handleScroll = () => {
      const scrollTop = scrollContainer === window 
        ? (window.pageYOffset || document.documentElement.scrollTop)
        : (scrollContainer as HTMLElement).scrollTop;
      setShowFloatingButton(scrollTop > 300);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInsideDrawer]);

  const preguntasOrdenadas = [...preguntasRespuestasEstudiante].sort(
    (a, b) => Number(a.order) - Number(b.order)
  );

  const validacionesFormulario = {
    dni: {
      required: { value: true, message: 'DNI es requerido' },
      minLength: { value: 8, message: 'DNI debe tener un mínimo de 8 caracteres' },
      maxLength: { value: 8, message: 'DNI debe tener un máximo de 8 caracteres' },
    },
    nombresApellidos: {
      required: { value: true, message: 'Nombres y apellidos son requeridos' },
      minLength: { value: 2, message: 'Nombre debe tener un mínimo de 2 caracteres' },
      maxLength: { value: 50, message: 'Nombre debe tener un máximo de 50 caracteres' },
    },
    grado: {
      required: { value: true, message: 'El grado es requerido' },
    },
    seccion: {
      required: { value: true, message: 'La sección es requerida' },
    },
    genero: {
      required: { value: true, message: 'El género es requerido' },
    },
  };

  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<UserEstudiante | null>(null);

  const handleEstudianteSeleccionado = (estudiante: UserEstudiante) => {
    setEstudianteSeleccionado(estudiante);
    reset({
      dni: estudiante.dni || '',
      nombresApellidos: estudiante.nombresApellidos || '',
      grado: estudiante.grado || '',
      seccion: estudiante.seccion || '',
      genero: estudiante.genero || ''
    });
  };

  const handleNuevaSeccionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const seccionSeleccionada = e.target.value;
    setNuevaSeccion(seccionSeleccionada);

    if (seccionSeleccionada) {
      setEstudianteSeleccionado(null);
      reset({
        dni: '',
        nombresApellidos: '',
        grado: evaluacion?.grado || '',
        seccion: seccionSeleccionada,
        genero: ''
      });
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleImportComplete = (estudiantesImportados: EstudianteImportado[], grado: string, seccion: string) => {
    setConfirmationData({
      estudiantes: estudiantesImportados,
      grado: grado,
      seccion: seccion
    });
    setShowConfirmationMessage(true);
  };

  const closeMessageWithAnimation = () => {
    setIsClosingMessage(true);
    setTimeout(() => {
      setShowConfirmationMessage(false);
      setIsClosingMessage(false);
      setConfirmationData(null);
    }, 300);
  };

  const handleConfirmImport = async () => {
    if (confirmationData) {
      try {
        await crearEstudiantesImportados(confirmationData.estudiantes);
        setConfirmationData(null);
        setResetModal(true);
        setTimeout(() => {
          setResetModal(false);
        }, 100);
      } catch (error) {
        console.error('Error al crear estudiantes:', error);
      }
    }
    closeMessageWithAnimation();
    setTimeout(() => {
      handleCloseModal();
    }, 300);
  };

  const handleCancelImport = () => {
    closeMessageWithAnimation();
  };

  return (
    <div className={`${styles.containerPage} ${isInsideDrawer ? styles.insideDrawer : ''}`}>
      <div className={styles.containerContent}>
        {loaderSalvarPregunta ? (
          <div className={styles.loaderContainer}>
            <div className={styles.loaderContent}>
              <RiLoader4Line className="animate-spin text-2xl" />
              <span>Guardando respuestas...</span>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.stickyHeader} style={{ top: `${headerTop}px` }}>
              <div className={styles.headerTopActions}>
                <h3 className={styles.title}>
                  {isInsideDrawer && (
                    <button onClick={onClose} className={styles.closeDrawerButton} title="Cerrar panel">
                      <RiCloseLine />
                    </button>
                  )}
                  Evaluar Estudiante
                </h3>
                {!isInsideDrawer ? (
                  <Link
                    href={{
                      pathname: '/docentes/evaluaciones/secundaria/pruebas/prueba/reporte',
                      query: { idExamen: idExamen },
                    }}
                    className={styles.backToReportButton}
                  >
                    <span>📊</span>
                    <span>Ver Reporte</span>
                  </Link>
                ) : (
                  <button onClick={onClose} className={styles.closeTextButton}>
                    Cerrar
                  </button>
                )}
              </div>

              {/* Indicador de progreso */}
              <div className={styles.progressIndicator}>
                <div className={styles.progressText}>
                  Progreso: {calcularProgreso(watchAll, preguntasRespuestasEstudiante)}% completado
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${calcularProgreso(watchAll, preguntasRespuestasEstudiante)}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Selector de sección */}
              <div className={styles.seccionToggleContainer}>
                <div className={styles.seccionImportContainer}>
                  <select
                    className={styles.inputNombresDni}
                    value={nuevaSeccion}
                    onChange={handleNuevaSeccionChange}
                  >
                    <option value="">-- Selecciona una sección --</option>
                    {sectionByGrade.map((seccion) => (
                      <option key={seccion.id} value={seccion.id}>
                        Sección {seccion.name.toUpperCase()}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className={styles.importButton}
                    onClick={handleOpenModal}
                    title="Importar datos de estudiantes"
                  >
                    <RiUploadLine className={styles.importIcon} />
                    <span>Importar</span>
                  </button>
                </div>

                <div className={styles.autoScrollToggle}>
                  <label className={styles.toggleLabel}>
                    <input
                      type="checkbox"
                      className={styles.toggleCheckbox}
                      checked={autoScrollEnabled}
                      onChange={(e) => setAutoScrollEnabled(e.target.checked)}
                    />
                    <span className={styles.toggleSlider}>
                      <span className={styles.toggleIcon}>
                        {autoScrollEnabled ? <RiPlayFill /> : <RiPauseFill />}
                      </span>
                    </span>
                    <span className={styles.toggleText}>
                      Avance automático
                    </span>
                  </label>
                </div>
              </div>

              {/* Selector de estudiantes */}
              {nuevaSeccion && estudiantesDeEvaluacion && estudiantesDeEvaluacion.length > 0 && (
                <select
                  className={styles.inputNombresDni}
                  value={estudianteSeleccionado?.id || ''}
                  onChange={(e) => {
                    if (e.target.value === '') {
                      setEstudianteSeleccionado(null);
                      reset();
                    } else {
                      const estudiante = estudiantesDeEvaluacion.find(est => est.id === e.target.value);
                      if (estudiante) {
                        handleEstudianteSeleccionado(estudiante);
                      }
                    }
                  }}
                >
                  <option value="">-- Selecciona un estudiante --</option>
                  {estudiantesDeEvaluacion.map((estudiante) => (
                    <option key={estudiante.id} value={estudiante.id}>
                      {estudiante.nombresApellidos?.toUpperCase()}
                    </option>
                  ))}
                </select>
              )}

              {/* Campos manuales */}
              {(!estudiantesDeEvaluacion || estudiantesDeEvaluacion.length === 0) && watchAll.seccion && (
                <>
                  <div className={styles.containerDniNombres}>
                    <div className="w-full my-2">
                      <input
                        {...register('dni', validacionesFormulario.dni)}
                        className={styles.inputNombresDni}
                        type="text"
                        placeholder="DNI DE ESTUDIANTE *"
                      />
                      {errors.dni && (
                        <span className={styles.errorMessage}>{errors.dni.message as string}</span>
                      )}
                    </div>

                    <div className="w-full my-2">
                      <input
                        {...register('nombresApellidos', validacionesFormulario.nombresApellidos)}
                        className={styles.inputNombresDni}
                        type="text"
                        placeholder="NOMBRES Y APELLIDOS DE ESTUDIANTES *"
                      />
                      {errors.nombresApellidos && (
                        <span className={styles.errorMessage}>
                          {errors.nombresApellidos.message as string}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.containerGradoSeccionGenero}>
                    <div className="w-full my-2">
                      <select
                        {...register('grado', validacionesFormulario.grado)}
                        className={styles.inputNombresDni}
                        disabled
                        value={evaluacion?.grado || ''}
                      >
                        <option value="">--GRADO *--</option>
                        {gradosDeColegio.map((grado) => (
                          <option key={grado.id} value={grado.id}>
                            {grado.name}
                          </option>
                        ))}
                      </select>
                      {errors.grado && (
                        <span className={styles.errorMessage}>{errors.grado.message as string}</span>
                      )}
                    </div>

                    <div className="w-full my-2">
                      <select
                        {...register('seccion', validacionesFormulario.seccion)}
                        className={styles.inputNombresDni}
                      >
                        <option value="">--SECCIÓN *--</option>
                        {sectionByGrade.map((seccion) => (
                          <option key={seccion.id} value={seccion.id}>
                            {seccion.name.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      {errors.seccion && (
                        <span className={styles.errorMessage}>{errors.seccion.message as string}</span>
                      )}
                    </div>

                    <div className="w-full my-2">
                      <select
                        {...register('genero', validacionesFormulario.genero)}
                        className={styles.inputNombresDni}
                      >
                        <option value="">--GÉNERO *--</option>
                        {genero.map((gen) => (
                          <option key={gen.id} value={gen.id}>
                            {gen.name.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      {errors.genero && (
                        <span className={styles.errorMessage}>{errors.genero.message as string}</span>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Lista de estado de preguntas */}
              <div className={styles.listaEstadoPreguntas}>
                {preguntasOrdenadas.map((pregunta, index) => {
                  const preguntaRespondida = pregunta.alternativas?.some(alternativa => alternativa.selected === true);
                  return (
                    <span
                      key={index}
                      className={`${styles.numeroPreguntaEstado} ${preguntaRespondida ? styles.respondida : styles.sinResponder
                        }`}
                      onClick={() => scrollToQuestion(index)}
                      title={`Ir a la pregunta ${index + 1}`}
                    >
                      {index + 1}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className={styles.mainContent} style={{ paddingTop: `${contentPadding}px` }}>
              {!isInsideDrawer && (
                <h2 className={styles.evaluacionTitle}>{evaluacion?.nombre} - {getMonthName(Number(evaluacion?.mesDelExamen))}</h2>
              )}
              <form onSubmit={handleSubmitform} onChange={handleFormChange}>
                <div className={styles.preguntasContainer}>
                  {preguntasOrdenadas.map((pregunta, preguntaIndex) => (
                    <div key={preguntaIndex} id={`pregunta-${preguntaIndex}`} className="mb-8 border-b border-gray-200 pb-6">
                      <p className={styles.preguntaTitulo}>
                        <span className={styles.numeroPregunta}>{preguntaIndex + 1}.</span>
                        {pregunta.pregunta}
                      </p>

                      <ul className={styles.respuestaContainer}>
                        {pregunta.alternativas?.map((alternativa, index) => {
                          if (alternativa.descripcion?.length === 0) return null;

                          return (
                            <li key={index} className={styles.respuestas}>
                              <div
                                className={`${styles.respuestaItem} ${alternativa.selected ? styles.selected : ''
                                  }`}
                                onClick={() => {
                                  handleContenedorClick(
                                    pregunta.order || 0,
                                    alternativa.alternativa || ''
                                  );
                                  scrollToNextQuestion(preguntaIndex);
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <input
                                    className={styles.radio}
                                    type="radio"
                                    name={`${pregunta.order}`}
                                    value={alternativa.alternativa}
                                    checked={
                                      alternativa?.selected === undefined
                                        ? false
                                        : alternativa.selected
                                    }
                                    onChange={(e) => {
                                      handleCheckedRespuesta(e);
                                      scrollToNextQuestion(preguntaIndex);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex-1">
                                    <p className={styles.alternativa}>
                                      {alternativa.alternativa}.{' '}
                                    </p>
                                    <p className={styles.descripcionrespuesta}>
                                      {alternativa.descripcion}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>

                <button
                  disabled={!todasRespondidas || (!estudianteSeleccionado && estudiantesDeEvaluacion && estudiantesDeEvaluacion.length > 0)}
                  className={styles.saveButton}
                >
                  {!estudianteSeleccionado && estudiantesDeEvaluacion && estudiantesDeEvaluacion.length > 0
                    ? 'Selecciona un estudiante para continuar'
                    : !todasRespondidas
                      ? 'Complete todas las preguntas para guardar'
                      : 'Guardar Evaluación'
                  }
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      <button
        className={`${styles.floatingButton} ${showFloatingButton ? styles.visible : ''}`}
        onClick={scrollToTop}
        title="Volver al inicio"
        aria-label="Volver al inicio de la página"
      >
        <RiArrowUpLine className={styles.floatingButtonIcon} />
      </button>

      <ModalImportarEstudiantes
        evaluacion={evaluacion}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onImportComplete={handleImportComplete}
        onReset={handleResetModal}
      />

      {showConfirmationMessage && confirmationData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '20px',
            animation: isClosingMessage ? 'fadeOut 0.3s ease-in' : 'fadeIn 0.3s ease-out'
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '40px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
              animation: isClosingMessage ? 'slideOutScale 0.3s ease-in' : 'slideInScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: 'scale(1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <h3 style={{
              marginBottom: '20px',
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1F2937',
              marginTop: '0'
            }}>
              Confirmar Importación
            </h3>

            <p style={{
              marginBottom: '35px',
              fontSize: '16px',
              color: '#6B7280',
              lineHeight: '1.6'
            }}>
              ¿Va a crear <strong style={{ color: '#1F2937' }}>{confirmationData.estudiantes.length}</strong> estudiantes que importo del archivo excel para el<strong style={{ color: '#1F2937' }}> {convertGrade(confirmationData.grado)}</strong> - <strong style={{ color: '#1F2937' }}> Sección {converSeccion(Number(confirmationData.seccion))?.toUpperCase()}</strong>? ,si esta seguro de crear los estudiantes, presione el botón de si, de lo contrario presione el botón de no.
            </p>

            <div style={{
              display: 'flex',
              gap: '20px',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleConfirmImport}
                style={{
                  padding: '14px 28px',
                  backgroundColor: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  minWidth: '120px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)',
                  transform: 'translateY(0)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px 0 rgba(16, 185, 129, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#10B981';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(16, 185, 129, 0.3)';
                }}
              >
                Sí
              </button>

              <button
                onClick={handleCancelImport}
                style={{
                  padding: '14px 28px',
                  backgroundColor: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  minWidth: '120px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.3)',
                  transform: 'translateY(0)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#DC2626';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px 0 rgba(239, 68, 68, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#EF4444';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(239, 68, 68, 0.3)';
                }}
              >
                No
              </button>
            </div>

            {loaderCrearEstudiantes && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(2px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '16px',
                zIndex: 10
              }}>
                <Loader
                  size="large"
                  variant="spinner"
                  text="Creando estudiantes..."
                  color="#3b82f6"
                />
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInScale {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes slideOutScale {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
        }
      `}</style>
    </div>
  );
};

export default EvaluarEstudianteForm;
