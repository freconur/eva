import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useSeguimeintoEvaluaciones } from '@/features/hooks/useSeguimientoEvaluaciones';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { rolTexto, regionTexto, getGradoTexto, getSeccionTexto } from '@/fuctions/regiones';
import { getAllMonths, currentMonth } from '@/fuctions/dates';
import styles from './seguimiento-evaluaciones.module.css';
const SeguimientoEvaluaciones = () => {
  const route = useRouter();
  const idEvaluacion = route.query.idEvaluacion;
  const { usuarioPorDni, evaluaciones } = useGlobalContext();
  const { buscarUsuarioPorDni, todasLasEvaluaciones, estudiantesDelDocente } = useSeguimeintoEvaluaciones();
  // Estado para el input y validación
  const [inputValue, setInputValue] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedEvaluacion, setSelectedEvaluacion] = useState<string>('');
  const [expandedDocente, setExpandedDocente] = useState<string | null>(null);
  const [loadingEstudiantes, setLoadingEstudiantes] = useState<string | null>(null);
  const [loadingUsuario, setLoadingUsuario] = useState(false);

  // Función para validar que tenga exactamente 8 dígitos
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Solo permitir números
    const numericValue = value.replace(/\D/g, '');

    setInputValue(numericValue);

    // Validar que tenga exactamente 8 dígitos
    setIsValid(numericValue.length === 8);
  };

  useEffect(() => {
    todasLasEvaluaciones()

  },[])
  // Función handler (sin lógica aún)
  const handleSubmit = async () => {
    console.log('Valor ingresado:', inputValue);
    setLoadingUsuario(true);
    try {
      await buscarUsuarioPorDni(inputValue);
    } catch (error) {
      console.error('Error al buscar usuario:', error);
    } finally {
      setLoadingUsuario(false);
    }
  };

  // Función para manejar el clic en un docente
  const handleDocenteClick = async (dniDocente: string) => {
    if (expandedDocente === dniDocente) {
      // Si ya está expandido, lo contraemos
      setExpandedDocente(null);
      return;
    }

    // Si no está expandido, lo expandimos y cargamos los estudiantes
    setExpandedDocente(dniDocente);
    setLoadingEstudiantes(dniDocente);
    
    try {
      await estudiantesDelDocente(dniDocente, selectedMonth, selectedEvaluacion, usuarioPorDni);
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
    } finally {
      setLoadingEstudiantes(null);
    }
  };

  console.log('evaluaciones', evaluaciones);
  console.log('usuarioPorDni', usuarioPorDni);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Seguimiento Evaluaciones</h1>

      <div className={styles.controlsContainer}>
        <div className={styles.controlsRow}>
          <div className={styles.controlGroup}>
            <div className={styles.inputGroup}>
              <label htmlFor="numericInput" className={styles.label}>
                Ingrese un numero de dni (8 dígitos):
              </label>

              <input
                id="numericInput"
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Ej: 12345678"
                maxLength={8}
                className={`${styles.input} ${isValid ? styles.valid : styles.invalid}`}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!isValid || loadingUsuario}
              className={styles.submitButton}
            >
              {loadingUsuario ? (
                <div className={styles.buttonLoader}>
                  <div className={styles.spinner}></div>
                  <span>Buscando...</span>
                </div>
              ) : (
                'Enviar'
              )}
            </button>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="monthSelect" className={styles.label}>
              Seleccionar mes:
            </label>
            <select
              id="monthSelect"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={styles.select}
            >
              <option value="">Selecciona un mes</option>
              {getAllMonths
                .filter((month) => month.id <= currentMonth)
                .map((month) => (
                  <option key={month.id} value={month.id}>
                    {month.name}
                  </option>
                ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="evaluacionSelect" className={styles.label}>
              Seleccionar evaluación:
            </label>
            <select
              id="evaluacionSelect"
              value={selectedEvaluacion}
              onChange={(e) => {
                console.log('Evaluación seleccionada:', e.target.value);
                setSelectedEvaluacion(e.target.value);
              }}
              className={`${styles.select} ${styles.evaluacion}`}
            >
              <option value="">Selecciona una evaluación</option>
              {evaluaciones && evaluaciones.map((evaluacion) => (
                <option  key={evaluacion.id} value={evaluacion.id}>
                  {evaluacion.nombre?.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {inputValue && (
          <div className={`${styles.validationMessage} ${isValid ? styles.valid : styles.invalid}`}>
            {isValid ? (
              <span>✓ Válido (8 dígitos)</span>
            ) : (
              <span>
                ✗ Debe tener exactamente 8 dígitos ({inputValue.length}/8)
              </span>
            )}
          </div>
        )}
      </div>
      {/* Loader general mientras se busca el usuario */}
      {loadingUsuario && (
        <div className={styles.generalLoader}>
          <div className={styles.loaderContainer}>
            <div className={styles.loaderSpinner}></div>
            <p className={styles.loaderText}>Buscando usuario...</p>
          </div>
        </div>
      )}

      {/* Sección para mostrar los datos del usuario */}
      {usuarioPorDni && Object.keys(usuarioPorDni).length > 0 && !loadingUsuario && (
        <div className={styles.userDataContainer}>
          {/* Verificación del rol del usuario (sin mostrar mensaje) */}
          {usuarioPorDni.rol === 2 && (
            <div style={{ display: 'none' }}>
              {/* Lógica para director - oculta visualmente */}
            </div>
          )}

          {usuarioPorDni.rol === 3 && (
            <div style={{ display: 'none' }}>
              {/* Lógica para docente - oculta visualmente */}
            </div>
          )}

          <h3 className={styles.userDataTitle}>Datos del Usuario:</h3>
          <div className={styles.userDataGrid}>
            <div className={styles.dataField}>
              <div className={styles.dataLabel}>DNI:</div>
              <div className={styles.dataValue}>{usuarioPorDni.dni || 'N/A'}</div>
            </div>
            <div className={styles.dataField}>
              <div className={styles.dataLabel}>Nombres:</div>
              <div className={styles.dataValue}>
                {usuarioPorDni.nombres || 'N/A'}
              </div>
            </div>
            <div className={styles.dataField}>
              <div className={styles.dataLabel}>Apellidos:</div>
              <div className={styles.dataValue}>
                {usuarioPorDni.apellidos || 'N/A'}
              </div>
            </div>
            <div className={styles.dataField}>
              <div className={styles.dataLabel}>Institución:</div>
              <div className={styles.dataValue}>
                {usuarioPorDni.institucion || 'N/A'}
              </div>
            </div>
            <div className={styles.dataField}>
              <div className={styles.dataLabel}>Distrito:</div>
              <div className={styles.dataValue}>
                {usuarioPorDni.distrito || 'N/A'}
              </div>
            </div>
            <div className={styles.dataField}>
              <div className={styles.dataLabel}>Región:</div>
              <div className={styles.dataValue}>
                {usuarioPorDni.region ? regionTexto(String(usuarioPorDni.region)) : 'N/A'}
              </div>
            </div>
            {usuarioPorDni.rol === 3 && (
              <div className={styles.dataField}>
                <div className={styles.dataLabel}>DNI Director:</div>
                <div className={styles.dataValue}>
                  {usuarioPorDni.dniDirector || 'N/A'}
                </div>
              </div>
            )}
          </div>

          {/* Sección para mostrar los docentes del director */}
          {usuarioPorDni.rol === 2 && (
            <div className={styles.docentesSection}>
              <h4 className={styles.docentesTitle}>
                Docentes del Director:
              </h4>

              {usuarioPorDni.docentesDelDirector && usuarioPorDni.docentesDelDirector.length > 0 ? (
                <div className={styles.docentesList}>
                  {usuarioPorDni.docentesDelDirector.map((docente, index) => {
                    const isClickable = selectedMonth && selectedEvaluacion;
                    return (
                      <div key={index} className={styles.docenteCard}>
                        <div
                          onClick={() => {
                            if (isClickable && docente.dni) {
                              handleDocenteClick(docente.dni);
                            }
                          }}
                          className={`${styles.docenteHeader} ${isClickable ? styles.clickable : styles.disabled}`}
                        >
                          <div className={styles.docenteData}>
                            <div className={styles.dataField}>
                              <div className={styles.dataLabel}>DNI:</div>
                              <div className={styles.dataValue}>
                                {docente.dni || 'N/A'}
                              </div>
                            </div>
                            <div className={styles.dataField}>
                              <div className={styles.dataLabel}>Nombres:</div>
                              <div className={styles.dataValue}>
                                {docente.nombres || 'N/A'}
                              </div>
                            </div>
                            <div className={styles.dataField}>
                              <div className={styles.dataLabel}>Apellidos:</div>
                              <div className={styles.dataValue}>
                                {docente.apellidos || 'N/A'}
                              </div>
                            </div>
                            <div className={styles.dataField}>
                              <div className={styles.dataLabel}>Grado:</div>
                              <div className={styles.dataValue}>
                                {docente.grados
                                  ? docente.grados.map((grado) => getGradoTexto(grado)).join(', ')
                                  : 'N/A'}
                              </div>
                            </div>
                            <div className={styles.dataField}>
                              <div className={styles.dataLabel}>Sección:</div>
                              <div className={styles.dataValue}>
                                {docente.secciones
                                  ? docente.secciones
                                      .map((seccion) => getSeccionTexto(seccion))
                                      .join(', ')
                                  : 'N/A'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Indicador de expansión */}
                          <div className={styles.expansionIndicator}>
                            {loadingEstudiantes === docente.dni ? (
                              <div className={styles.spinner} />
                            ) : (
                              <div className={expandedDocente === docente.dni ? styles.expanded : ''}>
                                ▼
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Sección de estudiantes (dropdown) */}
                        {expandedDocente === docente.dni && (
                          <div className={styles.estudiantesSection}>
                            <h5 className={styles.estudiantesTitle}>
                              👨‍🎓 Estudiantes del Docente:
                            </h5>
                            
                            {loadingEstudiantes === docente.dni ? (
                              <div className={styles.loadingMessage}>
                                Cargando estudiantes...
                              </div>
                            ) : usuarioPorDni.estudiantesDelDocente && usuarioPorDni.estudiantesDelDocente.length > 0 ? (
                              <div className={styles.estudiantesList}>
                                {usuarioPorDni.estudiantesDelDocente.map((estudiante, estIndex) => (
                                  <div key={estIndex} className={styles.estudianteCard}>
                                    <div className={styles.estudianteData}>
                                      <div className={styles.estudianteField}>
                                        <div className={styles.estudianteLabel}>DNI:</div>
                                        <div className={styles.estudianteValue}>{estudiante.dni || 'N/A'}</div>
                                      </div>
                                      <div className={styles.estudianteField}>
                                        <div className={styles.estudianteLabel}>Nombres y Apellidos:</div>
                                        <div className={styles.estudianteValue}>{estudiante.nombresApellidos || 'N/A'}</div>
                                      </div>
                                      <div className={styles.estudianteField}>
                                        <div className={styles.estudianteLabel}>Grado:</div>
                                        <div className={styles.estudianteValue}>
                                          {estudiante.grado ? getGradoTexto(estudiante.grado) : 'N/A'}
                                        </div>
                                      </div>
                                      <div className={styles.estudianteField}>
                                        <div className={styles.estudianteLabel}>Sección:</div>
                                        <div className={styles.estudianteValue}>
                                          {estudiante.seccion ? getSeccionTexto(estudiante.seccion) : 'N/A'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className={`${styles.statusMessage} ${styles.warning}`}>
                                📝 No se encontraron estudiantes para este docente
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`${styles.statusMessage} ${styles.warning}`}>
                  📝 El director no tiene docentes creados
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mensaje cuando no se encuentra usuario */}
      {usuarioPorDni && Object.keys(usuarioPorDni).length === 0 && inputValue && (
        <div className={`${styles.statusMessage} ${styles.warning}`}>
          No se encontró ningún usuario con el DNI ingresado.
        </div>
      )}
    </div>
  );
};

export default SeguimientoEvaluaciones;
