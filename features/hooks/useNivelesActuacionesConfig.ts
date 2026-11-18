import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';
import { toast } from 'react-toastify';

export interface NivelActuacionItem {
  id: number;
  key: string;
  nombre: string;
  min: number; // Mínimo de aciertos / evaluaciones superadas
  max: number; // Máximo de aciertos / evaluaciones superadas
  color: string; // Código hexadecimal (ej. #ef4444)
  descripcion?: string; // Descripción pedagógica formativa
  badgeBg?: string; // Clase Tailwind para badge
  badgeText?: string;
  badgeBorder?: string;
}

export interface NivelesActuacionesConfigDoc {
  niveles: NivelActuacionItem[];
  updatedAt?: string;
  updatedBy?: string;
  descripcion?: string;
}

// Configuración predeterminada e institucional con los 4 niveles solicitados
// Colores oficiales del radar: 0 = Plomo | 1 = Café | 2 = Naranja | 3 o 4 = Verde
export const DEFAULT_NIVELES_ACTUACIONES: NivelActuacionItem[] = [
  {
    id: 1,
    key: 'por_desarrollo',
    nombre: 'Por desarrollar',
    min: 0,
    max: 0,
    color: '#9ca3af', // Plomo (Gris)
    descripcion: 'Aún no logra evidenciar la actuación en las oportunidades evaluadas.',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-300',
  },
  {
    id: 2,
    key: 'iniciandose',
    nombre: 'Iniciándose',
    min: 1,
    max: 1,
    color: '#9f4242', // Café (Marrón rojizo institucional)
    descripcion: 'Muestra avances iniciales superando la actuación en al menos una oportunidad.',
    badgeBg: 'bg-rose-50/70',
    badgeText: 'text-[#9f4242]',
    badgeBorder: 'border-[#9f4242]/30',
  },
  {
    id: 3,
    key: 'consolidacion',
    nombre: 'Consolidación',
    min: 2,
    max: 2,
    color: '#f97316', // Naranja
    descripcion: 'Evidencia dominio constante de la actuación en la mayoría de evaluaciones.',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700',
    badgeBorder: 'border-orange-200',
  },
  {
    id: 4,
    key: 'autonomia',
    nombre: 'Autonomía',
    min: 3,
    max: 4,
    color: '#8cb346', // Verde oliva / pasto institucional
    descripcion: 'Alcanza solvencia plena, consistente y autónoma en todas las evaluaciones.',
    badgeBg: 'bg-lime-50',
    badgeText: 'text-lime-800',
    badgeBorder: 'border-lime-300',
  },
];

/**
 * Valida la consistencia de los niveles: nombres obligatorios,
 * min <= max y sin superposición de rangos.
 */
export function validarNivelesActuacion(niveles: NivelActuacionItem[]): {
  valido: boolean;
  error?: string;
} {
  if (!niveles || niveles.length < 2) {
    return { valido: false, error: 'Debe configurar al menos dos niveles.' };
  }

  for (let i = 0; i < niveles.length; i++) {
    const niv = niveles[i];
    if (!niv.nombre || !niv.nombre.trim()) {
      return { valido: false, error: `El nivel #${i + 1} debe tener un nombre válido.` };
    }
    if (typeof niv.min !== 'number' || typeof niv.max !== 'number' || isNaN(niv.min) || isNaN(niv.max)) {
      return { valido: false, error: `El nivel "${niv.nombre}" debe tener valores numéricos para mínimo y máximo.` };
    }
    if (niv.min < 0 || niv.max < 0) {
      return { valido: false, error: `Los valores de aciertos en "${niv.nombre}" no pueden ser negativos.` };
    }
    if (niv.min > niv.max) {
      return {
        valido: false,
        error: `En "${niv.nombre}", el mínimo (${niv.min}) no puede ser mayor que el máximo (${niv.max}).`,
      };
    }
  }

  // Verificar superposiciones ordenando por 'min'
  const sorted = [...niveles].sort((a, b) => a.min - b.min);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].max >= sorted[i + 1].min) {
      return {
        valido: false,
        error: `Los rangos se superponen entre "${sorted[i].nombre}" (máx ${sorted[i].max}) y "${sorted[i + 1].nombre}" (mín ${sorted[i + 1].min}).`,
      };
    }
  }

  return { valido: true };
}

/**
 * Función pura que calcula el nivel correspondiente según el número de aciertos
 * y la lista de niveles configurada globalmente.
 */
export function determinarNivelActuacion(
  aciertos: number,
  _totalOportunidades: number = 4,
  configNiveles: NivelActuacionItem[] = DEFAULT_NIVELES_ACTUACIONES
): NivelActuacionItem {
  const lista = configNiveles && configNiveles.length > 0 ? configNiveles : DEFAULT_NIVELES_ACTUACIONES;
  const sorted = [...lista].sort((a, b) => a.min - b.min);

  // 1. Buscar coincidencia exacta dentro del rango [min, max]
  const match = sorted.find((n) => aciertos >= n.min && aciertos <= n.max);
  if (match) return match;

  // 2. Si supera el máximo configurado, asignar el nivel superior
  if (aciertos > sorted[sorted.length - 1].max) {
    return sorted[sorted.length - 1];
  }

  // 3. Fallback: primer nivel
  return sorted[0];
}

/**
 * Hook para gestionar la configuración global de niveles de actuación en Firestore.
 * Documento: `configuraciones/niveles_actuaciones`
 */
export const useNivelesActuacionesConfig = () => {
  const [niveles, setNiveles] = useState<NivelActuacionItem[]>(DEFAULT_NIVELES_ACTUACIONES);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Escuchar en tiempo real Firestore
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      if (!db || (Object.keys(db).length === 0 && !(db as any).app)) {
        setLoading(false);
        return;
      }
      const configDocRef = doc(db, 'configuraciones', 'niveles_actuaciones');
      unsubscribe = onSnapshot(
        configDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as NivelesActuacionesConfigDoc;
            if (data && Array.isArray(data.niveles) && data.niveles.length > 0) {
              setNiveles(data.niveles);
            } else {
              setNiveles(DEFAULT_NIVELES_ACTUACIONES);
            }
          } else {
            setNiveles(DEFAULT_NIVELES_ACTUACIONES);
          }
          setLoading(false);
        },
        (err) => {
          console.warn('No se pudo sincronizar configuraciones/niveles_actuaciones en tiempo real:', err);
          setNiveles(DEFAULT_NIVELES_ACTUACIONES);
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn('Error al suscribir a configuraciones/niveles_actuaciones:', err);
      setLoading(false);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  // Guardar configuración global en Firestore
  const guardarNiveles = useCallback(
    async (
      nuevosNiveles: NivelActuacionItem[],
      usuarioEmail?: string
    ): Promise<{ ok: boolean; error?: string }> => {
      const validacion = validarNivelesActuacion(nuevosNiveles);
      if (!validacion.valido) {
        toast.error(validacion.error || 'Configuración de niveles inválida');
        return { ok: false, error: validacion.error };
      }

      setIsSaving(true);
      try {
        const configDocRef = doc(db, 'configuraciones', 'niveles_actuaciones');
        const payload: NivelesActuacionesConfigDoc = {
          niveles: nuevosNiveles,
          updatedAt: new Date().toISOString(),
          updatedBy: usuarioEmail || 'admin',
          descripcion: 'Configuración global de niveles de logro por actuación para evaluaciones progresivas',
        };

        await setDoc(configDocRef, payload, { merge: true });
        setNiveles(nuevosNiveles);
        toast.success('Configuración global de niveles guardada exitosamente');
        setIsSaving(false);
        return { ok: true };
      } catch (err: any) {
        console.error('Error al guardar configuraciones/niveles_actuaciones en Firestore:', err);
        const msg = err?.message || 'Error al persistir la configuración en la base de datos';
        toast.error(msg);
        setIsSaving(false);
        return { ok: false, error: msg };
      }
    },
    []
  );

  // Restaurar valores recomendados
  const restaurarValoresSugeridos = useCallback(() => {
    return DEFAULT_NIVELES_ACTUACIONES;
  }, []);

  return {
    niveles,
    loading,
    isSaving,
    guardarNiveles,
    restaurarValoresSugeridos,
  };
};

export default useNivelesActuacionesConfig;
