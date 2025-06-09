import CoberturaCurricular from '@/components/curricular/cobertura-curricular'
import DatosInstitucion from '@/components/curricular/datos-institucion'
import DatosMonitor from '@/components/curricular/datos-monitor'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'
import { ObservacionMonitoreoDocente } from '@/features/types/types'
import { converNivelCurricularPreguntas, regionTexto } from '@/fuctions/regiones'
import AnexosCurricular from '@/modals/mallaCurricular/anexos'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

const EvaluarCurricula = () => {

  const router = useRouter()
  
  const { getUsuarioMaster, getPreguntaAlternativaCurricular,getEvaluacionCurricular, getEvaluacionCurricularAlternativa } = useEvaluacionCurricular()
  const {currentUserData, paHabilidad ,evaluacionCurricular, evaluacionCurricularAlternativa,dataDocenteMaster} = useGlobalContext()
  
  useEffect(() => {
    getUsuarioMaster(`${router.query.idDocente}`)
    getEvaluacionCurricular()
    getEvaluacionCurricularAlternativa()
  }, [router.query.idDocente])

  useEffect(() => {
    if(dataDocenteMaster.dni){
      getPreguntaAlternativaCurricular(dataDocenteMaster)
      //esta funciona retorn el paHabilidad que solo tiene las preguntas de la habilidad lectora y lo pasa por props al componente CoberturaCurricular
    }
  }, [dataDocenteMaster])

  console.log('paHabilidad', paHabilidad)
  console.log('dataDocenteMaster', dataDocenteMaster)
 /*  console.log('evaluacionCurricular', evaluacionCurricular)
  console.log('evaluacionCurricularAlternativa', evaluacionCurricularAlternativa) */
  
  return (
    <div className='m-auto w-[1000px] p-10'>
      <div className='p-10'>
        <div className='py-12'>
          <h1 className='text-center font-serif'>
            <span className='block text-4xl font-light text-gray-800 tracking-wider mb-2'>
              Cobertura Curricular
            </span>
            <span className='block text-xl text-gray-500 font-light tracking-wide'>
              de la competencia Lee-{converNivelCurricularPreguntas(dataDocenteMaster.grados?.[0] || 0)}
            </span>
          </h1>
        </div>
        {/* <DatosInstitucion dataDocente={dataDocenteMaster} />
        <DatosMonitor dataMonitor={currentUserData}/> */}
        <CoberturaCurricular currentUserData={currentUserData} dataDocente={dataDocenteMaster} evaluacionCurricularAlternativa={evaluacionCurricularAlternativa} paHabilidad={paHabilidad} evaluacionCurricular={evaluacionCurricular}/>
        <AnexosCurricular dataDocente={dataDocenteMaster}/>
      </div>

    </div>
  )
}

export default EvaluarCurricula