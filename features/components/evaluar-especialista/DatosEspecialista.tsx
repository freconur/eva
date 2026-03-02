import React from 'react';
import { MdAssignment } from 'react-icons/md';
import { RiCloseLine } from 'react-icons/ri';
import styles from '@/pages/admin/especialistas/evaluaciones-especialistas/evaluacion/evaluar-especialista/evaluarEspecialista.module.css';
import { regionTexto } from '@/fuctions/regiones';

interface DatosEspecialistaProps {
    dataDirector: any;
    dataEvaluacionDocente: any;
    currentUserData: any;
    isAutoreporte: boolean;
    emailEspecialista: string;
    setEmailEspecialista: (v: string) => void;
    celularEspecialista: string;
    setCelularEspecialista: (v: string) => void;
    emailMonitor: string;
    setEmailMonitor: (v: string) => void;
    celularMonitor: string;
    setCelularMonitor: (v: string) => void;
    fechaMonitoreo: string;
    setFechaMonitoreo: (v: string) => void;
    horaInicio: string;
    setHoraInicio: (v: string) => void;
    horaFinal: string;
    setHoraFinal: (v: string) => void;
    tituloReporte: string;
    setTituloReporte: (v: string) => void;
    warningDataDocente: string;
    handleCerrarEspecialista: () => void;
}

const DatosEspecialista: React.FC<DatosEspecialistaProps> = ({
    dataDirector,
    dataEvaluacionDocente,
    currentUserData,
    isAutoreporte,
    emailEspecialista,
    setEmailEspecialista,
    celularEspecialista,
    setCelularEspecialista,
    emailMonitor,
    setEmailMonitor,
    celularMonitor,
    setCelularMonitor,
    fechaMonitoreo,
    setFechaMonitoreo,
    horaInicio,
    setHoraInicio,
    horaFinal,
    setHoraFinal,
    tituloReporte,
    setTituloReporte,
    warningDataDocente,
    handleCerrarEspecialista,
}) => (
    <div className={styles.premiumInfoContainer}>
        {dataEvaluacionDocente?.faseNombre && (
            <div className={styles.phaseBanner}>
                <MdAssignment />
                <span>
                    Etapa de Evaluación Actual: <strong>{dataEvaluacionDocente.faseNombre}</strong>
                </span>
            </div>
        )}

        {/* Datos del monitoreado - siempre visible */}
        <div className={styles.infoSectionHeader}>
            <h3 className={styles.infoSectionTitle}>DATOS DEL(A) MONITOREADO (A):</h3>
            {!isAutoreporte && (
                <button
                    onClick={handleCerrarEspecialista}
                    className={styles.closeButton}
                    title="Cerrar especialista"
                >
                    <RiCloseLine className={styles.closeIcon} />
                </button>
            )}
        </div>

        <div className={styles.infoTable}>
            <div className={styles.infoRow}>
                <div className={styles.infoLabel}>UGEL:</div>
                <div className={styles.infoValue}>
                    {regionTexto(String(dataDirector.region || '')) || 'UGEL 01'}
                </div>
            </div>
            <div className={styles.infoRow}>
                <div className={styles.infoLabel}>APELLIDOS Y NOMBRES:</div>
                <div className={styles.infoValue}>
                    {`${dataDirector.apellidos?.toUpperCase()} ${dataDirector.nombres?.toUpperCase()}`}
                </div>
            </div>
            <div className={styles.infoRowGroup}>
                <div className={styles.infoRowItem}>
                    <div className={styles.infoLabel}>DNI:</div>
                    <div className={styles.infoValue}>{dataDirector.dni}</div>
                </div>
                <div className={styles.verticalRowItem}>
                    <div className={styles.labelVertical}>E-MAIL:</div>
                    <div className={styles.infoValue}>
                        <textarea
                            className={styles.compactTextarea}
                            value={emailEspecialista}
                            onChange={e => setEmailEspecialista(e.target.value)}
                            placeholder="Ingrese e-mail"
                            rows={2}
                        />
                    </div>
                </div>
                <div className={styles.verticalRowItem}>
                    <div className={styles.labelVertical}>Nº CELULAR:</div>
                    <div className={styles.infoValue}>
                        <textarea
                            className={styles.compactTextarea}
                            value={celularEspecialista}
                            onChange={e => setCelularEspecialista(e.target.value)}
                            placeholder="Ingrese celular"
                            rows={2}
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Datos del monitor y fecha — solo para monitores (rol != 1) */}
        {!isAutoreporte && (
            <>
                {/* Datos del monitor */}
                <div className={styles.infoSectionDivider}>DATOS DEL MONITOR:</div>
                <div className={styles.infoTable}>
                    <div className={styles.infoRow}>
                        <div className={styles.infoLabel}>APELLIDOS Y NOMBRES:</div>
                        <div className={styles.infoValue}>
                            {`${currentUserData?.apellidos?.toUpperCase() || ''} ${currentUserData?.nombres?.toUpperCase() || ''
                                }`}
                        </div>
                    </div>
                    <div className={styles.infoRowGroup}>
                        <div className={styles.infoRowItem}>
                            <div className={styles.infoLabelSmall}>DNI:</div>
                            <div className={styles.infoValueSmall}>{currentUserData?.dni || ''}</div>
                        </div>
                        <div className={styles.infoRowItem}>
                            <div className={styles.infoLabelSmall}>CARGO:</div>
                            <div className={styles.infoValueSmall}>{currentUserData?.cargo || 'MONITOR'}</div>
                        </div>
                        <div className={styles.verticalRowItem}>
                            <div className={styles.labelVertical}>E-MAIL:</div>
                            <div className={styles.infoValueSmall}>
                                <textarea
                                    className={styles.compactTextarea}
                                    value={emailMonitor}
                                    onChange={e => setEmailMonitor(e.target.value)}
                                    placeholder="Ingrese e-mail"
                                    rows={2}
                                />
                            </div>
                        </div>
                        <div className={styles.verticalRowItem}>
                            <div className={styles.labelVertical}>Nº CELULAR:</div>
                            <div className={styles.infoValueSmall}>
                                <textarea
                                    className={styles.compactTextarea}
                                    value={celularMonitor}
                                    onChange={e => setCelularMonitor(e.target.value)}
                                    placeholder="Ingrese celular"
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>
                </div>

            </>
        )}

        {/* Fecha y duración — visible para todos los roles */}
        <div className={styles.infoSectionDivider}>FECHA Y DURACIÓN:</div>
        <div className={styles.infoTable}>
            <div className={styles.infoRowGroup}>
                <div className={styles.infoRowItem}>
                    <div className={styles.infoLabel}>FECHA:</div>
                    <div className={styles.infoValue}>
                        <input
                            type="date"
                            className={styles.infoInput}
                            value={fechaMonitoreo}
                            onChange={e => setFechaMonitoreo(e.target.value)}
                        />
                    </div>
                </div>
                <div className={styles.infoRowItem}>
                    <div className={styles.infoLabel}>HORA INICIO:</div>
                    <div className={styles.infoValue}>
                        <input
                            type="time"
                            className={styles.infoInput}
                            value={horaInicio}
                            onChange={e => setHoraInicio(e.target.value)}
                        />
                    </div>
                </div>
                <div className={styles.infoRowItem}>
                    <div className={styles.infoLabel}>FECHA FINAL:</div>
                    <div className={styles.infoValue}>
                        <input
                            type="time"
                            className={styles.infoInput}
                            value={horaFinal}
                            onChange={e => setHoraFinal(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Mensajes de error */}
        <div className={styles.errorContainer}>
            {warningDataDocente?.length > 0 && (
                <div className={styles.errorMessage}>
                    <span className={styles.errorText}>{warningDataDocente}</span>
                </div>
            )}
        </div>
    </div>
);

export default DatosEspecialista;
