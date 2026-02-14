import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import useUsuario from '@/features/hooks/useUsuario'
import DeleteUsuario from '@/modals/deleteUsuario'
import UpdateUsuarioDirector from '@/modals/updateUsuarioDirector'
import React, { useEffect, useState } from 'react'
import { RiAddLine } from 'react-icons/ri'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'
import TablaDirectores from '@/components/curricular/tablas/tablaDirectores'
import DirectorModal from '@/components/modals/DirectorModal'
import styles from './agregar-directores.module.css'

const AgregarDirectores = () => {
  const { getUserData, getRegiones } = useUsuario()
  const { currentUserData, docentesDeDirectores } = useGlobalContext()
  const { getDirectoresTabla } = useEvaluacionCurricular()
  const [showModal, setShowModal] = useState<boolean>(false)
  const [idUsuario, setIdUsuario] = useState<string>("")
  const [showDeleteUsuario, setShowDeleteUsuario] = useState<boolean>(false)

  // UseEffects for data loading
  useEffect(() => {
    getUserData()
    getRegiones()
  }, [])

  useEffect(() => {
    if (currentUserData.dni) {
      getDirectoresTabla(currentUserData)
    }
  }, [currentUserData.dni])

  const handleShowModalDelete = () => {
    setShowDeleteUsuario(!showDeleteUsuario)
  }

  const handleShowModal = () => {
    setShowModal(!showModal)
  }

  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <>
      <div className={styles.container}>
        {/* Modal for Updating Director */}
        {
          showModal &&
          <UpdateUsuarioDirector idUsuario={idUsuario} handleShowModal={handleShowModal} />
        }

        {/* Modal for Deleting Director */}
        {
          showDeleteUsuario &&
          <DeleteUsuario idUsuario={idUsuario} handleShowModalDelete={handleShowModalDelete} />
        }

        {/* Modal for Creating Director */}
        {showCreateModal && (
          <DirectorModal onClose={() => setShowCreateModal(false)} />
        )}

        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1 className={styles.pageTitle}>Directivos</h1>
            <p className={styles.pageSubtitle}>Administra y registra a los directores de la institución</p>
          </div>
          <button
            className={styles.addBtn}
            onClick={() => setShowCreateModal(true)}
          >
            <RiAddLine size={24} />
            <span>Registrar Director</span>
          </button>
        </div>

        <div className={styles.mainContent}>
          <TablaDirectores rol={2} docentesDeDirectores={docentesDeDirectores} />
        </div>

        <div id="portal-modal" />
      </div>
    </>
  )
}

export default AgregarDirectores
AgregarDirectores.Auth = PrivateRouteEspecialista