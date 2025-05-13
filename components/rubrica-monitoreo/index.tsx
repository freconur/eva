import { PRDocentes } from '@/features/types/types'
import React from 'react'
import styles from './rubrica.module.css'

interface Props {
  getPreguntaRespuestaDocentes: PRDocentes[]
}

const RubricaMonitoreo = ({ getPreguntaRespuestaDocentes }: Props) => {
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
                    {/* <MdEditSquare onClick={() => { handleShowUpdateModal(); setDataUpdate(pq) }} className='text-xl text-yellow-500 cursor-pointer' /> */}
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