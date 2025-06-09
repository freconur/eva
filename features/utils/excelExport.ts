import * as XLSX from 'xlsx';
import { Estudiante, UserEstudiante, PreguntasRespuestas } from '../types/types';
import { converGenero, converSeccion, convertGrade } from '@/fuctions/regiones';

type BaseData = {
  'DNI': string;
  'Nombres y Apellidos': string;
  'Respuestas Correctas': string;
  'Total Preguntas': string;
  'DNI Docente': string;
  'Grado'?: string;
  'Sección'?: string;
  'Género'?: string;
};

export const exportEstudiantesToExcel = (estudiantes: (Estudiante | UserEstudiante)[], fileName: string = 'estudiantes.xlsx') => {
  // Crear un nuevo libro de Excel
  const workbook = XLSX.utils.book_new();

  // Preparar los datos para la exportación
  const dataToExport = estudiantes.map(estudiante => {
    // Crear el objeto base con la información del estudiante
    const baseData: BaseData = {
      'DNI': estudiante.dni || '',
      'Nombres y Apellidos': estudiante.nombresApellidos || '',
      'Respuestas Correctas': String(estudiante.respuestasCorrectas || ''),
      'Total Preguntas': String(estudiante.totalPreguntas || ''),
      'DNI Docente': estudiante.dniDocente || ''
    };

    // Agregar propiedades específicas de UserEstudiante si existen
    if ('grado' in estudiante) {
      baseData['Grado'] = convertGrade(String(estudiante.grado || ''));
    }
    if ('seccion' in estudiante) {
      baseData['Sección'] = converSeccion(Number(estudiante.seccion || ''));
    }
    if ('genero' in estudiante) {
      baseData['Género'] = converGenero(String(estudiante.genero || ''));
    }

    // Agregar las respuestas del estudiante
    const respuestasData = estudiante.respuestas?.reduce((acc, respuesta, index) => {
      const preguntaDocente = 'preguntaDocente' in respuesta ? respuesta.preguntaDocente : '';
      const alternativaSeleccionada = respuesta.alternativas?.find(alt => alt.selected)?.alternativa || '';
      
      return {
        ...acc,
        [`Pregunta ${index + 1}`]: respuesta.pregunta || '',
        [`Actuación ${index + 1}`]: preguntaDocente || '',
        [`Respuesta ${index + 1}`]: respuesta.respuesta || '',
        [`Alternativa Seleccionada ${index + 1}`]: alternativaSeleccionada
      };
    }, {});

    return {
      ...baseData,
      ...respuestasData
    };
  });

  // Crear una hoja de cálculo con los datos
  const worksheet = XLSX.utils.json_to_sheet(dataToExport);

  // Ajustar el ancho de las columnas
  const baseColumnWidths = [
    { wch: 15 }, // DNI
    { wch: 40 }, // Nombres y Apellidos
    { wch: 20 }, // Respuestas Correctas
    { wch: 20 }, // Total Preguntas
    { wch: 15 }  // DNI Docente
  ];

  // Agregar anchos para las columnas opcionales
  const optionalColumnWidths = [
    { wch: 10 }, // Grado
    { wch: 10 }, // Sección
    { wch: 10 }  // Género
  ];

  // Agregar anchos para las columnas de respuestas
  const respuestasColumnWidths = estudiantes[0]?.respuestas?.map(() => [
    { wch: 40 }, // Pregunta
    { wch: 40 }, // Actuación
    { wch: 20 }, // Respuesta
    { wch: 20 }  // Alternativa Seleccionada
  ]).flat() || [];

  worksheet['!cols'] = [...baseColumnWidths, ...optionalColumnWidths, ...respuestasColumnWidths];

  // Agregar la hoja al libro
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Estudiantes');

  // Guardar el archivo
  XLSX.writeFile(workbook, fileName);
}; 