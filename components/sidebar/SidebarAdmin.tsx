import React, { useState, useEffect } from 'react'
import SidebarInfoUser from './SidebarInfoUser';
import Link from 'next/link';
import useUsuario from '@/features/hooks/useUsuario';
import SidebarRegional from './SidebarRegional';
import { useRolUsers } from '@/features/hooks/useRolUsers';
import SidebarRegion from './SidebarRegion';

import styles from './sidebar.module.css'
import { MdAccountBalance, MdAccountCircle, MdDashboard, MdPeople } from 'react-icons/md';
import { FaUserGraduate, FaUserNinja, FaUserTie } from 'react-icons/fa';
import { LuListTodo } from "react-icons/lu";
import { IoIosArrowDown } from "react-icons/io";
import { useRouter } from 'next/router';
import { FiLogOut } from 'react-icons/fi';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';

interface Props {
  showSidebar: boolean
}

const SidebarAdmin = ({ showSidebar }: Props) => {
  const router = useRouter()
  const { logout } = useUsuario()
  const { showSidebarValue, toggleSidebarCollapsed } = useRolUsers()
  const { currentUserData, isSidebarCollapsed } = useGlobalContext()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [perfilesOpen, setPerfilesOpen] = useState<boolean>(false);

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
    } else if (p.includes('/admin/evaluaciones')) {
      setPerfilesOpen(true);
      setOpenDropdown('estudiantes');
    }
  }, [router.pathname]);

  // Close sidebar on mobile route change
  useEffect(() => {
    const handleRouteChange = () => {
      if (showSidebar) {
        showSidebarValue(showSidebar);
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [showSidebar, router.events, showSidebarValue]);

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

  const redirectLogion = () => {
    router.push('/login');
  }

  return (
    <>
      <div
        className={`${styles.backdrop} ${showSidebar ? styles.show : styles.hide}`}
        onClick={() => showSidebarValue(showSidebar)}
      />

      <div className={`${styles.sidebar} ${showSidebar ? styles.show : styles.hide} ${isSidebarCollapsed ? styles.collapsed : ''}`}>

        {/* Toggle Collapse Button for Desktop */}
        <div
          className={styles.collapseToggleBtn}
          onClick={() => toggleSidebarCollapsed(isSidebarCollapsed)}
          title={isSidebarCollapsed ? "Expandir" : "Contraer"}
        >
          {isSidebarCollapsed ? <IoIosArrowForward /> : <IoIosArrowBack />}
        </div>

        <div onClick={() => showSidebarValue(showSidebar)} className={styles.closeButton}>x</div>
        <div className={styles.sidebarContent}>
          <SidebarRegional />
          <SidebarInfoUser showSidebar={showSidebar} />

          {/* Wrapper to detect clicks when collapsed to auto-expand */}
          <div onClick={() => isSidebarCollapsed && toggleSidebarCollapsed(isSidebarCollapsed)}>
            <div className={`${styles.dashboardMenuItem} ${router.pathname === '/mi-cuenta' ? styles.activeLink : ''}`}>
              <MdAccountCircle className={styles.dashboardIcon} />
              <Link className={styles.dashboardLink} href="/mi-cuenta" aria-haspopup="true">
                Mi cuenta
              </Link>
            </div>
            <div className={`${styles.dashboardMenuItem} ${router.pathname.includes('/dashboard/admin') ? styles.activeLink : ''}`}>
              <MdDashboard className={styles.dashboardIcon} />
              <Link className={styles.dashboardLink} href="/dashboard/admin" aria-haspopup="true">
                Dashboard
              </Link>
            </div>
            <div className={styles.menuContainer}>
              <div className={styles.menuHeader} onClick={(e) => {
                e.stopPropagation();
                togglePerfiles();
              }}>
                <MdPeople className={styles.icon} />
                <span className={styles.link}>Perfiles</span>
                <IoIosArrowDown className={`${styles.perfilesArrowIcon} ${perfilesOpen ? styles.arrowRotate : ''}`} />
              </div>
              <ul className={`${styles.menuList} ${styles.menuListCollapsible} ${perfilesOpen ? styles.show : ''}`}>
                {currentUserData.rol !== 5 && (
                  <li className={styles.menuItem}>
                    <div className={styles.menuHeader} onClick={(e) => {
                      e.stopPropagation();
                      togglePerfilesChild('especialistas-regional');
                    }}>
                      <LuListTodo className={styles.icon} />
                      <span className={styles.link}>Especialista Regional</span>
                      <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'especialistas-regional' ? styles.arrowRotate : ''}`} />
                    </div>
                    <ul className={`${styles.submenu} ${openDropdown === 'especialistas-regional' ? styles.show : ''}`}>
                      <li>
                        <Link
                          href="/admin/especialista-regional/usuarios-especialistas-regional"
                          className={`${styles.submenuLink} ${router.pathname.includes('/admin/especialista-regional/usuarios-especialistas-regional') ? styles.activeLink : ''}`}
                        >
                          Crear usuario
                        </Link>
                      </li>
                      {/* <li><Link href="/admin/especialistas/evaluaciones-especialistas" className={styles.submenuLink}>Seguimiento y retroalimentacion</Link></li>
                  <li><Link href="/admin/especialistas/cobertura-curricular" className={styles.submenuLink}>Cobertura curricular</Link></li>
                  <li><Link href="/admin/conocimientos-pedagogicos?rol=1" className={styles.submenuLink}>Autorreporte</Link></li> */}
                    </ul>
                  </li>
                )}
                {/* {
              currentUserData.rol !== 5 && ( */}
                <li className={styles.menuItem}>
                  <div className={styles.menuHeader} onClick={(e) => {
                    e.stopPropagation();
                    togglePerfilesChild('especialistas');
                  }}>
                    <LuListTodo className={styles.icon} />
                    <span className={styles.link}>Especialistas</span>
                    <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'especialistas' ? styles.arrowRotate : ''}`} />
                  </div>
                  <ul className={`${styles.submenu} ${openDropdown === 'especialistas' ? styles.show : ''}`}>
                    <li>
                      <Link
                        href="/admin/especialistas/agregar-especialista"
                        className={`${styles.submenuLink} ${router.pathname.includes('/admin/especialistas/agregar-especialista') ? styles.activeLink : ''}`}
                      >
                        Crear usuario
                      </Link>
                    </li>
                    {
                      currentUserData.rol !== 5 && (
                        <>
                          <li>
                            <Link
                              href="/admin/especialistas/evaluaciones-especialistas"
                              className={`${styles.submenuLink} ${router.pathname.includes('/admin/especialistas/evaluaciones-especialistas') ? styles.activeLink : ''}`}
                            >
                              Seguimiento y retroalimentacion
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/admin/especialistas/cobertura-curricular"
                              className={`${styles.submenuLink} ${router.pathname.includes('/admin/especialistas/cobertura-curricular') ? styles.activeLink : ''}`}
                            >
                              Cobertura curricular
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/admin/conocimientos-pedagogicos?rol=1"
                              className={`${styles.submenuLink} ${router.pathname.includes('/admin/conocimientos-pedagogicos') && router.query.rol === '1' ? styles.activeLink : ''}`}
                            >
                              Autorreporte
                            </Link>
                          </li>
                        </>
                      )
                    }
                  </ul>
                </li>
                {/*    )
            } */}

                {
                  currentUserData.rol !== 5 && (
                    <li className={styles.menuItem}>
                      <div className={styles.menuHeader} onClick={(e) => {
                        e.stopPropagation();
                        togglePerfilesChild('directores');
                      }}>
                        <MdAccountBalance className={styles.icon} />
                        <span className={styles.link}>Directores</span>
                        <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'directores' ? styles.arrowRotate : ''}`} />
                      </div>
                      <ul className={`${styles.submenu} ${openDropdown === 'directores' ? styles.show : ''}`}>
                        <li>
                          <Link
                            href="/especialistas/agregar-directores"
                            className={`${styles.submenuLink} ${router.pathname.includes('/especialistas/agregar-directores') ? styles.activeLink : ''}`}
                          >
                            Crear usuario
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/especialistas/evaluaciones-director"
                            className={`${styles.submenuLink} ${router.pathname.includes('/especialistas/evaluaciones-director') ? styles.activeLink : ''}`}
                          >
                            Seguimiento y retroalimentacion
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/especialistas/cobertura-curricular"
                            className={`${styles.submenuLink} ${router.pathname.includes('/especialistas/cobertura-curricular') ? styles.activeLink : ''}`}
                          >
                            Cobertura curricular
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/admin/conocimientos-pedagogicos?rol=2"
                            className={`${styles.submenuLink} ${router.pathname.includes('/admin/conocimientos-pedagogicos') && router.query.rol === '2' ? styles.activeLink : ''}`}
                          >
                            Autorreporte
                          </Link>
                        </li>
                      </ul>
                    </li>
                  )
                }

                {
                  currentUserData.rol !== 5 && (
                    <li className={styles.menuItem}>
                      <div className={styles.menuHeader} onClick={(e) => {
                        e.stopPropagation();
                        togglePerfilesChild('docentes');
                      }}>
                        <FaUserTie className={styles.icon} />
                        <span className={styles.link}>Docentes</span>
                        <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'docentes' ? styles.arrowRotate : ''}`} />
                      </div>
                      <ul className={`${styles.submenu} ${openDropdown === 'docentes' ? styles.show : ''}`}>
                        <li>
                          <Link
                            href="/admin/docentes/usuarios"
                            className={`${styles.submenuLink} ${router.pathname.includes('/admin/docentes/usuarios') ? styles.activeLink : ''}`}
                          >
                            Usuarios
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/directores/evaluaciones-docentes"
                            className={`${styles.submenuLink} ${router.pathname.includes('/directores/evaluaciones-docentes') ? styles.activeLink : ''}`}
                          >
                            Seguimiento y retroalimentacion
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/directores/cobertura-curricular"
                            className={`${styles.submenuLink} ${router.pathname.includes('/directores/cobertura-curricular') ? styles.activeLink : ''}`}
                          >
                            Cobertura curricular
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/admin/conocimientos-pedagogicos?rol=3"
                            className={`${styles.submenuLink} ${router.pathname.includes('/admin/conocimientos-pedagogicos') && router.query.rol === '3' ? styles.activeLink : ''}`}
                          >
                            Autorreporte
                          </Link>
                        </li>
                      </ul>
                    </li>
                  )
                }
                <li className={styles.menuItem}>
                  <div className={styles.menuHeader} onClick={(e) => {
                    e.stopPropagation();
                    togglePerfilesChild('estudiantes');
                  }}>
                    <FaUserGraduate className={styles.icon} />
                    <span className={styles.link}>Estudiantes</span>
                    <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'estudiantes' ? styles.arrowRotate : ''}`} />
                  </div>
                  <ul className={`${styles.submenu} ${openDropdown === 'estudiantes' ? styles.show : ''}`}>
                    <li>
                      <Link
                        href="/admin/evaluaciones"
                        className={`${styles.submenuLink} ${router.pathname.includes('/admin/evaluaciones') ? styles.activeLink : ''}`}
                      >
                        Seguimiento de Aprendizaje
                      </Link>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div onClick={() => { logout(); redirectLogion() }} className={styles.logoutButton}>
          <FiLogOut className={styles.logoutIcon} />
          <p>cerrar sesión</p>
        </div>
      </div>
    </>
  )
}

export default SidebarAdmin