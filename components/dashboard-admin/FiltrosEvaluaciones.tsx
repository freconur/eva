import React from 'react'
import { obtenerNombreMes, resaltarTexto } from './utils/helpers'
import styles from './FiltrosEvaluaciones.module.css'
import { HiEye, HiEyeOff } from 'react-icons/hi'

interface FiltrosEvaluacionesProps {
  mostrarFiltros: boolean
  setMostrarFiltros: (value: boolean) => void
  textoBusqueda: string
  setTextoBusqueda: (value: string) => void
  mostrarDropdown: boolean
  setMostrarDropdown: (value: boolean) => void
  debeMostrarDropdown: boolean
  evaluacionesParaDropdown: any[]
  evaluacionesSeleccionadas: Set<string>
  handleSeleccionarEvaluacion: (evaluacion: any) => Promise<void>
  modoComparacion: 'mes-a-mes' | 'evaluacion-a-evaluacion'
  setModoComparacion: (value: 'mes-a-mes' | 'evaluacion-a-evaluacion') => void
  vistaColumnas: 1 | 2 | 3
  setVistaColumnas: (value: 1 | 2 | 3) => void
  evaluacionesSeleccionadasParaMostrar: any[]
  coleccionesPorEvaluacion: Map<string, any[]>
  coleccionesSeleccionadas: Map<string, Set<number>>
  dropdownColeccionesAbierto: Set<string>
  setDropdownColeccionesAbierto: React.Dispatch<React.SetStateAction<Set<string>>>
  loadingEvaluaciones: Set<string>
  handleToggleEvaluacion: (id: string) => Promise<void>
  handleToggleColeccion: (idEvaluacion: string, coleccion: number) => void
}

const FiltrosEvaluaciones: React.FC<FiltrosEvaluacionesProps> = ({
  mostrarFiltros,
  setMostrarFiltros,
  textoBusqueda,
  setTextoBusqueda,
  mostrarDropdown,
  setMostrarDropdown,
  debeMostrarDropdown,
  evaluacionesParaDropdown,
  evaluacionesSeleccionadas,
  handleSeleccionarEvaluacion,
  modoComparacion,
  setModoComparacion,
  vistaColumnas,
  setVistaColumnas,
  evaluacionesSeleccionadasParaMostrar,
  coleccionesPorEvaluacion,
  coleccionesSeleccionadas,
  dropdownColeccionesAbierto,
  setDropdownColeccionesAbierto,
  loadingEvaluaciones,
  handleToggleEvaluacion,
  handleToggleColeccion
}) => {
  return (
    <>
      {/* Botón para mostrar/ocultar filtros */}
      <button
        onClick={() => setMostrarFiltros(!mostrarFiltros)}
        className={styles.toggleButton}
        title={mostrarFiltros ? 'Ocultar opciones' : 'Mostrar opciones'}
      >
        {mostrarFiltros ? <HiEyeOff className={styles.eyeIcon} /> : <HiEye className={styles.eyeIcon} />}
        <span>Opciones</span>
      </button>
      
      {mostrarFiltros && (
        <div className={`${styles.container} ${styles.containerVisible}`}>
      {/* <h2 className={styles.title}>Filtros</h2> */}
      
      {/* Input de búsqueda con dropdown */}
      <div className={styles.section}>
        <label htmlFor="buscarEvaluacion" className={styles.label}>
          Buscar evaluación:
        </label>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <input
            id="buscarEvaluacion"
            type="text"
            value={textoBusqueda}
            onChange={(e) => {
              setTextoBusqueda(e.target.value)
              setMostrarDropdown(true)
            }}
            onFocus={() => {
              setMostrarDropdown(true)
            }}
            placeholder="Buscar por nombre de evaluación..."
            className={styles.input}
          />
          
          {/* Dropdown de resultados */}
          {debeMostrarDropdown && (
            <div className={`${styles.dropdown} dropdown-evaluaciones`}>
              {evaluacionesParaDropdown.map((evaluacion) => (
                <div
                  key={evaluacion.id}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSeleccionarEvaluacion(evaluacion)
                  }}
                  className={`${styles.dropdownItem} ${
                    evaluacionesSeleccionadas.has(evaluacion.id || '')
                      ? styles.dropdownItemSelected
                      : ''
                  }`}
                >
                  <div className={styles.dropdownItemContent}>
                    <span className={styles.dropdownItemText}>
                      {resaltarTexto((evaluacion.nombre || 'Sin nombre').toLowerCase(), textoBusqueda)}
                    </span>
                    {evaluacionesSeleccionadas.has(evaluacion.id || '') && (
                      <span className={styles.dropdownItemSelectedText}>✓ Seleccionada</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Mensaje cuando no hay resultados */}
          {mostrarDropdown && textoBusqueda.trim() && evaluacionesParaDropdown.length === 0 && (
            <div className={`${styles.dropdown} dropdown-evaluaciones`}>
              <div className={styles.noResults}>
                No se encontraron evaluaciones que coincidan con &quot;{textoBusqueda}&quot;
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selector de modo de comparación */}
      <div className={styles.section}>
        <label htmlFor="modoComparacion" className={styles.label}>
          Modo de Comparación:
        </label>
        <select
          id="modoComparacion"
          value={modoComparacion}
          onChange={(e) => setModoComparacion(e.target.value as 'mes-a-mes' | 'evaluacion-a-evaluacion')}
          className={styles.select}
        >
          <option value="mes-a-mes">Mes a Mes (dentro de la misma evaluación)</option>
          <option value="evaluacion-a-evaluacion">Evaluación con Evaluación</option>
        </select>
        <p className={styles.helpText}>
          {modoComparacion === 'mes-a-mes' 
            ? 'Compara cada mes con el mes anterior de la misma evaluación'
            : 'Compara cada evaluación con la evaluación anterior (una por una)'}
        </p>
      </div>

      {/* Selector de vista de columnas */}
      <div className={styles.section}>
        <label htmlFor="vistaColumnas" className={styles.label}>
          Vista de Gráficos:
        </label>
        <select
          id="vistaColumnas"
          value={vistaColumnas}
          onChange={(e) => setVistaColumnas(Number(e.target.value) as 1 | 2 | 3)}
          className={styles.select}
        >
          <option value={1}>1 Columna</option>
          <option value={2}>2 Columnas</option>
          <option value={3}>3 Columnas</option>
        </select>
        <p className={styles.helpText}>
          Selecciona el número de columnas para mostrar los gráficos
        </p>
      </div>

      {/* Lista de evaluaciones seleccionadas */}
      <div className={styles.section}>
        <h3 className={styles.title}>Evaluaciones</h3>
        <div className={styles.evaluationsList}>
          {evaluacionesSeleccionadasParaMostrar.length > 0 ? (
            <>
              <div className={styles.evaluationsSection}>
                <p className={styles.evaluationsLabel}>Evaluaciones seleccionadas:</p>
                {evaluacionesSeleccionadasParaMostrar.map((evaluacion) => {
                  const idEvaluacion = evaluacion.id || ''
                  const colecciones = coleccionesPorEvaluacion.get(idEvaluacion) || []
                  const coleccionesSeleccionadasEvaluacion = coleccionesSeleccionadas.get(idEvaluacion) || new Set<number>()
                  const estaAbierto = dropdownColeccionesAbierto.has(idEvaluacion)
                  const estaCargando = loadingEvaluaciones.has(idEvaluacion)

                  return (
                    <div
                      key={evaluacion.id}
                      data-evaluacion-id={idEvaluacion}
                      className={styles.evaluationItem}
                    >
                      {/* Header de la evaluación */}
                      <div 
                        className={styles.evaluationHeader}
                        onClick={(e) => {
                          // Solo abrir/cerrar si no se hace click en el botón de eliminar
                          if (!(e.target as HTMLElement).closest(`.${styles.removeButton}`)) {
                            if (colecciones.length > 0) {
                              setDropdownColeccionesAbierto(prev => {
                                const nuevo = new Set(prev)
                                if (nuevo.has(idEvaluacion)) {
                                  nuevo.delete(idEvaluacion)
                                } else {
                                  nuevo.add(idEvaluacion)
                                }
                                return nuevo
                              })
                            }
                          }
                        }}
                        style={{ cursor: colecciones.length > 0 ? 'pointer' : 'default' }}
                      >
                        <span className={styles.evaluationName}>
                          {(evaluacion.nombre || 'Sin nombre').toLowerCase()}
                        </span>
                        <div className={styles.evaluationActions}>
                          {colecciones.length > 0 && (
                            <span className={styles.collectionsButton}>
                              <span className={styles.collectionsButtonText}>{estaAbierto ? '▼' : '▶'} Colecciones</span>
                              <span className={styles.collectionsButtonIcon}>{estaAbierto ? '▼' : '▶'}</span>
                            </span>
                          )}
                          {estaCargando && (
                            <span className={styles.loadingText}>Cargando...</span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleEvaluacion(idEvaluacion)
                            }}
                            className={styles.removeButton}
                            title="Eliminar evaluación"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Dropdown de colecciones con checkboxes */}
                      {estaAbierto && colecciones.length > 0 && (
                        <div className={`${styles.collectionsDropdown} ${styles.collectionsDropdownOpen}`}>
                          <p className={styles.collectionsLabel}>Seleccionar meses:</p>
                          <div className={styles.collectionsList}>
                            {colecciones.map((item: any) => {
                              const coleccionNum = typeof item.coleccion === 'number' 
                                ? item.coleccion 
                                : parseInt(item.coleccion, 10)
                              const estaSeleccionada = coleccionesSeleccionadasEvaluacion.has(coleccionNum)
                              
                              return (
                                <label
                                  key={coleccionNum}
                                  className={styles.collectionItem}
                                >
                                  <input
                                    type="checkbox"
                                    checked={estaSeleccionada}
                                    onChange={() => handleToggleColeccion(idEvaluacion, coleccionNum)}
                                    className={styles.collectionCheckbox}
                                  />
                                  <span className={styles.collectionName}>
                                    {obtenerNombreMes(coleccionNum)}
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Mensaje cuando no hay colecciones */}
                      {estaAbierto && colecciones.length === 0 && !estaCargando && (
                        <div className={`${styles.collectionsDropdown} ${styles.collectionsDropdownOpen}`}>
                          <p className={styles.noCollections}>
                            No hay colecciones disponibles
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <p className={styles.noEvaluations}>
              No hay evaluaciones seleccionadas. Busca y selecciona evaluaciones desde el campo de búsqueda.
            </p>
          )}
        </div>
      </div>
        </div>
      )}
    </>
  )
}

export default FiltrosEvaluaciones

