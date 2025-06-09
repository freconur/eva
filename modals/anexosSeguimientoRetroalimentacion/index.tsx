import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import styles from './anexos.module.css'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular';
import { AnexosCurricularType, User } from '@/features/types/types';
import { nivelCobertura } from '@/fuctions/regiones';

interface FormData {
  fortalezasObservadas: string;
  oportunidadesDeMejora: string;
  acuerdosYCompomisos: string;
}

interface Props {
  dataDocente: User,
  idEvaluacion: string
}

const AnexosSeguimientoRetroalimentacion = ({ dataDocente, idEvaluacion }: Props) => {
  const [formData, setFormData] = useState<AnexosCurricularType>({
    fortalezasObservadas: '',
    oportunidadesDeMejora: '',
    acuerdosYCompomisos: '',
    nivelCobertura: {}
  });

  const { guardarAnexosSeguimientoRetroalimentacion } = useEvaluacionCurricular()

  const searchKey = () => {
    return dataDocente.observacionSeguimientoRetroalimentacion?.[idEvaluacion] as AnexosCurricularType | undefined
  }
  useEffect(() => {
    if (dataDocente.observacionSeguimientoRetroalimentacion) {
      
      setFormData({
        fortalezasObservadas: dataDocente.observacionSeguimientoRetroalimentacion?.[idEvaluacion]?.fortalezasObservadas || '',
        oportunidadesDeMejora: dataDocente.observacionSeguimientoRetroalimentacion?.[idEvaluacion]?.oportunidadesDeMejora || '',
        acuerdosYCompomisos: dataDocente.observacionSeguimientoRetroalimentacion?.[idEvaluacion]?.acuerdosYCompomisos || '',
        nivelCobertura: dataDocente.observacionSeguimientoRetroalimentacion?.[idEvaluacion]?.nivelCobertura || {}
      });
    }
  }, [dataDocente.observacionSeguimientoRetroalimentacion]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'nivelCobertura') {
      const updatedNivelCobertura = {
        ...nivelCobertura,
        alternativas: nivelCobertura.alternativas.map(alt => ({
          ...alt,
          selected: alt.alternativa === value
        }))
      };
      setFormData(prev => ({
        ...prev,
        nivelCobertura: {
          ...updatedNivelCobertura,
          id: updatedNivelCobertura.id?.toString() || ''
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      console.log('formData', formData)

      nivelCobertura.alternativas?.forEach(alternativa => {
        alternativa.alternativa ===  formData.nivelCobertura && (alternativa.selected = true)
      });
      await guardarAnexosSeguimientoRetroalimentacion(dataDocente, formData, idEvaluacion);
      toast.success('Los cambios se han guardado correctamente', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } catch (error) {
      toast.error('Hubo un error al guardar los cambios', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="fortalezasObservadas" className={styles.label}>
            Fortalezas observadas:
          </label>
          <input
            type="text"
            id="fortalezasObservadas"
            name="fortalezasObservadas"
            value={formData.fortalezasObservadas}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="oportunidadesDeMejora" className={styles.label}>
            Oportunidades de mejora(dificultades):
          </label>
          <input
            type="text"
            id="oportunidadesDeMejora"
            name="oportunidadesDeMejora"
            value={formData.oportunidadesDeMejora}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="acuerdosYCompomisos" className={styles.label}>
            Acuerdos y compromisos:
          </label>
          <input
            type="text"
            id="acuerdosYCompomisos"
            name="acuerdosYCompomisos"
            value={formData.acuerdosYCompomisos}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        {/* <div className={styles.formGroup}>
          <label htmlFor="nivelCobertura" className={styles.label}>
            C. Nivel de cobertura:
          </label>
          <div className={styles.radioGroup}>
            {nivelCobertura.alternativas.map((item) => (
              <div key={item.id} className={styles.radioItem}>
                <input
                  type="radio"
                  className={styles.radio}
                  id={`nivelCobertura-${item.id}`}
                  name="nivelCobertura"
                  value={item.alternativa}
                  checked={formData.nivelCobertura?.alternativas?.find(alternativa => alternativa.alternativa === item.alternativa)?.selected || false}
                  onChange={handleChange}
                />
                <label htmlFor={`nivelCobertura-${item.id}`}>{item.cobertura}</label>
              </div>
            ))}
          </div>
        </div> */}
        <div className={styles.formGroup}>
          <button type="submit" className={styles.button}>
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}

export default AnexosSeguimientoRetroalimentacion