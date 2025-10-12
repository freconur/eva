import React, { useState, useEffect } from 'react';
import styles from './conocimiento-pedagogico.module.css';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import type { ConocimientoPedagogico } from '@/features/types/types';
import {genero, rangoEdad, gradosDeColegio, regionTexto, regiones} from '@/fuctions/regiones'
import { distritosPuno } from '@/fuctions/provinciasPuno';
import { useTituloDeCabecera } from '@/features/hooks/useTituloDeCabecera';
import { useRouter } from 'next/router';



const ConocimientoPedagogico = () => {
  const { currentUserData, preguntaEvaluacionLikert } = useGlobalContext();
const router = useRouter()
const { idEvaluacion } = router.query
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
    linkDocumentos: '',
  });

  const [distritosDisponibles, setDistritosDisponibles] = useState<string[]>([]);
  const [respuestasEvaluacion, setRespuestasEvaluacion] = useState<{[key: string]: number}>({});
  const [linkDocumentos, setLinkDocumentos] = useState<string>('');
  const [linkError, setLinkError] = useState<string>('');
  const { getEvaluacionEscalaLikert,getPreguntasEvaluacionEscalaLikert, saveEvaluacionEscalaLikert, evaluacionEscalaLikert,evaluacionEscalaLikertByUsuario,escalaLikertByUsuario } = useTituloDeCabecera()


  // Función para validar URL
  const validarURL = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };
  
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

  // Actualizar datos cuando tengamos los 3 datos necesarios
  useEffect(() => {
    // Solo ejecutar cuando tengamos los 3 datos necesarios
    if (currentUserData.dni && router.query.idEvaluacion && escalaLikertByUsuario?.datosDocente) {
      setDatos(prev => ({
        ...prev,
        nombres: currentUserData.nombres || prev.nombres,
        apellidos: currentUserData.apellidos || prev.apellidos,
        dni: currentUserData.dni || prev.dni,
        sexo: currentUserData.conocimientoPedagogico?.sexo || escalaLikertByUsuario?.datosDocente?.sexo || prev.sexo,
        institucion: currentUserData.institucion || prev.institucion,
        region: currentUserData.region || escalaLikertByUsuario?.datosDocente?.region || prev.region,
        distrito: currentUserData.distrito || escalaLikertByUsuario?.datosDocente?.distrito || prev.distrito,
        grado: currentUserData?.grados?.map(g => g.toString()) || escalaLikertByUsuario?.datosDocente?.grado?.map(g => g.toString()) || prev.grado,
        edad: currentUserData.conocimientoPedagogico?.edad || escalaLikertByUsuario?.datosDocente?.edad || prev.edad,
        anosExperiencia: currentUserData.anosExperiencia || escalaLikertByUsuario?.datosDocente?.anosExperiencia || prev.anosExperiencia,
        linkDocumentos: escalaLikertByUsuario?.linkDocumentos 
          ? (Array.isArray(escalaLikertByUsuario.linkDocumentos) 
              ? escalaLikertByUsuario.linkDocumentos[0] 
              : escalaLikertByUsuario.linkDocumentos)
          : prev.linkDocumentos,
      }));
      
      // Ejecutar las peticiones solo cuando tengamos todos los datos
      getEvaluacionEscalaLikert(`${router.query.idEvaluacion}`)
      getPreguntasEvaluacionEscalaLikert(`${router.query.idEvaluacion}`)
    }
  }, [currentUserData.dni, router.query.idEvaluacion, escalaLikertByUsuario?.datosDocente]);
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

  const handleRegionChange = (opcion: {id: number, region: string}) => {
    setDatos((prev) => ({
      ...prev,
      region: opcion.id
    }));
  };

  // Función para manejar cambios en las respuestas de radio
  const handleRespuestaChange = (preguntaId: string, puntaje: number) => {
    setRespuestasEvaluacion(prev => ({
      ...prev,
      [preguntaId]: puntaje
    }))
  };

  // Función para manejar el cambio del link de documentos
  const handleLinkChange = (value: string) => {
    setLinkDocumentos(value);
    if (value.trim() === '') {
      setLinkError('');
    } else if (!validarURL(value)) {
      setLinkError('Por favor, ingrese una URL válida (debe comenzar con http:// o https://)');
    } else {
      setLinkError('');
    }
  };

  // Función para validar si todos los campos están completos
  const validarFormularioCompleto = () => {
    // Validar datos personales básicos (siempre requeridos)
    const datosPersonalesBasicos = 
      (datos.nombres?.trim() || '') !== '' &&
      (datos.apellidos?.trim() || '') !== '' &&
      (datos.dni?.trim() || '') !== '';

    // Validar datos personales adicionales solo si el rol no es 1 ni 2
    const datosPersonalesAdicionales = (currentUserData?.rol === 1 || currentUserData?.rol === 2) || (
      (datos.grado?.length || 0) > 0 &&
      (datos.edad?.id || 0) > 0 &&
      (datos.sexo?.id || 0) > 0
    );

    // Validar datos institucionales básicos (siempre requeridos)
    const datosInstitucionalesBasicos = (datos.region || 0) > 0;

    // Validar datos institucionales adicionales solo si el rol no es 1
    const datosInstitucionalesAdicionales = currentUserData?.rol === 1 || (
      (datos.institucion?.trim() || '') !== '' &&
      (datos.distrito?.trim() || '') !== '' &&
      (datos.anosExperiencia?.trim() || '') !== ''
    );

    // Validar respuestas de evaluación
    const evaluacionCompleta = preguntaEvaluacionLikert.length > 0 && 
      preguntaEvaluacionLikert.every(pregunta => 
        pregunta.id && respuestasEvaluacion[pregunta.id] !== undefined
      );

    // Validar link de documentos
    const linkDocumentosValido = (datos.linkDocumentos?.trim() || '') !== '' && validarURL(datos.linkDocumentos || '');

    return datosPersonalesBasicos && 
           datosPersonalesAdicionales && 
           datosInstitucionalesBasicos && 
           datosInstitucionalesAdicionales && 
           evaluacionCompleta &&
           linkDocumentosValido;
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
      },
      linkDocumentos: linkDocumentos
    };
    saveEvaluacionEscalaLikert(`${idEvaluacion}`, datosCompletos, evaluacionEscalaLikert);

    /* console.log('Datos completos de la autoevaluación:', datosCompletos);
    console.log('Datos del docente:', datos);
    console.log('Preguntas con respuestas:', preguntasConRespuestas); */
    
    // Aquí puedes agregar la lógica para enviar los datos a tu backend
    alert('Autoevaluación enviada correctamente');
  };
  useEffect(() => {
    evaluacionEscalaLikertByUsuario(`${idEvaluacion}`)
  },[currentUserData.dni])


  // Autocompletar respuestas de evaluación cuando escalaLikertByUsuario existe
  useEffect(() => {
    if (escalaLikertByUsuario?.evaluacion?.preguntas && escalaLikertByUsuario.evaluacion.preguntas.length > 0) {
      const respuestasExistentes: {[key: string]: number} = {};
      
      escalaLikertByUsuario.evaluacion.preguntas.forEach(pregunta => {
        if (pregunta.id && pregunta.respuesta !== undefined) {
          respuestasExistentes[pregunta.id] = pregunta.respuesta;
        }
      });
      
      setRespuestasEvaluacion(respuestasExistentes);
    }
  }, [escalaLikertByUsuario]);

  // Autocompletar link de documentos cuando escalaLikertByUsuario existe
  useEffect(() => {
    if (escalaLikertByUsuario?.linkDocumentos) {
      const linkValue = Array.isArray(escalaLikertByUsuario.linkDocumentos) 
        ? escalaLikertByUsuario.linkDocumentos[0] 
        : escalaLikertByUsuario.linkDocumentos;
      setLinkDocumentos(linkValue);
      setDatos(prev => ({
        ...prev,
        linkDocumentos: linkValue
      }));
    }
  }, [escalaLikertByUsuario]);
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

          {(currentUserData?.rol !== 1 && currentUserData?.rol !== 2) && (
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
          )}

          {(currentUserData?.rol !== 1 && currentUserData?.rol !== 2) && (
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
          )}

          {(currentUserData?.rol !== 1 && currentUserData?.rol !== 2) && (
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
          )}
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Información Institucional</h2>

          {currentUserData?.rol !== 1 && (
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
          )}
           <div className={styles.fieldGroup}>
             <label className={styles.label}>Región:</label>
             <select
               value={datos.region || ''}
               onChange={(e) => {
                 const regionId = parseInt(e.target.value);
                 const region = regiones.find(r => r.id === regionId);
                 if (region) {
                   handleRegionChange(region);
                 }
               }}
               className={styles.textInput}
               required
             >
               <option value="">Seleccione una región</option>
               {regiones.map((region) => (
                 <option key={region.id} value={region.id}>
                   {region.region}
                 </option>
               ))}
             </select>
           </div>

          {currentUserData?.rol !== 1 && (
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Distrito:</label>
              <select
                value={datos.distrito}
                onChange={(e) => handleInputChange('distrito', e.target.value)}
                className={styles.textInput}
                required
              >
                <option value="">Seleccione un distrito</option>
                {distritosDisponibles.map((distrito) => (
                  <option key={distrito} value={distrito}>
                    {distrito}
                  </option>
                ))}
              </select>
            </div>
          )}

          {currentUserData?.rol !== 1 && (
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
          )}


          
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
          <h3 className={styles.evaluacionTableTitle}>
            {currentUserData?.rol === 3 ? 'Autorreporte Docente' : 'Autorreporte Gestión Pedagógica'}
          </h3>
          <div className={styles.tableWrapper}>
            <table className={styles.evaluacionTable}>
              <thead>
                <tr>
                  <th className={styles.questionColumn}>ITEMS</th>
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

      {/* Campo de Link de Documentos */}
      <div className={styles.section}>
        <div className={styles.fieldGroup}>
        <p className={styles.notaImportante}>{evaluacionEscalaLikert.descripcionLink}</p>
          <label className={styles.label}>Link de documentos:</label>
          <input
            type="url"
            value={datos.linkDocumentos || ''}
            onChange={(e) => {
              const value = e.target.value;
              handleInputChange('linkDocumentos', value);
              handleLinkChange(value);
            }}
            className={`${styles.textInput} ${linkError ? styles.errorInput : ''}`}
            placeholder="https://ejemplo.com/documentos"
            required
          />
          {linkError && (
            <span className={styles.errorMessage}>{linkError}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConocimientoPedagogico;
