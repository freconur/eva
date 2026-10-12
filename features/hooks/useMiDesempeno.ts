import { useState, useCallback, useEffect } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import {
  AlternativasDocente,
  NivelYPuntaje,
  PRDocentes,
  RetroalimentacionDinamica,
  ObservacionMonitoreoDocente,
} from '../types/types';

export interface EvaluadoSesion {
  id: string; // sessionId
  idEvaluacion: string;
  faseNombre?: string;
  idFase?: string;
  numeroEvaluacion?: number;
  calificacion?: number;
  fechaMonitoreo?: string;
  horaInicio?: string;
  horaFinal?: string;
  datosMonitor?: {
    nombres?: string;
    apellidos?: string;
    dni?: string;
    cargo?: string;
    institucion?: string;
  };
  tituloReporte?: string;
  resultadosSeguimientoRetroalimentacion?: PRDocentes[];
  retroalimentacionDinamica?: RetroalimentacionDinamica[];
  avancesRetroalimentacion?: string;
  dificultadesRetroalimentacion?: string;
  compromisosRetroalimentacion?: string;
  observacionesMonitoreo?: ObservacionMonitoreoDocente;
  nivelAlcanzado?: string;
  colorNivel?: string;
  fechaCreacion?: any;
}

export interface EvaluacionConSesiones {
  id: string; // idEvaluacion
  name?: string;
  descripcion?: string;
  faseNombre?: string;
  faseActualID?: string;
  escala?: AlternativasDocente[];
  niveles?: NivelYPuntaje[];
  sesiones: EvaluadoSesion[];
  ultimaSesion?: EvaluadoSesion;
  estado: 'evaluado' | 'pendiente';
}

export interface DominioGroup {
  id: string;
  nombre: string;
  criterios: PRDocentes[];
}

export interface UseMiDesempenoOptions {
  collectionName: 'evaluaciones-especialista' | 'evaluaciones-docentes';
  userDni?: string;
  autoFetch?: boolean;
}

/**
 * Determina el nivel de logro y color basado en la calificación y los niveles configurados.
 */
export function resolverNivelLogro(
  calificacion: number = 0,
  niveles?: NivelYPuntaje[],
  totalCriterios: number = 0
): { nivel: string; color: string } {
  // 1. Si la evaluación tiene niveles explícitos configurados con min/max
  if (niveles && niveles.length > 0) {
    const match = niveles.find(
      (n) => calificacion >= (n.min ?? 0) && calificacion <= (n.max ?? Infinity)
    );
    if (match) {
      return {
        nivel: match.nivel || 'Sin Nivel',
        color: match.color || '#3b82f6',
      };
    }
  }

  // 2. Si no hay niveles explícitos, usar cálculo estándar de 4 niveles por criterio
  if (totalCriterios > 0) {
    const umbralDestacado = totalCriterios * 3.5;
    const umbralSatisfactorio = totalCriterios * 2.5;
    const umbralProceso = totalCriterios * 1.5;

    if (calificacion >= umbralDestacado) {
      return { nivel: 'Destacado', color: '#10b981' };
    } else if (calificacion >= umbralSatisfactorio) {
      return { nivel: 'Satisfactorio', color: '#3b82f6' };
    } else if (calificacion >= umbralProceso) {
      return { nivel: 'En Proceso', color: '#f59e0b' };
    } else {
      return { nivel: 'Inicio', color: '#ef4444' };
    }
  }

  // 3. Fallback genérico por puntaje absoluto
  if (calificacion >= 18) return { nivel: 'Destacado', color: '#10b981' };
  if (calificacion >= 14) return { nivel: 'Satisfactorio', color: '#3b82f6' };
  if (calificacion >= 11) return { nivel: 'En Proceso', color: '#f59e0b' };
  return { nivel: 'Inicio', color: '#ef4444' };
}

export function useMiDesempeno({
  collectionName,
  userDni,
  autoFetch = true,
}: UseMiDesempenoOptions) {
  const [loading, setLoading] = useState<boolean>(false);
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionConSesiones[]>([]);
  const [error, setError] = useState<string | null>(null);

  const db = getFirestore();

  /**
   * Carga todas las evaluaciones disponibles y las sesiones registradas del usuario.
   */
  const fetchMisEvaluaciones = useCallback(async () => {
    if (!userDni) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Obtener todas las evaluaciones del proceso
      const mainColRef = collection(db, collectionName);
      const mainSnapshot = await getDocs(mainColRef);

      const items: EvaluacionConSesiones[] = [];

      for (const evDoc of mainSnapshot.docs) {
        const evData = evDoc.data();
        const idEvaluacion = evDoc.id;

        // 2. Buscar sesiones del usuario en la subcolección evaluados
        const evaluadosRef = collection(db, collectionName, idEvaluacion, 'evaluados');

        // Probar por los distintos identificadores posibles según contexto
        const fieldToQuery = collectionName === 'evaluaciones-docentes' ? 'docenteDni' : 'especialistaDni';

        let q = query(evaluadosRef, where(fieldToQuery, '==', userDni));
        let sesSnapshot = await getDocs(q);

        // Si no arrojó resultados, probar por 'dni'
        if (sesSnapshot.empty) {
          q = query(evaluadosRef, where('dni', '==', userDni));
          sesSnapshot = await getDocs(q);
        }

        const sesiones: EvaluadoSesion[] = [];

        sesSnapshot.forEach((sDoc) => {
          const sData = sDoc.data();
          const calif = Number(sData.calificacion) || 0;
          const criterios = (sData.resultadosSeguimientoRetroalimentacion || sData.resultados || []) as PRDocentes[];
          const { nivel, color } = resolverNivelLogro(calif, evData.niveles, criterios.length);

          sesiones.push({
            id: sDoc.id,
            idEvaluacion,
            faseNombre: sData.faseNombre || evData.faseNombre || 'Fase Única',
            idFase: sData.idFase || evData.faseActualID || '',
            numeroEvaluacion: sData.numeroEvaluacion || 1,
            calificacion: calif,
            fechaMonitoreo: sData.fechaMonitoreo || '',
            horaInicio: sData.horaInicio || '',
            horaFinal: sData.horaFinal || '',
            datosMonitor: sData.datosMonitor || (sData.dniDirector ? { dni: sData.dniDirector, cargo: 'DIRECTOR' } : {}),
            tituloReporte: sData.tituloReporte || evData.name || '',
            resultadosSeguimientoRetroalimentacion: criterios,
            retroalimentacionDinamica: sData.retroalimentacionDinamica || [],
            avancesRetroalimentacion: sData.avancesRetroalimentacion || '',
            dificultadesRetroalimentacion: sData.dificultadesRetroalimentacion || '',
            compromisosRetroalimentacion: sData.compromisosRetroalimentacion || '',
            observacionesMonitoreo: sData.observacionesMonitoreo,
            nivelAlcanzado: nivel,
            colorNivel: color,
            fechaCreacion: sData.fechaCreacion,
          });
        });

        // Ordenar sesiones por número de evaluación o fecha
        sesiones.sort((a, b) => (b.numeroEvaluacion || 0) - (a.numeroEvaluacion || 0));

        items.push({
          id: idEvaluacion,
          name: evData.name || 'Evaluación de Desempeño',
          descripcion: evData.descripcion || '',
          faseNombre: evData.faseNombre || '',
          faseActualID: evData.faseActualID || '',
          escala: evData.escala || [],
          niveles: evData.niveles || [],
          sesiones,
          ultimaSesion: sesiones[0] || undefined,
          estado: sesiones.length > 0 ? 'evaluado' : 'pendiente',
        });
      }

      setEvaluaciones(items);
    } catch (err: any) {
      console.error('Error al cargar mis evaluaciones de desempeño:', err);
      setError(err?.message || 'Error al obtener evaluaciones');
    } finally {
      setLoading(false);
    }
  }, [db, collectionName, userDni]);

  /**
   * Obtiene la sesión detallada para visualizar rúbricas, criterios, evidencias y compromisos.
   */
  const getDetalleEvaluacion = useCallback(
    async (idEvaluacion: string, sessionId?: string) => {
      setLoading(true);
      setError(null);

      try {
        // 1. Obtener metadata de la evaluación
        const evDocRef = doc(db, collectionName, idEvaluacion);
        const evSnap = await getDoc(evDocRef);
        const evData = evSnap.exists() ? evSnap.data() : {};

        // 2. Obtener dimensiones/dominios si existen
        const dominiosRef = collection(db, collectionName, idEvaluacion, 'dominios');
        const domSnap = await getDocs(dominiosRef);
        const dominios: Array<{ id: string; nombre: string; orden?: number }> = [];
        domSnap.forEach((dDoc) => {
          dominios.push({ id: dDoc.id, ...(dDoc.data() as any) });
        });
        dominios.sort((a, b) => (a.orden || 0) - (b.orden || 0));

        // 3. Obtener la sesión específica o la última del usuario
        let sesionData: EvaluadoSesion | null = null;

        if (sessionId) {
          const sRef = doc(db, collectionName, idEvaluacion, 'evaluados', sessionId);
          const sSnap = await getDoc(sRef);
          if (sSnap.exists()) {
            const raw = sSnap.data();
            const calif = Number(raw.calificacion) || 0;
            const criterios = (raw.resultadosSeguimientoRetroalimentacion || raw.resultados || []) as PRDocentes[];
            const { nivel, color } = resolverNivelLogro(calif, evData.niveles, criterios.length);

            sesionData = {
              id: sSnap.id,
              idEvaluacion,
              faseNombre: raw.faseNombre || evData.faseNombre || '',
              idFase: raw.idFase || '',
              numeroEvaluacion: raw.numeroEvaluacion || 1,
              calificacion: calif,
              fechaMonitoreo: raw.fechaMonitoreo || '',
              horaInicio: raw.horaInicio || '',
              horaFinal: raw.horaFinal || '',
              datosMonitor: raw.datosMonitor || {},
              tituloReporte: raw.tituloReporte || evData.name || '',
              resultadosSeguimientoRetroalimentacion: criterios,
              retroalimentacionDinamica: raw.retroalimentacionDinamica || [],
              avancesRetroalimentacion: raw.avancesRetroalimentacion || '',
              dificultadesRetroalimentacion: raw.dificultadesRetroalimentacion || '',
              compromisosRetroalimentacion: raw.compromisosRetroalimentacion || '',
              observacionesMonitoreo: raw.observacionesMonitoreo,
              nivelAlcanzado: nivel,
              colorNivel: color,
              fechaCreacion: raw.fechaCreacion,
            };
          }
        } else if (userDni) {
          // Buscar por DNI
          const evaluadosRef = collection(db, collectionName, idEvaluacion, 'evaluados');
          const fieldToQuery = collectionName === 'evaluaciones-docentes' ? 'docenteDni' : 'especialistaDni';
          let q = query(evaluadosRef, where(fieldToQuery, '==', userDni));
          let sSnap = await getDocs(q);

          if (sSnap.empty) {
            q = query(evaluadosRef, where('dni', '==', userDni));
            sSnap = await getDocs(q);
          }

          if (!sSnap.empty) {
            const sDoc = sSnap.docs[0];
            const raw = sDoc.data();
            const calif = Number(raw.calificacion) || 0;
            const criterios = (raw.resultadosSeguimientoRetroalimentacion || raw.resultados || []) as PRDocentes[];
            const { nivel, color } = resolverNivelLogro(calif, evData.niveles, criterios.length);

            sesionData = {
              id: sDoc.id,
              idEvaluacion,
              faseNombre: raw.faseNombre || evData.faseNombre || '',
              idFase: raw.idFase || '',
              numeroEvaluacion: raw.numeroEvaluacion || 1,
              calificacion: calif,
              fechaMonitoreo: raw.fechaMonitoreo || '',
              horaInicio: raw.horaInicio || '',
              horaFinal: raw.horaFinal || '',
              datosMonitor: raw.datosMonitor || {},
              tituloReporte: raw.tituloReporte || evData.name || '',
              resultadosSeguimientoRetroalimentacion: criterios,
              retroalimentacionDinamica: raw.retroalimentacionDinamica || [],
              avancesRetroalimentacion: raw.avancesRetroalimentacion || '',
              dificultadesRetroalimentacion: raw.dificultadesRetroalimentacion || '',
              compromisosRetroalimentacion: raw.compromisosRetroalimentacion || '',
              observacionesMonitoreo: raw.observacionesMonitoreo,
              nivelAlcanzado: nivel,
              colorNivel: color,
              fechaCreacion: raw.fechaCreacion,
            };
          }
        }

        // 4. Agrupar criterios por dimensión
        const criterios = sesionData?.resultadosSeguimientoRetroalimentacion || [];
        const grupos: DominioGroup[] = [];

        if (dominios.length > 0) {
          dominios.forEach((dim) => {
            const criteriosDeDim = criterios.filter((c) => c.dimensionId === dim.id);
            grupos.push({
              id: dim.id,
              nombre: dim.nombre,
              criterios: criteriosDeDim,
            });
          });

          // Criterios sin dimensión asignada
          const sinDim = criterios.filter(
            (c) => !c.dimensionId || !dominios.some((d) => d.id === c.dimensionId)
          );
          if (sinDim.length > 0) {
            grupos.push({
              id: 'general',
              nombre: 'Criterios Generales',
              criterios: sinDim,
            });
          }
        } else {
          grupos.push({
            id: 'general',
            nombre: 'Criterios Evaluados',
            criterios,
          });
        }

        return {
          evaluacion: evData,
          sesion: sesionData,
          grupos,
          dominios,
        };
      } catch (err: any) {
        console.error('Error al obtener detalle de la sesión:', err);
        setError(err?.message || 'Error al cargar la evaluación');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [db, collectionName, userDni]
  );

  useEffect(() => {
    if (autoFetch && userDni) {
      fetchMisEvaluaciones();
    }
  }, [autoFetch, userDni, fetchMisEvaluaciones]);

  return {
    loading,
    error,
    evaluaciones,
    fetchMisEvaluaciones,
    getDetalleEvaluacion,
  };
}
