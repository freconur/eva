import { useGlobalContext, useGlobalContextDispatch } from '@/features/context/GlolbalContext';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { useReporteDocente } from '@/features/hooks/useReporteDocente';
import { AppAction } from '@/features/actions/appAction';
import { useRouter } from 'next/router';
import { gradosDeColegio, genero, sectionByGrade, getSeccionTexto } from '@/fuctions/regiones';
import React, { useEffect, useState } from 'react'
import styles from './actualizarEvaluacion.module.css'

const ActualizarEvaluacion = () => {
  const router = useRouter();
  const { idExamen, idEstudiante, mes } = router.query;
  
  const { getEvaluacionEstudiante, updateEvaluacionEstudiante } = useReporteDocente();
  const { getPreguntasRespuestas, getEvaluacion } = useAgregarEvaluaciones();
  const  { evaluacionEstudiante , preguntasRespuestas, currentUserData, evaluacion} = useGlobalContext()
  const dispatch = useGlobalContextDispatch()
  
  // Estado local para manejar las respuestas editables
  const [respuestasEditables, setRespuestasEditables] = useState<any[]>([]);
  
  // Estados para los datos del estudiante editables
  const [datosEstudiante, setDatosEstudiante] = useState({
    dni: '',
    grado: '',
    seccion: '',
    genero: '',
    nombresApellidos: ''
  });

  // Estado para el loading del botón de guardar
  const [isGuardando, setIsGuardando] = useState(false);

  useEffect(() => {
    /* getPreguntasRespuestas(idExamen as string) */
    if(idExamen && idEstudiante)
    getEvaluacionEstudiante(`${idExamen}`, `${idEstudiante}`, `${currentUserData.dni}`, `${mes}`)
    getEvaluacion(`${idExamen}`)
  },[idExamen, idEstudiante,currentUserData.dni])

  // Sincronizar respuestas editables cuando cambie evaluacionEstudiante
  useEffect(() => {
    if (evaluacionEstudiante?.respuestas) {
      setRespuestasEditables(evaluacionEstudiante.respuestas);
    }
    // Sincronizar datos del estudiante
    if (evaluacionEstudiante) {
      setDatosEstudiante({
        dni: String(evaluacionEstudiante.dni || ''),
        grado: String(evaluacionEstudiante.grado || ''),
        seccion: String(evaluacionEstudiante.seccion || ''),
        genero: String(evaluacionEstudiante.genero || ''),
        nombresApellidos: String(evaluacionEstudiante.nombresApellidos || '')
      });
    }
  }, [evaluacionEstudiante]);

  // Handler para cambiar la selección de alternativas
  const handleAlternativaChange = (preguntaIndex: number, alternativaSeleccionada: string) => {
    const nuevasRespuestas = [...respuestasEditables];
    if (nuevasRespuestas[preguntaIndex].alternativas) {
      nuevasRespuestas[preguntaIndex].alternativas = nuevasRespuestas[preguntaIndex].alternativas.map((alt: any) => ({
        ...alt,
        selected: alt.alternativa === alternativaSeleccionada
      }));
    }
    setRespuestasEditables(nuevasRespuestas);
    
    // Actualizar estado global de evaluacionEstudiante con las nuevas respuestas
    if (evaluacionEstudiante) {
      const evaluacionActualizada = {
        ...evaluacionEstudiante,
        respuestas: nuevasRespuestas
      };
      dispatch({ type: AppAction.EVALUACION_ESTUDIANTE, payload: evaluacionActualizada });
    }
  };

  // Handler para cambiar los datos del estudiante
  const handleDatosEstudianteChange = (campo: string, valor: string) => {
    // Actualizar estado local
    setDatosEstudiante(prev => ({
      ...prev,
      [campo]: valor
    }));
    
    // Actualizar estado global de evaluacionEstudiante
    if (evaluacionEstudiante) {
      const evaluacionActualizada = {
        ...evaluacionEstudiante,
        [campo]: valor
      };
      dispatch({ type: AppAction.EVALUACION_ESTUDIANTE, payload: evaluacionActualizada });
    }
  };

  // Handler para guardar cambios
  const handleGuardarCambios = async () => {
    setIsGuardando(true);
    
    try {
      // Los cambios ya están siendo aplicados al estado global en tiempo real
      /* console.log('Guardando cambios:');
      console.log('Estado actual de evaluacionEstudiante:', evaluacionEstudiante);
      console.log('Datos del estudiante:', datosEstudiante);
      console.log('Respuestas:', respuestasEditables); */
      
      // Actualizar la evaluación del estudiante
      await updateEvaluacionEstudiante(evaluacionEstudiante, `${idExamen}`, `${idEstudiante}`, `${currentUserData.dni}`,evaluacion, `${mes}`);
      
      // Mostrar notificación de éxito
      alert('✅ Los cambios se han guardado correctamente');
      
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
      alert('❌ Error al guardar los cambios. Por favor, inténtelo nuevamente.');
    } finally {
      setIsGuardando(false);
    }
  };

  console.log('evaluacionEstudiante', evaluacionEstudiante)
 /*  console.log('idExamen', idExamen)
  console.log('idEstudiante', idEstudiante)
  console.log('currentUserData', currentUserData) */
  return (
    <div className={styles.container}>
      <div>
        <h1 className={styles.title}>Actualizar Evaluación de {evaluacionEstudiante?.nombresApellidos}</h1>
      </div>

      {/* Campos editables para datos del estudiante */}
      <div className={styles.studentDataSection}>
        <h3 className={styles.sectionTitle}>Datos del Estudiante</h3>
        
        <div className={styles.inputGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Nombre completo:</label>
            <input
              type="text"
              value={datosEstudiante.nombresApellidos}
              onChange={(e) => handleDatosEstudianteChange('nombresApellidos', e.target.value)}
              className={styles.input}
              placeholder="Ingrese el nombre completo del estudiante"
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>DNI:</label>
            <input
              type="text"
              value={datosEstudiante.dni}
              onChange={(e) => handleDatosEstudianteChange('dni', e.target.value)}
              className={styles.input}
              disabled
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Grado:</label>
            <select
            disabled={true}
              value={datosEstudiante.grado}
              onChange={(e) => handleDatosEstudianteChange('grado', e.target.value)}
              className={styles.select}
            >
              <option value="">Seleccionar grado</option>
              {gradosDeColegio.map((grado) => (
                <option key={grado.id} value={grado.id.toString()}>
                  {grado.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Sección:</label>
            <select
            disabled={true}
              value={datosEstudiante.seccion}
              onChange={(e) => handleDatosEstudianteChange('seccion', e.target.value)}
              className={styles.select}
            >
              <option value="">Seleccionar sección</option>
              {sectionByGrade.map((seccion) => (
                <option key={seccion.id} value={seccion.id.toString()}>
                  {seccion.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Género:</label>
            <select
              value={datosEstudiante.genero}
              onChange={(e) => handleDatosEstudianteChange('genero', e.target.value)}
              className={styles.select}
            >
              <option value="">Seleccionar género</option>
              {genero.map((gen) => (
                <option key={gen.id} value={gen.id}>
                  {gen.name.charAt(0).toUpperCase() + gen.name.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.responsesSection}>
        <h2 className={styles.responsesTitle}>Respuestas del estudiante:</h2>
        {respuestasEditables && respuestasEditables.length > 0 ? (
          respuestasEditables.map((respuesta, index) => (
            <div key={index} className={styles.questionCard}>
              <h3 className={styles.questionNumber}>Pregunta {index + 1}</h3>
              <p className={styles.questionText}><strong>Pregunta:</strong> {respuesta.pregunta}</p>
              <p className={styles.questionText}><strong>Respuesta correcta:</strong> <span className={styles.correctAnswer}>{respuesta.respuesta}</span></p>
              
              {respuesta.alternativas && respuesta.alternativas.length > 0 && (
                <div className={styles.alternativesSection}>
                  <h4 className={styles.alternativesTitle}>Alternativas:</h4>
                  {respuesta.alternativas.map((alternativa: any, altIndex: number) => (
                    <div 
                      key={altIndex} 
                      className={`${styles.alternativeItem} ${alternativa.selected ? styles.selected : ''}`}
                      onClick={() => handleAlternativaChange(index, alternativa.alternativa)}
                    >
                      <input
                        type="radio"
                        name={`pregunta-${index}`}
                        value={alternativa.alternativa}
                        checked={alternativa.selected || false}
                        onChange={() => handleAlternativaChange(index, alternativa.alternativa)}
                        className={styles.radioInput}
                      />
                      <div className={styles.alternativeContent}>
                        <span className={styles.alternativeLabel}>
                          {alternativa.alternativa})
                        </span>
                        <span className={styles.alternativeDescription}>
                          {alternativa.descripcion}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className={styles.noResponsesMessage}>No hay respuestas disponibles</p>
        )}
      </div>

      {/* Botón para guardar cambios */}
      <div className={styles.saveButtonContainer}>
        <button
          onClick={handleGuardarCambios}
          className={styles.saveButton}
          disabled={isGuardando}
        >
          {isGuardando ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  )
}

export default ActualizarEvaluacion