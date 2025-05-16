import { User } from '@/features/types/types'
import React, { useState } from 'react'
import styles from './tablasUsuarios.module.css'
import Link from 'next/link'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { convertRolToPath, convertRolToTitle } from '@/fuctions/regiones'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'


interface TablaUsuariosProps {
	docentesDeDirectores: User[],
	rol:number
}
const TablaMaestroUsuarios = ({ docentesDeDirectores, rol }: TablaUsuariosProps) => {
	const { currentUserData,resultadoBusquedaUsuario,dataDocenteMaster,warningDataDocente } = useGlobalContext()
	const [dniUsuario, setDniUsuario] = useState<string>("")
	const [error, setError] = useState<string>("")
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const { getDirectorFromEspecialistaCurricular,getUsuarioMaster } = useEvaluacionCurricular()

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (dniUsuario.length !== 8) {
			setError("El DNI debe tener 8 dígitos")
			return
		}else {
			//aqui va la funcion que va a buscar al director
			getUsuarioMaster(dniUsuario)
			console.log(dniUsuario)
			setError("")
		}
	}

	const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		setDniUsuario(value)
		if (value.length !== 8 && value.length > 0) {
			setError("El DNI debe tener 8 dígitos")
		} else {
			setError("")
		}
	}
	console.log('dataDocenteMaster', dataDocenteMaster)
	return (
		<div className={styles.tableSection}>
			<h2 className={styles.sectionTitle}>
				<span className={styles.sectionTitleIndicator}></span>
				Busqueda de usuario
			</h2>

			<div>
				<form className={styles.formulario} action="" onSubmit={handleSubmit}>
					<div >
						<div className={styles.formGroup}>
							<label htmlFor="">Dni de usuario:</label>
							<div className={styles.inputContainer}>
								<input
									className={`${styles.input} ${error ? styles.inputError : ''}`}
									type="text"
									placeholder='escribe el dni'
									onChange={handleDniChange}
									maxLength={8}
								/>
								<button type='submit' className={styles.button}>Buscar</button>
							</div>
							{error && <span className={styles.errorMessage}>{error}</span>}
						</div>
					</div>
				</form>

				{Object.keys(dataDocenteMaster).length > 0 ? (
					<Link 
					href={`/especialistas/cobertura-curricular-master/curricular/evaluar-curricula?idDocente=${dataDocenteMaster.dni}`} className={styles.resultadoBusqueda}>
						<h3>Resultado de la búsqueda</h3>
						<p><strong>DNI:</strong> {dataDocenteMaster.dni}</p>
						<p><strong>Nombres:</strong> {dataDocenteMaster.nombres?.toLocaleUpperCase()}</p>
						<p><strong>Apellidos:</strong> {dataDocenteMaster.apellidos?.toLocaleUpperCase()}</p>
					</Link>
				) : (
					<p>{warningDataDocente}</p>
				)}
			</div>
			
			
		</div>
	)
}

export default TablaMaestroUsuarios