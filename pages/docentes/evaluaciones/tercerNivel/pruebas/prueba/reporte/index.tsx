import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useReporteDocente } from '@/features/hooks/useReporteDocente';
import { Alternativa, DataEstadisticas, PreguntasRespuestas } from '@/features/types/types';
import { useRouter } from 'next/router';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  ChartData,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { RiLoader4Line } from 'react-icons/ri';
import * as XLSX from 'xlsx';
import { MdDeleteForever } from 'react-icons/md';
import DeleteEstudiante from '@/modals/deleteEstudiante';
import styles from './reporte.module.css';
import { currentMonth, getAllMonths, getMonthName } from '@/fuctions/dates';
import { ordernarAscDsc } from '@/fuctions/regiones';
import { read, utils, writeFile } from 'xlsx';
import { exportEstudiantesToExcel } from '@/features/utils/excelExport';
import Link from 'next/link';
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Reportes = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [showTable, setShowtable] = useState<boolean>(false);
  const [showDeleteEstudiante, setShowDeleteEstudiante] = useState<boolean>(false);
  const route = useRouter();
  const {
    estudiantes,
    currentUserData,
    dataEstadisticas,
    preguntasRespuestas,
    loaderPages,
    loaderReporteDirector,
    warningEvaEstudianteSinRegistro,
  } = useGlobalContext();
  const { estudiantesQueDieronExamen, filtroEstudiantes, estadisticasEstudiantesDelDocente } =
    useReporteDocente();
  const { getPreguntasRespuestas } = useAgregarEvaluaciones();
  const [idEstudiante, setIdEstudiante] = useState<string>('');
  const [monthSelected, setMonthSelected] = useState<number>(currentMonth);
  const [order, setOrder] = useState<number>(0);
  const handleShowTable = () => {
    setShowtable(!showTable);
  };

  const handleExportToExcel = () => {
    setLoading(true);
    try {
      const fileName = `estudiantes_${currentUserData.dni}_${getMonthName(monthSelected)}.xlsx`;
      exportEstudiantesToExcel(estudiantes, fileName);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
    } finally {
      setLoading(false);
    }
  };

  const iterateData = (data: DataEstadisticas, respuesta: string) => {
    return {
      labels: data.d === undefined ? ['a', 'b', 'c'] : ['a', 'b', 'c', 'd'],
      datasets: [
        {
          label: 'estadisticas de respuesta',
          data: [data.a, data.b, data.c, data.d !== 0 && data.d],
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(255, 159, 64, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(255, 159, 64, 0.2)',
            'rgba(255, 205, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(201, 203, 207, 0.2)',
          ],
          borderColor: [
            'rgb(255, 99, 132)',
            'rgb(255, 159, 64)',
            'rgb(255, 205, 86)',
            'rgb(75, 192, 192)',
            'rgb(54, 162, 235)',
            'rgb(153, 102, 255)',
            'rgb(201, 203, 207)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  useEffect(() => {
    const idExamen = route.query.idExamen as string;
    if (idExamen) {
      estadisticasEstudiantesDelDocente(idExamen, monthSelected);
      getPreguntasRespuestas(idExamen);
      setMonthSelected(currentMonth);
    }
  }, [route.query.idExamen, currentUserData.dni]);



  useEffect(() => {
    const idExamen = route.query.idExamen as string;
    if (idExamen) {
      estadisticasEstudiantesDelDocente(idExamen, monthSelected);
    }
  }, [monthSelected]);

  // Crear un mapa optimizado de preguntas por ID para evitar búsquedas repetidas O(1) en lugar de O(n)
  const preguntasMap = useMemo(() => {
    const map = new Map<string, PreguntasRespuestas>();
    preguntasRespuestas.forEach(pregunta => {
      if (pregunta.id) {
        map.set(pregunta.id, pregunta);
      }
    });
    return map;
  }, [preguntasRespuestas]);

  // Ordenar dataEstadisticas por el order de las preguntas correspondientes
  const dataEstadisticasOrdenadas = useMemo(() => {
    if (!dataEstadisticas || !preguntasRespuestas.length) return dataEstadisticas;
    
    return [...dataEstadisticas].sort((a, b) => {
      const preguntaA = preguntasMap.get(a.id || '');
      const preguntaB = preguntasMap.get(b.id || '');
      
      const orderA = preguntaA?.order || 0;
      const orderB = preguntaB?.order || 0;
      
      return orderA - orderB;
    });
  }, [dataEstadisticas, preguntasMap]);

  const options = {
    plugins: {
      legend: {
        position: 'center' as const,
      },
      title: {
        display: true,
        text: 'estadistica de respuestas',
      },
    },
  };

  // Función optimizada para renderizar pregunta usando el mapa
  const renderPregunta = useCallback((idPregunta: string) => {
    const pregunta = preguntasMap.get(idPregunta);
    if (!pregunta) {
      return <p>Pregunta no encontrada</p>;
    }
    return (
      <>
        <h3 className={styles.questionTitle}>
          {pregunta.pregunta}
        </h3>
        <h4 className={styles.questionSubtitle}>
          <strong>Actuación</strong>: {pregunta.preguntaDocente}
        </h4>
      </>
    );
  }, [preguntasMap]);

  // Función optimizada para obtener respuesta usando el mapa
  const obtenerRespuestaPorId = useCallback((idPregunta: string): string => {
    const pregunta = preguntasMap.get(idPregunta);
    return pregunta?.respuesta || '';
  }, [preguntasMap]);

  const handleValidateRespuesta = (data: PreguntasRespuestas) => {
    const rta: Alternativa | undefined = data.alternativas?.find((r) => r.selected === true);
    if (rta?.alternativa) {
      if (rta.alternativa.toLowerCase() === data.respuesta?.toLowerCase()) {
        return <div className={styles.correctAnswer}>si</div>;
      } else {
        return <div className={styles.incorrectAnswer}>no</div>;
      }
    }
  };

  const handleShowModalDelete = () => {
    setShowDeleteEstudiante(!showDeleteEstudiante);
  };
  const handleChangeMonth = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonthSelected(Number(e.target.value));
  };
  const handleChangeOrder = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrder(Number(e.target.value));
  };
  const handleOrder = () => {
    console.log('order', order);
    filtroEstudiantes(estudiantes, order);
  };

  // Verificar si existen valores válidos para puntaje y nivel
  const hasValidPuntajeNivel = () => {
    return estudiantes?.some(
      (estudiante) =>
        estudiante.puntaje !== undefined &&
        estudiante.puntaje !== null &&
        estudiante.nivel !== undefined &&
        estudiante.nivel !== null &&
        estudiante.nivel !== ''
    );
  };

  console.log('estudiantes', estudiantes);
  return (
    <>
      {showDeleteEstudiante && (
        <DeleteEstudiante
          estudiantes={estudiantes}
          idExamen={`${route.query.idExamen}`}
          idEstudiante={idEstudiante}
          monthSelected={monthSelected}
          handleShowModalDelete={handleShowModalDelete}
        />
      )}
      {loaderReporteDirector ? (
        <div className={styles.loaderContainer}>
          <div className={styles.loaderContent}>
            <RiLoader4Line className={styles.loaderIcon} />
            <span className={styles.loaderText}>...cargando</span>
          </div>
        </div>
      ) : (
        <div className={styles.container}>
          <div className={styles.content}>
            <div className={styles.headerActions}>
              <div onClick={handleShowTable} className={styles.toggleButton}>
                {showTable ? 'ocultar tabla de estudiantes' : 'mostrar tabla de estudiantes'}
              </div>
              {showTable && (
                <button
                  onClick={handleExportToExcel}
                  disabled={loading}
                  className={styles.exportButton}
                >
                  {loading ? <RiLoader4Line className={styles.loaderIcon} /> : 'Exportar a Excel'}
                </button>
              )}
            </div>
            {showTable ? (
              <>
                <div className={styles.exportContainer}>
                  <div className={styles.selectContainer}>
                    <label htmlFor="monthSelect" className={styles.selectLabel}>
                      Ordernar por:
                    </label>
                    <div>
                      <select onChange={handleChangeOrder} className={styles.exportSelect}>
                        <option>--order por--</option>
                        {ordernarAscDsc.map((order) => (
                          <option key={order.id} value={order.id}>
                            {order.name}
                          </option>
                        ))}
                      </select>
                      <button className={styles.buttonOrdenar} onClick={handleOrder}>
                        ordenar
                      </button>
                    </div>
                  </div>
                  <div className={styles.selectContainer}>
                    <label htmlFor="monthSelect" className={styles.selectLabel}>
                      Seleccionar mes:
                    </label>
                    <select
                      id="monthSelect"
                      onChange={handleChangeMonth}
                      value={monthSelected}
                      className={styles.exportSelect}
                      aria-label="Seleccionar mes para el reporte"
                    >
                      <option value={currentMonth}>{getMonthName(currentMonth)}</option>
                      {getAllMonths.slice(0, currentMonth + 1).map((month) => (
                        <option key={month.id} value={month.id}>
                          {month.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead className={styles.tableHeader}>
                      <tr>
                        <th></th>
                        <th>#</th>
                        <th>N-A</th>
                        <th>r.c</th>
                        <th>t.p.</th>
                        {hasValidPuntajeNivel() && <th>puntaje</th>}
                        {hasValidPuntajeNivel() && <th>nivel</th>}
                        {preguntasRespuestas.map((pr, index) => {
                          return (
                            <th key={pr.order}>
                              <button className={styles.questionButton} popoverTarget={`${pr.order}`}>
                                {/* {pr.order} */}
                                {index + 1}
                              </button>
                              <div
                                className={styles.questionPopover}
                                popover="auto"
                                id={`${pr.order}`}
                              >
                                <div>
                                  <span>
                                    {/* {pr.order}. Actuación: */}
                                    {index + 1}. Actuación:
                                  </span>
                                  <span>{pr.preguntaDocente}</span>
                                </div>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className={styles.tableBody}>
                      {!warningEvaEstudianteSinRegistro ? (
                        estudiantes?.map((dir, index) => {
                          return (
                            <tr key={index}>
                              <td>
                                <MdDeleteForever
                                  onClick={() => {
                                    handleShowModalDelete();
                                    setIdEstudiante(`${dir.dni}`);
                                  }}
                                  className={styles.deleteIcon}
                                />
                              </td>
                              <td>{index + 1}</td>
                              <td>
                                
                                <Link
                                  href={`/docentes/evaluaciones/tercerNivel/pruebas/prueba/reporte/actualizar-evaluacion?idExamen=${route.query.idExamen}&idEstudiante=${dir.dni}`}
                                >
                                  {dir.nombresApellidos}
                                </Link>
                              </td>
                              <td>{dir.respuestasCorrectas}</td>
                              <td>{dir.totalPreguntas}</td>
                              {hasValidPuntajeNivel() && <td>{dir.puntaje}</td>}
                              {hasValidPuntajeNivel() && <td>{dir.nivel}</td>}
                              {dir.respuestas?.map((res) => {
                                return <td key={res.order}>{handleValidateRespuesta(res)}</td>;
                              })}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <th></th>
                          <th className={styles.warningContainer}>
                            {warningEvaEstudianteSinRegistro}
                          </th>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
            <h1 className={styles.title}>reporte de evaluación</h1>
            <div>
              <div>
                {warningEvaEstudianteSinRegistro ? (
                  <div className={styles.warningContainer}>{warningEvaEstudianteSinRegistro}</div>
                ) : (
                  dataEstadisticasOrdenadas?.map((dat, index) => {
                    const pregunta = preguntasMap.get(dat.id || '');
                    const numeroOrden = pregunta?.order || index + 1;
                    return (
                      <div key={dat.id || index} className={styles.questionContainer}>
                        <div>{index + 1}.{renderPregunta(`${dat.id}`)}</div>
                        <div className={styles.chartContainer}>
                          <div className={styles.chartWrapper}>
                            <Bar
                              options={options}
                              data={iterateData(
                                dat,
                                obtenerRespuestaPorId(`${dat.id}`)
                              )}
                            />
                          </div>
                          <div className={styles.statsContainer}>
                            <p>
                              {dat.a} |{' '}
                              {dat.total === 0
                                ? 0
                                : ((100 * Number(dat.a)) / Number(dat.total)).toFixed(0)}{' '}
                              %
                            </p>
                            <p>
                              {dat.b} |
                              {dat.total === 0
                                ? 0
                                : ((100 * Number(dat.b)) / Number(dat.total)).toFixed(0)}
                              %
                            </p>
                            <p>
                              {dat.c} |{' '}
                              {dat.total === 0
                                ? 0
                                : ((100 * Number(dat.c)) / Number(dat.total)).toFixed(0)}
                              %
                            </p>
                            {dat.d && (
                              <p>
                                {dat.d} |{' '}
                                {dat.total === 0
                                  ? 0
                                  : ((100 * Number(dat.d)) / Number(dat.total)).toFixed(0)}
                                %
                              </p>
                            )}
                          </div>
                          <div className={styles.answerContainer}>
                            respuesta:
                            <span className={styles.answerText}>
                              {obtenerRespuestaPorId(`${dat.id}`)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
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
Reportes.Auth = PrivateRouteDocentes;
