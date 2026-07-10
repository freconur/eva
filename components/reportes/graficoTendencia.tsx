import React, { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import Loader from '@/components/loader/loader'
import { getFirestore, collection, getAggregateFromServer, average, query, where, getCountFromServer, doc, getDoc } from 'firebase/firestore'
import { Evaluaciones } from '@/features/types/types'
import styles from './graficoTendencia.module.css'

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface GraficoTendenciaProps {
  idEvaluacion: string,
  evaluacionesAComparar?: string[]
}

interface EvaluacionDataLocal {
  id: string;
  nombre: string;
  puntajeMedia: number;
  totalEstudiantes: number;
  niveles: { nivel: string; cantidadDeEstudiantes: number }[];
}

const GraficoTendencia = ({ idEvaluacion, evaluacionesAComparar = [] }: GraficoTendenciaProps) => {
  const { evaluacion } = useGlobalContext();

  const [dataActual, setDataActual] = useState<EvaluacionDataLocal | null>(null);
  const [dataComparadas, setDataComparadas] = useState<EvaluacionDataLocal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingComparadas, setLoadingComparadas] = useState<boolean>(false);

  // Paleta de colores preestablecida
  const getColoresParaIndex = (index: number) => {
    const paleta = [
      { border: '#4F46E5', bg: 'rgba(79, 70, 229, 0.15)' }, // Indigo (Actual)
      { border: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },  // Rojo
      { border: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' }, // Verde
      { border: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },  // Ámbar
      { border: '#EC4899', bg: 'rgba(236, 72, 153, 0.15)' },  // Rosa
      { border: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' },  // Morado
      { border: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)' }   // Cyan
    ];
    return paleta[index % paleta.length];
  };

  // Nombre del mes para mostrar en leyendas y tooltips
  const getNombreMes = (mesNum: string | number | undefined) => {
    if (mesNum === undefined) return '';
    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return nombresMeses[Number(mesNum)] || `Mes ${mesNum}`;
  };

  // Cargar datos de la evaluación actual
  useEffect(() => {
    let isMounted = true;
    if (!evaluacion || !idEvaluacion) return;

    const loadDataActual = async () => {
      try {
        setLoading(true);
        const db = getFirestore();
        const año = evaluacion.añoDelExamen || new Date().getFullYear().toString();
        const mes = evaluacion.mesDelExamen || '0';

        const coll = collection(db, `/evaluaciones/${idEvaluacion}/estudiantes-evaluados/${año}/${mes}`);

        // 1. Puntaje promedio
        const snapshotAvg = await getAggregateFromServer(coll, {
          averagePopulation: average('puntaje')
        });
        const puntajeMedia = snapshotAvg.data().averagePopulation || 0;

        // 2. Conteo total y por niveles
        const totalCountSnap = await getCountFromServer(coll);
        const totalEstudiantes = totalCountSnap.data().count;

        const nivelesData: any[] = [];
        if (totalEstudiantes > 0 && evaluacion.nivelYPuntaje) {
          const queriesPorNivel: Record<string, any> = {};

          for (const nivelData of evaluacion.nivelYPuntaje) {
            const nivelNombre = nivelData.nivel?.toLowerCase() || '';
            const minPuntaje = nivelData.min || 0;
            const maxPuntaje = nivelData.max || Number.MAX_SAFE_INTEGER;

            let q;
            if (nivelNombre === 'previo al inicio') {
              q = query(coll, where('puntaje', '<=', maxPuntaje), where('puntaje', '>=', 0));
            } else {
              q = query(coll, where('puntaje', '<=', maxPuntaje), where('puntaje', '>=', minPuntaje));
            }
            queriesPorNivel[nivelNombre] = q;
          }

          for (const nivelData of evaluacion.nivelYPuntaje) {
            const nivelNombre = nivelData.nivel?.toLowerCase() || '';
            if (queriesPorNivel[nivelNombre]) {
              const snapshotNivel = await getCountFromServer(queriesPorNivel[nivelNombre]);
              nivelesData.push({
                nivel: nivelData.nivel || nivelNombre,
                cantidadDeEstudiantes: snapshotNivel.data().count
              });
            }
          }

          // Ajustar estudiantes no contabilizados por nulos
          const sumaNiveles = nivelesData.reduce((s, n) => s + n.cantidadDeEstudiantes, 0);
          const diff = totalEstudiantes - sumaNiveles;
          if (diff > 0) {
            const previo = nivelesData.find(n => n.nivel?.toLowerCase() === 'previo al inicio');
            if (previo) {
              previo.cantidadDeEstudiantes += diff;
            } else {
              nivelesData.push({ nivel: 'previo al inicio', cantidadDeEstudiantes: diff });
            }
          }
        }

        if (isMounted) {
          setDataActual({
            id: idEvaluacion,
            nombre: `${evaluacion.nombre || 'Evaluación Actual'} (${getNombreMes(evaluacion.mesDelExamen)})`,
            puntajeMedia,
            totalEstudiantes,
            niveles: nivelesData
          });
        }
      } catch (error) {
        console.error('Error al cargar datos de evaluación actual:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDataActual();

    return () => {
      isMounted = false;
    };
  }, [idEvaluacion, evaluacion]);

  // Cargar datos de las múltiples evaluaciones comparadas
  useEffect(() => {
    let isMounted = true;
    if (!evaluacionesAComparar || evaluacionesAComparar.length === 0) {
      setDataComparadas([]);
      return;
    }

    const loadDataComparadas = async () => {
      try {
        setLoadingComparadas(true);
        const db = getFirestore();
        const results: EvaluacionDataLocal[] = [];

        const promesas = evaluacionesAComparar.map(async (idComp) => {
          const evalDocSnap = await getDoc(doc(db, 'evaluaciones', idComp));
          if (!evalDocSnap.exists()) return;
          const evalComparada = evalDocSnap.data() as Evaluaciones;

          const año = evalComparada.añoDelExamen || new Date().getFullYear().toString();
          const mes = evalComparada.mesDelExamen || '0';

          const coll = collection(db, `/evaluaciones/${idComp}/estudiantes-evaluados/${año}/${mes}`);

          // 1. Puntaje promedio
          const snapshotAvg = await getAggregateFromServer(coll, {
            averagePopulation: average('puntaje')
          });
          const puntajeMedia = snapshotAvg.data().averagePopulation || 0;

          // 2. Conteo total y por niveles
          const totalCountSnap = await getCountFromServer(coll);
          const totalEstudiantes = totalCountSnap.data().count;

          const nivelesData: any[] = [];
          if (totalEstudiantes > 0 && evalComparada.nivelYPuntaje) {
            const queriesPorNivel: Record<string, any> = {};

            for (const nivelData of evalComparada.nivelYPuntaje) {
              const nivelNombre = nivelData.nivel?.toLowerCase() || '';
              const minPuntaje = nivelData.min || 0;
              const maxPuntaje = nivelData.max || Number.MAX_SAFE_INTEGER;

              let q;
              if (nivelNombre === 'previo al inicio') {
                q = query(coll, where('puntaje', '<=', maxPuntaje), where('puntaje', '>=', 0));
              } else {
                q = query(coll, where('puntaje', '<=', maxPuntaje), where('puntaje', '>=', minPuntaje));
              }
              queriesPorNivel[nivelNombre] = q;
            }

            for (const nivelData of evalComparada.nivelYPuntaje) {
              const nivelNombre = nivelData.nivel?.toLowerCase() || '';
              if (queriesPorNivel[nivelNombre]) {
                const snapshotNivel = await getCountFromServer(queriesPorNivel[nivelNombre]);
                nivelesData.push({
                  nivel: nivelData.nivel || nivelNombre,
                  cantidadDeEstudiantes: snapshotNivel.data().count
                });
              }
            }

            const sumaNiveles = nivelesData.reduce((s, n) => s + n.cantidadDeEstudiantes, 0);
            const diff = totalEstudiantes - sumaNiveles;
            if (diff > 0) {
              const previo = nivelesData.find(n => n.nivel?.toLowerCase() === 'previo al inicio');
              if (previo) {
                previo.cantidadDeEstudiantes += diff;
              } else {
                nivelesData.push({ nivel: 'previo al inicio', cantidadDeEstudiantes: diff });
              }
            }
          }

          results.push({
            id: idComp,
            nombre: `${evalComparada.nombre || 'Evaluación Comparada'} (${getNombreMes(evalComparada.mesDelExamen)})`,
            puntajeMedia,
            totalEstudiantes,
            niveles: nivelesData
          });
        });

        await Promise.all(promesas);

        if (isMounted) {
          // Mantener el orden original de la selección
          const orderedResults = evaluacionesAComparar
            .map(id => results.find(r => r.id === id))
            .filter((r): r is EvaluacionDataLocal => !!r);
          setDataComparadas(orderedResults);
        }
      } catch (error) {
        console.error('Error al cargar datos de evaluaciones comparadas:', error);
      } finally {
        if (isMounted) {
          setLoadingComparadas(false);
        }
      }
    };

    loadDataComparadas();

    return () => {
      isMounted = false;
    };
  }, [evaluacionesAComparar]);

  // Configuración del gráfico de promedios (barras y líneas)
  const labelsPromedios = [dataActual?.nombre || 'Evaluación Actual'];
  dataComparadas.forEach(d => {
    labelsPromedios.push(d.nombre);
  });

  const numSeriesTotal = 1 + dataComparadas.length;

  // Construir los datasets para que cada evaluación sea su propio color y tenga su punto
  const datasetsPromedios: any[] = [
    {
      label: dataActual?.nombre || 'Evaluación Actual',
      data: [
        dataActual?.puntajeMedia || 0,
        ...Array(dataComparadas.length).fill(null)
      ],
      borderColor: getColoresParaIndex(0).border,
      backgroundColor: getColoresParaIndex(0).bg,
      borderWidth: 2,
      pointBackgroundColor: getColoresParaIndex(0).border,
      pointBorderColor: '#fff',
      pointBorderWidth: 3,
      pointRadius: 8,
      pointHoverRadius: 10,
      pointHoverBackgroundColor: getColoresParaIndex(0).border,
      pointHoverBorderColor: '#fff'
    }
  ];

  dataComparadas.forEach((d, idx) => {
    const colObj = getColoresParaIndex(idx + 1);
    const dataValues = Array(numSeriesTotal).fill(null);
    dataValues[idx + 1] = d.puntajeMedia; // Colocar el dato en la columna que corresponde

    datasetsPromedios.push({
      label: d.nombre,
      data: dataValues,
      borderColor: colObj.border,
      backgroundColor: colObj.bg,
      borderWidth: 2,
      pointBackgroundColor: colObj.border,
      pointBorderColor: '#fff',
      pointBorderWidth: 3,
      pointRadius: 8,
      pointHoverRadius: 10,
      pointHoverBackgroundColor: colObj.border,
      pointHoverBorderColor: '#fff'
    });
  });

  const datosChart = {
    labels: labelsPromedios,
    datasets: datasetsPromedios
  };

  const datosChartBar = {
    ...datosChart,
    datasets: datosChart.datasets.map(dataset => ({
      ...dataset,
      maxBarThickness: 60
    }))
  };

  const opcionesGrafico = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    layout: {
      padding: {
        left: 20,
        right: 20
      }
    },
    plugins: {
      legend: {
        display: false // Ocultar leyenda en promedios porque cada barra/punto tiene su nombre en el eje X
      },
      title: {
        display: true,
        text: 'Gráfico de tendencia por puntaje promedio',
        color: '#333',
        font: {
          size: 18
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#666',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function (context: any) {
            const idx = context.dataIndex;
            const isComparativa = idx > 0;
            const targetData = isComparativa ? dataComparadas[idx - 1] : dataActual;
            const targetEval = isComparativa ? dataComparadas[idx - 1] : evaluacion;

            if (!targetData) return '';

            const obtenerNivelDeEval = (val: number, evalObj: any) => {
              if (!evalObj?.nivelYPuntaje || evalObj.nivelYPuntaje.length === 0) {
                return 'Nivel no definido';
              }
              const nivelesOrdenados = [...evalObj.nivelYPuntaje].sort((a, b) => (a.min || 0) - (b.min || 0));
              for (const nivelData of nivelesOrdenados) {
                const minPuntaje = nivelData.min || 0;
                const maxPuntaje = nivelData.max || Number.MAX_SAFE_INTEGER;
                if (nivelData.nivel?.toLowerCase() === 'previo al inicio') {
                  if (val > 0 && val <= maxPuntaje) {
                    return nivelData.nivel || 'Nivel no definido';
                  }
                } else {
                  if (val >= minPuntaje && val <= maxPuntaje) {
                    return nivelData.nivel || 'Nivel no definido';
                  }
                }
              }
              return 'Nivel no definido';
            };

            const nivel = obtenerNivelDeEval(targetData.puntajeMedia, targetEval);

            return [
              `Puntaje Promedio: ${targetData.puntajeMedia.toFixed(1)}`,
              `Nivel: ${nivel}`,
              `Estudiantes evaluados: ${targetData.totalEstudiantes}`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Puntaje',
          color: '#333',
          font: {
            size: 14
          }
        }
      }
    }
  };

  const opcionesGraficoBar = {
    ...opcionesGrafico,
    plugins: {
      ...opcionesGrafico.plugins,
      tooltip: {
        ...opcionesGrafico.plugins.tooltip,
        callbacks: {
          label: opcionesGrafico.plugins.tooltip.callbacks.label
        }
      }
    }
  };

  // Configuración del gráfico de líneas de niveles (Nivel en Eje X)
  const datasetsNiveles: any[] = [];

  if (dataActual) {
    datasetsNiveles.push({
      label: dataActual.nombre,
      data: [
        dataActual.niveles.find((n: any) => n.nivel?.toLowerCase() === 'previo al inicio')?.cantidadDeEstudiantes || 0,
        dataActual.niveles.find((n: any) => n.nivel?.toLowerCase() === 'en inicio')?.cantidadDeEstudiantes || 0,
        dataActual.niveles.find((n: any) => n.nivel?.toLowerCase() === 'en proceso')?.cantidadDeEstudiantes || 0,
        dataActual.niveles.find((n: any) => n.nivel?.toLowerCase() === 'satisfactorio')?.cantidadDeEstudiantes || 0
      ],
      borderColor: getColoresParaIndex(0).border,
      backgroundColor: getColoresParaIndex(0).bg,
      fill: false,
      tension: 0,
      pointBackgroundColor: getColoresParaIndex(0).border,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
      borderWidth: 3
    });
  }

  dataComparadas.forEach((d, idx) => {
    const colObj = getColoresParaIndex(idx + 1);
    datasetsNiveles.push({
      label: d.nombre,
      data: [
        d.niveles.find((n: any) => n.nivel?.toLowerCase() === 'previo al inicio')?.cantidadDeEstudiantes || 0,
        d.niveles.find((n: any) => n.nivel?.toLowerCase() === 'en inicio')?.cantidadDeEstudiantes || 0,
        d.niveles.find((n: any) => n.nivel?.toLowerCase() === 'en proceso')?.cantidadDeEstudiantes || 0,
        d.niveles.find((n: any) => n.nivel?.toLowerCase() === 'satisfactorio')?.cantidadDeEstudiantes || 0
      ],
      borderColor: colObj.border,
      backgroundColor: colObj.bg,
      borderDash: [6, 6], // Línea segmentada para diferenciar
      fill: false,
      tension: 0,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: colObj.border,
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
      borderWidth: 3
    });
  });

  const datosChartNiveles = {
    labels: ['Previo al Inicio', 'En Inicio', 'En Proceso', 'Satisfactorio'],
    datasets: datasetsNiveles
  };

  const opcionesGraficoNiveles = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    layout: {
      padding: {
        left: 20,
        right: 20
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#333',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Gráfico de tendencia por nivel de rendimiento',
        color: '#333',
        font: {
          size: 18
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#666',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return ` ${label}: ${value} estudiantes`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cantidad de Estudiantes',
          color: '#333',
          font: {
            size: 14
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Niveles de Rendimiento',
          color: '#333',
          font: {
            size: 14
          }
        }
      }
    }
  };

  // Cálculos de estudiantes y porcentajes por nivel para la comparativa matriz
  const totalActual = dataActual?.totalEstudiantes || 0;

  const obtenerDatosNivel = (nivelNombre: string) => {
    const cantActual = dataActual?.niveles.find((n: any) => n.nivel?.toLowerCase() === nivelNombre)?.cantidadDeEstudiantes || 0;
    const pctActual = totalActual > 0 ? (cantActual / totalActual) * 100 : 0;

    const comparativasArr = dataComparadas.map(d => {
      const totComp = d.totalEstudiantes;
      const cantComp = d.niveles.find((n: any) => n.nivel?.toLowerCase() === nivelNombre)?.cantidadDeEstudiantes || 0;
      const pctComp = totComp > 0 ? (cantComp / totComp) * 100 : 0;
      return {
        nombre: d.nombre,
        cant: cantComp,
        pct: pctComp.toFixed(1)
      };
    });

    return {
      cantActual,
      pctActual: pctActual.toFixed(1),
      comparativas: comparativasArr
    };
  };

  const datosSatis = obtenerDatosNivel('satisfactorio');
  const datosProce = obtenerDatosNivel('en proceso');
  const datosInicio = obtenerDatosNivel('en inicio');
  const datosPrevio = obtenerDatosNivel('previo al inicio');

  // Si está cargando y no hay datos actuales, mostrar loader
  if (loading && !dataActual) {
    return (
      <div className={styles.loaderWrapper}>
        <Loader
          size="large"
          variant="spinner"
          color="#4F46E5"
          text="Cargando datos de gráficos..."
        />
      </div>
    );
  }

  return (
    <div className={styles.overlayContainer}>
      {loadingComparadas && (
        <div className={styles.loadingOverlay}>
          <Loader
            size="medium"
            variant="spinner"
            color="#4F46E5"
            text="Cargando datos de comparación..."
          />
        </div>
      )}
      <div className={styles.container}>
        {/* Gráfico de Promedios */}
        <div className={styles.gridTwoCols}>
          <div className={styles.chartCard}>
            <div className={styles.chartContainer}>
              <Line options={opcionesGrafico} data={datosChart} />
            </div>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartContainer}>
              <Bar options={opcionesGraficoBar} data={datosChartBar} />
            </div>
          </div>
        </div>

        {/* Gráfico de Niveles de Rendimiento (Ancho Completo) */}
        <div className={styles.chartCard}>
          <div className={styles.chartContainer}>
            <Line options={opcionesGraficoNiveles} data={datosChartNiveles} />
          </div>
        </div>

        {/* Tabla / Matriz de Resumen Comparativo Múltiple */}
        <div className={styles.tableCard}>
          <h3 className={styles.tableTitle}>
            Resumen Comparativo
          </h3>

          <div className={styles.tableWrapper}>
            <table className={styles.comparisonTable}>
              <thead>
                <tr className={styles.tableHeaderRow}>
                  <th className={styles.tableHeaderCell}>Logro</th>
                  <th className={styles.tableHeaderCellRight}>Actual</th>
                  {dataComparadas.map((d, idx) => (
                    <th key={d.id} className={styles.tableHeaderCellRight} style={{ color: getColoresParaIndex(idx + 1).border }}>
                      Comp. {idx + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Total Evaluados */}
                <tr className={styles.totalRow}>
                  <td className={styles.tableBodyCell} style={{ fontWeight: 600 }}>Total Evaluados</td>
                  <td className={styles.cellActualTotal}>{totalActual}</td>
                  {dataComparadas.map((d, idx) => (
                    <td key={d.id} className={styles.tableBodyCellRight} style={{ color: getColoresParaIndex(idx + 1).border }}>
                      {d.totalEstudiantes}
                    </td>
                  ))}
                </tr>

                {/* Satisfactorio */}
                <tr className={styles.tableBodyRow}>
                  <td className={styles.achievementCell}>
                    <span className={styles.circleSatisfactorio} />
                    Satisfactorio
                  </td>
                  <td className={styles.tableBodyCellRight}>
                    {datosSatis.cantActual} <span className={styles.badgeSatisfactorio}>{datosSatis.pctActual}%</span>
                  </td>
                  {datosSatis.comparativas.map((c, idx) => (
                    <td key={idx} className={styles.tableBodyCellRight}>
                      {c.cant} <span className={styles.badgeSatisfactorio}>{c.pct}%</span>
                    </td>
                  ))}
                </tr>

                {/* En Proceso */}
                <tr className={styles.tableBodyRow}>
                  <td className={styles.achievementCell}>
                    <span className={styles.circleProceso} />
                    En Proceso
                  </td>
                  <td className={styles.tableBodyCellRight}>
                    {datosProce.cantActual} <span className={styles.badgeProceso}>{datosProce.pctActual}%</span>
                  </td>
                  {datosProce.comparativas.map((c, idx) => (
                    <td key={idx} className={styles.tableBodyCellRight}>
                      {c.cant} <span className={styles.badgeProceso}>{c.pct}%</span>
                    </td>
                  ))}
                </tr>

                {/* En Inicio */}
                <tr className={styles.tableBodyRow}>
                  <td className={styles.achievementCell}>
                    <span className={styles.circleInicio} />
                    En Inicio
                  </td>
                  <td className={styles.tableBodyCellRight}>
                    {datosInicio.cantActual} <span className={styles.badgeInicio}>{datosInicio.pctActual}%</span>
                  </td>
                  {datosInicio.comparativas.map((c, idx) => (
                    <td key={idx} className={styles.tableBodyCellRight}>
                      {c.cant} <span className={styles.badgeInicio}>{c.pct}%</span>
                    </td>
                  ))}
                </tr>

                {/* Previo al Inicio */}
                <tr className={styles.tableBodyRow}>
                  <td className={styles.achievementCell}>
                    <span className={styles.circleIndicator} style={{ backgroundColor: '#8B4513' }} />
                    Previo al Inicio
                  </td>
                  <td className={styles.tableBodyCellRight}>
                    {datosPrevio.cantActual} <span className={styles.badgePercent} style={{ color: '#8B4513', backgroundColor: 'rgba(139, 69, 19, 0.1)' }}>{datosPrevio.pctActual}%</span>
                  </td>
                  {datosPrevio.comparativas.map((c, idx) => (
                    <td key={idx} className={styles.tableBodyCellRight}>
                      {c.cant} <span className={styles.badgePercent} style={{ color: '#8B4513', backgroundColor: 'rgba(139, 69, 19, 0.1)' }}>{c.pct}%</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Glosario de Comparativas */}
          {dataComparadas.length > 0 && (
            <div className={styles.glossaryContainer}>
              {dataComparadas.map((d, idx) => (
                <div key={d.id} className={styles.glossaryItem}>
                  <span className={styles.glossaryCircle} style={{ backgroundColor: getColoresParaIndex(idx + 1).border }} />
                  <span><strong>Comp. {idx + 1}:</strong> {d.nombre}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GraficoTendencia