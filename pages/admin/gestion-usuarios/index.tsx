import React, { useEffect, useState } from 'react'
import { collection, query, where, getDocs, getFirestore, limit, doc, getDoc, onSnapshot, deleteDoc } from 'firebase/firestore'
import { app } from '@/firebase/firebase.config'
import { User } from '@/features/types/types'
import { RiSearchLine, RiLockPasswordLine, RiUserLine, RiEyeLine, RiBarChartLine, RiDatabase2Line, RiRefreshLine, RiDeleteBin6Line } from 'react-icons/ri'
import PrivateRoutesAdmin from '@/components/layouts/PrivateRoutesAdmin'
import { toast } from 'react-toastify'
import useUsuario from '@/features/hooks/useUsuario'
import { useGlobalContext, useGlobalContextDispatch } from '@/features/context/GlolbalContext'
import { AppAction } from '@/features/actions/appAction'
import { regionTexto } from '@/fuctions/regiones'
import { useRouter } from 'next/router'

const ROLES_TEXT: Record<number, string> = {
  1: 'Especialista',
  2: 'Director',
  3: 'Docente',
  4: 'Administrador',
  5: 'Especialista Regional'
}

const GestionUsuariosPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [resetting, setResetting] = useState(false)
  
  const [activeTab, setActiveTab] = useState<'buscar' | 'solicitudes' | 'consumo'>('buscar')
  const [requests, setRequests] = useState<any[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false)
  const [resettingBulk, setResettingBulk] = useState(false)

  const [selectedRequestToDelete, setSelectedRequestToDelete] = useState<any | null>(null)
  const [deletingRequest, setDeletingRequest] = useState<boolean>(false)

  // Estados para métricas de consumo
  const [metricsData, setMetricsData] = useState<any>(null)
  const [loadingMetrics, setLoadingMetrics] = useState(false)
  const [metricsError, setMetricsError] = useState<string | null>(null)

  const db = getFirestore(app)
  const { getUserData } = useUsuario()
  const { currentUserData } = useGlobalContext()
  const router = useRouter()
  const dispatch = useGlobalContextDispatch()

  const handleStartAudit = async (user: User) => {
    if (!user) return
    try {
      // 1. Guardar los datos del administrador actual
      sessionStorage.setItem('real_admin_user', JSON.stringify(currentUserData))
      
      // 2. Guardar los datos del usuario a auditar
      sessionStorage.setItem('audited_user', JSON.stringify(user))
      
      // 3. Actualizar el contexto de la aplicación
      dispatch({
        type: AppAction.CURRENT_USER_DATA,
        payload: user
      })
      
      toast.success(`Iniciando auditoría de ${user.nombres} ${user.apellidos}.`)
      
      // 4. Redirigir a mi cuenta o la raíz
      router.push('/mi-cuenta')
    } catch (error) {
      console.error("Error al iniciar auditoría:", error)
      toast.error("Error al iniciar el modo de auditoría")
    }
  }

  const fetchMetrics = async (force = false) => {
    if (metricsData && !force) return
    setLoadingMetrics(true)
    setMetricsError(null)
    try {
      const { functions } = await import('@/firebase/firebase.config')
      const { httpsCallable } = await import('firebase/functions')
      const getMetricsFn = httpsCallable(functions, 'obtenerMetricasConsumo')
      const result = await getMetricsFn() as any
      if (result.data && result.data.success) {
        setMetricsData(result.data)
        if (result.data.warning) {
          toast.warning(result.data.warning, { autoClose: 7000 })
        }
      } else {
        throw new Error(result.data?.message || 'No se pudo obtener la información de consumo')
      }
    } catch (error: any) {
      console.error("Error al obtener métricas de consumo:", error)
      setMetricsError(error.message || 'Error de permisos o de red al consultar el consumo')
      toast.error("Error al cargar datos de consumo y costos")
    } finally {
      setLoadingMetrics(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'consumo') {
      fetchMetrics()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  useEffect(() => {
    getUserData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setLoadingRequests(true)
    const q = query(
      collection(db, 'solicitudes_reseteo'),
      where('estado', '==', 'pendiente')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: any[] = []
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() })
      })
      // Ordenar localmente por fecha (descendente)
      docs.sort((a, b) => {
        const tA = a.fecha?.seconds || 0
        const tB = b.fecha?.seconds || 0
        return tB - tA
      })
      setRequests(docs)
      setLoadingRequests(false)
    }, (error) => {
      console.error("Error fetching requests:", error)
      setLoadingRequests(false)
    })

    return () => unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    if (searchTerm.length < 3) {
      setResults([])
      return
    }

    const delayDebounceFn = setTimeout(() => {
      searchUsers(searchTerm)
    }, 500)

    return () => clearTimeout(delayDebounceFn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  const searchUsers = async (queryText: string) => {
    setLoading(true)
    try {
      const pathRef = collection(db, 'usuarios')
      let docs: User[] = []

      // Si es un número (DNI), buscamos por DNI exacto o prefijo
      if (/^\d+$/.test(queryText)) {
        const qPrefix = query(
          pathRef,
          where('dni', '>=', queryText),
          where('dni', '<=', queryText + '\uf8ff'),
          limit(15)
        )
        const snapshot = await getDocs(qPrefix)
        snapshot.forEach((doc) => {
          docs.push(doc.data() as User)
        })
      } else {
        // De lo contrario, buscamos por nombre (insensible a mayúsculas/minúsculas o coincidencia parcial en frontend)
        const snapshot = await getDocs(query(pathRef, limit(100)))
        snapshot.forEach((doc) => {
          const data = doc.data() as User
          const fullName = `${data.nombres || ''} ${data.apellidos || ''}`.toLowerCase()
          if (fullName.includes(queryText.toLowerCase())) {
            docs.push(data)
          }
        })
        // Limitar a 15 resultados
        docs = docs.slice(0, 15)
      }

      setResults(docs)
    } catch (error) {
      console.error("Error searching users:", error)
      toast.error("Error al buscar usuarios")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenResetModal = (user: User) => {
    setSelectedUser(user)
    setShowConfirmModal(true)
  }

  const handleResetPassword = async () => {
    if (!selectedUser) return
    setResetting(true)
    try {
      const { functions } = await import('@/firebase/firebase.config')
      const { httpsCallable } = await import('firebase/functions')
      const resetFn = httpsCallable(functions, 'resetearContrasena')
      await resetFn({ dni: selectedUser.dni })

      toast.success(`Contraseña restablecida exitosamente para ${selectedUser.nombres}. Nueva contraseña temporal: ${selectedUser.dni}`)
      setShowConfirmModal(false)
      setSelectedUser(null)
    } catch (error: any) {
      console.error("Error al restablecer contraseña:", error)
      toast.error(error.message || "Error al restablecer la contraseña")
    } finally {
      setResetting(false)
    }
  }

  const handleOpenBulkResetModal = () => {
    setShowBulkConfirmModal(true)
  }

  const handleBulkReset = async () => {
    setResettingBulk(true)
    try {
      const { functions } = await import('@/firebase/firebase.config')
      const { httpsCallable } = await import('firebase/functions')
      const resetBulkFn = httpsCallable(functions, 'resetearContrasenasMasivo')
      const result = await resetBulkFn() as any
      
      const { count, message } = result.data || {}
      toast.success(message || `Se restablecieron ${count || 0} contraseñas exitosamente.`)
      setShowBulkConfirmModal(false)
    } catch (error: any) {
      console.error("Error al restablecer contraseñas masivamente:", error)
      toast.error(error.message || "Error al restablecer contraseñas masivamente")
    } finally {
      setResettingBulk(false)
    }
  }

  const handleDeleteRequest = async () => {
    if (!selectedRequestToDelete) return
    setDeletingRequest(true)
    try {
      await deleteDoc(doc(db, 'solicitudes_reseteo', selectedRequestToDelete.id))
      toast.success("Solicitud de soporte eliminada exitosamente")
      setSelectedRequestToDelete(null)
    } catch (error: any) {
      console.error("Error al eliminar solicitud:", error)
      toast.error(error.message || "Error al eliminar la solicitud")
    } finally {
      setDeletingRequest(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Gestión de Usuarios</h1>
            <p className="text-slate-500 mt-1">Busque usuarios por DNI o nombres para administrar sus credenciales y contraseñas.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab('buscar')}
            className={`pb-3 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'buscar'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Buscar Usuarios
          </button>
          <button
            onClick={() => setActiveTab('solicitudes')}
            className={`pb-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'solicitudes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Solicitudes de Soporte
          {requests.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-extrabold animate-pulse">
              {requests.length}
            </span>
          )}
        </button>
        {/* <button
          onClick={() => setActiveTab('consumo')}
          className={`pb-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'consumo'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <RiBarChartLine className="text-base" />
          Consumo y Costos
        </button> */}
      </div>

      {activeTab === 'buscar' && (
        <>
            {/* Search Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="relative max-w-lg">
                <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ingrese DNI o nombre completo del usuario..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-700 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-4">
                  <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div>
                  <span className="font-medium animate-pulse">Buscando usuarios...</span>
                </div>
              ) : results.length > 0 ? (
                <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold text-sm">
                        <th className="p-4 pl-6">Usuario</th>
                        <th className="p-4">DNI</th>
                        <th className="p-4">Rol</th>
                        <th className="p-4">Correo Electrónico</th>
                        <th className="p-4 pr-6 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {results.map((user) => (
                        <tr key={user.dni} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                {user.nombres?.charAt(0)}{user.apellidos?.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800">{user.nombres} {user.apellidos}</div>
                                <div className="text-xs text-slate-400">{user.celular || 'Sin celular'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wider">
                              {user.dni}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-slate-600 text-sm">
                              {ROLES_TEXT[Number(user.rol || user.perfil?.rol)] || 'Usuario'}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-slate-500">
                            {user.email || `${user.dni}@competencelab.com`}
                          </td>
                          <td className="p-4 pr-6">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleStartAudit(user)}
                                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold border border-blue-200/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                title="Auditar cuenta del usuario"
                              >
                                <RiEyeLine className="text-sm" />
                                Auditar
                              </button>
                              <button
                                onClick={() => handleOpenResetModal(user)}
                                className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-xs font-bold border border-amber-200/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                title="Restablecer contraseña"
                              >
                                <RiLockPasswordLine className="text-sm" />
                                Restablecer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : searchTerm.trim() ? (
                <div className="p-12 text-center text-slate-400">
                  <RiUserLine className="mx-auto text-4xl mb-3 text-slate-300" />
                  <p className="font-medium">No se encontraron usuarios coincidentes.</p>
                  <p className="text-sm text-slate-400 mt-1">Verifique el DNI o la ortografía del nombre.</p>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <RiUserLine className="mx-auto text-4xl mb-3 text-slate-300" />
                  <p className="font-medium">Ingrese un criterio de búsqueda arriba.</p>
                  <p className="text-sm text-slate-400 mt-1">Puede escribir el DNI o nombres de cualquier usuario.</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'solicitudes' && (
          <div className="space-y-4">
            {requests.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div>
                  <div className="text-slate-800 font-bold text-base">Atención de Soporte Remoto</div>
                  <div className="text-slate-500 text-xs mt-0.5">
                    Tiene <strong className="text-blue-600">{requests.length}</strong> solicitudes pendientes para restablecer contraseña.
                  </div>
                </div>
                <button
                  onClick={handleOpenBulkResetModal}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  disabled={resettingBulk}
                >
                  <RiLockPasswordLine className="text-base" />
                  Restablecer Todos
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {loadingRequests && requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-4">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="font-medium animate-pulse">Cargando solicitudes...</span>
              </div>
            ) : requests.length > 0 ? (
              <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold text-sm">
                      <th className="p-4 pl-6">Usuario</th>
                      <th className="p-4">DNI</th>
                      <th className="p-4">UGEL / Región</th>
                      <th className="p-4">Rol</th>
                      <th className="p-4">Fecha de Solicitud</th>
                      <th className="p-4 pr-6 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                              {req.nombres?.charAt(0)}{req.apellidos?.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">{req.nombres} {req.apellidos}</div>
                              <div className="text-xs text-slate-400">{req.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wider">
                            {req.dni}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {req.region ? regionTexto(String(req.region)) : '—'}
                        </td>
                        <td className="p-4">
                          <span className="text-slate-600 text-sm">
                            {ROLES_TEXT[Number(req.rol)] || 'Usuario'}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-500">
                          {req.fecha ? new Date(req.fecha.seconds * 1000).toLocaleString('es-PE', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          }) : 'Recién solicitado'}
                        </td>
                        <td className="p-4 pr-6">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleStartAudit(req as any)}
                              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold border border-blue-200/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                              title="Auditar cuenta del usuario"
                            >
                              <RiEyeLine className="text-sm" />
                              Auditar
                            </button>
                            <button
                              onClick={() => handleOpenResetModal(req as any)}
                              className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-xs font-bold border border-amber-200/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                              title="Restablecer contraseña"
                            >
                              <RiLockPasswordLine className="text-sm" />
                              Restablecer
                            </button>
                            <button
                              onClick={() => setSelectedRequestToDelete(req as any)}
                              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-xl text-xs font-bold border border-red-200/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                              title="Eliminar solicitud"
                            >
                              <RiDeleteBin6Line className="text-sm" />
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <RiUserLine className="mx-auto text-4xl mb-3 text-slate-300" />
                <p className="font-medium">No hay solicitudes de soporte pendientes.</p>
                <p className="text-sm text-slate-400 mt-1">Todos los usuarios tienen acceso a sus cuentas.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'consumo' && (
        <div className="space-y-6">
          {/* Cabecera del Panel */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div>
              <div className="text-slate-800 font-bold text-lg flex items-center gap-2">
                <RiDatabase2Line className="text-blue-600 text-xl" />
                Métricas de Operaciones en Base de Datos
              </div>
              <div className="text-slate-500 text-xs mt-0.5">
                Consumo acumulado y estimación de costos en base a los últimos 30 días de actividad de Firestore.
              </div>
            </div>
            <button
              onClick={() => fetchMetrics(true)}
              disabled={loadingMetrics}
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl text-xs font-bold border border-blue-200/50 transition-all active:scale-95 disabled:opacity-50"
            >
              <RiRefreshLine className={`text-sm ${loadingMetrics ? 'animate-spin' : ''}`} />
              Actualizar Métricas
            </button>
          </div>

          {loadingMetrics ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="text-slate-600 font-semibold text-sm">Consultando Google Cloud Monitoring...</div>
              <div className="text-slate-400 text-xs">Esto puede tomar unos segundos</div>
            </div>
          ) : metricsError ? (
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-2xl mx-auto">
                ⚠️
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-lg font-bold text-slate-800">Error al Cargar Métricas</h3>
                <p className="text-slate-500 text-sm">
                  {metricsError}
                </p>
                <div className="text-left text-xs bg-slate-50 p-3 rounded-lg text-slate-600 space-y-1.5 mt-2 border border-slate-150">
                  <p className="font-bold">Para solucionar este problema:</p>
                  <p>1. Verifique que la API de Cloud Monitoring esté habilitada en su consola de Google Cloud.</p>
                  <p>2. Asegúrese de que la cuenta de servicio que ejecuta la Cloud Function tenga asignado el rol <strong>Lector de Monitoreo (Monitoring Viewer)</strong>.</p>
                </div>
              </div>
              <button
                onClick={() => fetchMetrics(true)}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : metricsData ? (
            <div className="space-y-6">
              {/* Alerta de datos simulados si corresponde */}
              {metricsData.isMockData && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-xs">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <span className="font-bold">Nota de Configuración:</span> {metricsData.warning || 'Mostrando datos simulados debido a un entorno local o de desarrollo sin conexión con GCP Monitoring API.'}
                  </div>
                </div>
              )}

              {/* Hero Cost Card */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-md p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-blue-100 font-bold uppercase tracking-wider text-xs">Costo Total Estimado</span>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight">${metricsData.totals.totalCost.toFixed(4)} <span className="text-2xl font-normal text-blue-200">USD</span></h2>
                  <p className="text-blue-100/80 text-xs font-medium">Uso consolidado de los últimos 30 días, calculado con las tarifas vigentes.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 text-xs space-y-2 max-w-xs">
                  <div className="font-bold text-white uppercase tracking-wider">Tarifas de Referencia:</div>
                  <div className="flex justify-between gap-4 text-blue-100">
                    <span>Lecturas:</span> <span className="font-semibold font-mono">$0.06 / 100K</span>
                  </div>
                  <div className="flex justify-between gap-4 text-blue-100">
                    <span>Escrituras:</span> <span className="font-semibold font-mono">$0.18 / 100K</span>
                  </div>
                  <div className="flex justify-between gap-4 text-blue-100">
                    <span>Eliminaciones:</span> <span className="font-semibold font-mono">$0.02 / 100K</span>
                  </div>
                </div>
              </div>

              {/* Grid 3 columnas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Reads */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lecturas</span>
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                        <RiEyeLine />
                      </div>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-800 font-mono">
                      {metricsData.totals.reads.toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-xs text-slate-400">Costo estimado:</span>
                    <span className="text-sm font-bold text-blue-600 font-mono">${metricsData.totals.costReads.toFixed(4)} USD</span>
                  </div>
                </div>

                {/* Writes */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Escrituras</span>
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                        <RiLockPasswordLine />
                      </div>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-800 font-mono">
                      {metricsData.totals.writes.toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-xs text-slate-400">Costo estimado:</span>
                    <span className="text-sm font-bold text-emerald-600 font-mono">${metricsData.totals.costWrites.toFixed(4)} USD</span>
                  </div>
                </div>

                {/* Deletes */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Eliminaciones</span>
                      <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
                        <RiUserLine />
                      </div>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-800 font-mono">
                      {metricsData.totals.deletes.toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-xs text-slate-400">Costo estimado:</span>
                    <span className="text-sm font-bold text-rose-600 font-mono">${metricsData.totals.costDeletes.toFixed(4)} USD</span>
                  </div>
                </div>
              </div>

              {/* Porcentaje de costo - Barra */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-slate-850 text-sm">Distribución de Costo por Operación</h3>
                  <p className="text-slate-400 text-xs">Muestra el porcentaje del costo total que representa cada tipo de operación.</p>
                </div>
                {metricsData.totals.totalCost > 0 ? (
                  <div className="space-y-4">
                    {/* Barra de progreso combinada */}
                    <div className="w-full h-4 rounded-full bg-slate-100 overflow-hidden flex">
                      <div
                        style={{ width: `${(metricsData.totals.costReads / metricsData.totals.totalCost) * 100}%` }}
                        className="bg-blue-500 h-full"
                        title={`Lecturas: ${((metricsData.totals.costReads / metricsData.totals.totalCost) * 100).toFixed(1)}%`}
                      />
                      <div
                        style={{ width: `${(metricsData.totals.costWrites / metricsData.totals.totalCost) * 100}%` }}
                        className="bg-emerald-500 h-full"
                        title={`Escrituras: ${((metricsData.totals.costWrites / metricsData.totals.totalCost) * 100).toFixed(1)}%`}
                      />
                      <div
                        style={{ width: `${(metricsData.totals.costDeletes / metricsData.totals.totalCost) * 100}%` }}
                        className="bg-rose-500 h-full"
                        title={`Eliminaciones: ${((metricsData.totals.costDeletes / metricsData.totals.totalCost) * 100).toFixed(1)}%`}
                      />
                    </div>
                    {/* Leyendas */}
                    <div className="flex flex-wrap gap-4 text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-blue-500" />
                        <span className="text-slate-600">Lecturas:</span>
                        <span className="text-slate-800 font-mono font-bold">{((metricsData.totals.costReads / metricsData.totals.totalCost) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-emerald-500" />
                        <span className="text-slate-655">Escrituras:</span>
                        <span className="text-slate-800 font-mono font-bold">{((metricsData.totals.costWrites / metricsData.totals.totalCost) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-rose-500" />
                        <span className="text-slate-655">Eliminaciones:</span>
                        <span className="text-slate-800 font-mono font-bold">{((metricsData.totals.costDeletes / metricsData.totals.totalCost) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 text-xs py-2">
                    Sin datos suficientes para calcular porcentajes (Costo total es $0).
                  </div>
                )}
              </div>

              {/* Historial diario de consumo - Mini Bar Chart */}
              {metricsData.dailyHistory && metricsData.dailyHistory.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-6">
                  <div>
                    <h3 className="font-bold text-slate-850 text-sm">Historial de Operaciones Diarias</h3>
                    <p className="text-slate-400 text-xs">Visualización de operaciones de lectura, escritura y eliminación de los últimos 30 días.</p>
                  </div>

                  {/* Gráfico de barras hecho con CSS */}
                  <div className="space-y-4">
                    <div className="h-44 w-full flex items-end justify-between gap-1 overflow-x-auto pb-2 border-b border-slate-150 min-w-[600px] select-none">
                      {(() => {
                        const maxDayOps = Math.max(
                          ...metricsData.dailyHistory.map((d: any) => d.reads + d.writes + d.deletes),
                          100
                        );
                        return metricsData.dailyHistory.map((day: any) => {
                          const totalOps = day.reads + day.writes + day.deletes;
                          const hReads = totalOps > 0 ? (day.reads / maxDayOps) * 100 : 0;
                          const hWrites = totalOps > 0 ? (day.writes / maxDayOps) * 100 : 0;
                          const hDeletes = totalOps > 0 ? (day.deletes / maxDayOps) * 100 : 0;
                          const totalHeight = (totalOps / maxDayOps) * 100;

                          const parts = day.date.split('-');
                          const formattedDate = `${parts[2]}/${parts[1]}`;

                          return (
                            <div
                              key={day.date}
                              className="group flex-1 flex flex-col items-center cursor-pointer relative"
                            >
                              {/* Tooltip */}
                              <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] p-2.5 rounded-lg shadow-xl z-10 w-36 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 -translate-x-1/2 left-1/2 border border-slate-800 space-y-1">
                                <div className="font-bold border-b border-slate-800 pb-1 text-center">{day.date}</div>
                                <div className="flex justify-between">
                                  <span className="text-blue-300">Lecturas:</span>
                                  <span className="font-bold font-mono">{day.reads.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-emerald-300">Escrituras:</span>
                                  <span className="font-bold font-mono">{day.writes.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-rose-300">Eliminaciones:</span>
                                  <span className="font-bold font-mono">{day.deletes.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-800 pt-1 font-bold">
                                  <span>Total:</span>
                                  <span className="font-mono text-amber-300">{totalOps.toLocaleString()}</span>
                                </div>
                              </div>

                              {/* Barra apilada */}
                              <div
                                style={{ height: `${Math.max(totalHeight, 2)}%` }}
                                className="w-full rounded-t-sm overflow-hidden flex flex-col justify-end bg-slate-50 group-hover:scale-x-110 transition-transform"
                              >
                                <div style={{ height: `${hDeletes}%` }} className="bg-rose-500 w-full" />
                                <div style={{ height: `${hWrites}%` }} className="bg-emerald-500 w-full" />
                                <div style={{ height: `${hReads}%` }} className="bg-blue-500 w-full" />
                              </div>

                              {/* Fecha pequeña */}
                              <span className="text-[9px] text-slate-400 mt-1 font-semibold group-hover:text-slate-700 transition-colors font-mono">
                                {formattedDate}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Leyendas del Gráfico */}
                    <div className="flex justify-center gap-4 text-xs font-semibold text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span>Lecturas</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Escrituras</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span>Eliminaciones</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preguntas Frecuentes / Detalles de Facturación */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-slate-600 text-xs space-y-3 leading-relaxed">
                <div className="font-bold text-slate-800 text-sm">Información Importante sobre la Facturación de Firestore:</div>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>Cuota Gratuita (Free Tier):</strong> Firestore ofrece una cuota gratuita diaria de 50k lecturas, 20k escrituras y 20k eliminaciones. La estimación mostrada arriba refleja el consumo bruto de los últimos 30 días y no resta esta cuota gratuita diaria.</li>
                  <li><strong>Operaciones Adicionales:</strong> Esta estimación se basa únicamente en operaciones básicas de lectura, escritura y eliminación de documentos. No incluye los costos por almacenamiento de datos (GB/mes), transferencia de red, operaciones de indexación ni backups de base de datos.</li>
                  <li><strong>Origen de los Datos:</strong> Las métricas se recuperan directamente del sistema de monitoreo nativo de Google Cloud Platform (GCP Cloud Monitoring) y representan la actividad acumulada en producción.</li>
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      )}
      </div>

      {/* Confirm Password Reset Modal */}
      {showConfirmModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mx-auto">
                <RiLockPasswordLine />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-800">¿Restablecer contraseña?</h3>
                <p className="text-slate-500 text-sm">
                  Esta acción restablecerá la contraseña del usuario <strong className="text-slate-700">{selectedUser.nombres} {selectedUser.apellidos}</strong> a su contraseña por defecto:
                </p>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 font-mono text-lg font-bold text-blue-600 tracking-wider">
                  {selectedUser.dni}
                </div>
                <p className="text-xs text-amber-600 font-medium bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                  El usuario deberá cambiar su contraseña obligatoriamente la próxima vez que inicie sesión.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => { setShowConfirmModal(false); setSelectedUser(null); }}
                className="px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-200/55 text-sm font-semibold transition-colors"
                disabled={resetting}
              >
                Cancelar
              </button>
              <button
                onClick={handleResetPassword}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-amber-600/20 active:scale-[0.98] flex items-center gap-2"
                disabled={resetting}
              >
                {resetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Restableciendo...
                  </>
                ) : (
                  'Sí, restablecer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Bulk Password Reset Modal */}
      {showBulkConfirmModal && requests.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mx-auto">
                <RiLockPasswordLine />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-800">¿Restablecer todas las cuentas?</h3>
                <p className="text-slate-500 text-sm">
                  Esta acción restablecerá la contraseña de los <strong className="text-slate-700">{requests.length}</strong> usuarios que enviaron solicitudes de soporte.
                </p>
                <p className="text-xs text-amber-600 font-medium bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                  Todas sus contraseñas se restablecerán a sus respectivos DNI y deberán cambiarlas obligatoriamente en su próximo inicio de sesión.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowBulkConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-200/55 text-sm font-semibold transition-colors"
                disabled={resettingBulk}
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkReset}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-amber-600/20 active:scale-[0.98] flex items-center gap-2"
                disabled={resettingBulk}
              >
                {resettingBulk ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Restableciendo...
                  </>
                ) : (
                  'Sí, restablecer todos'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Support Request Modal */}
      {selectedRequestToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-2xl mx-auto">
                <RiDeleteBin6Line />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-800">¿Eliminar solicitud?</h3>
                <p className="text-slate-500 text-sm">
                  Esta acción eliminará de forma permanente la solicitud de soporte para restablecer la contraseña del usuario <strong className="text-slate-700">{selectedRequestToDelete.nombres} {selectedRequestToDelete.apellidos}</strong>.
                </p>
                <p className="text-xs text-red-600 font-medium bg-red-50/50 p-2.5 rounded-lg border border-red-100">
                  El usuario no podrá ingresar hasta que se resuelva su contraseña o vuelva a solicitar soporte.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setSelectedRequestToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-200/55 text-sm font-semibold transition-colors"
                disabled={deletingRequest}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteRequest}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-red-600/20 active:scale-[0.98] flex items-center gap-2"
                disabled={deletingRequest}
              >
                {deletingRequest ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Eliminando...
                  </>
                ) : (
                  'Sí, eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

GestionUsuariosPage.Auth = PrivateRoutesAdmin

export default GestionUsuariosPage
