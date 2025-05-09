import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import useUsuario from '@/features/hooks/useUsuario'
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { RiLoader4Line } from 'react-icons/ri'
import { gradosDeColegio, sectionByGrade, genero } from '@/fuctions/regiones'
import styles from './styles.module.css'
import { useDirectores } from '@/features/hooks/useDirectores'
import UsuariosByRol from '@/components/usuariosByRol'
import { User } from '@/features/types/types'

interface FormData {
  nombres: string;
  apellidos: string;
  dni: string;
  grados: number[];
  secciones: number[];
  genero: string;
}

const AgregarDirectores = () => {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>()
  const { getUserData, crearNuevoDocente } = useUsuario()
  const { currentUserData, loaderPages, warningUsuarioExiste, usuariosByRol } = useGlobalContext()

  useEffect(() => {
    getUserData()
  }, [currentUserData.dni])

  const handleAgregarDirector = handleSubmit((data) => {
    const dataConvertida = {
      ...data,
      grados: data.grados.map(grado => Number(grado)),
      secciones: data.secciones.map(seccion => Number(seccion))
    }
    console.log("data", dataConvertida)
    crearNuevoDocente({ 
      ...dataConvertida,
      perfil: { rol: 3, nombre: "docente" } 
    })
    reset()
  })
const { getDocentesByDniDirector, gettAllProfesores, fixedgrado } = useDirectores()
  useEffect(() => {
    getDocentesByDniDirector(`${currentUserData.dni}`)
  },[currentUserData.dni])

  /* const handleAllProfesores = () => {
    gettAllProfesores()
  }
  const handleFixedGrado = () => {00290190
    fixedgrado(usuariosByRol)
  } */
  console.log("usuariosByRol", usuariosByRol)
  return (
    <div className={styles.container}>
      {/* <div 
      className='p-3 cursor-pointer h-[60px] bg-blue-400 text-white rounded-md' onClick={handleAllProfesores}
      >Agregar todos los profesores</div>
      <div 
      className='p-3 cursor-pointer h-[60px] bg-blue-400 text-white rounded-md' onClick={handleFixedGrado}
      >fixed</div> */}
      <UsuariosByRol  usuariosByRol={usuariosByRol}/>
      <div className={styles.formContainer}>
        {loaderPages ? (
          <div className={styles.loaderContainer}>
            <div className={styles.loader}>
              <RiLoader4Line className="animate-spin text-3xl" />
              <span className={styles.loaderText}>...creando usuario docente</span>
            </div>
          </div>
        ) : (
          <>
            <h1 className={styles.title}>
              Registrar Profesor
            </h1>
            <form onSubmit={handleAgregarDirector} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Nombres del docente:
                </label>
                <input
                  {...register("nombres", {
                    required: { value: true, message: "Los nombres son requeridos" },
                    minLength: { value: 2, message: "El nombre debe tener un mínimo de 2 caracteres" },
                    maxLength: { value: 100, message: "El nombre debe tener un máximo de 100 caracteres" },
                    pattern: { value: /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/, message: "Solo se permiten letras y espacios" }
                  })}
                  className={styles.input}
                  type="text"
                  placeholder="Ingrese los nombres del docente"
                />
                {errors.nombres && (
                  <span className={styles.error}>{errors.nombres.message}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Apellidos del docente:
                </label>
                <input
                  {...register("apellidos", {
                    required: { value: true, message: "Los apellidos son requeridos" },
                    minLength: { value: 3, message: "Los apellidos deben tener un mínimo de 3 caracteres" },
                    maxLength: { value: 40, message: "Los apellidos deben tener un máximo de 40 caracteres" },
                    pattern: { value: /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/, message: "Solo se permiten letras y espacios" }
                  })}
                  className={styles.input}
                  type="text"
                  placeholder="Ingrese los apellidos del docente"
                />
                {errors.apellidos && (
                  <span className={styles.error}>{errors.apellidos.message}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  DNI:
                </label>
                <input
                  {...register("dni", {
                    required: { value: true, message: "El DNI es requerido" },
                    minLength: { value: 8, message: "El DNI debe tener 8 caracteres" },
                    maxLength: { value: 8, message: "El DNI debe tener 8 caracteres" },
                    pattern: { value: /^[0-9]+$/, message: "Solo se permiten números" }
                  })}
                  className={styles.input}
                  type="text"
                  placeholder="Ingrese el DNI del docente"
                />
                {errors.dni && (
                  <span className={styles.error}>{errors.dni.message}</span>
                )}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formColumn}>
                  <label className={styles.label}>
                    Grado:
                  </label>
                  <div className={styles.checkboxGroup}>
                    {gradosDeColegio.map((grado) => (
                      <div key={grado.id} className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          id={`grado-${grado.id}`}
                          value={Number(grado.id)}
                          {...register("grados", { 
                            required: { value: true, message: "El grado es requerido" }
                          })}
                          className={styles.checkbox}
                        />
                        <label htmlFor={`grado-${grado.id}`} className={styles.checkboxLabel}>
                          {grado.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.grados && (
                    <span className={styles.error}>{errors.grados.message}</span>
                  )}
                </div>

                <div className={styles.formColumn}>
                  <label className={styles.label}>
                    Sección:
                  </label>
                  <div className={styles.checkboxGroup}>
                    {sectionByGrade.map((seccion) => (
                      <div key={seccion.id} className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          id={`seccion-${seccion.id}`}
                          value={Number(seccion.id)}
                          {...register("secciones", { 
                            required: { value: true, message: "La sección es requerida" }
                          })}
                          className={styles.checkbox}
                        />
                        <label htmlFor={`seccion-${seccion.id}`} className={styles.checkboxLabel}>
                          {seccion.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.secciones && (
                    <span className={styles.error}>{errors.secciones.message}</span>
                  )}
                </div>

                <div className={styles.formColumn}>
                  <label className={styles.label}>
                    Género:
                  </label>
                  <select
                    {...register("genero", { 
                      required: { value: true, message: "El género es requerido" }
                    })}
                    className={styles.select}
                  >
                    <option value="">Seleccione género</option>
                    {genero.map((gen) => (
                      <option key={gen.id} value={gen.id}>
                        {gen.name}
                      </option>
                    ))}
                  </select>
                  {errors.genero && (
                    <span className={styles.error}>{errors.genero.message}</span>
                  )}
                </div>
              </div>

              {warningUsuarioExiste?.length > 0 && (
                <div className={styles.warning}>
                  <p>{warningUsuarioExiste}</p>
                </div>
              )}

              <button 
                type="submit"
                className={styles.button}
              >
                Registrar
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default AgregarDirectores
AgregarDirectores.Auth = PrivateRouteDirectores