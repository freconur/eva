import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import useUsuario from '@/features/hooks/useUsuario'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { app } from '@/firebase/firebase.config'
import { RiLoader4Line } from 'react-icons/ri'
import Image from 'next/image'
import logo from '../assets/formativa-logo.png'
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
        if (currentUserData.perfil?.rol === 1) {
          router.push('/mi-cuenta')
        }
        if (currentUserData.perfil?.rol === 2) {
          router.push('/mi-cuenta')
        }
        if (currentUserData.perfil?.rol === 3) {
          router.push('/mi-cuenta')
        }
        if (currentUserData.perfil?.rol === 4) {
          router.push('/mi-cuenta')
        }
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
      <div className={styles.backgroundShapes}>
        <div className={`${styles.shape} ${styles.shape1}`}></div>
        <div className={`${styles.shape} ${styles.shape2}`}></div>
        <div className={`${styles.shape} ${styles.shape3}`}></div>
        <div className={`${styles.shape} ${styles.shape4}`}></div>
        <div className={`${styles.shape} ${styles.shape5}`}></div>
        <div className={`${styles.outlineShape} ${styles.outlineShape1}`}></div>
        <div className={`${styles.outlineShape} ${styles.outlineShape2}`}></div>
        <div className={`${styles.outlineShape} ${styles.outlineShape3}`}></div>
        <div className={`${styles.outlineShape} ${styles.outlineShape4}`}></div>
      </div>
      <div className={styles.titleContainer}>
        <h1 className={styles.title}>Competence</h1>
        <h2 className={styles.subtitle}>Sistema de seguimiento del desarrollo de competencias</h2>
      </div>
      <div className={styles.loginCard}>
        <div className={styles.cardHeader}>
          <h1 className={styles.cardTitle}>inicio de sesión</h1>
          <p className={styles.cardSubtitle}>Ingresa tus datos</p>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputContainer}>
            <div className={styles.inputGroup}>
              <input
                onChange={handleChangeValuesLogin}
                className={styles.input}
                type="email" 
                placeholder="USUARIO"
                name="usuario" 
              />
            </div>
            <div className={styles.inputGroup}>
              <input
                onChange={handleChangeValuesLogin}
                name="contrasena"
                type="password"
                className={styles.input}
                placeholder="CONTRASEÑA" 
              />
            </div>
          </div>

          {
            loaderLogin ?
              <div className={styles.loaderContainer}>
                <RiLoader4Line className={styles.loaderIcon} />
                <span className={styles.loaderText}>...validando datos </span>
              </div>
              :
              <>
                {
                  warningLogin?.length > 0 &&
                  <span className={styles.warning}>
                    * {warningLogin}
                  </span>
                }
                <div>
                  <button className={styles.button}>ingresar</button>
                </div>
              </>
          }
        </form>
      </div>
    </div>
  )
}

export default Login