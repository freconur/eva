import PrivateRouteAdmin from '@/components/layouts/PrivateRoutesAdmin'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { Alternativas } from '@/features/types/types'
import AgregarPreguntasRespuestas from '@/modals/agregarPreguntasYRespuestas'
import EvaluarEstudiante from '@/modals/evaluarEstudiante'
import UpdatePreguntaRespuesta from '@/modals/updatePreguntaRespuesta'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { MdEditSquare } from 'react-icons/md'
import { RiLoader4Line } from 'react-icons/ri'
import styles from './evaluacion.module.css'

const Evaluacion = () => {
  const route = useRouter()
  const { evaluacion, preguntasRespuestas, currentUserData, loaderPages } = useGlobalContext()
  const { getEvaluacion, getPreguntasRespuestas } = useAgregarEvaluaciones()
  const [showModal, setShowModal] = useState(false)
  const [showModalEstudiante, setShowModalEstudiante] = useState(false)
  const [pregunta, setPregunta] = useState({})
  const [showModalUpdatePReguntaRespuesta, setShowModalUpdatePReguntaRespuesta] = useState(false)

  const handleshowModal = () => {
    setShowModal(!showModal)
  }

  const handleShowModalUpdatePreguntaRespuesta = () => {
    setShowModalUpdatePReguntaRespuesta(!showModalUpdatePReguntaRespuesta)
  }

  const handleSelectPregunta = (index: number) => {
    setPregunta(preguntasRespuestas[index])
  }

  useEffect(() => {
    getEvaluacion(`${route.query.id}`)
    if (route.query.id) {
      getPreguntasRespuestas(`${route.query.id}`)
    }
  }, [route.query.id])

  return (
    <>
      {showModalUpdatePReguntaRespuesta && (
        <UpdatePreguntaRespuesta 
          id={`${route.query.id}`} 
          pregunta={pregunta} 
          handleShowModalUpdatePreguntaRespuesta={handleShowModalUpdatePreguntaRespuesta} 
        />
      )}
      
      {loaderPages ? (
        <div className={styles.loader}>
          <div className={styles.loaderContent}>
            <RiLoader4Line className={styles.loaderIcon} />
            <span className={styles.loaderText}>...cargando</span>
          </div>
        </div>
      ) : (
        <div className={styles.container}>
          <div className={styles.content}>
            <h1 className={styles.title}>{evaluacion.nombre}</h1>
            <div className={styles.actions}>
              {showModal && (
                <AgregarPreguntasRespuestas 
                  id={`${route.query.id}`} 
                  showModal={showModal} 
                  handleshowModal={handleshowModal} 
                />
              )}
              <button onClick={handleshowModal} className={styles.buttonPrimary}>
                agregar preguntas
              </button>
              <Link 
                href={`reporte?id=${currentUserData.dni}&idEvaluacion=${route.query.id}`} 
                className={styles.buttonSecondary}
              >
                reporte de evaluación
              </Link>
            </div>
            
            <h2 className={styles.sectionTitle}>preguntas y respuestas</h2>
            <ul className={styles.questionsList}>
              {preguntasRespuestas.map((pr, index) => (
                <li key={index} className={styles.questionItem}>
                  <div className={styles.questionHeader}>
                    <span className={styles.questionNumber}>{index + 1}.</span>
                    <p className={styles.questionText}>{pr.pregunta}</p>
                  </div>
                  
                  <div className={styles.teacherAction}>
                    <span className={styles.actionLabel}>Actuación:</span>
                    <p className={styles.actionText}>{pr.preguntaDocente}</p>
                    <MdEditSquare 
                      onClick={() => { 
                        handleSelectPregunta(index); 
                        handleShowModalUpdatePreguntaRespuesta() 
                      }} 
                      className={styles.editIcon} 
                    />
                  </div>
                  
                  {pr.alternativas && pr.alternativas.map((al, index) => (
                    <div key={index} className={styles.alternative}>
                      <p className={styles.alternativeLabel}>{al.alternativa} - </p>
                      <p className={styles.alternativeText}>{al.descripcion}</p>
                    </div>
                  ))}
                  
                  <div className={styles.answer}>respuesta: {pr.respuesta}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}

export default Evaluacion
Evaluacion.Auth = PrivateRouteAdmin