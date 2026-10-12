import {
  AlternativasDocente,
  CrearEvaluacionDocente,
  DimensionEspecialista,
  NivelYPuntaje,
  PRDocentes,
  PreviewPRDocentes,
  User,
} from '@/features/types/types';

export type EvaluacionRole = 'especialista' | 'director' | 'docente';

export interface EvaluacionDesempenoConfig {
  collectionName: 'evaluaciones-especialista' | 'evaluaciones-docentes' | string;
  role: EvaluacionRole;
  basePath: string; // e.g., '/admin/especialistas/evaluaciones-especialistas' o '/directores/evaluaciones-docentes'
  scopeKey?: 'region' | 'dniDirector' | string;
  scopeValue?: string | number | null;
  evaluadoLabel: string; // 'Director' o 'Docente'
  evaluadorLabel: string; // 'Especialista UGEL' o 'Director'
}

export interface ModalBaseProps {
  idEvaluacion: string;
  collectionName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface ModalAgregarDimensionProps extends ModalBaseProps {
  handleShowModalDimension?: () => void; // Compatibilidad
}

export interface ModalUpdateDimensionProps extends ModalBaseProps {
  dimensionUpdate: DimensionEspecialista;
  handleShowUpdateDimension?: () => void; // Compatibilidad
}

export interface ModalConfigurarEscalaProps extends ModalBaseProps {
  escalaActual?: AlternativasDocente[];
  handleShowConfigurarEscala?: () => void; // Compatibilidad
}

export interface ModalConfigurarFaseProps extends ModalBaseProps {
  faseActual?: string;
  handleShowConfigurarFase?: () => void; // Compatibilidad
}

export interface ModalConfigurarNivelesProps extends ModalBaseProps {
  nivelesActuales?: NivelYPuntaje[];
  handleShowConfigurarNiveles?: () => void; // Compatibilidad
}

export interface ModalConfigurarNivelesPorDominioProps extends ModalBaseProps {
  dimensiones: DimensionEspecialista[];
  preguntas?: PRDocentes[];
  escala?: AlternativasDocente[];
  initialDimensionId?: string;
  handleShowModal?: () => void; // Compatibilidad
}

export interface ModalConfigurarDescripcionProps extends ModalBaseProps {
  descripcionActual?: string;
  handleShowConfigurarDescripcion?: () => void; // Compatibilidad
}

export interface ModalAgregarPreguntaProps extends ModalBaseProps {
  dimensiones?: DimensionEspecialista[];
  escala?: AlternativasDocente[];
  handleShowModalPreguntas?: () => void; // Compatibilidad
}

export interface ModalUpdatePreguntaProps extends ModalBaseProps {
  dataUpdate: PRDocentes;
  dimensiones?: DimensionEspecialista[];
  escala?: AlternativasDocente[];
  handleShowUpdateModal?: () => void; // Compatibilidad
}

export interface ModalEvidenciasProps {
  isOpen: boolean;
  onClose: () => void;
  idEvaluacion: string;
  collectionName?: string;
  pregunta: PRDocentes;
  evaluadoDni: string;
  currentSessionId?: string | null;
  onEvidenciasChange?: (nuevasEvidencias: any[]) => void;
}
