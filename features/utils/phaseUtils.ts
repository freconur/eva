export interface FaseItem {
  id: string;
  nombre: string;
}

/**
 * Normaliza y limpia el nombre de una fase.
 */
export const getCleanPhaseName = (faseNombre?: string, idFase?: string): string => {
  if (faseNombre && faseNombre.trim().length > 0) {
    return faseNombre.trim();
  }
  if (!idFase) return '—';
  const parts = idFase.split('_');
  if (parts.length > 1 && !isNaN(Number(parts[parts.length - 1]))) {
    return parts.slice(0, -1).join(' ').replace(/_/g, ' ').trim();
  }
  return idFase.replace(/_/g, ' ').trim();
};

/**
 * Obtiene la lista unificada y desduplicada por nombre de fases disponibles.
 */
export const getUniquePhases = (
  dataEvaluacionDocente?: any,
  evaluadosEspecialista?: any[]
): FaseItem[] => {
  const fases: FaseItem[] = [];

  const addFaseIfUnique = (id: string, nombreRaw?: string) => {
    if (!id) return;
    const nombre = getCleanPhaseName(nombreRaw, id);
    if (!nombre || nombre === '—') return;

    const existingIndex = fases.findIndex(
      f => f.nombre.toLowerCase() === nombre.toLowerCase()
    );

    if (existingIndex === -1) {
      fases.push({ id, nombre });
    } else {
      // Si la fase coincide con la faseActualID activa, se actualiza el ID al de la fase actual
      if (dataEvaluacionDocente?.faseActualID === id) {
        fases[existingIndex] = { id, nombre };
      }
    }
  };

  // 1. Fases guardadas en el documento principal (arreglo fases)
  if (dataEvaluacionDocente?.fases && Array.isArray(dataEvaluacionDocente.fases)) {
    dataEvaluacionDocente.fases.forEach((f: any) => {
      if (f.id) {
        addFaseIfUnique(f.id, f.nombre);
      }
    });
  }

  // 2. Fase actual del documento principal (faseActualID)
  if (dataEvaluacionDocente?.faseActualID) {
    addFaseIfUnique(
      dataEvaluacionDocente.faseActualID,
      dataEvaluacionDocente.faseNombre
    );
  }

  // 3. Fases presentes en la lista de evaluados
  if (evaluadosEspecialista && Array.isArray(evaluadosEspecialista)) {
    evaluadosEspecialista.forEach((esp: any) => {
      const rawId = esp.idFase || esp.faseActualID;
      if (rawId) {
        addFaseIfUnique(rawId, esp.faseNombre);
      }
    });
  }

  return fases;
};
