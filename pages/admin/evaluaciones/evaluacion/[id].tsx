import PrivateRouteAdmin from '@/components/layouts/PrivateRoutesAdmin'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { Alternativas } from '@/features/types/types'
import AgregarPreguntasRespuestas from '@/modals/agregarPreguntasYRespuestas'
import EvaluarEstudiante from '@/modals/evaluarEstudiante'
import UpdatePreguntaRespuesta from '@/modals/updatePreguntaRespuesta'
import DeletePregunta from '@/modals/deletePregunta'
import PuntuacionYNivel from '@/modals/PuntuacionYNivel/puntuacionYNivel'
import AsignarEvaluacionModal from './AsignarEvaluacionModal'
import AsignarEvaluacionUgelModal from './AsignarEvaluacionUgelModal'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { MdEditSquare, MdDelete, MdAssignment, MdAddCircle, MdSettings, MdAssessment, MdTrendingUp, MdEmojiEvents } from 'react-icons/md'
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
  const [showModalAsignarEvaluacion, setShowModalAsignarEvaluacion] = useState(false)
  const [showModalAsignarEvaluacionUgel, setShowModalAsignarEvaluacionUgel] = useState(false)
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

  // Lógica de permisos centralizada
  const isOwnerOrAdmin = currentUserData.rol === 4
  const isAssignedRegional = evaluacion.usuariosConPermisos?.includes(currentUserData.dni || '')
  const isAssignedUgel = evaluacion.usuariosConPermisosUgel?.includes(currentUserData.dni || '')

  const canManageEvaluation = isOwnerOrAdmin || isAssignedRegional || isAssignedUgel

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

  const handleShowModalAsignarEvaluacion = () => {
    setShowModalAsignarEvaluacion(!showModalAsignarEvaluacion)
  }

  const handleShowModalAsignarEvaluacionUgel = () => {
    setShowModalAsignarEvaluacionUgel(!showModalAsignarEvaluacionUgel)
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
      {showModal && (
        <AgregarPreguntasRespuestas
          id={`${route.query.id}`}
          showModal={showModal}
          handleshowModal={handleshowModal}
        />
      )}

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

      {showModalAsignarEvaluacion && (
        <AsignarEvaluacionModal
          showModal={showModalAsignarEvaluacion}
          handleShowModal={handleShowModalAsignarEvaluacion}
          idEvaluacion={`${route.query.id}`}
          usuariosConPermisos={evaluacion.usuariosConPermisos}
        />
      )}

      {showModalAsignarEvaluacionUgel && (
        <AsignarEvaluacionUgelModal
          showModal={showModalAsignarEvaluacionUgel}
          handleShowModal={handleShowModalAsignarEvaluacionUgel}
          idEvaluacion={`${route.query.id}`}
          usuariosConPermisosUgel={evaluacion.usuariosConPermisosUgel}
        />
      )}

      {loaderPages ? (
        <div className={styles.loaderContainer}>
          <RiLoader4Line className={styles.spinner} />
          <span>Cargando evaluación...</span>
        </div>
      ) : (
        <div className={styles.container} ref={containerRef}>
          <div className={styles.content}>

            {/* Header Section */}
            <header className={styles.header}>
              <h1 className={styles.title}>{evaluacion.nombre}</h1>
              <span className={styles.subtitle}>Gestión y configuración de la evaluación</span>
            </header>

            {/* Actions Bar */}
            <div className={styles.actionsBar}>
              <div className={styles.actionGroup}>
                <div className={styles.selectWrapper}>
                  <select
                    className={styles.selectAction}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'agregar-preguntas') handleshowModal();
                      else if (value === 'rango-nivel') handleShowModalPuntuacionYNivel();
                      else if (value === 'asignar-evaluacion') handleShowModalAsignarEvaluacion();
                      else if (value === 'asignar-evaluacion-ugel') handleShowModalAsignarEvaluacionUgel();
                      e.target.value = '';
                    }}
                  >
                    <option value="">⚙️ Herramientas de Gestión</option>
                    {canManageEvaluation && <option value="agregar-preguntas">➕ Agregar Preguntas</option>}
                    {currentUserData.rol === 4 && <option value="rango-nivel">📊 Configurar Niveles</option>}
                    {currentUserData.rol === 4 && <option value="asignar-evaluacion">📋 Asignar a Región</option>}
                    {currentUserData.rol === 4 && <option value="asignar-evaluacion-ugel">🏢 Asignar a UGEL</option>}
                  </select>
                  <span className={styles.selectIcon}>▼</span>
                </div>

                <Link
                  href={`reporte?id=${currentUserData.dni}&idEvaluacion=${route.query.id}`}
                  className={styles.linkButton}
                >
                  <MdAssessment /> Reporte
                </Link>

                <Link
                  href={`seguimiento-evaluaciones`}
                  className={styles.linkButton}
                >
                  <MdTrendingUp /> Seguimiento
                </Link>
              </div>

              {/* Score Badge */}
              {hayPuntajes && currentUserData.rol === 4 && (
                <div className={styles.totalScore}>
                  <span className={styles.scoreLabel}>Puntaje Total</span>
                  <span className={styles.scoreValue}>{totalPuntaje}</span>
                </div>
              )}
            </div>

            {/* Questions List */}
            <section>
              <h2 className={styles.sectionTitle}>Preguntas ({preguntasRespuestas.length})</h2>
              <ul className={styles.questionsList}>
                {preguntasRespuestas.map((pr, index) => (
                  <li key={index} className={styles.questionCard}>

                    <div className={styles.questionHeader}>
                      <div className={styles.questionMeta}>
                        <span className={styles.questionNumber}>{index + 1}</span>
                        <p className={styles.questionText}>{pr.pregunta}</p>
                      </div>

                      {canManageEvaluation && (
                        <div className={styles.controls}>
                          <button
                            onClick={() => handleMoveQuestion(index, 'up')}
                            disabled={index === 0}
                            className={styles.controlButton}
                            title="Mover arriba"
                          >
                            <FaArrowUp />
                          </button>
                          <button
                            onClick={() => handleMoveQuestion(index, 'down')}
                            disabled={index === preguntasRespuestas.length - 1}
                            className={styles.controlButton}
                            title="Mover abajo"
                          >
                            <FaArrowDown />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className={styles.teacherAction}>
                      <div className={styles.actionContent}>
                        <span className={styles.actionLabel}>Actuación Docente</span>
                        <p className={styles.actionText}>{pr.preguntaDocente}</p>
                      </div>

                      {canManageEvaluation && (
                        <div className={styles.actionButtons}>
                          <div
                            className={`${styles.iconButton} ${styles.editBtn}`}
                            onClick={() => {
                              handleSelectPregunta(index);
                              handleShowModalUpdatePreguntaRespuesta();
                            }}
                            title="Editar"
                          >
                            <MdEditSquare />
                          </div>
                          <div
                            className={`${styles.iconButton} ${styles.deleteBtn}`}
                            onClick={() => handleSelectPreguntaToDelete(index)}
                            title="Eliminar"
                          >
                            <MdDelete />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={styles.alternativesList}>
                      {pr.alternativas && pr.alternativas.map((al, idx) => (
                        <div key={idx} className={styles.alternativeItem}>
                          <span className={styles.altBadge}>{al.alternativa}</span>
                          <p className={styles.altText}>{al.descripcion}</p>
                        </div>
                      ))}
                    </div>

                    <div className={styles.cardFooter}>
                      <div className={styles.correctAnswer}>
                        <span>Respuesta Correcta:</span>
                        <strong>{pr.respuesta}</strong>
                      </div>

                      {pr.puntaje !== undefined && pr.puntaje !== null && currentUserData.rol === 4 && (
                        <div className={`${styles.scoreBadge} ${Number(pr.puntaje) <= 0 ? styles.low : ''}`}>
                          <MdEmojiEvents />
                          <span>{pr.puntaje} pts</span>
                        </div>
                      )}
                    </div>

                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </>
  )
}

export default Evaluacion
Evaluacion.Auth = PrivateRouteAdmin