import PrivateRouteDocentes from "@/components/layouts/PrivateRoutesDocentes";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { useReporteDocente } from "@/features/hooks/useReporteDocente";
import {
  Alternativa,
  DataEstadisticas,
  PreguntasRespuestas,
} from "@/features/types/types";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
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
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import { RiLoader4Line } from "react-icons/ri";
import * as XLSX from "xlsx";
import { MdDeleteForever } from "react-icons/md";
import DeleteEstudiante from "@/modals/deleteEstudiante";
import styles from "./reporte.module.css";

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
  } = useGlobalContext();
  const { estudiantesQueDieronExamen } = useReporteDocente();
  const { getPreguntasRespuestas } = useAgregarEvaluaciones();
  const [idEstudiante, setIdEstudiante] = useState<string>("");

  const handleShowTable = () => {
    setShowtable(!showTable);
  };

  const handleDownload = () => {
    setLoading(true);
    const libro = XLSX.utils.book_new();
    const hoja = XLSX.utils.json_to_sheet(estudiantes);
    XLSX.utils.book_append_sheet(libro, hoja, "estudiantes");

    setTimeout(() => {
      XLSX.writeFile(libro, "estudiantes.xlsx");
      setLoading(false);
    }, 1000);
  };

  const iterateData = (data: DataEstadisticas, respuesta: string) => {
    return {
      labels: data.d === undefined ? ["a", "b", "c"] : ["a", "b", "c", "d"],
      datasets: [
        {
          label: "estadisticas de respuesta",
          data: [data.a, data.b, data.c, data.d !== 0 && data.d],
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(255, 159, 64, 0.2)",
            "rgba(153, 102, 255, 0.2)",
            "rgba(255, 159, 64, 0.2)",
            "rgba(255, 205, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(153, 102, 255, 0.2)",
            "rgba(201, 203, 207, 0.2)",
          ],
          borderColor: [
            "rgb(255, 99, 132)",
            "rgb(255, 159, 64)",
            "rgb(255, 205, 86)",
            "rgb(75, 192, 192)",
            "rgb(54, 162, 235)",
            "rgb(153, 102, 255)",
            "rgb(201, 203, 207)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  useEffect(() => {
    estudiantesQueDieronExamen(
      `${route.query.idExamen}`,
      `${currentUserData.dni}`
    );
    getPreguntasRespuestas(`${route.query.idExamen}`);
  }, [route.query.idExamen, currentUserData.dni]);

  const options = {
    plugins: {
      legend: {
        position: "center" as const,
      },
      title: {
        display: true,
        text: "estadistica de respuestas",
      },
    },
  };

  const iterarPregunta = (index: string) => {
    return (
      <>
        <h3 className={styles.questionTitle}>
          <p className={styles.questionNumber}>
            {preguntasRespuestas[Number(index) - 1]?.order}.
          </p>
          {preguntasRespuestas[Number(index) - 1]?.pregunta}
        </h3>
        <h4 className={styles.questionSubtitle}>
          <strong>Actuacion</strong>:{" "}
          {preguntasRespuestas[Number(index) - 1]?.preguntaDocente}
        </h4>
      </>
    );
  };

  const handleValidateRespuesta = (data: PreguntasRespuestas) => {
    const rta: Alternativa | undefined = data.alternativas?.find(
      (r) => r.selected === true
    );
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

  return (
    <>
      {showDeleteEstudiante && (
        <DeleteEstudiante
          estudiantes={estudiantes}
          idExamen={`${route.query.idExamen}`}
          idEstudiante={idEstudiante}
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
            <div
              onClick={handleShowTable}
              className={styles.toggleButton}
            >
              {showTable
                ? "ocultar tabla de estudiantes"
                : "ver tabla de estudiantes"}
            </div>
            {showTable ? (
              <>
                <button
                  className={styles.exportButton}
                  onClick={handleDownload}
                >
                  exportar excel
                </button>

                <table className={styles.table}>
                  <thead className={styles.tableHeader}>
                    <tr>
                      <th></th>
                      <th>#</th>
                      <th>N-A</th>
                      <th>r.c</th>
                      <th>t.p.</th>
                      {preguntasRespuestas.map((pr) => {
                        return (
                          <th key={pr.order}>
                            <button
                              className={styles.questionButton}
                              popoverTarget={`${pr.order}`}
                            >
                              {pr.order}
                            </button>
                            <div
                              className={styles.questionPopover}
                              popover="auto"
                              id={`${pr.order}`}
                            >
                              <div>
                                <span>
                                  {pr.order}. Actuación:
                                </span>
                                <span>
                                  {pr.preguntaDocente}
                                </span>
                              </div>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {dataEstadisticas.length >= 0
                      ? estudiantes?.map((dir, index) => {
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
                              <td>{dir.nombresApellidos}</td>
                              <td>{dir.respuestasCorrectas}</td>
                              <td>{dir.totalPreguntas}</td>
                              {dir.respuestas?.map((res) => {
                                return (
                                  <td key={res.order}>
                                    {handleValidateRespuesta(res)}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })
                      : null}
                  </tbody>
                </table>
              </>
            ) : null}
            <h1 className={styles.title}>
              reporte de evaluación
            </h1>
            <div>
              <div>
                {dataEstadisticas?.map((dat, index) => {
                  return (
                    <div key={index} className={styles.questionContainer}>
                      {iterarPregunta(`${dat.id}`)}
                      <div className={styles.chartContainer}>
                        <div className={styles.chartWrapper}>
                          <Bar
                            options={options}
                            data={iterateData(
                              dat,
                              `${
                                preguntasRespuestas[Number(index) - 1]
                                  ?.respuesta
                              }`
                            )}
                          />
                        </div>
                        <div className={styles.statsContainer}>
                          <p>
                            {dat.a} |{" "}
                            {dat.total === 0
                              ? 0
                              : (
                                  (100 * Number(dat.a)) /
                                  Number(dat.total)
                                ).toFixed(0)}{" "}
                            %
                          </p>
                          <p>
                            {dat.b} |
                            {dat.total === 0
                              ? 0
                              : (
                                  (100 * Number(dat.b)) /
                                  Number(dat.total)
                                ).toFixed(0)}
                            %
                          </p>
                          <p>
                            {dat.c} |{" "}
                            {dat.total === 0
                              ? 0
                              : (
                                  (100 * Number(dat.c)) /
                                  Number(dat.total)
                                ).toFixed(0)}
                            %
                          </p>
                          {dat.d && (
                            <p>
                              {dat.d} |{" "}
                              {dat.total === 0
                                ? 0
                                : (
                                    (100 * Number(dat.d)) /
                                    Number(dat.total)
                                  ).toFixed(0)}
                              %
                            </p>
                          )}
                        </div>
                        <div className={styles.answerContainer}>
                          respuesta:
                          <span className={styles.answerText}>
                            {preguntasRespuestas[Number(index)]?.respuesta}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
