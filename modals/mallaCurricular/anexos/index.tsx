import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import styles from './anexos.module.css'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular';
import { User } from '@/features/types/types';

interface FormData {
  fortalezasObservadas: string;
  oportunidadesDeMejora: string;
  acuerdosYCompomisos: string;
}

interface Props {
  dataDocente: User
}

const AnexosCurricular = ({ dataDocente }: Props) => {
  const [formData, setFormData] = useState<FormData>({
    fortalezasObservadas: '',
    oportunidadesDeMejora: '',
    acuerdosYCompomisos: ''
  });

  const { guardarAnexosCurricular } = useEvaluacionCurricular()

  useEffect(() => {
    if (dataDocente.observacionCurricular) {
      setFormData({
        fortalezasObservadas: dataDocente.observacionCurricular.fortalezasObservadas || '',
        oportunidadesDeMejora: dataDocente.observacionCurricular.oportunidadesDeMejora || '',
        acuerdosYCompomisos: dataDocente.observacionCurricular.acuerdosYCompomisos || ''
      });
    }
  }, [dataDocente.observacionCurricular]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await guardarAnexosCurricular(dataDocente, formData);
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
            Fortalezas observadas
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
            Oportunidades de mejora
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
            Acuerdos y compromisos
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
        <button type="submit" className={styles.button}>
          Guardar
        </button>
      </form>
    </div>
  )
}

export default AnexosCurricular