import React from 'react';
import Link from 'next/link';
import { RiLoader4Line } from 'react-icons/ri';
import { IoArrowBack } from 'react-icons/io5';
import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes';
import { useEvaluarDesempeno } from '@/features/hooks/useEvaluarDesempeno';
import BusquedaEspecialista from '@/features/components/evaluar-especialista/BusquedaEspecialista';
import DatosEspecialista from '@/features/components/evaluar-especialista/DatosEspecialista';
import TablaEvaluacion from '@/features/components/evaluar-especialista/TablaEvaluacion';
import RetroalimentacionSection from '@/features/components/evaluar-especialista/RetroalimentacionSection';
import styles from '@/pages/admin/especialistas/evaluaciones-especialistas/evaluacion/evaluar-especialista/evaluarEspecialista.module.css';

const EvaluarDocenteAdmin = () => {
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
    isTemplateDirty,
    isSavingTemplateConfig,
    handleSaveTemplateConfig,
    handleDiscardTemplateChanges,
    handleAddFeedbackField,
    handleRemoveFeedbackField,
    handleChangeFeedbackLabel,
    handleChangeFeedbackDescription,
    handleChangeFeedbackValue,
    allQuestionsAnswered,
    warningDataDocente,
    loaderSalvarPregunta,
    evaluacionId,
    isAdmin,
  } = useEvaluarDesempeno({
    role: 'admin',
    collectionName: 'evaluaciones-docentes',
    evaluadoRoleLabel: 'Docente',
    queryParamKeys: ['idDocente', 'dniDocente', 'dni'],
  });

  return (
    <PrivateRouteAdmins>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          {/* Header con enlace de retorno al panel */}
          {evaluacionId && (
            <div className={styles.header}>
              <div className={styles.headerContent}>
                <div className={styles.headerTop}>
                  <div className={styles.headerLeft}>
                    <Link
                      href={`/admin/evaluaciones-docentes/evaluacion/${evaluacionId}`}
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
                    isAdmin={isAdmin}
                    isTemplateDirty={isTemplateDirty}
                    isSavingTemplateConfig={isSavingTemplateConfig}
                    handleSaveTemplateConfig={handleSaveTemplateConfig}
                    handleDiscardTemplateChanges={handleDiscardTemplateChanges}
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
    </PrivateRouteAdmins>
  );
};

export default EvaluarDocenteAdmin;
