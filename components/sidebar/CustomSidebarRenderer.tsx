import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  CustomSidebarItem, 
  CustomItemRole, 
  renderCustomSidebarIcon 
} from '@/features/sidebar/customSidebarConfig';
import { RiExternalLinkLine } from 'react-icons/ri';
import { IoIosArrowDown } from 'react-icons/io';
import styles from './sidebar.module.css';

interface Props {
  role: CustomItemRole;
  parentId?: string; // Si es definido, renderiza submenús para ese padre; si no, renderiza items de nivel superior
  customItems: CustomSidebarItem[];
  isSubmenu?: boolean;
  asMenuItem?: boolean; // Si es true, renderiza como <li className={styles.menuItem}> para usar dentro de <ul className={styles.menuList}>
}

export const CustomSidebarRenderer: React.FC<Props> = ({
  role,
  parentId,
  customItems,
  isSubmenu = false,
  asMenuItem = true,
}) => {
  const router = useRouter();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  const toggleDropdown = (id: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filtrar items que correspondan al rol (o 'all') y al parentId especificado
  const filtered = customItems
    .filter((item) => {
      const roleMatch = item.role === role || item.role === 'all';
      if (!roleMatch) return false;
      if (parentId) {
        return item.parentId === parentId;
      }
      return !item.parentId; // nivel superior
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (filtered.length === 0) return null;

  // Renderizado dentro de submenú desplegable (sin iconos en submenús, idéntico a menús nativos del sistema)
  if (isSubmenu) {
    return (
      <>
        {filtered.map((item) => {
          const isNoRoute = item.targetType === 'none' || !item.route || item.route.trim() === '' || item.route === '#';
          const isInternal = item.targetType === 'internal' && !isNoRoute;
          const isActive = isInternal && router.pathname === item.route;

          if (isNoRoute) {
            return (
              <li key={item.id}>
                <span
                  className={`${styles.submenuLink} opacity-80 cursor-default select-none`}
                  title={`${item.label} (Sin ruta asignada)`}
                >
                  <span className="truncate">{item.label}</span>
                </span>
              </li>
            );
          }

          if (isInternal) {
            return (
              <li key={item.id}>
                <Link
                  href={item.route}
                  className={`${styles.submenuLink} ${isActive ? styles.activeLink : ''}`}
                >
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          }

          return (
            <li key={item.id}>
              <a
                href={item.route}
                target={item.openInNewTab !== false ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className={`${styles.submenuLink} group`}
              >
                <span className="flex items-center justify-between w-full gap-2">
                  <span className="truncate">{item.label}</span>
                  <RiExternalLinkLine className="text-[10px] opacity-60 group-hover:opacity-100 shrink-0 ml-auto" />
                </span>
              </a>
            </li>
          );
        })}
      </>
    );
  }

  // Renderizado como elemento de lista estándar dentro de <ul className={styles.menuList}>
  if (asMenuItem) {
    return (
      <>
        {filtered.map((item) => {
          const children = customItems.filter(
            (c) => (c.role === role || c.role === 'all') && c.parentId === item.id
          );
          const hasChildren = children.length > 0;
          const isNoRoute = item.targetType === 'none' || !item.route || item.route.trim() === '' || item.route === '#';
          const isInternal = item.targetType === 'internal' && !isNoRoute;
          const isActive = isInternal && router.pathname === item.route;

          if (hasChildren) {
            const isOpen = !!openDropdowns[item.id];
            return (
              <li
                key={item.id}
                className={`${styles.menuItem} ${isOpen ? styles.itemOpen : ''}`}
              >
                <div
                  className={styles.menuHeader}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown(item.id);
                  }}
                >
                  {renderCustomSidebarIcon(item.iconName, styles.icon)}
                  <span className={styles.link}>{item.label}</span>
                  <IoIosArrowDown
                    className={`${styles.arrowIcon} ${isOpen ? styles.arrowRotate : ''}`}
                  />
                </div>
                <ul className={`${styles.submenu} ${isOpen ? styles.show : ''}`}>
                  <li className={styles.flyoutHeader}>{item.label}</li>
                  <CustomSidebarRenderer
                    role={role}
                    parentId={item.id}
                    customItems={customItems}
                    isSubmenu={true}
                  />
                </ul>
              </li>
            );
          }

          if (isNoRoute) {
            return (
              <li key={item.id} className={styles.menuItem}>
                <div
                  className={`${styles.menuHeader} opacity-85 cursor-default select-none`}
                  title={`${item.label} (Sin ruta asignada)`}
                >
                  {renderCustomSidebarIcon(item.iconName, styles.icon)}
                  <span className={styles.link}>{item.label}</span>
                </div>
              </li>
            );
          }

          if (isInternal) {
            return (
              <li key={item.id} className={styles.menuItem}>
                <Link
                  href={item.route}
                  className={`${styles.menuHeader} ${isActive ? styles.activeLink : ''}`}
                >
                  {renderCustomSidebarIcon(item.iconName, styles.icon)}
                  <span className={styles.link}>{item.label}</span>
                </Link>
              </li>
            );
          }

          return (
            <li key={item.id} className={styles.menuItem}>
              <a
                href={item.route}
                target={item.openInNewTab !== false ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className={styles.menuHeader}
              >
                {renderCustomSidebarIcon(item.iconName, styles.icon)}
                <span className={styles.link}>{item.label}</span>
                <RiExternalLinkLine className="text-xs opacity-60 ml-auto shrink-0" />
              </a>
            </li>
          );
        })}
      </>
    );
  }

  // Renderizado como dashboardMenuItem / menuItem para vistas planas (Docentes)
  return (
    <>
      {filtered.map((item) => {
        const children = customItems.filter(
          (c) => (c.role === role || c.role === 'all') && c.parentId === item.id
        );
        const hasChildren = children.length > 0;
        const isNoRoute = item.targetType === 'none' || !item.route || item.route.trim() === '' || item.route === '#';
        const isInternal = item.targetType === 'internal' && !isNoRoute;
        const isActive = isInternal && router.pathname === item.route;

        if (hasChildren) {
          const isOpen = !!openDropdowns[item.id];
          return (
            <div
              key={item.id}
              className={`${styles.menuItem} ${isOpen ? styles.itemOpen : ''}`}
            >
              <div
                className={styles.menuHeader}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown(item.id);
                }}
              >
                {renderCustomSidebarIcon(item.iconName, styles.icon)}
                <span className={styles.link}>{item.label}</span>
                <IoIosArrowDown
                  className={`${styles.arrowIcon} ${isOpen ? styles.arrowRotate : ''}`}
                />
              </div>
              <ul className={`${styles.submenu} ${isOpen ? styles.show : ''}`}>
                <li className={styles.flyoutHeader}>{item.label}</li>
                <CustomSidebarRenderer
                  role={role}
                  parentId={item.id}
                  customItems={customItems}
                  isSubmenu={true}
                />
              </ul>
            </div>
          );
        }

        if (isNoRoute) {
          return (
            <div key={item.id} className={styles.dashboardMenuItem}>
              {renderCustomSidebarIcon(item.iconName, `${styles.dashboardIcon}`)}
              <span
                className={`${styles.dashboardLink} opacity-85 cursor-default select-none truncate`}
                title={`${item.label} (Sin ruta asignada)`}
              >
                {item.label}
              </span>
              <span className={styles.tooltip}>{item.label}</span>
            </div>
          );
        }

        if (isInternal) {
          return (
            <div
              key={item.id}
              className={`${styles.dashboardMenuItem} ${isActive ? styles.activeLink : ''}`}
            >
              {renderCustomSidebarIcon(item.iconName, `${styles.dashboardIcon}`)}
              <Link className={styles.dashboardLink} href={item.route} aria-haspopup="true">
                {item.label}
              </Link>
              <span className={styles.tooltip}>{item.label}</span>
            </div>
          );
        }

        return (
          <div key={item.id} className={styles.dashboardMenuItem}>
            {renderCustomSidebarIcon(item.iconName, `${styles.dashboardIcon}`)}
            <a
              className={`${styles.dashboardLink} flex items-center justify-between w-full`}
              href={item.route}
              target={item.openInNewTab !== false ? '_blank' : '_self'}
              rel="noopener noreferrer"
              aria-haspopup="true"
            >
              <span className="truncate">{item.label}</span>
              <RiExternalLinkLine className="text-xs opacity-60 shrink-0 ml-1.5" />
            </a>
            <span className={styles.tooltip}>{item.label}</span>
          </div>
        );
      })}
    </>
  );
};

export default CustomSidebarRenderer;
