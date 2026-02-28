import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useRolUsers } from '@/features/hooks/useRolUsers';
import React from 'react'
import { HiOutlineMenu } from 'react-icons/hi';
import styles from './navbar.module.css'
import Breadcrumbs from './Breadcrumbs';

const Navbar = () => {
  const { showSidebarValue } = useRolUsers()
  const { showSidebar, currentUserData } = useGlobalContext()
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

        {/* Right Section: User Info / Institutional Level */}
        {currentUserData?.nivelDeInstitucion && currentUserData.nivelDeInstitucion.length > 0 && (
          <div className={styles.rightSection}>
            <div className={styles.nivelBadge}>
              <span className={styles.nivelLabel}>Nivel:</span>
              <span className={styles.nivelValue}>
                {currentUserData.nivelDeInstitucion.map((nivel: number) => {
                  if (nivel === 1) return 'Primaria';
                  if (nivel === 2) return 'Secundaria';
                  return nivel;
                }).join(' y ')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Navbar