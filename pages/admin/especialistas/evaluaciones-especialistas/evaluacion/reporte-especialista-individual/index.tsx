import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { IoArrowBack, IoLink } from 'react-icons/io5';
import { RiLoader4Line } from 'react-icons/ri';
import { MdDownload, MdUpdate, MdSave } from 'react-icons/md';
import { User } from '@/features/types/types';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas';
import { regionTexto } from '@/fuctions/regiones';
import { AlternativasDocente } from '@/features/types/types';
import styles from './reporteEspecialista.module.css';

const TextWithLinks = ({ text, emptyText = "Sin información registrada." }: { text: string | null | undefined, emptyText?: string }) => {
  if (!text) return <span className={styles.empty}>{emptyText}</span>;

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: '#0066CC',
                fontWeight: 600,
                textDecoration: 'none',
                backgroundColor: '#F0F8FF',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid #CCE5FF',
                margin: '0 4px',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E5F3FF';
                e.currentTarget.style.borderColor = '#B3D7FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F0F8FF';
                e.currentTarget.style.borderColor = '#CCE5FF';
              }}
            >
              <IoLink /> Enlace adjunto
            </a>
          );
        }
        return <span key={index} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
      })}
    </>
  );
};

const ReporteEspecialistaIndividual = () => {
  const router = useRouter();
  const { idEvaluacion, idDirector, sessionId } = router.query;

  const {
    getPreguntaRespuestaDocentes,
    dimensionesEspecialistas,
    dataEvaluacionDocente,
    loaderSalvarPregunta,
    currentUserData,
  } = useGlobalContext();

  const {
    getDataEvaluacion,
    getPreguntasRespuestasEspecialistas,
    getDimensionesEspecialistas,
    getDataSeguimientoRetroalimentacionEspecialista,
    dataEspecialista,
    updateMonitorEvaluation,
    updateEvaluacionEspecialistaSeguimientoRetroalimentacion,
  } = UseEvaluacionEspecialistas();

  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [localData, setLocalData] = useState<User | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (dataEspecialista && dataEspecialista.dni) {
      setLocalData(JSON.parse(JSON.stringify(dataEspecialista)));
      setHasChanges(false);
    }
  }, [dataEspecialista]);

  const handleFieldChange = (field: keyof User, value: any) => {
    if (!localData) return;
    setLocalData({ ...localData, [field]: value });
    setHasChanges(true);
  };

  const handleMonitorChange = (field: string, value: any) => {
    if (!localData) return;
    const monitorData = (localData as any).datosMonitor || {};
    const newMonitor = { ...monitorData, [field]: value };
    setLocalData({ ...localData, datosMonitor: newMonitor });
    setHasChanges(true);
  };

  const handleRadioChange = (order: number, val: string) => {
    if (!localData?.resultadosSeguimientoRetroalimentacion) return;
    const newResultados = localData.resultadosSeguimientoRetroalimentacion.map(p => {
      if (p.order === order) {
        // Reconstruimos las alternativas basándonos en la escala actual completa
        const newAlternativas = currentEscala.map(e => ({
          id: e.id || e.alternativa,
          alternativa: e.alternativa,
          selected: e.alternativa === val,
          value: e.value,
          descripcion: e.descripcion
        }));
        return {
          ...p,
          alternativas: newAlternativas
        };
      }
      return p;
    });
    setLocalData({ ...localData, resultadosSeguimientoRetroalimentacion: newResultados });
    setHasChanges(true);
  };

  const handleFeedbackChange = (index: number, val: string) => {
    if (!localData?.retroalimentacionDinamica) return;
    const newFeedback = [...localData.retroalimentacionDinamica];
    newFeedback[index] = { ...newFeedback[index], contenido: val };
    setLocalData({ ...localData, retroalimentacionDinamica: newFeedback });
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!localData || !idEvaluacion) return;
    const targetId = (sessionId || idDirector) as string;
    try {
      await updateEvaluacionEspecialistaSeguimientoRetroalimentacion(`${idEvaluacion}`, targetId, localData);
      setHasChanges(false);
      alert('Cambios guardados exitosamente.');
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      alert('Error al guardar los cambios.');
    }
  };

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
      : getPreguntaRespuestaDocentes?.[0]?.alternativas && getPreguntaRespuestaDocentes[0].alternativas.length > 0
        ? getPreguntaRespuestaDocentes[0].alternativas
        : defaultEscala;

  const activeData = localData || dataEspecialista;

  // Merge respuestas del especialista sobre las preguntas base
  const preguntasConRespuestas = getPreguntaRespuestaDocentes?.map((pregunta) => {
    const respuestaGuardada = activeData?.resultadosSeguimientoRetroalimentacion?.find(
      (r) => r.order === pregunta.order
    );

    // Mapeamos las alternativas basándonos siempre en la escala actual del reporte
    const alternativasMapeadas = currentEscala.map((e) => {
      // Si hay una respuesta guardada, buscamos su estado, si no, buscamos en la pregunta base
      const guardada = respuestaGuardada?.alternativas?.find(a => a.alternativa === e.alternativa);
      const base = pregunta.alternativas?.find(a => a.alternativa === e.alternativa);

      return {
        ...e,
        selected: guardada ? guardada.selected : (base ? base.selected : false)
      };
    });

    return {
      ...pregunta,
      alternativas: alternativasMapeadas,
      evidencias: respuestaGuardada?.evidencias || pregunta.evidencias || [],
      requiereEvidencia: respuestaGuardada?.requiereEvidencia !== undefined ? respuestaGuardada.requiereEvidencia : pregunta.requiereEvidencia,
    };
  }) ?? [];

  const hasEvidencias = !!dataEvaluacionDocente?.activarEvidencias;
  const colSpanTotal = 2 + currentEscala.length + (hasEvidencias ? 1 : 0);

  const ugelDisplay: string = (activeData?.ugel || activeData?.institucion || (activeData?.region !== undefined ? regionTexto(String(activeData.region)) : '') || '').toUpperCase();

  const monitor = (activeData as any)?.datosMonitor ?? {};

  const handleUpdateMonitor = async () => {
    if (!idEvaluacion || !currentUserData) return;
    const confirmUpdate = window.confirm(
      '¿Estás seguro de que deseas actualizar masivamente los nombres y apellidos del monitor en TODOS los evaluados de esta evaluación?'
    );
    if (!confirmUpdate) return;

    try {
      const monitorData = {
        apellidos: currentUserData.apellidos || '',
        nombres: currentUserData.nombres || '',
        email: currentUserData.email || '',
        celular: currentUserData.celular || '',
        cargo: 'MONITOR',
      };
      await updateMonitorEvaluation(`${idEvaluacion}`, monitorData as any);
      
      // Actualizamos también el estado local para reflejar el cambio inmediato en pantalla
      if (localData) {
        setLocalData({
            ...localData,
            datosMonitor: {
                ...localData.datosMonitor,
                ...monitorData
            }
        });
        setHasChanges(true);
      }

      alert('Datos del monitor actualizados masivamente en todos los evaluados.');
    } catch (error) {
      alert('Error al realizar la actualización masiva.');
    }
  };

  const pdfFileName = `reporte-${activeData?.apellidos ?? 'especialista'}-${activeData?.dni ?? ''}.pdf`
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
          especialista={activeData!}
          preguntas={preguntasConRespuestas}
          dimensiones={dimensionesEspecialistas ?? []}
          escala={currentEscala}
          ugel={ugelDisplay}
          tituloReporte={activeData?.tituloReporte}
          descripcion={dataEvaluacionDocente?.descripcion}
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
                      <div className={styles.infoValue}>
                        <input
                          className={styles.editableInput}
                          value={(activeData?.ugel || activeData?.institucion || ugelDisplay).toUpperCase()}
                          onChange={(e) => handleFieldChange('ugel', e.target.value.toUpperCase())}
                          placeholder="Ingrese UGEL"
                          style={{ textTransform: 'uppercase' }}
                          disabled
                        />
                      </div>
                    </div>
                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>APELLIDOS:</div>
                      <div className={styles.infoValue}>
                        <input
                          className={styles.editableInput}
                          value={activeData?.apellidos || ''}
                          onChange={(e) => handleFieldChange('apellidos', e.target.value)}
                          placeholder="Apellidos"
                          disabled
                        />
                      </div>
                    </div>
                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>NOMBRES:</div>
                      <div className={styles.infoValue}>
                        <input
                          className={styles.editableInput}
                          value={activeData?.nombres || ''}
                          onChange={(e) => handleFieldChange('nombres', e.target.value)}
                          placeholder="Nombres"
                          disabled
                        />
                      </div>
                    </div>
                    <div className={styles.infoRowGroup}>
                      <div className={styles.infoRowItem}>
                        <div className={styles.infoLabel}>DNI:</div>
                        <div className={styles.infoValue}>
                          <input
                            className={styles.editableInput}
                            value={activeData?.dni || ''}
                            onChange={(e) => handleFieldChange('dni', e.target.value)}
                            placeholder="DNI"
                            disabled
                          />
                        </div>
                      </div>
                      <div className={styles.verticalRowItem}>
                        <div className={styles.labelVertical}>E-MAIL:</div>
                        <div className={styles.infoValue}>
                          <input
                            className={styles.editableInput}
                            value={activeData?.email || ''}
                            onChange={(e) => handleFieldChange('email', e.target.value)}
                            placeholder="Email"
                          />
                        </div>
                      </div>
                      <div className={styles.verticalRowItem}>
                        <div className={styles.labelVertical}>Nº CELULAR:</div>
                        <div className={styles.infoValue}>
                          <input
                            className={styles.editableInput}
                            value={activeData?.celular || ''}
                            onChange={(e) => handleFieldChange('celular', e.target.value)}
                            placeholder="Celular"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Datos del Monitor ─────────────────────────────── */}
                  <div className={styles.infoSectionDivider}>
                    <span>DATOS DEL MONITOR:</span>
                    <button
                      onClick={handleUpdateMonitor}
                      className={styles.updateButton}
                      title="Actualizar con mis datos"
                      type="button"
                    >
                      <MdUpdate style={{ fontSize: '1.1rem' }} /> Actualizar Monitor
                    </button>
                  </div>

                  <div className={styles.infoTable}>
                    <div className={styles.infoRowGroup}>
                      <div className={styles.infoRowItem}>
                        <div className={styles.infoLabel}>APELLIDOS:</div>
                        <div className={styles.infoValue}>
                          <input
                            className={styles.editableInput}
                            value={monitor.apellidos || ''}
                            onChange={(e) => handleMonitorChange('apellidos', e.target.value)}
                            placeholder="Apellidos monitor"
                            disabled
                          />
                        </div>
                      </div>
                      <div className={styles.infoRowItem}>
                        <div className={styles.infoLabel}>NOMBRES:</div>
                        <div className={styles.infoValue}>
                          <input
                            className={styles.editableInput}
                            value={monitor.nombres || ''}
                            onChange={(e) => handleMonitorChange('nombres', e.target.value)}
                            placeholder="Nombres monitor"
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                    <div className={styles.infoRowGroup}>
                      <div className={styles.infoRowItem}>
                        <div className={styles.infoLabelSmall}>DNI:</div>
                        <div className={styles.infoValueSmall}>43139017</div>
                      </div>
                      <div className={styles.infoRowItem}>
                        <div className={styles.infoLabelSmall}>CARGO:</div>
                        <div className={styles.infoValueSmall}>
                          <input
                            className={styles.editableInput}
                            value={monitor.cargo || 'MONITOR'}
                            onChange={(e) => handleMonitorChange('cargo', e.target.value)}
                            placeholder="Cargo"
                            disabled
                          />
                        </div>
                      </div>
                      <div className={styles.verticalRowItem}>
                        <div className={styles.labelVertical}>E-MAIL:</div>
                        <div className={styles.infoValueSmall}>
                          <input
                            className={styles.editableInput}
                            value={monitor.email || ''}
                            onChange={(e) => handleMonitorChange('email', e.target.value)}
                            placeholder="Email"
                            disabled
                          />
                        </div>
                      </div>
                      <div className={styles.verticalRowItem}>
                        <div className={styles.labelVertical}>Nº CELULAR:</div>
                        <div className={styles.infoValueSmall}>
                          <input
                            className={styles.editableInput}
                            value={monitor.celular || ''}
                            onChange={(e) => handleMonitorChange('celular', e.target.value)}
                            placeholder="Celular"
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Fecha y Duración ─────────────────────────────── */}
                  <div className={styles.infoSectionDivider}>FECHA Y DURACIÓN:</div>

                  <div className={styles.infoTable}>
                    <div className={styles.infoRowGroup}>
                      <div className={styles.infoRowItem}>
                        <div className={styles.infoLabel}>FECHA:</div>
                        <div className={styles.infoValue}>
                          <input
                            type="date"
                            className={styles.editableInput}
                            value={activeData?.fechaMonitoreo || ''}
                            onChange={(e) => handleFieldChange('fechaMonitoreo', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className={styles.infoRowItem}>
                        <div className={styles.infoLabel}>HORA INICIO:</div>
                        <div className={styles.infoValue}>
                          <input
                            type="time"
                            className={styles.editableInput}
                            value={activeData?.horaInicio || ''}
                            onChange={(e) => handleFieldChange('horaInicio', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className={styles.infoRowItem}>
                        <div className={styles.infoLabel}>HORA FINAL:</div>
                        <div className={styles.infoValue}>
                          <input
                            type="time"
                            className={styles.editableInput}
                            value={activeData?.horaFinal || ''}
                            onChange={(e) => handleFieldChange('horaFinal', e.target.value)}
                          />
                        </div>
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
                        {currentEscala.map((e, index) => (
                          <th key={e.id || e.alternativa || index} className={styles.colValue}>
                            {e.value !== undefined ? e.value : e.alternativa}
                          </th>
                        ))}
                        {hasEvidencias && <th className={styles.colValue} style={{ width: '180px' }}>EVIDENCIA</th>}
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
                                <td colSpan={colSpanTotal} className={styles.dimensionTitle}>
                                  {dimension.nombre}
                                </td>
                              </tr>
                              {preguntasDimension.map((pregunta) => (
                                <tr key={pregunta.id} className={styles.questionRow}>
                                  <td className={styles.cellNumber}>{pregunta.order}</td>
                                  <td className={styles.cellCriterio}>{pregunta.criterio}</td>
                                  {currentEscala.map((e, index) => {
                                    const val = e.alternativa || '';
                                    const alt = pregunta.alternativas?.find((a) => a.alternativa === val);
                                    return (
                                      <td key={e.id || e.alternativa || index} className={styles.cellRadio}>
                                        <input
                                          type="radio"
                                          name={`q-${pregunta.id}`}
                                          value={val}
                                          checked={alt?.selected || false}
                                          onChange={() => handleRadioChange(pregunta.order!, val)}
                                          className={styles.radioInputEditable}
                                        />
                                      </td>
                                    );
                                  })}
                                  {hasEvidencias && (
                                    <td className={styles.cellRadio} style={{ padding: '8px', textAlign: 'left', borderLeft: '1px solid #eee' }}>
                                      {pregunta.requiereEvidencia ? (
                                        pregunta.evidencias && pregunta.evidencias.length > 0 ? (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {pregunta.evidencias.map((ev: any, idx: number) => (
                                              <a
                                                key={idx}
                                                href={ev.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ fontSize: '0.8rem', color: '#0066CC', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                              >
                                                <IoLink /> {ev.nombre.length > 15 ? ev.nombre.substring(0, 15) + '...' : ev.nombre}
                                              </a>
                                            ))}
                                          </div>
                                        ) : (
                                          <span style={{ fontSize: '0.8rem', color: '#666' }}>Sin evidencia</span>
                                        )
                                      ) : (
                                        <span style={{ fontSize: '0.8rem', color: '#999' }}>No requiere</span>
                                      )}
                                    </td>
                                  )}
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
                            {currentEscala.map((e, index) => {
                              const val = e.alternativa || '';
                              const alt = pregunta.alternativas?.find((a) => a.alternativa === val);
                              return (
                                <td key={e.id || e.alternativa || index} className={styles.cellRadio}>
                                  <input
                                    type="radio"
                                    name={`q-${pregunta.id}`}
                                    value={val}
                                    checked={alt?.selected || false}
                                    onChange={() => handleRadioChange(pregunta.order!, val)}
                                    className={styles.radioInputEditable}
                                  />
                                </td>
                              );
                            })}
                            {hasEvidencias && (
                              <td className={styles.cellRadio} style={{ padding: '8px', textAlign: 'left', borderLeft: '1px solid #eee' }}>
                                {pregunta.requiereEvidencia ? (
                                  pregunta.evidencias && pregunta.evidencias.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      {pregunta.evidencias.map((ev: any, idx: number) => (
                                        <a
                                          key={idx}
                                          href={ev.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ fontSize: '0.8rem', color: '#0066CC', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                          <IoLink /> {ev.nombre.length > 15 ? ev.nombre.substring(0, 15) + '...' : ev.nombre}
                                        </a>
                                      ))}
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>Sin evidencia</span>
                                  )
                                ) : (
                                  <span style={{ fontSize: '0.8rem', color: '#999' }}>No requiere</span>
                                )}
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ── Retroalimentación Cualitativa Dinámica ─────────────────── */}
                <div className={styles.feedbackSection}>
                  {activeData?.retroalimentacionDinamica && activeData.retroalimentacionDinamica.length > 0 ? (
                    activeData.retroalimentacionDinamica.map((item, index) => (
                      <div key={index} className={styles.feedbackGroup}>
                        <label className={styles.feedbackLabel}>{item.etiqueta}:</label>
                        <textarea
                          className={styles.editableTextarea}
                          value={item.contenido || ''}
                          onChange={(e) => handleFeedbackChange(index, e.target.value)}
                          placeholder={`Escriba aquí los ${item.etiqueta.toLowerCase()}...`}
                        />
                      </div>
                    ))
                  ) : (
                    // Fallback para datos legacy
                    <>
                      <div className={styles.feedbackGroup}>
                        <label className={styles.feedbackLabel}>AVANCES:</label>
                        <textarea
                          className={styles.editableTextarea}
                          value={activeData?.avancesRetroalimentacion || ''}
                          onChange={(e) => handleFieldChange('avancesRetroalimentacion', e.target.value)}
                        />
                      </div>
                      <div className={styles.feedbackGroup}>
                        <label className={styles.feedbackLabel}>DIFICULTADES:</label>
                        <textarea
                          className={styles.editableTextarea}
                          value={activeData?.dificultadesRetroalimentacion || ''}
                          onChange={(e) => handleFieldChange('dificultadesRetroalimentacion', e.target.value)}
                        />
                      </div>
                      <div className={styles.feedbackGroup}>
                        <label className={styles.feedbackLabel}>COMPROMISOS:</label>
                        <textarea
                          className={styles.editableTextarea}
                          value={activeData?.compromisosRetroalimentacion || ''}
                          onChange={(e) => handleFieldChange('compromisosRetroalimentacion', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Floating Save Button */}
                {hasChanges && (
                  <button className={styles.saveChangesButton} onClick={handleSaveChanges}>
                    <MdSave /> Guardar Cambios
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReporteEspecialistaIndividual;