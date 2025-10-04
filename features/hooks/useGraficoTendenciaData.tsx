import { useMemo } from 'react';
import {
  GraficoTendenciaNiveles,
  PromedioGlobalPorMes,
  GraficoPieChart,
  Evaluacion,
} from '@/features/types/types';
import {
  prepararDatosPieChart,
  prepararDatosNiveles,
  calcularValorMaximoNiveles,
  prepararDatosPromedio,
  prepararDatosBarrasPromedio,
  calcularValorMinimoPromedio,
} from '@/features/utils/chartDataUtils';

interface UseGraficoTendenciaDataProps {
  datosPorMes: GraficoTendenciaNiveles[];
  mesesConDataDisponibles: number[];
  promedioGlobal: PromedioGlobalPorMes[];
  monthSelected: number;
  dataGraficoTendenciaNiveles: GraficoPieChart[];
  evaluacion: Evaluacion;
}

export const useGraficoTendenciaData = ({
  datosPorMes,
  mesesConDataDisponibles,
  promedioGlobal,
  monthSelected,
  dataGraficoTendenciaNiveles,
  evaluacion,
}: UseGraficoTendenciaDataProps) => {

  // Datos del gráfico de pie para el mes seleccionado
  const datosChartPie = useMemo(() => {
    return prepararDatosPieChart(dataGraficoTendenciaNiveles, monthSelected);
  }, [dataGraficoTendenciaNiveles, monthSelected]);

  // Datos del mes seleccionado para el pie chart
  const datosMesSeleccionado = useMemo(() => {
    return Array.isArray(dataGraficoTendenciaNiveles)
      ? dataGraficoTendenciaNiveles.find((item) => item.mes === monthSelected)
      : undefined;
  }, [dataGraficoTendenciaNiveles, monthSelected]);

  // Preparar datos para el gráfico de niveles por mes
  const datosNiveles = useMemo(() => {
    return prepararDatosNiveles(datosPorMes);
  }, [datosPorMes]);

  // Calcular el valor máximo dinámico para el eje Y del gráfico de niveles
  const valorMaximoNiveles = useMemo(() => {
    return calcularValorMaximoNiveles(datosPorMes);
  }, [datosPorMes]);

  // Preparar datos para el gráfico de promedio global (líneas)
  const datosPromedio = useMemo(() => {
    return prepararDatosPromedio(promedioGlobal);
  }, [promedioGlobal]);

  // Calcular el valor mínimo para el eje Y del gráfico de promedio
  const valorMinimoPromedio = useMemo(() => {
    return calcularValorMinimoPromedio(promedioGlobal);
  }, [promedioGlobal]);

  // Preparar datos para el gráfico de barras de promedio global
  const datosBarrasPromedio = useMemo(() => {
    return prepararDatosBarrasPromedio(promedioGlobal);
  }, [promedioGlobal]);

  return {
    datosChartPie,
    datosMesSeleccionado,
    datosNiveles,
    valorMaximoNiveles,
    datosPromedio,
    valorMinimoPromedio,
    datosBarrasPromedio,
  };
};
