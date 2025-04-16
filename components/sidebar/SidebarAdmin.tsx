import React from 'react'
import SidebarInfoUser from './SidebarInfoUser';
import Link from 'next/link';
import useUsuario from '@/features/hooks/useUsuario';
import SidebarRegional from './SidebarRegional';
import { useRolUsers } from '@/features/hooks/useRolUsers';
import SidebarRegion from './SidebarRegion';
import BackgroundSidebar from './background-sidebar';
import styles from './sideBarList.module.css'
import { MdAccountBalance, MdAccountCircle } from 'react-icons/md';
import { FaUserGraduate, FaUserNinja, FaUserTie } from 'react-icons/fa';
import { LuListTodo } from "react-icons/lu";
interface Props {
  showSidebar: boolean
}
const SidebarAdmin = ({ showSidebar }: Props) => {
  const { logout } = useUsuario()
  const { showSidebarValue } = useRolUsers()
  // const { showSidebar } = useGlobalContext()
  return (

    <div className={`z-[2000] grid-rows-gridRows p-2 justify-evenly grid fixed duration-300 drop-shadow-xl h-full w-[250px] bg-graduado-blue-2 ${showSidebar ? "left-[0px]" : "-left-[300px]"}`}>
      {/* <div onClick={() => showSidebarValue(showSidebar)} className='capitalize p-2 w-[30px] h-[30px] bg-red-400 justify-center items-center flex rounded-full text-white l-10 cursor-pointer relative'>x</div> */}
      <BackgroundSidebar />
      <div onClick={() => showSidebarValue(showSidebar)} className='absolute capitalize p-2 w-[30px] h-[30px] bg-colorBrand1 justify-center items-center flex rounded-full text-white l-10 cursor-pointer left-[235px] top-[30px] shadow-md'>x</div>
      <div>
        <SidebarRegional />
        <div className="relative z-[100] flex  items-center ml-[17px] my-[10px]">

          <MdAccountCircle className={styles.icons} />
          <Link className={styles.ancla} href="/mi-cuenta" aria-haspopup="true">
            Mi cuenta
            {/* <label>Estudiantes</label> */}
          </Link>
        </div>
        <div className={styles.containerLista}></div>
        <div className={styles.test} role="navigation">
          <ul className={styles.containerMenu} >
            <li className={styles.dropdown}>
              <div className={styles.containerIcon}>

                <LuListTodo className={styles.icons} />
                <Link className={styles.ancla} href="#" aria-haspopup="true">
                  Especialistas
                  {/* <label>Estudiantes</label> */}
                </Link>
              </div>
              <ul className={styles.dropdownContent} aria-label="submenu">
                <li className={styles.containerAncla}><Link
                  href="/admin/agregar-especialista"
                  className={styles.anclaje}
                  id="ancla">crear usuario</Link></li>
              </ul>
            </li>
            <li className={styles.dropdown}>
              <div className={styles.containerIcon}>

                <MdAccountBalance className={styles.icons} />
                <Link className={styles.ancla} href="#" aria-haspopup="true">
                  Directores
                  {/* <label>Estudiantes</label> */}
                </Link>
              </div>
              <ul className={styles.dropdownContent} aria-label="submenu">
                <li className={styles.containerAncla}><Link
                  href="/admin/agregar-directores"
                  className={styles.anclaje}
                  id="ancla">crear usuario</Link></li>
                
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
                  href="/admin/evaluaciones-docentes"
                  className={styles.anclaje}
                  id="ancla">Evaluaciones</Link></li>
              </ul>
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
                  href="/admin/evaluaciones"
                  className={styles.anclaje}
                  id="ancla">Evaluaciones</Link></li>
                <li className={styles.containerAncla}><Link
                  href="/admin/agregar-evaluaciones"
                  id="ancla"
                  className={styles.anclaje} >Agregar evaluacion</Link></li>
              </ul>
            </li>
          </ul>
        </div>
        {/* <ul className='capitalize font-montserrat border-b-[1px] border-slate-200 pb-5 mb-5'>
          <li onClick={() => showSidebarValue(showSidebar)} className='rounded-md text-white pl-2 text-sm flex items-center gap-x-4 cursor-pointer   mt-2 capitalize   hover:border-[1px] hover:border-violet-300 hover:text-violet-300 duration-300 mx-2 whitespace-nowrap drop-shadow-lg'>
            <Link href="/mi-cuenta" className='p-3'>
              Mi cuenta
            </Link>
          </li>
          <li onClick={() => showSidebarValue(showSidebar)} className='rounded-md text-white pl-2 text-sm flex items-center gap-x-4 cursor-pointer   mt-2 capitalize   hover:border-[1px] hover:border-green-300 hover:text-green-300 duration-300 mx-2 whitespace-nowrap drop-shadow-lg'>
            <Link href="/admin/evaluaciones" className='p-3'>
              Evaluaciones
            </Link>
          </li>
          <li onClick={() => showSidebarValue(showSidebar)} className='rounded-md text-white pl-2 text-sm flex items-center gap-x-4 cursor-pointer   mt-2 capitalize   hover:border-[1px] hover:border-amber-300 hover:text-amber-300 duration-300 mx-2 whitespace-nowrap drop-shadow-lg'>
            <Link href="/admin/agregar-especialista" className='p-3'>
              Agregar especilista
            </Link>
          </li>
          <li onClick={() => showSidebarValue(showSidebar)} className='rounded-md text-white pl-2 text-sm flex items-center gap-x-4 cursor-pointer   mt-2 capitalize   hover:border-[1px] hover:border-amber-300 hover:text-amber-300 duration-300 mx-2 whitespace-nowrap drop-shadow-lg'>
            <Link href="/admin/agregar-directores" className='p-3'>
              Agregar director
            </Link>
          </li>
          <li onClick={() => showSidebarValue(showSidebar)} className='rounded-md text-white pl-2 text-sm flex items-center gap-x-4 cursor-pointer   mt-2 capitalize   hover:border-[1px] hover:border-amber-300 hover:text-amber-300 duration-300 mx-2 whitespace-nowrap drop-shadow-lg'>
            <Link href="/admin/agregar-evaluaciones" className='p-3'>
              Agregar evaluación
            </Link>
          </li>
        </ul> */}
        <SidebarInfoUser showSidebar={showSidebar} />
      </div>
      <div onClick={logout} className="relative z-[10] ml-2 border rounded-sm border-white  duration-300 hover:border-red-300 p-3 h-[50px] font-montserrat hover:text-red-300 text-white w-[200px] cursor-pointer ">
        <p>cerrar sesión</p>
      </div>
    </div>
  )
}

export default SidebarAdmin