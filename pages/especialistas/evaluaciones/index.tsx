import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { RiSettings3Line } from 'react-icons/ri'
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista'
import { useGlobalContext, useGlobalContextDispatch } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { AppAction } from '@/features/actions/appAction'
import { getMonthName } from '@/fuctions/dates'
import { getGradoTexto } from '@/fuctions/regiones'
import SegmentedFilterBar from '@/components/common/SegmentedFilterBar'
import EvaluacionesHeroBanner from '@/components/evaluaciones/EvaluacionesHeroBanner'
import EvaluacionesTable from '@/components/evaluaciones/EvaluacionesTable'
import useEvaluacionesBannerConfig from '@/components/evaluaciones/useEvaluacionesBannerConfig'

const Evaluaciones = () => {
  const router = useRouter()
  const { getEvaluaciones, getEvaluacionesOnce } = useAgregarEvaluaciones()
  const dispatch = useGlobalContextDispatch()
  const db = getFirestore()
  const { evaluaciones, currentUserData, loaderPages, grados } = useGlobalContext()
  const currentYear = new Date().getFullYear()

  // Estados para filtros
  const [selectedGrado, setSelectedGrado] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedEstado, setSelectedEstado] = useState<string>('activo')
  const [isUrlInitialized, setIsUrlInitialized] = useState<boolean>(false)

  // Configuración de vista del Hero Banner (Compacta vs Grande, persistente en Firestore)
  const bannerConfig = useEvaluacionesBannerConfig({ routeKey: 'especialistas' })

  useEffect(() => {
    const checkGlobalSentinelAndLoadList = async () => {
      try {
        const sentinelRef = doc(db, 'options', 'evaluaciones_sentinel')
        const sentinelSnap = await getDoc(sentinelRef)

        const latestSentinel = String(
          sentinelSnap.data()?.lastUpdate?.seconds ||
            sentinelSnap.data()?.lastUpdate ||
            ''
        )

        const cachedList = localStorage.getItem('evaluaciones_list_cache')
        const cachedSentinel = localStorage.getItem('evaluaciones_list_sentinel')

        if (cachedList && cachedSentinel === latestSentinel) {
          dispatch({ type: AppAction.EVALUACIONES, payload: JSON.parse(cachedList) })
        } else {
          const freshList = await getEvaluacionesOnce()
          if (freshList && freshList.length > 0) {
            localStorage.setItem('evaluaciones_list_cache', JSON.stringify(freshList))
            localStorage.setItem('evaluaciones_list_sentinel', latestSentinel)
          }
        }
      } catch (error) {
        console.error('Error al cargar evaluaciones con centinela en especialistas:', error)
        getEvaluaciones()
      }
    }

    checkGlobalSentinelAndLoadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Evaluaciones accesibles para especialistas: solo activas (active === true), excluyendo ocultas (active === false),
  // y que pertenezcan al nivel de la institución educativa o jurisdicción del especialista.
  const evaluacionesVisiblesEspecialista = useMemo(() => {
    const nivelDeInstitucion = currentUserData?.nivelDeInstitucion
    if (!Array.isArray(nivelDeInstitucion) || nivelDeInstitucion.length === 0) return []

    return (
      evaluaciones?.filter((eva) => {
        if (!eva.active) return false

        const nivelEva = Array.isArray(eva.nivel) ? eva.nivel[0] : eva.nivel
        return nivelDeInstitucion.includes(Number(nivelEva))
      }) || []
    )
  }, [evaluaciones, currentUserData?.nivelDeInstitucion])

  // Helper para obtener el mes más reciente disponible para un año dado entre las evaluaciones visibles
  const getLatestMonthForYear = (year: number) => {
    const months = evaluacionesVisiblesEspecialista
      .filter(
        (eva) =>
          Number(eva.añoDelExamen) === year &&
          eva.mesDelExamen !== undefined &&
          eva.mesDelExamen !== null &&
          eva.mesDelExamen !== ''
      )
      .map((eva) => Number(eva.mesDelExamen))

    if (months.length > 0) {
      return String(Math.max(...months))
    }
    return 'all'
  }

  // 1. Leer query params de la URL
  useEffect(() => {
    if (!router.isReady || loaderPages || evaluaciones.length === 0 || isUrlInitialized) return

    const { year, month, grade, status } = router.query

    const initYear = year ? Number(year) : currentYear
    setSelectedYear(initYear)

    if (month) {
      setSelectedMonth(String(month))
    } else {
      const latestMonth = getLatestMonthForYear(initYear)
      setSelectedMonth(latestMonth)
    }

    if (grade) {
      setSelectedGrado(String(grade))
    } else {
      setSelectedGrado('all')
    }

    if (status && (status === 'activo' || status === 'cerrado' || status === 'all')) {
      setSelectedEstado(String(status))
    } else {
      setSelectedEstado('activo')
    }

    setIsUrlInitialized(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, loaderPages, evaluaciones, evaluacionesVisiblesEspecialista, isUrlInitialized])

  // 2. Sincronizar cambios de filtros hacia la URL
  useEffect(() => {
    if (!isUrlInitialized) return

    const query: Record<string, string> = {}

    if (selectedYear) query.year = String(selectedYear)
    if (selectedMonth) query.month = selectedMonth
    if (selectedGrado) query.grade = selectedGrado
    if (selectedEstado) query.status = selectedEstado

    router.replace(
      {
        pathname: router.pathname,
        query,
      },
      undefined,
      { shallow: true }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth, selectedGrado, selectedEstado, isUrlInitialized])

  // Extraer los años disponibles dinámicamente
  const yearsAvailable = useMemo(() => {
    const yearsSet = new Set<number>()
    yearsSet.add(currentYear)
    evaluacionesVisiblesEspecialista.forEach((eva) => {
      if (eva.añoDelExamen) {
        yearsSet.add(Number(eva.añoDelExamen))
      }
    })
    return Array.from(yearsSet).sort((a, b) => b - a)
  }, [evaluacionesVisiblesEspecialista, currentYear])

  // Extraer los meses disponibles dinámicamente para el año seleccionado
  const monthsAvailable = useMemo(() => {
    const monthsSet = new Set<number>()
    evaluacionesVisiblesEspecialista.forEach((eva) => {
      if (
        Number(eva.añoDelExamen) === selectedYear &&
        eva.mesDelExamen !== undefined &&
        eva.mesDelExamen !== null &&
        eva.mesDelExamen !== ''
      ) {
        monthsSet.add(Number(eva.mesDelExamen))
      }
    })
    return Array.from(monthsSet).sort((a, b) => a - b).map((m) => ({
      id: m,
      name: getMonthName(m),
    }))
  }, [evaluacionesVisiblesEspecialista, selectedYear])

  // Ajustar mes si deja de ser válido al cambiar de año
  useEffect(() => {
    if (selectedMonth === 'all') return
    const isSelectedMonthValid = monthsAvailable.some((m) => String(m.id) === selectedMonth)
    if (!isSelectedMonthValid) {
      setSelectedMonth('all')
    }
  }, [monthsAvailable, selectedMonth])

  // Base filtrada por año y mes
  const evaluacionesBase = useMemo(() => {
    return evaluacionesVisiblesEspecialista.filter((eva) => {
      const matchesYear = Number(eva.añoDelExamen) === selectedYear
      if (!matchesYear) return false

      if (selectedMonth !== 'all') {
        const matchesMonth = String(eva.mesDelExamen) === selectedMonth
        if (!matchesMonth) return false
      }

      return true
    })
  }, [evaluacionesVisiblesEspecialista, selectedYear, selectedMonth])

  // Grados disponibles
  const gradosDisponibles = useMemo(() => {
    const gradesSet = new Set<number>()
    evaluacionesBase.forEach((eva) => {
      if (eva.grado !== undefined) gradesSet.add(Number(eva.grado))
    })

    return Array.from(gradesSet)
      .map((g) => {
        const gradoObj = grados?.find((gr) => Number(gr.grado) === g)
        return {
          grado: g,
          nombre: gradoObj?.nombre || getGradoTexto(g) || `${g}° Grado`,
        }
      })
      .sort((a, b) => a.grado - b.grado)
  }, [evaluacionesBase, grados])

  // Evaluaciones filtradas por grado y estado
  const evaluacionesFiltradas = useMemo(() => {
    return evaluacionesBase.filter((eva) => {
      if (selectedGrado !== 'all' && Number(eva.grado) !== Number(selectedGrado)) return false

      if (selectedEstado === 'activo' && eva.cerrada) return false
      if (selectedEstado === 'cerrado' && !eva.cerrada) return false

      return true
    })
  }, [evaluacionesBase, selectedGrado, selectedEstado])

  const metricasBanner = useMemo(() => {
    const total = evaluacionesBase.length
    const activas = evaluacionesBase.filter((eva) => !eva.cerrada).length
    const cerradas = evaluacionesBase.filter((eva) => eva.cerrada).length
    const totalGrados = gradosDisponibles.length
    return {
      total,
      activas,
      cerradas,
      totalGrados,
    }
  }, [evaluacionesBase, gradosDisponibles])

  const handleResetFilters = () => {
    setSelectedYear(currentYear)
    const latestMonth = getLatestMonthForYear(currentYear)
    setSelectedMonth(latestMonth)
    setSelectedGrado('all')
    setSelectedEstado('activo')
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero Banner Ejecutivo Institucional Modular */}
        <EvaluacionesHeroBanner
          title="GESTIÓN DE EVALUACIONES"
          subtitle="Monitoreo pedagógico y seguimiento de logros de aprendizaje para especialistas"
          colegio={currentUserData?.institucion || currentUserData?.ugel || 'Especialistas UGEL'}
          badgeTema="Especialistas"
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          totalEvaluaciones={metricasBanner.total}
          totalActivas={metricasBanner.activas}
          totalCerradas={metricasBanner.cerradas}
          totalGrados={metricasBanner.totalGrados}
          variant={bannerConfig.variant}
          backgroundImage={bannerConfig.backgroundImage}
          backgroundImageOpacity={bannerConfig.backgroundImageOpacity}
          customTitle={bannerConfig.customTitle}
          customSubtitle={bannerConfig.customSubtitle}
          isAuditing={bannerConfig.isAuditing}
          isSavingVariant={bannerConfig.isSaving}
          isSavingTexts={bannerConfig.isSavingTexts}
          isUploadingImage={bannerConfig.isUploadingImage}
          onVariantChange={bannerConfig.setBannerVariant}
          onUploadBackgroundImage={bannerConfig.uploadBannerImage}
          onRemoveBackgroundImage={bannerConfig.removeBannerImage}
          onUpdateTexts={bannerConfig.updateBannerTexts}
          onResetTexts={bannerConfig.resetBannerTexts}
          actions={
            <Link
              href="/admin/evaluaciones"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-all duration-200 group shadow-2xs hover:shadow-xs"
              title="Panel de administración de evaluaciones"
            >
              <RiSettings3Line className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-500" />
              <span>Gestionar</span>
            </Link>
          }
        />

        {/* Toolbar de Filtros Reutilizable y Responsive */}
        <SegmentedFilterBar
          title="Filtrar por"
          filters={[
            {
              id: 'year',
              label: 'Año',
              value: selectedYear,
              onChange: (year) => {
                const newYear = Number(year)
                setSelectedYear(newYear)
                const latestMonth = getLatestMonthForYear(newYear)
                setSelectedMonth(latestMonth)
              },
              options: yearsAvailable.map((year) => ({
                value: year,
                label: String(year),
              })),
              minWidth: 'md:min-w-[120px]',
            },
            {
              id: 'month',
              label: 'Mes',
              value: selectedMonth,
              onChange: (month) => setSelectedMonth(String(month)),
              options: [
                { value: 'all', label: 'Todos los Meses' },
                ...monthsAvailable.map((m) => ({
                  value: String(m.id),
                  label: m.name,
                })),
              ],
              minWidth: 'md:min-w-[170px]',
            },
            {
              id: 'grade',
              label: 'Grado',
              value: selectedGrado,
              onChange: (grade) => setSelectedGrado(String(grade)),
              options: [
                { value: 'all', label: 'Todos los Grados' },
                ...gradosDisponibles.map((g) => ({
                  value: String(g.grado),
                  label: g.nombre,
                })),
              ],
              minWidth: 'md:min-w-[170px]',
            },
            {
              id: 'estado',
              label: 'Estado',
              value: selectedEstado,
              onChange: (estado) => setSelectedEstado(String(estado)),
              options: [
                { value: 'all', label: 'Todos los Estados' },
                { value: 'activo', label: 'Activo' },
                { value: 'cerrado', label: 'Cerrado' },
              ],
              minWidth: 'md:min-w-[160px]',
            },
          ]}
          onReset={handleResetFilters}
          showReset={true}
        />

        {/* Tabla Modular de Evaluaciones */}
        <EvaluacionesTable
          evaluaciones={evaluacionesFiltradas}
          isLoading={loaderPages}
          currentYear={currentYear}
          selectedYear={selectedYear}
          grados={grados}
          onResetFilters={handleResetFilters}
          getReporteHref={(eva) =>
            `/admin/evaluaciones/evaluacion/reporte?id=${currentUserData?.dni}&idEvaluacion=${eva.id}`
          }
        />
      </div>
    </div>
  )
}

export default Evaluaciones
Evaluaciones.Auth = PrivateRouteEspecialista