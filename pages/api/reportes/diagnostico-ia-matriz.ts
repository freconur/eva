import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI } from '@google/genai';

interface DiagnosticoInputPayload {
  gradoName: string;
  yearSelected: number;
  evaluaciones: {
    ediNombre?: string;
    ep1Nombre?: string;
    ep2Nombre?: string;
  };
  resumenGeneral: {
    totalEstudiantes: { edi?: number; ep1?: number; ep2?: number };
    rcPromedio: { edi?: number; ep1?: number; ep2?: number };
    puntajePromedio: { edi?: number; ep1?: number; ep2?: number };
    nivelesLogro: {
      nivel: string;
      edi?: { cantidad: number; porcentaje: number };
      ep1?: { cantidad: number; porcentaje: number };
      ep2?: { cantidad: number; porcentaje: number };
    }[];
  };
  itemsCriticos: {
    order: number;
    enunciado?: string;
    ediPorcentaje?: number;
    ep1Porcentaje?: number;
    ep2Porcentaje?: number;
    tendencia?: string;
  }[];
  ugelDesempenos: {
    nombre: string;
    puntajeEdi?: number;
    puntajeEp1?: number;
    puntajeEp2?: number;
    totalEstudiantes?: number;
  }[];
}

export interface DiagnosticoOutputResponse {
  tituloInforme: string;
  diagnosticoGlobal: string;
  analisisEvolucionNiveles: string;
  analisisItemsCriticos: {
    item: string;
    competenciaOEnfoque: string;
    diagnostico: string;
    estrategiaDidactica: string;
  }[];
  zonasPrioritarias: {
    zonaOInstitucion: string;
    nivelAlerta: 'Alta' | 'Media' | 'Baja';
    observacion: string;
    accionFocalizada: string;
  }[];
  accionesUgel: string[];
  accionesDirectores: string[];
  accionesDocentes: string[];
  conclusionPedagogica: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Utilizar POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY no configurada en las variables de entorno del servidor (.env.local).'
    });
  }

  const payload = req.body as DiagnosticoInputPayload;

  if (!payload || !payload.gradoName) {
    return res.status(400).json({ error: 'Datos insuficientes para generar el diagnóstico.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const itemsCriticos = Array.isArray(payload.itemsCriticos) ? payload.itemsCriticos : [];
    const ugelDesempenos = Array.isArray(payload.ugelDesempenos) ? payload.ugelDesempenos : [];
    const resumenGeneral = payload.resumenGeneral || {
      totalEstudiantes: {},
      rcPromedio: {},
      puntajePromedio: {},
      nivelesLogro: []
    };
    const totalEstudiantes = resumenGeneral.totalEstudiantes || {};
    const rcPromedio = resumenGeneral.rcPromedio || {};
    const puntajePromedio = resumenGeneral.puntajePromedio || {};
    const nivelesLogro = Array.isArray(resumenGeneral.nivelesLogro) ? resumenGeneral.nivelesLogro : [];
    const evaluaciones = payload.evaluaciones || {};

    const prompt = `Actúa como un Especialista Pedagógico Senior en Evaluación de los Aprendizajes del Currículo Nacional de la Educación Básica (CNEB - MINEDU / UGEL 13 Yauyos).
Tu función es redactar un INFORME TÉCNICO-PEDAGÓGICO OFICIAL DE DIAGNÓSTICO LONGITUDINAL basado en los resultados reales de las evaluaciones aplicadas en las tres etapas del año escolar:
1. EDI (Evaluación Diagnóstica de Inicio - Marzo)
2. EP1 (Evaluación Procesal 1 - Julio)
3. EP2 (Evaluación Procesal 2 - Noviembre)

DATOS AGREGADOS DE LA EVALUACIÓN:
- Grado y Área: ${payload.gradoName}
- Año Lectivo: ${payload.yearSelected || new Date().getFullYear()}
- Evaluaciones Monitoreadas:
  * Diagnóstica (EDI): ${evaluaciones.ediNombre || 'No registrada'}
  * Procesal 1 (EP1): ${evaluaciones.ep1Nombre || 'No registrada'}
  * Procesal 2 (EP2): ${evaluaciones.ep2Nombre || 'No registrada'}
- Cobertura de Estudiantes:
  * EDI: ${totalEstudiantes.edi ?? 'Sin datos'} estudiantes
  * EP1: ${totalEstudiantes.ep1 ?? 'Sin datos'} estudiantes
  * EP2: ${totalEstudiantes.ep2 ?? 'Sin datos'} estudiantes
- Promedios Generales (Puntaje Vigesimal 0-20 y Respuestas Correctas RC):
  * Puntaje EDI: ${puntajePromedio.edi ?? '-'} | RC: ${rcPromedio.edi ?? '-'}
  * Puntaje EP1: ${puntajePromedio.ep1 ?? '-'} | RC: ${rcPromedio.ep1 ?? '-'}
  * Puntaje EP2: ${puntajePromedio.ep2 ?? '-'} | RC: ${rcPromedio.ep2 ?? '-'}
- Distribución de Niveles de Logro (CNEB: Inicio, Proceso, Logrado, Destacado):
${JSON.stringify(nivelesLogro, null, 2)}
- Ítems de Mayor Complejidad / Menor Rendimiento (% acierto a lo largo del año):
${JSON.stringify(itemsCriticos.slice(0, 8), null, 2)}
- Muestra de Resultados por Jurisdicciones / Zonas:
${JSON.stringify(ugelDesempenos.slice(0, 10), null, 2)}

DIRECTIVAS OBLIGATORIAS:
1. RIGOR Y TERMINOLOGÍA CNEB: Usa terminología formal del Currículo Nacional peruano: competencias, capacidades, estándares de aprendizaje, evaluación formativa, niveles de logro (En Inicio, En Proceso, Logro Esperado, Logro Destacado).
2. ANÁLISIS LONGITUDINAL EXCLUSIVO: Analiza la transición entre EDI ➔ EP1 ➔ EP2. Señala con claridad si hubo progreso, estancamiento o retroceso.
3. CONCRECIÓN Y UTILIDAD PRÁCTICA: Brinda sugerencias didácticas aplicables al aula (materiales concretos, resolución de problemas en contexto, modelamiento, retroalimentación formativa por descubrimiento).
4. SALIDA: Responde estrictamente un JSON válido con esta estructura:

{
  "tituloInforme": "Título formal del informe pedagógico",
  "diagnosticoGlobal": "Párrafos con la lectura general del rendimiento provincial/red, correlacionando EDI, EP1 y EP2.",
  "analisisEvolucionNiveles": "Análisis minucioso del movimiento de estudiantes entre los niveles En Inicio, En Proceso y Logrado.",
  "analisisItemsCriticos": [
    {
      "item": "P03",
      "competenciaOEnfoque": "Nombre de la competencia o habilidad evaluada",
      "diagnostico": "Explicación pedagógica de por qué fallaron los estudiantes",
      "estrategiaDidactica": "Estrategia pedagógica concreta para superar esta dificultad"
    }
  ],
  "zonasPrioritarias": [
    {
      "zonaOInstitucion": "Nombre de la zona/colegio",
      "nivelAlerta": "Alta",
      "observacion": "Motivo del rendimiento bajo o estancado",
      "accionFocalizada": "Intervención sugerida por la UGEL"
    }
  ],
  "accionesUgel": [
    "Acción 1 para especialistas...",
    "Acción 2..."
  ],
  "accionesDirectores": [
    "Acción 1 para directores...",
    "Acción 2..."
  ],
  "accionesDocentes": [
    "Estrategia 1 para docentes en aula...",
    "Estrategia 2..."
  ],
  "conclusionPedagogica": "Conclusión final orientada a la toma de decisiones para el cierre de brechas."
}`;

    const CANDIDATE_MODELS = [
      'gemini-flash-lite-latest',
      'gemini-3.6-flash',
      'gemini-3.5-flash-lite',
      'gemini-flash-latest'
    ];

    let lastError: any = null;
    let parsedData: DiagnosticoOutputResponse | null = null;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const geminiResponse = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        });

        const rawText = geminiResponse.text?.trim() || '{}';
        try {
          parsedData = JSON.parse(rawText);
        } catch (parseErr) {
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No se pudo interpretar la respuesta estructurada de Gemini.');
          }
        }

        if (parsedData && parsedData.tituloInforme) {
          break; // Éxito con este modelo
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Modelo ${modelName} no disponible o falló, intentando siguiente...`, err?.message || err);
      }
    }

    if (!parsedData) {
      throw lastError || new Error('Ninguno de los modelos disponibles pudo completar la solicitud.');
    }

    return res.status(200).json({
      success: true,
      diagnostico: parsedData
    });
  } catch (error: any) {
    console.error('Error en /api/reportes/diagnostico-ia-matriz:', error);
    return res.status(500).json({
      error: 'Ocurrió un error al procesar el diagnóstico pedagógico con Gemini.',
      details: error?.message || String(error)
    });
  }
}
