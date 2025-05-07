import Image from 'next/image'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import header from '../../../../assets/evaluacion-docente.jpg'
import AgregarPreguntasRespuestasDocentes from '@/modals/AgregarPreguntasRespuestasDocentes'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import UseEvaluacionDocentes from '@/features/hooks/UseEvaluacionDocentes'
import { MdEditSquare } from 'react-icons/md'
import UpdatePreguntaRespuestaDocente from '@/modals/updatePrDocentes'
import { PRDocentes } from '@/features/types/types'
import EvaluarDocente from '@/modals/evaluarDocente'
import Link from 'next/link'
import { RiLoader4Line } from 'react-icons/ri'
import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'
import styles from './evaluacionDocente.module.css'

const EvaluacionDocente = () => {
	const [showAgregarPreguntas, setShowAgregarPreguntas] = useState<boolean>(false)
	const router = useRouter()
	const { getPreguntaRespuestaDocentes, dataEvaluacionDocente, dataDocente, loaderPages, dataDirector, warningDataDocente } = useGlobalContext()
	const { getPreguntasRespuestasDocentes, getDataEvaluacion, buscarDirector } = UseEvaluacionDocentes()
	const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false)
	const [valueDni, setValueDni] = useState<string>("")
	const [showEvaluarDocente, setShowEvaluarDocente] = useState<boolean>(false)
	const [dataUpdate, setDataUpdate] = useState<PRDocentes>({})

	const handleShowModalPreguntas = () => {
		setShowAgregarPreguntas(!showAgregarPreguntas)
	}
	const handleShowUpdateModal = () => {
		setShowUpdateModal(!showUpdateModal)
	}
	const handleShowEvaluarDocente = () => {
		setShowEvaluarDocente(!showEvaluarDocente)
	}
	const handleChangeDniDocente = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValueDni(e.target.value)
	}

	useEffect(() => {
		if (valueDni.toString().length === 8) {
			buscarDirector(`${valueDni}`)
		}
	}, [valueDni])

	useEffect(() => {
		getDataEvaluacion(`${router.query.id}`)
		getPreguntasRespuestasDocentes(`${router.query.id}`)
	}, [`${router.query.id}`])

	return (
		<div>
			{showUpdateModal && <UpdatePreguntaRespuestaDocente id={`${router.query.id}`} dataUpdate={dataUpdate} handleShowUpdateModal={handleShowUpdateModal} />}
			{showEvaluarDocente && <EvaluarDocente handleShowEvaluarDocente={handleShowEvaluarDocente} id={`${router.query.id}`} getPreguntaRespuestaDocentes={getPreguntaRespuestaDocentes} />}
			{showAgregarPreguntas && <AgregarPreguntasRespuestasDocentes idEvaluacion={`${router.query.id}`} handleShowModalPreguntas={handleShowModalPreguntas} />}
			
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
					<h1 className={styles.headerTitle}>Monitoreo {dataEvaluacionDocente?.name?.toLocaleLowerCase()}</h1>
					<div className={styles.searchContainer}>
						<input
							type="number"
							className={styles.searchInput}
							placeholder="DNI DE DOCENTE"
							onChange={handleChangeDniDocente}
						/>
						{
							dataDirector.dni ?
								<Link href={`reporte?idEvaluacion=${router.query.id}&idDirector=${dataDirector.dni}`} className={styles.docenteInfo}>
									<div className={styles.docenteInfoText}>Dni: <strong className={styles.docenteInfoStrong}>{dataDirector.dni}</strong></div>
									<div className={styles.docenteInfoText}>Nombres: <strong className={styles.docenteInfoStrong}>{dataDirector.nombres} {dataDirector.apellidos}</strong></div>
								</Link>
								:
								<div className={styles.docenteInfoText}>
									<p>{warningDataDocente}</p>
								</div>
						}
					</div>
				</div>
				<div className={styles.buttonContainer}>
					<button onClick={() => handleShowModalPreguntas()} className={`${styles.button} ${styles.buttonPrimary}`}>Agregar preguntas</button>
					<div className={`${styles.button} ${styles.buttonSecondary}`}>
						<Link href={`reporte-ugel?idEvaluacion=${router.query.id}`} className={styles.buttonLink}>
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
EvaluacionDocente.Auth = PrivateRouteAdmins