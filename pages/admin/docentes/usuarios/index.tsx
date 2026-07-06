import React, { useEffect, useState, useMemo } from 'react'
import { collection, query, where, getDocs, getFirestore, limit, startAfter, doc, getDoc, QueryDocumentSnapshot, DocumentData, getCountFromServer } from 'firebase/firestore'
import { app } from '@/firebase/firebase.config'
import UsuariosByRol from '@/components/usuariosByRol'
import { User } from '@/features/types/types'
import styles from './styles.module.css'
import { RiSearchLine, RiUserAddLine } from 'react-icons/ri'
import PrivateRoutesAdmin from '@/components/layouts/PrivateRoutesAdmin'
import AdminDocenteModal from '@/components/modals/AdminDocenteModal'
import { regiones, area, caracteristicasDirectivo } from '@/fuctions/regiones'
import { distritosPuno } from '@/fuctions/provinciasPuno'

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

    const fetchDocentes = async (pageIndex: number, startCursor: QueryDocumentSnapshot<DocumentData> | null) => {
        setLoading(true)
        try {
            const pathRef = collection(db, 'usuarios')
            
            // Si el buscador por DNI tiene valor
            if (searchTerm.trim()) {
                const searchDni = searchTerm.trim()
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
                    if (data.rol === 3) {
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
                            const qDocentesByDirector = query(pathRef, where('dniDirector', '==', searchDni))
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

            if (selectedUgel) {
                constraints.push(where('region', '==', Number(selectedUgel)))
            }
            if (selectedDistrito) {
                constraints.push(where('distrito', '==', selectedDistrito))
            }
            if (selectedNivel) {
                constraints.push(where('nivelDeInstitucion', 'array-contains', Number(selectedNivel)))
            }
            if (selectedArea) {
                constraints.push(where('area', '==', Number(selectedArea)))
            }
            if (selectedCaracteristica) {
                constraints.push(where('caracteristicaCurricular', '==', Number(selectedCaracteristica)))
            }
            if (selectedGestion) {
                constraints.push(where('tipoGestion', '==', selectedGestion))
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

    const handleLimpiarFiltros = () => {
        setSelectedUgel('')
        setSelectedDistrito('')
        setSelectedNivel('')
        setSelectedArea('')
        setSelectedCaracteristica('')
        setSelectedGestion('')
        setSearchTerm('')
        setPageCursors([null])
        // Ejecutar fetch con filtros limpios
        setLoading(true)
        setTimeout(() => {
            fetchDocentes(1, null)
        }, 100)
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
                <div className={styles.controlsContainer}>

                    <div className={styles.filterGroup}>
                        <select
                            value={selectedUgel}
                            onChange={(e) => {
                                setSelectedUgel(e.target.value)
                                setSelectedDistrito('')
                            }}
                            className={styles.filterSelect}
                        >
                            <option value="">Todas las Ugel</option>
                            {regiones.map((reg) => (
                                <option key={reg.id} value={reg.id}>
                                    {reg.region}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <select
                            value={selectedDistrito}
                            onChange={(e) => setSelectedDistrito(e.target.value)}
                            disabled={!selectedUgel}
                            className={styles.filterSelect}
                        >
                            <option value="">
                                {!selectedUgel ? 'Seleccione Ugel primero' : 'Todos los Distritos'}
                            </option>
                            {distritosDisponibles.map((dist) => (
                                <option key={dist} value={dist}>
                                    {dist}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <select
                            value={selectedNivel}
                            onChange={(e) => setSelectedNivel(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="">Todos los Niveles</option>
                            <option value="0">Inicial</option>
                            <option value="1">Primaria</option>
                            <option value="2">Secundaria</option>
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <select
                            value={selectedArea}
                            onChange={(e) => setSelectedArea(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="">Todas las Áreas</option>
                            {area.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <select
                            value={selectedCaracteristica}
                            onChange={(e) => setSelectedCaracteristica(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="">Todas las Características</option>
                            {caracteristicasDirectivo.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <select
                            value={selectedGestion}
                            onChange={(e) => setSelectedGestion(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="">Todas las Gestiones</option>
                            <option value="publico">PÚBLICO</option>
                            <option value="privado">PRIVADO</option>
                        </select>
                    </div>

                    <button
                        onClick={handleFiltrar}
                        className={styles.filterSubmitButton}
                    >
                        Filtrar
                    </button>

                    {(selectedUgel || selectedDistrito || selectedNivel || selectedArea || selectedCaracteristica || selectedGestion) && (
                        <button
                            onClick={handleLimpiarFiltros}
                            className={styles.clearFiltersButton}
                        >
                            Limpiar Filtros
                        </button>
                    )}

                    <span className={styles.resultsCount}>
                        {totalResults !== null ? (
                            `Total: ${totalResults} ${totalResults === 1 ? 'docente' : 'docentes'} (${results.length} en esta página)`
                        ) : (
                            `Mostrando ${results.length} ${results.length === 1 ? 'docente' : 'docentes'}`
                        )}
                    </span>
                </div>
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