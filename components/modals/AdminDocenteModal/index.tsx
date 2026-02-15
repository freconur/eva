import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import {
    RiCloseLine,
    RiLoader4Line,
    RiUserSearchLine,
    RiUserAddLine
} from 'react-icons/ri'
import { User } from '@/features/types/types'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import useUsuario from '@/features/hooks/useUsuario'
import {
    genero as generoOptions,
    nivelInstitucion,
    area as areaOptions,
    gradosDeColegio,
    sectionByGrade
} from '@/fuctions/regiones'
import { distritosPuno } from '@/fuctions/provinciasPuno'
import styles from './AdminDocenteModal.module.css'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { app } from '@/firebase/firebase.config'

interface Props {
    onClose: () => void;
}

interface FormData extends Omit<User, 'nivelDeInstitucion' | 'grados' | 'secciones'> {
    nivelDeInstitucion?: string[];
    grados?: string[];
    secciones?: string[];
}

const AdminDocenteModal = ({ onClose }: Props) => {
    const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            nivelDeInstitucion: [],
            grados: [],
            secciones: [],
            area: 1,
            genero: "1"
        }
    })

    const { getRegiones, crearNuevoDocente } = useUsuario()
    const { regiones, loaderPages, warningUsuarioExiste } = useGlobalContext()

    const [distritos, setDistritos] = useState<string[]>([])
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [isError, setIsError] = useState<boolean>(false)
    const [searchingDirector, setSearchingDirector] = useState(false)
    const [directorAsignado, setDirectorAsignado] = useState(false)
    const [nivelesDirector, setNivelesDirector] = useState<string[]>([])

    const regionSeleccionada = watch("region")
    const nivelesSeleccionados = watch("nivelDeInstitucion") || []
    const gradosSeleccionados = watch("grados") || []
    const dniDirector = watch("dniDirector")

    useEffect(() => {
        console.log('AdminDocenteModal Mounted')
        getRegiones()
    }, [])

    useEffect(() => {
        const length = dniDirector?.length || 0;
        console.log('dniDirector watch:', dniDirector)
        if (length === 8) {
            searchDirector(dniDirector!)
        } else if (length < 8) {
            setDirectorAsignado(false)
            setNivelesDirector([])
        }
    }, [dniDirector])

    const searchDirector = async (dni: string) => {
        console.log('searchDirector triggered with DNI:', dni)
        setSearchingDirector(true)
        setStatusMessage(null)
        setDirectorAsignado(false)
        try {
            const db = getFirestore(app)
            const docRef = doc(db, 'usuarios', dni)
            const docSnap = await getDoc(docRef)

            if (docSnap.exists()) {
                const data = docSnap.data() as User
                console.log('Director found:', data)

                // Solo auto-rellenar si es rol director (2)
                const isDirector = data.perfil?.rol === 2 || data.rol === 2

                if (isDirector) {
                    setDirectorAsignado(true)
                    // Mapear campos con fallback por si hay discrepancias de nombres
                    const region = data.region
                    const institucion = data.institucion || ''
                    const distrito = data.distrito || ''
                    const area = data.area !== undefined ? data.area : 1

                    if (region) setValue("region", region)
                    if (institucion) setValue("institucion", institucion)
                    if (distrito) setValue("distrito", distrito)
                    setValue("area", area)

                    // Manejar niveles de institución (solo para filtrar, no para seleccionar)
                    let nivelesComoString: string[] = []

                    if (Array.isArray(data.nivelDeInstitucion)) {
                        nivelesComoString = data.nivelDeInstitucion.map(n => String(n))
                    } else if (data.nivelDeInstitucion !== undefined) {
                        nivelesComoString = [String(data.nivelDeInstitucion)]
                    } else if (data.nivel !== undefined) {
                        // Fallback al campo 'nivel' individual
                        nivelesComoString = [String(data.nivel)]
                    }

                    setNivelesDirector(nivelesComoString)
                    // IMPORTANTE: Ya no seleccionamos automáticamente los niveles
                    // setValue("nivelDeInstitucion", nivelesComoString)

                    console.log('Fields set - Reg:', region, 'IE:', institucion, 'Dist:', distrito, 'Niveles Disp:', nivelesComoString)

                    setStatusMessage("Datos cargados. Seleccione el nivel de la institución.")
                    setIsError(false)
                } else {
                    console.log('User found but not a director, role:', data.rol, 'perfil.rol:', data.perfil?.rol)
                    setIsError(true)
                    setStatusMessage("El DNI ingresado no pertenece a un director")
                }
            } else {
                console.log('Director with DNI', dni, 'not found')
                setIsError(true)
                setStatusMessage("Director no encontrado en la base de datos")
            }
        } catch (error) {
            console.error("Error searching director:", error)
            setStatusMessage("Error al buscar director")
        } finally {
            setSearchingDirector(false)
        }
    }

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

    // Limpiar grados si se desmarcan niveles
    useEffect(() => {
        if (nivelesSeleccionados.length === 0) {
            setValue("grados", [])
            setValue("secciones", [])
        } else {
            const filteredGrados = gradosSeleccionados.filter(gradoId => {
                const gradoObj = gradosDeColegio.find(g => String(g.id) === gradoId)
                if (!gradoObj) return false
                // Primaria es nivel 1, Secundaria es nivel 2
                if (nivelesSeleccionados.includes("1") && gradoObj.nivel === 1) return true
                if (nivelesSeleccionados.includes("2") && gradoObj.nivel === 2) return true
                return false
            })
            if (filteredGrados.length !== gradosSeleccionados.length) {
                setValue("grados", filteredGrados)
            }
        }
    }, [nivelesSeleccionados, setValue])

    // Limpiar secciones si se desmarcan grados
    useEffect(() => {
        if (gradosSeleccionados.length === 0) {
            setValue("secciones", [])
        }
    }, [gradosSeleccionados, setValue])

    const onSubmit = handleSubmit(async (data) => {
        setStatusMessage(null)
        setIsError(false)

        const dataToSubmit: User = {
            ...data,
            region: Number(data.region),
            area: Number(data.area),
            grados: (data.grados || []).map(g => Number(g)),
            secciones: (data.secciones || []).map(s => Number(s)),
            nivelDeInstitucion: (data.nivelDeInstitucion || []).map(n => Number(n)),
            // El primer nivel seleccionado se guarda como 'nivel' por compatibilidad
            nivel: (data.nivelDeInstitucion && data.nivelDeInstitucion.length > 0)
                ? Number(data.nivelDeInstitucion[0])
                : undefined,
            perfil: { rol: 3, nombre: "docente" },
            rol: 3
        }

        // Llamamos a crearNuevoDocente. 
        // IMPORTANTE: Tendremos que modificar useUsuario para que no sobreescriba estos campos si ya vienen en 'data'
        await crearNuevoDocente(dataToSubmit)

        if (!warningUsuarioExiste) {
            setStatusMessage("Docente registrado exitosamente")
            setTimeout(() => onClose(), 2000)
        } else {
            setIsError(true)
            setStatusMessage(warningUsuarioExiste)
        }
    })

    const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, limit: number) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, limit)
        e.target.value = val
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
                    <h2 className={styles.modalTitle}>Registrar Nuevo Docente (Admin)</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <RiCloseLine size={24} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className={styles.form}>
                    <div className={styles.formGrid}>
                        {/* Datos Personales */}
                        <div className={styles.fullWidth}>
                            <h3 className={styles.label}>Datos Personales</h3>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nombres</label>
                            <input
                                {...register("nombres", { required: "Requerido" })}
                                className={styles.input}
                                placeholder="Ej: Franco"
                            />
                            {errors.nombres && <span className={styles.error}>{errors.nombres.message}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Apellidos</label>
                            <input
                                {...register("apellidos", { required: "Requerido" })}
                                className={styles.input}
                                placeholder="Ej: Condori Huaraya"
                            />
                            {errors.apellidos && <span className={styles.error}>{errors.apellidos.message}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>DNI</label>
                            <input
                                {...register("dni", {
                                    required: "Requerido",
                                    pattern: { value: /^\d{8}$/, message: "8 dígitos" }
                                })}
                                onChange={(e) => {
                                    handleNumericInput(e, 8);
                                    register("dni").onChange(e);
                                }}
                                className={styles.input}
                            />
                            {errors.dni && <span className={styles.error}>{errors.dni.message}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Celular</label>
                            <input
                                {...register("celular", {
                                    pattern: { value: /^\d{9}$/, message: "9 dígitos" }
                                })}
                                onChange={(e) => {
                                    handleNumericInput(e, 9);
                                    register("celular").onChange(e);
                                }}
                                className={styles.input}
                            />
                            {errors.celular && <span className={styles.error}>{errors.celular.message}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Género</label>
                            <select {...register("genero", { required: "Requerido" })} className={styles.select}>
                                {generoOptions.map(gen => (
                                    <option key={gen.id} value={gen.id}>{gen.name.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>

                        {/* Datos Administrativos */}
                        <div className={styles.fullWidth}>
                            <h3 className={styles.label}>Datos Administrativos</h3>
                        </div>

                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label className={styles.label}>DNI del Director (Búsqueda automática)</label>
                            <div className={styles.inputWithIcon}>
                                <input
                                    {...register("dniDirector", {
                                        required: "Requerido",
                                        pattern: { value: /^\d{8}$/, message: "8 dígitos" }
                                    })}
                                    onChange={(e) => {
                                        handleNumericInput(e, 8);
                                        register("dniDirector").onChange(e);
                                    }}
                                    className={styles.input}
                                    placeholder="Ingrese 8 dígitos para auto-completar"
                                    maxLength={8}
                                />
                                {searchingDirector && (
                                    <div className={styles.searchLoader}>
                                        <RiLoader4Line className="animate-spin" size={20} />
                                    </div>
                                )}
                                {!searchingDirector && dniDirector?.length === 8 && !isError && (
                                    <div className={styles.searchSuccess}>
                                        <RiUserSearchLine size={20} color="#10b981" />
                                    </div>
                                )}
                            </div>
                            {errors.dniDirector && <span className={styles.error}>{errors.dniDirector.message}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Región / UGEL</label>
                            <select
                                {...register("region", { required: "Requerido" })}
                                className={styles.select}
                                disabled={directorAsignado}
                            >
                                <option value="">Seleccione UGEL</option>
                                {regiones?.map(reg => (
                                    <option key={reg.codigo} value={reg.codigo}>{reg.region?.toUpperCase()}</option>
                                ))}
                            </select>
                            {errors.region && <span className={styles.error}>{errors.region.message}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Distrito</label>
                            <select
                                {...register("distrito", { required: "Requerido" })}
                                className={styles.select}
                                disabled={!regionSeleccionada || directorAsignado}
                            >
                                <option value="">Seleccione Distrito</option>
                                {distritos.map(dist => (
                                    <option key={dist} value={dist}>{dist.toUpperCase()}</option>
                                ))}
                            </select>
                            {errors.distrito && <span className={styles.error}>{errors.distrito.message}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nombre de la I.E.</label>
                            <input
                                {...register("institucion", { required: "Requerido" })}
                                className={styles.input}
                                placeholder="Nombre del colegio"
                                readOnly={directorAsignado}
                            />
                            {errors.institucion && <span className={styles.error}>{errors.institucion.message}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Área</label>
                            <div className={styles.radioGroup}>
                                {areaOptions.map(a => (
                                    <label key={a.id} className={styles.radioLabel}>
                                        <input
                                            type="radio"
                                            value={a.id}
                                            {...register("area")}
                                            disabled={directorAsignado}
                                        />
                                        {a.name.toUpperCase()}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Asignación Académica */}
                        <div className={styles.fullWidth}>
                            <h3 className={styles.label}>Asignación Académica</h3>
                        </div>

                        <div className={styles.fullWidth}>
                            <label className={styles.label}>Niveles de la Institución</label>
                            <div className={styles.chipGroup}>
                                {nivelInstitucion
                                    .filter(n => n.id !== 0)
                                    .filter(nivel => {
                                        // Si hay director asignado, solo mostrar sus niveles
                                        if (directorAsignado && nivelesDirector.length > 0) {
                                            return nivelesDirector.includes(String(nivel.id))
                                        }
                                        return true
                                    })
                                    .map(nivel => (
                                        <label key={nivel.id} className={styles.chip}>
                                            <input
                                                type="checkbox"
                                                value={String(nivel.id)}
                                                {...register("nivelDeInstitucion", { required: "Seleccione al menos uno" })}
                                                className={styles.chipInput}
                                            />
                                            <span className={styles.chipLabel}>{nivel.name.toUpperCase()}</span>
                                        </label>
                                    ))
                                }
                            </div>
                            {errors.nivelDeInstitucion && <span className={styles.error}>{errors.nivelDeInstitucion.message}</span>}
                        </div>

                        {nivelesSeleccionados.length > 0 && (
                            <div className={styles.fullWidth}>
                                <label className={styles.label}>Grados</label>
                                <div className={styles.chipGroup}>
                                    {gradosDeColegio
                                        .filter(grado => {
                                            if (nivelesSeleccionados.includes("1") && grado.nivel === 1) return true
                                            if (nivelesSeleccionados.includes("2") && grado.nivel === 2) return true
                                            return false
                                        })
                                        .map(grado => (
                                            <label key={grado.id} className={styles.chip}>
                                                <input
                                                    type="checkbox"
                                                    value={String(grado.id)}
                                                    {...register("grados", { required: "Seleccione al menos uno" })}
                                                    className={styles.chipInput}
                                                />
                                                <span className={styles.chipLabel}>{grado.name.toUpperCase()}</span>
                                            </label>
                                        ))
                                    }
                                </div>
                                {errors.grados && <span className={styles.error}>{errors.grados.message}</span>}
                            </div>
                        )}

                        {gradosSeleccionados.length > 0 && (
                            <div className={styles.fullWidth}>
                                <label className={styles.label}>Secciones</label>
                                <div className={styles.chipGroup}>
                                    {sectionByGrade.map(sec => (
                                        <label key={sec.id} className={styles.chip}>
                                            <input
                                                type="checkbox"
                                                value={String(sec.id)}
                                                {...register("secciones", { required: "Seleccione al menos una" })}
                                                className={styles.chipInput}
                                            />
                                            <span className={styles.chipLabel}>{sec.name.toUpperCase()}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.secciones && <span className={styles.error}>{errors.secciones.message}</span>}
                            </div>
                        )}
                    </div>
                </form>

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
                        onClick={onSubmit}
                        disabled={loaderPages}
                        className={`${styles.button} ${styles.submitButton}`}
                    >
                        {loaderPages ? <RiLoader4Line className="animate-spin" /> : 'Registrar Profesor'}
                    </button>
                </div>
            </div>
        </div>,
        container
    )
}

export default AdminDocenteModal
