// import { ReporteDocentePdf } from '@/components/invoce'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import UseEvaluacionDocentes from '@/features/hooks/UseEvaluacionDocentes'
import { AlternativasDocente } from '@/features/types/types'
import { regionTexto } from '@/fuctions/regiones'
import { useRouter } from 'next/router'
import React, { useEffect, useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import UseEvaluacionDirectores from '@/features/hooks/UseEvaluacionDirectores'
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas'

const ReporteDocenteIndividual = () => {

  const route = useRouter()
  const { buscarEspecialistaReporteDeEvaluacion } = UseEvaluacionEspecialistas()
  const { reporteIndividualDocente, currentUserData } = useGlobalContext()

  const printRef = useRef(null)

  const handleDownloadPdf = async () => {
    const element = printRef.current

    if (!element) {
      return;
    }
    const canvas = await html2canvas(element, {scale:2})
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "A4"
    });

    const imgProperties = pdf.getImageProperties(imgData)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
    pdf.save('docente_resultado')
  }
  useEffect(() => {
    if (route.query.idEvaluacion && route.query.idDirector)
      buscarEspecialistaReporteDeEvaluacion(`${route.query.idEvaluacion}`, `${route.query.idDirector}`)
  }, [`${route.query.idEvaluacion}`, `${route.query.idDirector}`, currentUserData.dni])
  // console.log('idDirector', route.query.idDirector)
  // console.log('route.query.idEvaluacion', route.query.idEvaluacion)
  return (
    <div className='grid items-center justify-center mt-[50px]'>
      
      <button onClick={handleDownloadPdf} className='p-3 rounded-sm bg-cyan-500 text-white font-semibold w-[150px] drop-shadow-lg'>descargar pdf</button>
      {
        reporteIndividualDocente?.dni ?
          <div ref={printRef}  className='w-[1100px] p-10 bg-white'>
            <div className='mb-5'>
              <h3 className='text-3xl font-montserrat uppercase font-semibold text-slate-600'> Resultado de Evaluación de desempeño del director</h3>
            </div>
            <div className='py-5 border-y-[1px] mb-5'>
              <h4 className='text-2xl font-montserrat uppercase text-slate-500'> Director: <strong>{reporteIndividualDocente.info?.nombres} {reporteIndividualDocente.info?.apellidos}</strong></h4>
              <h4 className='text-2xl font-montserrat uppercase text-slate-500'> Institución: <strong> {reporteIndividualDocente.info?.institucion}</strong></h4>
              <h4 className='text-2xl font-montserrat uppercase text-slate-500'> Región: <strong> {regionTexto(`${reporteIndividualDocente.info?.region}`)}</strong></h4>
              <h4 className='text-2xl font-montserrat uppercase text-slate-500'> Rol: <strong> {reporteIndividualDocente.info?.perfil?.nombre}</strong></h4>
            </div>

            <div className='grid justify-start items-center mb-5'>
              <h5 className='uppercase text-left text-slate-500 text-xl font-comfortaa'>Detalle de evaluación y calificación </h5>
            </div>
            <table className='w-full bg-white drop-shadow-lg'>
              <thead className='bg-cyan-400 border-b-2 border-cyan-600 h-[40px]'>
                <tr className='text-slate-600 text-xl'>
                  <th>#</th>
                  <th className='text-left'>Criterio</th>
                  <th className='text-center'>Nivel</th>
                  <th className='text-center'>Puntaje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {
                  reporteIndividualDocente.resultados?.map((al, index) => {
                    return (
                      <tr key={index} className="h-[60px] hover:bg-cyan-100 cursor-pointer duration-300 hover:duration-300">
                        <td className='text-center w-[60px] '>{index + 1}</td>
                        <td className='text-left text-slate-500 text-xl font-comfortaa'>{al.criterio}</td>
                        <td className='text-center text-slate-500 text-xl font-montserrat'>Nivel {al.alternativas && al.alternativas[index + 1]?.value}</td>
                        <td className='text-center text-slate-500 text-xl font-montserrat'>{al.alternativas && al.alternativas[index + 1]?.value}</td>
                      </tr>

                    )
                  })
                }
                <tr className='bg-fondo-claro cursor-pointer h-[60px]'>
                  <td></td>
                  <td className=' text-left text-xl text-slate-500 font-comfortaa'>Total</td>
                  <td></td>
                  <td className=' text-center text-xl text-slate-500 font-comfortaa'>{reporteIndividualDocente.calificacion}</td>
                </tr>
              </tbody>
            </table>
            <div className='my-10'>
              <h4 className='text-left text-xl text-slate-600 font-montserrat font-semibold'>Observaciones:</h4>
              <p className='text-left text-lg text-slate-500 font-montserrat ml-3'>{reporteIndividualDocente.observacion}</p>
            </div>
            {/* {
              reporteIndividualDocente.dni &&
              <ReporteDocentePdf reporteIndividualDocente={reporteIndividualDocente} />
            } */}
          </div>
          :
          null
      }
    </div>
  )
}

export default ReporteDocenteIndividual