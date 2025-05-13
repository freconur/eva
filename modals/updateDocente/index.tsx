import { User } from '@/features/types/types';
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom';
import { regionTexto, gradosDeColegio, sectionByGrade,genero,area } from '@/fuctions/regiones';
import styles from './styles.module.css';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular';
import { distritosPuno } from '@/fuctions/provinciasPuno';

interface Props {
  dataDocente: User;
  onClose: () => void;
}

interface UserWithCaracteristica extends User {
  caracteristicaCurricular?: string;
  grados?: number[];
  secciones?: number[];
  area?: number;
  distrito?: string;
}

const UpdateDataDocente = ({ dataDocente, onClose }: Props) => {
  const [formData, setFormData] = useState<UserWithCaracteristica>({
    ...dataDocente,
    grados: Array.isArray(dataDocente.grados) ? dataDocente.grados : [],
    secciones: Array.isArray(dataDocente.secciones) ? dataDocente.secciones : []
  });

  const [distritosDisponibles, setDistritosDisponibles] = useState<string[]>([]);

  useEffect(() => {
    const provinciaEncontrada = distritosPuno.find(p => p.id === Number(formData.region));
    if (provinciaEncontrada) {
      setDistritosDisponibles(provinciaEncontrada.distritos);
    } else {
      setDistritosDisponibles([]);
    }
  }, [formData.region]);

  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }

  const { caracteristicaCurricular } = useGlobalContext();
  const { getCaracteristicasCurricular, updateDocenteParaCoberturaCurricular } = useEvaluacionCurricular();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    const numericValue = Number(value);
    
    setFormData(prev => {
      const currentArray = prev[name as keyof UserWithCaracteristica] as number[] || [];
      const newArray = checked
        ? [...currentArray, numericValue]
        : currentArray.filter(item => item !== numericValue);
      
      return {
        ...prev,
        [name]: newArray
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('formData',formData);
    updateDocenteParaCoberturaCurricular(`${dataDocente.dni}`, formData, dataDocente);
    onClose();
  };
  console.log('dataDocente',dataDocente)
  useEffect(() => {
    getCaracteristicasCurricular();
  }, []);
  return container ? createPortal(
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Actualizar Datos</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.closeIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombres</label>
              <input
                type="text"
                name="nombres"
                value={formData.nombres || ''}
                onChange={handleChange}
                className={styles.input}
                placeholder="Ingrese los nombres"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Apellidos</label>
              <input
                type="text"
                name="apellidos"
                value={formData.apellidos || ''}
                onChange={handleChange}
                className={styles.input}
                placeholder="Ingrese los apellidos"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>DNI</label>
              <input
                type="text"
                name="dni"
                disabled
                value={formData.dni || ''}
                onChange={handleChange}
                className={styles.input}
                placeholder="Ingrese el DNI"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Institución</label>
              <input
                type="text"
                name="institucion"
                value={formData.institucion || ''}
                onChange={handleChange}
                className={styles.input}
                placeholder="Ingrese la institución"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Región</label>
              <input
                type="text"
                value={regionTexto(`${formData.region}`)}
                disabled
                className={`${styles.input} ${styles.inputDisabled}`}
              />
            </div>
            {distritosDisponibles.length > 0 && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Distrito</label>
                <select
                  name="distrito"
                  value={formData.distrito || ''}
                  onChange={handleChange}
                  className={styles.input}
                >
                  <option value="">Seleccione un distrito</option>
                  {distritosDisponibles.map((distrito) => (
                    <option key={distrito} value={distrito}>
                      {distrito}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className={styles.formGroup}>
              <label className={styles.label}>Área</label>
              <div className={styles.radioGroup}>
                {area.map((item) => (
                  <label key={item.id} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="area"
                      value={item.id}
                      checked={`${formData.area}` === `${item.id}`}
                      onChange={handleChange}
                      className={styles.radio}
                    />
                    {item.name}
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Género</label>
              <div className={styles.radioGroup}>
                {genero.map((item) => (
                  <label key={item.id} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="genero"
                      value={item.id}
                      checked={formData.genero === `${item.id}`}
                      onChange={handleChange}
                      className={styles.radio}
                    />
                    {item.name}
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Celular</label>
              <input
                type="number"
                name="celular"
                value={formData.celular || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 9) {
                    handleChange(e);
                  }
                }}
                className={styles.input}
                placeholder="Ingrese el número de celular"
                maxLength={9}
                minLength={9}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Característica Curricular</label>
              <select
                name="caracteristicaCurricular"
                value={formData.caracteristicaCurricular || ''}
                onChange={handleChange}
                className={styles.input}
              >
                <option key={0} value={0}>Seleccione una característica</option>
                {caracteristicaCurricular?.map((item, index) => (
                  <option key={index+1} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Grados</label>
              <div className={styles.checkboxGroup}>
                {gradosDeColegio.map((grado) => (
                  <label key={grado.id} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="grados"
                      value={grado.id}
                      checked={formData.grados?.includes(grado.id)}
                      onChange={handleCheckboxChange}
                      className={styles.checkbox}
                    />
                    {grado.name}
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Secciones</label>
              <div className={styles.checkboxGroup}>
                {sectionByGrade.map((seccion) => (
                  <label key={seccion.id} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="secciones"
                      value={seccion.id}
                      checked={formData.secciones?.includes(seccion.id)}
                      onChange={handleCheckboxChange}
                      className={styles.checkbox}
                    />
                    {seccion.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.formFooter}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.button} ${styles.cancelButton}`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.submitButton}`}
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>,
    container
  ) : null;
}

export default UpdateDataDocente;