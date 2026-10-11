import React from 'react';
import {
  MdBarChart,
  MdBubbleChart,
  MdTrendingUp,
  MdAssignment,
} from 'react-icons/md';
import { RiBuilding4Line, RiGraduationCapLine } from 'react-icons/ri';
import styles from '@/components/reportes/director/DirectorTabsNav.module.css';

export type AdminTabKey =
  | 'general'
  | 'directores'
  | 'docentes'
  | 'brechas'
  | 'tendencia'
  | 'preguntas';

export interface AdminTabsNavProps {
  activeTab: AdminTabKey;
  onChangeTab: (tab: AdminTabKey) => void;
  totalEstudiantes?: number;
  directoresStats?: { participo: number; no_participo: number; total: number };
  totalDocentes?: number;
  totalPreguntas?: number;
  hideBrechas?: boolean;
  hiddenTabs?: AdminTabKey[];
}

interface TabItemConfig {
  id: AdminTabKey;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  isAlertBadge?: boolean;
}

export const AdminTabsNav: React.FC<AdminTabsNavProps> = ({
  activeTab,
  onChangeTab,
  totalEstudiantes,
  directoresStats,
  totalDocentes,
  totalPreguntas,
  hideBrechas = false,
  hiddenTabs = [],
}) => {
  const tabs: TabItemConfig[] = [
    {
      id: 'general',
      label: 'Panel General',
      icon: <MdBarChart className={`${styles.tabIcon} text-blue-600`} />,
      badge:
        totalEstudiantes !== undefined && totalEstudiantes > 0
          ? `${totalEstudiantes.toLocaleString('es-PE')} est.`
          : undefined,
    },
    {
      id: 'directores',
      label: 'Directores',
      icon: <RiBuilding4Line className={`${styles.tabIcon} text-purple-600`} />,
      badge:
        directoresStats && directoresStats.total > 0
          ? `${directoresStats.participo}/${directoresStats.total}`
          : undefined,
    },
    {
      id: 'docentes',
      label: 'Docentes',
      icon: <RiGraduationCapLine className={`${styles.tabIcon} text-emerald-600`} />,
      badge:
        totalDocentes !== undefined && totalDocentes > 0
          ? `${totalDocentes} doc.`
          : undefined,
    },
    {
      id: 'brechas',
      label: 'Brechas de Aprendizaje',
      icon: <MdBubbleChart className={`${styles.tabIcon} text-amber-600`} />,
      badge: 'UGEL',
    },
    {
      id: 'tendencia',
      label: 'Tendencias Históricas',
      icon: <MdTrendingUp className={`${styles.tabIcon} text-indigo-600`} />,
      badge: 'Histórico',
    },
    {
      id: 'preguntas',
      label: 'Análisis por Pregunta',
      icon: <MdAssignment className={`${styles.tabIcon} text-cyan-600`} />,
      badge:
        totalPreguntas !== undefined && totalPreguntas > 0
          ? `${totalPreguntas} ítems`
          : undefined,
    },
  ];

  const visibleTabs = tabs.filter((t) => {
    if (t.id === 'brechas' && hideBrechas) return false;
    if (hiddenTabs.includes(t.id)) return false;
    return true;
  });

  return (
    <div
      className={styles.tabsBar}
      role="tablist"
      aria-label="Pestañas de navegación del reporte de evaluación del especialista"
    >
      {visibleTabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`section-${tab.id}`}
            id={`tab-${tab.id}`}
            className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
            onClick={() => onChangeTab(tab.id)}
          >
            {tab.icon}
            <span className={styles.tabLabel}>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`${styles.tabBadge} ${
                  tab.isAlertBadge ? styles.tabBadgeAlert : ''
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default AdminTabsNav;
