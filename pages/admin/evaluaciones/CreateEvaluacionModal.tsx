import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { especialidad } from '@/fuctions/categorias'
import { regiones } from '@/fuctions/regiones'
import { MdClose, MdEdit } from 'react-icons/md'
import { RiLoader4Line, RiGlobalLine, RiMapPin2Line, RiCheckLine, RiAlertLine } from 'react-icons/ri'
import styles from './createEvaluacionModal.module.css'
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import "dayjs/locale/es";

interface CreateEvaluacionModalProps {
    showModal: boolean
    handleShowModal: () => void
}

const CreateEvaluacionModal: React.FC<CreateEvaluacionModalProps> = ({
    showModal,
    handleShowModal
}) => {
    const [container, setContainer] = useState<Element | null>(null)

    useEffect(() => {
        setContainer(document.getElementById("portal-modal") || document.body)
    }, [])

    const initialValuesForData = {
        grado: 0,
        categoria: "",
        nombreEvaluacion: "",
        tipoDeEvaluacion: "",
        nivel: 0,
        añoDelExamen: new Date().getFullYear().toString(),
        mesDelExamen: new Date().getMonth().toString()
    }

    const [selectValues, setSelectValues] = useState(initialValuesForData)
    const { grados, categorias, loaderPages, tiposDeEvaluacion, currentUserData } = useGlobalContext()
    const { crearEvaluacion, getGrades, getCategories, crearCategoria, actualizarCategoria, getTipoDeEvaluacion } = useAgregarEvaluaciones()

    const [showNewCategory, setShowNewCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [savingCategory, setSavingCategory] = useState(false)

    const [showEditCategory, setShowEditCategory] = useState(false)
    const [editCategoryName, setEditCategoryName] = useState("")
    const [editCategoryLevels, setEditCategoryLevels] = useState<number[]>([])

    // Scope / UGELs restriction state
    const [scopeMode, setScopeMode] = useState<'todas' | 'especificas'>('todas')
    const [selectedUgels, setSelectedUgels] = useState<number[]>([])

    // Get currently selected category
    const selectedCategory = (categorias && categorias.length > 0 ? categorias : especialidad)
        .find(c => c.id.toString() === selectValues.categoria);

    // Sync form inputs when selection changes
    useEffect(() => {
        if (selectedCategory) {
            setEditCategoryName(selectedCategory.categoria)
            setEditCategoryLevels(selectedCategory.niveles || [])
        } else {
            setEditCategoryName("")
            setEditCategoryLevels([])
            setShowEditCategory(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectValues.categoria])

    const handleCreateCategory = async () => {
        if (newCategoryName.trim().length < 3) return
        setSavingCategory(true)
        const selectedGradeObj = grados.find(g => Number(g.grado) === Number(selectValues.grado))
        const selectedLevel = selectedGradeObj ? Number(selectedGradeObj.nivel) : 0
        try {
            const newId = await crearCategoria(newCategoryName.trim(), selectedLevel)
            setSelectValues(prev => ({
                ...prev,
                categoria: newId.toString()
            }))
            setShowNewCategory(false)
            setNewCategoryName("")
        } catch (error) {
            console.error('Error al crear categoría:', error)
        } finally {
            setSavingCategory(false)
        }
    }

    const handleUpdateCategory = async () => {
        if (!selectedCategory || editCategoryName.trim().length < 3) return
        setSavingCategory(true)
        try {
            await actualizarCategoria(selectedCategory.id, editCategoryName.trim(), editCategoryLevels)
            setShowEditCategory(false)
        } catch (error) {
            console.error('Error al actualizar categoría:', error)
        } finally {
            setSavingCategory(false)
        }
    }

    const getNivelGrado = (grado: number) => {
        if (grado === 12) return 0 // Inicial
        if (grado >= 1 && grado <= 6) return 1 // Primaria
        if (grado >= 7 && grado <= 11) return 2 // Secundaria
        return 0 // Inicial
    }

    const sortedGrados = React.useMemo(() => {
        if (!grados) return []
        let list = grados
        const rol = currentUserData?.perfil?.rol

        // Rol 1: Especialista UGEL usa 'nivelDeInstitucion'
        // Rol 5: Especialista Regional usa 'nivelesInstitucion'
        let rawNiveles: any = null
        if (rol === 1) {
            rawNiveles = currentUserData?.nivelDeInstitucion
        } else if (rol === 5) {
            rawNiveles = currentUserData?.nivelesInstitucion
        }

        if (rawNiveles !== null && rawNiveles !== undefined) {
            const nivelesArray = Array.isArray(rawNiveles) ? rawNiveles : [rawNiveles]
            const nivelesNumericos = nivelesArray.map(n => Number(n)).filter(n => !isNaN(n))
            list = grados.filter(grado => {
                const nivel = grado.nivel !== undefined ? Number(grado.nivel) : getNivelGrado(Number(grado.grado))
                return nivelesNumericos.includes(nivel)
            })
        }

        return [...list].sort((a, b) => {
            const nivelA = a.nivel ?? 0
            const nivelB = b.nivel ?? 0
            if (nivelA !== nivelB) return nivelA - nivelB
            return (a.grado ?? 0) - (b.grado ?? 0)
        })
    }, [grados, currentUserData?.perfil?.rol, currentUserData?.nivelDeInstitucion, currentUserData?.nivelesInstitucion])

    const tieneAccesoAInicial = React.useMemo(() => {
        const rol = currentUserData?.perfil?.rol
        if (rol === 4) return true // Administrador general
        let rawNiveles: any = null
        if (rol === 1) rawNiveles = currentUserData?.nivelDeInstitucion
        else if (rol === 5) rawNiveles = currentUserData?.nivelesInstitucion
        if (rawNiveles === null || rawNiveles === undefined) return true
        const nivelesArray = Array.isArray(rawNiveles) ? rawNiveles : [rawNiveles]
        return nivelesArray.map(Number).includes(0)
    }, [currentUserData?.perfil?.rol, currentUserData?.nivelDeInstitucion, currentUserData?.nivelesInstitucion])

    const [selectedDate, setSelectedDate] = useState(dayjs());

    useEffect(() => {
        getGrades()
        getCategories()
        getTipoDeEvaluacion()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleChangeValues = (e: React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        const newValues = {
            ...selectValues,
            [name]: value
        }

        if (name === 'grado') {
            const gradoSeleccionado = parseInt(value)
            const nuevoNivel = getNivelGrado(gradoSeleccionado)
            newValues.grado = gradoSeleccionado
            newValues.nivel = nuevoNivel

            // Reset category if it doesn't match the new level
            if (selectValues.categoria) {
                const list = categorias && categorias.length > 0 ? categorias : especialidad
                const catObj = list.find(c => c.id.toString() === selectValues.categoria)
                if (catObj && catObj.niveles && !catObj.niveles.includes(nuevoNivel)) {
                    newValues.categoria = ""
                }
            }
        }

        setSelectValues(newValues)
    }

    const handleDateChange = (newValue: any) => {
        setSelectedDate(newValue);
        if (newValue) {
            setSelectValues({
                ...selectValues,
                mesDelExamen: newValue.month().toString(),
                añoDelExamen: newValue.year().toString()
            });
        }
    };

    const handleCloseModal = () => {
        setScopeMode('todas')
        setSelectedUgels([])
        handleShowModal()
    }

    const handleAgregarEvaluacion = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await crearEvaluacion({
                ...selectValues,
                ugels: scopeMode === 'especificas' ? selectedUgels : []
            })
            setSelectValues(initialValuesForData)
            setSelectedDate(dayjs())
            setScopeMode('todas')
            setSelectedUgels([])
            handleShowModal() // Cerrar modal tras éxito
        } catch (error) {
            console.error('Error al crear evaluación:', error)
        }
    }

    if (!showModal) return null

    const isFormValid =
        selectValues.grado > 0 &&
        selectValues.categoria.length > 0 &&
        selectValues.nombreEvaluacion.length > 3 &&
        selectValues.tipoDeEvaluacion.length > 0 &&
        (scopeMode === 'todas' || selectedUgels.length > 0)

    const modalJSX = (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Crear Nueva Evaluación</h2>
                    <button onClick={handleCloseModal} className={styles.closeButton}>
                        <MdClose />
                    </button>
                </div>

                <form className={styles.form} onSubmit={handleAgregarEvaluacion}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Nombre de la Evaluación</label>
                        <input
                            onChange={handleChangeValues}
                            className={styles.input}
                            type="text"
                            placeholder="Ej: Evaluación de Comunicación - Marzo"
                            name="nombreEvaluacion"
                            value={selectValues.nombreEvaluacion}
                            required
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.inputGroup}>
                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                                <label className={styles.label}>Mes y Año</label>
                                <DesktopDatePicker
                                    views={['year', 'month']}
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                            fullWidth: true,
                                            sx: {
                                                backgroundColor: '#ffffff',
                                                borderRadius: '8px',
                                                '& .MuiOutlinedInput-root': {
                                                    height: '38px',
                                                    '& fieldset': {
                                                        borderColor: '#e2e8f0',
                                                    },
                                                    '&:hover fieldset': {
                                                        borderColor: '#94a3b8',
                                                    },
                                                    '&.Mui-focused fieldset': {
                                                        borderColor: '#0f172a',
                                                        borderWidth: '1px',
                                                    },
                                                },
                                                '& .MuiInputBase-input': {
                                                    padding: '0 0.75rem',
                                                    height: '38px',
                                                    boxSizing: 'border-box',
                                                    textTransform: 'uppercase',
                                                    color: '#0f172a',
                                                    fontSize: '0.85rem',
                                                }
                                            }
                                        },
                                        popper: {
                                            sx: {
                                                zIndex: 99999
                                            }
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Tipo de Evaluación</label>
                            <select
                                name="tipoDeEvaluacion"
                                onChange={handleChangeValues}
                                className={styles.select}
                                value={selectValues.tipoDeEvaluacion}
                                required
                            >
                                <option value="">Seleccionar Tipo</option>
                                {tiposDeEvaluacion?.map((tipo) => (
                                    <option key={tipo.value} value={tipo.value}>{tipo.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Grado */}
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Grado</label>
                        <select
                            name="grado"
                            onChange={handleChangeValues}
                            className={styles.select}
                            value={selectValues.grado}
                            required
                        >
                            <option value="0">Seleccionar Grado</option>
                            {tieneAccesoAInicial && !sortedGrados?.some(g => Number(g.grado) === 12) && (
                                <option value="12">5 años</option>
                            )}
                            {sortedGrados?.map((gr, index) => (
                                <option value={gr.grado} key={index}>{gr.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Categoría / Especialidad */}
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Categoría / Especialidad</label>
                        {!showNewCategory ? (
                            <div className={styles.horizontalGroup}>
                                <select
                                    name="categoria"
                                    onChange={handleChangeValues}
                                    className={styles.selectField}
                                    value={selectValues.categoria}
                                    required
                                    disabled={Number(selectValues.grado) === 0}
                                >
                                     <option value="">
                                         {Number(selectValues.grado) === 0 
                                             ? "Seleccione un grado primero" 
                                             : "Seleccionar Categoría"}
                                     </option>
                                     {Number(selectValues.grado) > 0 && (() => {
                                         const currentLevel = getNivelGrado(Number(selectValues.grado))
                                         return ([...(categorias && categorias.length > 0 ? categorias : especialidad)])
                                             .filter(c => c.activo !== false && (c.niveles ? c.niveles.includes(currentLevel) : false))
                                             .sort((a, b) => a.categoria.localeCompare(b.categoria))
                                     })()
                                         .map((esp, index) => (
                                             <option key={index} value={esp.id}>{esp.categoria}</option>
                                         ))}
                                </select>
                                {selectValues.categoria !== "" && (
                                    <button
                                        type="button"
                                        onClick={() => setShowEditCategory(prev => !prev)}
                                        className={`${styles.editCategoryBtn} ${showEditCategory ? styles.activeEdit : ''}`}
                                        title="Editar Categoría y Niveles"
                                    >
                                        <MdEdit />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowNewCategory(true)}
                                    className={styles.addCategoryBtn}
                                    title="Nueva Categoría"
                                    disabled={Number(selectValues.grado) === 0}
                                >
                                    +
                                </button>
                            </div>
                        ) : (
                            <div className={styles.horizontalGroup}>
                                <input
                                    type="text"
                                    placeholder="Nombre de la nueva categoría"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className={styles.inputField}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={handleCreateCategory}
                                    className={styles.saveCategoryBtn}
                                    disabled={newCategoryName.trim().length < 3 || savingCategory}
                                >
                                    {savingCategory ? <RiLoader4Line className={styles.spinner} /> : "✓"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNewCategory(false);
                                        setNewCategoryName("");
                                    }}
                                    className={styles.cancelCategoryBtn}
                                    disabled={savingCategory}
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        {showEditCategory && selectedCategory && (
                            <div className={styles.editCategoryContainer}>
                                <h4 className={styles.editCategoryTitle}>Editar Categoría y Niveles</h4>
                                <div className={styles.editCategoryInputGroup}>
                                    <input
                                        type="text"
                                        placeholder="Nombre de la categoría"
                                        value={editCategoryName}
                                        onChange={(e) => setEditCategoryName(e.target.value)}
                                        className={styles.inputField}
                                        autoFocus
                                    />
                                </div>
                                <div className={styles.levelsGroup}>
                                    <span className={styles.levelsLabel}>Niveles asignados:</span>
                                    <div className={styles.checkboxesContainer}>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={editCategoryLevels.includes(0)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setEditCategoryLevels(prev => [...prev, 0])
                                                    } else {
                                                        setEditCategoryLevels(prev => prev.filter(l => l !== 0))
                                                    }
                                                }}
                                            />
                                            Inicial
                                        </label>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={editCategoryLevels.includes(1)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setEditCategoryLevels(prev => [...prev, 1])
                                                    } else {
                                                        setEditCategoryLevels(prev => prev.filter(l => l !== 1))
                                                    }
                                                }}
                                            />
                                            Primaria
                                        </label>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={editCategoryLevels.includes(2)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setEditCategoryLevels(prev => [...prev, 2])
                                                    } else {
                                                        setEditCategoryLevels(prev => prev.filter(l => l !== 2))
                                                    }
                                                }}
                                            />
                                            Secundaria
                                        </label>
                                    </div>
                                    {editCategoryLevels.length === 0 && (
                                        <p className={styles.warningText}>Debe seleccionar al menos un nivel educativo.</p>
                                    )}
                                </div>
                                <div className={styles.editCategoryActions}>
                                    <button
                                        type="button"
                                        onClick={handleUpdateCategory}
                                        className={styles.saveCategoryActionBtn}
                                        disabled={savingCategory || editCategoryName.trim().length < 3 || editCategoryLevels.length === 0}
                                    >
                                        {savingCategory ? <RiLoader4Line className={styles.spinner} /> : "Guardar"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowEditCategory(false)}
                                        className={styles.cancelCategoryActionBtn}
                                        disabled={savingCategory}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Alcance de la Evaluación</label>
                        <div className={styles.scopeSegmentedControl}>
                            <button
                                type="button"
                                onClick={() => {
                                    setScopeMode('todas')
                                    setSelectedUgels([])
                                }}
                                className={`${styles.scopeSegmentBtn} ${scopeMode === 'todas' ? styles.scopeSegmentBtnActive : ''}`}
                            >
                                <RiGlobalLine className={styles.scopeIcon} />
                                <span>Todas las UGELs</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setScopeMode('especificas')}
                                className={`${styles.scopeSegmentBtn} ${scopeMode === 'especificas' ? styles.scopeSegmentBtnActive : ''}`}
                            >
                                <RiMapPin2Line className={styles.scopeIcon} />
                                <span>UGELs Específicas</span>
                                {selectedUgels.length > 0 && (
                                    <span className={styles.scopeBadgeCount}>{selectedUgels.length}</span>
                                )}
                            </button>
                        </div>

                        {scopeMode === 'especificas' && (
                            <div className={styles.ugelsContainer}>
                                <div className={styles.ugelsHeaderBar}>
                                    <span className={styles.ugelsCountText}>
                                        {selectedUgels.length} de {regiones.length} seleccionadas
                                    </span>
                                    <div className={styles.ugelsActionsGroup}>
                                        <button
                                            type="button"
                                            className={styles.ugelsActionLink}
                                            onClick={() => setSelectedUgels(regiones.map(r => r.id))}
                                        >
                                            Marcar todas
                                        </button>
                                        <span className={styles.ugelsActionDivider}>|</span>
                                        <button
                                            type="button"
                                            className={styles.ugelsActionLink}
                                            onClick={() => setSelectedUgels([])}
                                        >
                                            Limpiar
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.ugelsGrid}>
                                    {regiones.map((reg) => {
                                        const isChecked = selectedUgels.includes(reg.id)
                                        return (
                                            <button
                                                key={reg.id}
                                                type="button"
                                                onClick={() => {
                                                    if (isChecked) {
                                                        setSelectedUgels(prev => prev.filter(id => id !== reg.id))
                                                    } else {
                                                        setSelectedUgels(prev => [...prev, reg.id])
                                                    }
                                                }}
                                                className={`${styles.ugelChip} ${isChecked ? styles.ugelChipSelected : ''}`}
                                            >
                                                <span className={styles.ugelCheckboxIndicator}>
                                                    {isChecked && <RiCheckLine className={styles.ugelCheckIcon} />}
                                                </span>
                                                <span className={styles.ugelName}>{reg.region}</span>
                                            </button>
                                        )
                                    })}
                                </div>

                                {selectedUgels.length === 0 && (
                                    <div className={styles.validationMessage}>
                                        <RiAlertLine className={styles.validationIcon} />
                                        <span>Seleccione al menos una UGEL para la opción específica.</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!isFormValid || loaderPages}
                        className={`${styles.submitButton} ${!isFormValid ? styles.disabled : ''}`}
                    >
                        {loaderPages ? (
                            <>
                                <RiLoader4Line className={styles.spinner} />
                                Guardando...
                            </>
                        ) : (
                            'Guardar Evaluación'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );

    return container ? createPortal(modalJSX, container) : null;
}

export default CreateEvaluacionModal

