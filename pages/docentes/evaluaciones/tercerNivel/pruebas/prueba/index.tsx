import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import AgregarPreguntasRespuestas from '@/modals/agregarPreguntasYRespuestas';
import EvaluarEstudiante from '@/modals/evaluarEstudiante';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState, useRef } from 'react';
import { RiLoader4Line, RiFileList3Line, RiUserStarLine, RiCheckDoubleLine, RiArrowUpLine } from 'react-icons/ri';
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
                  <h1 className={styles.title}>{evaluacion.nombre}</h1>
                  <div className={styles.actions}>
                    <Link
                      className={styles.reportButton}
                      style={{ backgroundColor: 'var(--primary-color)' }}
                      href={`prueba/evaluar-estudiante?idExamen=${route.query.idExamen}`}
                    >
                      <RiUserStarLine size={18} />
                      Evaluar Estudiante
                    </Link>
                    <Link
                      href={`prueba/reporte?idExamen=${route.query.idExamen}`}
                      className={styles.reportButton}
                    >
                      <RiFileList3Line size={18} />
                      Reporte
                    </Link>
                  </div>
                </div>

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
