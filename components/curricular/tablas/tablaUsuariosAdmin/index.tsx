import { User } from '@/features/types/types'
import React, { useState, useMemo } from 'react'
import styles from './tablasUsuarios.module.css'
import Link from 'next/link'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { convertRolToPath, convertRolToTitle, regionTexto, nivelInstitucion } from '@/fuctions/regiones'
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

/**
 * Obtiene la lista unificada de niveles asociados al especialista,
 * evaluando tanto 'nivelDeInstitucion' como 'nivelesInstitucion' o 'nivel'.
 */
const getNivelesEspecialista = (user: User): number[] => {
	const set = new Set<number>()
	const agregar = (val: any) => {
		if (Array.isArray(val)) {
			val.forEach((v) => {
				if (v !== undefined && v !== null && v !== '' && !isNaN(Number(v))) {
					set.add(Number(v))
				}
			})
		} else if (val !== undefined && val !== null && val !== '' && !isNaN(Number(val))) {
			set.add(Number(val))
		}
	}

	agregar(user.nivelDeInstitucion)
	agregar(user.nivelesInstitucion)
	if ((user as any).nivel !== undefined) {
		agregar((user as any).nivel)
	}

	return Array.from(set).sort((a, b) => a - b)
}

/**
 * Formatea el ID de nivel con su nombre legible y su clase de badge semántico.
 */
const getNivelInfo = (id: number) => {
	const found = nivelInstitucion.find((n) => n.id === id)
	if (found) {
		const nombre = found.name.charAt(0).toUpperCase() + found.name.slice(1)
		let badgeClass = styles.nivelBadgeDefault
		if (id === 0) badgeClass = styles.nivelBadgeInicial
		else if (id === 1) badgeClass = styles.nivelBadgePrimaria
		else if (id === 2) badgeClass = styles.nivelBadgeSecundaria
		return { nombre, badgeClass }
	}
	return { nombre: `Nivel ${id}`, badgeClass: styles.nivelBadgeDefault }
}

const TablaUsuariosAdminEspecialistas = ({ docentesDeDirectores = [], rol }: TablaUsuariosProps) => {
	const { currentUserData } = useGlobalContext()
	const [searchQuery, setSearchQuery] = useState<string>('')
	const [usuario, setUsuario] = useState<User>({})
	const [showUpdateDataDocente, setShowUpdateDataDocente] = useState(false)
	const [showDeleteUsuario, setShowDeleteUsuario] = useState(false)

	// Filtrado reactivo en memoria por DNI, nombres, apellidos, UGEL y nivel
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
			const ugel = normalizeText(regionTexto(String(user.region)) || '')
			const niveles = getNivelesEspecialista(user)
			const nivelesTexto = normalizeText(
				niveles.map((id) => getNivelInfo(id).nombre).join(' ')
			)

			return (
				dni.includes(query) ||
				nombres.includes(query) ||
				apellidos.includes(query) ||
				nombreCompleto.includes(query) ||
				ugel.includes(query) ||
				nivelesTexto.includes(query)
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
						placeholder="Buscar por DNI, nombres, apellidos, UGEL o nivel..."
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
						<th>{convertRolToTitle(rol) || 'Especialista'}</th>
						<th>UGEL</th>
						<th>Nivel</th>
						<th className={styles.tableHeaderActions}>Acciones</th>
					</tr>
				</thead>
				<tbody className={styles.tableBody}>
					{filteredUsuarios.length === 0 ? (
						<tr>
							<td colSpan={6} className={styles.emptyCell}>
								{searchQuery.trim()
									? `No se encontraron especialistas que coincidan con "${searchQuery}"`
									: 'No hay especialistas registrados'}
							</td>
						</tr>
					) : (
						filteredUsuarios.map((director, index) => {
							const niveles = getNivelesEspecialista(director)
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
									<td className={styles.tableCell}>
										{niveles.length > 0 ? (
											<div className={styles.nivelesContainer}>
												{niveles.map((nivelId) => {
													const info = getNivelInfo(nivelId)
													return (
														<span
															key={nivelId}
															className={`${styles.nivelBadge} ${info.badgeClass}`}
														>
															{info.nombre}
														</span>
													)
												})}
											</div>
										) : (
											<span className={styles.nivelSinAsignar}>Sin asignar</span>
										)}
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