# Refactorización del Componente GraficoTendenciaColegio

## Resumen
Se refactorizó el componente `GraficoTendenciaColegio` que tenía 870 líneas de código, separando la lógica en hooks personalizados y utilidades para mejorar la mantenibilidad y reutilización del código.

## Archivos Creados

### 1. `features/hooks/useNivelColors.tsx`
**Propósito**: Maneja la lógica de colores y estilos CSS para los diferentes niveles de evaluación.

**Funciones principales**:
- `obtenerColorPorNivel()`: Retorna configuración de colores según el nivel
- `obtenerClasesColorPorNivel()`: Retorna clases CSS según el nivel

### 2. `features/hooks/useChartOptions.tsx`
**Propósito**: Centraliza toda la configuración de opciones para los diferentes tipos de gráficos.

**Configuraciones incluidas**:
- `opcionesComunes`: Configuración base para todos los gráficos
- `opcionesGraficoPie`: Configuración específica para gráfico de pie
- `opcionesPromedio`: Configuración para gráfico de promedio (líneas)
- `opcionesBarrasPromedio`: Configuración para gráfico de barras
- `obtenerNivelPorPuntaje()`: Función para determinar nivel por puntaje

### 3. `features/utils/chartDataUtils.ts`
**Propósito**: Utilidades para preparar y transformar datos para los gráficos.

**Funciones principales**:
- `prepararDatosPieChart()`: Prepara datos para gráfico de pie
- `prepararDatosNiveles()`: Prepara datos para gráfico de niveles por mes
- `prepararDatosPromedio()`: Prepara datos para gráfico de promedio (líneas)
- `prepararDatosBarrasPromedio()`: Prepara datos para gráfico de barras
- `calcularValorMaximoNiveles()`: Calcula valor máximo para eje Y
- `calcularValorMinimoPromedio()`: Calcula valor mínimo para eje Y

### 4. `features/hooks/useGraficoTendenciaData.tsx`
**Propósito**: Hook principal que combina todas las utilidades de datos y maneja el estado de los datos de los gráficos.

**Retorna**:
- `datosChartPie`: Datos para gráfico de pie
- `datosMesSeleccionado`: Datos del mes seleccionado
- `datosNiveles`: Datos para gráfico de niveles
- `datosPromedio`: Datos para gráfico de promedio
- `datosBarrasPromedio`: Datos para gráfico de barras
- Valores calculados para escalas de los gráficos

## Beneficios de la Refactorización

### 1. **Separación de Responsabilidades**
- Cada archivo tiene una responsabilidad específica y bien definida
- Lógica de presentación separada de la lógica de negocio

### 2. **Reutilización de Código**
- Los hooks y utilidades pueden ser reutilizados en otros componentes
- Configuraciones de gráficos centralizadas y consistentes

### 3. **Mantenibilidad**
- Código más fácil de mantener y debuggear
- Cambios en la lógica de colores o configuración se hacen en un solo lugar

### 4. **Legibilidad**
- Componente principal reducido de 870 líneas a ~200 líneas
- Código más limpio y fácil de entender

### 5. **Testabilidad**
- Cada hook y utilidad puede ser probado independientemente
- Lógica de negocio aislada para pruebas unitarias

## Estructura del Componente Refactorizado

```tsx
const GraficoTendenciaColegio = ({ ...props }) => {
  // Hooks personalizados
  const { datosChartPie, datosNiveles, ... } = useGraficoTendenciaData(props);
  const { opcionesComunes, opcionesGraficoPie, ... } = useChartOptions(props);
  
  // Solo lógica de presentación
  return (
    <div className={styles.threeColumnGrid}>
      {/* Renderizado de gráficos */}
    </div>
  );
};
```

## Uso de los Hooks

### En otros componentes:
```tsx
// Para usar solo la lógica de colores
const { obtenerColorPorNivel } = useNivelColors();

// Para usar solo las opciones de gráficos
const { opcionesComunes } = useChartOptions({ evaluacion, promedioGlobal, valorMaximoNiveles, monthSelected });

// Para usar solo la preparación de datos
const datosNiveles = prepararDatosNiveles(datosPorMes);
```

Esta refactorización mejora significativamente la arquitectura del código y facilita futuras modificaciones y extensiones.
