import PrivateRouteDocentes from "@/components/layouts/PrivateRoutesDocentes";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState, useMemo } from "react";
import primaria from "../../../assets/primaria.png";
import secundaria from "../../../assets/secundaria.png";
import inicial from "../../../assets/inicial.png";
import {
  RiLoader4Line,
  RiArrowRightLine,
  RiSearchLine,
  RiCloseLine,
  RiLockLine,
  RiFlashlightLine,
  RiBookOpenLine,
  RiCalendarLine,
  RiTimeLine,
  RiRefreshLine,
  RiFileChartLine,
  RiEditBoxLine,
  RiQuestionLine,
  RiCheckLine,
  RiTableLine,
  RiGridLine,
} from "react-icons/ri";
import { FaGraduationCap, FaChalkboardTeacher, FaChild } from "react-icons/fa";
import styles from "./evaluaciones.module.css";
import { categoriaTransform, getNivelFromGrado } from "@/fuctions/categorias";
import { getGradoTexto } from "@/fuctions/regiones";
import { getMonthName, currentYear } from "@/fuctions/dates";
import CustomFilterDropdown, { FilterOption } from "@/components/reportes/CustomFilterDropdown";
import { Evaluaciones as EvaluacionesType } from "@/features/types/types";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { app } from "@/firebase/firebase.config";

// Datos de los niveles educativos originales
const educationLevels = [
  {
    id: 'secundaria',
    title: 'Educación Secundaria',
    description: 'Niveles 6 y 7 - Estudiantes de 12 a 17 años',
    icon: FaGraduationCap,
    image: secundaria,
    nivel: 2,
    levels: [
      { number: 6, title: 'Nivel 6', description: 'Estándares de aprendizaje para estudiantes de 1° y 2° de secundaria' },
      { number: 7, title: 'Nivel 7', description: 'Estándares de aprendizaje para estudiantes de 3°, 4° y 5° de secundaria' }
    ],
    href: '/docentes/evaluaciones/secundaria'
  },
  {
    id: 'primaria',
    title: 'Educación Primaria',
    description: 'Niveles 3, 4 y 5 - Estudiantes de 6 a 11 años',
    icon: FaChalkboardTeacher,
    nivel: 1,
    image: primaria,
    levels: [
      { number: 3, title: 'Nivel 3', description: 'Estándares de aprendizaje para estudiantes de 1° y 2° de primaria' },
      { number: 4, title: 'Nivel 4', description: 'Estándares de aprendizaje para estudiantes de 3° y 4° de primaria' },
      { number: 5, title: 'Nivel 5', description: 'Estándares de aprendizaje para estudiantes de 5° y 6° de primaria' }
    ],
    href: '/docentes/evaluaciones/tercerNivel'
  },
  {
    id: 'inicial',
    title: 'Educación Inicial',
    description: 'Niveles 1 y 2 - Niños de 3 a 5 años',
    icon: FaChild,
    nivel: 0,
    image: inicial,
    levels: [
      { number: 1, title: 'Nivel 1', description: 'Estándares de aprendizaje para estudiantes de 3 años' },
      { number: 2, title: 'Nivel 2', description: 'Estándares de aprendizaje para estudiantes de 4 y 5 años' }
    ],
    href: '/docentes/evaluaciones/inicial'
  }
];

const getBasePathForEvaluacion = (eva: EvaluacionesType) => {
  const nivel = getNivelFromGrado(eva.grado ?? 1);
  if (nivel === 0) return '/docentes/evaluaciones/inicial/pruebas/prueba';
  if (nivel === 2) return '/docentes/evaluaciones/secundaria/pruebas/prueba';
  return '/docentes/evaluaciones/tercerNivel/pruebas/prueba';
};

const getNivelBadgeInfo = (eva: EvaluacionesType) => {
  const nivel = getNivelFromGrado(eva.grado ?? 1);
  if (nivel === 0) return { label: 'Inicial', className: styles.qaLevelInicial };
  if (nivel === 2) return { label: 'Secundaria', className: styles.qaLevelSecundaria };
  return { label: 'Primaria', className: styles.qaLevelPrimaria };
};

const Evaluaciones = () => {
  const { getEvaluaciones } = useAgregarEvaluaciones();
  const { evaluaciones, currentUserData, loaderPages } = useGlobalContext();

  const [activeTab, setActiveTab] = useState<'rapido' | 'niveles'>('niveles');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activas' | 'inactivas'>('all');
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<'all' | number>('all');
  const [scopeFilter, setScopeFilter] = useState<'mis-grados' | 'todas'>('mis-grados');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [localGrados, setLocalGrados] = useState<number[]>([]);
  const [localAsignaciones, setLocalAsignaciones] = useState<any[]>([]);

  useEffect(() => {
    getEvaluaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserData.dni]);

  // Asegurar la sincronización de asignaciones y grados desde currentUserData, sessionStorage o Firestore
  useEffect(() => {
    if (!currentUserData?.dni) return;

    if (Array.isArray(currentUserData.asignaciones) && currentUserData.asignaciones.length > 0) {
      setLocalAsignaciones(currentUserData.asignaciones);
    }

    if (Array.isArray(currentUserData.grados) && currentUserData.grados.length > 0) {
      setLocalGrados(currentUserData.grados.map(Number));
    }

    if (typeof window !== 'undefined') {
      const audited = sessionStorage.getItem('audited_user');
      if (audited) {
        try {
          const parsed = JSON.parse(audited);
          if (Array.isArray(parsed?.asignaciones) && parsed.asignaciones.length > 0) {
            setLocalAsignaciones(parsed.asignaciones);
          }
          if (Array.isArray(parsed?.grados) && parsed.grados.length > 0) {
            setLocalGrados(parsed.grados.map(Number));
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    // Consulta de respaldo a Firestore para obtener asignaciones y grados frescos
    const db = getFirestore(app);
    const userRef = doc(db, 'usuarios', currentUserData.dni);
    getDoc(userRef)
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.asignaciones) && data.asignaciones.length > 0) {
            setLocalAsignaciones(data.asignaciones);
          }
          if (Array.isArray(data?.grados) && data.grados.length > 0) {
            setLocalGrados(data.grados.map(Number));
          }
        }
      })
      .catch(console.error);
  }, [currentUserData?.dni, currentUserData?.asignaciones, currentUserData?.grados]);

  // Extraer todos los grados a cargo del docente (tanto de asignaciones como del array tradicional de grados)
  const teacherGrados = useMemo(() => {
    const grades = new Set<number>();

    // 1. Extraer de currentUserData.asignaciones
    if (Array.isArray(currentUserData?.asignaciones)) {
      currentUserData.asignaciones.forEach((a: any) => {
        if (a?.gradoId !== undefined && a?.gradoId !== null && a?.gradoId !== '') {
          grades.add(Number(a.gradoId));
        }
      });
    }

    // 2. Extraer de localAsignaciones (directo de Firestore / session)
    if (Array.isArray(localAsignaciones)) {
      localAsignaciones.forEach((a: any) => {
        if (a?.gradoId !== undefined && a?.gradoId !== null && a?.gradoId !== '') {
          grades.add(Number(a.gradoId));
        }
      });
    }

    // 3. Extraer de currentUserData.grados
    if (Array.isArray(currentUserData?.grados)) {
      currentUserData.grados.forEach((g: any) => {
        if (g !== undefined && g !== null && g !== '') {
          grades.add(Number(g));
        }
      });
    }

    // 4. Extraer de localGrados (directo de Firestore / session)
    if (Array.isArray(localGrados)) {
      localGrados.forEach((g: any) => {
        if (g !== undefined && g !== null && g !== '') {
          grades.add(Number(g));
        }
      });
    }

    // 5. Extraer de campo individual 'grado' si existiera
    if ((currentUserData as any)?.grado !== undefined && (currentUserData as any)?.grado !== null && (currentUserData as any)?.grado !== '') {
      grades.add(Number((currentUserData as any).grado));
    }

    return Array.from(grades);
  }, [currentUserData?.asignaciones, localAsignaciones, currentUserData?.grados, localGrados, (currentUserData as any)?.grado]);

  const teacherNiveles = useMemo(() => {
    const niveles = new Set<number>();

    if (Array.isArray(currentUserData?.nivelDeInstitucion) && currentUserData.nivelDeInstitucion.length > 0) {
      currentUserData.nivelDeInstitucion.forEach((n: any) => {
        if (n !== undefined && n !== null && n !== '') {
          niveles.add(Number(n));
        }
      });
    }

    if (Array.isArray((currentUserData as any)?.nivelesInstitucion) && (currentUserData as any).nivelesInstitucion.length > 0) {
      (currentUserData as any).nivelesInstitucion.forEach((n: any) => {
        if (n !== undefined && n !== null && n !== '') {
          niveles.add(Number(n));
        }
      });
    }

    if (currentUserData?.nivel !== undefined && currentUserData?.nivel !== null) {
      niveles.add(Number(currentUserData.nivel));
    }

    // Inferir niveles a partir de los grados asignados si no hay niveles explícitos
    teacherGrados.forEach((g) => {
      niveles.add(getNivelFromGrado(g));
    });

    return Array.from(niveles);
  }, [currentUserData?.nivelDeInstitucion, (currentUserData as any)?.nivelesInstitucion, currentUserData?.nivel, teacherGrados]);

  // Evaluaciones de tipo estudiante (tipoDeEvaluacion === "1" o sin especificar con rol 4)
  const studentEvaluaciones = useMemo(() => {
    return (evaluaciones || []).filter(
      (eva) => !eva.tipoDeEvaluacion || eva.tipoDeEvaluacion === '1'
    );
  }, [evaluaciones]);

  // Filtrado según ámbito (mis grados asignados vs todas)
  const scopeEvaluaciones = useMemo(() => {
    if (scopeFilter === 'mis-grados') {
      if (teacherGrados.length > 0) {
        return studentEvaluaciones.filter((eva) =>
          teacherGrados.includes(Number(eva.grado))
        );
      }
      if (teacherNiveles.length > 0) {
        return studentEvaluaciones.filter((eva) =>
          teacherNiveles.includes(getNivelFromGrado(eva.grado ?? 1))
        );
      }
    }
    return studentEvaluaciones;
  }, [studentEvaluaciones, scopeFilter, teacherGrados, teacherNiveles]);

  // Obtener años disponibles a partir de las evaluaciones registradas
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    // Siempre asegurar que el año actual esté disponible
    yearsSet.add(String(currentYear));

    scopeEvaluaciones.forEach((eva) => {
      if (
        eva.añoDelExamen !== undefined &&
        eva.añoDelExamen !== null &&
        String(eva.añoDelExamen).trim() !== ''
      ) {
        yearsSet.add(String(eva.añoDelExamen));
      }
    });

    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [scopeEvaluaciones]);

  // Opciones para el dropdown custom de Año
  const yearOptions: FilterOption[] = useMemo(() => {
    const opts: FilterOption[] = availableYears.map((yr) => {
      const count = scopeEvaluaciones.filter(
        (eva) => String(eva.añoDelExamen || currentYear) === yr
      ).length;

      return {
        value: yr,
        label: yr === String(currentYear) ? `${yr} (Actual)` : yr,
        badge: `${count}`,
        badgeType: 'neutral',
      };
    });

    opts.push({
      value: 'all',
      label: 'Todos los años',
      badge: `${scopeEvaluaciones.length}`,
      badgeType: 'neutral',
    });

    return opts;
  }, [availableYears, scopeEvaluaciones]);

  // Evaluaciones que corresponden al año seleccionado
  const evaluacionesDelAño = useMemo(() => {
    if (selectedYear === 'all') return scopeEvaluaciones;
    return scopeEvaluaciones.filter(
      (eva) => String(eva.añoDelExamen || currentYear) === selectedYear
    );
  }, [scopeEvaluaciones, selectedYear]);

  // Meses disponibles con evaluaciones en el año seleccionado (solo meses con evaluaciones)
  const availableMonths = useMemo(() => {
    const monthsMap = new Map<number, number>();

    evaluacionesDelAño.forEach((eva) => {
      if (
        eva.mesDelExamen !== undefined &&
        eva.mesDelExamen !== null &&
        String(eva.mesDelExamen).trim() !== ''
      ) {
        const monthNum = Number(eva.mesDelExamen);
        if (!isNaN(monthNum) && monthNum >= 0 && monthNum <= 11) {
          monthsMap.set(monthNum, (monthsMap.get(monthNum) || 0) + 1);
        }
      }
    });

    return Array.from(monthsMap.keys())
      .sort((a, b) => a - b)
      .map((monthNum) => ({
        id: String(monthNum),
        name: getMonthName(monthNum),
        count: monthsMap.get(monthNum) || 0,
      }));
  }, [evaluacionesDelAño]);

  // Opciones para el dropdown custom de Mes (meses según las evaluaciones)
  const monthOptions: FilterOption[] = useMemo(() => {
    const opts: FilterOption[] = [
      {
        value: 'all',
        label: 'Todos los meses',
        badge: `${evaluacionesDelAño.length}`,
        badgeType: 'neutral',
      },
    ];

    availableMonths.forEach((m) => {
      opts.push({
        value: m.id,
        label: m.name,
        badge: `${m.count}`,
        badgeType: 'neutral',
      });
    });

    return opts;
  }, [availableMonths, evaluacionesDelAño.length]);

  // Si cambia el año y el mes seleccionado ya no existe en el nuevo año, restablecer a 'all'
  useEffect(() => {
    if (selectedMonth !== 'all') {
      const exists = availableMonths.some((m) => m.id === selectedMonth);
      if (!exists) {
        setSelectedMonth('all');
      }
    }
  }, [availableMonths, selectedMonth]);

  // Evaluaciones filtradas por periodo (año y mes)
  const evaluacionesPeriodo = useMemo(() => {
    return evaluacionesDelAño.filter((eva) => {
      if (selectedMonth !== 'all') {
        if (
          eva.mesDelExamen === undefined ||
          eva.mesDelExamen === null ||
          String(eva.mesDelExamen).trim() === '' ||
          Number(eva.mesDelExamen) !== Number(selectedMonth)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [evaluacionesDelAño, selectedMonth]);

  // Lista de grados disponibles en el ámbito y periodo actual
  const availableGrades = useMemo(() => {
    const gradeSet = new Set<number>();
    evaluacionesPeriodo.forEach((eva) => {
      if (eva.grado !== undefined && eva.grado !== null) {
        gradeSet.add(Number(eva.grado));
      }
    });
    return Array.from(gradeSet).sort((a, b) => a - b);
  }, [evaluacionesPeriodo]);

  // Si cambia el periodo y el grado seleccionado ya no existe, restablecer a 'all'
  useEffect(() => {
    if (gradeFilter !== 'all' && availableGrades.length > 0) {
      if (!availableGrades.includes(gradeFilter)) {
        setGradeFilter('all');
      }
    }
  }, [availableGrades, gradeFilter]);

  // Conteo de estados para el periodo actual
  const totalActivas = useMemo(() => {
    return evaluacionesPeriodo.filter((eva) => eva.active !== false).length;
  }, [evaluacionesPeriodo]);

  const totalInactivas = useMemo(() => {
    return evaluacionesPeriodo.filter((eva) => eva.active === false).length;
  }, [evaluacionesPeriodo]);

  // Filtrado final por búsqueda, estado y grado
  const filteredEvaluaciones = useMemo(() => {
    return evaluacionesPeriodo.filter((eva) => {
      // Estado
      if (statusFilter === 'activas' && eva.active === false) return false;
      if (statusFilter === 'inactivas' && eva.active !== false) return false;

      // Grado
      if (gradeFilter !== 'all' && Number(eva.grado) !== gradeFilter) return false;

      // Búsqueda
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const nombre = (eva.nombre || '').toLowerCase();
        const grado = getGradoTexto(eva.grado).toLowerCase();
        const area = categoriaTransform(eva.categoria).toLowerCase();
        const año = String(eva.añoDelExamen || '').toLowerCase();
        const mes =
          eva.mesDelExamen !== undefined && eva.mesDelExamen !== null
            ? (getMonthName(Number(eva.mesDelExamen)) || '').toLowerCase()
            : '';

        const matches =
          nombre.includes(query) ||
          grado.includes(query) ||
          area.includes(query) ||
          año.includes(query) ||
          mes.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [evaluacionesPeriodo, statusFilter, gradeFilter, searchQuery]);

  // Ordenar: activas primero, luego grado ascendente, luego nombre
  const sortedEvaluaciones = useMemo(() => {
    return [...filteredEvaluaciones].sort((a, b) => {
      const aActive = a.active !== false;
      const bActive = b.active !== false;
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;

      const aGrado = Number(a.grado || 0);
      const bGrado = Number(b.grado || 0);
      if (aGrado !== bGrado) return aGrado - bGrado;

      return (a.nombre || '').localeCompare(b.nombre || '');
    });
  }, [filteredEvaluaciones]);

  if (loaderPages) {
    return (
      <div className={styles.container}>
        <div className={styles.loaderContainer}>
          <RiLoader4Line className={styles.spinner} />
          <span className={styles.loaderText}>Cargando evaluaciones...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Selector de navegación: Acceso Rápido vs Explorar por Niveles */}
      <div className={styles.tabsWrapper}>
        <div className={styles.tabsContainer} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'niveles'}
            onClick={() => setActiveTab('niveles')}
            className={`${styles.tabButton} ${activeTab === 'niveles' ? styles.tabButtonActive : ''}`}
          >
            <RiBookOpenLine className={styles.tabIcon} />
            <span>Explorar por Niveles Educativos</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'rapido'}
            onClick={() => setActiveTab('rapido')}
            className={`${styles.tabButton} ${activeTab === 'rapido' ? styles.tabButtonActive : ''}`}
          >
            <RiFlashlightLine className={styles.tabIcon} />
            <span>Acceso Rápido: Mis Evaluaciones</span>
            <span className={styles.tabBadge}>{scopeEvaluaciones.length}</span>
          </button>
        </div>
      </div>

      {activeTab === 'rapido' ? (
        <section className={styles.quickAccessSection}>
          {/* Barra de Búsqueda y Filtros Compacta y Organizada */}
          <div className={styles.qaToolbar}>
            {/* Fila 1: Búsqueda + Filtros de Ámbito/Grado + Alternador de Vista */}
            <div className={styles.qaTopRow}>
              <div className={styles.qaSearchInputContainer}>
                <RiSearchLine className={styles.qaSearchIcon} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar evaluación por nombre, grado, área curricular o año..."
                  className={styles.qaSearchInput}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className={styles.qaSearchClear}
                    title="Limpiar búsqueda"
                  >
                    <RiCloseLine />
                  </button>
                )}
              </div>

              <div className={styles.qaTopActions}>
                {availableGrades.length > 1 && (
                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className={styles.qaScopeSelect}
                    aria-label="Filtrar por grado"
                  >
                    <option value="all">Todos mis grados</option>
                    {availableGrades.map((g) => (
                      <option key={g} value={g}>
                        {getGradoTexto(g)}
                      </option>
                    ))}
                  </select>
                )}

                {teacherGrados.length > 0 && (
                  <select
                    value={scopeFilter}
                    onChange={(e) => {
                      setScopeFilter(e.target.value as 'mis-grados' | 'todas');
                      setGradeFilter('all');
                    }}
                    className={styles.qaScopeSelect}
                    aria-label="Ámbito de visualización"
                  >
                    <option value="mis-grados">
                      Mis Grados ({teacherGrados.map((g) => getGradoTexto(g)).join(', ')})
                    </option>
                    <option value="todas">Ver Todas</option>
                  </select>
                )}

                {/* Alternador de vista: Tabla (compacta) vs Tarjetas */}
                <div className={styles.viewToggleGroup} role="group" aria-label="Cambiar vista">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.viewToggleBtnActive : ''}`}
                    title="Vista Tabla Compacta"
                  >
                    <RiTableLine />
                    <span>Tabla</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={`${styles.viewToggleBtn} ${viewMode === 'cards' ? styles.viewToggleBtnActive : ''}`}
                    title="Vista Tarjetas"
                  >
                    <RiGridLine />
                    <span>Tarjetas</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Fila 2: Filtros de Periodo (Año y Mes) + Estados */}
            <div className={styles.qaBottomRow}>
              <div className={styles.qaPeriodGroup}>
                <CustomFilterDropdown
                  label="Año:"
                  icon={<RiCalendarLine />}
                  value={selectedYear}
                  options={yearOptions}
                  onChange={(val) => setSelectedYear(val)}
                  minWidth={115}
                />

                <CustomFilterDropdown
                  label="Mes:"
                  icon={<RiTimeLine />}
                  value={selectedMonth}
                  options={monthOptions}
                  onChange={(val) => setSelectedMonth(val)}
                  minWidth={150}
                />

                {(selectedYear !== String(currentYear) || selectedMonth !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedYear(String(currentYear));
                      setSelectedMonth('all');
                    }}
                    className={styles.qaResetPeriodBtn}
                    title="Restablecer filtros al año actual"
                  >
                    <RiRefreshLine />
                    <span>Restablecer</span>
                  </button>
                )}
              </div>

              {/* Filtros de estado */}
              <div className={styles.qaPillsGroup}>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`${styles.qaFilterPill} ${statusFilter === 'all' ? styles.qaFilterPillActive : ''}`}
                  title="Todas las evaluaciones"
                >
                  Todas <span className={styles.qaFilterPillBadge}>{evaluacionesPeriodo.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('activas')}
                  className={`${styles.qaFilterPill} ${statusFilter === 'activas' ? styles.qaFilterPillActive : ''}`}
                  title="Activas para Evaluar"
                >
                  🟢 Activas <span className={styles.qaFilterPillBadge}>{totalActivas}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('inactivas')}
                  className={`${styles.qaFilterPill} ${statusFilter === 'inactivas' ? styles.qaFilterPillActive : ''}`}
                  title="Finalizadas (Solo Lectura)"
                >
                  🔒 Finalizadas <span className={styles.qaFilterPillBadge}>{totalInactivas}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Listado de Evaluaciones: Tabla compacta o Grid de Tarjetas */}
          {sortedEvaluaciones.length > 0 ? (
            viewMode === 'table' ? (
              <div className={styles.qaTableContainer}>
                <table className={styles.qaTable}>
                  <thead className={styles.qaTableHead}>
                    <tr>
                      <th className={styles.qaTableHeadCell} style={{ width: '130px' }}>Estado</th>
                      <th className={styles.qaTableHeadCell} style={{ width: '150px' }}>Grado / Nivel</th>
                      <th className={styles.qaTableHeadCell}>Evaluación</th>
                      <th className={styles.qaTableHeadCell} style={{ width: '190px' }}>Área Curricular</th>
                      <th className={styles.qaTableHeadCell} style={{ width: '140px' }}>Periodo</th>
                      <th className={styles.qaTableHeadCell} style={{ textAlign: 'right', width: '240px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEvaluaciones.map((eva) => {
                      const basePath = getBasePathForEvaluacion(eva);
                      const nivelBadge = getNivelBadgeInfo(eva);
                      const isActive = eva.active !== false;
                      const gradoNombre = getGradoTexto(eva.grado);
                      const areaNombre = categoriaTransform(eva.categoria);
                      const preguntasCount = Array.isArray(eva.preguntasRespuestas) ? eva.preguntasRespuestas.length : 0;
                      const mesNombre =
                        eva.mesDelExamen !== undefined && eva.mesDelExamen !== null && eva.mesDelExamen !== ''
                          ? getMonthName(Number(eva.mesDelExamen))
                          : null;

                      return (
                        <tr
                          key={eva.id}
                          className={`${styles.qaTableRow} ${!isActive ? styles.qaTableRowInactive : ''}`}
                        >
                          {/* Estado */}
                          <td className={styles.qaTableCell}>
                            {isActive ? (
                              <span className={styles.qaStatusActive}>
                                <span className={styles.qaDotActive} />
                                Activa
                              </span>
                            ) : (
                              <span className={styles.qaStatusInactive}>
                                <RiLockLine />
                                Finalizada
                              </span>
                            )}
                          </td>

                          {/* Grado / Nivel */}
                          <td className={styles.qaTableCell}>
                            <div className={styles.qaTableCellGrade}>
                              <span className={styles.qaTableGradeText}>{gradoNombre}</span>
                              <span className={`${styles.qaLevelTag} ${nivelBadge.className}`}>
                                {nivelBadge.label}
                              </span>
                            </div>
                          </td>

                          {/* Evaluación */}
                          <td className={styles.qaTableCell}>
                            <div className={styles.qaTableCellTitle}>
                              <Link
                                href={`${basePath}?idExamen=${eva.id}&grado=${eva.grado}&categoria=${eva.categoria}`}
                                className={styles.qaTableTitleLink}
                              >
                                {eva.nombre || 'Evaluación'}
                              </Link>
                              {preguntasCount > 0 && (
                                <span className={styles.qaTableSubText}>
                                  <RiQuestionLine /> {preguntasCount} preguntas
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Área Curricular */}
                          <td className={styles.qaTableCell}>
                            <span className={styles.qaTableAreaBadge} title={areaNombre}>
                              {areaNombre}
                            </span>
                          </td>

                          {/* Periodo */}
                          <td className={styles.qaTableCell}>
                            <span className={styles.qaTablePeriodText}>
                              {eva.añoDelExamen || '-'} {mesNombre ? `(${mesNombre})` : ''}
                            </span>
                          </td>

                          {/* Acciones */}
                          <td className={styles.qaTableCell}>
                            <div className={styles.qaTableActions}>
                              {isActive ? (
                                <>
                                  <Link
                                    href={`${basePath}/evaluar-estudiante?idExamen=${eva.id}&grado=${eva.grado}&categoria=${eva.categoria}`}
                                    className={styles.qaTableBtnEvaluar}
                                    title="Evaluar estudiantes"
                                  >
                                    <RiEditBoxLine />
                                    <span>Evaluar</span>
                                  </Link>

                                  <Link
                                    href={`${basePath}/reporte?idExamen=${eva.id}&grado=${eva.grado}&categoria=${eva.categoria}`}
                                    className={styles.qaTableBtnReporte}
                                    title="Ver reporte"
                                  >
                                    <RiFileChartLine />
                                    <span>Reporte</span>
                                  </Link>
                                </>
                              ) : (
                                <>
                                  <Link
                                    href={`${basePath}/reporte?idExamen=${eva.id}&grado=${eva.grado}&categoria=${eva.categoria}`}
                                    className={styles.qaTableBtnReporteFull}
                                    title="Ver resultados y estadísticas"
                                  >
                                    <RiFileChartLine />
                                    <span>Resultados</span>
                                  </Link>

                                  <span
                                    className={styles.qaTableBadgeClosed}
                                    title="Evaluación finalizada. Modo solo lectura."
                                  >
                                    <RiLockLine />
                                    <span>Cerrada</span>
                                  </span>
                                </>
                              )}

                              <Link
                                href={`${basePath}?idExamen=${eva.id}&grado=${eva.grado}&categoria=${eva.categoria}`}
                                className={styles.qaTableBtnDetalle}
                                title="Ver detalles de la prueba"
                              >
                                <RiArrowRightLine />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className={styles.qaTableFooter}>
                  <span>Mostrando <strong>{sortedEvaluaciones.length}</strong> evaluaciones</span>
                  <span>💡 Clic en <strong>Evaluar</strong> para calificar o en <strong>Reporte</strong> para consultar resultados</span>
                </div>
              </div>
            ) : (
              <div className={styles.qaCardsGrid}>
              {sortedEvaluaciones.map((eva) => {
                const basePath = getBasePathForEvaluacion(eva);
                const nivelBadge = getNivelBadgeInfo(eva);
                const isActive = eva.active !== false;
                const gradoNombre = getGradoTexto(eva.grado);
                const areaNombre = categoriaTransform(eva.categoria);
                const preguntasCount = Array.isArray(eva.preguntasRespuestas) ? eva.preguntasRespuestas.length : 0;
                const mesNombre =
                  eva.mesDelExamen !== undefined && eva.mesDelExamen !== null && eva.mesDelExamen !== ''
                    ? getMonthName(Number(eva.mesDelExamen))
                    : null;

                return (
                  <article
                    key={eva.id}
                    className={`${styles.qaCard} ${!isActive ? styles.qaCardInactive : ''}`}
                  >
                    <div>
                      {/* Cabecera de la tarjeta */}
                      <div className={styles.qaCardHeader}>
                        <div className={styles.qaBadgesRow}>
                          <span className={`${styles.qaLevelTag} ${nivelBadge.className}`}>
                            {nivelBadge.label}
                          </span>
                          <span className={styles.qaGradeTag}>{gradoNombre}</span>
                        </div>

                        {isActive ? (
                          <span className={styles.qaStatusActive}>
                            <span className={styles.qaDotActive} />
                            Activa
                          </span>
                        ) : (
                          <span className={styles.qaStatusInactive}>
                            <RiLockLine />
                            Finalizada
                          </span>
                        )}
                      </div>

                      {/* Título de la evaluación */}
                      <h3 className={styles.qaCardTitle}>
                        {eva.nombre || 'Evaluación'}
                      </h3>

                      {/* Meta información */}
                      <div className={styles.qaCardMeta}>
                        <span className={styles.qaAreaTag}>{areaNombre}</span>

                        {preguntasCount > 0 && (
                          <span className={styles.qaMetaItem}>
                            <RiQuestionLine /> {preguntasCount} preg.
                          </span>
                        )}

                        {eva.añoDelExamen && (
                          <span className={styles.qaMetaItem}>
                            <RiCalendarLine /> {eva.añoDelExamen} {mesNombre ? `(${mesNombre})` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Acciones Directas */}
                    <div className={styles.qaCardActions}>
                      {isActive ? (
                        <>
                          <Link
                            href={`${basePath}/evaluar-estudiante?idExamen=${eva.id}&grado=${eva.grado}&categoria=${eva.categoria}`}
                            className={styles.qaBtnEvaluar}
                          >
                            <RiEditBoxLine />
                            <span>Evaluar Estudiantes</span>
                          </Link>

                          <Link
                            href={`${basePath}/reporte?idExamen=${eva.id}&grado=${eva.grado}&categoria=${eva.categoria}`}
                            className={styles.qaBtnReporte}
                          >
                            <RiFileChartLine />
                            <span>Reporte</span>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href={`${basePath}/reporte?idExamen=${eva.id}&grado=${eva.grado}&categoria=${eva.categoria}`}
                            className={styles.qaBtnReporteFull}
                          >
                            <RiFileChartLine />
                            <span>Ver Reporte y Resultados</span>
                          </Link>

                          <span
                            className={styles.qaBtnClosedNotice}
                            title="Esta evaluación ha finalizado. No se permiten nuevas modificaciones."
                          >
                            <RiLockLine />
                            <span>Cerrada</span>
                          </span>
                        </>
                      )}

                      <Link
                        href={`${basePath}?idExamen=${eva.id}&grado=${eva.grado}&categoria=${eva.categoria}`}
                        className={styles.qaBtnDetalle}
                        title="Ver detalles generales de la prueba"
                      >
                        Ver Detalle <RiArrowRightLine style={{ marginLeft: 3 }} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )
        ) : (
            <div className={styles.qaEmptyState}>
              <RiSearchLine className={styles.qaEmptyIcon} />
              <h3 className={styles.qaEmptyTitle}>No se encontraron evaluaciones</h3>
              <p className={styles.qaEmptyText}>
                {searchQuery || statusFilter !== 'all' || gradeFilter !== 'all' || selectedYear !== String(currentYear) || selectedMonth !== 'all'
                  ? 'No hay evaluaciones que coincidan con los filtros seleccionados. Intenta restablecer los filtros para ver más resultados.'
                  : scopeFilter === 'mis-grados'
                  ? 'No tienes evaluaciones registradas para tus grados asignados actualmente.'
                  : 'No hay evaluaciones registradas en el portal.'}
              </p>
              {(searchQuery || statusFilter !== 'all' || gradeFilter !== 'all' || selectedYear !== String(currentYear) || selectedMonth !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setGradeFilter('all');
                    setSelectedYear(String(currentYear));
                    setSelectedMonth('all');
                  }}
                  className={styles.qaEmptyResetBtn}
                >
                  Restablecer filtros
                </button>
              )}
              {scopeFilter === 'mis-grados' && sortedEvaluaciones.length === 0 && (
                <button
                  type="button"
                  onClick={() => setScopeFilter('todas')}
                  className={styles.qaEmptyResetBtn}
                >
                  Ver todas las evaluaciones del sistema
                </button>
              )}
            </div>
          )}
        </section>
      ) : (
        /* Navegación Tradicional por Niveles Educativos */
        <div className={styles.gridContainer}>
          {educationLevels
            .filter((level) => {
              // Si currentUserData tiene nivelDeInstitucion, filtrar por esos niveles
              if (Array.isArray(currentUserData?.nivelDeInstitucion) && currentUserData.nivelDeInstitucion.length > 0) {
                return currentUserData.nivelDeInstitucion.map(Number).includes(level.nivel);
              }
              // Fallback: nivel individual
              if (currentUserData?.nivel !== undefined && currentUserData?.nivel !== null) {
                return level.nivel === Number(currentUserData.nivel);
              }
              // Fallback: inferir niveles a partir de los grados asignados al docente
              if (teacherNiveles.length > 0) {
                return teacherNiveles.includes(level.nivel);
              }
              return true;
            })
            .map((level) => {
              const IconComponent = level.icon;
              return (
                <div key={level.id} className={`${styles.educationLevel} ${styles[level.id]}`}>
                  <div className={styles.levelHeader}>
                    <div className={styles.levelInfo}>
                      <div className={styles.levelIcon}>
                        <IconComponent />
                      </div>
                      <div>
                        <h2 className={styles.levelTitle}>{level.title}</h2>
                        <p className={styles.levelDescription}>{level.description}</p>
                      </div>
                    </div>
                    <div className={styles.levelImage}>
                      <Image
                        alt={`${level.title} illustration`}
                        src={level.image}
                        width={120}
                        height={80}
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                  </div>

                  <div className={styles.levelsGrid}>
                    {level.levels.map((subLevel) => (
                      <Link
                        key={subLevel.number}
                        href={level.href}
                        className={styles.levelCard}
                      >
                        <div className={styles.levelNumber}>
                          {subLevel.number}
                        </div>

                        <div className={styles.cardContent}>
                          <h3 className={styles.cardTitle}>
                            {subLevel.title}
                          </h3>
                          <p className={styles.cardDescription}>
                            {subLevel.description}
                          </p>

                          <div className={styles.cardFooter}>
                            <div className={styles.cardStatus}>
                              <div className={styles.statusDot}></div>
                              <span>Disponible</span>
                            </div>
                            <div className={styles.cardArrow}>
                              <RiArrowRightLine />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default Evaluaciones;
Evaluaciones.Auth = PrivateRouteDocentes;