import PrivateRouteAdmin from '@/components/layouts/PrivateRoutesAdmin'
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { Alternativas } from '@/features/types/types'
import AgregarPreguntasRespuestas from '@/modals/agregarPreguntasYRespuestas'
import EvaluarEstudiante from '@/modals/evaluarEstudiante'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState, useRef } from 'react'
import { RiLoader4Line, RiFileList3Line, RiAddLine, RiCheckDoubleLine, RiArrowUpLine } from 'react-icons/ri'
import styles from './Evaluacion.module.css'
import QuestionNavigator from '@/components/QuestionNavigator/QuestionNavigator'

const Evaluacion = () => {
  const route = useRouter()
  const { evaluacion, preguntasRespuestas, currentUserData, loaderPages } = useGlobalContext()
  const { getEvaluacion, getPreguntasRespuestas } = useAgregarEvaluaciones()
  const [showModal, setShowModal] = useState(false)
  const [showModalEstudiante, setShowModalEstudiante] = useState(false)
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Track which question is currently visible
  useEffect(() => {
    const handleScroll = () => {
      const questionElements = document.querySelectorAll('[id^="question-"]')
      let visibleQuestionIndex = 0

      for (let i = 0; i < questionElements.length; i++) {
        const rect = questionElements[i].getBoundingClientRect()
        // If element is near top of viewport (considering navbar height)
        if (rect.top >= 0 && rect.top <= 300) {
          visibleQuestionIndex = i
          break
        } else if (rect.top < 0) {
          // If we passed it, it might still be the active one
          visibleQuestionIndex = i
        }
      }

      setActiveQuestion(visibleQuestionIndex)
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [preguntasRespuestas])

  const handleshowModal = () => {
    setShowModal(!showModal)
  }

  const handleShowModalEstudiante = () => {
    setShowModalEstudiante(!showModalEstudiante)
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    getEvaluacion(`${route.query.id}`)
    if (route.query.id) {
      getPreguntasRespuestas(`${route.query.id}`)
    }
  }, [route.query.id])
  // console.log('preguntasRespuestas', preguntasRespuestas)
  console.log('evaluacion', evaluacion)

  return (
    <>
      {showModal && (
        <AgregarPreguntasRespuestas
          id={`${route.query.id}`}
          showModal={showModal}
          handleshowModal={handleshowModal}
        />
      )}

      {loaderPages ? (
        <div className={styles.loaderContainer}>
          <RiLoader4Line className={styles.spinner} />
          <span className={styles.loadingText}>Cargando evaluación...</span>
        </div>
      ) : (
        <>
          <QuestionNavigator
            totalQuestions={preguntasRespuestas.length}
            activeQuestion={activeQuestion}
            onQuestionClick={setActiveQuestion}
          />
          <div className={styles.container}>
            <div className={styles.content}>
              <div className={styles.card}>
                <div className={styles.header}>
                  <h1 className={styles.title}>{evaluacion.nombre}</h1>
                  <div className={styles.actions}>
                    {evaluacion.idDocente === currentUserData.dni && (
                      <button onClick={handleshowModal} className={styles.addButton}>
                        <RiAddLine size={18} />
                        Agregar Preguntas
                      </button>
                    )}
                    <Link
                      href={`reporte?id=${currentUserData.dni}&idEvaluacion=${route.query.id}`}
                      className={styles.reportButton}
                    >
                      <RiFileList3Line size={18} />
                      Reporte
                    </Link>
                  </div>
                </div>

                <h2 className={styles.sectionTitle}>Preguntas y Respuestas</h2>

                <ul className={styles.questionsList}>
                  {preguntasRespuestas.map((pr, index) => (
                    <li key={index} id={`question-${index}`} className={styles.questionItem}>
                      <div className={styles.questionMeta}>
                        <p className={styles.questionText}>
                          <span className={styles.questionNumber}>{index + 1}.</span>
                          {pr.pregunta}
                        </p>
                        <div className={styles.actuacionText}>
                          <span className={styles.actuacionLabel}>Actuación:</span>
                          <span>{pr.preguntaDocente}</span>
                        </div>
                      </div>

                      {pr.alternativas && pr.alternativas.length > 0 && (
                        <div className={styles.alternativasList}>
                          {pr.alternativas.map((al, altIndex) => (
                            <div key={altIndex} className={styles.alternativaItem}>
                              <div className={styles.alternativaLetter}>{al.alternativa}</div>
                              <p className={styles.alternativaDesc}>{al.descripcion}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={styles.respuestaWrapper}>
                        <RiCheckDoubleLine size={16} />
                        Respuesta: {pr.respuesta}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className={styles.scrollTopButton}
              title="Volver arriba"
            >
              <RiArrowUpLine size={24} />
            </button>
          )}
        </>
      )}
    </>
  )
}

export default Evaluacion
Evaluacion.Auth = PrivateRouteDirectores