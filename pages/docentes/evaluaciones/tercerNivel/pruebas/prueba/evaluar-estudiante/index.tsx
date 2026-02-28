import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { PreguntasRespuestas, UserEstudiante } from '@/features/types/types';
import { RiLoader4Line, RiArrowUpLine, RiPlayFill, RiPauseFill, RiUploadLine, RiEditLine, RiDeleteBinLine, RiUserAddLine } from 'react-icons/ri';
import { gradosDeColegio, sectionByGrade, genero } from '@/fuctions/regiones';
import { currentYear, getMonthName } from '@/fuctions/dates';
import { useRouter } from 'next/router';
import styles from './evaluarEstudiante.module.css';
import ModalImportarEstudiantes from './ModalImportarEstudiantes';
import ModalCrearEstudiante from './ModalCrearEstudiante';
import Loader from '@/components/loader/loader';
import { EstudianteImportado } from '@/features/types/estudiante';
import { convertGrade, converSeccion } from '@/fuctions/regiones';
/**
 * Componente para evaluar estudiantes en pruebas de tercer nivel
 * Permite responder todas las preguntas de una vez y guardar la evaluación completa
 */
const EvaluarEstudiante = () => {
  const router = useRouter();
  const { idExamen } = router.query;

  // Estados del contexto global
  const {
    preguntasRespuestas,
    preguntasRespuestasEstudiante,
    sizePreguntas,
    loaderSalvarPregunta,
    evaluacion,
    estudiantesDeEvaluacion,
    currentUserData,
  } = useGlobalContext();

  // Estados locales
  const [nuevaSeccion, setNuevaSeccion] = useState<string>('');
  const [repuestasCorrectas, setRespuestasCorrectas] = useState(0);
  const [todasRespondidas, setTodasRespondidas] = useState(false);
  const [headerTop, setHeaderTop] = useState(64); // Estado para el top del header
  const [showFloatingButton, setShowFloatingButton] = useState(false); // Estado para mostrar el botón flotante
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true); // Estado para controlar el avance automático
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar el modal de importar
  const [isCrearEstudianteModalOpen, setIsCrearEstudianteModalOpen] = useState(false); // Estado para controlar el modal de crear estudiante
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create'); // Estado para el modo del modal
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false); // Estado para mostrar confirmación de eliminación
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
    // Esta función se ejecutará cuando resetModal sea true
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
    eliminarEstudiante,
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

  /**
   * Valida si todos los datos del estudiante están completos
   * @param formData - Datos del formulario
   * @returns true si todos los campos están completos
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
   * @param preguntas - Array de preguntas a validar
   * @returns true si todas las preguntas están respondidas
   */
  const validarTodasRespondidas = (preguntas: PreguntasRespuestas[]): boolean => {
    const respondidas = preguntas.every((pregunta) =>
      pregunta.alternativas?.some((alternativa) => alternativa.selected === true)
    );
    return respondidas;
  };

  /**
   * Calcula el progreso de completitud del formulario
   * @param formData - Datos del formulario
   * @param preguntas - Array de preguntas
   * @returns Porcentaje de completitud (0-100)
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

    return Math.round((completados / totalElementos) * 100);
  };

  /**
   * Valida si el formulario completo está listo para guardar
   * @param formData - Datos del formulario
   * @param preguntas - Array de preguntas
   * @returns true si todo está completo
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
   * @param preguntas - Array de preguntas con respuestas
   * @returns Número de respuestas correctas
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
   * Guarda la evaluación completa con todas las respuestas
   */
  const handleSubmitform = handleSubmit(async (data) => {
    // Verificar que se haya seleccionado un estudiante solo si hay estudiantes disponibles
    if (!estudianteSeleccionado && estudiantesDeEvaluacion && estudiantesDeEvaluacion.length > 0) {
      alert('Por favor, selecciona un estudiante antes de guardar la evaluación.');
      return;
    }

    const respuestasCorrectas = contarRespuestasCorrectas(preguntasRespuestasEstudiante);

    // Combinar los datos del formulario con los datos del estudiante seleccionado (si existe)
    const datosCompletos = {
      ...data,
      dni: estudianteSeleccionado?.dni || data.dni,
      nombresApellidos: estudianteSeleccionado?.nombresApellidos || data.nombresApellidos,
      grado: estudianteSeleccionado?.grado || data.grado,
      seccion: estudianteSeleccionado?.seccion || data.seccion,
      genero: estudianteSeleccionado?.genero || data.genero
    };

    // Guardar evaluación en la base de datos
    await salvarPreguntRespuestaEstudiante(
      datosCompletos,
      idExamen as string,
      preguntasRespuestasEstudiante,
      respuestasCorrectas,
      sizePreguntas,
      evaluacion
    );

    // Actualizar estado y reiniciar formulario
    getPreguntasRespuestas(idExamen as string);
    setRespuestasCorrectas(0);
    prEstudiantes(preguntasRespuestas);
    setTodasRespondidas(false);
    setEstudianteSeleccionado(null); // Limpiar estudiante seleccionado
    reset();
  });
  /* console.log('preguntasRespuestas', preguntasRespuestas) */

  /**
   * Maneja la selección de respuestas por parte del estudiante
   * Actualiza el estado de las alternativas seleccionadas
   * @param e - Evento del input radio
   */
  const handleCheckedRespuesta = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name: preguntaOrder, value: alternativaSeleccionada } = e.target;

    // Actualizar estado de las alternativas
    preguntasRespuestasEstudiante?.forEach((pregunta) => {
      if (Number(pregunta.order) === Number(preguntaOrder)) {
        pregunta.alternativas?.forEach((alternativa) => {
          if (alternativa.descripcion?.length !== 0) {
            alternativa.selected = alternativa.alternativa === alternativaSeleccionada;
          }
        });
      }
    });

    // Actualizar estado global y validar completitud
    prEstudiantes(preguntasRespuestasEstudiante);

    // Validar formulario completo con los datos actuales
    const formData = watch();
    validarFormularioCompleto(formData, preguntasRespuestasEstudiante);
  };

  /**
   * Simula el evento de selección de respuesta para contenedores clickeables
   * @param preguntaOrder - Orden de la pregunta
   * @param alternativaSeleccionada - Alternativa seleccionada
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
   * Hace scroll automático a la siguiente pregunta después de seleccionar una respuesta
   * @param preguntaIndex - Índice de la pregunta actual
   */
  const scrollToNextQuestion = (preguntaIndex: number) => {
    // Solo hacer scroll automático si está habilitado
    if (!autoScrollEnabled) return;

    // Esperar un pequeño delay para que la UI se actualice
    setTimeout(() => {
      const nextQuestionIndex = preguntaIndex + 1;
      const nextQuestionElement = document.getElementById(`pregunta-${nextQuestionIndex}`);

      if (nextQuestionElement) {
        // Calcular la posición considerando el header fijo
        const headerHeight = 260; // Altura aproximada del header fijo
        const elementPosition = nextQuestionElement.offsetTop;
        const offsetPosition = elementPosition - headerHeight - 20; // 20px de margen adicional

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 300); // Delay de 300ms para suavizar la transición
  };

  /**
   * Hace scroll a una pregunta específica cuando se hace clic en su número
   * @param preguntaIndex - Índice de la pregunta (0-based)
   */
  const scrollToQuestion = (preguntaIndex: number) => {
    const questionElement = document.getElementById(`pregunta-${preguntaIndex}`);

    if (questionElement) {
      // Calcular la posición considerando el header fijo
      const headerHeight = 260; // Altura aproximada del header fijo
      const elementPosition = questionElement.offsetTop;
      const offsetPosition = elementPosition - headerHeight - 20; // 20px de margen adicional

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Función para hacer scroll al top de la página
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  /**
   * Maneja cambios en los campos del formulario para validar en tiempo real
   */
  const handleFormChange = () => {
    const formData = watch();
    validarFormularioCompleto(formData, preguntasRespuestasEstudiante);
  };

  // Efectos para inicialización y actualización de datos
  useEffect(() => {
    prEstudiantes(preguntasRespuestas);
  }, [preguntasRespuestas]);

  useEffect(() => {
    if (idExamen) {
      getEvaluacion(`${idExamen}`);
      getPreguntasRespuestas(`${idExamen}`);
    }
  }, [idExamen]);

  // Efecto para establecer valores iniciales del formulario cuando se carga la evaluación
  useEffect(() => {
    if (evaluacion?.grado) {
      reset({
        grado: evaluacion.grado
      });
    }
  }, [evaluacion?.grado, reset]);

  // Efecto para validar formulario cuando cambian los datos
  useEffect(() => {
    const formData = watch();
    validarFormularioCompleto(formData, preguntasRespuestasEstudiante);
  }, [watch(), preguntasRespuestasEstudiante]);

  // Efecto para limpiar formulario cuando no hay estudiantes en la sección seleccionada
  useEffect(() => {
    if (nuevaSeccion && estudiantesDeEvaluacion && estudiantesDeEvaluacion.length === 0) {
      // Si hay una sección seleccionada pero no hay estudiantes, limpiar el formulario
      setEstudianteSeleccionado(null);
      reset({
        dni: '',
        nombresApellidos: '',
        grado: evaluacion?.grado || '',
        seccion: nuevaSeccion, // Mantener la sección seleccionada
        genero: ''
      });
    }
  }, [estudiantesDeEvaluacion, nuevaSeccion, evaluacion?.grado, reset]);

  useEffect(() => {

    const fetchEstudiantes = async () => {
      try {
        if (evaluacion?.id && evaluacion?.grado) {
          obtenerEstudianteDeEvaluacion(evaluacion, nuevaSeccion, `${evaluacion.mesDelExamen}`);
        }
      } catch (error) {
        console.error('Error al obtener estudiantes:', error);
      }
    };
    fetchEstudiantes();
  }, [evaluacion?.id, evaluacion?.grado, nuevaSeccion]);
  // Efecto para manejar el scroll y cambiar el top del header progresivamente
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const maxScroll = 64; // Distancia en px para hacer la transición completa (altura navbar)

          // Calcular el top progresivamente: de 64px a 0px
          // Cuando scrollY = 0, newTop = 64px
          // Cuando scrollY >= 64, newTop = 0px
          const newTop = Math.max(0, 64 - (scrollY / maxScroll) * 64);

          setHeaderTop(newTop);

          ticking = false;
        });
        ticking = true;
      }
    };

    // Agregar event listener con passive: true para mejor rendimiento
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup al desmontar el componente
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Efecto para detectar el scroll y mostrar/ocultar el botón flotante
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowFloatingButton(scrollTop > 300); // Mostrar botón después de 300px de scroll
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Ordenar preguntas por el atributo order para mostrar en secuencia correcta
  const preguntasOrdenadas = [...preguntasRespuestasEstudiante].sort(
    (a, b) => Number(a.order) - Number(b.order)
  );

  // Configuración de validación del formulario
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

  // Estado para el estudiante seleccionado
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<UserEstudiante | null>(null);

  // Estado para la nueva sección seleccionada

  /**
   * Maneja la selección de un estudiante desde el selector
   * @param estudiante - Estudiante seleccionado
   */
  const handleEstudianteSeleccionado = (estudiante: UserEstudiante) => {
    setEstudianteSeleccionado(estudiante);
    reset({
      dni: estudiante.dni,
      nombresApellidos: estudiante.nombresApellidos,
      grado: estudiante.grado,
      seccion: estudiante.seccion,
      genero: estudiante.genero,
    });
  };

  /**
   * Refresca los datos del estudiante seleccionado desde Firestore
   * Se llama después de editar para obtener los datos actualizados
   */
  const handleRefreshEstudiante = async () => {
    if (estudianteSeleccionado?.dni && currentUserData?.dni) {
      try {
        // Importar las funciones necesarias de Firestore
        const { getFirestore, doc, getDoc } = await import('firebase/firestore');
        const db = getFirestore();

        // Obtener el estudiante actualizado directamente desde Firestore
        const estudianteRef = doc(db, `usuarios/${currentUserData.dni}/estudiantes-docentes`, estudianteSeleccionado.dni);
        const estudianteSnap = await getDoc(estudianteRef);

        if (estudianteSnap.exists()) {
          const estudianteActualizado = {
            ...estudianteSnap.data(),
            id: estudianteSnap.id
          } as UserEstudiante;

          // Actualizar el estado con los datos frescos
          handleEstudianteSeleccionado(estudianteActualizado);
        }
      } catch (error) {
        console.error('Error al refrescar estudiante:', error);
      }
    }
  };

  // Función para manejar el cambio de la nueva sección
  const handleNuevaSeccionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const seccionSeleccionada = e.target.value;
    setNuevaSeccion(seccionSeleccionada);
    console.log('Nueva sección seleccionada:', seccionSeleccionada);

    // Si se selecciona una sección, limpiar el estudiante seleccionado y el formulario
    if (seccionSeleccionada) {
      setEstudianteSeleccionado(null);
      reset({
        dni: '',
        nombresApellidos: '',
        grado: evaluacion?.grado || '',
        seccion: seccionSeleccionada, // Mantener la sección seleccionada
        genero: ''
      });
    }
  };

  // Funciones para manejar el modal de importar
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Función para manejar la importación completa de estudiantes
  const handleImportComplete = (estudiantesImportados: EstudianteImportado[], grado: string, seccion: string) => {
    console.log('Estudiantes importados:', estudiantesImportados);
    console.log('Grado seleccionado:', grado);
    console.log('Sección seleccionada:', seccion);

    // Mostrar mensaje de confirmación personalizado
    setConfirmationData({
      estudiantes: estudiantesImportados,
      grado: grado,
      seccion: seccion
    });
    setShowConfirmationMessage(true);
  };

  // Función para cerrar el mensaje con animación
  const closeMessageWithAnimation = () => {
    setIsClosingMessage(true);
    setTimeout(() => {
      setShowConfirmationMessage(false);
      setIsClosingMessage(false);
      setConfirmationData(null);
    }, 300); // Duración de la animación de cierre
  };

  // Función para confirmar la importación
  const handleConfirmImport = async () => {
    if (confirmationData) {
      console.log('confirmationData', confirmationData.estudiantes);
      console.log(`Se importaron ${confirmationData.estudiantes.length} estudiantes exitosamente para ${confirmationData.grado} - ${confirmationData.seccion}`);

      try {
        // Pasar los estudiantes importados a la función
        await crearEstudiantesImportados(confirmationData.estudiantes);
        console.log('Estudiantes creados exitosamente en la base de datos');

        // Limpiar los datos de confirmación después de crear exitosamente
        setConfirmationData(null);

        // Activar el reset del modal
        setResetModal(true);

        // Resetear el estado de reset después de un breve delay
        setTimeout(() => {
          setResetModal(false);
        }, 100);

      } catch (error) {
        console.error('Error al crear estudiantes:', error);
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    }

    // Cerrar mensaje con animación y luego cerrar modal
    closeMessageWithAnimation();
    setTimeout(() => {
      handleCloseModal();
    }, 300);
  };

  // Función para cancelar la importación
  const handleCancelImport = () => {
    console.log('No se importó');

    // Solo cerrar el mensaje de confirmación con animación, mantener el modal abierto
    closeMessageWithAnimation();
  };


  return (
    <div className={styles.containerPage}>
      <div className={styles.containerContent}>
        {/* Loader mientras se guarda la evaluación */}
        {loaderSalvarPregunta ? (
          <div className={styles.loaderContainer}>
            <div className={styles.loaderContent}>
              <RiLoader4Line className="animate-spin text-2xl" />
              <span>Guardando respuestas...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Header con botón de regreso */}
            {/* Header sticky con información del estudiante */}
            <div className={styles.stickyHeader} style={{ top: `${headerTop}px` }}>
              {/* <h3 className={styles.title}>Evaluar Estudiante</h3> */}

              {/* Indicador de progreso */}
              <div className={styles.progressIndicator}>
                <div className={styles.progressText}>
                  Progreso: {calcularProgreso(watch(), preguntasRespuestasEstudiante)}% completado
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${calcularProgreso(watch(), preguntasRespuestasEstudiante)}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Selector de sección con toggle de avance automático */}
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

                  <button
                    type="button"
                    className={styles.importButton}
                    onClick={() => {
                      setModalMode('create');
                      setIsCrearEstudianteModalOpen(true);
                    }}
                    title="Crear un estudiante individual"
                    style={{ marginLeft: '10px', backgroundColor: '#8B5CF6' }}
                  >
                    <RiUserAddLine className={styles.importIcon} />
                    <span>Crear Estudiante</span>
                  </button>
                </div>

                {/* Toggle para avance automático */}
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
              {/* Selector de estudiantes con botones de acción */}
              {nuevaSeccion && estudiantesDeEvaluacion && estudiantesDeEvaluacion.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
                    style={{ flex: 1 }}
                  >
                    <option value="">-- Selecciona un estudiante --</option>
                    {estudiantesDeEvaluacion.map((estudiante) => (
                      <option key={estudiante.id} value={estudiante.id}>
                        {estudiante.nombresApellidos?.toUpperCase()}
                      </option>
                    ))}
                  </select>

                  {/* Botones de editar y eliminar - Solo se muestran cuando hay un estudiante seleccionado */}
                  {estudianteSeleccionado && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setModalMode('edit');
                          setIsCrearEstudianteModalOpen(true);
                        }}
                        title="Editar estudiante"
                        style={{
                          padding: '10px 12px',
                          backgroundColor: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
                      >
                        <RiEditLine />
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirmation(true)}
                        title="Eliminar estudiante"
                        style={{
                          padding: '10px 12px',
                          backgroundColor: '#EF4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
                      >
                        <RiDeleteBinLine />
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Campos de información del estudiante - Solo se muestran cuando NO hay estudiantes disponibles Y se ha seleccionado una sección */}
              {(!estudiantesDeEvaluacion || estudiantesDeEvaluacion.length === 0) && watch('seccion') && (
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

                  {/* Selectores de grado, sección y género */}
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

            {/* Contenido principal con margen superior para el header fijo */}
            <div className={styles.mainContent}>
              <h2 className={styles.evaluacionTitle}>{evaluacion?.nombre} - {getMonthName(Number(evaluacion?.mesDelExamen))}</h2>
              <form onSubmit={handleSubmitform} onChange={handleFormChange}>
                {/* Sección de preguntas y respuestas */}
                <div className={styles.preguntasContainer}>
                  {preguntasOrdenadas.map((pregunta, preguntaIndex) => (
                    <div key={preguntaIndex} id={`pregunta-${preguntaIndex}`} className="mb-8 border-b border-gray-200 pb-6">
                      {/* Título de la pregunta */}
                      <p className={styles.preguntaTitulo}>
                        <span className={styles.numeroPregunta}>{preguntaIndex + 1}.</span>
                        {pregunta.pregunta}
                      </p>

                      {/* Lista de alternativas */}
                      <ul className={styles.respuestaContainer}>
                        {pregunta.alternativas?.map((alternativa, index) => {
                          // Solo mostrar alternativas que tengan descripción
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
                                  // Hacer scroll a la siguiente pregunta
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
                                      // Hacer scroll a la siguiente pregunta
                                      scrollToNextQuestion(preguntaIndex);
                                    }}
                                    onClick={(e) => e.stopPropagation()} // Evitar doble ejecución
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

                {/* Botón de guardar con validación */}
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

      {/* Botón flotante para volver al top */}
      <button
        className={`${styles.floatingButton} ${showFloatingButton ? styles.visible : ''}`}
        onClick={scrollToTop}
        title="Volver al inicio"
        aria-label="Volver al inicio de la página"
      >
        <RiArrowUpLine className={styles.floatingButtonIcon} />
      </button>

      {/* Modal de importar estudiantes */}
      <ModalImportarEstudiantes
        evaluacion={evaluacion}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onImportComplete={handleImportComplete}
        onReset={handleResetModal}
      />

      {/* Modal de crear estudiante */}
      <ModalCrearEstudiante
        isOpen={isCrearEstudianteModalOpen}
        onClose={() => {
          setIsCrearEstudianteModalOpen(false);
          setModalMode('create');
        }}
        gradoEvaluacion={evaluacion?.grado?.toString() || ''}
        mode={modalMode}
        estudianteData={modalMode === 'edit' && estudianteSeleccionado ? {
          dni: estudianteSeleccionado.dni || '',
          nombresApellidos: estudianteSeleccionado.nombresApellidos || '',
          grado: estudianteSeleccionado.grado?.toString() || '',
          seccion: estudianteSeleccionado.seccion || '',
          genero: estudianteSeleccionado.genero || '',
        } : undefined}
        onSuccess={handleRefreshEstudiante}
      />

      {/* Mensaje de confirmación personalizado */}
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

            {/* Loader cuando se están creando estudiantes */}
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

      {/* Diálogo de confirmación para eliminar estudiante */}
      {showDeleteConfirmation && estudianteSeleccionado && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10002,
            padding: '20px',
          }}
          onClick={() => setShowDeleteConfirmation(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '450px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1F2937',
              marginBottom: '12px',
              marginTop: 0,
            }}>
              ¿Eliminar estudiante?
            </h3>

            <p style={{
              fontSize: '15px',
              color: '#6B7280',
              marginBottom: '24px',
              lineHeight: '1.5',
            }}>
              ¿Está seguro de eliminar al estudiante <strong>{estudianteSeleccionado.nombresApellidos}</strong>? Esta acción no se puede deshacer.
            </p>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>

              <button
                onClick={async () => {
                  try {
                    await eliminarEstudiante(estudianteSeleccionado.dni || '');
                    setShowDeleteConfirmation(false);
                    setEstudianteSeleccionado(null);
                    reset();
                  } catch (error: any) {
                    alert(error.message || 'Error al eliminar el estudiante');
                  }
                }}
                disabled={loaderCrearEstudiantes}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loaderCrearEstudiantes ? '#9CA3AF' : '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loaderCrearEstudiantes ? 'not-allowed' : 'pointer',
                }}
              >
                {loaderCrearEstudiantes ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
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

export default EvaluarEstudiante;
