import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  MdHelpOutline,
  MdBubbleChart,
  MdDomain,
  MdClass,
  MdSearch,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdFullscreen,
  MdFullscreenExit,
} from 'react-icons/md';
import { Evaluaciones, PreguntasRespuestas } from '@/features/types/types';
import { DirectorMetricasResumen, SeccionMetrica } from './types';
import { formatQuestionCode } from './useMetricasDirector';
import EvidenciaCaptureButton from './EvidenciaCaptureButton';
import EvidenciaBanner from './EvidenciaBanner';
import styles from './DirectorVisualizaciones.module.css';

interface DirectorBurbujasTabProps {
  metricas: DirectorMetricasResumen;
  preguntas: PreguntasRespuestas[];
  evaluacion?: Evaluaciones;
  categoryName?: string;
  onOpenQuestionDetail: (order: number, coords: { x: number; y: number }) => void;
  onOpenGuiaModal: () => void;
  isDocenteView?: boolean;
  isUgelView?: boolean;
  benchmarkRow?: SeccionMetrica | null;
  headerLabel?: string;
}

// Función auxiliar para obtener el tamaño de burbuja según el % de rezago
export const getBubbleClass = (pct: number) => {
  if (pct <= 15) return styles.bubbleSize1;
  if (pct <= 25) return styles.bubbleSize2;
  if (pct <= 35) return styles.bubbleSize3;
  if (pct <= 45) return styles.bubbleSize4;
  if (pct <= 55) return styles.bubbleSize5;
  if (pct <= 65) return styles.bubbleSize6;
  return styles.bubbleSize7;
};

interface MatrixSectionRowProps {
  sec: SeccionMetrica;
  sortedPreguntas: PreguntasRespuestas[];
  isUgelView: boolean;
  isDocenteView: boolean;
  onCellClick: (e: React.MouseEvent<HTMLElement>, order: number) => void;
}

/**
 * Fila de sección/institución memoizada y optimizada para alto rendimiento.
 * Cada celda contiene directamente la burbuja sin capas DOM intermedias.
 */
const MatrixSectionRow = React.memo<MatrixSectionRowProps>(
  ({ sec, sortedPreguntas, isUgelView, isDocenteView, onCellClick }) => {
    return (
      <tr className="hover:bg-slate-50/80 group">
        {/* Celda Fija de Sección / Aula / IE */}
        <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50/90 border-r border-slate-200/90 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] px-4 py-2.5 align-middle w-[210px] min-w-[210px] max-w-[230px]">
          {isUgelView ? (
            <div className="flex flex-col items-start gap-0.5">
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200/90 font-bold text-xs shadow-2xs transition-colors tracking-wide max-w-full"
                title={`${sec.nombre} (${sec.totalEstudiantes} estudiantes evaluados)`}
              >
                <span className="truncate">{sec.nombre}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium pl-0.5">
                {sec.totalEstudiantes} evaluados
              </span>
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="font-bold text-slate-800 text-sm tracking-tight">{sec.nombre}</span>
              {!isDocenteView && sec.docenteNombre && (
                <span className="text-xs text-slate-500 font-normal truncate mt-0.5 max-w-[190px]" title={sec.docenteNombre}>
                  {sec.docenteNombre}
                </span>
              )}
              <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                {sec.totalEstudiantes} alumnos
              </span>
            </div>
          )}
        </td>

        {/* Celdas con Burbujas por Pregunta (Optimizado: clic directo en la celda y DOM ligero) */}
        {sortedPreguntas.map((p, idx) => {
          const order = p.order !== undefined && p.order !== null ? Number(p.order) : idx + 1;
          const stat = sec.preguntas[order];
          const bubbleCls = stat ? getBubbleClass(stat.prevPct) : '';
          return (
            <td
              key={order}
              onClick={(e) => onCellClick(e, order)}
              className="p-1 text-center align-middle relative border-r border-slate-100/60 last:border-r-0 h-[50px] cursor-pointer"
            >
              {stat && stat.totalEstudiantes > 0 ? (
                <div
                  className={`${styles.bubbleBase} ${bubbleCls}`}
                  title={`${sec.nombre} · ${formatQuestionCode(order)}: ${stat.prevPct}% (${stat.falladas}/${stat.totalEstudiantes} falladas)`}
                >
                  <span className={styles.bubbleText}>{stat.prevPct}%</span>
                </div>
              ) : (
                <span className="text-slate-300 font-medium text-xs select-none">-</span>
              )}
            </td>
          );
        })}
      </tr>
    );
  }
);
MatrixSectionRow.displayName = 'MatrixSectionRow';

export const DirectorBurbujasTab: React.FC<DirectorBurbujasTabProps> = ({
  metricas,
  evaluacion,
  categoryName,
  onOpenQuestionDetail,
  onOpenGuiaModal,
  isDocenteView = false,
  isUgelView = false,
  benchmarkRow,
  headerLabel,
}) => {
  const { secciones, totalIe, sortedPreguntas } = metricas;

  // Referencias para Pantalla Completa y Captura de Evidencia en Alta Resolución
  const containerRef = useRef<HTMLDivElement>(null);
  const matrixCaptureRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!isFullScreen) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen().catch(() => {});
        }
        setIsFullScreen(true);
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen().catch(() => {});
        }
        setIsFullScreen(false);
      }
    } catch {
      setIsFullScreen((prev) => !prev);
    }
  }, [isFullScreen]);

  // Sincronizar evento de fullscreen del navegador (Esc o F11)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Tecla Escape para salir de pantalla completa
  useEffect(() => {
    if (!isFullScreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen]);

  // Bloqueo de scroll en body al estar en pantalla completa
  useEffect(() => {
    if (isFullScreen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isFullScreen]);

  // Estado de búsqueda y paginación para conjuntos de datos grandes
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Filtrado reactivo en memoria ultrarrápido
  const filteredSecciones = useMemo(() => {
    if (!searchTerm.trim()) return secciones;
    const term = searchTerm.toLowerCase().trim();
    return secciones.filter(
      (s) =>
        s.nombre.toLowerCase().includes(term) ||
        (s.docenteNombre && s.docenteNombre.toLowerCase().includes(term))
    );
  }, [secciones, searchTerm]);

  // Secciones paginadas para evitar saturar el DOM cuando son muchos datos
  const totalPages = Math.ceil(filteredSecciones.length / pageSize) || 1;

  const paginatedSecciones = useMemo(() => {
    if (filteredSecciones.length <= pageSize) return filteredSecciones;
    const start = (currentPage - 1) * pageSize;
    return filteredSecciones.slice(start, start + pageSize);
  }, [filteredSecciones, currentPage, pageSize]);

  const showPaginationBar = secciones.length > 15;

  const handleCellClick = useCallback(
    (e: React.MouseEvent<HTMLElement>, order: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      onOpenQuestionDetail(order, {
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.bottom + 8),
      });
    },
    [onOpenQuestionDetail]
  );

  const handleHeaderClick = useCallback(
    (e: React.MouseEvent<HTMLElement>, order: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      onOpenQuestionDetail(order, {
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.bottom + 8),
      });
    },
    [onOpenQuestionDetail]
  );

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${isFullScreen ? styles.containerFullscreen : ''}`}
    >
      {/* Encabezado con Botón de Interpretación Modal, Captura de Evidencia y Pantalla Completa */}
      <div className={styles.tabHeaderWithAction}>
        <div className={styles.tabHeaderTitleGroup}>
          <h3 className={styles.tabSectionTitle}>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 shadow-2xs shrink-0">
              <MdBubbleChart className="text-xl" />
            </div>
            <span>Matriz de Burbujas de Rezago Pedagógico</span>
          </h3>
          <p className={styles.tabSectionSubtitle}>
            Visualización de criticidad por aula y escala cromática según el % de estudiantes que fallaron cada pregunta
          </p>
        </div>
        <div className={styles.headerActionsGroup}>
          {/* Botón de Captura de Evidencia (PNG / Portapapeles) */}
          <EvidenciaCaptureButton
            targetRef={matrixCaptureRef}
            titulo="Matriz de Rezago Pedagógico (Burbujas)"
            subtitulo={isDocenteView ? 'Reporte por Aula · Docente' : 'Reporte Institucional · Director'}
            evaluacion={evaluacion}
            categoryName={categoryName}
          />

          {/* Botón de Pantalla Completa */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`${styles.fullscreenBtn} ${isFullScreen ? styles.fullscreenBtnActive : ''}`}
            title={isFullScreen ? 'Salir de pantalla completa (Esc)' : 'Ver matriz en pantalla completa'}
            aria-label={isFullScreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullScreen ? (
              <>
                <MdFullscreenExit className={styles.fullscreenIcon} />
                <span className="hidden sm:inline">Salir pantalla completa</span>
              </>
            ) : (
              <>
                <MdFullscreen className={styles.fullscreenIcon} />
                <span className="hidden sm:inline">Pantalla completa</span>
              </>
            )}
          </button>

          {/* Botón de Guía de Interpretación */}
          <button
            type="button"
            className={styles.infoHelpBtn}
            onClick={onOpenGuiaModal}
            title="¿En qué consiste este gráfico de burbujas? Haz clic para ver la guía metodológica y de interpretación"
          >
            <MdHelpOutline className={styles.infoHelpIcon} />
            <span>¿Cómo interpretar?</span>
          </button>
        </div>
      </div>

      {/* ÁREA DE CAPTURA DE EVIDENCIA (Envuelve Membrete, Tabla y Leyenda) */}
      <div ref={matrixCaptureRef} className="w-full flex flex-col gap-4">
        {/* Membrete Oficial para Exportación */}
        <EvidenciaBanner
          titulo="Matriz de Rezago Pedagógico (Burbujas)"
          subtitulo={isDocenteView ? 'Reporte por Aula · Docente' : 'Reporte Institucional · Director'}
          evaluacion={evaluacion}
          categoryName={categoryName}
        />

        {/* Contenedor de la Matriz con Tabla Semántica, Scroll Horizontal y Sticky Column */}
        <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Barra de Filtro y Paginación (Se marca con data-no-capture="true" para no saturar la foto) */}
          {showPaginationBar && (
            <div data-no-capture="true" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-2.5 bg-slate-50/90 border-b border-slate-200 text-xs">
            {/* Buscador inteligente en memoria */}
            <div className="relative flex-1 max-w-xs">
              <MdSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={isUgelView ? 'Buscar institución...' : 'Buscar aula / docente...'}
                className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Limpiar búsqueda"
                >
                  <MdClose className="text-sm" />
                </button>
              )}
            </div>

            {/* Controles de Paginación */}
            <div className="flex items-center gap-2 text-slate-600 flex-wrap">
              <span className="text-[11px] text-slate-500">Mostrar:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={9999}>Todas</option>
              </select>
              <span className="text-slate-300">|</span>
              <span className="font-semibold text-slate-700">
                {filteredSecciones.length === 0
                  ? '0 resultados'
                  : `${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, filteredSecciones.length)} de ${filteredSecciones.length}`}
              </span>
              {totalPages > 1 && (
                <div className="inline-flex items-center gap-1 ml-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                    title="Página anterior"
                  >
                    <MdChevronLeft className="text-base" />
                  </button>
                  <span className="px-2 py-0.5 font-bold text-slate-700">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                    title="Página siguiente"
                  >
                    <MdChevronRight className="text-base" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="overflow-x-auto relative w-full" style={{ willChange: 'scroll-position' }}>
          <table className="w-full border-collapse text-left min-w-max">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90">
                {/* Columna fija de cabecera */}
                <th
                  scope="col"
                  className="sticky left-0 z-30 bg-slate-100/95 border-r border-slate-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] px-4 py-3.5 w-[210px] min-w-[210px] max-w-[230px] align-middle"
                >
                  {isUgelView ? (
                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white font-semibold text-xs shadow-xs tracking-wide max-w-full"
                      title={headerLabel || 'Institucion'}
                    >
                      <MdDomain className="w-3.5 h-3.5 shrink-0 text-slate-300" />
                      <span className="truncate">{headerLabel || 'Institucion'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                      <MdClass className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>Sección / Aula</span>
                    </div>
                  )}
                </th>

                {/* Columnas de Preguntas en Paleta Sobria */}
                {sortedPreguntas.map((p, idx) => {
                  const order = p.order !== undefined && p.order !== null ? Number(p.order) : idx + 1;
                  const code = formatQuestionCode(order);
                  return (
                    <th
                      key={order}
                      scope="col"
                      className="p-2 text-center align-middle border-r border-slate-100/90 last:border-r-0 min-w-[58px] bg-slate-50/90"
                    >
                      <button
                        type="button"
                        onClick={(e) => handleHeaderClick(e, order)}
                        className="inline-flex items-center justify-center w-full min-w-[46px] py-1.5 px-2 rounded-lg font-bold text-xs bg-slate-100 hover:bg-slate-200/90 text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-2xs hover:shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition-colors cursor-pointer select-none"
                        title={`Haz clic para ver el ítem y actuación pedagógica de ${code}`}
                      >
                        {code}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {/* Filas por Sección o Institución paginadas para óptimo rendimiento */}
              {paginatedSecciones.length > 0 ? (
                paginatedSecciones.map((sec) => (
                  <MatrixSectionRow
                    key={sec.id}
                    sec={sec}
                    sortedPreguntas={sortedPreguntas}
                    isUgelView={isUgelView}
                    isDocenteView={isDocenteView}
                    onCellClick={handleCellClick}
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan={sortedPreguntas.length + 1}
                    className="py-10 text-center text-xs text-slate-500"
                  >
                    No se encontraron resultados para &ldquo;{searchTerm}&rdquo;
                  </td>
                </tr>
              )}

              {/* Fila Resumen "CONSOLIDADO I.E.", "CONSOLIDADO DOCENTE" o "CONSOLIDADO UGEL" */}
              {totalIe && (
                <tr className="border-t-2 border-emerald-400/80 bg-emerald-50/30 hover:bg-emerald-50/60 group">
                  <td className="sticky left-0 z-20 bg-emerald-50/95 group-hover:bg-emerald-100/70 border-r border-emerald-200/90 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] px-4 py-3 align-middle border-l-4 border-l-emerald-600 w-[210px] min-w-[210px] max-w-[230px]">
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-extrabold text-emerald-950 text-xs tracking-tight uppercase leading-snug">
                        {isUgelView ? (totalIe.nombre || 'CONSOLIDADO UGEL') : isDocenteView ? 'CONSOLIDADO DOCENTE' : totalIe.nombre}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                        {totalIe.totalEstudiantes} evaluados
                      </span>
                    </div>
                  </td>
                  {sortedPreguntas.map((p, idx) => {
                    const order = p.order !== undefined && p.order !== null ? Number(p.order) : idx + 1;
                    const stat = totalIe.preguntas[order];
                    const bubbleCls = stat ? getBubbleClass(stat.prevPct) : '';
                    return (
                      <td
                        key={order}
                        onClick={(e) => handleCellClick(e, order)}
                        className="p-1 text-center align-middle relative border-r border-emerald-100/60 last:border-r-0 h-[50px] cursor-pointer"
                      >
                        {stat && stat.totalEstudiantes > 0 ? (
                          <div
                            className={`${styles.bubbleBase} ${bubbleCls}`}
                            title={`${totalIe.nombre} · ${formatQuestionCode(order)}: ${stat.prevPct}% (${stat.falladas}/${stat.totalEstudiantes} evaluados)`}
                          >
                            <span className={styles.bubbleText}>{stat.prevPct}%</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-medium text-xs select-none">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* Fila Opcional de Benchmark Regional (ej. CONSOLIDADO UGEL al hacer drill-down a una IE) */}
              {benchmarkRow && (
                <tr className="border-t border-slate-200/80 bg-slate-50/40 hover:bg-slate-100/60 group">
                  <td className="sticky left-0 z-20 bg-slate-100/95 group-hover:bg-slate-200/60 border-r border-slate-200/90 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] px-4 py-3 align-middle border-l-4 border-l-slate-600 w-[210px] min-w-[210px] max-w-[230px]">
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-extrabold text-slate-800 text-xs tracking-tight uppercase leading-snug">
                        {benchmarkRow.nombre}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-semibold text-[10px]">
                        {benchmarkRow.totalEstudiantes} evaluados en la UGEL
                      </span>
                    </div>
                  </td>
                  {sortedPreguntas.map((p, idx) => {
                    const order = p.order !== undefined && p.order !== null ? Number(p.order) : idx + 1;
                    const stat = benchmarkRow.preguntas[order];
                    const bubbleCls = stat ? getBubbleClass(stat.prevPct) : '';
                    return (
                      <td
                        key={order}
                        onClick={(e) => handleCellClick(e, order)}
                        className="p-1 text-center align-middle relative border-r border-slate-200/60 last:border-r-0 h-[50px] cursor-pointer"
                      >
                        {stat && stat.totalEstudiantes > 0 ? (
                          <div
                            className={`${styles.bubbleBase} ${bubbleCls}`}
                            title={`${benchmarkRow.nombre} · ${formatQuestionCode(order)}: ${stat.prevPct}% (${stat.falladas}/${stat.totalEstudiantes} evaluados en la UGEL)`}
                          >
                            <span className={styles.bubbleText}>{stat.prevPct}%</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-medium text-xs select-none">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda Ejecutiva de la Matriz de Burbujas */}
      <div className={styles.legend}>
        <span className={styles.legendTitle}>Escala:</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#059669' }} />
            <span>≤15%</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#10b981' }} />
            <span>16-25%</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#84cc16' }} />
            <span>26-35%</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#f59e0b' }} />
            <span>36-45%</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#f97316' }} />
            <span>46-55%</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#f43f5e' }} />
            <span>56-65%</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#e11d48' }} />
            <span>&gt;65%</span>
          </div>
        </div>
        <span className={styles.legendNotice}>
          🫧 Diámetro y color indican criticidad de rezago (% de alumnos que fallaron la pregunta)
        </span>
      </div>
    </div>
  </div>
);
};

export default DirectorBurbujasTab;
