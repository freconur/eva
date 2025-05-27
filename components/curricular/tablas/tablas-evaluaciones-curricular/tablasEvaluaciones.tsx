import { EvaluacionCurricular } from '@/features/types/types'
import React, { useState } from 'react'
import Link from 'next/link'
import styles from './tablasEvaluaciones.module.css'
import { convertRolToPath } from '@/fuctions/regiones'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { MdDeleteForever, MdEditSquare } from 'react-icons/md'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'

interface TablasEvaluacionesProps {
  evaluacionCurricular: EvaluacionCurricular[],
}

const TablasEvaluaciones = ({ evaluacionCurricular }: TablasEvaluacionesProps) => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvaluacion, setSelectedEvaluacion] = useState<EvaluacionCurricular | null>(null);
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { deleteEvaluacionCurricular, updateEvaluacionCurricular } = useEvaluacionCurricular()

  const handleUpdate = (evaluacion: EvaluacionCurricular) => {
    setSelectedEvaluacion(evaluacion);
    setNewName(evaluacion.name || '');
    setShowUpdateModal(true);
  };

  const handleDelete = (evaluacion: EvaluacionCurricular) => {
    setSelectedEvaluacion(evaluacion);
    setShowDeleteModal(true);
  };

  const handleUpdateSubmit = async () => {
    if (selectedEvaluacion?.id) {
      setIsLoading(true);
      const success = await updateEvaluacionCurricular(selectedEvaluacion.id, { name: newName });
      if (success) {
        setShowUpdateModal(false);
      } else {
        console.error('Error al actualizar la evaluación');
      }
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedEvaluacion?.id) {
      setIsLoading(true);
      const success = await deleteEvaluacionCurricular(selectedEvaluacion.id);
      if (success) {
        setShowDeleteModal(false);
      } else {
        console.error('Error al eliminar la evaluación');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.tableSection}>
      <h2 className={styles.sectionTitle}>
        <span className={styles.sectionTitleIndicator}></span>
        Unidades didácticas
      </h2>
      <table className={styles.table}>
        <thead className={styles.tableHeader}>
          <tr>
            <th>#</th>
            <th>Nombre de evaluación</th>
            <th>Acciones</th>
            <th></th>
          </tr>
        </thead>
        <tbody className={styles.tableBody}>
          {
            evaluacionCurricular?.map((evaluacion, index) => {
              return (
                <tr key={index} className={styles.tableRow}>
                  <td className={styles.tableCell}>
                    <Link href="" className={styles.tableLink}>
                      {index + 1}
                    </Link>
                  </td>
                  <td className={styles.tableCell}>
                    <Link href="" className={styles.tableLink}>
                      {evaluacion.name?.toUpperCase()}
                    </Link>
                  </td>
                  {/* <td>
                    <Link href={`/${convertRolToPath(rol)}/cobertura-curricular/reporte?idCurricular=${evaluacion.id}`} className={styles.tableLink}>reporte</Link>
                  </td> */}
                  <td>
                    <Link href={`/admin/especialistas/cobertura-curricular/reporte?idCurricular=${evaluacion.id}`} className={styles.tableLink}>reporte</Link>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.tableActions}>
                      <MdEditSquare
                        className={`${styles.actionIcon} ${styles.editIcon}`}
                        onClick={() => handleUpdate(evaluacion)}
                      />
                      <MdDeleteForever
                        className={`${styles.actionIcon} ${styles.deleteIcon}`}
                        onClick={() => handleDelete(evaluacion)}
                      />
                    </div>
                  </td>
                </tr>
              )
            })
          }
        </tbody>
      </table>

      {/* Modal de Actualización */}
      {showUpdateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Actualizar Evaluación</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nuevo nombre de la evaluación"
              className={styles.modalInput}
            />
            <div className={styles.modalActions}>
              <button 
                onClick={() => setShowUpdateModal(false)} 
                className={styles.modalButtonCancel}
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button 
                onClick={handleUpdateSubmit} 
                className={styles.modalButtonConfirm}
                disabled={isLoading}
              >
                {isLoading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Eliminación */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Confirmar Eliminación</h3>
            <p>{`¿Estás seguro que deseas eliminar la evaluación ${selectedEvaluacion?.name}?`}</p>
            <div className={styles.modalActions}>
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className={styles.modalButtonCancel}
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteConfirm} 
                className={styles.modalButtonDelete}
                disabled={isLoading}
              >
                {isLoading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TablasEvaluaciones