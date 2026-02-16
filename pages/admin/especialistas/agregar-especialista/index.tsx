import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import useUsuario from '@/features/hooks/useUsuario'
import React, { useEffect, useCallback, useState } from 'react'
import { RiLoader4Line, RiAddLine } from 'react-icons/ri'
import styles from './agregarEspecialista.module.css'
import UpdateUsuarioEspecialista from '@/modals/updateUsuarioEspecialista'
import DeleteUsuario from '@/modals/deleteUsuario'
import AdminEspecialistaModal from '@/components/modals/AdminEspecialistaModal'
import { genero, tipoEspecialista } from '@/fuctions/regiones'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'
import TablaUsuariosAdminEspecialistas from '@/components/curricular/tablas/tablaUsuariosAdmin'
import { nivelInstitucion } from '@/fuctions/regiones'
// Tipos para el formulario
type FormValues = {
  dni: string;
  region: number;
  nombres: string;
  apellidos: string;
  genero: string;
  tipoEspecialista: number;
  nivelDeInstitucion: number[];
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

// Componente de Checkbox reutilizable para niveles de institución
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
                // Convertir los valores string a números
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

const AgregareEspecialista = () => {
  const { getUserData, getRegiones } = useUsuario()
  const [idUsuario, setIdUsuario] = useState<string>("")
  const { loaderPages, docentesDeDirectores, currentUserData } = useGlobalContext()
  const [showModalActualizarEspecialista, setShowModalActualizarEspecialista] = useState<boolean>(false)
  const { getUsuariosToAdmin } = useEvaluacionCurricular()
  const [showModalDeleteUsuario, setShowModalDeleteUsuario] = useState<boolean>(false)
  const [showModalCrearEspecialista, setShowModalCrearEspecialista] = useState<boolean>(false)

  useEffect(() => {
    getUserData()
    getRegiones()
    /* getAllEspecialistas() */
    getUsuariosToAdmin(Number(currentUserData.rol))
  }, [])

  const handleShowModal = () => {
    setShowModalActualizarEspecialista(!showModalActualizarEspecialista)
  }
  const handleShowModalDelete = () => {
    setShowModalDeleteUsuario(!showModalDeleteUsuario)
  }

  const handleShowModalCrear = () => {
    setShowModalCrearEspecialista(!showModalCrearEspecialista)
  }

  if (loaderPages) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.loaderContent}>
          <RiLoader4Line className={styles.loaderIcon} />
          <span className={styles.loaderText}>...cargando</span>
        </div>
      </div>
    )
  }
  console.log('docentesDeDirectores', docentesDeDirectores)
  return (
    <div className={styles.container}>
      {showModalActualizarEspecialista && <UpdateUsuarioEspecialista idUsuario={idUsuario} handleShowModal={handleShowModal} />}
      {showModalDeleteUsuario && <DeleteUsuario idUsuario={idUsuario} handleShowModalDelete={handleShowModalDelete} />}
      {showModalCrearEspecialista && <AdminEspecialistaModal onClose={handleShowModalCrear} />}

      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.pageTitle}>Especialistas</h1>
          <p className={styles.pageSubtitle}>Administra y registra a los especialistas de la institución</p>
        </div>
        <button onClick={handleShowModalCrear} className={styles.addBtn}>
          <RiAddLine size={20} />
          <span>Registrar Especialista</span>
        </button>
      </div>

      <div className={styles.mainContent}>
        <TablaUsuariosAdminEspecialistas rol={1} docentesDeDirectores={docentesDeDirectores} />
      </div>
    </div>
  )
}

export default AgregareEspecialista
AgregareEspecialista.Auth = PrivateRouteAdmins