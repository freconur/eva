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
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { RiLoader4Line } from 'react-icons/ri';
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores';
import UseEvaluacionDocentes from '@/features/hooks/UseEvaluacionDocentes';
import Image from 'next/image';
import styles from './styles.module.css';
import {
  sectionByGrade,
  ordernarAscDsc,
  niveles,
  regiones,
  area,
  caracteristicasDirectivo,
  genero,
} from '@/fuctions/regiones';
import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes';
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas';
import { currentMonth, getAllMonths } from '@/fuctions/dates';
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
  } = useGlobalContext();
  const { reporteEvaluacionDocentes } = UseEvaluacionDocentes();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const {
    reporteTablaEvaluacionEspecialista,
    getPreguntasRespuestasEspecialistas,
    getDataEvaluacion,
    reporteEvaluacionEspecialistas,
    getDataEvaluacionEspecialistas,
    evaluacionEspecialista,
    dataEvaluaciones,
    allEvaluacionesEspecialistas,
    filtrosEvaluacionEspecialistasSeguimientoRetroalimentacion
  } = UseEvaluacionEspecialistas();
  const [distritosDisponibles, setDistritosDisponibles] = useState<string[]>([]);
  const [filtros, setFiltros] = useState({
    area: '',
    region: '',
    distrito: '',
    orden: '',
    genero: '',
    caracteristicaCurricular: '',
  });
  console.log('dataEstadisticas', dataEstadisticas);
  console.log('dataEvaluacionDocente', dataEvaluacionDocente);
  const [activePopover, setActivePopover] = useState<string | null>(null);

  const handleChangeFiltros = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value,
    });
  };

  const iterateData = (data: DataEstadisticas, respuesta: string) => {
    return {
      labels: ['nivel 1', 'nivel 2', 'nivel 3', 'nivel 4'],
      datasets: [
        {
          label: 'estadisticas de evaluación',
          data: [data.a, data.b, data.c, data.d],
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(201, 203, 207, 0.2)',
          ],
          borderColor: [
            'rgb(255, 99, 132)',
            'rgb(153, 102, 255)',
            'rgb(54, 162, 235)',
            'rgb(75, 192, 192)',
            'rgb(255, 159, 64)',
            'rgb(255, 205, 86)',
            'rgb(201, 203, 207)',
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

  const handleChangeMonth = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(Number(e.target.value));
  };
  const handleFiltrar = () => {
    console.log('test');
    console.log('filtros', filtros);
    reporteTablaEvaluacionEspecialista(allEvaluacionesDirectorDocente, filtros);
  };
  useEffect(() => {
    getDataEvaluacionEspecialistas(`${route.query.idEvaluacion}`);
    /* reporteEvaluacionDocentes(`${route.query.idEvaluacion}`); */
    reporteEvaluacionEspecialistas(`${route.query.idEvaluacion}`); //esta funcion trae la data de dataEvaluacioanes
    getPreguntasRespuestasEspecialistas(`${route.query.idEvaluacion}`);
  }, [route.query.idEvaluacion, currentUserData.dni]);

  const getBackgroundColor = (value: number) => {
    switch (value) {
      case 1:
        return styles.bgGray;
      case 2:
        return styles.bgOrange;
      case 3:
        return styles.bgGreen;
      case 4:
        return styles.bgCyan;
      default:
        return '';
    }
  };
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
                  <div className={styles.filtersContainerMonth}>
                    <select onChange={handleChangeMonth} className={styles.select}>
                      <option value="">Mes</option>
                      {getAllMonths.slice(0, currentMonth + 1).map((mes, index) => (
                        <option key={index} value={mes.id}>
                          {mes.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* <div>
                    <select
                      name="region"
                      className={styles.select}
                      onChange={handleChangeFiltros}
                      value={filtros.region}
                    >
                      <option value="">Seleccionar Región</option>
                      {regiones.map((region, index) => (
                        <option key={index} value={region.id}>
                          {region.region}
                        </option>
                      ))}
                    </select>

                    <select
                      name="distrito"
                      className={styles.select}
                      onChange={handleChangeFiltros}
                      value={filtros.distrito}
                      disabled={!filtros.region}
                    >
                      <option value="">Seleccionar Distrito</option>
                      {distritosDisponibles.map((distrito, index) => (
                        <option key={index} value={distrito}>
                          {distrito}
                        </option>
                      ))}
                    </select>

                    <select
                      name="area"
                      value={filtros.area}
                      onChange={handleChangeFiltros}
                      className={styles.select}
                    >
                      <option value="">Area</option>
                      {area.map((are) => (
                        <option key={are.id} value={are.id}>
                          {are.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <select
                      name="caracteristicaCurricular"
                      value={filtros.caracteristicaCurricular}
                      onChange={handleChangeFiltros}
                      className={styles.select}
                    >
                      <option value="">Característica Curricular</option>
                      {caracteristicasDirectivo.map((are) => (
                        <option key={are.id} value={are.name}>
                          {are.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <select
                      name="genero"
                      value={filtros.genero}
                      onChange={handleChangeFiltros}
                      className={styles.select}
                    >
                      <option value="">Género</option>
                      {genero.map((gen) => (
                        <option key={gen.id} value={gen.id}>
                          {gen.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <button className={styles.filterButton} onClick={handleFiltrar}>
                      Filtrar
                    </button>
                  </div> */}
                </div>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nombre y apellidos</th>
                      <th>puntaje</th>
                      {getPreguntaRespuestaDocentes.map((pregunta, index) => (
                        <th
                          key={index}
                          onClick={() =>
                            setActivePopover(
                              activePopover === pregunta.id ? null : pregunta.id || null
                            )
                          }
                        >
                          {pregunta.id}
                          {activePopover === pregunta.id && (
                            <div className={styles.popover}>{pregunta.criterio}</div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allEvaluacionesEspecialistas.map((docente, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          {docente.nombres} {docente.apellidos}
                        </td>
                        <td>{docente.calificacion}</td>
                        {docente.resultadosSeguimientoRetroalimentacion?.map((respuesta, index) => (
                          <td
                            key={index}
                            className={getBackgroundColor(
                              Number(respuesta.alternativas?.find((a) => a.selected)?.value)
                            )}
                          >
                            {niveles(
                              Number(respuesta.alternativas?.find((a) => a.selected)?.value)
                            ) || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                {dataEvaluaciones?.map((dat, index) => (
                  <div key={index} className={styles.chartContainer}>
                    <h3 className={styles.sectionTitle}>
                      <span className={styles.sectionTitleIndicator}></span>
                      <span>
                        {getPreguntaRespuestaDocentes[Number(index)]?.subOrden ||
                          getPreguntaRespuestaDocentes[Number(index)]?.order}
                        .
                      </span>
                      <span>{getPreguntaRespuestaDocentes[Number(index)]?.criterio}</span>
                    </h3>
                    <div className={styles.chartWrapper}>
                      <Bar
                        options={options}
                        data={iterateData(
                          dat,
                          `${preguntasRespuestas[Number(index) - 1]?.respuesta}`
                        )}
                      />
                    </div>
                    <div className={styles.statsContainer}>
                      <p>
                        {dat.a} | {((100 * Number(dat.a)) / Number(dat.total)).toFixed(0)}%
                      </p>
                      <p>
                        {dat.b} | {((100 * Number(dat.b)) / Number(dat.total)).toFixed(0)}%
                      </p>
                      <p>
                        {dat.c} | {((100 * Number(dat.c)) / Number(dat.total)).toFixed(0)}%
                      </p>
                      {dat.d && (
                        <p>
                          {dat.d} | {((100 * Number(dat.d)) / Number(dat.total)).toFixed(0)}%
                        </p>
                      )}
                    </div>
                  </div>
                ))}
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
