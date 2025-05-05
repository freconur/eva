import { createPortal } from "react-dom"
import styles from './EvaluarCurriculaDocente.module.css'
import { useForm } from "react-hook-form";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { EvaluacionCurricular, EvaluacionCurricularAlternativa, EvaluacionHabilidad, PaHanilidad, PRDocentes, User } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import { usePsicolinguistica } from "@/features/hooks/usePsicolinguistica";
import { useEffect, useState } from "react";
import UseEvaluacionEspecialistas from "@/features/hooks/UseEvaluacionEspecialistas";
import useEvaluacionCurricular from "@/features/hooks/useEvaluacionCurricular";

interface Props {
  handleShowEvaluarCurriculaDocente: () => void,
  evaluacionCurricular: EvaluacionCurricularAlternativa[],
  idCurricular: string,
  evaluacionCurricularById: EvaluacionCurricularAlternativa,
  dataDocente:User,
  paHabilidad:PaHanilidad[]
  /*  id: string
   getPreguntaRespuestaDocentes: PRDocentes[] */
}

const EvaluarCurriculaDocente = ({ paHabilidad,dataDocente,handleShowEvaluarCurriculaDocente, idCurricular }: Props) => {

  const { loaderSalvarPregunta } = useGlobalContext()
  const [updatedEvaluacion, setUpdatedEvaluacion] = useState<PaHanilidad[]>([])
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }
  const { salvarEvaluacionCurricular } = useEvaluacionCurricular()

  //FUNCION DECTECCION DE CAMBIO DEL VALOR DE CHECKED
  const handleCheckedRespuesta = (e: React.ChangeEvent<HTMLInputElement>) => {
    
    paHabilidad.map((eva, index) => {
        if ((index + 1) === Number(e.target.name)) {
          if (updatedEvaluacion.find(eva => eva.order === Number(e.target.name))) {
            let newArray = updatedEvaluacion
            newArray.map(eva => {
              if (eva.order === Number(e.target.name)) {
                console.log('ya existo 2')
                eva.alternativas?.map(alt => {
                    alt.selected = alt.acronimo === e.target.value ? true : false
                })
              }
            })
            setUpdatedEvaluacion(newArray)
          } else {
            let newArray = updatedEvaluacion
            newArray.push({
              ...eva,
              alternativas: eva.alternativas?.map(alt => ({
                ...alt,
                selected: alt.acronimo === e.target.value ? true : false
              }))
            })
            setUpdatedEvaluacion(newArray)
          }
        }
      });
    
  }
  const handleGuardarEvaluacion = () => {
    salvarEvaluacionCurricular(idCurricular, dataDocente, updatedEvaluacion)
  }
  console.log('updatedEvaluacion', updatedEvaluacion)
  return container
    ? createPortal(
      <div className={styles.containerModal}>

        <div className={styles.containerSale}>

          {
            loaderSalvarPregunta ?
              <div className='grid items-center justify-center'>
                <div className='flex justify-center items-center'>
                  <RiLoader4Line className="animate-spin text-3xl text-colorTercero " />
                  <span className='text-colorTercero animate-pulse'>...guardando evaluación</span>
                </div>
              </div>
              :
              <>
                <div className={styles.closeModalContainer}>
                  <div className={styles.close} onClick={handleShowEvaluarCurriculaDocente} >cerrar</div>
                </div>
                <h3 className={styles.title}>Evaluación de curricula docente</h3>

                <div>
                  <table className={styles.tableWrapper}>
                    <thead className={styles.tableHead}>
                      <tr className={styles.tableRow}>
                        <th className={styles.tableHeader}>#</th>
                        <th className={styles.tableHeader}>habilidad</th>
                        <th className={styles.tableHeader}>alternativas</th>
                      </tr>
                    </thead>
                    <tbody className={styles.tableBody}>
                      {
                        paHabilidad.map((eva, index) => (
                          <tr key={index} className={styles.tableRow}>
                            <td className={styles.tableCell}>{index + 1}</td>
                            <td className={styles.tableCell}>{eva.habilidad}</td>
                            <td className={styles.tableCell}>
                            <div className={styles.alternativasContainer}>
                              {
                                eva.alternativas &&
                                eva.alternativas.map(al => {
                                  return (
                                    <div key={al.order}>
                                      <div className={styles.acronimo}>{al.acronimo}</div>
                                      <input
                                        className={styles.radio}
                                        type="radio"
                                        name={`${eva.order}`}
                                        value={al.acronimo}
                                        checked={al.selected}
                                        onChange={handleCheckedRespuesta}
                                      />
                                    </div>
                                  )
                                })
                              }
                            </div>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                  <button className={styles.guardarButton} onClick={handleGuardarEvaluacion}>guardar</button>
                </div>
              </>
          }
        </div>
      </div>,
      container
    )
    : null
}

export default EvaluarCurriculaDocente