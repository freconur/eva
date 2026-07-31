import React, { useState, useEffect, useRef, useMemo } from 'react';
import GraficoTendencia from './graficoTendencia';
import styles from './Acordeon.module.css';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { RiSearchLine, RiArrowDownSLine, RiCloseLine, RiExchangeLine, RiErrorWarningLine } from 'react-icons/ri';
import { Evaluaciones } from '@/features/types/types';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getGradoTexto } from '@/fuctions/regiones';

interface AcordeonGraficosTendenciaProps {
  idEvaluacion: string;
  dniDirector?: string;
}

const AcordeonGraficosTendencia: React.FC<AcordeonGraficosTendenciaProps> = ({
  idEvaluacion,
  dniDirector
}) => {
  const [mostrarGraficos, setMostrarGraficos] = useState(false);
  const [evaluacionesAComparar, setEvaluacionesAComparar] = useState<string[]>([]);
  
  // Custom dropdown states
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Firestore local loading state for evaluations
  const [evaluacionesDb, setEvaluacionesDb] = useState<Evaluaciones[]>([]);
  const [loadingEvaluaciones, setLoadingEvaluaciones] = useState(false);

  const { evaluacion } = useGlobalContext();

  const toggleGraficos = () => {
    setMostrarGraficos(!mostrarGraficos);
  };

  // Click outside detector to close custom dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch evaluations directly from Firestore when accordion is opened to guarantee list populates
  useEffect(() => {
    let isMounted = true;
    if (mostrarGraficos && evaluacionesDb.length === 0) {
      const loadEvaluaciones = async () => {
        try {
          if (isMounted) setLoadingEvaluaciones(true);
          const db = getFirestore();
          const coll = collection(db, 'evaluaciones');
          const snap = await getDocs(coll);
          const list: Evaluaciones[] = [];
          snap.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as Evaluaciones);
          });
          if (isMounted) setEvaluacionesDb(list);
        } catch (error) {
          console.error('Error al cargar evaluaciones desde Firestore:', error);
        } finally {
          if (isMounted) setLoadingEvaluaciones(false);
        }
      };
      loadEvaluaciones();
    }
    return () => {
      isMounted = false;
    };
  }, [mostrarGraficos, evaluacionesDb.length]);

  // Filtrar evaluaciones que sean del mismo tipo de evaluación pero que no sea la actual
  const evaluacionesDisponiblesParaComparar = useMemo(() => {
    return (evaluacionesDb || []).filter(
      (ev: Evaluaciones) => ev.id !== idEvaluacion && ev.tipoDeEvaluacion === evaluacion?.tipoDeEvaluacion
    );
  }, [evaluacionesDb, idEvaluacion, evaluacion?.tipoDeEvaluacion]);

  // Filtrar y ordenar evaluaciones del dropdown en base a la búsqueda y colocándolas seleccionadas primero
  const evaluacionesFiltradas = useMemo(() => {
    let filtradas = evaluacionesDisponiblesParaComparar;
    
    if (searchQuery.trim()) {
      const queryNormalized = searchQuery.toLowerCase().trim();
      filtradas = evaluacionesDisponiblesParaComparar.filter((ev: Evaluaciones) => {
        const nombreMatch = (ev.nombre || '').toLowerCase().includes(queryNormalized);
        const gradoTexto = getGradoTexto(ev.grado).toLowerCase();
        const gradoMatch = gradoTexto.includes(queryNormalized);
        return nombreMatch || gradoMatch;
      });
    }

    // Ordenar: seleccionadas primero
    return [...filtradas].sort((a, b) => {
      const aSelected = a.id ? evaluacionesAComparar.includes(a.id) : false;
      const bSelected = b.id ? evaluacionesAComparar.includes(b.id) : false;
      
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0; // Mantener orden original si ambos tienen el mismo estado
    });
  }, [evaluacionesDisponiblesParaComparar, searchQuery, evaluacionesAComparar]);

  // Manejar selección / deselección múltiple
  const handleToggleSeleccion = (id: string) => {
    setEvaluacionesAComparar(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Trigger text dinámico según la cantidad seleccionada
  const triggerText = useMemo(() => {
    if (evaluacionesAComparar.length === 0) return 'Seleccionar evaluaciones para comparar...';
    if (evaluacionesAComparar.length === 1) {
      const ev = evaluacionesDisponiblesParaComparar.find(e => e.id === evaluacionesAComparar[0]);
      return ev ? `${ev.nombre || 'Evaluación'} (${getGradoTexto(ev.grado)})` : '1 evaluación seleccionada';
    }
    return `${evaluacionesAComparar.length} evaluaciones seleccionadas`;
  }, [evaluacionesAComparar, evaluacionesDisponiblesParaComparar]);

  return (
    <div className={styles.accordionContainer}>
      <div 
        onClick={toggleGraficos}
        className={mostrarGraficos ? styles.headerOpen : styles.header}
        style={{ cursor: 'pointer' }}
      >
        <div className={styles.titleGroup}>
          <RiExchangeLine style={{ fontSize: '1.25rem', color: '#3b82f6' }} />
          <h3 className={styles.title}>Gráfico Comparativo de Tendencias entre Evaluaciones</h3>
        </div>
        <div className={mostrarGraficos ? styles.chevronOpen : styles.chevron}>
          <RiArrowDownSLine style={{ fontSize: '1.25rem' }} />
        </div>
      </div>

      <div className={`${styles.contentWrapper} ${mostrarGraficos ? styles.contentWrapperOpen : ''}`}>
        <div className={`${styles.contentInner} ${mostrarGraficos ? styles.innerVisible : ''}`}>
          
          {mostrarGraficos && (
            <div className={styles.comparisonContainer}>
              <h4 className={styles.comparisonTitle}>
                <RiExchangeLine className={styles.comparisonTitleIcon} />
                Comparar con otras Evaluaciones (Múltiple)
              </h4>
              <p className={styles.comparisonDesc}>
                Selecciona una o varias evaluaciones para superponer sus tendencias y comparar los promedios y niveles lado a lado.
              </p>
              
              <div className={styles.dropdownWrapper} ref={dropdownRef}>
                {loadingEvaluaciones ? (
                  <div className={styles.loaderWrapper}>
                    <div className={styles.loaderSpinner} />
                    <span>Cargando evaluaciones...</span>
                  </div>
                ) : evaluacionesDisponiblesParaComparar.length > 0 ? (
                  <>
                    <div className={styles.triggerGroup}>
                      <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className={styles.dropdownTrigger}
                      >
                        <span className={evaluacionesAComparar.length > 0 ? styles.triggerTextValue : styles.triggerTextPlaceholder}>
                          {triggerText}
                        </span>
                        <RiArrowDownSLine className={`${styles.chevronIcon} ${isOpen ? styles.chevronIconOpen : ''}`} />
                      </button>

                      {evaluacionesAComparar.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setEvaluacionesAComparar([]);
                            setSearchQuery('');
                          }}
                          className={styles.clearButton}
                          title="Limpiar comparación"
                        >
                          <RiCloseLine />
                          Limpiar
                        </button>
                      )}
                    </div>

                    {isOpen && (
                      <div className={styles.optionsPanel}>
                        <div className={styles.searchContainer}>
                          <div className={styles.searchRelative}>
                            <input
                              type="text"
                              autoFocus
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Buscar por nombre o grado (ej. 5to grado, 1ro sec)..."
                              className={styles.searchInput}
                            />
                            <RiSearchLine className={styles.searchIcon} />
                            {searchQuery && (
                              <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className={styles.searchClearButton}
                              >
                                <RiCloseLine />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className={styles.optionsList}>
                          {evaluacionesFiltradas.length > 0 ? (
                            evaluacionesFiltradas.map((evalOption: Evaluaciones) => {
                              const isSelected = evalOption.id ? evaluacionesAComparar.includes(evalOption.id) : false;
                              const gradoNombre = getGradoTexto(evalOption.grado);
                              return (
                                <button
                                  key={evalOption.id}
                                  type="button"
                                  onClick={() => {
                                    if (evalOption.id) {
                                      handleToggleSeleccion(evalOption.id);
                                    }
                                  }}
                                  className={`${styles.optionItem} ${
                                    isSelected ? styles.optionItemActive : ''
                                  }`}
                                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {}}
                                      className={styles.optionCheckbox}
                                      style={{ cursor: 'pointer', flexShrink: 0 }}
                                    />
                                    <span style={{ fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {evalOption.nombre || 'Sin nombre'}
                                    </span>
                                  </div>
                                  <span
                                    style={{
                                      fontSize: '0.75rem',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      backgroundColor: isSelected ? '#3b82f6' : '#e2e8f0',
                                      color: isSelected ? '#ffffff' : '#475569',
                                      fontWeight: 600,
                                      whiteSpace: 'nowrap',
                                      flexShrink: 0
                                    }}
                                  >
                                    {gradoNombre}
                                  </span>
                                </button>
                              );
                            })
                          ) : (
                            <div className={styles.noOptions}>
                              No se encontraron evaluaciones que coincidan con &quot;{searchQuery}&quot;.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.noResults} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', backgroundColor: '#f8fafc' }}>
                    <RiErrorWarningLine className={styles.noResultsIcon} />
                    <span className={styles.noResultsText} style={{ color: '#64748b' }}>No hay otras evaluaciones disponibles para comparar.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {mostrarGraficos && (
            <GraficoTendencia
              idEvaluacion={idEvaluacion}
              evaluacionesAComparar={evaluacionesAComparar}
              dniDirector={dniDirector}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AcordeonGraficosTendencia;
