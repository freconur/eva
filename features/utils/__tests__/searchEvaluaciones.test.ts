import {
  normalizeSearchText,
  levenshteinDistance,
  matchesEvaluationSearch,
  calculateEvaluationRelevance,
} from '../searchEvaluaciones'

describe('searchEvaluaciones - normalización y distancia', () => {
  test('normalizeSearchText elimina mayúsculas, tildes y espacios extras', () => {
    expect(normalizeSearchText('  MATEMÁTICA  ')).toBe('matematica')
    expect(normalizeSearchText('Comunicación y Lenguaje')).toBe('comunicacion y lenguaje')
    expect(normalizeSearchText('ÁÉÍÓÚüñ')).toBe('aeiouun')
  })

  test('levenshteinDistance calcula correctamente la distancia de edición', () => {
    expect(levenshteinDistance('mate', 'mate')).toBe(0)
    expect(levenshteinDistance('matematica', 'matematicas')).toBe(1)
    expect(levenshteinDistance('amteamtica', 'matematica')).toBe(2)
  })
})

describe('searchEvaluaciones - matchesEvaluationSearch', () => {
  const eva = {
    id: 'eva-abc-123',
    nombre: '1ERO MATEMÁTICA OCTUBRE 01.10.2026',
  }

  test('retorna true si la búsqueda está vacía o solo contiene espacios', () => {
    expect(matchesEvaluationSearch(eva, '')).toBe(true)
    expect(matchesEvaluationSearch(eva, '   ')).toBe(true)
  })

  test('coincide ignorando mayúsculas y minúsculas', () => {
    expect(matchesEvaluationSearch(eva, 'matemática')).toBe(true)
    expect(matchesEvaluationSearch(eva, 'MATEMATICA')).toBe(true)
  })

  test('coincide ignorando tildes y acentos', () => {
    expect(matchesEvaluationSearch(eva, 'matematica')).toBe(true)
  })

  test('coincide con múltiples tokens en cualquier orden (AND logic)', () => {
    expect(matchesEvaluationSearch(eva, '1ero octubre mate')).toBe(true)
    expect(matchesEvaluationSearch(eva, 'octubre 1ero')).toBe(true)
    expect(matchesEvaluationSearch(eva, '01.10 mate')).toBe(true)
  })

  test('retorna false si alguno de los tokens no coincide', () => {
    expect(matchesEvaluationSearch(eva, '1ero comunicacion')).toBe(false)
    expect(matchesEvaluationSearch(eva, 'matematica inexistente')).toBe(false)
  })

  test('permite buscar por el ID de la evaluación', () => {
    expect(matchesEvaluationSearch(eva, 'abc-123')).toBe(true)
    expect(matchesEvaluationSearch(eva, 'eva-abc')).toBe(true)
  })

  test('tolera erratas leves en palabras largas (fuzzy typo tolerance)', () => {
    // "amteamtica" es un error tipográfico común de "matematica"
    expect(matchesEvaluationSearch(eva, 'amteamtica')).toBe(true)
    // "octubr" falta la 'e'
    expect(matchesEvaluationSearch(eva, 'octubr')).toBe(true)
  })
})

describe('searchEvaluaciones - calculateEvaluationRelevance', () => {
  test('da mayor puntaje a coincidencia exacta de nombre', () => {
    const evaExact = { id: '1', nombre: 'Matemática' }
    const evaContains = { id: '2', nombre: 'Evaluación de Matemática 1ero' }

    const scoreExact = calculateEvaluationRelevance(evaExact, 'matematica')
    const scoreContains = calculateEvaluationRelevance(evaContains, 'matematica')

    expect(scoreExact).toBeGreaterThan(scoreContains)
  })

  test('da mayor puntaje cuando el nombre empieza con la búsqueda que cuando solo la contiene en medio', () => {
    const evaStarts = { id: '1', nombre: 'Matemática 1er Grado' }
    const evaContains = { id: '2', nombre: 'Diagnóstica de Matemática' }

    const scoreStarts = calculateEvaluationRelevance(evaStarts, 'matematica')
    const scoreContains = calculateEvaluationRelevance(evaContains, 'matematica')

    expect(scoreStarts).toBeGreaterThan(scoreContains)
  })
})
