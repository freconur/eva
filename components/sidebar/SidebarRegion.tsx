import { useGlobalContext } from '@/features/context/GlolbalContext'
import { regionTexto } from '@/fuctions/regiones'
import React from 'react'

const SidebarRegion = () => {
const { currentUserData } = useGlobalContext()

console.log('currentUserData', currentUserData)

const transformData = (data:any) => {
  return <span>{regionTexto(data)}</span>
}
  return (
    <div>
      
    </div>
  )
}

export default SidebarRegion