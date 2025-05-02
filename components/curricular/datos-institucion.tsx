import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'
import { User } from '@/features/types/types'
import { regionTexto } from '@/fuctions/regiones'
import UpdateDataDocente from '@/modals/updateDocente'
import React, { useState } from 'react'
import { MdEditSquare } from 'react-icons/md'
import { gradosDeColegio, sectionByGrade, area } from '../../fuctions/regiones'
import styles from './datos-institucion.module.css'

interface Props {
	dataDocente: User
}

const DatosInstitucion = ({ dataDocente }: Props) => {
	const [showUpdateDataDocente, setShowUpdateDataDocente] = useState(false)

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

	return (
		<div className="bg-white">
			{showUpdateDataDocente && (
				<UpdateDataDocente
					dataDocente={dataDocente}
					onClose={() => setShowUpdateDataDocente(false)}
				/>
			)}
			<div className={styles.header}>
				<h2>I. Datos de la institución educativa y del profesor</h2>
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
				<div className={styles.dataRow}>
					<div className={styles.label}>Institución Educativa</div>
					<div className={styles.value}>{dataDocente?.institucion ?? '-'}</div>
				</div>
				<div className={styles.dataRow}>
					<div className={styles.label}>Distrito</div>
					<div className={styles.value}>{dataDocente?.distrito ?? '-'}</div>
				</div>
				<div className={styles.dataRow}>
					<div className={styles.label}>Característica</div>
					<div className={styles.value}>{dataDocente?.caracteristicaCurricular ?? '-'}</div>
				</div>

				<div className={styles.sectionTitle}>Datos del Docente</div>
				<div className={styles.dataRow}>
					<div className={styles.label}>Nombres y Apellidos</div>
					<div className={styles.value}>{`${dataDocente?.nombres ?? '-'} ${dataDocente?.apellidos ?? '-'}`}</div>
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
