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

  // Filter categories that are active and apply to Primaria (nivel 1)
  const categoriesNivel1 = (categorias && categorias.length > 0 ? categorias : especialidad)
    .filter(cat => cat.activo !== false && cat.niveles && cat.niveles.includes(1))

  const getMateriaColor = (catId: number) => {
    switch (catId) {
      case 1: // lee (Comunicación)
        return 'var(--color-materia-comunicacion, #0891b2)';
      case 2: // resuelve problemas (Matemática)
        return 'var(--color-materia-matematica, #dc2626)';
      case 8: // Personal Social
        return 'var(--color-materia-sociales, #ea580c)';
      case 9: // Ciencia y Tecnologia
        return 'var(--color-materia-ciencia, #059669)';
      default:
        return 'var(--color-tercero, #3ABEF9)';
    }
  };

  const getMateriaIcon = (catId: number) => {
    switch (catId) {
      case 1:
        return <RiBookOpenLine />;
      case 2:
        return <RiCalculatorLine />;
      case 8:
        return <RiShieldUserLine />;
      case 9:
        return <RiFlaskLine />;
      default:
        return <RiBookOpenLine />;
    }
  };

  const getCategoriaTitle = (cat: any) => {
    if (cat.id === 1) return 'Comunicación';
    if (cat.id === 2) return 'Matemática';
    return cat.categoria.charAt(0).toUpperCase() + cat.categoria.slice(1);
  };

  // Datos de las evaluaciones agrupadas por grado para estándar 3 (1er y 2do grado de primaria)
  const evaluationsNivel3 = [
    {
      1: categoriesNivel1.map(cat => ({
        id: `1ro-${cat.id}`,
        title: getCategoriaTitle(cat),
        href: `tercerNivel/pruebas?grado=1&categoria=${cat.id}`,
        backgroundColor: getMateriaColor(cat.id),
        isActive: false,
        isCompleted: false,
        progress: 0,
        icon: getMateriaIcon(cat.id)
      })),
      2: categoriesNivel1.map(cat => ({
        id: `2do-${cat.id}`,
        title: getCategoriaTitle(cat),
        href: `tercerNivel/pruebas?grado=2&categoria=${cat.id}`,
        backgroundColor: getMateriaColor(cat.id),
        isActive: false,
        isCompleted: false,
        progress: 0,
        icon: getMateriaIcon(cat.id)
      }))
    }
  ];

  // Datos de las evaluaciones agrupadas por grado para estándar 4 (3er y 4to grado de primaria)
  const evaluationsNivel4 = [
    {
      3: categoriesNivel1.map(cat => ({
        id: `3ro-${cat.id}`,
        title: getCategoriaTitle(cat),
        href: `tercerNivel/pruebas?grado=3&categoria=${cat.id}`,
        backgroundColor: getMateriaColor(cat.id),
        isActive: false,
        isCompleted: false,
        progress: 0,
        icon: getMateriaIcon(cat.id)
      })),
      4: categoriesNivel1.map(cat => ({
        id: `4to-${cat.id}`,
        title: getCategoriaTitle(cat),
        href: `tercerNivel/pruebas?grado=4&categoria=${cat.id}`,
        backgroundColor: getMateriaColor(cat.id),
        isActive: false,
        isCompleted: false,
        progress: 0,
        icon: getMateriaIcon(cat.id)
      }))
    }
  ];

  // Datos de las evaluaciones agrupadas por grado para estándar 5 (5to y 6to grado de primaria)
  const evaluationsNivel5 = [
    {
      5: categoriesNivel1.map(cat => ({
        id: `5to-${cat.id}`,
        title: getCategoriaTitle(cat),
        href: `tercerNivel/pruebas?grado=5&categoria=${cat.id}`,
        backgroundColor: getMateriaColor(cat.id),
        isActive: false,
        isCompleted: false,
        progress: 0,
        icon: getMateriaIcon(cat.id)
      })),
      6: categoriesNivel1.map(cat => ({
        id: `6to-${cat.id}`,
        title: getCategoriaTitle(cat),
        href: `tercerNivel/pruebas?grado=6&categoria=${cat.id}`,
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
    { label: 'Primaria', isActive: true }
  ];

  const renderAccordionGroup = (nivelDataList: any[]) => {
    return nivelDataList.map((nivelData: EvaluationsByGrado) => {
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
                <span> {convertGrade(`${grado}`)}</span>
                <span className={styles.accordionItemCount}>
                  ({evaluacionesGrado.length} categorías)
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
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.mainGrid}>
        <NavigationBreadcrumb items={breadcrumbItems} />

        <h1 className={styles.title}>Educación Primaria</h1>

        {/* Estándar de aprendizaje 3 */}
        <div className={styles.evaluationsContainer}>
          <StandardHeader
            level={3}
            title="Estándar de aprendizaje"
            description="Evaluaciones para estudiantes de 1° y 2° de primaria"
            totalEvaluations={evaluationsNivel3.flatMap((nivelData: EvaluationsByGrado) => 
              Object.values(nivelData).flat()
            ).length}
            completedEvaluations={0}
          />

          <div className={styles.accordionContainer}>
            {renderAccordionGroup(evaluationsNivel3)}
          </div>
        </div>

        {/* Estándar de aprendizaje 4 */}
        <div className={styles.evaluationsContainer}>
          <StandardHeader
            level={4}
            title="Estándar de aprendizaje"
            description="Evaluaciones para estudiantes de 3° y 4° de primaria"
            totalEvaluations={evaluationsNivel4.flatMap((nivelData: EvaluationsByGrado) => 
              Object.values(nivelData).flat()
            ).length}
            completedEvaluations={0}
          />

          <div className={styles.accordionContainer}>
            {renderAccordionGroup(evaluationsNivel4)}
          </div>
        </div>

        {/* Estándar de aprendizaje 5 */}
        <div className={styles.evaluationsContainer}>
          <StandardHeader
            level={5}
            title="Estándar de aprendizaje"
            description="Evaluaciones para estudiantes de 5° y 6° de primaria"
            totalEvaluations={evaluationsNivel5.flatMap((nivelData: EvaluationsByGrado) => 
              Object.values(nivelData).flat()
            ).length}
            completedEvaluations={0}
          />

          <div className={styles.accordionContainer}>
            {renderAccordionGroup(evaluationsNivel5)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TercerNivel
TercerNivel.Auth = PrivateRouteDocentes