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
			<div className='grid relative xxl:flex gap-[20px] justify-between p-20 bg-headerPsicolinguistica overflow-hidden'>
				<div className='top-0 bottom-0 rigth-0 left-0 bg-gray-700 z-[15] absolute w-full opacity-60'></div>

				<Image
					// className='absolute bottom-0 top-[-250px] right-0 left-0 z-1 opacity-1'
					className="absolute object-cover h-[100%] w-full bottom-0 top-[0px] right-0 left-0 z-[10] opacity-80"
					src={header}
					alt="imagen de cabecera"
					objectFit='fill'
					priority
				/>
				<div className='grid gap-[5px]'>
					<h1 className="text-textTitulos relative z-[20]  text-3xl font-bold font-martianMono capitalize text-left">Evaluación {dataEvaluacionDocente?.name}</h1>
					<div className='relative z-[100] flex gap-5'>
						<input
							type="number"
							className='p-2 h-[50px] outline-none rounded-sm text-slate-300 drop-shadow-xl'
							placeholder="DNI DE DOCENTE"
							onChange={handleChangeDniDocente}
						/>
						{
							dataDirector.dni ?
								<Link href={`reporte?idEvaluacion=${router.query.id}&idDirector=${dataDirector.dni}`} className='p-1  border-[1px] h-[50px] border-green-500 rounded-sm drop-shadow-xl'>
									<div className='text-white text-[14px]'>Dni: <strong>{dataDirector.dni}</strong></div>
									<div className='text-white text-[14px]'>Nombres: <strong>{dataDirector.nombres} {dataDirector.apellidos}</strong> </div>
								</Link>
								:
								<div className='flex justify-center items-center'>
									<p className="text-white">{warningDataDocente}</p>
								</div>
						}
					</div>
				</div>
				<div className='flex gap-2'>
					<button onClick={() => handleShowModalPreguntas()} className='h-[50px] relative z-[30] p-3 bg-gradient-to-r from-tere to-gg-3  text-textTitulos  rounded-sm drop-shadow-lg '>Agregar preguntas</button>
					{/* <button onClick={() => handleShowModalPreguntas()} className='h-[50px] relative z-[30] p-3 bg-gradient-to-r from-tere to-gg-3  text-textTitulos  rounded-sm drop-shadow-lg '>Reporte ugel</button> */}
					{/* <button className='h-[50px] relative z-[30] p-3 bg-gradient-to-r from-amarilloLogo to-tableEstandares4  text-textTitulos  rounded-sm drop-shadow-lg '>Reporte ugel</button> */}
					<div className='h-[50px] relative z-[30] p-3 bg-gradient-to-r from-colorTercero to-colorSecundario  text-textTitulos  rounded-sm drop-shadow-lg '>
						<Link href={`reporte-ugel?idEvaluacion=${router.query.id}`}>
							Reporte ugel
						</Link>
					</div>
					{/* //estes boton me tendria que llevar a la pagina de reportes ya no abre un modal */}

				</div>

			</div>
			<div className='p-20'>
				{
					loaderPages
						?
						<div className="flex w-full mt-5 items-center m-auto justify-center">
							<RiLoader4Line className="animate-spin text-3xl text-slate-500 " />
							<p className="text-slate-500">buscando resultados...</p>
						</div>
						:

						<ul>
							{
								getPreguntaRespuestaDocentes?.map((pq, index) => {
									return (
										<li key={index} className="p-3 border-b-[2px] border-blue-200">
											<div className='flex items-center gap-3'>
												<div className='flex  items-center gap-3'>
													<p className='font-semibold text-slate-600 text-[20px]'>{index + 1}.</p>
													<h3 className='text-slate-600 text-[20px] font-semibold'>{pq.criterio}</h3>
												</div>
												<div className='flex items-center justify-center'>
													<MdEditSquare onClick={() => { handleShowUpdateModal(); setDataUpdate(pq) }} className='text-xl text-yellow-500 cursor-pointer' />
												</div>
											</div>
											<ul className='grid gap-3'>
												{
													pq.alternativas?.map((alt, index) => {
														return (
															<li key={index}>
																<div className='flex items-center'>
																	<span className='text-[18px] font-semibold font-martianMono text-azul-claro4'>{alt.alternativa}.</span>
																	<p className='text-[18px] font-montserrat text-slate-400'>{alt.descripcion}</p>

																</div>

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