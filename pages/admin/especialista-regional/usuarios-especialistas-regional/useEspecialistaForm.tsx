import { useState } from 'react'

export interface EspecialistaData {
  dni: string
  nombres: string
  apellidos: string
}

interface UseEspecialistaFormProps {
  onSubmit: (data: EspecialistaData) => Promise<void>
  onClose: () => void
}

export const useEspecialistaForm = ({ onSubmit, onClose }: UseEspecialistaFormProps) => {
  const [formData, setFormData] = useState<EspecialistaData>({
    dni: '',
    nombres: '',
    apellidos: ''
  })
  
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Validación especial para DNI (solo números)
    if (name === 'dni') {
      const numericValue = value.replace(/\D/g, '') // Solo números
      if (numericValue.length <= 8) {
        setFormData(prev => ({
          ...prev,
          [name]: numericValue
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Capitalizar nombres y apellidos
    if (name === 'nombres' || name === 'apellidos') {
      const capitalizedValue = value
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      setFormData(prev => ({
        ...prev,
        [name]: capitalizedValue
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones
    if (!formData.dni || formData.dni.length !== 8) {
      alert('El DNI debe contener exactamente 8 dígitos')
      return
    }
    
    if (!formData.nombres.trim()) {
      alert('Los nombres son obligatorios')
      return
    }
    
    if (!formData.apellidos.trim()) {
      alert('Los apellidos son obligatorios')
      return
    }

    setIsLoading(true)
    
    try {
      await onSubmit(formData)
      // Resetear formulario después del éxito
      setFormData({
        dni: '',
        nombres: '',
        apellidos: ''
      })
    } catch (error) {
      console.error('Error en el formulario:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (!isLoading) {
      // Resetear formulario
      setFormData({
        dni: '',
        nombres: '',
        apellidos: ''
      })
      onClose()
    }
  }

  return {
    formData,
    isLoading,
    handleInputChange,
    handleBlur,
    handleSubmit,
    handleCancel
  }
}
