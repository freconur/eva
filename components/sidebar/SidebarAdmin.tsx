import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link';
import SidebarRegional from './SidebarRegional';
import { useRolUsers } from '@/features/hooks/useRolUsers';
import SidebarRegion from './SidebarRegion';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';
import { useSidebarLabels } from '@/features/context/SidebarLabelsContext';
import CustomSidebarRenderer from './CustomSidebarRenderer';

import styles from './sidebar.module.css'
import { MdAccountBalance, MdAccountCircle, MdDashboard, MdPeople, MdSettings, MdAssignment, MdAttachMoney } from 'react-icons/md';
import { FaUserGraduate, FaUserNinja, FaUserTie } from 'react-icons/fa';
import { LuListTodo } from "react-icons/lu";
import { IoIosArrowDown } from "react-icons/io";
import { useRouter } from 'next/router';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';

interface Props {
  showSidebar: boolean
}

const SidebarAdmin = ({ showSidebar }: Props) => {
  const router = useRouter()
  const { showSidebarValue, toggleSidebarCollapsed } = useRolUsers()
  const { currentUserData, isSidebarCollapsed } = useGlobalContext()
  const { getLabel, customItems } = useSidebarLabels()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [perfilesOpen, setPerfilesOpen] = useState<boolean>(false);
  const [requestCount, setRequestCount] = useState<number>(0);

  const userRol = currentUserData?.rol || currentUserData?.perfil?.rol;
  const isAdmin = Number(userRol) === 4;
  const isDevUser =
    currentUserData?.dni === '47163626' ||
    currentUserData?.id === '47163626' ||
    (currentUserData as any)?.documento === '47163626' ||
    (typeof currentUserData?.email === 'string' && currentUserData.email.includes('47163626'));

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(
      collection(db, 'solicitudes_reseteo'),
      where('estado', '==', 'pendiente')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequestCount(snapshot.size);
    }, (error) => {
      console.error("Error al obtener cantidad de solicitudes en sidebar:", error);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Auto-open accordion strictly on page load or navigation
  useEffect(() => {
    const p = router.pathname;

    // Perfiles logic
    if (p.includes('/admin/especialista-regional')) {
      setPerfilesOpen(true);
      setOpenDropdown('especialistas-regional');
    } else if (p.includes('/admin/especialistas')) {
      setPerfilesOpen(true);
      setOpenDropdown('especialistas');
    } else if (p.includes('/especialistas/agregar-directores') || p.includes('/especialistas/evaluaciones-director') || p.includes('/especialistas/cobertura-curricular') || (p.includes('/admin/conocimientos-pedagogicos') && p.includes('rol=2'))) {
      setPerfilesOpen(true);
      setOpenDropdown('directores');
    } else if (p.includes('/admin/docentes') || p.includes('/directores/evaluaciones-docentes') || p.includes('/directores/cobertura-curricular') || (p.includes('/admin/conocimientos-pedagogicos') && p.includes('rol=3'))) {
      setPerfilesOpen(true);
      setOpenDropdown('docentes');
    } else if (p.includes('/admin/evaluaciones') || p.includes('/admin/matriz-resultados')) {
      setPerfilesOpen(true);
      setOpenDropdown('estudiantes');
    }
  }, [router.pathname]);

  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close sidebar on mobile route change and close flyouts when collapsed
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

  const togglePerfiles = () => {
    setPerfilesOpen(!perfilesOpen);
  };

  const togglePerfilesChild = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
    if (!perfilesOpen) {
      setPerfilesOpen(true);
    }
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
                {getLabel('admin_miCuenta', 'Mi cuenta')}
              </Link>
              <span className={styles.tooltip}>{getLabel('admin_miCuenta', 'Mi cuenta')}</span>
            </div>

            <div className={`${styles.dashboardMenuItem} ${router.pathname.includes('/admin/gestion-usuarios') ? styles.activeLink : ''}`}>
              <div className="relative flex items-center">
                <MdPeople className={styles.dashboardIcon} />
                {isAdmin && requestCount > 0 && isSidebarCollapsed && (
                  <span className={styles.badgeDot}></span>
                )}
              </div>
              <Link className={styles.dashboardLink} href="/admin/gestion-usuarios" aria-haspopup="true">
                {getLabel('admin_gestionUsuarios', 'Gestión de Usuarios')}
              </Link>
              {isAdmin && requestCount > 0 && !isSidebarCollapsed && (
                <span className={styles.badge}>
                  {requestCount}
                </span>
              )}
              <span className={styles.tooltip}>{getLabel('admin_gestionUsuarios', 'Gestión de Usuarios')}</span>
            </div>

            {isAdmin && (
              <div className={`${styles.dashboardMenuItem} ${router.pathname.includes('/admin/configuracion') ? styles.activeLink : ''}`}>
                <MdSettings className={styles.dashboardIcon} />
                <Link className={styles.dashboardLink} href="/admin/configuracion" aria-haspopup="true">
                  {getLabel('admin_configuracion', 'Configuración')}
                </Link>
                <span className={styles.tooltip}>{getLabel('admin_configuracion', 'Configuración')}</span>
              </div>
            )}

            {isAdmin && (
              <div className={`${styles.dashboardMenuItem} ${router.pathname.includes('/admin/pruebas') ? styles.activeLink : ''}`}>
                <MdAssignment className={styles.dashboardIcon} />
                <Link className={styles.dashboardLink} href="/admin/pruebas" aria-haspopup="true">
                  {getLabel('admin_pizarra', 'Pizarra')}
                </Link>
                <span className={styles.tooltip}>{getLabel('admin_pizarra', 'Pizarra')}</span>
              </div>
            )}

            {isAdmin && isDevUser && (
              <div className={`${styles.dashboardMenuItem} ${router.pathname.includes('/admin/matriz-costos') ? styles.activeLink : ''}`}>
                <MdAttachMoney className={styles.dashboardIcon} />
                <Link className={styles.dashboardLink} href="/admin/matriz-costos" aria-haspopup="true">
                  {getLabel('admin_matrizCostos', 'Matriz de Costos')}
                </Link>
                <span className={styles.tooltip}>{getLabel('admin_matrizCostos', 'Matriz de Costos')}</span>
              </div>
            )}

            <div className={styles.sectionHeader}>{getLabel('admin_perfiles', 'Perfiles')}</div>

            <div className={styles.menuContainer}>
              <ul className={styles.menuList}>
                {currentUserData.rol !== 5 && (
                  <li className={`${styles.menuItem} ${openDropdown === 'especialistas-regional' ? styles.itemOpen : ''}`}>
                    <div className={styles.menuHeader} onClick={(e) => {
                      e.stopPropagation();
                      toggleDropdown('especialistas-regional');
                    }}>
                      <LuListTodo className={styles.icon} />
                      <span className={styles.link}>{getLabel('admin_especialistaRegional', 'Especialista Regional')}</span>
                      <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'especialistas-regional' ? styles.arrowRotate : ''}`} />
                    </div>
                    <ul className={`${styles.submenu} ${openDropdown === 'especialistas-regional' ? styles.show : ''}`}>
                      <li className={styles.flyoutHeader}>{getLabel('admin_especialistaRegional', 'Especialista Regional')}</li>
                      <li>
                        <Link
                          href="/admin/especialista-regional/usuarios-especialistas-regional"
                          className={`${styles.submenuLink} ${router.pathname.includes('/admin/especialista-regional/usuarios-especialistas-regional') ? styles.activeLink : ''}`}
                        >
                          {getLabel('admin_especialistaRegional_crearUsuario', 'Crear usuario')}
                        </Link>
                      </li>
                    </ul>
                  </li>
                )}

                <li className={`${styles.menuItem} ${openDropdown === 'especialistas' ? styles.itemOpen : ''}`}>
                  <div className={styles.menuHeader} onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown('especialistas');
                  }}>
                    <LuListTodo className={styles.icon} />
                    <span className={styles.link}>{getLabel('admin_especialistas', 'Especialistas')}</span>
                    <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'especialistas' ? styles.arrowRotate : ''}`} />
                  </div>
                  <ul className={`${styles.submenu} ${openDropdown === 'especialistas' ? styles.show : ''}`}>
                    <li className={styles.flyoutHeader}>{getLabel('admin_especialistas', 'Especialistas')}</li>
                    <li>
                      <Link
                        href="/admin/especialistas/agregar-especialista"
                        className={`${styles.submenuLink} ${router.pathname.includes('/admin/especialistas/agregar-especialista') ? styles.activeLink : ''}`}
                      >
                        {getLabel('admin_especialistas_crearUsuario', 'Crear usuario')}
                      </Link>
                    </li>
                    {currentUserData.rol !== 5 && (
                      <>
                        <li>
                          <Link
                            href="/admin/especialistas/evaluaciones-especialistas"
                            className={`${styles.submenuLink} ${router.pathname.includes('/admin/especialistas/evaluaciones-especialistas') ? styles.activeLink : ''}`}
                          >
                            {getLabel('admin_especialistas_seguimiento', 'Seguimiento y retroalimentacion')}
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/admin/especialistas/cobertura-curricular"
                            className={`${styles.submenuLink} ${router.pathname.includes('/admin/especialistas/cobertura-curricular') ? styles.activeLink : ''}`}
                          >
                            {getLabel('admin_especialistas_cobertura', 'Cobertura curricular')}
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/admin/conocimientos-pedagogicos?rol=1"
                            className={`${styles.submenuLink} ${router.pathname.includes('/admin/conocimientos-pedagogicos') && router.query.rol === '1' ? styles.activeLink : ''}`}
                          >
                            {getLabel('admin_especialistas_autorreporte', 'Autorreporte')}
                          </Link>
                        </li>
                      </>
                    )}
                    <CustomSidebarRenderer role="admin" parentId="admin_especialistas" customItems={customItems} isSubmenu={true} />
                  </ul>
                </li>

                {currentUserData.rol !== 5 && (
                  <li className={`${styles.menuItem} ${openDropdown === 'directores' ? styles.itemOpen : ''}`}>
                    <div className={styles.menuHeader} onClick={(e) => {
                      e.stopPropagation();
                      toggleDropdown('directores');
                    }}>
                      <MdAccountBalance className={styles.icon} />
                      <span className={styles.link}>{getLabel('admin_directores', 'Directores')}</span>
                      <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'directores' ? styles.arrowRotate : ''}`} />
                    </div>
                    <ul className={`${styles.submenu} ${openDropdown === 'directores' ? styles.show : ''}`}>
                      <li className={styles.flyoutHeader}>{getLabel('admin_directores', 'Directores')}</li>
                      <li>
                        <Link
                          href="/especialistas/agregar-directores"
                          className={`${styles.submenuLink} ${router.pathname.includes('/especialistas/agregar-directores') ? styles.activeLink : ''}`}
                        >
                          {getLabel('admin_directores_crearUsuario', 'Crear usuario')}
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/especialistas/evaluaciones-director"
                          className={`${styles.submenuLink} ${router.pathname.includes('/especialistas/evaluaciones-director') ? styles.activeLink : ''}`}
                        >
                          {getLabel('admin_directores_seguimiento', 'Seguimiento y retroalimentacion')}
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/especialistas/cobertura-curricular"
                          className={`${styles.submenuLink} ${router.pathname.includes('/especialistas/cobertura-curricular') ? styles.activeLink : ''}`}
                        >
                          {getLabel('admin_directores_cobertura', 'Cobertura curricular')}
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/admin/conocimientos-pedagogicos?rol=2"
                          className={`${styles.submenuLink} ${router.pathname.includes('/admin/conocimientos-pedagogicos') && router.query.rol === '2' ? styles.activeLink : ''}`}
                        >
                          {getLabel('admin_directores_autorreporte', 'Autorreporte')}
                        </Link>
                      </li>
                      <CustomSidebarRenderer role="admin" parentId="admin_directores" customItems={customItems} isSubmenu={true} />
                    </ul>
                  </li>
                )}

                {currentUserData.rol !== 5 && (
                  <li className={`${styles.menuItem} ${openDropdown === 'docentes' ? styles.itemOpen : ''}`}>
                    <div className={styles.menuHeader} onClick={(e) => {
                      e.stopPropagation();
                      toggleDropdown('docentes');
                    }}>
                      <FaUserTie className={styles.icon} />
                      <span className={styles.link}>{getLabel('admin_docentes', 'Docentes')}</span>
                      <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'docentes' ? styles.arrowRotate : ''}`} />
                    </div>
                    <ul className={`${styles.submenu} ${openDropdown === 'docentes' ? styles.show : ''}`}>
                      <li className={styles.flyoutHeader}>{getLabel('admin_docentes', 'Docentes')}</li>
                      <li>
                        <Link
                          href="/admin/docentes/usuarios"
                          className={`${styles.submenuLink} ${router.pathname.includes('/admin/docentes/usuarios') ? styles.activeLink : ''}`}
                        >
                          {getLabel('admin_docentes_usuarios', 'Usuarios')}
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/directores/evaluaciones-docentes"
                          className={`${styles.submenuLink} ${router.pathname.includes('/directores/evaluaciones-docentes') ? styles.activeLink : ''}`}
                        >
                          {getLabel('admin_docentes_seguimiento', 'Seguimiento y retroalimentacion')}
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/directores/cobertura-curricular"
                          className={`${styles.submenuLink} ${router.pathname.includes('/directores/cobertura-curricular') ? styles.activeLink : ''}`}
                        >
                          {getLabel('admin_docentes_cobertura', 'Cobertura curricular')}
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/admin/conocimientos-pedagogicos?rol=3"
                          className={`${styles.submenuLink} ${router.pathname.includes('/admin/conocimientos-pedagogicos') && router.query.rol === '3' ? styles.activeLink : ''}`}
                        >
                          {getLabel('admin_docentes_autorreporte', 'Autorreporte')}
                        </Link>
                      </li>
                      <CustomSidebarRenderer role="admin" parentId="admin_docentes" customItems={customItems} isSubmenu={true} />
                    </ul>
                  </li>
                )}

                <li className={`${styles.menuItem} ${openDropdown === 'estudiantes' ? styles.itemOpen : ''}`}>
                  <div className={styles.menuHeader} onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown('estudiantes');
                  }}>
                    <FaUserGraduate className={styles.icon} />
                    <span className={styles.link}>{getLabel('admin_estudiantes', 'Estudiantes')}</span>
                    <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'estudiantes' ? styles.arrowRotate : ''}`} />
                  </div>
                  <ul className={`${styles.submenu} ${openDropdown === 'estudiantes' ? styles.show : ''}`}>
                    <li className={styles.flyoutHeader}>{getLabel('admin_estudiantes', 'Estudiantes')}</li>
                    <li>
                      <Link
                        href="/admin/evaluaciones"
                        className={`${styles.submenuLink} ${router.pathname.includes('/admin/evaluaciones') ? styles.activeLink : ''}`}
                      >
                        {getLabel('admin_estudiantes_seguimiento', 'Seguimiento de Aprendizaje')}
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin/matriz-resultados"
                        className={`${styles.submenuLink} ${router.pathname.includes('/admin/matriz-resultados') ? styles.activeLink : ''}`}
                      >
                        {getLabel('admin_estudiantes_matriz', 'Matriz de Resultados')}
                      </Link>
                    </li>
                    <CustomSidebarRenderer role="admin" parentId="admin_estudiantes" customItems={customItems} isSubmenu={true} />
                  </ul>
                </li>

                {/* Menús Personalizados de Nivel Superior */}
                <CustomSidebarRenderer role="admin" customItems={customItems} isSubmenu={false} asMenuItem={true} />
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SidebarAdmin