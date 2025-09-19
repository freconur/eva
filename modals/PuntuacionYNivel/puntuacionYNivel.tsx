import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { Estudiante, Evaluacion, UserEstudiante } from "@/features/types/types";
import { calculoNivel } from "@/features/utils/calculoNivel";
import styles from './puntuacionYNivel.module.css';
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";

interface RangoNivel {
  id: number;
  nivel: string;
  min: number;
  max: number;
  color: string;
}

interface Props {
  showModal: boolean;
  handleShowModal: () => void;
  estudiante: UserEstudiante | Estudiante | null;
  idExamen: string;
  evaluacion: Evaluacion;
}

const PuntuacionYNivel = ({ showModal, handleShowModal, estudiante, idExamen, evaluacion }: Props) => {
  const [estudianteCalculado, setEstudianteCalculado] = useState<UserEstudiante | null>(null);
  const [rangosNivel, setRangosNivel] = useState<RangoNivel[]>([
    { id: 1, nivel: "satisfactorio", min: 16, max: 20, color: "nivelSatisfactorio" },
    { id: 2, nivel: "en proceso", min: 12, max: 15, color: "nivelEnProceso" },
    { id: 3, nivel: "en inicio", min: 8, max: 11, color: "nivelEnInicio" },
    { id: 4, nivel: "previo al inicio", min: 0, max: 7, color: "nivelPrevioInicio" }
  ]);
  const [isEditing, setIsEditing] = useState(false);
  const [tempRangos, setTempRangos] = useState<RangoNivel[]>([]);
  const { addRangosNivel } = useAgregarEvaluaciones();

  useEffect(() => {
    if (estudiante && showModal) {
      const estudianteConCalculo = calculoNivel({ ...estudiante }, evaluacion);//antes era idExamen
      setEstudianteCalculado(estudianteConCalculo as UserEstudiante);
    }
  }, [estudiante, idExamen, showModal]);

  // Cargar rangos desde evaluacion.nivelYPuntaje al inicializar
  useEffect(() => {
    if (evaluacion.nivelYPuntaje && evaluacion.nivelYPuntaje.length > 0) {
      // Convertir NivelYPuntaje[] a RangoNivel[]
      const rangosFromEvaluacion = evaluacion.nivelYPuntaje.map((nivelPuntaje, index) => ({
        id: nivelPuntaje.id || index + 1,
        nivel: nivelPuntaje.nivel || '',
        min: nivelPuntaje.min || 0,
        max: nivelPuntaje.max || 0,
        color: nivelPuntaje.color || ''
      }));
      setRangosNivel(rangosFromEvaluacion);
    }
  }, [evaluacion.nivelYPuntaje]);

  const handleEditRangos = () => {
    setTempRangos([...rangosNivel]);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setTempRangos([]);
    setIsEditing(false);
  };

  const handleSaveRangos = () => {
    // Validar que no haya rangos superpuestos
    const sortedRangos = [...tempRangos].sort((a, b) => a.min - b.min);
    let isValid = true;
    let errorMessage = '';
    
    // Validar que min <= max para cada rango
    for (let i = 0; i < sortedRangos.length; i++) {
      if (sortedRangos[i].min > sortedRangos[i].max) {
        isValid = false;
        errorMessage = `El valor mínimo no puede ser mayor que el máximo en el nivel "${getNivelTexto(sortedRangos[i].nivel)}".`;
        break;
      }
    }
    
    // Validar que no haya rangos superpuestos
    if (isValid) {
      for (let i = 0; i < sortedRangos.length - 1; i++) {
        if (sortedRangos[i].max >= sortedRangos[i + 1].min) {
          isValid = false;
          errorMessage = 'Los rangos no pueden superponerse. Por favor, ajusta los valores.';
          break;
        }
      }
    }

    if (isValid) {
      setRangosNivel(tempRangos);
      addRangosNivel(tempRangos, evaluacion);
      console.log('Rangos guardados con IDs:', tempRangos);
      setIsEditing(false);
    } else {
      alert(errorMessage);
    }
  };

  const handleRangoChange = (id: number, field: 'min' | 'max', value: number) => {
    const newTempRangos = tempRangos.map(rango => 
      rango.id === id ? { ...rango, [field]: value } : rango
    );
    setTempRangos(newTempRangos);
  };

  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case "satisfactorio":
        return styles.nivelSatisfactorio;
      case "en proceso":
        return styles.nivelEnProceso;
      case "en inicio":
        return styles.nivelEnInicio;
      case "previo al inicio":
        return styles.nivelPrevioInicio;
      default:
        return styles.nivelSinClasificar;
    }
  };

  const getNivelTexto = (nivel: string) => {
    switch (nivel) {
      case "satisfactorio":
        return "Satisfactorio";
      case "en proceso":
        return "En Proceso";
      case "en inicio":
        return "En Inicio";
      case "previo al inicio":
        return "Previo al Inicio";
      default:
        return "Sin Clasificar";
    }
  };

  const getLevelDescription = (nivel: string) => {
    switch (nivel) {
      case "satisfactorio":
        return "El estudiante demuestra un dominio completo de los conocimientos y habilidades evaluadas.";
      case "en proceso":
        return "El estudiante muestra un progreso significativo pero aún necesita refuerzo en algunas áreas.";
      case "en inicio":
        return "El estudiante está comenzando a desarrollar las competencias evaluadas.";
      case "previo al inicio":
        return "El estudiante requiere apoyo adicional antes de abordar los contenidos evaluados.";
      default:
        return "Nivel no clasificado.";
    }
  };

  if (!showModal) return null;

  return container
    ? createPortal(
        <div className={styles.containerModal}>
          <div className={styles.containerSale}>
            <div className={styles.closeModalContainer}>
              <h3 className={styles.title}>Puntuación y Nivel del Estudiante</h3>
              <button className={styles.close} onClick={handleShowModal}>
                Cerrar
              </button>
            </div>

            <div className={styles.content}>
              {estudianteCalculado ? (
                <>
                  <div className={styles.studentInfo}>
                    <h4 className={styles.studentName}>
                      {estudianteCalculado.nombresApellidos || 'Estudiante'}
                    </h4>
                    <p className={styles.studentDni}>DNI: {estudianteCalculado.dni}</p>
                  </div>

                  <div className={styles.scoreContainer}>
                    <div className={styles.scoreItem}>
                      <span className={styles.scoreLabel}>Puntaje Obtenido:</span>
                      <span className={styles.scoreValue}>
                        {estudianteCalculado.puntaje || 0} puntos
                      </span>
                    </div>

                    <div className={styles.levelContainer}>
                      <span className={styles.levelLabel}>Nivel Alcanzado:</span>
                      <div className={`${styles.levelBadge} ${getNivelColor(estudianteCalculado.nivel || '')}`}>
                        {getNivelTexto(estudianteCalculado.nivel || '')}
                      </div>
                    </div>
                  </div>

                  <div className={styles.details}>
                    <h5 className={styles.detailsTitle}>Detalles de la Evaluación</h5>
                    <div className={styles.detailItem}>
                      <span>Total de preguntas:</span>
                      <span>{estudianteCalculado.respuestas?.length || 0}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span>Respuestas correctas:</span>
                      <span>
                        {estudianteCalculado.respuestas?.filter(pregunta => 
                          pregunta.alternativas?.some(alt => 
                            alt.selected && alt.alternativa?.toLowerCase() === pregunta.respuesta?.toLowerCase()
                          )
                        ).length || 0}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span>Porcentaje de aciertos:</span>
                      <span>
                        {estudianteCalculado.respuestas?.length 
                          ? Math.round(
                              (estudianteCalculado.respuestas.filter(pregunta => 
                                pregunta.alternativas?.some(alt => 
                                  alt.selected && alt.alternativa?.toLowerCase() === pregunta.respuesta?.toLowerCase()
                                )
                              ).length / estudianteCalculado.respuestas.length) * 100
                            )
                          : 0}%
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.generalInfo}>
                  <div className={styles.headerSection}>
                    <h4 className={styles.generalTitle}>Rangos de Nivel de Evaluación</h4>
                    <button 
                      className={styles.editButton}
                      onClick={handleEditRangos}
                    >
                      {isEditing ? 'Cancelar' : 'Editar Rangos'}
                    </button>
                  </div>
                  
                  <div className={styles.levelRanges}>
                    {(isEditing ? tempRangos : rangosNivel).map((rango) => (
                      <div key={rango.id} className={styles.levelRange} data-level={rango.nivel}>
                        <div className={`${styles.levelBadge} ${getNivelColor(rango.nivel)}`}>
                          {getNivelTexto(rango.nivel)}
                        </div>
                        
                        {isEditing ? (
                          <div className={styles.rangeInputs}>
                            <div className={styles.inputGroup}>
                              <label className={styles.inputLabel}>Puntaje Mínimo:</label>
                              <input
                                type="number"
                                min="0"
                                value={rango.min}
                                onChange={(e) => handleRangoChange(rango.id, 'min', parseInt(e.target.value) || 0)}
                                className={styles.rangeInput}
                                placeholder="0"
                              />
                            </div>
                            <div className={styles.inputGroup}>
                              <label className={styles.inputLabel}>Puntaje Máximo:</label>
                              <input
                                type="number"
                                min="0"
                                value={rango.max}
                                onChange={(e) => handleRangoChange(rango.id, 'max', parseInt(e.target.value) || 0)}
                                className={styles.rangeInput}
                                placeholder="20"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className={styles.rangeDisplay}>
                            <span className={styles.rangeText}>
                              {rango.min} - {rango.max} puntos
                            </span>
                            <p className={styles.levelDescription}>
                              {getLevelDescription(rango.nivel)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {isEditing && (
                    <div className={styles.editActions}>
                      <button 
                        className={styles.saveButton}
                        onClick={handleSaveRangos}
                      >
                        Guardar Cambios
                      </button>
                      <button 
                        className={styles.cancelButton}
                        onClick={handleCancelEdit}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  <div className={styles.calculationInfo}>
                    <h5 className={styles.calculationTitle}>Cálculo de Niveles</h5>
                    <p className={styles.calculationText}>
                      Los niveles se calculan basándose en el puntaje total obtenido en la evaluación:
                    </p>
                    <ul className={styles.calculationList}>
                      {rangosNivel.map((rango) => (
                        <li key={rango.nivel}>
                          <strong>{getNivelTexto(rango.nivel)}:</strong> {rango.min} - {rango.max} puntos
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className={styles.actions}>
                <button 
                  className={styles.buttonSecondary} 
                  onClick={handleShowModal}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>,
        container
      )
    : null;
};

export default PuntuacionYNivel;
