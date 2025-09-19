# Modal Puntuación y Nivel

Este modal muestra la puntuación y nivel alcanzado por un estudiante en una evaluación, utilizando la función `calculoNivel` para realizar los cálculos automáticamente.

## Características

- **Cálculo automático**: Utiliza la función `calculoNivel` para calcular puntuación y nivel
- **Información detallada**: Muestra datos del estudiante, puntuación, nivel y estadísticas
- **Diseño responsivo**: Se adapta a diferentes tamaños de pantalla
- **Colores por nivel**: Cada nivel tiene un color distintivo
- **Animaciones**: Incluye transiciones suaves al abrir/cerrar

## Props

```typescript
interface Props {
  showModal: boolean;           // Controla la visibilidad del modal
  handleShowModal: () => void; // Función para cerrar el modal
  estudiante: UserEstudiante | null; // Datos del estudiante
  idExamen: string;            // ID del examen para el cálculo de nivel
}
```

## Uso

```tsx
import PuntuacionYNivel from './modals/PuntuacionYNivel/puntuacionYNivel';

const MiComponente = () => {
  const [showModal, setShowModal] = useState(false);
  const [estudiante, setEstudiante] = useState<UserEstudiante | null>(null);

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Ver Puntuación
      </button>
      
      <PuntuacionYNivel
        showModal={showModal}
        handleShowModal={() => setShowModal(false)}
        estudiante={estudiante}
        idExamen="mi-examen-id"
      />
      
      {/* Portal para el modal */}
      <div id="portal-modal"></div>
    </>
  );
};
```

## Niveles de Rendimiento

El modal muestra los siguientes niveles con sus respectivos colores:

- **Satisfactorio** (Verde): Puntaje alto
- **En Proceso** (Naranja): Puntaje medio-alto
- **En Inicio** (Rojo): Puntaje medio-bajo
- **Previo al Inicio** (Púrpura): Puntaje bajo
- **Sin Clasificar** (Gris): Sin datos suficientes

## Información Mostrada

1. **Datos del estudiante**: Nombre y DNI
2. **Puntuación obtenida**: Puntos totales acumulados
3. **Nivel alcanzado**: Clasificación según el puntaje
4. **Estadísticas detalladas**:
   - Total de preguntas
   - Respuestas correctas
   - Porcentaje de aciertos

## Requisitos

- React 18+
- Portal DOM (elemento con id "portal-modal")
- Función `calculoNivel` disponible
- Tipos TypeScript definidos

## Estilos

El modal utiliza CSS Modules con clases específicas para cada elemento. Los estilos incluyen:

- Diseño responsivo
- Gradientes y sombras
- Animaciones de entrada/salida
- Colores distintivos por nivel
- Tipografía optimizada

## Archivos

- `puntuacionYNivel.tsx`: Componente principal del modal
- `puntuacionYNivel.module.css`: Estilos del modal
- `ejemploUso.tsx`: Ejemplo de implementación
- `README.md`: Documentación
