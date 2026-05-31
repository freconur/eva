import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { RiQuestionLine, RiLockPasswordLine, RiKeyLine, RiUserLine, RiShieldKeyholeLine, RiCloseLine, RiErrorWarningLine } from 'react-icons/ri'
import { toast } from 'react-toastify'
import styles from './styles.module.css'

interface ModalRecuperarContrasenaProps {
  onClose: () => void
}

const ModalRecuperarContrasena: React.FC<ModalRecuperarContrasenaProps> = ({ onClose }) => {
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Form states
  const [dni, setDni] = useState('')
  const [metodo, setMetodo] = useState<'pin' | 'pregunta'>('pregunta')
  const [preguntaTexto, setPreguntaTexto] = useState('')
  const [preguntaId, setPreguntaId] = useState('')
  
  // Validation states
  const [valorValidacion, setValorValidacion] = useState('') // holds answer or PIN
  
  // Password states
  const [nuevaContrasena, setNuevaContrasena] = useState('')
  const [confirmContrasena, setConfirmContrasena] = useState('')
  const [supportRequested, setSupportRequested] = useState(false)

  const handleSolicitarSoporte = async () => {
    setErrorMsg('')
    setLoading(true)
    try {
      const { functions } = await import('@/firebase/firebase.config')
      const { httpsCallable } = await import('firebase/functions')
      const solicitarReseteoFn = httpsCallable(functions, 'solicitarReseteoContrasena')
      await solicitarReseteoFn({ dni })
      setSupportRequested(true)
    } catch (error: any) {
      console.error('Error al solicitar soporte:', error)
      const errorText = error.message || 'Ocurrió un error al enviar la solicitud.'
      setErrorMsg(errorText)
      toast.error(errorText)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    if (dni.length < 8) {
      toast.warning('Por favor, ingresa un DNI válido.')
      return
    }

    setLoading(true)
    try {
      const { functions } = await import('@/firebase/firebase.config')
      const { httpsCallable } = await import('firebase/functions')
      const obtenerPreguntaSeguridadFn = httpsCallable(functions, 'obtenerPreguntaSeguridad')

      const result = await obtenerPreguntaSeguridadFn({ dni })
      const data = result.data as { configurado: boolean; preguntaId: string; preguntaTexto: string }

      if (!data.configurado) {
        const errorText = 'Este usuario no tiene configurados los métodos de recuperación de contraseña.'
        setErrorMsg(errorText)
        toast.error(errorText)
        return
      }

      setPreguntaId(data.preguntaId)
      setPreguntaTexto(data.preguntaTexto)
      setStep(2)
    } catch (error: any) {
      console.error('Error al obtener pregunta de seguridad:', error)
      const errorText = error.message || 'El DNI ingresado no está registrado o no se pudo validar.'
      setErrorMsg(errorText)
      toast.error(errorText)
    } finally {
      setLoading(false)
    }
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    if (metodo === 'pin') {
      if (valorValidacion.length !== 4 || !/^\d+$/.test(valorValidacion)) {
        toast.warning('El PIN debe tener exactamente 4 dígitos numéricos.')
        return
      }
    } else {
      if (!valorValidacion.trim()) {
        toast.warning('Por favor, ingresa tu respuesta secreta.')
        return
      }
    }

    setLoading(true)
    try {
      const { functions } = await import('@/firebase/firebase.config')
      const { httpsCallable } = await import('firebase/functions')
      const validarCredencialesAutoservicioFn = httpsCallable(functions, 'validarCredencialesAutoservicio')

      await validarCredencialesAutoservicioFn({
        dni,
        metodo,
        valor: valorValidacion
      })

      setStep(3)
    } catch (error: any) {
      console.error('Error al validar credenciales:', error)
      const errorText = error.message || 'El PIN o la respuesta secreta ingresada es incorrecta.'
      setErrorMsg(errorText)
      toast.error(errorText)
    } finally {
      setLoading(false)
    }
  }

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
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
      const recuperarContrasenaAutoservicioFn = httpsCallable(functions, 'recuperarContrasenaAutoservicio')

      await recuperarContrasenaAutoservicioFn({
        dni,
        metodo,
        valor: valorValidacion,
        nuevaContrasena
      })

      toast.success('¡Contraseña restablecida con éxito! Ya puedes iniciar sesión con tus nuevas credenciales.')
      onClose()
    } catch (error: any) {
      console.error('Error al recuperar contraseña:', error)
      const errorText = error.message || 'El PIN o la respuesta secreta son incorrectos.'
      setErrorMsg(errorText)
      toast.error(errorText)
    } finally {
      setLoading(false)
    }
  }

  const handleBackStep = () => {
    setErrorMsg('')
    if (step > 1) {
      setStep(step - 1)
      if (step === 2) {
        setValorValidacion('')
      }
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
          <button onClick={onClose} className={styles.closeBtn} type="button" aria-label="Cerrar modal">
            <RiCloseLine />
          </button>
          <div className={styles.headerIconBg}>
            <RiShieldKeyholeLine />
          </div>

          <h2 className={styles.title}>Recuperar Contraseña</h2>
          <p className={styles.subtitle}>
            Sigue los pasos para restablecer la contraseña de tu cuenta de forma autónoma.
          </p>
        </div>

        {/* Step Indicator */}
        <div className={styles.stepIndicator}>
          <div className={styles.stepWrapper}>
            <div className={styles.stepNode}>
              <span className={getStepCircleClass(1)}>1</span>
              <span className={styles.stepLabel}>Identificación</span>
            </div>
            <div className={getStepLineClass(1)} />
            <div className={styles.stepNode}>
              <span className={getStepCircleClass(2)}>2</span>
              <span className={styles.stepLabel}>Validación</span>
            </div>
            <div className={getStepLineClass(2)} />
            <div className={styles.stepNode}>
              <span className={getStepCircleClass(3)}>3</span>
              <span className={styles.stepLabel}>Nueva clave</span>
            </div>
          </div>
        </div>

        {/* Content & Body */}
        <div className={styles.body}>
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="dni" className={styles.label}>
                  Número de DNI <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWithIconContainer}>
                  <RiUserLine className={styles.inputIcon} />
                  <input
                    id="dni"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={8}
                    value={dni}
                    onChange={(e) => {
                      setDni(e.target.value.replace(/\D/g, ''))
                      setErrorMsg('')
                    }}
                    placeholder="Ingresa tu DNI"
                    className={`${styles.input} ${styles.inputWithIcon}`}
                    required
                  />
                </div>
              </div>

              {errorMsg && <div className={styles.errorBanner}><RiErrorWarningLine /> {errorMsg}</div>}

              <div className={`${styles.buttonGroup} ${styles.buttonGroupRight}`}>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className={styles.spinner} />
                      Buscando...
                    </>
                  ) : (
                    'Siguiente paso'
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            supportRequested ? (
              <div className={styles.successSupportContainer}>
                <div className={styles.successSupportIconBg}>
                  <RiShieldKeyholeLine />
                </div>
                <h3 className={styles.successSupportTitle}>Solicitud Enviada</h3>
                <p className={styles.successSupportText}>
                  Se ha enviado una solicitud de restablecimiento para el DNI <strong>{dni}</strong>.
                </p>
                <p className={styles.successSupportHelp}>
                  Por favor, ponte en contacto con tu especialista regional o administrador de UGEL para completar el proceso.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  style={{ width: '100%' }}
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleStep2Submit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Método de Validación</label>
                  <div className={styles.optionsGrid}>
                    <div
                      onClick={() => {
                        setMetodo('pregunta')
                        setValorValidacion('')
                      }}
                      className={`${styles.optionCard} ${metodo === 'pregunta' ? styles.optionCardActive : ''}`}
                    >
                      <RiQuestionLine className={styles.optionIcon} />
                      <span className={styles.optionLabel}>Pregunta Secreta</span>
                    </div>
                    <div
                      onClick={() => {
                        setMetodo('pin')
                        setValorValidacion('')
                      }}
                      className={`${styles.optionCard} ${metodo === 'pin' ? styles.optionCardActive : ''}`}
                    >
                      <RiKeyLine className={styles.optionIcon} />
                      <span className={styles.optionLabel}>PIN de 4 dígitos</span>
                    </div>
                  </div>
                </div>

                {metodo === 'pregunta' ? (
                  <div className={styles.formGroup}>
                    <label htmlFor="respuesta" className={styles.label}>
                      {preguntaTexto} <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="respuesta"
                      type="text"
                      value={valorValidacion}
                      onChange={(e) => {
                        setValorValidacion(e.target.value.toLowerCase())
                        setErrorMsg('')
                      }}
                      placeholder="Escribe tu respuesta aquí..."
                      className={styles.input}
                      style={{ textTransform: 'lowercase' }}
                      required
                    />
                    <span className={styles.helpText}>
                      La respuesta se valida sin distinguir mayúsculas ni espacios adicionales.
                    </span>
                  </div>
                ) : (
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
                        value={valorValidacion}
                        onChange={(e) => {
                          setValorValidacion(e.target.value.replace(/\D/g, ''))
                          setErrorMsg('')
                        }}
                        placeholder="Dígitos PIN"
                        className={`${styles.input} ${styles.inputWithIcon} ${styles.inputCenterTracking}`}
                        required
                      />
                    </div>
                    <span className={`${styles.helpText} ${styles.helpTextCenter}`}>
                      Ingresa el PIN de seguridad de 4 dígitos numéricos que configuraste.
                    </span>
                  </div>
                )}

                {errorMsg && <div className={styles.errorBanner}><RiErrorWarningLine /> {errorMsg}</div>}

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
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    style={{ flex: 1 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className={styles.spinner} />
                        Validando...
                      </>
                    ) : (
                      'Siguiente paso'
                    )}
                  </button>
                </div>

                <div className={styles.forgotRecoveryOption}>
                  ¿No recuerdas tu PIN ni tu respuesta?{' '}
                  <button
                    type="button"
                    onClick={handleSolicitarSoporte}
                    className={styles.supportLink}
                    disabled={loading}
                  >
                    Solicitar soporte al administrador
                  </button>
                </div>
              </form>
            )
          )}

          {step === 3 && (
            <form onSubmit={handleStep3Submit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="nuevaContrasena" className={styles.label}>
                  Nueva Contraseña <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWithIconContainer}>
                  <RiLockPasswordLine className={styles.inputIcon} />
                  <input
                    id="nuevaContrasena"
                    type="password"
                    value={nuevaContrasena}
                    onChange={(e) => {
                      setNuevaContrasena(e.target.value)
                      setErrorMsg('')
                    }}
                    placeholder="Escribe tu nueva contraseña"
                    className={`${styles.input} ${styles.inputWithIcon}`}
                    required
                    minLength={6}
                  />
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
                    type="password"
                    value={confirmContrasena}
                    onChange={(e) => {
                      setConfirmContrasena(e.target.value)
                      setErrorMsg('')
                    }}
                    placeholder="Repite tu nueva contraseña"
                    className={`${styles.input} ${styles.inputWithIcon}`}
                    required
                    minLength={6}
                  />
                </div>
                <span className={styles.helpText}>
                  La contraseña debe tener un mínimo de 6 caracteres.
                </span>
              </div>

              {errorMsg && <div className={styles.errorBanner}><RiErrorWarningLine /> {errorMsg}</div>}

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
                    'Confirmar y Guardar'
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

export default ModalRecuperarContrasena
