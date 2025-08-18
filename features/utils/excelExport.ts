import * as XLSX from 'xlsx';
import { Estudiante, UserEstudiante, PreguntasRespuestas, User } from '../types/types';
import { converGenero, converSeccion, convertGrade, regionTexto, rolTexto } from '@/fuctions/regiones';

type BaseData = {
  'DNI': string;
  'Nombres y Apellidos': string;
  'Respuestas Correctas': string;
  'Total Preguntas': string;
  'DNI Docente': string;
  'Nivel'?: string;
  'Puntaje'?: string;
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
      'DNI Docente': estudiante.dniDocente || '',
      'Nivel': estudiante.nivel || '',
      'Puntaje': String(estudiante.puntaje || '')
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
    { wch: 15 }, // DNI Docente
    { wch: 15 }, // Nivel
    { wch: 15 }  // Puntaje
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

export const exportDirectorDocenteDataToExcel = (datos: any[], fileName: string = 'evaluaciones_director_docente.xlsx') => {
  // Crear un nuevo libro de Excel
  const workbook = XLSX.utils.book_new();

  // Preparar los datos para la exportación, incluyendo reporteEstudiantes
  const dataToExport = datos.map((item: User, index) => {
    // Crear el objeto base con solo las propiedades requeridas
    const baseData: any = {
      'N°': index + 1,
      'DNI': item.dni || '',
      'Apellidos': item.apellidos || '',
      'Nombres': item.nombres || '',
      'Distrito': item.distrito || '',
      'Institucion': item.institucion || '',
      'region': regionTexto(String(item.region)) || '',
      'rol': rolTexto(Number(item.rol)) || '',
      'Género': converGenero(String(item.genero || '')) || '',
    };

    // Agregar datos de reporteEstudiantes si existe
    if (item.reporteEstudiantes && Array.isArray(item.reporteEstudiantes)) {
      item.reporteEstudiantes.forEach((reporte: any, reporteIndex: number) => {
        const indexSuffix = reporteIndex + 1;
        
        // Agregar las propiedades ax, bx, cx, dx, totalx según existan
        if (reporte.a !== undefined) {
          baseData[`a${indexSuffix}`] = reporte.a;
        }
        if (reporte.b !== undefined) {
          baseData[`b${indexSuffix}`] = reporte.b;
        }
        if (reporte.c !== undefined) {
          baseData[`c${indexSuffix}`] = reporte.c;
        }
        if (reporte.d !== undefined) {
          baseData[`d${indexSuffix}`] = reporte.d;
        }
        if (reporte.total !== undefined) {
          baseData[`total${indexSuffix}`] = reporte.total;
        }
      });
    }

    return baseData;
  });

  // Crear una hoja de cálculo con los datos
  const worksheet = XLSX.utils.json_to_sheet(dataToExport);

  // Calcular el número máximo de reportes para determinar las columnas
  const maxReportes = Math.max(...datos.map((item: any) => 
    item.reporteEstudiantes ? item.reporteEstudiantes.length : 0
  ));

  // Ajustar el ancho de las columnas para las propiedades básicas
  const baseColumnWidths = [
    { wch: 5 },   // N°
    { wch: 15 },  // DNI
    { wch: 20 },  // Apellidos
    { wch: 20 },  // Nombres
    { wch: 20 },  // Distrito
    { wch: 30 },  // Institución
    { wch: 10 },  // Región
    { wch: 8 },   // Rol
    { wch: 12 },  // Género
  ];

  // Agregar anchos para las columnas de reporte
  const reporteColumnWidths = [];
  for (let i = 1; i <= maxReportes; i++) {
    reporteColumnWidths.push(
      { wch: 10 }, // ax
      { wch: 10 }, // bx
      { wch: 10 }, // cx
      { wch: 10 }, // dx
      { wch: 12 }  // totalx
    );
  }

  worksheet['!cols'] = [...baseColumnWidths, ...reporteColumnWidths];

  // Agregar la hoja al libro
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Evaluaciones Director Docente');

  // Guardar el archivo
  XLSX.writeFile(workbook, fileName);
}; 