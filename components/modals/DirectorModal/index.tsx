import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { RiCloseLine, RiLoader4Line, RiFileExcel2Line } from 'react-icons/ri'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import useUsuario from '@/features/hooks/useUsuario'
import { rolDirectivo, genero, caracteristicasDirectivo, nivelInstitucion, area } from '@/fuctions/regiones'
import { distritosPuno } from '@/fuctions/provinciasPuno'
import styles from './DirectorModal.module.css'
import { read, utils } from 'xlsx'

interface Props {
    onClose: () => void;
}

const DirectorModal = ({ onClose }: Props) => {
    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
    const { createNewDirector, getRegiones, createMassiveDirectors } = useUsuario()
    const { regiones, loaderPages, warningUsuarioExiste } = useGlobalContext()
    const [distritos, setDistritos] = useState<string[]>([])
    const [nivelesSeleccionados, setNivelesSeleccionados] = useState<number[]>([])
    const [activeTab, setActiveTab] = useState<'individual' | 'masivo'>('individual')
    const [excelData, setExcelData] = useState<any[]>([])
    const [fileName, setFileName] = useState<string>('')
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [isError, setIsError] = useState<boolean>(false)

    const regionSeleccionada = watch("region")

    useEffect(() => {
        getRegiones()
    }, [])

    useEffect(() => {
        if (regionSeleccionada) {
            const provinciaEncontrada = distritosPuno.find(prov => prov.id === Number(regionSeleccionada))
            if (provinciaEncontrada) {
                setDistritos(provinciaEncontrada.distritos)
            }
        } else {
            setDistritos([])
        }
    }, [regionSeleccionada])

    const handleNivelChange = (nivelId: number) => {
        setNivelesSeleccionados(prev => {
            if (prev.includes(nivelId)) {
                return prev.filter(id => id !== nivelId)
            } else {
                return [...prev, nivelId]
            }
        })
    }

    const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const numericValue = value.replace(/[^0-9]/g, '')
        const limitedValue = numericValue.slice(0, 8)
        e.target.value = limitedValue
    }

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const cleanedValue = value.replace(/\s+/g, ' ')
        e.target.value = cleanedValue
    }

    const onSubmit = handleSubmit(async (data) => {
        setStatusMessage(null)
        setIsError(false)
        if (nivelesSeleccionados.length === 0) {
            return
        }

        const result = await createNewDirector({
            ...data,
            region: Number(data.region),
            area: Number(data.area),
            nivelDeInstitucion: nivelesSeleccionados,
            perfil: { rol: 2, nombre: "director" }
        })

        if (result && result.success) {
            setStatusMessage("Director registrado exitosamente")
            setTimeout(() => onClose(), 2000)
        } else {
            setIsError(true)
            setStatusMessage(result.message || "Error al crear director")
        }
    })

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setStatusMessage(null)
        setIsError(false)
        const file = e.target.files?.[0]
        if (!file) return

        setFileName(file.name)
        const data = await file.arrayBuffer()
        const workbook = read(data)
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = utils.sheet_to_json(worksheet)
        setExcelData(jsonData)
    }

    const mapExcelDataToDirector = (row: any) => {
        const normalizedRow = Object.keys(row).reduce((acc: any, key) => {
            acc[key.toLowerCase().trim()] = row[key]
            return acc
        }, {})

        const findIdByName = (arr: any[], name: string) => {
            const item = arr?.find(i => i.name.toLowerCase() === name?.toString().toLowerCase())
            return item ? item.id : null
        }

        const findRegionId = (name: string) => {
            const region = regiones?.find(r => r.region?.toLowerCase() === name?.toString().toLowerCase())
            return region ? Number(region.codigo) : null
        }

        const parseNiveles = (val: any) => {
            if (!val) return []
            const text = String(val).replace(/\s/g, '').trim()

            if (text.includes(',')) {
                return text.split(',')
                    .map(s => Number(s))
                    .filter(n => !isNaN(n) && n > 0)
            }

            const num = Number(text)
            return (!isNaN(num) && num > 0) ? [num] : []
        }

        return {
            dni: String(normalizedRow['dni'] || '').trim(),
            nombres: normalizedRow['nombres'],
            apellidos: normalizedRow['apellidos'],
            nivel: parseNiveles(normalizedRow['nivel']),
            institucion: normalizedRow['institucion'],
            region: findRegionId(normalizedRow['ugel']) || 0,
            rolDirectivo: findIdByName(rolDirectivo, normalizedRow['rol directivo']) || 1,
            genero: findIdByName(genero, normalizedRow['genero'])?.toString() || "1",
            caracteristicaCurricular: findIdByName(caracteristicasDirectivo, normalizedRow['caracteristica curricular']) || 1,
            area: findIdByName(area, normalizedRow['area']) || 1,
            distrito: normalizedRow['distrito'] || ''
        }
    }

    const handleMassiveSubmit = async () => {
        setStatusMessage(null)
        setIsError(false)
        if (excelData.length === 0) {
            setIsError(true)
            setStatusMessage("No hay datos para procesar")
            return
        }

        const directoresParsed = excelData.map(mapExcelDataToDirector)
        const errores: string[] = []

        directoresParsed.forEach((d, index) => {
            const rowNum = index + 2
            if (!d.dni || d.dni.length !== 8 || isNaN(Number(d.dni))) {
                errores.push(`Fila ${rowNum}: DNI inválido (debe ser 8 dígitos numéricos)`)
            }
            if (!d.nombres) errores.push(`Fila ${rowNum}: Falta nombres`)
            if (!d.apellidos) errores.push(`Fila ${rowNum}: Falta apellidos`)
            if (!d.institucion) errores.push(`Fila ${rowNum}: Falta institución`)
            if (d.nivel.length === 0) errores.push(`Fila ${rowNum}: Nivel inválido (usar 1, 2, etc)`)
        })

        if (errores.length > 0) {
            setIsError(true)
            setStatusMessage(`Errores de validación:\n${errores.slice(0, 5).join('\n')}${errores.length > 5 ? `\n... y ${errores.length - 5} más` : ''}`)
            return
        }

        const result = await createMassiveDirectors(directoresParsed)

        if (result.success) {
            if (result.detalles?.errores?.length > 0) {
                setIsError(true)
                setStatusMessage(`Proceso finalizado con algunos errores. Revise la consola.`)
                console.warn("Errores backend:", result.detalles.errores)
            } else {
                setStatusMessage(result.message || "Carga masiva completada con éxito")
                setTimeout(() => onClose(), 2000)
            }
        } else {
            setIsError(true)
            setStatusMessage(result.message || "Error en la carga masiva")
        }
    }

    let container;
    if (typeof window !== "undefined") {
        container = document.getElementById("portal-modal");
    }

    if (!container) return null

    return createPortal(
        <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>
                        Registrar Nuevo Director
                    </h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <RiCloseLine size={24} />
                    </button>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'individual' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('individual')}
                    >
                        Individual
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'masivo' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('masivo')}
                    >
                        Carga Masiva (Excel)
                    </button>
                </div>

                {activeTab === 'individual' ? (
                    <form onSubmit={onSubmit} className={styles.form}>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nombre de la I.E.</label>
                                <input
                                    {...register("institucion", {
                                        required: { value: true, message: "El nombre de la institución es requerido" },
                                        minLength: { value: 5, message: "El nombre debe tener mínimo 5 caracteres" },
                                        maxLength: { value: 100, message: "El nombre debe tener máximo 100 caracteres" },
                                    })}
                                    className={styles.input}
                                    placeholder="Nombre de la institución"
                                />
                                {errors.institucion && <span className={styles.error}>{errors.institucion.message as string}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nivel de Institución</label>
                                <div className={styles.radioGroup}>
                                    {nivelInstitucion?.map((nivel, index) => (
                                        <label key={index} className={`${styles.radioLabel} ${nivel.id === 0 ? styles.disabled : ''}`}>
                                            <input
                                                type="checkbox"
                                                checked={nivelesSeleccionados.includes(nivel.id)}
                                                onChange={() => handleNivelChange(nivel.id)}
                                                disabled={nivel.id === 0}
                                            />
                                            {nivel.name}
                                        </label>
                                    ))}
                                </div>
                                {nivelesSeleccionados.length === 0 && (
                                    <span className={styles.error}>Debe seleccionar al menos un nivel</span>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>DNI</label>
                                <input
                                    {...register("dni", {
                                        required: { value: true, message: "El DNI es requerido" },
                                        pattern: { value: /^[0-9]{8}$/, message: "8 dígitos" }
                                    })}
                                    className={styles.input}
                                    placeholder="8 dígitos"
                                    maxLength={8}
                                    onChange={handleDniChange}
                                />
                                {errors.dni && <span className={styles.error}>{errors.dni.message as string}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nombres</label>
                                <input
                                    {...register("nombres", {
                                        required: "Campo requerido",
                                        minLength: { value: 2, message: "Mínimo 2 caracteres" }
                                    })}
                                    className={styles.input}
                                    placeholder="Nombres del director"
                                    onChange={handleNameChange}
                                />
                                {errors.nombres && <span className={styles.error}>{errors.nombres.message as string}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Apellidos</label>
                                <input
                                    {...register("apellidos", {
                                        required: "Campo requerido",
                                        minLength: { value: 2, message: "Mínimo 2 caracteres" }
                                    })}
                                    className={styles.input}
                                    placeholder="Apellidos del director"
                                    onChange={handleNameChange}
                                />
                                {errors.apellidos && <span className={styles.error}>{errors.apellidos.message as string}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>UGEL</label>
                                <select
                                    {...register("region", { required: "Requerido" })}
                                    className={styles.select}
                                >
                                    <option value="">Seleccione UGEL</option>
                                    {regiones?.map((region, index) => (
                                        <option key={index} value={Number(region.codigo)}>{region.region?.toUpperCase()}</option>
                                    ))}
                                </select>
                                {errors.region && <span className={styles.error}>{errors.region.message as string}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Distrito</label>
                                <select
                                    {...register("distrito", { required: "Requerido" })}
                                    className={styles.select}
                                    disabled={!regionSeleccionada}
                                >
                                    <option value="">Seleccione Distrito</option>
                                    {distritos.map((distrito, index) => (
                                        <option key={index} value={distrito}>{distrito.toUpperCase()}</option>
                                    ))}
                                </select>
                                {errors.distrito && <span className={styles.error}>{errors.distrito.message as string}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Rol Directivo</label>
                                <select
                                    {...register("rolDirectivo", { required: "Requerido" })}
                                    className={styles.select}
                                >
                                    <option value="">Seleccione Rol</option>
                                    {rolDirectivo?.map((rol, index) => (
                                        <option key={index} value={rol.id}>{rol.name.toUpperCase()}</option>
                                    ))}
                                </select>
                                {errors.rolDirectivo && <span className={styles.error}>{errors.rolDirectivo.message as string}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Género</label>
                                <select
                                    {...register("genero", { required: "Requerido" })}
                                    className={styles.select}
                                >
                                    <option value="">Seleccione Género</option>
                                    {genero?.map((gen, index) => (
                                        <option key={index} value={gen.id}>{gen.name.toUpperCase()}</option>
                                    ))}
                                </select>
                                {errors.genero && <span className={styles.error}>{errors.genero.message as string}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Característica</label>
                                <select
                                    {...register("caracteristicaCurricular", { required: "Requerido" })}
                                    className={styles.select}
                                >
                                    <option value="">Seleccione Característica</option>
                                    {caracteristicasDirectivo?.map((caract, index) => (
                                        <option key={index} value={caract.id}>{caract.name.toUpperCase()}</option>
                                    ))}
                                </select>
                                {errors.caracteristicaCurricular && <span className={styles.error}>{errors.caracteristicaCurricular.message as string}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Area</label>
                                <div className={styles.radioGroup}>
                                    {area?.map((a, index) => (
                                        <label key={index} className={styles.radioLabel}>
                                            <input
                                                type="radio"
                                                value={a.id}
                                                {...register("area", { required: "Debe seleccionar un área" })}
                                            />
                                            {a.name.toUpperCase()}
                                        </label>
                                    ))}
                                </div>
                                {errors.area && <span className={styles.error}>{errors.area.message as string}</span>}
                            </div>
                        </div>

                        {warningUsuarioExiste && (
                            <div className={styles.error}>
                                {warningUsuarioExiste}
                            </div>
                        )}

                        {statusMessage && (
                            <div className={isError ? styles.errorStatus : styles.successStatus}>
                                {statusMessage}
                            </div>
                        )}

                        <div className={styles.modalFooter}>
                            <button type="button" onClick={onClose} className={`${styles.button} ${styles.cancelButton}`}>
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loaderPages}
                                className={`${styles.button} ${styles.submitButton}`}
                            >
                                {loaderPages ? <RiLoader4Line className="animate-spin" /> : 'Registrar Director'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className={styles.uploadContainer}>
                        <div className={styles.uploadBox}>
                            <RiFileExcel2Line size={48} color="#107c41" />
                            <p>Subir archivo Excel (.xlsx)</p>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                className={styles.fileInput}
                            />
                        </div>
                        {fileName && <p className={styles.fileName}>Archivo seleccionado: {fileName}</p>}
                        {excelData.length > 0 && <p className={styles.fileInfo}>{excelData.length} registros encontrados</p>}

                        <div className={styles.uploadInstructions}>
                            <h4>Instrucciones:</h4>
                            <p>El archivo excel debe tener las siguientes columnas:</p>
                            <ul>
                                <li>dni, nombres, apellidos</li>
                                <li>nivel (ej. "1" o "1,2")</li>
                                <li>institucion, ugel, distrito</li>
                                <li>rol directivo, genero, caracteristica curricular, area</li>
                            </ul>
                            <p className={styles.warning}>* Todos los campos son obligatorios</p>
                            <p className={styles.warning}>* Máximo 500 usuarios por archivo</p>
                        </div>

                        {statusMessage && (
                            <div className={isError ? styles.errorStatus : styles.successStatus}>
                                {statusMessage}
                            </div>
                        )}

                        <div className={styles.modalFooter}>
                            <button onClick={onClose} className={`${styles.button} ${styles.cancelButton}`}>
                                Cancelar
                            </button>
                            <button
                                onClick={handleMassiveSubmit}
                                disabled={loaderPages || excelData.length === 0}
                                className={`${styles.button} ${styles.submitButton}`}
                            >
                                {loaderPages ? <RiLoader4Line className="animate-spin" /> : 'Procesar Carga Masiva'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        container
    )
}

export default DirectorModal
