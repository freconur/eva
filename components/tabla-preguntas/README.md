# TablaPreguntas Component

Un componente reutilizable de React para mostrar tablas de preguntas con columnas dinámicas basadas en las preguntas de una evaluación.

## Características

- ✅ **Columnas dinámicas**: El número de columnas se ajusta automáticamente según las preguntas de la evaluación
- ✅ **Validación de puntaje y nivel**: Muestra columnas de puntaje y nivel solo cuando hay datos válidos
- ✅ **Botones de acción**: Opcionalmente muestra botones para eliminar y editar estudiantes
- ✅ **Responsive**: Diseño adaptativo para diferentes tamaños de pantalla
- ✅ **Personalizable**: Múltiples props para personalizar el comportamiento
- ✅ **TypeScript**: Completamente tipado para mejor desarrollo

## Instalación

El componente está ubicado en `components/tabla-preguntas/` y puede ser importado directamente:

```tsx
import TablaPreguntas from '@/components/tabla-preguntas/TablaPreguntas';
```

## Uso Básico

```tsx
import TablaPreguntas from '@/components/tabla-preguntas/TablaPreguntas';

const MiComponente = () => {
  const estudiantes = [
    {
      dni: '12345678',
      nombresApellidos: 'Juan Pérez',
      respuestasCorrectas: 8,
      totalPreguntas: 10,
      puntaje: 85.5,
      nivel: 'Satisfactorio',
      respuestas: [/* ... */]
    }
  ];

  const preguntasRespuestas = [
    {
      id: '1',
      order: 1,
      pregunta: '¿Pregunta 1?',
      preguntaDocente: 'Actuación 1',
      respuesta: 'A',
      alternativas: [/* ... */]
    }
  ];

  return (
    <TablaPreguntas
      estudiantes={estudiantes}
      preguntasRespuestas={preguntasRespuestas}
      onDeleteEstudiante={(dni) => console.log('Eliminar:', dni)}
      onEditEstudiante={(dni) => console.log('Editar:', dni)}
      linkToEdit="/editar-estudiante"
    />
  );
};
```

## Props

### Props Requeridas

| Prop | Tipo | Descripción |
|------|------|-------------|
| `estudiantes` | `EstudianteTabla[]` | Array de estudiantes a mostrar en la tabla |
| `preguntasRespuestas` | `PreguntasRespuestas[]` | Array de preguntas para generar las columnas dinámicas |

### Props Opcionales

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `warningEvaEstudianteSinRegistro` | `string` | `undefined` | Mensaje de advertencia cuando no hay estudiantes |
| `onDeleteEstudiante` | `(dni: string) => void` | `undefined` | Función llamada al eliminar un estudiante |
| `onEditEstudiante` | `(dni: string) => void` | `undefined` | Función llamada al editar un estudiante |
| `linkToEdit` | `string` | `undefined` | URL base para los enlaces de edición |
| `showDeleteButton` | `boolean` | `true` | Mostrar botón de eliminar |
| `showEditButton` | `boolean` | `true` | Mostrar enlaces de edición |
| `customColumns` | `object` | `undefined` | Configuración personalizada de columnas |
| `className` | `string` | `''` | Clase CSS adicional para el contenedor |

### customColumns

```tsx
interface CustomColumns {
  showPuntaje?: boolean;  // Forzar mostrar/ocultar columna de puntaje
  showNivel?: boolean;    // Forzar mostrar/ocultar columna de nivel
}
```

## Interfaces

### EstudianteTabla

```tsx
interface EstudianteTabla {
  dni: string;
  nombresApellidos: string;
  respuestasCorrectas: number;
  totalPreguntas: number;
  puntaje?: number;
  nivel?: string;
  respuestas?: PreguntasRespuestas[];
}
```

### PreguntasRespuestas

```tsx
interface PreguntasRespuestas {
  id: string;
  order: number;
  pregunta: string;
  preguntaDocente: string;
  respuesta: string;
  alternativas: Alternativa[];
}
```

## Ejemplos de Uso

### Uso Básico

```tsx
<TablaPreguntas
  estudiantes={estudiantes}
  preguntasRespuestas={preguntasRespuestas}
  onDeleteEstudiante={handleDelete}
  onEditEstudiante={handleEdit}
  linkToEdit="/admin/editar-estudiante"
/>
```

### Sin Botones de Eliminación

```tsx
<TablaPreguntas
  estudiantes={estudiantes}
  preguntasRespuestas={preguntasRespuestas}
  showDeleteButton={false}
  onEditEstudiante={handleEdit}
  linkToEdit="/admin/editar-estudiante"
/>
```

### Con Columnas Personalizadas

```tsx
<TablaPreguntas
  estudiantes={estudiantes}
  preguntasRespuestas={preguntasRespuestas}
  customColumns={{
    showPuntaje: true,
    showNivel: false
  }}
  onDeleteEstudiante={handleDelete}
  onEditEstudiante={handleEdit}
/>
```

### Con Advertencia de Sin Registros

```tsx
<TablaPreguntas
  estudiantes={[]}
  preguntasRespuestas={preguntasRespuestas}
  warningEvaEstudianteSinRegistro="No hay estudiantes registrados para esta evaluación"
/>
```

## Estilos

El componente incluye estilos CSS modulares en `TablaPreguntas.module.css`. Los estilos principales incluyen:

- **Responsive design**: Se adapta a diferentes tamaños de pantalla
- **Scroll horizontal**: Para tablas con muchas columnas
- **Estados visuales**: Diferentes colores para respuestas correctas/incorrectas
- **Hover effects**: Efectos visuales al pasar el mouse
- **Popover**: Información adicional al hacer hover en las preguntas

## Personalización

### Clases CSS Personalizadas

Puedes agregar clases CSS personalizadas usando la prop `className`:

```tsx
<TablaPreguntas
  estudiantes={estudiantes}
  preguntasRespuestas={preguntasRespuestas}
  className="mi-tabla-personalizada"
/>
```

### Estilos Globales

Para personalizar los estilos globalmente, puedes sobrescribir las clases CSS del componente:

```css
/* En tu archivo CSS global */
.tablaWrapper {
  border: 2px solid #custom-color;
}

.tableHeader {
  background-color: #custom-header-color;
}
```

## Dependencias

- React
- Next.js (para el componente Link)
- react-icons (para el icono de eliminar)
- TypeScript

## Archivos Incluidos

- `TablaPreguntas.tsx` - Componente principal
- `TablaPreguntas.module.css` - Estilos del componente
- `EjemploUsoTablaPreguntas.tsx` - Ejemplos de uso
- `README.md` - Documentación

## Notas de Desarrollo

- El componente está optimizado para rendimiento con React.memo
- Las validaciones de puntaje y nivel son automáticas pero pueden ser sobrescritas
- El componente maneja casos edge como arrays vacíos y datos faltantes
- Los estilos son completamente responsive y accesibles
