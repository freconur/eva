import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { RiLoader4Line, RiFileExcel2Line, RiDownloadLine } from 'react-icons/ri';
import { MdVisibility, MdAnalytics, MdClose, MdViewStream, MdGridView, MdViewModule, MdOutlineDashboardCustomize, MdSettings, MdAdminPanelSettings } from 'react-icons/md';
import { toast } from 'react-toastify';
import { getAllMonths } from '@/fuctions/dates';
import { Evaluaciones } from '@/features/types/types';
import { getFirestore, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { app } from '@/firebase/firebase.config';

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
  const [isAuditing, setIsAuditing] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const audited = sessionStorage.getItem('audited_user');
      const realAdmin = sessionStorage.getItem('real_admin_user');
      setIsAuditing(Boolean(audited || realAdmin));
    }
  }, [currentUserData]);

  const [accionesEspecialistaGlobal, setAccionesEspecialistaGlobal] = useState({
    exportarEstudiantes: true,
    exportarExcel: true,
  });

  React.useEffect(() => {
    const db = getFirestore(app);
    const brandDocRef = doc(db, 'configuracion', 'branding');
    const unsubscribe = onSnapshot(brandDocRef, (docSnap: any) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.accionesEspecialista) {
          setAccionesEspecialistaGlobal({
            exportarEstudiantes: data.accionesEspecialista.exportarEstudiantes !== false,
            exportarExcel: data.accionesEspecialista.exportarExcel !== false,
          });
        }
      }
    }, (err: any) => {
      console.error("Error al escuchar permisos globales de accionesEspecialista:", err);
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = currentUserData?.rol === 4 || isAuditing;
  const showExportEstudiantes = isAdmin || (
    evaluacion?.accionesEspecialista?.exportarEstudiantes !== false && accionesEspecialistaGlobal.exportarEstudiantes
  );
  const showExportExcel = isAdmin || (
    evaluacion?.accionesEspecialista?.exportarExcel !== false && accionesEspecialistaGlobal.exportarExcel
  );
  const hasAnyAction = isAdmin || showExportEstudiantes || showExportExcel;

  const handleChangeMonth = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMonthName = e.target.value;
    const foundMonth = getAllMonths.find((m) => m.name === selectedMonthName);
    if (foundMonth) {
      setMonthSelected(foundMonth.id);
    }
  };

  const handleTogglePermisoEspecialista = async (field: 'exportarEstudiantes' | 'exportarExcel', value: boolean) => {
    if (!idEvaluacion) return;
    try {
      const db = getFirestore(app);
      const evalRef = doc(db, 'evaluaciones', idEvaluacion);
      const currentAcciones = evaluacion?.accionesEspecialista || { exportarEstudiantes: true, exportarExcel: true };
      const updated = {
        ...currentAcciones,
        [field]: value,
      };
      await updateDoc(evalRef, {
        accionesEspecialista: updated,
      });
      toast.success(
        `Permiso "${field === 'exportarEstudiantes' ? 'Exportar Estudiantes' : 'Exportar Excel'}" ${
          value ? 'habilitado' : 'deshabilitado'
        } para especialistas.`
      );
    } catch (err) {
      console.error('Error al actualizar permisos de especialista:', err);
      toast.error('Ocurrió un error al guardar los permisos.');
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
          {hasAnyAction && (
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
                    {showExportEstudiantes && (
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
                    )}

                    {/* Option 2: Exportar Reporte (Excel) */}
                    {showExportExcel && (
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
                    )}

                    {/* Admin & non-realtime actions */}
                    {isAdmin && !evaluacion?.realtimeEnabled && (
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

                    {/* Admin configuration of Specialist permissions */}
                    {isAdmin && (
                      <>
                        <div className={styles.divider} />
                        <div
                          style={{
                            padding: '8px 12px 4px 12px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <MdAdminPanelSettings style={{ color: '#4f46e5', fontSize: '0.95rem' }} />
                          <span>Permisos Especialistas</span>
                        </div>
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 12px',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            color: '#334155',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <input
                            type="checkbox"
                            checked={evaluacion?.accionesEspecialista?.exportarEstudiantes !== false}
                            onChange={(e) => handleTogglePermisoEspecialista('exportarEstudiantes', e.target.checked)}
                            style={{ width: '16px', height: '16px', accentColor: '#4f46e5', cursor: 'pointer' }}
                          />
                          <span>Permitir Exportar Estudiantes</span>
                        </label>
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 12px',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            color: '#334155',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <input
                            type="checkbox"
                            checked={evaluacion?.accionesEspecialista?.exportarExcel !== false}
                            onChange={(e) => handleTogglePermisoEspecialista('exportarExcel', e.target.checked)}
                            style={{ width: '16px', height: '16px', accentColor: '#4f46e5', cursor: 'pointer' }}
                          />
                          <span>Permitir Exportar Excel</span>
                        </label>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HeaderControlesReporte;
