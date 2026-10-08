import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores'
import { useGlobalContext, useGlobalContextDispatch } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { AppAction } from '@/features/actions/appAction'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { getAllMonths, getMonthName } from '@/fuctions/dates'
import { useRouter } from 'next/router'
import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'
import { RiLoader4Line, RiFilter3Line, RiRestartLine } from 'react-icons/ri'
import { MdAnalytics } from 'react-icons/md'
import { getNivelGrado } from '@/features/hooks/useEvaluacionesFilters'
import SegmentedFilterBar from '@/components/common/SegmentedFilterBar'

const Evaluaciones = () => {
  const router = useRouter()
  const { getEvaluaciones, getEvaluacionesOnce } = useAgregarEvaluaciones()
  const dispatch = useGlobalContextDispatch()
  const db = getFirestore()
  const { evaluaciones, currentUserData, loaderPages, grados } = useGlobalContext()
  const currentYear = new Date().getFullYear()

  // Estados para filtros
  const [selectedGrado, setSelectedGrado] = useState<string>('1')
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedEstado, setSelectedEstado] = useState<string>('activo')
  const [isUrlInitialized, setIsUrlInitialized] = useState<boolean>(false)



  useEffect(() => {
    const checkGlobalSentinelAndLoadList = async () => {
      try {
        const sentinelRef = doc(db, 'options', 'evaluaciones_sentinel');
        const sentinelSnap = await getDoc(sentinelRef);

        const latestSentinel = String(sentinelSnap.data()?.lastUpdate?.seconds || sentinelSnap.data()?.lastUpdate || "");

        const cachedList = localStorage.getItem('evaluaciones_list_cache');
        const cachedSentinel = localStorage.getItem('evaluaciones_list_sentinel');

        if (cachedList && cachedSentinel === latestSentinel) {
          dispatch({ type: AppAction.EVALUACIONES, payload: JSON.parse(cachedList) });
        } else {
          const freshList = await getEvaluacionesOnce();
          if (freshList && freshList.length > 0) {
            localStorage.setItem('evaluaciones_list_cache', JSON.stringify(freshList));
            localStorage.setItem('evaluaciones_list_sentinel', latestSentinel);
          }
        }
      } catch (error) {
        console.error('Error al cargar evaluaciones con centinela:', error);
        getEvaluaciones();
      }
    };

    checkGlobalSentinelAndLoadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Evaluaciones accesibles para directores: solo activas o cerradas (active === true), excluyendo ocultas (active === false),
  // y que pertenezcan al nivel de la institución educativa del director.
  const evaluacionesVisiblesDirector = useMemo(() => {
    const nivelDeInstitucion = currentUserData?.nivelDeInstitucion;
    if (!Array.isArray(nivelDeInstitucion) || nivelDeInstitucion.length === 0) return [];

    return (
      evaluaciones?.filter((eva) => {
        // Estado Oculto / Inactivo: no se muestra para el director
        if (!eva.active) return false;

        const nivelEva = Array.isArray(eva.nivel) ? eva.nivel[0] : eva.nivel;
        // Filtro por nivel de institución (permisos)
        return nivelDeInstitucion.includes(Number(nivelEva));
      }) || []
    );
  }, [evaluaciones, currentUserData?.nivelDeInstitucion]);

  // Helper para obtener el mes más reciente disponible para un año dado entre las evaluaciones visibles
  const getLatestMonthForYear = (year: number) => {
    const months = evaluacionesVisiblesDirector
      .filter(
        (eva) =>
          Number(eva.añoDelExamen) === year &&
          eva.mesDelExamen !== undefined &&
          eva.mesDelExamen !== null &&
          eva.mesDelExamen !== ''
      )
      .map((eva) => Number(eva.mesDelExamen));

    if (months.length > 0) {
      return String(Math.max(...months));
    }
    return 'all';
  };

  // 1. Leer los query parameters de la URL al cargar la página (URL -> State)
  useEffect(() => {
    if (!router.isReady || loaderPages || evaluaciones.length === 0 || isUrlInitialized) return;

    const { year, month, grade, status } = router.query;

    const initYear = year ? Number(year) : currentYear;
    setSelectedYear(initYear);

    // Si la URL ya trae un mes específico se respeta; sino, siempre inicia con el mes más reciente de las evaluaciones
    if (month) {
      setSelectedMonth(String(month));
    } else {
      const latestMonth = getLatestMonthForYear(initYear);
      setSelectedMonth(latestMonth);
    }

    if (grade) {
      setSelectedGrado(String(grade));
    } else {
      setSelectedGrado('1');
    }

    if (status && (status === 'activo' || status === 'cerrado' || status === 'all')) {
      setSelectedEstado(String(status));
    } else {
      setSelectedEstado('activo');
    }

    setIsUrlInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, loaderPages, evaluaciones, evaluacionesVisiblesDirector, isUrlInitialized]);

  // 2. Sincronizar cambios de filtros hacia la URL (State -> URL)
  useEffect(() => {
    if (!isUrlInitialized) return;

    const query: Record<string, string> = {};

    if (selectedYear) query.year = String(selectedYear);
    if (selectedMonth) query.month = selectedMonth;
    if (selectedGrado) query.grade = selectedGrado;
    if (selectedEstado) query.status = selectedEstado;

    router.replace(
      {
        pathname: router.pathname,
        query,
      },
      undefined,
      { shallow: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth, selectedGrado, selectedEstado, isUrlInitialized]);

  // Extraer los años disponibles dinámicamente de las evaluaciones visibles para el director
  const yearsAvailable = useMemo(() => {
    const yearsSet = new Set<number>()
    yearsSet.add(currentYear) // Siempre tener al menos el año actual
    evaluacionesVisiblesDirector.forEach(eva => {
      if (eva.añoDelExamen) {
        yearsSet.add(Number(eva.añoDelExamen))
      }
    })
    return Array.from(yearsSet).sort((a, b) => b - a) // De más reciente a más antiguo
  }, [evaluacionesVisiblesDirector, currentYear])

  // Extraer los meses disponibles dinámicamente de las evaluaciones visibles para el año seleccionado
  const monthsAvailable = useMemo(() => {
    const monthsSet = new Set<number>()
    evaluacionesVisiblesDirector.forEach(eva => {
      if (
        Number(eva.añoDelExamen) === selectedYear &&
        eva.mesDelExamen !== undefined &&
        eva.mesDelExamen !== null &&
        eva.mesDelExamen !== ''
      ) {
        monthsSet.add(Number(eva.mesDelExamen))
      }
    })
    return Array.from(monthsSet).sort((a, b) => a - b).map(m => ({
      id: m,
      name: getMonthName(m)
    }))
  }, [evaluacionesVisiblesDirector, selectedYear])

  // Sincronizar o ajustar el mes al cambiar de año si deja de ser válido
  useEffect(() => {
    if (selectedMonth === 'all') return

    // Si el mes seleccionado ya no es válido en la nueva lista de meses de este año, revertimos a 'all'
    const isSelectedMonthValid = monthsAvailable.some(m => String(m.id) === selectedMonth)
    if (!isSelectedMonthValid) {
      setSelectedMonth('all')
    }
  }, [monthsAvailable, selectedMonth])

  // 1. Base filtrada por año y mes (ya filtrada por evaluaciones activas/cerradas y permisos)
  const evaluacionesBase = useMemo(() => {
    return evaluacionesVisiblesDirector.filter(eva => {
      const matchesYear = Number(eva.añoDelExamen) === selectedYear;
      if (!matchesYear) return false;

      // Filtro por Mes
      if (selectedMonth !== 'all') {
        const matchesMonth = String(eva.mesDelExamen) === selectedMonth;
        if (!matchesMonth) return false;
      }

      return true;
    })
  }, [evaluacionesVisiblesDirector, selectedYear, selectedMonth])

  // 2. Extraer grados únicos disponibles en las evaluaciones actuales
  const gradosDisponibles = useMemo(() => {
    const gradesSet = new Set<number>();
    evaluacionesBase.forEach(eva => {
      if (eva.grado !== undefined) gradesSet.add(Number(eva.grado));
    });

    return Array.from(gradesSet).map(g => {
      // Intentar buscar el nombre en el array de grados del contexto si ya existe,
      // de lo contrario usar un formato genérico
      const gradoObj = grados?.find(gr => Number(gr.grado) === g);
      return {
        grado: g,
        nombre: gradoObj?.nombre || `${g}° Grado`
      }
    }).sort((a, b) => a.grado - b.grado);
  }, [evaluacionesBase, grados])

  // 3. Resultado final filtrado por el select de grado y estado
  const evaluacionesFiltradas = useMemo(() => {
    return evaluacionesBase.filter(eva => {
      // Filtro por Grado seleccionado
      if (selectedGrado !== 'all' && Number(eva.grado) !== Number(selectedGrado)) return false;

      // Filtro por Estado (Activo / Cerrado)
      if (selectedEstado === 'activo' && eva.cerrada) return false;
      if (selectedEstado === 'cerrado' && !eva.cerrada) return false;

      return true;
    })
  }, [evaluacionesBase, selectedGrado, selectedEstado])

  const handleResetFilters = () => {
    setSelectedYear(currentYear)
    const latestMonth = getLatestMonthForYear(currentYear)
    setSelectedMonth(latestMonth)
    setSelectedGrado('1')
    setSelectedEstado('activo')
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Evaluaciones
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Gestiona y supervisa las evaluaciones de tu institución educativa.
            </p>
          </div>
          <span className="self-start sm:self-auto px-3 py-1 bg-colorSegundo/10 text-colorSegundo text-xs font-bold rounded-full border border-colorSegundo/20">
            Año escolar {selectedYear}
          </span>
        </div>

        {/* Toolbar de Filtros Reutilizable y Responsive */}
        <SegmentedFilterBar
          title="Filtrar por"
          filters={[
            {
              id: 'year',
              label: 'Año',
              value: selectedYear,
              onChange: (year) => {
                const newYear = Number(year);
                setSelectedYear(newYear);
                const latestMonth = getLatestMonthForYear(newYear);
                setSelectedMonth(latestMonth);
              },
              options: yearsAvailable.map((year) => ({
                value: year,
                label: String(year),
              })),
              minWidth: 'md:min-w-[120px]',
            },
            {
              id: 'month',
              label: 'Mes',
              value: selectedMonth,
              onChange: (month) => setSelectedMonth(String(month)),
              options: [
                { value: 'all', label: 'Todos los Meses' },
                ...monthsAvailable.map((m) => ({
                  value: String(m.id),
                  label: m.name,
                })),
              ],
              minWidth: 'md:min-w-[170px]',
            },
            {
              id: 'grade',
              label: 'Grado',
              value: selectedGrado,
              onChange: (grade) => setSelectedGrado(String(grade)),
              options: [
                { value: 'all', label: 'Todos los Grados' },
                ...gradosDisponibles.map((g) => ({
                  value: String(g.grado),
                  label: g.nombre,
                })),
              ],
              minWidth: 'md:min-w-[170px]',
            },
            {
              id: 'estado',
              label: 'Estado',
              value: selectedEstado,
              onChange: (estado) => setSelectedEstado(String(estado)),
              options: [
                { value: 'all', label: 'Todos los Estados' },
                { value: 'activo', label: 'Activo' },
                { value: 'cerrado', label: 'Cerrado' },
              ],
              minWidth: 'md:min-w-[160px]',
            },
          ]}
          onReset={handleResetFilters}
          showReset={true}
        />

        {/* Tabla de Evaluaciones */}
        {loaderPages ? (
          <div className="flex flex-col items-center justify-center py-28 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
            <RiLoader4Line className="animate-spin text-5xl text-colorSegundo mb-4" />
            <span className="text-slate-500 text-sm font-semibold tracking-wide animate-pulse">
              Cargando evaluaciones...
            </span>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden transition-all duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-200/90">
                    <th className="py-4 px-6 text-xs font-bold text-slate-800 uppercase tracking-wider text-left">
                      Nombre de Evaluación
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-800 uppercase tracking-wider text-left">
                      Grado / Nivel
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-800 uppercase tracking-wider text-left">
                      Mes y Año
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-800 uppercase tracking-wider text-center">
                      Estado
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-800 uppercase tracking-wider text-right">
                      Reporte
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evaluacionesFiltradas.length > 0 ? (
                    evaluacionesFiltradas.map((eva, index) => (
                      <tr
                        key={eva.id || index}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        {/* Nombre de Evaluación */}
                        <td className="py-4 px-6">
                          <Link
                            href={`/directores/evaluaciones/evaluacion/${eva.id}`}
                            className="inline-flex items-center gap-2 text-slate-800 font-semibold hover:text-colorSegundo transition-colors text-sm group"
                          >
                            <span>{eva.nombre}</span>
                            <span className="text-slate-400 group-hover:text-colorSegundo group-hover:translate-x-1 transition-all text-xs">
                              →
                            </span>
                          </Link>
                        </td>

                        {/* Grado / Nivel */}
                        <td className="py-4 px-6 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-800">
                              {grados?.find((g) => Number(g.grado) === Number(eva.grado))?.nombre || `${eva.grado}° Grado`}
                            </span>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                              {getNivelGrado(Number(eva.grado || 0))}
                            </span>
                          </div>
                        </td>

                        {/* Mes y Año */}
                        <td className="py-4 px-6 text-left">
                          <span className="text-sm text-slate-600 font-normal">
                            {eva.mesDelExamen !== undefined && eva.mesDelExamen !== null && eva.mesDelExamen !== ''
                              ? `${getMonthName(Number(eva.mesDelExamen))} ${eva.añoDelExamen || currentYear}`
                              : (eva.añoDelExamen || currentYear)}
                          </span>
                        </td>

                        {/* Estado con Badge idéntico a la imagen de referencia */}
                        <td className="py-4 px-6 text-center">
                          {eva.cerrada ? (
                            <span className="inline-flex items-center justify-center min-w-[95px] px-3 py-1 bg-purple-100/70 text-purple-700 text-xs font-bold rounded-lg tracking-wide">
                              Cerrado
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center min-w-[95px] px-3 py-1 bg-teal-100/70 text-teal-700 text-xs font-bold rounded-lg tracking-wide">
                              Activo
                            </span>
                          )}
                        </td>

                        {/* Reporte */}
                        <td className="py-4 px-6 text-right">
                          <Link
                            href={`/directores/evaluaciones/evaluacion/reporte?id=${currentUserData?.dni}&idEvaluacion=${eva.id}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 rounded-xl transition-all duration-150 font-semibold text-xs shadow-xs active:scale-95 hover:border-slate-300"
                            title="Ver reporte y resultados"
                          >
                            <MdAnalytics size={16} className="text-colorSegundo" />
                            <span>Ver Reporte</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <div className="flex flex-col items-center max-w-sm mx-auto space-y-4">
                          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
                            <RiFilter3Line size={26} />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-slate-800 font-bold text-base">
                              No hay evaluaciones disponibles
                            </h3>
                            <p className="text-slate-500 text-xs">
                              Prueba ajustando o restableciendo los filtros de búsqueda.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            <RiRestartLine size={14} />
                            <span>Restablecer Filtros</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer con conteo de resultados */}
            {evaluacionesFiltradas.length > 0 && (
              <div className="px-6 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>
                  Mostrando <strong className="text-slate-800">{evaluacionesFiltradas.length}</strong> {evaluacionesFiltradas.length === 1 ? 'evaluación' : 'evaluaciones'}
                </span>
                <span>Año escolar {selectedYear}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Evaluaciones
Evaluaciones.Auth = PrivateRouteDirectores