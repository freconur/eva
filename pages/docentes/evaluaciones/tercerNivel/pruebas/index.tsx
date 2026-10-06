import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { categoriaTransform } from '@/fuctions/categorias'
import { convertGrade } from '@/fuctions/regiones'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo, useState } from 'react'
import { PiFilesFill } from 'react-icons/pi'
import { RiCalendarLine, RiTimeLine, RiFilterLine, RiRefreshLine } from 'react-icons/ri'
import CustomFilterDropdown, { FilterOption } from '@/components/reportes/CustomFilterDropdown'
import { currentYear, getMonthName } from '@/fuctions/dates'
import styles from './pruebas.module.css'

const Pruebas = () => {
  const { evaluacionesGradoYCategoria, loaderPages, categorias } = useGlobalContext()
  const { getEvaluacionesGradoYCategoria, getCategories } = useAgregarEvaluaciones()
  const route = useRouter()

  // Filtros: Año (siempre inicia en el año actual) y Mes
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear))
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  
  useEffect(() => {
    getEvaluacionesGradoYCategoria(Number(route.query.grado), Number(route.query.categoria))
    getCategories()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.query.grado, route.query.categoria])

  // Obtener años disponibles a partir de las evaluaciones registradas
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>()
    // Siempre asegurar que el año actual esté disponible
    yearsSet.add(String(currentYear))

    if (Array.isArray(evaluacionesGradoYCategoria)) {
      evaluacionesGradoYCategoria.forEach((eva) => {
        if (eva.añoDelExamen) {
          yearsSet.add(String(eva.añoDelExamen))
        }
      });
    }

    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a))
  }, [evaluacionesGradoYCategoria])

  // Opciones para el dropdown custom de Año
  const yearOptions: FilterOption[] = useMemo(() => {
    const opts: FilterOption[] = availableYears.map((yr) => {
      const count = Array.isArray(evaluacionesGradoYCategoria)
        ? evaluacionesGradoYCategoria.filter(
            (eva) => String(eva.añoDelExamen || currentYear) === yr
          ).length
        : 0

      return {
        value: yr,
        label: yr === String(currentYear) ? `${yr} (Actual)` : yr,
        badge: `${count}`,
        badgeType: 'neutral',
      }
    })

    opts.push({
      value: 'all',
      label: 'Todos los años',
      badge: `${evaluacionesGradoYCategoria?.length || 0}`,
      badgeType: 'neutral',
    })

    return opts
  }, [availableYears, evaluacionesGradoYCategoria])

  // Evaluaciones que corresponden al año seleccionado
  const evaluacionesDelAño = useMemo(() => {
    if (!Array.isArray(evaluacionesGradoYCategoria)) return []
    if (selectedYear === 'all') return evaluacionesGradoYCategoria
    return evaluacionesGradoYCategoria.filter(
      (eva) => String(eva.añoDelExamen || currentYear) === selectedYear
    )
  }, [evaluacionesGradoYCategoria, selectedYear])

  // Meses disponibles con evaluaciones en el año seleccionado (solo meses con evaluaciones)
  const availableMonths = useMemo(() => {
    const monthsMap = new Map<number, number>()

    evaluacionesDelAño.forEach((eva) => {
      if (
        eva.mesDelExamen !== undefined &&
        eva.mesDelExamen !== null &&
        String(eva.mesDelExamen).trim() !== ''
      ) {
        const monthNum = Number(eva.mesDelExamen)
        if (!isNaN(monthNum) && monthNum >= 0 && monthNum <= 11) {
          monthsMap.set(monthNum, (monthsMap.get(monthNum) || 0) + 1)
        }
      }
    })

    return Array.from(monthsMap.keys())
      .sort((a, b) => a - b)
      .map((monthNum) => ({
        id: String(monthNum),
        name: getMonthName(monthNum),
        count: monthsMap.get(monthNum) || 0,
      }))
  }, [evaluacionesDelAño])

  // Opciones para el dropdown custom de Mes (meses de las evaluaciones)
  const monthOptions: FilterOption[] = useMemo(() => {
    const opts: FilterOption[] = [
      {
        value: 'all',
        label: 'Todos los meses',
        badge: `${evaluacionesDelAño.length}`,
        badgeType: 'neutral',
      },
    ]

    availableMonths.forEach((m) => {
      opts.push({
        value: m.id,
        label: m.name,
        badge: `${m.count}`,
        badgeType: 'neutral',
      })
    })

    return opts
  }, [availableMonths, evaluacionesDelAño.length])

  // Si cambia el año y el mes seleccionado ya no existe en el nuevo año, restablecer a 'all'
  useEffect(() => {
    if (selectedMonth !== 'all') {
      const exists = availableMonths.some((m) => m.id === selectedMonth)
      if (!exists) {
        setSelectedMonth('all')
      }
    }
  }, [availableMonths, selectedMonth])

  // Evaluaciones filtradas por año y mes
  const evaluacionesFiltradas = useMemo(() => {
    return evaluacionesDelAño.filter((eva) => {
      if (selectedMonth !== 'all') {
        if (
          eva.mesDelExamen === undefined ||
          eva.mesDelExamen === null ||
          Number(eva.mesDelExamen) !== Number(selectedMonth)
        ) {
          return false
        }
      }
      return true
    })
  }, [evaluacionesDelAño, selectedMonth])

  // Algoritmo para ordenar evaluaciones: activas primero, luego alfabéticamente
  const evaluacionesOrdenadas = useMemo(() => {
    return [...evaluacionesFiltradas].sort((a, b) => {
      // Mostrar activas primero
      if (a.active && !b.active) return -1
      if (!a.active && b.active) return 1

      // Normalización para ordenamiento alfabético
      const nombreA = a.nombre?.toLowerCase().trim() || ''
      const nombreB = b.nombre?.toLowerCase().trim() || ''

      return nombreA.localeCompare(nombreB, 'es', {
        numeric: true,
        sensitivity: 'base',
      })
    })
  }, [evaluacionesFiltradas])
  
  // Renderizar loader si loaderPages es true
  if (loaderPages) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{convertGrade(`${route.query.grado}`)}: {categoriaTransform(Number(route.query.categoria), categorias)}</h1>
        </div>
        <div className={styles.loaderContainer}>
          <div className={styles.loader}></div>
          <p className={styles.loaderText}>Cargando evaluaciones...</p>
        </div>
      </div>
    )
  }

  // Renderizar contenido cuando loaderPages es false
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{convertGrade(`${route.query.grado}`)}: {categoriaTransform(Number(route.query.categoria), categorias)}</h1>
      </div>
      <div className={styles.content}>
        {/* Barra de Filtros con Dropdowns Custom */}
        <div className={styles.filterToolbar}>
          <div className={styles.filterGroup}>
            <CustomFilterDropdown
              label="Año:"
              icon={<RiCalendarLine />}
              value={selectedYear}
              options={yearOptions}
              onChange={(val) => {
                setSelectedYear(val)
              }}
              minWidth={140}
            />

            <CustomFilterDropdown
              label="Mes:"
              icon={<RiTimeLine />}
              value={selectedMonth}
              options={monthOptions}
              onChange={(val) => setSelectedMonth(val)}
              minWidth={170}
            />
          </div>

          <div className={styles.filterSummary}>
            <span>
              Mostrando <strong className={styles.filterSummaryCount}>{evaluacionesOrdenadas.length}</strong> de{' '}
              {evaluacionesGradoYCategoria?.length || 0} evaluaciones
            </span>
            {(selectedYear !== String(currentYear) || selectedMonth !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedYear(String(currentYear))
                  setSelectedMonth('all')
                }}
                className={styles.resetFilterBtn}
                title="Restablecer filtros al año actual"
              >
                <RiRefreshLine /> Restablecer
              </button>
            )}
          </div>
        </div>

        {evaluacionesOrdenadas.length > 0 ? (
          <div className={styles.cardsGrid}>
            {evaluacionesOrdenadas.map((eva, index) => {
              const evaYear = eva.añoDelExamen || currentYear
              const evaMonthName =
                eva.mesDelExamen !== undefined &&
                eva.mesDelExamen !== null &&
                String(eva.mesDelExamen).trim() !== ''
                  ? getMonthName(Number(eva.mesDelExamen))
                  : null

              return (
                <div key={`${eva.id}-${index}`} className={`${styles.card} ${!eva.active ? styles.cardInactive : ''}`}>
                  <Link href={`pruebas/prueba?idExamen=${eva.id}`} className={styles.cardLink}>
                    <div className={styles.cardHeader}>
                      <div className={styles.iconContainer}>
                        <PiFilesFill className={styles.icon} />
                      </div>
                      <div className={styles.cardBadgesGroup}>
                        {(evaYear || evaMonthName) && (
                          <span className={styles.cardPeriodBadge}>
                            {evaYear} {evaMonthName ? `• ${evaMonthName}` : ''}
                          </span>
                        )}
                        <div className={`${styles.cardBadge} ${eva.active ? styles.badgeActive : styles.badgeInactive}`}>
                          <span className={styles.badgeText}>{eva.active ? 'Activa' : 'Finalizada'}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle}>{eva.nombre}</h3>
                      <p className={styles.cardStatusText}>
                        {eva.active ? 'Disponible para evaluar estudiantes' : 'Evaluación cerrada • Consulta de reportes'}
                      </p>
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={eva.active ? styles.startButton : styles.reportButtonCard}>
                        {eva.active ? 'Comenzar →' : 'Ver Reporte →'}
                      </span>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <RiFilterLine className={styles.emptyStateIcon} />
            <h3 className={styles.emptyStateTitle}>No se encontraron evaluaciones</h3>
            <p className={styles.emptyStateText}>
              {selectedYear !== 'all' && selectedMonth !== 'all'
                ? `No existen evaluaciones registradas para el año ${selectedYear} en ${getMonthName(Number(selectedMonth))}.`
                : selectedYear !== 'all'
                ? `No existen evaluaciones registradas para el año ${selectedYear}.`
                : 'No se encontraron evaluaciones con los filtros actuales.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedYear('all')
                setSelectedMonth('all')
              }}
              className={styles.resetBtn}
            >
              Ver todas las evaluaciones
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Pruebas