import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'
import PrivateRouteAdmin from '@/components/layouts/PrivateRoutesAdmin'
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
// import { Evaluaciones } from '@/features/types/types'
import DeleteEvaluacion from '@/modals/deleteEvaluacion'
import UpdateEvaluacion from '@/modals/updateEvaluacion'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { MdDeleteForever, MdEditSquare } from 'react-icons/md'
import { RiLoader4Line, RiSettings3Line } from 'react-icons/ri'

const Evaluaciones = () => {
  const { getEvaluaciones, getEvaluacion } = useAgregarEvaluaciones()
  const { evaluaciones, currentUserData, loaderPages, evaluacion } = useGlobalContext()
  const [showDelete, setShowDelete] = useState<boolean>(false)
  const [inputUpdate, setInputUpdate] = useState<boolean>(false)
  const [idEva, setIdEva] = useState<string>("")
  const [nameEva, setNameEva] = useState<string>("")
  const handleShowInputUpdate = () => { setInputUpdate(!inputUpdate) }
  const handleShowModalDelete = () => { setShowDelete(!showDelete) }
  const [dataEvaluacion, setDataEvaluacion] = useState(evaluacion)
  useEffect(() => {
    getEvaluaciones()
  }, [currentUserData.dni])

  const currentYear = new Date().getFullYear()

  const filteredEvaluaciones = evaluaciones?.filter((eva) => {
    const isActive = eva.active === true;
    const isCorrectLevel = currentUserData.nivelDeInstitucion?.includes(2)
      ? (Array.isArray(eva.nivel) ? eva.nivel.includes(2) : eva.nivel === 2)
      : (Array.isArray(eva.nivel) ? !eva.nivel.includes(2) : eva.nivel !== 2);

    // Filter by current year
    const isCurrentYear = Number(eva.añoDelExamen) === currentYear;

    return isActive && isCorrectLevel && isCurrentYear;
  });

  return (
    <>
      {showDelete && <DeleteEvaluacion handleShowModalDelete={handleShowModalDelete} idEva={idEva} />}
      {inputUpdate && nameEva.length > 0 && <UpdateEvaluacion evaluacion={evaluacion} nameEva={nameEva} handleShowInputUpdate={handleShowInputUpdate} idEva={idEva} />}

      <div className="min-h-screen bg-slate-50/30 p-4 md:p-10">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  Evaluaciones
                </h1>
                <span className="px-3 py-1 bg-colorSegundo/10 text-colorSegundo text-sm font-bold rounded-full border border-colorSegundo/20">
                  {currentYear}
                </span>
              </div>
              <p className="text-slate-500 text-lg font-medium max-w-2xl leading-relaxed">
                Panel central de gestión de evaluaciones vigentes para el presente año académico.
              </p>
            </div>

            <Link
              href="/admin/evaluaciones"
              className="flex items-center gap-2 px-5 py-3 bg-white text-slate-600 font-bold text-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:border-colorSegundo/30 hover:text-colorSegundo hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 group"
            >
              <RiSettings3Line className="text-lg group-hover:rotate-90 transition-transform duration-500" />
              <span>Gestionar</span>
            </Link>
          </div>

          {loaderPages ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
              <RiLoader4Line className="animate-spin text-6xl text-colorSegundo mb-6" />
              <span className="text-slate-500 text-lg font-semibold tracking-wide animate-pulse">Sincronizando registros...</span>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden transition-all duration-300">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="py-6 px-8 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] w-20 text-center">#</th>
                      <th className="py-6 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Descripción de la Evaluación</th>
                      <th className="py-6 px-8 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredEvaluaciones.length > 0 ? (
                      filteredEvaluaciones.map((eva, index) => (
                        <tr
                          key={eva.id || index}
                          className="group hover:bg-slate-50/50 transition-all duration-300"
                        >
                          <td className="py-6 px-8 text-sm text-slate-400 font-semibold text-center group-hover:text-slate-600">
                            {String(index + 1).padStart(2, '0')}
                          </td>
                          <td className="py-6 px-4">
                            <Link
                              href={`/admin/evaluaciones/evaluacion/${eva.id}`}
                              className="inline-flex items-center gap-3 text-slate-700 font-bold hover:text-colorSegundo transition-all duration-300"
                            >
                              <span className="text-base tracking-tight">{eva.nombre}</span>
                              <div className="w-6 h-6 rounded-full bg-colorSegundo/5 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                <span className="text-colorSegundo text-xs">→</span>
                              </div>
                            </Link>
                          </td>
                          <td className="py-6 px-8 text-right">
                            <div className="flex justify-end items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setIdEva(eva.id || "");
                                  setNameEva(eva.nombre || "");
                                  handleShowInputUpdate();
                                }}
                                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 active:scale-90"
                                title="Editar parámetros"
                              >
                                <MdEditSquare size={22} />
                              </button>
                              <div className="w-[1px] h-4 bg-slate-100"></div>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setIdEva(eva.id || "");
                                  handleShowModalDelete();
                                }}
                                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 active:scale-90"
                                title="Eliminar definitivamente"
                              >
                                <MdDeleteForever size={22} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-32 text-center">
                          <div className="flex flex-col items-center max-w-xs mx-auto space-y-5">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                              <RiLoader4Line size={32} />
                            </div>
                            <div className="space-y-1">
                              <p className="text-slate-800 font-bold text-lg">Sin evaluaciones</p>
                              <p className="text-slate-400 text-sm">No se encontraron registros activos para este periodo.</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Evaluaciones
Evaluaciones.Auth = PrivateRouteEspecialista