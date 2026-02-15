import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import Link from 'next/link'
import React, { useEffect, useMemo } from 'react'
import { RiLoader4Line } from 'react-icons/ri'
import { MdVisibility } from 'react-icons/md'

const Evaluaciones = () => {
  const { getEvaluaciones } = useAgregarEvaluaciones()
  const { evaluaciones, currentUserData, loaderPages } = useGlobalContext()
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    getEvaluaciones()
  }, [])

  // Calcular estadísticas de evaluaciones
  const evaluacionesFiltradas = useMemo(() => {
    return evaluaciones
      ?.filter(eva => {
        const isActive = eva.active === true;
        const isCurrentYear = Number(eva.añoDelExamen) === currentYear;

        if (!isActive || !isCurrentYear) return false;

        // Si el usuario no tiene nivelDeInstitucion o está vacío, mostrar todas las evaluaciones EXCEPTO las que tienen nivel 2
        if (!currentUserData?.nivelDeInstitucion ||
          (Array.isArray(currentUserData?.nivelDeInstitucion) && currentUserData.nivelDeInstitucion.length === 0)) {
          const nivelEva = Array.isArray(eva.nivel) ? eva.nivel[0] : eva.nivel;
          return nivelEva !== 2;
        }

        // Si el usuario tiene nivelDeInstitucion que incluye 2, solo mostrar evaluaciones nivel 2
        const nivelDeInstitucion = currentUserData?.nivelDeInstitucion;
        if (Array.isArray(nivelDeInstitucion) && nivelDeInstitucion.includes(2)) {
          const nivelEva = Array.isArray(eva.nivel) ? eva.nivel[0] : eva.nivel;
          return nivelEva === 2;
        }

        // Para otros casos, mostrar todas las evaluaciones
        return true;
      }) || []
  }, [evaluaciones, currentUserData, currentYear])

  return (
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
              Gestiona y supervisa las evaluaciones de tu institución educativa.
            </p>
          </div>
        </div>

        {loaderPages ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <RiLoader4Line className="animate-spin text-6xl text-colorSegundo mb-6" />
            <span className="text-slate-500 text-lg font-semibold tracking-wide animate-pulse">Cargando evaluaciones...</span>
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
                  {evaluacionesFiltradas.length > 0 ? (
                    evaluacionesFiltradas.map((eva, index) => (
                      <tr
                        key={eva.id || index}
                        className="group hover:bg-slate-50/50 transition-all duration-300"
                      >
                        <td className="py-6 px-8 text-sm text-slate-400 font-semibold text-center group-hover:text-slate-600">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="py-6 px-4">
                          <Link
                            href={`/directores/evaluaciones/evaluacion/${eva.id}`}
                            className="inline-flex items-center gap-3 text-slate-700 font-bold hover:text-colorSegundo transition-all duration-300"
                          >
                            <span className="text-base tracking-tight">{eva.nombre}</span>
                            <div className="w-6 h-6 rounded-full bg-colorSegundo/5 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                              <span className="text-colorSegundo text-xs">→</span>
                            </div>
                          </Link>
                        </td>
                        <td className="py-6 px-8 text-right">
                          <Link
                            href={`/directores/evaluaciones/evaluacion/${eva.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 hover:bg-colorSegundo hover:text-white rounded-xl transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md active:scale-95"
                          >
                            <MdVisibility size={18} />
                            <span>Ver Detalles</span>
                          </Link>
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
                            <p className="text-slate-800 font-bold text-lg">No hay evaluaciones disponibles</p>
                            <p className="text-slate-400 text-sm">Las evaluaciones aparecerán aquí cuando estén disponibles.</p>
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
  )
}

export default Evaluaciones
Evaluaciones.Auth = PrivateRouteDirectores