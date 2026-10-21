import { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-toastify';
import { RetroalimentacionDinamica, CampoRetroalimentacionConfig } from '@/features/types/types';

let idCounter = 0;
const generateStableId = (prefix = 'rf') =>
    `${prefix}_${Date.now()}_${++idCounter}_${Math.random().toString(36).substring(2, 8)}`;

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
    const [isSavingTemplateConfig, setIsSavingTemplateConfig] = useState<boolean>(false);

    // Rastreadores para sincronización y evitar sobreescritura accidental mientras el usuario edita
    const userHasEditedRef = useRef(false);
    const lastLoadedEvalIdRef = useRef<string | null>(null);

    // Configuración canónica guardada actualmente en la evaluación específica
    const savedConfig = useMemo<{ etiqueta: string; descripcion: string }[]>(() => {
        if (!dataEvaluacionDocente) return [];
        const defaultCampos = ['AVANCES', 'DIFICULTADES', 'COMPROMISOS'];
        const camposEspecificos =
            dataEvaluacionDocente.camposRetroalimentacion && dataEvaluacionDocente.camposRetroalimentacion.length > 0
                ? dataEvaluacionDocente.camposRetroalimentacion
                : defaultCampos;

        return camposEspecificos.map((campoConfig: CampoRetroalimentacionConfig | string) => {
            const esString = typeof campoConfig === 'string';
            const etiqueta = esString
                ? (campoConfig as string).trim().toUpperCase()
                : (campoConfig as CampoRetroalimentacionConfig).etiqueta.trim().toUpperCase();
            const descripcion = esString ? '' : ((campoConfig as CampoRetroalimentacionConfig).descripcion || '');
            return { etiqueta, descripcion };
        });
    }, [dataEvaluacionDocente]);

    // Detecta si la plantilla local tiene diferencias respecto a lo guardado en Firestore
    const isTemplateDirty = useMemo(() => {
        if (!userHasEditedRef.current) return false;
        if (retroalimentacionDinamica.length !== savedConfig.length) return true;

        return retroalimentacionDinamica.some((item, idx) => {
            const saved = savedConfig[idx];
            if (!saved) return true;
            const normEtiqueta = (item.etiqueta || '').trim().toUpperCase();
            const normDesc = item.descripcion || '';
            return normEtiqueta !== saved.etiqueta || normDesc !== saved.descripcion;
        });
    }, [retroalimentacionDinamica, savedConfig]);

    // Sincroniza la retroalimentación cualitativa usando los campos de ESTA evaluación
    useEffect(() => {
        if (!dataEvaluacionDocente) return;

        const currentEvalId = dataEvaluacionDocente.id || evaluacionId;

        // Si cambió la evaluación, reiniciar el indicador de edición y cargar la plantilla de la nueva evaluación
        if (lastLoadedEvalIdRef.current !== currentEvalId) {
            lastLoadedEvalIdRef.current = currentEvalId;
            userHasEditedRef.current = false;
        }

        // Si el usuario tiene ediciones activas en la plantilla de esta misma evaluación, no sobreescribir mientras edita
        if (userHasEditedRef.current) return;

        const defaultCampos = ['AVANCES', 'DIFICULTADES', 'COMPROMISOS'];
        const camposDeEstaEvaluacion =
            dataEvaluacionDocente.camposRetroalimentacion && dataEvaluacionDocente.camposRetroalimentacion.length > 0
                ? dataEvaluacionDocente.camposRetroalimentacion
                : defaultCampos;

        let dataGuardada: RetroalimentacionDinamica[] = dataEspecialista?.retroalimentacionDinamica || [];

        if (isDataLoadedRef.current && retroalimentacionDinamica.length > 0) {
            dataGuardada = retroalimentacionDinamica;
        }

        const fusion = camposDeEstaEvaluacion.map((campoConfig: CampoRetroalimentacionConfig | string, idx: number) => {
            const esString = typeof campoConfig === 'string';
            const etiqueta = esString
                ? (campoConfig as string).trim().toUpperCase()
                : (campoConfig as CampoRetroalimentacionConfig).etiqueta.trim().toUpperCase();
            const descripcion = esString ? '' : ((campoConfig as CampoRetroalimentacionConfig).descripcion || '');

            const etiquetaNorm = etiqueta;
            const guardado = dataGuardada.find(
                r => (r.etiqueta || '').trim().toUpperCase() === etiquetaNorm
            );

            // Clave única e inmutable para no perder el foco
            const stableId =
                guardado?.id ||
                retroalimentacionDinamica[idx]?.id ||
                generateStableId(`field_${idx}`);

            let contenido = guardado?.contenido || '';

            // Fallback con datos legados en caso de que el contenido de la sección dinámica esté vacío
            if (!contenido) {
                if (etiquetaNorm.includes('AVANCE') || etiquetaNorm.includes('FORTALEZA')) {
                    contenido = dataEspecialista?.avancesRetroalimentacion || '';
                } else if (etiquetaNorm.includes('DIFICULTAD')) {
                    contenido = dataEspecialista?.dificultadesRetroalimentacion || '';
                } else if (etiquetaNorm.includes('COMPROMISO') || etiquetaNorm.includes('MEJORA')) {
                    contenido = dataEspecialista?.compromisosRetroalimentacion || '';
                }
            }

            return {
                id: stableId,
                etiqueta,
                descripcion,
                contenido,
            };
        });

        setRetroalimentacionDinamica(fusion);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataEvaluacionDocente, dataEspecialista]);

    const toConfig = (list: RetroalimentacionDinamica[]) =>
        list.map(f => ({
            etiqueta: (f.etiqueta || '').trim().toUpperCase(),
            descripcion: f.descripcion || '',
        }));

    // Modificaciones locales de estructura (Cero peticiones de red mientras se edita)
    const handleAddFeedbackField = () => {
        userHasEditedRef.current = true;
        const updated: RetroalimentacionDinamica[] = [
            ...retroalimentacionDinamica,
            { id: generateStableId('new_field'), etiqueta: 'NUEVA SECCIÓN', descripcion: '', contenido: '' },
        ];
        setRetroalimentacionDinamica(updated);
    };

    const handleRemoveFeedbackField = (index: number) => {
        userHasEditedRef.current = true;
        const updated = [...retroalimentacionDinamica];
        updated.splice(index, 1);
        setRetroalimentacionDinamica(updated);
    };

    const handleChangeFeedbackLabel = (index: number, newLabel: string) => {
        userHasEditedRef.current = true;
        const updated = [...retroalimentacionDinamica];
        const nuevoLabel = newLabel.toUpperCase();
        updated[index] = { ...updated[index], etiqueta: nuevoLabel };
        setRetroalimentacionDinamica(updated);
    };

    const handleChangeFeedbackDescription = (index: number, newDescription: string) => {
        userHasEditedRef.current = true;
        const updated = [...retroalimentacionDinamica];
        updated[index] = { ...updated[index], descripcion: newDescription };
        setRetroalimentacionDinamica(updated);
    };

    const handleChangeFeedbackValue = (index: number, newValue: string) => {
        const updated = [...retroalimentacionDinamica];
        updated[index] = { ...updated[index], contenido: newValue };
        setRetroalimentacionDinamica(updated);
    };

    // Guardado explícito en 1 sola llamada a Firestore para ESTA evaluación
    const handleSaveTemplateConfig = async () => {
        if (!evaluacionId) {
            toast.warning('No se identificó la evaluación para guardar la plantilla.');
            return;
        }
        setIsSavingTemplateConfig(true);
        try {
            await updateConfiguracionCamposRetro(evaluacionId, toConfig(retroalimentacionDinamica));
            userHasEditedRef.current = false;
            toast.success('Plantilla de retroalimentación guardada exitosamente.');
        } catch (error) {
            console.error('Error al guardar plantilla de retroalimentación:', error);
            toast.error('Ocurrió un error al guardar la plantilla de retroalimentación.');
        } finally {
            setIsSavingTemplateConfig(false);
        }
    };

    // Descartar cambios pendientes y restaurar la plantilla canónica de Firestore
    const handleDiscardTemplateChanges = () => {
        if (!dataEvaluacionDocente) return;
        userHasEditedRef.current = false;
        const fusion = savedConfig.map((sc, idx) => {
            const existing = retroalimentacionDinamica.find(
                r => (r.etiqueta || '').trim().toUpperCase() === sc.etiqueta
            );
            return {
                id: existing?.id || generateStableId(`field_${idx}`),
                etiqueta: sc.etiqueta,
                descripcion: sc.descripcion,
                contenido: existing?.contenido || '',
            };
        });
        setRetroalimentacionDinamica(fusion);
        toast.info('Se han descartado los cambios en la plantilla.');
    };

    return {
        retroalimentacionDinamica,
        setRetroalimentacionDinamica,
        isTemplateDirty,
        isSavingTemplateConfig,
        handleSaveTemplateConfig,
        handleDiscardTemplateChanges,
        handleAddFeedbackField,
        handleRemoveFeedbackField,
        handleChangeFeedbackLabel,
        handleChangeFeedbackDescription,
        handleChangeFeedbackValue,
    };
};
