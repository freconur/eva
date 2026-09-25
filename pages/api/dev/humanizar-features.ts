import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI } from '@google/genai';

export function cleanHumanizedText(raw: string): string {
  if (!raw) return '';
  let text = raw;

  // 1. Remover bloques de markdown o fences si existen
  text = text.replace(/```(?:json)?[\s\S]*?```/gi, '');
  text = text.replace(/```/g, '');

  // 2. Limpieza de restos de sintaxis JSON
  text = text.replace(/^[{\[\s"]+/, '');
  text = text.replace(/[}\]\s"]+$/, '');

  // 3. Suavizar tecnicismos que pudieran haberse filtrado
  const technicalTermsMap: [RegExp, string][] = [
    [/\b(react|next\.?js|dnd-kit)\b/gi, 'la plataforma'],
    [/\b(firestore|database|bd|sql)\b/gi, 'la base de datos segura'],
    [/\b(backend|frontend|api|apis|endpoint|endpoints)\b/gi, 'el sistema'],
    [/\b(hook|hooks|props|state|useeffect)\b/gi, 'el módulo'],
    [/\b(jspdf|jspdf-autotable)\b/gi, 'el generador de reportes'],
    [/\b(tailwind|css)\b/gi, 'la interfaz visual'],
    [/\b(regex|expresiones regulares)\b/gi, 'las validaciones automáticas']
  ];

  for (const [regex, replacement] of technicalTermsMap) {
    text = text.replace(regex, replacement);
  }

  return text.trim();
}

interface HumanizeInputItem {
  id?: string;
  titulo: string;
  modulo?: string;
  tipo?: string;
  descripcion?: string;
}

interface HumanizeOutputItem {
  id?: string;
  tituloCliente: string;
  descripcionCliente: string;
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

  const { features } = req.body as { features: HumanizeInputItem[] };

  if (!features || !Array.isArray(features) || features.length === 0) {
    return res.status(400).json({ error: 'Se requiere un arreglo de features a procesar.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Preparar el prompt con las features a traducir
    const featuresPayload = features.map((f, index) => ({
      id: f.id || `item_${index}`,
      tituloTecnico: f.titulo,
      modulo: f.modulo || 'General',
      tipo: f.tipo || 'Desarrollo',
      descripcionTecnica: f.descripcion || ''
    }));

    const prompt = `Eres un consultor senior de software y redactor de propuestas ejecutivas para directivos del sector educativo (Directores de UGEL, especialistas y directores de colegios).
Tu misión es traducir y adaptar los títulos y descripciones técnicas de funcionalidades de software a un lenguaje 100% amigable, comprensible, formal y orientado al valor que recibe el cliente educativo sin conocimientos técnicos.

DIRECTIVAS OBLIGATORIAS:
1. CERO JERGA TÉCNICA: Jamás menciones términos como: React, hooks, state, Firestore, base de datos, collections, JSON, API, backend, frontend, endpoints, props, dnd-kit, css, tailwind, regex, jsPDF, librerías, scripts, componentes, responsive, etc.
2. ENFOQUE EN VALOR EDUCATIVO: Resalta el beneficio práctico: optimización del tiempo docente, certeza en las calificaciones, seguridad en las evaluaciones, agilidad en reportes para directores, facilidad de auditoría escolar, etc.
3. LONGITUD:
   - "tituloCliente": Máximo 7 a 9 palabras. Claro, elegante y centrado en la función (ej: "Reporte Oficial de Rendimiento en PDF" en vez de "Exportación jsPDF autotable A4").
   - "descripcionCliente": 1 o 2 oraciones concisas que expliquen qué hace y en qué beneficia a los usuarios de la institución.
4. SALIDA: Responde estrictamente un arreglo JSON válido donde cada elemento contenga:
[
  {
    "id": "el mismo id proporcionado",
    "tituloCliente": "Texto amigable para el cliente",
    "descripcionCliente": "Descripción clara del beneficio para el cliente"
  }
]

LISTA DE FUNCIONALIDADES TÉCNICAS A TRANSFORMAR:
${JSON.stringify(featuresPayload, null, 2)}`;

    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const rawText = geminiResponse.text?.trim() || '[]';
    let parsedItems: HumanizeOutputItem[] = [];

    try {
      parsedItems = JSON.parse(rawText);
    } catch (parseErr) {
      console.warn('Fallo al parsear directamente JSON de Gemini, aplicando rescate de texto:', parseErr);
      const jsonMatch = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        parsedItems = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se pudo interpretar la respuesta estructurada de Gemini.');
      }
    }

    // Sanitizar y limpiar cada elemento devuelto
    const sanitized: HumanizeOutputItem[] = parsedItems.map((item) => ({
      id: item.id,
      tituloCliente: cleanHumanizedText(item.tituloCliente),
      descripcionCliente: cleanHumanizedText(item.descripcionCliente)
    }));

    return res.status(200).json({
      success: true,
      totalProcesadas: sanitized.length,
      humanized: sanitized
    });
  } catch (error: any) {
    console.error('Error en /api/dev/humanizar-features:', error);
    return res.status(500).json({
      error: 'Ocurrió un error al procesar la traducción con Gemini.',
      details: error?.message || String(error)
    });
  }
}
