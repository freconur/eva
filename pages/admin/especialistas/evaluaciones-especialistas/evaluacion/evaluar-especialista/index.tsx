import React from 'react';
import Link from 'next/link';
import { RiLoader4Line } from 'react-icons/ri';
import { IoArrowBack } from 'react-icons/io5';
import { MdPeople } from 'react-icons/md';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useBusquedaEspecialista } from '@/features/hooks/evaluar-especialista/useBusquedaEspecialista';
import { useEvaluarEspecialista } from '@/features/hooks/evaluar-especialista/useEvaluarEspecialista';
import { useEvidencias } from '@/features/hooks/evaluar-especialista/useEvidencias';
import { useRetroalimentacionDinamica } from '@/features/hooks/evaluar-especialista/useRetroalimentacionDinamica';
import BusquedaEspecialista from '@/features/components/evaluar-especialista/BusquedaEspecialista';
import DatosEspecialista from '@/features/components/evaluar-especialista/DatosEspecialista';
import TablaEvaluacion from '@/features/components/evaluar-especialista/TablaEvaluacion';
import RetroalimentacionSection from '@/features/components/evaluar-especialista/RetroalimentacionSection';
import styles from './evaluarEspecialista.module.css';

const EvaluarEspecialista = () => {
  const { loaderSalvarPregunta, warningDataDocente } = useGlobalContext();

  const {
    // Condicional de rol
    isAutoreporte,
    currentUserData,
    dataDirector,
    dataEspecialista,
    dataEvaluacionDocente,
    dimensionesEspecialistas,
    // Estado principal
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
    // Búsqueda
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
    // Evaluación
    handleCheckedRespuesta,
    handleSalvarPreguntaDocente,
    handleGuardarClick,
    // Evidencias
    uploadingMap,
    handleUploadEvidencia,
    handleDeleteEvidencia,
    // Retroalimentación
    retroalimentacionDinamica,
    handleAddFeedbackField,
    handleRemoveFeedbackField,
    handleChangeFeedbackLabel,
    handleChangeFeedbackDescription,
    handleChangeFeedbackValue,
    allQuestionsAnswered,
  } = useEvaluarEspecialista();

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <div className={styles.content}>
          <div className={styles.contentInner}>
            {loaderSalvarPregunta ? (
              <div className={styles.loadingContainer}>
                <RiLoader4Line className={styles.loadingIcon} />
                <span className={styles.loadingText}>Guardando evaluación...</span>
              </div>
            ) : (
              <>
                {/* Sección de búsqueda / datos del especialista */}
                <div className={styles.searchSection}>
                  {!dataDirector.dni && !isAutoreporte ? (
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
  );
};

export default EvaluarEspecialista;
