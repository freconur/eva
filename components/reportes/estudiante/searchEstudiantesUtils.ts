/**
 * Utilidades para búsqueda inteligente, multi-criterio y difusa de estudiantes.
 * Permite buscar combinando indistintamente nombres, apellidos, DNI y sección en cualquier orden
 * (ejemplo: "franco condori 47163626", "47163626 franco", "condori seccion c").
 */

import { converSeccion } from '@/fuctions/regiones';

/**
 * Normaliza texto eliminando acentos/diacríticos, convirtiendo a minúsculas,
 * equiparando 'ñ' con 'n' y limpiando signos de puntuación extra.
 */
export const normalizeSearchText = (text: string = ''): string => {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita tildes/acentos
    .replace(/ñ/g, 'n') // Equipara n y ñ para máxima tolerancia en teclados
    .replace(/[^a-z0-9\s]/g, ' ') // Signos y símbolos convertidos a espacios
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Distancia Damerau-Levenshtein para tolerancia a erratas tipográficas leves
 * (inserciones, eliminaciones, sustituciones y transposiciones de letras contiguas).
 */
export const damerauLevenshtein = (a: string, b: string): number => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const al = a.length;
  const bl = b.length;
  const d: number[][] = [];

  for (let i = 0; i <= al; i++) d[i] = [i];
  for (let j = 0; j <= bl; j++) d[0][j] = j;

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // eliminación
        d[i][j - 1] + 1, // inserción
        d[i - 1][j - 1] + cost // sustitución
      );

      // Transposición contigua
      if (
        i > 1 &&
        j > 1 &&
        a.charAt(i - 1) === b.charAt(j - 2) &&
        a.charAt(i - 2) === b.charAt(j - 1)
      ) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }

  return d[al][bl];
};

export interface StudentSearchCorpus {
  corpus: string;
  words: string[];
  dniRaw: string;
  dniClean: string;
}

/**
 * Prepara el corpus de búsqueda para un estudiante concatenando todos sus campos identificadores.
 */
export const buildStudentSearchCorpus = (student: {
  nombreCompleto?: string;
  nombres?: string;
  apellidos?: string;
  nombresApellidos?: string;
  dni?: string;
  seccion?: string | number;
}): StudentSearchCorpus => {
  const nombreCompletoNorm = normalizeSearchText(student.nombreCompleto || student.nombresApellidos || '');
  const nombresNorm = normalizeSearchText(student.nombres || '');
  const apellidosNorm = normalizeSearchText(student.apellidos || '');
  const dniRaw = String(student.dni || '').trim();
  const dniClean = dniRaw.replace(/\D/g, '');

  const seccionRaw = String(student.seccion || '').trim();
  const secNum = Number(seccionRaw);
  const seccionTexto = !isNaN(secNum) && seccionRaw !== '' ? normalizeSearchText(converSeccion(secNum) || '') : '';
  const seccionNorm = normalizeSearchText(seccionRaw);

  const corpusParts = [
    nombreCompletoNorm,
    nombresNorm,
    apellidosNorm,
    dniClean,
    dniRaw.toLowerCase(),
    seccionNorm ? `seccion ${seccionNorm} sec ${seccionNorm}` : '',
    seccionTexto,
  ].filter(Boolean);

  const corpus = corpusParts.join(' ');
  const words = corpus.split(/\s+/).filter((w) => w.length > 0);

  return {
    corpus,
    words,
    dniRaw,
    dniClean,
  };
};

export interface TokenMatchResult {
  matched: boolean;
  score: number;
}

/**
 * Evalúa si un token individual coincide con el corpus de datos de un estudiante.
 */
export const matchTokenInStudent = (
  token: string,
  corpusData: StudentSearchCorpus
): TokenMatchResult => {
  if (!token) return { matched: true, score: 0 };

  const isNumericToken = /^\d+$/.test(token);

  // 1. Tratamiento para Tokens Numéricos (DNI)
  if (isNumericToken) {
    if (corpusData.dniClean) {
      if (corpusData.dniClean === token) {
        return { matched: true, score: 1000 }; // Coincidencia exacta de DNI
      }
      if (corpusData.dniClean.startsWith(token)) {
        return { matched: true, score: 600 }; // Prefijo de DNI
      }
      if (corpusData.dniClean.includes(token)) {
        return { matched: true, score: 400 }; // Subcadena de DNI
      }
    }
    // Si no coincide con el DNI pero el token numérico aparece en el corpus (ej. sección o grado)
    if (corpusData.corpus.includes(token)) {
      return { matched: true, score: 150 };
    }
    return { matched: false, score: 0 };
  }

  // 2. Coincidencia exacta con una palabra del estudiante (nombre, apellido, etc.)
  if (corpusData.words.includes(token)) {
    return { matched: true, score: 120 };
  }

  // 3. Coincidencia por prefijo en alguna palabra (ej. "fran" -> "franco")
  for (const word of corpusData.words) {
    if (word.startsWith(token)) {
      return { matched: true, score: 80 };
    }
  }

  // 4. Coincidencia como subcadena en alguna palabra (ej. "dori" -> "condori")
  for (const word of corpusData.words) {
    if (word.includes(token)) {
      return { matched: true, score: 50 };
    }
  }

  // 5. Coincidencia general de subcadena en todo el corpus
  if (corpusData.corpus.includes(token)) {
    return { matched: true, score: 30 };
  }

  // 6. Búsqueda difusa para tolerar erratas (solo palabras de longitud >= 4)
  if (token.length >= 4) {
    const maxAllowedDist = token.length >= 7 ? 2 : 1;
    for (const word of corpusData.words) {
      if (word.length >= 4 && Math.abs(word.length - token.length) <= maxAllowedDist) {
        const dist = damerauLevenshtein(token, word);
        if (dist <= maxAllowedDist) {
          return { matched: true, score: 20 - dist * 5 };
        }
      }
    }
  }

  return { matched: false, score: 0 };
};

export interface StudentSearchResult<T> {
  student: T;
  score: number;
}

/**
 * Filtra y califica una lista de estudiantes según una búsqueda inteligente multi-término.
 * Permite buscar combinaciones como "franco condori 47163626".
 * Todos los términos especificados deben coincidir (lógica AND inteligente).
 * Los resultados se devuelven ordenados por relevancia (mayor coincidencia primero).
 */
export const searchAndRankStudents = <
  T extends {
    nombreCompleto?: string;
    nombres?: string;
    apellidos?: string;
    nombresApellidos?: string;
    dni?: string;
    seccion?: string | number;
  }
>(
  students: T[],
  query: string
): T[] => {
  if (!query || !query.trim()) {
    return students;
  }

  const normalizedQuery = normalizeSearchText(query);
  const tokens = normalizedQuery.split(/\s+/).filter((t) => t.length > 0);

  if (tokens.length === 0) {
    return students;
  }

  const results: StudentSearchResult<T>[] = [];

  for (const student of students) {
    const corpusData = buildStudentSearchCorpus(student);

    let allMatched = true;
    let totalScore = 0;

    for (const token of tokens) {
      const match = matchTokenInStudent(token, corpusData);
      if (!match.matched) {
        allMatched = false;
        break;
      }
      totalScore += match.score;
    }

    if (allMatched) {
      // Bonificación si la frase completa sin dividir está contenida literalmente
      if (corpusData.corpus.includes(normalizedQuery)) {
        totalScore += 250;
      }

      // Bonificación si el nombre completo empieza exactamente con el primer token
      if (corpusData.words.length > 0 && corpusData.words[0].startsWith(tokens[0])) {
        totalScore += 50;
      }

      results.push({
        student,
        score: totalScore,
      });
    }
  }

  // Ordenar de mayor a menor relevancia
  results.sort((a, b) => b.score - a.score);

  return results.map((r) => r.student);
};
