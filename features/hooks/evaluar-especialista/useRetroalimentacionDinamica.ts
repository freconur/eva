import { useState, useEffect } from 'react';
import { RetroalimentacionDinamica, CampoRetroalimentacionConfig } from '@/features/types/types';

interface UseRetroalimentacionOptions {
    dataEvaluacionDocente: any;
    dataEspecialista: any;
    isDataLoadedRef: React.MutableRefObject<boolean>;
    evaluacionId: string;
    updateConfiguracionCamposRetro: (
        id: string,
        config: { etiqueta: string; descripcion: string }[],
        silent?: boolean
    ) => Promise<void>;
}

export const useRetroalimentacionDinamica = ({
    dataEvaluacionDocente,
    dataEspecialista,
    isDataLoadedRef,
    evaluacionId,
    updateConfiguracionCamposRetro,
}: UseRetroalimentacionOptions) => {
    const [retroalimentacionDinamica, setRetroalimentacionDinamica] = useState<RetroalimentacionDinamica[]>([]);

    // Fusiona el molde global con la data guardada del especialista
    useEffect(() => {
        if (!dataEvaluacionDocente) return;

        const camposGlobales = dataEvaluacionDocente.camposRetroalimentacion || [];
        let dataGuardada: RetroalimentacionDinamica[] = dataEspecialista.retroalimentacionDinamica || [];

        if (isDataLoadedRef.current && retroalimentacionDinamica.length > 0) {
            dataGuardada = retroalimentacionDinamica;
        }

        const fusion = camposGlobales.map((campoConfig: CampoRetroalimentacionConfig | string) => {
            const esString = typeof campoConfig === 'string';
            const etiqueta = esString
                ? (campoConfig as string)
                : (campoConfig as CampoRetroalimentacionConfig).etiqueta;
            const descripcion = esString ? '' : (campoConfig as CampoRetroalimentacionConfig).descripcion;

            const guardado = dataGuardada.find(r => r.etiqueta === etiqueta);
            if (guardado) return { ...guardado, descripcion };

            // Compatibilidad con campos legados
            if (etiqueta === 'AVANCES')
                return { etiqueta, descripcion, contenido: dataEspecialista.avancesRetroalimentacion || '' };
            if (etiqueta === 'DIFICULTADES')
                return { etiqueta, descripcion, contenido: dataEspecialista.dificultadesRetroalimentacion || '' };
            if (etiqueta === 'COMPROMISOS')
                return { etiqueta, descripcion, contenido: dataEspecialista.compromisosRetroalimentacion || '' };

            return { etiqueta, descripcion, contenido: '' };
        });

        setRetroalimentacionDinamica(fusion);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataEvaluacionDocente, dataEspecialista]);

    const toConfig = (list: RetroalimentacionDinamica[]) =>
        list.map(f => ({ etiqueta: f.etiqueta, descripcion: f.descripcion || '' }));

    const handleAddFeedbackField = async () => {
        const updated: RetroalimentacionDinamica[] = [
            ...retroalimentacionDinamica,
            { etiqueta: 'NUEVA SECCIÓN', descripcion: '', contenido: '' },
        ];
        setRetroalimentacionDinamica(updated);
        if (evaluacionId) await updateConfiguracionCamposRetro(evaluacionId, toConfig(updated));
    };

    const handleRemoveFeedbackField = async (index: number) => {
        const updated = [...retroalimentacionDinamica];
        updated.splice(index, 1);
        setRetroalimentacionDinamica(updated);
        if (evaluacionId) await updateConfiguracionCamposRetro(evaluacionId, toConfig(updated));
    };

    const handleChangeFeedbackLabel = async (index: number, newLabel: string) => {
        const updated = [...retroalimentacionDinamica];
        const anteriorLabel = updated[index].etiqueta;
        const nuevoLabel = newLabel.toUpperCase();
        updated[index] = { ...updated[index], etiqueta: nuevoLabel };
        setRetroalimentacionDinamica(updated);
        if (evaluacionId && anteriorLabel !== nuevoLabel) {
            await updateConfiguracionCamposRetro(evaluacionId, toConfig(updated), true);
        }
    };

    const handleChangeFeedbackDescription = async (index: number, newDescription: string) => {
        const updated = [...retroalimentacionDinamica];
        const anteriorDescripcion = updated[index].descripcion;
        updated[index] = { ...updated[index], descripcion: newDescription };
        setRetroalimentacionDinamica(updated);
        if (evaluacionId && anteriorDescripcion !== newDescription) {
            await updateConfiguracionCamposRetro(evaluacionId, toConfig(updated), true);
        }
    };

    const handleChangeFeedbackValue = (index: number, newValue: string) => {
        const updated = [...retroalimentacionDinamica];
        updated[index] = { ...updated[index], contenido: newValue };
        setRetroalimentacionDinamica(updated);
    };

    return {
        retroalimentacionDinamica,
        setRetroalimentacionDinamica,
        handleAddFeedbackField,
        handleRemoveFeedbackField,
        handleChangeFeedbackLabel,
        handleChangeFeedbackDescription,
        handleChangeFeedbackValue,
    };
};
