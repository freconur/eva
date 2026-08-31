import { User } from '@/features/types/types'
import React, { useState, useMemo } from 'react'
import styles from './tablasUsuarios.module.css'
import Link from 'next/link'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { convertRolToPath, convertRolToTitle, regionTexto } from '@/fuctions/regiones'
import UpdateDataDocente from '@/modals/updateDocente'
import DeleteUsuario from '@/modals/deleteUsuario'
import { MdEditSquare } from 'react-icons/md'
import { RiDeleteBinLine, RiSearchLine, RiCloseLine } from 'react-icons/ri'

interface TablaUsuariosProps {
	docentesDeDirectores: User[]
	rol: number
}

const normalizeText = (text: string = ''): string =>
	text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim()

const TablaUsuariosAdminEspecialistas = ({ docentesDeDirectores = [], rol }: TablaUsuariosProps) => {
	const { currentUserData } = useGlobalContext()
	const [searchQuery, setSearchQuery] = useState<string>('')
	const [usuario, setUsuario] = useState<User>({})
	const [showUpdateDataDocente, setShowUpdateDataDocente] = useState(false)
	const [showDeleteUsuario, setShowDeleteUsuario] = useState(false)

	// Filtrado reactivo en memoria por DNI, nombres y apellidos
	const filteredUsuarios = useMemo(() => {
		const query = normalizeText(searchQuery)
		if (!query) {
			return docentesDeDirectores
		}

		return docentesDeDirectores.filter((user) => {
			const dni = (user.dni || '').trim()
			const nombres = normalizeText(user.nombres)
			const apellidos = normalizeText(user.apellidos)
			const nombreCompleto = `${nombres} ${apellidos}`

			return (
				dni.includes(query) ||
				nombres.includes(query) ||
				apellidos.includes(query) ||
				nombreCompleto.includes(query)
			)
		})
	}, [docentesDeDirectores, searchQuery])

	return (
		<div className={styles.tableSection}>
			{showUpdateDataDocente && (
				<UpdateDataDocente
					dataDocente={usuario}
					onClose={() => setShowUpdateDataDocente(false)}
				/>
			)}
			{showDeleteUsuario && (
				<DeleteUsuario
					handleShowModalDelete={() => setShowDeleteUsuario(false)}
					idUsuario={`${usuario.dni}`}
				/>
			)}

			<h2 className={styles.sectionTitle}>
				<span className={styles.sectionTitleIndicator}></span>
				{convertRolToTitle(rol)}
			</h2>

			<div className={styles.searchBarContainer}>
				<div className={styles.inputContainer}>
					<RiSearchLine className={styles.searchIcon} />
					<input
						className={styles.input}
						type="text"
						placeholder="Buscar por DNI, nombres o apellidos..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					{searchQuery && (
						<button
							type="button"
							className={styles.clearButton}
							onClick={() => setSearchQuery('')}
							title="Limpiar búsqueda"
							aria-label="Limpiar búsqueda"
						>
							<RiCloseLine />
						</button>
					)}
				</div>
				<span className={styles.resultsCounter}>
					{filteredUsuarios.length} {filteredUsuarios.length === 1 ? 'especialista' : 'especialistas'}
					{searchQuery.trim() ? ` encontrado(s) de ${docentesDeDirectores.length}` : ' en total'}
				</span>
			</div>

			<table className={styles.table}>
				<thead className={styles.tableHeader}>
					<tr>
						<th>#</th>
						<th>Dni</th>
						<th>{convertRolToTitle(currentUserData.rol || 0)}</th>
						<th>UGEL</th>
						<th className={styles.tableHeaderActions}>Acciones</th>
					</tr>
				</thead>
				<tbody className={styles.tableBody}>
					{filteredUsuarios.length === 0 ? (
						<tr>
							<td colSpan={5} className={styles.emptyCell}>
								{searchQuery.trim()
									? `No se encontraron especialistas que coincidan con "${searchQuery}"`
									: 'No hay especialistas registrados'}
							</td>
						</tr>
					) : (
						filteredUsuarios.map((director, index) => {
							return (
								<tr key={director.dni || index} className={styles.tableRow}>
									<td className={styles.tableCell}>
										<Link
											href={`/${convertRolToPath(currentUserData.rol || 0)}/cobertura-curricular/curricular/evaluar-curricula?idDocente=${director.dni}`}
											className={styles.tableLink}
										>
											{index + 1}
										</Link>
									</td>
									<td className={styles.tableCell}>
										<Link
											href={`/${convertRolToPath(currentUserData.rol || 0)}/cobertura-curricular/curricular/evaluar-curricula?idDocente=${director.dni}`}
											className={styles.tableLink}
										>
											{director.dni}
										</Link>
									</td>
									<td className={styles.tableCell}>
										<Link
											href={`/${convertRolToPath(currentUserData.rol || 0)}/cobertura-curricular/curricular/evaluar-curricula?idDocente=${director.dni}`}
											className={styles.tableLink}
										>
											{director.nombres?.toLocaleUpperCase()} {director.apellidos?.toLocaleUpperCase()}
										</Link>
									</td>
									<td className={styles.tableCell}>
										{regionTexto(String(director.region))}
									</td>
									<td className={styles.tableCellActions}>
										<div className={styles.actions}>
											<button
												type="button"
												className={`${styles.actionButton} ${styles.editButton}`}
												onClick={() => {
													setUsuario(director)
													setShowUpdateDataDocente(!showUpdateDataDocente)
												}}
												title="Editar datos del especialista"
												aria-label="Editar especialista"
											>
												<MdEditSquare size={20} />
											</button>
											<button
												type="button"
												className={`${styles.actionButton} ${styles.deleteButton}`}
												onClick={() => {
													setShowDeleteUsuario(!showDeleteUsuario)
													setUsuario(director)
												}}
												title="Eliminar especialista"
												aria-label="Eliminar especialista"
											>
												<RiDeleteBinLine size={20} />
											</button>
										</div>
									</td>
								</tr>
							)
						})
					)}
				</tbody>
			</table>
		</div>
	)
}

export default TablaUsuariosAdminEspecialistas