import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { MdEditSquare, MdDelete, MdAddCircle, MdSettings, MdPlaylistAdd, MdAssignment, MdDescription, MdKeyboardArrowDown, MdPeople, MdToggleOn, MdToggleOff } from 'react-icons/md';

import { PRDocentes } from '@/features/types/types';
import Link from 'next/link';
import { RiLoader4Line } from 'react-icons/ri';
import styles from './index.module.css';
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas';
import AgregarPreguntasRespuestasEspecialistas from '@/modals/AgregarPreguntasRespuestasEspecialistas';
import UpdatePreguntaRespuestaEspecialistas from '@/modals/updatePrEspecialistas';
import AgregarDimensionEspecialistas from '@/modals/AgregarDimensionEspecialistas';
import UpdateDimensionEspecialistas from '@/modals/UpdateDimensionEspecialistas';
import ConfigurarEscalaEspecialistas from '@/modals/ConfigurarEscalaEspecialistas';
import ConfigurarNivelesEspecialistas from '@/modals/ConfigurarNivelesEspecialistas';
import ConfigurarFaseEspecialistas from '@/modals/ConfigurarFaseEspecialistas';
import ConfigurarDescripcionEspecialistas from '@/modals/ConfigurarDescripcionEspecialistas';
import { DimensionEspecialista } from '@/features/types/types';

const EvaluacionDocente = () => {
  const [showAgregarPreguntas, setShowAgregarPreguntas] = useState<boolean>(false);
  const router = useRouter();
  const {
    getPreguntaRespuestaDocentes,
    dataEvaluacionDocente,
    dataDocente,
    loaderPages,
    dataDirector,
    warningDataDocente,
    dimensionesEspecialistas,
    evaluadosEspecialista,
  } = useGlobalContext();
  const {
    getPreguntasRespuestasEspecialistas,
    getDataEvaluacion,
    buscarEspecialista,
    getDimensionesEspecialistas,
    deletePreguntaRespuestaEspecialista,
    deleteDimensionEspecialista,
    getEspecialistasEvaluados,
    updateActivacionEvidencias,
  } = UseEvaluacionEspecialistas();

  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [showAgregarDimension, setShowAgregarDimension] = useState<boolean>(false);
  const [showUpdateDimension, setShowUpdateDimension] = useState<boolean>(false);
  const [showConfigurarEscala, setShowConfigurarEscala] = useState<boolean>(false);
  const [showConfigurarNiveles, setShowConfigurarNiveles] = useState<boolean>(false);
  const [dimensionToUpdate, setDimensionToUpdate] = useState<DimensionEspecialista>({});
  const [valueDni, setValueDni] = useState<string>('');
  const [dataUpdate, setDataUpdate] = useState<PRDocentes>({});
  const [showConfigDropdown, setShowConfigDropdown] = useState<boolean>(false);
  const [showConfigurarFase, setShowConfigurarFase] = useState<boolean>(false);
  const [showConfigurarDescripcion, setShowConfigurarDescripcion] = useState<boolean>(false);

  const handleShowModalPreguntas = () => {
    setShowAgregarPreguntas(!showAgregarPreguntas);
  };
  const handleShowUpdateModal = () => {
    setShowUpdateModal(!showUpdateModal);
  };
  const handleShowModalDimension = () => {
    setShowAgregarDimension(!showAgregarDimension);
  };
  const handleShowUpdateDimension = () => {
    setShowUpdateDimension(!showUpdateDimension);
  };
  const handleShowConfigurarEscala = () => {
    setShowConfigurarEscala(!showConfigurarEscala);
  };
  const handleShowConfigurarNiveles = () => {
    setShowConfigurarNiveles(!showConfigurarNiveles);
  };
  const handleShowConfigurarFase = () => {
    setShowConfigurarFase(!showConfigurarFase);
  };
  const handleShowConfigurarDescripcion = () => {
    setShowConfigurarDescripcion(!showConfigurarDescripcion);
  };
  const handleChangeDniDocente = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueDni(e.target.value);
  };

  const handleDeletePregunta = async (idPregunta: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta pregunta?')) {
      await deletePreguntaRespuestaEspecialista(`${router.query.id}`, idPregunta);
    }
  };

  const handleDeleteDimension = async (idDimension: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este dominio? Esta acción no eliminará las preguntas, pero quedarán sin dominio asignado.')) {
      await deleteDimensionEspecialista(`${router.query.id}`, idDimension);
    }
  };
  const handleToggleEvidencias = async () => {
    if (router.query.id) {
      const newStatus = !dataEvaluacionDocente?.activarEvidencias;
      await updateActivacionEvidencias(`${router.query.id}`, newStatus);
    }
  };


  useEffect(() => {
    if (valueDni.toString().length === 8) {
      buscarEspecialista(`${valueDni}`);
    }
  }, [valueDni]);

  useEffect(() => {
    getDataEvaluacion(`${router.query.id}`);
    getPreguntasRespuestasEspecialistas(`${router.query.id}`);
    getDimensionesEspecialistas(`${router.query.id}`);
    getEspecialistasEvaluados(`${router.query.id}`);
  }, [`${router.query.id}`]);

  return (
    <div className={styles.container}>
      {showUpdateModal && (
        <UpdatePreguntaRespuestaEspecialistas
          id={`${router.query.id}`}
          dataUpdate={dataUpdate}
          handleShowUpdateModal={handleShowUpdateModal}
        />
      )}
      {showAgregarPreguntas && (
        <AgregarPreguntasRespuestasEspecialistas
          idEvaluacion={`${router.query.id}`}
          handleShowModalPreguntas={handleShowModalPreguntas}
        />
      )}
      {showAgregarDimension && (
        <AgregarDimensionEspecialistas
          idEvaluacion={`${router.query.id}`}
          handleShowModalDimension={handleShowModalDimension}
        />
      )}
      {showUpdateDimension && (
        <UpdateDimensionEspecialistas
          idEvaluacion={`${router.query.id}`}
          dimensionUpdate={dimensionToUpdate}
          handleShowUpdateDimension={handleShowUpdateDimension}
        />
      )}
      {showConfigurarEscala && (
        <ConfigurarEscalaEspecialistas
          idEvaluacion={`${router.query.id}`}
          escalaActual={dataEvaluacionDocente?.escala}
          handleShowConfigurarEscala={handleShowConfigurarEscala}
        />
      )}
      {showConfigurarNiveles && (
        <ConfigurarNivelesEspecialistas
          idEvaluacion={`${router.query.id}`}
          nivelesActuales={dataEvaluacionDocente?.niveles}
          handleShowConfigurarNiveles={handleShowConfigurarNiveles}
        />
      )}
      {showConfigurarFase && (
        <ConfigurarFaseEspecialistas
          idEvaluacion={`${router.query.id}`}
          faseActual={dataEvaluacionDocente?.faseNombre}
          handleShowConfigurarFase={handleShowConfigurarFase}
        />
      )}
      {showConfigurarDescripcion && (
        <ConfigurarDescripcionEspecialistas
          idEvaluacion={`${router.query.id}`}
          descripcionActual={dataEvaluacionDocente?.descripcion}
          handleShowConfigurarDescripcion={handleShowConfigurarDescripcion}
        />
      )}

      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>
            Evaluación {dataEvaluacionDocente?.name?.toLocaleLowerCase()}
          </h1>
          <div className={styles.evaluadosBadge}>
            <MdPeople />
            <span>
              {evaluadosEspecialista?.length ?? 0} especialista{evaluadosEspecialista?.length !== 1 ? 's' : ''} evaluado{evaluadosEspecialista?.length !== 1 ? 's' : ''}
            </span>
          </div>
          {dataEvaluacionDocente?.faseNombre && (
            <div className={styles.phaseBadge}>
              <MdAssignment />
              <span>Fase Actual: {dataEvaluacionDocente.faseNombre}</span>
            </div>
          )}
          {/* <div className={styles.searchContainer}>
            <input
              type="number"
              className={styles.searchInput}
              placeholder="DNI DE ESPECIALISTA"
              onChange={handleChangeDniDocente}
            />
            {dataDirector.dni ? (
              <Link
                href={`reporte-especialista-individual?idEvaluacion=${router.query.id}&idDirector=${dataDirector.dni}`}
                className={styles.especialistaInfo}
              >
                <div className={styles.especialistaInfoText}>
                  Dni: <strong className={styles.especialistaInfoStrong}>{dataDirector.dni}</strong>
                </div>
                <div className={styles.especialistaInfoText}>
                  Nombres:{' '}
                  <strong className={styles.especialistaInfoStrong}>
                    {dataDirector.nombres} {dataDirector.apellidos}
                  </strong>
                </div>
              </Link>
            ) : (
              <div className={styles.especialistaInfoText}>
                <p>{warningDataDocente}</p>
              </div>
            )}
          </div> */}
        </div>
        <div className={styles.buttonContainer}>
          <div className={styles.dropdown}>
            <button
              onClick={() => setShowConfigDropdown(!showConfigDropdown)}
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              <MdSettings /> Configuración <MdKeyboardArrowDown className={showConfigDropdown ? styles.iconRotate : ''} />
            </button>
            {showConfigDropdown && (
              <div className={styles.dropdownMenu}>
                <button
                  onClick={() => {
                    handleShowModalDimension();
                    setShowConfigDropdown(false);
                  }}
                  className={styles.dropdownItem}
                >
                  <MdAddCircle /> Agregar dominio
                </button>
                <button
                  onClick={() => {
                    handleShowConfigurarEscala();
                    setShowConfigDropdown(false);
                  }}
                  className={styles.dropdownItem}
                >
                  <MdSettings /> Configurar Escala
                </button>
                <button
                  onClick={() => {
                    handleShowConfigurarNiveles();
                    setShowConfigDropdown(false);
                  }}
                  className={styles.dropdownItem}
                >
                  <MdSettings /> Configurar Niveles de Logro
                </button>
                <button
                  onClick={() => {
                    handleShowConfigurarFase();
                    setShowConfigDropdown(false);
                  }}
                  className={styles.dropdownItem}
                >
                  <MdAssignment /> Nueva Etapa de Evaluación
                </button>
                <button
                  onClick={() => {
                    handleShowConfigurarDescripcion();
                    setShowConfigDropdown(false);
                  }}
                  className={styles.dropdownItem}
                >
                  <MdDescription /> Título PDF
                </button>
                <button
                  onClick={() => {
                    handleShowModalPreguntas();
                    setShowConfigDropdown(false);
                  }}
                  className={styles.dropdownItem}
                >
                  <MdPlaylistAdd /> Agregar preguntas
                </button>
                <div style={{ height: '1px', background: '#f1f5f9', margin: '0.25rem 0.5rem' }}></div>
                <button
                  onClick={handleToggleEvidencias}
                  className={styles.dropdownItem}
                >
                  {dataEvaluacionDocente?.activarEvidencias ? (
                    <MdToggleOn style={{ color: '#10b981', fontSize: '1.5rem' }} />
                  ) : (
                    <MdToggleOff style={{ fontSize: '1.5rem' }} />
                  )}
                  Evidencias: {dataEvaluacionDocente?.activarEvidencias ? 'Activado' : 'Desactivado'}
                </button>
              </div>

            )}
          </div>
          <Link
            href={`evaluar-especialista?id=${router.query.id}`}
            className={`${styles.button} ${styles.buttonSecondary}`}
          >
            <MdAssignment /> Evaluar especialista
          </Link>
          <Link
            href={`${router.query.id}/evaluados`}
            className={`${styles.button} ${styles.buttonSuccess}`}
          >
            <MdPeople /> Ver evaluados
          </Link>
          <div className={`${styles.button} ${styles.buttonPrimary}`}>
            <Link href={`reporte?idEvaluacion=${router.query.id}`} className={styles.buttonLink}>
              <MdDescription /> Reporte ugel
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {dataEvaluacionDocente?.descripcion && (
          <div className={styles.evaluationDescription}>
            <p>{dataEvaluacionDocente.descripcion}</p>
          </div>
        )}
        {loaderPages ? (
          <div className={styles.loaderContainer}>
            <RiLoader4Line className={styles.loaderIcon} />
            <p className={styles.loaderText}>buscando resultados...</p>
          </div>
        ) : (
          <div className={styles.preguntasContainer}>
            {dimensionesEspecialistas?.map((dimension, dimIndex) => {
              const preguntasDeDimension = getPreguntaRespuestaDocentes?.filter(
                (pq) => pq.dimensionId === dimension.id
              );

              return (
                <div key={dimension.id} className={styles.dimensionSection}>
                  <h2 className={styles.dimensionTitle}>
                    {dimension.nombre}
                    <div className={styles.editButton} style={{ marginLeft: '1rem', display: 'inline-flex' }}>
                      <MdEditSquare
                        onClick={() => {
                          setDimensionToUpdate(dimension);
                          handleShowUpdateDimension();
                        }}
                      />
                    </div>
                    {preguntasDeDimension?.length === 0 && (
                      <div className={styles.deleteButton} style={{ marginLeft: '0.5rem', display: 'inline-flex' }}>
                        <MdDelete onClick={() => dimension.id && handleDeleteDimension(dimension.id)} />
                      </div>
                    )}
                  </h2>
                  <ul className={styles.preguntasList}>
                    {preguntasDeDimension?.length === 0 && (
                      <li className={styles.preguntaItem} style={{ opacity: 0.6, borderStyle: 'dashed' }}>
                        <p className={styles.preguntaTitle}>Sin preguntas en este dominio aún.</p>
                      </li>
                    )}
                    {preguntasDeDimension?.map((pq, index) => {
                      return (
                        <li key={index} className={styles.preguntaItem}>
                          <div className={styles.preguntaHeader}>
                            <p className={styles.preguntaNumber}>{index + 1}.</p>
                            <h3 className={styles.preguntaTitle}>{pq.criterio}</h3>
                            <div className={styles.editButton}>
                              <MdEditSquare
                                onClick={() => {
                                  handleShowUpdateModal();
                                  setDataUpdate(pq);
                                }}
                              />
                            </div>
                            <div className={styles.deleteButton}>
                              <MdDelete onClick={() => handleDeletePregunta(`${pq.id}`)} />
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}

            {/* Preguntas sin dominio asignado (opcional, para retrocompatibilidad) */}
            {getPreguntaRespuestaDocentes?.some((pq) => !pq.dimensionId) && (
              <div className={styles.dimensionSection}>
                <h2 className={styles.dimensionTitle}>Sin Dominio Asignado</h2>
                <ul className={styles.preguntasList}>
                  {getPreguntaRespuestaDocentes
                    ?.filter((pq) => !pq.dimensionId)
                    ?.map((pq, index) => (
                      <li key={index} className={styles.preguntaItem}>
                        <div className={styles.preguntaHeader}>
                          <p className={styles.preguntaNumber}>{index + 1}.</p>
                          <h3 className={styles.preguntaTitle}>{pq.criterio}</h3>
                          <div className={styles.editButton}>
                            <MdEditSquare
                              onClick={() => {
                                handleShowUpdateModal();
                                setDataUpdate(pq);
                              }}
                            />
                          </div>
                          <div className={styles.deleteButton}>
                            <MdDelete onClick={() => handleDeletePregunta(`${pq.id}`)} />
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluacionDocente;
// EvaluacionDocente.Auth = PrivateRouteAdmins
