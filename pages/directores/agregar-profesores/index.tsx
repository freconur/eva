import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import useUsuario from '@/features/hooks/useUsuario'
import React, { useEffect, useState } from 'react'
import { RiAddLine, RiLoader4Line, RiUserFollowLine, RiUserSearchLine } from 'react-icons/ri'
import styles from './styles.module.css'
import { useDirectores } from '@/features/hooks/useDirectores'
import UsuariosByRol from '@/components/usuariosByRol'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import DocenteModal from '@/components/modals/DocenteModal'
import ReclamarDocenteModal from '@/components/modals/ReclamarDocenteModal'
import { User } from '@/features/types/types'
import { toast } from 'react-toastify'

const AgregarDirectores = () => {
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'asignados' | 'coincidentes'>('asignados')
  const [docentesCoincidentes, setDocentesCoincidentes] = useState<User[]>([])
  const [loadingCoincidentes, setLoadingCoincidentes] = useState<boolean>(true)
  const [selectedDocenteToReclamar, setSelectedDocenteToReclamar] = useState<User | null>(null)

  const { getUserData } = useUsuario()
  const { currentUserData, usuariosByRol } = useGlobalContext()
  const { getDocentesByDniDirector, getDocentesCoincidentesByNombreApellido, reclamarDocente } = useDirectores()
  const { getGrades } = useAgregarEvaluaciones()

  useEffect(() => {
    getUserData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (currentUserData?.dni) {
      getDocentesByDniDirector(`${currentUserData.dni}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserData?.dni])

  useEffect(() => {
    getGrades()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Clave estable basada en la lista de DNIs/identificadores para evitar peticiones duplicadas o bucles infinitos
  const usuariosByRolKey = JSON.stringify(
    (usuariosByRol || []).map(u => u.dni || `${u.nombres}-${u.apellidos}`)
  )

  useEffect(() => {
    if (usuariosByRol && usuariosByRol.length > 0) {
      setLoadingCoincidentes(true)
      getDocentesCoincidentesByNombreApellido(usuariosByRol)
        .then((data) => {
          setDocentesCoincidentes(data)
        })
        .catch((err) => {
          console.error("Error al buscar coincidencias por nombre y apellido:", err)
        })
        .finally(() => {
          setLoadingCoincidentes(false)
        })
    } else {
      setDocentesCoincidentes([])
      setLoadingCoincidentes(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuariosByRolKey])

  const handleConfirmReclamar = async () => {
    if (!selectedDocenteToReclamar || !selectedDocenteToReclamar.dni || !currentUserData?.dni) {
      toast.error('Ocurrió un error al identificar al docente o director.')
      return
    }

    try {
      await reclamarDocente(
        String(selectedDocenteToReclamar.dni),
        String(currentUserData.dni),
        selectedDocenteToReclamar.dniDirector
      )
      toast.success(`Docente ${selectedDocenteToReclamar.nombres} ${selectedDocenteToReclamar.apellidos} reclamado e incorporado exitosamente a tu plantilla académica.`)
      setSelectedDocenteToReclamar(null)
    } catch (error: any) {
      console.error('Error al reclamar docente:', error)
      toast.error(error.message || 'No se pudo reclamar el docente. Intenta nuevamente.')
    }
  }

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
        <div className={styles.tabsContainer}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'asignados' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('asignados')}
          >
            <RiUserFollowLine size={18} />
            <span>Docentes Asignados</span>
            <span className={styles.tabBadge}>{usuariosByRol?.length || 0}</span>
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'coincidentes' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('coincidentes')}
          >
            <RiUserSearchLine size={18} />
            <span>Coincidencias (Nombre/Apellido)</span>
            <span className={styles.tabBadge}>
              {loadingCoincidentes ? (
                <RiLoader4Line className={styles.badgeSpinner} title="Buscando coincidencias..." />
              ) : (
                docentesCoincidentes.length
              )}
            </span>
          </button>
        </div>

        {activeTab === 'asignados' && (
          <UsuariosByRol usuariosByRol={usuariosByRol} />
        )}

        {activeTab === 'coincidentes' && (
          loadingCoincidentes ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner} />
              <p>Buscando coincidencias por nombre y apellido en la base de datos...</p>
            </div>
          ) : (
            <UsuariosByRol
              usuariosByRol={docentesCoincidentes}
              onReclamarDocente={(user) => setSelectedDocenteToReclamar(user)}
            />
          )
        )}
      </div>

      <div id="portal-modal" />

      {showModal && (
        <DocenteModal
          onClose={() => setShowModal(false)}
        />
      )}

      {selectedDocenteToReclamar && (
        <ReclamarDocenteModal
          docente={selectedDocenteToReclamar}
          onClose={() => setSelectedDocenteToReclamar(null)}
          onConfirm={handleConfirmReclamar}
        />
      )}
    </div>
  )
}

export default AgregarDirectores
AgregarDirectores.Auth = PrivateRouteDirectores