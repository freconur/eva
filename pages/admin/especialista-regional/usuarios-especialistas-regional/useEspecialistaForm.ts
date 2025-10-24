import { useState } from 'react'

export interface EspecialistaData {
  dni: string
  nombres: string
  apellidos: string
}

interface UseEspecialistaFormProps {
  onSubmit: (data: EspecialistaData) => Promise<void>
  onClose: () => void
  onSuccess?: () => void
  onError?: (error: Error) => void
  setExternalWarningMessage?: (message: string) => void
}

export const useEspecialistaForm = ({ onSubmit, onClose, onSuccess, onError, setExternalWarningMessage }: UseEspecialistaFormProps) => {
  const [formData, setFormData] = useState<EspecialistaData>({
    dni: '',
    nombres: '',
    apellidos: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')

  // Función para limpiar texto de nombres y apellidos
  const cleanTextInput = (text: string): string => {
    return text
      .trim() // Eliminar espacios al inicio y final
      .replace(/\s+/g, ' ') // Reemplazar múltiples espacios con uno solo
      .replace(/[^\w\sáéíóúñüÁÉÍÓÚÑÜ]/g, '') // Eliminar caracteres especiales excepto letras y espacios
      .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalizar primera letra de cada palabra
  }

  // Función para validar y generar mensajes de advertencia
  const validateAndSetWarning = (data: EspecialistaData) => {
    const warnings: string[] = []
    
    // Validar DNI
    if (data.dni.length > 0 && data.dni.length < 8) {
      warnings.push('El DNI debe tener exactamente 8 dígitos')
    }
    
    // Validar nombres
    if (data.nombres.length > 0 && data.nombres.length < 2) {
      warnings.push('Los nombres deben tener al menos 2 caracteres')
    }
    
    // Validar apellidos
    if (data.apellidos.length > 0 && data.apellidos.length < 2) {
      warnings.push('Los apellidos deben tener al menos 2 caracteres')
    }
    
    // Validar que no contenga solo espacios
    if (data.nombres.trim().length === 0 && data.nombres.length > 0) {
      warnings.push('Los nombres no pueden contener solo espacios')
    }
    
    if (data.apellidos.trim().length === 0 && data.apellidos.length > 0) {
      warnings.push('Los apellidos no pueden contener solo espacios')
    }
    
    // Validar caracteres especiales en nombres y apellidos
    const hasSpecialChars = /[^a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s]/.test(data.nombres) || 
                           /[^a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s]/.test(data.apellidos)
    if (hasSpecialChars) {
      warnings.push('Los nombres y apellidos solo pueden contener letras y espacios')
    }
    
    setWarningMessage(warnings.join('. ') || '')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // Si es el campo DNI, solo permitir números y máximo 8 dígitos
    if (name === 'dni') {
      const numericValue = value.replace(/[^0-9]/g, '')
      // Limitar a máximo 8 dígitos
      const limitedValue = numericValue.slice(0, 8)
      const newFormData = {
        ...formData,
        [name]: limitedValue
      }
      setFormData(newFormData)
      validateAndSetWarning(newFormData)
    } 
    // Para otros campos, permitir escritura normal
    else {
      const newFormData = {
        ...formData,
        [name]: value
      }
      setFormData(newFormData)
      validateAndSetWarning(newFormData)
    }
  }

  // Función para limpiar texto cuando el campo pierde el foco
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === 'nombres' || name === 'apellidos') {
      const cleanedValue = cleanTextInput(value)
      const newFormData = {
        ...formData,
        [name]: cleanedValue
      }
      setFormData(newFormData)
      validateAndSetWarning(newFormData)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Validar que el DNI tenga exactamente 8 dígitos
      if (formData.dni.length !== 8) {
        alert('El DNI debe tener exactamente 8 dígitos')
        setIsLoading(false)
        return
      }
      
      // Limpiar datos antes de enviar
      const cleanedData: EspecialistaData = {
        dni: formData.dni.trim(),
        nombres: cleanTextInput(formData.nombres),
        apellidos: cleanTextInput(formData.apellidos)
      }
      
      // Ejecutar la función onSubmit del componente padre
      await onSubmit(cleanedData)
      
      // Ejecutar callback de éxito si existe
      if (onSuccess) {
        onSuccess()
      }
      
      // Resetear formulario después del éxito
      resetForm()
      // Limpiar también el mensaje externo si existe
      if (setExternalWarningMessage) {
        setExternalWarningMessage('')
      }
      onClose()
    } catch (error) {
      console.error('Error al crear especialista:', error)
      
      // Ejecutar callback de error si existe
      if (onError) {
        onError(error as Error)
      }
      
      // El error se maneja en el componente padre
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    resetForm()
    // Limpiar también el mensaje externo si existe
    if (setExternalWarningMessage) {
      setExternalWarningMessage('')
    }
    onClose()
  }

  const resetForm = () => {
    setFormData({ dni: '', nombres: '', apellidos: '' })
    setWarningMessage('')
  }

  return {
    formData,
    isLoading,
    warningMessage,
    handleInputChange,
    handleBlur,
    handleSubmit,
    handleCancel
  }
}
