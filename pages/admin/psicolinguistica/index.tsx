import ListaEvaluaciones from '@/components/psicolinguistica/lista-de-evaluaciones'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { usePsicolinguistica } from '@/features/hooks/usePsicolinguistica'
import CrearEvaluacionPsicolinguitica from '@/modals/crearEvaluacionPsicolinguitica'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { PiFilesFill, PiScooter } from 'react-icons/pi'

const Psicolinguistica = () => {

  const [showModal, setShowModal] = useState<boolean>(false)
  const { evaluacionesPsicolinguistica } = useGlobalContext()
  const { getPsicolinguistica } = usePsicolinguistica()
  const handleShowCrearEvaluacion = () => {
    setShowModal(!showModal)
  }


  useEffect(() => {
    getPsicolinguistica()
  }, [])
  return (
    
    <ListaEvaluaciones/>

  )
}

export default Psicolinguistica