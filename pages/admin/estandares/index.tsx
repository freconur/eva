import { useGlobalContext } from '@/features/context/GlolbalContext'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'
import { nivelCurricular } from '@/fuctions/regiones'
import React, { useEffect, useState } from 'react'
import estilos from './estandares.module.css'
import { doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import { PaHanilidad } from '@/features/types/types'
import type { EstandaresCurriculares } from '@/features/types/types'
import { FaArrowUp, FaArrowDown } from 'react-icons/fa'
import { collection, query, orderBy, getDocs, writeBatch } from 'firebase/firestore'
import { MdEdit, MdDelete } from 'react-icons/md'
import { ImSpinner8 } from 'react-icons/im'

const EstandaresCurriculares = () => {
	const { preguntasEstandar,estandaresCurriculares } = useGlobalContext()
	const [selectedEstandar, setSelectedEstandar] = useState<string>('1')
	const { getEstandaresCurriculares, updatePreguntaEstandar, createPreguntaEstandar, reorderPreguntaEstandar,  getInstrumentos, crearNuevoInstrumento} = useEvaluacionCurricular()
	const db = getFirestore()
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [isNewInstrumentModalOpen, setIsNewInstrumentModalOpen] = useState(false)
	const [selectedPregunta, setSelectedPregunta] = useState<PaHanilidad | null>(null)
	const [editText, setEditText] = useState('')
	const [newPreguntaText, setNewPreguntaText] = useState('')
	const [preguntaToDelete, setPreguntaToDelete] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [newInstrumentName, setNewInstrumentName] = useState('')
	const [isEditEstandarModalOpen, setIsEditEstandarModalOpen] = useState(false)
	const [editEstandarName, setEditEstandarName] = useState('')
	const [selectedEstandarToEdit, setSelectedEstandarToEdit] = useState<EstandaresCurriculares | null>(null)
	const [isDeleteInstrumentModalOpen, setIsDeleteInstrumentModalOpen] = useState(false)
	const [instrumentToDelete, setInstrumentToDelete] = useState<EstandaresCurriculares | null>(null)

	const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedEstandar(e.target.value)
		setIsLoading(true)
		await getEstandaresCurriculares(e.target.value)
		setIsLoading(false)
	}

	const handleUpdate = (pregunta: PaHanilidad) => {
		if (pregunta.id && pregunta.habilidad) {
			setSelectedPregunta(pregunta)
			setEditText(pregunta.habilidad)
			setIsModalOpen(true)
		}
	}

	const handleSaveUpdate = async () => {
		if (selectedPregunta?.id && editText.trim()) {
			setIsLoading(true)
			await updatePreguntaEstandar(selectedEstandar, selectedPregunta.id, { habilidad: editText })
			setIsModalOpen(false)
			setSelectedPregunta(null)
			setEditText('')
			setIsLoading(false)
		}
	}

	const handleCreatePregunta = async () => {
		if (newPreguntaText.trim()) {
			setIsLoading(true)
			await createPreguntaEstandar(selectedEstandar, newPreguntaText)
			setIsCreateModalOpen(false)
			setNewPreguntaText('')
			setIsLoading(false)
		}
	}

	const handleDelete = async (id: string) => {
		setPreguntaToDelete(id)
		setIsDeleteModalOpen(true)
	}

	const confirmDelete = async () => {
		if (preguntaToDelete) {
			try {
				setIsLoading(true)
				// Primero eliminamos la pregunta
				await deleteDoc(doc(db, `/evaluacion-curricular-preguntas-alternativas/nivel-${selectedEstandar}/preguntas`, preguntaToDelete))

				// Obtenemos todas las preguntas restantes
				const pathRef = collection(db, `/evaluacion-curricular-preguntas-alternativas/nivel-${selectedEstandar}/preguntas`)
				const q = query(pathRef, orderBy('order', 'asc'))
				const querySnapshot = await getDocs(q)

				// Actualizamos el orden de las preguntas restantes
				const batch = writeBatch(db)
				let newOrder = 1

				querySnapshot.forEach((doc) => {
					const docRef = doc.ref
					batch.update(docRef, { order: newOrder, id: `${newOrder}` })
					newOrder++
				})

				// Ejecutamos todas las actualizaciones
				await batch.commit()

				// Actualizamos la lista de preguntas
				await getEstandaresCurriculares(selectedEstandar)
				setIsDeleteModalOpen(false)
				setPreguntaToDelete(null)
				setIsLoading(false)
			} catch (error) {
				console.error('Error al eliminar la pregunta:', error)
				setIsLoading(false)
			}
		}
	}

	const handleMoveQuestion = async (pregunta: PaHanilidad, direction: 'up' | 'down') => {
		if (!pregunta.id || !pregunta.order) return

		const currentIndex = preguntasEstandar.findIndex(p => p.id === pregunta.id)
		if (currentIndex === -1) return

		const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
		if (newIndex < 0 || newIndex >= preguntasEstandar.length) return

		const newOrder = preguntasEstandar[newIndex].order
		if (newOrder) {
			setIsLoading(true)
			await reorderPreguntaEstandar(selectedEstandar, pregunta.id, newOrder)
			setIsLoading(false)
		}
	}

	const handleCreateNewInstrument = () => {
		setIsNewInstrumentModalOpen(true)
	}

	const handleSaveNewInstrument = async () => {
		if (newInstrumentName.trim()) {
			setIsLoading(true)
			// Aquí irá la lógica para crear el nuevo instrumento
			await crearNuevoInstrumento(newInstrumentName)
			setIsNewInstrumentModalOpen(false)
			setNewInstrumentName('')
			setIsLoading(false)
		}
	}

	const handleEditEstandar = (estandar: EstandaresCurriculares) => {
		setSelectedEstandarToEdit(estandar)
		setEditEstandarName(estandar.name || '')
		setIsEditEstandarModalOpen(true)
	}

	const handleSaveEditEstandar = async () => {
		if (selectedEstandarToEdit?.id && editEstandarName.trim()) {
			setIsLoading(true)
			try {
				const docRef = doc(db, `/evaluacion-curricular-preguntas-alternativas`, selectedEstandarToEdit.id)
				await updateDoc(docRef, { name: editEstandarName })
				setIsEditEstandarModalOpen(false)
				setSelectedEstandarToEdit(null)
				setEditEstandarName('')
				await getInstrumentos()
			} catch (error) {
				console.error('Error al actualizar el estándar:', error)
			}
			setIsLoading(false)
		}
	}

	const handleDeleteInstrument = (instrument: EstandaresCurriculares) => {
		setInstrumentToDelete(instrument)
		setIsDeleteInstrumentModalOpen(true)
	}

	const confirmDeleteInstrument = async () => {
		if (instrumentToDelete?.id) {
		console.log(instrumentToDelete)
			setIsLoading(true)
			try {
				await deleteDoc(doc(db, `/evaluacion-curricular-preguntas-alternativas`, instrumentToDelete.id))
				/* await getInstrumentos() */
				setIsDeleteInstrumentModalOpen(false)
				setInstrumentToDelete(null)
			} catch (error) {
				console.error('Error al eliminar el instrumento:', error)
			}
			setIsLoading(false)
		}
	}

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true)
			await getEstandaresCurriculares(selectedEstandar)
			setIsLoading(false)
		}
		loadData()
	}, [selectedEstandar])
	useEffect(() => {
		getInstrumentos()
	},[])
	return (
		<div className={estilos.container}>

			
			<div>
				<h1 className={estilos.title}>Estándares curriculares</h1>

				<select
					className={estilos.select}
					value={selectedEstandar}
					onChange={handleChange}
				>
					<option value="">Seleccione un estándar</option>
					{
						estandaresCurriculares.map((nivel) => (
							<option key={nivel.nivel} value={nivel.nivel}>{nivel.name?.toUpperCase()}</option>
						))
					}
				</select>

				<button
					className={estilos.addButton}
					onClick={() => setIsCreateModalOpen(true)}
				>
					Agregar habilidad
				</button>
				<button
					className={estilos.createButton}
					onClick={handleCreateNewInstrument}
				>
					crear nuevo instrumento
				</button>
				<button
					className={estilos.updateButton}
					onClick={() => {
						const estandar = estandaresCurriculares.find(e => e.nivel?.toString() === selectedEstandar)
						if (estandar) {
							handleEditEstandar(estandar)
						}
					}}
					disabled={!selectedEstandar}
					title="Editar estándar"
				>
					<MdEdit />
				</button>
				<button
					className={estilos.deleteButton}
					onClick={() => {
						const estandar = estandaresCurriculares.find(e => e.nivel?.toString() === selectedEstandar)
						if (estandar) {
							handleDeleteInstrument(estandar)
						}
					}}
					disabled={!selectedEstandar}
					title="Eliminar estándar"
				>
					<MdDelete />
				</button>
			</div>

			{isLoading ? (
				<div className={estilos.loaderContainer}>
					<ImSpinner8 className={estilos.loaderIcon} />
					<span className={estilos.loaderText}>Cargando...</span>
				</div>
			) : (
				<div className={estilos.questionsContainer}>
					{
						preguntasEstandar.map((pregunta) => (
							<div key={pregunta.id} className={estilos.questionCard}>
								<div>
									<span className={estilos.questionText}><strong>{pregunta.order}. </strong>{pregunta.habilidad}</span>
								</div>
								<div className={estilos.actions}>
									<div className={estilos.orderButtons}>
										<button
											onClick={() => handleMoveQuestion(pregunta, 'up')}
											disabled={pregunta.order === 1}
											className={estilos.orderButton}
										>
											<FaArrowUp />
										</button>
										<button
											onClick={() => handleMoveQuestion(pregunta, 'down')}
											disabled={pregunta.order === preguntasEstandar.length}
											className={estilos.orderButton}
										>
											<FaArrowDown />
										</button>
									</div>
									<button
										className={estilos.updateButton}
										onClick={() => handleUpdate(pregunta)}
									>
										<MdEdit />
									</button>
									<button
										className={estilos.deleteButton}
										onClick={() => pregunta.id && handleDelete(pregunta.id)}
									>
										<MdDelete />
									</button>
								</div>
							</div>
						))
					}
				</div>
			)}

			{isModalOpen && (
				<div className={estilos.modalOverlay}>
					<div className={estilos.modal}>
						<h2>Actualizar Pregunta</h2>
						<textarea
							className={estilos.modalTextarea}
							value={editText}
							onChange={(e) => setEditText(e.target.value)}
						/>
						<div className={estilos.modalActions}>
							<button
								className={estilos.modalButton}
								onClick={handleSaveUpdate}
								disabled={isLoading}
							>
								{isLoading ? 'Guardando...' : 'Guardar'}
							</button>
							<button
								className={estilos.modalButtonCancel}
								onClick={() => {
									setIsModalOpen(false)
									setSelectedPregunta(null)
									setEditText('')
								}}
								disabled={isLoading}
							>
								Cancelar
							</button>
						</div>
					</div>
				</div>
			)}

			{isCreateModalOpen && (
				<div className={estilos.modalOverlay}>
					<div className={estilos.modal}>
						<h2>Nueva Pregunta</h2>
						<textarea
							className={estilos.modalTextarea}
							value={newPreguntaText}
							onChange={(e) => setNewPreguntaText(e.target.value)}
							placeholder="Ingrese la nueva pregunta..."
						/>
						<div className={estilos.modalActions}>
							<button
								className={estilos.modalButton}
								onClick={handleCreatePregunta}
								disabled={isLoading}
							>
								{isLoading ? 'Creando...' : 'Crear'}
							</button>
							<button
								className={estilos.modalButtonCancel}
								onClick={() => {
									setIsCreateModalOpen(false)
									setNewPreguntaText('')
								}}
								disabled={isLoading}
							>
								Cancelar
							</button>
						</div>
					</div>
				</div>
			)}

			{isDeleteModalOpen && (
				<div className={estilos.modalOverlay}>
					<div className={estilos.modal}>
						<h2>Confirmar Eliminación</h2>
						<p>¿Está seguro que desea eliminar esta pregunta? Esta acción no se puede deshacer.</p>
						<div className={estilos.modalActions}>
							<button
								className={estilos.modalButton}
								onClick={confirmDelete}
								disabled={isLoading}
							>
								{isLoading ? 'Eliminando...' : 'Eliminar'}
							</button>
							<button
								className={estilos.modalButtonCancel}
								onClick={() => {
									setIsDeleteModalOpen(false)
									setPreguntaToDelete(null)
								}}
								disabled={isLoading}
							>
								Cancelar
							</button>
						</div>
					</div>
				</div>
			)}

			{isNewInstrumentModalOpen && (
				<div className={estilos.modalOverlay}>
					<div className={estilos.modal}>
						<h2>Crear Nuevo Instrumento</h2>
						<textarea
							className={estilos.modalTextarea}
							value={newInstrumentName}
							onChange={(e) => setNewInstrumentName(e.target.value)}
							placeholder="Ingrese el nombre del nuevo instrumento..."
						/>
						<div className={estilos.modalActions}>
							<button
								className={estilos.modalButton}
								onClick={handleSaveNewInstrument}
								disabled={isLoading}
							>
								{isLoading ? 'Creando...' : 'Crear'}
							</button>
							<button
								className={estilos.modalButtonCancel}
								onClick={() => {
									setIsNewInstrumentModalOpen(false)
									setNewInstrumentName('')
								}}
								disabled={isLoading}
							>
								Cancelar
							</button>
						</div>
					</div>
				</div>
			)}

			{isEditEstandarModalOpen && (
				<div className={estilos.modalOverlay}>
					<div className={estilos.modal}>
						<h2>Editar Estándar</h2>
						<textarea
							className={estilos.modalTextarea}
							value={editEstandarName}
							onChange={(e) => setEditEstandarName(e.target.value)}
							placeholder="Ingrese el nuevo nombre del estándar..."
						/>
						<div className={estilos.modalActions}>
							<button
								className={estilos.modalButton}
								onClick={handleSaveEditEstandar}
								disabled={isLoading}
							>
								{isLoading ? 'Guardando...' : 'Guardar'}
							</button>
							<button
								className={estilos.modalButtonCancel}
								onClick={() => {
									setIsEditEstandarModalOpen(false)
									setSelectedEstandarToEdit(null)
									setEditEstandarName('')
								}}
								disabled={isLoading}
							>
								Cancelar
							</button>
						</div>
					</div>
				</div>
			)}

			{isDeleteInstrumentModalOpen && (
				<div className={estilos.modalOverlay}>
					<div className={estilos.modal}>
						<h2>Confirmar Eliminación de Instrumento</h2>
						<p>¿Está seguro que desea eliminar este instrumento? Esta acción no se puede deshacer.</p>
						<div className={estilos.modalActions}>
							<button
								className={estilos.modalButton}
								onClick={confirmDeleteInstrument}
								disabled={isLoading}
							>
								{isLoading ? 'Eliminando...' : 'Eliminar'}
							</button>
							<button
								className={estilos.modalButtonCancel}
								onClick={() => {
									setIsDeleteInstrumentModalOpen(false)
									setInstrumentToDelete(null)
								}}
								disabled={isLoading}
							>
								Cancelar
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default EstandaresCurriculares