import { User } from '@/features/types/types'
import React, { useState } from 'react'
import styles from './tablasUsuarios.module.css'
import Link from 'next/link'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { convertRolToPath, convertRolToTitle, regionTexto } from '@/fuctions/regiones'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'
import { RiDeleteBinLine, RiLoader4Line } from 'react-icons/ri'
import { MdEditSquare } from 'react-icons/md'
import UpdateUsuarioDirector from '@/modals/updateUsuarioDirector'
import DeleteUsuario from '@/modals/deleteUsuario'
import Loader from '@/components/loader/loader'
import { useEffect } from 'react'
import useUsuario from '@/features/hooks/useUsuario'


interface TablaUsuariosProps {
	docentesDeDirectores: User[],
	rol: number,
	isSearching?: boolean,
	isLoadingExternal?: boolean,
	isFiltered?: boolean,
	searchTerm?: string,
	showGestionHelp?: boolean,
	onDisablePopupsPermanently?: () => void
}
const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
	if (!highlight.trim()) return <>{text}</>;

	const parts = text.split(new RegExp(`(${highlight.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi'));
	return (
		<>
			{parts.map((part, index) =>
				part.toLowerCase() === highlight.toLowerCase() ? (
					<mark key={index} style={{ backgroundColor: '#fde047', color: '#1e293b', padding: '0 2px', borderRadius: '2px', fontWeight: '700' }}>{part}</mark>
				) : (
					part
				)
			)}
		</>
	);
};

const TablaDirectores = ({ 
	docentesDeDirectores, 
	rol, 
	isSearching, 
	isLoadingExternal, 
	isFiltered, 
	searchTerm, 
	showGestionHelp, 
	onDisablePopupsPermanently 
}: TablaUsuariosProps) => {
	const [showLocalPopup, setShowLocalPopup] = useState(true)
	const { currentUserData, resultadoBusquedaUsuario, lastVisible, warningDataDocente } = useGlobalContext()
	const [dniUsuario, setDniUsuario] = useState<string>("")
	const [error, setError] = useState<string>("")
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const { getDirectorFromEspecialistaCurricular, getNextUsuarios, getPreviousUsuarios, getNextUsuariosEspecialista, getPreviousUsuariosEspecialista, getNextDirectoresAdmin, getPreviousDirectoresAdmin } = useEvaluacionCurricular()
	const { updateTipoGestion } = useUsuario()
	const [docente, setDocente] = useState<User>({})
	const [showUpdateDirector, setShowUpdateDirector] = useState(false)
	const [idDirector, setIdDirector] = useState<string>("")
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
				showUpdateDirector &&
				<UpdateUsuarioDirector
					idUsuario={idDirector}
					handleShowModal={() => setShowUpdateDirector(false)}
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
								<button type='submit' className={styles.button} disabled={isLoading}>
									{isLoading ? <RiLoader4Line className={styles.buttonSpinner} /> : 'Buscar'}
								</button>
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
								<MdEditSquare onClick={() => { setIdDirector(resultadoBusquedaUsuario.dni || ""); setShowUpdateDirector(true) }} className={styles.editButton} />
								<RiDeleteBinLine onClick={() => { setShowDeleteUsuario(!showDeleteUsuario); setDocente(resultadoBusquedaUsuario) }} className={styles.deleteButton} />
							</div>

						</div>
						<p><strong>DNI:</strong> {resultadoBusquedaUsuario.dni}</p>
						<p><strong>Nombres:</strong> {resultadoBusquedaUsuario.nombres?.toLocaleUpperCase()}</p>
						<p><strong>Apellidos:</strong> {resultadoBusquedaUsuario.apellidos?.toLocaleUpperCase()}</p>
						<p><strong>UGEL:</strong> {regionTexto(String(resultadoBusquedaUsuario.region))}</p>
					</div>
				) : (
					<p>{warningDataDocente}</p>
				)}
			</div>
			<table className={`${styles.table} ${isLoadingExternal ? styles.tableLoading : ''}`}>
				<thead className={styles.tableHeader}>
					<tr>
						<th>#</th>
						<th>DNI</th>
						<th>Directores</th>
						<th>Institución</th>
						<th>UGEL</th>
						<th className={styles.relativeHeader}>
							Gestión
							{showLocalPopup && showGestionHelp && (
								<div className={styles.popupContainerHeader}>
									<div className={styles.tourArrow}></div>
									<div className={styles.tourCardCompact}>
										<div className={styles.tourContentCompact}>
											<span className={styles.newBadge}>NUEVO</span>
											<p>⚙️ Ahora puedes actualizar los datos de gestion de los directores a publico y privado</p>
											<button className={styles.dontShowAgainBtn} onClick={onDisablePopupsPermanently}>
												No volver a mostrar
											</button>
										</div>
										<button className={styles.popupCloseBtn} onClick={() => setShowLocalPopup(false)}>&times;</button>
									</div>
								</div>
							)}
						</th>
						<th></th>
					</tr>
				</thead>
				<tbody className={styles.tableBody}>
					{
						docentesDeDirectores?.map((director, index) => {
							return (
								<tr key={director.dni || index} className={styles.tableRow}>
									<td className={styles.tableCell}>
										{index + 1}
									</td>
									<td className={styles.tableCell}>
										<HighlightedText text={director.dni || ''} highlight={searchTerm || ''} />
									</td>
									<td className={styles.tableCell}>
										<HighlightedText text={director.nombres?.toLocaleUpperCase() || ''} highlight={searchTerm || ''} /> <HighlightedText text={director.apellidos?.toLocaleUpperCase() || ''} highlight={searchTerm || ''} />
									</td>
									<td className={styles.tableCell}>
										<HighlightedText text={director.institucion?.toLocaleUpperCase() || ''} highlight={searchTerm || ''} />
									</td>
									<td className={styles.tableCell}>
										{regionTexto(String(director.region))}
									</td>
									<td className={styles.tableCell}>
										<select
											value={director.tipoGestion || ''}
											onChange={(e) => updateTipoGestion(director.dni || '', e.target.value as 'publico' | 'privado')}
											className={`${styles.gestionSelect} ${director.tipoGestion === 'publico' ? styles.selectPublic : director.tipoGestion === 'privado' ? styles.selectPrivate : ''}`}
										>
											<option value="" disabled>Sin definir</option>
											<option value="publico">Público</option>
											<option value="privado">Privado</option>
										</select>
									</td>
									<td >
										<div className={styles.actions}>
											<MdEditSquare onClick={() => { setIdDirector(director.dni || ""); setShowUpdateDirector(true) }} className={styles.editButton} />
											<RiDeleteBinLine onClick={() => { setShowDeleteUsuario(!showDeleteUsuario); setDocente(director) }} className={styles.deleteButton} />
										</div>
									</td>
								</tr>
							)
						})
					}
				</tbody>
			</table>
			{/* Paginación solo para administradores/especialistas regionales y cuando no hay búsqueda ni filtros activos */}
			{(currentUserData.rol === 4 || currentUserData.rol === 5) && !isSearching && !isFiltered && (
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