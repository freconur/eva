import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useRolUsers } from '@/features/hooks/useRolUsers';
import React, { useState, useEffect } from 'react';
import { HiOutlineMenu } from 'react-icons/hi';
import styles from './navbar.module.css';
import Breadcrumbs from './Breadcrumbs';
import ActiveUsersBadge from '../common/ActiveUsersBadge';
import NavbarUserMenu from './NavbarUserMenu';

const Navbar = () => {
  const { showSidebarValue } = useRolUsers();
  const { showSidebar, currentUserData } = useGlobalContext();
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);

  useEffect(() => {
    const userRol = Number(currentUserData?.rol || currentUserData?.perfil?.rol);
    const rolNombre = currentUserData?.perfil?.nombre?.toLowerCase() || '';
    let admin = userRol === 4 || userRol === 5 || rolNombre.includes('admin');

    if (!admin && typeof window !== 'undefined') {
      const realAdminStr = sessionStorage.getItem('real_admin_user');
      if (realAdminStr) {
        try {
          const realAdmin = JSON.parse(realAdminStr);
          const rRol = Number(realAdmin.rol || realAdmin.perfil?.rol);
          const rNombre = realAdmin.perfil?.nombre?.toLowerCase() || '';
          if (rRol === 4 || rRol === 5 || rNombre.includes('admin')) {
            admin = true;
          }
        } catch (e) {
          // ignore
        }
      }
    }

    setIsAdminUser(admin);
  }, [currentUserData]);

  return (
    <div className={styles.navbar}>
      <div className={styles.navbarContainer}>
        <div className={styles.leftSection}>
          <button
            onClick={() => showSidebarValue(showSidebar)}
            className={styles.menuButton}
            aria-label="Toggle menu"
            type="button"
          >
            <HiOutlineMenu className={styles.menuIcon} />
          </button>

          {/* Breadcrumb Navigation */}
          <Breadcrumbs />

          {/* Active Users Badge (solo Administrador) */}
          {isAdminUser && (
            <div className={styles.activeUsersWrapper}>
              <ActiveUsersBadge />
            </div>
          )}
        </div>

        {/* Right Section: User Menu */}
        <div className={styles.rightSection}>
          <NavbarUserMenu />
        </div>
      </div>
    </div>
  )
}

export default Navbar