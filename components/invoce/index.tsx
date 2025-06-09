import React from 'react';
import { Page, Text, View, Document, pdf } from '@react-pdf/renderer';
import { EvaluacionCurricularAlternativa, User } from '@/features/types/types';
import { converGenero, getGradoTexto, getSeccionTexto, regionTexto } from '@/fuctions/regiones';
import { styles } from './invoice';

interface AlternativaCurricular {
	id?: string;
	name?: string;
	order?: number;
	acronimo?: string;
	selected?: boolean;
}

interface PaHanilidad {
	alternativas?: AlternativaCurricular[];
	habilidad?: string;
	id?: string;
	order?: number;
}

interface EvaluacionDocente {
	id: string;
	preguntasAlternativas?: PaHanilidad[];
}

interface Props {
	dataDocente: User,
	currentUserData: User,
	selectedEstandar: string,
	estandaresCurriculares: any[],
	preguntasEstandar: any[],
	evaluacionCurricular: any[],
	allEvaluacionesCurricularesDocente: EvaluacionCurricularAlternativa[]
}

const formatDate = (timestamp: any) => {
	if (!timestamp) return '-';
	const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
	return date.toLocaleDateString('es-ES', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
};

const MyDocument = ({ dataDocente, currentUserData, selectedEstandar, estandaresCurriculares, preguntasEstandar, evaluacionCurricular, allEvaluacionesCurricularesDocente }: Props) => (

	<Document>
		<Page size="A4" style={styles.page}>
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.headerText}>Cobertura Curricular</Text>
				</View>
				<View style={styles.sectionTitle}>
					<Text>I. Datos de la institución educativa y del docente</Text>
				</View>
				<View style={styles.dataRow}>
					<Text style={styles.label}>UGEL</Text>
					<Text style={styles.value}>{regionTexto(`${dataDocente?.region}`) ?? '-'}</Text>
				</View>
				<View style={styles.dataRow}>
					<Text style={styles.label}>Institución Educativa</Text>
					<Text style={styles.value}>{dataDocente?.institucion ?? '-'}</Text>
				</View>
				{/* <View style={styles.dataRow}>
					<Text style={styles.label}>Institución Educativa</Text>
					<Text style={styles.value}>{dataDocente?.caracteristicaCurricular ?? '-'}</Text>
				</View> */}
				<View style={styles.dataRow}>
					<Text style={styles.label}>Distrito</Text>
					<Text style={styles.value}>{dataDocente?.distrito ?? '-'}</Text>
				</View>
				<View style={styles.dataRow}>
					<Text style={styles.label}>Nombres y Apellidos</Text>
					<Text style={styles.value}>{`${dataDocente?.nombres ?? '-'} ${dataDocente?.apellidos ?? '-'}`}</Text>
				</View>
				<View style={styles.dataRow}>
					<Text style={styles.label}>Fecha</Text>
					<Text style={styles.value}>{formatDate(dataDocente?.fechaEvaluacion)}</Text>
				</View>
				<View style={styles.dataRow}>
					<Text style={styles.label}>DNI</Text>
					<Text style={styles.value}>{dataDocente?.dni ?? '-'}</Text>
				</View>
				<View style={styles.dataRow}>
					<Text style={styles.label}>genero</Text>
					<Text style={styles.value}>{`${converGenero(`${dataDocente?.genero}`) ?? '-'}`}</Text>
				</View>
				<View style={styles.dataRow}>
					<Text style={styles.label}>grado</Text>
					<Text style={styles.value}>{Array.isArray(dataDocente?.grados)
						? dataDocente.grados.map(g => getGradoTexto(g)).join(', ')
						: getGradoTexto(dataDocente?.grados) ?? '-'}</Text>
				</View>
				<View style={styles.dataRow}>
					<Text style={styles.label}>sección</Text>
					<Text style={styles.value}>{Array.isArray(dataDocente?.secciones)
						? dataDocente.secciones.map(s => getSeccionTexto(s)).join(', ')
						: getSeccionTexto(dataDocente?.secciones) ?? '-'}</Text>
				</View>
				<View style={styles.dataRow}>
					<Text style={styles.label}>Celular</Text>
					<Text style={styles.value}>{dataDocente?.celular ?? '-'}</Text>
				</View>
			</View>
			<View style={styles.container}>
				<View style={styles.sectionTitle}>
					<Text>II.Datos del Monitor</Text>
				</View>
				<View style={styles.dataRow}>
					<Text style={styles.label}>Nombres y Apellidos</Text>
					<Text style={styles.value}>{`${currentUserData?.nombres ?? '-'} ${currentUserData?.apellidos ?? '-'}`}</Text>
				</View>
			</View>
			<View style={styles.container}>
				<View style={styles.sectionTitle}>
					<Text>III. Cobertura Curricular de la Competencia Lee</Text>
				</View>
				<View style={styles.dataRow}>
					<Text style={styles.label}>Estándar</Text>
					<Text style={styles.value}>
						{estandaresCurriculares.find(estandar => estandar.nivel === Number(selectedEstandar))?.name?.toUpperCase() ?? '-'}
					</Text>
				</View>
				<View style={styles.tableContainer}>
					<View style={styles.tableContainer2}>
						<View style={styles.tableHeader}>
							<Text style={styles.tableHeaderText}>Habilidad Lectora</Text>
						</View>
						{preguntasEstandar.map((habilidad, index) => (
							<View key={habilidad.id} style={styles.tableRow}>
								<Text style={styles.tableCell}>
									{index + 1}. {habilidad.habilidad || 'holi'}
								</Text>
							</View>
						))}
					</View>
					<View style={styles.evaluationsContainer}>
						<View style={styles.evaluationsHeader}>
							{evaluacionCurricular?.map((evaluacion) => (
								<Text key={evaluacion.id} style={styles.evaluationTitle}>
									{evaluacion.name}
								</Text>
							))}
						</View>
						<View style={styles.evaluationsGrid}>
							{evaluacionCurricular?.map((evaluacion) => {
								const evaluacionDocente = allEvaluacionesCurricularesDocente?.find(
									(eva) => eva.id === evaluacion.id
								);
								return (
									<View key={evaluacion.id} style={styles.evaluationColumn}>
										{evaluacionDocente?.preguntasAlternativas?.map((eva: PaHanilidad, evaIndex: number) => {
											const alternativaSeleccionada = eva.alternativas?.find(alt => alt.selected);
											return (
												<Text
													key={`${evaluacion.id}-${evaIndex}`}
													style={styles.evaluationCell}
												>
													{alternativaSeleccionada?.acronimo || '--'}
												</Text>
											);
										}) || <Text style={styles.evaluationCellEmpty}>--</Text>}
									</View>
								);
							})}
						</View>
					</View>
				</View>
				<View style={styles.observationsContainer}>
					<View style={styles.observationSection}>
						<Text style={styles.observationTitle}>Fortalezas Observadas:</Text>
						<Text style={styles.observationText}>
							{dataDocente.observacionCurricular?.fortalezasObservadas || '-'}
						</Text>
					</View>
					<View style={styles.observationSection}>
						<Text style={styles.observationTitle}>Oportunidades de Mejora:</Text>
						<Text style={styles.observationText}>
							{dataDocente.observacionCurricular?.oportunidadesDeMejora || '-'}
						</Text>
					</View>
					<View style={styles.observationSection}>
						<Text style={styles.observationTitle}>Acuerdos y Compromisos:</Text>
						<Text style={styles.observationText}>
							{dataDocente.observacionCurricular?.acuerdosYCompomisos || '-'}
						</Text>
					</View>
					<View style={styles.observationSection}>
						<Text style={styles.observationTitle}>Nivel de Cobertura:</Text>
						<Text style={styles.observationText}>
							{dataDocente.observacionCurricular?.nivelCobertura?.alternativas?.find((alt) => (alt.selected === true))?.cobertura || '-'}
						</Text>
					</View>
				</View>
				<View style={styles.signaturesContainer}>
					<View style={styles.signatureBox}>
						<Text style={styles.signatureTitle}>Firma del Evaluador</Text>
						<View style={styles.signatureLine} />
						<Text style={styles.signatureName}>{`${currentUserData?.nombres ?? '-'} ${currentUserData?.apellidos ?? '-'}`}</Text>
					</View>
					<View style={styles.signatureBox}>
						<Text style={styles.signatureTitle}>Firma del Docente</Text>
						<View style={styles.signatureLine} />
						<Text style={styles.signatureName}>{`${dataDocente?.nombres ?? '-'} ${dataDocente?.apellidos ?? '-'}`}</Text>
					</View>
				</View>
			</View>
		</Page>
	</Document>
);

export const ReporteDocentePdf = ({ dataDocente, currentUserData, selectedEstandar, estandaresCurriculares, preguntasEstandar, evaluacionCurricular, allEvaluacionesCurricularesDocente }: Props) => {
	const handleDownload = async () => {
		const blob = await pdf(
			<MyDocument
				dataDocente={dataDocente}
				currentUserData={currentUserData}
				selectedEstandar={selectedEstandar}
				estandaresCurriculares={estandaresCurriculares}
				preguntasEstandar={preguntasEstandar}
				evaluacionCurricular={evaluacionCurricular}
				allEvaluacionesCurricularesDocente={allEvaluacionesCurricularesDocente}
			/>
		).toBlob();
		
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `reporte_${dataDocente?.dni || 'docente'}.pdf`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	return (
		<div className='w-full flex justify-center'>
			<button
				onClick={handleDownload}
				className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
			>
				Descargar Reporte PDF
			</button>
		</div>
	);
}
