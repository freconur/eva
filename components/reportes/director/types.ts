import { PreguntasRespuestas, UserEstudiante } from '@/features/types/types';
import { BaremoDecisiones } from '@/components/modals/ConfigurarBaremoModal';

export interface PreguntaMetricaSeccion {
  order: number;
  preguntaId: string;
  totalEstudiantes: number;
  correctas: number;
  falladas: number;
  aciertoPct: number;
  prevPct: number; // Porcentaje de no acierto / rezago pedagógico
}

export interface NivelRiesgoInfo {
  label: string;
  icon: string;
  bg: string;
  text: string;
  color: string;
}

export interface AlertaInfo {
  label: string;
  clase: string;
  color: string;
  dotClase?: string;
  badgeClase?: string;
  accion: string;
}

export interface SeccionMetrica {
  id: string; // ID único de la sección o 'total_ie'
  nombre: string; // Nombre visible ej: "1° A" o "TOTAL I.E."
  docenteNombre?: string;
  totalEstudiantes: number;
  preguntas: Record<number, PreguntaMetricaSeccion>;
  avgPrev: number;
  criticas: number;
  altas: number;
  medias: number;
  bajas: number;
  topPregunta: PreguntaMetricaSeccion | null;
  nivelRiesgo: NivelRiesgoInfo;
}

export interface DirectorKPIs {
  totalCritico: number;
  totalAlto: number;
  totalMedio: number;
  totalBajo: number;
  avgPrev: number;
}

export interface DirectorMetricasResumen {
  secciones: SeccionMetrica[];
  totalIe: SeccionMetrica | null;
  sortedPreguntas: PreguntasRespuestas[];
  kpis: DirectorKPIs;
  activeBaremo: BaremoDecisiones;
}
