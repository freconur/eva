import PrivateRouteAdmin from '@/components/layouts/PrivateRoutesAdmin'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { writeBatch } from 'firebase/firestore'
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
import { MdEditSquare, MdDelete, MdAssignment, MdAddCircle, MdSettings, MdAssessment, MdTrendingUp, MdEmojiEvents, MdDragIndicator, MdViewList } from 'react-icons/md'
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
  const { getEvaluacion, getPreguntasRespuestas, updatePreguntaRespuesta, updatePreguntaPuntaje, updatePreguntasOrder, deletePreguntaRespuesta, updateEvaluacion } = useAgregarEvaluaciones()
  const [showModal, setShowModal] = useState(false)
  const [preguntasLocales, setPreguntasLocales] = useState<any[]>([])
  const [scoresLocales, setScoresLocales] = useState<Record<string, string>>({})
  const [isCompactView, setIsCompactView] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [showModalEstudiante, setShowModalEstudiante] = useState(false)
  const [pregunta, setPregunta] = useState({})
  const [showModalUpdatePReguntaRespuesta, setShowModalUpdatePReguntaRespuesta] = useState(false)
  const handleToggleActive = async () => {
    if (!route.query.id || !evaluacion) return

    // Validaciones al activar la evaluación (cuando pasa de false a true)
    if (!evaluacion.active) {
      if (evaluacion.tipoDeEvaluacion === "1") {
        // 1. Validar que existan rangos de nivel y puntaje
        if (!evaluacion.nivelYPuntaje || !Array.isArray(evaluacion.nivelYPuntaje) || evaluacion.nivelYPuntaje.length === 0) {
          alert("⚠️ No se puede activar la evaluación. Primero debes configurar los niveles y puntajes de la evaluación.");
          return;
        }

        // 2. Validar que exista al menos una pregunta
        if (!preguntasRespuestas || preguntasRespuestas.length === 0) {
          alert("⚠️ No se puede activar la evaluación porque no tiene preguntas registradas.");
          return;
        }

        // 3. Validar que todas las preguntas tengan puntuación >= 1
        // Usamos la lista ordenada de preguntas para mostrar el número de pregunta correcto de cara al usuario
        const preguntasOrdenadas = [...preguntasRespuestas].sort((a, b) => (a.order || 0) - (b.order || 0));
        for (let i = 0; i < preguntasOrdenadas.length; i++) {
          const p = preguntasOrdenadas[i];
          const puntajeVal = Number(p.puntaje);
          if (p.puntaje === undefined || p.puntaje === null || p.puntaje === '' || isNaN(puntajeVal) || puntajeVal < 1) {
            alert(`⚠️ No se puede activar la evaluación. La pregunta N° ${i + 1} debe tener una puntuación igual o mayor a 1.`);
            return;
          }
        }

        // 4. Validar que la suma total de puntos sea igual al value max del nivel máximo
        const totalPuntaje = preguntasRespuestas.reduce((total, pregunta) => {
          return total + (Number(pregunta.puntaje) || 0);
        }, 0);

        const sortedLevels = [...evaluacion.nivelYPuntaje].sort((a, b) => (b.max || 0) - (a.max || 0));
        const maxScoreOfHighestLevel = sortedLevels[0] ? Number(sortedLevels[0].max || 0) : 0;

        if (totalPuntaje !== maxScoreOfHighestLevel) {
          alert(`⚠️ No se puede activar la evaluación. La suma de los puntajes de las preguntas (${totalPuntaje}) debe ser igual al puntaje máximo del nivel más alto (${maxScoreOfHighestLevel}).`);
          return;
        }
      }
    }

    const confirmMsg = evaluacion.active
      ? '¿Estás seguro de que deseas desactivar esta evaluación? Las preguntas y puntajes volverán a ser editables.'
      : '¿Estás seguro de que deseas activar esta evaluación? Esto bloqueará la edición de preguntas y puntajes.';
    
    if (window.confirm(confirmMsg)) {
      try {
        await updateEvaluacion({
          ...evaluacion,
          active: !evaluacion.active
        }, `${route.query.id}`)
      } catch (error: any) {
        alert(`❌ Error al cambiar el estado de la evaluación: ${error.message || 'Error desconocido'}`)
      }
    }
  }
  const [showModalDelete, setShowModalDelete] = useState(false)
  const [showModalPuntuacionYNivel, setShowModalPuntuacionYNivel] = useState(false)
  const [showModalAsignarEvaluacion, setShowModalAsignarEvaluacion] = useState(false)
  const [showModalAsignarEvaluacionUgel, setShowModalAsignarEvaluacionUgel] = useState(false)
  const [preguntaToDelete, setPreguntaToDelete] = useState({ id: '', order: 0 })
  const [showReorderCallout, setShowReorderCallout] = useState(false)
  const [showScoreCallout, setShowScoreCallout] = useState(false)

  useEffect(() => {
    const dismissedReorder = localStorage.getItem('reorder-callout-dismissed')
    if (!dismissedReorder) setShowReorderCallout(true)
    const dismissedScore = localStorage.getItem('score-callout-dismissed')
    if (!dismissedScore) setShowScoreCallout(true)
  }, [])

  const handleDismissCallout = () => setShowReorderCallout(false)

  const handleNeverShowCallout = () => {
    localStorage.setItem('reorder-callout-dismissed', 'true')
    setShowReorderCallout(false)
  }

  const handleDismissScoreCallout = () => setShowScoreCallout(false)

  const handleNeverShowScoreCallout = () => {
    localStorage.setItem('score-callout-dismissed', 'true')
    setShowScoreCallout(false)
  }

  const handleInlineScoreChange = (id: string, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '')
    setScoresLocales(prev => ({
      ...prev,
      [id]: numericValue
    }))
  }

  const handleSaveInlineScore = async (id: string, originalPuntaje: string) => {
    const value = scoresLocales[id] || '0'
    if (value === String(originalPuntaje || '0')) return

    // VALIDACIÓN DE NIVELES Y PUNTAJES (Solo para tipo de evaluación "1")
    if (evaluacion.tipoDeEvaluacion === "1") {
      if (!evaluacion.nivelYPuntaje || !Array.isArray(evaluacion.nivelYPuntaje) || evaluacion.nivelYPuntaje.length === 0) {
        alert("⚠️ Primero debes configurar los rangos de nivel y puntaje en la evaluación para poder asignar puntos a las preguntas.");
        setScoresLocales(prev => ({
          ...prev,
          [id]: String(originalPuntaje || '0')
        }))
        return;
      }

      const nivelSatisfactorio = evaluacion.nivelYPuntaje.find((n: any) => n.nivel.toLowerCase() === 'satisfactorio');
      if (!nivelSatisfactorio) {
        alert("⚠️ No se encontró la configuración del nivel 'Satisfactorio'. Por favor configurarlo primero.");
        setScoresLocales(prev => ({
          ...prev,
          [id]: String(originalPuntaje || '0')
        }))
        return;
      }

      const maxSatisfactorio = Number(nivelSatisfactorio.max || 0);
      const sumOfOtherQuestions = preguntasRespuestas
        .filter((p: any) => p.id !== id)
        .reduce((sum: number, p: any) => sum + (Number(p.puntaje) || 0), 0);
      const proposedSum = sumOfOtherQuestions + Number(value);

      if (proposedSum > maxSatisfactorio) {
        alert(`⚠️ No se puede guardar el puntaje. La suma total de los puntajes de las preguntas (${proposedSum}) superaría el puntaje máximo del nivel Satisfactorio (${maxSatisfactorio}).`);
        setScoresLocales(prev => ({
          ...prev,
          [id]: String(originalPuntaje || '0')
        }))
        return;
      }
    }

    try {
      await updatePreguntaPuntaje(`${route.query.id}`, id, value)
    } catch (error: any) {
      alert(`❌ Error al guardar el puntaje: ${error.message || 'Error desconocido'}`)
      setScoresLocales(prev => ({
        ...prev,
        [id]: String(originalPuntaje || '0')
      }))
    }
  }

  // Sincronizar puntuaciones locales
  useEffect(() => {
    if (preguntasRespuestas) {
      const initialScores: Record<string, string> = {}
      preguntasRespuestas.forEach(pr => {
        if (pr.id) {
          initialScores[pr.id] = String(pr.puntaje !== undefined && pr.puntaje !== null ? pr.puntaje : '0')
        }
      })
      setScoresLocales(initialScores)
    }
  }, [preguntasRespuestas])

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
  const canEditQuestions = canManageEvaluation && !evaluacion.active

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

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= preguntasLocales.length) return

    const updated = [...preguntasLocales]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp

    setPreguntasLocales(updated)
    setIsDirty(true)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === index) return
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) return

    const updated = [...preguntasLocales]
    const [draggedItem] = updated.splice(draggedIndex, 1)
    updated.splice(targetIndex, 0, draggedItem)

    setPreguntasLocales(updated)
    setIsDirty(true)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleSaveNewOrder = async () => {
    if (preguntasLocales.length === 0 || !route.query.id) return

    setIsSavingOrder(true)
    try {
      await updatePreguntasOrder(preguntasLocales, `${route.query.id}`)
      setIsDirty(false)
      alert('✅ Nuevo orden guardado exitosamente')
    } catch (error: any) {
      alert(`❌ Error al guardar el orden: ${error.message || 'Error desconocido'}`)
    } finally {
      setIsSavingOrder(false)
    }
  }

  useEffect(() => {
    const evalId = route.query.id;
    if (!evalId) return;

    const unsubscribeEvaluacion = getEvaluacion(`${evalId}`);
    const unsubscribePreguntas = getPreguntasRespuestas(`${evalId}`);

    return () => {
      if (unsubscribeEvaluacion) unsubscribeEvaluacion();
      if (unsubscribePreguntas) unsubscribePreguntas();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.query.id]);

  // Sincronizar estado local al recibir las preguntas de Firestore
  useEffect(() => {
    if (preguntasRespuestas) {
      const ordenadas = [...preguntasRespuestas].sort((a, b) => (a.order || 0) - (b.order || 0));
      setPreguntasLocales(ordenadas);
    }
  }, [preguntasRespuestas]);

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
              <h1 className={styles.title}>{evaluacion.nombre?.toUpperCase()}</h1>
              <span className={styles.subtitle}>Gestión y configuración de la evaluación</span>
            </header>

            {evaluacion.active && (
              <div className={styles.activeLockBanner}>
                <span>🔒 Esta evaluación está activa. Para proteger la integridad de los resultados y calificaciones, no se permiten modificaciones en las preguntas, alternativas, orden o puntajes.</span>
              </div>
            )}

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
                    {canEditQuestions && <option value="agregar-preguntas">➕ Agregar Preguntas</option>}
                    {currentUserData.rol === 4 && !evaluacion.active && <option value="rango-nivel">📊 Configurar Niveles</option>}
                    {currentUserData.rol === 4 && <option value="asignar-evaluacion">📋 Asignar a Región</option>}
                    {currentUserData.rol === 4 && <option value="asignar-evaluacion-ugel">🏢 Asignar a UGEL</option>}
                  </select>
                  <span className={styles.selectIcon}>▼</span>
                </div>

                {currentUserData.rol === 4 && (
                  <button
                    type="button"
                    onClick={handleToggleActive}
                    className={`${styles.linkButton} ${evaluacion.active ? styles.deactivateBtn : styles.activateBtn}`}
                  >
                    {evaluacion.active ? '🔒 Desactivar' : '🔓 Activar'}
                  </button>
                )}

                <Link
                  href={`reporte?id=${currentUserData.dni}&idEvaluacion=${route.query.id}`}
                  className={styles.linkButton}
                >
                  <MdAssessment /> Reporte
                </Link>

                {/* 
                <Link
                  href={`seguimiento-evaluaciones`}
                  className={styles.linkButton}
                >
                  <MdTrendingUp /> Seguimiento
                </Link>
                */}

                <div className={styles.newFeatureWrapper}>
                  {showReorderCallout && !isCompactView && !evaluacion.active && (
                    <div className={styles.featureCallout}>
                      <div className={styles.featureCalloutHeader}>
                        <span className={styles.newBadge}>NUEVO</span>
                        <button
                          type="button"
                          className={styles.featureCalloutClose}
                          onClick={handleDismissCallout}
                          title="Cerrar"
                        >
                          ✕
                        </button>
                      </div>
                      <p className={styles.featureCalloutText}>
                        <MdDragIndicator className={styles.featureCalloutIcon} />
                        Ahora puedes reordenar las preguntas arrastrándolas o usando las flechas
                      </p>
                      <button
                        type="button"
                        className={styles.featureCalloutNever}
                        onClick={handleNeverShowCallout}
                      >
                        No volver a mostrar
                      </button>
                      <span className={styles.featureCalloutArrow} />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsCompactView(!isCompactView)}
                    className={`${styles.linkButton} ${isCompactView ? styles.activeViewBtn : ''}`}
                  >
                    <MdViewList /> {isCompactView ? 'Vista Detallada' : (evaluacion.active ? 'Vista Compacta' : 'Modo Reordenar')}
                  </button>
                </div>

                {isDirty && (
                  <button
                    onClick={handleSaveNewOrder}
                    disabled={isSavingOrder}
                    className={`${styles.linkButton} ${styles.saveOrderBtn}`}
                  >
                    {isSavingOrder ? (
                      <>
                        <RiLoader4Line className={styles.spinnerIcon} /> Guardando...
                      </>
                    ) : (
                      '💾 Guardar Orden'
                    )}
                  </button>
                )}
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
              <h2 className={styles.sectionTitle}>Preguntas ({preguntasLocales.length})</h2>
              {isCompactView ? (
                <ul className={styles.compactList}>
                  {preguntasLocales.map((pr, index) => (
                    <li
                      key={pr.id || index}
                      className={`${styles.compactCard} ${draggedIndex === index ? styles.dragging : ''} ${dragOverIndex === index ? styles.dragOver : ''}`}
                      draggable={canEditQuestions}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className={styles.compactMeta}>
                        {canEditQuestions && (
                          <span className={styles.compactDragHandle}>
                            <MdDragIndicator />
                          </span>
                        )}
                        <span className={styles.compactNumber}>{index + 1}</span>
                        <p className={styles.compactText} title={pr.pregunta}>{pr.pregunta}</p>
                      </div>

                      <div className={styles.compactRightSide}>
                        {currentUserData.rol === 4 && (
                          canEditQuestions ? (
                            <div className={styles.compactScoreEdit}>
                              <input
                                type="text"
                                className={styles.compactScoreInput}
                                value={scoresLocales[pr.id || ''] || '0'}
                                onChange={(e) => pr.id && handleInlineScoreChange(pr.id, e.target.value)}
                                onBlur={() => pr.id && handleSaveInlineScore(pr.id, String(pr.puntaje || '0'))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    (e.target as HTMLInputElement).blur()
                                  }
                                }}
                                placeholder="Puntaje"
                              />
                              <span className={styles.scorePtsLabel}>pts</span>
                            </div>
                          ) : (
                            <span className={styles.compactScore}>
                              {pr.puntaje} pts
                            </span>
                          )
                        )}
                        {canEditQuestions && (
                          <div className={styles.compactControls}>
                            <button
                              type="button"
                              onClick={() => handleMoveQuestion(index, 'up')}
                              disabled={index === 0}
                              className={styles.compactControlButton}
                              title="Mover arriba"
                            >
                              <FaArrowUp />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveQuestion(index, 'down')}
                              disabled={index === preguntasLocales.length - 1}
                              className={styles.compactControlButton}
                              title="Mover abajo"
                            >
                              <FaArrowDown />
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className={styles.questionsList}>
                  {preguntasLocales.map((pr, index) => (
                    <li
                      key={pr.id || index}
                      className={`${styles.questionCard} ${draggedIndex === index ? styles.dragging : ''} ${dragOverIndex === index ? styles.dragOver : ''}`}
                      draggable={canEditQuestions}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                    >

                      <div className={styles.questionHeader}>
                        <div className={styles.questionMeta}>
                          <span className={styles.questionNumber}>{index + 1}</span>
                          <p className={styles.questionText}>{pr.pregunta}</p>
                        </div>

                        {canEditQuestions && (
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
                              disabled={index === preguntasLocales.length - 1}
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

                        {canEditQuestions && (
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
                        {pr.alternativas && pr.alternativas.map((al: any, idx: number) => (
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

                         {currentUserData.rol === 4 && (
                          canEditQuestions ? (
                            <div className={styles.inlineScoreWrapper}>
                              {index === 0 && showScoreCallout && (
                                <div className={styles.featureCallout}>
                                  <div className={styles.featureCalloutHeader}>
                                    <span className={styles.newBadge}>NUEVO</span>
                                    <button
                                      type="button"
                                      className={styles.featureCalloutClose}
                                      onClick={handleDismissScoreCallout}
                                      title="Cerrar"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <p className={styles.featureCalloutText}>
                                    <MdEmojiEvents className={styles.featureCalloutIcon} />
                                    Ahora puedes modificar directamente los puntajes de las preguntas
                                  </p>
                                  <button
                                    type="button"
                                    className={styles.featureCalloutNever}
                                    onClick={handleNeverShowScoreCallout}
                                  >
                                    No volver a mostrar
                                  </button>
                                  <span className={styles.featureCalloutArrow} />
                                </div>
                              )}
                              <div className={styles.inlineScoreEdit}>
                                <MdEmojiEvents className={styles.scoreIcon} />
                                <input
                                  type="text"
                                  className={styles.inlineScoreInput}
                                  value={scoresLocales[pr.id || ''] || '0'}
                                  onChange={(e) => pr.id && handleInlineScoreChange(pr.id, e.target.value)}
                                  onBlur={() => pr.id && handleSaveInlineScore(pr.id, String(pr.puntaje || '0'))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      (e.target as HTMLInputElement).blur()
                                    }
                                  }}
                                  placeholder="Puntaje"
                                />
                                <span className={styles.scorePtsLabel}>pts</span>
                              </div>
                            </div>
                          ) : (
                            <div className={`${styles.scoreBadge} ${Number(pr.puntaje) <= 0 ? styles.low : ''}`}>
                              <MdEmojiEvents />
                              <span>{pr.puntaje} pts</span>
                            </div>
                          )
                        )}
                      </div>

                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  )
}

export default Evaluacion
Evaluacion.Auth = PrivateRouteAdmin