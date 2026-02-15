import { User } from '@/features/types/types'
import React, { useState } from 'react'
import styles from './tablasUsuarios.module.css'
import Link from 'next/link'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { convertRolToPath, convertRolToTitle } from '@/fuctions/regiones'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'
import { RiDeleteBinLine } from 'react-icons/ri'
import { MdEditSquare } from 'react-icons/md'
import UpdateDataDocente from '@/modals/updateDocente'
import DeleteUsuario from '@/modals/deleteUsuario'
import Loader from '@/components/loader/loader'
import { useEffect } from 'react'


interface TablaUsuariosProps {
	docentesDeDirectores: User[],
	rol: number
}
const TablaDirectores = ({ docentesDeDirectores, rol }: TablaUsuariosProps) => {
	const { currentUserData, resultadoBusquedaUsuario, lastVisible, warningDataDocente } = useGlobalContext()
	const [dniUsuario, setDniUsuario] = useState<string>("")
	const [error, setError] = useState<string>("")
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const { getDirectorFromEspecialistaCurricular, getNextUsuarios, getPreviousUsuarios, getNextUsuariosEspecialista, getPreviousUsuariosEspecialista, getNextDirectoresAdmin, getPreviousDirectoresAdmin } = useEvaluacionCurricular()
	const [docente, setDocente] = useState<User>({})
	const [showUpdateDataDocente, setShowUpdateDataDocente] = useState(false)
	const [showDeleteUsuario, setShowDeleteUsuario] = useState(false)

	useEffect(() => {
		if (Object.keys(resultadoBusquedaUsuario).length > 0 || warningDataDocente) {
			setIsLoading(false)
		}
	}, [resultadoBusquedaUsuario, warningDataDocente])

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (dniUsuario.length !== 8) {
			setError("El DNI debe tener 8 dígitos")
			return
		} else {
			setIsLoading(true)
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



	return (
		<div className={styles.tableSection}>
			{
				showUpdateDataDocente &&
				<UpdateDataDocente
					dataDocente={docente}
					onClose={() => setShowUpdateDataDocente(false)}
				/>
			}
			{
				showDeleteUsuario &&
				<DeleteUsuario handleShowModalDelete={() => setShowDeleteUsuario(false)} idUsuario={`${docente.dni}`} />
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

				{isLoading ? (
					<div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
						<Loader variant="spinner" size="medium" text="Buscando directivo..." />
					</div>
				) : Object.keys(resultadoBusquedaUsuario).length > 0 ? (
					<div className={styles.resultadoBusqueda}>
						<div className={styles.resultadoBusquedaHeader}>
							<h3>Resultado de la búsqueda</h3>
							<div className={styles.actions}>
								<MdEditSquare onClick={() => { setDocente(resultadoBusquedaUsuario); setShowUpdateDataDocente(!showUpdateDataDocente) }} className={styles.editButton} />
								<RiDeleteBinLine onClick={() => { setShowDeleteUsuario(!showDeleteUsuario); setDocente(resultadoBusquedaUsuario) }} className={styles.deleteButton} />
							</div>

						</div>
						<p><strong>DNI:</strong> {resultadoBusquedaUsuario.dni}</p>
						<p><strong>Nombres:</strong> {resultadoBusquedaUsuario.nombres?.toLocaleUpperCase()}</p>
						<p><strong>Apellidos:</strong> {resultadoBusquedaUsuario.apellidos?.toLocaleUpperCase()}</p>
					</div>
				) : (
					<p>{warningDataDocente}</p>
				)}
			</div>
			<table className={styles.table}>
				<thead className={styles.tableHeader}>
					<tr>
						<th>#</th>
						<th>DNI</th>
						<th>Directores</th>
						<th></th>
					</tr>
				</thead>
				<tbody className={styles.tableBody}>
					{
						docentesDeDirectores?.map((director, index) => {
							return (
								<tr key={index} className={styles.tableRow}>
									<td className={styles.tableCell}>
										{index + 1}
									</td>
									<td className={styles.tableCell}>
										{director.dni}
									</td>
									<td className={styles.tableCell}>
										{director.nombres?.toLocaleUpperCase()} {director.apellidos?.toLocaleUpperCase()}
									</td>
									<td >
										<div className={styles.actions}>
											<MdEditSquare onClick={() => { setDocente(director); setShowUpdateDataDocente(!showUpdateDataDocente) }} className={styles.editButton} />
											<RiDeleteBinLine onClick={() => { setShowDeleteUsuario(!showDeleteUsuario); setDocente(director) }} className={styles.deleteButton} />
										</div>
									</td>
								</tr>
							)
						})
					}
				</tbody>
			</table>
			{/* Paginación solo para administradores */}
			{currentUserData.rol === 4 && (
				<div className={styles.paginationContainer} style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px' }}>
					<button
						className={styles.button}
						onClick={() => getPreviousDirectoresAdmin()}
						disabled={!lastVisible} // Ajustar lógica si es necesario, pero getPrevious maneja internamente si puede retroceder
						style={{ opacity: 1, cursor: 'pointer' }}
					>
						Anterior
					</button>
					<button
						className={styles.button}
						onClick={() => getNextDirectoresAdmin(lastVisible)}
						disabled={docentesDeDirectores.length < 50}
						style={{ opacity: docentesDeDirectores.length < 50 ? 0.5 : 1, cursor: docentesDeDirectores.length < 50 ? 'not-allowed' : 'pointer' }}
					>
						Siguiente
					</button>
				</div>
			)}
		</div>
	)
}

export default TablaDirectores