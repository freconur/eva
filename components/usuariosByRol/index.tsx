import { useGlobalContext } from '@/features/context/GlolbalContext'
import { User } from '@/features/types/types'
import React, { useState } from 'react'
import styles from './styles.module.css'
import { RiDeleteBinLine, RiSearchLine } from 'react-icons/ri'
import { MdEditSquare } from 'react-icons/md'
import DeleteUsuario from '@/modals/deleteUsuario'
import DocenteModal from '@/components/modals/DocenteModal'
import { getGradoTexto, getSeccionTexto, regiones, area, getCaracteristicasDirectivoTexto } from '@/fuctions/regiones'

interface Props {
    usuariosByRol: User[]
    showSearch?: boolean
}

const UsuariosByRol = ({ usuariosByRol, showSearch = true }: Props) => {
    const [showModalEdit, setShowModalEdit] = useState(false)
    const [showModalDelete, setShowModalDelete] = useState(false)
    const [dataDocente, setDataDocente] = useState<User>({} as User)
    const [searchTerm, setSearchTerm] = useState('')

    const getUgelText = (regionId?: number | string) => {
        if (regionId === undefined || regionId === null) return '-'
        const found = regiones.find(r => r.id === Number(regionId))
        return found ? found.region : '-'
    }

    const getNivelText = (user: User) => {
        const list = user.nivelDeInstitucion || []
        if (list.length > 0) {
            return list.map(n => {
                if (n === 0) return 'Inicial'
                if (n === 1) return 'Primaria'
                if (n === 2) return 'Secundaria'
                return '-'
            }).join(', ')
        }
        if (user.nivel === 0) return 'Inicial'
        if (user.nivel === 1) return 'Primaria'
        if (user.nivel === 2) return 'Secundaria'
        return '-'
    }

    const getAreaText = (areaId?: number | string) => {
        if (areaId === undefined || areaId === null) return '-'
        const found = area.find(a => a.id === Number(areaId))
        return found ? found.name : '-'
    }

    const handleEdit = (user: User) => {
        setDataDocente(user)
        setShowModalEdit(true)
    }

    const handleDelete = (user: User) => {
        setDataDocente(user)
        setShowModalDelete(true)
    }

    const filteredUsers = usuariosByRol.filter(user =>
        `${user.nombres} ${user.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.dni?.includes(searchTerm)
    )

    return (
        <div className={styles.container}>
            {showSearch && (
                <div className={styles.tableActions}>
                    <div className={styles.searchBar}>
                        <RiSearchLine className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o DNI..."
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Docente</th>
                            <th>DNI</th>
                            <th>Ugel</th>
                            <th>Provincia</th>
                            <th>Nivel</th>
                            <th>Área</th>
                            <th>Tipo</th>
                            <th>Gestión</th>
                            <th>Grados</th>
                            <th>Secciones</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user, index) => (
                                <tr key={user.dni || index}>
                                    <td>
                                        <div className={styles.teacherInfo}>
                                            <div className={styles.details}>
                                                <span className={styles.name}>{user.nombres} {user.apellidos}</span>
                                                <span className={styles.email}>{user.celular || 'Sin celular'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles.dniBadge}>
                                            {user.dni}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={styles.tableText}>{getUgelText(user.region)}</span>
                                    </td>
                                    <td>
                                        <span className={styles.tableText}>{user.distrito || '-'}</span>
                                    </td>
                                    <td>
                                        <span className={styles.levelBadge}>{getNivelText(user)}</span>
                                    </td>
                                    <td>
                                        <span className={styles.areaBadge}>{getAreaText(user.area)}</span>
                                    </td>
                                    <td>
                                        <span className={styles.caracteristicaBadge}>
                                            {getCaracteristicasDirectivoTexto(user.caracteristicaCurricular) || '-'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={styles.gestionBadge}>
                                            {user.tipoGestion ? (user.tipoGestion === 'publico' ? 'Público' : 'Privado') : '-'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.gradosContainer}>
                                            {Array.isArray(user.grados) && user.grados.length > 0 ? (
                                                (() => {
                                                    const gradeTexts = user.grados.map(g => getGradoTexto(g));
                                                    const chunks = [];
                                                    for (let i = 0; i < gradeTexts.length; i += 2) {
                                                        chunks.push(gradeTexts.slice(i, i + 2));
                                                    }
                                                    return chunks.map((chunk, index) => {
                                                        const isLast = index === chunks.length - 1;
                                                        const chunkStr = chunk.join(', ');
                                                        return (
                                                            <span key={index} className={styles.gradoFila}>
                                                                {chunkStr}{!isLast ? ',' : ''}
                                                            </span>
                                                        );
                                                    });
                                                })()
                                            ) : '-'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles.gradoFila}>
                                            {Array.isArray(user.secciones) && user.secciones.length > 0
                                                ? user.secciones.map(s => getSeccionTexto(s).toUpperCase()).join(',')
                                                : '-'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                className={`${styles.actionButton} ${styles.editButton}`}
                                                onClick={() => handleEdit(user)}
                                                title="Editar docente"
                                            >
                                                <MdEditSquare />
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.deleteButton}`}
                                                onClick={() => handleDelete(user)}
                                                title="Eliminar docente"
                                            >
                                                <RiDeleteBinLine />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={11} className={styles.emptyState}>
                                    No se encontraron docentes.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className={styles.cardContainer}>
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                        <div key={user.dni || index} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardMainInfo}>
                                    <h3 className={styles.cardName}>{user.nombres} {user.apellidos}</h3>
                                    <span className={styles.cardDni}>DNI: {user.dni}</span>
                                </div>
                                <div className={styles.cardActions}>
                                    <button className={styles.mobileEditButton} onClick={() => handleEdit(user)}>
                                        <MdEditSquare size={20} />
                                    </button>
                                    <button className={styles.mobileDeleteButton} onClick={() => handleDelete(user)}>
                                        <RiDeleteBinLine size={20} />
                                    </button>
                                </div>
                            </div>

                             <div className={styles.cardBody}>
                                <div className={styles.cardDataRow}>
                                    <span className={styles.cardLabel}>Celular:</span>
                                    <span className={styles.cardValue}>{user.celular || 'Sin celular'}</span>
                                </div>
                                <div className={styles.cardDataRow}>
                                    <span className={styles.cardLabel}>Ugel:</span>
                                    <span className={styles.cardValue}>{getUgelText(user.region)}</span>
                                </div>
                                <div className={styles.cardDataRow}>
                                    <span className={styles.cardLabel}>Provincia:</span>
                                    <span className={styles.cardValue}>{user.distrito || '-'}</span>
                                </div>
                                <div className={styles.cardDataRow}>
                                    <span className={styles.cardLabel}>Nivel:</span>
                                    <span className={styles.cardValue}>{getNivelText(user)}</span>
                                </div>
                                <div className={styles.cardDataRow}>
                                    <span className={styles.cardLabel}>Área:</span>
                                    <span className={styles.cardValue} style={{ textTransform: 'uppercase' }}>{getAreaText(user.area)}</span>
                                </div>
                                <div className={styles.cardDataRow}>
                                    <span className={styles.cardLabel}>Característica:</span>
                                    <span className={styles.cardValue}>{getCaracteristicasDirectivoTexto(user.caracteristicaCurricular) || '-'}</span>
                                </div>
                                <div className={styles.cardDataRow}>
                                    <span className={styles.cardLabel}>Gestión:</span>
                                    <span className={styles.cardValue}>{user.tipoGestion ? (user.tipoGestion === 'publico' ? 'Público' : 'Privado') : '-'}</span>
                                </div>
                                <div className={styles.cardInfoGrid}>
                                    <div className={styles.cardDataGroup}>
                                        <span className={styles.cardLabel}>Grados</span>
                                        <div className={styles.chipsContainer}>
                                            {Array.isArray(user.grados) && user.grados.length > 0 ? (
                                                user.grados.map(g => (
                                                    <span key={g} className={styles.tableChip}>{getGradoTexto(g)}</span>
                                                ))
                                            ) : '-'}
                                        </div>
                                    </div>
                                    <div className={styles.cardDataGroup}>
                                        <span className={styles.cardLabel}>Secciones</span>
                                        <div className={styles.chipsContainer}>
                                            {Array.isArray(user.secciones) && user.secciones.length > 0 ? (
                                                user.secciones.map(s => (
                                                    <span key={s} className={styles.tableChip}>{getSeccionTexto(s).toUpperCase()}</span>
                                                ))
                                            ) : '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.emptyState}>No se encontraron docentes.</div>
                )}
            </div>

            {showModalEdit && (
                <DocenteModal
                    dataDocente={dataDocente}
                    onClose={() => setShowModalEdit(false)}
                />
            )}

            {showModalDelete && (
                <DeleteUsuario
                    idUsuario={dataDocente.dni || ''}
                    handleShowModalDelete={() => setShowModalDelete(false)}
                />
            )}
        </div>
    )
}

export default UsuariosByRol