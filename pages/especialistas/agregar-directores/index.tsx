import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import useUsuario from '@/features/hooks/useUsuario'
import DeleteUsuario from '@/modals/deleteUsuario'
import UpdateUsuarioDirector from '@/modals/updateUsuarioDirector'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiLoader4Line } from 'react-icons/ri'
import { ToastContainer } from 'react-toastify';
import { rolDirectivo, genero,caracteristicasDirectivo } from '@/fuctions/regiones'
import {distritosPuno} from '@/fuctions/provinciasPuno'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'
import TablaDirectores from '@/components/curricular/tablas/tablaDirectores'
import { nivelInstitucion } from '@/fuctions/regiones'
import styles from './agregar-directores.module.css'
const AgregarDirectores = () => {

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
  const { getUserData, createNewDirector, getRegiones, getUsersDirectores } = useUsuario()
  const { currentUserData, regiones, loaderPages, usuariosDirectores, warningUsuarioExiste, dataDirector, warningUsuarioNoEncontrado, docentesDeDirectores } = useGlobalContext()
  const {  getDocentesFromDirectores, getDirectoresTabla} = useEvaluacionCurricular()
  const [showModal, setShowModal] = useState<boolean>(false)
  const [idUsuario, setIdUsuario] = useState<string>("")
  const [showDeleteUsuario, setShowDeleteUsuario] = useState<boolean>(false)
  const [distritos, setDistritos] = useState<string[]>([])
  const [nivelesSeleccionados, setNivelesSeleccionados] = useState<number[]>([])

  const regionSeleccionada = watch("region")

  useEffect(() => {
    getUserData()
    getRegiones()
    currentUserData.dni &&
    getDirectoresTabla(currentUserData)
    /* getUsersDirectores() */
  }, [currentUserData.dni])

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
    // Solo permitir números
    const numericValue = value.replace(/[^0-9]/g, '')
    // Limitar a 8 dígitos
    const limitedValue = numericValue.slice(0, 8)
    e.target.value = limitedValue
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Solo normalizar espacios múltiples, pero permitir espacios entre palabras
    const cleanedValue = value.replace(/\s+/g, ' ')
    e.target.value = cleanedValue
  }

  const handleAgregarDirector = handleSubmit(data => {
    if (nivelesSeleccionados.length === 0) {
      return // No enviar si no hay niveles seleccionados
    }
    console.log("data", { 
      ...data, 
      nivelDeInstitucion: nivelesSeleccionados,
      perfil: { rol: 2, nombre: "director" } 
    })
    createNewDirector({ 
      ...data, 
      nivelDeInstitucion: nivelesSeleccionados,
      perfil: { rol: 2, nombre: "director" } 
    })
    reset()
    setNivelesSeleccionados([])
  })
  const handleShowModalDelete = () => {
    setShowDeleteUsuario(!showDeleteUsuario)
  }
  const handleShowModal = () => {
    setShowModal(!showModal)
  }
  console.log('docentesDeDirectores', docentesDeDirectores)
  /* console.log('usuariosDirectores', usuariosDirectores) */
  return (
    <>
      <ToastContainer />
      <div className={styles.container}>
        {
          showModal &&
          <UpdateUsuarioDirector idUsuario={idUsuario} handleShowModal={handleShowModal} />
        }
        {
          showDeleteUsuario &&
          <DeleteUsuario idUsuario={idUsuario} handleShowModalDelete={handleShowModalDelete}/>
        }
        <div className={styles.tableContainer}>
          <div className={styles.fieldContainer}>
            <h1 className={styles.title}>Directivos</h1>
            <TablaDirectores rol={2} docentesDeDirectores={docentesDeDirectores}/>
            {/* <TablaUsuariosAdminDirectores rol={2} docentesDeDirectores={docentesDeDirectores}/> */}
          </div>
        </div>
        <div className={styles.formContainer}>
          {
            loaderPages ?
              <div className={styles.loaderGrid}>
                <div className={styles.loaderContent}>
                  <RiLoader4Line className={styles.spinner} />
                  <span className={styles.loadingText}>...creando usuario director</span>
                </div>
              </div>
              :
              <div>

                <h1 className={styles.title}>Registrar Directivo</h1>
                <div className={styles.formWrapper}>
                  <form onSubmit={handleAgregarDirector}>
                    <div className={styles.fieldContainer}>
                      <label className={styles.label}>nombre de la i.e.:</label>
                      <input
                        {...register("institucion",
                          {
                            required: { value: true, message: "El nombre de la institución es requerido" },
                            minLength: { value: 5, message: "El nombre debe tener mínimo 5 caracteres" },
                            maxLength: { value: 100, message: "El nombre debe tener máximo 100 caracteres" },
                          }
                        )}
                        className={styles.input}
                        type="text"
                        placeholder="Nombre de la institución"
                      />
                      {errors.institucion && <span className={styles.errorMessage}>{errors.institucion.message as string}</span>}
                    </div>

                    <div className={styles.fieldContainer}>
                      <label className={styles.label}>nivel de institución:</label>
                      <div className={styles.checkboxContainer}>
                        {nivelInstitucion?.map((nivel, index) => (
                          <label key={index} className={`${styles.checkboxLabel} ${nivel.id === 0 ? styles.disabled : ''}`}>
                            <input
                              type="checkbox"
                              checked={nivelesSeleccionados.includes(nivel.id)}
                              onChange={() => handleNivelChange(nivel.id)}
                              className={styles.checkbox}
                              disabled={nivel.id === 0}
                            />
                            <span className={styles.checkboxText}>{nivel.name}</span>
                          </label>
                        ))}
                      </div>
                      {nivelesSeleccionados.length === 0 && (
                        <span className={styles.errorMessage}>Debe seleccionar al menos un nivel de institución</span>
                      )}
                    </div>
                    <div className={styles.fieldContainer}>
                      <label className={styles.label}>dni:</label>
                      <input
                        {...register("dni",
                          {
                            required: { value: true, message: "El DNI es requerido" },
                            minLength: { value: 8, message: "El DNI debe tener exactamente 8 dígitos" },
                            maxLength: { value: 8, message: "El DNI debe tener exactamente 8 dígitos" },
                            pattern: {
                              value: /^[0-9]{8}$/,
                              message: "El DNI debe contener solo números y tener exactamente 8 dígitos"
                            },
                            validate: {
                              isNumeric: (value) => /^[0-9]+$/.test(value) || "El DNI debe contener solo números",
                              hasEightDigits: (value) => value.length === 8 || "El DNI debe tener exactamente 8 dígitos"
                            }
                          }
                        )}
                        className={styles.input}
                        type="text"
                        placeholder="Número de DNI (8 dígitos)"
                        maxLength={8}
                        inputMode="numeric"
                        onChange={handleDniChange}
                        onKeyDown={(e) => {
                          // Prevenir entrada de caracteres no numéricos
                          if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                            e.preventDefault()
                          }
                        }}
                      />
                      {errors.dni && <span className={styles.errorMessage}>{errors.dni.message as string}</span>}
                    </div>
                    <div className={styles.fieldContainer}>
                      <label className={styles.label}>nombres:</label>
                      <input
                        {...register("nombres",
                          {
                            required: { value: true, message: "Los nombres son requeridos" },
                            minLength: { value: 2, message: "Los nombres deben tener mínimo 2 caracteres" },
                            maxLength: { value: 40, message: "Los nombres deben tener máximo 40 caracteres" },
                            pattern: {
                              value: /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/,
                              message: "Los nombres solo pueden contener letras"
                            }
                          }
                        )}
                        className={styles.input}
                        type="text"
                        placeholder="Nombres del director"
                        onChange={handleNameChange}
                      />
                      {errors.nombres && <span className={styles.errorMessage}>{errors.nombres.message as string}</span>}
                    </div>
                    <div className={styles.fieldContainer}>
                      <label className={styles.label}>apellidos:</label>
                      <input
                        {...register("apellidos",
                          {
                            required: { value: true, message: "Los apellidos son requeridos" },
                            minLength: { value: 2, message: "Los apellidos deben tener mínimo 2 caracteres" },
                            maxLength: { value: 40, message: "Los apellidos deben tener máximo 40 caracteres" },
                            pattern: {
                              value: /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/,
                              message: "Los apellidos solo pueden contener letras"
                            }
                          }
                        )}
                        className={styles.input}
                        type="text"
                        placeholder="Apellidos del director"
                        onChange={handleNameChange}
                      />
                      {errors.apellidos && <span className={styles.errorMessage}>{errors.apellidos.message as string}</span>}
                    </div>
                    <div className={styles.rowContainer}>
                      <div className={styles.rowField}>
                        <label className={styles.label}>ugel:</label>
                        <select
                          {...register("region",
                            {
                              required: { value: true, message: "La UGEL es requerida" },
                            }
                          )}
                          className={styles.select}
                        >
                          <option value="">--SELECCIONE UGEL--</option>
                          {regiones?.map((region, index) => (
                            <option key={index} value={Number(region.codigo)}>{region.region?.toUpperCase()}</option>
                          ))}
                        </select>
                        {errors.region && <span className={styles.errorMessage}>{errors.region.message as string}</span>}
                      </div>

                      <div className={styles.rowField}>
                        <label className={styles.label}>distrito:</label>
                        <select
                          {...register("distrito",
                            {
                              required: { value: true, message: "El distrito es requerido" },
                            }
                          )}
                          className={`${styles.select} ${!regionSeleccionada ? styles.disabled : ''}`}
                          disabled={!regionSeleccionada}
                        >
                          <option value="">--SELECCIONE DISTRITO--</option>
                          {distritos.map((distrito, index) => (
                            <option key={index} value={distrito}>{distrito.toUpperCase()}</option>
                          ))}
                        </select>
                        {errors.distrito && <span className={styles.errorMessage}>{errors.distrito.message as string}</span>}
                      </div>
                    </div>

                    <div className={styles.rowContainer}>
                      <div className={styles.rowField}>
                        <label className={styles.label}>rol directivo:</label>
                        <select
                          {...register("rolDirectivo",
                            {
                              required: { value: true, message: "El rol directivo es requerido" },
                            }
                          )}
                          className={styles.select}
                        >
                          <option value="">--SELECCIONE ROL--</option>
                          {rolDirectivo?.map((rol, index) => (
                            <option key={index} value={rol.id}>{rol.name.toUpperCase()}</option>
                          ))}
                        </select>
                        {errors.rolDirectivo && <span className={styles.errorMessage}>{errors.rolDirectivo.message as string}</span>}
                      </div>

                      <div className={styles.rowField}>
                        <label className={styles.label}>género:</label>
                        <select
                          {...register("genero",
                            {
                              required: { value: true, message: "El género es requerido" },
                            }
                          )}
                          className={styles.select}
                        >
                          <option value="">--SELECCIONE GÉNERO--</option>
                          {genero?.map((gen, index) => (
                            <option key={index} value={gen.id}>{gen.name.toUpperCase()}</option>
                          ))}
                        </select>
                        {errors.genero && <span className={styles.errorMessage}>{errors.genero.message as string}</span>}
                      </div>
                    </div>

                    <div className={styles.fieldContainer}>
                      <label className={styles.label}>característica:</label>
                      <select
                        {...register("caracteristica",
                          {
                            required: { value: true, message: "La característica es requerida" },
                          }
                        )}
                        className={styles.select}
                      >
                        <option value="">--SELECCIONE CARACTERÍSTICA--</option>
                        {caracteristicasDirectivo?.map((caract, index) => (
                          <option key={index} value={caract.id}>{caract.name.toUpperCase()}</option>
                        ))}
                      </select>
                      {errors.caracteristica && <span className={styles.errorMessage}>{errors.caracteristica.message as string}</span>}
                    </div>

                    
                    {warningUsuarioExiste?.length > 0 && (
                      <div className={styles.warningContainer}>
                        <p className={styles.warningText}>{warningUsuarioExiste}</p>
                      </div>
                    )}
                    <button 
                      type="submit"
                      className={styles.submitButton}
                    >
                      {loaderPages ? (
                        <div className={styles.loadingContainer}>
                          <RiLoader4Line className={styles.spinner} />
                          <span>Registrando...</span>
                        </div>
                      ) : (
                        "Registrar Director"
                      )}
                    </button>
                  </form>
                </div>
              </div>

          }
        </div>

      </div>
    </>
  )
}


export default AgregarDirectores
AgregarDirectores.Auth = PrivateRouteEspecialista