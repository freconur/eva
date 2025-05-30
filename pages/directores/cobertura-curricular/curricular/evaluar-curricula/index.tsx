import CoberturaCurricular from '@/components/curricular/cobertura-curricular'
import DatosInstitucion from '@/components/curricular/datos-institucion'
import DatosMonitor from '@/components/curricular/datos-monitor'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'
import { converNivelCurricularPreguntas, nivelCurricularPreguntas } from '@/fuctions/regiones'
import AnexosCurricular from '@/modals/mallaCurricular/anexos'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

const EvaluarCurricula = () => {

  const router = useRouter()
  
  const { getDocente, getPreguntaAlternativaCurricular,getEvaluacionCurricular, getEvaluacionCurricularAlternativa, resetValuesEvaluarCurricular } = useEvaluacionCurricular()
  const { dataDocente, currentUserData, paHabilidad ,evaluacionCurricular, evaluacionCurricularAlternativa,} = useGlobalContext()
  
  useEffect(() => {
    getDocente(`${router.query.idDocente}`)
    getEvaluacionCurricular()
    getEvaluacionCurricularAlternativa()
  }, [router.query.idDocente])

  useEffect(() => {
    if(dataDocente.dni){
      getPreguntaAlternativaCurricular(dataDocente)
      //esta funciona retorn el paHabilidad que solo tiene las preguntas de la habilidad lectora y lo pasa por props al componente CoberturaCurricular
    }
  }, [dataDocente])
  return (
    <div className='m-auto w-[1000px] p-10'>
      <div className='p-10'>
        <div className='py-12'>
          <h1 className='text-center font-serif'>
            <span className='block text-4xl font-light text-gray-800 tracking-wider mb-2'>
              Cobertura Curricular
            </span>
            <span className='block text-xl text-gray-500 font-light tracking-wide'>
              de la competencia Lee-{dataDocente?.grados?.[0] ? converNivelCurricularPreguntas(Number(dataDocente.grados[0])) : ''}
            </span>
          </h1>
        </div>
        <DatosInstitucion dataDocente={dataDocente} />
        <DatosMonitor dataMonitor={currentUserData}/>
        <CoberturaCurricular dataDocente={dataDocente} evaluacionCurricularAlternativa={evaluacionCurricularAlternativa} paHabilidad={paHabilidad} evaluacionCurricular={evaluacionCurricular}/>
        <AnexosCurricular dataDocente={dataDocente}/>
      </div>

    </div>
  )
}

export default EvaluarCurricula