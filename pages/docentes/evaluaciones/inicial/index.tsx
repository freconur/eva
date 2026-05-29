import React, { useEffect } from 'react'
import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes'
import StandardHeader from '@/components/evaluaciones/StandardHeader'
import EvaluationCard from '@/components/evaluaciones/EvaluationCard'
import NavigationBreadcrumb from '@/components/evaluaciones/NavigationBreadcrumb'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { especialidad } from '@/fuctions/categorias'
import styles from './index.module.css'

const Inicial = () => {
  const { categorias } = useGlobalContext()
  const { getCategories } = useAgregarEvaluaciones()

  useEffect(() => {
    getCategories()
  }, [])

  // Datos de las evaluaciones disponibles para estándar 1 (3 años)
  const evaluationsNivel1: any[] = [];

  // Colors to rotate for dynamic categories
  const colors = ['#06b6d4', '#0891b2', '#0e7490', '#0a5c70', '#0f766e', '#14b8a6', '#0d9488']

  // Datos de las evaluaciones disponibles para estándar 2 (4 y 5 años)
  const evaluationsNivel2 = (categorias && categorias.length > 0 ? categorias : especialidad)
    .filter((cat) => cat.activo !== false && cat.niveles && cat.niveles.includes(0))
    .map((cat, index) => {
      const cleanName = cat.categoria.charAt(0).toUpperCase() + cat.categoria.slice(1)
      const color = colors[index % colors.length]

      return {
        id: `5anos-${cat.id}`,
        title: `5 años: ${cleanName}`,
        href: `inicial/pruebas?grado=12&categoria=${cat.id}`,
        backgroundColor: color,
        isActive: false,
        isCompleted: false,
        progress: 0
      }
    });

  // Datos de navegación
  const breadcrumbItems = [
    { label: 'Inicio', href: '/docentes' },
    { label: 'Evaluaciones', href: '/docentes/evaluaciones' },
    { label: 'Inicial', isActive: true }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.mainGrid}>
        <NavigationBreadcrumb items={breadcrumbItems} />

        <h1 className={styles.title}>Educación Inicial</h1>

        {/* Nivel 1 - 3 años */}
        <div className={styles.evaluationsContainer}>
          <StandardHeader
            level={1}
            title="Estándar de aprendizaje"
            description="Evaluaciones para niños de 3 años"
            totalEvaluations={evaluationsNivel1.length}
            completedEvaluations={0}
          />

          {evaluationsNivel1.length > 0 ? (
            <div className={styles.evaluationsGrid}>
              {evaluationsNivel1.map((evaluation) => (
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
          ) : (
            <div className={styles.noEvaluaciones}>
              <p>No hay evaluaciones disponibles para este nivel</p>
            </div>
          )}
        </div>

        {/* Nivel 2 - 4 y 5 años */}
        <div className={styles.evaluationsContainer}>
          <StandardHeader
            level={2}
            title="Estándar de aprendizaje"
            description="Evaluaciones para niños de 4 y 5 años"
            totalEvaluations={evaluationsNivel2.length}
            completedEvaluations={0}
          />

          <div className={styles.evaluationsGrid}>
            {evaluationsNivel2.map((evaluation) => (
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

export default Inicial
Inicial.Auth = PrivateRouteDocentes