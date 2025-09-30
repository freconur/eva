import React, { useState } from 'react';
import TablaPreguntas, { EstudianteTabla, TablaPreguntasProps } from './TablaPreguntas';
import { PreguntasRespuestas } from '@/features/types/types';

// Ejemplo de uso del componente TablaPreguntas
const EjemploUsoTablaPreguntas: React.FC = () => {
  // Datos de ejemplo para estudiantes
  const [estudiantes, setEstudiantes] = useState<EstudianteTabla[]>([
    {
      dni: '12345678',
      nombresApellidos: 'Juan Pérez García',
      respuestasCorrectas: 8,
      totalPreguntas: 10,
      puntaje: 85.5,
      nivel: 'Satisfactorio',
      respuestas: [
        {
          id: '1',
          order: 1,
          pregunta: '¿Cuál es la capital de Perú?',
          preguntaDocente: 'Identifica la capital del país',
          respuesta: 'A',
          alternativas: [
            { alternativa: 'A', selected: true },
            { alternativa: 'B', selected: false },
            { alternativa: 'C', selected: false },
            { alternativa: 'D', selected: false }
          ]
        },
        {
          id: '2',
          order: 2,
          pregunta: '¿Cuántos continentes hay?',
          preguntaDocente: 'Conoce la cantidad de continentes',
          respuesta: 'B',
          alternativas: [
            { alternativa: 'A', selected: false },
            { alternativa: 'B', selected: true },
            { alternativa: 'C', selected: false },
            { alternativa: 'D', selected: false }
          ]
        }
      ]
    },
    {
      dni: '87654321',
      nombresApellidos: 'María López Silva',
      respuestasCorrectas: 6,
      totalPreguntas: 10,
      puntaje: 72.0,
      nivel: 'En proceso',
      respuestas: [
        {
          id: '1',
          order: 1,
          pregunta: '¿Cuál es la capital de Perú?',
          preguntaDocente: 'Identifica la capital del país',
          respuesta: 'A',
          alternativas: [
            { alternativa: 'A', selected: true },
            { alternativa: 'B', selected: false },
            { alternativa: 'C', selected: false },
            { alternativa: 'D', selected: false }
          ]
        },
        {
          id: '2',
          order: 2,
          pregunta: '¿Cuántos continentes hay?',
          preguntaDocente: 'Conoce la cantidad de continentes',
          respuesta: 'B',
          alternativas: [
            { alternativa: 'A', selected: true },
            { alternativa: 'B', selected: false },
            { alternativa: 'C', selected: false },
            { alternativa: 'D', selected: false }
          ]
        }
      ]
    }
  ]);

  // Datos de ejemplo para preguntas
  const preguntasRespuestas: PreguntasRespuestas[] = [
    {
      id: '1',
      order: 1,
      pregunta: '¿Cuál es la capital de Perú?',
      preguntaDocente: 'Identifica la capital del país',
      respuesta: 'A',
      alternativas: [
        { alternativa: 'A', selected: false },
        { alternativa: 'B', selected: false },
        { alternativa: 'C', selected: false },
        { alternativa: 'D', selected: false }
      ]
    },
    {
      id: '2',
      order: 2,
      pregunta: '¿Cuántos continentes hay?',
      preguntaDocente: 'Conoce la cantidad de continentes',
      respuesta: 'B',
      alternativas: [
        { alternativa: 'A', selected: false },
        { alternativa: 'B', selected: false },
        { alternativa: 'C', selected: false },
        { alternativa: 'D', selected: false }
      ]
    }
  ];

  // Función para manejar la eliminación de un estudiante
  const handleDeleteEstudiante = (dni: string) => {
    setEstudiantes(prev => prev.filter(estudiante => estudiante.dni !== dni));
    console.log('Eliminar estudiante:', dni);
  };

  // Función para manejar la edición de un estudiante
  const handleEditEstudiante = (dni: string) => {
    console.log('Editar estudiante:', dni);
    // Aquí podrías abrir un modal o navegar a una página de edición
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Ejemplo de Uso - TablaPreguntas</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>Uso Básico</h2>
        <TablaPreguntas
          estudiantes={estudiantes}
          preguntasRespuestas={preguntasRespuestas}
          onDeleteEstudiante={handleDeleteEstudiante}
          onEditEstudiante={handleEditEstudiante}
          linkToEdit="/editar-estudiante"
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Sin Botones de Eliminación (sin prop onDeleteEstudiante)</h2>
        <TablaPreguntas
          estudiantes={estudiantes}
          preguntasRespuestas={preguntasRespuestas}
          showDeleteButton={false}
          onEditEstudiante={handleEditEstudiante}
          linkToEdit="/editar-estudiante"
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Con Columnas Personalizadas</h2>
        <TablaPreguntas
          estudiantes={estudiantes}
          preguntasRespuestas={preguntasRespuestas}
          onDeleteEstudiante={handleDeleteEstudiante}
          onEditEstudiante={handleEditEstudiante}
          linkToEdit="/editar-estudiante"
          customColumns={{
            showPuntaje: true,
            showNivel: false
          }}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Con Advertencia de Sin Registros</h2>
        <TablaPreguntas
          estudiantes={[]}
          preguntasRespuestas={preguntasRespuestas}
          warningEvaEstudianteSinRegistro="No hay estudiantes registrados para esta evaluación"
          onDeleteEstudiante={handleDeleteEstudiante}
          onEditEstudiante={handleEditEstudiante}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Con Clase CSS Personalizada</h2>
        <TablaPreguntas
          estudiantes={estudiantes}
          preguntasRespuestas={preguntasRespuestas}
          onDeleteEstudiante={handleDeleteEstudiante}
          onEditEstudiante={handleEditEstudiante}
          linkToEdit="/editar-estudiante"
          className="mi-tabla-personalizada"
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Sin prop onDeleteEstudiante (botones ocultos automáticamente)</h2>
        <TablaPreguntas
          estudiantes={estudiantes}
          preguntasRespuestas={preguntasRespuestas}
          onEditEstudiante={handleEditEstudiante}
          linkToEdit="/editar-estudiante"
        />
      </div>
    </div>
  );
};

export default EjemploUsoTablaPreguntas;
