import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import { PreguntasRespuestas } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import { gradosDeColegio, sectionByGrade, genero } from '../../../../../../../fuctions/regiones'
import { currentYear } from "@/fuctions/dates";
import { useRouter } from "next/router";
import styles from './evaluarEstudiante.module.css';

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
    sizePreguntas, 
    preguntasRespuestasEstudiante, 
    loaderSalvarPregunta 
  } = useGlobalContext();
  
  // Estados locales
  const [repuestasCorrectas, setRespuestasCorrectas] = useState(0);
  const [todasRespondidas, setTodasRespondidas] = useState(false);
  const [headerTop, setHeaderTop] = useState(60); // Estado para el top del header
  const [contentPadding, setContentPadding] = useState(270); // Estado para el padding del contenido
  
  // Hooks personalizados
  const { 
    prEstudiantes, 
    resetPRestudiantes, 
    salvarPreguntRespuestaEstudiante,
    getEvaluacion, 
    getPreguntasRespuestas 
  } = useAgregarEvaluaciones();
  
  // Hook de formulario
  const { 
    register, 
    handleSubmit, 
    watch, 
    reset, 
    formState: { errors } 
  } = useForm();


  /**
   * Valida si todos los datos del estudiante están completos
   * @param formData - Datos del formulario
   * @returns true si todos los campos están completos
   */
  const validarDatosEstudiante = (formData: any): boolean => {
    return formData.dni && 
           formData.nombresApellidos && 
           formData.grado && 
           formData.seccion && 
           formData.genero;
  };

  /**
   * Valida si todas las preguntas tienen al menos una respuesta seleccionada
   * @param preguntas - Array de preguntas a validar
   * @returns true si todas las preguntas están respondidas
   */
  const validarTodasRespondidas = (preguntas: PreguntasRespuestas[]): boolean => {
    const respondidas = preguntas.every(pregunta => 
      pregunta.alternativas?.some(alternativa => alternativa.selected === true)
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
    preguntas.forEach(pregunta => {
      if (pregunta.alternativas?.some(alt => alt.selected)) {
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
    preguntas.forEach(pregunta => {
      pregunta.alternativas?.forEach(alternativa => {
        if (alternativa.selected === true && 
            alternativa.alternativa?.toLowerCase() === pregunta.respuesta?.toLowerCase()) {
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
    const respuestasCorrectas = contarRespuestasCorrectas(preguntasRespuestasEstudiante);
    
    // Guardar evaluación en la base de datos

    //ESTO LO COMENTE PARA PODER HACER PRUEBAS ESTA ES LA FUNCION PRINCIPAL PARA GUARDAR LA EVALUACION
    await salvarPreguntRespuestaEstudiante(
      data, 
      idExamen as string, 
      preguntasRespuestasEstudiante, 
      respuestasCorrectas, 
      sizePreguntas
    );
    /* console.log('data', data)
    console.log('preguntasRespuestasEstudiante', preguntasRespuestasEstudiante) */
    // Actualizar estado y reiniciar formulario
    getPreguntasRespuestas(idExamen as string);
    setRespuestasCorrectas(0);
    prEstudiantes(preguntasRespuestas);
    setTodasRespondidas(false);
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
    preguntasRespuestasEstudiante?.forEach(pregunta => {
      if (Number(pregunta.order) === Number(preguntaOrder)) {
        pregunta.alternativas?.forEach(alternativa => {
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
        value: alternativaSeleccionada
      }
    } as React.ChangeEvent<HTMLInputElement>;
    handleCheckedRespuesta(event);
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

  // Efecto para validar formulario cuando cambian los datos
  useEffect(() => {
    const formData = watch();
    validarFormularioCompleto(formData, preguntasRespuestasEstudiante);
  }, [watch(), preguntasRespuestasEstudiante]);

  // Efecto para manejar el scroll y cambiar el top del header progresivamente
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const maxScroll = 60; // Distancia en px para hacer la transición completa
          
          // Calcular el top progresivamente: de 60px a 0px
          // Cuando scrollY = 0, newTop = 60px
          // Cuando scrollY >= 60, newTop = 0px
          const newTop = Math.max(0, 60 - (scrollY / maxScroll) * 60);
          
          // Calcular el padding del contenido: de 270px a 210px
          // Ajustar el padding para compensar el movimiento del header
          const newPadding = Math.max(210, 270 - (scrollY / maxScroll) * 60);
          
          setHeaderTop(newTop);
          setContentPadding(newPadding);
          
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

  // Ordenar preguntas por el atributo order para mostrar en secuencia correcta
  const preguntasOrdenadas = [...preguntasRespuestasEstudiante]
    .sort((a, b) => Number(a.order) - Number(b.order));

  // Configuración de validación del formulario
  const validacionesFormulario = {
    dni: {
      required: { value: true, message: "DNI es requerido" },
      minLength: { value: 8, message: "DNI debe tener un mínimo de 8 caracteres" },
      maxLength: { value: 8, message: "DNI debe tener un máximo de 8 caracteres" },
    },
    nombresApellidos: {
      required: { value: true, message: "Nombres y apellidos son requeridos" },
      minLength: { value: 2, message: "Nombre debe tener un mínimo de 2 caracteres" },
      maxLength: { value: 50, message: "Nombre debe tener un máximo de 50 caracteres" },
    },
    grado: {
      required: { value: true, message: "El grado es requerido" }
    },
    seccion: {
      required: { value: true, message: "La sección es requerida" }
    },
    genero: {
      required: { value: true, message: "El género es requerido" }
    }
  };

  console.log('preguntasOrdenadas', preguntasOrdenadas)
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
            {/* Header fijo con información del estudiante */}
            <div 
              className={styles.stickyHeader}
              style={{ top: `${headerTop}px` }}
            >
              {/* <div className={styles.headerContainer}>
                <button 
                  className={styles.backButton} 
                  onClick={() => router.back()}
                >
                  Volver
                </button>
              </div> */}
              
              <h3 className={styles.title}>Evaluar Estudiante</h3>
              
              {/* Indicador de progreso */}
              <div className={styles.progressIndicator}>
                <div className={styles.progressText}>
                  Progreso: {calcularProgreso(watch(), preguntasRespuestasEstudiante)}% completado
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${calcularProgreso(watch(), preguntasRespuestasEstudiante)}%` }}
                  ></div>
                </div>
              </div>

              {/* Campos de información del estudiante */}
              <div className={styles.containerDniNombres}>
                <div className='w-full my-2'>
                  <input
                    {...register("dni", validacionesFormulario.dni)}
                    className={styles.inputNombresDni}
                    type="text"
                    placeholder="DNI DE ESTUDIANTE *"
                  />
                  {errors.dni && <span className={styles.errorMessage}>{errors.dni.message as string}</span>}
                </div>
                
                <div className='w-full my-2'>
                  <input
                    {...register("nombresApellidos", validacionesFormulario.nombresApellidos)}
                    className={styles.inputNombresDni}
                    type="text"
                    placeholder="NOMBRES Y APELLIDOS DE ESTUDIANTES *"
                  />
                  {errors.nombresApellidos && <span className={styles.errorMessage}>{errors.nombresApellidos.message as string}</span>}
                </div>
              </div>

              {/* Selectores de grado, sección y género */}
              <div className={styles.containerGradoSeccionGenero}>
                <div className='w-full my-2'>
                  <select
                    {...register("grado", validacionesFormulario.grado)}
                    className={styles.inputNombresDni}
                  >
                    <option value="">--GRADO *--</option>
                    {gradosDeColegio.map((grado) => (
                      <option key={grado.id} value={grado.id}>
                        {grado.name}
                      </option>
                    ))}
                  </select>
                  {errors.grado && <span className={styles.errorMessage}>{errors.grado.message as string}</span>}
                </div>
                
                <div className='w-full my-2'>
                  <select
                    {...register("seccion", validacionesFormulario.seccion)}
                    className={styles.inputNombresDni}
                  >
                    <option value="">--SECCIÓN *--</option>
                    {sectionByGrade.map((seccion) => (
                      <option key={seccion.id} value={seccion.id}>
                        {seccion.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  {errors.seccion && <span className={styles.errorMessage}>{errors.seccion.message as string}</span>}
                </div>
                
                <div className='w-full my-2'>
                  <select
                    {...register("genero", validacionesFormulario.genero)}
                    className={styles.inputNombresDni}
                  >
                    <option value="">--GÉNERO *--</option>
                    {genero.map((gen) => (
                      <option key={gen.id} value={gen.id}>
                        {gen.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  {errors.genero && <span className={styles.errorMessage}>{errors.genero.message as string}</span>}
                </div>
              </div>
            </div>

            {/* Contenido principal con margen superior para el header fijo */}
            <div 
              className={styles.mainContent}
              style={{ paddingTop: `${contentPadding}px` }}
            >
              <form onSubmit={handleSubmitform} onChange={handleFormChange}>
                {/* Sección de preguntas y respuestas */}
                <div className={styles.preguntasContainer}>
                  {preguntasOrdenadas.map((pregunta, preguntaIndex) => (
                    <div key={preguntaIndex} className='mb-8 border-b border-gray-200 pb-6'>
                      {/* Título de la pregunta */}
                      <p className={styles.preguntaTitulo}>
                        <span className={styles.numeroPregunta}>
                          {preguntaIndex + 1}.
                        </span>
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
                                className={`${styles.respuestaItem} ${
                                  alternativa.selected ? styles.selected : ''
                                }`}
                                onClick={() => handleContenedorClick(pregunta.order || 0, alternativa.alternativa || '')}
                              >
                                <div className='flex items-start gap-3'>
                                  <input
                                    className={styles.radio}
                                    type="radio"
                                    name={`${pregunta.order}`}
                                    value={alternativa.alternativa}
                                    checked={alternativa?.selected === undefined ? false : alternativa.selected}
                                    onChange={handleCheckedRespuesta} 
                                    onClick={(e) => e.stopPropagation()} // Evitar doble ejecución
                                  />
                                  <div className='flex-1'>
                                    <p className={styles.alternativa}>{alternativa.alternativa}. </p>
                                    <p className={styles.descripcionrespuesta}>{alternativa.descripcion}</p>
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
                  disabled={!todasRespondidas} 
                  className={styles.saveButton}
                >
                  {todasRespondidas ? 'Guardar Evaluación' : 'Complete todos los datos y preguntas para guardar'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EvaluarEstudiante;