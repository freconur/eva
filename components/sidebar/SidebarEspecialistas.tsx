import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link';
import SidebarRegional from './SidebarRegional';
import { useRolUsers } from '@/features/hooks/useRolUsers';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useSidebarLabels } from '@/features/context/SidebarLabelsContext';
import CustomSidebarRenderer from './CustomSidebarRenderer';
import styles from './sidebar.module.css'
import { MdAccountBalance, MdAccountCircle } from 'react-icons/md';
import { FaUserGraduate, FaUserTie } from 'react-icons/fa';
import { IoIosArrowDown, IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import { useRouter } from 'next/router';

interface Props {
  showSidebar: boolean
}

const SidebarEspecialistas = ({ showSidebar }: Props) => {
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
  // Auto-open accordion strictly on page load or navigation
  useEffect(() => {
    const p = router.pathname;

    if (p.includes('/especialistas/evaluaciones-director') || p.includes('/especialistas/cobertura-curricular') || p.includes('/especialistas/agregar-directores')) {
      setOpenDropdown('directivos');
    } else if (p.includes('/especialistas/evaluaciones-docentes') || p.includes('/especialistas/cobertura-curricular-master')) {
      setOpenDropdown('docentes');
    } else if (p.includes('/admin/docentes/usuarios') || p.includes('/especialistas/autoreporte')) {
      setOpenDropdown('docentes-usuarios');
    } else if (p.includes('/especialistas/evaluaciones')) {
      setOpenDropdown('estudiantes');
    }
  }, [router.pathname]);

  useEffect(() => {
    const handleRouteChange = () => {
      // If sidebar is visible (showSidebar is true), we set it to false
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
      {/* Mobile Backdrop */}
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
                {getLabel('especialista_miCuenta', 'Mi cuenta')}
              </Link>
              <span className={styles.tooltip}>{getLabel('especialista_miCuenta', 'Mi cuenta')}</span>
            </div>

            <div className={styles.sectionHeader}>{getLabel('sidebar_seccionGestion', 'Gestión')}</div>

            <div className={styles.menuContainer}>
              <ul className={styles.menuList}>
                {/* Directivos */}
                <li className={`${styles.menuItem} ${openDropdown === 'directivos' ? styles.itemOpen : ''}`}>
                  <div className={styles.menuHeader} onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown('directivos');
                  }}>
                    <MdAccountBalance className={styles.icon} />
                    <span className={styles.link}>{getLabel('especialista_directivos', 'Directivos')}</span>
                    <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'directivos' ? styles.arrowRotate : ''}`} />
                  </div>
                  <ul className={`${styles.submenu} ${openDropdown === 'directivos' ? styles.show : ''}`}>
                    <li className={styles.flyoutHeader}>{getLabel('especialista_directivos', 'Directivos')}</li>
                    {!currentUserData.nivelDeInstitucion?.includes(2) && (
                      <>
                        <li><Link href="/especialistas/evaluaciones-director" className={`${styles.submenuLink} ${router.pathname.includes('/especialistas/evaluaciones-director') ? styles.activeLink : ''}`}>{getLabel('especialista_directivos_seguimiento', 'Seguimiento y retroalimentación')}</Link></li>
                        <li><Link href="/especialistas/cobertura-curricular" className={`${styles.submenuLink} ${router.pathname.includes('/especialistas/cobertura-curricular') ? styles.activeLink : ''}`}>{getLabel('especialista_directivos_cobertura', 'Cobertura curricular')}</Link></li>
                      </>
                    )}
                    <li><Link href="/especialistas/agregar-directores" className={`${styles.submenuLink} ${router.pathname.includes('/especialistas/agregar-directores') ? styles.activeLink : ''}`}>{getLabel('especialista_directivos_crear', 'Crear directivo')}</Link></li>
                    <CustomSidebarRenderer role="especialista" parentId="especialista_directivos" customItems={customItems} isSubmenu={true} />
                  </ul>
                </li>

                {/* Docentes (Usuarios) */}
                <li className={`${styles.menuItem} ${openDropdown === 'docentes-usuarios' ? styles.itemOpen : ''}`}>
                  <div className={styles.menuHeader} onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown('docentes-usuarios');
                  }}>
                    <FaUserGraduate className={styles.icon} />
                    <span className={styles.link}>{getLabel('especialista_docentes', 'Docentes')}</span>
                    <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'docentes-usuarios' ? styles.arrowRotate : ''}`} />
                  </div>
                  <ul className={`${styles.submenu} ${openDropdown === 'docentes-usuarios' ? styles.show : ''}`}>
                    <li className={styles.flyoutHeader}>{getLabel('especialista_docentes', 'Docentes')}</li>
                    <li><Link href="/admin/docentes/usuarios" className={`${styles.submenuLink} ${router.pathname.includes('/admin/docentes/usuarios') ? styles.activeLink : ''}`}>{getLabel('especialista_docentes_usuarios', 'Usuarios')}</Link></li>
                    <li><Link href="/especialistas/autoreporte" className={`${styles.submenuLink} ${router.pathname.includes('/especialistas/autoreporte') ? styles.activeLink : ''}`}>{getLabel('especialista_autorreporte', 'Autorreporte')}</Link></li>
                    <CustomSidebarRenderer role="especialista" parentId="especialista_docentes" customItems={customItems} isSubmenu={true} />
                  </ul>
                </li>

                {/* Estudiantes */}
                <li className={`${styles.menuItem} ${openDropdown === 'estudiantes' ? styles.itemOpen : ''}`}>
                  <div className={styles.menuHeader} onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown('estudiantes');
                  }}>
                    <FaUserGraduate className={styles.icon} />
                    <span className={styles.link}>{getLabel('especialista_estudiantes', 'Estudiantes')}</span>
                    <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'estudiantes' ? styles.arrowRotate : ''}`} />
                  </div>
                  <ul className={`${styles.submenu} ${openDropdown === 'estudiantes' ? styles.show : ''}`}>
                    <li className={styles.flyoutHeader}>{getLabel('especialista_estudiantes', 'Estudiantes')}</li>
                    <li><Link href="/especialistas/evaluaciones" className={`${styles.submenuLink} ${router.pathname.includes('/especialistas/evaluaciones') ? styles.activeLink : ''}`}>{getLabel('especialista_estudiantes_seguimiento', 'Seguimiento de aprendizaje')}</Link></li>
                    <CustomSidebarRenderer role="especialista" parentId="especialista_estudiantes" customItems={customItems} isSubmenu={true} />
                  </ul>
                </li>

                {/* Menús Personalizados de Nivel Superior */}
                <CustomSidebarRenderer role="especialista" customItems={customItems} isSubmenu={false} asMenuItem={true} />
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SidebarEspecialistas