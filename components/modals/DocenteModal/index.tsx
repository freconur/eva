import React, { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { RiCloseLine, RiLoader4Line, RiFileExcel2Line } from 'react-icons/ri'
import { AsignacionGradoSeccion, User } from '@/features/types/types'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import useUsuario from '@/features/hooks/useUsuario'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'
import { useOptions } from '@/features/hooks/useOptions'
import { sectionByGrade, genero as generoOptions, nivelInstitucion, genero, gradosDeColegio } from '@/fuctions/regiones'
import styles from './DocenteModal.module.css'
import { read, utils } from 'xlsx'

interface Props {
    dataDocente?: User;
    onClose: () => void;
}

interface FormData extends Omit<User, 'nivelDeInstitucion' | 'grados' | 'secciones' | 'caracteristicaCurricular' | 'asignaciones'> {
    nivelDeInstitucion?: string[];
    grados?: string[];
    secciones?: string[];
    caracteristicaCurricular?: string;
    asignaciones?: { gradoId: string; secciones: string[] }[];
}

const DocenteModal = ({ dataDocente, onClose }: Props) => {
    const isEdit = !!dataDocente
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            nivelDeInstitucion: [],
            grados: [],
            secciones: [],
            asignaciones: []
        }
    })

    const watchNiveles = watch("nivelDeInstitucion");
    const nivelesSeleccionados = useMemo(() => watchNiveles || [], [watchNiveles]);

    const watchGrados = watch("grados");
    const gradosSeleccionados = useMemo(() => watchGrados || [], [watchGrados]);

    const watchAsignaciones = watch("asignaciones");
    const asignaciones = useMemo(() => watchAsignaciones || [], [watchAsignaciones]);

    const { currentUserData, loaderPages, warningUsuarioExiste } = useGlobalContext()
    const { crearNuevoDocente, createMassiveTeachers } = useUsuario()
    const { updateDocenteParaCoberturaCurricular } = useEvaluacionCurricular()
    const { getCaracteristicaCurricular, caracteristicaCurricular } = useOptions()

    const [activeTab, setActiveTab] = useState<'individual' | 'masivo'>('individual')
    const [excelData, setExcelData] = useState<any[]>([])
    const [fileName, setFileName] = useState<string>('')
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [isError, setIsError] = useState<boolean>(false)

    useEffect(() => {
        const unsubscribe = getCaracteristicaCurricular()
        return () => {
            if (typeof unsubscribe === 'function') unsubscribe()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        register("nivelDeInstitucion", {
            validate: (value) => (value && value.length > 0) || "Seleccione al menos uno"
        });
        register("grados", {
            validate: (value) => {
                if (nivelesSeleccionados.length > 0) {
                    return (value && value.length > 0) || "Seleccione al menos uno";
                }
                return true;
            }
        });
        register("secciones");
        register("asignaciones");
    }, [register, nivelesSeleccionados]);

    const handleNivelToggle = (nivelId: string, checked: boolean) => {
        const nivelIdStr = String(nivelId);
        let newNiveles: string[];
        if (checked) {
            newNiveles = [...nivelesSeleccionados, nivelIdStr];
        } else {
            newNiveles = nivelesSeleccionados.filter(n => n !== nivelIdStr);
        }
        setValue("nivelDeInstitucion", newNiveles, { shouldValidate: true, shouldDirty: true });

        // Filtrar los grados que pertenezcan a los niveles actualmente seleccionados
        const newGrados = gradosSeleccionados.filter(gradoId => {
            const gradoObj = gradosDeColegio.find(g => String(g.id) === String(gradoId));
            if (!gradoObj) return false;
            return newNiveles.includes(String(gradoObj.nivel));
        });

        // Filtrar asignaciones y recalcular secciones planas
        const newAsignaciones = asignaciones.filter(a => newGrados.includes(String(a.gradoId)));
        const newSecciones = Array.from(new Set(newAsignaciones.flatMap(a => a.secciones)));

        setValue("grados", newGrados, { shouldValidate: true, shouldDirty: true });
        setValue("asignaciones", newAsignaciones, { shouldValidate: true, shouldDirty: true });
        setValue("secciones", newSecciones, { shouldValidate: true, shouldDirty: true });
    };

    const handleGradoToggle = (gradoId: string, checked: boolean) => {
        const gradoIdStr = String(gradoId);
        let newGrados: string[];
        let newAsignaciones = [...asignaciones];

        if (checked) {
            newGrados = [...gradosSeleccionados, gradoIdStr];
            if (!newAsignaciones.some(a => String(a.gradoId) === gradoIdStr)) {
                newAsignaciones.push({ gradoId: gradoIdStr, secciones: [] });
            }
        } else {
            newGrados = gradosSeleccionados.filter(g => String(g) !== gradoIdStr);
            // Quitar completamente de asignaciones
            newAsignaciones = newAsignaciones.filter(a => String(a.gradoId) !== gradoIdStr);
        }

        // Actualizar también la lista plana de secciones con solo las secciones de los grados activos
        const newSecciones = Array.from(new Set(
            newAsignaciones.flatMap(a => a.secciones)
        ));

        setValue("grados", newGrados, { shouldValidate: true, shouldDirty: true });
        setValue("asignaciones", newAsignaciones, { shouldValidate: true, shouldDirty: true });
        setValue("secciones", newSecciones, { shouldValidate: true, shouldDirty: true });
    };

    useEffect(() => {
        if (isEdit && dataDocente && caracteristicaCurricular.length > 0) {
            const currentValue = String(dataDocente.caracteristicaCurricular || '').trim();
            // Check if value exists in options and re-apply to ensure selection
            const exists = caracteristicaCurricular.some(opt => opt.id === currentValue);

            if (exists) {
                setValue('caracteristicaCurricular', currentValue);
            }
        }
    }, [caracteristicaCurricular, dataDocente, isEdit, setValue])

    useEffect(() => {
        if (isEdit && dataDocente) {

            // Ensure array and convert to strings
            const nivelArray = Array.isArray(dataDocente.nivelDeInstitucion)
                ? dataDocente.nivelDeInstitucion
                : (dataDocente.nivelDeInstitucion
                    ? [dataDocente.nivelDeInstitucion]
                    : (dataDocente.nivel ? [dataDocente.nivel] : []));

            const nivelesComoString = nivelArray.map(n => String(n));
            const docenteGrados = Array.isArray(dataDocente.grados) ? dataDocente.grados.map(g => String(g)) : [];

            // Sanitizar asignaciones para que solo contenga los grados válidos del docente
            let initialAsignaciones: { gradoId: string; secciones: string[] }[] = [];
            if (Array.isArray(dataDocente.asignaciones)) {
                initialAsignaciones = dataDocente.asignaciones
                    .filter(a => docenteGrados.includes(String(a.gradoId)))
                    .map(a => ({
                        gradoId: String(a.gradoId),
                        secciones: Array.isArray(a.secciones) ? a.secciones.map(s => String(s)) : []
                    }));
            } else if (docenteGrados.length > 0) {
                const initialFlatSecciones = Array.isArray(dataDocente.secciones) ? dataDocente.secciones.map(s => String(s)) : [];
                initialAsignaciones = docenteGrados.map(g => ({
                    gradoId: String(g),
                    secciones: initialFlatSecciones
                }));
            }

            // Calcular secciones planas limpias a partir de asignaciones (o fallback)
            const initialSecciones = initialAsignaciones.length > 0
                ? Array.from(new Set(initialAsignaciones.flatMap(a => a.secciones)))
                : (Array.isArray(dataDocente.secciones) ? dataDocente.secciones.map(s => String(s)) : []);

            // Reset with explicit values
            reset({
                ...dataDocente,
                nombres: dataDocente.nombres || '',
                apellidos: dataDocente.apellidos || '',
                dni: dataDocente.dni || '',
                celular: dataDocente.celular || '',
                genero: dataDocente.genero || '',
                caracteristicaCurricular: dataDocente.caracteristicaCurricular ? String(dataDocente.caracteristicaCurricular).trim() : '',
                nivelDeInstitucion: nivelesComoString,
                grados: docenteGrados,
                secciones: initialSecciones,
                asignaciones: initialAsignaciones
            })
        } else {
            const initialNiveles = (currentUserData.nivelDeInstitucion && currentUserData.nivelDeInstitucion.length === 1)
                ? [String(currentUserData.nivelDeInstitucion[0])]
                : [];

            reset({
                nivelDeInstitucion: initialNiveles,
                grados: [],
                secciones: [],
                asignaciones: []
            })
        }
    }, [dataDocente, reset, isEdit, currentUserData.nivelDeInstitucion])

    const onSubmit = handleSubmit(async (data) => {
        setStatusMessage(null)
        setIsError(false)

        const selectedGradosStr = (data.grados || []).map(g => String(g));

        // Filtrar asignaciones asegurando que pertenezcan ÚNICAMENTE a los grados seleccionados
        const cleanAsignaciones = (data.asignaciones || [])
            .filter(a => selectedGradosStr.includes(String(a.gradoId)))
            .map(a => ({
                gradoId: Number(a.gradoId),
                secciones: (a.secciones || []).map(s => Number(s))
            }));

        // Secciones planas derivadas exclusivamente de las asignaciones activas
        const cleanSecciones = Array.from(new Set(
            cleanAsignaciones.flatMap(a => a.secciones)
        ));

        const dataToSubmit: User = {
            ...data,
            area: currentUserData.area,
            distrito: currentUserData.distrito,
            grados: (data.grados || []).map(g => Number(g)),
            secciones: cleanSecciones,
            asignaciones: cleanAsignaciones,
            nivel: (data.nivelDeInstitucion && data.nivelDeInstitucion.length > 0)
                ? Number(data.nivelDeInstitucion[0])
                : undefined,
            nivelDeInstitucion: (data.nivelDeInstitucion || []).map(n => Number(n)),
            perfil: { rol: 3, nombre: "docente" }
        }

        if (isEdit && dataDocente) {
            await updateDocenteParaCoberturaCurricular(`${dataDocente.dni}`, dataToSubmit, dataDocente);
            onClose();
        } else {
            await crearNuevoDocente(dataToSubmit);
            // Si hay error en warningUsuarioExiste se manejará por contexto global, 
            // pero para carga individual cerramos si todo va bien.
            if (!warningUsuarioExiste) {
                setStatusMessage("Profesor registrado exitosamente")
                setTimeout(() => onClose(), 2000)
            } else {
                setIsError(true)
                setStatusMessage(warningUsuarioExiste)
            }
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

    const mapExcelDataToDocente = (row: any) => {
        const normalizedRow = Object.keys(row).reduce((acc: any, key) => {
            acc[key.toLowerCase().trim()] = row[key]
            return acc
        }, {})

        const findIdByName = (arr: any[], name: string) => {
            const item = arr?.find(i => i.name.toLowerCase() === name?.toString().toLowerCase())
            return item ? item.id : null
        }

        // Parseo de Asignaciones Jerárquicas (Ej: "1:A,B; 2:A")
        const asignacionesRaw = String(normalizedRow['asignaciones'] || '').trim()
        const asignaciones: AsignacionGradoSeccion[] = []
        const gradosPlanos = new Set<number>()
        const seccionesPlanos = new Set<number>()

        if (asignacionesRaw) {
            const bloques = asignacionesRaw.split(';')
            bloques.forEach(bloque => {
                const [gradoIdStr, seccionesStr] = bloque.split(':')
                const gradoId = Number(gradoIdStr?.trim())

                if (!isNaN(gradoId) && seccionesStr) {
                    const letrasSecciones = seccionesStr.split(',').map(s => s.trim().toLowerCase())
                    const idsSecciones: number[] = []

                    letrasSecciones.forEach(letra => {
                        const seccionObj = sectionByGrade.find(s => s.name.toLowerCase() === letra)
                        if (seccionObj) {
                            idsSecciones.push(seccionObj.id)
                            seccionesPlanos.add(seccionObj.id)
                        }
                    })

                    if (idsSecciones.length > 0) {
                        asignaciones.push({
                            gradoId,
                            secciones: idsSecciones
                        })
                        gradosPlanos.add(gradoId)
                    }
                }
            })
        }

        return {
            dni: String(normalizedRow['dni'] || '').trim(),
            nombres: String(normalizedRow['nombres'] || '').trim(),
            apellidos: String(normalizedRow['apellidos'] || '').trim(),
            genero: findIdByName(genero, normalizedRow['genero'])?.toString() || "1",
            grados: Array.from(gradosPlanos),
            secciones: Array.from(seccionesPlanos),
            asignaciones: asignaciones,
            perfil: { rol: 3, nombre: "docente" }
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

        if (excelData.length > 500) {
            setIsError(true)
            setStatusMessage("El archivo excede el límite de 500 registros")
            return
        }

        const docentesParsed = excelData.map(mapExcelDataToDocente)
        const errores: string[] = []

        docentesParsed.forEach((d, index) => {
            const rowNum = index + 2
            if (!d.dni || d.dni.length !== 8 || isNaN(Number(d.dni))) {
                errores.push(`Fila ${rowNum}: DNI inválido (debe ser 8 dígitos numéricos)`)
            }
            if (!d.nombres) errores.push(`Fila ${rowNum}: Falta nombres`)
            if (!d.apellidos) errores.push(`Fila ${rowNum}: Falta apellidos`)
        })

        if (errores.length > 0) {
            setIsError(true)
            setStatusMessage(`Errores de validación:\n${errores.slice(0, 5).join('\n')}${errores.length > 5 ? `\n... y ${errores.length - 5} más` : ''}`)
            return
        }

        const dataComun = {
            institucion: currentUserData.institucion,
            region: currentUserData.region,
            dniDirector: currentUserData.dni,
            area: currentUserData.area,
            distrito: currentUserData.distrito
        }

        const result = await createMassiveTeachers(docentesParsed, dataComun)

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

    // Portal setup
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
                        {isEdit ? 'Actualizar Datos del Docente' : 'Registrar Nuevo Profesor'}
                    </h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <RiCloseLine size={24} />
                    </button>
                </div>

                {!isEdit && (
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${activeTab === 'individual' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('individual')}
                        >
                            Registro Individual
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'masivo' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('masivo')}
                        >
                            Carga Masiva
                        </button>
                    </div>
                )}

                {activeTab === 'individual' ? (
                    <form onSubmit={onSubmit} className={styles.form}>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nombres</label>
                                <input
                                    {...register("nombres", { required: "Campo requerido" })}
                                    className={styles.input}
                                    placeholder="Ej: Juan Antonio"
                                />
                                {errors.nombres && <span className={styles.error}>{errors.nombres.message}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Apellidos</label>
                                <input
                                    {...register("apellidos", { required: "Campo requerido" })}
                                    className={styles.input}
                                    placeholder="Ej: Pérez García"
                                />
                                {errors.apellidos && <span className={styles.error}>{errors.apellidos.message}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>DNI</label>
                                <input
                                    {...register("dni", {
                                        required: "Campo requerido",
                                        pattern: { value: /^[0-9]{8}$/, message: "8 dígitos" }
                                    })}
                                    disabled={isEdit}
                                    className={styles.input}
                                    placeholder="8 dígitos"
                                    maxLength={8}
                                />
                                {errors.dni && <span className={styles.error}>{errors.dni.message}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Celular</label>
                                <input
                                    {...register("celular")}
                                    className={styles.input}
                                    placeholder="9 dígitos"
                                    type="tel"
                                    maxLength={9}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Género</label>
                                <select {...register("genero", { required: "Requerido" })} className={styles.select}>
                                    <option value="">Seleccione género</option>
                                    {generoOptions.map(gen => <option key={gen.id} value={gen.id}>{gen.name}</option>)}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nivel de Institución</label>
                                <div className={styles.chipGroup}>
                                    {nivelInstitucion
                                        .filter(nivel => currentUserData.nivelDeInstitucion?.includes(nivel.id))
                                        .map(nivel => (
                                            <label key={nivel.id} className={styles.chip}>
                                                <input
                                                    type="checkbox"
                                                    value={String(nivel.id)}
                                                    checked={nivelesSeleccionados.includes(String(nivel.id))}
                                                    onChange={(e) => handleNivelToggle(String(nivel.id), e.target.checked)}
                                                    className={styles.chipInput}
                                                />
                                                <span className={styles.chipLabel}>{nivel.name.charAt(0).toUpperCase() + nivel.name.slice(1)}</span>
                                            </label>
                                        ))}
                                </div>
                                {errors.nivelDeInstitucion && <span className={styles.error}>{errors.nivelDeInstitucion.message}</span>}
                            </div>

                            <div className={`${styles.fullWidth} ${styles.gradosAsignadosGroup}`}>
                                <h3 className={styles.gradosTitle}>Grados Asignados</h3>
                                <div className={styles.chipGroup}>
                                    {gradosDeColegio
                                        .filter((grado) => {
                                            if (nivelesSeleccionados.includes("0") && grado.nivel === 0) return true;
                                            if (nivelesSeleccionados.includes("1") && grado.nivel === 1) return true;
                                            if (nivelesSeleccionados.includes("2") && grado.nivel === 2) return true;
                                            return false;
                                        })
                                        .map((grado) => (
                                            <label key={grado.id} className={styles.chip}>
                                                <input
                                                    type="checkbox"
                                                    value={String(grado.id)}
                                                    checked={gradosSeleccionados.includes(String(grado.id))}
                                                    onChange={(e) => handleGradoToggle(String(grado.id), e.target.checked)}
                                                    className={styles.chipInput}
                                                />
                                                <span className={styles.chipLabel}>{grado.name}</span>
                                            </label>
                                        ))}
                                </div>
                                {errors.grados && <span className={styles.error}>{errors.grados.message}</span>}
                            </div>

                            <div className={`${styles.fullWidth}`}>
                                <h3 className={styles.sectionSubtitle}>Asignación de Secciones por Grado</h3>
                                <div className={styles.asignacionesContainer}>
                                    {gradosSeleccionados.map((gradoId) => {
                                        const gradoObj = gradosDeColegio.find(g => String(g.id) === gradoId);
                                        if (!gradoObj) return null;

                                        const asignacionActual = asignaciones.find(a => String(a.gradoId) === String(gradoId));
                                        const seccionesParaEsteGrado = asignacionActual?.secciones || [];

                                        return (
                                            <div key={gradoId} className={styles.gradoAsignacionCard}>
                                                <div className={styles.gradoHeader}>
                                                    <span className={styles.gradoBadge}>{gradoObj.name}</span>
                                                </div>
                                                <div className={styles.chipGroup}>
                                                    {sectionByGrade.map((seccion) => {
                                                        const isChecked = seccionesParaEsteGrado.includes(String(seccion.id));

                                                        return (
                                                            <label key={seccion.id} className={styles.chip}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={(e) => {
                                                                        const checked = e.target.checked;
                                                                        const seccionIdStr = String(seccion.id);
                                                                        const gradoIdStr = String(gradoId);

                                                                        const newSecciones = checked
                                                                            ? [...seccionesParaEsteGrado, seccionIdStr]
                                                                            : seccionesParaEsteGrado.filter(id => id !== seccionIdStr);

                                                                        let nuevasAsignaciones: { gradoId: string; secciones: string[] }[];
                                                                        const exists = asignaciones.some(a => String(a.gradoId) === gradoIdStr);

                                                                        if (exists) {
                                                                            nuevasAsignaciones = asignaciones.map(a =>
                                                                                String(a.gradoId) === gradoIdStr
                                                                                    ? { ...a, secciones: newSecciones }
                                                                                    : a
                                                                            );
                                                                        } else {
                                                                            nuevasAsignaciones = [
                                                                                ...asignaciones,
                                                                                { gradoId: gradoIdStr, secciones: newSecciones }
                                                                            ];
                                                                        }

                                                                        // Filtrar asignaciones asegurando que solo contengan los grados seleccionados
                                                                        nuevasAsignaciones = nuevasAsignaciones.filter(a =>
                                                                            gradosSeleccionados.includes(String(a.gradoId))
                                                                        );

                                                                        setValue("asignaciones", nuevasAsignaciones, { shouldValidate: true, shouldDirty: true });

                                                                        // Actualizar también el campo plano 'secciones' para compatibilidad
                                                                        const todasLasSeccionesPlanos = Array.from(new Set(
                                                                            nuevasAsignaciones.flatMap(a => a.secciones)
                                                                        ));
                                                                        setValue("secciones", todasLasSeccionesPlanos, { shouldValidate: true, shouldDirty: true });
                                                                    }}
                                                                    className={styles.chipInput}
                                                                />
                                                                <span className={styles.chipLabel}>{seccion.name}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {errors.secciones && <span className={styles.error}>{errors.secciones.message}</span>}
                            </div>
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
                                <li><strong>DNI</strong>: 8 dígitos numéricos</li>
                                <li><strong>NOMBRES</strong>: Nombres del profesor</li>
                                <li><strong>APELLIDOS</strong>: Apellidos del profesor</li>
                                <li><strong>GENERO</strong>: masculino / femenino</li>
                                <li><strong>ASIGNACIONES</strong>: Formato &quot;GradoID:Seccion1,Seccion2; ...&quot; (Ej: 9:a,b; 10:a)</li>
                            </ul>
                            <p className={styles.warning}>* Los datos de la institución se heredarán automáticamente del director.</p>
                            <p className={styles.warning}>* Máximo 500 profesores por archivo.</p>
                        </div>
                    </div>
                )}

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
                        onClick={activeTab === 'individual' ? onSubmit : handleMassiveSubmit}
                        disabled={loaderPages}
                        className={`${styles.button} ${styles.submitButton}`}
                    >
                        {loaderPages ? <RiLoader4Line className="animate-spin" /> : (activeTab === 'masivo' ? 'Procesar Excel' : (isEdit ? 'Guardar Cambios' : 'Registrar Profesor'))}
                    </button>
                </div>
            </div >
        </div >,
        container
    )
}

export default DocenteModal
