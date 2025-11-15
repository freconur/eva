import { useMemo } from 'react'

// ========== ALGORITMO DE BÚSQUEDA DIFUSA (FUZZY SEARCH) ==========

// Función para normalizar texto (quitar acentos, convertir a minúsculas)
const normalizarTexto = (texto: string): string => {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .trim()
}

// Algoritmo de Levenshtein Distance (distancia de edición)
const levenshteinDistance = (str1: string, str2: string): number => {
  const m = str1.length
  const n = str2.length
  
  // Optimización: si la diferencia de longitud es muy grande, retornar distancia máxima
  if (Math.abs(m - n) > Math.max(m, n) * 0.5) {
    return Math.max(m, n)
  }

  const dp: number[][] = []

  for (let i = 0; i <= m; i++) {
    dp[i] = [i]
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // Eliminación
          dp[i][j - 1] + 1,     // Inserción
          dp[i - 1][j - 1] + 1  // Sustitución
        )
      }
    }
  }

  return dp[m][n]
}

// Calcular similitud entre dos strings (0-1, donde 1 es idéntico)
const calcularSimilitud = (str1: string, str2: string): number => {
  if (str1 === str2) return 1
  if (str1.length === 0 || str2.length === 0) return 0
  
  const distancia = levenshteinDistance(str1, str2)
  const maxLength = Math.max(str1.length, str2.length)
  return 1 - (distancia / maxLength)
}

// Calcular score de relevancia para un item
const calcularScoreRelevancia = <T>(
  item: T,
  busqueda: string,
  getTexto: (item: T) => string
): number => {
  const texto = getTexto(item)
  const textoNormalizado = normalizarTexto(texto)
  const busquedaNormalizada = normalizarTexto(busqueda)

  let score = 0

  // 1. Coincidencia exacta (peso: 100)
  if (textoNormalizado === busquedaNormalizada) {
    score += 100
    return score // Retornar inmediatamente si es exacto
  }

  // 2. Empieza con la búsqueda (peso: 80)
  if (textoNormalizado.startsWith(busquedaNormalizada)) {
    score += 80
  }

  // 3. Contiene la búsqueda completa (peso: 60)
  if (textoNormalizado.includes(busquedaNormalizada)) {
    score += 60
  }

  // 4. Similitud por Levenshtein (peso: 40)
  const similitud = calcularSimilitud(textoNormalizado, busquedaNormalizada)
  score += similitud * 40

  // 5. Búsqueda por palabras individuales (peso: 30)
  const palabrasBusqueda = busquedaNormalizada.split(/\s+/).filter(p => p.length > 0)
  const palabrasTexto = textoNormalizado.split(/\s+/).filter(p => p.length > 0)
  
  if (palabrasBusqueda.length > 0 && palabrasTexto.length > 0) {
    let palabrasEncontradas = 0
    palabrasBusqueda.forEach(palabraBusqueda => {
      palabrasTexto.forEach(palabraTexto => {
        if (palabraTexto.startsWith(palabraBusqueda)) {
          palabrasEncontradas++
        } else if (palabraTexto.includes(palabraBusqueda)) {
          palabrasEncontradas += 0.7
        } else {
          const sim = calcularSimilitud(palabraTexto, palabraBusqueda)
          if (sim > 0.6) {
            palabrasEncontradas += sim * 0.5
          }
        }
      })
    })
    
    if (palabrasEncontradas > 0) {
      score += (palabrasEncontradas / palabrasBusqueda.length) * 30
    }
  }

  // 6. Búsqueda por iniciales (peso: 20)
  if (palabrasBusqueda.length > 0 && palabrasTexto.length > 0) {
    const inicialesTexto = palabrasTexto.map(p => p[0]).join('')
    const inicialesBusqueda = palabrasBusqueda.map(p => p[0]).join('')
    if (inicialesTexto.includes(inicialesBusqueda)) {
      score += 20
    }
  }

  // 7. Búsqueda por caracteres consecutivos (peso: 15)
  let caracteresConsecutivos = 0
  let indiceTexto = 0
  for (let i = 0; i < busquedaNormalizada.length; i++) {
    const char = busquedaNormalizada[i]
    const indice = textoNormalizado.indexOf(char, indiceTexto)
    if (indice !== -1) {
      caracteresConsecutivos++
      indiceTexto = indice + 1
    }
  }
  if (caracteresConsecutivos > 0) {
    score += (caracteresConsecutivos / busquedaNormalizada.length) * 15
  }

  return score
}

interface UseBusquedaDifusaOptions<T> {
  items: T[]
  textoBusqueda: string
  getTexto: (item: T) => string // Función para obtener el texto a buscar de cada item
  umbralMinimo?: number // Score mínimo para incluir un resultado (default: 10)
}

/**
 * Hook personalizado para búsqueda difusa (fuzzy search)
 * Similar a Algolia, permite encontrar resultados incluso con errores de escritura
 * 
 * @param items - Array de items a buscar
 * @param textoBusqueda - Texto de búsqueda
 * @param getTexto - Función que retorna el texto a buscar de cada item
 * @param umbralMinimo - Score mínimo para incluir un resultado (default: 10)
 * @returns Array de items filtrados y ordenados por relevancia
 * 
 * @example
 * const resultados = useBusquedaDifusa({
 *   items: evaluaciones,
 *   textoBusqueda: 'eval mat',
 *   getTexto: (evaluacion) => evaluacion.nombre || ''
 * })
 */
export const useBusquedaDifusa = <T>({
  items,
  textoBusqueda,
  getTexto,
  umbralMinimo = 10
}: UseBusquedaDifusaOptions<T>): T[] => {
  return useMemo(() => {
    // Si no hay texto de búsqueda, retornar todos los items
    if (!textoBusqueda.trim()) {
      return items
    }

    // Calcular score para cada item
    const itemsConScore = items.map(item => ({
      item,
      score: calcularScoreRelevancia(item, textoBusqueda, getTexto)
    }))

    // Filtrar solo los que tienen un score mínimo y ordenar por score descendente
    return itemsConScore
      .filter(item => item.score >= umbralMinimo)
      .sort((a, b) => b.score - a.score)
      .map(item => item.item)
  }, [items, textoBusqueda, getTexto, umbralMinimo])
}

