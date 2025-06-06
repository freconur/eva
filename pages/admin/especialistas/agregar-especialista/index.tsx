import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import useUsuario from '@/features/hooks/useUsuario'
import React, { useEffect, useCallback, use, useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { RiLoader4Line, RiEdit2Line, RiDeleteBin6Line } from 'react-icons/ri'
import styles from './agregarEspecialista.module.css'
import UpdateUsuarioEspecialista from '@/modals/updateUsuarioEspecialista'
import DeleteUsuario from '@/modals/deleteUsuario'
import { genero, tipoEspecialista } from '@/fuctions/regiones'
import UsuariosByRol from '@/components/usuariosByRol'
import TablaUsuarios from '@/components/curricular/tablas/tablaUsuarios'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'
import TablaUsuariosAdminEspecialistas from '@/components/curricular/tablas/tablaUsuariosAdmin'
// Tipos para el formulario
type FormValues = {
  dni: string;
  region: number;
  nombres: string;
  apellidos: string;
  genero: string;
  tipoEspecialista: number;
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
  const { getUserData, createNewEspecialista, getRegiones, getAllEspecialistas } = useUsuario()
  const [idUsuario, setIdUsuario] = useState<string>("")
  const { regiones, loaderPages, allEspecialistas, docentesDeDirectores } = useGlobalContext()
  const [showModalActualizarEspecialista, setShowModalActualizarEspecialista] = useState<boolean>(false)
  const { getUsuariosToAdmin } = useEvaluacionCurricular()
  const [showModalDeleteUsuario, setShowModalDeleteUsuario] = useState<boolean>(false)
  useEffect(() => {
    getUserData()
    getRegiones()
    /* getAllEspecialistas() */
    getUsuariosToAdmin(1)
  }, [])

  const handleDelete = async (dni: string) => {

  }

  const handleEdit = (especialista: any) => {
    // Aquí puedes implementar la lógica para editar
    console.log('Editar especialista:', especialista)
  }
  const handleShowModal = () => {
    setShowModalActualizarEspecialista(!showModalActualizarEspecialista)
  }
  const handleShowModalDelete = () => {
    setShowModalDeleteUsuario(!showModalDeleteUsuario)
  }
  const onSubmit: SubmitHandler<FormValues> = useCallback(async (data) => {
  console.log(data)
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
 /*  console.log('docentesDeDirectores', docentesDeDirectores) */
  return (
    <div className={styles.container}>
      {showModalActualizarEspecialista && <UpdateUsuarioEspecialista idUsuario={idUsuario} handleShowModal={handleShowModal} />}
      {showModalDeleteUsuario && <DeleteUsuario idUsuario={idUsuario} handleShowModalDelete={handleShowModalDelete} />}
      <TablaUsuariosAdminEspecialistas rol={1} docentesDeDirectores={docentesDeDirectores}/>
      <div className={styles.formContainer}>
        <h1 className={styles.title}>
          Registrar Especialista
        </h1>
        <form onSubmit={handleSubmit(onSubmit)}>
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