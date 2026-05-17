import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { useGlobalContext, useGlobalContextDispatch } from '@/features/context/GlolbalContext';
import { useReporteDirectores } from '@/features/hooks/useReporteDirectores';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { useRegistros } from '@/features/hooks/useRegistros';
import { AppAction } from '@/features/actions/appAction';
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores';
import GraficoTendenciaColegio from '@/components/grafico-tendencia';
import Loader from '@/components/loader/loader';
import { Evaluacion } from '@/features/types/types';
import { FiSearch, FiBarChart2, FiInbox, FiShield, FiCalendar, FiChevronDown, FiCheck, FiFilter } from 'react-icons/fi';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { getAllMonths } from '@/fuctions/dates';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

import styles from './ReporteGlobal.module.css';

type SortMethod = 'crecimiento' | 'final' | 'alfabetico';

interface EvaluationData {
  nombre: string;
  promedioPorDocente: any[];
}

interface GraficoComparativoGlobalProps {
  loadedDataCache: Record<string, EvaluationData>;
}

export const GraficoComparativoGlobal = ({ loadedDataCache }: GraficoComparativoGlobalProps) => {
  const evalIds = useMemo(() => Object.keys(loadedDataCache), [loadedDataCache]);

  // Calcular rendimiento global acumulado por cada evaluación
  const globalData = useMemo(() => {
    const results = evalIds.map(id => {
      const data = loadedDataCache[id];
      const docentes = Array.isArray(data.promedioPorDocente) ? data.promedioPorDocente : [];

      let totalEstudiantes = 0;
      let totalSatisfactorio = 0;
      let totalProceso = 0;
      let totalPrevio = 0;
      let totalInicio = 0;

      docentes.forEach(doc => {
        const cant = doc.cantidad || 0;
        totalEstudiantes += cant;
        totalSatisfactorio += doc.distribucion?.satisfactorio || 0;
        totalProceso += doc.distribucion?.proceso || 0;
        totalPrevio += doc.distribucion?.previo || 0;
        totalInicio += doc.distribucion?.inicio || 0;
      });

      const pctGlobal = totalEstudiantes > 0 ? (totalSatisfactorio / totalEstudiantes) * 100 : 0;

      return {
        id,
        nombre: data.nombre,
        totalEstudiantes,
        totalSatisfactorio,
        totalProceso,
        totalPrevio,
        totalInicio,
        pctGlobal: Math.round(pctGlobal * 10) / 10
      };
    });

    // Ordenar de manera descendente por el porcentaje satisfactorio
    results.sort((a, b) => b.pctGlobal - a.pctGlobal);

    return results;
  }, [loadedDataCache, evalIds]);

  // Construcción de la data para el gráfico con transformación de escala raíz cuadrada
  const chartData: ChartData<'bar'> | null = useMemo(() => {
    if (globalData.length === 0) return null;

    return {
      labels: globalData.map(d => {
        // Truncar nombres de evaluación muy largos
        return d.nombre.length > 20 ? d.nombre.substring(0, 18) + '...' : d.nombre;
      }),
      datasets: [
        {
          label: 'Porcentaje Satisfactorio Global',
          // Aplicar escala raíz cuadrada: transforma val de 0-100 a una curva que amplifica valores bajos
          data: globalData.map(d => Math.sqrt(d.pctGlobal / 100) * 100),
          backgroundColor: '#10b981', // Verde esmeralda (Satisfactorio)
          hoverBackgroundColor: '#059669',
          borderRadius: 6,
          barThickness: 24,
          maxBarThickness: 28,
        }
      ]
    };
  }, [globalData]);

  // Configuración de las opciones del gráfico
  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y' as const,
      interaction: {
        intersect: false,
        axis: 'y' as const,
        mode: 'index' as const,
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          padding: 12,
          cornerRadius: 8,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          titleFont: { size: 13, weight: 'bold' as any, family: "'Inter', sans-serif" },
          bodyFont: { size: 12, family: "'Inter', sans-serif" },
          footerFont: { size: 12, weight: 'bold' as any, family: "'Inter', sans-serif" },
          callbacks: {
            title: function (context: any) {
              const index = context[0].dataIndex;
              const fullRecord = globalData[index];
              return fullRecord ? `Evaluación: ${fullRecord.nombre}` : '';
            },
            label: function (context: any) {
              const index = context.dataIndex;
              const r = globalData[index];
              const value = r ? r.pctGlobal : 0;
              return `✓ Rendimiento Global: ${value}% Satisfactorio`;
            },
            footer: function (context: any) {
              const index = context[0].dataIndex;
              const r = globalData[index];
              if (!r) return '';
              return `👥 Total Evaluados: ${r.totalEstudiantes} estudiantes\n\nNiveles consolidados:\n🟢 Satisfactorio: ${r.totalSatisfactorio}\n🟡 Proceso: ${r.totalProceso}\n🔴 Inicio/Previo: ${r.totalInicio + r.totalPrevio}`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          min: 0,
          max: 100,
          grid: {
            display: true,
            color: '#e2e8f0',
            drawBorder: false,
          },
          title: {
            display: true,
            text: 'Porcentaje Satisfactorio (%)',
            font: { size: 11, family: "'Inter', sans-serif", weight: '600' as any },
            color: '#64748b'
          },
          ticks: {
            color: '#64748b',
            font: { size: 10 },
            callback: (val: any) => {
              // Convertir el valor transformado de vuelta al original para mostrarlo en el eje X
              const original = Math.round((Math.pow(val, 2) / 100) * 10) / 10;
              return `${original}%`;
            }
          }
        },
        y: {
          grid: { display: false },
          ticks: {
            font: {
              weight: '600' as any,
              size: 11,
              family: "'Inter', sans-serif"
            },
            color: '#334155',
            autoSkip: false
          }
        }
      }
    };
  }, [globalData]);

  if (evalIds.length === 0) return null;

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '1rem',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      padding: '1.5rem',
      marginBottom: '2rem',
      width: '100%',
      minWidth: 0,
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: '2px solid #f1f5f9',
        paddingBottom: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '4px',
            height: '24px',
            borderRadius: '2px',
            background: 'linear-gradient(135deg, #10b981, #059669)'
          }}></span>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Comparativa Global: Rendimiento Acumulado
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Porcentaje satisfactorio consolidado de todos los profesores y secciones.
            </p>
          </div>
        </div>
      </div>

      <div style={{
        height: `${Math.max(260, globalData.length * 80)}px`,
        width: '100%',
        position: 'relative'
      }}>
        <Bar data={chartData!} options={chartOptions as any} />
      </div>
    </div>
  );
};

interface GraficoEvolucionDocentesProps {
  loadedDataCache: Record<string, EvaluationData>;
}

export const GraficoEvolucionDocentes = ({ loadedDataCache }: GraficoEvolucionDocentesProps) => {
  const evalIds = useMemo(() => Object.keys(loadedDataCache), [loadedDataCache]);

  // Selección de evaluaciones a comparar (por defecto las dos primeras)
  const [evalAId, setEvalAId] = useState(evalIds[0] || '');
  const [evalBId, setEvalBId] = useState(evalIds[1] || '');

  // Sincronizar estados si cambian las evaluaciones seleccionadas
  useEffect(() => {
    if (evalIds.length >= 2) {
      if (!evalIds.includes(evalAId)) setEvalAId(evalIds[0]);
      if (!evalIds.includes(evalBId)) setEvalBId(evalIds[1]);
    }
  }, [evalIds, evalAId, evalBId]);

  const evalA = loadedDataCache[evalAId];
  const evalB = loadedDataCache[evalBId];

  // Métodos de ordenamiento
  const [sortMethod, setSortMethod] = useState<SortMethod>('crecimiento');

  // Procesamiento y emparejamiento de docentes en común
  const comparisonData = useMemo(() => {
    if (!evalA || !evalB || evalAId === evalBId) return [];

    const docentesA = Array.isArray(evalA.promedioPorDocente) ? evalA.promedioPorDocente : [];
    const docentesB = Array.isArray(evalB.promedioPorDocente) ? evalB.promedioPorDocente : [];

    const mapA = new Map(docentesA.map(d => [d.docenteNombre?.trim().toLowerCase(), d]));
    const results: any[] = [];

    docentesB.forEach(dDocB => {
      const docName = dDocB.docenteNombre || 'Sin nombre';
      const cleanName = docName.trim().toLowerCase();

      if (mapA.has(cleanName)) {
        const dDocA = mapA.get(cleanName);

        // Eval A
        const totalA = dDocA.cantidad || 0;
        const satCountA = dDocA.distribucion?.satisfactorio || 0;
        const pctA = totalA > 0 ? (satCountA / totalA) * 100 : 0;

        // Eval B
        const totalB = dDocB.cantidad || 0;
        const satCountB = dDocB.distribucion?.satisfactorio || 0;
        const pctB = totalB > 0 ? (satCountB / totalB) * 100 : 0;

        const delta = pctB - pctA;

        results.push({
          docenteNombre: docName,
          pctA,
          pctB,
          delta,
          totalA,
          totalB
        });
      }
    });

    // Ordenar resultados según el método
    results.sort((a, b) => {
      if (sortMethod === 'crecimiento') {
        return b.delta - a.delta; // Mayor crecimiento primero
      } else if (sortMethod === 'final') {
        return b.pctB - a.pctB; // Mayor rendimiento en B primero
      } else {
        return a.docenteNombre.localeCompare(b.docenteNombre); // Alfabético
      }
    });

    return results;
  }, [evalA, evalB, evalAId, evalBId, sortMethod]);

  // Construcción de la data para el gráfico
  const chartData: ChartData<'bar'> | null = useMemo(() => {
    if (comparisonData.length === 0) return null;

    return {
      labels: comparisonData.map(d => {
        // Truncar nombres largos para el eje Y
        const name = d.docenteNombre;
        return name.length > 14 ? name.substring(0, 12) + '...' : name;
      }),
      datasets: [
        {
          label: evalA?.nombre || 'Evaluación A',
          data: comparisonData.map(d => Math.sqrt(d.pctA / 100) * 100),
          backgroundColor: '#94a3b8', // Gris azulado (línea base)
          borderRadius: 4,
          barThickness: 24,
          maxBarThickness: 28,
        },
        {
          label: evalB?.nombre || 'Evaluación B',
          data: comparisonData.map(d => Math.sqrt(d.pctB / 100) * 100),
          backgroundColor: '#6366f1', // Indigo vibrante (progreso)
          borderRadius: 4,
          barThickness: 24,
          maxBarThickness: 28,
        }
      ]
    };
  }, [comparisonData, evalA, evalB]);

  // Configuración de las opciones del gráfico
  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y' as const,
      interaction: {
        intersect: false,
        axis: 'y' as const,
        mode: 'index' as const,
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom' as const,
          labels: {
            boxWidth: 12,
            font: { size: 11, family: "'Inter', sans-serif" },
            color: '#475569',
            padding: 15,
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          padding: 12,
          cornerRadius: 8,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          titleFont: { size: 13, weight: 'bold' as any, family: "'Inter', sans-serif" },
          bodyFont: { size: 12, family: "'Inter', sans-serif" },
          footerFont: { size: 12, weight: 'bold' as any, family: "'Inter', sans-serif" },
          callbacks: {
            title: function (context: any) {
              const index = context[0].dataIndex;
              const fullRecord = comparisonData[index];
              return fullRecord ? `Docente: ${fullRecord.docenteNombre}` : '';
            },
            label: function (context: any) {
              const label = context.dataset.label || '';
              const index = context.dataIndex;
              const fullRecord = comparisonData[index];
              let value = 0;
              let totalEstudiantes = 0;
              if (fullRecord) {
                value = context.datasetIndex === 0 ? fullRecord.pctA : fullRecord.pctB;
                totalEstudiantes = context.datasetIndex === 0 ? fullRecord.totalA : fullRecord.totalB;
              }
              const roundedVal = Math.round(value * 10) / 10;
              return `✓ ${label}: ${roundedVal}% Satisfactorio (${totalEstudiantes} ${totalEstudiantes === 1 ? 'estudiante' : 'estudiantes'} evaluados)`;
            },
            footer: function (context: any) {
              const index = context[0].dataIndex;
              const fullRecord = comparisonData[index];
              if (!fullRecord) return '';
              const delta = Math.round(fullRecord.delta * 10) / 10;
              const sign = delta >= 0 ? '+' : '';
              const colorText = delta >= 0 ? '🟢' : '🔴';
              return `${colorText} Variación Neta: ${sign}${delta}%`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          min: 0,
          max: 100,
          grid: {
            display: true,
            color: '#e2e8f0',
            drawBorder: false,
          },
          title: {
            display: true,
            text: 'Porcentaje Satisfactorio (%)',
            font: { size: 11, family: "'Inter', sans-serif", weight: '600' as any },
            color: '#64748b'
          },
          ticks: {
            color: '#64748b',
            font: { size: 10 },
            callback: (val: any) => {
              // Convertir el valor transformado de vuelta al original para mostrarlo en el eje X
              const original = Math.round((Math.pow(val, 2) / 100) * 10) / 10;
              return `${original}%`;
            }
          }
        },
        y: {
          grid: { display: false },
          ticks: {
            font: {
              weight: '600' as any,
              size: 11,
              family: "'Inter', sans-serif"
            },
            color: '#334155',
            autoSkip: false
          }
        }
      }
    };
  }, [comparisonData]);

  if (evalIds.length < 2) return null;

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '1rem',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      padding: '1.5rem',
      marginBottom: '2rem',
      width: '100%',
      minWidth: 0,
      boxSizing: 'border-box'
    }}>
      {/* Encabezado e Interacciones del Workspace de Evolución */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #f1f5f9',
        paddingBottom: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '4px',
              height: '24px',
              borderRadius: '2px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)'
            }}></span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Evolución y Progreso Docente
            </h2>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Comparación directa de profesores evaluados en dos momentos académicos.
          </p>
        </div>

        {/* Controles de Selección e Intercalación */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Selector de Eval A */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Base (Línea Inicial)
            </span>
            <select
              value={evalAId}
              onChange={(e) => setEvalAId(e.target.value)}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#334155',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {evalIds.map(id => (
                <option key={id} value={id} disabled={id === evalBId}>
                  {loadedDataCache[id]?.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Icono de comparación interactivo clickable */}
          <button
            onClick={() => {
              const temp = evalAId;
              setEvalAId(evalBId);
              setEvalBId(temp);
            }}
            title="Intercambiar evaluaciones"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: '#6366f1',
              fontWeight: 700,
              marginTop: '12px',
              cursor: 'pointer',
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 8px',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#4f46e5';
              e.currentTarget.style.transform = 'scale(1.15)';
              e.currentTarget.style.backgroundColor = '#f1f5f9';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#6366f1';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ⇄
          </button>

          {/* Selector de Eval B */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Comparativa (Seguimiento)
            </span>
            <select
              value={evalBId}
              onChange={(e) => setEvalBId(e.target.value)}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#334155',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {evalIds.map(id => (
                <option key={id} value={id} disabled={id === evalAId}>
                  {loadedDataCache[id]?.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Orden */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Ordenar Por
            </span>
            <select
              value={sortMethod}
              onChange={(e) => setSortMethod(e.target.value as any)}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#334155',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="crecimiento">Mayor Progreso (Delta)</option>
              <option value="final">Desempeño en Comparativa</option>
              <option value="alfabetico">Nombre Alfabético</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visualización del Gráfico o Estado Vacío */}
      {evalAId === evalBId ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 2rem',
          textAlign: 'center',
          background: '#f8fafc',
          borderRadius: '0.75rem'
        }}>
          <span style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</span>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', margin: '0 0 0.5rem 0' }}>
            Selección Inválida
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', maxWidth: '300px' }}>
            Por favor selecciona dos evaluaciones diferentes para habilitar el análisis de progreso.
          </p>
        </div>
      ) : comparisonData.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 2rem',
          textAlign: 'center',
          background: '#f8fafc',
          borderRadius: '0.75rem'
        }}>
          <span style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👥</span>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', margin: '0 0 0.5rem 0' }}>
            Sin Coincidencias Docentes
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', maxWidth: '380px' }}>
            No se encontraron docentes en común que hayan sido evaluados en ambas evaluaciones seleccionadas (<strong>{evalA?.nombre}</strong> y <strong>{evalB?.nombre}</strong>).
          </p>
        </div>
      ) : (
        <div style={{
          height: `${Math.max(260, comparisonData.length * 80)}px`,
          width: '100%',
          position: 'relative'
        }}>
          <Bar data={chartData!} options={chartOptions as any} />
        </div>
      )}
    </div>
  );
};

interface EvaluacionReportCardProps {
  evaluacion: Evaluacion;
  onRemove: () => void;
  onDataLoaded?: (evalId: string, data: { nombre: string, promedioPorDocente: any[] }) => void;
}

const EvaluacionReportCard = ({ evaluacion, onRemove, onDataLoaded }: EvaluacionReportCardProps) => {
  const { currentUserData } = useGlobalContext();
  const {
    reporteDirectorEstudiantes,
    promedioPorDocente,
    isLoading,
    mesesConDataDisponibles,
    promedioGlobal,
    datosPorMes
  } = useReporteDirectores();

  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const loadResults = async () => {
      if (evaluacion && currentUserData?.dni) {
        setHasLoaded(false);
        await reporteDirectorEstudiantes(
          evaluacion.id!,
          Number(evaluacion.mesDelExamen),
          Number(evaluacion.añoDelExamen),
          currentUserData,
          evaluacion
        );
        setHasLoaded(true);
      }
    };
    loadResults();
  }, [evaluacion, currentUserData?.dni]);

  useEffect(() => {
    if (hasLoaded && promedioPorDocente && onDataLoaded && evaluacion.id) {
      onDataLoaded(evaluacion.id, {
        nombre: evaluacion.nombre || 'Evaluación',
        promedioPorDocente
      });
    }
  }, [hasLoaded, promedioPorDocente, onDataLoaded, evaluacion.id]);

  return (
    <div className={styles.reportCardWrapper}>
      <div className={styles.reportCardHeader}>
        <h3 className={styles.reportCardTitle}>{evaluacion.nombre}</h3>
        <button onClick={onRemove} className={styles.removeCardButton} title="Eliminar gráfico">
          ✕
        </button>
      </div>
      
      {isLoading ? (
        <div className={styles.loaderWrapperCard}><Loader text={`Procesando datos...`} /></div>
      ) : hasLoaded && promedioPorDocente.length === 0 ? (
        <div className={styles.emptyStateCard}>
          <div className={styles.emptyIconCard}><FiInbox size={32} color="#94a3b8" /></div>
          <h4 className={styles.emptyTitleCard}>Sin datos</h4>
          <p className={styles.emptyDescriptionCard}>No hay registros procesados para este examen.</p>
        </div>
      ) : hasLoaded ? (
        <GraficoTendenciaColegio
          evaluacion={evaluacion}
          datosPorMes={datosPorMes}
          mesesConDataDisponibles={mesesConDataDisponibles}
          promedioGlobal={promedioGlobal}
          monthSelected={Number(evaluacion.mesDelExamen)}
          dataGraficoTendenciaNiveles={[]}
          promedioPorDocente={promedioPorDocente}
          isFlat={true}
        />
      ) : null}
    </div>
  );
};

const ReporteGlobalDirectores = () => {
  const {
    currentUserData,
    evaluaciones,
  } = useGlobalContext();

  const dispatch = useGlobalContextDispatch();
  const db = getFirestore();
  const { getEvaluacionesOnce } = useAgregarEvaluaciones();
  const { getDocentesDeDirectores } = useRegistros();

  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedEvals, setSelectedEvals] = useState<Evaluacion[]>([]);
  const [gridColumns, setGridColumns] = useState<1 | 2 | 3>(2);
  const [showDropdown, setShowDropdown] = useState(false);

  // Caché de datos para la comparativa de evolución docente
  const [loadedDataCache, setLoadedDataCache] = useState<Record<string, {
    nombre: string;
    promedioPorDocente: any[];
  }>>({});

  const handleDataLoaded = React.useCallback((evalId: string, data: { nombre: string, promedioPorDocente: any[] }) => {
    setLoadedDataCache(prev => {
      if (prev[evalId] && prev[evalId].promedioPorDocente === data.promedioPorDocente) {
        return prev;
      }
      return {
        ...prev,
        [evalId]: data
      };
    });
  }, []);
  const [isListFromCache, setIsListFromCache] = useState(false);
  const [isUrlInitialized, setIsUrlInitialized] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const meses = getAllMonths;

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lógica de Centinela Global (Lista de Evaluaciones)
  useEffect(() => {
    const checkGlobalSentinelAndLoadList = async () => {
      try {
        const sentinelRef = doc(db, 'options', 'evaluaciones_sentinel');
        const sentinelSnap = await getDoc(sentinelRef);

        const latestSentinel = String(sentinelSnap.data()?.lastUpdate?.seconds || sentinelSnap.data()?.lastUpdate || "");

        const cachedList = localStorage.getItem('evaluaciones_list_cache');
        const cachedSentinel = localStorage.getItem('evaluaciones_list_sentinel');

        if (cachedList && cachedSentinel === latestSentinel) {
          dispatch({ type: AppAction.EVALUACIONES, payload: JSON.parse(cachedList) });
          setIsListFromCache(true);
        } else {
          const freshList = await getEvaluacionesOnce();
          if (freshList && freshList.length > 0) {
            localStorage.setItem('evaluaciones_list_cache', JSON.stringify(freshList));
            localStorage.setItem('evaluaciones_list_sentinel', latestSentinel);
          }
          setIsListFromCache(false);
        }
      } catch (error) {
        getEvaluacionesOnce();
      }
    };
    checkGlobalSentinelAndLoadList();
    if (currentUserData?.dni) getDocentesDeDirectores(currentUserData.dni);
  }, [currentUserData?.dni]);

  // 1. Leer los query parameters de la URL al cargar la página (URL -> State)
  useEffect(() => {
    if (!router.isReady || evaluaciones.length === 0 || isUrlInitialized) return;

    const { year, month, level, evalIds, search, cols } = router.query;

    if (year) {
      setSelectedYear(String(year));
    } else {
      setSelectedYear(new Date().getFullYear().toString());
    }

    if (month) setSelectedMonth(String(month));
    if (level) setSelectedLevel(String(level));
    if (search) setSearchTerm(String(search));
    if (cols) {
      const parsedCols = Number(cols);
      if (parsedCols === 1 || parsedCols === 2 || parsedCols === 3) {
        setGridColumns(parsedCols);
      }
    }

    if (evalIds) {
      const ids = String(evalIds).split(',');
      const foundEvals = evaluaciones.filter(ev => ids.includes(ev.id!));
      setSelectedEvals(foundEvals);
    }

    setIsUrlInitialized(true);
  }, [router.isReady, evaluaciones, isUrlInitialized]);

  // 2. Sincronizar cambios de filtros y selección hacia la URL (State -> URL)
  useEffect(() => {
    if (!isUrlInitialized) return;

    const query: Record<string, string> = {};

    if (selectedYear) query.year = selectedYear;
    if (selectedMonth) query.month = selectedMonth;
    if (selectedLevel) query.level = selectedLevel;
    if (searchTerm) query.search = searchTerm;
    if (selectedEvals.length > 0) {
      query.evalIds = selectedEvals.map(ev => ev.id).join(',');
    }
    if (gridColumns !== 2) {
      query.cols = String(gridColumns);
    }

    router.replace(
      {
        pathname: router.pathname,
        query,
      },
      undefined,
      { shallow: true }
    );
  }, [selectedYear, selectedMonth, selectedLevel, searchTerm, selectedEvals, gridColumns, isUrlInitialized]);

  // Lógica de Filtros en Cascada
  const availableFilters = useMemo(() => {
    const years = new Set<string>();
    const months = new Set<string>();
    const levels = new Set<string>();

    evaluaciones.forEach(ev => { if (ev.añoDelExamen) years.add(String(ev.añoDelExamen)); });

    const evalsDelAño = selectedYear
      ? evaluaciones.filter(ev => String(ev.añoDelExamen) === selectedYear)
      : evaluaciones;
    evalsDelAño.forEach(ev => { if (ev.mesDelExamen !== undefined) months.add(String(ev.mesDelExamen)); });

    const evalsDelMesYAño = selectedMonth
      ? evalsDelAño.filter(ev => String(ev.mesDelExamen) === selectedMonth)
      : evalsDelAño;
    evalsDelMesYAño.forEach(ev => { if (ev.nivel !== undefined) levels.add(String(ev.nivel)); });

    return {
      years: Array.from(years).sort((a, b) => b.localeCompare(a)),
      months: Array.from(months).sort((a, b) => Number(a) - Number(b)),
      levels: Array.from(levels).sort((a, b) => Number(a) - Number(b))
    };
  }, [evaluaciones, selectedYear, selectedMonth]);

  // Resets de filtros condicionados
  useEffect(() => {
    if (selectedMonth && !availableFilters.months.includes(selectedMonth)) setSelectedMonth('');
  }, [selectedYear, availableFilters.months]);

  useEffect(() => {
    if (selectedLevel && !availableFilters.levels.includes(selectedLevel)) setSelectedLevel('');
  }, [selectedMonth, availableFilters.levels]);

  const filteredEvaluaciones = useMemo(() => {
    return evaluaciones.filter(ev => {
      const matchesSearch = !searchTerm ||
        ev.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.grado?.toString().includes(searchTerm);
      const matchesYear = !selectedYear || String(ev.añoDelExamen) === selectedYear;
      const matchesMonth = !selectedMonth || String(ev.mesDelExamen) === selectedMonth;
      const matchesLevel = !selectedLevel || String(ev.nivel) === selectedLevel;
      return matchesSearch && matchesYear && matchesMonth && matchesLevel;
    });
  }, [evaluaciones, searchTerm, selectedYear, selectedMonth, selectedLevel]);

  // Helper para mostrar el nombre del nivel
  const getLevelName = (l: string) => {
    switch (String(l)) {
      case '0': return 'Inicial';
      case '1': return 'Primaria';
      case '2': return 'Secundaria';
      default: return `Nivel ${l}`;
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase()
            ? <span key={i} className={styles.highlight}>{part}</span>
            : part
        )}
      </span>
    );
  };

  return (
    <PrivateRouteDirectores>
      <div className={styles.container}>
        <header className={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className={styles.title}>Resultados por Evaluación</h1>
              <p className={styles.subtitle}>Seleccione una o más evaluaciones para ver el análisis regional comparativo.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
              {isListFromCache && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '20px', fontWeight: 500 }}><FiShield /> Lista optimizada</div>}
            </div>
          </div>
        </header>

        <section className={styles.controlsContainer}>
          <div className={styles.filterItem}>
            <select className={styles.select} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="">Años</option>
              {availableFilters.years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>

          <div className={styles.filterItem}>
            <select className={styles.select} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              <option value="">Meses</option>
              {availableFilters.months.map(m => (
                <option key={m} value={m}>{meses[Number(m)]?.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <select className={styles.select} value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
              <option value="">Niveles</option>
              {availableFilters.levels.map(l => (
                <option key={l} value={l}>{getLevelName(l)}</option>
              ))}
            </select>
          </div>

          <div className={styles.searchWrapper} ref={searchRef}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar evaluación o grado..."
              className={styles.searchInput}
              value={searchTerm}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
            />
            <FiChevronDown className={styles.arrowIcon} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />

            {showDropdown && (
              <div className={styles.predictiveDropdown}>
                {filteredEvaluaciones.length > 0 ? (
                  filteredEvaluaciones.map(ev => (
                    <div
                      key={ev.id}
                      className={`${styles.dropdownItem} ${selectedEvals.some(e => e.id === ev.id) ? styles.dropdownItemActive : ''}`}
                      onClick={() => {
                        if (selectedEvals.some(e => e.id === ev.id)) {
                          setSelectedEvals(prev => prev.filter(e => e.id !== ev.id));
                          setLoadedDataCache(prev => {
                            const copy = { ...prev };
                            delete copy[ev.id!];
                            return copy;
                          });
                        } else {
                          setSelectedEvals(prev => [...prev, ev]);
                        }
                        setSearchTerm('');
                        setShowDropdown(false);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div>
                          <span style={{ fontWeight: 600 }}>{highlightText(ev.nombre || '', searchTerm)}</span>
                          <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '10px' }}>Grado: {highlightText(ev.grado?.toString() || '', searchTerm)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                            {meses[Number(ev.mesDelExamen)]?.name.substring(0, 3)} {ev.añoDelExamen}
                          </span>
                          {selectedEvals.some(e => e.id === ev.id) && <FiCheck color="#10b981" />}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.noResultsItem}>No hay resultados con estos filtros</div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Listado de etiquetas seleccionadas */}
        {selectedEvals.length > 0 && (
          <div className={styles.selectedTagsContainer}>
            <span className={styles.selectedTagsLabel}>Seleccionados:</span>
            {selectedEvals.map(ev => (
              <span key={ev.id} className={styles.evalTag}>
                {ev.nombre}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEvals(prev => prev.filter(e => e.id !== ev.id));
                    setLoadedDataCache(prev => {
                      const copy = { ...prev };
                      delete copy[ev.id!];
                      return copy;
                    });
                  }}
                  className={styles.tagRemoveBtn}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Encabezado y Control de Columnas Grid */}
        {selectedEvals.length > 0 && (
          <div className={styles.gridHeaderBar}>
            <h2 className={styles.gridSectionTitle}>Gráficos de Resultados</h2>
            <div className={styles.colsSelectorContainer}>
              <span className={styles.colsSelectorLabel}>Diseño de Columnas:</span>
              <div className={styles.colsSelector}>
                <button
                  onClick={() => setGridColumns(1)}
                  className={`${styles.colsBtn} ${gridColumns === 1 ? styles.colsBtnActive : ''}`}
                  title="1 Columna"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="6" width="18" height="4" rx="1.5" />
                    <rect x="3" y="14" width="18" height="4" rx="1.5" />
                  </svg>
                </button>
                <button
                  onClick={() => setGridColumns(2)}
                  className={`${styles.colsBtn} ${gridColumns === 2 ? styles.colsBtnActive : ''}`}
                  title="2 Columnas"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  </svg>
                </button>
                <button
                  onClick={() => setGridColumns(3)}
                  className={`${styles.colsBtn} ${gridColumns === 3 ? styles.colsBtnActive : ''}`}
                  title="3 Columnas"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="3" width="4" height="4" rx="1" />
                    <rect x="10" y="3" width="4" height="4" rx="1" />
                    <rect x="17" y="3" width="4" height="4" rx="1" />
                    <rect x="3" y="10" width="4" height="4" rx="1" />
                    <rect x="10" y="10" width="4" height="4" rx="1" />
                    <rect x="17" y="10" width="4" height="4" rx="1" />
                    <rect x="3" y="17" width="4" height="4" rx="1" />
                    <rect x="10" y="17" width="4" height="4" rx="1" />
                    <rect x="17" y="17" width="4" height="4" rx="1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <main className={styles.resultsContainer}>
          {selectedEvals.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><FiBarChart2 color="#3b82f6" /></div>
              <h2 className={styles.emptyTitle}>Inicie la búsqueda</h2>
              <p className={styles.emptyDescription}>Filtre paso a paso para encontrar y agregar exámenes.</p>
            </div>
          ) : (
            <>
              {Object.keys(loadedDataCache).length >= 2 && (
                <div className={styles.chartsGridConsolidated}>
                  <GraficoComparativoGlobal loadedDataCache={loadedDataCache} />
                  <GraficoEvolucionDocentes loadedDataCache={loadedDataCache} />
                </div>
              )}
              <div className={`${styles.evaluationsGrid} ${styles[`gridCols${gridColumns}`]}`}>
                {selectedEvals.map(ev => (
                  <EvaluacionReportCard
                    key={ev.id}
                    evaluacion={ev}
                    onRemove={() => {
                      setSelectedEvals(prev => prev.filter(e => e.id !== ev.id));
                      setLoadedDataCache(prev => {
                        const copy = { ...prev };
                        delete copy[ev.id!];
                        return copy;
                      });
                    }}
                    onDataLoaded={handleDataLoaded}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </PrivateRouteDirectores>
  );
};

export default ReporteGlobalDirectores;
