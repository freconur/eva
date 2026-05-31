import React, { useEffect, useState } from 'react'
import { collection, query, where, getDocs, getFirestore, limit, doc, getDoc, onSnapshot } from 'firebase/firestore'
import { app } from '@/firebase/firebase.config'
import { User } from '@/features/types/types'
import { RiSearchLine, RiLockPasswordLine, RiUserLine } from 'react-icons/ri'
import PrivateRoutesAdmin from '@/components/layouts/PrivateRoutesAdmin'
import { toast } from 'react-toastify'
import useUsuario from '@/features/hooks/useUsuario'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { regionTexto } from '@/fuctions/regiones'

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
  
  const [activeTab, setActiveTab] = useState<'buscar' | 'solicitudes'>('buscar')
  const [requests, setRequests] = useState<any[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false)
  const [resettingBulk, setResettingBulk] = useState(false)

  const db = getFirestore(app)
  const { getUserData } = useUsuario()
  const { currentUserData } = useGlobalContext()

  useEffect(() => {
    getUserData()
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

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        
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
        </div>

        {activeTab === 'buscar' ? (
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
                <div className="overflow-x-auto">
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
                            <div className="flex justify-center">
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
        ) : (
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
              <div className="overflow-x-auto">
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
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleOpenResetModal(req as any)}
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
    </div>
  )
}

GestionUsuariosPage.Auth = PrivateRoutesAdmin

export default GestionUsuariosPage
