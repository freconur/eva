import React from 'react'
import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes'
import StandardHeader from '@/components/evaluaciones/StandardHeader'
import EvaluationCard from '@/components/evaluaciones/EvaluationCard'
import StatsCard from '@/components/evaluaciones/StatsCard'
import NavigationBreadcrumb from '@/components/evaluaciones/NavigationBreadcrumb'
import { FaGraduationCap, FaBookOpen, FaChartLine, FaUsers } from 'react-icons/fa'
import styles from './index.module.css'

const TercerNivel = () => {
  // Datos de las evaluaciones disponibles
  const evaluationsNivel6 = [
    {
      id: '1ro-lee',
      title: '1ro sec.: Lee',
      href: 'secundaria/pruebas?grado=7&categoria=1',
      backgroundColor: '#0891b2', // Cian para 1ro sec
      isActive: false,
      isCompleted: false,
      progress: 0
    },
    {
      id: '1ro-resuelve',
      title: '1ro sec.: Resuelve problemas',
      href: 'secundaria/pruebas?grado=7&categoria=2',
      backgroundColor: '#0e7490', // Cian más oscuro para 1ro sec
      isActive: false,
      isCompleted: false,
      progress: 0
    },
    {
      id: '2do-lee',
      title: '2do sec.: Lee',
      href: 'secundaria/pruebas?grado=8&categoria=1',
      backgroundColor: '#059669', // Verde para 2do sec
      isActive: false,
      isCompleted: false,
      progress: 0
    },
    {
      id: '2do-resuelve',
      title: '2do sec.: Resuelve problemas',
      href: 'secundaria/pruebas?grado=8&categoria=2',
      backgroundColor: '#047857', // Verde más oscuro para 2do sec
      isActive: false,
      isCompleted: false,
      progress: 0
    }
  ];
  const evaluations = [
    {
      id: '3ro-lee',
      title: '3ro sec.: Lee',
      href: 'secundaria/pruebas?grado=9&categoria=1',
      backgroundColor: '#dc2626', // Rojo para 3ro sec
      isActive: false,
      isCompleted: false,
      progress: 0
    },
    {
      id: '3ro-resuelve',
      title: '3ro sec.: Resuelve problemas',
      href: 'secundaria/pruebas?grado=9&categoria=2',
      backgroundColor: '#b91c1c', // Rojo más oscuro para 3ro sec
      isActive: false,
      isCompleted: false,
      progress: 0
    },
    {
      id: '4to-lee',
      title: '4to sec.: Lee',
      href: 'secundaria/pruebas?grado=10&categoria=1',
      backgroundColor: '#7c3aed', // Púrpura para 4to sec
      isActive: false,
      isCompleted: false,
      progress: 0
    },
    {
      id: '4to-resuelve',
      title: '4to sec.: Resuelve problemas',
      href: 'secundaria/pruebas?grado=10&categoria=2',
      backgroundColor: '#6d28d9', // Púrpura más oscuro para 4to sec
      isActive: false,
      isCompleted: false,
      progress: 0
    },
    {
      id: '5to-lee',
      title: '5to sec.: Lee',
      href: 'secundaria/pruebas?grado=11&categoria=1',
      backgroundColor: '#ea580c', // Naranja para 5to sec
      isActive: false,
      isCompleted: false,
      progress: 0
    },
    {
      id: '5to-resuelve',
      title: '5to sec.: Resuelve problemas',
      href: 'secundaria/pruebas?grado=11&categoria=2',
      backgroundColor: '#c2410c', // Naranja más oscuro para 5to sec
      isActive: false,
      isCompleted: false,
      progress: 0
    }
  ];

  // Datos de navegación
  const breadcrumbItems = [
    { label: 'Inicio', href: '/docentes' },
    { label: 'Evaluaciones', href: '/docentes/evaluaciones' },
    { label: 'Secundaria', isActive: true }
  ];

  // Estadísticas de ejemplo
  const stats = [
    {
      title: 'Total Evaluaciones',
      value: 4,
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
        
        <h1 className={styles.title}>Educación Secundaria</h1>
        
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
            level={6}
            title="Estándar de aprendizaje"
            description="Evaluaciones para estudiantes de 1° y 2° de secundaria"
            totalEvaluations={evaluationsNivel6.length}
            completedEvaluations={0}
          />
          
          <div className={styles.evaluationsGrid}>
            {evaluationsNivel6.map((evaluation) => (
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
            level={7}
            title="Estándar de aprendizaje"
            description="Evaluaciones para estudiantes de 3°, 4° y 5° de secundaria"
            totalEvaluations={evaluations.length}
            completedEvaluations={0}
          />
          
          <div className={styles.evaluationsGrid}>
            {evaluations.map((evaluation) => (
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