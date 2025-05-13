// import { ReporteDocentePdf } from '@/components/invoce'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import UseEvaluacionDocentes from '@/features/hooks/UseEvaluacionDocentes'
import { AlternativasDocente, ObservacionMonitoreoDocente, User } from '@/features/types/types'
import { regionTexto } from '@/fuctions/regiones'
import { useRouter } from 'next/router'
import React, { useEffect, useRef, useState } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import styles from './reporteDocente.module.css'
import DatosInstitucion from '@/components/curricular/datos-institucion'
import DatosMonitor from '@/components/curricular/datos-monitor'
import AnexosSeguimientoRetroalimentacion from '@/modals/anexosSeguimientoRetroalimentacion'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'

const ReporteDocenteIndividual = () => {

  const route = useRouter()
  const { buscarDocenteReporteDeEvaluacion, guardarObservacionDocente } = UseEvaluacionDocentes()
  const {  getDocente} = useEvaluacionCurricular()
  const { reporteIndividualDocente, currentUserData, dataDocente } = useGlobalContext()
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

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "A4"
    });

    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20; // margen en píxeles

    const canvas = await html2canvas(element, { 
      scale: 2,
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth - (2 * margin);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = margin;
    let page = 1;

    // Primera página
    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
    heightLeft -= pageHeight - (2 * margin);

    // Páginas adicionales si es necesario
    while (heightLeft > 0) {
      pdf.addPage();
      // Calculamos la posición Y para la siguiente página
      const yPosition = margin - (pageHeight - (2 * margin)) * page;
      pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
      heightLeft -= pageHeight - (2 * margin);
      page++;
    }

    pdf.save('docente_resultado.pdf');
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
  useEffect(() => {
    getDocente(`${route.query.idDocente}`)
  },[route.query.idDocente])

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
              <h3>Rúbrica de la mediacion didáctica de la resolución de problemas</h3>
              <h2 className="text-3xl text-slate-500">(Director evalúa al docente)</h2>
            </div>
            <DatosInstitucion dataDocente={dataDocente}/>
            <DatosMonitor dataMonitor={currentUserData}/>
            {/* <div className={styles.infoSection}>
              <h4>Profesor: <strong>{reporteIndividualDocente.info?.nombres} {reporteIndividualDocente.info?.apellidos}</strong></h4>
              <h4>Institución: <strong>{reporteIndividualDocente.info?.institucion}</strong></h4>
              <h4>Región: <strong>{regionTexto(`${reporteIndividualDocente.info?.region}`)}</strong></h4>
              <h4>Rol: <strong>{reporteIndividualDocente.info?.perfil?.nombre}</strong></h4>
            </div> */}

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