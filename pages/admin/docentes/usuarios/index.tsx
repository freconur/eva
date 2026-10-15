import React, { useEffect, useState, useMemo } from 'react'
import { collection, query, where, getDocs, getFirestore, limit, startAfter, doc, getDoc, QueryDocumentSnapshot, DocumentData, getCountFromServer } from 'firebase/firestore'
import { app } from '@/firebase/firebase.config'
import UsuariosByRol from '@/components/usuariosByRol'
import { User } from '@/features/types/types'
import styles from './styles.module.css'
import { RiSearchLine, RiUserAddLine, RiCloseLine } from 'react-icons/ri'
import PrivateRoutesAdmin from '@/components/layouts/PrivateRoutesAdmin'
import AdminDocenteModal from '@/components/modals/AdminDocenteModal'
import { regiones, area, caracteristicasDirectivo } from '@/fuctions/regiones'
import { distritosPuno } from '@/fuctions/provinciasPuno'
import SegmentedFilterBar, { FilterItem } from '@/components/common/SegmentedFilterBar'

const DocentesUsuariosPage = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [results, setResults] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    
    // Filtros de Docentes
    const [selectedUgel, setSelectedUgel] = useState<string>('')
    const [selectedDistrito, setSelectedDistrito] = useState<string>('')
    const [selectedNivel, setSelectedNivel] = useState<string>('')
    const [selectedArea, setSelectedArea] = useState<string>('')
    const [selectedCaracteristica, setSelectedCaracteristica] = useState<string>('')
    const [selectedGestion, setSelectedGestion] = useState<string>('')

    // Paginación de Docentes
    const [pageCursors, setPageCursors] = useState<(QueryDocumentSnapshot<DocumentData> | null)[]>([null])
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [hasNextPage, setHasNextPage] = useState<boolean>(false)
    const [totalResults, setTotalResults] = useState<number | null>(null)

    const db = getFirestore(app)

    const fetchDocentes = async (
        pageIndex: number,
        startCursor: QueryDocumentSnapshot<DocumentData> | null,
        overrides?: {
            searchTerm?: string
            ugel?: string
            distrito?: string
            nivel?: string
            area?: string
            caracteristica?: string
            gestion?: string
        }
    ) => {
        setLoading(true)
        try {
            const pathRef = collection(db, 'usuarios')
            
            const currentSearch = overrides?.searchTerm !== undefined ? overrides.searchTerm : searchTerm
            const currentUgel = overrides?.ugel !== undefined ? overrides.ugel : selectedUgel
            const currentDistrito = overrides?.distrito !== undefined ? overrides.distrito : selectedDistrito
            const currentNivel = overrides?.nivel !== undefined ? overrides.nivel : selectedNivel
            const currentArea = overrides?.area !== undefined ? overrides.area : selectedArea
            const currentCaracteristica = overrides?.caracteristica !== undefined ? overrides.caracteristica : selectedCaracteristica
            const currentGestion = overrides?.gestion !== undefined ? overrides.gestion : selectedGestion

            // Si el buscador por DNI tiene valor
            if (currentSearch.trim()) {
                const searchDni = currentSearch.trim()
                let docs: User[] = []

                // Búsqueda por prefijo de DNI (hasta 100 resultados)
                const qPrefix = query(
                    pathRef,
                    where('dni', '>=', searchDni),
                    where('dni', '<=', searchDni + '\uf8ff'),
                    limit(101)
                )

                const prefixSnapshot = await getDocs(qPrefix)
                prefixSnapshot.forEach((docSnap) => {
                    const data = docSnap.data() as User
                    if (data.rol === 3 || data.perfil?.rol === 3) {
                        docs.push(data)
                    }
                })

                // Búsqueda inteligente: Si el DNI ingresado es de 8 dígitos y corresponde a un Director, traer sus docentes
                if (searchDni.length === 8) {
                    const qDirector = query(pathRef, where('dni', '==', searchDni), limit(1))
                    const directorSnapshot = await getDocs(qDirector)

                    if (!directorSnapshot.empty) {
                        const directorData = directorSnapshot.docs[0].data() as User
                        const isDirector = directorData.perfil?.rol === 2 || directorData.rol === 2

                        if (isDirector) {
                            const directorDnis = new Set<string>([searchDni]);
                            if (directorData.dniDirectorPredecesor) {
                                directorDnis.add(directorData.dniDirectorPredecesor);
                            }
                            if (Array.isArray(directorData.directoresPredecesores)) {
                                directorData.directoresPredecesores.forEach((d: string) => {
                                    if (d) directorDnis.add(d);
                                });
                            }
                            const dnisList = Array.from(directorDnis).slice(0, 30);
                            const qDocentesByDirector = dnisList.length > 1
                                ? query(pathRef, where('dniDirector', 'in', dnisList))
                                : query(pathRef, where('dniDirector', '==', searchDni));
                            const docentesSnapshot = await getDocs(qDocentesByDirector)

                            docentesSnapshot.forEach(docSnap => {
                                const teacherData = docSnap.data() as User
                                if (!docs.some(d => d.dni === teacherData.dni)) {
                                    docs.push(teacherData)
                                }
                            })
                        }
                    }
                }

                setResults(docs)
                setTotalResults(docs.length)
                setHasNextPage(false)
                setCurrentPage(1)
                setPageCursors([null])
                setLoading(false)
                return
            }

            // Búsqueda normal con filtros condicionales aplicados en la Base de Datos
            const constraints: any[] = [
                where('rol', '==', 3)
            ]

            if (currentUgel) {
                constraints.push(where('region', '==', Number(currentUgel)))
            }
            if (currentDistrito) {
                constraints.push(where('distrito', '==', currentDistrito))
            }
            if (currentNivel) {
                constraints.push(where('nivelDeInstitucion', 'array-contains', Number(currentNivel)))
            }
            if (currentArea) {
                constraints.push(where('area', '==', Number(currentArea)))
            }
            if (currentCaracteristica) {
                constraints.push(where('caracteristicaCurricular', '==', Number(currentCaracteristica)))
            }
            if (currentGestion) {
                constraints.push(where('tipoGestion', '==', currentGestion))
            }

            // Consultar el total de registros concurrentemente en la base de datos (ahorro de lecturas y óptima velocidad)
            getCountFromServer(query(pathRef, ...constraints))
                .then(countSnap => {
                    setTotalResults(countSnap.data().count)
                })
                .catch(err => console.error("Error fetching total count:", err))

            // Paginación con cursor startAfter
            if (startCursor) {
                constraints.push(startAfter(startCursor))
            }

            // Consultar 101 elementos para validar si existe página siguiente
            constraints.push(limit(101))

            const q = query(pathRef, ...constraints)
            const snap = await getDocs(q)
            
            const docs: User[] = []
            snap.forEach((docSnap) => {
                docs.push(docSnap.data() as User)
            })

            const hasMore = docs.length > 100
            if (hasMore) {
                docs.pop() // Quitar el registro 101 sobrante
            }
            
            setResults(docs)
            setHasNextPage(hasMore)
            setCurrentPage(pageIndex)

            if (hasMore) {
                const lastDoc = snap.docs[99] // El doc 100
                setPageCursors(prev => {
                    const newCursors = [...prev]
                    newCursors[pageIndex] = lastDoc
                    return newCursors
                })
            }

        } catch (error) {
            console.error("Error fetching docentes from Firestore:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDocentes(1, null)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleFiltrar = () => {
        setPageCursors([null])
        fetchDocentes(1, null)
    }

    const handleClearSearch = () => {
        setSearchTerm('')
        setPageCursors([null])
        fetchDocentes(1, null, { searchTerm: '' })
    }

    const handleLimpiarFiltros = () => {
        setSelectedUgel('')
        setSelectedDistrito('')
        setSelectedNivel('')
        setSelectedArea('')
        setSelectedCaracteristica('')
        setSelectedGestion('')
        setSearchTerm('')
        setPageCursors([null])
        fetchDocentes(1, null, {
            searchTerm: '',
            ugel: '',
            distrito: '',
            nivel: '',
            area: '',
            caracteristica: '',
            gestion: '',
        })
    }

    const distritosDisponibles = useMemo(() => {
        if (!selectedUgel) return []
        const found = distritosPuno.find(prov => prov.id === Number(selectedUgel))
        return found ? found.distritos : []
    }, [selectedUgel])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        // Solo permitir números y máximo 8 dígitos
        if (/^\d*$/.test(val) && val.length <= 8) {
            setSearchTerm(val)
        }
    }

    const hasActiveFilters = Boolean(
        searchTerm.trim() !== '' ||
        selectedUgel !== '' ||
        selectedDistrito !== '' ||
        selectedNivel !== '' ||
        selectedArea !== '' ||
        selectedCaracteristica !== '' ||
        selectedGestion !== ''
    )

    const filtersConfig: FilterItem[] = useMemo(() => [
        {
            id: 'ugel',
            label: 'UGEL',
            value: selectedUgel,
            onChange: (val) => {
                const ugelStr = String(val)
                setSelectedUgel(ugelStr)
                setSelectedDistrito('')
                setSearchTerm('')
                setPageCursors([null])
                fetchDocentes(1, null, { ugel: ugelStr, distrito: '', searchTerm: '' })
            },
            options: [
                { value: '', label: 'Todas las UGEL' },
                ...regiones.map((reg) => ({
                    value: String(reg.id),
                    label: reg.region,
                })),
            ],
            showSearch: true,
            minWidth: 'md:min-w-[150px]',
        },
        {
            id: 'distrito',
            label: 'Distrito',
            value: selectedDistrito,
            onChange: (val) => {
                const distStr = String(val)
                setSelectedDistrito(distStr)
                setSearchTerm('')
                setPageCursors([null])
                fetchDocentes(1, null, { distrito: distStr, searchTerm: '' })
            },
            options: [
                { value: '', label: !selectedUgel ? 'Seleccione UGEL primero' : 'Todos los Distritos' },
                ...distritosDisponibles.map((dist) => ({
                    value: dist,
                    label: dist,
                })),
            ],
            disabled: !selectedUgel,
            showSearch: true,
            minWidth: 'md:min-w-[150px]',
        },
        {
            id: 'nivel',
            label: 'Nivel',
            value: selectedNivel,
            onChange: (val) => {
                const nivelStr = String(val)
                setSelectedNivel(nivelStr)
                setSearchTerm('')
                setPageCursors([null])
                fetchDocentes(1, null, { nivel: nivelStr, searchTerm: '' })
            },
            options: [
                { value: '', label: 'Todos los Niveles' },
                { value: '0', label: 'Inicial' },
                { value: '1', label: 'Primaria' },
                { value: '2', label: 'Secundaria' },
            ],
            minWidth: 'md:min-w-[140px]',
        },
        {
            id: 'area',
            label: 'Área',
            value: selectedArea,
            onChange: (val) => {
                const areaStr = String(val)
                setSelectedArea(areaStr)
                setSearchTerm('')
                setPageCursors([null])
                fetchDocentes(1, null, { area: areaStr, searchTerm: '' })
            },
            options: [
                { value: '', label: 'Todas las Áreas' },
                ...area.map((a) => ({
                    value: String(a.id),
                    label: a.name.toUpperCase(),
                })),
            ],
            showSearch: true,
            minWidth: 'md:min-w-[150px]',
        },
        {
            id: 'caracteristica',
            label: 'Característica',
            value: selectedCaracteristica,
            onChange: (val) => {
                const caracStr = String(val)
                setSelectedCaracteristica(caracStr)
                setSearchTerm('')
                setPageCursors([null])
                fetchDocentes(1, null, { caracteristica: caracStr, searchTerm: '' })
            },
            options: [
                { value: '', label: 'Todas las Características' },
                ...caracteristicasDirectivo.map((c) => ({
                    value: String(c.id),
                    label: c.name.toUpperCase(),
                })),
            ],
            minWidth: 'md:min-w-[160px]',
        },
        {
            id: 'gestion',
            label: 'Gestión',
            value: selectedGestion,
            onChange: (val) => {
                const gestStr = String(val)
                setSelectedGestion(gestStr)
                setSearchTerm('')
                setPageCursors([null])
                fetchDocentes(1, null, { gestion: gestStr, searchTerm: '' })
            },
            options: [
                { value: '', label: 'Todas las Gestiones' },
                { value: 'publico', label: 'PÚBLICO' },
                { value: 'privado', label: 'PRIVADO' },
            ],
            minWidth: 'md:min-w-[140px]',
        },
    ], [selectedUgel, selectedDistrito, distritosDisponibles, selectedNivel, selectedArea, selectedCaracteristica, selectedGestion])

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    <h1 className={styles.title}>Gestión de Docentes</h1>
                    <p className={styles.subtitle}>Administre y filtre perfiles de docentes en la institución</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className={styles.registerButton}
                >
                    <RiUserAddLine size={20} />
                    Registrar Profesor
                </button>
            </div>

            <div className={styles.searchSection}>
                {/* Fila superior: Input de búsqueda por DNI + Contador de resultados */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="relative flex-1 max-w-md">
                        <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleInputChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleFiltrar()
                                }
                            }}
                            placeholder="Buscar docente por DNI o DNI Director..."
                            className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            aria-label="Buscar docente por DNI"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-14 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                                title="Limpiar DNI"
                                aria-label="Limpiar DNI"
                            >
                                <RiCloseLine className="text-lg" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleFiltrar}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer"
                        >
                            Buscar
                        </button>
                    </div>

                    <div className="text-xs sm:text-sm font-semibold text-slate-600 whitespace-nowrap">
                        {totalResults !== null ? (
                            `Total: ${totalResults} ${totalResults === 1 ? 'docente' : 'docentes'} (${results.length} en esta página)`
                        ) : (
                            `Mostrando ${results.length} ${results.length === 1 ? 'docente' : 'docentes'}`
                        )}
                    </div>
                </div>

                {/* Barra de Filtros Segmentada Modular (Dropdowns Reutilizables) */}
                <SegmentedFilterBar
                    title="Filtrar por"
                    className="w-full"
                    filters={filtersConfig}
                    onReset={handleLimpiarFiltros}
                    showReset={hasActiveFilters}
                    resetLabel="Limpiar Filtros"
                />
            </div>

            <div className={styles.resultsSection}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <span>Cargando docentes...</span>
                    </div>
                ) : (
                    <>
                        <UsuariosByRol usuariosByRol={results} showSearch={false} />

                        {/* Botones de Paginación */}
                        {!searchTerm && (currentPage > 1 || hasNextPage) && (
                            <div className={styles.paginationContainer}>
                                <button
                                    onClick={() => fetchDocentes(currentPage - 1, pageCursors[currentPage - 2])}
                                    disabled={currentPage === 1}
                                    className={styles.paginationButton}
                                >
                                    Anterior
                                </button>
                                <span className={styles.pageIndicator}>
                                    Página {currentPage}
                                </span>
                                <button
                                    onClick={() => fetchDocentes(currentPage + 1, pageCursors[currentPage - 1])}
                                    disabled={!hasNextPage}
                                    className={styles.paginationButton}
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {showModal && (
                <AdminDocenteModal onClose={() => setShowModal(false)} />
            )}
        </div>
    )
}

// Proteger la ruta para administradores
DocentesUsuariosPage.Auth = PrivateRoutesAdmin

export default DocentesUsuariosPage