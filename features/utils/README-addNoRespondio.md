# Funcionalidad: Agregar Alternativa "No Respondió"

## Descripción

Esta funcionalidad agrega automáticamente una alternativa "no respondió" a todas las preguntas del sistema de evaluaciones. La alternativa se agrega con la siguiente letra en orden alfabético después de las alternativas existentes.

## Archivos Modificados

### 1. `addNoRespondioAlternative.ts`
Función utilitaria principal que contiene la lógica para agregar la alternativa "no respondió".

**Funciones incluidas:**
- `addNoRespondioAlternative(preguntas)`: Procesa un array de preguntas
- `addNoRespondioToSingleQuestion(pregunta)`: Procesa una sola pregunta
- `hasNoRespondioAlternative(pregunta)`: Verifica si ya tiene la alternativa

### 2. Hooks Actualizados
Se modificaron los siguientes hooks para aplicar la funcionalidad:

- `useAgregarEvaluaciones.tsx` - Función `getPreguntasRespuestas`
- `UseEvaluacionDirectores.tsx` - Función `getPreguntasRespuestasDirectores`
- `UseEvaluacionEspecialistas.tsx` - Funciones `getPreguntasRespuestasDesempeñoDirectivo` y `getPRDocentes`
- `UseEvaluacionDocentes.tsx` - Función `getPreguntasRespuestasDocentes`

## Lógica de Funcionamiento

1. **Identificación del correlativo**: La función identifica las letras existentes en las alternativas (a, b, c, etc.)
2. **Cálculo de la siguiente letra**: Determina la siguiente letra en orden alfabético
3. **Creación de la alternativa**: Crea una nueva alternativa con:
   - `alternativa`: La siguiente letra en mayúscula
   - `descripcion`: "no respondio"
   - `selected`: false

## Ejemplos

### Pregunta con alternativas A, B, C
```typescript
// Antes
alternativas: [
  { alternativa: 'A', descripcion: 'Opción 1', selected: false },
  { alternativa: 'B', descripcion: 'Opción 2', selected: false },
  { alternativa: 'C', descripcion: 'Opción 3', selected: false }
]

// Después
alternativas: [
  { alternativa: 'A', descripcion: 'Opción 1', selected: false },
  { alternativa: 'B', descripcion: 'Opción 2', selected: false },
  { alternativa: 'C', descripcion: 'Opción 3', selected: false },
  { alternativa: 'D', descripcion: 'no respondio', selected: false }
]
```

### Pregunta con alternativas A, B
```typescript
// Antes
alternativas: [
  { alternativa: 'A', descripcion: 'Sí', selected: false },
  { alternativa: 'B', descripcion: 'No', selected: false }
]

// Después
alternativas: [
  { alternativa: 'A', descripcion: 'Sí', selected: false },
  { alternativa: 'B', descripcion: 'No', selected: false },
  { alternativa: 'C', descripcion: 'no respondio', selected: false }
]
```

## Aplicación Automática

La funcionalidad se aplica automáticamente en los siguientes casos:

1. **Evaluaciones de estudiantes**: Al cargar preguntas para evaluar estudiantes
2. **Evaluaciones de directores**: Al cargar preguntas para evaluar directores
3. **Evaluaciones de docentes**: Al cargar preguntas para evaluar docentes
4. **Evaluaciones de especialistas**: Al cargar preguntas para evaluar especialistas

## Beneficios

1. **Consistencia**: Todas las preguntas tendrán la opción "no respondió"
2. **Flexibilidad**: Los usuarios pueden seleccionar esta opción si no saben la respuesta
3. **Análisis mejorado**: Permite analizar cuántas preguntas no fueron respondidas
4. **Experiencia de usuario**: Evita que los usuarios se vean forzados a responder sin saber

## Consideraciones Técnicas

- La función es idempotente: si ya existe una alternativa "no respondió", no la duplica
- Mantiene el orden original de las alternativas
- No modifica las alternativas existentes, solo agrega la nueva
- Funciona con cualquier cantidad de alternativas existentes (a, b, c, d, e, etc.)
