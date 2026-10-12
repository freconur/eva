import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  RiLoader4Line,
  RiUploadCloud2Line,
  RiDeleteBin6Line,
  RiFileTextLine,
  RiExternalLinkLine,
  RiImageLine,
} from 'react-icons/ri';
import useEvaluacionDesempenoBase from '@/features/hooks/useEvaluacionDesempenoBase';
import { Evidencia } from '@/features/types/types';
import { ModalEvidenciasProps } from '../types';
import styles from './modals.module.css';

export const ModalEvidencias: React.FC<ModalEvidenciasProps> = ({
  isOpen,
  onClose,
  idEvaluacion,
  collectionName,
  pregunta,
  evaluadoDni,
  currentSessionId,
  onEvidenciasChange,
}) => {
  const { uploadEvidencia, deleteEvidencia } = useEvaluacionDesempenoBase({ collectionName });

  const [uploading, setUploading] = useState<boolean>(false);
  const [evidencias, setEvidencias] = useState<Evidencia[]>(pregunta.evidencias || []);

  if (!isOpen) return null;

  const folderId = currentSessionId || evaluadoDni;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !idEvaluacion || !folderId || !pregunta.id) return;

    setUploading(true);
    try {
      const nueva = await uploadEvidencia(file, idEvaluacion, folderId, pregunta.id);
      const updated = [...evidencias, nueva];
      setEvidencias(updated);
      if (onEvidenciasChange) onEvidenciasChange(updated);
    } catch (error) {
      console.error('Error al subir evidencia:', error);
      alert('Error al subir el archivo de evidencia');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (index: number) => {
    const item = evidencias[index];
    if (!item) return;

    if (window.confirm(`¿Estás seguro de eliminar el archivo "${item.nombre}"?`)) {
      try {
        await deleteEvidencia(item.url);
        const updated = evidencias.filter((_, i) => i !== index);
        setEvidencias(updated);
        if (onEvidenciasChange) onEvidenciasChange(updated);
      } catch (error) {
        console.error('Error al eliminar evidencia:', error);
        alert('Error al eliminar el archivo de evidencia');
      }
    }
  };

  const isImage = (tipo?: string, url?: string) => {
    return (
      tipo?.startsWith('image/') ||
      url?.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i)
    );
  };

  const modalContent = (
    <div className={styles.containerModal} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.containerSale} ${styles.containerSaleLarge}`}>
        <div className={styles.closeModalContainer}>
          <h3 className={styles.title}>
            <RiFileTextLine /> Evidencias del Criterio
          </h3>
          <button type="button" className={styles.close} onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
          <p style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>
            {pregunta.criterio}
          </p>
          {pregunta.descripcionEvidencia && (
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              <strong>Orientación:</strong> {pregunta.descripcionEvidencia}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              textAlign: 'center',
              background: '#f8fafc',
            }}
          >
            {uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <RiLoader4Line className={styles.loaderIcon} style={{ fontSize: '2rem' }} />
                <p style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>
                  Subiendo archivo de evidencia...
                </p>
              </div>
            ) : (
              <label style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <RiUploadCloud2Line style={{ fontSize: '2.5rem', color: '#2563eb' }} />
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  Haz clic para subir evidencia (PDF, Imagen, Documento)
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Máximo 20MB por archivo
                </span>
                <input
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                />
              </label>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
              Archivos Adjuntos ({evidencias.length})
            </h4>

            {evidencias.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', padding: '0.5rem 0' }}>
                No se han adjuntado evidencias para este criterio aún.
              </p>
            ) : (
              <div className={styles.optionsList}>
                {evidencias.map((ev, idx) => (
                  <div
                    key={idx}
                    className={styles.optionRow}
                    style={{ justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      {isImage(ev.tipo, ev.url) ? (
                        <RiImageLine style={{ fontSize: '1.5rem', color: '#10b981', flexShrink: 0 }} />
                      ) : (
                        <RiFileTextLine style={{ fontSize: '1.5rem', color: '#3b82f6', flexShrink: 0 }} />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontWeight: 600,
                            color: '#1e293b',
                            fontSize: '0.9rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {ev.nombre}
                        </p>
                        {ev.fechaSubida && (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            Subido: {new Date(ev.fechaSubida).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.cancelButton}
                        style={{ padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none' }}
                      >
                        <RiExternalLinkLine /> Ver
                      </a>
                      <button
                        type="button"
                        className={styles.removeButton}
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => handleDelete(idx)}
                        title="Eliminar evidencia"
                      >
                        <RiDeleteBin6Line />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.submitButton} onClick={onClose}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;
  const portalRoot = document.getElementById('portal-modal') || document.body;
  return createPortal(modalContent, portalRoot);
};

export default ModalEvidencias;
