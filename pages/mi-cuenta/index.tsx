import PrivateRoute from '@/components/layouts/PrivateRoutesAdmin'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import React, { useEffect } from 'react'
import styles from './micuenta.module.css'
import { FaUserCircle } from 'react-icons/fa'

const MiCuenta = () => {
  const { currentUserData } = useGlobalContext()

  useEffect(() => {
  }, [currentUserData.dni])

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.userIcon}>
            <FaUserCircle />
          </div>
          <div className={styles.headerContent}>
            <p className={styles.welcomeText}>Bienvenido a tu cuenta</p>
            <h1 className={styles.userName}>{currentUserData.nombres} {currentUserData.apellidos}</h1>
          </div>
        </div>
        <div className={styles.content}>
          <h3 className={styles.title}>Información Personal</h3>
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Mis Datos</h4>
            <p className={styles.dataRow}>
              <span className={styles.label}>Nombre completo:</span>
              <span className={styles.value}>{currentUserData.nombres} {currentUserData.apellidos}</span>
            </p>
            <p className={styles.dataRow}>
              <span className={styles.label}>ID:</span>
              <span className={styles.value}>{currentUserData.dni}</span>
            </p>
            <p className={styles.dataRow}>
              <span className={styles.label}>Cargo:</span>
              <span className={styles.value}>{currentUserData.perfil?.nombre}</span>
            </p>
            <p className={styles.dataRow}>
              <span className={styles.label}>Usuario:</span>
              <span className={styles.value}>{currentUserData.dni}</span>
            </p>
            {currentUserData.institucion && (
              <p className={styles.dataRow}>
                <span className={styles.label}>Institución:</span>
                <span className={styles.value}>{currentUserData.institucion}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MiCuenta
MiCuenta.Auth = PrivateRoute