import PrivateRouteDocentes from "@/components/layouts/PrivateRoutesDocentes";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect } from "react";
import primaria from "../../../assets/primaria.png";
import secundaria from "../../../assets/secundaria.png";
import inicial from "../../../assets/inicial.png";
import logo from "../../../assets/formativa-logo.png";
import { RiLoader4Line } from "react-icons/ri";
import styles from "./evaluaciones.module.css";

const getRandomPosition = () => {
  const circlePositions = ['circleTopRight', 'circleTopLeft', 'circleBottomRight', 'circleBottomLeft'];
  const shapePositions = ['shapeTopRight', 'shapeTopLeft', 'shapeBottomRight', 'shapeBottomLeft'];
  
  const randomCircle = circlePositions[Math.floor(Math.random() * circlePositions.length)];
  const randomShape = shapePositions[Math.floor(Math.random() * shapePositions.length)];
  
  return `${styles[randomCircle]} ${styles[randomShape]}`;
};

const Evaluaciones = () => {
  const { getEvaluaciones } = useAgregarEvaluaciones();
  const { evaluaciones, currentUserData, loaderPages } = useGlobalContext();

  useEffect(() => {
    getEvaluaciones();
  }, [currentUserData.dni]);

  console.log("evaluaciones", evaluaciones);
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        evaluaciones por niveles
      </h1>
      <div className={styles.gridContainer}>
        <div className={styles.secundariaContainer}>
          <div className={styles.levelTitle}>
            <Link href="/docentes/evaluaciones/secundaria" className={styles.levelTitle}>
              <div className={styles.levelImage}>
                <Image
                  alt="logo formativa"
                  src={secundaria}
                  width={400}
                  height={300}
                />
              </div>
              <h3>
                educación secundaria
              </h3>
            </Link>
          </div>
          <Link href="/docentes/evaluaciones/secundaria" className={`${styles.levelCard} ${styles.secundaria6} ${getRandomPosition()}`}>
            <div className={styles.overlay}></div>
            <div className={styles.levelNumber}>
              <p>6</p>
            </div>
            <div className={styles.levelContent}>
              <p className={styles.textTableEstandares6}>
                Estándar de aprendizaje
              </p>
            </div>
            {/* <div className={styles.levelFooter}>
              <p>nivel 6</p>
            </div> */}
          </Link>
          <Link href="/docentes/evaluaciones/secundaria" className={`${styles.levelCard} ${styles.secundaria7} ${getRandomPosition()}`}>
            <div className={styles.overlay}></div>
            <div className={styles.levelNumber}>
              <p>7</p>
            </div>
            <div className={styles.levelContent}>
              <p className={styles.textWhite}>Estándar de aprendizaje</p>
            </div>
            {/* <div className={styles.levelFooter}>
              <p>nivel 7</p>
            </div> */}
          </Link>
        </div>

        <div className={styles.primariaContainer}>
          <Link href="/docentes/evaluaciones/tercerNivel" className={styles.levelTitle}>
            <div className={styles.levelImage}>
              <Image
                alt="logo formativa"
                src={primaria}
                width={300}
                height={200}
              />
            </div>
            <h3>
              educación primaria
            </h3>
          </Link>
          <Link href="/docentes/evaluaciones/tercerNivel" className={`${styles.levelCard} ${styles.primaria3} ${getRandomPosition()}`}>
            <div className={styles.overlay}></div>
            <div className={styles.levelNumber}>
              <p>3</p>
            </div>
            <div className={styles.levelContent}>
              <p className={styles.textTableEstandares6}>
                Estándar de aprendizaje
              </p>
            </div>
            {/* <div className={styles.levelFooter}>
              <p>nivel 3</p>
            </div> */}
          </Link>
          <Link href="/docentes/evaluaciones/tercerNivel" className={`${styles.levelCard} ${styles.primaria4} ${getRandomPosition()}`}>
            <div className={styles.overlay}></div>
            <div className={styles.levelNumber}>
              <p>4</p>
            </div>
            <div className={styles.levelContent}>
              <p className={styles.textWhite}>Estándar de aprendizaje</p>
            </div>
           {/*  <div className={styles.levelFooter}>
              <p>nivel 4</p>
            </div> */}
          </Link>
          <Link href="/docentes/evaluaciones/tercerNivel" className={`${styles.levelCard} ${styles.primaria5} ${getRandomPosition()}`}>
            <div className={styles.overlay}></div>
            <div className={styles.levelNumber}>
              <p>5</p>
            </div>
            <div className={styles.levelContent}>
              <p className={styles.textTableEstandares6}>
                Estándar de aprendizaje
              </p>
            </div>
            {/* <div className={styles.levelFooter}>
              <p>nivel 5</p>
            </div> */}
          </Link>
        </div>

        <div className={styles.inicialContainer}>
          <div className={styles.levelTitle}>
            <div className={styles.levelImage}>
              <Image
                alt="logo formativa"
                src={inicial}
                width={300}
                height={200}
              />
            </div>
            <h3>
              educación inicial
            </h3>
          </div>
          <Link href="" className={`${styles.levelCard} ${styles.inicial1} ${getRandomPosition()}`}>
            <div className={styles.overlay}></div>
            <div className={styles.levelNumber}>
              <p>1</p>
            </div>
            <div className={styles.levelContent}>
              <p className={styles.textWhite}>Estándar de aprendizaje</p>
            </div>
            {/* <div className={styles.levelFooter}>
              <p>nivel 1</p>
            </div> */}
          </Link>
          <Link href="" className={`${styles.levelCard} ${styles.inicial2} ${getRandomPosition()}`}>
            <div className={styles.overlay}></div>
            <div className={styles.levelNumber}>
              <p>2</p>
            </div>
            <div className={styles.levelContent}>
              <p className={styles.textTableEstandares6}>
                Estándar de aprendizaje
              </p>
            </div>
            {/* <div className={styles.levelFooter}>
              <p>nivel 2</p>
            </div> */}
          </Link>
        </div>
      </div>
    </div>

    // <>
    //   {
    //     loaderPages ?
    //       <div className='grid grid-rows-loader'>
    //         <div className='flex justify-center items-center'>
    //           <RiLoader4Line className="animate-spin text-3xl text-colorTercero " />
    //           <span className='text-colorTercero animate-pulse'>...cargando</span>
    //         </div>
    //       </div>

    //       :
    //       <div className='grid justify-center items-center relative mt-3'>
    //         <div className='w-[1024px] bg-white  p-20'>
    //           <h1 className='text-colorSexto font-semibold text-3xl font-mono mb-10 capitalize'>evaluaciones</h1>
    //           <table className='w-full  bg-white  rounded-md shadow-md'>
    //             <thead className='bg-colorSegundo border-b-2 border-blue-300 '>
    //               <tr className='text-white capitalize font-nunito '>
    //                 <th className="uppercase  pl-1 md:pl-2 px-1 text-center">#</th>
    //                 <th className="py-3 md:p-2  text-left">nombre de evaluación</th>
    //               </tr>
    //             </thead>
    //             <tbody className="divide-y divide-gray-100">
    //               {
    //                 evaluaciones.length > 0 ?
    //                   evaluaciones?.map((eva, index) => {
    //                     return (
    //                       <tr key={index} className='h-[60px] hover:bg-blue-100 duration-300 cursor-pointer'>
    //                         <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-center'>
    //                           <Link href={`/docentes/evaluaciones/evaluacion/${eva.id}`}>
    //                             {index + 1}
    //                           </Link>
    //                         </td>
    //                         <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-left'>
    //                           <Link href={`/docentes/evaluaciones/evaluacion/${eva.id}`}>
    //                             {eva.nombre}
    //                           </Link>
    //                         </td>
    //                       </tr>
    //                     )
    //                   })
    //                   :
    //                   null
    //               }
    //             </tbody>
    //           </table>
    //         </div>
    //       </div>

    //   }
    // </>
  );
};

export default Evaluaciones;
Evaluaciones.Auth = PrivateRouteDocentes;
