import React from 'react';
import {
  MdTableChart,
  MdTrackChanges,
  MdTrendingUp,
  MdAssignment,
} from 'react-icons/md';
import styles from './DirectorTabsNav.module.css';

export type DirectorTabKey =
  | 'grilla'
  | 'brechas'
  | 'tendencia'
  | 'preguntas';

interface TabItem {
  id: DirectorTabKey;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  isAlertBadge?: boolean;
}

interface DirectorTabsNavProps {
  activeTab: DirectorTabKey;
  onChangeTab: (tab: DirectorTabKey) => void;
  totalEstudiantes?: number;
  totalCritico?: number;
  totalPreguntas?: number;
}

export const DirectorTabsNav: React.FC<DirectorTabsNavProps> = ({
  activeTab,
  onChangeTab,
  totalEstudiantes,
  totalCritico = 0,
  totalPreguntas,
}) => {
  const tabs: TabItem[] = [
    {
      id: 'grilla',
      label: 'Estudiantes y Grilla',
      icon: <MdTableChart className={styles.tabIcon} />,
      badge: totalEstudiantes !== undefined ? `${totalEstudiantes}` : undefined,
    },
    {
      id: 'brechas',
      label: 'Brechas de Aprendizaje',
      icon: <MdTrackChanges className={styles.tabIcon} />,
      badge: totalCritico > 0 ? `${totalCritico} críticas` : undefined,
      isAlertBadge: totalCritico > 0,
    },
    {
      id: 'tendencia',
      label: 'Tendencias y Cobertura',
      icon: <MdTrendingUp className={styles.tabIcon} />,
    },
    {
      id: 'preguntas',
      label: 'Análisis por Ítem',
      icon: <MdAssignment className={styles.tabIcon} />,
      badge: totalPreguntas !== undefined ? `${totalPreguntas} ítems` : undefined,
    },
  ];

  return (
    <div className={styles.tabsBar} role="tablist" aria-label="Pestañas de Resultados del Director">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
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

export default DirectorTabsNav;
