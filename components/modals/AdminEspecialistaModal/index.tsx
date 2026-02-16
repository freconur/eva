import React, { useEffect, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm, SubmitHandler } from 'react-hook-form'
import { RiCloseLine, RiLoader4Line } from 'react-icons/ri'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import useUsuario from '@/features/hooks/useUsuario'
import { genero, tipoEspecialista, nivelInstitucion } from '@/fuctions/regiones'
import styles from './AdminEspecialistaModal.module.css'

interface Props {
    onClose: () => void;
}

type FormValues = {
    dni: string;
    region: number;
    nombres: string;
    apellidos: string;
    genero: string;
    tipoEspecialista: number;
    nivelDeInstitucion: number[];
}

const FormInput = ({ label, register, errors, name, type = "text", placeholder, validation }: {
    label: string;
    register: any;
    errors: any;
    name: keyof FormValues;
    type?: string;
    placeholder: string;
    validation: any;
}) => (
    <div className={styles.formGroup}>
        <label className={styles.label} htmlFor={name}>{label}:</label>
        <input
            id={name}
            {...register(name, validation)}
            className={styles.input}
            type={type}
            placeholder={placeholder}
        />
        {errors[name] && (
            <span className={styles.error}>{errors[name].message as string}</span>
        )}
    </div>
)

const FormSelect = ({ label, register, errors, name, options }: {
    label: string;
    register: any;
    errors: any;
    name: keyof FormValues;
    options: Array<{ codigo: number; region: string }>;
}) => (
    <div className={styles.formGroup}>
        <label className={styles.label} htmlFor={name}>{label}:</label>
        <select
            id={name}
            {...register(name, { required: { value: true, message: `${label} es requerido` } })}
            className={styles.select}
        >
            <option value="">--{label.toUpperCase()}--</option>
            {options?.map((region) => (
                <option key={region.codigo} value={Number(region.codigo)}>
                    {region.region?.toUpperCase()}
                </option>
            ))}
        </select>
        {errors[name] && (
            <span className={styles.error}>{errors[name].message as string}</span>
        )}
    </div>
)

const FormCheckbox = ({ label, register, errors, name, options }: {
    label: string;
    register: any;
    errors: any;
    name: keyof FormValues;
    options: Array<{ id: number; name: string }>;
}) => (
    <div className={styles.formGroup}>
        <label className={styles.label}>{label}:</label>
        <div className={styles.checkboxContainer}>
            {options?.map((option) => (
                <div key={option.id} className={styles.checkboxItem}>
                    <input
                        type="checkbox"
                        id={`${name}-${option.id}`}
                        value={option.id}
                        disabled={option.name === "inicial"}
                        {...register(name, {
                            setValueAs: (value: string[]) => {
                                return value ? value.map(v => Number(v)) : [];
                            }
                        })}
                        className={styles.checkbox}
                    />
                    <label htmlFor={`${name}-${option.id}`} className={styles.checkboxLabel}>
                        {option.name.charAt(0).toUpperCase() + option.name.slice(1)}
                    </label>
                </div>
            ))}
        </div>
        {errors[name] && (
            <span className={styles.error}>{errors[name].message as string}</span>
        )}
    </div>
)

const AdminEspecialistaModal = ({ onClose }: Props) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>()
    const { createNewEspecialista, getRegiones } = useUsuario()
    const { regiones, loaderPages } = useGlobalContext()

    useEffect(() => {
        getRegiones()
    }, [])

    const onSubmit: SubmitHandler<FormValues> = useCallback(async (data) => {
        const processedData = {
            ...data,
            dni: String(data.dni),
            region: Number(data.region),
            genero: String(data.genero),
            tipoEspecialista: Number(data.tipoEspecialista),
            nivelDeInstitucion: Array.isArray(data.nivelDeInstitucion)
                ? data.nivelDeInstitucion.map(v => Number(v))
                : []
        };

        try {
            await createNewEspecialista({
                ...processedData,
                perfil: { rol: 1, nombre: "especialista" }
            })
            reset()
            onClose() // Close modal after success
        } catch (error) {
            console.error('Error al crear especialista:', error)
        }
    }, [createNewEspecialista, reset, onClose])

    let container;
    if (typeof window !== "undefined") {
        container = document.getElementById("portal-modal");
    }

    if (!container) return null

    return createPortal(
        <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Registrar Nuevo Especialista</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <RiCloseLine size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                    <div className={styles.formGrid}>
                        <FormInput
                            label="Dni"
                            name="dni"
                            register={register}
                            errors={errors}
                            type="number"
                            placeholder="DNI de usuario"
                            validation={{
                                required: { value: true, message: "DNI es requerido" },
                                minLength: { value: 8, message: "DNI debe tener 8 caracteres" },
                                maxLength: { value: 8, message: "DNI debe tener 8 caracteres" },
                            }}
                        />

                        <FormSelect
                            label="Ugel"
                            name="region"
                            register={register}
                            errors={errors}
                            options={regiones?.map(r => ({ codigo: r.codigo || 0, region: r.region || '' })) || []}
                        />

                        <FormInput
                            label="Nombres"
                            name="nombres"
                            register={register}
                            errors={errors}
                            placeholder="Nombre de usuario"
                            validation={{
                                required: { value: true, message: "Nombres son requeridos" },
                                minLength: { value: 2, message: "Nombres deben tener mínimo 2 caracteres" },
                                maxLength: { value: 40, message: "Nombres deben tener máximo 40 caracteres" },
                            }}
                        />

                        <FormInput
                            label="Apellidos"
                            name="apellidos"
                            register={register}
                            errors={errors}
                            placeholder="Apellido de usuario"
                            validation={{
                                required: { value: true, message: "Apellidos son requeridos" },
                                minLength: { value: 2, message: "Apellidos deben tener mínimo 2 caracteres" },
                                maxLength: { value: 40, message: "Apellidos deben tener máximo 40 caracteres" },
                            }}
                        />

                        <FormSelect
                            label="Género"
                            name="genero"
                            register={register}
                            errors={errors}
                            options={genero?.map(g => ({ codigo: g.id, region: g.name })) || []}
                        />

                        <FormSelect
                            label="Tipo de Especialista"
                            name="tipoEspecialista"
                            register={register}
                            errors={errors}
                            options={tipoEspecialista?.map(t => ({ codigo: t.id, region: t.name })) || []}
                        />

                        <div className={styles.fullWidth}>
                            <FormCheckbox
                                label="Nivel"
                                name="nivelDeInstitucion"
                                register={register}
                                errors={errors}
                                options={nivelInstitucion}
                            />
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button type="button" onClick={onClose} className={`${styles.button} ${styles.cancelButton}`}>
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loaderPages}
                            className={`${styles.button} ${styles.submitButton}`}
                        >
                            {loaderPages ? <RiLoader4Line className={styles.loaderIcon} /> : 'Registrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        container
    )
}

export default AdminEspecialistaModal
