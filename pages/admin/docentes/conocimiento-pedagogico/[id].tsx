import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useTituloDeCabecera } from '@/features/hooks/useTituloDeCabecera'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { HiPencil, HiPlus, HiArrowUp, HiArrowDown, HiEye, HiEyeOff, HiTrash } from 'react-icons/hi'
import Loader from '@/components/loader/loader'
import styles from './conocimientoPedagogico.module.css'

const EvaluacionEscalaLikert = () => {

const route = useRouter()
const {id} = route.query

const { getTituloDeCabecera, addPuntajeEscalaLikert,tituloDeCabecera, updateTituloDeCabecera,addPreguntasAlternativasEscalaLikert, getPreguntasEvaluacionEscalaLikert, actualizarOrdenesEnBatch, getEvaluacionEscalaLikert, evaluacionEscalaLikert, updatePreguntaTexto, updateEvaluacionEscalaLikert, deletePreguntaEvaluacionEscalaLikert, preguntasEscalaLikert } = useTituloDeCabecera()
const { preguntaEvaluacionLikert  } = useGlobalContext()
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
  const nuevasOpciones = [...opcionesGlobales]
  nuevasOpciones[index] = { name, value: index }
  setOpcionesGlobales(nuevasOpciones)
}

const addGlobalOption = () => {
  if (opcionesGlobales.length < 10) {
    const newValue = opcionesGlobales.length
    setOpcionesGlobales([...opcionesGlobales, { name: '', value: newValue }])
  }
}

const removeGlobalOption = (index: number) => {
  if (opcionesGlobales.length > 2) {
    const nuevasOpciones = opcionesGlobales
      .filter((_, i) => i !== index)
      .map((opcion, i) => ({ ...opcion, value: i }))
    setOpcionesGlobales(nuevasOpciones)
  }
}

const handleSaveOptions = async () => {
  try {
    // Aquí agregar tu función para guardar las opciones globales en Firestore
    console.log('Guardando opciones globales en Firestore:', opcionesGlobales)
    addPuntajeEscalaLikert(id as string, opcionesGlobales)
    // await guardarOpcionesGlobalesEnFirestore(opcionesGlobales)
    setShowEditOptions(false)
  } catch (error) {
    console.error('Error al guardar las opciones globales:', error)
  }
}

const handleCancelOptions = () => {
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
    setHasChanges(prevHasChanges => prevHasChanges !== hayCambios ? hayCambios : prevHasChanges)
  }
}, [preguntasLocales, preguntasOriginales])


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
          <nav className={styles.breadcrumb}>
            <a href="/admin" className={styles.breadcrumbItem}>Admin</a>
            <span className={styles.breadcrumbSeparator}>/</span>
            <a href="/admin/docentes" className={styles.breadcrumbItem}>Docentes</a>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbItem}>Conocimiento Pedagógico</span>
          </nav>
          
          <div className={styles.titleContainer}>
            {tituloDeCabecera ? (
              <>
                <h1 className={styles.title}>{evaluacionEscalaLikert.name}</h1>
                <p className={styles.subtitle}>Evaluación de conocimiento pedagógico docente</p>
              </>
            ) : (
              <div className={styles.loading}>
                <div className={styles.loadingSpinner}></div>
                Cargando título...
              </div>
            )}
            
            <div className={styles.titleButtons}>
              <button 
                className={styles.editButton}
                onClick={handleEdit}
                title="Editar título"
              >
                <HiPencil className={styles.editIcon} />
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
            </div>
          </div>
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
        <div className={styles.globalOptionsPreview}>
          <h3 className={styles.optionsPreviewTitle}>Opciones de Respuesta:</h3>
          <div className={styles.optionsPreviewList}>
            {opcionesGlobales.map((opcion, index) => (
              <span key={index} className={styles.optionPreview}>
                {opcion.value + 1}. {opcion.name}
              </span>
            ))}
          </div>
        </div>
        
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
            
            <div className={styles.optionsInfo}>
              <p className={styles.optionsInfoText}>
                Esta pregunta usará las opciones de respuesta globales configuradas para toda la evaluación.
              </p>
              <div className={styles.currentOptionsPreview}>
                <strong>Opciones actuales:</strong>
                <div className={styles.optionsPreviewList}>
                  {opcionesGlobales.map((opcion, index) => (
                    <span key={index} className={styles.optionPreview}>
                      {opcion.value + 1}. {opcion.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
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
                    <Loader size="small" variant="spinner" color="#ffffff" text='guardando'/>
                    
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
                <label className={styles.inputLabel}>Opciones de respuesta globales:</label>
                <div className={styles.optionsControls}>
                  <span className={styles.optionsCount}>
                    {opcionesGlobales.length} opción{opcionesGlobales.length !== 1 ? 'es' : ''}
                  </span>
                  {opcionesGlobales.length < 10 && (
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
              
              {opcionesGlobales.map((opcion, index) => (
                <div key={index} className={styles.optionInputContainer}>
                  <span className={styles.optionNumber}>{opcion.value + 1}.</span>
                  <input
                    type="text"
                    value={opcion.name}
                    onChange={(e) => handleGlobalOptionChange(index, e.target.value)}
                    className={styles.optionInput}
                    placeholder={`Opción ${opcion.value + 1}`}
                  />
                  {opcionesGlobales.length > 2 && (
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
                disabled={opcionesGlobales.some(op => !op.name.trim())}
              >
                Guardar Opciones
              </button>
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