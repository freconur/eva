import React from 'react'
import SidebarInfoUser from './SidebarInfoUser';
import Link from 'next/link';
import useUsuario from '@/features/hooks/useUsuario';
import { useRolUsers } from '@/features/hooks/useRolUsers';
import SidebarRegional from './SidebarRegional';
import BackgroundSidebar from './background-sidebar';
import styles from './sideBarList.module.css'
import { FaUserGraduate, FaUserTie } from 'react-icons/fa';
import { MdAccountCircle } from 'react-icons/md';
interface Props {
  showSidebar: boolean
}
const SidebarDirectores = ({ showSidebar }: Props) => {
  const { logout } = useUsuario()
  const { showSidebarValue } = useRolUsers()
  // const { showSidebar } = useGlobalContext()
  return (
    <div className={`z-[2000] grid-rows-gridRows p-2 justify-evenly grid fixed duration-300 drop-shadow-xl h-full w-[250px] bg-graduado-blue-2 ${showSidebar ? "left-[0px]" : "-left-[300px]"}`}>
      <BackgroundSidebar />
      <div onClick={() => showSidebarValue(showSidebar)} className='absolute capitalize p-2 w-[30px] h-[30px] bg-red-400 justify-center items-center flex rounded-full text-white l-10 cursor-pointer left-[235px] top-[30px] shadow-md'>x</div>
      {/* <div onClick={() => showSidebarValue(showSidebar)} className='capitalize p-2 w-[30px] h-[30px] bg-red-400 justify-center items-center flex rounded-full text-white l-10 cursor-pointer relative'>x</div> */}
      <div>
        <SidebarRegional />
        {/* <div className={styles.containerIcon}> */}
        <div className="relative z-[100] flex  items-center ml-[17px] my-[10px]">

                  <MdAccountCircle className={styles.icons} />
                  <Link className={styles.ancla} href="/mi-cuenta" aria-haspopup="true">
                    Mi cuenta
                    {/* <label>Estudiantes</label> */}
                  </Link>
                </div>
        <div id='menuDesplegable' className={styles.containerLista}>
          <div className={styles.test} role="navigation">
            <ul >
              <li className={styles.dropdown}>
                
              </li>
              <li className={styles.dropdown}>
                <div className={styles.containerIcon}>

                  <FaUserGraduate className={styles.icons} />
                  <Link className={styles.ancla} href="#" aria-haspopup="true">
                    Estudiantes
                    {/* <label>Estudiantes</label> */}
                  </Link>
                </div>
                <ul className={styles.dropdownContent} aria-label="submenu">
                  <li className={styles.containerAncla}><Link
                    href="/directores/evaluaciones"
                    className={styles.anclaje}
                    id="ancla">Seguimiento de aprendizaje</Link></li>
                </ul>
              </li>
              <li className={styles.dropdown}>
                <div className={styles.containerIcon}>

                  <FaUserTie className={styles.icons} />
                  <Link className={styles.ancla} href="#" aria-haspopup="true">
                    Docentes
                    {/* <label>Estudiantes</label> */}
                  </Link>

                </div>
                <ul className={styles.dropdownContent} aria-label="submenu">
                  <li className={styles.containerAncla}><Link
                    href="/directores/evaluaciones-docentes"
                    className={styles.anclaje}
                    id="ancla">Mediacion didactica</Link></li>
                  <li className={styles.containerAncla}><Link
                    href="/directores/agregar-profesores"
                    id="ancla"
                    className={styles.anclaje} >Crear usuario</Link></li>
                    <li className={styles.containerAncla}><Link
                    href="/directores/cobertura-curricular"
                    id="ancla"
                    className={styles.anclaje} >Cobertura curricular</Link></li>
                </ul>
              </li>
            </ul>
          </div>
          <SidebarInfoUser showSidebar={showSidebar} />
        </div>

        {/* <ul className='capitalize font-montserrat border-b-[1px] border-slate-200 pb-5 mb-5'>
          <li className='rounded-md text-white pl-2 text-sm flex items-center gap-x-4 cursor-pointer   mt-2 capitalize   hover:border-[1px] hover:border-violet-300 hover:text-violet-300 duration-300 mx-2 whitespace-nowrap drop-shadow-lg'>
            <Link href="/mi-cuenta" className='p-3'>
              Mi cuenta
            </Link>
          </li>
          <li className='rounded-md text-white pl-2 text-sm flex items-center gap-x-4 cursor-pointer   mt-2 capitalize   hover:border-[1px] hover:border-green-300 hover:text-green-300 duration-300 mx-2 whitespace-nowrap drop-shadow-lg'>
            <Link href="/directores/evaluaciones" className='p-3'>
              Evaluaciones
            </Link>
          </li>
         
          <li className='rounded-md text-white pl-2 text-sm flex items-center gap-x-4 cursor-pointer   mt-2 capitalize   hover:border-[1px] hover:border-amber-300 hover:text-amber-300 duration-300 mx-2 whitespace-nowrap drop-shadow-lg'>
            <Link href="/directores/agregar-profesores" className='p-3'>
              Agregar Profesores
            </Link>
          </li>
        </ul> */}

      </div>

      <div onClick={logout} className="relative z-[20] ml-2 border rounded-sm border-white  duration-300 hover:border-red-300 p-3 h-[50px] font-montserrat hover:text-red-300 text-white w-[200px] cursor-pointer">
        cerrar sesión
      </div>
    </div>
  )
}

export default SidebarDirectores