import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './styles.module.css';
import useUsuario from '@/features/hooks/useUsuario';
import { User } from '@/features/types/types';
import { area, caracteristicasDirectivo } from '@/fuctions/regiones';
import { distritosPuno } from '@/fuctions/provinciasPuno';
import { doc, getFirestore, updateDoc } from 'firebase/firestore';
import { app } from '@/firebase/firebase.config';
import { toast } from 'react-toastify';

import { useGlobalContextDispatch } from '@/features/context/GlolbalContext';
import { AppAction } from '@/features/actions/appAction';

interface Props {
  currentUserData: User;
}

export const isDirectorProfileIncomplete = (user: any): boolean => {
  if (!user || Number(user.perfil?.rol) !== 2) return false;

  const isAreaEmpty = user.area === undefined || user.area === null || user.area === '';
  const isCaracteristicaEmpty =
    user.caracteristicaCurricular === undefined ||
    user.caracteristicaCurricular === null ||
    user.caracteristicaCurricular === '' ||
    (Array.isArray(user.caracteristicaCurricular) && user.caracteristicaCurricular.length === 0);
  const isTipoGestionEmpty = user.tipoGestion === undefined || user.tipoGestion === null || user.tipoGestion === '';
  const isDistritoEmpty = !user.distrito || String(user.distrito).trim() === '';
  const isInstitucionEmpty = !user.institucion || String(user.institucion).trim() === '';

  return isAreaEmpty || isCaracteristicaEmpty || isTipoGestionEmpty || isDistritoEmpty || isInstitucionEmpty;
};

const ModalConfigurarPerfilDirector = ({ currentUserData }: Props) => {
  const [institucion, setInstitucion] = useState(currentUserData.institucion || '');
  const [distrito, setDistrito] = useState(currentUserData.distrito || '');
  const [tipoGestion, setTipoGestion] = useState<'publico' | 'privado' | ''>(
    currentUserData.tipoGestion || ''
  );
  const [caracteristicaCurricular, setCaracteristicaCurricular] = useState(
    currentUserData.caracteristicaCurricular
      ? String(currentUserData.caracteristicaCurricular)
      : '1'
  );
  const [areaVal, setAreaVal] = useState<number>(
    currentUserData.area ? Number(currentUserData.area) : 1
  );

  const [loading, setLoading] = useState(false);
  const [distritosDisponibles, setDistritosDisponibles] = useState<string[]>([]);
  const { getUserData } = useUsuario();
  const dispatch = useGlobalContextDispatch();
  const db = getFirestore(app);

  useEffect(() => {
    if (distritosPuno && currentUserData.region) {
      const provinciaEncontrada = distritosPuno.find((p) => p.id === Number(currentUserData.region));
      if (provinciaEncontrada) {
        setDistritosDisponibles(provinciaEncontrada.distritos);
      } else {
        const todosLosDistritos = distritosPuno.flatMap((p) => p.distritos);
        setDistritosDisponibles(Array.from(new Set(todosLosDistritos)));
      }
    } else if (distritosPuno) {
      const todosLosDistritos = distritosPuno.flatMap((p) => p.distritos);
      setDistritosDisponibles(Array.from(new Set(todosLosDistritos)));
    }
  }, [currentUserData.region]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!institucion.trim()) {
      toast.warning('Por favor ingrese el nombre de su institución educativa.');
      return;
    }
    if (!distrito) {
      toast.warning('Por favor seleccione el distrito de su institución.');
      return;
    }
    if (!tipoGestion) {
      toast.warning('Por favor seleccione el tipo de gestión (Público o Privado).');
      return;
    }
    if (!caracteristicaCurricular) {
      toast.warning('Por favor seleccione la característica curricular.');
      return;
    }
    if (!areaVal) {
      toast.warning('Por favor seleccione el área (Urbana o Rural).');
      return;
    }

    const docId = currentUserData.id || currentUserData.dni;

    if (!docId) {
      toast.error('No se pudo identificar el usuario.');
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        institucion: institucion.trim(),
        distrito,
        tipoGestion,
        caracteristicaCurricular,
        area: Number(areaVal),
      };

      // Actualizar documento por ID principal (UID)
      const userRef = doc(db, 'usuarios', String(docId));
      await updateDoc(userRef, dataToSave);

      // Si el DNI es diferente al UID, intentar actualizar también por DNI si existe
      if (currentUserData.dni && String(currentUserData.dni) !== String(docId)) {
        try {
          const dniRef = doc(db, 'usuarios', String(currentUserData.dni));
          await updateDoc(dniRef, dataToSave);
        } catch (e) {
          // Ignorar si no existe como documento separado
        }
      }

      // Actualización inmediata del estado global en React para cerrar el modal al instante
      dispatch({
        type: AppAction.CURRENT_USER_DATA,
        payload: {
          ...currentUserData,
          ...dataToSave,
        },
      });

      toast.success('¡Perfil e información de la institución actualizados con éxito!');
      getUserData();
    } catch (error: any) {
      console.error('Error al actualizar perfil directivo:', error);
      toast.error('Ocurrió un error al guardar los datos. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  let container: HTMLElement | null = null;
  if (typeof window !== 'undefined') {
    container = document.getElementById('portal-modal');
  }
  if (!container) return null;

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={styles.headerIcon}
            >
              <path d="M11.7 2.805a.75.75 0 01.6 0l9 4.25a.75.75 0 010 1.37l-9 4.25a.75.75 0 01-.6 0l-9-4.25a.75.75 0 010-1.37l9-4.25zM12 13.435l-7.75-3.66v4.618a.75.75 0 00.413.67l7 3.325a.75.75 0 00.674 0l7-3.325a.75.75 0 00.413-.67V9.775L12 13.435z" />
            </svg>
          </div>
          <h2 className={styles.title}>Configuración de tu Institución</h2>
          <p className={styles.subtitle}>
            Hola, <strong>{currentUserData.nombres} {currentUserData.apellidos}</strong>. Para garantizar la precisión de los reportes y evaluaciones consolidada, por favor completa la información requerida de tu institución educativa.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            {/* Institución */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>
                Institución Educativa <span className={styles.requiredStar}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                placeholder="Ej. I.E. 70001 Nuestra Señora del Carmen"
                value={institucion}
                onChange={(e) => setInstitucion(e.target.value)}
                required
              />
            </div>

            {/* Distrito */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Distrito <span className={styles.requiredStar}>*</span>
              </label>
              <select
                className={styles.select}
                value={distrito}
                onChange={(e) => setDistrito(e.target.value)}
                required
              >
                <option value="">Seleccione Distrito</option>
                {distritosDisponibles.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>

            {/* Característica Curricular */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Característica Curricular <span className={styles.requiredStar}>*</span>
              </label>
              <select
                className={styles.select}
                value={caracteristicaCurricular}
                onChange={(e) => setCaracteristicaCurricular(e.target.value)}
                required
              >
                {caracteristicasDirectivo?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Gestión */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>
                Tipo de Gestión <span className={styles.requiredStar}>*</span>
              </label>
              <div className={styles.radioGroup}>
                <label
                  className={`${styles.radioCard} ${
                    tipoGestion === 'publico' ? styles.radioCardSelected : ''
                  }`}
                  onClick={() => setTipoGestion('publico')}
                >
                  <input
                    type="radio"
                    name="tipoGestionModal"
                    value="publico"
                    checked={tipoGestion === 'publico'}
                    onChange={() => setTipoGestion('publico')}
                    className={styles.radioInput}
                  />
                  <span>Público</span>
                </label>

                <label
                  className={`${styles.radioCard} ${
                    tipoGestion === 'privado' ? styles.radioCardSelected : ''
                  }`}
                  onClick={() => setTipoGestion('privado')}
                >
                  <input
                    type="radio"
                    name="tipoGestionModal"
                    value="privado"
                    checked={tipoGestion === 'privado'}
                    onChange={() => setTipoGestion('privado')}
                    className={styles.radioInput}
                  />
                  <span>Privado</span>
                </label>
              </div>
            </div>

            {/* Área */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>
                Área (Zona) <span className={styles.requiredStar}>*</span>
              </label>
              <div className={styles.radioGroup}>
                {area?.map((item) => (
                  <label
                    key={item.id}
                    className={`${styles.radioCard} ${
                      Number(areaVal) === Number(item.id) ? styles.radioCardSelected : ''
                    }`}
                    onClick={() => setAreaVal(Number(item.id))}
                  >
                    <input
                      type="radio"
                      name="areaModal"
                      value={item.id}
                      checked={Number(areaVal) === Number(item.id)}
                      onChange={() => setAreaVal(Number(item.id))}
                      className={styles.radioInput}
                    />
                    <span>{item.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className={styles.footer}>
            <button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  Guardando configuración...
                </>
              ) : (
                'Guardar y Continuar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    container
  );
};

export default ModalConfigurarPerfilDirector;
