import PrivateRouteDocentes from "@/components/layouts/PrivateRoutesDocentes";
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { useAgregarEvaluaciones } from "@/features/hooks/useAgregarEvaluaciones";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect } from "react";
import primaria from "../../../assets/primaria.png";
import secundaria from "../../../assets/secundaria.png";
import inicial from "../../../assets/inicial.png";
import { RiLoader4Line, RiArrowRightLine, RiCheckLine } from "react-icons/ri";
import { FaGraduationCap, FaChalkboardTeacher, FaChild } from "react-icons/fa";
import styles from "./evaluaciones.module.css";
import PermissionGate from "@/components/permissions/PermissionGate";
import { PERMISSIONS } from "@/features/utils/permissions";

// Datos de los niveles educativos
const educationLevels = [
  {
    id: 'secundaria',
    title: 'Educación Secundaria',
    description: 'Niveles 6 y 7 - Estudiantes de 12 a 17 años',
    icon: FaGraduationCap,
    image: secundaria,
    nivel:2,
    levels: [
      { number: 6, title: 'Nivel 6', description: 'Estándares de aprendizaje para estudiantes de 1° y 2° de secundaria' },
      { number: 7, title: 'Nivel 7', description: 'Estándares de aprendizaje para estudiantes de 3°, 4° y 5° de secundaria' }
    ],
    href: '/docentes/evaluaciones/secundaria'
  },
  {
    id: 'primaria',
    title: 'Educación Primaria',
    description: 'Niveles 3, 4 y 5 - Estudiantes de 6 a 11 años',
    icon: FaChalkboardTeacher,
    nivel:1,
    image: primaria,
    levels: [
      { number: 3, title: 'Nivel 3', description: 'Estándares de aprendizaje para estudiantes de 1° y 2° de primaria' },
      { number: 4, title: 'Nivel 4', description: 'Estándares de aprendizaje para estudiantes de 3° y 4° de primaria' },
      { number: 5, title: 'Nivel 5', description: 'Estándares de aprendizaje para estudiantes de 5° y 6° de primaria' }
    ],
    href: '/docentes/evaluaciones/tercerNivel'
  },
  {
    id: 'inicial',
    title: 'Educación Inicial',
    description: 'Niveles 1 y 2 - Niños de 3 a 5 años',
    icon: FaChild,
    nivel:0,
    image: inicial,
    levels: [
      { number: 1, title: 'Nivel 1', description: 'Estándares de aprendizaje para estudiantes de 3 años' },
      { number: 2, title: 'Nivel 2', description: 'Estándares de aprendizaje para estudiantes de 4 y 5 años' }
    ],
    href: '/docentes/evaluaciones/inicial'
  }
];

const Evaluaciones = () => {
  const { getEvaluaciones } = useAgregarEvaluaciones();
  const { evaluaciones, currentUserData, loaderPages } = useGlobalContext();

  useEffect(() => {
    getEvaluaciones();
  }, [currentUserData.dni]);

  console.log("evaluaciones", evaluaciones);

  if (loaderPages) {
    return (
      <div className={styles.container}>
        <div className={styles.loaderContainer}>
          <RiLoader4Line className={styles.spinner} />
          <span className={styles.loaderText}>
            Cargando evaluaciones...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Evaluaciones por Niveles
      </h1>
      
      <div className={styles.gridContainer}>
        {educationLevels
          .filter((level) => {
            // Si currentUserData tiene la propiedad nivelDeInstitucion, filtrar por los niveles que contenga
            if (Array.isArray(currentUserData?.nivelDeInstitucion)) {
              return currentUserData.nivelDeInstitucion.map(Number).includes(level.nivel);
            }
            // Fallback: Si no tiene nivelDeInstitucion pero sí la propiedad nivel, usarla
            if (currentUserData?.nivel !== undefined && currentUserData?.nivel !== null) {
              return level.nivel === Number(currentUserData.nivel);
            }
            // Si no se cumple ninguna de las anteriores, por defecto mostrar todos o un nivel predeterminado
            return true;
          })
          .map((level) => {

const IconComponent = level.icon;
          return (
            <div key={level.id} className={`${styles.educationLevel} ${styles[level.id]}`}>
              <div className={styles.levelHeader}>
                <div className={styles.levelInfo}>
                  <div className={styles.levelIcon}>
                    <IconComponent />
                  </div>
                  <div>
                    <h2 className={styles.levelTitle}>{level.title}</h2>
                    <p className={styles.levelDescription}>{level.description}</p>
                  </div>
                </div>
                <div className={styles.levelImage}>
                  <Image
                    alt={`${level.title} illustration`}
                    src={level.image}
                    width={120}
                    height={80}
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </div>
              
              <div className={styles.levelsGrid}>
                {level.levels.map((subLevel) => {
                  console.log(`Renderizando subnivel: ${subLevel.number} - ${subLevel.title}`);
                  return (
                    <Link 
                      key={subLevel.number} 
                      href={level.href}
                      className={styles.levelCard}
                    >
                      <div className={styles.levelNumber}>
                        {subLevel.number}
                      </div>
                      
                      <div className={styles.cardContent}>
                        <h3 className={styles.cardTitle}>
                          {subLevel.title}
                        </h3>
                        <p className={styles.cardDescription}>
                          {subLevel.description}
                        </p>
                        
                        <div className={styles.cardFooter}>
                          <div className={styles.cardStatus}>
                            <div className={styles.statusDot}></div>
                            <span>Disponible</span>
                          </div>
                          <div className={styles.cardArrow}>
                            <RiArrowRightLine />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Evaluaciones;
Evaluaciones.Auth = PrivateRouteDocentes;