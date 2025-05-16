import Image from 'next/image'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import header from '../../../../assets/evaluacion-docente.jpg'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { MdEditSquare } from 'react-icons/md'
import { PRDocentes } from '@/features/types/types'
import Link from 'next/link'
import { RiLoader4Line } from 'react-icons/ri'
import UseEvaluacionDirectores from '@/features/hooks/UseEvaluacionDirectores'
import styles from './evaluacion.module.css'
import AgregarPreguntasRespuestasDirectores from '@/modals/AgregarPreguntasRespuestasDirectores'
import UpdatePreguntaRespuestaDirector from '@/modals/updatePrDirectores'
import EvaluarDirector from '@/modals/evaluarDirector'
import RubricaMonitoreo from '@/components/rubrica-monitoreo'
const EvaluacionDirector = () => {
  const [showAgregarPreguntas, setShowAgregarPreguntas] = useState<boolean>(false)
  const router = useRouter()
  const { getPreguntaRespuestaDocentes, dataEvaluacionDocente, currentUserData, loaderPages, dataDirector, warningDataDocente } = useGlobalContext()
  const { getPreguntasRespuestasDirectores, getDataEvaluacion, buscarDirector } = UseEvaluacionDirectores()
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false)
  const [valueDni, setValueDni] = useState<string>("")
  const [showEvaluarDocente, setShowEvaluarDocente] = useState<boolean>(false)
  const [dataUpdate, setDataUpdate] = useState<PRDocentes>({})
  const handleShowModalPreguntas = () => {
    setShowAgregarPreguntas(!showAgregarPreguntas)
  }
  const handleShowUpdateModal = () => {
    setShowUpdateModal(!showUpdateModal)
  }
  const handleShowEvaluarDocente = () => {
    setShowEvaluarDocente(!showEvaluarDocente)
  }
  const handleChangeDniDocente = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueDni(e.target.value)
  }
  useEffect(() => {
    if (valueDni.toString().length === 8) {
      buscarDirector(`${valueDni}`)
    }
  }, [valueDni])
  useEffect(() => {
    getDataEvaluacion(`${router.query.id}`)
    getPreguntasRespuestasDirectores(`${router.query.id}`)
  }, [`${router.query.id}`])

  console.log('dataDirector', dataDirector)
  return (
    <div>
      {showUpdateModal && <UpdatePreguntaRespuestaDirector id={`${router.query.id}`} dataUpdate={dataUpdate} handleShowUpdateModal={handleShowUpdateModal} />}
      {showEvaluarDocente && <EvaluarDirector handleShowEvaluarDocente={handleShowEvaluarDocente} id={`${router.query.id}`} getPreguntaRespuestaDocentes={getPreguntaRespuestaDocentes} />}
      {showAgregarPreguntas && <AgregarPreguntasRespuestasDirectores idEvaluacion={`${router.query.id}`} handleShowModalPreguntas={handleShowModalPreguntas} />}
      <div className={styles.header}>
        <div className={styles.headerOverlay}></div>

        <Image
          // className='absolute bottom-0 top-[-250px] right-0 left-0 z-1 opacity-1'
          className={styles.headerImage}
          src={header}
          alt="imagen de cabecera"
          objectFit='fill'
          priority
        />
        <div className={styles.headerContent}>
          {/* //RÚBRICA DE MONITOREO DE LA PRÁCTICA PEDAGÓGICA DE LA MEDIACIÓN DIDÁCTICA DE LA LECTURA Y MATEMÁTICA */}
          <h1 className={styles.headerTitle}>Rúbrica de monitoreo de la práctica pedagógica de la mediación didáctica de la {dataEvaluacionDocente?.name?.toLocaleLowerCase()}</h1>
          <div className={styles.searchContainer}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="DNI DE DIRECTOR"
              onChange={handleChangeDniDocente}
            />
            {
              dataDirector.dni ?
                <Link href={`reporte-director-individual?idEvaluacion=${router.query.id}&idDirector=${dataDirector.dni}`} className={styles.docenteInfo}>
                  <div className={styles.docenteInfoItem}>
                    <span className={styles.docenteInfoLabel}>DNI:</span> {dataDirector.dni}</div>
                  <div className={styles.docenteInfoItem}>
                    <span className={styles.docenteInfoLabel}>Nombres:</span> {dataDirector.nombres} {dataDirector.apellidos}
                  </div>
                </Link>
                :
                <div className='flex justify-center items-center'>
                  <p className="text-white">{warningDataDocente}</p>
                </div>
            }
          </div>
        </div>
        <div className={styles.headerButtons}>
          {
            currentUserData.rol === 4 ?
            <button
              onClick={() => handleShowModalPreguntas()}
              className={styles.headerButton}
            >Agregar preguntas</button>
            :
            null
          }
          <button
            onClick={handleShowEvaluarDocente}
            className={styles.headerButton}
          >Evaluar director</button>
          {/* <button onClick={() => handleShowModalPreguntas()} className='h-[50px] relative z-[30] p-3 bg-gradient-to-r from-tere to-gg-3  text-textTitulos  rounded-sm drop-shadow-lg '>Reporte ugel</button> */}
          {/* <button className='h-[50px] relative z-[30] p-3 bg-gradient-to-r from-amarilloLogo to-tableEstandares4  text-textTitulos  rounded-sm drop-shadow-lg '>Reporte ugel</button> */}
          <Link className={styles.headerButton} href={`reporte?idEvaluacion=${router.query.id}`}>
            Reporte
          </Link>
          {/* //estes boton me tendria que llevar a la pagina de reportes ya no abre un modal */}

        </div>

      </div>
      <div className='p-20'>
        {
          loaderPages
            ?
            <div className="flex w-full mt-5 items-center m-auto justify-center">
              <RiLoader4Line className="animate-spin text-3xl text-slate-500 " />
              <p className="text-slate-500">buscando resultados...</p>
            </div>
            :
            <RubricaMonitoreo rol={currentUserData?.rol || 0} handleShowUpdateModal={handleShowUpdateModal} setDataUpdate={setDataUpdate} getPreguntaRespuestaDocentes={getPreguntaRespuestaDocentes} />
            
        }
      </div>
    </div>
  )
}

export default EvaluacionDirector