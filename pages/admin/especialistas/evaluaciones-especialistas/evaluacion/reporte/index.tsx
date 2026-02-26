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
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { RiLoader4Line } from 'react-icons/ri';
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
import { currentMonth, getAllMonths } from '@/fuctions/dates';
import NoHayResultados from '@/components/no-hay-resultados';
import Loader from '@/components/loader/loader';
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
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
    mes: '',
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
      mes: '',
    });
  };

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
                    <label htmlFor="mes" className={styles.filterLabel}>Mes y Año</label>
                    <div className={styles.selectWrapper}>
                      <input
                        type="month"
                        name="mes"
                        id="mes"
                        value={filtros.mes}
                        onChange={handleChangeFiltros}
                        className={styles.select}
                      />
                    </div>
                  </div>

                  {(filtros.region !== '' || filtros.genero !== '' || filtros.mes !== '') && (
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
                              <span className={styles.statLabel}>Total Respuestas</span>
                              <span className={styles.statValue}>{dataConsolidadoGlobal?.total || 0}</span>
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
