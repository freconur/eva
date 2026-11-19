import type { NextApiRequest, NextApiResponse } from 'next';
import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import {
  generateFichaToken,
  EstudianteEvolutivoPDFProps,
  EtapaHistorialEstudiante,
} from '@/features/utils/exportarFichaEvolutivaEstudiantePDF';

/**
 * Obtiene la instancia de Firestore autenticada de Firebase Admin
 * Soporta credenciales desde archivo físico (local) y variables de entorno (Vercel / Prod)
 */
function getAdminFirestore(): admin.firestore.Firestore {
  if (!admin.apps.length) {
    const serviceAccountPath = path.resolve(process.cwd(), 'eva-ugel.json');
    let initialized = false;

    // 1. Archivo físico local (desarrollo local)
    if (fs.existsSync(serviceAccountPath)) {
      try {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        initialized = true;
      } catch (err) {
        console.warn('No se pudo inicializar Firebase Admin desde eva-ugel.json:', err);
      }
    }

    // 2. Variable con JSON completo o Base64 (Vercel / Producción)
    if (!initialized) {
      const serviceAccountJson =
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
        process.env.FIREBASE_SERVICE_ACCOUNT ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

      if (serviceAccountJson) {
        try {
          const raw = serviceAccountJson.trim();
          const parsed = raw.startsWith('{')
            ? JSON.parse(raw)
            : JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));

          admin.initializeApp({
            credential: admin.credential.cert(parsed),
          });
          initialized = true;
        } catch (err) {
          console.warn('Error al parsear JSON de cuenta de servicio desde variable de entorno:', err);
        }
      }
    }

    // 3. Variables de entorno individuales (FIREBASE_* o GA_*)
    if (!initialized) {
      const clientEmail =
        process.env.FIREBASE_CLIENT_EMAIL ||
        process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
        process.env.GA_CLIENT_EMAIL;

      const rawPrivateKey =
        process.env.FIREBASE_PRIVATE_KEY ||
        process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
        process.env.GA_PRIVATE_KEY;

      const projectId =
        process.env.FIREBASE_PROJECT_ID ||
        process.env.FIREBASE_ADMIN_PROJECT_ID ||
        process.env.GA_PROJECT_ID ||
        'evaluaciones-ugel';

      if (clientEmail && rawPrivateKey) {
        try {
          const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });
          initialized = true;
        } catch (err) {
          console.warn('Error al inicializar Firebase Admin con credenciales individuales:', err);
        }
      }
    }

    // 4. Fallback por defecto (ej. Google Cloud ADC con projectId)
    if (!initialized) {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'evaluaciones-ugel',
      });
    }
  }
  return admin.firestore();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido. Use GET.' });
  }

  const { dni, evalId, token, layout, split, dir, scale, center } = req.query;

  if (!dni || !evalId || !token) {
    return res.status(400).json({
      error: 'Parámetros incompletos. Se requiere dni, evalId y token.',
    });
  }

  const strDni = String(dni).trim();
  const strEvalId = String(evalId).trim();
  const strToken = String(token).trim();

  // Validación estricta del token de seguridad del QR
  const expectedToken = generateFichaToken(strDni, strEvalId);
  if (strToken !== expectedToken) {
    return res.status(403).json({
      error: 'Token de acceso no válido o firma de verificación incorrecta.',
    });
  }

  try {
    const db = getAdminFirestore();

    // 1. Obtener la evaluación principal
    const evalDocRef = db.collection('evaluaciones').doc(strEvalId);
    const evalSnap = await evalDocRef.get();
    if (!evalSnap.exists) {
      return res.status(404).json({ error: 'Evaluación no encontrada.' });
    }
    const evalData: any = evalSnap.data();

    // 2. Cargar configuración de matriz de etapas (EDI, EP1, EP2)
    let etapasConfiguradas: { key: string; id: string; label: string; order: number }[] = [];
    try {
      const matrizDoc = await db.collection('configuraciones').doc('matriz_resultados').get();
      if (matrizDoc.exists) {
        const matrizData = matrizDoc.data();
        const gradosMap = matrizData?.grados || {};
        let assignment: any = null;

        const currentGrado = evalData.grado;
        const currentCat = evalData.categoria;

        if (currentGrado !== undefined && currentCat !== undefined) {
          assignment = gradosMap[`${currentGrado}_${currentCat}`];
        }
        if (!assignment) {
          for (const asgn of Object.values(gradosMap) as any[]) {
            if (
              asgn &&
              (asgn.ediId === strEvalId || asgn.ep1Id === strEvalId || asgn.ep2Id === strEvalId)
            ) {
              assignment = asgn;
              break;
            }
          }
        }

        if (assignment) {
          if (assignment.ediId) {
            etapasConfiguradas.push({ key: 'edi', id: assignment.ediId, label: 'EDI (Diagnóstica)', order: 1 });
          }
          if (assignment.ep1Id) {
            etapasConfiguradas.push({ key: 'ep1', id: assignment.ep1Id, label: 'EP1 (Progresiva 1)', order: 2 });
          }
          if (assignment.ep2Id) {
            etapasConfiguradas.push({ key: 'ep2', id: assignment.ep2Id, label: 'EP2 (Progresiva 2)', order: 3 });
          }
        }
      }
    } catch (errCfg) {
      console.warn('Advertencia al consultar configuraciones/matriz_resultados:', errCfg);
    }

    if (etapasConfiguradas.length === 0) {
      etapasConfiguradas.push({
        key: 'actual',
        id: strEvalId,
        label: evalData.nombre || 'Evaluación Actual',
        order: 1,
      });
    }
    etapasConfiguradas.sort((a, b) => a.order - b.order);

    // 3. Cargar catálogo de preguntas/actuaciones de la evaluación principal
    const catalogoActuaciones: any[] = [];
    try {
      const prSnap = await evalDocRef
        .collection('preguntasRespuestas')
        .orderBy('order', 'asc')
        .get();

      if (!prSnap.empty) {
        prSnap.forEach((pDoc) => {
          const pData = pDoc.data();
          const ord = Number(pData.order) || catalogoActuaciones.length + 1;
          const desc =
            String(
              pData.preguntaDocente ||
              pData.actuacion ||
              pData.actuaciones ||
              pData.textoActuacion ||
              pData.enunciado ||
              pData.pregunta ||
              ''
            ).trim() || `Actuación Pedagógica N° ${ord}`;

          catalogoActuaciones.push({
            order: ord,
            actuacion: desc,
            preguntaDocente: desc,
            actuaciones: desc,
            textoActuacion: desc,
            pregunta: pData.pregunta || '',
            respuestaCorrecta: pData.respuesta || pData.respuestaCorrecta || '',
            opciones: pData.opciones || pData.alternativas || [],
            id: pDoc.id,
          });
        });
      } else if (Array.isArray(evalData.preguntasRespuestas)) {
        evalData.preguntasRespuestas.forEach((pData: any, idx: number) => {
          const ord = Number(pData.order) || idx + 1;
          const desc =
            String(
              pData.preguntaDocente ||
              pData.actuacion ||
              pData.actuaciones ||
              pData.textoActuacion ||
              pData.enunciado ||
              pData.pregunta ||
              ''
            ).trim() || `Actuación Pedagógica N° ${ord}`;

          catalogoActuaciones.push({
            order: ord,
            actuacion: desc,
            preguntaDocente: desc,
            actuaciones: desc,
            textoActuacion: desc,
            pregunta: pData.pregunta || '',
            respuestaCorrecta: pData.respuesta || pData.respuestaCorrecta || '',
            opciones: pData.opciones || pData.alternativas || [],
            id: pData.id || `p_${ord}`,
          });
        });
      }
    } catch (errPr) {
      console.warn('Advertencia al cargar preguntasRespuestas:', errPr);
    }

    // 4. Buscar los resultados del estudiante en cada etapa configurada
    const studentEtapas: Record<string, any> = {};
    const historialEtapas: EtapaHistorialEstudiante[] = [];
    let studentBasicInfo: any = null;
    let docenteIdFound = evalData.idDocente || '';

    for (const etapa of etapasConfiguradas) {
      try {
        let etapaEvalData = evalData;
        if (etapa.id !== strEvalId) {
          const eSnap = await db.collection('evaluaciones').doc(etapa.id).get();
          if (eSnap.exists) {
            etapaEvalData = eSnap.data();
          }
        }

        const targetYear = etapaEvalData.añoDelExamen || new Date().getFullYear();
        const targetMonth =
          etapaEvalData.mesDelExamen !== undefined && etapaEvalData.mesDelExamen !== ''
            ? Number(etapaEvalData.mesDelExamen)
            : 3;

        const subCollRef = db.collection(
          `/evaluaciones/${etapa.id}/estudiantes-evaluados/${targetYear}/${targetMonth}`
        );

        // Buscar primero por ID de documento DNI
        let estDocSnap = await subCollRef.doc(strDni).get();
        if (!estDocSnap.exists) {
          // Búsqueda alternativa por campo 'dni'
          const querySnap = await subCollRef.where('dni', '==', strDni).limit(1).get();
          if (!querySnap.empty) {
            estDocSnap = querySnap.docs[0];
          } else if (!isNaN(Number(strDni))) {
            const querySnapNum = await subCollRef.where('dni', '==', Number(strDni)).limit(1).get();
            if (!querySnapNum.empty) {
              estDocSnap = querySnapNum.docs[0];
            }
          }
        }

        if (estDocSnap.exists) {
          const estData: any = estDocSnap.data();
          if (!studentBasicInfo) {
            studentBasicInfo = estData;
          }
          if (estData.dniDocente && !docenteIdFound) {
            docenteIdFound = estData.dniDocente;
          }

          const rawPuntaje = Number(estData.puntaje) || 0;
          const nivel = estData.nivel || '';

          // Mapear aciertos en las actuaciones pedagógicas (2 = acertó, 1 = no acertó)
          const actuacionesResultados: Record<number, 1 | 2> = {};
          if (Array.isArray(estData.respuestas)) {
            estData.respuestas.forEach((resp: any, idx: number) => {
              const actOrder = idx + 1;
              const isCorrect =
                resp?.esCorrecta === true ||
                resp?.acerto === true ||
                resp?.correcta === true ||
                (resp?.respuesta &&
                  catalogoActuaciones[idx]?.respuestaCorrecta &&
                  String(resp.respuesta).trim().toLowerCase() ===
                    String(catalogoActuaciones[idx].respuestaCorrecta).trim().toLowerCase());

              actuacionesResultados[actOrder] = isCorrect ? 2 : 1;
            });
          }

          studentEtapas[etapa.key] = {
            etapaKey: etapa.key,
            label: etapa.label,
            puntaje: rawPuntaje,
            actuacionesResultados,
            maxPuntaje: Number(etapaEvalData.puntajeMaximo || 20),
            nivel,
          };

          const totalQ = catalogoActuaciones.length || 20;
          const numCorrectas = Object.values(actuacionesResultados).filter((v) => v === 2).length;
          const pct = totalQ > 0 ? Math.round((numCorrectas / totalQ) * 100) : 0;

          historialEtapas.push({
            etapaKey: etapa.key,
            label: etapa.label,
            nombreEvaluacion: etapaEvalData.nombre || etapa.label,
            puntaje: rawPuntaje,
            maxPuntaje: Number(etapaEvalData.puntajeMaximo || 20),
            nivel,
            respuestasCorrectas: numCorrectas,
            totalPreguntas: totalQ,
            porcentaje: pct,
          });
        }
      } catch (errEtapa) {
        console.warn(`Error al recuperar datos de etapa ${etapa.id}:`, errEtapa);
      }
    }

    if (!studentBasicInfo && historialEtapas.length === 0) {
      return res.status(404).json({
        error: 'No se encontraron registros de evaluación para el estudiante con este DNI.',
      });
    }

    // 5. Cargar información del docente e institución
    let nombreDocente = 'Docente de Aula';
    let fotoDocenteUrl = '';
    let nombreColegio = studentBasicInfo?.institucion || evalData.institucion || '';

    if (docenteIdFound) {
      try {
        const docUserSnap = await db.collection('usuarios').doc(String(docenteIdFound)).get();
        if (docUserSnap.exists) {
          const docData = docUserSnap.data();
          nombreDocente = `${docData?.nombres || ''} ${docData?.apellidos || ''}`.trim() || nombreDocente;
          fotoDocenteUrl = docData?.fotoUrl || docData?.foto || '';
          if (!nombreColegio) {
            nombreColegio = docData?.institucion || '';
          }
        }
      } catch (errDoc) {
        console.warn('Advertencia al consultar datos de docente:', errDoc);
      }
    }

    // 6. Ensamblar las props para la Ficha Evolutiva
    const nombres = studentBasicInfo?.nombres || 'Estudiante';
    const apellidos = studentBasicInfo?.apellidos || '';
    const seccion = studentBasicInfo?.seccion || evalData.seccion || '';
    const nivelActual =
      studentBasicInfo?.nivel ||
      historialEtapas[historialEtapas.length - 1]?.nivel ||
      '';
    const puntajeActual =
      studentBasicInfo?.puntaje !== undefined
        ? Number(studentBasicInfo.puntaje)
        : historialEtapas[historialEtapas.length - 1]?.puntaje || 0;

    const props: EstudianteEvolutivoPDFProps = {
      estudiante: {
        dni: strDni,
        nombres,
        apellidos,
        seccion,
        genero: studentBasicInfo?.genero || '',
        fotoUrl: studentBasicInfo?.fotoUrl || studentBasicInfo?.fotoCarnetUrl || '',
        puntaje: puntajeActual,
        maxPuntaje: 20,
        nivel: nivelActual,
      },
      evaluacionActual: {
        id: strEvalId,
        nombre: evalData.nombre || 'Evaluación de Aprendizajes',
        grado: evalData.grado,
        añoDelExamen: evalData.añoDelExamen,
        mesDelExamen: evalData.mesDelExamen,
      },
      nombreDocente,
      fotoDocenteUrl,
      nombreColegio,
      historialEtapas,
      deltaPuntaje: 0,
      estadoTrayectoria: 'estable',
      promedioAula: puntajeActual,
      diferenciaConAula: 0,
      catalogoActuaciones,
      etapasConfiguradas,
      studentEtapas,
      activeStages: { edi: true, ep1: true, ep2: true },
      chartLayoutMode:
        layout === 'flotante' || layout === 'columnas' || layout === 'dividido' || layout === 'diana'
          ? (layout as any)
          : 'diana',
      splitInTwo: split === '1' || split === 'true' || layout === 'dividido',
      orderDirection: dir === 'antihorario' ? 'antihorario' : 'horario',
      centerChartType: center === 'diana' ? 'diana' : 'radar',
      textScale: scale && !isNaN(Number(scale)) ? Number(scale) : 1,
    };

    return res.status(200).json({ ok: true, props });
  } catch (error: any) {
    console.error('Error al procesar consulta de ficha de estudiante:', error);
    return res.status(500).json({
      error: 'Ocurrió un error en el servidor al generar la ficha del estudiante.',
      detalles: error?.message,
    });
  }
}
