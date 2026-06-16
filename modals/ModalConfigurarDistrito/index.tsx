import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useGlobalContext, useGlobalContextDispatch } from '@/features/context/GlolbalContext'
import { AppAction } from '@/features/actions/appAction'
import { RiMapPinLine, RiLoader4Line, RiLogoutBoxLine, RiBuildingLine, RiCompass3Line } from 'react-icons/ri'
import { toast } from 'react-toastify'
import { useRouter } from 'next/router'
import useUsuario from '@/features/hooks/useUsuario'
import { distritosPuno } from '@/fuctions/provinciasPuno'
import { regiones } from '@/fuctions/regiones'
import styles from './styles.module.css'

const ModalConfigurarDistrito = () => {
  const { currentUserData } = useGlobalContext()
  const dispatch = useGlobalContextDispatch()
  const router = useRouter()
  const { logout } = useUsuario()

  const [mounted, setMounted] = useState(false)
  const [regionId, setRegionId] = useState<string | number>('')
  const [distrito, setDistrito] = useState('')
  const [distritosDisponibles, setDistritosDisponibles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Determinar si el usuario ya viene con una región válida
  const tieneRegionPrevia = currentUserData.region !== undefined && 
                             currentUserData.region !== null && 
                             currentUserData.region !== 0 &&
                             Number(currentUserData.region) > 0;

  useEffect(() => {
    setMounted(true)

    // Inicializar región si ya la tiene
    if (tieneRegionPrevia && currentUserData.region !== undefined) {
      setRegionId(currentUserData.region)
    }

    // Interceptar cualquier intento de navegación por el router de Next.js
    const handleRouteChange = (url: string) => {
      if (url === '/login') return // Permitir cerrar sesión
      
      // Abortar la navegación
      router.events.emit('routeChangeError')
      
      // Forzar al router a quedarse en la página actual
      if (router.asPath && router.asPath !== url) {
        router.replace(router.asPath)
      }
      
      toast.error('Debe configurar su distrito antes de navegar.')
      throw 'Navegación bloqueada: Configuración de distrito obligatoria.'
    }

    router.events.on('routeChangeStart', handleRouteChange)

    return () => {
      setMounted(false)
      router.events.off('routeChangeStart', handleRouteChange)
    }
  }, [router, currentUserData.region, tieneRegionPrevia])

  // Cargar distritos correspondientes a la región seleccionada
  useEffect(() => {
    if (regionId) {
      const provincia = distritosPuno.find(p => p.id === Number(regionId))
      setDistritosDisponibles(provincia ? provincia.distritos : [])
      
      // Si la región cambió y el distrito seleccionado no pertenece a la nueva región, limpiarlo
      if (distrito && provincia && !provincia.distritos.includes(distrito)) {
        setDistrito('')
      }
    } else {
      setDistritosDisponibles([])
      setDistrito('')
    }
  }, [regionId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!regionId) {
      toast.warning('Por favor, selecciona tu Provincia/UGEL.')
      return
    }

    if (!distrito) {
      toast.warning('Por favor, selecciona tu Distrito.')
      return
    }

    setLoading(true)
    try {
      const { functions } = await import('@/firebase/firebase.config')
      const { httpsCallable } = await import('firebase/functions')
      const actualizarUsuarioFn = httpsCallable(functions, 'actualizarUsuario')

      const updateData: any = { distrito }
      
      // Si el usuario no tenía región o la cambió, la actualizamos también
      if (Number(regionId) !== currentUserData.region) {
        updateData.region = Number(regionId)
      }

      await actualizarUsuarioFn({
        dni: currentUserData.dni,
        data: updateData
      })

      toast.success('¡Distrito configurado con éxito!')

      // Actualizar el contexto global
      dispatch({
        type: AppAction.CURRENT_USER_DATA,
        payload: {
          ...currentUserData,
          distrito,
          ...(updateData.region && { region: updateData.region })
        }
      })
    } catch (error: any) {
      console.error('Error al configurar distrito:', error)
      toast.error(error.message || 'Ocurrió un error al guardar tu distrito.')
    } finally {
      setLoading(false)
    }
  }

  // Obtener nombre de la provincia actual (si ya la tiene asignada)
  const getNombreProvinciaActual = () => {
    const reg = regiones.find(r => r.id === Number(regionId))
    return reg ? reg.region : 'No asignado'
  }

  if (!mounted) return null

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.modalCard}>
        
        {/* Header */}
        <div className={styles.header}>
          <button
            type="button"
            onClick={() => {
              logout()
              router.push('/login')
            }}
            className={styles.logoutBtn}
            title="Cerrar Sesión"
          >
            <RiLogoutBoxLine className="text-base" />
            Cerrar Sesión
          </button>

          <div className={styles.headerIconBg}>
            <RiMapPinLine />
          </div>

          <h2 className={styles.title}>Completa tu Información</h2>
          <p className={styles.subtitle}>
            Para poder continuar y registrar evaluaciones, es necesario que especifiques el distrito donde se encuentra tu institución educativa.
          </p>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <form onSubmit={handleSubmit} className={styles.form}>
            
            {/* Campo Provincia/UGEL */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Provincia / UGEL</label>
              {tieneRegionPrevia ? (
                // Si ya tiene región, mostrarla como texto informativo/inhabilitado
                <div className={styles.readOnlyContainer}>
                  <RiCompass3Line className={styles.readOnlyIcon} />
                  <input
                    type="text"
                    value={getNombreProvinciaActual()}
                    className={styles.readOnlyInput}
                    disabled
                  />
                </div>
              ) : (
                // Si no tiene región, permitirle seleccionarla
                <div className={styles.selectPrefixContainer}>
                  <RiCompass3Line className={styles.selectPrefixIcon} />
                  <select
                    value={regionId}
                    onChange={(e) => setRegionId(e.target.value)}
                    className={`${styles.select} ${styles.selectWithIcon}`}
                    required
                  >
                    <option value="">-- Selecciona Provincia / UGEL --</option>
                    {regiones.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.region}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Campo Distrito */}
            <div className={styles.formGroup}>
              <label htmlFor="distrito" className={styles.label}>
                Distrito <span className={styles.required}>*</span>
              </label>
              <div className={styles.selectPrefixContainer}>
                <RiBuildingLine className={styles.selectPrefixIcon} />
                <select
                  id="distrito"
                  value={distrito}
                  onChange={(e) => setDistrito(e.target.value)}
                  className={`${styles.select} ${styles.selectWithIcon}`}
                  required
                  disabled={!regionId}
                >
                  <option value="">-- Selecciona un distrito --</option>
                  {distritosDisponibles.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              {!regionId && (
                <span className={styles.helpText}>
                  Selecciona una Provincia / UGEL para habilitar la lista de distritos.
                </span>
              )}
            </div>

            {/* Botón de envío */}
            <div className={styles.buttonGroup}>
              <button
                type="submit"
                className={`${styles.btn} ${styles.btnSuccess}`}
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RiLoader4Line className="animate-spin text-lg" />
                    Guardando...
                  </>
                ) : (
                  'Guardar y Continuar'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ModalConfigurarDistrito
