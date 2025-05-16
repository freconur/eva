import Image from 'next/image'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import header from '../../../../assets/evaluacion-docente.jpg'
import AgregarPreguntasRespuestasDocentes from '@/modals/AgregarPreguntasRespuestasDocentes'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import UseEvaluacionDocentes from '@/features/hooks/UseEvaluacionDocentes'
import { MdEditSquare } from 'react-icons/md'
import UpdatePreguntaRespuestaDocente from '@/modals/updatePrDocentes'
import { PRDocentes } from '@/features/types/types'
import EvaluarDocente from '@/modals/evaluarDocente'
import Link from 'next/link'
import { RiLoader4Line } from 'react-icons/ri'
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores'
import styles from '@/styles/coberturaCurricular.module.css'
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista'
import EvaluarDocenteToEspecialista from '@/modals/evaluarDocenteToEspecialista'

const EvaluacionDocente = () => {
  const [showAgregarPreguntas, setShowAgregarPreguntas] = useState<boolean>(false)
  const router = useRouter()
  const { getPreguntaRespuestaDocentes, dataEvaluacionDocente, dataDocente, loaderPages } = useGlobalContext()
  const { getPreguntasRespuestasDocentes, getDataEvaluacion, buscarDocenteToEspecialista } = UseEvaluacionDocentes()
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false)
  const [valueDni, setValueDni] = useState("")
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
      buscarDocenteToEspecialista(`${valueDni}`)
    }
  }, [valueDni])

  useEffect(() => {
    getDataEvaluacion(`${router.query.id}`)
    getPreguntasRespuestasDocentes(`${router.query.id}`)
  }, [`${router.query.id}`])

  return (
    <div>
      {showUpdateModal && <UpdatePreguntaRespuestaDocente id={`${router.query.id}`} dataUpdate={dataUpdate} handleShowUpdateModal={handleShowUpdateModal} />}
      {showEvaluarDocente && <EvaluarDocenteToEspecialista handleShowEvaluarDocente={handleShowEvaluarDocente} id={`${router.query.id}`} getPreguntaRespuestaDocentes={getPreguntaRespuestaDocentes} />}
      {showAgregarPreguntas && <AgregarPreguntasRespuestasDocentes idEvaluacion={`${router.query.id}`} handleShowModalPreguntas={handleShowModalPreguntas} />}

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
          Rúbrica de la mediación didáctica de la {dataEvaluacionDocente?.name?.toLocaleLowerCase()}
          </h1>
          
          <div className={styles.searchContainer}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="DNI DE DOCENTE"
              onChange={handleChangeDniDocente}
            />
            {dataDocente.dni && (
              <Link 
                href={`reporte-docente-individual?idDocente=${dataDocente.dni}&idEvaluacion=${router.query.id}`} 
                className={styles.docenteInfo}
              >
                <div className={styles.docenteInfoItem}>
                  <span className={styles.docenteInfoLabel}>DNI:</span> {dataDocente.dni}
                </div>
                <div className={styles.docenteInfoItem}>
                  <span className={styles.docenteInfoLabel}>Nombres:</span> {dataDocente.nombres} {dataDocente.apellidos}
                </div>
              </Link>
            )}
          </div>

          <div className={styles.headerButtons}>
            {/* <button 
              onClick={handleShowModalPreguntas}
              className={styles.headerButton}
            >
              Agregar preguntas
            </button> */}
            <button 
              onClick={handleShowEvaluarDocente}
              className={styles.headerButton}
            >
              Monitorear docente
            </button>
            <Link 
              href={`reporte?idEvaluacion=${router.query.id}`}
              className={styles.headerButton}
            >
              Reporte
            </Link>
          </div>
        </div>
      </div>

      {loaderPages ? (
        <div className={styles.loaderContainer}>
          <RiLoader4Line className={styles.loaderIcon} />
          <p className={styles.loaderText}>Buscando resultados...</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <div className={styles.tableSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionTitleIndicator}></span>
              Preguntas y Respuestas
            </h2>
            
            <div className={styles.preguntasContainer}>
              {getPreguntaRespuestaDocentes?.map((pq, index) => (
                <div key={index} className={styles.preguntaCard}>
                  <div className={styles.preguntaHeader}>
                    <div className={styles.preguntaTitle}>
                      <span className={styles.preguntaNumber}>{pq.subOrden || pq.id}.</span>
                      <h3 className={styles.preguntaText}>{pq.criterio}</h3>
                    </div>
                    {/* <button 
                      onClick={() => { handleShowUpdateModal(); setDataUpdate(pq) }}
                      className={`${styles.actionIcon} ${styles.editIcon}`}
                    >
                      <MdEditSquare className={styles.editIcon} />
                    </button> */}
                  </div>
                  
                  <ul className={styles.alternativasList}>
                    {pq.alternativas?.map((alt, index) => (
                      <li key={index} className={styles.alternativaItem}>
                        <span className={styles.alternativaNumber}>{alt.alternativa}.</span>
                        <p className={styles.alternativaText}>{alt.descripcion}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EvaluacionDocente
EvaluacionDocente.Auth = PrivateRouteEspecialista