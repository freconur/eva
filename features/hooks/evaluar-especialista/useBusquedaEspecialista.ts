import { useState, useRef, useEffect } from 'react';
import { User, PRDocentes, RetroalimentacionDinamica } from '@/features/types/types';

interface UseBusquedaOptions {
    // Funciones de UseEvaluacionEspecialistas
    buscarEspecialista: (dni: string) => void;
    resetEspecialista: () => void;
    getTodosLosEspecialistas: () => Promise<User[]>;
    getHistorialEspecialista: (evaluacionId: string, dni: string) => Promise<User[]>;
    getDataSeguimientoRetroalimentacionEspecialista: (evaluacionId: string, dni: string) => void;
    evaluacionId?: string;
    // Estado compartido de lectura
    dataEspecialista: any;
    dataDirector: any;
    dataEvaluacionDocente: any;
    // Setters de estado compartido que se deben resetear
    setCopyPR: React.Dispatch<React.SetStateAction<PRDocentes[]>>;
    originalPR: PRDocentes[];
    setEmailEspecialista: React.Dispatch<React.SetStateAction<string>>;
    setCelularEspecialista: React.Dispatch<React.SetStateAction<string>>;
    setRetroalimentacionDinamica: React.Dispatch<React.SetStateAction<RetroalimentacionDinamica[]>>;
    setCurrentSessionId: React.Dispatch<React.SetStateAction<string | null>>;
    setHoraInicio: React.Dispatch<React.SetStateAction<string>>;
}

export const useBusquedaEspecialista = ({
    buscarEspecialista,
    resetEspecialista,
    getTodosLosEspecialistas,
    getHistorialEspecialista,
    getDataSeguimientoRetroalimentacionEspecialista,
    evaluacionId,
    dataEspecialista,
    dataDirector,
    dataEvaluacionDocente,
    setCopyPR,
    originalPR,
    setEmailEspecialista,
    setCelularEspecialista,
    setRetroalimentacionDinamica,
    setCurrentSessionId,
    setHoraInicio,
}: UseBusquedaOptions) => {
    const [dniDocente, setDniDocente] = useState<string>('');
    const [todosLosEspecialistas, setTodosLosEspecialistas] = useState<User[]>([]);
    const [especialistasFiltrados, setEspecialistasFiltrados] = useState<User[]>([]);
    const [showDropdown, setShowDropdown] = useState<boolean>(false);
    const [historialEspecialista, setHistorialEspecialista] = useState<User[]>([]);
    const [showSessionSelector, setShowSessionSelector] = useState<boolean>(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Cierra el dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChangeDocente = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setDniDocente(value);

        if (value.trim() === '') {
            setEspecialistasFiltrados(todosLosEspecialistas);
        } else {
            const term = value.toLowerCase();
            const filtered = todosLosEspecialistas.filter(
                esp =>
                    esp.dni?.toLowerCase().includes(term) ||
                    esp.nombres?.toLowerCase().includes(term) ||
                    esp.apellidos?.toLowerCase().includes(term)
            );
            setEspecialistasFiltrados(filtered);
        }

        if (!showDropdown) setShowDropdown(true);

        // Si el usuario escribe de nuevo, limpiamos estado previo del especialista cargado
        if (dataEspecialista.dni || dataDirector.dni) {
            resetEspecialista();
            setCopyPR([...originalPR]);
            setEmailEspecialista('');
            setCelularEspecialista('');
            setRetroalimentacionDinamica([]);
        }
    };

    const handleInputClick = async () => {
        setShowDropdown(true);
        if (todosLosEspecialistas.length === 0) {
            const all = await getTodosLosEspecialistas();
            const sorted = (all || []).sort((a, b) =>
                (a.apellidos || '').localeCompare(b.apellidos || '', 'es', { sensitivity: 'base' })
            );
            setTodosLosEspecialistas(sorted);
            setEspecialistasFiltrados(sorted);
        }
    };

    const buscarEspecialistaFromSelection = async (dni: string) => {
        buscarEspecialista(dni);
        if (evaluacionId) {
            getDataSeguimientoRetroalimentacionEspecialista(evaluacionId, dni);
            const history = await getHistorialEspecialista(evaluacionId, dni);
            setHistorialEspecialista(history);

            if (history.length > 0) {
                // Verificar si hay una sesión de la fase actual para autocompletar
                const currentPhaseSession = dataEvaluacionDocente?.faseActualID
                    ? history.find(h => h.idFase === dataEvaluacionDocente.faseActualID)
                    : null;

                if (currentPhaseSession) {
                    handleContinueEvaluation(currentPhaseSession.id!);
                } else {
                    setShowSessionSelector(true);
                }
            } else {
                setCurrentSessionId(null);
            }
        }
    };

    const handleSelectEspecialista = (esp: User) => {
        setDniDocente(esp.dni || '');
        setShowDropdown(false);
        buscarEspecialistaFromSelection(esp.dni || '');
    };

    const handleBuscarDocente = async () => {
        buscarEspecialista(dniDocente);
        if (evaluacionId) {
            getDataSeguimientoRetroalimentacionEspecialista(evaluacionId, dniDocente);
            const history = await getHistorialEspecialista(evaluacionId, dniDocente);
            setHistorialEspecialista(history);

            if (history.length > 0) {
                // Verificar si hay una sesión de la fase actual para autocompletar
                const currentPhaseSession = dataEvaluacionDocente?.faseActualID
                    ? history.find(h => h.idFase === dataEvaluacionDocente.faseActualID)
                    : null;

                if (currentPhaseSession) {
                    handleContinueEvaluation(currentPhaseSession.id!);
                } else {
                    setShowSessionSelector(true);
                }
            } else {
                setCurrentSessionId(null);
            }
        }
    };

    const handleStartNewEvaluation = () => {
        setCurrentSessionId(null);
        setShowSessionSelector(false);
        setCopyPR([...originalPR]);
        setRetroalimentacionDinamica([]);
        setHoraInicio('');
    };

    const handleContinueEvaluation = (sessionId: string) => {
        setCurrentSessionId(sessionId);
        setShowSessionSelector(false);
        if (evaluacionId) {
            getDataSeguimientoRetroalimentacionEspecialista(evaluacionId, sessionId);
        }
    };

    /** Expuesto para que el hub pueda resetear este sub-estado desde handleCerrarEspecialista */
    const resetBusqueda = () => {
        setDniDocente('');
        setHistorialEspecialista([]);
        setShowSessionSelector(false);
        setEspecialistasFiltrados(todosLosEspecialistas);
        setShowDropdown(false);
    };

    return {
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
        resetBusqueda,
    };
};
