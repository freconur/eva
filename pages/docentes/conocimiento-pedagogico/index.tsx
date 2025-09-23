import React, { useState, useEffect } from 'react';
import styles from './conocimiento-pedagogico.module.css';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import type { ConocimientoPedagogico } from '@/features/types/types';
import {genero, rangoEdad, gradosDeColegio, regionTexto} from '@/fuctions/regiones'
import { distritosPuno } from '@/fuctions/provinciasPuno';
import { useTituloDeCabecera } from '@/features/hooks/useTituloDeCabecera';



const ConocimientoPedagogico = () => {
  const { currentUserData, preguntaEvaluacionLikert } = useGlobalContext();
  
  const [datos, setDatos] = useState<ConocimientoPedagogico>({
    nombres: '',
    apellidos: '',
    dni: '',
    grado: [],
    edad: { id: 0, name: '' },
    sexo: { id: 0, name: '' },
    institucion: '',
    region: 0,
    anosExperiencia: '',
    distrito: '',
  });

  const [distritosDisponibles, setDistritosDisponibles] = useState<string[]>([]);
  const [respuestasEvaluacion, setRespuestasEvaluacion] = useState<{[key: string]: number}>({});
  const { getEvaluacionEscalaLikert,getPreguntasEvaluacionEscalaLikert, saveEvaluacionEscalaLikert, evaluacionEscalaLikert } = useTituloDeCabecera()
  // Función para obtener distritos según la región
  const obtenerDistritosPorRegion = (regionId: number) => {
    const provincia = distritosPuno.find(p => p.id === regionId);
    return provincia ? provincia.distritos : [];
  };

  // Actualizar distritos cuando cambie la región
  useEffect(() => {
    if (datos.region && datos.region > 0) {
      const distritos = obtenerDistritosPorRegion(datos.region);
      setDistritosDisponibles(distritos);
      // Limpiar distrito seleccionado si no está en la nueva lista
      if (datos.distrito && !distritos.includes(datos.distrito)) {
        setDatos(prev => ({ ...prev, distrito: '' }));
      }
    } else {
      setDistritosDisponibles([]);
      setDatos(prev => ({ ...prev, distrito: '' }));
    }
  }, [datos.region]);

  // Actualizar datos cuando currentUserData esté disponible
  useEffect(() => {
    if (currentUserData) {
      setDatos(prev => ({
        ...prev,
        nombres: currentUserData.nombres || prev.nombres,
        apellidos: currentUserData.apellidos || prev.apellidos,
        dni: currentUserData.dni || prev.dni,
        sexo: currentUserData.conocimientoPedagogico?.sexo || prev.sexo,
        institucion: currentUserData.institucion || prev.institucion,
        region: currentUserData.region || prev.region,
        distrito: currentUserData.distrito || prev.distrito,
        grado: currentUserData.grados ? currentUserData.grados.map(g => g.toString()) : prev.grado,
        edad: currentUserData.conocimientoPedagogico?.edad || prev.edad,
      }));
    }
    getEvaluacionEscalaLikert('5j5WEYsHCUM9SDkXmlm1')
    getPreguntasEvaluacionEscalaLikert('5j5WEYsHCUM9SDkXmlm1')
  }, [currentUserData]);

  const handleInputChange = (field: keyof ConocimientoPedagogico, value: string | string[] | {id?:number,name?:string}) => {
    setDatos((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGradoChange = (opcion: {id: number, name: string}) => {
    setDatos((prev) => ({
      ...prev,
      grado: prev.grado?.some(g => g === opcion.id.toString()) 
        ? prev.grado.filter(g => g !== opcion.id.toString())
        : [...(prev.grado || []), opcion.id.toString()]
    }));
  };

  const handleEdadChange = (opcion: {id: number, name: string}) => {
    setDatos((prev) => ({
      ...prev,
      edad: opcion
    }));
  };

  const handleSexoChange = (opcion: {id: number, name: string}) => {
    setDatos((prev) => ({
      ...prev,
      sexo: opcion
    }));
  };

  // Función para manejar cambios en las respuestas de radio
  const handleRespuestaChange = (preguntaId: string, puntaje: number) => {
    setRespuestasEvaluacion(prev => ({
      ...prev,
      [preguntaId]: puntaje
    }))
  };

  // Función para validar si todos los campos están completos
  const validarFormularioCompleto = () => {
    // Validar datos personales y profesionales
    const datosPersonalesCompletos = 
      (datos.nombres?.trim() || '') !== '' &&
      (datos.apellidos?.trim() || '') !== '' &&
      (datos.dni?.trim() || '') !== '' &&
      (datos.grado?.length || 0) > 0 &&
      (datos.edad?.id || 0) > 0 &&
      (datos.sexo?.id || 0) > 0;

    // Validar datos institucionales
    const datosInstitucionalesCompletos = 
      (datos.institucion?.trim() || '') !== '' &&
      (datos.region || 0) > 0 &&
      (datos.distrito?.trim() || '') !== '' &&
      (datos.anosExperiencia?.trim() || '') !== '';

    // Validar respuestas de evaluación
    const evaluacionCompleta = preguntaEvaluacionLikert.length > 0 && 
      preguntaEvaluacionLikert.every(pregunta => 
        pregunta.id && respuestasEvaluacion[pregunta.id] !== undefined
      );

    return datosPersonalesCompletos && datosInstitucionalesCompletos && evaluacionCompleta;
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Crear array de preguntas con sus respuestas
    const preguntasConRespuestas = preguntaEvaluacionLikert
      .filter(pregunta => pregunta.id)
      .map(pregunta => ({
        id: pregunta.id,
        pregunta: pregunta.pregunta,
        orden: pregunta.orden,
        respuesta: respuestasEvaluacion[pregunta.id!]
      }))
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));

    const datosCompletos = {
      datosDocente: datos,
      evaluacion: {
        preguntas: preguntasConRespuestas,
        totalPreguntas: preguntasConRespuestas.length,
        respuestasCompletas: preguntasConRespuestas.length === preguntaEvaluacionLikert.length
      }
    };
    saveEvaluacionEscalaLikert('5j5WEYsHCUM9SDkXmlm1', datosCompletos, evaluacionEscalaLikert);

    console.log('Datos completos de la autoevaluación:', datosCompletos);
    console.log('Datos del docente:', datos);
    console.log('Preguntas con respuestas:', preguntasConRespuestas);
    
    // Aquí puedes agregar la lógica para enviar los datos a tu backend
    alert('Autoevaluación enviada correctamente');
  };
  console.log('currentUserData', currentUserData);
  console.log('datos', datos);
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{evaluacionEscalaLikert.name}</h1>
        <p className={styles.subtitle}>Autoevaluación Docente</p>
      </div>

      <form id="evaluacionForm" onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Información Personal y Profesional</h2>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Nombres:</label>
            <input
              type="text"
              value={datos.nombres}
              onChange={(e) => handleInputChange('nombres', e.target.value)}
              className={styles.textInput}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Apellidos:</label>
            <input
              type="text"
              value={datos.apellidos}
              onChange={(e) => handleInputChange('apellidos', e.target.value)}
              className={styles.textInput}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>DNI:</label>
            <input
              type="text"
              value={datos.dni}
              onChange={(e) => handleInputChange('dni', e.target.value)}
              className={styles.textInput}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Grado:</label>
            <div className={styles.radioGroup}>
              {gradosDeColegio.map((opcion) => (
                <label key={opcion.id} className={styles.radioLabel}>
                  <input
                    type="checkbox"
                    value={opcion.id}
                    checked={datos.grado?.includes(opcion.id.toString()) || false}
                    onChange={() => handleGradoChange(opcion)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioText}>{opcion.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Edad:</label>
            <div className={styles.radioGroup}>
              {rangoEdad.map((opcion) => (
                <label key={opcion.id} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="edad"
                    value={opcion.name}
                    checked={datos.edad?.id === opcion.id}
                    onChange={() => handleEdadChange(opcion)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioText}>{opcion.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Sexo:</label>
            <div className={styles.radioGroup}>
              {genero.map((opcion) => (
                <label key={opcion.id} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="sexo"
                    value={opcion.name}
                    checked={datos.sexo?.id === opcion.id}
                    onChange={() => handleSexoChange(opcion)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioText}>{opcion.name.charAt(0).toUpperCase() + opcion.name.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Información Institucional</h2>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Institución educativa:</label>
            <input
              type="text"
              value={datos.institucion}
              onChange={(e) => handleInputChange('institucion', e.target.value)}
              className={styles.textInput}
              required
            />
          </div>
           <div className={styles.fieldGroup}>
             <label className={styles.label}>Región:</label>
             <input
               type="text"
               value={regionTexto(datos.region?.toString() || '') || ''}
               onChange={(e) => handleInputChange('region', e.target.value)}
               className={styles.textInput}
               required
             />
           </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Distrito:</label>
            <select
              value={datos.distrito}
              onChange={(e) => handleInputChange('distrito', e.target.value)}
              className={styles.textInput}
              required
              disabled={distritosDisponibles.length === 0}
            >
              <option value="">Seleccione un distrito</option>
              {distritosDisponibles.map((distrito) => (
                <option key={distrito} value={distrito}>
                  {distrito}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Años de experiencia docente:</label>
            <input
              type="number"
              value={datos.anosExperiencia}
              onChange={(e) => {
                const value = e.target.value;
                // Solo permitir números y máximo 2 dígitos
                if (value === '' || /^\d{1,2}$/.test(value)) {
                  handleInputChange('anosExperiencia', value);
                }
              }}
              className={styles.numberInput}
              min="0"
              max="99"
              placeholder="00"
              required
            />
            <span className={styles.unit}>años</span>
          </div>


          
        </div>


      </form>

      {/* Botón fijo en la parte inferior */}
      <div className={styles.fixedButtonContainer}>
        <button 
          type="submit" 
          form="evaluacionForm" 
          className={`${styles.fixedSubmitButton} ${!validarFormularioCompleto() ? styles.disabledButton : ''}`}
          disabled={!validarFormularioCompleto()}
        >
          {validarFormularioCompleto() ? 'Enviar Autoevaluación' : 'Complete todos los campos'}
        </button>
      </div>

<div className={styles.leyendaContainer}>
  <h4 className={styles.leyendaTitle}>Leyenda de Puntuación:</h4>
  <div className={styles.leyendaContent}>
    {evaluacionEscalaLikert.puntaje?.map((opcion, index) => (
      <div key={index} className={styles.leyendaItem}>
        <span className={styles.leyendaPuntaje}>{(opcion.value || 0) + 1}</span>
        <span className={styles.leyendaDescripcion}>{opcion.name || `Opción ${(opcion.value || 0) + 1}`}</span>
      </div>
    ))}
  </div>
</div>
      {/* Tabla de Evaluación */}
      {preguntaEvaluacionLikert.length > 0 && evaluacionEscalaLikert.puntaje && (
        <div className={styles.evaluacionTableContainer}>
          <h3 className={styles.evaluacionTableTitle}>Evaluación de Competencias y Conocimientos</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.evaluacionTable}>
              <thead>
                <tr>
                  <th className={styles.questionColumn}>COMPETENCIAS Y CONOCIMIENTOS</th>
                  {evaluacionEscalaLikert.puntaje?.map((opcion, index) => (
                    <th key={index} className={styles.scoreColumn}>
                      {(opcion.value || 0) + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preguntaEvaluacionLikert
                  .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                  .map((pregunta, index) => (
                    <tr key={pregunta.id} className={styles.evaluacionRow}>
                      <td className={styles.questionCell}>
                        {index + 1}. {pregunta.pregunta}
                      </td>
                      {evaluacionEscalaLikert.puntaje?.map((opcion, opcionIndex) => (
                        <td key={opcionIndex} className={styles.scoreCell}>
                          <input
                            type="radio"
                            name={`pregunta_${pregunta.id}`}
                            value={opcion.value}
                            checked={respuestasEvaluacion[pregunta.id || ''] === opcion.value}
                            onChange={() => handleRespuestaChange(pregunta.id || '', opcion.value || 0)}
                            className={styles.radioInput}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConocimientoPedagogico;
