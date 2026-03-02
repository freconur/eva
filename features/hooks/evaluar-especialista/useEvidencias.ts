import { useState } from 'react';
import { PRDocentes } from '@/features/types/types';

interface UseEvidenciasOptions {
    copyPR: PRDocentes[];
    setCopyPR: React.Dispatch<React.SetStateAction<PRDocentes[]>>;
    uploadEvidenciaFn: (file: File, evaluacionId: string, folderId: string, preguntaId: string) => Promise<any>;
    deleteEvidenciaFn: (storagePath: string) => Promise<void>;
    evaluacionId: string;
    currentSessionId: string | null;
    dniTarget?: string;
}

export const useEvidencias = ({
    copyPR,
    setCopyPR,
    uploadEvidenciaFn,
    deleteEvidenciaFn,
    evaluacionId,
    currentSessionId,
    dniTarget,
}: UseEvidenciasOptions) => {
    const [uploadingMap, setUploadingMap] = useState<{ [key: string]: boolean }>({});

    const handleUploadEvidencia = async (
        e: React.ChangeEvent<HTMLInputElement>,
        preguntaIndex: number
    ) => {
        const file = e.target.files?.[0];
        const pregunta = copyPR[preguntaIndex];

        if (!file || !evaluacionId || !dniTarget || !pregunta) return;

        try {
            setUploadingMap(prev => ({ ...prev, [pregunta.id || '']: true }));
            const folderId = currentSessionId || dniTarget;
            const nuevaEvidencia = await uploadEvidenciaFn(file, evaluacionId, folderId, pregunta.id || '');

            setCopyPR(prev => {
                const updated = [...prev];
                const evidenciasActuales = updated[preguntaIndex].evidencias || [];
                updated[preguntaIndex] = {
                    ...updated[preguntaIndex],
                    evidencias: [...evidenciasActuales, nuevaEvidencia],
                };
                return updated;
            });
        } catch (error) {
            console.error('Error upload evidencia:', error);
        } finally {
            setUploadingMap(prev => ({ ...prev, [pregunta.id || '']: false }));
        }
    };

    const handleDeleteEvidencia = async (preguntaIndex: number, evidenciaIndex: number) => {
        const pregunta = copyPR[preguntaIndex];
        const evidencia = pregunta.evidencias?.[evidenciaIndex];
        if (!evidencia) return;

        try {
            const decodedUrl = decodeURIComponent(evidencia.url);
            const storagePath = decodedUrl.split('/o/')[1].split('?')[0];
            await deleteEvidenciaFn(storagePath);

            setCopyPR(prev => {
                const updated = [...prev];
                const nuevasEvidencias = [...(updated[preguntaIndex].evidencias || [])];
                nuevasEvidencias.splice(evidenciaIndex, 1);
                updated[preguntaIndex] = { ...updated[preguntaIndex], evidencias: nuevasEvidencias };
                return updated;
            });
        } catch (error) {
            console.error('Error delete evidencia:', error);
        }
    };

    return { uploadingMap, handleUploadEvidencia, handleDeleteEvidencia };
};
