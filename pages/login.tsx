import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import useUsuario from '@/features/hooks/useUsuario'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { app } from '@/firebase/firebase.config'
import { RiLoader4Line } from 'react-icons/ri'
import Image from 'next/image'
import logo from '../assets/cl-logo.png'
import styles from '@/styles/login.module.css'

const initialValue = { usuario: "", contrasena: "" }
const Login = () => {
  const auth = getAuth(app)
  const router = useRouter()
  const { signIn } = useUsuario()
  const { currentUserData, loaderLogin, warningLogin } = useGlobalContext()
  const [loginValues, setLoginValues] = useState(initialValue)

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        if (currentUserData.perfil?.rol === 1) router.push('/mi-cuenta')
        if (currentUserData.perfil?.rol === 2) router.push('/mi-cuenta')
        if (currentUserData.perfil?.rol === 3) router.push('/mi-cuenta')
        if (currentUserData.perfil?.rol === 4) router.push('/mi-cuenta')
        if (currentUserData.perfil?.rol === 5) router.push('/mi-cuenta')
      }
    })
  }, [currentUserData.perfil?.rol, loaderLogin, warningLogin])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    signIn(loginValues)
  }

  const handleChangeValuesLogin = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginValues({
      ...loginValues,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.overlay}></div>

      <div className={styles.contentWrapper}>
        <div className={styles.leftColumn}>
          <div className={styles.logoContainer}>
            <Image
              alt="logo"
              src={logo}
              width={160}
              height={160}
              className={styles.logoImage}
            />
          </div>
          <div className={styles.titleContainer}>
            <h1 className={styles.title}>BIENVENIDO AL COMPETENCE</h1>
            <p className={styles.subtitle}>
              Plataforma integral para el seguimiento y evaluación del desarrollo de competencias, con las mejores herramientas digitales actualizadas.
            </p>
            <div className={styles.divider}></div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.loginCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Iniciar Sesión</h2>
              <p className={styles.cardSubtitle}>Ingresa tus credenciales para acceder</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputContainer}>
                <div className={styles.inputGroup}>
                  <input
                    onChange={handleChangeValuesLogin}
                    className={styles.input}
                    type="email"
                    placeholder="Correo Electrónico"
                    name="usuario"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <input
                    onChange={handleChangeValuesLogin}
                    name="contrasena"
                    type="password"
                    className={styles.input}
                    placeholder="Contraseña"
                  />
                </div>
              </div>

              {loaderLogin ? (
                <div className={styles.loaderContainer}>
                  <RiLoader4Line className={styles.loaderIcon} />
                  <span className={styles.loaderText}>Validando datos...</span>
                </div>
              ) : (
                <>
                  {warningLogin?.length > 0 && (
                    <span className={styles.warning}>
                      * {warningLogin}
                    </span>
                  )}
                  <button className={styles.button}>
                    INGRESAR
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login