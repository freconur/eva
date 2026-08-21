import React from 'react';
import { RiLoader4Line } from 'react-icons/ri';
import { MdTrendingUp } from 'react-icons/md';
import { Line, Radar, Bar, Pie } from 'react-chartjs-2';
import { User } from '@/features/types/types';
import { getCleanPhaseName, getLocalDateString, getShortDateString } from './utils';
import styles from '../styles.module.css';

interface ModalEvolutionProgressProps {
	showModalEvolucion: boolean;
	onClose: () => void;
	activeTab: 'evolucion' | 'radar' | 'analisis' | 'distribucion';
	setActiveTab: (tab: 'evolucion' | 'radar' | 'analisis' | 'distribucion') => void;
	loadingHistorial: boolean;
	historialSelected: User[];
	chartData: any;
	chartOptions: any;
	dimensionesEspecialistas: any[];
	getRadarData: () => any;
	getItemAnalysisData: () => any;
	getDistribucionGlobalData: () => any;
	selectedModalEvalId: string;
	setSelectedModalEvalId: (val: string) => void;
	latestEvaluation: any;
	dataEvaluacionDocente: any;
	getDisplayCalificacion: (evalu: any) => number;
}

export const ModalEvolutionProgress: React.FC<ModalEvolutionProgressProps> = ({
	showModalEvolucion,
	onClose,
	activeTab,
	setActiveTab,
	loadingHistorial,
	historialSelected,
	chartData,
	chartOptions,
	dimensionesEspecialistas,
	getRadarData,
	getItemAnalysisData,
	getDistribucionGlobalData,
	selectedModalEvalId,
	setSelectedModalEvalId,
	latestEvaluation,
	dataEvaluacionDocente,
	getDisplayCalificacion,
}) => {
	if (!showModalEvolucion) return null;

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modalContent} onClick={e => e.stopPropagation()}>
				<div className={styles.modalHeader}>
					<h2 className={styles.modalTitle}>Progreso del Especialista</h2>
					<button className={styles.modalClose} onClick={onClose}>×</button>
				</div>
				<div className={styles.modalBody}>
					<div className={styles.modalTabs}>
						<button className={`${styles.tabButton} ${activeTab === 'evolucion' ? styles.activeTab : ''}`} onClick={() => { setActiveTab('evolucion'); setSelectedModalEvalId('all'); }}>Evolución Histórica</button>
						<button className={`${styles.tabButton} ${activeTab === 'radar' ? styles.activeTab : ''}`} onClick={() => { setActiveTab('radar'); setSelectedModalEvalId('all'); }}>Perfil Reticular</button>
						<button className={`${styles.tabButton} ${activeTab === 'analisis' ? styles.activeTab : ''}`} onClick={() => { setActiveTab('analisis'); setSelectedModalEvalId('all'); }}>Brechas Críticas</button>
						<button className={`${styles.tabButton} ${activeTab === 'distribucion' ? styles.activeTab : ''}`} onClick={() => { setActiveTab('distribucion'); setSelectedModalEvalId('all'); }}>Resultados Globales</button>
					</div>

					{loadingHistorial ? (
						<div className={styles.modalLoading}>
							<RiLoader4Line className={styles.loadingIcon} />
							<span>Cargando historial...</span>
						</div>
					) : historialSelected.length > 0 ? (
						<div className={styles.tabContent}>
							{activeTab === 'evolucion' && (
								<div className={styles.chartContainer} style={{ minHeight: '350px', position: 'relative' }}>
									{historialSelected.length === 1 && (
										<div style={{
											position: 'absolute',
											top: '10px',
											left: '50%',
											transform: 'translateX(-50%)',
											background: '#eff6ff',
											color: '#1d4ed8',
											padding: '0.5rem 1rem',
											borderRadius: '8px',
											fontWeight: '600',
											border: '1px solid #bfdbfe',
											zIndex: 10
										}}>
											Única Evaluación: {historialSelected[0].calificacion} pts
										</div>
									)}
									<Line data={chartData} options={chartOptions} />
								</div>
							)}
							{activeTab === 'radar' && (
								<div style={{ width: '100%' }}>
									{historialSelected.length > 1 && (
										<div className={styles.filterBar}>
											<span className={styles.filterBarLabel}>Filtrar por Etapa / Evaluación:</span>
											<select
												className={styles.toolbarSelect}
												value={selectedModalEvalId}
												onChange={(e) => setSelectedModalEvalId(e.target.value)}
											>
												<option value="all">Todas las etapas (Comparativo)</option>
												<option value="latest">Última Evaluación ({getCleanPhaseName(latestEvaluation?.faseNombre, latestEvaluation?.idFase)}{getShortDateString(latestEvaluation?.fechaMonitoreo || latestEvaluation?.fechaCreacion) ? ` - ${getShortDateString(latestEvaluation?.fechaMonitoreo || latestEvaluation?.fechaCreacion)}` : ''})</option>
												{historialSelected.map((evalu, idx) => (
													<option key={evalu.id || idx} value={evalu.id}>
														{getCleanPhaseName((evalu as any).faseNombre, (evalu as any).idFase || (evalu as any).faseActualID)} ({getShortDateString(evalu.fechaMonitoreo || evalu.fechaCreacion)}) - {getDisplayCalificacion(evalu)} pts
													</option>
												))}
											</select>
										</div>
									)}
									<div className={styles.chartContainer} style={{ minHeight: '350px' }}>
										{(() => {
											const maxScale = (dataEvaluacionDocente?.escala || []).at(-1)?.value || 4;
											const tooltipOptions = {
												backgroundColor: 'rgba(15, 23, 42, 0.95)',
												titleColor: '#f8fafc',
												bodyColor: '#e2e8f0',
												titleFont: { size: 14, weight: 'bold' as const, family: "'Inter', system-ui, sans-serif" },
												bodyFont: { size: 13, family: "'Inter', system-ui, sans-serif" },
												padding: 16,
												cornerRadius: 8,
												displayColors: false,
												callbacks: {
													title: (context: any) => context[0].label,
													label: (context: any) => `Promedio del dominio: ${context.raw} pts`,
													afterLabel: (context: any) => {
														const details = context.dataset.customDetails[context.dataIndex];
														if (!details || details.length === 0) return ['\nSin datos de evaluación.'];
														const lines = ['\nDesglose por puntos evaluados:'];
														details.forEach((d: any) => {
															lines.push(`• P${d.orden} (${d.puntaje} pts) - ${d.nombre}`);
														});
														return lines;
													}
												}
											};

											return dimensionesEspecialistas.length >= 3 ? (
												<Radar
													data={getRadarData()}
													options={{
														responsive: true,
														maintainAspectRatio: false,
														interaction: {
															mode: 'index',
															intersect: false,
														},
														scales: { r: { min: 0, max: maxScale, ticks: { stepSize: 1 } } },
														plugins: {
															title: { display: true, text: 'Evolución del Dominio de Competencias por Etapa' },
															legend: { display: true, position: 'bottom' },
															tooltip: tooltipOptions
														}
													}}
												/>
											) : (
												<Bar
													data={getRadarData()}
													options={{
														responsive: true,
														maintainAspectRatio: false,
														interaction: {
															mode: 'index',
															intersect: false,
														},
														scales: { y: { min: 0, max: maxScale } },
														plugins: {
															title: { display: true, text: 'Evolución del Dominio de Competencias por Etapa' },
															legend: { display: true, position: 'bottom' },
															tooltip: tooltipOptions
														}
													}}
												/>
											);
										})()}
									</div>
								</div>
							)}
							{activeTab === 'analisis' && (
								<div style={{ width: '100%' }}>
									{historialSelected.length > 1 && (
										<div className={styles.filterBar}>
											<span className={styles.filterBarLabel}>Filtrar por Etapa / Evaluación:</span>
											<select
												className={styles.toolbarSelect}
												value={selectedModalEvalId}
												onChange={(e) => setSelectedModalEvalId(e.target.value)}
											>
												<option value="all">Todas las etapas (Comparativo)</option>
												<option value="latest">Última Evaluación ({getCleanPhaseName(latestEvaluation?.faseNombre, latestEvaluation?.idFase)}{getShortDateString(latestEvaluation?.fechaMonitoreo || latestEvaluation?.fechaCreacion) ? ` - ${getShortDateString(latestEvaluation?.fechaMonitoreo || latestEvaluation?.fechaCreacion)}` : ''})</option>
												{historialSelected.map((evalu, idx) => (
													<option key={evalu.id || idx} value={evalu.id}>
														{getCleanPhaseName((evalu as any).faseNombre, (evalu as any).idFase || (evalu as any).faseActualID)} ({getShortDateString(evalu.fechaMonitoreo || evalu.fechaCreacion)}) - {getDisplayCalificacion(evalu)} pts
													</option>
												))}
											</select>
										</div>
									)}
									<div className={styles.chartContainer} style={{ minHeight: '350px' }}>
										{getItemAnalysisData() ? (
											<Bar
												data={getItemAnalysisData()!}
												options={{
													responsive: true,
													maintainAspectRatio: false,
													indexAxis: 'y' as const,
													scales: { x: { min: 0, max: (dataEvaluacionDocente?.escala || []).at(-1)?.value || 4 } },
													plugins: {
														title: { display: true, text: selectedModalEvalId === 'all' && historialSelected.length > 1 ? 'Evolución de Brechas Críticas por Etapa' : 'Top 5 Criterios con Menor Puntaje' },
														legend: { display: selectedModalEvalId === 'all' && historialSelected.length > 1, position: 'bottom' }
													}
												}}
											/>
										) : (
											<div className={styles.perfectScoreBanner}>
												<MdTrendingUp className={styles.perfectScoreIcon} />
												<h3 className={styles.perfectScoreTitle}>¡Excelente Desempeño!</h3>
												<p className={styles.perfectScoreText}>El especialista alcanzó el puntaje máximo en todos los criterios evaluados. No se detectaron brechas críticas.</p>
											</div>
										)}
									</div>
								</div>
							)}
							{activeTab === 'distribucion' && (
								<div className={styles.distribucionWrapper}>
									{historialSelected.length > 1 && (
										<div className={styles.filterBar}>
											<span className={styles.filterBarLabel}>Filtrar por Etapa / Evaluación:</span>
											<select
												className={styles.toolbarSelect}
												value={selectedModalEvalId}
												onChange={(e) => setSelectedModalEvalId(e.target.value)}
											>
												<option value="all">Todas las etapas (Comparativo)</option>
												<option value="latest">Última Evaluación ({getCleanPhaseName(latestEvaluation?.faseNombre, latestEvaluation?.idFase)}{getShortDateString(latestEvaluation?.fechaMonitoreo || latestEvaluation?.fechaCreacion) ? ` - ${getShortDateString(latestEvaluation?.fechaMonitoreo || latestEvaluation?.fechaCreacion)}` : ''})</option>
												{historialSelected.map((evalu, idx) => (
													<option key={evalu.id || idx} value={evalu.id}>
														{getCleanPhaseName((evalu as any).faseNombre, (evalu as any).idFase || (evalu as any).faseActualID)} ({getShortDateString(evalu.fechaMonitoreo || evalu.fechaCreacion)}) - {getDisplayCalificacion(evalu)} pts
													</option>
												))}
											</select>
										</div>
									)}
									{(() => {
										const distData = getDistribucionGlobalData();
										if (!distData.pieData) return <p className={styles.emptyText} style={{ textAlign: 'center', marginTop: '2rem' }}>No hay datos suficientes para mostrar.</p>;
										return (
											<div className={styles.distribucionCol}>
												<div className={styles.distribucionSection}>
													<div className={styles.distribucionHeaderGroup}>
														<div className={styles.distribucionBarIndicator}></div>
														<h3 className={styles.distribucionTitle}>Consolidado de Resultados</h3>
													</div>
													<div className={styles.distribucionPieContainer}>
														<Pie
															data={distData.pieData}
															options={{
																plugins: {
																	legend: { position: 'bottom' },
																	title: { display: false }
																}
															}}
														/>
													</div>
												</div>
												<div className={styles.distribucionStatsGrid}>
													<div className={styles.distribucionStatCard}>
														<span className={styles.distribucionStatLabel}>
															TOTAL PREGUNTAS
														</span>
														<span className={styles.distribucionStatValue}>
															{distData.totalPreguntas}
														</span>
													</div>

													{distData.stats.map((stat: any, idx: number) => {
														const percentage = distData.totalPreguntas > 0 ? Math.round((stat.count / distData.totalPreguntas) * 100) : 0;
														return (
															<div key={idx} className={styles.distribucionStatCard}>
																<div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
																	<span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stat.color || '#94a3b8', display: 'inline-block', flexShrink: 0 }}></span>
																	<span className={styles.distribucionStatLabel} style={{ marginBottom: 0, lineHeight: 1.2 }}>
																		{stat.label}
																	</span>
																</div>
																<span className={styles.distribucionStatValue}>
																	{stat.count}
																</span>
																<span className={styles.distribucionStatSub}>
																	{percentage}% ({stat.count}/{distData.totalPreguntas})
																</span>
															</div>
														);
													})}
												</div>
											</div>
										);
									})()}
								</div>
							)}
						</div>
					) : (
						<p className={styles.noHistory}>No se encontraron suficientes registros para generar una gráfica.</p>
					)}
				</div>
			</div>
		</div>
	);
};
