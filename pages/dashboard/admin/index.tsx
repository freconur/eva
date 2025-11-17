import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'
import GraficosYTablas from '@/components/dashboard-admin/GraficosYTablas'
import FiltrosEvaluaciones from '@/components/dashboard-admin/FiltrosEvaluaciones'
import React, { useState, useEffect } from 'react'
import styles from './index.module.css'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useEvaluacionesDashboard } from '@/features/hooks/useEvaluacionesDashboard'

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface EvaluacionData {
  id: string
  nombre: string
  color: string
  datos: {
    mes: string
    valor: number
  }[]
}

const DashboardAdmin = () => { 
  const { getEvaluaciones } = useAgregarEvaluaciones()
  const { evaluaciones } = useGlobalContext()

  // Hook para manejar toda la lógica de evaluaciones
  const evaluacionesHook = useEvaluacionesDashboard({ evaluaciones })
  
  // Estado para el modo de comparación
  const [modoComparacion, setModoComparacion] = useState<'mes-a-mes' | 'evaluacion-a-evaluacion'>('mes-a-mes')
  
  // Estado para la vista de columnas
  const [vistaColumnas, setVistaColumnas] = useState<1 | 2 | 3>(2)
  
  // Estado para mostrar/ocultar filtros
  const [mostrarFiltros, setMostrarFiltros] = useState<boolean>(true)

  useEffect(() => {
    getEvaluaciones()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
console.log('evaluaciones', evaluaciones)
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Sección de Filtros */}
        <h1 className={styles.title}>Mi Dashboard</h1>
        <FiltrosEvaluaciones
          mostrarFiltros={mostrarFiltros}
          setMostrarFiltros={setMostrarFiltros}
          textoBusqueda={evaluacionesHook.textoBusqueda}
          setTextoBusqueda={evaluacionesHook.setTextoBusqueda}
          mostrarDropdown={evaluacionesHook.mostrarDropdown}
          setMostrarDropdown={evaluacionesHook.setMostrarDropdown}
          debeMostrarDropdown={evaluacionesHook.debeMostrarDropdown}
          evaluacionesParaDropdown={evaluacionesHook.evaluacionesParaDropdown}
          evaluacionesSeleccionadas={evaluacionesHook.evaluacionesSeleccionadas}
          handleSeleccionarEvaluacion={evaluacionesHook.handleSeleccionarEvaluacion}
          modoComparacion={modoComparacion}
          setModoComparacion={setModoComparacion}
          vistaColumnas={vistaColumnas}
          setVistaColumnas={setVistaColumnas}
          evaluacionesSeleccionadasParaMostrar={evaluacionesHook.evaluacionesSeleccionadasParaMostrar}
          coleccionesPorEvaluacion={evaluacionesHook.coleccionesPorEvaluacion}
          coleccionesSeleccionadas={evaluacionesHook.coleccionesSeleccionadas}
          dropdownColeccionesAbierto={evaluacionesHook.dropdownColeccionesAbierto}
          setDropdownColeccionesAbierto={evaluacionesHook.setDropdownColeccionesAbierto}
          loadingEvaluaciones={evaluacionesHook.loadingEvaluaciones}
          handleToggleEvaluacion={evaluacionesHook.handleToggleEvaluacion}
          handleToggleColeccion={evaluacionesHook.handleToggleColeccion}
        />

        {/* Contenido principal - Solo mostrar si hay evaluaciones seleccionadas con datos cargados */}
        {evaluacionesHook.debeMostrarGraficos ? (
          <GraficosYTablas
            evaluacionesSeleccionadasFiltradas={evaluacionesHook.evaluacionesSeleccionadasFiltradas}
            coleccionesPorEvaluacion={evaluacionesHook.coleccionesPorEvaluacion}
            coleccionesSeleccionadas={evaluacionesHook.coleccionesSeleccionadas}
            modoComparacion={modoComparacion}
            vistaColumnas={vistaColumnas}
          />
        ) : null}
      </div>
    </div>
  )
}

export default DashboardAdmin
DashboardAdmin.Auth = PrivateRouteAdmins
