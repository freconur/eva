import Image from 'next/image'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import header from '@/assets/evaluacion-docente.jpg'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { MdEditSquare } from 'react-icons/md'
import { PRDocentes } from '@/features/types/types'
import Link from 'next/link'
import { RiLoader4Line } from 'react-icons/ri'
import styles from './index.module.css'
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas'
import AgregarPreguntasRespuestasEspecialistas from '@/modals/AgregarPreguntasRespuestasEspecialistas'
import UpdatePreguntaRespuestaEspecialistas from '@/modals/updatePrEspecialistas'

const EvaluacionDocente = () => {
	const [showAgregarPreguntas, setShowAgregarPreguntas] = useState<boolean>(false)
	const router = useRouter()
	const { getPreguntaRespuestaDocentes, dataEvaluacionDocente, dataDocente, loaderPages, dataDirector, warningDataDocente } = useGlobalContext()
	const { getPreguntasRespuestasEspecialistas, getDataEvaluacion, buscarEspecialista } = UseEvaluacionEspecialistas()
	const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false)
	const [valueDni, setValueDni] = useState<string>("")
	const [dataUpdate, setDataUpdate] = useState<PRDocentes>({})

	const handleShowModalPreguntas = () => {
		setShowAgregarPreguntas(!showAgregarPreguntas)
	}
	const handleShowUpdateModal = () => {
		setShowUpdateModal(!showUpdateModal)
	}
	const handleChangeDniDocente = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValueDni(e.target.value)
	}

	useEffect(() => {
		if (valueDni.toString().length === 8) {
			buscarEspecialista(`${valueDni}`)
		}
	}, [valueDni])

	useEffect(() => {
		getDataEvaluacion(`${router.query.id}`)
		getPreguntasRespuestasEspecialistas(`${router.query.id}`)
	}, [`${router.query.id}`])

	return (
		<div>
			{showUpdateModal && <UpdatePreguntaRespuestaEspecialistas id={`${router.query.id}`} dataUpdate={dataUpdate} handleShowUpdateModal={handleShowUpdateModal} />}
			{showAgregarPreguntas && <AgregarPreguntasRespuestasEspecialistas idEvaluacion={`${router.query.id}`} handleShowModalPreguntas={handleShowModalPreguntas} />}

			<div className={styles.header}>
				<div className={styles.headerOverlay}></div>
				<Image
					className={styles.headerImage}
					src={header}
					alt="imagen de cabecera"
					objectFit='fill'
					priority
				/>
				<div className={styles.headerContent}>
					<h1 className={styles.headerTitle}>Evaluación {dataEvaluacionDocente?.name?.toLocaleLowerCase()}</h1>
					<div className={styles.searchContainer}>
						<input
							type="number"
							className={styles.searchInput}
							placeholder="DNI DE ESPECIALISTA"
							onChange={handleChangeDniDocente}
						/>
						{
							dataDirector.dni ?
								<Link href={`reporte-especialista-individual?idEvaluacion=${router.query.id}&idDirector=${dataDirector.dni}`} className={styles.especialistaInfo}>
									<div className={styles.especialistaInfoText}>Dni: <strong className={styles.especialistaInfoStrong}>{dataDirector.dni}</strong></div>
									<div className={styles.especialistaInfoText}>Nombres: <strong className={styles.especialistaInfoStrong}>{dataDirector.nombres} {dataDirector.apellidos}</strong></div>
								</Link>
								:
								<div className={styles.especialistaInfoText}>
									<p>{warningDataDocente}</p>
								</div>
						}
					</div>
				</div>
				<div className={styles.buttonContainer}>
					<button onClick={() => handleShowModalPreguntas()} className={`${styles.button} ${styles.buttonPrimary}`}>Agregar</button>
					<button onClick={() => handleShowModalPreguntas()} className={`${styles.button} ${styles.buttonPrimary}`}>Agregar preguntas</button>
					<Link href={`evaluar-especialista?id=${router.query.id}`} className={`${styles.button} ${styles.buttonSecondary}`}>
						Evaluar especialista
					</Link>
					<div className={`${styles.button} ${styles.buttonPrimary}`}>
						<Link href={`reporte?idEvaluacion=${router.query.id}`} className={styles.buttonLink}>
							Reporte ugel
						</Link>
					</div>
				</div>
			</div>

			<div className={styles.content}>
				{
					loaderPages
						?
						<div className={styles.loaderContainer}>
							<RiLoader4Line className={styles.loaderIcon} />
							<p className={styles.loaderText}>buscando resultados...</p>
						</div>
						:
						<ul className={styles.preguntasList}>
							{
								getPreguntaRespuestaDocentes?.map((pq, index) => {
									return (
										<li key={index} className={styles.preguntaItem}>
											<div className={styles.preguntaHeader}>
												<div className={styles.preguntaHeader}>
													<p className={styles.preguntaNumber}>{index + 1}.</p>
													<h3 className={styles.preguntaTitle}>{pq.criterio}</h3>
												</div>
												<div className={styles.editButton}>
													<MdEditSquare onClick={() => { handleShowUpdateModal(); setDataUpdate(pq) }} />
												</div>
											</div>
											<ul className={styles.alternativasList}>
												{
													pq.alternativas?.map((alt, index) => {
														return (
															<li key={index} className={styles.alternativaItem}>
																<span className={styles.alternativaNumber}>{alt.alternativa}.</span>
																<p className={styles.alternativaText}>{alt.descripcion}</p>
															</li>
														)
													})
												}
											</ul>
										</li>
									)
								})
							}
						</ul>
				}
			</div>
		</div>
	)
}

export default EvaluacionDocente
// EvaluacionDocente.Auth = PrivateRouteAdmins