import React from 'react';
import { RiLoader4Line, RiFileExcel2Line, RiDownloadLine } from 'react-icons/ri';
import { MdVisibility, MdAnalytics, MdClose, MdViewStream, MdGridView, MdViewModule, MdOutlineDashboardCustomize } from 'react-icons/md';
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
  const currentMonthId = new Date().getMonth();
  const currentYear = new Date().getFullYear();

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
        </div>

        <div className={styles.exportGroup}>
          <button
            onClick={handleExportEstudiantesToExcel}
            className={styles.primaryButton}
            disabled={loadingExportEstudiantes}
          >
            {loadingExportEstudiantes ? (
              <>
                <RiLoader4Line className={styles.loaderIcon} />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <RiFileExcel2Line />
                <span>Estudiantes</span>
              </>
            )}
          </button>

          <button
            className={styles.secondaryButton}
            onClick={handleExportToExcel}
            disabled={loadingExport}
          >
            {loadingExport ? (
              <>
                <RiLoader4Line className={styles.loaderIcon} />
                <span>Exportando...</span>
              </>
            ) : (
              <>
                <RiDownloadLine />
                <span>Exportar Excel</span>
              </>
            )}
          </button>

          {currentUserData?.rol === 4 && !evaluacion?.realtimeEnabled && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={async () => {
                  toast.info('⏳ Cargando datos consolidados...');
                  await Promise.all([
                    loadConsolidado(),
                    fetchBarGraphicsData(),
                    fetchReportePreguntas()
                  ]);
                  toast.success('✅ Carga desde Storage completada.');
                }}
                className={styles.secondaryButton}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <MdVisibility />
                <span>Ver Consolidado</span>
              </button>

              <button
                onClick={handleGenerarConsolidado}
                className={styles.primaryButton}
                style={{ 
                  backgroundColor: (loadingConsolidado || !hasPieChartData) ? '#94a3b8' : '#4f46e5', 
                  color: 'white',
                  cursor: (loadingConsolidado || !hasPieChartData) ? 'not-allowed' : 'pointer'
                }}
                disabled={loadingConsolidado || !hasPieChartData}
              >
                {consolidationStatus?.status === 'processing' ? (
                  <>
                    <RiLoader4Line className={styles.loaderIcon} />
                    <span>{consolidationStatus.progress}% - {consolidationStatus.message || 'Procesando...'}</span>
                  </>
                ) : loadingConsolidado ? (
                  <>
                    <RiLoader4Line className={styles.loaderIcon} />
                    <span>Iniciando...</span>
                  </>
                ) : (
                  <>
                    <MdAnalytics />
                    <span>Generar Consolidado</span>
                  </>
                )}
              </button>

              {consolidationStatus?.status === 'processing' && (
                <button
                  onClick={handleDetenerConsolidado}
                  className={styles.secondaryButton}
                  style={{ 
                    backgroundColor: '#ef4444', 
                    color: 'white',
                    marginLeft: '8px'
                  }}
                >
                  <MdClose />
                  <span>Detener</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HeaderControlesReporte;
