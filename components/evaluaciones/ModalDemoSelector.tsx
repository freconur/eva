import React, { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase/firebase.config'
import {
  RiPresentationLine,
  RiCloseLine,
  RiLoader4Line,
  RiCheckLine,
  RiUserStarLine,
  RiSparklingLine,
} from 'react-icons/ri'
import { MdSchool, MdGroups, MdInfoOutline, MdDoneAll, MdFilterList } from 'react-icons/md'
import { regionTexto } from '@/fuctions/regiones'

export interface ParticipacionEtapa {
  id?: string
  asignada: boolean
  participo: boolean
  totalEstudiantes?: number
}

export interface ParticipacionMatrizInfo {
  edi: ParticipacionEtapa
  ep1: ParticipacionEtapa
  ep2: ParticipacionEtapa
  cumpleCicloCompleto: boolean
  totalParticipadas: number
  totalAsignadas: number
}

export interface DirectorCandidato {
  dniDirector: string
  nombres?: string
  apellidos?: string
  institucion?: string
  totalEstudiantes: number
  region?: number | string
  distrito?: string
  participacionMatriz?: ParticipacionMatrizInfo
}

interface Props {
  showModal: boolean
  handleClose: () => void
  evaluacion: any
  matrizConfigGrados?: Record<string, any>
  onConfirmDemo?: (director: DirectorCandidato) => void
}

const ModalDemoSelector: React.FC<Props> = ({
  showModal,
  handleClose,
  evaluacion,
  matrizConfigGrados,
  onConfirmDemo,
}) => {
  const [loading, setLoading] = useState<boolean>(true)
  const [directores, setDirectores] = useState<DirectorCandidato[]>([])
  const [isFallback, setIsFallback] = useState<boolean>(false)
  const [selectedDirector, setSelectedDirector] = useState<DirectorCandidato | null>(null)
  const [filterCicloCompletoOnly, setFilterCicloCompletoOnly] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!showModal) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showModal, handleClose])

  useEffect(() => {
    if (!showModal || !evaluacion?.id) return

    let isCancelled = false
    setLoading(true)
    setIsFallback(false)
    setDirectores([])
    setSelectedDirector(null)
    setFilterCicloCompletoOnly(false)

    const fetchDirectoresCandidatos = async () => {
      try {
        const currentEvalId = String(evaluacion.id)

        // 1. Obtener la configuración de la matriz de resultados
        let matrixGrados = matrizConfigGrados
        if (!matrixGrados || Object.keys(matrixGrados).length === 0) {
          try {
            const cfgRef = doc(db, 'configuraciones', 'matriz_resultados')
            const cfgSnap = await getDoc(cfgRef)
            if (cfgSnap.exists()) {
              matrixGrados = cfgSnap.data()?.grados || {}
            }
          } catch (e) {
            console.warn('No se pudo cargar configuraciones/matriz_resultados en ModalDemoSelector:', e)
          }
        }

        // Encontrar la asignación del slot longitudinal al que pertenece esta evaluación
        const slotAssignment = Object.values(matrixGrados || {}).find((asgn: any) => {
          return Boolean(
            asgn &&
            (asgn.ediId === currentEvalId ||
              asgn.ep1Id === currentEvalId ||
              asgn.ep2Id === currentEvalId)
          )
        }) as { ediId?: string; ep1Id?: string; ep2Id?: string } | undefined

        const slotEdiId = slotAssignment?.ediId ? String(slotAssignment.ediId) : undefined
        const slotEp1Id = slotAssignment?.ep1Id ? String(slotAssignment.ep1Id) : undefined
        const slotEp2Id = slotAssignment?.ep2Id ? String(slotAssignment.ep2Id) : undefined

        const isCurrentEdi = slotEdiId === currentEvalId
        const isCurrentEp1 = slotEp1Id === currentEvalId
        const isCurrentEp2 = slotEp2Id === currentEvalId

        // 2. Consulta de directores en la evaluación actual
        const collRef = collection(
          db,
          `evaluaciones/${currentEvalId}/consolidados_realtime_directores`
        )

        // Primer filtro: directores con al menos 100 estudiantes evaluados
        const q100 = query(collRef, where('totalEstudiantes', '>=', 100))
        const snap100 = await getDocs(q100)

        let listaCandidatos: DirectorCandidato[] = []
        let fallbackMode = false

        snap100.forEach((docSnap) => {
          const data = docSnap.data()
          listaCandidatos.push({
            dniDirector: docSnap.id || data.dniDirector,
            nombres: data.nombres,
            apellidos: data.apellidos,
            institucion: data.institucion,
            totalEstudiantes: Number(data.totalEstudiantes || 0),
            region: data.region,
            distrito: data.distrito,
          })
        })

        // Fallback preventivo si ninguna escuela supera 100 estudiantes
        if (listaCandidatos.length === 0) {
          const snapAll = await getDocs(collRef)
          snapAll.forEach((docSnap) => {
            const data = docSnap.data()
            const total = Number(data.totalEstudiantes || 0)
            if (total > 0) {
              listaCandidatos.push({
                dniDirector: docSnap.id || data.dniDirector,
                nombres: data.nombres,
                apellidos: data.apellidos,
                institucion: data.institucion,
                totalEstudiantes: total,
                region: data.region,
                distrito: data.distrito,
              })
            }
          })
          fallbackMode = true
        }

        if (isCancelled) return

        // 3. Segunda verificación: Participación cruzada en las otras 2 evaluaciones de la matriz (EDI, EP1, EP2)
        const checkCompanionParticipation = async (
          otherEvalId?: string,
          dniDirector?: string
        ): Promise<{ participo: boolean; totalEstudiantes?: number }> => {
          if (!otherEvalId || !dniDirector) return { participo: false, totalEstudiantes: 0 }
          try {
            const docRef = doc(
              db,
              `evaluaciones/${otherEvalId}/consolidados_realtime_directores/${dniDirector}`
            )
            const snap = await getDoc(docRef)
            if (snap.exists()) {
              const data = snap.data()
              const tot = Number(data?.totalEstudiantes || 0)
              return { participo: tot > 0, totalEstudiantes: tot }
            }
            return { participo: false, totalEstudiantes: 0 }
          } catch (err) {
            console.error(`Error al verificar ${dniDirector} en ${otherEvalId}:`, err)
            return { participo: false, totalEstudiantes: 0 }
          }
        }

        const directoresVerificados = await Promise.all(
          listaCandidatos.map(async (dir) => {
            // Verificar EDI
            let ediStatus: ParticipacionEtapa = {
              id: slotEdiId,
              asignada: Boolean(slotEdiId),
              participo: isCurrentEdi,
              totalEstudiantes: isCurrentEdi ? dir.totalEstudiantes : 0,
            }
            if (!isCurrentEdi && slotEdiId) {
              const res = await checkCompanionParticipation(slotEdiId, dir.dniDirector)
              ediStatus.participo = res.participo
              ediStatus.totalEstudiantes = res.totalEstudiantes
            }

            // Verificar EP1
            let ep1Status: ParticipacionEtapa = {
              id: slotEp1Id,
              asignada: Boolean(slotEp1Id),
              participo: isCurrentEp1,
              totalEstudiantes: isCurrentEp1 ? dir.totalEstudiantes : 0,
            }
            if (!isCurrentEp1 && slotEp1Id) {
              const res = await checkCompanionParticipation(slotEp1Id, dir.dniDirector)
              ep1Status.participo = res.participo
              ep1Status.totalEstudiantes = res.totalEstudiantes
            }

            // Verificar EP2
            let ep2Status: ParticipacionEtapa = {
              id: slotEp2Id,
              asignada: Boolean(slotEp2Id),
              participo: isCurrentEp2,
              totalEstudiantes: isCurrentEp2 ? dir.totalEstudiantes : 0,
            }
            if (!isCurrentEp2 && slotEp2Id) {
              const res = await checkCompanionParticipation(slotEp2Id, dir.dniDirector)
              ep2Status.participo = res.participo
              ep2Status.totalEstudiantes = res.totalEstudiantes
            }

            const etapasAsignadas = [ediStatus, ep1Status, ep2Status].filter((s) => s.asignada)
            const totalAsignadas = etapasAsignadas.length
            const totalParticipadas = etapasAsignadas.filter((s) => s.participo).length
            // Se considera Ciclo Completo si participó en todas las etapas asignadas en la matriz
            const cumpleCicloCompleto =
              totalAsignadas >= 2 && totalParticipadas === totalAsignadas

            return {
              ...dir,
              participacionMatriz: {
                edi: ediStatus,
                ep1: ep1Status,
                ep2: ep2Status,
                cumpleCicloCompleto,
                totalParticipadas,
                totalAsignadas,
              },
            }
          })
        )

        // Ordenar candidatos:
        // 1. Directores con ciclo completo primero
        // 2. Directores con mayor número de evaluaciones participadas
        // 3. Directores con mayor número de estudiantes en la evaluación actual
        directoresVerificados.sort((a, b) => {
          const aCompleto = a.participacionMatriz?.cumpleCicloCompleto ? 1 : 0
          const bCompleto = b.participacionMatriz?.cumpleCicloCompleto ? 1 : 0
          if (bCompleto !== aCompleto) return bCompleto - aCompleto

          const aPart = a.participacionMatriz?.totalParticipadas || 0
          const bPart = b.participacionMatriz?.totalParticipadas || 0
          if (bPart !== aPart) return bPart - aPart

          return b.totalEstudiantes - a.totalEstudiantes
        })

        if (!isCancelled) {
          setDirectores(directoresVerificados)
          setIsFallback(fallbackMode)
          if (directoresVerificados.length > 0) {
            setSelectedDirector(directoresVerificados[0])
          }
        }
      } catch (error) {
        console.error('Error al obtener y verificar directores candidatos:', error)
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchDirectoresCandidatos()

    return () => {
      isCancelled = true
    }
  }, [showModal, evaluacion?.id, matrizConfigGrados])

  // Filtrado de lista según pestaña o toggle
  const directoresFiltrados = useMemo(() => {
    if (!filterCicloCompletoOnly) return directores
    return directores.filter((d) => d.participacionMatriz?.cumpleCicloCompleto)
  }, [directores, filterCicloCompletoOnly])

  const cantidadCicloCompleto = useMemo(() => {
    return directores.filter((d) => d.participacionMatriz?.cumpleCicloCompleto).length
  }, [directores])

  if (!showModal || !mounted) return null

  const handleStartDemo = () => {
    if (!selectedDirector) return
    if (onConfirmDemo) {
      onConfirmDemo(selectedDirector)
    }
    handleClose()
  }

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative z-[10001] bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-xs">
              <RiPresentationLine className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="demo-modal-title"
                className="text-lg font-bold text-slate-900 tracking-tight"
              >
                Modo Demostración / Presentación
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Simula la vista del Director con datos reales y privacidad garantizada
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar modal"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <RiCloseLine className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
          {/* Tarjeta resumen de la evaluación seleccionada */}
          <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Evaluación Seleccionada
              </span>
              <p className="font-semibold text-slate-800 text-sm truncate" title={evaluacion?.nombre}>
                {evaluacion?.nombre}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                <MdGroups className="w-3.5 h-3.5" />
                <span>Mínimo 100</span>
              </span>
            </div>
          </div>

          {/* Aviso contextual si se aplicó fallback */}
          {isFallback && !loading && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <MdInfoOutline className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Ninguna escuela supera los 100 estudiantes evaluados en este examen. Se muestran los
                directores con <strong>mayor participación</strong> registrada para la demo.
              </span>
            </div>
          )}

          {/* Filtros de Ciclo Completo vs Todos */}
          {!loading && directores.length > 0 && cantidadCicloCompleto > 0 && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFilterCicloCompletoOnly(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    !filterCicloCompletoOnly
                      ? 'bg-white text-slate-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Todos ({directores.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCicloCompletoOnly(true)}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterCicloCompletoOnly
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-purple-700 hover:text-purple-900'
                  }`}
                >
                  <RiUserStarLine className="w-3 h-3" />
                  <span>Ciclo Completo ({cantidadCicloCompleto})</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-400 hidden sm:inline">
                EDI + EP1 + EP2 verificados
              </span>
            </div>
          )}

          {/* Listado de Directores Candidatos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Directores Disponibles ({directoresFiltrados.length})
              </label>
              {!loading && directoresFiltrados.length > 0 && (
                <span className="text-[11px] text-slate-400">
                  Selecciona la institución que deseas proyectar
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                <RiLoader4Line className="w-7 h-7 animate-spin text-purple-600" />
                <span className="text-xs font-medium text-slate-500 text-center max-w-sm">
                  Verificando directores candidatos y su participación en EDI, EP1 y EP2...
                </span>
              </div>
            ) : directoresFiltrados.length > 0 ? (
              <div className="max-h-64 sm:max-h-72 overflow-y-auto space-y-2 pr-1">
                {directoresFiltrados.map((director, index) => {
                  const isSelected = selectedDirector?.dniDirector === director.dniDirector
                  const regionNombre = regionTexto(director.region)
                  const mat = director.participacionMatriz

                  return (
                    <div
                      key={director.dniDirector}
                      onClick={() => setSelectedDirector(director)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                            isSelected
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <MdSchool className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-900 text-sm truncate">
                              {director.institucion || 'Institución Educativa'}
                            </p>
                            {mat?.cumpleCicloCompleto && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <RiUserStarLine className="w-2.5 h-2.5 text-amber-600" /> Ciclo Completo
                              </span>
                            )}
                            {index === 0 && !mat?.cumpleCicloCompleto && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <RiSparklingLine className="w-2.5 h-2.5" /> Top
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {director.nombres && director.apellidos
                              ? `Lic. ${director.nombres} ${director.apellidos}`
                              : `DNI: ${director.dniDirector}`}
                            {regionNombre && ` • UGEL ${regionNombre}`}
                          </p>

                          {/* Pills de Participación en la Matriz Longitudinal (EDI, EP1, EP2) */}
                          {mat && (
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {/* EDI */}
                              {mat.edi.asignada ? (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                    mat.edi.participo
                                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                                      : 'bg-slate-100 text-slate-400 border-slate-200'
                                  }`}
                                  title={
                                    mat.edi.participo
                                      ? `Participó en EDI (${mat.edi.totalEstudiantes} estudiantes)`
                                      : 'No participó en EDI'
                                  }
                                >
                                  EDI {mat.edi.participo ? '✓' : '—'}
                                </span>
                              ) : null}

                              {/* EP1 */}
                              {mat.ep1.asignada ? (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                    mat.ep1.participo
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                      : 'bg-slate-100 text-slate-400 border-slate-200'
                                  }`}
                                  title={
                                    mat.ep1.participo
                                      ? `Participó en EP1 (${mat.ep1.totalEstudiantes} estudiantes)`
                                      : 'No participó en EP1'
                                  }
                                >
                                  EP1 {mat.ep1.participo ? '✓' : '—'}
                                </span>
                              ) : null}

                              {/* EP2 */}
                              {mat.ep2.asignada ? (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                    mat.ep2.participo
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-slate-100 text-slate-400 border-slate-200'
                                  }`}
                                  title={
                                    mat.ep2.participo
                                      ? `Participó en EP2 (${mat.ep2.totalEstudiantes} estudiantes)`
                                      : 'No participó en EP2'
                                  }
                                >
                                  EP2 {mat.ep2.participo ? '✓' : '—'}
                                </span>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            director.totalEstudiantes >= 100
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <MdGroups className="w-3.5 h-3.5" />
                          <span>{director.totalEstudiantes} alumnos</span>
                        </span>

                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-purple-600 border-purple-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <RiCheckLine className="w-3.5 h-3.5 stroke-2" />}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 px-4 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50/50 space-y-2">
                <MdSchool className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  {filterCicloCompletoOnly
                    ? 'No hay directores con Ciclo Completo registrado'
                    : 'Sin registros de estudiantes calificados'}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {filterCicloCompletoOnly
                    ? 'Ningún director candidato participó en todas las evaluaciones (EDI + EP1 + EP2). Puedes cambiar al filtro "Todos".'
                    : 'Esta evaluación aún no cuenta con estudiantes evaluados por ningún director.'}
                </p>
                {filterCicloCompletoOnly && (
                  <button
                    type="button"
                    onClick={() => setFilterCicloCompletoOnly(false)}
                    className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100"
                  >
                    Ver todos los directores
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl font-medium text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 transition-colors min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!selectedDirector || loading}
            onClick={handleStartDemo}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs min-h-[44px]"
          >
            <RiPresentationLine className="w-4 h-4" />
            <span>Iniciar Demostración</span>
          </button>
        </div>
      </div>
    </div>
  )

  const portalContainer =
    typeof window !== 'undefined'
      ? document.getElementById('portal-modal') || document.body
      : null

  return portalContainer ? createPortal(modalContent, portalContainer) : null
}

export default ModalDemoSelector
