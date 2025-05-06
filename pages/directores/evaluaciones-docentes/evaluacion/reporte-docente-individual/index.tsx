// import { ReporteDocentePdf } from '@/components/invoce'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import UseEvaluacionDocentes from '@/features/hooks/UseEvaluacionDocentes'
import { AlternativasDocente, ObservacionMonitoreoDocente } from '@/features/types/types'
import { regionTexto } from '@/fuctions/regiones'
import { useRouter } from 'next/router'
import React, { useEffect, useRef, useState } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import styles from './reporteDocente.module.css'

const ReporteDocenteIndividual = () => {

  const route = useRouter()
  const { buscarDocenteReporteDeEvaluacion, guardarObservacionDocente } = UseEvaluacionDocentes()
  const { reporteIndividualDocente, currentUserData } = useGlobalContext()
  const [formData, setFormData] = useState<ObservacionMonitoreoDocente>({
    fortalezasObservadas: '',
    oportunidadesDeMejora: '',
    acuerdosYCompomisos: '',
  })
  const printRef = useRef(null)

  const handleDownloadPdf = async () => {
    const element = printRef.current

    if (!element) {
      return;
    }
    const canvas = await html2canvas(element, { scale: 2 })
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
    if (reporteIndividualDocente.observacionesMonitoreo) {
      setFormData({
        fortalezasObservadas: reporteIndividualDocente.observacionesMonitoreo.fortalezasObservadas || '',
        oportunidadesDeMejora: reporteIndividualDocente.observacionesMonitoreo.oportunidadesDeMejora || '',
        acuerdosYCompomisos: reporteIndividualDocente.observacionesMonitoreo.acuerdosYCompomisos || '',
      })
    }
  }, [reporteIndividualDocente.observacionesMonitoreo])
  useEffect(() => {
    if (route.query.idEvaluacion && route.query.idDocente)
      buscarDocenteReporteDeEvaluacion(`${route.query.idEvaluacion}`, `${route.query.idDocente}`)
  }, [`${route.query.idEvaluacion}`, `${route.query.idDocente}`, currentUserData.dni])
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    guardarObservacionDocente(`${route.query.idEvaluacion}`, formData, reporteIndividualDocente)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }
  return (
    <div className={styles.container}>
      <button onClick={handleDownloadPdf} className={styles.downloadButton}>descargar pdf</button>
      {
        reporteIndividualDocente?.dni ?
          <div ref={printRef} className={styles.reporteContainer}>
            <div className={styles.title}>
              <h3>Resultado de Evaluación de desempeño del docente</h3>
            </div>
            <div className={styles.infoSection}>
              <h4>Profesor: <strong>{reporteIndividualDocente.info?.nombres} {reporteIndividualDocente.info?.apellidos}</strong></h4>
              <h4>Institución: <strong>{reporteIndividualDocente.info?.institucion}</strong></h4>
              <h4>Región: <strong>{regionTexto(`${reporteIndividualDocente.info?.region}`)}</strong></h4>
              <h4>Rol: <strong>{reporteIndividualDocente.info?.perfil?.nombre}</strong></h4>
            </div>

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
                        <td className={styles.tableCell}>{index + 1}</td>
                        <td className={styles.tableCellLeft}>{al.criterio}</td>
                        <td className={styles.tableCell}>Nivel {al.alternativas && al.alternativas[index + 1]?.value}</td>
                        <td className={styles.tableCell}>{al.alternativas && al.alternativas[index + 1]?.value}</td>
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
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="fortalezasObservadas" className={styles.formLabel}>
                  Fortalezas observadas:
                </label>
                <input
                  type="text"
                  id="fortalezasObservadas"
                  name="fortalezasObservadas"
                  value={formData.fortalezasObservadas}
                  onChange={handleChange}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="oportunidadesDeMejora" className={styles.formLabel}>
                  Oportunidades de mejora(dificultades):
                </label>
                <input
                  type="text"
                  id="oportunidadesDeMejora"
                  name="oportunidadesDeMejora"
                  value={formData.oportunidadesDeMejora}
                  onChange={handleChange}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="acuerdosYCompomisos" className={styles.formLabel}>
                  Acuerdos y compromisos:
                </label>
                <input
                  type="text"
                  id="acuerdosYCompomisos"
                  name="acuerdosYCompomisos"
                  value={formData.acuerdosYCompomisos}
                  onChange={handleChange}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <button type="submit" className={styles.submitButton}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
          :
          null
      }
    </div>
  )
}

export default ReporteDocenteIndividual