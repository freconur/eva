import React, { useState } from 'react'
import SidebarInfoUser from './SidebarInfoUser';
import Link from 'next/link';
import useUsuario from '@/features/hooks/useUsuario';
import SidebarRegional from './SidebarRegional';
import { useRolUsers } from '@/features/hooks/useRolUsers';
import SidebarRegion from './SidebarRegion';
import BackgroundSidebar from './background-sidebar';
import styles from './sidebarAdmin.module.css'
import { MdAccountBalance, MdAccountCircle } from 'react-icons/md';
import { FaUserGraduate, FaUserNinja, FaUserTie } from 'react-icons/fa';
import { LuListTodo } from "react-icons/lu";
import { IoIosArrowDown } from "react-icons/io";
import { useRouter } from 'next/router';
import { FiLogOut } from 'react-icons/fi';

interface Props {
  showSidebar: boolean
}

const SidebarAdmin = ({ showSidebar }: Props) => {
  const router = useRouter()
  const { logout } = useUsuario()
  const { showSidebarValue } = useRolUsers()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const redirectLogion = () => {
    router.push('/login');
  }

  return (
    <div className={`${styles.sidebar} ${showSidebar ? styles.show : styles.hide}`}>
      <BackgroundSidebar />
      <div onClick={() => showSidebarValue(showSidebar)} className={styles.closeButton}>x</div>
      <div className={styles.sidebarContent}>
        <SidebarRegional />
        <div className={styles.menuItem}>
          <MdAccountCircle className={styles.icon} />
          <Link className={styles.link} href="/mi-cuenta" aria-haspopup="true">
            Mi cuenta
          </Link>
        </div>
        <div className={styles.menuContainer}>
          <ul className={styles.menuList}>
            <li className={styles.menuItem}>
              <div className={styles.menuHeader} onClick={() => toggleDropdown('especialistas')}>
                <LuListTodo className={styles.icon} />
                <span className={styles.link}>Especialistas</span>
                <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'especialistas' ? styles.arrowRotate : ''}`} />
              </div>
              <ul className={`${styles.submenu} ${openDropdown === 'especialistas' ? styles.show : ''}`}>
                <li><Link href="/admin/especialistas/agregar-especialista" className={styles.submenuLink}>Crear usuario</Link></li>
                <li><Link href="/admin/especialistas/evaluaciones-especialistas" className={styles.submenuLink}>Seguimiento y retroalimentacion</Link></li>
                <li><Link href="/admin/especialistas/cobertura-curricular" className={styles.submenuLink}>Cobertura curricular</Link></li>
              </ul>
            </li>
            <li className={styles.menuItem}>
              <div className={styles.menuHeader} onClick={() => toggleDropdown('directores')}>
                <MdAccountBalance className={styles.icon} />
                <span className={styles.link}>Directores</span>
                <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'directores' ? styles.arrowRotate : ''}`} />
              </div>
              <ul className={`${styles.submenu} ${openDropdown === 'directores' ? styles.show : ''}`}>
                <li><Link href="/especialistas/agregar-directores" className={styles.submenuLink}>Crear usuario</Link></li>
                <li><Link href="/especialistas/evaluaciones-director" className={styles.submenuLink}>Seguimiento y retroalimentacion</Link></li>
                <li><Link href="/especialistas/cobertura-curricular" className={styles.submenuLink}>Cobertura curricular</Link></li>
              </ul>
            </li>
            <li className={styles.menuItem}>
              <div className={styles.menuHeader} onClick={() => toggleDropdown('docentes')}>
                <FaUserTie className={styles.icon} />
                <span className={styles.link}>Docentes</span>
                <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'docentes' ? styles.arrowRotate : ''}`} />
              </div>
              <ul className={`${styles.submenu} ${openDropdown === 'docentes' ? styles.show : ''}`}>
                <li><Link href="/directores/evaluaciones-docentes" className={styles.submenuLink}>Seguimiento y retroalimentacion</Link></li>
                <li><Link href="/directores/cobertura-curricular" className={styles.submenuLink}>Cobertura curricular</Link></li>
              </ul>
            </li>
            <li className={styles.menuItem}>
              <div className={styles.menuHeader} onClick={() => toggleDropdown('estudiantes')}>
                <FaUserGraduate className={styles.icon} />
                <span className={styles.link}>Estudiantes</span>
                <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'estudiantes' ? styles.arrowRotate : ''}`} />
              </div>
              <ul className={`${styles.submenu} ${openDropdown === 'estudiantes' ? styles.show : ''}`}>
                <li><Link href="/admin/evaluaciones" className={styles.submenuLink}>Seguimiento de Aprendizaje</Link></li>
                <li><Link href="/admin/agregar-evaluaciones" className={styles.submenuLink}>Agregar evaluacion</Link></li>
              </ul>
            </li>
          </ul>
        </div>
        
        <SidebarInfoUser showSidebar={showSidebar} />
      </div>
      <div onClick={() => {logout(); redirectLogion()}} className={styles.logoutButton}>
        <FiLogOut className={styles.logoutIcon} />
        <p>cerrar sesión</p>
      </div>
    </div>
  )
}

export default SidebarAdmin