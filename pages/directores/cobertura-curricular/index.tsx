import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import header from '../../../assets/evaluacion-docente.jpg'
import CrearEvaluacionDocente from '@/modals/crearEvaluacionDocente'
import UseEvaluacionDocentes from '@/features/hooks/UseEvaluacionDocentes'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { MdDeleteForever, MdEditSquare } from 'react-icons/md'
import DeleteEvaluacionDocente from '@/modals/DeleteEvaluacionDocente'
import Link from 'next/link'
import { RiLoader4Line } from 'react-icons/ri'
import CrearEvaluacionCurricular from '@/modals/mallaCurricular/crearEvaluacion'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'
import AgregarPreguntasAlternativasCurricular from '@/modals/mallaCurricular/AgregarPreguntasAlternativas'
import styles from '@/styles/coberturaCurricular.module.css'

const CoberturaCurricular = () => {
  const { evaluacionCurricular, loaderPages, docentesDeDirectores, currentUserData } = useGlobalContext()
  const [showModalCrearEvaluacion, setShowCrearEvaluacion] = useState<boolean>(false)
  const [idEva, setIdEva] = useState<string>("")
  const [nameEva, setNameEva] = useState<string>("")
  const [showPreguntasAlternativas, setShowPreguntasAlternativas] = useState<boolean>(false)
  const [showDelete, setShowDelete] = useState<boolean>(false)
  const [inputUpdate, setInputUpdate] = useState<boolean>(false)
  const handleShowInputUpdate = () => { setInputUpdate(!inputUpdate) }
  const handleShowModalDelete = () => { setShowDelete(!showDelete) }
  const handleShowModalPreguntasAlternativas = () => { setShowPreguntasAlternativas(!showPreguntasAlternativas) }
  const { getEvaluacionCurricular, getDocentesFromDirectores } = useEvaluacionCurricular()
  const handleShowModalCrearEvaluacion = () => {
    setShowCrearEvaluacion(!showModalCrearEvaluacion)
  }

  useEffect(() => {
    getEvaluacionCurricular()
    getDocentesFromDirectores(`${currentUserData.dniDirector}`)
  }, [currentUserData.dni])
  return (
    <div>
      {
        showPreguntasAlternativas && <AgregarPreguntasAlternativasCurricular handleShowModalPreguntasAlternativas={handleShowModalPreguntasAlternativas} idEvaluacion={idEva} />
      }
      {showDelete && <DeleteEvaluacionDocente handleShowModalDelete={handleShowModalDelete} idEva={idEva} />}
      {showModalCrearEvaluacion && <CrearEvaluacionCurricular handleShowModalCrearEvaluacion={handleShowModalCrearEvaluacion} />}

      <div className={styles.header}>
        <div className={styles.headerOverlay}></div>
        
        <Image
          className={styles.headerImage}
          src={header}
          alt="imagen de cabecera"
          priority
        />
        
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>
            Monitoreo a las prácticas pedagógicas
          </h1>
          
          <div className={styles.headerButtons}>
            <button 
              onClick={handleShowModalCrearEvaluacion} 
              className={styles.headerButton}
            >
              Crear instrumento de monitoreo
            </button>
            <button 
              onClick={handleShowModalPreguntasAlternativas} 
              className={styles.headerButton}
            >
              Agregar
            </button>
          </div>
        </div>
      </div>

      {
        loaderPages ?
          <div className={styles.loaderContainer}>
            <RiLoader4Line className={styles.loaderIcon} />
            <p className={styles.loaderText}>buscando resultados...</p>
          </div>
          :
          <>
            <div className={styles.tableContainer}>
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
                            <td className={styles.tableCell}>
                              <div className={styles.tableActions}>
                                <MdEditSquare 
                                  onClick={() => { setNameEva(`${evaluacion.name}`); handleShowInputUpdate(); setIdEva(`${evaluacion.id}`) }} 
                                  className={`${styles.actionIcon} ${styles.editIcon}`}
                                />
                                <MdDeleteForever 
                                  onClick={() => { handleShowModalDelete(); setIdEva(`${evaluacion.id}`) }} 
                                  className={`${styles.actionIcon} ${styles.deleteIcon}`}
                                />
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    }
                  </tbody>
                </table>
              </div>

              <div className={styles.tableSection}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionTitleIndicator}></span>
                  Docentes
                </h2>
                <table className={styles.table}>
                  <thead className={styles.tableHeader}>
                    <tr>
                      <th>#</th>
                      <th>Docente</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {
                      docentesDeDirectores?.map((director, index) => {
                        return (
                          <tr key={index} className={styles.tableRow}>
                            <td className={styles.tableCell}>
                              <Link href={`/directores/cobertura-curricular/curricular/evaluar-curricula?idDocente=${director.dni}`} className={styles.tableLink}>
                                {index + 1}
                              </Link>
                            </td>
                            <td className={styles.tableCell}>
                              <Link href={`/directores/cobertura-curricular/curricular/evaluar-curricula?idDocente=${director.dni}`} className={styles.tableLink}>
                                {director.nombres} {director.apellidos}
                              </Link>
                            </td>
                          </tr>
                        )
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </>
      }
    </div>
  )
}

export default CoberturaCurricular
CoberturaCurricular.Auth = PrivateRouteDirectores