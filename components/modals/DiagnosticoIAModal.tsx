import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  MdAutoAwesome,
  MdClose,
  MdPictureAsPdf,
  MdRefresh,
  MdSchool,
  MdWarningAmber,
  MdTrendingUp,
  MdLocationOn,
  MdFactCheck,
  MdAssignment,
} from 'react-icons/md';
import { RiLoader4Line } from 'react-icons/ri';
import { Evaluaciones, PreguntasRespuestas } from '@/features/types/types';
import { UgelMatrizComparativaRow } from '@/features/hooks/useMatrizResultados';
import { DiagnosticoOutputResponse } from '@/pages/api/reportes/diagnostico-ia-matriz';
import { exportarDiagnosticoIAPDF } from '@/features/utils/exportarDiagnosticoIAPDF';
import styles from './DiagnosticoIAModal.module.css';

interface DiagnosticoIAModalProps {
  isOpen: boolean;
  onClose: () => void;
  gradoName: string;
  yearSelected: number;
  evaluacionEdi?: Evaluaciones | null;
  evaluacionEp1?: Evaluaciones | null;
  evaluacionEp2?: Evaluaciones | null;
  matrizRows: UgelMatrizComparativaRow[];
  preguntas: PreguntasRespuestas[];
}

export const DiagnosticoIAModal: React.FC<DiagnosticoIAModalProps> = ({
  isOpen,
  onClose,
  gradoName,
  yearSelected,
  evaluacionEdi,
  evaluacionEp1,
  evaluacionEp2,
  matrizRows = [],
  preguntas = [],
}) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [diagnostico, setDiagnostico] = useState<DiagnosticoOutputResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'global' | 'items' | 'zonas' | 'acciones'>('global');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calcular agregados numéricos consolidados para la IA y el reporte
  const resumenGeneral = useMemo(() => {
    if (!matrizRows || matrizRows.length === 0) {
      return {
        totalEstudiantes: {},
        rcPromedio: {},
        puntajePromedio: {},
        nivelesLogro: [],
      };
    }

    const calcSum = (getter: (r: UgelMatrizComparativaRow) => number | undefined) => {
      const vals = matrizRows.map(getter).filter((v): v is number => v !== undefined && !isNaN(v));
      return vals.reduce((a, b) => a + b, 0);
    };

    const calcAvg = (getter: (r: UgelMatrizComparativaRow) => number | undefined) => {
      const vals = matrizRows.map(getter).filter((v): v is number => v !== undefined && !isNaN(v));
      if (vals.length === 0) return undefined;
      return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
    };

    // Niveles
    const niveles = (matrizRows[0]?.niveles || []).map((nc, nIdx) => {
      const sumEtapaNivel = (etapa: 'edi' | 'ep1' | 'ep2') => {
        let cantSum = 0;
        let totEstSum = 0;
        let hasData = false;

        matrizRows.forEach((r) => {
          const nStat = r.niveles?.[nIdx]?.[etapa];
          const totEst = r.totalEstudiantes?.[etapa];
          if (nStat !== undefined && totEst !== undefined && totEst > 0) {
            cantSum += nStat.cantidad;
            totEstSum += totEst;
            hasData = true;
          }
        });

        if (!hasData || totEstSum === 0) return undefined;
        return {
          cantidad: cantSum,
          porcentaje: Math.round((cantSum / totEstSum) * 100),
        };
      };

      return {
        nivel: nc.nivel,
        color: nc.color,
        edi: sumEtapaNivel('edi'),
        ep1: sumEtapaNivel('ep1'),
        ep2: sumEtapaNivel('ep2'),
      };
    });

    return {
      totalEstudiantes: {
        edi: calcSum((r) => r.totalEstudiantes.edi) || undefined,
        ep1: calcSum((r) => r.totalEstudiantes.ep1) || undefined,
        ep2: calcSum((r) => r.totalEstudiantes.ep2) || undefined,
      },
      rcPromedio: {
        edi: calcAvg((r) => r.rc.edi),
        ep1: calcAvg((r) => r.rc.ep1),
        ep2: calcAvg((r) => r.rc.ep2),
      },
      puntajePromedio: {
        edi: calcAvg((r) => r.puntaje.edi),
        ep1: calcAvg((r) => r.puntaje.ep1),
        ep2: calcAvg((r) => r.puntaje.ep2),
      },
      nivelesLogro: niveles,
    };
  }, [matrizRows]);

  // Ítems de menor rendimiento
  const itemsCriticos = useMemo(() => {
    if (!preguntas || preguntas.length === 0 || !matrizRows || matrizRows.length === 0) {
      return [];
    }

    const stats = preguntas.map((p, idx) => {
      const order = p.order !== undefined ? Number(p.order) : idx + 1;

      const calcStagePct = (etapa: 'edi' | 'ep1' | 'ep2') => {
        let corr = 0;
        let tot = 0;
        matrizRows.forEach((r) => {
          const qStat = r.preguntas?.[order]?.[etapa];
          if (qStat && qStat.total > 0) {
            corr += qStat.correctas;
            tot += qStat.total;
          }
        });
        return tot > 0 ? Math.round((corr / tot) * 100) : undefined;
      };

      const ediPct = calcStagePct('edi');
      const ep1Pct = calcStagePct('ep1');
      const ep2Pct = calcStagePct('ep2');

      // tendencia
      let tendencia = 'Estable';
      if (ediPct !== undefined && ep2Pct !== undefined) {
        if (ep2Pct > ediPct + 5) tendencia = 'Progreso';
        else if (ep2Pct < ediPct - 5) tendencia = 'Retroceso';
      }

      return {
        order,
        enunciado: p.pregunta || `Pregunta N° ${order}`,
        ediPorcentaje: ediPct,
        ep1Porcentaje: ep1Pct,
        ep2Porcentaje: ep2Pct,
        tendencia,
      };
    });

    // Ordenar por menor porcentaje en la última etapa disponible (ep2, luego ep1, luego edi)
    return stats
      .sort((a, b) => {
        const valA = a.ep2Porcentaje ?? a.ep1Porcentaje ?? a.ediPorcentaje ?? 100;
        const valB = b.ep2Porcentaje ?? b.ep1Porcentaje ?? b.ediPorcentaje ?? 100;
        return valA - valB;
      })
      .slice(0, 8);
  }, [preguntas, matrizRows]);

  // Muestra de UGELs para el diagnóstico
  const ugelDesempenos = useMemo(() => {
    return matrizRows.map((r) => ({
      nombre: r.nombre,
      puntajeEdi: r.puntaje.edi,
      puntajeEp1: r.puntaje.ep1,
      puntajeEp2: r.puntaje.ep2,
      totalEstudiantes: r.totalEstudiantes.ep2 || r.totalEstudiantes.ep1 || r.totalEstudiantes.edi || 0,
    }));
  }, [matrizRows]);

  // Invocar al endpoint de IA
  const handleGenerarDiagnostico = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = {
        gradoName,
        yearSelected,
        evaluaciones: {
          ediNombre: evaluacionEdi?.nombre,
          ep1Nombre: evaluacionEp1?.nombre,
          ep2Nombre: evaluacionEp2?.nombre,
        },
        resumenGeneral,
        itemsCriticos,
        ugelDesempenos,
      };

      const response = await fetch('/api/reportes/diagnostico-ia-matriz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const detailMsg = data.details ? `: ${data.details}` : '';
        throw new Error((data.error || 'Error al conectar con el servicio de IA.') + detailMsg);
      }

      setDiagnostico(data.diagnostico);
      setActiveTab('global');
    } catch (err: any) {
      console.error('Error generando diagnóstico IA:', err);
      setErrorMessage(err.message || 'No se pudo generar el diagnóstico con Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  // Descargar PDF
  const handleExportarPDF = () => {
    if (!diagnostico) return;
    setIsExportingPdf(true);
    try {
      exportarDiagnosticoIAPDF({
        diagnostico,
        gradoName,
        yearSelected,
        evaluaciones: {
          edi: evaluacionEdi,
          ep1: evaluacionEp1,
          ep2: evaluacionEp2,
        },
        resumenGeneral,
      });
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      alert('Ocurrió un inconveniente al generar el PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.iconBadge}>
              <MdAutoAwesome />
            </div>
            <div>
              <h2 className={styles.title}>
                Diagnóstico Pedagógico con IA
                <span className={styles.aiBadge}>Gemini AI</span>
              </h2>
              <p className={styles.subtitle}>
                Análisis longitudinal de aprendizajes (EDI ➔ EP1 ➔ EP2) para {gradoName} ({yearSelected})
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <MdClose />
          </button>
        </header>

        {/* Pestañas de Navegación Fijas en la parte superior */}
        {diagnostico && !isLoading && (
          <div className={styles.tabsHeader}>
            <div className={styles.tabsContainer}>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'global' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('global')}
              >
                <MdTrendingUp />
                <span>Diagnóstico Global</span>
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'items' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('items')}
              >
                <MdAssignment />
                <span>Ítems Críticos ({diagnostico.analisisItemsCriticos?.length || 0})</span>
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'zonas' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('zonas')}
              >
                <MdLocationOn />
                <span>Zonas Prioritarias ({diagnostico.zonasPrioritarias?.length || 0})</span>
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'acciones' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('acciones')}
              >
                <MdFactCheck />
                <span>Plan de Acción Articulado</span>
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className={styles.body}>
          {errorMessage && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #f87171',
                borderRadius: '0.75rem',
                padding: '0.875rem 1rem',
                color: '#b91c1c',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <MdWarningAmber style={{ fontSize: '1.3rem', flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Estado Inicial: Sin diagnosticar */}
          {!diagnostico && !isLoading && (
            <div className={styles.welcomeCard}>
              <div className={styles.welcomeIcon}>
                <MdAutoAwesome />
              </div>
              <h3 className={styles.welcomeTitle}>
                Generar Informe Técnico Longitudinal de Aprendizajes
              </h3>
              <p className={styles.welcomeDesc}>
                La Inteligencia Artificial analizará las correlaciones de puntajes, la transición entre niveles
                CNEB (En Inicio, En Proceso, Logro Esperado) y los ítems con mayores dificultades cognitivas para
                estructurar un informe pedagógico oficial y un plan de acción para el cierre de brechas.
              </p>

              <div className={styles.dataPreviewPills}>
                <span className={styles.previewPill}>
                  📚 {gradoName} ({yearSelected})
                </span>
                <span className={styles.previewPill}>
                  🎯 {matrizRows.length} UGEL(s) / Jurisdicciones
                </span>
                <span className={styles.previewPill}>
                  📝 {preguntas.length} Ítems Evaluados
                </span>
                <span className={styles.previewPill}>
                  📊 EDI: {evaluacionEdi?.nombre ? 'Asignada' : 'Pendiente'} | EP1:{' '}
                  {evaluacionEp1?.nombre ? 'Asignada' : 'Pendiente'} | EP2:{' '}
                  {evaluacionEp2?.nombre ? 'Asignada' : 'Pendiente'}
                </span>
              </div>

              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleGenerarDiagnostico}
                style={{ marginTop: '1rem', fontSize: '0.95rem', padding: '0.8rem 1.75rem' }}
              >
                <MdAutoAwesome style={{ fontSize: '1.2rem' }} />
                <span>Iniciar Diagnóstico con IA</span>
              </button>
            </div>
          )}

          {/* Estado Cargando */}
          {isLoading && (
            <div className={styles.loadingContainer}>
              <RiLoader4Line className={`${styles.loadingSpinner} ${styles.spinAnimation}`} />
              <p className={styles.loadingText}>Procesando diagnóstico longitudinal con Gemini...</p>
              <p className={styles.loadingSubtext}>
                Analizando tendencias entre etapas EDI ➔ EP1 ➔ EP2, correlacionando errores cognitivos y
                redactando estrategias didácticas según el Currículo Nacional.
              </p>
            </div>
          )}

          {/* Estado Diagnóstico Listo */}
          {diagnostico && !isLoading && (
            <>
              {/* Contenido según pestaña */}
              {activeTab === 'global' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                      <MdSchool style={{ color: '#4f46e5', fontSize: '1.25rem' }} />
                      <h4 className={styles.sectionTitle}>Diagnóstico Pedagógico General</h4>
                    </div>
                    <p className={styles.sectionText}>{diagnostico.diagnosticoGlobal}</p>
                  </div>

                  <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                      <MdTrendingUp style={{ color: '#059669', fontSize: '1.25rem' }} />
                      <h4 className={styles.sectionTitle}>Transición y Movimiento de Niveles de Logro (CNEB)</h4>
                    </div>
                    <p className={styles.sectionText}>{diagnostico.analisisEvolucionNiveles}</p>
                  </div>

                  <div className={styles.sectionCard} style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <div className={styles.sectionHeader}>
                      <MdAutoAwesome style={{ color: '#16a34a', fontSize: '1.25rem' }} />
                      <h4 className={styles.sectionTitle} style={{ color: '#166534' }}>
                        Conclusión y Enfoque de Cierre de Brechas
                      </h4>
                    </div>
                    <p className={styles.sectionText} style={{ color: '#14532d' }}>
                      {diagnostico.conclusionPedagogica}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'items' && (
                <div className={styles.itemsGrid}>
                  {diagnostico.analisisItemsCriticos?.map((item, idx) => (
                    <div key={idx} className={styles.itemCard}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className={styles.itemBadge}>{item.item}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c2410c' }}>
                          Mayor Complejidad
                        </span>
                      </div>
                      <h5 className={styles.itemCompetencia}>{item.competenciaOEnfoque}</h5>
                      <div>
                        <strong style={{ fontSize: '0.75rem', color: '#334155' }}>Diagnóstico cognitivo:</strong>
                        <p className={styles.itemDiagnostico}>{item.diagnostico}</p>
                      </div>
                      <div className={styles.itemEstrategia}>
                        <strong style={{ display: 'block', marginBottom: '0.2rem' }}>
                          💡 Sugerencia Didáctica:
                        </strong>
                        <span>{item.estrategiaDidactica}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'zonas' && (
                <div className={styles.sectionCard} style={{ padding: 0, overflow: 'hidden' }}>
                  <table className={styles.zonasTable}>
                    <thead>
                      <tr>
                        <th>Institución / Zona</th>
                        <th>Nivel Alerta</th>
                        <th>Brecha Observada</th>
                        <th>Acción Focalizada UGEL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diagnostico.zonasPrioritarias?.map((z, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{z.zonaOInstitucion}</strong>
                          </td>
                          <td>
                            <span
                              className={
                                z.nivelAlerta === 'Alta'
                                  ? styles.alertBadgeHigh
                                  : z.nivelAlerta === 'Media'
                                  ? styles.alertBadgeMedium
                                  : styles.alertBadgeLow
                              }
                            >
                              {z.nivelAlerta}
                            </span>
                          </td>
                          <td>{z.observacion}</td>
                          <td>{z.accionFocalizada}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'acciones' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {diagnostico.accionesUgel && (
                    <div className={styles.sectionCard}>
                      <div className={styles.actionLevelGroup}>
                        <h4 className={styles.actionLevelTitle} style={{ color: '#1e3a8a' }}>
                          🏢 1. Acciones para Especialistas de la UGEL (Acompañamiento y Monitoreo)
                        </h4>
                        <ul className={styles.actionList}>
                          {diagnostico.accionesUgel.map((act, i) => (
                            <li key={i} className={styles.actionItem}>
                              {act}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {diagnostico.accionesDirectores && (
                    <div className={styles.sectionCard}>
                      <div className={styles.actionLevelGroup}>
                        <h4 className={styles.actionLevelTitle} style={{ color: '#b45309' }}>
                          🏫 2. Acciones para Directores de II.EE. (Gestión Pedagógica y GIAS)
                        </h4>
                        <ul className={styles.actionList}>
                          {diagnostico.accionesDirectores.map((act, i) => (
                            <li key={i} className={styles.actionItem}>
                              {act}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {diagnostico.accionesDocentes && (
                    <div className={styles.sectionCard}>
                      <div className={styles.actionLevelGroup}>
                        <h4 className={styles.actionLevelTitle} style={{ color: '#15803d' }}>
                          🧑‍🏫 3. Estrategias Didácticas para Docentes de Aula
                        </h4>
                        <ul className={styles.actionList}>
                          {diagnostico.accionesDocentes.map((act, i) => (
                            <li key={i} className={styles.actionItem}>
                              {act}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onClose}
          >
            Cerrar
          </button>

          <div className={styles.footerActions}>
            {diagnostico && (
              <>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={handleGenerarDiagnostico}
                  disabled={isLoading}
                  title="Volver a analizar con Gemini"
                >
                  <MdRefresh />
                  <span>Regenerar Diagnóstico</span>
                </button>

                <button
                  type="button"
                  className={styles.btnPdf}
                  onClick={handleExportarPDF}
                  disabled={isExportingPdf}
                >
                  <MdPictureAsPdf style={{ fontSize: '1.15rem' }} />
                  <span>{isExportingPdf ? 'Generando PDF...' : 'Descargar Informe Oficial (PDF)'}</span>
                </button>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
};

export default DiagnosticoIAModal;
