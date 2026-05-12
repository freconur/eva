import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MdDeleteForever, MdChevronLeft, MdChevronRight, MdDragIndicator } from 'react-icons/md';
import { PreguntasRespuestas, Alternativa, UserEstudiante } from '@/features/types/types';
import styles from './TablaPreguntas.module.css';
import { useGlobalContext } from '@/features/context/GlolbalContext';

// Interfaces para las props del componente
export interface EstudianteTabla {
  dni?: string;
  nombresApellidos?: string;
  respuestasCorrectas?: number;
  totalPreguntas?: number;
  puntaje?: number;
  nivel?: string;
  respuestas?: PreguntasRespuestas[];
  dniDocente?: string;
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
    showRC?: boolean;
    showTP?: boolean;
    showDniDocente?: boolean;
  };
  className?: string;
  itemsPerPage?: number | 'all';
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (limit: number | 'all') => void;
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
  itemsPerPage: itemsPerPageProp = 10,
  currentPage: currentPageProp,
  onPageChange,
  onItemsPerPageChange
}) => {
  const { currentUserData } = useGlobalContext()

  // Estados internos (se usan si no se pasan props controladas)
  const [internalPage, setInternalPage] = useState(1);
  const [internalLimit, setInternalLimit] = useState<number | 'all'>(itemsPerPageProp);

  // Determinar valores actuales (priorizando props)
  const currentPage = currentPageProp !== undefined ? currentPageProp : internalPage;
  const currentItemsPerPage = onItemsPerPageChange !== undefined ? itemsPerPageProp : internalLimit;

  // Estado para el popover estático
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);
  const [shouldRenderPopover, setShouldRenderPopover] = useState(false);

  // Calcular datos de paginación
  const paginationData = useMemo(() => {
    const totalItems = estudiantes?.length || 0;
    const currentLimit = currentItemsPerPage === 'all' ? (totalItems || 1) : currentItemsPerPage;
    const totalPages = Math.ceil(totalItems / currentLimit);
    const startIndex = currentItemsPerPage === 'all' ? 0 : (currentPage - 1) * currentItemsPerPage;
    const endIndex = currentItemsPerPage === 'all' ? totalItems : startIndex + currentItemsPerPage;
    const currentStudents = estudiantes?.slice(startIndex, endIndex) || [];

    return {
      totalItems,
      totalPages,
      currentStudents,
      startIndex,
      endIndex
    };
  }, [estudiantes, currentPage, currentItemsPerPage]);

  // Función para cambiar de página
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= paginationData.totalPages) {
      if (onPageChange) {
        onPageChange(newPage);
      } else {
        setInternalPage(newPage);
      }
    }
  };

  // Referencia para evitar que el efecto de reset se dispare al montar el componente
  const isMounted = useRef(false);

  // Resetear a la primera página solo si cambia el límite (después del primer render)
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    if (onPageChange) {
      onPageChange(1);
    } else {
      setInternalPage(1);
    }
  }, [currentItemsPerPage]);

  // Función para validar respuestas usando la definición global como fuente de verdad
  const handleValidateRespuesta = (data: PreguntasRespuestas) => {
    // Buscar la respuesta correcta en la definición global por ID o por Orden como respaldo
    const globalPregunta = preguntasRespuestas.find(p =>
      (data.id && p.id === data.id) || (data.order !== undefined && p.order === data.order)
    );
    const correctRespuesta = globalPregunta?.respuesta;

    const rta: Alternativa | undefined = data.alternativas?.find((r) => r.selected === true);
    if (rta?.alternativa && correctRespuesta) {
      if (rta.alternativa.toLowerCase() === correctRespuesta.toLowerCase()) {
        return <div className={styles.correctAnswer} title="Correcto"></div>;
      } else {
        return <div className={styles.incorrectAnswer} title="Incorrecto"></div>;
      }
    }
    return <div className={styles.noAnswer} title="Sin respuesta"></div>;
  };

  // Función para calcular el total de respuestas correctas basadas en la definición global
  const calculateCorrectCount = (respuestas?: PreguntasRespuestas[]) => {
    if (!respuestas || !preguntasRespuestas) return 0;

    let count = 0;
    respuestas.forEach((res) => {
      const globalPregunta = preguntasRespuestas.find(p =>
        (res.id && p.id === res.id) || (res.order !== undefined && p.order === res.order)
      );
      const correctRespuesta = globalPregunta?.respuesta;
      const rta: Alternativa | undefined = res.alternativas?.find((r) => r.selected === true);

      if (rta?.alternativa && correctRespuesta && rta.alternativa.toLowerCase() === correctRespuesta.toLowerCase()) {
        count++;
      }
    });
    return count;
  };

  // Funciones para verificar si hay datos válidos en las columnas
  const hasValidPuntaje = () => {
    return estudiantes?.some(est => est.puntaje !== undefined && est.puntaje !== null && est.puntaje !== 0);
  };

  const hasValidNivel = () => {
    return estudiantes?.some(est => est.nivel !== undefined && est.nivel !== null && est.nivel !== '-' && est.nivel !== '');
  };

  // Verificar visibilidad de columnas personalizadas
  const showRC = customColumns?.showRC !== false; // Por defecto true
  const showTP = customColumns?.showTP !== false; // Por defecto true
  const showDniDocente = customColumns?.showDniDocente !== undefined 
    ? customColumns.showDniDocente 
    : currentUserData.rol === 2; // Por defecto basado en rol si no se especifica

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

  // Función para obtener la clase CSS según el nivel
  const getNivelClass = (nivel?: string) => {
    if (!nivel || nivel === '-' || nivel === 'sin clasificar') return styles.nivelSinClasificar;

    const lowerNivel = nivel.toLowerCase();

    if (lowerNivel.includes('satisfactorio')) return styles.nivelSatisfactorio;
    if (lowerNivel.includes('proceso')) return styles.nivelEnProceso;
    if (lowerNivel.includes('previo')) return styles.nivelPrevioInicio;
    if (lowerNivel.includes('inicio')) return styles.nivelEnInicio;

    return styles.nivelSinClasificar;
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

  // Generar números de página visibles con elipsis para evitar desbordamientos horizontales
  const getVisiblePageNumbers = () => {
    const total = paginationData.totalPages;
    const current = currentPage;
    const delta = 2; // páginas adyacentes a la actual

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    pages.push(1);

    let start = Math.max(2, current - delta);
    let end = Math.min(total - 1, current + delta);

    if (current - delta <= 2) {
      end = 1 + delta * 2;
    }
    if (current + delta >= total - 1) {
      start = total - delta * 2;
    }

    if (start > 2) {
      pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < total - 1) {
      pages.push('...');
    }

    pages.push(total);
    return pages;
  };

  // Verificar si no hay estudiantes para mostrar
  const hasNoStudents = !estudiantes || estudiantes.length === 0;

  return (
    <>
      <div className={`${styles.mainContainer} ${className}`}>
        {hasNoStudents ? (
          <div className={styles.noDataContainer}>
            <div className={styles.noDataMessage}>
              No se encontraron datos para mostrar
            </div>
          </div>
        ) : (
          <>
            <div className={styles.tableControls}>
              <div className={styles.itemsPerPageSelector}>
                <span>Mostrar:</span>
                <select
                  value={currentItemsPerPage}
                  onChange={(e) => {
                    const val = e.target.value;
                    const newLimit = val === 'all' ? 'all' : Number(val);
                    if (onItemsPerPageChange) {
                      onItemsPerPageChange(newLimit);
                    } else {
                      setInternalLimit(newLimit);
                    }
                  }}
                  className={styles.limitSelect}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value="all">Todos</option>
                </select>
                <span className={styles.selectorLabel}>estudiantes</span>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead className={styles.tableHeader}>
                  <tr>
                    {showDeleteButton && onDeleteEstudiante && <th></th>}
                    <th>#</th>
                    <th>N-A</th>
                    {showDniDocente && <th>Dni Docente</th>}
                    {showRC && <th>r.c</th>}
                    {showTP && <th>t.p.</th>}
                    {(customColumns?.showPuntaje ?? hasValidPuntaje()) && <th>puntaje</th>}
                    {(customColumns?.showNivel ?? hasValidNivel()) && <th>nivel</th>}
                    {preguntasRespuestas.map((pr, index) => {
                      const popoverId = `${pr.order || index}`;

                      // Calcular estadísticas para esta pregunta
                      const stats = (() => {
                        if (!estudiantes || estudiantes.length === 0) return { percent: 0, correct: 0, total: 0 };
                        let correct = 0;
                        let answered = 0;

                        estudiantes.forEach(est => {
                          const resp = est.respuestas?.find(r =>
                            (pr.id && r.id === pr.id) || (pr.order !== undefined && r.order === pr.order)
                          );
                          if (resp) {
                            answered++;
                            const rta: Alternativa | undefined = resp.alternativas?.find((alt) => alt.selected === true);
                            if (rta?.alternativa && pr.respuesta && rta.alternativa.toLowerCase() === pr.respuesta.toLowerCase()) {
                              correct++;
                            }
                          }
                        });

                        const total = estudiantes.length;
                        const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
                        return { percent, correct, total };
                      })();

                      return (
                        <th key={pr.order || index} className={styles.questionHeader}>
                          <div className={styles.headerStack}>
                            <button
                              className={styles.questionButton}
                              onClick={() => handlePopoverToggle(popoverId)}
                            >
                              {index + 1}
                            </button>
                            <div className={styles.questionStats} title={`${stats.correct} de ${stats.total} correctas`}>
                              <span className={styles.statPercent}>{stats.percent}%</span>
                              <span className={styles.statCount}>{stats.correct}/{stats.total}</span>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {!warningEvaEstudianteSinRegistro ? (
                    paginationData.currentStudents?.map((estudiante, index) => {
                      // Crear una clave única combinando DNI, índice y timestamp para evitar duplicados
                      const uniqueRowKey = `${estudiante.dni || 'no-dni'}-${paginationData.startIndex + index}-${Date.now()}`;

                      return (
                        <tr key={uniqueRowKey}>
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
                          {showDniDocente && <td><span className={styles.dniDocenteText}>{estudiante.dniDocente}</span></td>}
                          {showRC && <td>{calculateCorrectCount(estudiante.respuestas)}</td>}
                          {showTP && <td>{estudiante.totalPreguntas || 0}</td>}
                          {(customColumns?.showPuntaje ?? hasValidPuntaje()) && <td>{estudiante.puntaje || '-'}</td>}
                          {(customColumns?.showNivel ?? hasValidNivel()) && (
                            <td>
                              <div className={styles.levelContainer}>
                                <div
                                  className={`${styles.nivelCircle} ${getNivelClass(estudiante.nivel)}`}
                                  title={estudiante.nivel || 'Sin clasificar'}
                                ></div>
                              </div>
                            </td>
                          )}
                          {estudiante.respuestas?.map((res, resIndex) => {
                            // Crear una clave única para cada celda de respuesta
                            const uniqueCellKey = `${uniqueRowKey}-respuesta-${res.id || resIndex}-${res.order || resIndex}`;
                            return (
                              <td key={uniqueCellKey} className={styles.answerCell}>
                                {handleValidateRespuesta(res)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={preguntasRespuestas.length + (showDeleteButton && onDeleteEstudiante ? 3 : 2) + (showDniDocente ? 1 : 0) + (showRC ? 1 : 0) + (showTP ? 1 : 0) + ((customColumns?.showPuntaje ?? hasValidPuntaje()) ? 1 : 0) + ((customColumns?.showNivel ?? hasValidNivel()) ? 1 : 0)}>
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
              {getVisiblePageNumbers().map((page, index) => (
                typeof page === 'string' ? (
                  <span key={`ellipsis-${index}`} className={styles.ellipsis}>
                    {page}
                  </span>
                ) : (
                  <button
                    key={page}
                    className={`${styles.pageNumber} ${currentPage === page ? styles.active : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                )
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
