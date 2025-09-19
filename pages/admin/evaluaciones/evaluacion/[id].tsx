import PrivateRouteAdmin from '@/components/layouts/PrivateRoutesAdmin'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { Alternativas } from '@/features/types/types'
import AgregarPreguntasRespuestas from '@/modals/agregarPreguntasYRespuestas'
import EvaluarEstudiante from '@/modals/evaluarEstudiante'
import UpdatePreguntaRespuesta from '@/modals/updatePreguntaRespuesta'
import DeletePregunta from '@/modals/deletePregunta'
import PuntuacionYNivel from '@/modals/PuntuacionYNivel/puntuacionYNivel'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { MdEditSquare, MdDelete } from 'react-icons/md'
import { RiLoader4Line } from 'react-icons/ri'
import { FaArrowUp, FaArrowDown } from 'react-icons/fa'
import styles from './evaluacion.module.css'

// Hook personalizado para mantener la posición de scroll
const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const saveScrollPosition = useCallback(() => {
    if (containerRef.current) {
      setScrollPosition(containerRef.current.scrollTop)
    }
  }, [])

  const restoreScrollPosition = useCallback(() => {
    if (containerRef.current && scrollPosition > 0) {
      containerRef.current.scrollTop = scrollPosition
    }
  }, [scrollPosition])

  return { containerRef, saveScrollPosition, restoreScrollPosition }
}

const Evaluacion = () => {
  const route = useRouter()
  const { evaluacion, preguntasRespuestas, currentUserData, loaderPages } = useGlobalContext()
  const { getEvaluacion, getPreguntasRespuestas, updatePreguntaRespuesta, deletePreguntaRespuesta } = useAgregarEvaluaciones()
  const [showModal, setShowModal] = useState(false)
  const [showModalEstudiante, setShowModalEstudiante] = useState(false)
  const [pregunta, setPregunta] = useState({})
  const [showModalUpdatePReguntaRespuesta, setShowModalUpdatePReguntaRespuesta] = useState(false)
  const [showModalDelete, setShowModalDelete] = useState(false)
  const [showModalPuntuacionYNivel, setShowModalPuntuacionYNivel] = useState(false)
  const [preguntaToDelete, setPreguntaToDelete] = useState({ id: '', order: 0 })

  // Hook para mantener la posición de scroll
  const { containerRef, saveScrollPosition, restoreScrollPosition } = useScrollPosition()

  // Calcular la suma total de puntajes
  const totalPuntaje = preguntasRespuestas.reduce((total, pregunta) => {
    const puntaje = Number(pregunta.puntaje) || 0
    return total + puntaje
  }, 0)

  // Verificar si alguna pregunta tiene la propiedad puntaje
  const hayPuntajes = preguntasRespuestas.some(pregunta => pregunta.puntaje !== undefined && pregunta.puntaje !== null)

  const handleshowModal = () => {
    setShowModal(!showModal)
  }

  const handleShowModalUpdatePreguntaRespuesta = () => {
    setShowModalUpdatePReguntaRespuesta(!showModalUpdatePReguntaRespuesta)
  }

  const handleShowModalDelete = () => {
    setShowModalDelete(!showModalDelete)
  }

  const handleShowModalPuntuacionYNivel = () => {
    setShowModalPuntuacionYNivel(!showModalPuntuacionYNivel)
  }

  const handleSelectPregunta = (index: number) => {
    setPregunta(preguntasRespuestas[index])
  }

  const handleSelectPreguntaToDelete = (index: number) => {
    const pregunta = preguntasRespuestas[index]
    if (pregunta.id && typeof pregunta.order === 'number') {
      setPreguntaToDelete({
        id: pregunta.id,
        order: pregunta.order
      })
      handleShowModalDelete()
    } else {
      console.error('Pregunta no tiene ID o order válidos')
    }
  }

  const handleDeletePregunta = async () => {
    saveScrollPosition() // Guardar posición antes de eliminar
    await deletePreguntaRespuesta(`${route.query.id}`, preguntaToDelete.id, preguntaToDelete.order)
  }

  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    saveScrollPosition() // Guardar posición antes de mover
    
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= preguntasRespuestas.length) return

    const currentQuestion = preguntasRespuestas[index]
    const targetQuestion = preguntasRespuestas[newIndex]

    // Intercambiar los valores de order
    const tempOrder = currentQuestion.order
    currentQuestion.order = targetQuestion.order
    targetQuestion.order = tempOrder

    // Actualizar ambas preguntas en la base de datos
    await updatePreguntaRespuesta(currentQuestion, currentQuestion.alternativas || [], `${route.query.id}`)
    await updatePreguntaRespuesta(targetQuestion, targetQuestion.alternativas || [], `${route.query.id}`)

    // Recargar las preguntas para reflejar el nuevo orden
    getPreguntasRespuestas(`${route.query.id}`)
  }

  useEffect(() => {
    getEvaluacion(`${route.query.id}`)
    if (route.query.id) {
      getPreguntasRespuestas(`${route.query.id}`)
    }
  }, [route.query.id, evaluacion.id])

  // Restaurar posición de scroll después de que se actualicen las preguntas
  useEffect(() => {
    if (preguntasRespuestas.length > 0) {
      // Usar setTimeout para asegurar que el DOM se haya actualizado
      setTimeout(() => {
        restoreScrollPosition()
      }, 100)
    }
  }, [preguntasRespuestas, restoreScrollPosition])
  return (
    <>
      {showModalUpdatePReguntaRespuesta && (
        <UpdatePreguntaRespuesta
          id={`${route.query.id}`}
          pregunta={pregunta}
          handleShowModalUpdatePreguntaRespuesta={handleShowModalUpdatePreguntaRespuesta}
        />
      )}

      {showModalDelete && (
        <DeletePregunta
          idEvaluacion={`${route.query.id}`}
          idPregunta={preguntaToDelete.id}
          handleShowModalDelete={handleShowModalDelete}
          onDelete={handleDeletePregunta}
        />
      )}

      {showModalPuntuacionYNivel && (
        <PuntuacionYNivel
          evaluacion={evaluacion}
          showModal={showModalPuntuacionYNivel}
          handleShowModal={handleShowModalPuntuacionYNivel}
          estudiante={null}
          idExamen={`${route.query.id}`}
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
        <div className={styles.container} ref={containerRef}>
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
              {currentUserData.rol === 4 && (
                <button onClick={handleshowModal} className={styles.buttonPrimary}>
                  agregar preguntas
                </button>
              )}
              <Link
                href={`reporte?id=${currentUserData.dni}&idEvaluacion=${route.query.id}`}
                className={styles.buttonSecondary}
              >
                
                reporte de evaluación
              </Link>
              <Link
                href={`seguimiento-evaluaciones`}
                className={styles.buttonSeguimiento}
              >
                
                seguimiento
              </Link>
              <button 
                onClick={handleShowModalPuntuacionYNivel} 
                className={styles.buttonRangoNivel}
              >
                rango de nivel
              </button>
              {hayPuntajes && currentUserData.rol === 4 && (
                <div className={styles.totalPuntaje}>
                  <span className={styles.totalLabel}>Puntaje Total: </span>
                  <span className={styles.totalValue}>{totalPuntaje}</span>
                </div>
              )}
            </div>

            <h2 className={styles.sectionTitle}>preguntas y respuestas</h2>
            <ul className={styles.questionsList}>
              {preguntasRespuestas.map((pr, index) => (
                <li key={index} className={styles.questionItem}>
                  <div className={styles.questionHeader}>
                    <span className={styles.questionNumber}>{index + 1}.</span>
                    <p className={styles.questionText}>{pr.pregunta}</p>
                    {currentUserData.rol === 4 &&
                      <div className={styles.orderButtons}>
                        <button
                          onClick={() => handleMoveQuestion(index, 'up')}
                          disabled={index === 0}
                          className={styles.orderButton}
                        >
                          <FaArrowUp />
                        </button>
                        <button
                          onClick={() => handleMoveQuestion(index, 'down')}
                          disabled={index === preguntasRespuestas.length - 1}
                          className={styles.orderButton}
                        >
                          <FaArrowDown />
                        </button>
                      </div>
                    }
                  </div>

                  <div className={styles.teacherAction}>
                    <span className={styles.actionLabel}>Actuación:</span>
                    <p className={styles.actionText}>{pr.preguntaDocente}</p>
                    {currentUserData.rol === 4 &&
                      <div className={styles.actionButtons}>
                        <MdEditSquare
                          onClick={() => {
                            handleSelectPregunta(index);
                            handleShowModalUpdatePreguntaRespuesta()
                          }}
                          className={styles.editIcon}
                        />
                        <MdDelete
                          onClick={() => handleSelectPreguntaToDelete(index)}
                          className={styles.deleteIcon}
                        />
                      </div>
                    }
                  </div>

                  {pr.alternativas && pr.alternativas.map((al, index) => (
                    <div key={index} className={styles.alternative}>
                      <p className={styles.alternativeLabel}>{al.alternativa} - </p>
                      <p className={styles.alternativeText}>{al.descripcion}</p>
                    </div>
                  ))}

                  <div className={styles.answerContainer}>
                    <div className={styles.answer}>respuesta: {pr.respuesta}</div>
                    {pr.puntaje !== undefined && pr.puntaje !== null && currentUserData.rol === 4 && (
                      <div className={pr.puntaje !== undefined && Number(pr.puntaje) <= 0 ? styles.puntajeBajo : styles.puntaje}>
                        puntaje: {pr.puntaje}
                      </div>
                    )}
                  </div>
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