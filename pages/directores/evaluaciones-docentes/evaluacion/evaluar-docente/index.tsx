import React from 'react';
import Link from 'next/link';
import { RiLoader4Line } from 'react-icons/ri';
import { IoArrowBack } from 'react-icons/io5';
import { MdWarning } from 'react-icons/md';
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores';
import { useEvaluarDesempeno } from '@/features/hooks/useEvaluarDesempeno';
import BusquedaEspecialista from '@/features/components/evaluar-especialista/BusquedaEspecialista';
import DatosEspecialista from '@/features/components/evaluar-especialista/DatosEspecialista';
import TablaEvaluacion from '@/features/components/evaluar-especialista/TablaEvaluacion';
import RetroalimentacionSection from '@/features/components/evaluar-especialista/RetroalimentacionSection';
import styles from '@/pages/admin/especialistas/evaluaciones-especialistas/evaluacion/evaluar-especialista/evaluarEspecialista.module.css';

const EvaluarDocente = () => {
  const {
    isAutoreporte,
    currentUserData,
    dataDirector,
    dataEspecialista,
    dataEvaluacionDocente,
    dimensionesEspecialistas,
    copyPR,
    fechaMonitoreo,
    setFechaMonitoreo,
    horaInicio,
    setHoraInicio,
    horaFinal,
    setHoraFinal,
    emailEspecialista,
    setEmailEspecialista,
    celularEspecialista,
    setCelularEspecialista,
    emailMonitor,
    setEmailMonitor,
    celularMonitor,
    setCelularMonitor,
    tituloReporte,
    setTituloReporte,
    currentEscala,
    selectedFaseId,
    setSelectedFaseId,
    fasesDisponibles,
    handleFaseChange,
    loadingFase,
    dniDocente,
    especialistasFiltrados,
    showDropdown,
    searchRef,
    historialEspecialista,
    showSessionSelector,
    handleChangeDocente,
    handleInputClick,
    handleSelectEspecialista,
    handleBuscarDocente,
    handleStartNewEvaluation,
    handleContinueEvaluation,
    handleCerrarEspecialista,
    handleCheckedRespuesta,
    handleSalvarPreguntaDocente,
    handleGuardarClick,
    uploadingMap,
    handleUploadEvidencia,
    handleDeleteEvidencia,
    retroalimentacionDinamica,
    handleAddFeedbackField,
    handleRemoveFeedbackField,
    handleChangeFeedbackLabel,
    handleChangeFeedbackDescription,
    handleChangeFeedbackValue,
    allQuestionsAnswered,
    warningDataDocente,
    loaderSalvarPregunta,
    isEvaluacionInactiva,
    evaluacionId,
  } = useEvaluarDesempeno({
    role: 'director',
    collectionName: 'evaluaciones-docentes',
    evaluadoRoleLabel: 'Docente',
    queryParamKeys: ['idDocente', 'dniDocente', 'dni'],
  });

  if (isEvaluacionInactiva) {
    return (
      <PrivateRouteDirectores>
        <div className="w-full max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-amber-200 space-y-6">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              <MdWarning className="text-3xl" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                Evaluación Inactiva o Pausada
              </h2>
              <p className="text-sm text-slate-500">
                La evaluación <strong className="text-slate-700">{dataEvaluacionDocente?.name || ''}</strong> no se encuentra activa en este momento. No está permitido registrar ni modificar evaluaciones de docentes mientras permanezca inactiva.
              </p>
            </div>
            <div>
              <Link
                href="/directores/evaluaciones-docentes"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <IoArrowBack className="text-base" />
                <span>Volver a Evaluaciones Docentes</span>
              </Link>
            </div>
          </div>
        </div>
      </PrivateRouteDirectores>
    );
  }

  return (
    <PrivateRouteDirectores>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          {/* Header con enlace de retorno al panel */}
          {evaluacionId && (
            <div className={styles.header}>
              <div className={styles.headerContent}>
                <div className={styles.headerTop}>
                  <div className={styles.headerLeft}>
                    <Link
                      href={`/directores/evaluaciones-docentes/evaluacion/${evaluacionId}`}
                      className={styles.backLink}
                    >
                      <IoArrowBack className={styles.backIcon} />
                      <span className={styles.backText}>Volver al panel de docentes</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={styles.content}>
            <div className={styles.contentInner}>
              {loaderSalvarPregunta || loadingFase ? (
                <div className={styles.loadingContainer}>
                  <RiLoader4Line className={styles.loadingIcon} />
                  <span className={styles.loadingText}>
                    {loadingFase ? 'Cargando datos de la etapa...' : 'Guardando evaluación...'}
                  </span>
                </div>
              ) : (
                <>
                  {/* Sección de búsqueda / datos del docente */}
                  <div className={styles.searchSection}>
                    {!dataDirector.dni ? (
                      <BusquedaEspecialista
                        dniDocente={dniDocente}
                        especialistasFiltrados={especialistasFiltrados}
                        showDropdown={showDropdown}
                        searchRef={searchRef}
                        historialEspecialista={historialEspecialista}
                        showSessionSelector={showSessionSelector}
                        handleChangeDocente={handleChangeDocente}
                        handleInputClick={handleInputClick}
                        handleSelectEspecialista={handleSelectEspecialista}
                        handleBuscarDocente={handleBuscarDocente}
                        handleStartNewEvaluation={handleStartNewEvaluation}
                        handleContinueEvaluation={handleContinueEvaluation}
                        labelBusqueda="Búsqueda de Docente"
                        emptyMessage="No se encontraron docentes"
                      />
                    ) : (
                      <DatosEspecialista
                        dataDirector={dataDirector}
                        dataEvaluacionDocente={dataEvaluacionDocente}
                        currentUserData={currentUserData}
                        isAutoreporte={isAutoreporte}
                        emailEspecialista={emailEspecialista}
                        setEmailEspecialista={setEmailEspecialista}
                        celularEspecialista={celularEspecialista}
                        setCelularEspecialista={setCelularEspecialista}
                        emailMonitor={emailMonitor}
                        setEmailMonitor={setEmailMonitor}
                        celularMonitor={celularMonitor}
                        setCelularMonitor={setCelularMonitor}
                        fechaMonitoreo={fechaMonitoreo}
                        setFechaMonitoreo={setFechaMonitoreo}
                        horaInicio={horaInicio}
                        setHoraInicio={setHoraInicio}
                        horaFinal={horaFinal}
                        setHoraFinal={setHoraFinal}
                        tituloReporte={tituloReporte}
                        setTituloReporte={setTituloReporte}
                        warningDataDocente={warningDataDocente}
                        handleCerrarEspecialista={handleCerrarEspecialista}
                        selectedFaseId={selectedFaseId}
                        setSelectedFaseId={setSelectedFaseId}
                        handleFaseChange={handleFaseChange}
                        fasesDisponibles={fasesDisponibles}
                      />
                    )}
                  </div>

                  {/* Tabla de criterios + Retroalimentación */}
                  <TablaEvaluacion
                    copyPR={copyPR}
                    dimensionesEspecialistas={dimensionesEspecialistas}
                    currentEscala={currentEscala}
                    dataEvaluacionDocente={dataEvaluacionDocente}
                    dataEspecialista={dataEspecialista}
                    dataDirector={dataDirector}
                    uploadingMap={uploadingMap}
                    handleCheckedRespuesta={handleCheckedRespuesta}
                    handleUploadEvidencia={handleUploadEvidencia}
                    handleDeleteEvidencia={handleDeleteEvidencia}
                    handleSalvarPreguntaDocente={handleSalvarPreguntaDocente}
                  />

                  <RetroalimentacionSection
                    retroalimentacionDinamica={retroalimentacionDinamica}
                    isAutoreporte={isAutoreporte}
                    isAdmin={false}
                    handleAddFeedbackField={handleAddFeedbackField}
                    handleRemoveFeedbackField={handleRemoveFeedbackField}
                    handleChangeFeedbackLabel={handleChangeFeedbackLabel}
                    handleChangeFeedbackDescription={handleChangeFeedbackDescription}
                    handleChangeFeedbackValue={handleChangeFeedbackValue}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Botón de guardado fijo */}
        {!loaderSalvarPregunta && (
          <div className={styles.bottomButtonContainer}>
            <div className={styles.bottomButtonWrapper}>
              <div className={styles.bottomButtonContainerInner}>
                <button
                  type="button"
                  onClick={handleGuardarClick}
                  className={styles.saveButton}
                  disabled={!allQuestionsAnswered}
                >
                  Guardar Evaluación
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PrivateRouteDirectores>
  );
};

export default EvaluarDocente;
