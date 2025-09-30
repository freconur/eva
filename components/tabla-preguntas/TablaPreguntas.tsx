import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MdDeleteForever, MdChevronLeft, MdChevronRight, MdDragIndicator } from 'react-icons/md';
import { PreguntasRespuestas, Alternativa, UserEstudiante } from '@/features/types/types';
import styles from './TablaPreguntas.module.css';

// Interfaces para las props del componente
export interface EstudianteTabla {
  dni?: string;
  nombresApellidos?: string;
  respuestasCorrectas?: number;
  totalPreguntas?: number;
  puntaje?: number;
  nivel?: string;
  respuestas?: PreguntasRespuestas[];
}

export interface TablaPreguntasProps {
  estudiantes: EstudianteTabla[] | UserEstudiante[];
  preguntasRespuestas: PreguntasRespuestas[];
  warningEvaEstudianteSinRegistro?: string;
  onDeleteEstudiante?: (dni: string) => void;
  onEditEstudiante?: (dni: string) => void;
  linkToEdit?: string;
  showDeleteButton?: boolean;
  showEditButton?: boolean;
  customColumns?: {
    showPuntaje?: boolean;
    showNivel?: boolean;
  };
  className?: string;
  itemsPerPage?: number;
}

const TablaPreguntas: React.FC<TablaPreguntasProps> = ({
  estudiantes,
  preguntasRespuestas,
  warningEvaEstudianteSinRegistro,
  onDeleteEstudiante,
  onEditEstudiante,
  linkToEdit,
  showDeleteButton = true,
  showEditButton = true,
  customColumns,
  className = '',
  itemsPerPage = 10
}) => {
  // Estado para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  
  // Estado para el popover estático
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);
  const [shouldRenderPopover, setShouldRenderPopover] = useState(false);

  // Calcular datos de paginación
  const paginationData = useMemo(() => {
    const totalItems = estudiantes?.length || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentStudents = estudiantes?.slice(startIndex, endIndex) || [];

    return {
      totalItems,
      totalPages,
      currentStudents,
      startIndex,
      endIndex
    };
  }, [estudiantes, currentPage, itemsPerPage]);

  // Función para cambiar de página
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= paginationData.totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Función para validar respuestas
  const handleValidateRespuesta = (data: PreguntasRespuestas) => {
    const rta: Alternativa | undefined = data.alternativas?.find((r) => r.selected === true);
    if (rta?.alternativa) {
      if (rta.alternativa.toLowerCase() === data.respuesta?.toLowerCase()) {
        return <div className={styles.correctAnswer}>si</div>;
      } else {
        return <div className={styles.incorrectAnswer}>no</div>;
      }
    }
    return <div className={styles.noAnswer}>-</div>;
  };

  // Verificar si existen valores válidos para puntaje
  const hasValidPuntaje = () => {
    if (customColumns?.showPuntaje !== undefined) {
      return customColumns.showPuntaje;
    }
    return estudiantes?.some(
      (estudiante) =>
        estudiante.puntaje !== undefined &&
        estudiante.puntaje !== null &&
        !isNaN(estudiante.puntaje)
    );
  };

  // Verificar si existen valores válidos para nivel
  const hasValidNivel = () => {
    if (customColumns?.showNivel !== undefined) {
      return customColumns.showNivel;
    }
    return estudiantes?.some(
      (estudiante) =>
        estudiante.nivel !== undefined &&
        estudiante.nivel !== null &&
        estudiante.nivel !== '' &&
        estudiante.nivel !== 'sin clasificar'
    );
  };

  // Función para manejar el clic en eliminar
  const handleDeleteClick = (dni?: string) => {
    if (onDeleteEstudiante && dni) {
      onDeleteEstudiante(dni);
    }
  };

  // Función para manejar el clic en editar
  const handleEditClick = (dni?: string) => {
    if (onEditEstudiante && dni) {
      onEditEstudiante(dni);
    }
  };

  // Efecto para manejar la animación de fade del popover
  useEffect(() => {
    if (activePopover) {
      // Mostrar el popover en el DOM
      setShouldRenderPopover(true);
      // Pequeño delay para permitir que el DOM se actualice y luego activar fade in
      const timer = setTimeout(() => {
        setIsPopoverVisible(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      // Iniciar fade out
      setIsPopoverVisible(false);
      // Ocultar completamente del DOM después de la animación
      const hideTimer = setTimeout(() => {
        setShouldRenderPopover(false);
      }, 300); // Duración de la transición CSS
      return () => clearTimeout(hideTimer);
    }
  }, [activePopover]);

  // Funciones para el popover estático
  const handlePopoverToggle = (popoverId: string) => {
    setActivePopover(activePopover === popoverId ? null : popoverId);
  };

  // Función para manejar clics en el popover
  const handlePopoverClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Verificar si no hay estudiantes para mostrar
  const hasNoStudents = !estudiantes || estudiantes.length === 0;

  return (
    <>
      <div className={`${className}`}>
        {hasNoStudents ? (
          <div className={styles.noDataContainer}>
            <div className={styles.noDataMessage}>
              No se encontraron datos para mostrar
            </div>
          </div>
        ) : (
          <>
            <div className={className.includes('tableWrapper') ? className : ''}>
            <table className={styles.table}>
              <thead className={styles.tableHeader}>
                <tr>
                  {showDeleteButton && onDeleteEstudiante && <th></th>}
                  <th>#</th>
                  <th>N-A</th>
                  <th>r.c</th>
                  <th>t.p.</th>
                  {hasValidPuntaje() && <th>puntaje</th>}
                  {hasValidNivel() && <th>nivel</th>}
                  {preguntasRespuestas.map((pr, index) => {
                    const popoverId = `${pr.order || index}`;
                    
                    return (
                      <th key={pr.order || index}>
                        <button 
                          className={styles.questionButton} 
                          onClick={() => handlePopoverToggle(popoverId)}
                        >
                          {index + 1}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {!warningEvaEstudianteSinRegistro ? (
                  paginationData.currentStudents?.map((estudiante, index) => {
                    return (
                      <tr key={estudiante.dni || index}>
                        {showDeleteButton && onDeleteEstudiante && (
                          <td>
                            <MdDeleteForever
                              onClick={() => handleDeleteClick(estudiante.dni)}
                              className={styles.deleteIcon}
                              title="Eliminar estudiante"
                            />
                          </td>
                        )}
                        <td>{paginationData.startIndex + index + 1}</td>
                        <td>
                          {showEditButton && linkToEdit && estudiante.dni ? (
                            <Link
                              href={`${linkToEdit}&idEstudiante=${estudiante.dni}`}
                              className={styles.studentLink}
                            >
                              {estudiante.nombresApellidos || 'Sin nombre'}
                            </Link>
                          ) : (
                            <span className={styles.studentName}>
                              {estudiante.nombresApellidos || 'Sin nombre'}
                            </span>
                          )}
                        </td>
                        <td>{estudiante.respuestasCorrectas || 0}</td>
                        <td>{estudiante.totalPreguntas || 0}</td>
                        {hasValidPuntaje() && <td>{estudiante.puntaje || '-'}</td>}
                        {hasValidNivel() && <td>{estudiante.nivel || '-'}</td>}
                        {estudiante.respuestas?.map((res, resIndex) => {
                          return <td key={res.order || resIndex}>{handleValidateRespuesta(res)}</td>;
                        })}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={preguntasRespuestas.length + (showDeleteButton && onDeleteEstudiante ? 6 : 5) + (hasValidPuntaje() ? 1 : 0) + (hasValidNivel() ? 1 : 0)}>
                      <div className={styles.warningContainer}>
                        {warningEvaEstudianteSinRegistro}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>
      
      {/* Controles de paginación - Completamente fuera del contenedor de la tabla */}
      {!hasNoStudents && !warningEvaEstudianteSinRegistro && paginationData.totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <div className={styles.paginationInfo}>
            Mostrando {paginationData.startIndex + 1} - {Math.min(paginationData.endIndex, paginationData.totalItems)} de {paginationData.totalItems} estudiantes
          </div>
          
          <div className={styles.paginationControls}>
            <button
              className={`${styles.paginationArrow} ${currentPage === 1 ? styles.disabled : ''}`}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ‹
            </button>
            
            <div className={styles.pageNumbers}>
              {Array.from({ length: paginationData.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`${styles.pageNumber} ${currentPage === page ? styles.active : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              className={`${styles.paginationArrow} ${currentPage === paginationData.totalPages ? styles.disabled : ''}`}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === paginationData.totalPages}
            >
              ›
            </button>
          </div>
        </div>
      )}
      
      {/* Popover fuera del contenedor principal - usando React Portal */}
      {shouldRenderPopover && (
        <div
          className={`${styles.questionPopover} ${isPopoverVisible ? styles.fadeIn : styles.fadeOut}`}
          onClick={handlePopoverClick}
        >
          <div className={styles.popoverContent}>
            <div className={styles.popoverHeader}>
              <div className={styles.headerLeft}>
                <span className={styles.questionNumber}>
                  Pregunta {preguntasRespuestas.findIndex(pr => `${pr.order || preguntasRespuestas.indexOf(pr)}` === activePopover) + 1}
                </span>
              </div>
              <div className={styles.headerRight}>
                <button 
                  className={styles.closeButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePopover(null);
                  }}
                  aria-label="Cerrar popover"
                >
                  ×
                </button>
              </div>
            </div>
            <div className={styles.popoverBody}>
              <span className={styles.questionLabel}>Actuación:</span>
              <p className={styles.questionText}>
                {preguntasRespuestas.find(pr => `${pr.order || preguntasRespuestas.indexOf(pr)}` === activePopover)?.preguntaDocente}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TablaPreguntas;
