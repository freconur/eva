import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link';
import { useRolUsers } from '@/features/hooks/useRolUsers';
import SidebarRegional from './SidebarRegional';
import styles from './sidebar.module.css'
import { FaUserGraduate, FaUserTie } from 'react-icons/fa';
import { MdAccountCircle, MdAttachMoney } from 'react-icons/md';
import { LuListTodo } from "react-icons/lu";
import { IoIosArrowDown, IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useSidebarLabels } from '@/features/context/SidebarLabelsContext';
import CustomSidebarRenderer from './CustomSidebarRenderer';
import PermissionGate from '@/components/permissions/PermissionGate';
import { PERMISSIONS } from '@/features/utils/permissions';
import { useRouter } from 'next/router';

interface Props {
  showSidebar: boolean
}

const SidebarDirectores = ({ showSidebar }: Props) => {
  const router = useRouter();
  const { showSidebarValue, toggleSidebarCollapsed } = useRolUsers()
  const { currentUserData, isSidebarCollapsed } = useGlobalContext()
  const { getLabel, customItems } = useSidebarLabels()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const isDevUser =
    currentUserData?.dni === '47163626' ||
    currentUserData?.id === '47163626' ||
    (currentUserData as any)?.documento === '47163626' ||
    (typeof currentUserData?.email === 'string' && currentUserData.email.includes('47163626'));

  // Close sidebar on route change (Mobile only logic)
  useEffect(() => {
    const p = router.pathname;

    if (p.includes('/directores/evaluaciones')) {
      setOpenDropdown('estudiantes');
    } else if (p.includes('/directores/evaluaciones-docentes') || p.includes('/directores/agregar-profesores') || p.includes('/directores/cobertura-curricular')) {
      setOpenDropdown('docentes');
    }
  }, [router.pathname]);

  useEffect(() => {
    const handleRouteChange = () => {
      if (showSidebar) {
        showSidebarValue(showSidebar);
      }
      if (isSidebarCollapsed) {
        setOpenDropdown(null);
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [showSidebar, router.events, showSidebarValue, isSidebarCollapsed]);

  // Click outside listener when collapsed to close open flyouts
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSidebarCollapsed && openDropdown) {
        if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarCollapsed, openDropdown]);

  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  return (
    <>
      <div
        className={`${styles.backdrop} ${showSidebar ? styles.show : styles.hide}`}
        onClick={() => showSidebarValue(showSidebar)}
      />

      <div
        ref={sidebarRef}
        className={`${styles.sidebar} ${showSidebar ? styles.show : styles.hide} ${isSidebarCollapsed ? styles.collapsed : ''}`}
      >

        {/* Toggle Collapse Button for Desktop */}
        <div
          className={styles.collapseToggleBtn}
          onClick={() => {
            if (!isSidebarCollapsed) {
              setOpenDropdown(null);
            }
            toggleSidebarCollapsed(isSidebarCollapsed);
          }}
          title={isSidebarCollapsed ? "Expandir" : "Contraer"}
        >
          {isSidebarCollapsed ? <IoIosArrowForward /> : <IoIosArrowBack />}
        </div>

        <div onClick={() => showSidebarValue(showSidebar)} className={styles.closeButton}>x</div>

        <div className={styles.sidebarContent}>
          <SidebarRegional />

          <div>
            <div className={styles.sectionHeader}>{getLabel('sidebar_seccionPrincipal', 'Principal')}</div>

            <div className={`${styles.dashboardMenuItem} ${router.pathname === '/mi-cuenta' ? styles.activeLink : ''}`}>
              <MdAccountCircle className={styles.dashboardIcon} />
              <Link className={styles.dashboardLink} href="/mi-cuenta" aria-haspopup="true">
                {getLabel('director_miCuenta', 'Mi cuenta')}
              </Link>
              <span className={styles.tooltip}>{getLabel('director_miCuenta', 'Mi cuenta')}</span>
            </div>

            <div className={styles.sectionHeader}>{getLabel('sidebar_seccionGestion', 'Gestión')}</div>

            <div className={styles.menuContainer}>
              <ul className={styles.menuList}>
                {/* Estudiantes */}
                <li className={`${styles.menuItem} ${openDropdown === 'estudiantes' ? styles.itemOpen : ''}`}>
                  <div className={styles.menuHeader} onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown('estudiantes');
                  }}>
                    <FaUserGraduate className={styles.icon} />
                    <span className={styles.link}>{getLabel('director_estudiantes', 'Estudiantes')}</span>
                    <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'estudiantes' ? styles.arrowRotate : ''}`} />
                  </div>
                  <ul className={`${styles.submenu} ${openDropdown === 'estudiantes' ? styles.show : ''}`}>
                    <li className={styles.flyoutHeader}>{getLabel('director_estudiantes', 'Estudiantes')}</li>
                    <li>
                      <Link href="/directores/evaluaciones" className={`${styles.submenuLink} ${router.pathname.includes('/directores/evaluaciones') && !router.pathname.includes('docentes') ? styles.activeLink : ''}`}>
                        {getLabel('director_estudiantes_seguimiento', 'Seguimiento de aprendizaje')}
                      </Link>
                    </li>
                    <CustomSidebarRenderer role="director" parentId="director_estudiantes" customItems={customItems} isSubmenu={true} />
                  </ul>
                </li>

                {/* Docentes */}
                <li className={`${styles.menuItem} ${openDropdown === 'docentes' ? styles.itemOpen : ''}`}>
                  <div className={styles.menuHeader} onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown('docentes');
                  }}>
                    <FaUserTie className={styles.icon} />
                    <span className={styles.link}>{getLabel('director_docentes', 'Docentes')}</span>
                    <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'docentes' ? styles.arrowRotate : ''}`} />
                  </div>
                  <ul className={`${styles.submenu} ${openDropdown === 'docentes' ? styles.show : ''}`}>
                    <li className={styles.flyoutHeader}>{getLabel('director_docentes', 'Docentes')}</li>
                    <PermissionGate permission={PERMISSIONS.VIEW_MEDIACION_DIDACTICA}>
                      <li>
                        <Link href="/directores/evaluaciones-docentes" className={`${styles.submenuLink} ${router.pathname.includes('/directores/evaluaciones-docentes') ? styles.activeLink : ''}`}>
                          {getLabel('director_docentes_mediacion', 'Mediación didáctica')}
                        </Link>
                      </li>
                    </PermissionGate>

                    <li>
                      <Link href="/directores/agregar-profesores" className={`${styles.submenuLink} ${router.pathname.includes('/directores/agregar-profesores') ? styles.activeLink : ''}`}>
                        {getLabel('director_docentes_crearUsuario', 'Crear usuario')}
                      </Link>
                    </li>

                    <PermissionGate permission={PERMISSIONS.VIEW_COBERTURA_CURRICULAR}>
                      <li>
                        <Link href="/directores/cobertura-curricular" className={`${styles.submenuLink} ${router.pathname.includes('/directores/cobertura-curricular') ? styles.activeLink : ''}`}>
                          {getLabel('director_docentes_cobertura', 'Cobertura curricular')}
                        </Link>
                      </li>
                    </PermissionGate>

                    <li>
                      <Link href="/directores/reporte" className={`${styles.submenuLink} ${router.pathname.includes('/directores/reporte') ? styles.activeLink : ''}`}>
                        {getLabel('director_docentes_reporte', 'Reporte')}
                      </Link>
                    </li>
                    <CustomSidebarRenderer role="director" parentId="director_docentes" customItems={customItems} isSubmenu={true} />
                  </ul>
                </li>

                {/* Autorreporte */}
                <PermissionGate permission={PERMISSIONS.VIEW_AUTORREPORTE}>
                  {customItems.some(item => (item.role === 'director' || item.role === 'all') && item.parentId === 'director_autorreporte') ? (
                    <li className={`${styles.menuItem} ${openDropdown === 'autorreporte' ? styles.itemOpen : ''}`}>
                      <div className={styles.menuHeader} onClick={(e) => {
                        e.stopPropagation();
                        toggleDropdown('autorreporte');
                      }}>
                        <LuListTodo className={styles.icon} />
                        <span className={styles.link}>{getLabel('director_autorreporte', 'Autorreporte')}</span>
                        <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'autorreporte' ? styles.arrowRotate : ''}`} />
                      </div>
                      <ul className={`${styles.submenu} ${openDropdown === 'autorreporte' ? styles.show : ''}`}>
                        <li className={styles.flyoutHeader}>{getLabel('director_autorreporte', 'Autorreporte')}</li>
                        <li>
                          <Link
                            href="/admin/conocimientos-pedagogicos?rol=2"
                            className={`${styles.submenuLink} ${router.pathname.includes('/admin/conocimientos-pedagogicos') && router.query.rol === '2' ? styles.activeLink : ''}`}
                          >
                            {getLabel('director_autorreporte', 'Autorreporte')}
                          </Link>
                        </li>
                        <CustomSidebarRenderer role="director" parentId="director_autorreporte" customItems={customItems} isSubmenu={true} />
                      </ul>
                    </li>
                  ) : (
                    <li className={styles.menuItem}>
                      <div className={`${styles.dashboardMenuItem} ${router.pathname.includes('/admin/conocimientos-pedagogicos') && router.query.rol === '2' ? styles.activeLink : ''}`} style={{ margin: "3px 12px" }}>
                        <LuListTodo className={styles.dashboardIcon} />
                        <Link className={styles.dashboardLink} href="/admin/conocimientos-pedagogicos?rol=2" aria-haspopup="true">
                          {getLabel('director_autorreporte', 'Autorreporte')}
                        </Link>
                        <span className={styles.tooltip}>{getLabel('director_autorreporte', 'Autorreporte')}</span>
                      </div>
                    </li>
                  )}
                </PermissionGate>

                {/* Menús Personalizados de Nivel Superior */}
                <CustomSidebarRenderer role="director" customItems={customItems} isSubmenu={false} asMenuItem={true} />
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SidebarDirectores