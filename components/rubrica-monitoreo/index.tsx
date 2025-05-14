import { PRDocentes } from '@/features/types/types'
import React from 'react'
import styles from './rubrica.module.css'
import { MdEditSquare } from 'react-icons/md'

interface Props {
  getPreguntaRespuestaDocentes: PRDocentes[],
  handleShowUpdateModal: () => void,
  setDataUpdate: (data: PRDocentes) => void,
  rol: number
}

const RubricaMonitoreo = ({ getPreguntaRespuestaDocentes, handleShowUpdateModal, setDataUpdate, rol }: Props) => {
  return (
    <div className={styles.rubricaContainer}>
      <ul className={styles.criterioList}>
        {
          getPreguntaRespuestaDocentes?.map((pq, index) => {
            return (
              <li key={index} className={styles.criterioItem}>
                <div className={styles.criterioHeader}>
                  <div className={styles.criterioHeader}>
                    <p className={styles.numeroCriterio}>{index + 1}.</p>
                    <h3 className={styles.tituloCriterio}>{pq.criterio}</h3>
                  </div>
                  <div>
                    {rol === 4 ? <MdEditSquare onClick={() => { handleShowUpdateModal(); setDataUpdate(pq) }} className='text-xl text-yellow-500 cursor-pointer' /> : null}
                  </div>
                </div>
                <ul className={styles.alternativasList}>
                  {
                    pq.alternativas?.map((alt, index) => {
                      return (
                        <li key={index} className={styles.alternativaItem}>
                          <span className={styles.numeroAlternativa}>{alt.alternativa}.</span>
                          <p className={styles.descripcionAlternativa}>{alt.descripcion}</p>
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
    </div>
  )
}

export default RubricaMonitoreo