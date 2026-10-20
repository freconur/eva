import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  MdDeleteForever,
  MdEditSquare,
  MdAddCircle,
  MdVisibility,
  MdVisibilityOff,
} from 'react-icons/md'
import {
  RiLoader4Line,
  RiBookOpenLine,
  RiTimeLine,
  RiShieldCheckLine,
  RiGraduationCapLine,
} from 'react-icons/ri'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas'
import { CrearEvaluacionDocente } from '@/features/types/types'
import CrearEvaluacionEspecialista from '@/modals/crearEvaluacionEspecialista'
import DeleteEvaluacionEspecialista from '@/modals/DeleteEvaluacionEscpecialista'
import UpdateEvaluacionEspecialista from '@/modals/updateEvaluacionEspecialista'
import ModalAlertaFaseRequerida from '@/components/evaluaciones-desempeno/modals/ModalAlertaFaseRequerida'
import {
  DesempenoHeroBanner,
  HeroBannerMetricItem,
} from '@/components/evaluaciones-desempeno'
import styles from './evaluaciones-especialistas.module.css'

const EvaluacionesDesempeñoDocentes = () => {
  const { getEvaluacionesEspecialistas, updateEstadoEvaluacion } = UseEvaluacionEspecialistas()
  const { evaluacionDesempeñoDocente, loaderPages } = useGlobalContext()
  const [showModalCrearEvaluacion, setShowCrearEvaluacion] = useState<boolean>(false)
  const [idEva, setIdEva] = useState<string>('')
  const [evaluacion, setEvaluacion] = useState<CrearEvaluacionDocente>({})
  const [showDelete, setShowDelete] = useState<boolean>(false)
  const [inputUpdate, setInputUpdate] = useState<boolean>(false)
  const [faseRequeridaModal, setFaseRequeridaModal] = useState<{
    isOpen: boolean;
    evaluacionTitulo: string;
    detailUrl: string;
  }>({
    isOpen: false,
    evaluacionTitulo: '',
    detailUrl: '',
  });

  const handleActivarEvaluacion = (ev: CrearEvaluacionDocente) => {
    const tieneFase = Boolean(
      ev.faseNombre?.trim() ||
      (Array.isArray(ev.fases) && ev.fases.length > 0 && ev.fases.some((f: any) => f?.nombre?.trim()))
    );

    if (!tieneFase) {
      setFaseRequeridaModal({
        isOpen: true,
        evaluacionTitulo: ev.name || 'Evaluación',
        detailUrl: `/admin/especialistas/evaluaciones-especialistas/evaluacion/${ev.id}`,
      });
      return;
    }

    updateEstadoEvaluacion(ev.id!, true);
  };

  const sortedEvaluaciones = useMemo(() => {
    if (!evaluacionDesempeñoDocente) return []
    return [...evaluacionDesempeñoDocente].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' })
    )
  }, [evaluacionDesempeñoDocente])

  // Métricas dinámicas para el Hero Banner
  const metricasBanner = useMemo(() => {
    const list = evaluacionDesempeñoDocente || []
    const total = list.length
    const activas = list.filter((eva) => Boolean(eva.active)).length
    const inactivas = total - activas
    const categoriasSet = new Set<string>()
    list.forEach((eva) => {
      if (eva.categoria) categoriasSet.add(eva.categoria)
    })
    const totalCategorias = categoriasSet.size

    return {
      total,
      activas,
      inactivas,
      totalCategorias,
    }
  }, [evaluacionDesempeñoDocente])

  const metricsItems = useMemo<HeroBannerMetricItem[]>(() => {
    return [
      {
        id: 'total',
        label: 'Evaluaciones',
        value: metricasBanner.total,
        icon: RiBookOpenLine,
        colorTheme: 'blue',
        tooltip: `${metricasBanner.total} evaluaciones registradas en el sistema`,
        badgeText: 'Total',
        helperText: 'Instrumentos registrados',
      },
      {
        id: 'activas',
        label: 'Activas',
        value: metricasBanner.activas,
        icon: RiTimeLine,
        colorTheme: 'teal',
        tooltip: `${metricasBanner.activas} evaluaciones visibles y activas para especialistas`,
        badgeText: 'Visibles',
        helperText: 'Disponibles para evaluación',
      },
      {
        id: 'inactivas',
        label: 'Inactivas',
        value: metricasBanner.inactivas,
        icon: RiShieldCheckLine,
        colorTheme: 'purple',
        tooltip: `${metricasBanner.inactivas} evaluaciones inactivas u ocultas para especialistas`,
        badgeText: 'Ocultas',
        helperText: 'En edición o pausadas',
      },
      {
        id: 'categorias',
        label: 'Categorías',
        value: metricasBanner.totalCategorias,
        icon: RiGraduationCapLine,
        colorTheme: 'amber',
        tooltip: `${metricasBanner.totalCategorias} categorías o áreas de evaluación configuradas`,
        badgeText: 'Áreas',
        helperText: 'Categorías configuradas',
      },
    ]
  }, [metricasBanner])

  const handleShowInputUpdate = () => { setInputUpdate(!inputUpdate) }
  const handleShowModalDelete = () => { setShowDelete(!showDelete) }
  const handleShowModalCrearEvaluacion = () => {
    setShowCrearEvaluacion(!showModalCrearEvaluacion)
  }

  useEffect(() => {
    getEvaluacionesEspecialistas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className={styles.container}>
        {showDelete && <DeleteEvaluacionEspecialista handleShowModalDelete={handleShowModalDelete} idEva={idEva} />}
        {showModalCrearEvaluacion && <CrearEvaluacionEspecialista handleShowModalCrearEvaluacion={handleShowModalCrearEvaluacion} />}
        {inputUpdate && <UpdateEvaluacionEspecialista handleShowInputUpdate={handleShowInputUpdate} evaluacion={evaluacion} />}
        <ModalAlertaFaseRequerida
          isOpen={faseRequeridaModal.isOpen}
          onClose={() => setFaseRequeridaModal((prev) => ({ ...prev, isOpen: false }))}
          evaluacionTitulo={faseRequeridaModal.evaluacionTitulo}
          detailUrl={faseRequeridaModal.detailUrl}
        />

        {/* Hero Banner Modular Reutilizable */}
        <div className="mb-6 w-full">
          <DesempenoHeroBanner
            routeKey="admin_especialistas"
            title="EVALUACIONES DE ESPECIALISTAS"
            subtitle="Gestión y configuración de instrumentos de desempeño docente ejecutados por especialistas"
            badgeTema="Especialistas"
            metrics={metricsItems}
            actions={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShowModalCrearEvaluacion}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white text-slate-800 hover:bg-slate-100 hover:text-blue-600 transition-all duration-200 shadow-sm border border-slate-200 cursor-pointer active:scale-95"
                  title="Crear nueva evaluación"
                  aria-label="Crear nueva evaluación"
                >
                  <MdAddCircle className="text-lg text-blue-600" />
                  <span className="hidden sm:inline">Crear Evaluación</span>
                </button>
              </div>
            }
          />
        </div>

        {loaderPages ? (
          <div className={styles.loaderContainer}>
            <RiLoader4Line className={styles.loaderIcon} />
            <p className={styles.loaderText}>Buscando resultados...</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead className={styles.tableHeader}>
                <tr className={styles.tableHeaderRow}>
                  <th className={`${styles.tableHeaderCell} ${styles.tableHeaderCellNumber}`}>#</th>
                  <th className={styles.tableHeaderCell}>Nombre de Evaluación</th>
                  <th className={styles.tableHeaderCell}>Categoría</th>
                  <th className={styles.tableHeaderCell}>Activo</th>
                  <th className={styles.tableHeaderCell}></th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {sortedEvaluaciones?.map((evaluacion, index) => (
                  <tr key={evaluacion.id || index} className={styles.tableRow}>
                    <td className={`${styles.tableCell} ${styles.tableCellNumber}`}>
                      {index + 1}
                    </td>
                    <td className={styles.tableCell}>
                      <Link
                        href={`/admin/especialistas/evaluaciones-especialistas/evaluacion/${evaluacion.id}`}
                        className={styles.tableCellLink}
                      >
                        {evaluacion.name}
                      </Link>
                    </td>
                    <td className={styles.tableCell}>
                      <span className={styles.categoryBadge}>
                        {evaluacion.categoria}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.actionsCell} style={{ justifyContent: 'center' }}>
                        {evaluacion.active ? (
                          <MdVisibility
                            onClick={() => updateEstadoEvaluacion(evaluacion.id!, false)}
                            className={`${styles.actionIcon} ${styles.viewIcon}`}
                            title="Desactivar (Ocultar para especialistas)"
                          />
                        ) : (
                          <MdVisibilityOff
                            onClick={() => handleActivarEvaluacion(evaluacion)}
                            className={`${styles.actionIcon} ${styles.viewOffIcon}`}
                            title="Activar (Visible para especialistas)"
                          />
                        )}
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.actionsCell}>
                        <MdEditSquare
                          onClick={() => {
                            handleShowInputUpdate()
                            setEvaluacion(evaluacion)
                          }}
                          className={`${styles.actionIcon} ${styles.editIcon}`}
                          title="Editar"
                        />
                        <MdDeleteForever
                          onClick={() => {
                            handleShowModalDelete()
                            setIdEva(`${evaluacion.id}`)
                          }}
                          className={`${styles.actionIcon} ${styles.deleteIcon}`}
                          title="Eliminar"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default EvaluacionesDesempeñoDocentes