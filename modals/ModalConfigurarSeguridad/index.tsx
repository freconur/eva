import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useGlobalContext, useGlobalContextDispatch } from '@/features/context/GlolbalContext'
import { AppAction } from '@/features/actions/appAction'
import { RiQuestionLine, RiLockPasswordLine, RiKeyLine, RiLoader4Line, RiShieldKeyholeLine, RiLogoutBoxLine, RiEyeLine, RiEyeOffLine, RiErrorWarningLine } from 'react-icons/ri'
import { toast } from 'react-toastify'
import { useRouter } from 'next/router'
import useUsuario from '@/features/hooks/useUsuario'
import styles from './styles.module.css'

const PREGUNTAS_SEGURIDAD = [
  { id: 'mascota', texto: '¿Cuál es el nombre de tu primera mascota?' },
  { id: 'ciudad_madre', texto: '¿En qué ciudad nació tu madre?' },
  { id: 'primera_escuela', texto: '¿Cuál era el nombre de tu primera escuela?' },
  { id: 'comida_favorita', texto: '¿Cuál es tu comida favorita?' },
  { id: 'personaje_historico', texto: '¿Cuál es el nombre de tu personaje histórico favorito?' }
]

const ModalConfigurarSeguridad = () => {
  const { currentUserData } = useGlobalContext()
  const dispatch = useGlobalContextDispatch()
  const router = useRouter()
  const { logout } = useUsuario()
  
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(1)
  const [preguntaId, setPreguntaId] = useState('')
  const [respuesta, setRespuesta] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [nuevaContrasena, setNuevaContrasena] = useState('')
  const [confirmContrasena, setConfirmContrasena] = useState('')
  const [showNuevaContrasena, setShowNuevaContrasena] = useState(false)
  const [showConfirmContrasena, setShowConfirmContrasena] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Interceptar cualquier intento de navegación por el router de Next.js
    const handleRouteChange = (url: string) => {
      if (url === '/login') return // Permitir cerrar sesión
      
      // Abortar la navegación
      router.events.emit('routeChangeError')
      
      // Forzar al router a quedarse en la página actual
      if (router.asPath && router.asPath !== url) {
        router.replace(router.asPath)
      }
      
      toast.error('Debe configurar su pregunta de seguridad y contraseña antes de navegar.')
      throw 'Navegación bloqueada: Configuración de seguridad obligatoria.'
    }

    router.events.on('routeChangeStart', handleRouteChange)

    return () => {
      setMounted(false)
      router.events.off('routeChangeStart', handleRouteChange)
    }
  }, [router])


  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) {
      if (!preguntaId || !respuesta.trim()) {
        toast.warning('Por favor, selecciona una pregunta y escribe tu respuesta.')
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (pin.length !== 4 || !/^\d+$/.test(pin)) {
        toast.warning('El PIN debe tener exactamente 4 dígitos numéricos.')
        return
      }
      if (pin !== confirmPin) {
        toast.warning('Los PIN ingresados no coinciden.')
        return
      }
      setStep(3)
    }
  }

  const handleBackStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaContrasena || nuevaContrasena.length < 6) {
      toast.warning('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (nuevaContrasena !== confirmContrasena) {
      toast.warning('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const { functions } = await import('@/firebase/firebase.config')
      const { httpsCallable } = await import('firebase/functions')
      const configurarSeguridadFn = httpsCallable(functions, 'configurarSeguridad')

      await configurarSeguridadFn({
        nuevaContrasena,
        preguntaId,
        respuesta,
        pin
      })

      toast.success('¡Seguridad configurada y contraseña actualizada con éxito!')
      
      // Actualizar el estado global del usuario para ocultar este modal
      dispatch({
        type: AppAction.CURRENT_USER_DATA,
        payload: {
          ...currentUserData,
          seguridad: {
            preguntaId,
            respuesta: respuesta.trim().toLowerCase(),
            pin,
            configurado: true
          },
          debeCambiarContrasena: false
        }
      })
    } catch (error: any) {
      console.error('Error al configurar seguridad:', error)
      toast.error(error.message || 'Ocurrió un error al procesar tu solicitud')
    } finally {
      setLoading(false)
    }
  }

  const getStepCircleClass = (stepNum: number) => {
    let classes = styles.stepCircle
    if (step === stepNum) {
      classes += ` ${styles.stepCircleActive}`
    } else if (step > stepNum) {
      classes += ` ${styles.stepCircleCompleted}`
    }
    return classes
  }

  const getStepLineClass = (stepNum: number) => {
    let classes = styles.stepLine
    if (step > stepNum) {
      classes += ` ${styles.stepLineActive}`
    }
    return classes
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
              logout();
              router.push('/login');
            }}
            className={styles.logoutBtn}
            title="Cerrar Sesión"
          >
            <RiLogoutBoxLine className="text-base" />
            Cerrar Sesión
          </button>

          <div className={styles.headerIconBg}>
            <RiShieldKeyholeLine />
          </div>

          <h2 className={styles.title}>Configura tu Seguridad</h2>
          <p className={styles.subtitle}>
            Para proteger tu cuenta, configura tus métodos de recuperación y actualiza tu contraseña.
          </p>
        </div>

        {/* Step Indicator */}
        <div className={styles.stepIndicator}>
          <div className={styles.stepWrapper}>
            <div className={styles.stepNode}>
              <span className={getStepCircleClass(1)}>1</span>
              <span className={styles.stepLabel}>Pregunta</span>
            </div>
            <div className={getStepLineClass(1)} />
            <div className={styles.stepNode}>
              <span className={getStepCircleClass(2)}>2</span>
              <span className={styles.stepLabel}>PIN</span>
            </div>
            <div className={getStepLineClass(2)} />
            <div className={styles.stepNode}>
              <span className={getStepCircleClass(3)}>3</span>
              <span className={styles.stepLabel}>Contraseña</span>
            </div>
          </div>
        </div>

        {/* Content & Forms */}
        <div className={styles.body}>
          {step === 1 && (
            <form onSubmit={handleNextStep} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="pregunta" className={styles.label}>
                  Pregunta de Seguridad <span className={styles.required}>*</span>
                </label>
                <div className={styles.selectPrefixContainer}>
                  <RiQuestionLine className={styles.selectPrefixIcon} />
                  <select
                    id="pregunta"
                    value={preguntaId}
                    onChange={(e) => setPreguntaId(e.target.value)}
                    className={`${styles.select} ${styles.selectWithIcon}`}
                    required
                  >
                    <option value="">-- Selecciona una pregunta --</option>
                    {PREGUNTAS_SEGURIDAD.map(q => (
                      <option key={q.id} value={q.id}>{q.texto}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="respuesta" className={styles.label}>
                  Tu Respuesta Secreta <span className={styles.required}>*</span>
                </label>
                <input
                  id="respuesta"
                  type="text"
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value.toLowerCase())}
                  placeholder="Escribe la respuesta aquí..."
                  className={styles.input}
                  style={{ textTransform: 'lowercase' }}
                  required
                />
                <span className={styles.helpText}>
                  Recuerda esta respuesta. Te servirá si olvidas tu contraseña en el futuro.
                </span>
              </div>

              <div className={`${styles.buttonGroup} ${styles.buttonGroupRight}`}>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                >
                  Siguiente paso
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleNextStep} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="pin" className={styles.label}>
                  PIN de 4 dígitos <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWithIconContainer}>
                  <RiKeyLine className={styles.inputIcon} />
                  <input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Dígitos PIN"
                    className={`${styles.input} ${styles.inputWithIcon} ${styles.inputCenterTracking}`}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPin" className={styles.label}>
                  Confirmar PIN <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWithIconContainer}>
                  <RiKeyLine className={styles.inputIcon} />
                  <input
                    id="confirmPin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Repita el PIN"
                    className={`${styles.input} ${styles.inputWithIcon} ${styles.inputCenterTracking}`}
                    required
                  />
                </div>
                <span className={`${styles.helpText} ${styles.helpTextCenter}`}>
                  El PIN debe constar únicamente de 4 dígitos numéricos.
                </span>
              </div>

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={handleBackStep}
                  className={`${styles.btn} ${styles.btnSecondary}`}
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary} style-flex-1`}
                  style={{ flex: 1 }}
                >
                  Siguiente paso
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="nuevaContrasena" className={styles.label}>
                  Nueva Contraseña <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWithIconContainer}>
                  <RiLockPasswordLine className={styles.inputIcon} />
                  <input
                    id="nuevaContrasena"
                    type={showNuevaContrasena ? 'text' : 'password'}
                    value={nuevaContrasena}
                    onChange={(e) => setNuevaContrasena(e.target.value)}
                    placeholder="Escriba su nueva contraseña"
                    className={`${styles.input} ${styles.inputWithIcon} ${styles.inputWithRightIcon} ${
                      confirmContrasena ? (nuevaContrasena === confirmContrasena ? styles.inputSuccess : styles.inputError) : ''
                    }`}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowNuevaContrasena(!showNuevaContrasena)}
                    title={showNuevaContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showNuevaContrasena ? <RiEyeOffLine /> : <RiEyeLine />}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmContrasena" className={styles.label}>
                  Confirmar Contraseña <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWithIconContainer}>
                  <RiLockPasswordLine className={styles.inputIcon} />
                  <input
                    id="confirmContrasena"
                    type={showConfirmContrasena ? 'text' : 'password'}
                    value={confirmContrasena}
                    onChange={(e) => setConfirmContrasena(e.target.value)}
                    placeholder="Repita su nueva contraseña"
                    className={`${styles.input} ${styles.inputWithIcon} ${styles.inputWithRightIcon} ${
                      confirmContrasena ? (nuevaContrasena === confirmContrasena ? styles.inputSuccess : styles.inputError) : ''
                    }`}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowConfirmContrasena(!showConfirmContrasena)}
                    title={showConfirmContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showConfirmContrasena ? <RiEyeOffLine /> : <RiEyeLine />}
                  </button>
                </div>
                {confirmContrasena && nuevaContrasena !== confirmContrasena ? (
                  <span className={styles.errorText}>
                    <RiErrorWarningLine /> Las contraseñas no coinciden.
                  </span>
                ) : confirmContrasena && nuevaContrasena ? (
                  <span className={styles.successText}>
                    Las contraseñas coinciden.
                  </span>
                ) : (
                  <span className={styles.helpText}>
                    La contraseña debe tener un mínimo de 6 caracteres.
                  </span>
                )}
              </div>

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={handleBackStep}
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  disabled={loading}
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnSuccess}`}
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className={styles.spinner} />
                      Guardando...
                    </>
                  ) : (
                    'Guardar y Finalizar'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ModalConfigurarSeguridad
