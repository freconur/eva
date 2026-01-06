import { Estudiante } from "../types/types"
import { functions, FUNCTIONS_TIMEOUT } from "@/firebase/firebase.config"
import { useState } from "react"
import { httpsCallable } from "firebase/functions"
import { currentYear } from "@/fuctions/dates"
import { collection, getDocs, getFirestore } from "firebase/firestore"

export const useExportExcel = () => {
    const db = getFirestore()
    const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const exportEstudiantesToExcel = async (idEvaluacion: string, month: number, yearSelected: number) => {
        setLoading(true)
        setError(null)

        try {
            console.log('📞 Llamando a traerTodosEstudiantesEvaluados con:', { idEvaluacion, month, yearSelected })

            // Crear la función callable con timeout personalizado
            const traerEstudiantesFunction = httpsCallable(
                functions,
                'traerTodosEstudiantesEvaluados',
                {
                    timeout: FUNCTIONS_TIMEOUT // 9.5 minutos
                }
            )

            // Llamar a la Cloud Function
            const resultado = await traerEstudiantesFunction({ idEvaluacion, month, yearSelected })

            // El resultado viene en data
            const data = resultado.data as any
            return data.excelUrl

        } catch (error: any) {
            const errorMessage = error.message || 'Error desconocido al obtener estudiantes'
            setError(errorMessage)
            console.error('❌ Error al obtener estudiantes:', error)
            throw new Error(errorMessage)
        } finally {
            setLoading(false)
        }
    }


    const exportEstudiantesParaExcelFronted = async (idEvaluacion: string, month: number) => {
        setLoading(true)
        setError(null)

        try {
            // Validación de parámetros
            if (!idEvaluacion || !idEvaluacion.trim()) {
                throw new Error('El ID de evaluación es requerido')
            }
            if (!month || month < 1 || month > 12) {
                throw new Error('El mes debe ser un número entre 1 y 12')
            }

            const path = `/evaluaciones/${idEvaluacion}/estudiantes-evaluados/${currentYear}/${month}`
            const estudiantesRef = collection(db, path)

            const estudiantesPad = await getDocs(estudiantesRef)
            const todosLosEstudiantes: Estudiante[] = []

            estudiantesPad.forEach((alumno) => {
                const estudianteData = alumno.data() as Estudiante
                todosLosEstudiantes.push(estudianteData)
            })

            setEstudiantes(todosLosEstudiantes)
            console.log('✅ Estudiantes obtenidos:', todosLosEstudiantes)

            return todosLosEstudiantes
        } catch (error: any) {
            const errorMessage = error.message || 'Error desconocido al obtener estudiantes'
            setError(errorMessage)
            console.error('❌ Error al obtener estudiantes:', error)
            throw new Error(errorMessage)
        } finally {
            setLoading(false)
        }
    }
    return {
        exportEstudiantesParaExcelFronted,
        exportEstudiantesToExcel,
        estudiantes,
        loading,
        error
    }
}