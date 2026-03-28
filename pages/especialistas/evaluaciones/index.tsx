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
import { RiLoader4Line, RiSettings3Line, RiBarChart2Line, RiArrowRightSLine } from 'react-icons/ri'
import { getGradoTexto, nivelInstitucion } from '@/fuctions/regiones'

const Evaluaciones = () => {
  const { getEvaluaciones, getEvaluacion } = useAgregarEvaluaciones()
  const { evaluaciones, currentUserData, loaderPages, evaluacion } = useGlobalContext()
  const [showDelete, setShowDelete] = useState<boolean>(false)
  const [inputUpdate, setInputUpdate] = useState<boolean>(false)
  const [idEva, setIdEva] = useState<string>("")
  const [nameEva, setNameEva] = useState<string>("")
  const [selectedGrado, setSelectedGrado] = useState<string>("all")
  const handleShowInputUpdate = () => { setInputUpdate(!inputUpdate) }
  const handleShowModalDelete = () => { setShowDelete(!showDelete) }
  const [dataEvaluacion, setDataEvaluacion] = useState(evaluacion)
  useEffect(() => {
    getEvaluaciones()
  }, [currentUserData?.dni])

  const currentYear = new Date().getFullYear()

  const filteredEvaluaciones = evaluaciones?.filter((eva) => {
    const isActive = eva.active === true;
    const nivelDeInstitucion = currentUserData?.nivelDeInstitucion;
    if (!Array.isArray(nivelDeInstitucion) || nivelDeInstitucion.length === 0) return false;

    const nivelEva = Array.isArray(eva.nivel) ? eva.nivel[0] : eva.nivel;
    const isCorrectLevel = nivelDeInstitucion.includes(Number(nivelEva));
    const isCurrentYear = Number(eva.añoDelExamen) === currentYear;

    return isActive && isCorrectLevel && isCurrentYear;
  }) || [];

  const gradeOptions = Array.from(new Set(filteredEvaluaciones.map(eva => {
    const nivelEva = Array.isArray(eva.nivel) ? eva.nivel[0] : eva.nivel;
    return `${eva.grado || ''}-${nivelEva}`;
  }))).filter(option => option.split("-")[0] !== "").map(option => {
    const [grado, nivel] = option.split("-");
    const gradoLabel = getGradoTexto(grado);
    const nivelLabel = nivelInstitucion.find(n => n.id === Number(nivel))?.name || "";

    return {
      value: option,
      label: `${gradoLabel}, nivel ${nivelLabel.toLowerCase()}`
    };
  }).sort((a, b) => Number(a.value.split("-")[0]) - Number(b.value.split("-")[0]));

  const finalEvaluaciones = selectedGrado === "all"
    ? filteredEvaluaciones
    : filteredEvaluaciones.filter(eva => {
      const nivelEva = Array.isArray(eva.nivel) ? eva.nivel[0] : eva.nivel;
      return `${eva.grado || ''}-${nivelEva}` === selectedGrado;
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

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {gradeOptions.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <select
                    value={selectedGrado}
                    onChange={(e) => setSelectedGrado(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-white text-slate-700 font-semibold text-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-colorSegundo/20 focus:border-colorSegundo/30 appearance-none transition-all duration-300"
                  >
                    <option value="all">Todos los grados</option>
                    {gradeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              )}

              <Link
                href="/admin/evaluaciones"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-white text-slate-600 font-bold text-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:border-colorSegundo/30 hover:text-colorSegundo hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 group"
              >
                <RiSettings3Line className="text-lg group-hover:rotate-90 transition-transform duration-500" />
                <span>Gestionar</span>
              </Link>
            </div>
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
                      <th className="py-6 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Grado</th>
                      <th className="py-6 px-8 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Reporte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {finalEvaluaciones.length > 0 ? (
                      finalEvaluaciones.map((eva, index) => (
                        <tr
                          key={eva.id || index}
                          className="group hover:bg-slate-50/50 transition-all duration-300"
                        >
                          <td className="py-6 px-8 text-sm text-slate-400 font-semibold text-center group-hover:text-slate-600">
                            {String(index + 1).padStart(2, '0')}
                          </td>
                          <td className="py-6 px-4">
                            <div
                              className="inline-flex items-center gap-3 text-slate-700 font-bold"
                            >
                              <span className="text-base tracking-tight">{eva.nombre}</span>
                            </div>
                          </td>
                          <td className="py-6 px-4">
                            <span className="text-sm text-slate-600 font-bold bg-slate-100 px-3 py-1 rounded-lg">
                              {getGradoTexto(eva.grado)}
                            </span>
                          </td>
                          <td className="py-6 px-8 text-center">
                            <Link
                              href={`/admin/evaluaciones/evaluacion/reporte?id=${currentUserData?.dni}&idEvaluacion=${eva.id}`}
                              className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-colorSegundo/5 text-colorSegundo font-bold text-sm rounded-xl hover:bg-colorSegundo hover:text-white hover:shadow-lg hover:shadow-colorSegundo/20 active:scale-95 transition-all duration-300 group/btn"
                            >
                              <RiBarChart2Line className="text-lg" />
                              <span>Ver Reporte</span>
                              <RiArrowRightSLine className="text-lg group-hover/btn:translate-x-1 transition-transform duration-300" />
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-32 text-center">
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