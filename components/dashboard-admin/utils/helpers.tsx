import React from 'react'

/**
 * Obtiene el nombre del mes a partir de su número (1-12)
 */
export const obtenerNombreMes = (numero: number): string => {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return meses[numero - 1] || `Mes ${numero}`
}

/**
 * Normaliza nombres de niveles (case-insensitive)
 */
export const normalizarNivel = (nivel: string): string => {
  const nivelLower = nivel.toLowerCase().trim()
  const mapeo: Record<string, string> = {
    'previo al inicio': 'Previo al inicio',
    'inicio': 'En inicio',
    'en inicio': 'En inicio',
    'en proceso': 'En proceso',
    'satisfactorio': 'Satisfactorio'
  }
  return mapeo[nivelLower] || nivel
}

/**
 * Calcula un rango de escala amigable para gráficos
 */
export const calcularRangoAmigable = (valores: number[]): { min: number; max: number } => {
  const valoresValidos = valores.filter(v => v !== null && v !== undefined && !isNaN(v))
  if (valoresValidos.length === 0) {
    return { min: 0, max: 100 }
  }

  const min = Math.min(...valoresValidos)
  const max = Math.max(...valoresValidos)
  
  // Si todos los valores son iguales o muy cercanos
  if (max - min < 1) {
    return { min: Math.max(0, min - 10), max: max + 10 }
  }

  // Calcular la diferencia relativa
  const diferenciaRelativa = max > 0 ? (max - min) / max : 0
  const ratioMaxMin = max > 0 && min > 0 ? max / min : 1

  // Si hay grandes diferencias (ratio > 10 o diferencia relativa > 90%)
  if (ratioMaxMin > 10 || diferenciaRelativa > 0.9) {
    const paddingMin = min * 0.2
    const paddingMax = max * 0.1
    const nuevoMin = Math.max(0, min - paddingMin)
    
    if (nuevoMin < max * 0.1) {
      return {
        min: Math.max(0, min * 0.5),
        max: max + paddingMax
      }
    }
    
    return {
      min: nuevoMin,
      max: max + paddingMax
    }
  }

  // Para diferencias moderadas, usar padding estándar
  const rango = max - min
  const padding = rango * 0.15
  return {
    min: Math.max(0, min - padding),
    max: max + padding
  }
}

/**
 * Resalta el texto buscado en los resultados con un fondo amarillo
 */
export const resaltarTexto = (texto: string, busqueda: string): React.ReactNode => {
  if (!busqueda.trim()) {
    return texto
  }

  const textoLower = texto.toLowerCase()
  const busquedaLower = busqueda.toLowerCase()
  const indices: number[] = []
  let indice = textoLower.indexOf(busquedaLower)
  
  while (indice !== -1) {
    indices.push(indice)
    indice = textoLower.indexOf(busquedaLower, indice + 1)
  }

  if (indices.length === 0) {
    return texto
  }

  const partes: React.ReactNode[] = []
  let ultimoIndice = 0

  indices.forEach((inicio) => {
    const fin = inicio + busquedaLower.length
    
    if (inicio > ultimoIndice) {
      partes.push(texto.substring(ultimoIndice, inicio))
    }
    
    partes.push(
      <span key={inicio} className="bg-yellow-300 font-medium px-0.5 rounded">
        {texto.substring(inicio, fin)}
      </span>
    )
    
    ultimoIndice = fin
  })

  if (ultimoIndice < texto.length) {
    partes.push(texto.substring(ultimoIndice))
  }

  return <>{partes}</>
}

/**
 * Ordenamiento natural (alphanumeric) que compara números numéricamente
 */
export const ordenamientoNatural = (a: string, b: string): number => {
  const aLower = a.toLowerCase()
  const bLower = b.toLowerCase()
  
  const partesA = aLower.match(/(\d+|\D+)/g) || []
  const partesB = bLower.match(/(\d+|\D+)/g) || []
  
  const longitudMinima = Math.min(partesA.length, partesB.length)
  
  for (let i = 0; i < longitudMinima; i++) {
    const parteA = partesA[i]
    const parteB = partesB[i]
    
    const esNumeroA = /^\d+$/.test(parteA)
    const esNumeroB = /^\d+$/.test(parteB)
    
    if (esNumeroA && esNumeroB) {
      const numA = parseInt(parteA, 10)
      const numB = parseInt(parteB, 10)
      if (numA !== numB) {
        return numA - numB
      }
    } else {
      const comparacion = parteA.localeCompare(parteB, undefined, { numeric: true, sensitivity: 'base' })
      if (comparacion !== 0) {
        return comparacion
      }
    }
  }
  
  return partesA.length - partesB.length
}

