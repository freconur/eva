import { useGlobalContext } from '@/features/context/GlolbalContext'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'
import { EstandaresCurriculares, EvaluacionCurricular, EvaluacionCurricularAlternativa, EvaluacionHabilidad, User } from '@/features/types/types'
import EvaluarCurriculaDocente from '@/modals/mallaCurricular/evaluarCurriculaDocente'
import React, { useEffect, useState } from 'react'
import styles from './cobertura-curricular.module.css'


interface Props {
  paHabilidad: EvaluacionHabilidad[],
  evaluacionCurricular: EvaluacionCurricular[],
  evaluacionCurricularAlternativa: EvaluacionCurricularAlternativa[],
  dataDocente: User
}
const CoberturaCurricular = ({ dataDocente, paHabilidad, evaluacionCurricular, evaluacionCurricularAlternativa }: Props) => {

  const [showEvaluacion, setShowEvaluacion] = useState<boolean>(false)
  const [idCurricular, setIdCurricular] = useState<string>("")
  const { generateEvaluacionCurricular, getEvaluacionCurricularDocente, getInstrumentos, getEstandaresCurriculares, tituloCoberturaCurricular } = useEvaluacionCurricular()
  const [selectedEstandar, setSelectedEstandar] = useState<string>('1')
  const { evaluacionCurricularById, allEvaluacionesCurricularesDocente, preguntasEstandar,estandaresCurriculares } = useGlobalContext()
  const handleEvaluarDocenteCurricular = (id: string) => {
    setShowEvaluacion(!showEvaluacion)
    //aqui es donde se genera la evaluacion curricular vuando se abre el modal de evaluacion
    generateEvaluacionCurricular(evaluacionCurricularAlternativa, preguntasEstandar, id)
    /* generateEvaluacionCurricular(evaluacionCurricularAlternativa, paHabilidad, id) */
  }
  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('tipi', estandaresCurriculares)
		setSelectedEstandar(e.target.value)
    /* estandaresCurriculares. */
    const estandar = estandaresCurriculares.find(estandar => Number(estandar.nivel) === Number(e.target.value))
    estandar && tituloCoberturaCurricular(estandar)
    
		/* setIsLoading(true) */
		/* await getEstandaresCurriculares(e.target.value) */
		/* setIsLoading(false) */
	}
  const handleShowEvaluarCurriculaDocente = () => {
    setShowEvaluacion(!showEvaluacion)
  }
  /* useEffect(() => {
    getEvaluacionCurricularDocente(`${dataDocente.dni}`, selectedEstandar)//esto me lo trae segun los grados del docente
    //el valor que retorna esta funcion es el unico que se usa para pintar la tabla, nos trae toda los resultados de las evaluaciones que tiene el docente
    
  }, [dataDocente]) */


  useEffect(() => {
    getEvaluacionCurricularDocente(`${dataDocente.dni}`, selectedEstandar)
    getEstandaresCurriculares(selectedEstandar)
  },[selectedEstandar, dataDocente.dni])
  useEffect(() => {
    /* resetValuesEvaluarCurricular() */
    getInstrumentos()
  }, [])
  /* console.log('evaluacionCurricular', evaluacionCurricular)
  console.log('allEvaluacionesCurricularesDocente', allEvaluacionesCurricularesDocente)
  console.log('paHabilidad', paHabilidad) */
  return (
    <div className={styles.coberturaContainer}>
      {
        showEvaluacion && <EvaluarCurriculaDocente selectedEstandar={selectedEstandar} dataDocente={dataDocente} evaluacionCurricularById={evaluacionCurricularById} paHabilidad={paHabilidad} evaluacionCurricular={evaluacionCurricular} handleShowEvaluarCurriculaDocente={handleShowEvaluarCurriculaDocente} idCurricular={idCurricular} />
      }
      <h2 className={styles.title}>iii. cobertura curricular de la competencia lee</h2>
      <div>
        <ul className={styles.list}>
          <li className={styles.listItem + " " + styles.nunca}>
            <p className={styles.listItemText}>
              N = Nunca
            </p>
          </li>
          <li className={styles.listItem + " " + styles.casiNunca}>
            <p className={styles.listItemText}>
              CN = Casi nunca
            </p>
          </li>
          <li className={styles.listItem + " " + styles.aVeces}>
            <p className={styles.listItemText}>
              AV = A veces
            </p>
          </li>
          <li className={styles.listItem + " " + styles.frecuentemente}>
            <p className={styles.listItemText}>
              F = Frecuentemente
            </p>
          </li>
          <li className={styles.listItem + " " + styles.siempre}>
            <p className={styles.listItemText}>
              S = Siempre
            </p>
          </li>
        </ul>
      </div>
      <div>
      <select
					className={styles.select}
					value={selectedEstandar}
					onChange={handleChange}
				>
					<option value="">Seleccione un estándar</option>
					{
						estandaresCurriculares.map((nivel) => (
							<option key={nivel.nivel} value={nivel.nivel}>{nivel.name?.toUpperCase()}</option>
						))
					}
				</select>
      </div>
      <div className={styles.tableContainer}>
        <ul className={styles.skillsList}>
          <li className={styles.skillsHeader}>A. habilidad lectora</li>
          {preguntasEstandar.map((habilidad, index) => (
            <li className={styles.skillItem} key={habilidad.id}>
                  <p className={styles.skillText}>
                    {index + 1}. {habilidad.habilidad}
                  </p>
                </li>
           

          ))}
        </ul>
        <div className={styles.evaluationsContainer}>
          <ul className={styles.evaluationsList}>
            {evaluacionCurricular?.map((evaluacion, index) => (
              <li className={styles.evaluationItem} key={evaluacion.id}>
                <p
                  onClick={() => { setIdCurricular(`${evaluacion.id}`); handleEvaluarDocenteCurricular(`${evaluacion.id}`) }}
                  className={styles.evaluationTitle}
                >
                  {evaluacion.name}
                </p>
              </li>
            ))}
          </ul>
          <div className={styles.evaluationsGrid}>
            {allEvaluacionesCurricularesDocente?.map((evaluacion, index) => (
              <ul key={index}>
                {evaluacion?.preguntasAlternativas?.map((eva, evaIndex) => (
                  eva.alternativas?.map((alt, altIndex) => (
                    alt.selected && (
                      <li
                        key={`${index}-${evaIndex}-${altIndex}`}
                        className={`${styles.evaluationCell} ${styles[`level${alt.order}`]}`}
                      >
                        <p className={styles.evaluationAcronym}>{alt.acronimo}</p>
                      </li>
                    )
                  ))
                ))}
              </ul>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default CoberturaCurricular