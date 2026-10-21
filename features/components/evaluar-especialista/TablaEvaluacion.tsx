import React from 'react';
import { MdCloudUpload, MdDelete, MdFilePresent } from 'react-icons/md';
import { RiLoader4Line, RiInformationLine } from 'react-icons/ri';
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
            {/* Leyenda de la Escala de Calificación */}
            {currentEscala && currentEscala.length > 0 && (
                <div className="mb-4 bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 mb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <RiInformationLine className="text-base text-blue-600 shrink-0" />
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800 tracking-wide">
                                Escala de Valoración / Leyenda de Calificación
                            </h4>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                            Correspondencia de las columnas de calificación
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                        {currentEscala.map((escala: any, idx: number) => {
                            const val = escala.value !== undefined ? escala.value : (escala.alternativa ?? idx);
                            const desc = escala.descripcion || escala.alternativa || `Nivel ${val}`;
                            return (
                                <div
                                    key={escala.alternativa ?? idx}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/90 text-xs shadow-2xs hover:bg-slate-100/80 transition-colors"
                                >
                                    <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs shrink-0">
                                        {val}
                                    </span>
                                    <span className="text-slate-400 font-bold select-none">=</span>
                                    <span className="font-semibold text-slate-700">
                                        {desc}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

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
                        {(() => {
                            let questionCounter = 0;

                            if (dimensionesEspecialistas?.length > 0) {
                                const dominiosIds = new Set(dimensionesEspecialistas.map((d: any) => String(d.id)));
                                const preguntasSinDominio = copyPR.filter((p) => {
                                    const pDimId = p.dimensionId || (p as any).dimencionId;
                                    return !pDimId || !dominiosIds.has(String(pDimId));
                                });

                                return (
                                    <>
                                        {dimensionesEspecialistas.map(dimension => {
                                            const preguntasDimension = copyPR.filter(
                                                p => String(p.dimensionId || (p as any).dimencionId) === String(dimension.id)
                                            );
                                            if (preguntasDimension.length === 0) return null;

                                            return (
                                                <React.Fragment key={dimension.id}>
                                                    <tr className={styles.dimensionRow}>
                                                        <td colSpan={colSpanTotal} className={styles.dimensionTitle}>
                                                            {dimension.nombre}
                                                        </td>
                                                    </tr>
                                                    {preguntasDimension.map(pregunta => {
                                                        questionCounter += 1;
                                                        const currentDisplayNumber = questionCounter;
                                                        const realIndex = copyPR.findIndex(
                                                            p => (p.id && pregunta.id && String(p.id) === String(pregunta.id)) ||
                                                                 (p.order !== undefined && pregunta.order !== undefined && String(p.order) === String(pregunta.order))
                                                        );
                                                        const actualIndex = realIndex !== -1 ? realIndex : copyPR.indexOf(pregunta);
                                                        return (
                                                            <tr key={pregunta.id || `q-${pregunta.order || actualIndex}`} id={`question-${actualIndex}`} className={styles.questionRow}>
                                                                <td className={styles.cellNumber}>{currentDisplayNumber}</td>
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
                                                                                onChange={() => handleCheckedRespuesta(val, actualIndex)}
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
                                        })}

                                        {preguntasSinDominio.length > 0 && (
                                            <React.Fragment key="sin-dominio">
                                                <tr className={styles.dimensionRow}>
                                                    <td colSpan={colSpanTotal} className={styles.dimensionTitle}>
                                                        Criterios Generales (Sin Dominio Asignado)
                                                    </td>
                                                </tr>
                                                {preguntasSinDominio.map(pregunta => {
                                                    questionCounter += 1;
                                                    const currentDisplayNumber = questionCounter;
                                                    const realIndex = copyPR.findIndex(
                                                        p => (p.id && pregunta.id && String(p.id) === String(pregunta.id)) ||
                                                             (p.order !== undefined && pregunta.order !== undefined && String(p.order) === String(pregunta.order))
                                                    );
                                                    const actualIndex = realIndex !== -1 ? realIndex : copyPR.indexOf(pregunta);
                                                    return (
                                                        <tr key={pregunta.id || `q-${pregunta.order || actualIndex}`} id={`question-${actualIndex}`} className={styles.questionRow}>
                                                            <td className={styles.cellNumber}>{currentDisplayNumber}</td>
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
                                                                            onChange={() => handleCheckedRespuesta(val, actualIndex)}
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
                                        )}
                                    </>
                                );
                            }

                            return copyPR.map((pregunta, index) => (
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
                            ));
                        })()}
                    </tbody>
                </table>
            </div>
        </form>
    );
};

export default TablaEvaluacion;
