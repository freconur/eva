import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { IoArrowBack } from 'react-icons/io5';
import { RiLoader4Line } from 'react-icons/ri';
import { MdDownload } from 'react-icons/md';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas';
import { regionTexto } from '@/fuctions/regiones';
import { AlternativasDocente } from '@/features/types/types';
import styles from './reporteEspecialista.module.css';

const ReporteEspecialistaIndividual = () => {
  const router = useRouter();
  const { idEvaluacion, idDirector, sessionId } = router.query;

  const {
    getPreguntaRespuestaDocentes,
    dimensionesEspecialistas,
    dataEvaluacionDocente,
    loaderSalvarPregunta,
  } = useGlobalContext();

  const {
    getDataEvaluacion,
    getPreguntasRespuestasEspecialistas,
    getDimensionesEspecialistas,
    getDataSeguimientoRetroalimentacionEspecialista,
    dataEspecialista,
  } = UseEvaluacionEspecialistas();

  const [pdfGenerating, setPdfGenerating] = useState(false);

  useEffect(() => { /* client-side only marker not needed with button approach */ }, []);

  useEffect(() => {
    if (idEvaluacion) {
      getDataEvaluacion(`${idEvaluacion}`);
      getPreguntasRespuestasEspecialistas(`${idEvaluacion}`);
      getDimensionesEspecialistas(`${idEvaluacion}`);
    }
  }, [idEvaluacion]);

  useEffect(() => {
    const targetId = (sessionId || idDirector) as string;
    if (idEvaluacion && targetId) {
      getDataSeguimientoRetroalimentacionEspecialista(`${idEvaluacion}`, targetId);
    }
  }, [idEvaluacion, idDirector, sessionId]);

  const defaultEscala: AlternativasDocente[] = [
    { value: 0, alternativa: '0', descripcion: 'No evidencia' },
    { value: 1, alternativa: '1', descripcion: 'En proceso' },
    { value: 2, alternativa: '2', descripcion: 'Logrado' },
  ];

  const currentEscala: AlternativasDocente[] =
    dataEvaluacionDocente?.escala && dataEvaluacionDocente.escala.length > 0
      ? dataEvaluacionDocente.escala
      : defaultEscala;

  // Merge respuestas del especialista sobre las preguntas base
  const preguntasConRespuestas = getPreguntaRespuestaDocentes?.map((pregunta) => {
    const respuestaGuardada = dataEspecialista?.resultadosSeguimientoRetroalimentacion?.find(
      (r) => r.order === pregunta.order
    );
    if (respuestaGuardada?.alternativas) {
      return {
        ...pregunta,
        alternativas: pregunta.alternativas?.map((alt) => ({
          ...alt,
          selected:
            respuestaGuardada.alternativas?.find(
              (a) => a.alternativa === alt.alternativa
            )?.selected || false,
        })),
      };
    }
    return pregunta;
  }) ?? [];

  const ugel: string = dataEspecialista?.region
    ? regionTexto(String(dataEspecialista.region)) ?? ''
    : dataEspecialista?.ugel ?? '';

  const monitor = (dataEspecialista as any)?.datosMonitor ?? {};

  const pdfFileName = `reporte-${dataEspecialista?.apellidos ?? 'especialista'}-${dataEspecialista?.dni ?? ''}.pdf`
    .toLowerCase()
    .replace(/\s+/g, '-');

  const handleDownloadPDF = async () => {
    if (pdfGenerating) return;
    try {
      setPdfGenerating(true);
      // Importación dinámica para evitar conflictos SSR / reconciler
      const [{ pdf }, { default: ReportePDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/pdf/ReporteEspecialistaPDF'),
      ]);
      const blob = await pdf(
        <ReportePDF
          especialista={dataEspecialista!}
          preguntas={preguntasConRespuestas}
          dimensiones={dimensionesEspecialistas ?? []}
          escala={currentEscala}
          ugel={ugel}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfFileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>

        {/* Nav bar */}
        <div className={styles.navBar}>
          <div className={styles.navBarInner}>
            <Link
              href={`/admin/especialistas/evaluaciones-especialistas/evaluacion/${idEvaluacion}/evaluados`}
              className={styles.backLink}
            >
              <IoArrowBack className={styles.backIcon} />
              Volver a evaluados
            </Link>

            {/* PDF Download button */}
            {dataEspecialista?.dni && (
              <button
                onClick={handleDownloadPDF}
                disabled={pdfGenerating}
                className={styles.downloadButton}
              >
                {pdfGenerating ? (
                  <><RiLoader4Line className={styles.downloadSpinner} /> Generando...</>
                ) : (
                  <><MdDownload style={{ fontSize: '1.1rem' }} /> Descargar PDF</>
                )}
              </button>
            )}
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.contentInner}>

            {loaderSalvarPregunta ? (
              <div className={styles.loadingContainer}>
                <RiLoader4Line className={styles.loadingIcon} />
                <span className={styles.loadingText}>Cargando reporte...</span>
              </div>
            ) : (
              <>
                {/* ── Datos del Monitoreado ─────────────────────────── */}
                <div className={styles.premiumInfoContainer}>
                  <div className={styles.infoSectionHeader}>
                    <h3 className={styles.infoSectionTitle}>DATOS DEL(A) MONITOREADO (A):</h3>
                  </div>

                  <div className={styles.infoTable}>
                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>UGEL:</div>
                      <div className={styles.infoValue}>{ugel || <span className={styles.empty}>—</span>}</div>
                    </div>
                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>APELLIDOS Y NOMBRES:</div>
                      <div className={styles.infoValue}>
                        {dataEspecialista?.apellidos || dataEspecialista?.nombres
                          ? `${dataEspecialista.apellidos?.toUpperCase() ?? ''} ${dataEspecialista.nombres?.toUpperCase() ?? ''}`.trim()
                          : <span className={styles.empty}>—</span>}
                      </div>
                    </div>
                    <div className={styles.infoRowGroup}>
                      <div className={styles.infoRowItem}>
                        <div className={styles.infoLabel}>DNI:</div>
                        <div className={styles.infoValue}>{dataEspecialista?.dni || <span className={styles.empty}>—</span>}</div>
                      </div>
                      <div className={styles.verticalRowItem}>
                        <div className={styles.labelVertical}>E-MAIL:</div>
                        <div className={styles.infoValue}>{dataEspecialista?.email || <span className={styles.empty}>—</span>}</div>
                      </div>
                      <div className={styles.verticalRowItem}>
                        <div className={styles.labelVertical}>Nº CELULAR:</div>
                        <div className={styles.infoValue}>{dataEspecialista?.celular || <span className={styles.empty}>—</span>}</div>
                      </div>
                    </div>
                  </div>

                  {/* ── Datos del Monitor ─────────────────────────────── */}
                  <div className={styles.infoSectionDivider}>DATOS DEL MONITOR:</div>

                  <div className={styles.infoTable}>
                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>APELLIDOS Y NOMBRES:</div>
                      <div className={styles.infoValue}>
                        {monitor.apellidos || monitor.nombres
                          ? `${monitor.apellidos?.toUpperCase() ?? ''} ${monitor.nombres?.toUpperCase() ?? ''}`.trim()
                          : <span className={styles.empty}>—</span>}
                      </div>
                    </div>
                    <div className={styles.infoRowGroup}>
                      <div className={styles.infoRowItem}>
                        <div className={styles.infoLabelSmall}>DNI:</div>
                        <div className={styles.infoValueSmall}>{monitor.dni || <span className={styles.empty}>—</span>}</div>
                      </div>
                      <div className={styles.infoRowItem}>
                        <div className={styles.infoLabelSmall}>CARGO:</div>
                        <div className={styles.infoValueSmall}>{monitor.cargo || 'MONITOR'}</div>
                      </div>
                      <div className={styles.verticalRowItem}>
                        <div className={styles.labelVertical}>E-MAIL:</div>
                        <div className={styles.infoValueSmall}>{monitor.email || <span className={styles.empty}>—</span>}</div>
                      </div>
                      <div className={styles.verticalRowItem}>
                        <div className={styles.labelVertical}>Nº CELULAR:</div>
                        <div className={styles.infoValueSmall}>{monitor.celular || <span className={styles.empty}>—</span>}</div>
                      </div>
                    </div>
                  </div>

                  {/* ── Fecha y Duración ─────────────────────────────── */}
                  <div className={styles.infoSectionDivider}>FECHA Y DURACIÓN:</div>

                  <div className={styles.infoTable}>
                    <div className={styles.infoRowGroup}>
                      <div className={styles.infoRowItem}>
                        <div className={styles.infoLabel}>FECHA:</div>
                        <div className={styles.infoValue}>{dataEspecialista?.fechaMonitoreo || <span className={styles.empty}>—</span>}</div>
                      </div>
                      <div className={styles.infoRowItem}>
                        <div className={styles.infoLabel}>HORA INICIO:</div>
                        <div className={styles.infoValue}>{dataEspecialista?.horaInicio || <span className={styles.empty}>—</span>}</div>
                      </div>
                      <div className={styles.infoRowItem}>
                        <div className={styles.infoLabel}>FECHA FINAL:</div>
                        <div className={styles.infoValue}>{dataEspecialista?.horaFinal || <span className={styles.empty}>—</span>}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Tabla de evaluación ───────────────────────────── */}
                <div className={styles.tableContainer}>
                  <table className={styles.evaluationTable}>
                    <thead>
                      <tr>
                        <th className={styles.colNumber}>№</th>
                        <th className={styles.colCriterio}>CRITERIO</th>
                        {currentEscala.map((e) => (
                          <th key={e.alternativa} className={styles.colValue}>
                            {e.alternativa}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dimensionesEspecialistas && dimensionesEspecialistas.length > 0 ? (
                        dimensionesEspecialistas.map((dimension) => {
                          const preguntasDimension = preguntasConRespuestas.filter(
                            (p) => p.dimensionId === dimension.id
                          );
                          if (preguntasDimension.length === 0) return null;
                          return (
                            <React.Fragment key={dimension.id}>
                              <tr className={styles.dimensionRow}>
                                <td colSpan={currentEscala.length + 2} className={styles.dimensionTitle}>
                                  {dimension.nombre}
                                </td>
                              </tr>
                              {preguntasDimension.map((pregunta) => (
                                <tr key={pregunta.id} className={styles.questionRow}>
                                  <td className={styles.cellNumber}>{pregunta.order}</td>
                                  <td className={styles.cellCriterio}>{pregunta.criterio}</td>
                                  {currentEscala.map((e) => {
                                    const val = e.alternativa || '';
                                    const alt = pregunta.alternativas?.find((a) => a.alternativa === val);
                                    return (
                                      <td key={val} className={styles.cellRadio}>
                                        <input
                                          type="radio"
                                          name={`q-${pregunta.id}`}
                                          value={val}
                                          checked={alt?.selected || false}
                                          readOnly
                                          className={styles.radioInput}
                                        />
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        })
                      ) : (
                        preguntasConRespuestas.map((pregunta, index) => (
                          <tr key={pregunta.id} className={styles.questionRow}>
                            <td className={styles.cellNumber}>{index + 1}</td>
                            <td className={styles.cellCriterio}>{pregunta.criterio}</td>
                            {currentEscala.map((e) => {
                              const val = e.alternativa || '';
                              const alt = pregunta.alternativas?.find((a) => a.alternativa === val);
                              return (
                                <td key={val} className={styles.cellRadio}>
                                  <input
                                    type="radio"
                                    name={`q-${pregunta.id}`}
                                    value={val}
                                    checked={alt?.selected || false}
                                    readOnly
                                    className={styles.radioInput}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ── Retroalimentación Cualitativa Dinámica ─────────────────── */}
                <div className={styles.feedbackSection}>
                  {dataEspecialista?.retroalimentacionDinamica && dataEspecialista.retroalimentacionDinamica.length > 0 ? (
                    dataEspecialista.retroalimentacionDinamica.map((item, index) => (
                      <div key={index} className={styles.feedbackGroup}>
                        <label className={styles.feedbackLabel}>{item.etiqueta}:</label>
                        <div className={styles.feedbackReadonly}>
                          {item.contenido || <span className={styles.empty}>Sin información registrada.</span>}
                        </div>
                      </div>
                    ))
                  ) : (
                    // Fallback para datos legacy
                    <>
                      <div className={styles.feedbackGroup}>
                        <label className={styles.feedbackLabel}>AVANCES:</label>
                        <div className={styles.feedbackReadonly}>
                          {dataEspecialista?.avancesRetroalimentacion || (
                            <span className={styles.empty}>Sin avances registrados.</span>
                          )}
                        </div>
                      </div>
                      <div className={styles.feedbackGroup}>
                        <label className={styles.feedbackLabel}>DIFICULTADES:</label>
                        <div className={styles.feedbackReadonly}>
                          {dataEspecialista?.dificultadesRetroalimentacion || (
                            <span className={styles.empty}>Sin dificultades registradas.</span>
                          )}
                        </div>
                      </div>
                      <div className={styles.feedbackGroup}>
                        <label className={styles.feedbackLabel}>COMPROMISOS:</label>
                        <div className={styles.feedbackReadonly}>
                          {dataEspecialista?.compromisosRetroalimentacion || (
                            <span className={styles.empty}>Sin compromisos registrados.</span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReporteEspecialistaIndividual;