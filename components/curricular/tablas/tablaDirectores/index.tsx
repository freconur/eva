import { User } from '@/features/types/types'
import React, { useState, useMemo } from 'react'
import styles from './tablasUsuarios.module.css'
import Link from 'next/link'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { convertRolToPath, convertRolToTitle, regionTexto, getAreaTexto, getCaracteristicasDirectivoTexto, nivelInstitucion } from '@/fuctions/regiones'
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



const getNivelInstitucionTexto = (niveles: number[] | undefined): string => {
	if (!niveles || !Array.isArray(niveles)) return '';
	return niveles
		.map(id => {
			const item = nivelInstitucion.find(n => n.id === id);
			return item ? item.name.charAt(0).toUpperCase() + item.name.slice(1) : '';
		})
		.filter(Boolean)
		.join(', ');
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

	const [headerFilters, setHeaderFilters] = useState({
		distrito: '',
		area: '',
		caracteristica: '',
		nivel: '',
		gestion: ''
	});

	// Unique values extracted dynamically from memory
	const uniqueDistritos = useMemo(() => {
		const set = new Set<string>();
		docentesDeDirectores?.forEach(d => {
			if (d.distrito) set.add(d.distrito);
		});
		return Array.from(set).sort();
	}, [docentesDeDirectores]);

	const uniqueAreas = useMemo(() => {
		const set = new Set<string>();
		docentesDeDirectores?.forEach(d => {
			const text = getAreaTexto(d.area);
			if (text) set.add(text);
		});
		return Array.from(set).sort();
	}, [docentesDeDirectores]);

	const uniqueCD = useMemo(() => {
		const set = new Set<string>();
		docentesDeDirectores?.forEach(d => {
			const text = getCaracteristicasDirectivoTexto(d.caracteristicaCurricular);
			if (text) set.add(text);
		});
		return Array.from(set).sort();
	}, [docentesDeDirectores]);

	const uniqueNiveles = useMemo(() => {
		const set = new Set<string>();
		docentesDeDirectores?.forEach(d => {
			if (d.nivelDeInstitucion && Array.isArray(d.nivelDeInstitucion)) {
				d.nivelDeInstitucion.forEach(nId => {
					const item = nivelInstitucion.find(n => n.id === nId);
					if (item) set.add(item.name.charAt(0).toUpperCase() + item.name.slice(1));
				});
			}
		});
		return Array.from(set).sort();
	}, [docentesDeDirectores]);

	const uniqueGestiones = useMemo(() => {
		const set = new Set<string>();
		docentesDeDirectores?.forEach(d => {
			const text = d.tipoGestion ? d.tipoGestion.charAt(0).toUpperCase() + d.tipoGestion.slice(1) : '';
			if (text) set.add(text);
		});
		return Array.from(set).sort();
	}, [docentesDeDirectores]);

	// Filtered list
	const filteredDocentes = useMemo(() => {
		if (!docentesDeDirectores) return [];
		return docentesDeDirectores.filter(d => {
			// 1. Distrito filter
			if (headerFilters.distrito) {
				if (d.distrito !== headerFilters.distrito) return false;
			}
			// 2. Area filter
			if (headerFilters.area) {
				const text = getAreaTexto(d.area);
				if (text !== headerFilters.area) return false;
			}
			// 3. Caracteristica filter
			if (headerFilters.caracteristica) {
				const text = getCaracteristicasDirectivoTexto(d.caracteristicaCurricular);
				if (text !== headerFilters.caracteristica) return false;
			}
			// 4. Nivel filter
			if (headerFilters.nivel) {
				const hasNivel = d.nivelDeInstitucion?.some(nId => {
					const item = nivelInstitucion.find(n => n.id === nId);
					const name = item ? item.name.charAt(0).toUpperCase() + item.name.slice(1) : '';
					return name === headerFilters.nivel;
				});
				if (!hasNivel) return false;
			}
			// 5. Gestion filter
			if (headerFilters.gestion) {
				const text = d.tipoGestion ? d.tipoGestion.charAt(0).toUpperCase() + d.tipoGestion.slice(1) : '';
				if (text !== headerFilters.gestion) return false;
			}
			return true;
		});
	}, [docentesDeDirectores, headerFilters]);
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

	const [activeDropdown, setActiveDropdown] = useState<'distrito' | 'area' | 'caracteristica' | 'nivel' | 'gestion' | null>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (!target.closest(`.${styles.headerFilterWrapper}`)) {
				setActiveDropdown(null);
			}
		};
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	}, []);

	const renderFilterHeader = (title: string, key: 'distrito' | 'area' | 'caracteristica' | 'nivel' | 'gestion', options: string[]) => {
		const isFiltered = !!headerFilters[key];
		const isOpen = activeDropdown === key;
		const alignRight = key === 'nivel' || key === 'gestion';

		return (
			<div 
				className={styles.headerFilterWrapper}
				onClick={() => setActiveDropdown(prev => prev === key ? null : key)}
			>
				<span>{title}</span>
				<div className={styles.headerFilterIconContainer}>
					<svg 
						className={`${styles.headerFilterIcon} ${isFiltered ? styles.headerFilterIconActive : ''}`} 
						viewBox="0 0 24 24" 
						fill="none" 
						stroke="currentColor" 
						strokeWidth="2.5" 
						strokeLinecap="round" 
						strokeLinejoin="round"
					>
						<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
					</svg>
				</div>

				{isOpen && (
					<div 
						className={`${styles.customDropdownMenu} ${alignRight ? styles.customDropdownMenuRight : ''}`}
						onClick={(e) => e.stopPropagation()}
					>
						<div 
							className={`${styles.customDropdownItem} ${!headerFilters[key] ? styles.customDropdownItemActive : ''}`}
							onClick={() => {
								setHeaderFilters(prev => ({ ...prev, [key]: '' }));
								setActiveDropdown(null);
							}}
						>
							(Todas)
						</div>
						{options.map(opt => {
							const isSelected = headerFilters[key] === opt;
							return (
								<div 
									key={opt}
									className={`${styles.customDropdownItem} ${isSelected ? styles.customDropdownItemActive : ''}`}
									onClick={() => {
										setHeaderFilters(prev => ({ ...prev, [key]: opt }));
										setActiveDropdown(null);
									}}
								>
									{opt}
								</div>
							);
						})}
					</div>
				)}
			</div>
		);
	};

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
			{/* <h2 className={styles.sectionTitle}>
				<span className={styles.sectionTitleIndicator}></span>
				{convertRolToTitle(rol)}sdasd
			</h2> */}


			<table className={`${styles.table} ${isLoadingExternal ? styles.tableLoading : ''}`}>
				<thead className={styles.tableHeader}>
					<tr>
						<th>#</th>
						<th>DNI</th>
						<th>Directores</th>
						<th>Institución</th>
						<th>UGEL</th>
						<th>{renderFilterHeader('Distrito', 'distrito', uniqueDistritos)}</th>
						<th>{renderFilterHeader('Área', 'area', uniqueAreas)}</th>
						<th>{renderFilterHeader('Característica', 'caracteristica', uniqueCD)}</th>
						<th>{renderFilterHeader('Nivel', 'nivel', uniqueNiveles)}</th>
						<th className={styles.relativeHeader}>
							{renderFilterHeader('Gestión', 'gestion', uniqueGestiones)}
							{showLocalPopup && showGestionHelp && (
								<div className={styles.popupContainerHeader}>
									<div className={styles.tourArrow}></div>
									<div className={styles.tourCardCompact}>
										<div className={styles.tourContentCompact}>
											<span className={styles.newBadge}>NUEVO</span>
											<p>⚙️ Ahora puedes actualizar los datos de gestión de los directores a público o privado</p>
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
						filteredDocentes?.map((director, index) => {
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
										{director.distrito || ''}
									</td>
									<td className={styles.tableCell}>
										{getAreaTexto(director.area)}
									</td>
									<td className={styles.tableCell}>
										{getCaracteristicasDirectivoTexto(director.caracteristicaCurricular)}
									</td>
									<td className={styles.tableCell}>
										{getNivelInstitucionTexto(director.nivelDeInstitucion)}
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