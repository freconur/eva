/**
 * Utilidades para búsqueda inteligente y eficiente de evaluaciones.
 * Soporta:
 * - Normalización de texto (insensible a mayúsculas y acentos/tildes).
 * - Búsqueda multi-término (AND logic: todos los términos deben coincidir).
 * - Búsqueda en nombre e ID.
 * - Tolerancia a erratas leves (distancia Damerau-Levenshtein: transposición de letras, inserciones, omisiones).
 * - Cálculo de relevancia para ordenar los resultados de forma óptima.
 */

/**
 * Normaliza una cadena de texto: quita diacríticos/acentos, convierte a minúsculas y elimina espacios sobrantes.
 */
export const normalizeSearchText = (text: string): string => {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Calcula la distancia Damerau-Levenshtein entre dos cadenas para detectar erratas,
 * incluyendo transposiciones de letras contiguas (ej. "amteamtica" -> "matematica").
 */
export const levenshteinDistance = (a: string, b: string): number => {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const d: number[][] = []
  const al = a.length
  const bl = b.length

  for (let i = 0; i <= al; i++) {
    d[i] = [i]
  }
  for (let j = 0; j <= bl; j++) {
    d[0][j] = j
  }

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1
      d[i][j] = Math.min(
        d[i - 1][j] + 1,       // eliminación
        d[i][j - 1] + 1,       // inserción
        d[i - 1][j - 1] + cost // sustitución
      )

      // Transposición contigua (Damerau)
      if (
        i > 1 &&
        j > 1 &&
        a.charAt(i - 1) === b.charAt(j - 2) &&
        a.charAt(i - 2) === b.charAt(j - 1)
      ) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }

  return d[al][bl]
}

/**
 * Determina si un token de búsqueda coincide en el texto normalizado o en alguna de sus palabras.
 */
export const matchTokenInText = (
  token: string,
  textNormalized: string,
  wordsInText: string[]
): boolean => {
  if (!token) return true

  // 1. Coincidencia directa de subcadena completa
  if (textNormalized.includes(token)) return true

  // 2. Coincidencia por palabra (prefijo, subcadena o fuzzy)
  for (const word of wordsInText) {
    if (word.startsWith(token) || word.includes(token)) return true

    // 3. Tolerancia a erratas en palabras de al menos 4 caracteres
    if (token.length >= 4 && word.length >= 4) {
      const minLen = Math.min(token.length, word.length)
      const maxDistance = minLen >= 7 ? 2 : 1
      if (levenshteinDistance(token, word) <= maxDistance) {
        return true
      }
    }
  }

  return false
}

/**
 * Evalúa si una evaluación coincide con el término de búsqueda inteligente.
 */
export const matchesEvaluationSearch = (
  eva: { nombre?: string; id?: string },
  query: string
): boolean => {
  if (!query || !query.trim()) return true

  const normalizedQuery = normalizeSearchText(query)
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true

  const normalizedNombre = normalizeSearchText(eva.nombre || '')
  const normalizedId = normalizeSearchText(eva.id || '')
  const combinedText = `${normalizedNombre} ${normalizedId}`
  const words = combinedText.split(/\s+/).filter(Boolean)

  // Todos los tokens deben coincidir en el texto (lógica AND inteligente)
  return tokens.every(token => matchTokenInText(token, combinedText, words))
}

/**
 * Calcula un puntaje de relevancia (score) para ordenar resultados de búsqueda:
 * - Coincidencia exacta de nombre: 100
 * - El nombre empieza con el término de búsqueda: 80
 * - El nombre contiene el término completo de búsqueda: 60
 * - Coincidencias de tokens individuales: 40 + bonus por prefijos
 */
export const calculateEvaluationRelevance = (
  eva: { nombre?: string; id?: string },
  query: string
): number => {
  if (!query || !query.trim()) return 0

  const normalizedQuery = normalizeSearchText(query)
  const normalizedNombre = normalizeSearchText(eva.nombre || '')
  const normalizedId = normalizeSearchText(eva.id || '')

  let score = 0

  // 1. Coincidencia exacta completa
  if (normalizedNombre === normalizedQuery) {
    return 100
  }

  // 2. Empieza con la búsqueda
  if (normalizedNombre.startsWith(normalizedQuery)) {
    score += 80
  } else if (normalizedNombre.includes(normalizedQuery)) {
    // 3. Contiene la frase completa
    score += 60
  }

  // 4. Coincidencia en ID
  if (normalizedId.includes(normalizedQuery)) {
    score += 50
  }

  // 5. Tokens individuales
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean)
  const words = normalizedNombre.split(/\s+/).filter(Boolean)

  if (tokens.length > 0) {
    let tokensFound = 0
    tokens.forEach(token => {
      if (normalizedNombre.includes(token)) {
        tokensFound += 1
      } else {
        // Chequear prefijos en palabras
        for (const w of words) {
          if (w.startsWith(token)) {
            tokensFound += 0.8
            break
          }
        }
      }
    })
    score += (tokensFound / tokens.length) * 30
  }

  return score
}
