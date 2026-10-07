import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  RiArrowRightLine,
  RiArrowLeftLine,
  RiBookOpenLine,
  RiCalculatorLine,
  RiFlaskLine,
  RiShieldUserLine,
  RiGlobalLine,
  RiEditBoxLine,
  RiFileChartLine,
  RiCalendarCheckLine,
  RiTableLine,
  RiGridLine,
  RiCheckLine,
} from 'react-icons/ri';
import { FaGraduationCap, FaChalkboardTeacher, FaChild, FaStar } from 'react-icons/fa';
import { MdSchool } from 'react-icons/md';
import { PiFilesFill } from 'react-icons/pi';
import primariaImg from '@/assets/primaria.png';
import secundariaImg from '@/assets/secundaria.png';
import inicialImg from '@/assets/inicial.png';
import { getCategoriasParaGrado, getNivelFromGrado, especialidad } from '@/fuctions/categorias';
import { getMonthName, currentYear } from '@/fuctions/dates';
import styles from './docentesExploracionNiveles.module.css';

// Definición de Niveles y Estándares
interface SubLevelDef {
  number: number;
  title: string;
  description: string;
  grados: number[];
}

interface EducationLevelDef {
  id: 'inicial' | 'primaria' | 'secundaria';
  title: string;
  description: string;
  icon: any;
  image: any;
  nivel: number;
  levels: SubLevelDef[];
}

const EDUCATION_LEVELS_CONFIG: EducationLevelDef[] = [
  {
    id: 'primaria',
    title: 'Educación Primaria',
    description: 'Niveles 3, 4 y 5 - Estudiantes de 6 a 11 años',
    icon: FaChalkboardTeacher,
    image: primariaImg,
    nivel: 1,
    levels: [
      {
        number: 3,
        title: 'Nivel 3',
        description: 'Estándares de aprendizaje para estudiantes de 1° y 2° de primaria',
        grados: [1, 2],
      },
      {
        number: 4,
        title: 'Nivel 4',
        description: 'Estándares de aprendizaje para estudiantes de 3° y 4° de primaria',
        grados: [3, 4],
      },
      {
        number: 5,
        title: 'Nivel 5',
        description: 'Estándares de aprendizaje para estudiantes de 5° y 6° de primaria',
        grados: [5, 6],
      },
    ],
  },
  {
    id: 'secundaria',
    title: 'Educación Secundaria',
    description: 'Niveles 6 y 7 - Estudiantes de 12 a 17 años',
    icon: FaGraduationCap,
    image: secundariaImg,
    nivel: 2,
    levels: [
      {
        number: 6,
        title: 'Nivel 6',
        description: 'Estándares de aprendizaje para estudiantes de 1° y 2° de secundaria',
        grados: [7, 8],
      },
      {
        number: 7,
        title: 'Nivel 7',
        description: 'Estándares de aprendizaje para estudiantes de 3°, 4° y 5° de secundaria',
        grados: [9, 10, 11],
      },
    ],
  },
  {
    id: 'inicial',
    title: 'Educación Inicial',
    description: 'Niveles 1 y 2 - Niños de 3 a 5 años',
    icon: FaChild,
    image: inicialImg,
    nivel: 0,
    levels: [
      {
        number: 1,
        title: 'Nivel 1',
        description: 'Estándares de aprendizaje para estudiantes de 3 años',
        grados: [12],
      },
      {
        number: 2,
        title: 'Nivel 2',
        description: 'Estándares de aprendizaje para estudiantes de 4 y 5 años',
        grados: [12],
      },
    ],
  },
];

const GRADO_NAMES_MAP: Record<number, { name: string; ageText: string }> = {
  12: { name: 'Inicial (3, 4 y 5 años)', ageText: 'Niños de 3 a 5 años' },
  1: { name: '1° Grado de Primaria', ageText: 'Estudiantes de 6 años' },
  2: { name: '2° Grado de Primaria', ageText: 'Estudiantes de 7 años' },
  3: { name: '3° Grado de Primaria', ageText: 'Estudiantes de 8 años' },
  4: { name: '4° Grado de Primaria', ageText: 'Estudiantes de 9 años' },
  5: { name: '5° Grado de Primaria', ageText: 'Estudiantes de 10 años' },
  6: { name: '6° Grado de Primaria', ageText: 'Estudiantes de 11 años' },
  7: { name: '1° de Secundaria', ageText: 'Estudiantes de 12 a 13 años' },
  8: { name: '2° de Secundaria', ageText: 'Estudiantes de 13 a 14 años' },
  9: { name: '3° de Secundaria', ageText: 'Estudiantes de 14 a 15 años' },
  10: { name: '4° de Secundaria', ageText: 'Estudiantes de 15 a 16 años' },
  11: { name: '5° de Secundaria', ageText: 'Estudiantes de 16 a 17 años' },
};

const getSubjectMeta = (catId: number, originalName?: string) => {
  switch (Number(catId)) {
    case 1:
      return {
        label: 'Comunicación',
        description: 'Comprensión y producción de textos escritos',
        icon: RiBookOpenLine,
        color: '#0284c7',
        bg: '#f0f9ff',
        border: '#bae6fd',
      };
    case 2:
      return {
        label: 'Matemática',
        description: 'Resolución de problemas de cantidad y forma',
        icon: RiCalculatorLine,
        color: '#e11d48',
        bg: '#fff1f2',
        border: '#fecdd3',
      };
    case 3:
      return {
        label: 'Comunicación',
        description: 'Lectura, escritura y comunicación oral',
        icon: RiBookOpenLine,
        color: '#0284c7',
        bg: '#f0f9ff',
        border: '#bae6fd',
      };
    case 4:
      return {
        label: 'Matemática',
        description: 'Regularidad, equivalencia y cambio',
        icon: RiCalculatorLine,
        color: '#e11d48',
        bg: '#fff1f2',
        border: '#fecdd3',
      };
    case 5:
    case 9:
      return {
        label: 'Ciencia y Tecnología',
        description: 'Indagación científica y mundo físico',
        icon: RiFlaskLine,
        color: '#059669',
        bg: '#f0fdf4',
        border: '#a7f3d0',
      };
    case 8:
      return {
        label: 'Personal Social',
        description: 'Identidad, convivencia y ciudadanía democrática',
        icon: RiShieldUserLine,
        color: '#ea580c',
        bg: '#fff7ed',
        border: '#fed7aa',
      };
    case 6:
      return {
        label: 'DPCC',
        description: 'Desarrollo Personal, Ciudadanía y Cívica',
        icon: RiShieldUserLine,
        color: '#7c3aed',
        bg: '#faf5ff',
        border: '#ddd6fe',
      };
    case 7:
      return {
        label: 'Ciencias Sociales',
        description: 'Historia, geografía y economía',
        icon: RiGlobalLine,
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a',
      };
    default:
      return {
        label: originalName || 'Área Curricular',
        description: 'Evaluación de competencias y capacidades',
        icon: RiBookOpenLine,
        color: '#2563eb',
        bg: '#eff6ff',
        border: '#dbeafe',
      };
  }
};

const getBasePathForEvaluacion = (eva: any) => {
  const nivel = getNivelFromGrado(eva.grado ?? 1);
  if (nivel === 0) return '/docentes/evaluaciones/inicial/pruebas/prueba';
  if (nivel === 2) return '/docentes/evaluaciones/secundaria/pruebas/prueba';
  return '/docentes/evaluaciones/tercerNivel/pruebas/prueba';
};

interface DocentesExploracionNivelesProps {
  evaluaciones: any[];
  currentUserData: any;
  teacherGrados: number[];
  teacherNiveles: number[];
  categorias?: any[];
}

export const DocentesExploracionNiveles: React.FC<DocentesExploracionNivelesProps> = ({
  evaluaciones = [],
  currentUserData,
  teacherGrados = [],
  teacherNiveles = [],
  categorias = [],
}) => {
  // Estado del flujo guiado por pasos (en memoria, sin recargar página)
  const [currentStep, setCurrentStep] = useState<'niveles' | 'grados' | 'categorias' | 'evaluaciones'>('niveles');
  const [selectedEducationLevel, setSelectedEducationLevel] = useState<EducationLevelDef | null>(null);
  const [selectedSubLevel, setSelectedSubLevel] = useState<SubLevelDef | null>(null);
  const [selectedGrado, setSelectedGrado] = useState<number | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<any | null>(null);

  // Estados locales en el Paso 4 (Evaluaciones)
  const [evalViewMode, setEvalViewMode] = useState<'cards' | 'table'>('cards');
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward');

  // Niveles permitidos según asignación y tipo de institución
  const allowedNiveles = useMemo(() => {
    if (Array.isArray(currentUserData?.nivelDeInstitucion) && currentUserData.nivelDeInstitucion.length > 0) {
      return currentUserData.nivelDeInstitucion.map(Number);
    }
    if (currentUserData?.nivel !== undefined && currentUserData?.nivel !== null) {
      return [Number(currentUserData.nivel)];
    }
    if (teacherNiveles && teacherNiveles.length > 0) {
      return teacherNiveles;
    }
    return [0, 1, 2];
  }, [currentUserData, teacherNiveles]);

  // Lista de niveles educativos filtrados
  const filteredEducationLevels = useMemo(() => {
    return EDUCATION_LEVELS_CONFIG.filter((l) => allowedNiveles.includes(l.nivel));
  }, [allowedNiveles]);

  // Mapa de evaluaciones activas por grado
  const activeCountByGrado = useMemo(() => {
    const map = new Map<number, number>();
    evaluaciones.forEach((eva) => {
      if (eva.tipoDeEvaluacion && eva.tipoDeEvaluacion !== '1') return;
      if (eva.active !== true) return;
      const gNum = Number(eva.grado);
      if (!isNaN(gNum)) {
        map.set(gNum, (map.get(gNum) || 0) + 1);
      }
    });
    return map;
  }, [evaluaciones]);

  // Contar evaluaciones activas para un sub-nivel
  const getSubLevelActiveCount = (subLevel: SubLevelDef) => {
    return subLevel.grados.reduce((acc, g) => acc + (activeCountByGrado.get(g) || 0), 0);
  };

  // Acciones de Navegación del Flujo con animación direccional
  const handleSelectSubLevel = (level: EducationLevelDef, subLevel: SubLevelDef) => {
    setTransitionDirection('forward');
    setSelectedEducationLevel(level);
    setSelectedSubLevel(subLevel);
    setSelectedGrado(null);
    setSelectedCategoria(null);
    setCurrentStep('grados');
  };

  const handleSelectGrado = (gradoNum: number) => {
    setTransitionDirection('forward');
    setSelectedGrado(gradoNum);
    setSelectedCategoria(null);
    setCurrentStep('categorias');
  };

  const handleSelectCategoria = (cat: any) => {
    setTransitionDirection('forward');
    setSelectedCategoria(cat);
    setCurrentStep('evaluaciones');
  };

  const handleBack = () => {
    setTransitionDirection('backward');
    if (currentStep === 'evaluaciones') {
      setCurrentStep('categorias');
    } else if (currentStep === 'categorias') {
      setCurrentStep('grados');
    } else if (currentStep === 'grados') {
      setCurrentStep('niveles');
    }
  };

  const handleGoToStep = (targetStep: 'niveles' | 'grados' | 'categorias') => {
    setTransitionDirection('backward');
    setCurrentStep(targetStep);
  };

  // Evaluaciones activas del Paso 4 (Grado y Categoría seleccionados)
  const step4EvaluacionesActivas = useMemo(() => {
    if (!selectedGrado || !selectedCategoria) return [];
    return evaluaciones.filter((eva) => {
      if (eva.tipoDeEvaluacion && eva.tipoDeEvaluacion !== '1') return false;
      const matchGrado = Number(eva.grado) === selectedGrado;
      const matchCat = Number(eva.categoria) === Number(selectedCategoria.id);
      return matchGrado && matchCat && eva.active === true;
    });
  }, [evaluaciones, selectedGrado, selectedCategoria]);

  // Categorías disponibles en el Paso 3 para el grado seleccionado
  const step3Categorias = useMemo(() => {
    if (!selectedGrado) return [];
    return getCategoriasParaGrado(selectedGrado, categorias, evaluaciones);
  }, [selectedGrado, categorias, evaluaciones]);

  const selectedGradoMeta = selectedGrado ? GRADO_NAMES_MAP[selectedGrado] || { name: `Grado ${selectedGrado}`, ageText: '' } : null;

  return (
    <div className={styles.drilldownContainer}>
      {/* ── Barra de Navegación y Breadcrumb Dinámico (Solo en Pasos 2, 3 y 4) ── */}
      {currentStep !== 'niveles' && (
        <nav className={styles.breadcrumbNav} aria-label="Navegación progresiva de niveles">
          <div className={styles.breadcrumbLeft}>
            <button
              type="button"
              onClick={handleBack}
              className={styles.backButton}
              title="Retroceder al paso anterior"
            >
              <RiArrowLeftLine />
              <span>Volver</span>
            </button>

            <div className={styles.breadcrumbTrail}>
              <button
                type="button"
                onClick={() => handleGoToStep('niveles')}
                className={styles.crumbItem}
              >
                Niveles Educativos
              </button>

              {selectedEducationLevel && (
                <>
                  <span className={styles.crumbSeparator}>/</span>
                  <button
                    type="button"
                    onClick={() => handleGoToStep('grados')}
                    className={`${styles.crumbItem} ${currentStep === 'grados' ? styles.crumbActive : ''}`}
                  >
                    {selectedEducationLevel.title}: {selectedSubLevel?.title}
                  </button>
                </>
              )}

              {selectedGrado && (currentStep === 'categorias' || currentStep === 'evaluaciones') && (
                <>
                  <span className={styles.crumbSeparator}>/</span>
                  <button
                    type="button"
                    onClick={() => handleGoToStep('categorias')}
                    className={`${styles.crumbItem} ${currentStep === 'categorias' ? styles.crumbActive : ''}`}
                  >
                    {selectedGradoMeta?.name}
                  </button>
                </>
              )}

              {selectedCategoria && currentStep === 'evaluaciones' && (
                <>
                  <span className={styles.crumbSeparator}>/</span>
                  <span className={`${styles.crumbItem} ${styles.crumbActive}`}>
                    {selectedCategoria.categoria || 'Área'}
                  </span>
                </>
              )}
            </div>
          </div>

          <span className={styles.stepIndicator}>
            {currentStep === 'grados' && 'Paso 2 de 4: Grados'}
            {currentStep === 'categorias' && 'Paso 3 de 4: Materias'}
            {currentStep === 'evaluaciones' && 'Paso 4 de 4: Evaluaciones'}
          </span>
        </nav>
      )}

      {/* ── Contenedor Animado del Paso Activo ── */}
      <div
        key={currentStep}
        className={`${styles.stepContent} ${
          transitionDirection === 'forward' ? styles.slideForward : styles.slideBackward
        }`}
      >
        {/* ======================================================================
            PASO 1: NIVELES EDUCATIVOS Y SUB-NIVELES DISPONIBLES
            ====================================================================== */}
        {currentStep === 'niveles' && (
        <div className={styles.levelsContainer}>
          {filteredEducationLevels.map((level) => {
            const IconComponent = level.icon;
            const iconClass =
              level.id === 'primaria'
                ? styles.levelIconPrimaria
                : level.id === 'secundaria'
                ? styles.levelIconSecundaria
                : styles.levelIconInicial;

            return (
              <section key={level.id} className={styles.educationLevelCard}>
                <div className={levelHeaderStyle(styles, level.id)}>
                  <div className={styles.levelInfo}>
                    <div className={`${styles.levelIconBox} ${iconClass}`}>
                      <IconComponent />
                    </div>
                    <div className={styles.levelTitleBlock}>
                      <h2 className={styles.levelName}>{level.title}</h2>
                      <p className={styles.levelDesc}>{level.description}</p>
                    </div>
                  </div>

                  <div className={styles.levelImageWrapper}>
                    <Image
                      alt={`${level.title} ilustración`}
                      src={level.image}
                      width={110}
                      height={75}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                </div>

                {/* Sub-Niveles / Estándares de Aprendizaje Disponibles */}
                <div className={styles.subLevelsGrid}>
                  {level.levels.map((subLevel) => {
                    const activeCount = getSubLevelActiveCount(subLevel);

                    return (
                      <div
                        key={subLevel.number}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectSubLevel(level, subLevel)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleSelectSubLevel(level, subLevel);
                          }
                        }}
                        className={styles.subLevelCard}
                      >
                        <div className={styles.subLevelTop}>
                          <span className={styles.subLevelNumberBadge}>{subLevel.number}</span>
                          {activeCount > 0 ? (
                            <span className={styles.activeCountBadge}>
                              {activeCount} activa{activeCount > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className={styles.activeCountBadgeZero}>0 activas</span>
                          )}
                        </div>

                        <div>
                          <h3 className={styles.subLevelTitle}>{subLevel.title}</h3>
                          <p className={styles.subLevelDescription}>{subLevel.description}</p>
                        </div>

                        <div className={styles.subLevelFooter}>
                          <span>Ver grados y estándares</span>
                          <RiArrowRightLine />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* ======================================================================
          PASO 2: ESTÁNDARES DE APRENDIZAJE Y SUS RESPECTIVOS GRADOS
          ====================================================================== */}
      {currentStep === 'grados' && selectedSubLevel && selectedEducationLevel && (
        <section aria-labelledby="step2-title">
          <div className={styles.stepHeader}>
            <div className={styles.stepTitleBlock}>
              <div className={styles.stepTitleRow}>
                <div className={styles.stepIconContainer}>
                  <MdSchool />
                </div>
                <div>
                  <h2 id="step2-title" className={styles.stepTitle}>
                    {selectedEducationLevel.title}: {selectedSubLevel.title}
                  </h2>
                  <p className={styles.stepSubtitle}>{selectedSubLevel.description}</p>
                </div>
              </div>
            </div>

            <span
              className={`${styles.stepBadge} ${
                selectedEducationLevel.id === 'primaria'
                  ? styles.badgePrimaria
                  : selectedEducationLevel.id === 'secundaria'
                  ? styles.badgeSecundaria
                  : styles.badgeInicial
              }`}
            >
              {selectedEducationLevel.id}
            </span>
          </div>

          <div className={styles.gradosGrid}>
            {selectedSubLevel.grados.map((gradoNum) => {
              const gMeta = GRADO_NAMES_MAP[gradoNum] || { name: `Grado ${gradoNum}`, ageText: '' };
              const isAssigned = teacherGrados.includes(gradoNum);
              const activeCount = activeCountByGrado.get(gradoNum) || 0;

              return (
                <div
                  key={gradoNum}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectGrado(gradoNum)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSelectGrado(gradoNum);
                    }
                  }}
                  className={styles.gradoCard}
                >
                  <div className={styles.gradoCardHeader}>
                    <div className={styles.gradoIconBox}>
                      <MdSchool />
                    </div>
                    {isAssigned && (
                      <span className={styles.gradoAssignedBadge} title="Grado a tu cargo">
                        <RiCheckLine /> Tu Grado Asignado
                      </span>
                    )}
                  </div>

                  <div className={styles.gradoBody}>
                    <h3 className={styles.gradoTitle}>{gMeta.name}</h3>
                    <p className={styles.gradoSubtitle}>{gMeta.ageText}</p>
                  </div>

                  <div className={styles.gradoFooter}>
                    {activeCount > 0 ? (
                      <span className={styles.activeCountBadge}>
                        {activeCount} evaluación{activeCount > 1 ? 'es' : ''} activa{activeCount > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className={styles.activeCountBadgeZero}>Sin pruebas activas</span>
                    )}

                    <span className={styles.gradoActionText}>
                      Ver áreas <RiArrowRightLine />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ======================================================================
          PASO 3: CATEGORÍAS / ÁREAS CURRICULARES DEL GRADO
          ====================================================================== */}
      {currentStep === 'categorias' && selectedGrado && (
        <section aria-labelledby="step3-title">
          <div className={styles.stepHeader}>
            <div className={styles.stepTitleBlock}>
              <div className={styles.stepTitleRow}>
                <div className={styles.stepIconContainer}>
                  <RiBookOpenLine />
                </div>
                <div>
                  <h2 id="step3-title" className={styles.stepTitle}>
                    Áreas Curriculares: {selectedGradoMeta?.name}
                  </h2>
                  <p className={styles.stepSubtitle}>
                    Selecciona el área para ver las evaluaciones disponibles listas para calificar
                  </p>
                </div>
              </div>
            </div>

            {teacherGrados.includes(selectedGrado) && (
              <span className={styles.gradoAssignedBadge}>
                <RiCheckLine /> Grado Asignado a tu cargo
              </span>
            )}
          </div>

          {step3Categorias.length > 0 ? (
            <div className={styles.categoriasGrid}>
              {step3Categorias.map((cat: any) => {
                const meta = getSubjectMeta(cat.id, cat.categoria);
                const SubjectIcon = meta.icon;

                // Contar evaluaciones activas para esta categoría específica en este grado
                const activeCount = evaluaciones.filter((eva) => {
                  if (eva.tipoDeEvaluacion && eva.tipoDeEvaluacion !== '1') return false;
                  return (
                    Number(eva.grado) === selectedGrado &&
                    Number(eva.categoria) === Number(cat.id) &&
                    eva.active === true
                  );
                }).length;

                return (
                  <div
                    key={cat.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectCategoria(cat)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleSelectCategoria(cat);
                      }
                    }}
                    className={styles.categoriaCard}
                  >
                    <div className={styles.categoriaHeader}>
                      <div
                        className={styles.categoriaIconBox}
                        style={{
                          backgroundColor: meta.bg,
                          color: meta.color,
                          border: `1px solid ${meta.border}`,
                        }}
                      >
                        <SubjectIcon />
                      </div>

                      {activeCount > 0 ? (
                        <span className={styles.activeCountBadge}>
                          {activeCount} activa{activeCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className={styles.activeCountBadgeZero}>0 activas</span>
                      )}
                    </div>

                    <div className={styles.categoriaBody}>
                      <h3 className={styles.categoriaTitle}>{cat.categoria || meta.label}</h3>
                      <p className={styles.categoriaDescription}>{meta.description}</p>
                    </div>

                    <div className={styles.categoriaFooter}>
                      <span className={styles.categoriaActionBtn} style={{ color: meta.color }}>
                        <span>Ver evaluaciones</span>
                        <RiArrowRightLine />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <RiCalendarCheckLine className={styles.emptyStateIcon} />
              <h3 className={styles.emptyStateTitle}>No hay áreas registradas para este grado</h3>
              <p className={styles.emptyStateText}>
                No se encontraron materias o categorías curriculares configuradas para este nivel.
              </p>
              <button type="button" onClick={handleBack} className={styles.emptyStateBtn}>
                ← Volver a seleccionar grado
              </button>
            </div>
          )}
        </section>
      )}

      {/* ======================================================================
          PASO 4: EVALUACIONES ACTIVAS DE LA CATEGORÍA Y GRADO
          ====================================================================== */}
      {currentStep === 'evaluaciones' && selectedGrado && selectedCategoria && (
        <section aria-labelledby="step4-title" className={styles.evaluacionesContainer}>
          <div className={styles.stepHeader}>
            <div className={styles.stepTitleBlock}>
              <div className={styles.stepTitleRow}>
                <div className={styles.stepIconContainer}>
                  <PiFilesFill />
                </div>
                <div>
                  <h2 id="step4-title" className={styles.stepTitle}>
                    {selectedCategoria.categoria}: {selectedGradoMeta?.name}
                  </h2>
                  <p className={styles.stepSubtitle}>
                    {step4EvaluacionesActivas.length > 0
                      ? `${step4EvaluacionesActivas.length} evaluación(es) activa(s) disponibles para calificar estudiantes`
                      : 'No hay evaluaciones activas disponibles en este momento'}
                  </p>
                </div>
              </div>
            </div>

            {/* Toolbar con indicador de activas y modo tabla/tarjetas */}
            <div className={styles.evaluacionesToolbar}>
              <div className={styles.evaluacionesCountInfo}>
                <span className={styles.activeStatusDot} />
                <span>
                  Evaluaciones Activas ({step4EvaluacionesActivas.length})
                </span>
              </div>

              <div className={styles.viewToggleGroup} role="group" aria-label="Cambiar vista">
                <button
                  type="button"
                  onClick={() => setEvalViewMode('cards')}
                  className={`${styles.viewToggleBtn} ${evalViewMode === 'cards' ? styles.viewToggleBtnActive : ''}`}
                  title="Vista Tarjetas"
                >
                  <RiGridLine />
                  <span>Tarjetas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEvalViewMode('table')}
                  className={`${styles.viewToggleBtn} ${evalViewMode === 'table' ? styles.viewToggleBtnActive : ''}`}
                  title="Vista Tabla"
                >
                  <RiTableLine />
                  <span>Tabla</span>
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Evaluaciones Activas (Cards o Tabla) */}
          {step4EvaluacionesActivas.length > 0 ? (
            evalViewMode === 'cards' ? (
              <div className={styles.evaluacionesCardsGrid}>
                {step4EvaluacionesActivas.map((eva, index) => {
                  const basePath = getBasePathForEvaluacion(eva);
                  const year = eva.añoDelExamen || currentYear;
                  const monthName =
                    eva.mesDelExamen !== undefined && eva.mesDelExamen !== null
                      ? getMonthName(Number(eva.mesDelExamen))
                      : '';

                  return (
                    <article key={`${eva.id}-${index}`} className={styles.evalCard}>
                      <div className={styles.evalCardHeader}>
                        <div className={styles.evalIconBox}>
                          <PiFilesFill />
                        </div>
                        <div className={styles.evalCardBadges}>
                          {(monthName || year) && (
                            <span className={styles.periodBadge}>
                              {monthName ? `${monthName} ` : ''}
                              {year}
                            </span>
                          )}
                          <span className={`${styles.statusBadge} ${styles.statusActive}`}>
                            Activa
                          </span>
                        </div>
                      </div>

                      <div className={styles.evalCardBody}>
                        <h3 className={styles.evalCardTitle}>{eva.nombre}</h3>
                        <p className={styles.evalCardStatusText}>
                          Disponible para calificar estudiantes
                        </p>
                      </div>

                      <div className={styles.evalCardFooter}>
                        <Link
                          href={`${basePath}/reporte?idExamen=${eva.id}&grado=${eva.grado}&categoria=${eva.categoria}`}
                          className={styles.btnReporte}
                          title="Ver reporte y resultados"
                        >
                          <RiFileChartLine />
                          <span>Reporte</span>
                        </Link>

                        <Link
                          href={`${basePath}?idExamen=${eva.id}&grado=${eva.grado}&categoria=${eva.categoria}`}
                          className={styles.btnEvaluar}
                          title="Comenzar a calificar estudiantes"
                        >
                          <RiEditBoxLine />
                          <span>Comenzar →</span>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              /* Vista Tabla */
              <div className={styles.evaluacionesTableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Evaluación</th>
                      <th>Período</th>
                      <th>Estado</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {step4EvaluacionesActivas.map((eva, index) => {
                      const basePath = getBasePathForEvaluacion(eva);
                      const year = eva.añoDelExamen || currentYear;
                      const monthName =
                        eva.mesDelExamen !== undefined && eva.mesDelExamen !== null
                          ? getMonthName(Number(eva.mesDelExamen))
                          : '';

                      return (
                        <tr key={`${eva.id}-${index}`}>
                          <td>
                            <strong>{eva.nombre}</strong>
                          </td>
                          <td>
                            <span className={styles.periodBadge}>
                              {monthName ? `${monthName} ` : ''}
                              {year}
                            </span>
                          </td>
                          <td>
                            <span className={`${styles.statusBadge} ${styles.statusActive}`}>
                              Activa
                            </span>
                          </td>
                          <td>
                            <div className={styles.tableActionsCell}>
                              <Link
                                href={`${basePath}/reporte?idExamen=${eva.id}&grado=${eva.grado}&categoria=${eva.categoria}`}
                                className={styles.btnReporte}
                              >
                                <RiFileChartLine />
                                <span>Reporte</span>
                              </Link>
                              <Link
                                href={`${basePath}?idExamen=${eva.id}&grado=${eva.grado}&categoria=${eva.categoria}`}
                                className={styles.btnEvaluar}
                              >
                                <RiEditBoxLine />
                                <span>Evaluar</span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className={styles.emptyState}>
              <RiCalendarCheckLine className={styles.emptyStateIcon} />
              <h3 className={styles.emptyStateTitle}>
                No hay evaluaciones activas actualmente
              </h3>
              <p className={styles.emptyStateText}>
                No se encontraron evaluaciones activas para esta área curricular y grado.
              </p>
              <div className={styles.emptyStateActionRow}>
                <button type="button" onClick={handleBack} className={styles.emptyStateBtn}>
                  ← Ver otras áreas curriculares
                </button>
              </div>
            </div>
          )}
        </section>
      )}
      </div>
    </div>
  );
};

const levelHeaderStyle = (styles: any, id: string) => {
  return `${styles.levelHeader} ${styles[id] || ''}`;
};

export default DocentesExploracionNiveles;
