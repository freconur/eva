import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { IoArrowBack, IoLink } from 'react-icons/io5';
import { RiLoader4Line } from 'react-icons/ri';
import { MdDownload, MdUpdate, MdSave } from 'react-icons/md';
import {
	doc,
	getDocs,
	updateDoc,
	setDoc,
	collection,
	query,
	where,
	onSnapshot,
} from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';
import { User, AlternativasDocente } from '@/features/types/types';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useEvaluacionDesempenoBase } from '@/features/hooks/useEvaluacionDesempenoBase';
import { regionTexto } from '@/fuctions/regiones';
import styles from './reporteIndividual.module.css';

export const TextWithLinks = ({
	text,
	emptyText = 'Sin información registrada.',
}: {
	text: string | null | undefined;
	emptyText?: string;
}) => {
	if (!text) return <span className={styles.empty}>{emptyText}</span>;

	const urlRegex = /(https?:\/\/[^\s]+)/g;
	const parts = text.split(urlRegex);

	return (
		<>
			{parts.map((part, index) => {
				if (part.match(urlRegex)) {
					return (
						<a
							key={index}
							href={part}
							target="_blank"
							rel="noopener noreferrer"
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: '4px',
								color: '#0066CC',
								fontWeight: 600,
								textDecoration: 'none',
								backgroundColor: '#F0F8FF',
								padding: '2px 8px',
								borderRadius: '6px',
								border: '1px solid #CCE5FF',
								margin: '0 4px',
								transition: 'all 0.2s ease-in-out',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = '#E5F3FF';
								e.currentTarget.style.borderColor = '#B3D7FF';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = '#F0F8FF';
								e.currentTarget.style.borderColor = '#CCE5FF';
							}}
						>
							<IoLink /> Enlace adjunto
						</a>
					);
				}
				return (
					<span key={index} style={{ whiteSpace: 'pre-wrap' }}>
						{part}
					</span>
				);
			})}
		</>
	);
};

export interface ReporteIndividualContainerProps {
	collectionName:
		| 'evaluaciones-especialista'
		| 'evaluaciones-especialistas'
		| 'evaluaciones-director'
		| 'evaluaciones-docentes'
		| string;
	role: 'admin' | 'especialista' | 'director' | string;
	monitoreadoRoleLabel?: string;
	monitorRoleLabel?: string;
	backHref?: string | ((idEvaluacion: string) => string);
}

export const ReporteIndividualContainer: React.FC<ReporteIndividualContainerProps> = ({
	collectionName,
	role,
	monitoreadoRoleLabel = 'DATOS DEL(A) MONITOREADO (A):',
	monitorRoleLabel = 'DATOS DEL MONITOR:',
	backHref,
}) => {
	const router = useRouter();
	const idEvaluacion = (router.query.idEvaluacion as string) || '';
	const sessionIdQuery = (router.query.sessionId as string) || '';
	const targetDni =
		((router.query.idDirector ||
			router.query.idDocente ||
			router.query.idEvaluado ||
			router.query.dni) as string) || '';

	const {
		getPreguntaRespuestaDocentes,
		dimensionesEspecialistas,
		dataEvaluacionDocente,
		loaderSalvarPregunta,
		currentUserData,
	} = useGlobalContext();

	const {
		getDataEvaluacion,
		getPreguntasRespuestas,
		getDimensiones,
		calcularCalificacion,
	} = useEvaluacionDesempenoBase({
		collectionName,
		role: role as any,
	});

	const [resolvedSessionId, setResolvedSessionId] = useState<string>(sessionIdQuery);
	const [dataEvaluado, setDataEvaluado] = useState<User | null>(null);
	const [localData, setLocalData] = useState<User | null>(null);
	const [hasChanges, setHasChanges] = useState(false);
	const [pdfGenerating, setPdfGenerating] = useState(false);
	const [isLoadingSession, setIsLoadingSession] = useState(true);

	// 1. Cargar metadatos de la evaluación, preguntas y dimensiones
	useEffect(() => {
		if (idEvaluacion) {
			const unsubEval = getDataEvaluacion(idEvaluacion);
			const unsubPreguntas = getPreguntasRespuestas(idEvaluacion);
			const unsubDimensiones = getDimensiones(idEvaluacion);

			return () => {
				if (typeof unsubEval === 'function') unsubEval();
				if (typeof unsubPreguntas === 'function') unsubPreguntas();
				if (typeof unsubDimensiones === 'function') unsubDimensiones();
			};
		}
	}, [idEvaluacion, getDataEvaluacion, getPreguntasRespuestas, getDimensiones]);

	// 2. Resolver sessionId si no viene directamente en la query pero sí un DNI objetivo
	useEffect(() => {
		if (sessionIdQuery) {
			setResolvedSessionId(sessionIdQuery);
			return;
		}

		if (!idEvaluacion || !targetDni) {
			setIsLoadingSession(false);
			return;
		}

		let isMounted = true;
		const resolveSessionByDni = async () => {
			setIsLoadingSession(true);
			try {
				const colRef = collection(db, `/${collectionName}/${idEvaluacion}/evaluados`);
				const cleanDni = targetDni.trim();

				// Intentar buscar por dni
				let q = query(colRef, where('dni', '==', cleanDni));
				let snap = await getDocs(q);

				if (snap.empty) {
					// Fallback a campos específicos según rol y colección
					const fallbackField =
						collectionName === 'evaluaciones-docentes' || role === 'director'
							? 'docenteDni'
							: collectionName === 'evaluaciones-director' || role === 'especialista'
							? 'directorDni'
							: 'especialistaDni';
					q = query(colRef, where(fallbackField, '==', cleanDni));
					snap = await getDocs(q);
				}

				if (!snap.empty && isMounted) {
					// Tomar el más reciente por fechaCreacion si existen varios
					const docs = snap.docs.map((d) => ({
						id: d.id,
						...d.data(),
					})) as any[];

					docs.sort((a, b) => {
						const dateA = a.fechaCreacion?.toMillis
							? a.fechaCreacion.toMillis()
							: new Date(a.fechaCreacion || 0).getTime();
						const dateB = b.fechaCreacion?.toMillis
							? b.fechaCreacion.toMillis()
							: new Date(b.fechaCreacion || 0).getTime();
						return dateB - dateA;
					});

					setResolvedSessionId(docs[0].id);
				}
			} catch (err) {
				console.error('Error al resolver sesión por DNI:', err);
			} finally {
				if (isMounted) setIsLoadingSession(false);
			}
		};

		resolveSessionByDni();

		return () => {
			isMounted = false;
		};
	}, [collectionName, idEvaluacion, sessionIdQuery, targetDni, role]);

	// 3. Suscribirse a los datos de la sesión del evaluado en tiempo real
	useEffect(() => {
		if (!idEvaluacion || !resolvedSessionId) {
			return;
		}

		setIsLoadingSession(true);
		const docRef = doc(db, `/${collectionName}/${idEvaluacion}/evaluados`, resolvedSessionId);
		const unsub = onSnapshot(
			docRef,
			(docSnap) => {
				if (docSnap.exists() && docSnap.data()) {
					const data = { ...(docSnap.data() as User), id: docSnap.id };
					setDataEvaluado(data);
					setLocalData(JSON.parse(JSON.stringify(data)));
					setHasChanges(false);
				}
				setIsLoadingSession(false);
			},
			(err) => {
				console.error('Error al escuchar sesión de evaluado:', err);
				setIsLoadingSession(false);
			}
		);

		return () => unsub();
	}, [collectionName, idEvaluacion, resolvedSessionId]);

	// Manejo de cambios en el formulario local
	const handleFieldChange = (field: keyof User, value: any) => {
		if (!localData) return;
		setLocalData({ ...localData, [field]: value });
		setHasChanges(true);
	};

	const handleMonitorChange = (field: string, value: any) => {
		if (!localData) return;
		const monitorData = (localData as any).datosMonitor || {};
		const newMonitor = { ...monitorData, [field]: value };
		setLocalData({ ...localData, datosMonitor: newMonitor });
		setHasChanges(true);
	};

	const defaultEscala: AlternativasDocente[] = useMemo(
		() => [
			{ value: 0, alternativa: '0', descripcion: 'No evidencia' },
			{ value: 1, alternativa: '1', descripcion: 'En proceso' },
			{ value: 2, alternativa: '2', descripcion: 'Logrado' },
		],
		[]
	);

	const currentEscala: AlternativasDocente[] = useMemo(() => {
		if (dataEvaluacionDocente?.escala && dataEvaluacionDocente.escala.length > 0) {
			return dataEvaluacionDocente.escala;
		}
		if (
			getPreguntaRespuestaDocentes?.[0]?.alternativas &&
			getPreguntaRespuestaDocentes[0].alternativas.length > 0
		) {
			return getPreguntaRespuestaDocentes[0].alternativas;
		}
		return defaultEscala;
	}, [dataEvaluacionDocente?.escala, getPreguntaRespuestaDocentes, defaultEscala]);

	const activeData = localData || dataEvaluado;

	const handleRadioChange = (order: number, val: string) => {
		if (!localData?.resultadosSeguimientoRetroalimentacion) return;
		const newResultados = localData.resultadosSeguimientoRetroalimentacion.map((p) => {
			if (p.order === order) {
				const newAlternativas = currentEscala.map((e) => ({
					id: e.id || e.alternativa,
					alternativa: e.alternativa,
					selected: String(e.alternativa || '') === String(val || ''),
					value: e.value,
					descripcion: e.descripcion,
				}));
				return {
					...p,
					alternativas: newAlternativas,
				};
			}
			return p;
		});
		setLocalData({ ...localData, resultadosSeguimientoRetroalimentacion: newResultados });
		setHasChanges(true);
	};

	const handleFeedbackChange = (index: number, val: string) => {
		if (!localData?.retroalimentacionDinamica) return;
		const newFeedback = [...localData.retroalimentacionDinamica];
		newFeedback[index] = { ...newFeedback[index], contenido: val };
		const tag = (newFeedback[index].etiqueta || '').trim().toUpperCase();

		let avances = localData.avancesRetroalimentacion || '';
		let dificultades = localData.dificultadesRetroalimentacion || '';
		let compromisos = localData.compromisosRetroalimentacion || '';

		if (tag.includes('AVANCE') || tag.includes('FORTALEZA')) avances = val;
		else if (tag.includes('DIFICULTAD')) dificultades = val;
		else if (tag.includes('COMPROMISO') || tag.includes('MEJORA')) compromisos = val;

		setLocalData({
			...localData,
			retroalimentacionDinamica: newFeedback,
			avancesRetroalimentacion: avances,
			dificultadesRetroalimentacion: dificultades,
			compromisosRetroalimentacion: compromisos,
		});
		setHasChanges(true);
	};

	// Merge respuestas del evaluado sobre los criterios base
	const preguntasConRespuestas = useMemo(() => {
		return (
			getPreguntaRespuestaDocentes?.map((pregunta) => {
				const respuestaGuardada =
					activeData?.resultadosSeguimientoRetroalimentacion?.find(
						(r) =>
							(r.order !== undefined &&
								pregunta.order !== undefined &&
								String(r.order) === String(pregunta.order)) ||
							(r.id && pregunta.id && String(r.id) === String(pregunta.id))
					);

				const alternativasMapeadas = currentEscala.map((e) => {
					const guardada = respuestaGuardada?.alternativas?.find(
						(a) => String(a.alternativa || '') === String(e.alternativa || '')
					);
					const base = pregunta.alternativas?.find(
						(a) => String(a.alternativa || '') === String(e.alternativa || '')
					);

					return {
						...e,
						selected: guardada ? !!guardada.selected : base ? !!base.selected : false,
					};
				});

				return {
					...pregunta,
					alternativas: alternativasMapeadas,
					evidencias: respuestaGuardada?.evidencias || pregunta.evidencias || [],
					requiereEvidencia:
						respuestaGuardada?.requiereEvidencia !== undefined
							? respuestaGuardada.requiereEvidencia
							: pregunta.requiereEvidencia,
				};
			}) ?? []
		);
	}, [getPreguntaRespuestaDocentes, activeData, currentEscala]);

	// Mapa correlativo visual continuo (1, 2, 3...) para la numeración de criterios
	const displayIndexMap = useMemo(() => {
		const map = new Map<string, number>();
		let count = 0;
		if (dimensionesEspecialistas && dimensionesEspecialistas.length > 0) {
			dimensionesEspecialistas.forEach((dim) => {
				const pregs = preguntasConRespuestas.filter((p) => String(p.dimensionId) === String(dim.id));
				pregs.forEach((p) => {
					count += 1;
					if (p.id) map.set(String(p.id), count);
				});
			});
			const dominiosIds = new Set(dimensionesEspecialistas.map((d: any) => String(d.id)));
			const sinDominio = preguntasConRespuestas.filter((p) => !p.dimensionId || !dominiosIds.has(String(p.dimensionId)));
			sinDominio.forEach((p) => {
				count += 1;
				if (p.id) map.set(String(p.id), count);
			});
		} else {
			preguntasConRespuestas.forEach((p, idx) => {
				if (p.id) map.set(String(p.id), idx + 1);
			});
		}
		return map;
	}, [dimensionesEspecialistas, preguntasConRespuestas]);

	const handleSaveChanges = async () => {
		if (!localData || !idEvaluacion || !resolvedSessionId) return;
		try {
			const calificacion = calcularCalificacion(preguntasConRespuestas, currentEscala);
			const docPath = doc(
				db,
				`/${collectionName}/${idEvaluacion}/evaluados`,
				resolvedSessionId
			);

			const dataToUpdate = JSON.parse(
				JSON.stringify({
					...localData,
					calificacion,
				})
			);

			await updateDoc(docPath, dataToUpdate);

			// Actualizar en colección /usuarios si hay DNI
			if (localData.dni && (localData.email || localData.celular)) {
				try {
					const userRef = doc(db, 'usuarios', String(localData.dni));
					await setDoc(
						userRef,
						{
							email: localData.email || '',
							celular: localData.celular || '',
						},
						{ merge: true }
					);
				} catch (uErr) {
					console.warn('No se pudo actualizar usuario en /usuarios:', uErr);
				}
			}

			setHasChanges(false);
			alert('Cambios guardados exitosamente.');
		} catch (error) {
			console.error('Error al guardar cambios:', error);
			alert('Error al guardar los cambios.');
		}
	};

	const handleUpdateMonitor = async () => {
		// Función inhabilitada tanto para el administrador como para el especialista
		return;
	};

	const ugelDisplay = useMemo(() => {
		return (
			activeData?.institucion ||
			activeData?.ugel ||
			(activeData?.region !== undefined ? regionTexto(String(activeData.region)) : '') ||
			''
		).toUpperCase();
	}, [activeData]);

	const monitor = (activeData as any)?.datosMonitor ?? {};
	const hasEvidencias = !!dataEvaluacionDocente?.activarEvidencias;
	const colSpanTotal = 2 + currentEscala.length + (hasEvidencias ? 1 : 0);

	const pdfFileName = useMemo(() => {
		return `reporte-${activeData?.apellidos ?? 'evaluado'}-${activeData?.dni ?? ''}.pdf`
			.toLowerCase()
			.replace(/\s+/g, '-');
	}, [activeData?.apellidos, activeData?.dni]);

	const handleDownloadPDF = async () => {
		if (pdfGenerating || !activeData) return;
		try {
			setPdfGenerating(true);
			const [{ pdf }, { default: ReportePDF }] = await Promise.all([
				import('@react-pdf/renderer'),
				import('@/components/pdf/ReporteEspecialistaPDF'),
			]);
			const blob = await pdf(
				<ReportePDF
					especialista={activeData}
					preguntas={preguntasConRespuestas}
					dimensiones={dimensionesEspecialistas ?? []}
					escala={currentEscala}
					ugel={ugelDisplay}
					tituloReporte={activeData?.tituloReporte}
					descripcion={dataEvaluacionDocente?.descripcion}
				/>
			).toBlob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = pdfFileName;
			a.click();
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error('Error generando PDF:', err);
		} finally {
			setPdfGenerating(false);
		}
	};

	const computedBackHref = useMemo(() => {
		if (typeof backHref === 'function') {
			return backHref(idEvaluacion);
		}
		if (backHref) {
			return backHref;
		}
		if (collectionName === 'evaluaciones-director') {
			return role === 'admin'
				? `/admin/evaluaciones-directores/evaluacion/${idEvaluacion}`
				: `/especialistas/evaluaciones-director/evaluacion/${idEvaluacion}/evaluados`;
		}
		if (collectionName === 'evaluaciones-docentes') {
			return role === 'especialista'
				? `/especialistas/evaluaciones-docentes/evaluacion/${idEvaluacion}/evaluados`
				: `/directores/evaluaciones-docentes/evaluacion/${idEvaluacion}/evaluados`;
		}
		return `/admin/especialistas/evaluaciones-especialistas/evaluacion/${idEvaluacion}/evaluados`;
	}, [backHref, idEvaluacion, collectionName, role]);

	return (
		<div className={styles.container}>
			<div className={styles.contentWrapper}>
				{/* Barra de navegación superior */}
				<div className={styles.navBar}>
					<div className={styles.navBarInner}>
						<Link href={computedBackHref} className={styles.backLink}>
							<IoArrowBack className={styles.backIcon} />
							Volver a evaluados
						</Link>

						{/* Botón de descarga de PDF */}
						{activeData?.dni && (
							<button
								onClick={handleDownloadPDF}
								disabled={pdfGenerating}
								className={styles.downloadButton}
								type="button"
							>
								{pdfGenerating ? (
									<>
										<RiLoader4Line className={styles.downloadSpinner} /> Generando...
									</>
								) : (
									<>
										<MdDownload style={{ fontSize: '1.1rem' }} /> Descargar PDF
									</>
								)}
							</button>
						)}
					</div>
				</div>

				<div className={styles.content}>
					<div className={styles.contentInner}>
						{isLoadingSession || loaderSalvarPregunta ? (
							<div className={styles.loadingContainer}>
								<RiLoader4Line className={styles.loadingIcon} />
								<span className={styles.loadingText}>Cargando reporte...</span>
							</div>
						) : !activeData ? (
							<div className={styles.loadingContainer}>
								<span className={styles.loadingText}>
									No se encontró información de la sesión seleccionada.
								</span>
							</div>
						) : (
							<>
								{/* ── Datos del Monitoreado ─────────────────────────── */}
								<div className={styles.premiumInfoContainer}>
									<div className={styles.infoSectionHeader}>
										<h3 className={styles.infoSectionTitle}>{monitoreadoRoleLabel}</h3>
									</div>

									<div className={styles.infoTable}>
										<div className={styles.infoRow}>
											<div className={styles.infoLabel}>UGEL / I.E.:</div>
											<div className={styles.infoValue}>
												<input
													className={styles.editableInput}
													value={(
														activeData?.institucion ||
														activeData?.ugel ||
														ugelDisplay
													).toUpperCase()}
													onChange={(e) =>
														handleFieldChange('ugel', e.target.value.toUpperCase())
													}
													placeholder="UGEL / INSTITUCIÓN"
													style={{ textTransform: 'uppercase' }}
													disabled
												/>
											</div>
										</div>
										<div className={styles.infoRow}>
											<div className={styles.infoLabel}>APELLIDOS:</div>
											<div className={styles.infoValue}>
												<input
													className={styles.editableInput}
													value={activeData?.apellidos || ''}
													onChange={(e) => handleFieldChange('apellidos', e.target.value)}
													placeholder="Apellidos"
													disabled
												/>
											</div>
										</div>
										<div className={styles.infoRow}>
											<div className={styles.infoLabel}>NOMBRES:</div>
											<div className={styles.infoValue}>
												<input
													className={styles.editableInput}
													value={activeData?.nombres || ''}
													onChange={(e) => handleFieldChange('nombres', e.target.value)}
													placeholder="Nombres"
													disabled
												/>
											</div>
										</div>
										<div className={styles.infoRowGroup}>
											<div className={styles.infoRowItem}>
												<div className={styles.infoLabel}>DNI:</div>
												<div className={styles.infoValue}>
													<input
														className={styles.editableInput}
														value={activeData?.dni || ''}
														onChange={(e) => handleFieldChange('dni', e.target.value)}
														placeholder="DNI"
														disabled
													/>
												</div>
											</div>
											<div className={styles.verticalRowItem}>
												<div className={styles.labelVertical}>E-MAIL:</div>
												<div className={styles.infoValue}>
													<input
														className={styles.editableInput}
														value={activeData?.email || ''}
														onChange={(e) => handleFieldChange('email', e.target.value)}
														placeholder="Email"
													/>
												</div>
											</div>
											<div className={styles.verticalRowItem}>
												<div className={styles.labelVertical}>Nº CELULAR:</div>
												<div className={styles.infoValue}>
													<input
														className={styles.editableInput}
														value={activeData?.celular || ''}
														onChange={(e) => handleFieldChange('celular', e.target.value)}
														placeholder="Celular"
													/>
												</div>
											</div>
										</div>
									</div>

									{/* ── Datos del Monitor ─────────────────────────────── */}
									<div className={styles.infoSectionDivider}>
										<span>{monitorRoleLabel}</span>
										<button
											onClick={handleUpdateMonitor}
											className={styles.updateButton}
											title="Actualización de monitor inhabilitada tanto para el administrador como para el especialista"
											type="button"
											disabled
										>
											<MdUpdate style={{ fontSize: '1.1rem' }} /> Actualizar Monitor
										</button>
									</div>

									<div className={styles.infoTable}>
										<div className={styles.infoRowGroup}>
											<div className={styles.infoRowItem}>
												<div className={styles.infoLabel}>APELLIDOS:</div>
												<div className={styles.infoValue}>
													<input
														className={styles.editableInput}
														value={monitor.apellidos || ''}
														onChange={(e) =>
															handleMonitorChange('apellidos', e.target.value)
														}
														placeholder="Apellidos monitor"
														disabled
													/>
												</div>
											</div>
											<div className={styles.infoRowItem}>
												<div className={styles.infoLabel}>NOMBRES:</div>
												<div className={styles.infoValue}>
													<input
														className={styles.editableInput}
														value={monitor.nombres || ''}
														onChange={(e) =>
															handleMonitorChange('nombres', e.target.value)
														}
														placeholder="Nombres monitor"
														disabled
													/>
												</div>
											</div>
										</div>
										<div className={styles.infoRowGroup}>
											<div className={styles.infoRowItem}>
												<div className={styles.infoLabelSmall}>DNI:</div>
												<div className={styles.infoValueSmall}>
													{monitor.dni || currentUserData?.dni || '—'}
												</div>
											</div>
											<div className={styles.infoRowItem}>
												<div className={styles.infoLabelSmall}>CARGO:</div>
												<div className={styles.infoValueSmall}>
													<input
														className={styles.editableInput}
														value={monitor.cargo || 'MONITOR'}
														onChange={(e) => handleMonitorChange('cargo', e.target.value)}
														placeholder="Cargo"
														disabled
													/>
												</div>
											</div>
											<div className={styles.verticalRowItem}>
												<div className={styles.labelVertical}>E-MAIL:</div>
												<div className={styles.infoValueSmall}>
													<input
														className={styles.editableInput}
														value={monitor.email || ''}
														onChange={(e) => handleMonitorChange('email', e.target.value)}
														placeholder="Email"
														disabled
													/>
												</div>
											</div>
											<div className={styles.verticalRowItem}>
												<div className={styles.labelVertical}>Nº CELULAR:</div>
												<div className={styles.infoValueSmall}>
													<input
														className={styles.editableInput}
														value={monitor.celular || ''}
														onChange={(e) =>
															handleMonitorChange('celular', e.target.value)
														}
														placeholder="Celular"
														disabled
													/>
												</div>
											</div>
										</div>
									</div>

									{/* ── Fecha y Duración ─────────────────────────────── */}
									<div className={styles.infoSectionDivider}>FECHA Y DURACIÓN:</div>

									<div className={styles.infoTable}>
										<div className={styles.infoRowGroup}>
											<div className={styles.infoRowItem}>
												<div className={styles.infoLabel}>FECHA:</div>
												<div className={styles.infoValue}>
													<input
														type="date"
														className={styles.editableInput}
														value={activeData?.fechaMonitoreo || ''}
														onChange={(e) =>
															handleFieldChange('fechaMonitoreo', e.target.value)
														}
													/>
												</div>
											</div>
											<div className={styles.infoRowItem}>
												<div className={styles.infoLabel}>HORA INICIO:</div>
												<div className={styles.infoValue}>
													<input
														type="time"
														className={styles.editableInput}
														value={activeData?.horaInicio || ''}
														onChange={(e) =>
															handleFieldChange('horaInicio', e.target.value)
														}
													/>
												</div>
											</div>
											<div className={styles.infoRowItem}>
												<div className={styles.infoLabel}>HORA FINAL:</div>
												<div className={styles.infoValue}>
													<input
														type="time"
														className={styles.editableInput}
														value={activeData?.horaFinal || ''}
														onChange={(e) =>
															handleFieldChange('horaFinal', e.target.value)
														}
													/>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* ── Tabla de evaluación ───────────────────────────── */}
								<div className={styles.tableContainer}>
									<table className={styles.evaluationTable}>
										<thead>
											<tr>
												<th className={styles.colNumber}>№</th>
												<th className={styles.colCriterio}>CRITERIO</th>
												{currentEscala.map((e, index) => (
													<th
														key={e.id || e.alternativa || index}
														className={styles.colValue}
													>
														{e.value !== undefined ? e.value : e.alternativa}
													</th>
												))}
												{hasEvidencias && (
													<th className={styles.colValue} style={{ width: '180px' }}>
														EVIDENCIA
													</th>
												)}
											</tr>
										</thead>
										<tbody>
											{dimensionesEspecialistas && dimensionesEspecialistas.length > 0 ? (
												dimensionesEspecialistas.map((dimension) => {
													const preguntasDimension = preguntasConRespuestas.filter(
														(p) => p.dimensionId === dimension.id
													);
													if (preguntasDimension.length === 0) return null;
													return (
														<React.Fragment key={dimension.id}>
															<tr className={styles.dimensionRow}>
																<td
																	colSpan={colSpanTotal}
																	className={styles.dimensionTitle}
																>
																	{dimension.nombre}
																</td>
															</tr>
															{preguntasDimension.map((pregunta) => (
																<tr key={pregunta.id} className={styles.questionRow}>
																	<td className={styles.cellNumber}>
																		{displayIndexMap.get(String(pregunta.id)) || pregunta.order}
																	</td>
																	<td className={styles.cellCriterio}>
																		{pregunta.criterio}
																	</td>
																	{currentEscala.map((e, index) => {
																		const val = e.alternativa || '';
																		const alt = pregunta.alternativas?.find(
																			(a) =>
																				String(a.alternativa || '') ===
																				String(val || '')
																		);
																		return (
																			<td
																				key={e.id || e.alternativa || index}
																				className={styles.cellRadio}
																			>
																				<input
																					type="radio"
																					name={`q-${pregunta.id}`}
																					value={val}
																					checked={alt?.selected || false}
																					onChange={() =>
																						handleRadioChange(
																							pregunta.order!,
																							val
																						)
																					}
																					className={
																						styles.radioInputEditable
																					}
																				/>
																			</td>
																		);
																	})}
																	{hasEvidencias && (
																		<td
																			className={styles.cellRadio}
																			style={{
																				padding: '8px',
																				textAlign: 'left',
																				borderLeft: '1px solid #eee',
																			}}
																		>
																			{pregunta.requiereEvidencia ? (
																				pregunta.evidencias &&
																				pregunta.evidencias.length > 0 ? (
																					<div
																						style={{
																							display: 'flex',
																							flexDirection: 'column',
																							gap: '4px',
																						}}
																					>
																						{pregunta.evidencias.map(
																							(ev: any, idx: number) => (
																								<a
																									key={idx}
																									href={ev.url}
																									target="_blank"
																									rel="noopener noreferrer"
																									style={{
																										fontSize: '0.8rem',
																										color: '#0066CC',
																										textDecoration:
																											'none',
																										display: 'flex',
																										alignItems:
																											'center',
																										gap: '4px',
																									}}
																								>
																									<IoLink />{' '}
																									{ev.nombre.length > 15
																										? ev.nombre.substring(
																												0,
																												15
																										  ) + '...'
																										: ev.nombre}
																								</a>
																							)
																						)}
																					</div>
																				) : (
																					<span
																						style={{
																							fontSize: '0.8rem',
																							color: '#666',
																						}}
																					>
																						Sin evidencia
																					</span>
																				)
																			) : (
																				<span
																					style={{
																						fontSize: '0.8rem',
																						color: '#999',
																					}}
																				>
																					No requiere
																				</span>
																			)}
																		</td>
																	)}
																</tr>
															))}
														</React.Fragment>
													);
												})
											) : (
												preguntasConRespuestas.map((pregunta, index) => (
													<tr key={pregunta.id} className={styles.questionRow}>
														<td className={styles.cellNumber}>{index + 1}</td>
														<td className={styles.cellCriterio}>
															{pregunta.criterio}
														</td>
														{currentEscala.map((e, index) => {
															const val = e.alternativa || '';
															const alt = pregunta.alternativas?.find(
																(a) =>
																	String(a.alternativa || '') ===
																	String(val || '')
															);
															return (
																<td
																	key={e.id || e.alternativa || index}
																	className={styles.cellRadio}
																>
																	<input
																		type="radio"
																		name={`q-${pregunta.id}`}
																		value={val}
																		checked={alt?.selected || false}
																		onChange={() =>
																			handleRadioChange(pregunta.order!, val)
																		}
																		className={styles.radioInputEditable}
																	/>
																</td>
															);
														})}
														{hasEvidencias && (
															<td
																className={styles.cellRadio}
																style={{
																	padding: '8px',
																	textAlign: 'left',
																	borderLeft: '1px solid #eee',
																}}
															>
																{pregunta.requiereEvidencia ? (
																	pregunta.evidencias &&
																	pregunta.evidencias.length > 0 ? (
																		<div
																			style={{
																				display: 'flex',
																				flexDirection: 'column',
																				gap: '4px',
																			}}
																		>
																			{pregunta.evidencias.map(
																				(ev: any, idx: number) => (
																					<a
																						key={idx}
																						href={ev.url}
																						target="_blank"
																						rel="noopener noreferrer"
																						style={{
																							fontSize: '0.8rem',
																							color: '#0066CC',
																							textDecoration: 'none',
																							display: 'flex',
																							alignItems: 'center',
																							gap: '4px',
																						}}
																					>
																						<IoLink />{' '}
																						{ev.nombre.length > 15
																							? ev.nombre.substring(
																									0,
																									15
																							  ) + '...'
																							: ev.nombre}
																					</a>
																				)
																			)}
																		</div>
																	) : (
																		<span
																			style={{
																				fontSize: '0.8rem',
																				color: '#666',
																			}}
																		>
																			Sin evidencia
																		</span>
																	)
																) : (
																	<span
																		style={{
																			fontSize: '0.8rem',
																			color: '#999',
																		}}
																	>
																		No requiere
																	</span>
																)}
															</td>
														)}
													</tr>
												))
											)}
										</tbody>
									</table>
								</div>

								{/* ── Retroalimentación Cualitativa Dinámica ─────────────────── */}
								<div className={styles.feedbackSection}>
									{activeData?.retroalimentacionDinamica &&
									activeData.retroalimentacionDinamica.length > 0 ? (
										activeData.retroalimentacionDinamica.map((item, index) => (
											<div key={index} className={styles.feedbackGroup}>
												<label className={styles.feedbackLabel}>
													{item.etiqueta}:
												</label>
												<textarea
													className={styles.editableTextarea}
													value={item.contenido || ''}
													onChange={(e) =>
														handleFeedbackChange(index, e.target.value)
													}
													placeholder={`Escriba aquí los ${item.etiqueta.toLowerCase()}...`}
												/>
											</div>
										))
									) : (
										<>
											<div className={styles.feedbackGroup}>
												<label className={styles.feedbackLabel}>AVANCES:</label>
												<textarea
													className={styles.editableTextarea}
													value={activeData?.avancesRetroalimentacion || ''}
													onChange={(e) =>
														handleFieldChange(
															'avancesRetroalimentacion',
															e.target.value
														)
													}
												/>
											</div>
											<div className={styles.feedbackGroup}>
												<label className={styles.feedbackLabel}>
													DIFICULTADES:
												</label>
												<textarea
													className={styles.editableTextarea}
													value={activeData?.dificultadesRetroalimentacion || ''}
													onChange={(e) =>
														handleFieldChange(
															'dificultadesRetroalimentacion',
															e.target.value
														)
													}
												/>
											</div>
											<div className={styles.feedbackGroup}>
												<label className={styles.feedbackLabel}>
													COMPROMISOS:
												</label>
												<textarea
													className={styles.editableTextarea}
													value={activeData?.compromisosRetroalimentacion || ''}
													onChange={(e) =>
														handleFieldChange(
															'compromisosRetroalimentacion',
															e.target.value
														)
													}
												/>
											</div>
										</>
									)}
								</div>

								{/* Floating Save Button */}
								{hasChanges && (
									<button
										type="button"
										className={styles.saveChangesButton}
										onClick={handleSaveChanges}
									>
										<MdSave /> Guardar Cambios
									</button>
								)}
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ReporteIndividualContainer;
