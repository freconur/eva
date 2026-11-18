import React, { useEffect, useState, useMemo } from 'react'
import { MdClose, MdRemove } from 'react-icons/md'
import { RiSearchLine, RiCloseCircleLine, RiBuilding4Line, RiLoader4Line } from 'react-icons/ri'
import styles from './AsignarEvaluacionModal.module.css'
import { useEspecialistasRegionales } from '@/features/hooks/useEspecialistasRegionales'
import { regiones } from '@/fuctions/regiones'
import { toast } from 'react-toastify'

interface AsignarEvaluacionUgelModalProps {
    showModal: boolean
    handleShowModal: () => void
    idEvaluacion: string
    usuariosConPermisosUgel: string[] | undefined
}

// Helper para normalizar cadenas (remueve acentos, tildes y pasa a minúsculas)
const normalizeText = (text: string = ''): string => {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
}

// Helper para extraer la información de la UGEL del especialista
const getEspecialistaUgelInfo = (especialista: any): { id: string; nombre: string } => {
    if (especialista.region !== undefined && especialista.region !== null && String(especialista.region).trim() !== '') {
        const regNum = Number(especialista.region)
        const found = regiones.find(r => r.id === regNum)
        if (found) {
            return { id: String(found.id), nombre: found.region }
        }
    }
    if (especialista.ugel !== undefined && especialista.ugel !== null && String(especialista.ugel).trim() !== '') {
        const ugelStr = String(especialista.ugel).trim()
        const num = Number(ugelStr)
        if (!isNaN(num)) {
            const found = regiones.find(r => r.id === num)
            if (found) return { id: String(found.id), nombre: found.region }
        }
        const cleanUgel = ugelStr.toLowerCase().replace(/^ugel\s+/i, '').trim()
        const foundByName = regiones.find(r => r.region.toLowerCase() === cleanUgel)
        if (foundByName) {
            return { id: String(foundByName.id), nombre: foundByName.region }
        }
        return { id: ugelStr, nombre: ugelStr }
    }
    return { id: 'sin_ugel', nombre: 'Sin UGEL' }
}

const AsignarEvaluacionUgelModal: React.FC<AsignarEvaluacionUgelModalProps> = ({
    showModal,
    handleShowModal,
    idEvaluacion,
    usuariosConPermisosUgel
}) => {
    const [especialistasSeleccionados, setEspecialistasSeleccionados] = useState<string[]>([])
    const [haHabidoCambios, setHaHabidoCambios] = useState<boolean>(false)
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [selectedUgel, setSelectedUgel] = useState<string>('all')

    const { getEspecialistasUgel, especialistasUgel, addPermisosUgelEnEvaluacion } = useEspecialistasRegionales()

    useEffect(() => {
        if (showModal) {
            const unsubscribe = getEspecialistasUgel()
            return () => {
                if (typeof unsubscribe === 'function') unsubscribe()
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showModal])

    // Inicializar especialistas seleccionados si usuariosConPermisosUgel tiene datos
    useEffect(() => {
        if (showModal && usuariosConPermisosUgel && usuariosConPermisosUgel.length > 0) {
            setEspecialistasSeleccionados(usuariosConPermisosUgel)
        } else if (showModal) {
            setEspecialistasSeleccionados([])
        }
        setHaHabidoCambios(false)
        setSearchQuery('')
        setSelectedUgel('all')
    }, [showModal, usuariosConPermisosUgel])

    // Lista dinámica de UGELs presentes con conteo de especialistas
    const ugelsDisponibles = useMemo(() => {
        const map = new Map<string, { id: string; nombre: string; count: number }>()

        especialistasUgel.forEach(esp => {
            const info = getEspecialistaUgelInfo(esp)
            const existing = map.get(info.id)
            if (existing) {
                existing.count += 1
            } else {
                map.set(info.id, { id: info.id, nombre: info.nombre, count: 1 })
            }
        })

        return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
    }, [especialistasUgel])

    // Búsqueda inteligente multi-token cruzada (DNI, Nombres, Apellidos, UGEL) y filtro por UGEL
    const especialistasFiltrados = useMemo(() => {
        const tokens = normalizeText(searchQuery).split(/\s+/).filter(Boolean)

        return especialistasUgel.filter(esp => {
            const ugelInfo = getEspecialistaUgelInfo(esp)

            // Filtro por UGEL
            if (selectedUgel !== 'all' && ugelInfo.id !== selectedUgel) {
                return false
            }

            // Búsqueda inteligente cruzada: Todos los tokens deben coincidir en cualquier campo
            if (tokens.length > 0) {
                const nombreCompleto = `${esp.nombres || ''} ${esp.apellidos || ''}`.trim()
                const searchableText = normalizeText(`${esp.dni || ''} ${nombreCompleto} ${ugelInfo.nombre}`)
                const matchesAllTokens = tokens.every(token => searchableText.includes(token))
                if (!matchesAllTokens) return false
            }

            return true
        })
    }, [especialistasUgel, selectedUgel, searchQuery])

    if (!showModal) return null

    const handleToggleEspecialista = (dni: string) => {
        setEspecialistasSeleccionados(prev => {
            const exists = prev.includes(dni)
            const next = exists ? prev.filter(d => d !== dni) : [...prev, dni]
            setHaHabidoCambios(true)
            return next
        })
    }

    const handleRemoveEspecialista = (dniToRemove: string) => {
        setEspecialistasSeleccionados(prev => prev.filter(dni => dni !== dniToRemove))
        setHaHabidoCambios(true)
    }

    const handleSelectAllVisible = () => {
        const dnisFiltrados = especialistasFiltrados.map(e => e.dni).filter(Boolean) as string[]
        setEspecialistasSeleccionados(prev => {
            const newDnis = Array.from(new Set([...prev, ...dnisFiltrados]))
            setHaHabidoCambios(true)
            return newDnis
        })
    }

    const handleDeselectAllVisible = () => {
        const dnisFiltrados = new Set(especialistasFiltrados.map(e => e.dni))
        setEspecialistasSeleccionados(prev => {
            const next = prev.filter(dni => !dnisFiltrados.has(dni))
            setHaHabidoCambios(true)
            return next
        })
    }

    const handleClearAllSelected = () => {
        setEspecialistasSeleccionados([])
        setHaHabidoCambios(true)
    }

    const areAllVisibleSelected =
        especialistasFiltrados.length > 0 &&
        especialistasFiltrados.every(e => e.dni && especialistasSeleccionados.includes(e.dni))

    const obtenerNombreCompleto = (especialista: any) => {
        return `${especialista.nombres || ''} ${especialista.apellidos || ''}`.trim()
    }

    const handleGuardar = async () => {
        if (isSaving) return
        setIsSaving(true)
        try {
            await addPermisosUgelEnEvaluacion(idEvaluacion, especialistasSeleccionados)
            toast.success(`Se asignaron ${especialistasSeleccionados.length} especialista(s) UGEL a la evaluación`)
            setHaHabidoCambios(false)
            handleShowModal()
        } catch (error) {
            console.error('Error al guardar permisos UGEL:', error)
            toast.error('Error al guardar los permisos de especialistas UGEL.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className={styles.modalOverlay} onClick={handleShowModal}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <div>
                        <h2 className={styles.modalTitle}>Asignar Especialista UGEL a Evaluación</h2>
                    </div>
                    <button
                        className={styles.closeButton}
                        onClick={handleShowModal}
                        aria-label="Cerrar modal"
                    >
                        <MdClose />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {/* Barra de Filtros: Búsqueda Inteligente + Dropdown de UGEL */}
                    <div className={styles.filterSection}>
                        <div className={styles.filterControls}>
                            {/* Input de Búsqueda Inteligente */}
                            <div className={styles.searchWrapper}>
                                <RiSearchLine className={styles.searchIcon} />
                                <input
                                    type="text"
                                    className={styles.searchInput}
                                    placeholder="Buscar por DNI, nombres o apellidos (ej. 0120 quispe)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        className={styles.clearSearchBtn}
                                        onClick={() => setSearchQuery('')}
                                        title="Limpiar búsqueda"
                                    >
                                        <RiCloseCircleLine size={18} />
                                    </button>
                                )}
                            </div>

                            {/* Dropdown de Filtrado por UGEL */}
                            <div className={styles.ugelWrapper}>
                                <select
                                    className={styles.ugelSelect}
                                    value={selectedUgel}
                                    onChange={(e) => setSelectedUgel(e.target.value)}
                                    title="Filtrar por UGEL"
                                >
                                    <option value="all">Todas las UGELs ({especialistasUgel.length})</option>
                                    {ugelsDisponibles.map(u => (
                                        <option key={u.id} value={u.id}>
                                            UGEL {u.nombre} ({u.count})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Barra de Conteo y Acciones Rápidas */}
                    <div className={styles.listHeaderBar}>
                        <span className={styles.listCounter}>
                            Mostrando <strong>{especialistasFiltrados.length}</strong> de {especialistasUgel.length} especialistas UGEL
                        </span>
                        {especialistasFiltrados.length > 0 && (
                            <button
                                type="button"
                                className={styles.quickActionLink}
                                onClick={areAllVisibleSelected ? handleDeselectAllVisible : handleSelectAllVisible}
                            >
                                {areAllVisibleSelected
                                    ? 'Deseleccionar visibles'
                                    : `Seleccionar visibles (${especialistasFiltrados.length})`}
                            </button>
                        )}
                    </div>

                    {/* Lista Interactiva de Especialistas */}
                    <div className={styles.specialistsScrollContainer}>
                        {especialistasFiltrados.length > 0 ? (
                            especialistasFiltrados.map((esp) => {
                                const isSelected = esp.dni ? especialistasSeleccionados.includes(esp.dni) : false
                                const ugelInfo = getEspecialistaUgelInfo(esp)

                                return (
                                    <div
                                        key={esp.dni}
                                        className={`${styles.specialistRow} ${isSelected ? styles.specialistRowActive : ''}`}
                                        onClick={() => esp.dni && handleToggleEspecialista(esp.dni)}
                                    >
                                        <input
                                            type="checkbox"
                                            className={styles.checkboxInput}
                                            checked={isSelected}
                                            onChange={() => {}} // Manejado por onClick del contenedor
                                            aria-label={`Seleccionar ${obtenerNombreCompleto(esp)}`}
                                        />
                                        <div className={styles.rowMainContent}>
                                            <div className={styles.rowIdent}>
                                                <span className={styles.dniBadge}>{esp.dni}</span>
                                                <span className={styles.fullNameText}>
                                                    {obtenerNombreCompleto(esp)}
                                                </span>
                                            </div>
                                            <span className={styles.ugelTag}>
                                                UGEL {ugelInfo.nombre}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className={styles.emptyResults}>
                                <p>No se encontraron especialistas que coincidan con la búsqueda o filtro.</p>
                                {(searchQuery || selectedUgel !== 'all') && (
                                    <button
                                        type="button"
                                        className={styles.resetFiltersBtn}
                                        onClick={() => {
                                            setSearchQuery('')
                                            setSelectedUgel('all')
                                        }}
                                    >
                                        Restablecer filtros
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Especialistas Seleccionados */}
                    {especialistasSeleccionados.length > 0 && (
                        <div className={styles.selectedContainer}>
                            <div className={styles.selectedHeaderRow}>
                                <h3 className={styles.selectedTitle} style={{ margin: 0 }}>
                                    Especialistas Seleccionados:
                                    <span className={styles.selectedCountBadge}>
                                        {especialistasSeleccionados.length}
                                    </span>
                                </h3>
                                <button
                                    type="button"
                                    className={styles.clearAllTextBtn}
                                    onClick={handleClearAllSelected}
                                >
                                    Quitar todos
                                </button>
                            </div>

                            <div className={styles.selectedScrollList}>
                                {especialistasSeleccionados.map((dni) => {
                                    const especialista = especialistasUgel.find(esp => esp.dni === dni)
                                    const ugelInfo = especialista ? getEspecialistaUgelInfo(especialista) : null

                                    return (
                                        <div key={dni} className={styles.selectedItem}>
                                            <span className={styles.selectedDni}>{dni}</span>
                                            <span className={styles.selectedName}>
                                                {especialista ? obtenerNombreCompleto(especialista) : 'Nombre no disponible'}
                                                {ugelInfo && (
                                                    <span className={styles.selectedUgelTag}>
                                                        {ugelInfo.nombre}
                                                    </span>
                                                )}
                                            </span>
                                            <button
                                                type="button"
                                                className={styles.removeButton}
                                                onClick={() => handleRemoveEspecialista(dni)}
                                                aria-label={`Quitar especialista ${dni}`}
                                                title="Quitar de la selección"
                                            >
                                                <MdRemove />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={styles.modalFooter}>
                    <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={handleShowModal}
                        disabled={isSaving}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className={styles.saveButton}
                        onClick={handleGuardar}
                        disabled={!haHabidoCambios || isSaving}
                    >
                        {isSaving ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <RiLoader4Line className="animate-spin" /> Guardando...
                            </span>
                        ) : (
                            'Guardar Permisos UGEL'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AsignarEvaluacionUgelModal
