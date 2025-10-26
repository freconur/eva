import React from 'react'
import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes'
import StandardHeader from '@/components/evaluaciones/StandardHeader'
import EvaluationCard from '@/components/evaluaciones/EvaluationCard'
import StatsCard from '@/components/evaluaciones/StatsCard'
import NavigationBreadcrumb from '@/components/evaluaciones/NavigationBreadcrumb'
import { FaGraduationCap, FaBookOpen, FaChartLine, FaUsers } from 'react-icons/fa'
import styles from './index.module.css'

const TercerNivel = () => {
  // Datos de las evaluaciones disponibles para estándar 3
  const evaluationsNivel3 = [
    {
      id: '1ro-lee',
      title: '1er grado: Lee',
      href: 'tercerNivel/pruebas?grado=1&categoria=1',
      backgroundColor: '#3b82f6', // Azul para 1er grado
      isActive: false,
      isCompleted: false,
      progress: 0
    },
    {
      id: '1ro-resuelve',
      title: '1er grado: Resuelve problemas',
      href: 'tercerNivel/pruebas?grado=1&categoria=2',
      backgroundColor: '#1d4ed8', // Azul más oscuro para 1er grado
      isActive: false,
      isCompleted: false,
      progress: 0
    },
    {
      id: '2do-lee',
      title: '2do grado: Lee',
      href: 'tercerNivel/pruebas?grado=2&categoria=1',
      backgroundColor: '#059669', // Verde para 2do grado
      isActive: false,
      isCompleted: false,
      progress: 0
    },
    {
      id: '2do-resuelve',
      title: '2do grado: Resuelve problemas',
      href: 'tercerNivel/pruebas?grado=2&categoria=2',
      backgroundColor: '#047857', // Verde más oscuro para 2do grado
      isActive: false,
      isCompleted: false,
      progress: 0
    }
  ];

  // Datos de las evaluaciones disponibles para estándar 4
  const evaluationsNivel4 = [
    {
      id: '3ro-lee',
      title: '3er grado: Lee',
      href: 'tercerNivel/pruebas?grado=3&categoria=1',
      backgroundColor: '#dc2626', // Rojo para 3er grado
      isActive: false,
      isCompleted: false,
      progress: 0
    },
    {
      id: '3ro-resuelve',
      title: '3er grado: Resuelve problemas',
      href: 'tercerNivel/pruebas?grado=3&categoria=2',
      backgroundColor: '#b91c1c', // Rojo más oscuro para 3er grado
      isActive: false,
      isCompleted: false,
      progress: 0
    },
    {
      id: '4to-lee',
      title: '4to grado: Lee',
      href: 'tercerNivel/pruebas?grado=4&categoria=1',
      backgroundColor: '#7c3aed', // Púrpura para 4to grado
      isActive: false,
      isCompleted: false,
      progress: 0
    },
    {
      id: '4to-resuelve',
      title: '4to grado: Resuelve problemas',
      href: 'tercerNivel/pruebas?grado=4&categoria=2',
      backgroundColor: '#6d28d9', // Púrpura más oscuro para 4to grado
      isActive: false,
      isCompleted: false,
      progress: 0
    }
  ];

  // Datos de las evaluaciones disponibles para estándar 5
  const evaluationsNivel5 = [
    {
      id: '5to-lee',
      title: '5to grado: Lee',
      href: 'tercerNivel/pruebas?grado=5&categoria=1',
      backgroundColor: '#ea580c', // Naranja para 5to grado
      isActive: false,
      isCompleted: false,
      progress: 0
    },
    {
      id: '5to-resuelve',
      title: '5to grado: Resuelve problemas',
      href: 'tercerNivel/pruebas?grado=5&categoria=2',
      backgroundColor: '#c2410c', // Naranja más oscuro para 5to grado
      isActive: false,
      isCompleted: false,
      progress: 0
    },
    {
      id: '6to-lee',
      title: '6to grado: Lee',
      href: 'tercerNivel/pruebas?grado=6&categoria=1',
      backgroundColor: '#0891b2', // Cian para 6to grado
      isActive: false,
      isCompleted: false,
      progress: 0
    },
    {
      id: '6to-resuelve',
      title: '6to grado: Resuelve problemas',
      href: 'tercerNivel/pruebas?grado=6&categoria=2',
      backgroundColor: '#0e7490', // Cian más oscuro para 6to grado
      isActive: false,
      isCompleted: false,
      progress: 0
    }
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