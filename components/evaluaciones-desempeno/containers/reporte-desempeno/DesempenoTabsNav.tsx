import React, { useRef } from 'react';
import styles from '@/components/reportes/director/DirectorTabsNav.module.css';
import DirectorLayoutModeSwitch, {
  DirectorLayoutMode,
} from '@/components/reportes/director/DirectorLayoutModeSwitch';

export type { DirectorLayoutMode };

export interface DesempenoTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  isAlertBadge?: boolean;
}

export interface DesempenoTabsNavProps {
  activeTab: string;
  onChangeTab: (tabId: string) => void;
  tabs: DesempenoTabItem[];
  layoutMode?: DirectorLayoutMode;
  onChangeLayoutMode?: (mode: DirectorLayoutMode) => void;
  showLayoutSwitch?: boolean;
  extraRightContent?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export const DesempenoTabsNav: React.FC<DesempenoTabsNavProps> = ({
  activeTab,
  onChangeTab,
  tabs,
  layoutMode,
  onChangeLayoutMode,
  showLayoutSwitch = true,
  extraRightContent,
  className = '',
  ariaLabel = 'Pestañas de navegación del reporte de desempeño',
}) => {
  const tabsListRef = useRef<HTMLDivElement>(null);

  // Navegación por teclado accesible (W3C Tabs Pattern)
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (tabs.length === 0) return;

    let targetIndex = -1;
    if (e.key === 'ArrowRight') {
      targetIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      targetIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      targetIndex = 0;
    } else if (e.key === 'End') {
      targetIndex = tabs.length - 1;
    }

    if (targetIndex >= 0) {
      e.preventDefault();
      const targetTab = tabs[targetIndex];
      onChangeTab(targetTab.id);

      // Enfocar el botón de pestaña seleccionado
      const buttons = tabsListRef.current?.querySelectorAll<HTMLButtonElement>('button[role="tab"]');
      if (buttons && buttons[targetIndex]) {
        buttons[targetIndex].focus();
      }
    }
  };

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-4 border-b-2 border-blue-600 px-1 sm:px-2 pt-2 transition-all ${className}`}
    >
      {/* Lista de pestañas horizontales */}
      <div
        ref={tabsListRef}
        className={`${styles.tabsBar} border-b-0 p-0 mb-0 flex-1 min-w-0`}
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`section-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
              onClick={() => onChangeTab(tab.id)}
            >
              {tab.icon}
              <span className={styles.tabLabel}>{tab.label}</span>
              {tab.badge !== undefined && tab.badge !== '' && (
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

      {/* Controles del lado derecho (Selector de Modo Pestañas/Cascada o Contenido adicional) */}
      {(extraRightContent || (showLayoutSwitch && layoutMode && onChangeLayoutMode)) && (
        <div className="flex items-center gap-2 pb-1.5 sm:pb-2 shrink-0 self-end sm:self-auto">
          {extraRightContent}
          {showLayoutSwitch && layoutMode && onChangeLayoutMode && (
            <DirectorLayoutModeSwitch
              mode={layoutMode}
              onChange={onChangeLayoutMode}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DesempenoTabsNav;
