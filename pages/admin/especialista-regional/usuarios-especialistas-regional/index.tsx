import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { HiPlus, HiChartBar } from 'react-icons/hi'
import styles from './especialistaRegionales.module.css'
import ModalAgregarEspecialista, { EspecialistaData } from './ModalAgregarEspecialista'
import ModalEditarEspecialista from './ModalEditarEspecialista'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../../../../firebase/firebase.config'
import { useEspecialistasRegionales } from '@/features/hooks/useEspecialistasRegionales'
import { User } from '@/features/types/types'

const EspecialistaRegionales = () => {
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEspecialista, setSelectedEspecialista] = useState<User | null>(null)
  const { createEspecialistaRegional, warningMessage, setWarningMessage, getEspecialistasRegionales, especialistasRegionales, updateEspecialistaRegional, deleteEspecialistaRegional } = useEspecialistasRegionales()
  const handleCreateEspecialista = async (data: EspecialistaData) => {
    try {
      // Guardar el especialista en Firebase
      await createEspecialistaRegional(data)
      
      console.log('Especialista creado con ID:', data.dni)
      
    } catch (error) {
      console.error('Error al crear especialista:', error)
      throw error // Re-lanzar el error para que el modal lo maneje
    }
  }

  const handleSuccess = () => {
    alert('Especialista creado exitosamente')
    // Aquí puedes agregar más lógica después del éxito
    // Por ejemplo: refrescar la lista, mostrar notificación, etc.
  }

  const handleError = (error: Error) => {
    alert(`Error al crear el especialista: ${error.message}`)
    // Aquí puedes agregar más lógica de manejo de errores
    // Por ejemplo: logging, notificaciones específicas, etc.
  }

  const handleEditEspecialista = (especialista: User) => {
    setSelectedEspecialista(especialista)
    setShowEditModal(true)
  }

  const handleUpdateEspecialista = async (dni: string, data: User) => {
    try {
      await updateEspecialistaRegional(dni, data)
      alert('Especialista actualizado exitosamente')
    } catch (error) {
      console.error('Error al actualizar especialista:', error)
      throw error
    }
  }

  const handleDeleteEspecialista = async (dni: string) => {
    try {
      await deleteEspecialistaRegional(dni)
      alert('Especialista eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar especialista:', error)
      throw error
    }
  }

  const handleEditSuccess = () => {
    setShowEditModal(false)
    setSelectedEspecialista(null)
  }

  const handleEditError = (error: Error) => {
    alert(`Error: ${error.message}`)
  }

  useEffect(() => {
    getEspecialistasRegionales()
  }, [])
  return (
    <div>
      <section className={styles.header}>
        <div className={styles.headerContent}>
          <nav className={styles.breadcrumb}>
            <a href="/admin" className={styles.breadcrumbItem}>Admin</a>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbItem}>Especialistas Regionales</span>
          </nav>
          
          <div className={styles.titleContainer}>
            <h1 className={styles.title}>Especialistas Regionales</h1>
            <p className={styles.subtitle}>Gestión de especialistas regionales del sistema</p>
            
            <div className={styles.titleButtons}>
              <button 
                className={styles.addButton}
                onClick={() => setShowModal(true)}
              >
                <HiPlus className={styles.addIcon} />
                Agregar Especialista
              </button>
              <Link href="/admin/especialista-regional/usuarios-especialistas-regional/reporte">
                <button className={styles.reportButton}>
                  <HiChartBar className={styles.addIcon} />
                  Reporte
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Tabla de especialistas regionales */}
      <section className={styles.tableSection}>
        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>Lista de Especialistas Regionales</h2>
            <p className={styles.tableSubtitle}>
              Total de especialistas: {especialistasRegionales.length}
            </p>
          </div>
          
          {especialistasRegionales.length > 0 ? (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th className={styles.th}>DNI</th>
                    <th className={styles.th}>Nombres</th>
                    <th className={styles.th}>Apellidos</th>
                    <th className={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {especialistasRegionales.map((especialista, index) => (
                    <tr key={especialista.dni || index} className={styles.tableRow}>
                      <td className={styles.td}>{especialista.dni || 'N/A'}</td>
                      <td className={styles.td}>{especialista.nombres || 'N/A'}</td>
                      <td className={styles.td}>{especialista.apellidos || 'N/A'}</td>
                      <td className={styles.td}>
                        <div className={styles.actionButtons}>
                          <button 
                            className={styles.editButton}
                            onClick={() => handleEditEspecialista(especialista)}
                          >
                            Editar
                          </button>
                          <button 
                            className={styles.deleteButton}
                            onClick={() => {
                              if (confirm(`¿Estás seguro de que quieres eliminar a ${especialista.nombres} ${especialista.apellidos}?`)) {
                                handleDeleteEspecialista(especialista.dni || '')
                              }
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyMessage}>
                No hay especialistas regionales registrados
              </p>
              <p className={styles.emptySubMessage}>
                Haz clic en "Agregar Especialista" para crear el primero
              </p>
            </div>
          )}
        </div>
      </section>
      
      {/* Modal para agregar especialista */}
      <ModalAgregarEspecialista
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateEspecialista}
        onSuccess={handleSuccess}
        onError={handleError}
        warningMessage={warningMessage}
        setWarningMessage={setWarningMessage}
      />
      
      {/* Modal para editar especialista */}
      <ModalEditarEspecialista
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedEspecialista(null)
        }}
        onUpdate={handleUpdateEspecialista}
        onDelete={handleDeleteEspecialista}
        onSuccess={handleEditSuccess}
        onError={handleEditError}
        especialista={selectedEspecialista}
        warningMessage={warningMessage}
        setWarningMessage={setWarningMessage}
      />
    </div>
  )
}

export default EspecialistaRegionales