import { useGlobalContext } from '@/features/context/GlolbalContext';
import { DataEstadisticas } from '@/features/types/types';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import header from '@/assets/evaluacion-docente.jpg';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';
import { Bar, Pie, Radar, Line } from 'react-chartjs-2';
import { RiLoader4Line, RiInformationLine, RiPulseLine, RiRadarLine, RiBarChartGroupedLine } from 'react-icons/ri';
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores';
import UseEvaluacionDocentes from '@/features/hooks/UseEvaluacionDocentes';
import Image from 'next/image';
import styles from './styles.module.css';
import {
  sectionByGrade,
  ordernarAscDsc,
  regiones,
  genero,
} from '@/fuctions/regiones';
import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes';
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas';

import NoHayResultados from '@/components/no-hay-resultados';
import Loader from '@/components/loader/loader';
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

const Reportes = () => {
  const route = useRouter();
  const {
    currentUserData,
    dataEstadisticas,
    preguntasRespuestas,
    loaderPages,
    getPreguntaRespuestaDocentes,
    dataEvaluacionDocente,
    allEvaluacionesDirectorDocente,
    dataFiltradaEspecialistaDirectorTabla,
    dimensionesEspecialistas,
  } = useGlobalContext();
  const { reporteEvaluacionDocentes } = UseEvaluacionDocentes();
  const {
    getPreguntasRespuestasEspecialistas,
    getDataEvaluacion,
    reporteEvaluacionEspecialistas,
    evaluacionEspecialista,
    dataEvaluaciones,
    dataConsolidadoGlobal,
    filtrosEvaluacionEspecialistasSeguimientoRetroalimentacion,
    valueLoader,
    warning,
    getDimensionesEspecialistas,
    filtrarReporteEspecialistas,
    allEvaluacionesEspecialistas,
  } = UseEvaluacionEspecialistas();

  const [filtros, setFiltros] = useState({
    region: '',
    genero: '',
    idFase: '',
  });

  const handleChangeFiltros = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value,
    });
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      region: '',
      genero: '',
      idFase: '',
    });
  };

  // Obtener fases únicas existentes en las evaluaciones
  const fasesUnicas: { id: string; nombre: string }[] = [];
  allEvaluacionesEspecialistas.forEach((ev: any) => {
    if (ev.idFase && !fasesUnicas.find(f => f.id === ev.idFase)) {
      fasesUnicas.push({
        id: ev.idFase,
        nombre: (ev as any).faseNombre || ev.idFase,
      });
    }
  });

  useEffect(() => {
    if (allEvaluacionesEspecialistas.length > 0) {
      filtrarReporteEspecialistas(allEvaluacionesEspecialistas, filtros);
    }
  }, [filtros, allEvaluacionesEspecialistas]);

  const iterateData = (data: DataEstadisticas, labels: string[]) => {
    return {
      labels: labels.length > 0 ? labels : ['nivel 1', 'nivel 2', 'nivel 3', 'nivel 4'],
      datasets: [
        {
          label: 'Estadísticas de evaluación',
          data: [data.a || 0, data.b || 0, data.c || 0, data.d || 0],
          backgroundColor: [
            'rgba(148, 163, 184, 0.6)', // Slate 400
            'rgba(96, 165, 250, 0.6)', // Blue 400
            'rgba(52, 211, 153, 0.6)', // Emerald 400
            'rgba(129, 140, 248, 0.6)', // Indigo 400
          ],
          borderColor: [
            '#64748b', // Slate 500
            '#3b82f6', // Blue 500
            '#10b981', // Emerald 500
            '#6366f1', // Indigo 500
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const options = {
    plugins: {
      legend: {
        position: 'center' as const,
      },
      title: {
        display: true,
        text: 'estadística de evalulación',
      },
    },
  };

  const pieOptions = {
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Distribución Global de Resultados',
      },
    },
  };

  const getPieData = () => {
    if (!dataConsolidadoGlobal || !dataEvaluacionDocente.escala) return { labels: [], datasets: [] };

    // Mapeamos los datos del consolidado global usando el índice de la escala
    const scale = dataEvaluacionDocente.escala;
    const dataValues = scale.map((_, index) => {
      switch (index) {
        case 0: return dataConsolidadoGlobal.a || 0;
        case 1: return dataConsolidadoGlobal.b || 0;
        case 2: return dataConsolidadoGlobal.c || 0;
        case 3: return dataConsolidadoGlobal.d || 0;
        default: return 0;
      }
    });

    const backgroundColors = [
      'rgba(148, 163, 184, 0.8)', // Slate 400
      'rgba(96, 165, 250, 0.8)', // Blue 400
      'rgba(52, 211, 153, 0.8)', // Emerald 400
      'rgba(129, 140, 248, 0.8)', // Indigo 400
    ];

    const borderColors = [
      '#64748b', // Slate 500
      '#3b82f6', // Blue 500
      '#10b981', // Emerald 500
      '#6366f1', // Indigo 500
    ];

    return {
      labels: scale.map(e => e.descripcion || ''),
      datasets: [
        {
          data: dataValues,
          backgroundColor: backgroundColors.slice(0, scale.length),
          borderColor: borderColors.slice(0, scale.length),
          borderWidth: 1,
        },
      ],
    };
  };

  const getDimensionData = () => {
    if (!dataEvaluacionDocente.escala) return { labels: [], datasets: [] };

    const labels = dimensionesEspecialistas.map((d: any) => d.nombre || '');
    const scale = dataEvaluacionDocente.escala;

    const data = dimensionesEspecialistas.map((dim: any) => {
      const preguntasDim = getPreguntaRespuestaDocentes.filter(p => p.dimensionId === dim.id);
      if (preguntasDim.length === 0) return 0;

      const idsPreguntas = preguntasDim.map(p => p.order?.toString() || p.id);
      const statsDim = dataEvaluaciones.filter(stat => idsPreguntas.includes(stat.id));

      if (statsDim.length === 0) return 0;

      const totalPuntaje = statsDim.reduce((acc, stat) => {
        // Multiplicamos cada conteo (a,b,c,d) por el valor real asignado en la escala
        const valA = (stat.a || 0) * (scale[0]?.value || 0);
        const valB = (stat.b || 0) * (scale[1]?.value || 0);
        const valC = (stat.c || 0) * (scale[2]?.value || 0);
        const valD = (stat.d || 0) * (scale[3]?.value || 0);
        return acc + valA + valB + valC + valD;
      }, 0);

      const totalRespuestas = statsDim.reduce((acc, stat) => acc + (stat.total || 0), 0);
      return totalRespuestas > 0 ? (totalPuntaje / totalRespuestas).toFixed(2) : 0;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Promedio por Dominio',
          data,
          backgroundColor: 'rgba(59, 130, 246, 0.6)', // Blue 500
          borderColor: '#2563eb', // Blue 600
          borderWidth: 1,
        },
      ],
    };
  };

  const getLevelsData = () => {
    const niveles = dataEvaluacionDocente.niveles || [];
    if (niveles.length === 0 || !dataFiltradaEspecialistaDirectorTabla) return { labels: [], datasets: [] };

    const counts = niveles.map(nivel => {
      return dataFiltradaEspecialistaDirectorTabla.filter(reporte => {
        const score = reporte.calificacion || 0;
        return score >= (nivel.min || 0) && score <= (nivel.max || 0);
      }).length;
    });

    return {
      labels: niveles.map(n => n.nivel || ''),
      datasets: [
        {
          label: 'Especialistas por Nivel',
          data: counts,
          backgroundColor: niveles.map(n => n.color || 'rgba(59, 130, 246, 0.6)'),
          borderColor: niveles.map(n => n.color || '#2563eb'),
          borderWidth: 1,
        },
      ],
    };
  };

  const getRadarData = () => {
    const labels = dimensionesEspecialistas.map((d: any) => d.nombre || '');
    const scale = dataEvaluacionDocente.escala || [];

    const data = dimensionesEspecialistas.map((dim: any) => {
      const preguntasDim = getPreguntaRespuestaDocentes.filter(p => p.dimensionId === dim.id);
      if (preguntasDim.length === 0) return 0;

      const idsPreguntas = preguntasDim.map(p => p.id);
      const statsDim = dataEvaluaciones.filter(stat => idsPreguntas.includes(stat.id));

      if (statsDim.length === 0) return 0;

      const totalPuntaje = statsDim.reduce((acc, stat) => {
        const valA = (stat.a || 0) * (scale[0]?.value || 0);
        const valB = (stat.b || 0) * (scale[1]?.value || 0);
        const valC = (stat.c || 0) * (scale[2]?.value || 0);
        const valD = (stat.d || 0) * (scale[3]?.value || 0);
        return acc + valA + valB + valC + valD;
      }, 0);

      const totalRespuestas = statsDim.reduce((acc, stat) => acc + (stat.total || 0), 0);
      return totalRespuestas > 0 ? (totalPuntaje / totalRespuestas).toFixed(2) : 0;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Perfil de Competencias',
          data,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: '#3b82f6',
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#3b82f6',
        },
      ],
    };
  };

  const getTrendData = () => {
    const monthlyData: { [key: string]: { total: number, count: number } } = {};

    allEvaluacionesEspecialistas.forEach(ev => {
      if (!ev.fechaCreacion) return;

      let date;
      if (typeof ev.fechaCreacion === 'string') date = new Date(ev.fechaCreacion);
      else if ((ev.fechaCreacion as any).toDate) date = (ev.fechaCreacion as any).toDate();
      else date = new Date();

      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { total: 0, count: 0 };
      }

      monthlyData[monthYear].total += ev.calificacion || 0;
      monthlyData[monthYear].count += 1;
    });

    const sortedLabels = Object.keys(monthlyData).sort();
    const dataPoints = sortedLabels.map(label => (monthlyData[label].total / monthlyData[label].count).toFixed(2));

    return {
      labels: sortedLabels,
      datasets: [
        {
          label: 'Promedio Mensual',
          data: dataPoints,
          fill: true,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
        },
      ],
    };
  };

  const getItemAnalysisData = () => {
    const sortedItems = [...dataEvaluaciones]
      .filter(item => item.total && item.total > 0)
      .sort((a, b) => {
        const scoreA = ((a.a || 0) * 1 + (a.b || 0) * 2 + (a.c || 0) * 3 + (a.d || 0) * 4) / a.total!;
        const scoreB = ((b.a || 0) * 1 + (b.b || 0) * 2 + (b.c || 0) * 3 + (b.d || 0) * 4) / b.total!;
        return scoreA - scoreB;
      })
      .slice(0, 5);

    return {
      labels: sortedItems.map(item => {
        const question = getPreguntaRespuestaDocentes.find(p => p.id === item.id || p.order?.toString() === item.id);
        return question ? question.criterio?.substring(0, 30) + '...' : item.id;
      }),
      datasets: [
        {
          label: 'Puntaje Promedio (Menores)',
          data: sortedItems.map(item => {
            const score = ((item.a || 0) * 1 + (item.b || 0) * 2 + (item.c || 0) * 3 + (item.d || 0) * 4) / item.total!;
            return score.toFixed(2);
          }),
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: '#ef4444',
          borderWidth: 1,
        },
      ],
    };
  };

  const getUGELPerformanceData = () => {
    const performanceByUGEL: { [key: string]: { total: number, count: number, name: string } } = {};

    allEvaluacionesEspecialistas.forEach(ev => {
      if (!ev.region) return;
      const ugelId = ev.region.toString();
      const ugelName = regiones.find(r => r.id.toString() === ugelId)?.region || ugelId;

      if (!performanceByUGEL[ugelId]) {
        performanceByUGEL[ugelId] = { total: 0, count: 0, name: ugelName };
      }

      performanceByUGEL[ugelId].total += ev.calificacion || 0;
      performanceByUGEL[ugelId].count += 1;
    });

    return Object.values(performanceByUGEL).map(item => ({
      name: item.name,
      avg: (item.total / item.count).toFixed(2)
    })).sort((a, b) => Number(b.avg) - Number(a.avg));
  };

  useEffect(() => {
    reporteEvaluacionEspecialistas(`${route.query.idEvaluacion}`);
    getPreguntasRespuestasEspecialistas(`${route.query.idEvaluacion}`);
    getDimensionesEspecialistas(`${route.query.idEvaluacion}`);
    getDataEvaluacion(`${route.query.idEvaluacion}`);
  }, [route.query.idEvaluacion, currentUserData.dni]);

  console.log('warning', warning);
  console.log('dataEvaluacionDocente', dataEvaluacionDocente);
  return (
    <>
      {loaderPages ? (
        <div className={styles.loaderContainer}>
          <RiLoader4Line className={styles.loaderIcon} />
          <p className={styles.loaderText}>buscando resultados...</p>
        </div>
      ) : (
        <div className={styles.container}>
          <div className={styles.tableContainer}>
            <div className={styles.tableSection}>
              <div>
                <div className={styles.filtersContainer}>
                  <div className={styles.filterGroup}>
                    <label htmlFor="region" className={styles.filterLabel}>UGEL</label>
                    <div className={styles.selectWrapper}>
                      <select
                        name="region"
                        id="region"
                        value={filtros.region}
                        onChange={handleChangeFiltros}
                        className={styles.select}
                      >
                        <option value="">Todas las UGELs</option>
                        {regiones.map((region) => (
                          <option key={region.id} value={region.id.toString()}>
                            {region.region}
                          </option>
                        ))}
                      </select>
                      <div className={styles.selectIcon}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  <div className={styles.filterGroup}>
                    <label htmlFor="genero" className={styles.filterLabel}>Género</label>
                    <div className={styles.selectWrapper}>
                      <select
                        name="genero"
                        id="genero"
                        value={filtros.genero}
                        onChange={handleChangeFiltros}
                        className={styles.select}
                      >
                        <option value="">Todos los géneros</option>
                        {genero.map((gen) => (
                          <option key={gen.id} value={gen.id.toString()}>
                            {gen.name}
                          </option>
                        ))}
                      </select>
                      <div className={styles.selectIcon}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  <div className={styles.filterGroup}>
                    <label htmlFor="idFase" className={styles.filterLabel}>Fase de Evaluación</label>
                    <div className={styles.selectWrapper}>
                      <select
                        name="idFase"
                        id="idFase"
                        value={filtros.idFase}
                        onChange={handleChangeFiltros}
                        className={styles.select}
                      >
                        <option value="">Todas las fases</option>
                        {fasesUnicas.map((fase) => (
                          <option key={fase.id} value={fase.id}>
                            {fase.nombre}
                          </option>
                        ))}
                      </select>
                      <div className={styles.selectIcon}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  {(filtros.region !== '' || filtros.genero !== '' || filtros.idFase !== '') && (
                    <button
                      onClick={handleLimpiarFiltros}
                      className={styles.clearFilterBtn}
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
                {valueLoader === false ? (
                  warning ? (
                    <NoHayResultados />
                  ) : (
                    <>
                      <div className={styles.globalChartsGrid}>
                        <div className={styles.chartContainer}>
                          <h3 className={styles.sectionTitle}>
                            <span className={styles.sectionTitleIndicator}></span>
                            <span>Consolidado Global de Resultados</span>
                          </h3>
                          <div className={styles.pieChartWrapper}>
                            <Pie options={pieOptions} data={getPieData()} />
                          </div>
                          <div className={styles.statsGrid}>
                            <div className={styles.statItem}>
                              <span className={styles.statLabel}>Total Evaluados</span>
                              <span className={styles.statValue}>{dataFiltradaEspecialistaDirectorTabla?.length || 0}</span>
                            </div>
                            {dataEvaluacionDocente.escala?.map((item, index) => {
                              const values = [dataConsolidadoGlobal?.a, dataConsolidadoGlobal?.b, dataConsolidadoGlobal?.c, dataConsolidadoGlobal?.d];
                              return (
                                <div key={index} className={styles.statItem}>
                                  <span className={styles.statLabel}>{item.descripcion}</span>
                                  <span className={styles.statValue}>{values[index] || 0}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {dataEvaluacionDocente.niveles && dataEvaluacionDocente.niveles.length > 0 && (
                          <div className={styles.chartContainer}>
                            <h3 className={styles.sectionTitle}>
                              <span className={styles.sectionTitleIndicator}></span>
                              <span>Distribución por Niveles de Logro</span>
                            </h3>
                            <div className={styles.pieChartWrapper}>
                              <Pie
                                options={{
                                  ...pieOptions,
                                  plugins: { ...pieOptions.plugins, title: { ...pieOptions.plugins.title, text: 'Especialistas por Nivel de Logro' } }
                                }}
                                data={getLevelsData()}
                              />
                            </div>
                            <div className={styles.statsGrid}>
                              {dataEvaluacionDocente.niveles.map((nivel, index) => {
                                const count = dataFiltradaEspecialistaDirectorTabla.filter(reporte => {
                                  const score = reporte.calificacion || 0;
                                  return score >= (nivel.min || 0) && score <= (nivel.max || 0);
                                }).length;
                                return (
                                  <div key={index} className={styles.statItem}>
                                    <span className={styles.statLabel} style={{ color: nivel.color }}>{nivel.nivel}</span>
                                    <span className={styles.statValue}>{count}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className={styles.chartContainer}>
                          <h3 className={styles.sectionTitle}>
                            <span className={styles.sectionTitleIndicator}></span>
                            <span>Puntaje Promedio por Dominio</span>
                          </h3>
                          <div className={styles.chartWrapper}>
                            <Bar
                              options={{
                                ...options,
                                indexAxis: 'y' as const,
                                plugins: { ...options.plugins, title: { ...options.plugins.title, text: 'Rendimiento por Dominio' } }
                              }}
                              data={getDimensionData()}
                            />
                          </div>
                        </div>
                      </div>

                      <div className={styles.advancedAnalyticsSection}>
                        <div className={styles.analyticsHeader}>
                          <h2 className={styles.analyticsTitle}>Panel de Analítica Avanzada</h2>
                          <p className={styles.analyticsSubtitle}>Interpretación estratégica y tendencias de desempeño</p>
                        </div>

                        <div className={styles.globalChartsGrid}>
                          {false && (
                            <div className={styles.chartContainer}>
                              <h3 className={styles.sectionTitle}>
                                <RiRadarLine style={{ color: '#3b82f6' }} />
                                <span>Perfil Reticular de Competencias</span>
                              </h3>
                              <div className={styles.infoBox}>
                                <div className={styles.infoTitle}>
                                  <RiInformationLine /> ¿Qué mide este gráfico?
                                </div>
                                <p className={styles.infoContent}>
                                  Muestra el equilibrio entre los diferentes <span className={styles.infoHighlight}>Dominios o Dimensiones</span>.
                                  Un polígono regular indica un desempeño equilibrado, mientras que picos hacia afuera señalan fortalezas y hacia adentro áreas críticas.
                                </p>
                              </div>
                              <div className={styles.radarChartWrapper}>
                                <Radar
                                  data={getRadarData()}
                                  options={{
                                    scales: {
                                      r: {
                                        beginAtZero: true,
                                        max: (dataEvaluacionDocente.escala || []).at(-1)?.value || 4
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {false && (
                            <div className={styles.chartContainer}>
                              <h3 className={styles.sectionTitle}>
                                <RiPulseLine style={{ color: '#10b981' }} />
                                <span>Tendencia de Mejora Temporal</span>
                              </h3>
                              <div className={styles.infoBox}>
                                <div className={styles.infoTitle}>
                                  <RiInformationLine /> ¿Cómo interpretarlo?
                                </div>
                                <p className={styles.infoContent}>
                                  Rastrea el <span className={styles.infoHighlight}>crecimiento del promedio de calificación</span> a lo largo de los meses.
                                  Una línea ascendente valida que el acompañamiento y monitoreo está teniendo un impacto positivo real.
                                </p>
                              </div>
                              <div className={styles.chartWrapper}>
                                <Line
                                  data={getTrendData()}
                                  options={{
                                    scales: {
                                      y: { beginAtZero: true }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {false && (
                            <div className={`${styles.chartContainer} ${styles.fullWidthChart}`}>
                              <h3 className={styles.sectionTitle}>
                                <RiBarChartGroupedLine style={{ color: '#ef4444' }} />
                                <span>Análisis de Brechas Críticas (Top 5 Criterios con Menor Puntaje)</span>
                              </h3>
                              <div className={styles.infoBox}>
                                <div className={styles.infoTitle}>
                                  <RiInformationLine /> Uso Estratégico
                                </div>
                                <p className={styles.infoContent}>
                                  Identifica los <span className={styles.infoHighlight}>5 criterios específicos</span> donde el equipo de especialistas tiene mayor dificultad.
                                  Estos puntos deben ser la prioridad inmediata para las próximas capacitaciones o sesiones de retroalimentación colectiva.
                                </p>
                              </div>
                              <div style={{ height: '300px' }}>
                                <Bar
                                  data={getItemAnalysisData()}
                                  options={{
                                    indexAxis: 'y' as const,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } }
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {false && (
                            <div className={`${styles.chartContainer} ${styles.fullWidthChart}`}>
                              <h3 className={styles.sectionTitle}>
                                <RiBarChartGroupedLine style={{ color: '#f59e0b' }} />
                                <span>Mapa de Rendimiento por UGEL</span>
                              </h3>
                              <div className={styles.infoBox}>
                                <div className={styles.infoTitle}>
                                  <RiInformationLine /> Análisis Territorial
                                </div>
                                <p className={styles.infoContent}>
                                  Compara el <span className={styles.infoHighlight}>desempeño promedio de los especialistas</span> agrupados por su respectiva UGEL.
                                  Permite identificar qué regiones territoriales están liderando y cuáles requieren un fortalecimiento focalizado.
                                </p>
                              </div>
                              <div className={styles.heatmapGrid}>
                                {getUGELPerformanceData().map((ugel, idx) => {
                                  const avgValue = Number(ugel.avg);
                                  const maxScale = dataEvaluacionDocente.escala?.[dataEvaluacionDocente.escala.length - 1]?.value || 4;
                                  const ratio = avgValue / maxScale;

                                  // Dynamic color from Red to Green
                                  const red = Math.round(239 * (1 - ratio) + 16 * ratio);
                                  const green = Math.round(68 * (1 - ratio) + 185 * ratio);
                                  const blue = Math.round(68 * (1 - ratio) + 129 * ratio);

                                  return (
                                    <div key={idx} className={styles.heatmapCell} style={{ borderBottom: `4px solid rgb(${red}, ${green}, ${blue})` }}>
                                      <span className={styles.heatmapValue}>{ugel.avg}</span>
                                      <span className={styles.heatmapLabel}>{ugel.name}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={styles.perQuestionGrid}>
                        {getPreguntaRespuestaDocentes.map((pregunta, index) => {
                          const stats = dataEvaluaciones.find(s => s.id === pregunta.id || s.id === pregunta.order?.toString());
                          if (!stats) return null;

                          return (
                            <div key={index} className={styles.chartContainer}>
                              <h3 className={styles.sectionTitle}>
                                <span className={styles.sectionTitleIndicator}></span>
                                <span>
                                  {pregunta.subOrden || pregunta.order}.
                                </span>
                                <span>{pregunta.criterio}</span>
                              </h3>
                              <div className={styles.chartWrapper}>
                                <Bar
                                  options={{
                                    ...options,
                                    plugins: {
                                      ...options.plugins,
                                      title: {
                                        display: true,
                                        text: `Resultados: ${pregunta.criterio?.substring(0, 50)}...`,
                                      }
                                    }
                                  }}
                                  data={iterateData(
                                    stats,
                                    dataEvaluacionDocente.escala?.map(e => e.descripcion || '') || []
                                  )}
                                />
                              </div>
                              <div className={styles.statsGrid}>
                                {dataEvaluacionDocente.escala?.map((item, scaleIndex) => {
                                  const values = [stats.a, stats.b, stats.c, stats.d];
                                  return (
                                    <div key={scaleIndex} className={styles.statItem}>
                                      <span className={styles.statLabel}>{item.descripcion}</span>
                                      <span className={styles.statValue}>{values[scaleIndex] || 0}</span>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className={styles.totalBadge}>
                                Total: {stats.total} respuestas
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )
                ) : (
                  <Loader size="large" text="buscando resultados..." variant="spinner" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Reportes;
Reportes.Auth = PrivateRouteAdmins;
