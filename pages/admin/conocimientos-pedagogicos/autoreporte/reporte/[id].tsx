import { useTituloDeCabecera } from '@/features/hooks/useTituloDeCabecera'
import { useColumnView } from '@/features/hooks/useColumnView'
import { useRouter } from 'next/router'
import React, { useEffect, useState, useMemo } from 'react'
import styles from './reporte.module.css'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { PreguntasEvaluacionLikertConResultado, EscalaLikert } from '@/features/types/types'

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const ReporteAutorreporte = () => {
  const route = useRouter()
  const {id} = route.query
  const { columnView, setColumnView1, setColumnView2, setColumnView3, is1Column, is2Columns, is3Columns } = useColumnView('2-columns')
  const [animationKey, setAnimationKey] = useState(0)
  
  
  const handleColumnChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as '1-column' | '2-columns' | '3-columns'
    
    // Forzar re-renderización para activar la animación
    setAnimationKey(prev => prev + 1)
    
    if (value === '1-column') {
      setColumnView1()
    } else if (value === '2-columns') {
      setColumnView2()
    } else {
      setColumnView3()
    }
  }
  
  const { 
    getEvaluacionesEscalaLikert,
    getEvaluacionEscalaLikert,
    getPreguntasEvaluacionEscalaLikert,
    preguntasEscalaLikert,
    evaluacionEscalaLikert,
    evaluacionesEscalaLikertUsuarios,
    acumuladoDeDatosLikertParaGraficos 
  } = useTituloDeCabecera()

  
  
  // Función para procesar los datos del gráfico para una pregunta específica
  const procesarDatosParaPregunta = (pregunta: PreguntasEvaluacionLikertConResultado) => {
    if (!pregunta.resultado || pregunta.resultado.length === 0) {
      return {
        labels: [],
        datasets: []
      }
    }

    // Obtener los valores de la escala Likert para esta pregunta
    const labels = pregunta.resultado.map((item: EscalaLikert) => item.name || `Valor ${item.value}`)
    const data = pregunta.resultado.map((item: EscalaLikert) => item.total || 0)
    
    // Generar colores con gradiente para cada barra
    const colors = [
      'rgba(102, 126, 234, 0.8)',   // Azul
      'rgba(118, 75, 162, 0.8)',    // Púrpura
      'rgba(240, 147, 251, 0.8)',   // Rosa
      'rgba(255, 159, 64, 0.8)',    // Naranja
      'rgba(75, 192, 192, 0.8)',    // Turquesa
      'rgba(255, 99, 132, 0.8)',    // Rojo
      'rgba(54, 162, 235, 0.8)',    // Azul claro
      'rgba(153, 102, 255, 0.8)',   // Violeta
    ]

    const borderColors = [
      'rgba(102, 126, 234, 1)',
      'rgba(118, 75, 162, 1)',
      'rgba(240, 147, 251, 1)',
      'rgba(255, 159, 64, 1)',
      'rgba(75, 192, 192, 1)',
      'rgba(255, 99, 132, 1)',
      'rgba(54, 162, 235, 1)',
      'rgba(153, 102, 255, 1)',
    ]

    const backgroundColor = pregunta.resultado.map((_, index: number) => 
      colors[index % colors.length]
    )
    
    const borderColor = pregunta.resultado.map((_, index: number) => 
      borderColors[index % borderColors.length]
    )

    return {
      labels: labels,
      datasets: [{
        label: 'Respuestas',
        data: data,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        borderWidth: 2,
        hoverBackgroundColor: backgroundColor.map(color => 
          color.replace('0.8', '0.9')
        ),
        hoverBorderColor: borderColor,
        hoverBorderWidth: 3,
      }]
    }
  }
  
  // Opciones del gráfico para cada pregunta
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    plugins: {
      legend: {
        display: false, // Ocultar leyenda ya que solo hay un dataset
      },
      title: {
        display: false, // El título se mostrará en el componente
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#667eea',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        titleFont: {
          size: 13,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 12
        },
        padding: 12,
        callbacks: {
          title: function(context: any) {
            return 'Nivel: ' + context[0].label;
          },
          label: function(context: any) {
            return 'Respuestas: ' + context.parsed.y;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Niveles de Escala',
          font: {
            size: 13,
            weight: 'bold' as const
          },
          color: '#2c3e50'
        },
        ticks: {
          font: {
            size: 11,
            weight: 500
          },
          color: '#5a6c7d',
          maxRotation: 45,
          minRotation: 0
        },
        grid: {
          display: false
        },
        border: {
          display: true,
          color: '#e8ecf0'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Cantidad de Respuestas',
          font: {
            size: 13,
            weight: 'bold' as const
          },
          color: '#2c3e50'
        },
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 11,
            weight: 500
          },
          color: '#5a6c7d',
          callback: function(value: any) {
            return Number.isInteger(value) ? value : null;
          }
        },
        grid: {
          color: '#f1f3f4',
          lineWidth: 1,
          drawBorder: false
        },
        border: {
          display: true,
          color: '#e8ecf0'
        }
      }
    },
    elements: {
      bar: {
        borderRadius: 6,
        borderSkipped: false,
      }
    },
    animation: {
      duration: 800,
      easing: 'easeInOutQuart' as const
    }
  }
  
  useEffect(() => {
      getEvaluacionesEscalaLikert(`${id}`, evaluacionEscalaLikert)
      getEvaluacionEscalaLikert(`${id}`)
      getPreguntasEvaluacionEscalaLikert(`${id}`)
  }, [id, evaluacionEscalaLikert.mesDelExamen])
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Reporte de Autorreporte</h1>
        <p className={styles.subtitle}>
          Análisis de preguntas y respuestas de la evaluación
        </p>
      </div>
      
      {preguntasEscalaLikert.length > 0 ? (
        <>
          <div className={styles.columnControls}>
            <div className={styles.columnSelect}>
              <label htmlFor="column-select" className={styles.columnSelectLabel}>
                Vista de Columnas
              </label>
              <select
                id="column-select"
                className={styles.columnSelectElement}
                value={columnView}
                onChange={handleColumnChange}
              >
                <option value="1-column">1 Columna</option>
                <option value="2-columns">2 Columnas</option>
                <option value="3-columns">3 Columnas</option>
              </select>
            </div>
          </div>
          
          <div 
            key={animationKey}
            className={
              is1Column
                ? styles.questionsContainer1Column
                : is2Columns 
                  ? styles.questionsContainer2Columns 
                  : is3Columns 
                    ? styles.questionsContainer3Columns 
                    : styles.questionsContainer
            }
          >
            {acumuladoDeDatosLikertParaGraficos
              .sort((a, b) => (a.orden || 0) - (b.orden || 0))
              .map((pregunta, index) => {
                const chartData = procesarDatosParaPregunta(pregunta)
                return (
                  <div key={pregunta.id || index} className={styles.questionCard}>
                    <div className={styles.questionHeader}>
                      <div className={styles.questionNumber}>
                        Pregunta {index + 1}
                      </div>
                      
                      <div className={styles.questionId}>
                        ID: {pregunta.id}
                      </div>
                    </div>
                    
                    <p className={styles.questionText}>
                      {pregunta.pregunta}
                    </p>
                    
                    {/* Gráfico individual para esta pregunta */}
                    {chartData.labels.length > 0 && (
                      <div className={styles.questionChart}>
                        <div className={styles.chartTitle}>
                          Distribución de Respuestas
                        </div>
                        <div className={styles.chartWrapper}>
                          <Bar data={chartData} options={chartOptions} />
                        </div>
                      </div>
                    )}
                    
                    {pregunta.respuesta !== undefined && (
                      <div className={styles.response}>
                        <div className={styles.responseLabel}>Respuesta</div>
                        <div className={styles.responseValue}>{pregunta.respuesta}</div>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>📝</div>
          <p className={styles.emptyStateText}>
            No hay preguntas disponibles para mostrar
          </p>
        </div>
      )}
    </div>
  )
}

export default ReporteAutorreporte