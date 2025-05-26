import { User } from '@/features/types/types'
import React, { useState, useEffect } from 'react'
import styles from './tablasUsuarios.module.css'
import Link from 'next/link'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { convertRolToPath, convertRolToTitle } from '@/fuctions/regiones'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'
import UpdateDataDocente from '@/modals/updateDocente'
import DeleteUsuario from '@/modals/deleteUsuario'
import { MdEditSquare } from 'react-icons/md'
import { RiDeleteBinLine } from 'react-icons/ri'

interface TablaUsuariosProps {
	docentesDeDirectores: User[],
	rol: number
}

const TablaUsuariosAdminEspecialistas = ({ docentesDeDirectores, rol }: TablaUsuariosProps) => {
	const { currentUserData, resultadoBusquedaUsuario, lastVisible, warningDataDocente } = useGlobalContext()
	const [dniUsuario, setDniUsuario] = useState<string>("")
	const [error, setError] = useState<string>("")
	const [usuario, setUsuario] = useState<User>({})
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const [showUpdateDataDocente, setShowUpdateDataDocente] = useState(false)
	const [showDeleteUsuario, setShowDeleteUsuario] = useState(false)
	const [currentPage, setCurrentPage] = useState(0)
	const itemsPerPage = 10
	const { getDirectorFromEspecialistaCurricular, getNextUsuariosEspecialista, getPreviousUsuariosEspecialista,getEspecialistaToAdmin } = useEvaluacionCurricular()

	// Calcular los índices para la paginación
	const startIndex = currentPage * itemsPerPage
	const endIndex = startIndex + itemsPerPage
	const currentItems = docentesDeDirectores.slice(startIndex, endIndex)
	const totalPages = Math.ceil(docentesDeDirectores.length / itemsPerPage)

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (dniUsuario.length !== 8) {
			setError("El DNI debe tener 8 dígitos")
			return
		} else {
			getEspecialistaToAdmin(rol, dniUsuario)
			console.log(dniUsuario)
			setError("")
		}
	}

	const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		setDniUsuario(value)
		if (value.length !== 8 && value.length > 0) {
			setError("El DNI debe tener 8 dígitos")
		} else {
			setError("")
		}
	}

	const handleNext = () => {
		if (currentPage < totalPages - 1) {
			setCurrentPage(prev => prev + 1)
		}
	}

	const handlePrevious = () => {
		if (currentPage > 0) {
			setCurrentPage(prev => prev - 1)
		}
	}

	return (
		<div className={styles.tableSection}>
			{
				showUpdateDataDocente &&
				<UpdateDataDocente
					dataDocente={usuario}
					onClose={() => setShowUpdateDataDocente(false)}
				/>
			}
			{
				showDeleteUsuario &&
				<DeleteUsuario handleShowModalDelete={() => setShowDeleteUsuario(false)} idUsuario={`${usuario.dni}`} />
			}
			<h2 className={styles.sectionTitle}>
				<span className={styles.sectionTitleIndicator}></span>
				{convertRolToTitle(rol)}
			</h2>

			<div>
				<form className={styles.formulario} action="" onSubmit={handleSubmit}>
					<div >
						<div className={styles.formGroup}>
							<label htmlFor="">Dni:</label>
							<div className={styles.inputContainer}>
								<input
									className={`${styles.input} ${error ? styles.inputError : ''}`}
									type="text"
									placeholder='escribe el dni'
									onChange={handleDniChange}
									maxLength={8}
								/>
								<button type='submit' className={styles.button}>Buscar</button>
							</div>
							{error && <span className={styles.errorMessage}>{error}</span>}
						</div>
					</div>
				</form>

				{Object.keys(resultadoBusquedaUsuario).length > 0 ? (
					<Link href="" className={styles.resultadoBusqueda}>
						<div className={styles.resultadoBusquedaHeader}>
							<h3>Resultado de la búsqueda</h3>
							<div className={styles.actions}>
								<MdEditSquare onClick={() => { setUsuario(resultadoBusquedaUsuario); setShowUpdateDataDocente(!showUpdateDataDocente) }} className={styles.editButton} />
								<RiDeleteBinLine onClick={() => { setShowDeleteUsuario(!showDeleteUsuario); setUsuario(resultadoBusquedaUsuario) }} className={styles.deleteButton} />
							</div>
						</div>
						<p><strong>DNI:</strong> {resultadoBusquedaUsuario.dni}</p>
						<p><strong>Nombres:</strong> {resultadoBusquedaUsuario.nombres?.toLocaleUpperCase()}</p>
						<p><strong>Apellidos:</strong> {resultadoBusquedaUsuario.apellidos?.toLocaleUpperCase()}</p>
					</Link>
				) : (
					<p>{warningDataDocente}</p>
				)}
			</div>
			<table className={styles.table}>
				<thead className={styles.tableHeader}>
					<tr>
						<th>#</th>
						<th>Dni</th>
						<th>{convertRolToTitle(currentUserData.rol || 0)}</th>
						<th></th>
					</tr>
				</thead>
				<tbody className={styles.tableBody}>
					{
						currentItems?.map((director, index) => {
							return (
								<tr key={index} className={styles.tableRow}>
									<td className={styles.tableCell}>
										<Link href={`/${convertRolToPath(currentUserData.rol || 0)}/cobertura-curricular/curricular/evaluar-curricula?idDocente=${director.dni}`} className={styles.tableLink}>
											{startIndex + index + 1}
										</Link>
									</td>
									<td className={styles.tableCell}>
										<Link href={`/${convertRolToPath(currentUserData.rol || 0)}/cobertura-curricular/curricular/evaluar-curricula?idDocente=${director.dni}`} className={styles.tableLink}>
											{director.dni}
										</Link>
									</td>
									<td className={styles.tableCell}>
										<Link href={`/${convertRolToPath(currentUserData.rol || 0)}/cobertura-curricular/curricular/evaluar-curricula?idDocente=${director.dni}`} className={styles.tableLink}>
											{director.nombres?.toLocaleUpperCase()} {director.apellidos?.toLocaleUpperCase()}
										</Link>
									</td>
									<td >
										<div className={styles.actions}>
											<MdEditSquare onClick={() => { setUsuario(director); setShowUpdateDataDocente(!showUpdateDataDocente) }} className={styles.editButton} />
											<RiDeleteBinLine onClick={() => { setShowDeleteUsuario(!showDeleteUsuario); setUsuario(director) }} className={styles.deleteButton} />
										</div>
									</td>
								</tr>
							)
						})
					}
				</tbody>
			</table>

			<div className={styles.paginationButtons}>
				<button
					onClick={handlePrevious}
					className={styles.paginationButton}
					disabled={currentPage === 0}
				>
					Anterior
				</button>
				<span className={styles.pageInfo}>
					Página {currentPage + 1} de {totalPages}
				</span>
				<button
					onClick={handleNext}
					className={styles.paginationButton}
					disabled={currentPage === totalPages - 1}
				>
					Siguiente
				</button>
			</div>
		</div>
	)
}

export default TablaUsuariosAdminEspecialistas