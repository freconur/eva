import React from 'react';
import { MdCloudUpload, MdDelete, MdFilePresent } from 'react-icons/md';
import { RiLoader4Line } from 'react-icons/ri';
import { PRDocentes } from '@/features/types/types';
import styles from '@/pages/admin/especialistas/evaluaciones-especialistas/evaluacion/evaluar-especialista/evaluarEspecialista.module.css';

interface TablaEvaluacionProps {
    copyPR: PRDocentes[];
    dimensionesEspecialistas: any[];
    currentEscala: any[];
    dataEvaluacionDocente: any;
    dataEspecialista: any;
    dataDirector: any;
    uploadingMap: { [key: string]: boolean };
    handleCheckedRespuesta: (value: string, index: number) => void;
    handleUploadEvidencia: (e: React.ChangeEvent<HTMLInputElement>, index: number) => void;
    handleDeleteEvidencia: (preguntaIndex: number, evidenciaIndex: number) => void;
    handleSalvarPreguntaDocente: (e: React.FormEvent<HTMLFormElement>) => void;
}

const TablaEvaluacion: React.FC<TablaEvaluacionProps> = ({
    copyPR,
    dimensionesEspecialistas,
    currentEscala,
    dataEvaluacionDocente,
    dataEspecialista,
    dataDirector,
    uploadingMap,
    handleCheckedRespuesta,
    handleUploadEvidencia,
    handleDeleteEvidencia,
    handleSalvarPreguntaDocente,
}) => {
    const hasEvidencias = !!dataEvaluacionDocente?.activarEvidencias;
    const hasEspecialista = !!(dataEspecialista?.dni || dataDirector?.dni);

    const renderEvidenciaCell = (pregunta: PRDocentes, realIndex: number) => {
        if (!hasEvidencias) return null;
        return (
            <td className={styles.evidenceCell}>
                <div className={styles.evidenceContainer}>
                    {pregunta.requiereEvidencia && (
                        <div className={styles.evidenceList}>
                            {pregunta.evidencias?.map((ev, idx) => (
                                <div key={idx} className={styles.evidenceItem}>
                                    <div className={styles.fileDetails}>
                                        {ev.tipo.startsWith('image/') ? (
                                            <a href={ev.url} target="_blank" rel="noopener noreferrer" className={styles.thumbnailLink}>
                                                <div className={styles.thumbnailContainer}>
                                                    <img src={ev.url} alt={ev.nombre} className={styles.thumbnail} />
                                                </div>
                                            </a>
                                        ) : (
                                            <MdFilePresent className={styles.fileIcon} />
                                        )}
                                        <a href={ev.url} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                                            {ev.nombre.length > 15 ? ev.nombre.substring(0, 15) + '...' : ev.nombre}
                                        </a>
                                        <span className={styles.fileMetaInfo}>({ev.tipo.split('/')[1] || ev.tipo})</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteEvidencia(realIndex, idx)}
                                        className={styles.deleteFileButton}
                                    >
                                        <MdDelete />
                                    </button>
                                </div>
                            ))}

                            {uploadingMap[pregunta.id || ''] ? (
                                <div className={styles.localLoader}>
                                    <RiLoader4Line className={styles.spinner} />
                                    <span>Subiendo...</span>
                                </div>
                            ) : (
                                <label className={`${styles.uploadButton} ${!hasEspecialista ? styles.uploadButtonDisabled : ''}`}>
                                    <MdCloudUpload /> subir evidencia
                                    <input
                                        type="file"
                                        style={{ display: 'none' }}
                                        disabled={!hasEspecialista}
                                        onChange={e => handleUploadEvidencia(e, realIndex)}
                                    />
                                </label>
                            )}
                        </div>
                    )}
                </div>
            </td>
        );
    };

    const colSpanTotal = 2 + currentEscala.length + (hasEvidencias ? 1 : 0);

    return (
        <form onSubmit={handleSalvarPreguntaDocente} className={styles.form}>
            <div className={styles.tableContainer}>
                <table className={styles.evaluationTable}>
                    <thead>
                        <tr>
                            <th className={styles.colNumber}>№</th>
                            <th className={styles.colCriterio}>CRITERIO</th>
                            {currentEscala.map((escala: any) => (
                                <th key={escala.alternativa} className={styles.colValue}>
                                    {escala.value}
                                </th>
                            ))}
                            {hasEvidencias && <th className={styles.evidenceHeader}>EVIDENCIA</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {dimensionesEspecialistas?.length > 0 ? (
                            dimensionesEspecialistas.map(dimension => {
                                const preguntasDimension = copyPR.filter(p => p.dimensionId === dimension.id);
                                if (preguntasDimension.length === 0) return null;

                                return (
                                    <React.Fragment key={dimension.id}>
                                        <tr className={styles.dimensionRow}>
                                            <td colSpan={colSpanTotal} className={styles.dimensionTitle}>
                                                {dimension.nombre}
                                            </td>
                                        </tr>
                                        {preguntasDimension.map(pregunta => {
                                            const realIndex = copyPR.findIndex(p => p.id === pregunta.id);
                                            return (
                                                <tr key={pregunta.id} id={`question-${realIndex}`} className={styles.questionRow}>
                                                    <td className={styles.cellNumber}>{pregunta.order}</td>
                                                    <td className={styles.cellCriterio}>{pregunta.criterio}</td>
                                                    {currentEscala.map((escala: any) => {
                                                        const val = escala.alternativa || '';
                                                        const alt = pregunta.alternativas?.find(a => a.alternativa === val);
                                                        return (
                                                            <td key={val} className={styles.cellRadio}>
                                                                <input
                                                                    type="radio"
                                                                    name={`question-${pregunta.id}`}
                                                                    value={val}
                                                                    checked={alt?.selected || false}
                                                                    onChange={() => handleCheckedRespuesta(val, realIndex)}
                                                                    className={styles.radioInput}
                                                                />
                                                            </td>
                                                        );
                                                    })}
                                                    {renderEvidenciaCell(pregunta, realIndex)}
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })
                        ) : (
                            copyPR.map((pregunta, index) => (
                                <tr key={pregunta.id} id={`question-${index}`} className={styles.questionRow}>
                                    <td className={styles.cellNumber}>{index + 1}</td>
                                    <td className={styles.cellCriterio}>{pregunta.criterio}</td>
                                    {currentEscala.map((escala: any) => {
                                        const val = escala.alternativa || '';
                                        const alt = pregunta.alternativas?.find(
                                            a => (a.alternativa || '').toString() === val.toString()
                                        );
                                        return (
                                            <td key={val} className={styles.cellRadio}>
                                                <input
                                                    type="radio"
                                                    name={`question-${pregunta.id}`}
                                                    value={val}
                                                    checked={alt?.selected || false}
                                                    onChange={() => handleCheckedRespuesta(val, index)}
                                                    className={styles.radioInput}
                                                />
                                            </td>
                                        );
                                    })}
                                    {hasEvidencias && (
                                        <td className={styles.evidenceCell}>
                                            <div className={styles.evidenceContainer}>
                                                {pregunta.requiereEvidencia && (
                                                    <span className={styles.evidenceDescription}>
                                                        {pregunta.descripcionEvidencia || 'Cargar evidencia'}
                                                    </span>
                                                )}
                                                {pregunta.requiereEvidencia && (
                                                    <div className={styles.evidenceList}>
                                                        {pregunta.evidencias?.map((ev, idx) => (
                                                            <div key={idx} className={styles.evidenceItem}>
                                                                <div className={styles.fileDetails}>
                                                                    {ev.tipo.startsWith('image/') ? (
                                                                        <a href={ev.url} target="_blank" rel="noopener noreferrer" className={styles.thumbnailLink}>
                                                                            <div className={styles.thumbnailContainer}>
                                                                                <img src={ev.url} alt={ev.nombre} className={styles.thumbnail} />
                                                                            </div>
                                                                        </a>
                                                                    ) : (
                                                                        <MdFilePresent className={styles.fileIcon} />
                                                                    )}
                                                                    <a href={ev.url} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                                                                        {ev.nombre.length > 15 ? ev.nombre.substring(0, 15) + '...' : ev.nombre}
                                                                    </a>
                                                                    <span className={styles.fileMetaInfo}>
                                                                        ({ev.tipo.split('/')[1] || ev.tipo})
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteEvidencia(index, idx)}
                                                                    className={styles.deleteFileButton}
                                                                >
                                                                    <MdDelete />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {uploadingMap[pregunta.id || ''] ? (
                                                            <div className={styles.localLoader}>
                                                                <RiLoader4Line className={styles.spinner} />
                                                                <span>Subiendo...</span>
                                                            </div>
                                                        ) : (
                                                            <label className={`${styles.uploadButton} ${!hasEspecialista ? styles.uploadButtonDisabled : ''}`}>
                                                                <MdCloudUpload />{' '}
                                                                {!hasEspecialista ? 'Seleccione especialista' : 'Subir archivo'}
                                                                <input
                                                                    type="file"
                                                                    style={{ display: 'none' }}
                                                                    disabled={!hasEspecialista}
                                                                    onChange={e => handleUploadEvidencia(e, index)}
                                                                />
                                                            </label>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </form>
    );
};

export default TablaEvaluacion;
