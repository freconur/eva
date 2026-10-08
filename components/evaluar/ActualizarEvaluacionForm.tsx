import { useGlobalContext, useGlobalContextDispatch } from '@/features/context/GlolbalContext';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { useReporteDocente } from '@/features/hooks/useReporteDocente';
import { AppAction } from '@/features/actions/appAction';
import { gradosDeColegio, genero, sectionByGrade } from '@/fuctions/regiones';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { RiCloseLine, RiLoader4Line, RiErrorWarningLine } from 'react-icons/ri';
import styles from './actualizarForm.module.css';

interface ActualizarEvaluacionFormProps {
  idExamen: string;
  idEstudiante: string;
  mes: string;
  isInsideDrawer?: boolean;
  onClose?: () => void;
}

const ActualizarEvaluacionForm: React.FC<ActualizarEvaluacionFormProps> = ({
  idExamen,
  idEstudiante,
  mes,
  isInsideDrawer = false,
  onClose
}) => {
  const { getEvaluacionEstudiante, updateEvaluacionEstudiante } = useReporteDocente();
  const { getPreguntasRespuestas, getEvaluacion } = useAgregarEvaluaciones();
  const { evaluacionEstudiante, preguntasRespuestas, currentUserData, evaluacion } = useGlobalContext();
  const dispatch = useGlobalContextDispatch();
  
  // Permiso maestro del Administrador para actualizar respuestas
  const [permitirActualizar, setPermitirActualizar] = useState(false);
  const [isCheckingPermisos, setIsCheckingPermisos] = useState(true);

  useEffect(() => {
    const db = getFirestore();
    const brandDocRef = doc(db, 'configuracion', 'branding');
    const unsubscribe = onSnapshot(brandDocRef, (docSnap: any) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPermitirActualizar(Boolean(data?.accionesDocente?.actualizarRespuestas));
      } else {
        setPermitirActualizar(false);
      }
      setIsCheckingPermisos(false);
    }, (err: any) => {
      console.error("Error al escuchar permisos de accionesDocente:", err);
      setPermitirActualizar(false);
      setIsCheckingPermisos(false);
    });
    return () => unsubscribe();
  }, []);

  // La edición está permitida SI Y SOLO SI el Administrador tiene activo el switch maestro
  // (Incluso si la evaluación está cerrada o inactiva)
  const isReadOnly = !permitirActualizar;
  
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
    if (idExamen && idEstudiante) {
      getEvaluacionEstudiante(`${idExamen}`, `${idEstudiante}`, `${currentUserData.dni}`, `${mes}`);
      getEvaluacion(`${idExamen}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idExamen, idEstudiante, currentUserData.dni, mes]);

  // Sincronizar respuestas editables cuando cambie evaluacionEstudiante
  useEffect(() => {
    if (evaluacionEstudiante) {
      let respuestasReconstruidas: any[] = [];

      if (Array.isArray(evaluacionEstudiante.respuestas)) {
        respuestasReconstruidas = evaluacionEstudiante.respuestas;
      } else if (evaluacionEstudiante.respuestas && typeof evaluacionEstudiante.respuestas === 'object' && preguntasRespuestas) {
        respuestasReconstruidas = preguntasRespuestas.map(p => {
          const alternativaSeleccionada = (evaluacionEstudiante.respuestas as any)[p.id || ''];
          const alternativasReconstruidas = p.alternativas?.map(alt => ({
            ...alt,
            selected: !!alt.alternativa && !!alternativaSeleccionada && alt.alternativa.toLowerCase() === alternativaSeleccionada.toLowerCase()
          })) || [];

          return {
            ...p,
            alternativas: alternativasReconstruidas
          };
        });
      }
      setRespuestasEditables(respuestasReconstruidas);

      // Sincronizar datos del estudiante
      setDatosEstudiante({
        dni: String(evaluacionEstudiante.dni || ''),
        grado: String(evaluacionEstudiante.grado || ''),
        seccion: String(evaluacionEstudiante.seccion || ''),
        genero: String(evaluacionEstudiante.genero || ''),
        nombresApellidos: String(evaluacionEstudiante.nombresApellidos || '')
      });
    }
  }, [evaluacionEstudiante, preguntasRespuestas]);

  // Handler para cambiar la selección de alternativas
  const handleAlternativaChange = (preguntaIndex: number, alternativaSeleccionada: string) => {
    if (isReadOnly) return;
    const nuevasRespuestas = [...respuestasEditables];
    if (nuevasRespuestas[preguntaIndex].alternativas) {
      nuevasRespuestas[preguntaIndex].alternativas = nuevasRespuestas[preguntaIndex].alternativas.map((alt: any) => ({
        ...alt,
        selected: !!alt.alternativa && !!alternativaSeleccionada && alt.alternativa.toLowerCase() === alternativaSeleccionada.toLowerCase()
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
    if (isReadOnly) return;
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
    if (isReadOnly) {
      alert('La actualización de respuestas se encuentra deshabilitada por la administración.');
      return;
    }
    setIsGuardando(true);
    
    try {
      // Actualizar la evaluación del estudiante
      await updateEvaluacionEstudiante(evaluacionEstudiante, `${idExamen}`, `${idEstudiante}`, `${currentUserData.dni}`, evaluacion, `${mes}`);
      
      // Mostrar notificación de éxito
      alert('✅ Los cambios se han guardado correctamente');
      
      if (isInsideDrawer && onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
      alert('❌ Error al guardar los cambios. Por favor, inténtelo nuevamente.');
    } finally {
      setIsGuardando(false);
    }
  };

  return (
    <div className={`${styles.container} ${isInsideDrawer ? styles.insideDrawer : ''}`}>
      <div className={styles.headerSection}>
        <h1 className={styles.title}>
          {isInsideDrawer && onClose && (
            <button onClick={onClose} className={styles.closeDrawerButton} title="Cerrar panel">
              <RiCloseLine />
            </button>
          )}
          Actualizar Evaluación de {evaluacionEstudiante?.nombresApellidos}
        </h1>
        {isInsideDrawer && onClose && (
          <button onClick={onClose} className={styles.closeTextButton}>
            Cerrar
          </button>
        )}
      </div>

      {/* Banner cuando la edición está deshabilitada por el admin */}
      {!permitirActualizar && !isCheckingPermisos && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '12px',
          padding: '0.875rem 1.25rem',
          margin: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#92400e',
          fontSize: '0.925rem'
        }}>
          <RiErrorWarningLine size={24} style={{ flexShrink: 0, color: '#d97706' }} />
          <div>
            <strong>Edición Deshabilitada:</strong> La actualización de respuestas de los estudiantes se encuentra deshabilitada por la administración. No se pueden realizar ni guardar cambios.
          </div>
        </div>
      )}

      {/* Banner informativo si la evaluación está cerrada/inactiva pero el admin habilitó la rectificación */}
      {permitirActualizar && (!evaluacion?.active || evaluacion?.cerrada) && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '12px',
          padding: '0.875rem 1.25rem',
          margin: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#1e40af',
          fontSize: '0.925rem'
        }}>
          <RiErrorWarningLine size={24} style={{ flexShrink: 0, color: '#3b82f6' }} />
          <div>
            <strong>Rectificación Autorizada:</strong> Aunque esta evaluación se encuentra cerrada o finalizada, la administración ha habilitado temporalmente la actualización de respuestas. Puedes realizar y guardar cambios.
          </div>
        </div>
      )}

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
              disabled={isReadOnly}
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
                      onClick={() => !isReadOnly && handleAlternativaChange(index, alternativa.alternativa)}
                      style={isReadOnly ? { cursor: 'not-allowed', opacity: 0.85 } : undefined}
                    >
                      <input
                        type="radio"
                        name={`pregunta-${index}`}
                        value={alternativa.alternativa}
                        checked={alternativa.selected || false}
                        onChange={() => !isReadOnly && handleAlternativaChange(index, alternativa.alternativa)}
                        className={styles.radioInput}
                        disabled={isReadOnly}
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
          disabled={isGuardando || isReadOnly}
          title={isReadOnly ? 'La actualización de respuestas está deshabilitada por la administración' : undefined}
          style={isReadOnly ? { opacity: 0.6, cursor: 'not-allowed', backgroundColor: '#9ca3af' } : undefined}
        >
          {isReadOnly
            ? 'Edición Deshabilitada por Administración'
            : isGuardando
            ? 'Guardando...'
            : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
};

export default ActualizarEvaluacionForm;
