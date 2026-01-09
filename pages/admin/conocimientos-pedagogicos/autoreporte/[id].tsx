import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useTituloDeCabecera } from '@/features/hooks/useTituloDeCabecera'
import { useRouter } from 'next/router'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { HiPencil, HiPlus, HiArrowUp, HiArrowDown, HiEye, HiEyeOff, HiTrash, HiX, HiChartBar } from 'react-icons/hi'
import Loader from '@/components/loader/loader'
import styles from './conocimientoPedagogico.module.css'

const EvaluacionEscalaLikert = () => {

  const route = useRouter()
  const { id } = route.query

  const { getTituloDeCabecera, addPuntajeEscalaLikert, tituloDeCabecera, updateTituloDeCabecera, addPreguntasAlternativasEscalaLikert, getPreguntasEvaluacionEscalaLikert, actualizarOrdenesEnBatch, getEvaluacionEscalaLikert, evaluacionEscalaLikert, updatePreguntaTexto, updateEvaluacionEscalaLikert, deletePreguntaEvaluacionEscalaLikert, preguntasEscalaLikert } = useTituloDeCabecera()
  const { preguntaEvaluacionLikert } = useGlobalContext()
  const [isEditing, setIsEditing] = useState(false)
  const [editTitulo, setEditTitulo] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [showEditOptions, setShowEditOptions] = useState(false)
  const [isSavingQuestion, setIsSavingQuestion] = useState(false)
  // Removemos el estado local de preguntas ya que usaremos el del contexto global
  const [opcionesGlobales, setOpcionesGlobales] = useState([
    { name: 'Muy bajo o nula', value: 0 },
    { name: 'Bajo', value: 1 },
    { name: 'Moderado/regular', value: 2 },
    { name: 'Alto', value: 3 },
    { name: 'Muy alto', value: 4 }
  ])
  const [nuevaPregunta, setNuevaPregunta] = useState({
    texto: ''
  })
  const [preguntasLocales, setPreguntasLocales] = useState<any[]>([])
  const [preguntasOriginales, setPreguntasOriginales] = useState<any[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [movingQuestionId, setMovingQuestionId] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editQuestionText, setEditQuestionText] = useState('')
  const [isSavingQuestionEdit, setIsSavingQuestionEdit] = useState(false)
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null)
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false)
  const [isLoadingId, setIsLoadingId] = useState(true)
  const [isEditingDescripcion, setIsEditingDescripcion] = useState(false)
  const [editDescripcionLink, setEditDescripcionLink] = useState('')
  const [isSavingDescripcion, setIsSavingDescripcion] = useState(false)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [niveles, setNiveles] = useState([
    { id: 0, value: 1, nivel: 'Inicio', min: 0, max: 0, color: '#ef4444' },
    { id: 1, value: 2, nivel: 'Desarrollo', min: 0, max: 0, color: '#f97316' },
    { id: 2, value: 3, nivel: 'Consolidado', min: 0, max: 0, color: '#eab308' },
    { id: 3, value: 4, nivel: 'Avanzado', min: 0, max: 0, color: '#22c55e' },
    { id: 4, value: 5, nivel: 'Experto', min: 0, max: 0, color: '#3b82f6' }
  ])
  const [isSavingNiveles, setIsSavingNiveles] = useState(false)
  const [isEditingNiveles, setIsEditingNiveles] = useState(false)

  // Función helper para convertir EscalaLikert[] a opcionesGlobales
  const convertEscalaLikertToOpciones = (escalaLikert: any[]): { name: string; value: number }[] => {
    return escalaLikert.map((item, index) => ({
      name: item.name || '',
      value: item.value ?? index
    }))
  }

  const handleEdit = () => {
    setEditTitulo(evaluacionEscalaLikert.name || '')
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!editTitulo.trim()) return

    setIsSaving(true)
    try {
      await updateEvaluacionEscalaLikert(id as string, { name: editTitulo.trim() })
    } catch (error) {
      console.error('Error al actualizar el título:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditTitulo('')
    setIsEditing(false)
  }

  const handleEditDescripcion = () => {
    setEditDescripcionLink(evaluacionEscalaLikert.descripcionLink || '')
    setIsEditingDescripcion(true)
  }

  const handleSaveDescripcion = async () => {
    if (!editDescripcionLink.trim()) {
      alert('La descripción no puede estar vacía')
      return
    }

    setIsSavingDescripcion(true)
    try {
      await updateEvaluacionEscalaLikert(id as string, { descripcionLink: editDescripcionLink.trim() })
      setIsEditingDescripcion(false)
    } catch (error) {
      console.error('Error al actualizar la descripción:', error)
      alert('Error al actualizar la descripción. Intente nuevamente.')
    } finally {
      setIsSavingDescripcion(false)
    }
  }

  const handleCancelDescripcion = () => {
    setEditDescripcionLink('')
    setIsEditingDescripcion(false)
  }

  const handleToggleVisibility = async () => {
    if (!evaluacionEscalaLikert) return

    const newActiveState = !evaluacionEscalaLikert.active
    try {
      await updateEvaluacionEscalaLikert(id as string, { active: newActiveState })
    } catch (error) {
      console.error('Error al actualizar la visibilidad:', error)
    }
  }

  const handleAddQuestion = () => {
    setNuevaPregunta({
      texto: ''
    })
    setShowAddQuestion(true)
  }

  const handleEditOptions = () => {
    // Si evaluacionEscalaLikert tiene puntaje, usar esas opciones, sino usar opcionesGlobales
    if (evaluacionEscalaLikert?.puntaje) {
      setOpcionesGlobales(convertEscalaLikertToOpciones(evaluacionEscalaLikert.puntaje))
    }
    setShowEditOptions(true)
  }

  const handleSaveQuestion = async () => {
    if (!nuevaPregunta.texto.trim()) {
      alert('Por favor complete el texto de la pregunta')
      return
    }

    setIsSavingQuestion(true)
    try {
      // Guardar la pregunta en Firestore
      console.log('opcionesGlobales', opcionesGlobales)
      await addPreguntasAlternativasEscalaLikert(id as string, nuevaPregunta.texto)

      // Cerrar el modal y limpiar el formulario después de guardar exitosamente
      setShowAddQuestion(false)
      setNuevaPregunta({
        texto: ''
      })

      // Las preguntas se actualizarán automáticamente a través del contexto global
    } catch (error) {
      console.error('Error al guardar la pregunta:', error)
    } finally {
      setIsSavingQuestion(false)
    }
  }

  const handleCancelQuestion = () => {
    setShowAddQuestion(false)
    setNuevaPregunta({
      texto: ''
    })
  }

  const handleGlobalOptionChange = (index: number, name: string) => {
    const opcionesActuales = evaluacionEscalaLikert?.puntaje
      ? convertEscalaLikertToOpciones(evaluacionEscalaLikert.puntaje)
      : opcionesGlobales
    const nuevasOpciones = [...opcionesActuales]
    nuevasOpciones[index] = { name, value: index }
    setOpcionesGlobales(nuevasOpciones)
  }

  const addGlobalOption = () => {
    const opcionesActuales = evaluacionEscalaLikert?.puntaje
      ? convertEscalaLikertToOpciones(evaluacionEscalaLikert.puntaje)
      : opcionesGlobales
    if (opcionesActuales.length < 10) {
      const newValue = opcionesActuales.length
      const nuevasOpciones = [...opcionesActuales, { name: '', value: newValue }]
      setOpcionesGlobales(nuevasOpciones)
    }
  }

  const removeGlobalOption = (index: number) => {
    const opcionesActuales = evaluacionEscalaLikert?.puntaje
      ? convertEscalaLikertToOpciones(evaluacionEscalaLikert.puntaje)
      : opcionesGlobales
    if (opcionesActuales.length > 2) {
      const nuevasOpciones = opcionesActuales
        .filter((_, i) => i !== index)
        .map((opcion, i) => ({ ...opcion, value: i }))
      setOpcionesGlobales(nuevasOpciones)
    }
  }

  const handleSaveOptions = async () => {
    try {
      console.log('Guardando opciones en Firestore:', opcionesGlobales)

      if (evaluacionEscalaLikert?.puntaje) {
        // Si ya tiene puntaje, actualizar la evaluación existente
        await updateEvaluacionEscalaLikert(id as string, { puntaje: opcionesGlobales })
      } else {
        // Si no tiene puntaje, agregar las opciones globales
        addPuntajeEscalaLikert(id as string, opcionesGlobales)
      }

      setShowEditOptions(false)
    } catch (error) {
      console.error('Error al guardar las opciones:', error)
    }
  }

  const handleCancelOptions = () => {
    // Restaurar las opciones originales si se cancela
    if (evaluacionEscalaLikert?.puntaje) {
      setOpcionesGlobales(convertEscalaLikertToOpciones(evaluacionEscalaLikert.puntaje))
    } else {
      setOpcionesGlobales([
        { name: 'Muy bajo o nula', value: 0 },
        { name: 'Bajo', value: 1 },
        { name: 'Moderado/regular', value: 2 },
        { name: 'Alto', value: 3 },
        { name: 'Muy alto', value: 4 }
      ])
    }
    setShowEditOptions(false)
  }

  // Función para mover pregunta hacia arriba
  const handleMoveUp = (preguntaId: string) => {
    const preguntasOrdenadas = [...preguntasLocales].sort((a, b) => (a.orden || 0) - (b.orden || 0))
    const currentIndex = preguntasOrdenadas.findIndex(p => p.id === preguntaId)

    if (currentIndex <= 0) return

    // Activar animaciones
    setMovingQuestionId(preguntaId)
    setIsReordering(true)

    // Intercambiar posiciones
    const nuevasPreguntas = [...preguntasOrdenadas]
    const temp = nuevasPreguntas[currentIndex]
    nuevasPreguntas[currentIndex] = nuevasPreguntas[currentIndex - 1]
    nuevasPreguntas[currentIndex - 1] = temp

    // Asignar nuevos órdenes basados en el índice
    const preguntasConNuevoOrden = nuevasPreguntas.map((pregunta, index) => ({
      ...pregunta,
      orden: (index + 1) * 10
    }))

    setPreguntasLocales(preguntasConNuevoOrden)
    setHasChanges(true)

    // Limpiar animaciones después de un tiempo
    setTimeout(() => {
      setMovingQuestionId(null)
      setIsReordering(false)
    }, 600)
  }

  // Función para mover pregunta hacia abajo
  const handleMoveDown = (preguntaId: string) => {
    const preguntasOrdenadas = [...preguntasLocales].sort((a, b) => (a.orden || 0) - (b.orden || 0))
    const currentIndex = preguntasOrdenadas.findIndex(p => p.id === preguntaId)

    if (currentIndex >= preguntasOrdenadas.length - 1) return

    // Activar animaciones
    setMovingQuestionId(preguntaId)
    setIsReordering(true)

    // Intercambiar posiciones
    const nuevasPreguntas = [...preguntasOrdenadas]
    const temp = nuevasPreguntas[currentIndex]
    nuevasPreguntas[currentIndex] = nuevasPreguntas[currentIndex + 1]
    nuevasPreguntas[currentIndex + 1] = temp

    // Asignar nuevos órdenes basados en el índice
    const preguntasConNuevoOrden = nuevasPreguntas.map((pregunta, index) => ({
      ...pregunta,
      orden: (index + 1) * 10
    }))

    setPreguntasLocales(preguntasConNuevoOrden)
    setHasChanges(true)

    // Limpiar animaciones después de un tiempo
    setTimeout(() => {
      setMovingQuestionId(null)
      setIsReordering(false)
    }, 600)
  }

  // Función para guardar cambios de orden
  const handleSaveOrder = async () => {
    if (!hasChanges) {
      console.log('No hay cambios para guardar')
      return
    }

    setIsSavingOrder(true)

    try {
      // Crear Map de cambios
      const cambios = new Map<string, number>()

      preguntasLocales.forEach((pregunta, index) => {
        const preguntaOriginal = preguntasOriginales.find(p => p.id === pregunta.id)
        const nuevoOrden = (index + 1) * 10

        if (preguntaOriginal && preguntaOriginal.orden !== nuevoOrden) {
          cambios.set(pregunta.id || '', nuevoOrden)
        }
      })

      if (cambios.size > 0) {
        await actualizarOrdenesEnBatch(id as string, cambios)

        // Actualizar las preguntas originales con el nuevo estado
        const nuevasPreguntasOriginales = preguntasLocales.map((pregunta, index) => ({
          ...pregunta,
          orden: (index + 1) * 10
        }))

        setPreguntasOriginales(nuevasPreguntasOriginales)
        setHasChanges(false)
        console.log(`Guardados ${cambios.size} cambios de orden`)
      } else {
        console.log('No se encontraron cambios reales para guardar')
        setHasChanges(false)
      }
    } catch (error) {
      console.error('Error al guardar el orden:', error)
    } finally {
      setIsSavingOrder(false)
    }
  }

  // Función para cancelar cambios
  const handleCancelOrder = () => {
    // Restaurar el orden original
    const preguntasRestauradas = [...preguntasOriginales].sort((a, b) => (a.orden || 0) - (b.orden || 0))
    setPreguntasLocales(preguntasRestauradas)
    setHasChanges(false)
    console.log('Cambios cancelados, orden restaurado')
  }

  // Funciones para editar preguntas
  const handleEditQuestion = (preguntaId: string, textoActual: string) => {
    setEditingQuestionId(preguntaId)
    setEditQuestionText(textoActual)
  }

  const handleSaveQuestionEdit = async () => {
    if (!editingQuestionId || !editQuestionText.trim()) {
      alert('Por favor complete el texto de la pregunta')
      return
    }

    setIsSavingQuestionEdit(true)
    try {
      await updatePreguntaTexto(id as string, editingQuestionId, editQuestionText.trim())

      // Cerrar el modal y limpiar el estado
      setEditingQuestionId(null)
      setEditQuestionText('')
    } catch (error) {
      console.error('Error al actualizar la pregunta:', error)
      alert('Error al actualizar la pregunta. Intente nuevamente.')
    } finally {
      setIsSavingQuestionEdit(false)
    }
  }

  const handleCancelQuestionEdit = () => {
    setEditingQuestionId(null)
    setEditQuestionText('')
  }

  // Funciones para eliminar preguntas
  const handleDeleteQuestion = (preguntaId: string) => {
    setDeletingQuestionId(preguntaId)
  }

  const handleConfirmDelete = async () => {
    if (!deletingQuestionId) return
    setIsDeletingQuestion(true)
    try {
      await deletePreguntaEvaluacionEscalaLikert(id as string, deletingQuestionId)
      // Cerrar el modal de confirmación
      setDeletingQuestionId(null)
    } catch (error) {
      console.error('Error al eliminar la pregunta:', error)
      alert('Error al eliminar la pregunta. Intente nuevamente.')
    } finally {
      setIsDeletingQuestion(false)
    }
  }

  const handleCancelDelete = () => {
    setDeletingQuestionId(null)
  }

  useEffect(() => {
    // Solo ejecutar si el id está disponible
    if (!id || typeof id !== 'string') {
      setIsLoadingId(true)
      return
    }

    // Limpiar estados locales cuando cambie el ID
    setPreguntasLocales([]);
    setPreguntasOriginales([]);
    setHasChanges(false);
    setEditingQuestionId(null);
    setDeletingQuestionId(null);

    setIsLoadingId(false)
    const ID = 'vyoPdwg4785DQ4FetrEl'
    const unsubscribe = getTituloDeCabecera(ID)
    getPreguntasEvaluacionEscalaLikert(id)
    getEvaluacionEscalaLikert(id)
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [id]) // Agregamos id como dependencia para que se ejecute cuando esté disponible

  // Sincronizar preguntas locales con las del contexto global
  useEffect(() => {
    if (preguntaEvaluacionLikert.length > 0) {
      const preguntasConOrden = preguntaEvaluacionLikert.map((pregunta, index) => ({
        ...pregunta,
        orden: pregunta.orden || (index + 1) * 10
      }))

      setPreguntasLocales(preguntasConOrden)
      setPreguntasOriginales(preguntasConOrden)
      setHasChanges(false)
    } else {
      // Si no hay preguntas en el contexto global, limpiar las locales
      setPreguntasLocales([])
      setPreguntasOriginales([])
      setHasChanges(false)
    }
  }, [preguntaEvaluacionLikert])

  // Verificar si hay cambios reales comparando con el estado original
  useEffect(() => {
    if (preguntasLocales.length > 0 && preguntasOriginales.length > 0) {
      const hayCambios = preguntasLocales.some((preguntaLocal, index) => {
        const preguntaOriginal = preguntasOriginales.find(p => p.id === preguntaLocal.id)
        if (!preguntaOriginal) return true

        // Comparar el orden basado en la posición en el array
        const ordenEsperado = (index + 1) * 10
        return preguntaOriginal.orden !== ordenEsperado
      })

      // Solo actualizar si el valor realmente cambió
      // Solo actualizar si el valor realmente cambió
      setHasChanges(prevHasChanges => prevHasChanges !== hayCambios ? hayCambios : prevHasChanges)
    }
  }, [preguntasLocales, preguntasOriginales])

  // Cargar niveles existentes si los hay
  // Cargar niveles existentes si los hay, pero manteniendo la estructura base y orden
  useEffect(() => {
    if (evaluacionEscalaLikert?.niveles && evaluacionEscalaLikert.niveles.length > 0) {
      const defaultNiveles = [
        { id: 0, value: 1, nivel: 'Inicio', min: 0, max: 0, color: '#ef4444' },
        { id: 1, value: 2, nivel: 'Desarrollo', min: 0, max: 0, color: '#f97316' },
        { id: 2, value: 3, nivel: 'Consolidado', min: 0, max: 0, color: '#eab308' },
        { id: 3, value: 4, nivel: 'Avanzado', min: 0, max: 0, color: '#22c55e' },
        { id: 4, value: 5, nivel: 'Experto', min: 0, max: 0, color: '#3b82f6' }
      ]

      // Fusionar los datos guardados con la estructura por defecto para asegurar que id y value existan
      const nivelesActualizados = defaultNiveles.map((defaultNivel, index) => {
        // Intentar encontrar por nivel (nombre) o por índice
        const savedNivel = evaluacionEscalaLikert.niveles?.find((n: any) => n.nivel === defaultNivel.nivel) || evaluacionEscalaLikert.niveles?.[index]

        if (savedNivel) {
          return {
            ...defaultNivel,
            ...savedNivel,
            // Asegurar que id y value se mantengan del default si no existen en el guardado
            id: defaultNivel.id,
            value: defaultNivel.value
          }
        }
        return defaultNivel
      })

      setNiveles(nivelesActualizados as any)
    }
  }, [evaluacionEscalaLikert])

  const handleNivelChange = (index: number, field: string, value: string) => {
    const newNiveles: any = [...niveles]
    newNiveles[index] = {
      ...newNiveles[index],
      [field]: field === 'nivel' || field === 'color' ? value : Number(value)
    }
    setNiveles(newNiveles)
  }

  const handleSaveNiveles = async () => {
    setIsSavingNiveles(true)
    try {
      await updateEvaluacionEscalaLikert(id as string, { niveles: niveles as any })
      setIsEditingNiveles(false)
    } catch (error) {
      console.error('Error al guardar niveles:', error)
    } finally {
      setIsSavingNiveles(false)
    }
  }


  // Mostrar loader mientras se resuelve el id
  if (isLoadingId) {
    return (
      <div className={styles.loadingContainer}>
        <Loader size="large" variant="spinner" color="#007bff" text="Cargando evaluación..." />
      </div>
    )
  }

  return (
    <div>
      <section className={styles.header}>
        <div className={styles.headerContent}>
          {/*  <nav className={styles.breadcrumb}>
            <a href="/admin" className={styles.breadcrumbItem}>Admin</a>
            <span className={styles.breadcrumbSeparator}>/</span>
            <a href="/admin/docentes" className={styles.breadcrumbItem}>Docentes</a>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbItem}>Conocimiento Pedagógico</span>
          </nav> */}

          <div className={styles.titleContainer}>
            {tituloDeCabecera ? (
              <>
                <div className={styles.titleContainerOptions}>
                  <h1 className={styles.title}>{evaluacionEscalaLikert.name}</h1>
                  <button
                    className={styles.editButton}
                    onClick={handleEdit}
                    title="Editar título"
                  >
                    <HiPencil className={styles.editIcon} />
                  </button>

                </div>
                {/* <p className={styles.subtitle}>Evaluación de conocimiento pedagógico docente</p> */}
              </>
            ) : (
              <div className={styles.loading}>
                <div className={styles.loadingSpinner}></div>
                Cargando título...
              </div>
            )}

            <div className={styles.titleButtons}>
              <button
                className={styles.visibilityButton}
                onClick={() => setShowScoreModal(true)}
                title="Ver puntajes"
              >
                <HiChartBar className={styles.visibilityIcon} />
              </button>
              <button
                className={styles.visibilityButton}
                onClick={handleToggleVisibility}
                title={evaluacionEscalaLikert?.active ? "Ocultar evaluación" : "Mostrar evaluación"}
              >
                {evaluacionEscalaLikert?.active ? (
                  <HiEye className={styles.visibilityIcon} />
                ) : (
                  <HiEyeOff className={styles.visibilityIcon} />
                )}
              </button>
              <Link href={`/admin/conocimientos-pedagogicos/autoreporte/reporte/${id}`}>
                <button
                  className={styles.reportButton}
                  title="Ver reporte"
                >
                  Reporte
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de descripción del link */}
      <section className={styles.descripcionSection}>
        <div className={styles.descripcionHeader}>
          <h3 className={styles.descripcionTitle}>Descripción para Link de Documentos</h3>
          <button
            className={`${styles.editButton} ${isEditingDescripcion ? styles.cancelButton : ''}`}
            onClick={isEditingDescripcion ? handleCancelDescripcion : handleEditDescripcion}
            disabled={isSavingDescripcion}
            title={isEditingDescripcion ? 'Cancelar edición' : 'Editar descripción'}
          >
            {isEditingDescripcion ? (
              <HiX className={styles.editIcon} />
            ) : (
              <HiPencil className={styles.editIcon} />
            )}
          </button>
        </div>

        <div className={styles.editDescripcionContainer}>
          <textarea
            value={isEditingDescripcion ? editDescripcionLink : (evaluacionEscalaLikert.descripcionLink || '')}
            onChange={(e) => setEditDescripcionLink(e.target.value)}
            className={styles.descripcionTextarea}
            placeholder="Ingrese la descripción para el link de documentos..."
            rows={3}
            disabled={!isEditingDescripcion}
          />
          {isEditingDescripcion && (
            <div className={styles.editDescripcionActions}>
              <button
                className={styles.cancelButton}
                onClick={handleCancelDescripcion}
                disabled={isSavingDescripcion}
              >
                Cancelar
              </button>
              <button
                className={styles.saveButton}
                onClick={handleSaveDescripcion}
                disabled={isSavingDescripcion || !editDescripcionLink.trim()}
              >
                {isSavingDescripcion ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>
      </section>
      {/* Resumen de Niveles y Puntajes */}
      <section className={styles.questionsSection} style={{ marginBottom: '2rem' }}>
        <div className={styles.questionsHeader}>
          <h2 className={styles.questionsTitle}>Resumen de Niveles y Puntajes</h2>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
          padding: '0 0.5rem'
        }}>
          {niveles.map((nivel, index) => (
            <div key={index} style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderTop: `4px solid ${nivel.color}`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <span style={{
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '0.5rem',
                fontSize: '1rem'
              }}>
                {nivel.nivel}
              </span>
              <div style={{
                background: '#f8fafc',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.9rem',
                color: '#475569',
                fontWeight: 500,
                border: '1px solid #e2e8f0'
              }}>
                {nivel.min} - {nivel.max} pts
              </div>
            </div>
          ))}
        </div>
      </section>



      {/* Sección de preguntas */}
      <section className={styles.questionsSection}>
        <div className={styles.questionsHeader}>
          <h2 className={styles.questionsTitle}>Preguntas de la Evaluación</h2>
          <div className={styles.questionsControls}>
            <button
              className={styles.editOptionsButton}
              onClick={handleEditOptions}
              title="Editar opciones de respuesta"
            >
              <HiPencil className={styles.editIcon} />
              Editar Opciones
            </button>
            <button
              className={styles.addQuestionButton}
              onClick={handleAddQuestion}
              title="Agregar nueva pregunta"
            >
              <HiPlus className={styles.addIcon} />
              Agregar Pregunta
            </button>
          </div>
        </div>


        {/* Mostrar opciones globales */}
        {/* <div className={styles.globalOptionsPreview}>
          <h3 className={styles.optionsPreviewTitle}>Opciones de Respuesta:</h3>
          <div className={styles.optionsPreviewList}>
            {opcionesGlobales.map((opcion, index) => (
              <span key={index} className={styles.optionPreview}>
                {opcion.value + 1}. {opcion.name}
              </span>
            ))}
          </div>
        </div> */}

        {/* Botones de control de orden */}
        {hasChanges && (
          <div className={styles.orderControls}>
            <div className={styles.orderControlsInfo}>
              <span>Hay cambios pendientes en el orden de las preguntas</span>
            </div>
            <div className={styles.orderControlsButtons}>
              <button
                className={styles.cancelOrderButton}
                onClick={handleCancelOrder}
                disabled={isSavingOrder}
                title="Cancelar cambios"
              >
                Cancelar
              </button>
              <button
                className={styles.saveOrderButton}
                onClick={handleSaveOrder}
                disabled={isSavingOrder}
                title="Guardar cambios"
              >
                {isSavingOrder ? (
                  <Loader size="small" variant="spinner" color="#ffffff" text="Guardando..." />
                ) : (
                  'Guardar Orden'
                )}
              </button>
            </div>
          </div>
        )}

        <div className={`${styles.questionsList} ${isReordering ? styles.reordering : ''}`}>
          {preguntasLocales.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No hay preguntas agregadas aún</p>
              <p>Haz clic en &quot;Agregar Pregunta&quot; para comenzar</p>
            </div>
          ) : (
            preguntasLocales
              .sort((a, b) => (a.orden || 0) - (b.orden || 0))
              .map((pregunta, index) => (
                <div
                  key={pregunta.id}
                  className={`${styles.questionCard} ${movingQuestionId === pregunta.id ? styles.moving : ''}`}
                >
                  <div className={styles.questionContent}>
                    <h3 className={styles.questionText}>
                      {index + 1}. {pregunta.pregunta}
                    </h3>
                    <div className={styles.questionControls}>
                      <button
                        className={styles.editQuestionButton}
                        onClick={() => handleEditQuestion(pregunta.id || '', pregunta.pregunta)}
                        disabled={isSavingOrder || isReordering}
                        title="Editar pregunta"
                      >
                        <HiPencil className={styles.editIcon} />
                      </button>
                      <button
                        className={`${styles.moveButton} ${movingQuestionId === pregunta.id ? styles.animating : ''}`}
                        onClick={() => handleMoveUp(pregunta.id || '')}
                        disabled={index === 0 || isSavingOrder || isReordering}
                        title="Mover hacia arriba"
                      >
                        <HiArrowUp className={styles.moveIcon} />
                      </button>
                      <button
                        className={`${styles.moveButton} ${movingQuestionId === pregunta.id ? styles.animating : ''}`}
                        onClick={() => handleMoveDown(pregunta.id || '')}
                        disabled={index === preguntasLocales.length - 1 || isSavingOrder || isReordering}
                        title="Mover hacia abajo"
                      >
                        <HiArrowDown className={styles.moveIcon} />
                      </button>
                      <button
                        className={styles.deleteQuestionButton}
                        onClick={() => handleDeleteQuestion(pregunta.id || '')}
                        disabled={isSavingOrder || isReordering}
                        title="Eliminar pregunta"
                      >
                        <HiTrash className={styles.deleteIcon} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </section>

      {/* Modal de edición */}
      {isEditing && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Editar Título de la Evaluación</h3>
            <div className={styles.inputContainer}>
              <input
                type="text"
                value={editTitulo}
                onChange={(e) => setEditTitulo(e.target.value)}
                className={styles.editInput}
                placeholder="Ingrese el nuevo título"
                autoFocus
              />
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                className={styles.saveButton}
                onClick={handleSave}
                disabled={isSaving || !editTitulo.trim()}
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar pregunta */}
      {showAddQuestion && (
        <div className={styles.modalOverlay}>
          <div className={styles.questionModalContent}>
            <h3 className={styles.modalTitle}>Agregar Nueva Pregunta</h3>

            <div className={styles.inputContainer}>
              <label className={styles.inputLabel}>Texto de la pregunta:</label>
              <textarea
                value={nuevaPregunta.texto}
                onChange={(e) => setNuevaPregunta({ ...nuevaPregunta, texto: e.target.value })}
                className={styles.questionTextarea}
                placeholder="Ingrese la pregunta aquí..."
                rows={3}
              />
            </div>

            {/* <div className={styles.optionsInfo}>
              <p className={styles.optionsInfoText}>
                Esta pregunta usará las opciones de respuesta globales configuradas para toda la evaluación.
              </p>
              <div className={styles.currentOptionsPreview}>
                <strong>Opciones actuales:</strong>
                <div className={styles.optionsPreviewList}>
                  {(evaluacionEscalaLikert?.puntaje 
                    ? convertEscalaLikertToOpciones(evaluacionEscalaLikert.puntaje)
                    : opcionesGlobales
                  ).map((opcion, index) => (
                    <span key={index} className={styles.optionPreview}>
                      {opcion.value + 1}. {opcion.name}
                    </span>
                  ))}
                </div>
              </div>
            </div> */}

            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={handleCancelQuestion}
                disabled={isSavingQuestion}
              >
                Cancelar
              </button>
              <button
                className={styles.saveButton}
                onClick={handleSaveQuestion}
                disabled={!nuevaPregunta.texto.trim() || isSavingQuestion}
              >
                {isSavingQuestion ? (
                  <Loader size="small" variant="spinner" color="#ffffff" text='guardando' />

                ) : (
                  'Guardar Pregunta'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar opciones globales */}
      {showEditOptions && (
        <div className={styles.modalOverlay}>
          <div className={styles.questionModalContent}>
            <h3 className={styles.modalTitle}>Editar Opciones de Respuesta</h3>

            <div className={styles.optionsContainer}>
              <div className={styles.optionsHeader}>
                <label className={styles.inputLabel}>
                  {evaluacionEscalaLikert?.puntaje ? 'Opciones de respuesta con puntaje:' : 'Opciones de respuesta globales:'}
                </label>
                <div className={styles.optionsControls}>
                  <span className={styles.optionsCount}>
                    {(evaluacionEscalaLikert?.puntaje
                      ? convertEscalaLikertToOpciones(evaluacionEscalaLikert.puntaje)
                      : opcionesGlobales
                    ).length} opción{(evaluacionEscalaLikert?.puntaje
                      ? convertEscalaLikertToOpciones(evaluacionEscalaLikert.puntaje)
                      : opcionesGlobales
                    ).length !== 1 ? 'es' : ''}
                  </span>
                  {(evaluacionEscalaLikert?.puntaje
                    ? convertEscalaLikertToOpciones(evaluacionEscalaLikert.puntaje)
                    : opcionesGlobales
                  ).length < 10 && (
                      <button
                        type="button"
                        onClick={addGlobalOption}
                        className={styles.addOptionButton}
                      >
                        + Agregar Opción
                      </button>
                    )}
                </div>
              </div>

              {(evaluacionEscalaLikert?.puntaje
                ? convertEscalaLikertToOpciones(evaluacionEscalaLikert.puntaje)
                : opcionesGlobales
              ).map((opcion, index) => (
                <div key={index} className={styles.optionInputContainer}>
                  <span className={styles.optionNumber}>{opcion.value + 1}.</span>
                  <input
                    type="text"
                    value={opcion.name}
                    onChange={(e) => handleGlobalOptionChange(index, e.target.value)}
                    className={styles.optionInput}
                    placeholder={`Opción ${opcion.value + 1}`}
                  />
                  {(evaluacionEscalaLikert?.puntaje
                    ? convertEscalaLikertToOpciones(evaluacionEscalaLikert.puntaje)
                    : opcionesGlobales
                  ).length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeGlobalOption(index)}
                        className={styles.removeOptionButton}
                        title="Eliminar opción"
                      >
                        ×
                      </button>
                    )}
                </div>
              ))}
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={handleCancelOptions}
              >
                Cancelar
              </button>
              <button
                className={styles.saveButton}
                onClick={handleSaveOptions}
                disabled={(evaluacionEscalaLikert?.puntaje
                  ? convertEscalaLikertToOpciones(evaluacionEscalaLikert.puntaje)
                  : opcionesGlobales
                ).some(op => !op.name.trim())}
              >
                Guardar Opciones
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rango de Nivel */}
      {showScoreModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '600px', padding: '0' }}>
            <div style={{ padding: '2rem 2rem 1rem 2rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 className={styles.modalTitle} style={{ marginBottom: '0.5rem', textAlign: 'left' }}>Rango de niveles</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
                {isEditingNiveles
                  ? 'Edite los rangos de puntaje para cada nivel de logro.'
                  : 'Visualización de los rangos de puntaje configurados.'}
              </p>
            </div>

            <div className={styles.nivelesContainer} style={{ padding: '2rem', maxHeight: '60vh', overflowY: 'auto' }}>
              {isEditingNiveles ? (
                // MODO EDICIÓN
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem', padding: '0 0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>Nivel</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>Mínimo</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>Máximo</span>
                  </div>

                  {niveles.map((nivel, index) => (
                    <div key={index} style={{
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 1fr 1fr',
                      gap: '1rem',
                      alignItems: 'center',
                      padding: '1rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          backgroundColor: nivel.color,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}></div>
                        <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>{nivel.nivel}</span>
                      </div>
                      <input
                        type="number"
                        value={nivel.min}
                        onChange={(e) => handleNivelChange(index, 'min', e.target.value)}
                        className={styles.editInput}
                        placeholder="0"
                        style={{ padding: '0.5rem', height: 'auto', textAlign: 'center' }}
                      />
                      <input
                        type="number"
                        value={nivel.max}
                        onChange={(e) => handleNivelChange(index, 'max', e.target.value)}
                        className={styles.editInput}
                        placeholder="100"
                        style={{ padding: '0.5rem', height: 'auto', textAlign: 'center' }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                // MODO VISUALIZACIÓN
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {niveles.map((nivel, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      background: 'white',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${nivel.color}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      transition: 'transform 0.2s ease',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: `${nivel.color}20`,
                          color: nivel.color,
                          fontWeight: 'bold',
                          fontSize: '0.9rem'
                        }}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1rem', fontWeight: 600 }}>{nivel.nivel}</h4>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: '#f1f5f9',
                        padding: '0.4rem 1rem',
                        borderRadius: '20px',
                        fontWeight: 500,
                        color: '#475569',
                        fontSize: '0.9rem'
                      }}>
                        <span>{nivel.min} pts</span>
                        <HiArrowDown style={{ transform: 'rotate(-90deg)', color: '#94a3b8' }} />
                        <span>{nivel.max} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.modalActions} style={{ padding: '1rem 2rem 2rem 2rem', borderTop: '1px solid #e2e8f0', marginTop: 0 }}>
              {isEditingNiveles ? (
                <>
                  <button
                    className={styles.cancelButton}
                    onClick={() => {
                      setIsEditingNiveles(false)
                      // Restaurar valores originales si se cancela podría ser una mejora futura
                    }}
                    disabled={isSavingNiveles}
                  >
                    Cancelar
                  </button>
                  <button
                    className={styles.saveButton}
                    onClick={handleSaveNiveles}
                    disabled={isSavingNiveles}
                  >
                    {isSavingNiveles ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setShowScoreModal(false)}
                  >
                    Cerrar
                  </button>
                  <button
                    className={styles.saveButton}
                    onClick={() => setIsEditingNiveles(true)}
                  >
                    <HiPencil style={{ marginRight: '0.5rem' }} />
                    Editar Rangos
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar pregunta */}
      {editingQuestionId && (
        <div className={styles.modalOverlay}>
          <div className={styles.questionModalContent}>
            <h3 className={styles.modalTitle}>Editar Pregunta</h3>

            <div className={styles.inputContainer}>
              <label className={styles.inputLabel}>Texto de la pregunta:</label>
              <textarea
                value={editQuestionText}
                onChange={(e) => setEditQuestionText(e.target.value)}
                className={styles.questionTextarea}
                placeholder="Ingrese la pregunta aquí..."
                rows={3}
                autoFocus
              />
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={handleCancelQuestionEdit}
                disabled={isSavingQuestionEdit}
              >
                Cancelar
              </button>
              <button
                className={styles.saveButton}
                onClick={handleSaveQuestionEdit}
                disabled={!editQuestionText.trim() || isSavingQuestionEdit}
              >
                {isSavingQuestionEdit ? (
                  <Loader size="small" variant="spinner" color="#ffffff" text="Guardando..." />
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar pregunta */}
      {deletingQuestionId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Confirmar Eliminación</h3>
            <div className={styles.confirmationContent}>
              <p>¿Está seguro de que desea eliminar esta pregunta?</p>
              <p className={styles.warningText}>
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={handleCancelDelete}
                disabled={isDeletingQuestion}
              >
                Cancelar
              </button>
              <button
                className={styles.deleteConfirmButton}
                onClick={handleConfirmDelete}
                disabled={isDeletingQuestion}
              >
                {isDeletingQuestion ? (
                  <Loader size="small" variant="spinner" color="#ffffff" text="Eliminando..." />
                ) : (
                  'Eliminar Pregunta'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EvaluacionEscalaLikert