import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'
import { User } from '@/features/types/types'
import { converGenero, convertRolToTitle, regionTexto } from '@/fuctions/regiones'
import UpdateDataDocente from '@/modals/updateDocente'
import React, { useState, useEffect } from 'react'
import { MdEditSquare } from 'react-icons/md'
import { gradosDeColegio, sectionByGrade, area, genero } from '../../fuctions/regiones'
import styles from './datos-institucion.module.css'
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { doc, updateDoc, getFirestore } from "firebase/firestore";

interface Props {
	dataDocente: User
}

const DatosInstitucion = ({ dataDocente }: Props) => {
	const [minDate, setMinDate] = useState(dayjs(new Date().setFullYear(2023)));
	const [showUpdateDataDocente, setShowUpdateDataDocente] = useState(false)
	// Función helper para convertir timestamp a Date y verificar si es válida
	const convertTimestampToDate = (timestamp: any) => {
		if (!timestamp || timestamp === null || timestamp === undefined) return null;
		
		try {
			// Si es un timestamp de Firestore
			if (timestamp && typeof timestamp.toDate === 'function') {
				return timestamp.toDate();
			}
			// Si es un timestamp en segundos (número)
			if (typeof timestamp === 'number') {
				return new Date(timestamp * 1000);
			}
			// Si ya es una fecha o string válido
			return new Date(timestamp);
		} catch {
			return null;
		}
	};

	// Función helper para verificar si la fecha es válida
	const isValidDate = (date: any) => {
		const convertedDate = convertTimestampToDate(date);
		if (!convertedDate) return false;
		
		try {
			const daysDate = dayjs(convertedDate);
			return daysDate.isValid();
		} catch {
			return false;
		}
	};

	const [startDate, setStartDate] = useState(() => {
		// Verificar si fechaEvaluacion existe y es una fecha válida
		if (isValidDate(dataDocente.fechaEvaluacion)) {
			const convertedDate = convertTimestampToDate(dataDocente.fechaEvaluacion);
			return dayjs(convertedDate);
		}
		// Si no existe o no es válida, usar la fecha actual
		return dayjs();
	});

	// Actualizar el estado cuando dataDocente cambie
	useEffect(() => {
		if (isValidDate(dataDocente.fechaEvaluacion)) {
			const convertedDate = convertTimestampToDate(dataDocente.fechaEvaluacion);
			setStartDate(dayjs(convertedDate));
		} else {
			setStartDate(dayjs());
		}
	}, [dataDocente.fechaEvaluacion]);
	const db = getFirestore();

	const getGradoTexto = (grado: string | number | undefined) => {
		if (!grado) return '-'
		const gradoEncontrado = gradosDeColegio.find(g => g.id === Number(grado))
		return gradoEncontrado?.name ?? '-'
	}

	const getSeccionTexto = (seccion: string | number | undefined) => {
		if (!seccion) return '-'
		const seccionEncontrada = sectionByGrade.find(s => s.id === Number(seccion))
		return seccionEncontrada?.name ?? '-'
	}

	const getAreaTexto = (areaId: string | number | undefined) => {
		if (!areaId) return '-'
		const areaEncontrada = area.find(a => a.id === Number(areaId))
		return areaEncontrada?.name ?? '-'
	}

	const handleDateChange = async (newValue: any) => {
		setStartDate(newValue);
		if (!dataDocente.dni) {
			console.error("DNI no disponible");
			return;
		}
		try {
			const userRef = doc(db, "usuarios", dataDocente.dni);
			await updateDoc(userRef, {
				fechaEvaluacion: newValue.toDate()
			});
		} catch (error) {
			console.error("Error al actualizar la fecha:", error);
		}
	};
console.log('dataDocente', dataDocente)
	return (
		<div className="bg-white">
			{showUpdateDataDocente && (
				<UpdateDataDocente
					dataDocente={dataDocente}
					onClose={() => setShowUpdateDataDocente(false)}
				/>
			)}
			<div className={styles.header}>
				<h2>I. Datos de la {dataDocente.rol === 1 ? "ugel" : "institución educativa"} y del {convertRolToTitle(Number(dataDocente.rol))}</h2>
				<MdEditSquare
					onClick={() => setShowUpdateDataDocente(!showUpdateDataDocente)}
					className={styles.editButton}
				/>
			</div>

			<div id="data-institucion-docente" className={styles.container}>
				<div className={styles.sectionTitle}>Datos de la Institución</div>
				<div className={styles.dataRow}>
					<div className={styles.label}>UGEL</div>
					<div className={styles.value}>{regionTexto(`${dataDocente?.region}`) ?? '-'}</div>
				</div>
				{
					dataDocente?.rol === 1 ? null :
						<div className={styles.dataRow}>
							<div className={styles.label}>Institución Educativa</div>
							<div className={styles.value}>{dataDocente?.institucion ?? '-'}</div>
						</div>

				}
				{
					dataDocente?.rol === 1 ? null :
						<div className={styles.dataRow}>
							<div className={styles.label}>Distrito</div>
							<div className={styles.value}>{dataDocente?.distrito ?? '-'}</div>
						</div>
				}
				{
					dataDocente?.rol === 1 ? null :
						<div className={styles.dataRow}>
							<div className={styles.label}>Característica</div>
							<div className={styles.value}>{dataDocente?.caracteristicaCurricular ?? '-'}</div>
						</div>
				}

				<div className={styles.dataRow}>
					<div className={styles.label}>Nombres y Apellidos</div>
					<div className={styles.value}>{`${dataDocente?.nombres ?? '-'} ${dataDocente?.apellidos ?? '-'}`}</div>
				</div>
				<div className={styles.dataRow}>
					<div className={`${styles.label}`}>Fecha</div>
					<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
						<DesktopDatePicker
							minDate={minDate}
							value={startDate}
							onChange={handleDateChange}
						/>
					</LocalizationProvider>
				</div>
				<div className={styles.dataRow}>
					<div className={styles.label}>Celular</div>
					<div className={styles.value}>{`${dataDocente?.celular ?? '-'}`}</div>
				</div>
				{
					dataDocente?.rol === 1 ? null :
						<>
							<div className={styles.dataRow}>
								<div className={styles.label}>genero</div>
								<div className={styles.value}>{`${converGenero(`${dataDocente?.genero}`) ?? '-'}`}</div>
							</div>
							<div className={styles.dataRow}>
								<div className={styles.gradosSeccionesContainer}>
									<div className={styles.gradosSeccionesItem}>
										<div className={styles.gradosSeccionesLabel}>Grados</div>
										<div className={styles.gradosSeccionesValue}>
											{Array.isArray(dataDocente?.grados)
												? dataDocente.grados.map(g => getGradoTexto(g)).join(', ')
												: getGradoTexto(dataDocente?.grados) ?? '-'}
										</div>
									</div>
									<div className={styles.gradosSeccionesItem}>
										<div className={styles.gradosSeccionesLabel}>Secciones</div>
										<div className={styles.gradosSeccionesValue}>
											{Array.isArray(dataDocente?.secciones)
												? dataDocente.secciones.map(s => getSeccionTexto(s)).join(', ')
												: getSeccionTexto(dataDocente?.secciones) ?? '-'}
										</div>
									</div>
								</div>
							</div>
				<div className={styles.dataRow}>
					<div className={styles.label}>Área</div>
					<div className={styles.value}>{getAreaTexto(dataDocente?.area) ?? '-'}</div>
				</div>
						</>
				}
				<div className={styles.dataRow}>
					<div className={styles.gradosSeccionesContainer}>
						<div className={styles.gradosSeccionesItem}>
							<div className={styles.gradosSeccionesLabel}>DNI</div>
							<div className={styles.gradosSeccionesValue}>
								{dataDocente?.dni ?? '-'}
							</div>
						</div>
						<div className={styles.gradosSeccionesItem}>
							<div className={styles.gradosSeccionesLabel}>Celular</div>
							<div className={styles.gradosSeccionesValue}>
								{dataDocente?.celular ?? '-'}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default DatosInstitucion
