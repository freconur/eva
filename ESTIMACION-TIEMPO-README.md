# 📊 Sistema de Estimación de Tiempo - Documentación Completa

## 🎯 Descripción General

El sistema de estimación de tiempo permite calcular y mostrar predicciones de tiempo de procesamiento basadas en el número de directores a procesar. Incluye componentes tanto en el backend (Cloud Functions) como en el frontend (React) para proporcionar una experiencia completa al usuario.

## 🏗️ Arquitectura del Sistema

### Backend (Cloud Functions)
- **Función**: `calcularTiempoEstimado()` en `functions/src/index.ts`
- **Propósito**: Calcula estimaciones antes del procesamiento real
- **Logs**: Muestra estimaciones, progreso en tiempo real y comparación final

### Frontend (React)
- **Archivo base**: `fuctions/timeEstimation.ts`
- **Hook**: `useGenerarReporte()` en `features/hooks/useGenerarReporte.ts`
- **Componente**: `EstimacionTiempoComponent` en `components/estimacion-tiempo/`

## 📋 Funcionalidades Implementadas

### ✅ 1. Cálculo de Estimaciones
```typescript
// Ejemplo básico
import { calcularTiempoEstimado } from '@/fuctions/timeEstimation';

const estimacion = calcularTiempoEstimado(1200); // 1200 directores
console.log(`Tiempo estimado: ${estimacion.tiempoEstimadoMinutos} minutos`);
```

### ✅ 2. Clasificaciones de Tiempo
- 🟢 **RÁPIDO**: < 1 minuto
- 🟡 **MODERADO**: 1-3 minutos  
- 🟠 **LENTO**: 3-7 minutos
- 🔴 **MUY LENTO**: > 7 minutos (riesgo de timeout)

### ✅ 3. Estimaciones Predeterminadas
```typescript
import { ESTIMACIONES_PREDETERMINADAS } from '@/fuctions/timeEstimation';

// Escenarios disponibles:
// - PEQUENO: 100 directores
// - MEDIANO: 500 directores  
// - GRANDE: 1000 directores
// - MUY_GRANDE: 1500 directores
// - UGEL_PROMEDIO: 1200 directores
```

### ✅ 4. Componente Visual Interactivo
```jsx
import EstimacionTiempoComponent from '@/components/estimacion-tiempo/EstimacionTiempo';

<EstimacionTiempoComponent
  numeroDirectores={1200}
  mostrarDetalles={true}
  mostrarEscenarios={true}
  onEstimacionCalculada={(estimacion) => {
    console.log('Nueva estimación:', estimacion);
  }}
/>
```

## 🚀 Cómo Usar

### 1. Estimación Básica en el Frontend

```typescript
import { useGenerarReporte } from '@/features/hooks/useGenerarReporte';

const MiComponente = () => {
  const { 
    calcularEstimacionPrevia, 
    estimacionPrevia 
  } = useGenerarReporte();

  const handleCalcular = () => {
    const estimacion = calcularEstimacionPrevia(1200);
    console.log('Estimación:', estimacion);
  };

  return (
    <div>
      <button onClick={handleCalcular}>
        Calcular Estimación
      </button>
      
      {estimacionPrevia && (
        <div>
          <p>Tiempo estimado: {estimacionPrevia.tiempoEstimadoMinutos} min</p>
          <p>Clasificación: {estimacionPrevia.clasificacion}</p>
        </div>
      )}
    </div>
  );
};
```

### 2. Confirmación con Estimación

```typescript
import { mostrarConfirmacionEstimacion } from '@/fuctions/timeEstimation';

const handleGenerarReporte = () => {
  const confirmar = mostrarConfirmacionEstimacion(1200);
  
  if (confirmar) {
    // Proceder con la generación del reporte
    generarReporte();
  }
};
```

### 3. Uso del Hook Completo

```typescript
const {
  generarReporte,
  loading,
  estimacionPrevia,
  calcularEstimacionPrevia,
  obtenerEstimacionesEscenarios,
  actualizarEstimacionConDatosReales
} = useGenerarReporte();

// Calcular estimación previa
calcularEstimacionPrevia(1000);

// Obtener todos los escenarios
const escenarios = obtenerEstimacionesEscenarios();

// Actualizar con datos reales del backend
actualizarEstimacionConDatosReales(1247); // número real de directores
```

## 📊 Ejemplos de Estimaciones

| Directores | Tiempo Estimado | Clasificación | % Timeout |
|------------|----------------|---------------|-----------|
| 100        | 1.2 min        | 🟢 RÁPIDO    | 15%       |
| 500        | 4.8 min        | 🟡 MODERADO  | 60%       |
| 1000       | 8.5 min        | 🟠 LENTO     | 106%      |
| 1500       | 12.7 min       | 🔴 MUY LENTO | 159%      |

## ⚙️ Parámetros de Configuración

### Factores de Cálculo
```typescript
const TIEMPO_BASE_POR_LOTE = 2000; // 2s base por lote
const TIEMPO_POR_DIRECTOR_EN_LOTE = 150; // 150ms por director
const OVERHEAD_NETWORK = 500; // 500ms overhead de red
const FACTOR_DOCENTES_PROMEDIO = 1.8; // Multiplicador docentes
const FACTOR_EVALUACIONES_PROMEDIO = 1.5; // Multiplicador evaluaciones
```

### Tamaño de Lotes
- **Por defecto**: 30 directores por lote
- **Paralelismo**: Los lotes se procesan en paralelo
- **Timeout**: 8 minutos (480,000ms)

## 📝 Logs del Backend

El backend genera logs detallados durante el procesamiento:

```bash
⏱️  ESTIMACIÓN DE TIEMPO DE PROCESAMIENTO:
   📈 Total directores: 1200
   📦 Total lotes: 40 (30 directores/lote)  
   ⏰ Tiempo estimado: 8.7 minutos (522 segundos)
   🚦 Clasificación: MUY LENTO
   💡 Recomendación: Tiempo crítico - puede exceder timeout
   📊 Uso del timeout: 109% del límite de 8 minutos
   🏃 Velocidad estimada: 138 directores/minuto

# Durante el procesamiento:
📈 Progreso: 30% (360/1200) - Tiempo restante: 350s
🏃 Velocidad real: 145 directores/min - ETA: 8.2 min

# Al final:
⏱️  COMPARACIÓN ESTIMACIÓN vs REALIDAD:
   📊 Estimación inicial: 8.7 minutos
   ⏰ Tiempo real: 8.2 minutos  
   📈 Diferencia: -6% (más rápido)
   🏃 Velocidad real: 146.3 directores/min vs estimado: 138 directores/minuto
```

## 🎨 Componente Visual

El componente `EstimacionTiempoComponent` incluye:

- **🔢 Input numérico**: Para ajustar el número de directores
- **📊 Métricas visuales**: Tiempo, clasificación, uso del timeout
- **🎯 Recomendaciones**: Basadas en la clasificación
- **📋 Detalles técnicos**: Información expandible
- **🎭 Escenarios**: Botones para probar diferentes tamaños
- **🎨 Colores dinámicos**: Verde, amarillo, naranja, rojo según clasificación

## 🔧 Personalización

### Cambiar Escenarios Predeterminados
```typescript
// En fuctions/timeEstimation.ts
export const ESTIMACIONES_PREDETERMINADAS = {
  MI_ESCENARIO: { directores: 800, nombre: 'Mi Escenario (800 directores)' }
};
```

### Ajustar Factores de Cálculo
```typescript
// Modificar constantes en calcularTiempoEstimado()
const TIEMPO_BASE_POR_LOTE = 3000; // Aumentar tiempo base
const FACTOR_DOCENTES_PROMEDIO = 2.0; // Aumentar factor docentes
```

### Personalizar Clasificaciones
```typescript
// Modificar rangos en calcularTiempoEstimado()
if (tiempoTotalSegundos < 90) { // Cambiar de 60 a 90
  clasificacion = 'RÁPIDO';
}
```

## 🚨 Consideraciones Importantes

### ⚠️ Limitaciones
- Las estimaciones son aproximadas, basadas en análisis empírico
- El tiempo real puede variar según la carga del servidor
- Factores externos (red, base de datos) pueden afectar los tiempos

### 🔧 Recomendaciones
- Usar la estimación como guía, no como valor exacto
- Monitorear tiempo real vs estimaciones para ajustar factores
- Considerar implementar paginación para casos > 1000 directores
- Mostrar progreso en tiempo real para UX mejorada

## 📚 API Reference

### calcularTiempoEstimado(totalDirectores, batchSize?)
```typescript
interface EstimacionTiempo {
  totalDirectores: number;
  tiempoEstimadoMinutos: number;
  clasificacion: 'RÁPIDO' | 'MODERADO' | 'LENTO' | 'MUY LENTO';
  excederaTimeout: boolean;
  // ... más propiedades
}
```

### useGenerarReporte()
```typescript
const {
  estimacionPrevia: EstimacionTiempo | null;
  calcularEstimacionPrevia: (numero: number) => EstimacionTiempo;
  obtenerEstimacionesEscenarios: () => Array<{nombre, estimacion, directores}>;
  actualizarEstimacionConDatosReales: (numero: number) => EstimacionTiempo;
} = useGenerarReporte();
```

## 🎯 Casos de Uso

1. **Planificación**: Saber si un reporte se completará en horario laboral
2. **UX**: Mostrar tiempo estimado antes de iniciar procesamiento
3. **Optimización**: Identificar cuándo usar procesamiento por lotes
4. **Monitoreo**: Comparar estimaciones vs tiempo real para mejorar precisión
5. **Alertas**: Advertir sobre posibles timeouts antes de ejecutar

¡El sistema está listo para usar! 🚀 