import { GraficoTendenciaNiveles, PromedioGlobalPorMes, GraficoPieChart } from '@/features/types/types';
import { getMonthName } from '@/fuctions/dates';

// Paleta de colores profesional
export const coloresProfesionales = [
  '#3B82F6', // Azul
  '#EF4444', // Rojo
  '#10B981', // Verde
  '#F59E0B', // Amarillo
  '#8B5CF6', // Púrpura
  '#EC4899', // Rosa
  '#06B6D4', // Cian
  '#84CC16', // Lima
  '#F97316', // Naranja
  '#6366F1', // Índigo
  '#14B8A6', // Teal
  '#F43F5E', // Rose
];

// Función para preparar datos del gráfico de pie
export const prepararDatosPieChart = (
  dataGraficoTendenciaNiveles: GraficoPieChart[],
  monthSelected: number,
  obtenerColorPorNivel: (nivel: string) => any
) => {
  const datosMesSeleccionado = Array.isArray(dataGraficoTendenciaNiveles)
    ? dataGraficoTendenciaNiveles.find((item) => item.mes === monthSelected)
    : undefined;

  if (!datosMesSeleccionado) {
    return {
      labels: ['Sin datos'],
      datasets: [
        {
          data: [1],
          backgroundColor: ['#E5E7EB'],
          borderColor: ['#9CA3AF'],
          borderWidth: 2,
        },
      ],
    };
  }

  return {
    labels: datosMesSeleccionado.niveles.map((nivel) => {
      return nivel.nivel
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }),
    datasets: [
      {
        data: datosMesSeleccionado.niveles.map((nivel) => nivel.cantidadDeEstudiantes),
        backgroundColor: datosMesSeleccionado.niveles.map(
          (nivel) => obtenerColorPorNivel(nivel.nivel).bg
        ),
        borderColor: datosMesSeleccionado.niveles.map(
          (nivel) => obtenerColorPorNivel(nivel.nivel).border
        ),
        borderWidth: 2,
        hoverBackgroundColor: datosMesSeleccionado.niveles.map(
          (nivel) => obtenerColorPorNivel(nivel.nivel).hoverBg
        ),
        hoverBorderColor: datosMesSeleccionado.niveles.map(
          (nivel) => obtenerColorPorNivel(nivel.nivel).hoverBorder
        ),
        hoverBorderWidth: 3,
      },
    ],
  };
};

// Función para preparar datos del gráfico de niveles por mes
export const prepararDatosNiveles = (datosPorMes: GraficoTendenciaNiveles[]) => {
  if (!datosPorMes || datosPorMes.length === 0) return null;

  // Filtrar datos que tengan niveles con length > 0
  const datosFiltrados = datosPorMes.filter((dato) => dato.niveles && dato.niveles.length > 0);
  
  if (datosFiltrados.length === 0) return null;

  // Obtener todos los niveles únicos de todos los meses con su información completa
  const nivelesMap = new Map<string, { nivel: string; id: number }>();
  datosFiltrados.forEach((dato) => {
    dato.niveles.forEach((nivel) => {
      if (nivel.id !== undefined) {
        nivelesMap.set(nivel.nivel, { nivel: nivel.nivel, id: nivel.id });
      }
    });
  });

  // Convertir Map a Array y ordenar los niveles por ID de manera descendente
  const nivelesOrdenados = Array.from(nivelesMap.values())
    .sort((a, b) => b.id - a.id)
    .map(nivel => nivel.nivel);

  // Crear datasets para cada mes
  const datasets = datosFiltrados.map((dato, index) => {
    const color = coloresProfesionales[index % coloresProfesionales.length];

    const data = nivelesOrdenados.map((nivel) => {
      const nivelData = dato.niveles.find((n) => n.nivel === nivel);
      return nivelData ? nivelData.cantidadDeEstudiantes : 0;
    });

    return {
      label: `${getMonthName(dato.mes)}`,
      data: data,
      borderColor: color,
      backgroundColor: color + '15', // Transparencia más sutil
      borderWidth: 3,
      pointBackgroundColor: color,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
      tension: 0.3,
      fill: false,
      shadowOffsetX: 0,
      shadowOffsetY: 2,
      shadowBlur: 4,
      shadowColor: color + '40',
    };
  });

  return {
    labels: nivelesOrdenados,
    datasets: datasets,
  };
};

// Función para calcular el valor máximo dinámico para el eje Y
export const calcularValorMaximoNiveles = (datosPorMes: GraficoTendenciaNiveles[]) => {
  if (!datosPorMes || datosPorMes.length === 0) return 50;

  // Filtrar datos que tengan niveles con length > 0
  const datosFiltrados = datosPorMes.filter((dato) => dato.niveles && dato.niveles.length > 0);
  
  if (datosFiltrados.length === 0) return 50;

  // Encontrar el valor máximo entre todos los niveles de todos los meses
  let maximoValor = 0;
  datosFiltrados.forEach((dato) => {
    dato.niveles.forEach((nivel) => {
      if (nivel.cantidadDeEstudiantes > maximoValor) {
        maximoValor = nivel.cantidadDeEstudiantes;
      }
    });
  });

  // Definir un step size fijo para mantener consistencia
  const stepSize = 5; // Incremento fijo de 5 en 5
  
  // Encontrar el siguiente nivel del patrón que contenga el valor máximo
  const nivelActual = Math.ceil(maximoValor / stepSize);
  
  // Agregar 2 niveles más al patrón del eje
  const nivelFinal = nivelActual + 2;
  
  // Calcular el nuevo valor máximo basado en el patrón
  const nuevoMaximo = nivelFinal * stepSize;
  
  // Asegurar un mínimo de 15
  return Math.max(15, nuevoMaximo);
};

// Función para preparar datos del gráfico de promedio global (líneas)
export const prepararDatosPromedio = (promedioGlobal: PromedioGlobalPorMes[]) => {
  if (!promedioGlobal || promedioGlobal.length === 0) return null;

  // Filtrar datos que tengan promedio y totalEstudiantes diferentes de 0
  const datosFiltrados = promedioGlobal.filter((dato) => 
    dato.promedioGlobal !== 0 && dato.totalEstudiantes !== 0
  );
  
  if (datosFiltrados.length === 0) return null;

  // Ordenar los datos por mes de manera ascendente
  const datosOrdenados = [...datosFiltrados].sort((a, b) => a.mes - b.mes);

  return {
    labels: datosOrdenados.map((dato) => getMonthName(dato.mes)),
    datasets: [
      {
        label: 'Promedio Global',
        data: datosOrdenados.map((dato) => dato.promedioGlobal),
        borderColor: '#36A2EB',
        backgroundColor: '#36A2EB20',
        tension: 1,
        fill: false,
        pointRadius: 8,
        pointHoverRadius: 10,
        pointBackgroundColor: '#36A2EB',
        pointBorderColor: '#36A2EB',
        pointBorderWidth: 2,
      },
    ],
  };
};

// Función para preparar datos del gráfico de barras de promedio global
export const prepararDatosBarrasPromedio = (promedioGlobal: PromedioGlobalPorMes[]) => {
  if (!promedioGlobal || promedioGlobal.length === 0) return null;

  // Filtrar datos que tengan promedio y totalEstudiantes diferentes de 0
  const datosFiltrados = promedioGlobal.filter((dato) => 
    dato.promedioGlobal !== 0 && dato.totalEstudiantes !== 0
  );
  
  if (datosFiltrados.length === 0) return null;

  // Ordenar los datos por mes de manera ascendente
  const datosOrdenados = [...datosFiltrados].sort((a, b) => a.mes - b.mes);

  return {
    labels: datosOrdenados.map((dato) => `${getMonthName(dato.mes)}`),
    datasets: [
      {
        label: 'Promedio Global',
        data: datosOrdenados.map((dato) => dato.promedioGlobal),
        backgroundColor: datosOrdenados.map(
          (_, index) => coloresProfesionales[index % coloresProfesionales.length] + '80'
        ),
        borderColor: datosOrdenados.map(
          (_, index) => coloresProfesionales[index % coloresProfesionales.length]
        ),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };
};

// Función para calcular el valor mínimo para el eje Y del gráfico de promedio
export const calcularValorMinimoPromedio = (promedioGlobal: PromedioGlobalPorMes[]) => {
  if (!promedioGlobal || promedioGlobal.length === 0) return 0;

  // Filtrar datos que tengan promedio y totalEstudiantes diferentes de 0
  const datosFiltrados = promedioGlobal.filter((dato) => 
    dato.promedioGlobal !== 0 && dato.totalEstudiantes !== 0
  );
  
  if (datosFiltrados.length === 0) return 0;

  const valores = datosFiltrados.map((dato) => dato.promedioGlobal);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = max - min;

  // Calcular un margen del 10% del rango por debajo del valor mínimo
  const margen = rango * 0.1;
  return Math.max(0, min - margen);
};
