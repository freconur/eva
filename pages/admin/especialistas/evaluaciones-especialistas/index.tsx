import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import header from '@/assets/evaluacion-docente.jpg'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { MdDeleteForever, MdEditSquare, MdAddCircle, MdVisibility, MdVisibilityOff } from 'react-icons/md'
import Link from 'next/link'
import { RiLoader4Line } from 'react-icons/ri'
import CrearEvaluacionEspecialista from '@/modals/crearEvaluacionEspecialista'
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas'
import DeleteEvaluacionEspecialista from '@/modals/DeleteEvaluacionEscpecialista'
import styles from './evaluaciones-especialistas.module.css'
import UpdateEvaluacionEspecialista from '@/modals/updateEvaluacionEspecialista'
import { CrearEvaluacionDocente } from '@/features/types/types'

const EvaluacionesDesempeñoDocentes = () => {
  const { getEvaluacionesEspecialistas, updateEstadoEvaluacion } = UseEvaluacionEspecialistas()
  const { evaluacionDesempeñoDocente, loaderPages } = useGlobalContext()
  const [showModalCrearEvaluacion, setShowCrearEvaluacion] = useState<boolean>(false)
  const [idEva, setIdEva] = useState<string>("")
  const [evaluacion, setEvaluacion] = useState<CrearEvaluacionDocente>({})
  const [showDelete, setShowDelete] = useState<boolean>(false)
  const [inputUpdate, setInputUpdate] = useState<boolean>(false)

  const handleShowInputUpdate = () => { setInputUpdate(!inputUpdate) }
  const handleShowModalDelete = () => { setShowDelete(!showDelete) }
  const handleShowModalCrearEvaluacion = () => {
    setShowCrearEvaluacion(!showModalCrearEvaluacion)
  }

  useEffect(() => {
    getEvaluacionesEspecialistas()
  }, [])

  return (
    <div className={styles.container}>
      {showDelete && <DeleteEvaluacionEspecialista handleShowModalDelete={handleShowModalDelete} idEva={idEva} />}
      {showModalCrearEvaluacion && <CrearEvaluacionEspecialista handleShowModalCrearEvaluacion={handleShowModalCrearEvaluacion} />}
      {inputUpdate && <UpdateEvaluacionEspecialista handleShowInputUpdate={handleShowInputUpdate} evaluacion={evaluacion} />}

      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Evaluaciones de Especialistas</h1>
        <button
          onClick={handleShowModalCrearEvaluacion}
          className={styles.createButton}
          title="Crear Evaluación"
          aria-label="Crear Evaluación"
        >
          <MdAddCircle className={styles.createIcon} />
        </button>
      </header>

      {loaderPages ? (
        <div className={styles.loaderContainer}>
          <RiLoader4Line className={styles.loaderIcon} />
          <p className={styles.loaderText}>Buscando resultados...</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr className={styles.tableHeaderRow}>
                <th className={`${styles.tableHeaderCell} ${styles.tableHeaderCellNumber}`}>#</th>
                <th className={styles.tableHeaderCell}>Nombre de Evaluación</th>
                <th className={styles.tableHeaderCell}>Categoría</th>
                <th className={styles.tableHeaderCell}>Activo</th>
                <th className={styles.tableHeaderCell}></th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {evaluacionDesempeñoDocente?.map((evaluacion, index) => (
                <tr key={evaluacion.id || index} className={styles.tableRow}>
                  <td className={`${styles.tableCell} ${styles.tableCellNumber}`}>
                    {index + 1}
                  </td>
                  <td className={styles.tableCell}>
                    <Link
                      href={`/admin/especialistas/evaluaciones-especialistas/evaluacion/${evaluacion.id}`}
                      className={styles.tableCellLink}
                    >
                      {evaluacion.name}
                    </Link>
                  </td>
                  <td className={styles.tableCell}>
                    <span className={styles.categoryBadge}>
                      {evaluacion.categoria}
                    </span>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.actionsCell} style={{ justifyContent: 'center' }}>
                      {evaluacion.active ? (
                        <MdVisibility
                          onClick={() => updateEstadoEvaluacion(evaluacion.id!, false)}
                          className={`${styles.actionIcon} ${styles.viewIcon}`}
                          title="Desactivar (Ocultar para especialistas)"
                        />
                      ) : (
                        <MdVisibilityOff
                          onClick={() => updateEstadoEvaluacion(evaluacion.id!, true)}
                          className={`${styles.actionIcon} ${styles.viewOffIcon}`}
                          title="Activar (Visible para especialistas)"
                        />
                      )}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.actionsCell}>
                      <MdEditSquare
                        onClick={() => {
                          handleShowInputUpdate()
                          setEvaluacion(evaluacion)
                        }}
                        className={`${styles.actionIcon} ${styles.editIcon}`}
                        title="Editar"
                      />
                      <MdDeleteForever
                        onClick={() => {
                          handleShowModalDelete()
                          setIdEva(`${evaluacion.id}`)
                        }}
                        className={`${styles.actionIcon} ${styles.deleteIcon}`}
                        title="Eliminar"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default EvaluacionesDesempeñoDocentes
// EvaluacionesDesempeñoDocentes.Auth = PrivateRouteAdmins