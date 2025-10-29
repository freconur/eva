export interface EstudianteExcel {
  dni: string;
  nombresApellidos: string;
  genero: string;
}

export interface EstudianteImportado extends EstudianteExcel {
  id: string;
  isValid: boolean;
  errors: string[];
  grado?: string;
  seccion?: string;
}

export interface ExcelValidationResult {
  estudiantes: EstudianteImportado[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
}

export interface FileUploadState {
  file: File | null;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}
