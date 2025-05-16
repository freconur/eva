import { User } from '@/features/types/types'
import React, { useState } from 'react'
import styles from './tablasUsuarios.module.css'
import Link from 'next/link'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { convertRolToPath, convertRolToTitle } from '@/fuctions/regiones'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'


interface TablaUsuariosProps {
	docentesDeDirectores: User[],
	rol:number
}
const TablaUsuariosAdminEspecialistas = ({ docentesDeDirectores, rol }: TablaUsuariosProps) => {
	const { currentUserData,resultadoBusquedaUsuario,lastVisible,warningDataDocente } = useGlobalContext()
	const [dniUsuario, setDniUsuario] = useState<string>("")
	const [error, setError] = useState<string>("")
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const { getDirectorFromEspecialistaCurricular,getNextUsuarios,getPreviousUsuarios,getNextUsuariosEspecialista, getPreviousUsuariosEspecialista } = useEvaluacionCurricular()
	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (dniUsuario.length !== 8) {
			setError("El DNI debe tener 8 dígitos")
			return
		}else {
			//aqui va la funcion que va a buscar al director
			getDirectorFromEspecialistaCurricular(rol, dniUsuario)
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

	const handleNext = async () => {
		setIsLoading(true)
		try {
			const hasMore = getNextUsuariosEspecialista(lastVisible, rol)
			if (!hasMore) {
				// Aquí podrías mostrar un mensaje de que no hay más registros
			}
		} catch (error) {
			console.error('Error al cargar más usuarios:', error)
		} finally {
			setIsLoading(false)
		}
	}

	const handlePrevious = async () => {
		setIsLoading(true)
		try {
			const hasPrevious = await getPreviousUsuariosEspecialista(lastVisible, rol)
			if (!hasPrevious) {
				// Aquí podrías mostrar un mensaje de que no hay registros anteriores
			}
		} catch (error) {
			console.error('Error al cargar usuarios anteriores:', error)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className={styles.tableSection}>
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
					<Link href={`/${convertRolToPath(currentUserData.rol || 0)}/cobertura-curricular/curricular/evaluar-curricula?idDocente=${resultadoBusquedaUsuario.dni}`} className={styles.resultadoBusqueda}>
						<h3>Resultado de la búsqueda</h3>
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
						<th>{convertRolToTitle(currentUserData.rol || 0)}</th>
					</tr>
				</thead>
				<tbody className={styles.tableBody}>
					{
						docentesDeDirectores?.map((director, index) => {
							return (
								<tr key={index} className={styles.tableRow}>
									<td className={styles.tableCell}>
										<Link href={`/${convertRolToPath(currentUserData.rol || 0)}/cobertura-curricular/curricular/evaluar-curricula?idDocente=${director.dni}`} className={styles.tableLink}>
											{index + 1}
										</Link>
									</td>
									<td className={styles.tableCell}>
										<Link href={`/${convertRolToPath(currentUserData.rol || 0)}/cobertura-curricular/curricular/evaluar-curricula?idDocente=${director.dni}`} className={styles.tableLink}>
											{director.nombres?.toLocaleUpperCase()} {director.apellidos?.toLocaleUpperCase()}
										</Link>
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
					disabled={isLoading}
				>
					{isLoading ? 'Cargando...' : 'Anterior'}
				</button>
				<button 
					onClick={handleNext} 
					className={styles.paginationButton}
					disabled={isLoading}
				>
					{isLoading ? 'Cargando...' : 'Siguiente'}
				</button>
			</div>
		</div>
	)
}

export default TablaUsuariosAdminEspecialistas