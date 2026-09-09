import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  MdTableChart,
  MdRefresh,
  MdAssignment,
  MdDateRange,
  MdSchool,
  MdChevronRight,
  MdSettings,
  MdBarChart,
  MdExpandMore,
  MdCheck,
  MdCategory,
} from 'react-icons/md';
import { RiLoader4Line } from 'react-icons/ri';
import PrivateRouteAdmin from '@/components/layouts/PrivateRoutesAdmin';
import TablaMatrizComparativa from '@/components/reportes/TablaMatrizComparativa';
import PanelVisualizacionesMatriz from '@/components/reportes/PanelVisualizacionesMatriz';
import ConfigurarMatrizModal from '@/components/modals/ConfigurarMatrizModal';
import { useMatrizResultados } from '@/features/hooks/useMatrizResultados';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { getCategoriasParaGrado, categoriaTransform } from '@/fuctions/categorias';
import { gradosDeColegio, getGradoTexto } from '@/fuctions/regiones';
import styles from './matrizResultados.module.css';

// Años dinámicos: inicia siempre en 2026 y añade años subsiguientes según el año actual
const START_YEAR = 2026;
const currentSystemYear = new Date().getFullYear();
const maxYear = Math.max(START_YEAR, currentSystemYear);
const YEARS = Array.from(
  { length: maxYear - START_YEAR + 1 },
  (_, i) => START_YEAR + i
);

interface CustomSelectOption {
  value: number | string;
  label: string;
  hasConfigBadge?: boolean;
}

interface CustomSelectProps {
  id?: string;
  label: string;
  icon?: React.ReactNode;
  value: number | string;
  options: CustomSelectOption[];
  onChange: (value: any) => void;
  disabled?: boolean;
  className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  label,
  icon,
  value,
  options,
  onChange,
  disabled = false,
  className = styles.filterGroup,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  return (
    <div
      ref={containerRef}
      className={`${className} ${styles.customDropdownContainer} ${isOpen ? styles.customDropdownContainerOpen : ''}`}
    >
      <label id={id ? `${id}-label` : undefined} className={styles.filterLabel}>
        {label}
      </label>
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`${styles.customDropdownTrigger} ${isOpen ? styles.customDropdownTriggerOpen : ''}`}
      >
        <div className={styles.customDropdownLeft}>
          {icon && <span className={styles.customDropdownIcon}>{icon}</span>}
          <span className={styles.customDropdownText}>
            {selectedOption ? selectedOption.label : 'Seleccionar...'}
          </span>
          {selectedOption?.hasConfigBadge && (
            <span className={styles.badgeConfigurado}>✓ Configurado</span>
          )}
        </div>
        <MdExpandMore
          className={`${styles.customDropdownChevron} ${isOpen ? styles.customDropdownChevronOpen : ''}`}
        />
      </button>

      {isOpen && (
        <div className={styles.customDropdownMenu} role="listbox">
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`${styles.customDropdownOption} ${isSelected ? styles.customDropdownOptionActive : ''}`}
              >
                <div className={styles.customDropdownOptionContent}>
                  <span>{opt.label}</span>
                  {opt.hasConfigBadge && (
                    <span className={styles.badgeConfigurado}>✓ Configurado</span>
                  )}
                </div>
                {isSelected && <MdCheck className={styles.checkIconOption} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MatrizResultadosPage = () => {
  const {
    evaluacionesDisponibles,
    loadingEvaluaciones,
    configGrados,
    loadingConfig,
    selectedGrado,
    setSelectedGrado,
    selectedCategoria,
    setSelectedCategoria,
    yearSelected,
    setYearSelected,
    matrizRows,
    loadingMatriz,
    evaluacionEdi,
    evaluacionEp1,
    evaluacionEp2,
    preguntasUnificadas,
    saveGradoConfig,
    reloadMatriz,
  } = useMatrizResultados();

  const { categorias: contextCategorias } = useGlobalContext();
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [mainViewMode, setMainViewMode] = useState<'tabla' | 'graficos'>('tabla');

  const categoriasDisponibles = getCategoriasParaGrado(
    selectedGrado,
    contextCategorias,
    evaluacionesDisponibles
  );

  const nombreGrado = getGradoTexto(selectedGrado);
  const nombreCategoria = categoriaTransform(selectedCategoria, contextCategorias);

  const gradoOptions: CustomSelectOption[] = gradosDeColegio.map((g) => {
    const tieneConfig = Object.keys(configGrados).some(
      (k) => k === String(g.id) || k.startsWith(`${g.id}_`)
    );
    return {
      value: g.id,
      label: g.name.toUpperCase(),
      hasConfigBadge: tieneConfig,
    };
  });

  const categoriaOptions: CustomSelectOption[] = categoriasDisponibles.map((cat) => {
    const key = `${selectedGrado}_${cat.id}`;
    const tieneConfig = !!configGrados[key];
    return {
      value: cat.id,
      label: cat.categoria.toUpperCase(),
      hasConfigBadge: tieneConfig,
    };
  });

  const yearOptions: CustomSelectOption[] = YEARS.map((y) => ({
    value: y,
    label: String(y),
    hasConfigBadge: false,
  }));

  return (
    <>
      <Head>
        <title>Matriz de Resultados Comparativa (EDI, EP1, EP2) - EVA</title>
      </Head>

      <div className={styles.container}>
        {/* Encabezado / Breadcrumb */}
        <header className={styles.header}>
          <nav className={styles.breadcrumb}>
            <Link href="/admin/evaluaciones" className={styles.breadcrumbItem}>
              Estudiantes
            </Link>
            <MdChevronRight className={styles.breadcrumbSeparator} />
            <span className={styles.breadcrumbActive}>Matriz de Resultados</span>
          </nav>

          <div className={styles.headerMain}>
            <div className={styles.titleArea}>
              <div className={styles.titleIconBadge}>
                <MdTableChart />
              </div>
              <div className={styles.titleTextGroup}>
                <h1 className={styles.pageTitle}>
                  Matriz de Resultados por UGEL - {nombreGrado.toUpperCase()} ({nombreCategoria.toUpperCase()})
                </h1>
                <p className={styles.pageSubtitle}>
                  Monitoreo y progreso longitudinal de resultados por ítems pedagógicos a través de EDI ➔ EP1 ➔ EP2
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className={styles.configBtn}
              title="Configurar qué evaluación corresponde a cada etapa para este grado y categoría"
            >
              <MdSettings style={{ fontSize: '1.2rem' }} />
              <span>Configurar Evaluaciones</span>
            </button>
          </div>
        </header>

        {/* Barra de Filtros y Selección */}
        <section className={styles.toolbarCard}>
          <div className={styles.filtersRow}>
            {/* Selector de Grado */}
            <CustomSelect
              id="select-grado"
              label="Grado Escolar:"
              icon={<MdSchool />}
              value={selectedGrado}
              options={gradoOptions}
              onChange={(val) => setSelectedGrado(Number(val))}
              disabled={loadingConfig}
              className={styles.filterGroup}
            />

            {/* Selector de Categoría / Área */}
            <CustomSelect
              id="select-categoria"
              label="Área / Categoría:"
              icon={<MdCategory />}
              value={selectedCategoria}
              options={categoriaOptions}
              onChange={(val) => setSelectedCategoria(Number(val))}
              disabled={loadingConfig}
              className={styles.filterGroup}
            />

            {/* Selector de Año */}
            <CustomSelect
              id="select-year"
              label="Año Escolar:"
              icon={<MdDateRange />}
              value={yearSelected}
              options={yearOptions}
              onChange={(val) => setYearSelected(Number(val))}
              disabled={loadingConfig}
              className={styles.filterGroupFixed}
            />

            {/* Botón Actualizar */}
            <div className={styles.actionsGroup}>
              <button
                type="button"
                onClick={reloadMatriz}
                disabled={loadingMatriz}
                className={styles.refreshBtn}
                title="Recalcular matriz comparativa"
              >
                <MdRefresh style={{ fontSize: '1.2rem' }} />
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          {/* Badges de Información de las 3 Evaluaciones Asignadas */}
          <div className={styles.evalInfoBar}>
            {/* Slot EDI */}
            <div className={`${styles.evalBadge} ${styles.badgeEdi}`}>
              <strong>EDI:</strong>
              <span>
                {evaluacionEdi ? evaluacionEdi.nombre : 'Sin asignar (Configure en botón superior)'}
              </span>
            </div>

            {/* Slot EP1 */}
            <div className={`${styles.evalBadge} ${styles.badgeEp1}`}>
              <strong>EP1:</strong>
              <span>
                {evaluacionEp1 ? evaluacionEp1.nombre : 'Sin asignar (Configure en botón superior)'}
              </span>
            </div>

            {/* Slot EP2 */}
            <div className={`${styles.evalBadge} ${styles.badgeEp2}`}>
              <strong>EP2:</strong>
              <span>
                {evaluacionEp2 ? evaluacionEp2.nombre : 'Sin asignar (Configure en botón superior)'}
              </span>
            </div>

            {preguntasUnificadas.length > 0 && (
              <div className={styles.evalBadge} style={{ marginLeft: 'auto' }}>
                <MdAssignment />
                <span>{preguntasUnificadas.length} Ítems Evaluados</span>
              </div>
            )}
          </div>
        </section>

        {/* Selector de Modo de Visualización: Tabla Comparativa vs Gráficos */}
        <div className={styles.mainViewSwitcher}>
          <button
            type="button"
            className={`${styles.viewSwitcherBtn} ${
              mainViewMode === 'tabla' ? styles.viewSwitcherBtnActive : ''
            }`}
            onClick={() => setMainViewMode('tabla')}
          >
            <MdTableChart />
            <span>Tabla Comparativa</span>
          </button>
          <button
            type="button"
            className={`${styles.viewSwitcherBtn} ${
              mainViewMode === 'graficos' ? styles.viewSwitcherBtnActive : ''
            }`}
            onClick={() => setMainViewMode('graficos')}
          >
            <MdBarChart />
            <span>Gráficos y Visualizaciones</span>
            <span className={styles.pillBadge}>7 vistas</span>
          </button>
        </div>

        {/* Vista: Tabla Comparativa Multi-Evaluación */}
        {mainViewMode === 'tabla' ? (
          <TablaMatrizComparativa
            data={matrizRows}
            loading={loadingMatriz || loadingConfig}
            evaluacionEdi={evaluacionEdi}
            evaluacionEp1={evaluacionEp1}
            evaluacionEp2={evaluacionEp2}
            preguntas={preguntasUnificadas}
            onReload={reloadMatriz}
            gradoName={`${nombreGrado} - ${nombreCategoria.toUpperCase()}`}
          />
        ) : (
          /* Vista: Visualizaciones y Toma de Decisiones (7 pestañas) */
          <PanelVisualizacionesMatriz
            data={matrizRows}
            loading={loadingMatriz || loadingConfig}
            evaluacionEdi={evaluacionEdi}
            evaluacionEp1={evaluacionEp1}
            evaluacionEp2={evaluacionEp2}
            preguntas={preguntasUnificadas}
            gradoName={`${nombreGrado} - ${nombreCategoria.toUpperCase()}`}
            onReload={reloadMatriz}
          />
        )}
      </div>

      {/* Modal de Configuración Persistente por Grado y Categoría */}
      <ConfigurarMatrizModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        evaluaciones={evaluacionesDisponibles}
        configGrados={configGrados}
        onSaveConfig={saveGradoConfig}
        initialGradoId={selectedGrado}
        initialCategoriaId={selectedCategoria}
      />
    </>
  );
};

MatrizResultadosPage.Auth = PrivateRouteAdmin;

export default MatrizResultadosPage;
