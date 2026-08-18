import React from 'react';
import { RiCloseLine } from 'react-icons/ri';
import { RetroalimentacionDinamica } from '@/features/types/types';
import styles from '@/pages/admin/especialistas/evaluaciones-especialistas/evaluacion/evaluar-especialista/evaluarEspecialista.module.css';

interface RetroalimentacionSectionProps {
    retroalimentacionDinamica: RetroalimentacionDinamica[];
    isAutoreporte: boolean;
    handleAddFeedbackField: () => void;
    handleRemoveFeedbackField: (index: number) => void;
    handleChangeFeedbackLabel: (index: number, newLabel: string) => void;
    handleChangeFeedbackDescription: (index: number, newDescription: string) => void;
    handleChangeFeedbackValue: (index: number, newValue: string) => void;
}

const RetroalimentacionSection: React.FC<RetroalimentacionSectionProps> = ({
    retroalimentacionDinamica,
    isAutoreporte,
    handleAddFeedbackField,
    handleRemoveFeedbackField,
    handleChangeFeedbackLabel,
    handleChangeFeedbackDescription,
    handleChangeFeedbackValue,
}) => (
    <div className={styles.feedbackSection}>
        <div className={styles.feedbackHeader}>
            <h3 className={styles.feedbackTitle}>RETROALIMENTACIÓN CUALITATIVA</h3>
            {!isAutoreporte && (
                <div className={styles.feedbackActions}>
                    <button
                        type="button"
                        onClick={handleAddFeedbackField}
                        className={styles.addFieldButton}
                    >
                        + Agregar campo
                    </button>
                </div>
            )}
        </div>

        <div className={styles.feedbackGrid}>
            {retroalimentacionDinamica.map((item, index) => {
                const safeKey = `${item.etiqueta || 'section'}-${index}`;
                const fieldId = `feedback_content_${index}_${(item.etiqueta || '').toLowerCase().replace(/\s+/g, '_')}`;
                return (
                    <div key={safeKey} className={styles.feedbackGroup}>
                        <div className={styles.labelWrapper}>
                            <input
                                id={`feedback_label_${index}`}
                                name={`feedback_label_${index}`}
                                className={styles.editableLabel}
                                value={item.etiqueta}
                                onChange={e => handleChangeFeedbackLabel(index, e.target.value)}
                                placeholder="Título del campo..."
                                readOnly={isAutoreporte}
                            />
                            {!isAutoreporte && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFeedbackField(index)}
                                    className={styles.removeFieldButton}
                                    title="Eliminar campo"
                                >
                                    <RiCloseLine />
                                </button>
                            )}
                        </div>

                        <div className={styles.descriptionWrapper}>
                            <textarea
                                id={`feedback_desc_${index}`}
                                name={`feedback_desc_${index}`}
                                className={styles.editableDescription}
                                value={item.descripcion || ''}
                                onChange={e =>
                                    !isAutoreporte && handleChangeFeedbackDescription(index, e.target.value)
                                }
                                placeholder="Ej. Aquí debe detallar en qué situaciones el especialista presentó un déficit..."
                                rows={2}
                                readOnly={isAutoreporte}
                            />
                        </div>

                        <textarea
                            id={fieldId}
                            name={fieldId}
                            className={styles.feedbackTextarea}
                            placeholder={`Describa ${(item.etiqueta || '').toLowerCase()}...`}
                            value={item.contenido}
                            onChange={e => handleChangeFeedbackValue(index, e.target.value)}
                            rows={4}
                        />
                    </div>
                );
            })}
        </div>
    </div>
);

export default RetroalimentacionSection;
