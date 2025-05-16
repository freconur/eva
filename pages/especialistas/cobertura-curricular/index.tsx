import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import header from '../../../assets/evaluacion-docente.jpg'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import DeleteEvaluacionDocente from '@/modals/DeleteEvaluacionDocente'
import Link from 'next/link'
import { RiLoader4Line } from 'react-icons/ri'
import CrearEvaluacionCurricular from '@/modals/mallaCurricular/crearEvaluacion'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'
import AgregarPreguntasAlternativasCurricular from '@/modals/mallaCurricular/AgregarPreguntasAlternativas'
import styles from './index.module.css'
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista'
import TablasEvaluaciones from '@/components/curricular/tablas/tablas-evaluaciones-curricular/tablasEvaluaciones'
import TablaUsuarios from '@/components/curricular/tablas/tablaUsuarios'
import TablasEvaluacionesDirectores from '@/components/curricular/tablas/tec-directores/tablasEvaluaciones'

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
  const { getEvaluacionCurricular, getDocentesFromDirectores, getDirectorFromEspecialistaCurricular } = useEvaluacionCurricular()
  const handleShowModalCrearEvaluacion = () => {
    setShowCrearEvaluacion(!showModalCrearEvaluacion)
  }

  useEffect(() => {
    getEvaluacionCurricular()
    getDocentesFromDirectores(Number(currentUserData.region), `${currentUserData.dniDirector}`)


    /* getDirectorFromEspecialistaCurricular(Number(currentUserData.region)) */
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
            {
              currentUserData.rol === 4 ?
                <>
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
                </>
                :
                null
            }
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
              <TablasEvaluacionesDirectores evaluacionCurricular={evaluacionCurricular} />
              {
                currentUserData.rol === 4 ?
                  null
                  :
                  <TablaUsuarios rol={2} docentesDeDirectores={docentesDeDirectores} />
              }
            </div>
          </>
      }
    </div>
  )
}

export default CoberturaCurricular
CoberturaCurricular.Auth = PrivateRouteEspecialista