import React, { useState, useEffect } from 'react'
import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes'
import StandardHeader from '@/components/evaluaciones/StandardHeader'
import EvaluationCard from '@/components/evaluaciones/EvaluationCard'
import StatsCard from '@/components/evaluaciones/StatsCard'
import NavigationBreadcrumb from '@/components/evaluaciones/NavigationBreadcrumb'
import { FaGraduationCap, FaBookOpen, FaChartLine, FaUsers } from 'react-icons/fa'
import { MdExpandMore, MdExpandLess } from 'react-icons/md'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { especialidad } from '@/fuctions/categorias'
import { convertGrade } from '@/fuctions/regiones'
import styles from './index.module.css'
import { 
  RiBookOpenLine, 
  RiCalculatorLine, 
  RiFlaskLine, 
  RiShieldUserLine, 
  RiGlobalLine 
} from 'react-icons/ri';

interface Evaluation {
  id: string;
  title: string;
  href: string;
  backgroundColor: string;
  isActive: boolean;
  isCompleted: boolean;
  progress: number;
  icon?: React.ReactNode;
}

interface EvaluationsByGrado {
  [key: number]: Evaluation[];
}

const TercerNivel = () => {
  // Estado para manejar qué acordeones están expandidos
  const [expandedAccordions, setExpandedAccordions] = useState<Set<number>>(new Set());

  const { categorias } = useGlobalContext()
  const { getCategories } = useAgregarEvaluaciones()

  useEffect(() => {
    getCategories()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Toggle para expandir/colapsar acordeones
  const toggleAccordion = (grado: number) => {
    setExpandedAccordions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(grado)) {
        // Si el acordeón está abierto, cerrarlo
        newSet.clear();
      } else {
        // Si está cerrado, cerrar todos y abrir solo este
        newSet.clear();
        newSet.add(grado);
      }
      return newSet;
    });
  };

  // Filter categories that apply to Secundaria (nivel 2)
  const categoriesNivel2 = (categorias && categorias.length > 0 ? categorias : especialidad)
    .filter(cat => cat.activo !== false && cat.niveles && cat.niveles.includes(2))

  const getMateriaColor = (catId: number) => {
    switch (catId) {
      case 3:
        return 'var(--color-materia-comunicacion, #0891b2)';
      case 4:
        return 'var(--color-materia-matematica, #dc2626)';
      case 5:
        return 'var(--color-materia-ciencia, #059669)';
      case 6:
        return 'var(--color-materia-dpcc, #7c3aed)';
      case 7:
        return 'var(--color-materia-sociales, #ea580c)';
      default:
        return 'var(--color-tercero, #3ABEF9)';
    }
  };

  const getMateriaIcon = (catId: number) => {
    switch (catId) {
      case 3:
        return <RiBookOpenLine />;
      case 4:
        return <RiCalculatorLine />;
      case 5:
        return <RiFlaskLine />;
      case 6:
        return <RiShieldUserLine />;
      case 7:
        return <RiGlobalLine />;
      default:
        return <RiBookOpenLine />;
    }
  };

  // Datos de las evaluaciones disponibles
  const evaluationsNivel6 = [
    { 
      7: categoriesNivel2.map((cat, idx) => ({
        id: `com-7-${cat.id}`,
        title: cat.categoria.replace('-Secundaria', ''),
        href: `secundaria/pruebas?grado=7&categoria=${cat.id}`,
        backgroundColor: getMateriaColor(cat.id),
        isActive: false,
        isCompleted: false,
        progress: 0,
        icon: getMateriaIcon(cat.id)
      })),
      8: categoriesNivel2.map((cat, idx) => ({
        id: `com-8-${cat.id}`,
        title: cat.categoria.replace('-Secundaria', ''),
        href: `secundaria/pruebas?grado=8&categoria=${cat.id}`,
        backgroundColor: getMateriaColor(cat.id),
        isActive: false,
        isCompleted: false,
        progress: 0,
        icon: getMateriaIcon(cat.id)
      }))
    }
  ];

  const evaluationsNivel7 = [
    {
      9: categoriesNivel2.map((cat, idx) => ({
        id: `com-9-${cat.id}`,
        title: cat.categoria.replace('-Secundaria', ''),
        href: `secundaria/pruebas?grado=9&categoria=${cat.id}`,
        backgroundColor: getMateriaColor(cat.id),
        isActive: false,
        isCompleted: false,
        progress: 0,
        icon: getMateriaIcon(cat.id)
      })),
      10: categoriesNivel2.map((cat, idx) => ({
        id: `com-10-${cat.id}`,
        title: cat.categoria.replace('-Secundaria', ''),
        href: `secundaria/pruebas?grado=10&categoria=${cat.id}`,
        backgroundColor: getMateriaColor(cat.id),
        isActive: false,
        isCompleted: false,
        progress: 0,
        icon: getMateriaIcon(cat.id)
      })),
      11: categoriesNivel2.map((cat, idx) => ({
        id: `com-11-${cat.id}`,
        title: cat.categoria.replace('-Secundaria', ''),
        href: `secundaria/pruebas?grado=11&categoria=${cat.id}`,
        backgroundColor: getMateriaColor(cat.id),
        isActive: false,
        isCompleted: false,
        progress: 0,
        icon: getMateriaIcon(cat.id)
      }))
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
        {/* Estándar de aprendizaje 6 - Con acordeones por grado */}
        <div className={styles.evaluationsContainer}>
          <StandardHeader
            level={6}
            title="Estándar de aprendizaje 6"
            description="Evaluaciones para estudiantes de 1° y 2° de secundaria"
            totalEvaluations={evaluationsNivel6.flatMap((nivelData: EvaluationsByGrado) => 
              Object.values(nivelData).flat()
            ).length}
            completedEvaluations={0}
          />
          
          {/* Acordeones agrupados por grado */}
          <div className={styles.accordionContainer}>
            {evaluationsNivel6.map((nivelData: EvaluationsByGrado) => {
              // Obtener los grados ordenados
              const grados = Object.keys(nivelData).map(Number).sort();
              
              return grados.map((grado) => {
                const evaluacionesGrado = nivelData[grado];
                const isExpanded = expandedAccordions.has(grado);
                
                return (
                  <div key={grado} className={styles.accordionItem}>
                    {/* Header del acordeón */}
                    <div 
                      className={styles.accordionHeader}
                      onClick={() => toggleAccordion(grado)}
                    >
                      <div className={styles.accordionTitle}>
                        {/* <span className={styles.gradoNumber}>{grado}°</span> */}
                        <span> {convertGrade(`${grado}`)}</span>
                        <span className={styles.accordionItemCount}>
                          ({evaluacionesGrado.length} categorias)
                        </span>
                      </div>
                      {isExpanded ? (
                        <MdExpandLess className={styles.accordionIcon} />
                      ) : (
                        <MdExpandMore className={styles.accordionIcon} />
                      )}
                    </div>
                    
                    {/* Body del acordeón */}
                    <div className={`${styles.accordionBody} ${isExpanded ? styles.expanded : ''}`}>
                      <div className={styles.accordionContent}>
                        <div className={styles.evaluationsGrid}>
                          {evaluacionesGrado.map((evaluation: Evaluation) => (
                            <EvaluationCard
                              key={evaluation.id}
                              href={evaluation.href}
                              title={evaluation.title}
                              backgroundColor={evaluation.backgroundColor}
                              isActive={evaluation.isActive}
                              isCompleted={evaluation.isCompleted}
                              progress={evaluation.progress}
                              icon={evaluation.icon}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>
        {/* Estándar de aprendizaje 7 - Con acordeones por grado */}
        <div className={styles.evaluationsContainer}>
          <StandardHeader
            level={7}
            title="Estándar de aprendizaje 7"
            description="Evaluaciones para estudiantes de 3°, 4° y 5° de secundaria"
            totalEvaluations={evaluationsNivel7.flatMap((nivelData: EvaluationsByGrado) => 
              Object.values(nivelData).flat()
            ).length}
            completedEvaluations={0}
          />
          
          {/* Acordeones agrupados por grado */}
          <div className={styles.accordionContainer}>
            {evaluationsNivel7.map((nivelData: EvaluationsByGrado) => {
              // Obtener los grados ordenados
              const grados = Object.keys(nivelData).map(Number).sort();
              
              return grados.map((grado) => {
                const evaluacionesGrado = nivelData[grado];
                const isExpanded = expandedAccordions.has(grado);
                
                return (
                  <div key={grado} className={styles.accordionItem}>
                    {/* Header del acordeón */}
                    <div 
                      className={styles.accordionHeader}
                      onClick={() => toggleAccordion(grado)}
                    >
                      <div className={styles.accordionTitle}>
                        {/* <span className={styles.gradoNumber}>{grado}°</span> */}
                        <span> {convertGrade(`${grado}`)}</span>
                        <span className={styles.accordionItemCount}>
                          ({evaluacionesGrado.length} categorias)
                        </span>
                      </div>
                      {isExpanded ? (
                        <MdExpandLess className={styles.accordionIcon} />
                      ) : (
                        <MdExpandMore className={styles.accordionIcon} />
                      )}
                    </div>
                    
                    {/* Body del acordeón */}
                    <div className={`${styles.accordionBody} ${isExpanded ? styles.expanded : ''}`}>
                      <div className={styles.accordionContent}>
                        <div className={styles.evaluationsGrid}>
                          {evaluacionesGrado.map((evaluation: Evaluation) => (
                            <EvaluationCard
                              key={evaluation.id}
                              href={evaluation.href}
                              title={evaluation.title}
                              backgroundColor={evaluation.backgroundColor}
                              isActive={evaluation.isActive}
                              isCompleted={evaluation.isCompleted}
                              progress={evaluation.progress}
                              icon={evaluation.icon}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>

        
      </div>
    </div>
  )
}

export default TercerNivel
TercerNivel.Auth = PrivateRouteDocentes