import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import AgregarPreguntasRespuestas from '@/modals/agregarPreguntasYRespuestas';
import EvaluarEstudiante from '@/modals/evaluarEstudiante';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState, useRef } from 'react';
import { RiLoader4Line, RiFileList3Line, RiUserStarLine, RiCheckDoubleLine, RiArrowUpLine, RiErrorWarningLine, RiLockLine } from 'react-icons/ri';
import styles from './EvaluacionDocente.module.css';
import QuestionNavigator from '@/components/QuestionNavigator/QuestionNavigator';

const Evaluacion = () => {
  const initialValue = { a: false, b: false, c: false };
  const route = useRouter();
  const { evaluacion, preguntasRespuestas, currentUserData, loaderPages } = useGlobalContext();
  const { getEvaluacion, getPreguntasRespuestas } = useAgregarEvaluaciones();
  const [showModal, setShowModal] = useState(false);
  const [checkedValues, setCheckedValues] = useState(initialValue);
  const [showModalEstudiante, setShowModalEstudiante] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Track which question is currently visible
  useEffect(() => {
    const handleScroll = () => {
      const questionElements = document.querySelectorAll('[id^="question-"]');
      let visibleQuestionIndex = 0;

      for (let i = 0; i < questionElements.length; i++) {
        const rect = questionElements[i].getBoundingClientRect();
        if (rect.top >= 0 && rect.top <= 300) {
          visibleQuestionIndex = i;
          break;
        } else if (rect.top < 0) {
          visibleQuestionIndex = i;
        }
      }

      setActiveQuestion(visibleQuestionIndex);
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [preguntasRespuestas]);

  const handleshowModal = () => {
    setShowModal(!showModal);
  };

  const handleShowModalEstudiante = () => {
    setShowModalEstudiante(!showModalEstudiante);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    getEvaluacion(`${route.query.idExamen}`);
    if (route.query.idExamen) {
      getPreguntasRespuestas(`${route.query.idExamen}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.query.idExamen]);

  return (
    <>
      {showModal && (
        <AgregarPreguntasRespuestas
          id={`${route.query.idExamen}`}
          showModal={showModal}
          handleshowModal={handleshowModal}
        />
      )}
      {showModalEstudiante && (
        <EvaluarEstudiante
          preguntasRespuestas={preguntasRespuestas}
          id={`${route.query.idExamen}`}
          handleShowModalEstudiante={handleShowModalEstudiante}
        />
      )}
      {loaderPages ? (
        <div className={styles.loaderContainer}>
          <RiLoader4Line className={styles.spinner} />
          <span className={styles.loadingText}>Cargando evaluación...</span>
        </div>
      ) : (
        <>
          <QuestionNavigator
            totalQuestions={preguntasRespuestas.length}
            activeQuestion={activeQuestion}
            onQuestionClick={setActiveQuestion}
          />
          <div className={styles.container}>
            <div className={styles.content}>
              <div className={styles.card}>
                <div className={styles.header}>
                  <div>
                    <h1 className={styles.title}>{evaluacion.nombre}</h1>
                    <div style={{ marginTop: '0.25rem' }}>
                      {evaluacion.active && !evaluacion.cerrada ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16a34a', backgroundColor: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                          ● Evaluación Activa
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400e', backgroundColor: '#fef3c7', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                          ● Evaluación Finalizada (Solo Lectura)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.actions}>
                    {evaluacion.active && !evaluacion.cerrada ? (
                      <Link
                        className={styles.reportButton}
                        style={{ backgroundColor: 'var(--primary-color)' }}
                        href={`prueba/evaluar-estudiante?idExamen=${route.query.idExamen}`}
                      >
                        <RiUserStarLine size={18} />
                        Evaluar Estudiante
                      </Link>
                    ) : (
                      <span
                        className={styles.reportButton}
                        style={{ backgroundColor: '#94a3b8', cursor: 'not-allowed', opacity: 0.8 }}
                        title="La evaluación está cerrada para nuevos registros"
                      >
                        <RiLockLine size={18} />
                        Cerrada para Evaluar
                      </span>
                    )}
                    <Link
                      href={`prueba/reporte?idExamen=${route.query.idExamen}`}
                      className={styles.reportButton}
                      style={{ backgroundColor: (!evaluacion.active || evaluacion.cerrada) ? 'var(--primary-color, #2563eb)' : undefined }}
                    >
                      <RiFileList3Line size={18} />
                      Reporte
                    </Link>
                  </div>
                </div>

                {(!evaluacion.active || evaluacion.cerrada) && (
                  <div style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '12px',
                    padding: '0.875rem 1.25rem',
                    marginTop: '1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: '#92400e',
                    fontSize: '0.925rem'
                  }}>
                    <RiErrorWarningLine size={24} style={{ flexShrink: 0, color: '#d97706' }} />
                    <div>
                      <strong>Evaluación Finalizada:</strong> El período para registrar nuevos estudiantes ha concluido. Puedes ingresar a <strong>Reporte</strong> para consultar todas las calificaciones, estadísticas y gráficos de los estudiantes evaluados.
                    </div>
                  </div>
                )}

                <h2 className={styles.sectionTitle}>Preguntas y Respuestas</h2>

                <ul className={styles.questionsList}>
                  {preguntasRespuestas.map((pr, index) => (
                    <li key={index} id={`question-${index}`} className={styles.questionItem}>
                      <div className={styles.questionMeta}>
                        <p className={styles.questionText}>
                          <span className={styles.questionNumber}>{index + 1}.</span>
                          {pr.pregunta}
                        </p>
                        <div className={styles.actuacionText}>
                          <span className={styles.actuacionLabel}>Actuación:</span>
                          <span>{pr.preguntaDocente}</span>
                        </div>
                      </div>

                      {pr.alternativas && pr.alternativas.length > 0 && (
                        <div className={styles.alternativasList}>
                          {pr.alternativas.map((al, altIndex) => (
                            <div key={altIndex} className={styles.alternativaItem}>
                              {al.descripcion?.length === 0 ? null : (
                                <>
                                  <div className={styles.alternativaLetter}>{al.alternativa}</div>
                                  <p className={styles.alternativaDesc}>{al.descripcion}</p>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Optional: Show answer if needed, currently commented in original */}
                      {/* <div className={styles.respuestaWrapper}>
                        <RiCheckDoubleLine size={16} />
                        Respuesta: {pr.respuesta}
                      </div> */}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className={styles.scrollTopButton}
              title="Volver arriba"
            >
              <RiArrowUpLine size={24} />
            </button>
          )}
        </>
      )}
    </>
  );
};

export default Evaluacion;
Evaluacion.Auth = PrivateRouteDocentes;
