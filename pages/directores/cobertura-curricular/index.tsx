import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import header from '../../../assets/evaluacion-docente.jpg'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import DeleteEvaluacionDocente from '@/modals/DeleteEvaluacionDocente'
import { RiLoader4Line } from 'react-icons/ri'
import CrearEvaluacionCurricular from '@/modals/mallaCurricular/crearEvaluacion'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'
import AgregarPreguntasAlternativasCurricular from '@/modals/mallaCurricular/AgregarPreguntasAlternativas'
import styles from './index.module.css'
import TablaUsuarios from '@/components/curricular/tablas/tablaUsuarios'
import TablasEvaluacionesDocentes from '@/components/curricular/tablas/tec-docentes/tablasEvaluaciones'
import Link from 'next/link'

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
  const { getEvaluacionCurricular, getDocentesFromDirectores, getDocentesToTable } = useEvaluacionCurricular()
  const handleShowModalCrearEvaluacion = () => {
    setShowCrearEvaluacion(!showModalCrearEvaluacion)
  }

  useEffect(() => {
    getEvaluacionCurricular()
    getDocentesToTable(`${currentUserData.dni}`)
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

          {
            currentUserData.perfil?.rol === 4 ?
              <>
                <div className={styles.headerButtons}>
                  <button
                    onClick={handleShowModalCrearEvaluacion}
                    className={styles.headerButton}
                  >
                    Crear instrumento de monitoreo
                  </button>
                  {/* <button 
              onClick={handleShowModalPreguntasAlternativas} 
              className={styles.headerButton}
            >
              Agregar
            </button> */}
                  <Link
                    href="/admin/estandares"
                    /* onClick={handleShowModalPreguntasAlternativas}  */
                    className={styles.headerButton}
                  >
                    Estandares
                  </Link>
                </div>
              </>
              :
              null
          }
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
              <TablasEvaluacionesDocentes evaluacionCurricular={evaluacionCurricular} />
              {
                currentUserData.perfil?.rol === 4 ?
                  null
                  :
                  <TablaUsuarios rol={3} docentesDeDirectores={docentesDeDirectores} />
              }
              {/* <div className={styles.tableSection}>
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
                            <td>
                              <Link href={`/directores/cobertura-curricular/reporte?idCurricular=${evaluacion.id}`} className={styles.tableLink}>reporte</Link>
                            </td>
                            {
                              currentUserData.perfil?.rol === 4 ? 
                              <>
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
                              </>
                            :
                            null
                            }
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
              </div> */}
            </div>
          </>
      }
    </div>
  )
}

export default CoberturaCurricular
CoberturaCurricular.Auth = PrivateRouteDirectores