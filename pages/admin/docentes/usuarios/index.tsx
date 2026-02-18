import React, { useEffect, useState } from 'react'
import { collection, query, where, getDocs, getFirestore, limit } from 'firebase/firestore'
import { app } from '@/firebase/firebase.config'
import UsuariosByRol from '@/components/usuariosByRol'
import { User } from '@/features/types/types'
import styles from './styles.module.css'
import { RiSearchLine, RiUserAddLine } from 'react-icons/ri'
import PrivateRoutesAdmin from '@/components/layouts/PrivateRoutesAdmin'
import AdminDocenteModal from '@/components/modals/AdminDocenteModal'

const DocentesUsuariosPage = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [results, setResults] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const db = getFirestore(app)

    useEffect(() => {
        // Limpiar resultados si el input está vacío
        if (!searchTerm.trim()) {
            setResults([])
            setLoading(false)
            return
        }

        // Iniciar búsqueda desde los 5 dígitos como pidió el usuario
        if (searchTerm.length < 5) {
            setResults([])
            return
        }

        const delayDebounceFn = setTimeout(() => {
            searchDocente(searchTerm)
        }, 500) // Un poco más rápido para mejorar la sensación de "tiempo real"

        return () => clearTimeout(delayDebounceFn)
    }, [searchTerm])

    const searchDocente = async (dni: string) => {
        setLoading(true)
        try {
            const pathRef = collection(db, 'usuarios')
            let docs: User[] = []

            // 1. Búsqueda normal por prefijo de DNI (para encontrar docentes directamente)
            const qPrefix = query(
                pathRef,
                where('dni', '>=', dni),
                where('dni', '<=', dni + '\uf8ff'),
                limit(15)
            )

            const prefixSnapshot = await getDocs(qPrefix)
            prefixSnapshot.forEach((doc) => {
                const data = doc.data() as User
                if (data.perfil?.rol === 3 || data.rol === 3) {
                    docs.push(data)
                }
            })

            // 2. Búsqueda inteligente: Si el DNI es de un Director, traer a sus docentes
            // Solo lo hacemos cuando el DNI tiene visos de ser completo (8 dígitos) para optimizar
            if (dni.length === 8) {
                const qDirector = query(pathRef, where('dni', '==', dni), limit(1))
                const directorSnapshot = await getDocs(qDirector)

                if (!directorSnapshot.empty) {
                    const directorData = directorSnapshot.docs[0].data() as User
                    const isDirector = directorData.perfil?.rol === 2 || directorData.rol === 2

                    if (isDirector) {
                        const qDocentesByDirector = query(pathRef, where('dniDirector', '==', dni))
                        const docentesSnapshot = await getDocs(qDocentesByDirector)

                        docentesSnapshot.forEach(doc => {
                            const teacherData = doc.data() as User
                            // Evitar duplicados si ya fueron encontrados por el prefijo
                            if (!docs.some(d => d.dni === teacherData.dni)) {
                                docs.push(teacherData)
                            }
                        })
                    }
                }
            }

            setResults(docs)
        } catch (error) {
            console.error("Error searching docente:", error)
        } finally {
            setLoading(false)
        }
    }

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
                    <p className={styles.subtitle}>Busque docentes por DNI para administrar sus perfiles (Máximo 8 dígitos)</p>
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
                <div className={styles.searchBar}>
                    <RiSearchLine className={styles.searchIcon} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleInputChange}
                        placeholder="Ingrese DNI..."
                        className={styles.searchInput}
                        autoFocus
                    />
                </div>
            </div>

            <div className={styles.resultsSection}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <span>Buscando docente...</span>
                    </div>
                ) : (
                    <UsuariosByRol usuariosByRol={results} showSearch={false} />
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