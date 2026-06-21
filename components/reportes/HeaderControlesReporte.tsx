import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { RiLoader4Line, RiFileExcel2Line, RiDownloadLine } from 'react-icons/ri';
import { MdVisibility, MdAnalytics, MdClose, MdViewStream, MdGridView, MdViewModule, MdOutlineDashboardCustomize, MdSettings } from 'react-icons/md';
import { toast } from 'react-toastify';
import { getAllMonths } from '@/fuctions/dates';
import { Evaluaciones } from '@/features/types/types';

interface HeaderControlesReporteProps {
  evaluacion: Evaluaciones;
  styles: any;
  monthSelected: number;
  setMonthSelected: (month: number) => void;
  yearSelected: number;
  years: number[];
  handleChangeYear: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  chartColumns: number;
  setChartColumns: (cols: number) => void;
  loadingExportEstudiantes: boolean;
  handleExportEstudiantesToExcel: () => void;
  loadingExport: boolean;
  handleExportToExcel: () => void;
  currentUserData: any;
  loadConsolidado: () => Promise<void>;
  fetchBarGraphicsData: () => Promise<void>;
  fetchReportePreguntas: () => Promise<void>;
  handleGenerarConsolidado: () => Promise<void>;
  loadingConsolidado: boolean;
  hasPieChartData: boolean;
  consolidationStatus: any;
  handleDetenerConsolidado: () => Promise<void>;
  onOpenOrganizer: () => void;
}

const HeaderControlesReporte: React.FC<HeaderControlesReporteProps> = ({
  evaluacion,
  styles,
  monthSelected,
  setMonthSelected,
  yearSelected,
  years,
  handleChangeYear,
  chartColumns,
  setChartColumns,
  loadingExportEstudiantes,
  handleExportEstudiantesToExcel,
  loadingExport,
  handleExportToExcel,
  currentUserData,
  loadConsolidado,
  fetchBarGraphicsData,
  fetchReportePreguntas,
  handleGenerarConsolidado,
  loadingConsolidado,
  hasPieChartData,
  consolidationStatus,
  handleDetenerConsolidado,
  onOpenOrganizer,
}) => {
  const router = useRouter();
  const currentMonthId = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const idEvaluacion = evaluacion?.id || (router.query.idEvaluacion as string);

  const handleChangeMonth = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMonthName = e.target.value;
    const foundMonth = getAllMonths.find((m) => m.name === selectedMonthName);
    if (foundMonth) {
      setMonthSelected(foundMonth.id);
    }
  };

  return (
    <>
      <h1 className={styles.title}>{evaluacion?.nombre?.toUpperCase() || 'REPORTE'}</h1>

      <div className={styles.toolbar}>
        <div className={styles.controlsGroup}>
          <select
            className={styles.select}
            onChange={handleChangeMonth}
            value={getAllMonths[monthSelected]?.name || ''}
          >
            {evaluacion?.mesDelExamen ? (
              (() => {
                const examMonthId = Number(evaluacion.mesDelExamen);
                const examMonth = getAllMonths.find((m) => m.id === examMonthId);
                return examMonth ? (
                  <option key={examMonth.id} value={examMonth.name}>
                    {examMonth.name}
                  </option>
                ) : null;
              })()
            ) : (
              <>
                <option value="">Mes</option>
                {getAllMonths.slice(0, yearSelected < currentYear ? getAllMonths.length : currentMonthId + 1).map((mes) => (
                  <option key={mes.id} value={mes.name}>
                    {mes.name}
                  </option>
                ))}
              </>
            )}
          </select>

          <select
            className={styles.select}
            onChange={handleChangeYear}
            value={yearSelected}
          >
            {evaluacion?.añoDelExamen ? (
              <option value={evaluacion.añoDelExamen}>
                {evaluacion.añoDelExamen}
              </option>
            ) : (
              years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))
            )}
          </select>

          {/* Selector de Layout de Gráficos */}
          <div className={styles.layoutSelector}>
            <button
              onClick={() => setChartColumns(1)}
              className={`${styles.layoutButton} ${chartColumns === 1 ? styles.layoutButtonActive : ''}`}
              title="1 Columna"
            >
              <MdViewStream />
            </button>
            <button
              onClick={() => setChartColumns(2)}
              className={`${styles.layoutButton} ${chartColumns === 2 ? styles.layoutButtonActive : ''}`}
              title="2 Columnas"
            >
              <MdGridView />
            </button>
            <button
              onClick={() => setChartColumns(3)}
              className={`${styles.layoutButton} ${chartColumns === 3 ? styles.layoutButtonActive : ''}`}
              title="3 Columnas"
            >
              <MdViewModule />
            </button>
          </div>

          {/* Botón para abrir Organizador de Gráficos */}
          {evaluacion?.tipoDeEvaluacion === '1' && (
            <button
              onClick={onOpenOrganizer}
              className={styles.layoutButton}
              style={{
                marginLeft: '8px',
                padding: '0 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: '38px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#94a3b8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              title="Organizar posición de gráficos"
            >
              <MdOutlineDashboardCustomize style={{ fontSize: '1.1rem', color: '#4f46e5' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Organizar</span>
            </button>
          )}

          {/* Botón Atajo a Configurar Evaluación */}
          {idEvaluacion && (
            <Link
              href={`/admin/evaluaciones/evaluacion/${idEvaluacion}`}
              className={styles.layoutButton}
              style={{
                marginLeft: '8px',
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: '38px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#94a3b8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              title="Configurar y gestionar esta evaluación"
            >
              <MdSettings style={{ fontSize: '1.1rem', color: '#6366f1' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Configurar</span>
            </Link>
          )}
        </div>

        <div className={styles.exportGroup}>
          <div className={styles.customSelectContainer}>
            <button
              type="button"
              onClick={() => setShowActionsMenu(prev => !prev)}
              className={`${styles.customSelectButton} ${showActionsMenu ? styles.customSelectButtonActive : ''}`}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {loadingExportEstudiantes || loadingExport || loadingConsolidado || consolidationStatus?.status === 'processing' ? (
                  <RiLoader4Line className={styles.loaderIcon} />
                ) : (
                  <MdOutlineDashboardCustomize style={{ color: '#4f46e5', fontSize: '1.1rem' }} />
                )}
                <span>Acciones</span>
              </span>
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>▼</span>
            </button>

            {showActionsMenu && (
              <>
                <div className={styles.customSelectOverlay} onClick={() => setShowActionsMenu(false)} />
                <div className={styles.customSelectDropdown}>
                  {/* Option 1: Exportar Estudiantes */}
                  <button
                    onClick={() => {
                      setShowActionsMenu(false);
                      handleExportEstudiantesToExcel();
                    }}
                    disabled={loadingExportEstudiantes}
                    className={styles.customSelectOption}
                  >
                    <RiFileExcel2Line style={{ color: '#22c55e', fontSize: '1.1rem' }} />
                    <span>{loadingExportEstudiantes ? 'Exportando Estudiantes...' : 'Exportar Estudiantes'}</span>
                  </button>

                  {/* Option 2: Exportar Reporte (Excel) */}
                  <button
                    onClick={() => {
                      setShowActionsMenu(false);
                      handleExportToExcel();
                    }}
                    disabled={loadingExport}
                    className={styles.customSelectOption}
                  >
                    <RiDownloadLine style={{ color: '#3b82f6', fontSize: '1.1rem' }} />
                    <span>{loadingExport ? 'Exportando Excel...' : 'Exportar Excel'}</span>
                  </button>

                  {/* Admin & non-realtime actions */}
                  {currentUserData?.rol === 4 && !evaluacion?.realtimeEnabled && (
                    <>
                      <div className={styles.divider} />

                      {/* Option 3: Ver Consolidado */}
                      <button
                        onClick={async () => {
                          setShowActionsMenu(false);
                          toast.info('⏳ Cargando datos consolidados...');
                          await Promise.all([
                            loadConsolidado(),
                            fetchBarGraphicsData(),
                            fetchReportePreguntas()
                          ]);
                          toast.success('✅ Carga desde Storage completada.');
                        }}
                        className={styles.customSelectOption}
                      >
                        <MdVisibility style={{ color: '#6366f1', fontSize: '1.1rem' }} />
                        <span>Ver Consolidado</span>
                      </button>

                      {/* Option 4: Generar Consolidado */}
                      <button
                        onClick={() => {
                          setShowActionsMenu(false);
                          handleGenerarConsolidado();
                        }}
                        disabled={loadingConsolidado || !hasPieChartData || consolidationStatus?.status === 'processing'}
                        className={styles.customSelectOption}
                      >
                        <MdAnalytics style={{ color: '#f59e0b', fontSize: '1.1rem' }} />
                        <span>
                          {consolidationStatus?.status === 'processing'
                            ? `Generando (${consolidationStatus.progress}%)`
                            : loadingConsolidado
                            ? 'Iniciando...'
                            : 'Generar Consolidado'}
                        </span>
                      </button>

                      {/* Option 5 (Conditional): Detener Consolidado */}
                      {consolidationStatus?.status === 'processing' && (
                        <button
                          onClick={() => {
                            setShowActionsMenu(false);
                            handleDetenerConsolidado();
                          }}
                          className={styles.customSelectOption}
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.05)',
                            color: '#ef4444',
                            fontWeight: 600
                          }}
                        >
                          <MdClose style={{ color: '#ef4444', fontSize: '1.1rem' }} />
                          <span>Detener Consolidación</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HeaderControlesReporte;
