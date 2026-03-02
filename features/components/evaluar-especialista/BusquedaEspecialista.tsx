import React from 'react';
import { User } from '@/features/types/types';
import styles from '@/pages/admin/especialistas/evaluaciones-especialistas/evaluacion/evaluar-especialista/evaluarEspecialista.module.css';

interface BusquedaEspecialistaProps {
    dniDocente: string;
    especialistasFiltrados: User[];
    showDropdown: boolean;
    searchRef: React.RefObject<HTMLDivElement>;
    historialEspecialista: User[];
    showSessionSelector: boolean;
    handleChangeDocente: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleInputClick: () => void;
    handleSelectEspecialista: (esp: User) => void;
    handleBuscarDocente: () => void;
    handleStartNewEvaluation: () => void;
    handleContinueEvaluation: (sessionId: string) => void;
}

const BusquedaEspecialista: React.FC<BusquedaEspecialistaProps> = ({
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
}) => (
    <div className={styles.searchForm}>
        <div className={styles.searchInputContainer} ref={searchRef}>
            <label className={styles.searchLabel}>Búsqueda de Especialista</label>
            <input
                name="dni"
                className={styles.searchInput}
                type="text"
                placeholder="Nombre, apellidos o DNI"
                value={dniDocente}
                onChange={handleChangeDocente}
                onClick={handleInputClick}
                autoComplete="off"
            />
            {showDropdown && (
                <div className={styles.searchDropdown}>
                    {especialistasFiltrados.length > 0 ? (
                        especialistasFiltrados.map(esp => (
                            <div
                                key={esp.id}
                                className={styles.dropdownItem}
                                onClick={() => handleSelectEspecialista(esp)}
                            >
                                <div className={styles.dropdownItemMain}>
                                    {esp.apellidos?.toUpperCase()} {esp.nombres?.toUpperCase()}
                                </div>
                                <div className={styles.dropdownItemSub}>DNI: {esp.dni}</div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.noResults}>No se encontraron especialistas</div>
                    )}
                </div>
            )}
        </div>

        <div className={styles.searchActions}>
            <button
                disabled={dniDocente.length === 0}
                onClick={handleBuscarDocente}
                className={styles.searchButton}
            >
                Buscar
            </button>
        </div>

        {showSessionSelector && (
            <div className={styles.sessionSelectorContainer}>
                <h4 className={styles.sessionSelectorTitle}>Se encontraron evaluaciones previas:</h4>
                <div className={styles.sessionOptions}>
                    <button onClick={handleStartNewEvaluation} className={styles.newSessionButton}>
                        Iniciar Nueva Evaluación
                    </button>
                    <div className={styles.historyList}>
                        <p className={styles.historyListTitle}>O continuar una anterior:</p>
                        {historialEspecialista.map(evaluacion => (
                            <button
                                key={evaluacion.id}
                                onClick={() => handleContinueEvaluation(evaluacion.id!)}
                                className={styles.historyItemButton}
                            >
                                {evaluacion.fechaMonitoreo || 'Sin fecha'} - Puntaje:{' '}
                                {evaluacion.calificacion || 0}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}
    </div>
);

export default BusquedaEspecialista;
