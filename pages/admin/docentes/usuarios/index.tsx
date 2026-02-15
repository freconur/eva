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

            // Usamos una consulta de rango para simular "empieza con" (prefix search)
            // Esto permite ver resultados mientras el usuario escribe los últimos dígitos (desde 5 dígitos)
            const q = query(
                pathRef,
                where('dni', '>=', dni),
                where('dni', '<=', dni + '\uf8ff'),
                limit(15)
            )

            const querySnapshot = await getDocs(q)
            const docs: User[] = []
            querySnapshot.forEach((doc) => {
                const data = doc.data() as User
                // Filtramos por rol de docente (3) para asegurar que el resultado sea correcto
                if (data.perfil?.rol === 3 || data.rol === 3) {
                    docs.push(data)
                }
            })

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