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

const MES_OCTUBRE = '9'

// Helper para extraer el timestamp/fecha más reciente de una evaluación
const getEvaluationTimestamp = (eva: any): number => {
  // 1. Firestore Timestamp o Date
  if (eva.timestamp) {
    if (typeof eva.timestamp.toMillis === 'function') {
      return eva.timestamp.toMillis()
    }
    if (typeof eva.timestamp.seconds === 'number') {
      return eva.timestamp.seconds * 1000 + (eva.timestamp.nanoseconds ? eva.timestamp.nanoseconds / 1e6 : 0)
    }
    if (eva.timestamp instanceof Date) {
      return eva.timestamp.getTime()
    }
    const parsed = new Date(eva.timestamp).getTime()
    if (!isNaN(parsed) && parsed > 0) return parsed
  }

  // 2. Propiedades alternativas de fecha
  const altDate = eva.fechaCreacion || eva.createdAt || eva.ultimaActualizacion
  if (altDate) {
    const parsed = new Date(altDate).getTime()
    if (!isNaN(parsed) && parsed > 0) return parsed
  }

  // 3. Buscar fecha en el nombre de la prueba (ej: "01.10.2026", "15/10/2026")
  if (typeof eva.nombre === 'string') {
    const match = eva.nombre.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/)
    if (match) {
      const [, dia, mes, anio] = match
      const parsed = new Date(Number(anio), Number(mes) - 1, Number(dia)).getTime()
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
  }

  return 0
}

// Helper para verificar si la evaluación corresponde al mes de Octubre
const isOctubreEvaluation = (eva: any): boolean => {
  if (
    eva.mesDelExamen !== undefined &&
    eva.mesDelExamen !== null &&
    String(eva.mesDelExamen).trim() === MES_OCTUBRE
  ) {
    return true
  }
  if (typeof eva.nombre === 'string' && /octubre/i.test(eva.nombre)) {
    return true
  }
  return false
}

const Pruebas = () => {
  const { evaluacionesGradoYCategoria, loaderPages, categorias } = useGlobalContext()
  const { getEvaluacionesGradoYCategoria, getCategories } = useAgregarEvaluaciones()
  const route = useRouter()

  // Filtros: Año (siempre inicia en el año actual) y Mes fijado por defecto en Octubre ('9')
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear))
  const selectedMonth = MES_OCTUBRE
  
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

  // Evaluaciones que corresponden al año seleccionado
  const evaluacionesDelAño = useMemo(() => {
    if (!Array.isArray(evaluacionesGradoYCategoria)) return []
    if (selectedYear === 'all') return evaluacionesGradoYCategoria
    return evaluacionesGradoYCategoria.filter(
      (eva) => String(eva.añoDelExamen || currentYear) === selectedYear
    )
  }, [evaluacionesGradoYCategoria, selectedYear])

  // Opciones para el dropdown custom de Año
  const yearOptions: FilterOption[] = useMemo(() => {
    const opts: FilterOption[] = availableYears.map((yr) => {
      const count = Array.isArray(evaluacionesGradoYCategoria)
        ? evaluacionesGradoYCategoria.filter(
            (eva) => String(eva.añoDelExamen || currentYear) === yr && isOctubreEvaluation(eva)
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
      badge: `${
        Array.isArray(evaluacionesGradoYCategoria)
          ? evaluacionesGradoYCategoria.filter((eva) => isOctubreEvaluation(eva)).length
          : 0
      }`,
      badgeType: 'neutral',
    })

    return opts
  }, [availableYears, evaluacionesGradoYCategoria])

  // Opciones para el dropdown custom de Mes (solo Octubre, bloqueado para evitar confusiones)
  const monthOptions: FilterOption[] = useMemo(() => {
    const countOctubre = evaluacionesDelAño.filter((eva) => isOctubreEvaluation(eva)).length
    return [
      {
        value: MES_OCTUBRE,
        label: 'Octubre',
        badge: `${countOctubre}`,
        badgeType: 'neutral',
      },
    ]
  }, [evaluacionesDelAño])

  // Evaluaciones filtradas estrictamente para el mes de Octubre
  const evaluacionesFiltradas = useMemo(() => {
    return evaluacionesDelAño.filter((eva) => isOctubreEvaluation(eva))
  }, [evaluacionesDelAño])

  // Algoritmo para ordenar evaluaciones:
  // 1. Mostrar activas primero (listas para evaluar)
  // 2. Últimas evaluaciones del mes de octubre primero (timestamp / fecha más reciente)
  // 3. Desempate alfabético
  const evaluacionesOrdenadas = useMemo(() => {
    return [...evaluacionesFiltradas].sort((a, b) => {
      // 1. Mostrar activas primero
      if (a.active && !b.active) return -1
      if (!a.active && b.active) return 1

      // 2. Las últimas evaluaciones primero (más recientes)
      const timeA = getEvaluationTimestamp(a)
      const timeB = getEvaluationTimestamp(b)
      if (timeA !== timeB) {
        return timeB - timeA
      }

      // 3. Normalización para ordenamiento alfabético
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
              onChange={() => {}}
              minWidth={160}
              disabled={true}
            />
          </div>

          <div className={styles.filterSummary}>
            <span>
              Mostrando <strong className={styles.filterSummaryCount}>{evaluacionesOrdenadas.length}</strong> evaluaciones de Octubre
            </span>
            {selectedYear !== String(currentYear) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedYear(String(currentYear))
                }}
                className={styles.resetFilterBtn}
                title="Restablecer año al actual"
              >
                <RiRefreshLine /> Restablecer Año
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
                  : 'Octubre'

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
            <h3 className={styles.emptyStateTitle}>No se encontraron evaluaciones de Octubre</h3>
            <p className={styles.emptyStateText}>
              {selectedYear !== 'all'
                ? `No existen evaluaciones registradas para Octubre en el año ${selectedYear}.`
                : 'No se encontraron evaluaciones registradas para el mes de Octubre.'}
            </p>
            {selectedYear !== String(currentYear) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedYear(String(currentYear))
                }}
                className={styles.resetBtn}
              >
                Ver evaluaciones de Octubre del año actual
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Pruebas