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
import DatosInstitucion from '@/components/curricular/datos-institucion'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'
import DatosMonitor from '@/components/curricular/datos-monitor'
import AnexosCurricular from '@/modals/mallaCurricular/anexos'
import AnexosSeguimientoRetroalimentacion from '@/modals/anexosSeguimientoRetroalimentacion'
import styles from './reporteEspecialista.module.css'

const ReporteDocenteIndividual = () => {

  const route = useRouter()
  const { buscarEspecialistaReporteDeEvaluacion } = UseEvaluacionEspecialistas()
  const {  getDocente} = useEvaluacionCurricular()
  const { reporteIndividualDocente, currentUserData,dataDocente } = useGlobalContext()

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
    getDocente(`${route.query.idDirector}`)
    /* getEvaluacionCurricular()
    getEvaluacionCurricularAlternativa() */
  }, [route.query.idDirector])
  useEffect(() => {
    if (route.query.idEvaluacion && route.query.idDirector)
      buscarEspecialistaReporteDeEvaluacion(`${route.query.idEvaluacion}`, `${route.query.idDirector}`)
  }, [`${route.query.idEvaluacion}`, `${route.query.idDirector}`, currentUserData.dni])
  return (
    <div className={styles.container}>
      
      <button onClick={handleDownloadPdf} className={styles.downloadButton}>descargar pdf</button>
      {
        reporteIndividualDocente?.dni ?
          <div ref={printRef} className={styles.reporteContainer}>

            <div className={styles.title}>
              <h3>RÚBRICA DE MONITOREO DE SEGUIMIENTO Y RETROALIMENTACIÓN (DEL ESPECIALISTA DE DREP AL ESPECIALISTA DE UGEL)</h3>
            </div>
            <DatosInstitucion dataDocente={dataDocente}/>
            <DatosMonitor dataMonitor={currentUserData}/>

            <div className={styles.sectionTitle}>
              <h5>Detalle de evaluación y calificación</h5>
            </div>
            <table className={styles.table}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th>#</th>
                  <th>Criterio</th>
                  <th>Nivel</th>
                  <th>Puntaje</th>
                </tr>
              </thead>
              <tbody>
              {
                  reporteIndividualDocente.resultados?.map((al, index) => {
                    return (
                      <tr key={index} className={styles.tableRow}>
                        <td className={styles.tableCell}>{al.subOrden || al.order}</td>
                        <td className={styles.tableCellLeft}>{al.criterio}</td>
                        <td className={styles.tableCell}>{al.alternativas?.map(select => select.selected ? select.value : null).filter(Boolean)[0]}</td>
                        <td className={styles.tableCell}>{al.alternativas?.map(select => select.selected ? select.value : null).filter(Boolean)[0]}</td>
                      </tr>
                    )
                  })
                }
                <tr className={styles.totalRow}>
                  <td></td>
                  <td className={styles.tableCellLeft}>Total</td>
                  <td></td>
                  <td className={styles.tableCell}>{reporteIndividualDocente.calificacion}</td>
                </tr>
              </tbody>
            </table>
            <AnexosSeguimientoRetroalimentacion dataDocente={dataDocente}/>
          </div>
          :
          null
      }
    </div>
  )
}

export default ReporteDocenteIndividual