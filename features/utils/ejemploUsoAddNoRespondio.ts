import { PreguntasRespuestas } from '../types/types';
import { addNoRespondioAlternative, addNoRespondioToSingleQuestion, hasNoRespondioAlternative } from './addNoRespondioAlternative';

// Ejemplo de uso de las funciones para agregar alternativa "no respondió"

// Ejemplo 1: Pregunta con alternativas a, b, c
const preguntaEjemplo1: PreguntasRespuestas = {
  id: '1',
  order: 1,
  pregunta: '¿Cuál es la capital de Perú?',
  respuesta: 'A',
  alternativas: [
    { alternativa: 'A', descripcion: 'Lima', selected: false },
    { alternativa: 'B', descripcion: 'Cusco', selected: false },
    { alternativa: 'C', descripcion: 'Arequipa', selected: false }
  ]
};

// Ejemplo 2: Pregunta con alternativas a, b, c, d
const preguntaEjemplo2: PreguntasRespuestas = {
  id: '2',
  order: 2,
  pregunta: '¿Cuántos continentes hay?',
  respuesta: 'B',
  alternativas: [
    { alternativa: 'A', descripcion: '5', selected: false },
    { alternativa: 'B', descripcion: '7', selected: false },
    { alternativa: 'C', descripcion: '6', selected: false },
    { alternativa: 'D', descripcion: '8', selected: false }
  ]
};

// Ejemplo 3: Pregunta con alternativas a, b
const preguntaEjemplo3: PreguntasRespuestas = {
  id: '3',
  order: 3,
  pregunta: '¿El agua hierve a 100°C?',
  respuesta: 'A',
  alternativas: [
    { alternativa: 'A', descripcion: 'Verdadero', selected: false },
    { alternativa: 'B', descripcion: 'Falso', selected: false }
  ]
};

// Función para demostrar el uso
export const demostrarUsoAddNoRespondio = () => {
  console.log('=== DEMOSTRACIÓN DE USO DE addNoRespondioAlternative ===\n');

  // Procesar una sola pregunta
  console.log('1. Procesando una sola pregunta:');
  console.log('Pregunta original:', preguntaEjemplo1);
  const preguntaConNoRespondio1 = addNoRespondioToSingleQuestion(preguntaEjemplo1);
  console.log('Pregunta con "no respondió":', preguntaConNoRespondio1);
  console.log('¿Ya tiene "no respondió"?', hasNoRespondioAlternative(preguntaConNoRespondio1));
  console.log('\n');

  // Procesar múltiples preguntas
  console.log('2. Procesando múltiples preguntas:');
  const preguntasEjemplo = [preguntaEjemplo1, preguntaEjemplo2, preguntaEjemplo3];
  console.log('Preguntas originales:', preguntasEjemplo);
  const preguntasConNoRespondio = addNoRespondioAlternative(preguntasEjemplo);
  console.log('Preguntas con "no respondió":', preguntasConNoRespondio);
  console.log('\n');

  // Verificar si ya tienen la alternativa
  console.log('3. Verificando si ya tienen la alternativa "no respondió":');
  preguntasConNoRespondio.forEach((pregunta, index) => {
    console.log(`Pregunta ${index + 1}: ${hasNoRespondioAlternative(pregunta)}`);
  });

  return preguntasConNoRespondio;
};

// Resultado esperado:
// - preguntaEjemplo1: agregará alternativa 'D' con descripción 'no respondio'
// - preguntaEjemplo2: agregará alternativa 'E' con descripción 'no respondio'  
// - preguntaEjemplo3: agregará alternativa 'C' con descripción 'no respondio'
