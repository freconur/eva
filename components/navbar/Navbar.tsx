import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useRolUsers } from '@/features/hooks/useRolUsers';
import React, { useState, useEffect } from 'react';
import { HiOutlineMenu } from 'react-icons/hi';
import styles from './navbar.module.css';
import Breadcrumbs from './Breadcrumbs';
import ActiveUsersBadge from '../common/ActiveUsersBadge';

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
        </div>

        {/* Right Section: Active Users Badge (solo Administrador) & Institutional Level */}
        <div className={styles.rightSection} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isAdminUser && <ActiveUsersBadge />}

          {currentUserData?.nivelDeInstitucion && currentUserData.nivelDeInstitucion.length > 0 && (
            <div className={styles.nivelBadge}>
              <span className={styles.nivelLabel}>Nivel:</span>
              <span className={styles.nivelValue}>
                {currentUserData.nivelDeInstitucion.map((nivel: number) => {
                  if (nivel === 0) return 'Inicial';
                  if (nivel === 1) return 'Primaria';
                  if (nivel === 2) return 'Secundaria';
                  return nivel;
                }).join(' y ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Navbar