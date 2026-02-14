import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import useUsuario from '@/features/hooks/useUsuario'
import React, { useEffect, useState } from 'react'
import { RiAddLine } from 'react-icons/ri'
import styles from './styles.module.css'
import { useDirectores } from '@/features/hooks/useDirectores'
import UsuariosByRol from '@/components/usuariosByRol'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import DocenteModal from '@/components/modals/DocenteModal'

const AgregarDirectores = () => {
  const [showModal, setShowModal] = useState(false)
  const { getUserData } = useUsuario()
  const { currentUserData, usuariosByRol } = useGlobalContext()
  const { getDocentesByDniDirector } = useDirectores()
  const { getGrades } = useAgregarEvaluaciones()

  useEffect(() => {
    getUserData()
  }, [currentUserData.dni])

  useEffect(() => {
    if (currentUserData.dni) {
      getDocentesByDniDirector(`${currentUserData.dni}`)
    }
  }, [currentUserData.dni])

  useEffect(() => {
    getGrades()
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.pageTitle}>Gestión de Profesores</h1>
          <p className={styles.pageSubtitle}>Administra y registra a los docentes de tu institución</p>
        </div>
        <button
          className={styles.addBtn}
          onClick={() => setShowModal(true)}
        >
          <RiAddLine size={24} />
          <span>Registrar Profesor</span>
        </button>
      </div>

      <div className={styles.mainContent}>
        <UsuariosByRol usuariosByRol={usuariosByRol} />
      </div>

      <div id="portal-modal" />

      {showModal && (
        <DocenteModal
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

export default AgregarDirectores
AgregarDirectores.Auth = PrivateRouteDirectores