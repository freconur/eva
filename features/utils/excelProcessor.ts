import * as XLSX from 'xlsx';
import { EstudianteExcel, EstudianteImportado, ExcelValidationResult } from '../types/estudiante';

/**
 * Normaliza el valor de género a formato numérico string
 * @param genero - Valor de género que puede venir en diferentes formatos
 * @returns "1" para masculino, "2" para femenino, o string vacío si no se puede determinar
 */
export const normalizarGenero = (genero: string | number): string => {
  if (!genero) return '';
  
  // Convertir a string y normalizar (minúsculas, sin espacios)
  const generoNormalizado = String(genero).toLowerCase().trim();
  
  // Mapeo de valores masculinos
  const valoresMasculinos = [
    'masculino', 'masculin', 'mascul', 'masculi',
    'm', 'male', 'hombre', 'hombr', 'hom',
    'niño', 'niñ', 'niñ', 'boy', 'varon', 'varón'
  ];
  
  // Mapeo de valores femeninos
  const valoresFemeninos = [
    'femenino', 'femenin', 'femen', 'femeni',
    'f', 'female', 'mujer', 'muje', 'muj',
    'niña', 'niñ', 'girl', 'hembra'
  ];
  
  // Verificar si es masculino
  if (valoresMasculinos.some(valor => generoNormalizado.includes(valor))) {
    return '1';
  }
  
  // Verificar si es femenino
  if (valoresFemeninos.some(valor => generoNormalizado.includes(valor))) {
    return '2';
  }
  
  // Si ya es un número válido, mantenerlo
  if (generoNormalizado === '1' || generoNormalizado === '2') {
    return generoNormalizado;
  }
  
  // Si no se puede determinar, retornar vacío
  console.warn('⚠️ Género no reconocido:', genero, '-> Valor normalizado: ""');
  return '';
};

/**
 * Procesa un archivo Excel y extrae los datos de estudiantes
 * @param file - Archivo Excel subido por el usuario
 * @returns Promise con el resultado de la validación
 */
export const procesarArchivoExcel = async (file: File): Promise<ExcelValidationResult> => {
  console.log('🚀 Iniciando procesamiento de archivo:', file.name, 'Tipo:', file.type, 'Tamaño:', file.size);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('No se pudo leer el archivo'));
          return;
        }

        // Leer el workbook
        const workbook = XLSX.read(data, { type: 'binary' });
        console.log('📊 Hojas disponibles:', workbook.SheetNames);
        
        // Obtener la primera hoja
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        console.log('📋 Procesando hoja:', sheetName);
        
        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log('📄 Datos JSON extraídos (primeras 3 filas):', jsonData.slice(0, 3));
        
        // Procesar y validar datos
        const resultado = procesarDatosExcel(jsonData);
        resolve(resultado);
        
      } catch (error) {
        reject(new Error(`Error al procesar el archivo: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsBinaryString(file);
  });
};

/**
 * Procesa los datos JSON extraídos del Excel
 * @param jsonData - Datos en formato JSON del Excel
 * @returns Resultado de la validación
 */
const procesarDatosExcel = (jsonData: any[]): ExcelValidationResult => {
  console.log('🔍 Total de filas recibidas:', jsonData.length);
  console.log('🔍 Contenido completo:', jsonData);
  
  if (!jsonData || jsonData.length < 2) {
    return {
      estudiantes: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errors: ['El archivo debe contener al menos una fila de datos']
    };
  }

  // Filtrar filas vacías
  const datosFiltrados = jsonData.filter(fila => 
    Array.isArray(fila) && fila.length > 0 && fila.some(celda => celda !== null && celda !== undefined && celda !== '')
  );
  console.log('🔍 Filas después del filtro:', datosFiltrados.length);
  console.log('🔍 Datos filtrados:', datosFiltrados);
  
  if (datosFiltrados.length < 2) {
    console.log('❌ Error: No hay suficientes filas después del filtro');
    return {
      estudiantes: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errors: ['El archivo debe contener al menos una fila de datos después del filtrado']
    };
  }

  // Obtener headers (primera fila)
  const headers = datosFiltrados[0] as string[];
  console.log('🔍 Headers detectados:', headers);
  console.log('🔍 Headers como string:', headers.map(h => `"${h}"`).join(', '));
  
  const headerMap = mapearHeaders(headers);
  console.log('🔍 HeaderMap resultante:', headerMap);
  
  // Validar que existan las columnas necesarias
  const columnasRequeridas = ['dni', 'nombresApellidos', 'genero'];
  const columnasFaltantes = columnasRequeridas.filter(col => headerMap[col] === undefined);
  console.log('🔍 Columnas requeridas:', columnasRequeridas);
  console.log('🔍 Columnas faltantes:', columnasFaltantes);
  console.log('🔍 Verificando cada columna:');
  columnasRequeridas.forEach(col => {
    console.log(`🔍 ${col}: ${headerMap[col] !== undefined ? '✅ Encontrada' : '❌ Faltante'}`);
  });
  
  if (columnasFaltantes.length > 0) {
    return {
      estudiantes: [],
      totalRows: datosFiltrados.length - 1,
      validRows: 0,
      invalidRows: datosFiltrados.length - 1,
      errors: [`Faltan las siguientes columnas: ${columnasFaltantes.join(', ')}`]
    };
  }

  // Procesar filas de datos
  const estudiantes: EstudianteImportado[] = [];
  const erroresGenerales: string[] = [];
  
  for (let i = 1; i < datosFiltrados.length; i++) {
    const fila = datosFiltrados[i] as any[];
    const estudiante = procesarFilaEstudiante(fila, headerMap, i + 1);
    estudiantes.push(estudiante);
  }

  const validRows = estudiantes.filter(est => est.isValid).length;
  const invalidRows = estudiantes.filter(est => !est.isValid).length;

  return {
    estudiantes,
    totalRows: datosFiltrados.length - 1,
    validRows,
    invalidRows,
    errors: erroresGenerales
  };
};

/**
 * Normaliza un header para comparación
 * @param header - Header original
 * @returns Header normalizado
 */
const normalizarHeader = (header: string): string => {
  return header?.toString().toLowerCase().trim().replace(/\s+/g, '') || '';
};

/**
 * Mapea los headers del Excel a los nombres de campos esperados
 * @param headers - Headers del Excel
 * @returns Mapeo de headers a campos
 */
const mapearHeaders = (headers: string[]): Record<string, number> => {
  const map: Record<string, number> = {};
  
  console.log('🔍 Iniciando mapeo de headers...');
  
  headers.forEach((header, index) => {
    const headerLower = header?.toString().toLowerCase().trim();
    const headerNormalizado = normalizarHeader(header);
    console.log(`🔍 Header[${index}]: "${header}" -> "${headerLower}" -> "${headerNormalizado}"`);
    
    // Mapear diferentes variaciones de nombres de columnas
    // DNI
    if (headerLower?.includes('dni') || 
        headerLower?.includes('documento') || 
        headerLower?.includes('cedula') ||
        headerLower?.includes('cédula') ||
        headerLower === 'dni' ||
        headerLower === 'documento') {
      map.dni = index;
      console.log(`✅ DNI mapeado en índice ${index} para header: "${header}"`);
    }
    
    // Nombres y Apellidos
    if (headerLower?.includes('nombre') || 
        headerLower?.includes('apellido') || 
        headerLower?.includes('estudiante') ||
        headerLower?.includes('alumno') ||
        headerLower === 'nombres' ||
        headerLower === 'apellidos' ||
        headerLower === 'estudiante' ||
        headerLower === 'nombres y apellidos' ||
        headerLower === 'nombresapellidos' ||
        headerNormalizado === 'nombresyapellidos' ||
        headerNormalizado === 'nombresapellidos') {
      map.nombresApellidos = index;
      console.log(`✅ NombresApellidos mapeado en índice ${index} para header: "${header}"`);
    }
    
    // Género
    if (headerLower?.includes('genero') || 
        headerLower?.includes('género') || 
        headerLower?.includes('sexo') ||
        headerLower === 'genero' ||
        headerLower === 'género' ||
        headerLower === 'sexo') {
      map.genero = index;
      console.log(`✅ Género mapeado en índice ${index} para header: "${header}"`);
    }
  });
  
  console.log('🔍 Mapeo final:', map);
  return map;
};

/**
 * Procesa una fila individual de estudiante
 * @param fila - Fila de datos del Excel
 * @param headerMap - Mapeo de headers
 * @param numeroFila - Número de fila para errores
 * @returns Estudiante procesado con validaciones
 */
const procesarFilaEstudiante = (
  fila: any[], 
  headerMap: Record<string, number>, 
  numeroFila: number
): EstudianteImportado => {
  const errores: string[] = [];
  
  // Extraer datos
  const dni = fila[headerMap.dni]?.toString().trim() || '';
  const nombresApellidos = fila[headerMap.nombresApellidos]?.toString().trim() || '';
  const genero = normalizarGenero(fila[headerMap.genero] || '');

  // Validaciones
  if (!dni) {
    errores.push('DNI es requerido');
  } else if (!/^\d{8}$/.test(dni)) {
    errores.push('DNI debe tener exactamente 8 dígitos');
  }

  if (!nombresApellidos) {
    errores.push('Nombres y apellidos son requeridos');
  } else if (nombresApellidos.length < 2) {
    errores.push('Nombres y apellidos deben tener al menos 2 caracteres');
  }

  if (!genero) {
    errores.push('Género es requerido');
  } else if (!['1', '2'].includes(genero)) {
    errores.push('Género debe ser válido (1: Masculino, 2: Femenino)');
  }

  return {
    id: `temp_${numeroFila}_${Date.now()}`,
    dni,
    nombresApellidos,
    genero,
    isValid: errores.length === 0,
    errors: errores
  };
};

/**
 * Valida si un archivo es un Excel válido
 * @param file - Archivo a validar
 * @returns true si es válido
 */
export const validarArchivoExcel = (file: File): boolean => {
  const extensionesValidas = ['.xlsx', '.xls','.ods'];
  const tipoMimeValidos = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];
  
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  const esExtensionValida = extensionesValidas.includes(extension);
  const esTipoMimeValido = tipoMimeValidos.includes(file.type);
  
  return esExtensionValida || esTipoMimeValido;
};
