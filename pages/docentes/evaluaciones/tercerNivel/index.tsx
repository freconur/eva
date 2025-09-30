import Image from 'next/image'
import React from 'react'
import lectura from '../../../../assets/lectura.png'
import resolucion from '../../../../assets/resuelve-problemas.png'
import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes'
import Link from 'next/link'
import styles from './tercerNivel.module.css'

const TercerNivel = () => {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Evaluaciones de Aprendizaje - Primaria</h1>
        <div className={styles.gridContainer}>
          <div className={styles.card}>
            <div className={styles.header}>
              <div className={styles.number}>3</div>
              <h2 className={styles.headerTitle}>Estándar de aprendizaje</h2>
            </div>
            <Link href="tercerNivel/pruebas?grado=1&categoria=1" className={`${styles.link} ${styles.bgAzulClaro4}`}>
              <div className={styles.overlay}></div>
              <div className={styles.imageContainer}>
                <Image
                  alt="logo formativa"
                  src={lectura}
                  width={100}
                  height={100}
                />
              </div>
              <p className={styles.linkText}>1er grado: lee</p>
            </Link>
            <Link href="tercerNivel/pruebas?grado=1&categoria=2" className={`${styles.link} ${styles.bgAzulClaro3}`}>
              <div className={styles.overlay}></div>
              <div className={styles.imageContainer}>
                <Image
                  alt="logo formativa"
                  src={resolucion}
                  width={100}
                  height={100}
                />
              </div>
              <p className={styles.linkText}>1er grado: resuelve problemas</p>
            </Link>
            <Link href="tercerNivel/pruebas?grado=2&categoria=1" className={`${styles.link} ${styles.bgAzulClaro2}`}>
              <div className={styles.overlay}></div>
              <div className={styles.imageContainer}>
                <Image
                  alt="logo formativa"
                  src={lectura}
                  width={100}
                  height={100}
                />
              </div>
              <p className={styles.linkText}>2do grado: lee</p>
            </Link>
            <Link href="tercerNivel/pruebas?grado=2&categoria=2" className={`${styles.link} ${styles.bgAzulClaro}`}>
              <div className={styles.overlay}></div>
              <div className={styles.imageContainer}>
                <Image
                  alt="logo formativa"
                  src={resolucion}
                  width={100}
                  height={100}
                />
              </div>
              <p className={styles.linkText}>2do grado: resuelve problemas</p>
            </Link>
          </div>

          <div className={styles.card}>
            <div className={styles.header4}>
              <div className={styles.number}>4</div>
              <h2 className={styles.headerTitle}>Estándar de aprendizaje</h2>
            </div>
            <Link href="tercerNivel/pruebas?grado=3&categoria=1" className={`${styles.link} ${styles.bgColorTercero}`}>
              <div className={styles.overlay}></div>
              <div className={styles.imageContainer}>
                <Image
                  alt="logo formativa"
                  src={lectura}
                  width={100}
                  height={100}
                />
              </div>
              <p className={styles.linkText}>3er grado: lee</p>
            </Link>
            <Link href="tercerNivel/pruebas?grado=3&categoria=2" className={`${styles.link} ${styles.bgColorQuinto}`}>
              <div className={styles.overlay}></div>
              <div className={styles.imageContainer}>
                <Image
                  alt="logo formativa"
                  src={resolucion}
                  width={100}
                  height={100}
                />
              </div>
              <p className={styles.linkText}>3er grado: resuelve problemas</p>
            </Link>
            <Link href="tercerNivel/pruebas?grado=4&categoria=1" className={`${styles.link} ${styles.bgColorSecundario}`}>
              <div className={styles.overlay}></div>
              <div className={styles.imageContainer}>
                <Image
                  alt="logo formativa"
                  src={lectura}
                  width={100}
                  height={100}
                />
              </div>
              <p className={styles.linkText}>4to grado: lee</p>
            </Link>
            <Link href="tercerNivel/pruebas?grado=4&categoria=2" className={`${styles.link} ${styles.bgColorCuarto}`}>
              <div className={styles.overlay}></div>
              <div className={styles.imageContainer}>
                <Image
                  alt="logo formativa"
                  src={resolucion}
                  width={100}
                  height={100}
                />
              </div>
              <p className={styles.linkText}>4to grado: resuelve problemas</p>
            </Link>
          </div>

          <div className={styles.card}>
            <div className={styles.header5}>
              <div className={styles.number}>5</div>
              <h2 className={styles.headerTitle5}>Estándar de aprendizaje</h2>
            </div>
            <Link href="tercerNivel/pruebas?grado=5&categoria=1" className={`${styles.link} ${styles.bgPastel2}`}>
              <div className={styles.overlay}></div>
              <div className={styles.imageContainer}>
                <Image
                  alt="logo formativa"
                  src={lectura}
                  width={100}
                  height={100}
                />
              </div>
              <p className={styles.linkText}>5to grado: lee</p>
            </Link>
            <Link href="tercerNivel/pruebas?grado=5&categoria=2" className={`${styles.link} ${styles.bgPastel5}`}>
              <div className={styles.overlay}></div>
              <div className={styles.imageContainer}>
                <Image
                  alt="logo formativa"
                  src={resolucion}
                  width={100}
                  height={100}
                />
              </div>
              <p className={styles.linkText}>5to grado: resuelve problemas</p>
            </Link>
            <Link href="tercerNivel/pruebas?grado=6&categoria=1" className={`${styles.link} ${styles.bgBeneficios}`}>
              <div className={styles.overlay}></div>
              <div className={styles.imageContainer}>
                <Image
                  alt="logo formativa"
                  src={lectura}
                  width={100}
                  height={100}
                />
              </div>
              <p className={styles.linkText}>6to grado: lee</p>
            </Link>
            <Link href="tercerNivel/pruebas?grado=6&categoria=2" className={`${styles.link} ${styles.bgPastel2}`}>
              <div className={styles.overlay}></div>
              <div className={styles.imageContainer}>
                <Image
                  alt="logo formativa"
                  src={resolucion}
                  width={100}
                  height={100}
                />
              </div>
              <p className={styles.linkText}>6to grado: resuelve problemas</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TercerNivel
TercerNivel.Auth = PrivateRouteDocentes