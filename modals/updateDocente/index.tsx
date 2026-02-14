import { User } from '@/features/types/types';
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom';
import { regionTexto, gradosDeColegio, sectionByGrade, genero, area, nivelInstitucion } from '@/fuctions/regiones';
import styles from './styles.module.css';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular';
import { distritosPuno } from '@/fuctions/provinciasPuno';
import { useOptions } from '@/features/hooks/useOptions';
interface Props {
  dataDocente: User;
  onClose: () => void;
}

interface UserWithCaracteristica extends Omit<User, 'nivelDeInstitucion'> {
  caracteristicaCurricular?: string;
  grados?: number[];
  secciones?: number[];
  area?: number;
  distrito?: string;
  nivelDeInstitucion?: number[];
}

const UpdateDataDocente = ({ dataDocente, onClose }: Props) => {
  // Inicializar nivelDeInstitucion basado en dataDocente.nivel
  const getInitialNivelInstitucion = (): number[] => {
    // Si existe dataDocente.nivelDeInstitucion como array
    if (dataDocente.nivelDeInstitucion && Array.isArray(dataDocente.nivelDeInstitucion)) {
      return dataDocente.nivelDeInstitucion;
    }
    // Si existe dataDocente.nivelDeInstitucion como número único (legacy)
    if (dataDocente.nivelDeInstitucion !== undefined && typeof dataDocente.nivelDeInstitucion === 'number') {
      return [dataDocente.nivelDeInstitucion];
    }
    // Si existe dataDocente.nivel (número único)
    if (dataDocente.nivel !== undefined && dataDocente.nivel !== null) {
      return [dataDocente.nivel];
    }
    return [];
  };

  const [formData, setFormData] = useState<UserWithCaracteristica>({
    ...dataDocente,
    grados: Array.isArray(dataDocente.grados) ? dataDocente.grados : [],
    secciones: Array.isArray(dataDocente.secciones) ? dataDocente.secciones : [],
    nivelDeInstitucion: getInitialNivelInstitucion()
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

  const { updateDocenteParaCoberturaCurricular } = useEvaluacionCurricular();
  const { getCaracteristicaCurricular, caracteristicaCurricular } = useOptions();
  const { currentUserData } = useGlobalContext();

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

      let updatedData = {
        ...prev,
        [name]: newArray
      };

      // Cascada de limpieza
      if (name === 'nivelDeInstitucion') {
        if (newArray.length === 0) {
          updatedData.grados = [];
          updatedData.secciones = [];
        } else {
          // Filtrar grados que ya no corresponden a los niveles seleccionados
          updatedData.grados = (prev.grados || []).filter(gradoId => {
            const gradoObj = gradosDeColegio.find(g => g.id === gradoId);
            if (!gradoObj) return false;
            const isPrimary = Number(gradoObj.nivel) === 1 || (Number(gradoObj.id) >= 1 && Number(gradoObj.id) <= 6);
            const isSecondary = Number(gradoObj.nivel) === 2 || (Number(gradoObj.id) >= 7 && Number(gradoObj.id) <= 11);
            if (newArray.includes(1) && isPrimary) return true;
            if (newArray.includes(2) && isSecondary) return true;
            return false;
          });
        }
      }

      if (name === 'grados') {
        if (newArray.length === 0) {
          updatedData.secciones = [];
        }
      }

      return updatedData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('formData', formData);
    // Convertir nivelDeInstitucion de number a number[] para cumplir con el tipo User
    const dataToSubmit: User = {
      ...formData,
      area: currentUserData?.area,
      distrito: currentUserData?.distrito,
      nivel: (formData.nivelDeInstitucion && formData.nivelDeInstitucion.length > 0)
        ? formData.nivelDeInstitucion[0]
        : undefined,
      nivelDeInstitucion: formData.nivelDeInstitucion
    };
    console.log('dataToSubmit', dataToSubmit)
    updateDocenteParaCoberturaCurricular(`${dataDocente.dni}`, dataToSubmit, dataDocente);
    onClose();
  };
  console.log('dataDocente', dataDocente)
  console.log('caracteristicaCurricular', caracteristicaCurricular)
  useEffect(() => {
    getCaracteristicaCurricular();
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
            {/* Area is inherited from director */}
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
              <label className={styles.label}>Nivel de Institución</label>
              <div className={styles.chipGroup}>
                {nivelInstitucion
                  .filter(nivel => currentUserData.nivelDeInstitucion?.includes(nivel.id))
                  .map((nivel) => (
                    <label key={nivel.id} className={styles.chip}>
                      <input
                        type="checkbox"
                        name="nivelDeInstitucion"
                        value={nivel.id}
                        checked={formData.nivelDeInstitucion?.includes(nivel.id)}
                        onChange={handleCheckboxChange}
                        disabled={nivel.id === 0}
                        className={styles.chipInput}
                      />
                      <span className={styles.chipLabel}>{nivel.name.charAt(0).toUpperCase() + nivel.name.slice(1)}</span>
                    </label>
                  ))}
              </div>
            </div>
            {formData.rol !== 2 && (
              <>
                {formData.nivelDeInstitucion && formData.nivelDeInstitucion.length > 0 && (
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>Grados</label>
                    <div className={styles.chipGroup}>
                      {gradosDeColegio
                        .filter((grado) => {
                          const isPrimary = Number(grado.nivel) === 1 || (Number(grado.id) >= 1 && Number(grado.id) <= 6);
                          const isSecondary = Number(grado.nivel) === 2 || (Number(grado.id) >= 7 && Number(grado.id) <= 11);
                          if (formData.nivelDeInstitucion?.includes(1) && isPrimary) return true;
                          if (formData.nivelDeInstitucion?.includes(2) && isSecondary) return true;
                          return false;
                        })
                        .map((grado, index) => (
                          <label key={index + 1} className={styles.chip}>
                            <input
                              type="checkbox"
                              name="grados"
                              value={grado.id}
                              checked={formData.grados?.includes(grado.id)}
                              onChange={handleCheckboxChange}
                              className={styles.chipInput}
                            />
                            <span className={styles.chipLabel}>{grado.name}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}

                {formData.grados && formData.grados.length > 0 && (
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>Secciones</label>
                    <div className={styles.chipGroup}>
                      {sectionByGrade.map((seccion) => (
                        <label key={seccion.id} className={styles.chip}>
                          <input
                            type="checkbox"
                            name="secciones"
                            value={seccion.id}
                            checked={formData.secciones?.includes(seccion.id)}
                            onChange={handleCheckboxChange}
                            className={styles.chipInput}
                          />
                          <span className={styles.chipLabel}>{seccion.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
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