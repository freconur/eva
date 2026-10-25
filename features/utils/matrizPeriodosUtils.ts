/**
 * Utilidades para la gestión de periodos mensuales en la Matriz de Costos
 */

export interface PeriodoCostos {
  id: string; // ej. "2026-10"
  nombre: string; // ej. "Octubre 2026"
  anio: number; // 2026
  mes: number; // 10
  estado: 'abierto' | 'cerrado' | 'pagado';
  tarifaHoraBase?: number;
  notas?: string;
  totalHoras?: number;
  totalCosto?: number;
  totalFeatures?: number;
  updatedAt?: any;
}

export const MESES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

/**
 * Obtiene el ID del periodo actual en formato YYYY-MM
 */
export function getCurrentPeriodoId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Formatea un ID como "2026-10" a un nombre amigable "Octubre 2026"
 */
export function formatPeriodoNombre(periodoId: string): string {
  if (!periodoId || periodoId === 'TODOS') {
    return 'Todos los Meses (Histórico)';
  }
  const parts = periodoId.split('-');
  if (parts.length === 2) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
      return `${MESES_ES[month - 1]} ${year}`;
    }
  }
  return periodoId;
}

/**
 * Obtiene el ID del periodo adyacente sumando o restando meses
 */
export function getAdjacentPeriodoId(periodoId: string, delta: number): string {
  let [yearStr, monthStr] = (periodoId || getCurrentPeriodoId()).split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(month)) {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }

  const d = new Date(year, month - 1 + delta, 1);
  const nextYear = d.getFullYear();
  const nextMonth = String(d.getMonth() + 1).padStart(2, '0');
  return `${nextYear}-${nextMonth}`;
}

/**
 * Normaliza la asignación del periodo de una feature existente de forma retrocompatible
 */
export function normalizeFeaturePeriodo(feature: { periodoId?: string; fecha?: string } | null | undefined): string {
  if (!feature) return getCurrentPeriodoId();
  if (feature.periodoId && /^\d{4}-\d{2}$/.test(feature.periodoId)) {
    return feature.periodoId;
  }
  if (feature.fecha && /^\d{4}-\d{2}/.test(feature.fecha)) {
    return feature.fecha.slice(0, 7);
  }
  return getCurrentPeriodoId();
}

/**
 * Devuelve un color y badge representativo del estado del periodo
 */
export function getPeriodoEstadoBadge(estado: 'abierto' | 'cerrado' | 'pagado' = 'abierto') {
  switch (estado) {
    case 'cerrado':
      return {
        label: 'Cerrado 🔒',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        dotClass: 'bg-amber-500'
      };
    case 'pagado':
      return {
        label: 'Pagado 💰',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dotClass: 'bg-emerald-500'
      };
    case 'abierto':
    default:
      return {
        label: 'En Curso 🟢',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
        dotClass: 'bg-blue-500'
      };
  }
}
