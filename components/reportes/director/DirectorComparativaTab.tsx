import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  RiLoader4Line,
  RiArrowDownSLine,
  RiSearchLine,
  RiCloseLine,
  RiErrorWarningLine,
} from 'react-icons/ri';
import { MdShowChart, MdRestartAlt } from 'react-icons/md';
import GraficoTendencia from '@/components/reportes/graficoTendencia';
import { getGradoTexto } from '@/fuctions/regiones';
import { Evaluaciones } from '@/features/types/types';
import styles from '@/pages/directores/evaluaciones/evaluacion/reporte/Reporte.module.css';

interface DirectorComparativaTabProps {
  evaluacion?: Evaluaciones;
  evaluacionesDb?: any[];
  loadingEvaluaciones?: boolean;
  dniDirector?: string | number;
  dniDocente?: string | number;
  routeEvaluacionId: string;
  monthSelected: number;
  yearSelected: number;
}

export const DirectorComparativaTab: React.FC<DirectorComparativaTabProps> = ({
  evaluacion,
  evaluacionesDb = [],
  loadingEvaluaciones = false,
  dniDirector,
  dniDocente,
  routeEvaluacionId,
  monthSelected,
  yearSelected,
}) => {
  const [evaluacionesAComparar, setEvaluacionesAComparar] = useState<string[]>([]);
  const [isCompDropdownOpen, setIsCompDropdownOpen] = useState<boolean>(false);
  const [searchCompQuery, setSearchCompQuery] = useState<string>('');
  const compDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside para cerrar dropdown de comparativa
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (compDropdownRef.current && !compDropdownRef.current.contains(event.target as Node)) {
        setIsCompDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar evaluaciones para el comparador excluyendo la actual
  const evaluacionesCompFiltradas = useMemo(() => {
    let list = evaluacionesDb.filter((ev) => ev.id !== evaluacion?.id);
    if (searchCompQuery.trim()) {
      const q = searchCompQuery.toLowerCase().trim();
      list = list.filter((ev) => {
        const nombreMatch = (ev.nombre || '').toLowerCase().includes(q);
        const gradoTexto = getGradoTexto(ev.grado).toLowerCase();
        return nombreMatch || gradoTexto.includes(q);
      });
    }
    return list;
  }, [evaluacionesDb, evaluacion?.id, searchCompQuery]);

  const handleToggleEval = (id: string) => {
    setEvaluacionesAComparar((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setEvaluacionesAComparar([]);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      {/* Tarjeta de Control y Selección de Evaluaciones */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
              <MdShowChart className="w-5 h-5 text-blue-600 shrink-0" />
              <span>Comparativa Histórica de Tendencia con Otras Evaluaciones</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Selecciona una o más evaluaciones para contrastar promedios, evolución longitudinal y logro de aprendizaje.
            </p>
          </div>

          {evaluacionesAComparar.length > 0 && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 transition-colors self-start md:self-auto cursor-pointer shadow-2xs"
              title="Quitar todas las evaluaciones seleccionadas"
            >
              <MdRestartAlt className="w-4 h-4" />
              <span>Limpiar selección ({evaluacionesAComparar.length})</span>
            </button>
          )}
        </div>

        {/* Custom Searchable Multi-Select Dropdown */}
        <div
          className={styles.evalDropdownWrapper}
          ref={compDropdownRef}
          style={{ marginBottom: '1.5rem', width: '100%', maxWidth: '620px' }}
        >
          {loadingEvaluaciones ? (
            <div className={styles.evalDropdownTrigger} style={{ cursor: 'wait' }}>
              <span className={styles.triggerText}>Cargando evaluaciones...</span>
              <RiLoader4Line className={styles.loaderIcon} style={{ fontSize: '1rem', margin: 0 }} />
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsCompDropdownOpen(!isCompDropdownOpen)}
                className={styles.evalDropdownTrigger}
                aria-expanded={isCompDropdownOpen}
                aria-haspopup="listbox"
              >
                <span className={styles.triggerText}>
                  {evaluacionesAComparar.length === 0
                    ? 'Comparar con otras evaluaciones...'
                    : `${evaluacionesAComparar.length} evaluación(es) seleccionada(s) para comparar`}
                </span>
                <RiArrowDownSLine
                  className={`${styles.chevronIcon} ${
                    isCompDropdownOpen ? styles.chevronIconOpen : ''
                  }`}
                />
              </button>

              {isCompDropdownOpen && (
                <div className={styles.evalOptionsPanel} role="listbox">
                  <div className={styles.evalSearchContainer}>
                    <div className={styles.evalSearchRelative}>
                      <input
                        type="text"
                        autoFocus
                        value={searchCompQuery}
                        onChange={(e) => setSearchCompQuery(e.target.value)}
                        placeholder="Buscar por nombre o grado..."
                        className={styles.evalSearchInput}
                      />
                      <RiSearchLine className={styles.evalSearchIcon} />
                      {searchCompQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchCompQuery('')}
                          className={styles.evalSearchClearButton}
                          title="Limpiar búsqueda"
                        >
                          <RiCloseLine />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={styles.evalOptionsList}>
                    {evaluacionesCompFiltradas.map((evalOption) => {
                      const isSelected = evaluacionesAComparar.includes(evalOption.id);
                      const gradoNombre = getGradoTexto(evalOption.grado);
                      return (
                        <button
                          key={evalOption.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleToggleEval(evalOption.id)}
                          className={`${styles.evalOptionItem} ${
                            isSelected ? styles.evalOptionItemActive : ''
                          }`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              style={{ cursor: 'pointer', flexShrink: 0 }}
                            />
                            <span
                              style={{
                                fontWeight: 600,
                                color: '#1e293b',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
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
                              flexShrink: 0,
                            }}
                          >
                            {gradoNombre}
                          </span>
                        </button>
                      );
                    })}
                    {evaluacionesCompFiltradas.length === 0 && (
                      <div className={styles.evalNoResults}>
                        <RiErrorWarningLine className={styles.evalNoResultsIcon} />
                        <span className={styles.evalNoResultsText}>
                          No se encontraron evaluaciones para comparar.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Gráfico de Tendencia Histórica Longitudinal */}
        <div className={styles.graficosContainer}>
          <GraficoTendencia
            idEvaluacion={routeEvaluacionId}
            evaluacionesAComparar={evaluacionesAComparar}
            dniDirector={dniDirector ? String(dniDirector) : undefined}
            dniDocente={dniDocente ? String(dniDocente) : undefined}
            monthSelected={monthSelected}
            yearSelected={Number(yearSelected)}
            ocultarTabla={false}
          />
        </div>
      </div>
    </div>
  );
};

export default DirectorComparativaTab;
