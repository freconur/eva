import * as XLSX from 'xlsx';
import { Estudiante, UserEstudiante, PreguntasRespuestas, User } from '../types/types';
import { converGenero, converSeccion, convertGrade, regionTexto, rolTexto, getAreaTexto, getCaracteristicasDirectivoTexto } from '@/fuctions/regiones';

type BaseData = {
  'DNI': string;
  'Nombres y Apellidos': string;
  'Respuestas Correctas': string;
  'Total Preguntas': string;
  'DNI Docente': string;
  'Institución'?: string;
  'Nivel'?: string;
  'Puntaje'?: string;
  'Grado'?: string;
  'Sección'?: string;
  'Género'?: string;
  'Distrito'?: string;
  'Región'?: string;
  'Área'?: string;
  'Característica Curricular'?: string;
  'Tipo Gestión'?: string;
};

export const exportEstudiantesToExcel = (
  estudiantes: (Estudiante | UserEstudiante)[],
  fileName: string = 'estudiantes.xlsx',
  preguntasRespuestas?: PreguntasRespuestas[]
) => {
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
      'Institución': estudiante.institucion || '',
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
    if ('distrito' in estudiante) {
      baseData['Distrito'] = estudiante.distrito || '';
    }
    if ('region' in estudiante) {
      baseData['Región'] = regionTexto(String(estudiante.region || '')) || '';
    }
    if ('area' in estudiante) {
      baseData['Área'] = getAreaTexto(estudiante.area);
    }
    if ('caracteristicaCurricular' in estudiante) {
      baseData['Característica Curricular'] = getCaracteristicasDirectivoTexto(estudiante.caracteristicaCurricular);
    }
    if ('tipoGestion' in estudiante) {
      const val = estudiante.tipoGestion || '';
      baseData['Tipo Gestión'] = val ? val.charAt(0).toUpperCase() + val.slice(1) : '';
    }

    // Agregar las respuestas del estudiante
    let respuestasData = {};
    if (preguntasRespuestas && preguntasRespuestas.length > 0) {
      respuestasData = preguntasRespuestas.reduce((acc, globalP, index) => {
        let alternativaSeleccionada = '';
        if (estudiante.respuestas) {
          if (Array.isArray(estudiante.respuestas)) {
            // Formato antiguo (Array de objetos)
            const resp = estudiante.respuestas.find(r =>
              (globalP.id && r.id === globalP.id) || (globalP.order !== undefined && r.order === globalP.order)
            );
            alternativaSeleccionada = resp?.alternativas?.find(alt => alt.selected)?.alternativa || '';
          } else if (typeof estudiante.respuestas === 'object') {
            // Formato optimizado (Mapa/Objeto)
            alternativaSeleccionada = (estudiante.respuestas as any)[globalP.id || ''] || '';
          }
        }

        return {
          ...acc,
          [`Pregunta ${index + 1}`]: globalP.pregunta || '',
          [`Actuación ${index + 1}`]: globalP.preguntaDocente || '',
          [`Respuesta ${index + 1}`]: globalP.respuesta || '',
          [`Alternativa Seleccionada ${index + 1}`]: alternativaSeleccionada
        };
      }, {});
    } else {
      // Fallback de compatibilidad si no se proporciona la lista global de preguntas
      if (estudiante.respuestas && Array.isArray(estudiante.respuestas)) {
        respuestasData = estudiante.respuestas.reduce((acc, respuesta, index) => {
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
      }
    }

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
    { wch: 10 }, // Género
    { wch: 20 }, // Distrito
    { wch: 15 }, // Región
    { wch: 12 }, // Área
    { wch: 25 }, // Característica Curricular
    { wch: 15 }  // Tipo Gestión
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

export const exportDirectorDocenteDataToExcel = (
  datos: any[],
  fileName: string = 'evaluaciones_director_docente.xlsx',
  nivelYPuntaje?: any[]
) => {
  // Crear un nuevo libro de Excel
  const workbook = XLSX.utils.book_new();

  // Preparar los datos para la exportación, incluyendo reporteEstudiantes
  const dataToExport = datos.map((item: User, index) => {
    const total = Number(item.totalEstudiantes || 0);
    const sum = Number(item.sumaPuntajes || 0);
    const promedio = total > 0 ? Math.round((sum / total) * 100) / 100 : 0;

    let nivelNombre = '';
    if (nivelYPuntaje && Array.isArray(nivelYPuntaje) && nivelYPuntaje.length > 0 && total > 0) {
      const promedioParaNivel = Math.round(promedio);
      const nivelesOrdenados = [...nivelYPuntaje].sort((a, b) => (a.min || 0) - (b.min || 0));
      for (const nivelData of nivelesOrdenados) {
        const minPuntaje = nivelData.min || 0;
        const maxPuntaje = nivelData.max || Number.MAX_SAFE_INTEGER;
        if (promedioParaNivel >= minPuntaje && promedioParaNivel <= maxPuntaje) {
          nivelNombre = nivelData.nivel || '';
          break;
        }
      }
    }
    const nivelCapitalizado = nivelNombre ? nivelNombre.charAt(0).toUpperCase() + nivelNombre.slice(1) : '';

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
      'Área': getAreaTexto(item.area),
      'Característica Curricular': getCaracteristicasDirectivoTexto(item.caracteristicaCurricular),
      'Tipo Gestión': item.tipoGestion ? item.tipoGestion.charAt(0).toUpperCase() + item.tipoGestion.slice(1) : '',
      'Total Estudiantes': total,
      'Suma Puntajes': sum,
      'Puntaje Promedio': promedio,
      'Nivel': nivelCapitalizado,
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
    { wch: 12 },  // Área
    { wch: 25 },  // Característica Curricular
    { wch: 15 },  // Tipo Gestión
    { wch: 15 },  // Total Estudiantes
    { wch: 15 },  // Suma Puntajes
    { wch: 18 },  // Puntaje Promedio
    { wch: 15 }   // Nivel
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