import React, { memo } from 'react'
import { normalizeSearchText } from '@/features/utils/searchEvaluaciones'

interface HighlightMatchProps {
  text: string
  query?: string
}

/**
 * Componente que resalta inteligentemente los términos coincidentes dentro del nombre de la evaluación.
 * Soporta insensibilidad a tildes (ej. busca "mate" y resalta "MATÉMATICA").
 */
export const HighlightMatch: React.FC<HighlightMatchProps> = memo(({ text, query }) => {
  if (!text) return null
  if (!query || !query.trim()) {
    return <>{text.toUpperCase()}</>
  }

  const normalizedQuery = normalizeSearchText(query)
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean)

  if (tokens.length === 0) {
    return <>{text.toUpperCase()}</>
  }

  try {
    // Generar patrones de expresión regular tolerantes a tildes/acentos
    const regexPatterns = tokens.map(token => {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return escaped
        .split('')
        .map(char => {
          switch (char) {
            case 'a':
              return '[aáAÁàÀäÄ]'
            case 'e':
              return '[eéEÉèÈëË]'
            case 'i':
              return '[iíIÍìÌïÏ]'
            case 'o':
              return '[oóOÓòÒöÖ]'
            case 'u':
              return '[uúüUÚÜùÙ]'
            case 'n':
              return '[nñNÑ]'
            default:
              return char
          }
        })
        .join('')
    })

    const regex = new RegExp(`(${regexPatterns.join('|')})`, 'gi')
    const parts = text.split(regex)

    return (
      <>
        {parts.map((part, index) => {
          if (regex.test(part)) {
            return (
              <mark
                key={index}
                style={{
                  backgroundColor: '#fef08a', // Tailwind yellow-200
                  color: '#854d0e',          // Tailwind yellow-800
                  borderRadius: '3px',
                  padding: '0 2px',
                  fontWeight: 700,
                }}
              >
                {part.toUpperCase()}
              </mark>
            )
          }
          return <span key={index}>{part.toUpperCase()}</span>
        })}
      </>
    )
  } catch (e) {
    // Fallback seguro en caso de error de expresión regular
    return <>{text.toUpperCase()}</>
  }
})

HighlightMatch.displayName = 'HighlightMatch'
