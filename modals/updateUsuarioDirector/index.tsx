import { createPortal } from "react-dom"
import styles from '../updateDocente/styles.module.css'
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { User } from "@/features/types/types";
import { RiLoader4Line, RiCloseLine } from "react-icons/ri";
import { useEffect, useState } from "react";
import useUsuario from "@/features/hooks/useUsuario";
import { regionTexto, nivelInstitucion, genero, rolDirectivo, caracteristicasDirectivo, area } from "@/fuctions/regiones";
import { distritosPuno } from "@/fuctions/provinciasPuno";

interface Props {
  handleShowModal: () => void,
  idUsuario: string,
}

const initialValue = {
  apellidos: "",
  institucion: "",
  dni: "",
  modular: "",
  nombres: "",
  region: 0,
  rol: 0,
  perfil: { nombre: "", rol: 0 },
  nivelDeInstitucion: [] as number[],
  celular: "",
  genero: "1",
  distrito: "",
  rolDirectivo: 1,
  caracteristicaCurricular: "1",
  area: 1
}

const UpdateUsuarioDirector = ({ idUsuario, handleShowModal }: Props) => {
  const { loaderSalvarPregunta, dataDirector } = useGlobalContext()
  const { getDirectorById, updateDirector } = useUsuario()

  // Initialize state with dataDirector if available, otherwise initialValue
  const [formData, setFormData] = useState<User>(initialValue)
  const [distritosDisponibles, setDistritosDisponibles] = useState<string[]>([]);

  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }

  useEffect(() => {
    getDirectorById(idUsuario)
  }, [idUsuario])

  useEffect(() => {
    if (dataDirector && dataDirector.dni) {
      // Ensure nivelDeInstitucion is an array
      let niveles: number[] = [];
      if (Array.isArray(dataDirector.nivelDeInstitucion)) {
        niveles = dataDirector.nivelDeInstitucion;
      } else if (typeof dataDirector.nivelDeInstitucion === 'number') {
        niveles = [dataDirector.nivelDeInstitucion];
      }

      setFormData({
        ...dataDirector,
        nivelDeInstitucion: niveles,
        celular: dataDirector.celular || "",
        genero: dataDirector.genero || "1",
        distrito: dataDirector.distrito || "",
        rolDirectivo: dataDirector.rolDirectivo || 1,
        caracteristicaCurricular: dataDirector.caracteristicaCurricular?.toString() || "1",
        area: dataDirector.area || 1
      })
    }
  }, [dataDirector])

  useEffect(() => {
    if (distritosPuno && formData.region) {
      const provinciaEncontrada = distritosPuno.find(p => p.id === Number(formData.region));
      if (provinciaEncontrada) {
        setDistritosDisponibles(provinciaEncontrada.distritos);
      } else {
        setDistritosDisponibles([]);
      }
    } else {
      setDistritosDisponibles([]);
    }
  }, [formData.region]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    const numericValue = Number(value);

    setFormData(prev => {
      const currentArray = prev.nivelDeInstitucion || [];
      const newArray = checked
        ? [...currentArray, numericValue]
        : currentArray.filter(item => item !== numericValue);

      return {
        ...prev,
        nivelDeInstitucion: newArray
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDirector(idUsuario, formData);
    handleShowModal();
  }

  return container
    ? createPortal(
      <div className={styles.modalOverlay}>
        <div className={styles.modalContainer}>
          {loaderSalvarPregunta ? (
            <div className='grid items-center justify-center p-10'>
              <div className='flex flex-col justify-center items-center gap-2'>
                <RiLoader4Line className="animate-spin text-4xl text-blue-500" />
                <span className='text-gray-600 animate-pulse'>Guardando cambios...</span>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Actualizar Datos</h2>
                <button onClick={handleShowModal} className={styles.closeButton}>
                  <RiCloseLine className={styles.closeIcon} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGrid}>

                  {/* Nombres */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nombres</label>
                    <input
                      className={styles.input}
                      type="text"
                      name="nombres"
                      value={formData.nombres}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Apellidos */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Apellidos</label>
                    <input
                      className={styles.input}
                      type="text"
                      name="apellidos"
                      value={formData.apellidos}
                      onChange={handleChange}
                    />
                  </div>

                  {/* DNI */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>DNI</label>
                    <input
                      className={styles.input}
                      value={formData.dni}
                      disabled={true}
                    />
                  </div>

                  {/* Institution */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Institución</label>
                    <input
                      className={styles.input}
                      type="text"
                      name="institucion"
                      value={formData.institucion}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Region */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Región</label>
                    <input
                      className={`${styles.input} opacity-70 cursor-not-allowed bg-gray-100`}
                      value={regionTexto(`${formData.region}`)}
                      disabled={true}
                    />
                  </div>

                  {/* Distrito */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Distrito</label>
                    <select
                      name="distrito"
                      value={formData.distrito}
                      onChange={handleChange}
                      className={styles.input}
                    >
                      <option value="">Seleccione Distrito</option>
                      {distritosDisponibles.map((distrito) => (
                        <option key={distrito} value={distrito}>
                          {distrito}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Genero */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Género</label>
                    <div className={styles.radioGroup}>
                      {genero.map((item) => (
                        <label key={item.id} className={styles.radioLabel}>
                          <input
                            type="radio"
                            name="genero"
                            value={item.id}
                            checked={String(formData.genero) === String(item.id)}
                            onChange={handleChange}
                            className={styles.radio}
                          />
                          <span>{item.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Celular */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Celular</label>
                    <input
                      className={styles.input}
                      type="text"
                      name="celular"
                      value={formData.celular}
                      onChange={(e) => {
                        if (e.target.value.length <= 9) handleChange(e)
                      }}
                      placeholder="Ingrese el número de celular"
                      maxLength={9}
                    />
                  </div>

                  {/* Rol Directivo */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Rol Directivo</label>
                    <select
                      className={styles.input}
                      name="rolDirectivo"
                      value={formData.rolDirectivo}
                      onChange={handleChange}
                    >
                      {rolDirectivo?.map((rol) => (
                        <option key={rol.id} value={rol.id}>
                          {rol.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Característica */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Característica</label>
                    <select
                      className={styles.input}
                      name="caracteristicaCurricular"
                      value={formData.caracteristicaCurricular}
                      onChange={handleChange}
                    >
                      {caracteristicasDirectivo?.map((caract) => (
                        <option key={caract.id} value={caract.id}>
                          {caract.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Área */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Área</label>
                    <div className={styles.radioGroup}>
                      {area?.map((a) => (
                        <label key={a.id} className={styles.radioLabel}>
                          <input
                            type="radio"
                            name="area"
                            value={a.id}
                            checked={Number(formData.area) === a.id}
                            onChange={handleChange}
                            className={styles.radio}
                          />
                          <span>{a.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Nivel de Institución */}
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>Nivel de Institución</label>
                    <div className={styles.chipGroup}>
                      {nivelInstitucion.map((nivel) => (
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

                </div>

                <div className={styles.formFooter}>
                  <button type="button" onClick={handleShowModal} className={`${styles.button} ${styles.cancelButton}`}>
                    Cancelar
                  </button>
                  <button type="submit" className={`${styles.button} ${styles.submitButton}`}>
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>,
      container
    )
    : null
}

export default UpdateUsuarioDirector