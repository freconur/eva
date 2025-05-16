import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useRolUsers } from '@/features/hooks/useRolUsers';
import Image from 'next/image';
import React from 'react'
import { HiOutlineMenu } from 'react-icons/hi';
import logo from '../../assets/formativa-logo.png'
import styles from './navbar.module.css'

const Navbar = () => {
  const { showSidebarValue } = useRolUsers()
  const { showSidebar } = useGlobalContext()
  return (
    <div className={styles.navbar}>
      <div className={styles.navbarContainer}>
        <div onClick={() => showSidebarValue(showSidebar)} className={styles.menuButton}>
          <HiOutlineMenu className={styles.menuIcon} />
        </div>
      </div>
    </div>
  )
}

export default Navbar