import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase/firebase.config';

interface ProgresoPuntajeProgresiva {
  porcentaje: number;
  estudiantesProcesados: number;
  totalEstudiantes: number;
  lotesCompletados: number;
  erroresEncontrados: number;
}

interface ResultadoPuntajeProgresiva {
  success: boolean;
  message: string;
  estadisticas?: {
    estudiantesProcesados: number;
    totalEstudiantes: number;
    lotesCompletados: number;
    erroresEncontrados: number;
  };
}

export const useCrearPuntajeProgresiva = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoPuntajeProgresiva | null>(null);
  const [progreso, setProgreso] = useState<ProgresoPuntajeProgresiva | null>(null);

  const ejecutarCrearPuntajeProgresiva = async (monthSelected: string, idEvaluacion: string, evaluacion: any, preguntasRespuestas: any) => {
    setLoading(true);
    setError(null);
    setResultado(null);
    setProgreso(null);

    try {
      // Crear la función callable
      const crearPuntajeProgresiva = httpsCallable(functions, 'crearPuntajeEestudiantesProgresiva');
      
      // Llamar a la función
      const response = await crearPuntajeProgresiva({
        monthSelected,
        idEvaluacion,
        evaluacion,
        preguntasRespuestas
      });

      const data = response.data as ResultadoPuntajeProgresiva;
      setResultado(data);
      
      return data;
    } catch (error: any) {
      const errorMessage = error.message || 'Error desconocido al crear puntaje progresiva';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const limpiarEstado = () => {
    setError(null);
    setResultado(null);
    setProgreso(null);
  };

  const obtenerMensajeResumen = (): string => {
    if (!resultado) return '';
    
    const { estadisticas } = resultado;
    if (!estadisticas) return resultado.message;
    
    return `Puntaje progresiva generado exitosamente!\n\n` +
           `📊 Estadísticas:\n` +
           `• Estudiantes procesados: ${estadisticas.estudiantesProcesados}\n` +
           `• Total de estudiantes: ${estadisticas.totalEstudiantes}\n` +
           `• Lotes completados: ${estadisticas.lotesCompletados}\n` +
           `• Errores encontrados: ${estadisticas.erroresEncontrados}`;
  };

  const obtenerEstadisticas = () => {
    return resultado?.estadisticas || null;
  };

  return {
    loading,
    error,
    resultado,
    progreso,
    ejecutarCrearPuntajeProgresiva,
    limpiarEstado,
    obtenerMensajeResumen,
    obtenerEstadisticas
  };
};
