import React from 'react';
import Link from 'next/link';
import { RiLoader4Line, RiFilter3Line, RiRestartLine } from 'react-icons/ri';
import { MdAnalytics } from 'react-icons/md';
import { getMonthName } from '@/fuctions/dates';
import { getNivelGrado } from '@/features/hooks/useEvaluacionesFilters';

export interface EvaluacionItem {
  id?: string;
  nombre?: string;
  grado?: string | number;
  nivel?: string | number | number[];
  mesDelExamen?: string | number;
  añoDelExamen?: string | number;
  cerrada?: boolean;
  active?: boolean;
  [key: string]: any;
}

export interface EvaluacionesTableProps {
  /** Lista de evaluaciones a renderizar */
  evaluaciones: EvaluacionItem[];
  /** Indicador de carga de datos */
  isLoading?: boolean;
  /** Mensaje de carga */
  loadingMessage?: string;
  /** Año actual para mostrar si no viene en la evaluación */
  currentYear?: number | string;
  /** Año escolar seleccionado para el pie de tabla */
  selectedYear?: number | string;
  /** Catálogo de grados para resolver el nombre legible */
  grados?: Array<{ grado?: number | string; nombre?: string; nivel?: number }>;
  /** Callback para restablecer los filtros en el estado vacío */
  onResetFilters?: () => void;
  /** Función para generar la URL del reporte de la evaluación */
  getReporteHref?: (eva: EvaluacionItem) => string;
  /** Función opcional para generar la URL de detalle/edición de la evaluación */
  getEvaluacionHref?: (eva: EvaluacionItem) => string;
  /** Título personalizado para el estado vacío */
  emptyTitle?: string;
  /** Descripción personalizada para el estado vacío */
  emptyDescription?: string;
  /** Mostrar pie de tabla con conteo de resultados */
  showFooterCount?: boolean;
  /** Acciones adicionales por fila (opcional) */
  renderExtraActions?: (eva: EvaluacionItem) => React.ReactNode;
  /** Clases CSS adicionales */
  className?: string;
}

export const EvaluacionesTable: React.FC<EvaluacionesTableProps> = ({
  evaluaciones,
  isLoading = false,
  loadingMessage = 'Cargando evaluaciones...',
  currentYear = new Date().getFullYear(),
  selectedYear,
  grados = [],
  onResetFilters,
  getReporteHref,
  getEvaluacionHref,
  emptyTitle = 'No hay evaluaciones disponibles',
  emptyDescription = 'Prueba ajustando o restableciendo los filtros de búsqueda.',
  showFooterCount = true,
  renderExtraActions,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
        <RiLoader4Line className="animate-spin text-5xl text-colorSegundo mb-4" />
        <span className="text-slate-500 text-sm font-semibold tracking-wide animate-pulse">
          {loadingMessage}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden transition-all duration-300 ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-slate-200/90">
              <th className="py-4 px-6 text-xs font-bold text-slate-800 uppercase tracking-wider text-left">
                Nombre de Evaluación
              </th>
              <th className="py-4 px-6 text-xs font-bold text-slate-800 uppercase tracking-wider text-left">
                Grado / Nivel
              </th>
              <th className="py-4 px-6 text-xs font-bold text-slate-800 uppercase tracking-wider text-left">
                Mes y Año
              </th>
              <th className="py-4 px-6 text-xs font-bold text-slate-800 uppercase tracking-wider text-center">
                Estado
              </th>
              <th className="py-4 px-6 text-xs font-bold text-slate-800 uppercase tracking-wider text-right">
                Reporte
              </th>
              {renderExtraActions && (
                <th className="py-4 px-6 text-xs font-bold text-slate-800 uppercase tracking-wider text-right">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {evaluaciones.length > 0 ? (
              evaluaciones.map((eva, index) => {
                const evaluacionHref = getEvaluacionHref ? getEvaluacionHref(eva) : null;
                const reporteHref = getReporteHref ? getReporteHref(eva) : null;
                const gradoName =
                  grados?.find((g) => Number(g.grado) === Number(eva.grado))?.nombre ||
                  `${eva.grado}° Grado`;
                const nivelLabel = getNivelGrado(Number(eva.grado || 0));

                return (
                  <tr
                    key={eva.id || index}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Nombre de Evaluación */}
                    <td className="py-4 px-6">
                      {evaluacionHref ? (
                        <Link
                          href={evaluacionHref}
                          className="inline-flex items-center gap-2 text-slate-800 font-semibold hover:text-colorSegundo transition-colors text-sm group/link"
                        >
                          <span>{eva.nombre}</span>
                          <span className="text-slate-400 group-hover/link:text-colorSegundo group-hover/link:translate-x-1 transition-all text-xs">
                            →
                          </span>
                        </Link>
                      ) : (
                        <span className="text-slate-800 font-semibold text-sm">
                          {eva.nombre}
                        </span>
                      )}
                    </td>

                    {/* Grado / Nivel */}
                    <td className="py-4 px-6 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800">
                          {gradoName}
                        </span>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                          {nivelLabel}
                        </span>
                      </div>
                    </td>

                    {/* Mes y Año */}
                    <td className="py-4 px-6 text-left">
                      <span className="text-sm text-slate-600 font-normal">
                        {eva.mesDelExamen !== undefined &&
                        eva.mesDelExamen !== null &&
                        eva.mesDelExamen !== ''
                          ? `${getMonthName(Number(eva.mesDelExamen))} ${
                              eva.añoDelExamen || currentYear
                            }`
                          : eva.añoDelExamen || currentYear}
                      </span>
                    </td>

                    {/* Estado con Badge */}
                    <td className="py-4 px-6 text-center">
                      {eva.cerrada ? (
                        <span className="inline-flex items-center justify-center min-w-[95px] px-3 py-1 bg-purple-100/70 text-purple-700 text-xs font-bold rounded-lg tracking-wide">
                          Cerrado
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center min-w-[95px] px-3 py-1 bg-teal-100/70 text-teal-700 text-xs font-bold rounded-lg tracking-wide">
                          Activo
                        </span>
                      )}
                    </td>

                    {/* Reporte */}
                    <td className="py-4 px-6 text-right">
                      {reporteHref ? (
                        <Link
                          href={reporteHref}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 rounded-xl transition-all duration-150 font-semibold text-xs shadow-xs active:scale-95 hover:border-slate-300"
                          title="Ver reporte y resultados"
                        >
                          <MdAnalytics size={16} className="text-colorSegundo" />
                          <span>Ver Reporte</span>
                        </Link>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium">—</span>
                      )}
                    </td>

                    {/* Acciones adicionales opcionales */}
                    {renderExtraActions && (
                      <td className="py-4 px-6 text-right">
                        {renderExtraActions(eva)}
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={renderExtraActions ? 6 : 5} className="py-24 text-center">
                  <div className="flex flex-col items-center max-w-sm mx-auto space-y-4">
                    <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
                      <RiFilter3Line size={26} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-slate-800 font-bold text-base">
                        {emptyTitle}
                      </h3>
                      <p className="text-slate-500 text-xs">
                        {emptyDescription}
                      </p>
                    </div>
                    {onResetFilters && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        <RiRestartLine size={14} />
                        <span>Restablecer Filtros</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer con conteo de resultados */}
      {showFooterCount && evaluaciones.length > 0 && (
        <div className="px-6 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>
            Mostrando{' '}
            <strong className="text-slate-800">{evaluaciones.length}</strong>{' '}
            {evaluaciones.length === 1 ? 'evaluación' : 'evaluaciones'}
          </span>
          {selectedYear && <span>Año escolar {selectedYear}</span>}
        </div>
      )}
    </div>
  );
};

export default EvaluacionesTable;
