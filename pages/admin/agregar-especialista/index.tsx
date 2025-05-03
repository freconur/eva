import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import useUsuario from '@/features/hooks/useUsuario'
import React, { useEffect, useCallback } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { RiLoader4Line } from 'react-icons/ri'
import styles from '@/styles/modules/AgregarEspecialista.module.css'

// Tipos para el formulario
type FormValues = {
  dni: string;
  region: number;
  nombres: string;
  apellidos: string;
}

// Componente de Input reutilizable
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

// Componente de Select reutilizable
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

const AgregareEspecialista = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>()
  const { getUserData, createNewEspecialista, getRegiones } = useUsuario()
  const { currentUserData, regiones, loaderPages } = useGlobalContext()

  useEffect(() => {
    getUserData()
    getRegiones()
  }, [getUserData, getRegiones])

  const onSubmit: SubmitHandler<FormValues> = useCallback(async (data) => {
    try {
      createNewEspecialista({ 
        ...data, 
        perfil: { rol: 1, nombre: "especialista" } 
      })
      reset()
    } catch (error) {
      console.error('Error al crear especialista:', error)
    }
  }, [createNewEspecialista, reset])

  if (loaderPages) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.loaderContent}>
          <RiLoader4Line className={styles.loaderIcon} />
          <span className={styles.loaderText}>...creando usuario especialista</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h1 className={styles.title}>
          Registrar Especialista
        </h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormInput
            label="DNI"
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
            label="Región"
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

          <button
            type="submit"
            className={styles.submitButton}
          >
            Registrar
          </button>
        </form>
      </div>
    </div>
  )
}

export default AgregareEspecialista
AgregareEspecialista.Auth = PrivateRouteAdmins