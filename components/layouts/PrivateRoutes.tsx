import { useGlobalContext } from '@/features/context/GlolbalContext'
import useUsuario from '@/features/hooks/useUsuario'
import { app } from '@/firebase/firebase.config'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'


interface Props {
  children: JSX.Element | JSX.Element[]
}
const PrivateRouteAdmins = ({ children }: Props) => {

  const router = useRouter()
  const auth = getAuth(app)
  const { getUserData } = useUsuario()
  const { currentUserData } = useGlobalContext()

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        getUserData()
      } else {
        router.push('/login');
      }
    });
  }, [])

  useEffect(() => {
    console.log('ruta admin', currentUserData)
    if (currentUserData.dni) {
      if (currentUserData.perfil?.rol !== undefined) {
        if (Number(currentUserData?.perfil.rol) !== 4) {
          router.push('/login')
        }
      }
    }
  }, [currentUserData.dni]);
  return (
    <>{children}</>
  )
}

export default PrivateRouteAdmins