import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  RiLoader4Line,
  RiArrowDownSLine,
  RiSearchLine,
  RiCloseLine,
  RiErrorWarningLine,
} from 'react-icons/ri';
import { MdTrendingUp } from 'react-icons/md';
import GraficoTendenciaColegio from '@/components/grafico-tendencia';
import GraficoTendencia from '@/components/reportes/graficoTendencia';
import { generarDataGraficoPiechart } from '@/features/utils/generar-data-grafico-piechart';
import { getGradoTexto } from '@/fuctions/regiones';
import { Evaluaciones, UserEstudiante } from '@/features/types/types';
import styles from '@/pages/directores/evaluaciones/evaluacion/reporte/Reporte.module.css';

interface DirectorTendenciasTabProps {
  evaluacion: Evaluaciones;
  datosPorMes: any;
  mesesConDataDisponibles: any[];
  promedioGlobal: any;
  monthSelected: number;
  yearSelected: number;
  promedioPorDocente: any[];
  evaluados: number;
  pendientes: number;
  listaPendientes: any[];
  estudiantesFiltrados: UserEstudiante[];
  evaluacionesDb: any[];
  loadingEvaluaciones: boolean;
  dniDirector?: string | number;
  routeEvaluacionId: string;
  estudiantes: UserEstudiante[];
  availableSections: Array<{ id: number | string; name: string }>;
  docentesMap: Map<string, string>;
}

export const DirectorTendenciasTab: React.FC<DirectorTendenciasTabProps> = ({
  evaluacion,
  datosPorMes,
  mesesConDataDisponibles,
  promedioGlobal,
  monthSelected,
  yearSelected,
  promedioPorDocente,
  evaluados,
  pendientes,
  listaPendientes,
  estudiantesFiltrados,
  evaluacionesDb,
  loadingEvaluaciones,
  dniDirector,
  routeEvaluacionId,
  estudiantes,
  availableSections,
  docentesMap,
}) => {
  const [evaluacionesAComparar, setEvaluacionesAComparar] = useState<string[]>([]);
  const [isCompDropdownOpen, setIsCompDropdownOpen] = useState<boolean>(false);
  const [searchCompQuery, setSearchCompQuery] = useState<string>('');
  const compDropdownRef = useRef<HTMLDivElement>(null);

  // Cálculo de promedios y distribución por sección
  const promedioPorSeccion = useMemo(() => {
    if (availableSections.length === 0) return [];

    return availableSections
      .map((seccionObj) => {
        const seccionId = String(seccionObj.id);
        const estudiantesSeccion = estudiantes.filter((est) => String(est.seccion) === seccionId);

        const docentesUnicos = Array.from(
          new Set(
            estudiantesSeccion
              .map((est) => (est.dniDocente ? docentesMap.get(String(est.dniDocente)) : null))
              .filter(Boolean)
          )
        );
        const docenteNombre = docentesUnicos.length > 0 ? docentesUnicos.join(', ') : undefined;
        const totalPuntaje = estudiantesSeccion.reduce((acc, est) => acc + (est.puntaje || 0), 0);
        const promedio = estudiantesSeccion.length > 0 ? totalPuntaje / estudiantesSeccion.length : 0;

        const niveles = { satisfactorio: 0, proceso: 0, inicio: 0, previo: 0 };
        estudiantesSeccion.forEach((est) => {
          const nivel = (est.nivel || '').toLowerCase();
          if (nivel.includes('satisfactorio')) niveles.satisfactorio++;
          else if (nivel.includes('proceso')) niveles.proceso++;
          else if (nivel.includes('previo')) niveles.previo++;
          else if (nivel.includes('inicio')) niveles.inicio++;
        });

        return {
          seccion: seccionObj.name.toUpperCase(),
          docenteNombre,
          promedio: Number(promedio.toFixed(2)),
          cantidad: estudiantesSeccion.length,
          distribucion: niveles,
        };
      })
      .sort((a, b) => {
        const percA = a.cantidad > 0 ? a.distribucion.satisfactorio / a.cantidad : 0;
        const percB = b.cantidad > 0 ? b.distribucion.satisfactorio / b.cantidad : 0;
        return percB - percA;
      });
  }, [estudiantes, availableSections, docentesMap]);

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

  const dataPie = useMemo(() => {
    return [generarDataGraficoPiechart(estudiantesFiltrados, monthSelected, evaluacion)];
  }, [estudiantesFiltrados, monthSelected, evaluacion]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
      {/* 1. Distribución Niveles y Cobertura de Evaluación */}
      <div className={styles.graficosContainer}>
        <GraficoTendenciaColegio
          evaluacion={evaluacion}
          datosPorMes={datosPorMes}
          mesesConDataDisponibles={mesesConDataDisponibles}
          promedioGlobal={promedioGlobal}
          monthSelected={monthSelected}
          promedioPorSeccion={promedioPorSeccion}
          promedioPorDocente={promedioPorDocente}
          evaluados={evaluados}
          pendientes={pendientes}
          listaPendientes={listaPendientes}
          dataGraficoTendenciaNiveles={dataPie}
          soloPieYCobertura={true}
        />
      </div>

      {/* 2. Comparativa de Niveles por Docentes y Secciones */}
      <div className={styles.graficosContainer}>
        <GraficoTendenciaColegio
          evaluacion={evaluacion}
          datosPorMes={datosPorMes}
          mesesConDataDisponibles={mesesConDataDisponibles}
          promedioGlobal={promedioGlobal}
          monthSelected={monthSelected}
          promedioPorSeccion={promedioPorSeccion}
          promedioPorDocente={promedioPorDocente}
          evaluados={evaluados}
          pendientes={pendientes}
          listaPendientes={listaPendientes}
          dataGraficoTendenciaNiveles={dataPie}
          soloDocentesYSecciones={true}
        />
      </div>

      {/* 3. Comparativa Longitudinal con Otras Evaluaciones */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ marginBottom: '1.25rem' }}>
          <h3
            style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#1e293b',
              margin: '0 0 0.25rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <MdTrendingUp style={{ color: '#2563eb', fontSize: '1.25rem', flexShrink: 0 }} />
            <span>Comparativa Histórica de Tendencia con Otras Evaluaciones</span>
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            Selecciona una o más evaluaciones para contrastar promedios y evolución de logro
          </p>
        </div>

        {/* Custom Searchable Dropdown */}
        <div
          className={styles.evalDropdownWrapper}
          ref={compDropdownRef}
          style={{ marginBottom: '1.5rem', width: '100%', maxWidth: '600px' }}
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
              >
                <span className={styles.triggerText}>
                  {evaluacionesAComparar.length === 0
                    ? 'Comparar con otras evaluaciones...'
                    : `${evaluacionesAComparar.length} seleccionada(s) para comparar`}
                </span>
                <RiArrowDownSLine
                  className={`${styles.chevronIcon} ${
                    isCompDropdownOpen ? styles.chevronIconOpen : ''
                  }`}
                />
              </button>

              {isCompDropdownOpen && (
                <div className={styles.evalOptionsPanel}>
                  <div className={styles.evalSearchContainer}>
                    <div className={styles.evalSearchRelative}>
                      <input
                        type="text"
                        autoFocus
                        value={searchCompQuery}
                        onChange={(e) => setSearchCompQuery(e.target.value)}
                        placeholder="Buscar evaluación..."
                        className={styles.evalSearchInput}
                      />
                      <RiSearchLine className={styles.evalSearchIcon} />
                      {searchCompQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchCompQuery('')}
                          className={styles.evalSearchClearButton}
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
                          onClick={() => {
                            setEvaluacionesAComparar((prev) =>
                              prev.includes(evalOption.id)
                                ? prev.filter((id) => id !== evalOption.id)
                                : [...prev, evalOption.id]
                            );
                          }}
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
                              readOnly
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

        <div className={styles.graficosContainer}>
          <GraficoTendencia
            idEvaluacion={routeEvaluacionId}
            evaluacionesAComparar={evaluacionesAComparar}
            dniDirector={dniDirector ? String(dniDirector) : undefined}
            monthSelected={monthSelected}
            yearSelected={Number(yearSelected)}
            ocultarTabla={false}
          />
        </div>
      </div>
    </div>
  );
};

export default DirectorTendenciasTab;
