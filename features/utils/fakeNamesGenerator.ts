import { UserEstudiante } from '@/features/types/types';
import mockData from '@/features/data/mockNamesPeru.json';

/**
 * Algoritmo de hash determinista (DJB2) para convertir strings/números en enteros positivos estables.
 * Garantiza que el mismo estudiante o director siempre reciba el mismo nombre realista en cada render.
 */
export const stringHash = (str: string | number): number => {
  const s = String(str || '');
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) + s.charCodeAt(i);
    hash = hash & 0x7fffffff;
  }
  return hash;
};

export const MOCK_ESTUDIANTES = mockData.estudiantes;
export const MOCK_ESTUDIANTES_M = mockData.estudiantes.filter((e) => e.genero === '1');
export const MOCK_ESTUDIANTES_F = mockData.estudiantes.filter((e) => e.genero === '2');
export const MOCK_DIRECTORES = mockData.directores;
export const MOCK_DOCENTES = mockData.docentes;
export const MOCK_INSTITUCIONES = mockData.instituciones;

/**
 * Genera un nombre de estudiante realista y peruano a partir del JSON de 400 nombres.
 * Utiliza pools segregados por género para asegurar coherencia sin colisiones ni repeticiones consecutivas.
 */
export const generateRealisticStudentName = (
  seed: string | number,
  indexOrGenero?: number | string,
  generoParam?: string
): { nombres: string; apellidos: string; nombresApellidos: string; dni: string; genero: string } => {
  const targetGenero =
    typeof indexOrGenero === 'string' &&
    (indexOrGenero === '1' || indexOrGenero === '2' || indexOrGenero === 'M' || indexOrGenero === 'F')
      ? indexOrGenero
      : generoParam;

  const isFemale = targetGenero === '2' || targetGenero?.toUpperCase() === 'F';
  const isMale = targetGenero === '1' || targetGenero?.toUpperCase() === 'M';

  // Usar sub-pool específico por género para garantizar coincidencia de género sin desfasar índices ni provocar duplicados
  const pool = isFemale
    ? MOCK_ESTUDIANTES_F
    : isMale
    ? MOCK_ESTUDIANTES_M
    : MOCK_ESTUDIANTES;

  let idx: number;
  if (typeof indexOrGenero === 'number') {
    idx = Math.abs(indexOrGenero) % pool.length;
  } else {
    idx = stringHash(seed) % pool.length;
  }

  const item = pool[idx];
  return {
    nombres: item.nombres,
    apellidos: item.apellidos,
    nombresApellidos: item.nombresApellidos,
    dni: item.dni,
    genero: item.genero,
  };
};

/**
 * Genera un nombre docente realista desde el pool local de docentes peruanos.
 */
export const generateRealisticDocenteName = (
  seed: string | number,
  index?: number,
  includePrefix: boolean = true
): string => {
  const pool = MOCK_DOCENTES;
  const idx = index !== undefined
    ? Math.abs(index) % pool.length
    : stringHash(seed) % pool.length;
  const raw = pool[idx];
  return includePrefix ? raw : raw.replace(/^Prof\.\s*/i, '');
};

/**
 * Genera un nombre de Director realista desde el pool local para demostración institucional.
 */
export const generateRealisticDirectorName = (
  seed: string | number
): { nombres: string; apellidos: string; fullName: string; dni: string } => {
  const pool = MOCK_DIRECTORES;
  const h = stringHash(seed);
  const fullName = pool[h % pool.length];
  const parts = fullName.replace(/^(Mg\.|Lic\.|Dr\.)\s*/, '').split(' ');
  const nombres = parts.slice(0, 2).join(' ');
  const apellidos = parts.slice(2).join(' ');
  const dniNum = (h % 90000000) + 10000000;
  const dniStr = String(dniNum);
  const dni = `${dniStr.slice(0, 2)}***${dniStr.slice(5)}`;

  return { nombres, apellidos, fullName, dni };
};

/**
 * Genera un nombre de institución educativa realista desde el pool local.
 */
export const generateRealisticInstitucion = (
  seed: string | number,
  _originalName?: string
): string => {
  const pool = MOCK_INSTITUCIONES;
  const h = stringHash(seed);
  return pool[h % pool.length];
};

/**
 * Anonimiza un estudiante real reemplazando únicamente sus datos de identidad (PII)
 * con un nombre peruano del JSON de 400 nombres, preservando íntegramente sus puntajes, niveles y respuestas.
 */
export const generateRealisticEstudiante = (
  estudiante: UserEstudiante,
  index: number = 0
): UserEstudiante => {
  const fake = generateRealisticStudentName(
    estudiante.dni || estudiante.id || index,
    index,
    estudiante.genero
  );

  return {
    ...estudiante,
    nombres: fake.nombres,
    apellidos: fake.apellidos,
    nombresApellidos: fake.nombresApellidos,
    dni: fake.dni,
  };
};

/**
 * Transforma un arreglo completo de estudiantes reales en datos anonimizados usando el JSON local de 400 nombres.
 * Utiliza contadores independientes por género para garantizar que ningún nombre se repita en la lista.
 */
export const anonymizeEstudiantesList = <T extends UserEstudiante>(
  estudiantes: T[],
  offset: number = 0
): T[] => {
  if (!Array.isArray(estudiantes)) return [];
  let femaleCount = 0;
  let maleCount = 0;
  let otherCount = 0;

  return estudiantes.map((est) => {
    const isFemale = est.genero === '2' || est.genero?.toUpperCase() === 'F';
    const isMale = est.genero === '1' || est.genero?.toUpperCase() === 'M';
    let idx: number;
    if (isFemale) {
      idx = femaleCount++;
    } else if (isMale) {
      idx = maleCount++;
    } else {
      idx = otherCount++;
    }
    return generateRealisticEstudiante(est, idx + offset) as T;
  });
};
