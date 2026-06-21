import React, { useEffect, useState } from 'react'
import { RiLoader4Line } from 'react-icons/ri'
import { MdAnalytics, MdClose } from 'react-icons/md'
import { toast } from 'react-toastify'
import { httpsCallable } from 'firebase/functions'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { functions, db } from '@/firebase/firebase.config'
import styles from '../../pages/admin/evaluaciones/evaluaciones.module.css'

// --- SUB-COMPONENTE PARA MANEJAR LA CONSOLIDACIÓN POR FILA ---
const ConsolidationAction = ({ eva }: { eva: any }) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const mes = eva.mesDelExamen;
  const año = eva.añoDelExamen || new Date().getFullYear().toString();

  useEffect(() => {
    if (!eva.id || mes === undefined || !año) return;

    const statusRef = doc(db, `evaluaciones/${eva.id}/estado_consolidacion`, `${año}_${mes}`);
    
    const unsubscribe = onSnapshot(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        setStatus(snapshot.data());
      } else {
        setStatus(null);
      }
    });

    return () => unsubscribe();
  }, [eva.id, año, mes]);

  const handleStartConsolidation = async (isForced = false) => {
    if (!eva.id) return;

    const message = isForced 
      ? `⚠️ El proceso parece haberse detenido en ${status?.progress || 0}%. ¿Deseas FORZAR el reinicio de la consolidación para "${eva.nombre}"?`
      : `🚀 ¿Deseas generar la consolidación completa para "${eva.nombre}" (${año})?\n\nEsto se ejecutará en segundo plano.`;

    const confirmed = window.confirm(message);

    if (!confirmed) return;

    setLoading(true);
    try {
      const callOrchestrator = httpsCallable(functions, 'startFullConsolidation', { timeout: 540000 });
      
      await callOrchestrator({
        idEvaluacion: eva.id,
        año: Number(año),
        mes: Number(mes)
      });

      toast.success(`🚀 Proceso ${isForced ? 'reiniciado' : 'iniciado'} para ${eva.nombre}`);
    } catch (error: any) {
      console.error('Error orchestrator:', error);
      toast.error(`Error: ${error.message || 'Error al iniciar'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStopConsolidation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!eva.id) return;

    const confirmed = window.confirm('🛑 ¿Deseas DETENER el proceso de consolidación?');
    if (!confirmed) return;

    try {
      const statusRef = doc(db, `evaluaciones/${eva.id}/estado_consolidacion`, `${año}_${mes}`);
      await updateDoc(statusRef, { 
        status: 'stopped',
        message: 'Proceso detenido por el usuario.',
        endTime: new Date()
      });
      toast.info('🛑 Petición de parada enviada.');
    } catch (error: any) {
      console.error('Error stopping:', error);
      toast.error('Error al detener el proceso.');
    }
  };

  const isProcessing = status?.status === 'processing';

  return (
    <div 
      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
    >
      <div 
        onClick={isProcessing ? () => handleStartConsolidation(true) : (!loading ? () => handleStartConsolidation(false) : undefined)}
        style={{ cursor: 'pointer', position: 'relative' }}
        title={isProcessing ? "Proceso en curso (clic para forzar reinicio si está trabado)" : "Generar consolidado global (Background)"}
      >
        {isProcessing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <RiLoader4Line className={`${styles.actionIcon} ${styles.loaderIcon}`} />
            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#4f46e5', marginTop: '-4px' }}>
              {status.progress}%
            </span>
          </div>
        ) : loading ? (
          <RiLoader4Line className={`${styles.actionIcon} ${styles.loaderIcon}`} />
        ) : (
          <MdAnalytics
            className={`${styles.actionIcon} ${styles.consolidadoIcon}`}
          />
        )}
      </div>

      {isProcessing && (
        <MdClose 
          className={styles.actionIcon}
          style={{ color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}
          title="Detener tarea"
          onClick={handleStopConsolidation}
        />
      )}
    </div>
  );
};

export default ConsolidationAction
