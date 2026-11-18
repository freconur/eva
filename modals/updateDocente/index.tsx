import { User } from '@/features/types/types';
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom';
import { regionTexto, gradosDeColegio, sectionByGrade, genero, area, nivelInstitucion, tipoEspecialista } from '@/fuctions/regiones';
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
  tipoEspecialista?: number;
}

const UpdateDataDocente = ({ dataDocente, onClose }: Props) => {
  // Inicializar nivelDeInstitucion unificando nivelDeInstitucion, nivelesInstitucion y nivel
  const getInitialNivelInstitucion = (): number[] => {
    const set = new Set<number>();
    const agregar = (val: any) => {
      if (Array.isArray(val)) {
        val.forEach((v) => {
          if (v !== undefined && v !== null && v !== '' && !isNaN(Number(v))) {
            set.add(Number(v));
          }
        });
      } else if (val !== undefined && val !== null && val !== '' && !isNaN(Number(val))) {
        set.add(Number(val));
      }
    };

    agregar(dataDocente.nivelDeInstitucion);
    agregar(dataDocente.nivelesInstitucion);
    if (dataDocente.nivel !== undefined && dataDocente.nivel !== null) {
      agregar(dataDocente.nivel);
    }
    return Array.from(set).sort((a, b) => a - b);
  };

  const [formData, setFormData] = useState<UserWithCaracteristica>({
    ...dataDocente,
    grados: Array.isArray(dataDocente.grados) ? dataDocente.grados : [],
    secciones: Array.isArray(dataDocente.secciones) ? dataDocente.secciones : [],
    nivelDeInstitucion: getInitialNivelInstitucion(),
    tipoEspecialista: dataDocente.tipoEspecialista !== undefined ? Number(dataDocente.tipoEspecialista) : undefined
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

  // Obtener niveles a mostrar en el modal:
  // Administradores y especialistas tienen acceso a todos los niveles (Inicial, Primaria, Secundaria).
  const nivelesDisponibles = React.useMemo(() => {
    const esAdmin =
      currentUserData?.rol === 4 ||
      currentUserData?.rol === 5 ||
      currentUserData?.perfil?.rol === 4 ||
      currentUserData?.perfil?.rol === 5;
    const esEspecialista =
      dataDocente?.rol === 1 ||
      dataDocente?.perfil?.rol === 1;

    // Si es administrador o especialista, o si el usuario no tiene niveles restringidos, mostrar todos (Inicial, Primaria, Secundaria)
    if (
      esAdmin ||
      esEspecialista ||
      !currentUserData?.nivelDeInstitucion ||
      currentUserData.nivelDeInstitucion.length === 0
    ) {
      return nivelInstitucion;
    }

    // Para directores u otros perfiles, incluir niveles del usuario actual y los asignados previamente al usuario
    return nivelInstitucion.filter(
      (nivel) =>
        currentUserData.nivelDeInstitucion?.includes(nivel.id) ||
        formData.nivelDeInstitucion?.includes(nivel.id)
    );
  }, [currentUserData, dataDocente, formData.nivelDeInstitucion]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'tipoEspecialista' ? (value ? Number(value) : undefined) : value
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
            const isInicial = Number(gradoObj.nivel) === 0 || Number(gradoObj.id) === 12;
            const isPrimary = Number(gradoObj.nivel) === 1 || (Number(gradoObj.id) >= 1 && Number(gradoObj.id) <= 6);
            const isSecondary = Number(gradoObj.nivel) === 2 || (Number(gradoObj.id) >= 7 && Number(gradoObj.id) <= 11);
            if (newArray.includes(0) && isInicial) return true;
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
    
    // Descartar explícitamente propiedades no estandarizadas 'nivel' y 'nivelesInstitucion'
    const { nivel, nivelesInstitucion, ...cleanFormData } = formData as any;

    // Convertir nivelDeInstitucion de number a number[] para cumplir con el tipo User
    const dataToSubmit: User = {
      ...cleanFormData,
      area: currentUserData?.area,
      distrito: currentUserData?.distrito,
      nivelDeInstitucion: formData.nivelDeInstitucion || [],
      tipoEspecialista: formData.tipoEspecialista ? Number(formData.tipoEspecialista) : undefined
    };
    console.log('dataToSubmit', dataToSubmit);
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
            {(dataDocente.rol === 1 || dataDocente.perfil?.rol === 1 || formData.rol === 1) && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Tipo de Especialista</label>
                <select
                  name="tipoEspecialista"
                  value={formData.tipoEspecialista ?? ''}
                  onChange={handleChange}
                  className={styles.input}
                >
                  <option value="">Seleccione tipo de especialista</option>
                  {tipoEspecialista.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className={styles.formGroup}>
              <label className={styles.label}>Nivel de Institución</label>
              <div className={styles.chipGroup}>
                {nivelesDisponibles.map((nivel) => (
                  <label key={nivel.id} className={styles.chip}>
                    <input
                      type="checkbox"
                      name="nivelDeInstitucion"
                      value={nivel.id}
                      checked={formData.nivelDeInstitucion?.includes(nivel.id)}
                      onChange={handleCheckboxChange}
                      className={styles.chipInput}
                    />
                    <span className={styles.chipLabel}>
                      {nivel.name.charAt(0).toUpperCase() + nivel.name.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {(formData.rol !== 2 && formData.rol !== 1 && formData.perfil?.rol !== 1) && (
              <>
                {formData.nivelDeInstitucion && formData.nivelDeInstitucion.length > 0 && (
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>Grados</label>
                    <div className={styles.chipGroup}>
                      {gradosDeColegio
                        .filter((grado) => {
                          const isInicial = Number(grado.nivel) === 0 || Number(grado.id) === 12;
                          const isPrimary = Number(grado.nivel) === 1 || (Number(grado.id) >= 1 && Number(grado.id) <= 6);
                          const isSecondary = Number(grado.nivel) === 2 || (Number(grado.id) >= 7 && Number(grado.id) <= 11);
                          if (formData.nivelDeInstitucion?.includes(0) && isInicial) return true;
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