import React, { useState } from 'react'
import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes'
import StandardHeader from '@/components/evaluaciones/StandardHeader'
import EvaluationCard from '@/components/evaluaciones/EvaluationCard'
import StatsCard from '@/components/evaluaciones/StatsCard'
import NavigationBreadcrumb from '@/components/evaluaciones/NavigationBreadcrumb'
import { FaGraduationCap, FaBookOpen, FaChartLine, FaUsers } from 'react-icons/fa'
import { MdExpandMore, MdExpandLess } from 'react-icons/md'
import styles from './index.module.css'
import {convertGrade} from '@/fuctions/regiones'

interface Evaluation {
  id: string;
  title: string;
  href: string;
  backgroundColor: string;
  isActive: boolean;
  isCompleted: boolean;
  progress: number;
}

interface EvaluationsByGrado {
  [key: number]: Evaluation[];
}

const TercerNivel = () => {
  // Estado para manejar qué acordeones están expandidos
  const [expandedAccordions, setExpandedAccordions] = useState<Set<number>>(new Set());

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

  // Datos de las evaluaciones disponibles
  const evaluationsNivel6 = [
    { 
    7: [
      {
        id: 'com-7',
        title: 'Comunicación-Secundaria',
        href: 'secundaria/pruebas?grado=7&categoria=3',
        backgroundColor: '#0891b2', // Cian para 1ro sec
        isActive: false,
        isCompleted: false,
        progress: 0
      },
      {
        id: 'mat-7',
        title: 'Matemática-Secundaria',
        href: 'secundaria/pruebas?grado=7&categoria=4',
        backgroundColor: '#0e7490', // Cian más oscuro para 1ro sec
        isActive: false,
        isCompleted: false,
        progress: 0
      },
      {
        id: 'cyt-7',
        title: 'Ciencia y Tecnología-Secundaria',
        href: 'secundaria/pruebas?grado=7&categoria=5',
        backgroundColor: '#059669', // Verde para 2do sec
        isActive: false,
        isCompleted: false,
        progress: 0
      },
      {
        id: 'dpcc-7',
        title: 'DPCC-Secundaria',
        href: 'secundaria/pruebas?grado=7&categoria=6',
        backgroundColor: '#047857', // Verde más oscuro para 2do sec
        isActive: false,
        isCompleted: false,
        progress: 0
      },
      {
        id: 'css-7',
        title: 'Ciencias Sociales-Secundaria',
        href: 'secundaria/pruebas?grado=7&categoria=7',
        backgroundColor: '#047857', // Verde más oscuro para 2do sec
        isActive: false,
        isCompleted: false,
        progress: 0
      }
    ]
  ,
  8: [
    {
      id: 'com-8',
      title: 'Comunicación-Secundaria',
      href: 'secundaria/pruebas?grado=8&categoria=3',
      backgroundColor: '#0891b2', // Cian para 1ro sec
      isActive: false,
      isCompleted: false,
      progress: 0
    },
    {
      id: 'mat-8',
      title: 'Matemática-Secundaria',
      href: 'secundaria/pruebas?grado=8&categoria=4',
      backgroundColor: '#0e7490', // Cian más oscuro para 1ro sec
      isActive: false,
      isCompleted: false,
      progress: 0
    },
    {
      id: 'cyt-8',
      title: 'Ciencia y Tecnología-Secundaria',
      href: 'secundaria/pruebas?grado=8&categoria=5',
      backgroundColor: '#059669', // Verde para 2do sec
      isActive: false,
      isCompleted: false,
      progress: 0
    },
    {
      id: 'dpcc-8',
      title: 'DPCC-Secundaria',
      href: 'secundaria/pruebas?grado=8&categoria=6',
      backgroundColor: '#047857', // Verde más oscuro para 2do sec
      isActive: false,
      isCompleted: false,
      progress: 0
    },
    {
      id: 'css-8',
      title: 'Ciencias Sociales-Secundaria',
      href: 'secundaria/pruebas?grado=8&categoria=7',
      backgroundColor: '#047857', // Verde más oscuro para 2do sec
      isActive: false,
      isCompleted: false,
      progress: 0
    }
  ]}
  ];
  const evaluationsNivel7 = [
    { 
      9: [
        {
          id: 'com-9',
          title: 'Comunicación-Secundaria',
          href: 'secundaria/pruebas?grado=9&categoria=3',
          backgroundColor: '#dc2626', // Rojo para 3ro sec
          isActive: false,
          isCompleted: false,
          progress: 0
        },
        {
          id: 'mat-9',
          title: 'Matemática-Secundaria',
          href: 'secundaria/pruebas?grado=9&categoria=4',
          backgroundColor: '#b91c1c', // Rojo más oscuro para 3ro sec
          isActive: false,
          isCompleted: false,
          progress: 0
        },
        {
          id: 'cyt-9',
          title: 'Ciencia y Tecnología-Secundaria',
          href: 'secundaria/pruebas?grado=9&categoria=5',
          backgroundColor: '#7c3aed', // Púrpura para 4to sec
          isActive: false,
          isCompleted: false,
          progress: 0
        },
        {
          id: 'dpcc-9',
          title: 'DPCC-Secundaria',
          href: 'secundaria/pruebas?grado=9&categoria=6',
          backgroundColor: '#6d28d9', // Púrpura más oscuro para 4to sec
          isActive: false,
          isCompleted: false,
          progress: 0
        },
        {
          id: 'css-9',
          title: 'Ciencias Sociales-Secundaria',
          href: 'secundaria/pruebas?grado=9&categoria=7',
          backgroundColor: '#ea580c', // Naranja para 5to sec
          isActive: false,
          isCompleted: false,
          progress: 0
        }
      ],
      10: [
        {
          id: 'com-10',
          title: 'Comunicación-Secundaria',
          href: 'secundaria/pruebas?grado=10&categoria=3',
          backgroundColor: '#dc2626', // Rojo para 3ro sec
          isActive: false,
          isCompleted: false,
          progress: 0
        },
        {
          id: 'mat-10',
          title: 'Matemática-Secundaria',
          href: 'secundaria/pruebas?grado=10&categoria=4',
          backgroundColor: '#b91c1c', // Rojo más oscuro para 3ro sec
          isActive: false,
          isCompleted: false,
          progress: 0
        },
        {
          id: 'cyt-10',
          title: 'Ciencia y Tecnología-Secundaria',
          href: 'secundaria/pruebas?grado=10&categoria=5',
          backgroundColor: '#7c3aed', // Púrpura para 4to sec
          isActive: false,
          isCompleted: false,
          progress: 0
        },
        {
          id: 'dpcc-10',
          title: 'DPCC-Secundaria',
          href: 'secundaria/pruebas?grado=10&categoria=6',
          backgroundColor: '#6d28d9', // Púrpura más oscuro para 4to sec
          isActive: false,
          isCompleted: false,
          progress: 0
        },
        {
          id: 'css-10',
          title: 'Ciencias Sociales-Secundaria',
          href: 'secundaria/pruebas?grado=10&categoria=7',
          backgroundColor: '#ea580c', // Naranja para 5to sec
          isActive: false,
          isCompleted: false,
          progress: 0
        }
      ],
      11: [
        {
          id: 'com-11',
          title: 'Comunicación-Secundaria',
          href: 'secundaria/pruebas?grado=11&categoria=3',
          backgroundColor: '#dc2626', // Rojo para 3ro sec
          isActive: false,
          isCompleted: false,
          progress: 0
        },
        {
          id: 'mat-11',
          title: 'Matemática-Secundaria',
          href: 'secundaria/pruebas?grado=11&categoria=4',
          backgroundColor: '#b91c1c', // Rojo más oscuro para 3ro sec
          isActive: false,
          isCompleted: false,
          progress: 0
        },
        {
          id: 'cyt-11',
          title: 'Ciencia y Tecnología-Secundaria',
          href: 'secundaria/pruebas?grado=11&categoria=5',
          backgroundColor: '#7c3aed', // Púrpura para 4to sec
          isActive: false,
          isCompleted: false,
          progress: 0
        },
        {
          id: 'dpcc-11',
          title: 'DPCC-Secundaria',
          href: 'secundaria/pruebas?grado=11&categoria=6',
          backgroundColor: '#6d28d9', // Púrpura más oscuro para 4to sec
          isActive: false,
          isCompleted: false,
          progress: 0
        },
        {
          id: 'css-11',
          title: 'Ciencias Sociales-Secundaria',
          href: 'secundaria/pruebas?grado=11&categoria=7',
          backgroundColor: '#ea580c', // Naranja para 5to sec
          isActive: false,
          isCompleted: false,
          progress: 0
        }
      ]
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