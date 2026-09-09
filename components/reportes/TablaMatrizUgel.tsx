import React, { useState, useMemo, useEffect } from 'react';
import { MdTableChart, MdKeyboardArrowDown, MdSearch, MdDownload, MdClose, MdRefresh } from 'react-icons/md';
import { RiFileExcel2Line, RiLoader4Line } from 'react-icons/ri';
import * as XLSX from 'xlsx';
import styles from './TablaMatrizUgel.module.css';
import { Evaluaciones, PreguntasRespuestas } from '@/features/types/types';

export interface UgelMatrizPreguntaStat {
  order: number;
  id?: string;
  total: number;
  correctas: number;
  porcentaje: number;
}

export interface UgelNivelStat {
  id?: string;
  nivel: string;
  color: string;
  cantidadDeEstudiantes: number;
  porcentaje: number;
}

export interface UgelMatrizRow {
  index: number;
  id: number;
  nombre: string;
  nombreCorto: string;
  totalEstudiantes: number;
  sumaPuntajes: number;
  puntajePromedio: number;
  nivel: string;
  nivelColor?: string;
  niveles?: UgelNivelStat[];
  rcPromedio: number;
  totalPreguntas: number;
  preguntas: Record<string, UgelMatrizPreguntaStat>;
}

interface TablaMatrizUgelProps {
  data: UgelMatrizRow[];
  loading: boolean;
  preguntasRespuestas: PreguntasRespuestas[];
  evaluacion: Evaluaciones;
  onReload?: () => void;
  yearSelected?: number;
  monthSelected?: number;
}

const TablaMatrizUgel: React.FC<TablaMatrizUgelProps> = ({
  data = [],
  loading = false,
  preguntasRespuestas = [],
  evaluacion,
  onReload,
  yearSelected,
  monthSelected,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [soloConDatos, setSoloConDatos] = useState<boolean>(false);
  const [criterioOrden, setCriterioOrden] = useState<'puntaje_desc' | 'puntaje_asc' | 'nombre_asc' | 'evaluados_desc'>('puntaje_desc');
  const [modoNiveles, setModoNiveles] = useState<'columna_unica' | 'columnas_separadas'>('columna_unica');

  // Helper para normalizar nombres de niveles sin acentos ni mayúsculas
  const cleanKey = (s: string) =>
    (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // Estadísticas globales regionales por nivel (para encabezados y leyenda)
  const statsGlobalesNiveles = useMemo(() => {
    const map: Record<string, { cantidad: number; porcentaje: number }> = {};
    const nivelesConfig = evaluacion?.nivelYPuntaje || [];

    let granTotal = 0;
    data.forEach((u) => {
      granTotal += u.totalEstudiantes || 0;
    });

    nivelesConfig.forEach((nc) => {
      const k = cleanKey(nc.nivel || '');
      let cant = 0;
      data.forEach((u) => {
        const item = u.niveles?.find(
          (n) => cleanKey(n.nivel || '') === k
        );
        if (item) cant += item.cantidadDeEstudiantes;
      });
      const pct = granTotal > 0 ? Math.round((cant / granTotal) * 100) : 0;
      map[k] = { cantidad: cant, porcentaje: pct };
    });

    return { porNivel: map, granTotal };
  }, [data, evaluacion]);

  // Popover para ver detalle de la pregunta
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [isPopoverVisible, setIsPopoverVisible] = useState<boolean>(false);
  const [shouldRenderPopover, setShouldRenderPopover] = useState<boolean>(false);

  // Ordenar preguntasRespuestas según order
  const preguntasOrdenadas = useMemo(() => {
    return [...(preguntasRespuestas || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [preguntasRespuestas]);

  // Mapa de preguntas para el popover
  const preguntasMap = useMemo(() => {
    const map = new Map<string, PreguntasRespuestas>();
    preguntasOrdenadas.forEach((p, idx) => {
      const key = String(p.order !== undefined ? p.order : idx + 1);
      map.set(key, p);
      if (p.id) map.set(p.id, p);
    });
    return map;
  }, [preguntasOrdenadas]);

  // Estadísticas globales regionales por pregunta (para el encabezado)
  const statsGlobalesPreguntas = useMemo(() => {
    const stats: Record<string, { total: number; correctas: number; porcentaje: number }> = {};

    preguntasOrdenadas.forEach((p, idx) => {
      const key = String(p.order !== undefined ? p.order : idx + 1);
      let totalRegional = 0;
      let correctasRegional = 0;

      data.forEach((ugel) => {
        const qStat = ugel.preguntas?.[key];
        if (qStat) {
          totalRegional += qStat.total || 0;
          correctasRegional += qStat.correctas || 0;
        }
      });

      const porcentaje = totalRegional > 0 ? Math.round((correctasRegional / totalRegional) * 100) : 0;
      stats[key] = {
        total: totalRegional,
        correctas: correctasRegional,
        porcentaje,
      };
    });

    return stats;
  }, [data, preguntasOrdenadas]);

  // Filtrar y ordenar datos de UGELs
  const processedData = useMemo(() => {
    let result = [...data];

    // 1. Filtro por solo UGELs con datos
    if (soloConDatos) {
      result = result.filter((u) => u.totalEstudiantes > 0);
    }

    // 2. Filtro por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.nombre.toLowerCase().includes(term) ||
          u.nombreCorto.toLowerCase().includes(term)
      );
    }

    // 3. Ordenamiento
    result.sort((a, b) => {
      switch (criterioOrden) {
        case 'puntaje_desc':
          return b.puntajePromedio - a.puntajePromedio;
        case 'puntaje_asc':
          return a.puntajePromedio - b.puntajePromedio;
        case 'nombre_asc':
          return a.nombreCorto.localeCompare(b.nombreCorto);
        case 'evaluados_desc':
          return b.totalEstudiantes - a.totalEstudiantes;
        default:
          return 0;
      }
    });

    return result;
  }, [data, soloConDatos, searchTerm, criterioOrden]);

  // Manejo de animación del Popover
  useEffect(() => {
    if (activePopover) {
      setShouldRenderPopover(true);
      const timer = setTimeout(() => setIsPopoverVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsPopoverVisible(false);
      const timer = setTimeout(() => setShouldRenderPopover(false), 200);
      return () => clearTimeout(timer);
    }
  }, [activePopover]);

  const handleTogglePopover = (key: string) => {
    setActivePopover((prev) => (prev === key ? null : key));
  };

  // Color de celda de efectividad
  const getCellAccuracyClass = (total: number, pct: number) => {
    if (total === 0) return styles.noData;
    if (pct >= 65) return styles.highAccuracy;
    if (pct >= 40) return styles.mediumAccuracy;
    return styles.lowAccuracy;
  };

  // Exportar matriz a Excel
  const handleExportExcel = () => {
    if (!processedData || processedData.length === 0) return;

    const nivelesConfig = evaluacion?.nivelYPuntaje || [];

    const rows = processedData.map((u, i) => {
      const rowObj: Record<string, any> = {
        '#': i + 1,
        'UGEL': u.nombre,
        'Evaluados': u.totalEstudiantes,
        'R.C. Promedio': u.rcPromedio,
        'T.P.': u.totalPreguntas,
        'Puntaje Promedio': u.puntajePromedio,
      };

      // Desglose de estudiantes por cada nivel (Inicio, Proceso, Satisfactorio...)
      nivelesConfig.forEach((nc) => {
        const k = cleanKey(nc.nivel || '');
        const nStat = u.niveles?.find(
          (n) => cleanKey(n.nivel || '') === k
        );
        rowObj[`Estudiantes ${nc.nivel}`] = nStat ? nStat.cantidadDeEstudiantes : 0;
        rowObj[`% ${nc.nivel}`] = nStat ? `${nStat.porcentaje}%` : '0%';
      });

      // Efectividad en cada pregunta
      preguntasOrdenadas.forEach((p, idx) => {
        const qNum = p.order !== undefined ? p.order : idx + 1;
        const key = String(qNum);
        const qStat = u.preguntas?.[key];
        const pct = qStat ? `${qStat.porcentaje}% (${qStat.correctas}/${qStat.total})` : '0% (0/0)';
        rowObj[`P${qNum}`] = pct;
      });

      return rowObj;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Matriz UGEL');

    const evalNombre = (evaluacion?.nombre || 'Evaluacion').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const fileName = `Matriz_UGEL_${evalNombre}_${yearSelected || ''}_${monthSelected || ''}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className={styles.container}>
      {/* Cabecera / Accordion Header */}
      <div
        className={`${styles.cardHeader} ${isOpen ? styles.cardHeaderOpen : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={styles.titleArea}>
          <div className={styles.titleIcon}>
            <MdTableChart />
          </div>
          <div className={styles.titleTextGroup}>
            <h3 className={styles.titleText}>Matriz de Respuestas por UGEL</h3>
            <p className={styles.subtitleText}>
              Desempeño y porcentaje de aciertos de cada UGEL por cada pregunta evaluada
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <MdKeyboardArrowDown
            className={`${styles.toggleIcon} ${isOpen ? styles.toggleIconOpen : ''}`}
          />
        </div>
      </div>

      {/* Contenido */}
      {isOpen && (
        <div className={styles.bodyWrapper}>
          {/* Barra de Controles */}
          <div className={styles.controlsBar}>
            <div className={styles.controlsLeft}>
              {/* Buscador */}
              <div className={styles.searchBox}>
                <MdSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Buscar UGEL..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              {/* Selector de ordenamiento */}
              <select
                value={criterioOrden}
                onChange={(e: any) => setCriterioOrden(e.target.value)}
                className={styles.selectControl}
              >
                <option value="puntaje_desc">Puntaje: Mayor a Menor</option>
                <option value="puntaje_asc">Puntaje: Menor a Mayor</option>
                <option value="evaluados_desc">Más Evaluados</option>
                <option value="nombre_asc">Alfabético (A - Z)</option>
              </select>

              {/* Selector de filtro de datos */}
              <select
                value={soloConDatos ? 'solo_datos' : 'todas'}
                onChange={(e) => setSoloConDatos(e.target.value === 'solo_datos')}
                className={styles.selectControl}
              >
                <option value="todas">Todas las UGELs (14)</option>
                <option value="solo_datos">Solo con Estudiantes Evaluados</option>
              </select>

              {/* Selector de visualización de niveles */}
              {(evaluacion?.nivelYPuntaje || []).length > 0 && (
                <select
                  value={modoNiveles}
                  onChange={(e: any) => setModoNiveles(e.target.value)}
                  className={styles.selectControl}
                  title="Formato de visualización de los niveles de logro"
                >
                  <option value="columna_unica">Nivel: Desglose Agrupado</option>
                  <option value="columnas_separadas">Nivel: Columnas Separadas</option>
                </select>
              )}
            </div>

            <div className={styles.controlsRight}>
              {onReload && (
                <button
                  type="button"
                  onClick={onReload}
                  className={styles.selectControl}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                  title="Actualizar datos de la matriz"
                >
                  <MdRefresh style={{ fontSize: '1.1rem' }} />
                  <span>Actualizar</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExportExcel}
                disabled={processedData.length === 0}
                className={styles.exportBtn}
                title="Descargar matriz en Excel"
              >
                <RiFileExcel2Line style={{ fontSize: '1.1rem' }} />
                <span>Exportar Excel</span>
              </button>
            </div>
          </div>

          {/* Leyenda de Referencia */}
          <div className={styles.legendBar}>
            {/* Niveles configurados con total regional */}
            <div className={styles.legendGroup}>
              <span className={styles.legendTitle}>Niveles (Total Regional):</span>
              {(evaluacion?.nivelYPuntaje || []).map((nivel, idx) => {
                const k = cleanKey(nivel.nivel || '');
                const gStat = statsGlobalesNiveles.porNivel[k];
                return (
                  <div key={idx} className={styles.legendItem}>
                    <div
                      className={styles.legendCircle}
                      style={{ backgroundColor: nivel.color || '#94a3b8' }}
                    ></div>
                    <span>
                      {nivel.nivel}
                      {gStat && statsGlobalesNiveles.granTotal > 0 ? (
                        <strong style={{ marginLeft: '4px', color: '#0f172a' }}>
                          : {gStat.cantidad.toLocaleString('es-PE')} ({gStat.porcentaje}%)
                        </strong>
                      ) : null}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Escala de Acierto de Preguntas */}
            <div className={styles.legendGroup}>
              <span className={styles.legendTitle}>Efectividad de Pregunta:</span>
              <div className={styles.legendItem}>
                <div className={`${styles.legendBox} ${styles.highAccuracy}`}></div>
                <span>Alta (&ge; 65%)</span>
              </div>
              <div className={styles.legendItem}>
                <div className={`${styles.legendBox} ${styles.mediumAccuracy}`}></div>
                <span>Media (40% - 64%)</span>
              </div>
              <div className={styles.legendItem}>
                <div className={`${styles.legendBox} ${styles.lowAccuracy}`}></div>
                <span>Baja (&lt; 40%)</span>
              </div>
              <div className={styles.legendItem}>
                <div className={`${styles.legendBox} ${styles.noData}`}></div>
                <span>Sin Evaluados</span>
              </div>
            </div>
          </div>

          {/* Estado de carga */}
          {loading ? (
            <div className={styles.loaderContainer}>
              <RiLoader4Line className={styles.loaderIcon} />
              <span>Calculando matriz de respuestas por UGEL...</span>
            </div>
          ) : processedData.length === 0 ? (
            <div className={styles.loaderContainer}>
              <span>No se encontraron registros de UGEL con los filtros seleccionados.</span>
            </div>
          ) : (
            /* Tabla con Scroll Horizontal */
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead className={styles.tableHeader}>
                  <tr>
                    <th className={styles.stickyCol1}>#</th>
                    <th className={styles.stickyCol2}>UGEL</th>
                    <th title="Respuestas Correctas Promedio">R.C</th>
                    <th title="Total de Preguntas">T.P.</th>
                    <th title="Puntaje Promedio">PUNTAJE</th>

                    {/* Columna(s) de Nivel */}
                    {modoNiveles === 'columnas_separadas' ? (
                      (evaluacion?.nivelYPuntaje || []).map((nc, idx) => {
                        const k = cleanKey(nc.nivel || '');
                        const gStat = statsGlobalesNiveles.porNivel[k];
                        return (
                          <th key={idx} className={styles.nivelColHeader}>
                            <div className={styles.nivelHeaderStack}>
                              <div className={styles.nivelHeaderTitle}>
                                <span
                                  className={styles.nivelBadgeDot}
                                  style={{ backgroundColor: nc.color || '#94a3b8' }}
                                />
                                <span>{nc.nivel?.toUpperCase()}</span>
                              </div>
                              {gStat && (
                                <span className={styles.nivelHeaderStat}>
                                  {gStat.cantidad.toLocaleString('es-PE')} ({gStat.porcentaje}%)
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })
                    ) : (
                      <th title="Cantidad y porcentaje de estudiantes por nivel de logro (Inicio, Proceso, Satisfactorio)">
                        NIVEL
                      </th>
                    )}

                    <th title="Total de Estudiantes Evaluados">EVAL.</th>

                    {/* Columnas dinámicas de preguntas */}
                    {preguntasOrdenadas.map((pr, idx) => {
                      const qNum = pr.order !== undefined ? pr.order : idx + 1;
                      const qKey = String(qNum);
                      const qGlobal = statsGlobalesPreguntas[qKey] || { total: 0, correctas: 0, porcentaje: 0 };

                      return (
                        <th key={qKey} className={styles.questionHeader}>
                          <div className={styles.headerStack}>
                            <button
                              type="button"
                              className={styles.questionButton}
                              onClick={() => handleTogglePopover(qKey)}
                              title={`Ver detalle de la Pregunta N° ${qNum}`}
                            >
                              {qNum}
                            </button>
                            <div
                              className={styles.questionStats}
                              title={`${qGlobal.correctas} de ${qGlobal.total} correctas a nivel regional`}
                            >
                              <span className={styles.statPercent}>{qGlobal.porcentaje}%</span>
                              <span className={styles.statCount}>
                                {qGlobal.correctas}/{qGlobal.total}
                              </span>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className={styles.tableBody}>
                  {processedData.map((ugel, uIdx) => {
                    return (
                      <tr key={ugel.id} className={styles.tableRow}>
                        <td className={styles.stickyBodyCol1}>{uIdx + 1}</td>
                        <td className={styles.stickyBodyCol2}>
                          <span className={styles.ugelNameLink}>{ugel.nombre}</span>
                        </td>
                        <td>
                          <strong>{ugel.rcPromedio || 0}</strong>
                        </td>
                        <td>{ugel.totalPreguntas || 0}</td>
                        <td>
                          <strong>{ugel.totalEstudiantes > 0 ? ugel.puntajePromedio : '-'}</strong>
                        </td>

                        {/* Columna(s) de Nivel */}
                        {modoNiveles === 'columnas_separadas' ? (
                          (evaluacion?.nivelYPuntaje || []).map((nc, idx) => {
                            const k = cleanKey(nc.nivel || '');
                            const nStat = ugel.niveles?.find(
                              (n) => cleanKey(n.nivel || '') === k
                            );
                            return (
                              <td key={idx} className={styles.nivelColCell}>
                                {nStat && ugel.totalEstudiantes > 0 ? (
                                  <>
                                    <span>{nStat.cantidadDeEstudiantes.toLocaleString('es-PE')}</span>
                                    <span className={styles.nivelColCellPct}>({nStat.porcentaje}%)</span>
                                  </>
                                ) : (
                                  <span style={{ color: '#94a3b8' }}>-</span>
                                )}
                              </td>
                            );
                          })
                        ) : (
                          <td className={styles.nivelesCell}>
                            {ugel.totalEstudiantes > 0 && ugel.niveles && ugel.niveles.length > 0 ? (
                              <div className={styles.nivelesContainer}>
                                <div className={styles.nivelesGrid}>
                                  {ugel.niveles.map((n, nIdx) => (
                                    <div
                                      key={nIdx}
                                      className={styles.nivelItemBadge}
                                      title={`${ugel.nombre} - ${n.nivel}: ${n.cantidadDeEstudiantes.toLocaleString('es-PE')} estudiantes (${n.porcentaje}%)`}
                                    >
                                      <span
                                        className={styles.nivelBadgeDot}
                                        style={{ backgroundColor: n.color || '#94a3b8' }}
                                      />
                                      <span className={styles.nivelBadgeName}>{n.nivel}:</span>
                                      <span className={styles.nivelBadgeCount}>
                                        {n.cantidadDeEstudiantes.toLocaleString('es-PE')}
                                      </span>
                                      <span className={styles.nivelBadgePct}>({n.porcentaje}%)</span>
                                    </div>
                                  ))}
                                </div>
                                <div className={styles.miniDistBar}>
                                  {ugel.niveles.map((n, nIdx) => {
                                    if (n.porcentaje <= 0) return null;
                                    return (
                                      <div
                                        key={nIdx}
                                        className={styles.miniDistSegment}
                                        style={{
                                          width: `${n.porcentaje}%`,
                                          backgroundColor: n.color || '#94a3b8',
                                        }}
                                        title={`${n.nivel}: ${n.cantidadDeEstudiantes.toLocaleString('es-PE')} (${n.porcentaje}%)`}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>-</span>
                            )}
                          </td>
                        )}

                        <td>
                          <span style={{ color: ugel.totalEstudiantes > 0 ? '#0f172a' : '#94a3b8', fontWeight: 600 }}>
                            {ugel.totalEstudiantes.toLocaleString('es-PE')}
                          </span>
                        </td>

                        {/* Celdas de las preguntas para esta UGEL */}
                        {preguntasOrdenadas.map((pr, pIdx) => {
                          const qNum = pr.order !== undefined ? pr.order : pIdx + 1;
                          const qKey = String(qNum);
                          const stat = ugel.preguntas?.[qKey] || { total: 0, correctas: 0, porcentaje: 0 };
                          const cellClass = getCellAccuracyClass(stat.total, stat.porcentaje);

                          const tooltipText = stat.total > 0
                            ? `${ugel.nombre}\nPregunta N° ${qNum}: ${stat.porcentaje}%\n(${stat.correctas} de ${stat.total} alumnos acertaron)\nClave correcta: ${pr.respuesta || '-'}`
                            : `${ugel.nombre}\nPregunta N° ${qNum}: Sin estudiantes evaluados`;

                          return (
                            <td key={qKey} className={styles.answerCell}>
                              <div
                                className={`${styles.answerBox} ${cellClass}`}
                                title={tooltipText}
                              >
                                {stat.total > 0 ? (
                                  <span className={styles.answerText}>{stat.porcentaje}%</span>
                                ) : (
                                  <span className={styles.noDataText}>-</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Popover estático con detalle de la pregunta */}
          {shouldRenderPopover && activePopover && (
            <div
              className={`${styles.questionPopover} ${isPopoverVisible ? styles.fadeIn : styles.fadeOut}`}
            >
              {(() => {
                const preg = preguntasMap.get(activePopover);
                if (!preg) return null;

                return (
                  <>
                    <div className={styles.popoverHeader}>
                      <h4 className={styles.popoverTitle}>
                        Pregunta N° {preg.order || activePopover}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setActivePopover(null)}
                        className={styles.popoverClose}
                        title="Cerrar"
                      >
                        <MdClose />
                      </button>
                    </div>

                    <div className={styles.popoverBody}>
                      <p className={styles.questionDesc}>{preg.pregunta}</p>

                      {Array.isArray(preg.alternativas) && preg.alternativas.length > 0 && (
                        <div className={styles.alternativasList}>
                          {preg.alternativas.map((alt, aIdx) => {
                            const rawAlt = alt.alternativa || (alt as any).id || '';
                            const esCorrecta =
                              rawAlt.toLowerCase() === (preg.respuesta || '').toLowerCase();

                            return (
                              <div
                                key={aIdx}
                                className={`${styles.alternativaItem} ${esCorrecta ? styles.alternativaCorrecta : ''}`}
                              >
                                <span className={styles.alternativaBadge}>
                                  {rawAlt.toUpperCase()})
                                </span>
                                <span>{alt.descripcion || ''}</span>
                                {esCorrecta && (
                                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 700 }}>
                                    ✓ Correcta
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TablaMatrizUgel;
