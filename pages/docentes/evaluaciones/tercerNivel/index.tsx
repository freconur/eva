import React, { useEffect } from 'react'
import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes'
import StandardHeader from '@/components/evaluaciones/StandardHeader'
import EvaluationCard from '@/components/evaluaciones/EvaluationCard'
import StatsCard from '@/components/evaluaciones/StatsCard'
import NavigationBreadcrumb from '@/components/evaluaciones/NavigationBreadcrumb'
import { FaGraduationCap, FaBookOpen, FaChartLine, FaUsers } from 'react-icons/fa'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { especialidad } from '@/fuctions/categorias'
import styles from './index.module.css'

const TercerNivel = () => {
  const { categorias } = useGlobalContext()
  const { getCategories } = useAgregarEvaluaciones()

  useEffect(() => {
    getCategories()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filter categories that are active and apply to Primaria (nivel 1)
  const categoriesNivel1 = (categorias && categorias.length > 0 ? categorias : especialidad)
    .filter(cat => cat.activo !== false && cat.niveles && cat.niveles.includes(1))

  // Datos de las evaluaciones disponibles para estándar 3 (1er y 2do grado)
  const evaluationsNivel3 = [
    ...categoriesNivel1.map(cat => ({
      id: `1ro-${cat.id}`,
      title: `1er grado: ${cat.categoria.charAt(0).toUpperCase() + cat.categoria.slice(1)}`,
      href: `tercerNivel/pruebas?grado=1&categoria=${cat.id}`,
      backgroundColor: '#3b82f6',
      isActive: false,
      isCompleted: false,
      progress: 0
    })),
    ...categoriesNivel1.map(cat => ({
      id: `2do-${cat.id}`,
      title: `2do grado: ${cat.categoria.charAt(0).toUpperCase() + cat.categoria.slice(1)}`,
      href: `tercerNivel/pruebas?grado=2&categoria=${cat.id}`,
      backgroundColor: '#059669',
      isActive: false,
      isCompleted: false,
      progress: 0
    }))
  ];

  // Datos de las evaluaciones disponibles para estándar 4 (3er y 4to grado)
  const evaluationsNivel4 = [
    ...categoriesNivel1.map(cat => ({
      id: `3ro-${cat.id}`,
      title: `3er grado: ${cat.categoria.charAt(0).toUpperCase() + cat.categoria.slice(1)}`,
      href: `tercerNivel/pruebas?grado=3&categoria=${cat.id}`,
      backgroundColor: '#dc2626',
      isActive: false,
      isCompleted: false,
      progress: 0
    })),
    ...categoriesNivel1.map(cat => ({
      id: `4to-${cat.id}`,
      title: `4to grado: ${cat.categoria.charAt(0).toUpperCase() + cat.categoria.slice(1)}`,
      href: `tercerNivel/pruebas?grado=4&categoria=${cat.id}`,
      backgroundColor: '#7c3aed',
      isActive: false,
      isCompleted: false,
      progress: 0
    }))
  ];

  // Datos de las evaluaciones disponibles para estándar 5 (5to y 6to grado)
  const evaluationsNivel5 = [
    ...categoriesNivel1.map(cat => ({
      id: `5to-${cat.id}`,
      title: `5to grado: ${cat.categoria.charAt(0).toUpperCase() + cat.categoria.slice(1)}`,
      href: `tercerNivel/pruebas?grado=5&categoria=${cat.id}`,
      backgroundColor: '#ea580c',
      isActive: false,
      isCompleted: false,
      progress: 0
    })),
    ...categoriesNivel1.map(cat => ({
      id: `6to-${cat.id}`,
      title: `6to grado: ${cat.categoria.charAt(0).toUpperCase() + cat.categoria.slice(1)}`,
      href: `tercerNivel/pruebas?grado=6&categoria=${cat.id}`,
      backgroundColor: '#0891b2',
      isActive: false,
      isCompleted: false,
      progress: 0
    }))
  ];

  // Datos de navegación
  const breadcrumbItems = [
    { label: 'Inicio', href: '/docentes' },
    { label: 'Evaluaciones', href: '/docentes/evaluaciones' },
    { label: 'Primaria', isActive: true }
  ];

  // Estadísticas de ejemplo
  const stats = [
    {
      title: 'Total Evaluaciones',
      value: 12,
      icon: <FaBookOpen />,
      color: '#3b82f6',
      trend: 'up' as const,
      trendValue: 12
    },
    {
      title: 'Completadas',
      value: 0,
      icon: <FaChartLine />,
      color: '#10b981',
      trend: 'neutral' as const
    },
    {
      title: 'En Progreso',
      value: 0,
      icon: <FaUsers />,
      color: '#f59e0b',
      trend: 'neutral' as const
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.mainGrid}>
        <NavigationBreadcrumb items={breadcrumbItems} />

        <h1 className={styles.title}>Educación Primaria</h1>

        {/* Estadísticas */}
        {/* <div className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              trend={stat.trend}
              trendValue={stat.trendValue}
            />
          ))}
        </div> */}

        <div className={styles.evaluationsContainer}>
          <StandardHeader
            level={3}
            title="Estándar de aprendizaje"
            description="Evaluaciones para estudiantes de 1° y 2° de primaria"
            totalEvaluations={evaluationsNivel3.length}
            completedEvaluations={0}
          />

          <div className={styles.evaluationsGrid}>
            {evaluationsNivel3.map((evaluation) => (
              <EvaluationCard
                key={evaluation.id}
                href={evaluation.href}
                title={evaluation.title}
                backgroundColor={evaluation.backgroundColor}
                isActive={evaluation.isActive}
                isCompleted={evaluation.isCompleted}
                progress={evaluation.progress}
              />
            ))}
          </div>
        </div>

        <div className={styles.evaluationsContainer}>
          <StandardHeader
            level={4}
            title="Estándar de aprendizaje"
            description="Evaluaciones para estudiantes de 3° y 4° de primaria"
            totalEvaluations={evaluationsNivel4.length}
            completedEvaluations={0}
          />

          <div className={styles.evaluationsGrid}>
            {evaluationsNivel4.map((evaluation) => (
              <EvaluationCard
                key={evaluation.id}
                href={evaluation.href}
                title={evaluation.title}
                backgroundColor={evaluation.backgroundColor}
                isActive={evaluation.isActive}
                isCompleted={evaluation.isCompleted}
                progress={evaluation.progress}
              />
            ))}
          </div>
        </div>

        <div className={styles.evaluationsContainer}>
          <StandardHeader
            level={5}
            title="Estándar de aprendizaje"
            description="Evaluaciones para estudiantes de 5° y 6° de primaria"
            totalEvaluations={evaluationsNivel5.length}
            completedEvaluations={0}
          />

          <div className={styles.evaluationsGrid}>
            {evaluationsNivel5.map((evaluation) => (
              <EvaluationCard
                key={evaluation.id}
                href={evaluation.href}
                title={evaluation.title}
                backgroundColor={evaluation.backgroundColor}
                isActive={evaluation.isActive}
                isCompleted={evaluation.isCompleted}
                progress={evaluation.progress}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TercerNivel
TercerNivel.Auth = PrivateRouteDocentes