import PrivateRoute from '@/components/layouts/PrivateRoutesAdmin'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import React, { useEffect, useState } from 'react'
import styles from './micuenta.module.css'
import { FaUserCircle } from 'react-icons/fa'
import ModalUpdateCliente from '@/modals/ModalUpdateCliente'
import useUsuario from '@/features/hooks/useUsuario'

const MiCuenta = () => {
  const { currentUserData } = useGlobalContext()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { getUserData } = useUsuario()

  useEffect(() => {
  }, [currentUserData.dni])

  const isClient = currentUserData.perfil?.rol === 4

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
            {isClient && (
              <button
                onClick={() => setIsModalOpen(true)}
                className={styles.editButton}
              >
                Editar nombres y apellidos
              </button>
            )}
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.section}>
            <div className={styles.dataRow}>
              <span className={styles.label}>Nombre completo</span>
              <span className={styles.value}>{currentUserData.nombres} {currentUserData.apellidos}</span>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.label}>Documento (ID)</span>
              <span className={styles.value}>{currentUserData.dni}</span>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.label}>Cargo</span>
              <span className={styles.value}>{currentUserData.perfil?.nombre}</span>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.label}>Usuario</span>
              <span className={styles.value}>{currentUserData.dni}</span>
            </div>
            {currentUserData.institucion && (
              <div className={styles.dataRow}>
                <span className={styles.label}>Institución</span>
                <span className={styles.value}>{currentUserData.institucion}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {isModalOpen && (
        <ModalUpdateCliente
          userData={currentUserData}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => getUserData()}
        />
      )}
    </div>
  )
}

export default MiCuenta
MiCuenta.Auth = PrivateRoute