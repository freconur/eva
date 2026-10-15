import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { collection, query, where, getDocs, getFirestore, doc, getDoc, onSnapshot, deleteDoc, limit, getCountFromServer } from 'firebase/firestore'
import { app } from '@/firebase/firebase.config'
import { User } from '@/features/types/types'
import { RiSearchLine, RiLockPasswordLine, RiUserLine, RiEyeLine, RiBarChartLine, RiDatabase2Line, RiRefreshLine, RiDeleteBin6Line, RiFilterLine, RiFilter3Line, RiArrowLeftSLine, RiArrowRightSLine, RiCloseLine, RiShieldUserLine, RiArrowDownSLine, RiCheckLine, RiAlertLine, RiHistoryLine, RiLinkM, RiLinkUnlinkM } from 'react-icons/ri'
import PrivateRoutesAdmin from '@/components/layouts/PrivateRoutesAdmin'
import { toast } from 'react-toastify'
import useUsuario from '@/features/hooks/useUsuario'
import { useGlobalContext, useGlobalContextDispatch } from '@/features/context/GlolbalContext'
import { AppAction } from '@/features/actions/appAction'
import { regionTexto, regiones, nivelInstitucion, area, caracteristicasDirectivo, getCaracteristicasDirectivoTexto, getAreaTexto } from '@/fuctions/regiones'
import { distritosPuno } from '@/fuctions/provinciasPuno'
import { useRouter } from 'next/router'

const ROLES_TEXT: Record<number, string> = {
  1: 'Especialista',
  2: 'Director',
  3: 'Docente',
  4: 'Administrador',
  5: 'Especialista Regional'
}

const formatNombreCapitalize = (nombres?: string, apellidos?: string): string => {
  const full = `${nombres || ''} ${apellidos || ''}`.trim()
  if (!full) return 'Sin nombre'
  return full
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

type Filters = {
  region: string
  distrito: string
  rol: string
  caracteristicaCurricular: string
  tipoGestion: string
  area: string
  nivelDeInstitucion: string[]
}

const INITIAL_FILTERS: Filters = {
  region: '',
  distrito: '',
  rol: '',
  caracteristicaCurricular: '',
  tipoGestion: '',
  area: '',
  nivelDeInstitucion: [],
}

interface UserActionsDropdownProps {
  user: User
  isOpen: boolean
  isLastRows?: boolean
  onToggle: () => void
  onClose?: () => void
  onAudit: () => void
  onRoleChange: () => void
  onResetPassword: () => void
  onAssignPredecessor?: () => void
}

const UserActionsDropdown: React.FC<UserActionsDropdownProps> = ({
  user,
  isOpen,
  onToggle,
  onClose,
  onAudit,
  onRoleChange,
  onResetPassword,
  onAssignPredecessor,
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [coords, setCoords] = useState<{ top: number; right: number; openUpwards: boolean } | null>(null)
  const [mounted, setMounted] = useState(false)

  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setCoords(null)
      return
    }

    const updatePosition = () => {
      if (!triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()
      // Si el botón disparador ya no está visible en el viewport, cerramos
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        onCloseRef.current?.()
        return
      }

      const spaceBelow = window.innerHeight - rect.bottom
      const isDirector = Number(user.rol || user.perfil?.rol) === 2
      const menuEstimatedHeight = isDirector ? 230 : 175
      const openUpwards = spaceBelow < menuEstimatedHeight && rect.top > menuEstimatedHeight

      setCoords({
        top: openUpwards ? rect.top - 6 : rect.bottom + 6,
        right: Math.max(12, window.innerWidth - rect.right),
        openUpwards,
      })
    }

    updatePosition()

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, user.rol, user.perfil?.rol])

  return (
    <div className="relative inline-block text-left user-action-dropdown-container">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className={`inline-flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
          isOpen
            ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm ring-2 ring-blue-500/20'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 shadow-xs'
        }`}
        aria-expanded={isOpen}
        title="Opciones de usuario"
      >
        <span>Acciones</span>
        <RiArrowDownSLine
          className={`text-sm transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'
          }`}
        />
      </button>

      {isOpen && mounted && coords && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            right: `${coords.right}px`,
            transform: coords.openUpwards ? 'translateY(-100%)' : 'none',
            zIndex: 99999,
          }}
          className="w-52 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-1.5 text-left user-action-dropdown-menu"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onAudit}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-blue-50/70 transition-colors group"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm group-hover:scale-105 group-hover:bg-blue-100 transition-all shrink-0">
              <RiEyeLine />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-700 group-hover:text-blue-700">Auditar</div>
              <div className="text-[10px] text-slate-400 truncate">Ver como este usuario</div>
            </div>
          </button>

          <button
            type="button"
            onClick={onRoleChange}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-purple-50/70 transition-colors group"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-sm group-hover:scale-105 group-hover:bg-purple-100 transition-all shrink-0">
              <RiShieldUserLine />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-700 group-hover:text-purple-700">Cambiar Rol</div>
              <div className="text-[10px] text-slate-400 truncate">Modificar rol y accesos</div>
            </div>
          </button>

          {Number(user.rol || user.perfil?.rol) === 2 && onAssignPredecessor && (
            <button
              type="button"
              onClick={onAssignPredecessor}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-emerald-50/70 transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm group-hover:scale-105 group-hover:bg-emerald-100 transition-all shrink-0">
                <RiHistoryLine />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-700 group-hover:text-emerald-700">Director Predecesor</div>
                <div className="text-[10px] text-slate-400 truncate">Heredar evaluaciones EDI/EP1</div>
              </div>
            </button>
          )}

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            onClick={onResetPassword}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-amber-50/70 transition-colors group"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-sm group-hover:scale-105 group-hover:bg-amber-100 transition-all shrink-0">
              <RiLockPasswordLine />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-700 group-hover:text-amber-700">Restablecer</div>
              <div className="text-[10px] text-slate-400 truncate">Restablecer contraseña</div>
            </div>
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}

const GestionUsuariosPage = () => {
  // Filtros
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS)
  const [rawResults, setRawResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Búsqueda específica por DNI
  const [dniQuery, setDniQuery] = useState('')
  const [dniResults, setDniResults] = useState<User[]>([])
  const [isDniActive, setIsDniActive] = useState(false)
  const generalTableRef = useRef<HTMLDivElement>(null)
  const dniTableRef = useRef<HTMLDivElement>(null)

  // Filtro de búsqueda rápida local en memoria
  const [localSearchQuery, setLocalSearchQuery] = useState('')

  // Paginación local (en memoria)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

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

  // Estados para cambio de rol de usuario
  const [userForRoleChange, setUserForRoleChange] = useState<User | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showRoleConfirmDialog, setShowRoleConfirmDialog] = useState(false)
  const [selectedNewRole, setSelectedNewRole] = useState<number>(2)
  const [directorDniInput, setDirectorDniInput] = useState<string>('')
  const [directorInfo, setDirectorInfo] = useState<{ nombres?: string; apellidos?: string; institucion?: string; exists: boolean; notDirector?: boolean } | null>(null)
  const [isSearchingDirector, setIsSearchingDirector] = useState(false)
  const [isChangingRole, setIsChangingRole] = useState(false)
  const [studentCountNotice, setStudentCountNotice] = useState<number | null>(null)
  const [checkingStudents, setCheckingStudents] = useState(false)

  // Estados para vinculación de Director Predecesor
  const [directorForPredecessor, setDirectorForPredecessor] = useState<User | null>(null)
  const [showPredecessorModal, setShowPredecessorModal] = useState(false)
  const [predecessorDniInput, setPredecessorDniInput] = useState<string>('')
  const [predecessorInfo, setPredecessorInfo] = useState<{ nombres?: string; apellidos?: string; institucion?: string; exists: boolean; notDirector?: boolean } | null>(null)
  const [isSearchingPredecessor, setIsSearchingPredecessor] = useState(false)
  const [isSavingPredecessor, setIsSavingPredecessor] = useState(false)
  const [showUnlinkConfirmDialog, setShowUnlinkConfirmDialog] = useState(false)
  const [predecessorDniToUnlink, setPredecessorDniToUnlink] = useState<string>('')

  // Estado para el menú dropdown de acciones de cada fila
  const [activeActionMenuDni, setActiveActionMenuDni] = useState<string | null>(null)

  const db = getFirestore(app)
  const { getUserData, cambiarRolUsuario, vincularDirectorPredecesor, desvincularDirectorPredecesor } = useUsuario()
  const { currentUserData } = useGlobalContext()
  const router = useRouter()
  const dispatch = useGlobalContextDispatch()

  // Distritos filtrados por region seleccionada
  const distritosDisponibles = filters.region
    ? distritosPuno.find(p => p.id === Number(filters.region))?.distritos || []
    : []

  const hasActiveFilters = filters.region || filters.distrito || filters.rol || filters.caracteristicaCurricular || filters.tipoGestion || filters.area || filters.nivelDeInstitucion.length > 0

  const handleFilterChange = (key: keyof Filters, value: string | string[]) => {
    setFilters(prev => {
      const updated = { ...prev, [key]: value }
      // Limpiar distrito si cambia la región
      if (key === 'region') {
        updated.distrito = ''
      }
      return updated
    })
  }

  const handleNivelToggle = (nivelId: string) => {
    setFilters(prev => {
      const current = prev.nivelDeInstitucion
      const updated = current.includes(nivelId)
        ? current.filter(n => n !== nivelId)
        : [...current, nivelId]
      return { ...prev, nivelDeInstitucion: updated }
    })
  }

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS)
    setDniQuery('')
    setIsDniActive(false)
    setLocalSearchQuery('')
    setRawResults([])
    setDniResults([])
    setHasSearched(false)
    setCurrentPage(1)
    setActiveActionMenuDni(null)
  }

  const clearDniSearch = () => {
    setDniQuery('')
    setIsDniActive(false)
    setDniResults([])
    setLocalSearchQuery('')
    setActiveActionMenuDni(null)
  }

  const searchWithFilters = async () => {
    if (!filters.region || !filters.rol) {
      toast.warning('Debe seleccionar una Región y un Rol para buscar')
      return
    }
    setLoading(true)
    try {
      const pathRef = collection(db, 'usuarios')
      // Consultamos a Firestore usando únicamente el filtro de región
      // para evitar totalmente la creación de índices compuestos en Firebase console
      const q = query(pathRef, where('region', '==', Number(filters.region)))
      const snapshot = await getDocs(q)

      const docs: User[] = []
      snapshot.forEach((docSnap) => {
        docs.push(docSnap.data() as User)
      })

      setRawResults(docs)
      setCurrentPage(1)
      setHasSearched(true)

      // Scroll suave a la tabla general si tiene resultados
      if (docs.length > 0) {
        setTimeout(() => {
          generalTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    } catch (error: any) {
      console.error('Error searching users with filters:', error)
      toast.error('Error al buscar usuarios en Firestore')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    searchWithFilters()
  }

  // Filtrado local en memoria para búsqueda general
  const getFilteredResults = () => {
    let results = rawResults

    results = results.filter(user => {
      // 1. Filtrar por Rol (que es obligatorio)
      const userRol = Number(user.rol || user.perfil?.rol)
      if (Number(filters.rol) !== userRol) return false

      // 2. Filtrar por Distrito (opcional, en memoria)
      if (filters.distrito && user.distrito !== filters.distrito) return false

      // 3. Filtrar por Característica Curricular (opcional, en memoria)
      if (filters.caracteristicaCurricular && String(user.caracteristicaCurricular) !== filters.caracteristicaCurricular) return false

      // 4. Filtrar por Tipo de Gestión (opcional, en memoria)
      if (filters.tipoGestion && user.tipoGestion !== filters.tipoGestion) return false

      // 5. Filtrar por Área (opcional, en memoria)
      if (filters.area && Number(user.area) !== Number(filters.area)) return false

      // 6. Filtrar por Nivel de Institución (opcional, en memoria)
      if (filters.nivelDeInstitucion.length > 0) {
        const userNiveles = user.nivelDeInstitucion || []
        const hasLevel = filters.nivelDeInstitucion.some(nivel => userNiveles.includes(Number(nivel)))
        if (!hasLevel) return false
      }

      return true
    })

    // Filtrado secundario por término de búsqueda en memoria (DNI, nombres, apellidos, institución)
    if (localSearchQuery.trim()) {
      const q = localSearchQuery.toLowerCase().trim()
      results = results.filter(user => {
        const dni = (user.dni || '').toLowerCase()
        const nombres = (user.nombres || '').toLowerCase()
        const apellidos = (user.apellidos || '').toLowerCase()
        const institucion = (user.institucion || '').toLowerCase()

        return (
          dni.includes(q) ||
          nombres.includes(q) ||
          apellidos.includes(q) ||
          institucion.includes(q)
        )
      })
    }

    return results
  }

  // Filtrado local en memoria para búsqueda por DNI
  const getDniFilteredResults = () => {
    let results = dniResults

    if (localSearchQuery.trim()) {
      const q = localSearchQuery.toLowerCase().trim()
      results = results.filter(user => {
        const dni = (user.dni || '').toLowerCase()
        const nombres = (user.nombres || '').toLowerCase()
        const apellidos = (user.apellidos || '').toLowerCase()
        const institucion = (user.institucion || '').toLowerCase()

        return (
          dni.includes(q) ||
          nombres.includes(q) ||
          apellidos.includes(q) ||
          institucion.includes(q)
        )
      })
    }

    return results
  }

  const filteredResults = getFilteredResults()
  const filteredDniResults = getDniFilteredResults()

  // Helper local para convertir el array de nivelDeInstitucion a string
  const getNivelInstitucionTexto = (niveles: number[] | undefined): string => {
    if (!niveles || !Array.isArray(niveles)) return '—';
    return niveles
      .map(id => {
        const item = nivelInstitucion.find(n => n.id === id);
        return item ? item.name.charAt(0).toUpperCase() + item.name.slice(1) : '';
      })
      .filter(Boolean)
      .join(', ');
  };

  // Conteo de usuarios que coinciden únicamente con la búsqueda obligatoria (región + rol)
  const initialMatchesCount = isDniActive
    ? rawResults.length
    : rawResults.filter(user => {
        const userRol = Number(user.rol || user.perfil?.rol)
        return Number(filters.rol) === userRol
      }).length

  // Paginación local
  const totalPages = Math.ceil(filteredResults.length / pageSize)
  const paginatedResults = filteredResults.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
      setActiveActionMenuDni(null)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
      setActiveActionMenuDni(null)
    }
  }

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

  // Hook de efecto para búsqueda en tiempo real por DNI con Debouncing
  useEffect(() => {
    if (dniQuery.length >= 4) {
      setLoading(true)
      const delayDebounceFn = setTimeout(async () => {
        try {
          const pathRef = collection(db, 'usuarios')
          const q = query(
            pathRef,
            where('dni', '>=', dniQuery),
            where('dni', '<=', dniQuery + '\uf8ff'),
            limit(100)
          )
          const snapshot = await getDocs(q)
          const docs: User[] = []
          snapshot.forEach((docSnap) => {
            docs.push(docSnap.data() as User)
          })
          setDniResults(docs)
          setIsDniActive(true)
          setCurrentPage(1)

          // Scroll automático únicamente si llegó a la longitud máxima de 8 dígitos
          if (docs.length > 0 && dniQuery.length === 8) {
            setTimeout(() => {
              dniTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 100)
          }
        } catch (error) {
          console.error("Error searching by DNI:", error)
          toast.error("Error al buscar por DNI")
        } finally {
          setLoading(false)
        }
      }, 400) // 400ms debounce

      return () => clearTimeout(delayDebounceFn)
    } else {
      if (isDniActive) {
        setIsDniActive(false)
        setDniResults([])
        setCurrentPage(1)
      }
    }
  }, [dniQuery, db])

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

  // Cerrar menú de acciones al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!activeActionMenuDni) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        !target.closest('.user-action-dropdown-container') &&
        !target.closest('.user-action-dropdown-menu')
      ) {
        setActiveActionMenuDni(null)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveActionMenuDni(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeActionMenuDni])

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

  const searchDirectorByDni = async (dni: string) => {
    const trimmed = dni.trim()
    if (trimmed.length !== 8) {
      setDirectorInfo(null)
      return
    }
    setIsSearchingDirector(true)
    try {
      const userDocSnap = await getDoc(doc(db, 'usuarios', trimmed))
      if (userDocSnap.exists()) {
        const data = userDocSnap.data() as User
        const isDirector = Number(data.rol || data.perfil?.rol) === 2
        if (isDirector) {
          setDirectorInfo({
            nombres: data.nombres,
            apellidos: data.apellidos,
            institucion: data.institucion,
            exists: true,
          })
        } else {
          setDirectorInfo({ exists: false, notDirector: true })
        }
      } else {
        const qDir = query(collection(db, 'usuarios'), where('dni', '==', trimmed), limit(1))
        const qSnap = await getDocs(qDir)
        if (!qSnap.empty) {
          const data = qSnap.docs[0].data() as User
          const isDirector = Number(data.rol || data.perfil?.rol) === 2
          if (isDirector) {
            setDirectorInfo({
              nombres: data.nombres,
              apellidos: data.apellidos,
              institucion: data.institucion,
              exists: true,
            })
          } else {
            setDirectorInfo({ exists: false, notDirector: true })
          }
        } else {
          setDirectorInfo({ exists: false })
        }
      }
    } catch (err) {
      console.error('Error buscando director:', err)
      setDirectorInfo({ exists: false })
    } finally {
      setIsSearchingDirector(false)
    }
  }

  const handleOpenRoleModal = async (user: User) => {
    setUserForRoleChange(user)
    const currentRol = Number(user.rol || user.perfil?.rol || 3)
    const targetRol = currentRol === 2 ? 3 : 2
    setSelectedNewRole(targetRol)
    setShowRoleConfirmDialog(false)
    setShowRoleModal(true)
    setStudentCountNotice(null)

    // Opción A & B: Pre-cargar director anterior o actual si existe
    const prefillDirectorDni = user.dniDirectorAnterior || user.dniDirector || ''
    setDirectorDniInput(prefillDirectorDni)
    setDirectorInfo(null)
    if (prefillDirectorDni.length === 8) {
      searchDirectorByDni(prefillDirectorDni)
    }

    // Consultar estudiantes asociados si el usuario era docente
    if (currentRol === 3 && user.dni) {
      setCheckingStudents(true)
      try {
        const colRef = collection(db, 'usuarios', user.dni, 'estudiantes-docentes')
        const countSnap = await getCountFromServer(colRef)
        setStudentCountNotice(countSnap.data().count)
      } catch (e) {
        console.warn('No se pudo verificar estudiantes-docentes:', e)
        setStudentCountNotice(null)
      } finally {
        setCheckingStudents(false)
      }
    }
  }

  const handleConfirmRoleChange = async () => {
    if (!userForRoleChange || !userForRoleChange.dni) return
    if (selectedNewRole !== 2 && selectedNewRole !== 3) {
      toast.warning('Solo está habilitado el cambio de rol a Director o Docente')
      return
    }

    if (selectedNewRole === 3) {
      if (!directorDniInput.trim() || directorDniInput.trim().length !== 8) {
        toast.warning('Debe ingresar un DNI de Director válido (8 dígitos)')
        return
      }
      if (directorInfo && (!directorInfo.exists || directorInfo.notDirector)) {
        toast.error('El DNI ingresado no corresponde a un Director registrado')
        return
      }
    }

    setIsChangingRole(true)
    try {
      const res = await cambiarRolUsuario(
        userForRoleChange.dni,
        selectedNewRole,
        selectedNewRole === 3 ? directorDniInput.trim() : undefined
      )
      if (res.success) {
        toast.success(res.message || `Rol actualizado exitosamente a ${ROLES_TEXT[selectedNewRole] || selectedNewRole}`)
        
        // Actualizar el estado local para reflejar el cambio en las tablas sin recargar
        const updatedUser: User = {
          ...userForRoleChange,
          rol: selectedNewRole,
          perfil: {
            ...userForRoleChange.perfil,
            rol: selectedNewRole,
            nombre: selectedNewRole === 2 ? 'director' : selectedNewRole === 3 ? 'docente' : (selectedNewRole === 1 ? 'especialista' : selectedNewRole === 4 ? 'admin' : 'especialista regional')
          }
        }
        if (selectedNewRole === 2) {
          if (userForRoleChange.dniDirector) {
            updatedUser.dniDirectorAnterior = userForRoleChange.dniDirector
          }
          delete (updatedUser as any).dniDirector
        } else if (selectedNewRole === 3) {
          updatedUser.dniDirector = directorDniInput.trim()
          if (directorInfo?.institucion) {
            updatedUser.institucion = directorInfo.institucion
          }
        }

        setDniResults(prev => prev.map(u => u.dni === userForRoleChange.dni ? updatedUser : u))
        setRawResults(prev => prev.map(u => u.dni === userForRoleChange.dni ? updatedUser : u))
        
        setShowRoleConfirmDialog(false)
        setShowRoleModal(false)
        setUserForRoleChange(null)
      } else {
        toast.error(res.message || 'Error al cambiar de rol')
      }
    } catch (error: any) {
      console.error('Error al cambiar rol:', error)
      toast.error(error.message || 'Error al procesar el cambio de rol')
    } finally {
      setIsChangingRole(false)
    }
  }

  const searchPredecessorByDni = async (dniToSearch: string) => {
    const cleanDni = dniToSearch.trim()
    if (!cleanDni || cleanDni.length < 8) {
      setPredecessorInfo(null)
      return
    }
    if (directorForPredecessor && cleanDni === directorForPredecessor.dni) {
      setPredecessorInfo({ exists: false, notDirector: false })
      toast.warning('No puedes asignar al mismo director como su propio predecesor.')
      return
    }
    setIsSearchingPredecessor(true)
    try {
      let foundUser: any = null
      const directDocRef = doc(db, 'usuarios', cleanDni)
      const directSnap = await getDoc(directDocRef)
      if (directSnap.exists()) {
        foundUser = directSnap.data()
      } else {
        const qDni = query(collection(db, 'usuarios'), where('dni', '==', cleanDni), limit(1))
        const qSnap = await getDocs(qDni)
        if (!qSnap.empty) {
          foundUser = qSnap.docs[0].data()
        }
      }

      if (foundUser) {
        setPredecessorInfo({
          nombres: foundUser.nombres,
          apellidos: foundUser.apellidos,
          institucion: foundUser.institucion,
          exists: true,
          notDirector: Number(foundUser.rol || foundUser.perfil?.rol) !== 2 && Number(foundUser.rol || foundUser.perfil?.rol) !== 3
        })
      } else {
        setPredecessorInfo({ exists: false })
      }
    } catch (err) {
      console.error('Error al buscar director predecesor:', err)
      setPredecessorInfo({ exists: false })
    } finally {
      setIsSearchingPredecessor(false)
    }
  }

  const handleOpenPredecessorModal = (user: User) => {
    setDirectorForPredecessor(user)
    setPredecessorDniInput('')
    setPredecessorInfo(null)
    setPredecessorDniToUnlink('')
    setShowUnlinkConfirmDialog(false)
    setShowPredecessorModal(true)
  }

  const handleSavePredecessor = async () => {
    if (!directorForPredecessor?.dni) return
    const cleanDni = predecessorDniInput.trim()
    if (!cleanDni || cleanDni.length !== 8) {
      toast.warning('Por favor ingresa un DNI válido de 8 dígitos.')
      return
    }
    if (cleanDni === directorForPredecessor.dni) {
      toast.error('El director predecesor no puede ser el mismo director actual.')
      return
    }
    setIsSavingPredecessor(true)
    const result = await vincularDirectorPredecesor(directorForPredecessor.dni, cleanDni)
    setIsSavingPredecessor(false)
    if (result.success) {
      toast.success(result.message)
      const updateList = (list: User[]) =>
        list.map(u => {
          if (u.dni === directorForPredecessor.dni) {
            const currentList = Array.isArray(u.directoresPredecesores) ? u.directoresPredecesores : []
            const updatedPreds = Array.from(new Set([...currentList, cleanDni]))
            return {
              ...u,
              dniDirectorPredecesor: cleanDni,
              directoresPredecesores: updatedPreds,
            }
          }
          return u
        })
      setRawResults(prev => updateList(prev))
      setDniResults(prev => updateList(prev))
      setDirectorForPredecessor(prev => {
        if (!prev) return null
        const currentList = Array.isArray(prev.directoresPredecesores) ? prev.directoresPredecesores : []
        const updatedPreds = Array.from(new Set([...currentList, cleanDni]))
        return {
          ...prev,
          dniDirectorPredecesor: cleanDni,
          directoresPredecesores: updatedPreds,
        }
      })
      setPredecessorDniInput('')
      setPredecessorInfo(null)
    } else {
      toast.error(result.message)
    }
  }

  const handleConfirmUnlinkPredecessor = async () => {
    if (!directorForPredecessor?.dni) return
    const targetDni = predecessorDniToUnlink || directorForPredecessor.dniDirectorPredecesor || ''
    if (!targetDni) {
      toast.error('No se identificó el DNI del predecesor a desvincular.')
      return
    }
    setIsSavingPredecessor(true)
    const result = await desvincularDirectorPredecesor(directorForPredecessor.dni, targetDni)
    setIsSavingPredecessor(false)
    setShowUnlinkConfirmDialog(false)
    if (result.success) {
      toast.success(result.message)
      const updateList = (list: User[]) =>
        list.map(u => {
          if (u.dni === directorForPredecessor.dni) {
            const updatedPreds = (u.directoresPredecesores || []).filter(d => d !== targetDni)
            const newActive = u.dniDirectorPredecesor === targetDni
              ? (updatedPreds.length > 0 ? updatedPreds[updatedPreds.length - 1] : undefined)
              : u.dniDirectorPredecesor
            return {
              ...u,
              directoresPredecesores: updatedPreds,
              dniDirectorPredecesor: newActive,
            }
          }
          return u
        })
      setRawResults(prev => updateList(prev))
      setDniResults(prev => updateList(prev))
      setDirectorForPredecessor(prev => {
        if (!prev) return null
        const updatedPreds = (prev.directoresPredecesores || []).filter(d => d !== targetDni)
        const newActive = prev.dniDirectorPredecesor === targetDni
          ? (updatedPreds.length > 0 ? updatedPreds[updatedPreds.length - 1] : undefined)
          : prev.dniDirectorPredecesor
        return {
          ...prev,
          directoresPredecesores: updatedPreds,
          dniDirectorPredecesor: newActive,
        }
      })
      setPredecessorDniToUnlink('')
    } else {
      toast.error(result.message)
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
            {/* Filters Section */}
            <div className="space-y-6">
              {/* Búsqueda por DNI Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <RiSearchLine className="text-lg text-blue-600" />
                    <span className="font-bold text-sm">Búsqueda Directa por DNI</span>
                  </div>
                  {dniQuery && (
                    <button
                      onClick={clearDniSearch}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 font-semibold transition-colors"
                    >
                      <RiCloseLine className="text-sm" />
                      Limpiar DNI
                    </button>
                  )}
                </div>

                <div className="max-w-md space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Número de DNI</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={dniQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*$/.test(val) && val.length <= 8) {
                          setDniQuery(val);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && filteredDniResults.length > 0) {
                          dniTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                      }}
                      placeholder="Ingrese al menos 4 dígitos para buscar..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-700 text-sm bg-white"
                    />
                    <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                  </div>
                  {dniQuery.length > 0 && dniQuery.length < 4 && (
                    <span className="text-xs text-amber-600 font-medium block mt-1">
                      Escriba al menos 4 dígitos (faltan {4 - dniQuery.length})
                    </span>
                  )}
                  {loading && dniQuery.length >= 4 && (
                    <span className="text-xs text-blue-600 animate-pulse font-medium block mt-1">
                      Buscando coincidencias de DNI...
                    </span>
                  )}
                </div>
              </div>

              {/* Tabla de Resultados por DNI */}
              {isDniActive && (
                <div ref={dniTableRef} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RiSearchLine className="text-lg text-blue-600" />
                      <span className="font-bold text-slate-800 text-sm">Resultados de la Búsqueda por DNI</span>
                    </div>
                    <span className="text-xs text-slate-500 font-semibold">
                      Se encontraron <strong className="text-slate-800 font-bold">{filteredDniResults.length}</strong> coincidencias.
                    </span>
                  </div>
                  {loading ? (
                    <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-4">
                      <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div>
                      <span className="font-medium animate-pulse">Buscando usuarios...</span>
                    </div>
                  ) : filteredDniResults.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold text-sm">
                            <th className="p-4 pl-6 min-w-[170px]">Usuario</th>
                            <th className="p-4">DNI</th>
                            <th className="p-4">Rol</th>
                            <th className="p-4">Región</th>
                            <th className="p-4">Distrito</th>
                            <th className="p-4">Tipo</th>
                            <th className="p-4">Gestión</th>
                            <th className="p-4">Área</th>
                            <th className="p-4">Nivel</th>
                            <th className="p-4">Correo Electrónico</th>
                            <th className="p-4 pr-6 text-center w-[120px]">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {filteredDniResults.map((user, index) => (
                            <tr key={user.dni} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 pl-6 min-w-[170px] max-w-[260px]">
                                <div style={{ containerType: 'inline-size' }} className="w-full">
                                  <div
                                    className="font-semibold text-slate-800 capitalize leading-snug break-words text-xs sm:text-xs md:text-sm"
                                    style={{
                                      fontSize: 'clamp(0.72rem, 5.5cqi, 0.875rem)',
                                    }}
                                    title={formatNombreCapitalize(user.nombres, user.apellidos)}
                                  >
                                    {formatNombreCapitalize(user.nombres, user.apellidos)}
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    {user.celular || 'Sin celular'}
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
                                {Number(user.rol || user.perfil?.rol) === 2 && (user.dniDirectorPredecesor || (Array.isArray(user.directoresPredecesores) && user.directoresPredecesores.length > 0)) && (
                                  <div className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-md mt-1 border border-emerald-200/50" title={`Hereda evaluaciones de DNI: ${user.dniDirectorPredecesor || user.directoresPredecesores?.join(', ')}`}>
                                    <RiHistoryLine className="text-xs shrink-0" />
                                    <span>Predecesor: {user.dniDirectorPredecesor || user.directoresPredecesores?.join(', ')}</span>
                                  </div>
                                )}
                              </td>
                              <td className="p-4 text-sm text-slate-500">
                                {user.region ? regionTexto(String(user.region)) : '—'}
                              </td>
                              <td className="p-4 text-sm text-slate-550">
                                {user.distrito || '—'}
                              </td>
                              <td className="p-4 text-sm text-slate-550">
                                {getCaracteristicasDirectivoTexto(user.caracteristicaCurricular) || '—'}
                              </td>
                              <td className="p-4 text-sm text-slate-550">
                                {user.tipoGestion ? user.tipoGestion.charAt(0).toUpperCase() + user.tipoGestion.slice(1) : '—'}
                              </td>
                              <td className="p-4 text-sm text-slate-550">
                                {getAreaTexto(user.area) || '—'}
                              </td>
                              <td className="p-4 text-sm text-slate-550">
                                {getNivelInstitucionTexto(user.nivelDeInstitucion)}
                              </td>
                              <td className="p-4 text-sm text-slate-500">
                                {user.email || `${user.dni}@competencelab.com`}
                              </td>
                              <td className="p-4 pr-6 text-center w-[120px]">
                                <UserActionsDropdown
                                  user={user}
                                  isOpen={activeActionMenuDni === user.dni}
                                  onToggle={() => setActiveActionMenuDni(prev => prev === user.dni ? null : (user.dni || null))}
                                  onClose={() => setActiveActionMenuDni(null)}
                                  onAudit={() => {
                                    setActiveActionMenuDni(null)
                                    handleStartAudit(user)
                                  }}
                                  onRoleChange={() => {
                                    setActiveActionMenuDni(null)
                                    handleOpenRoleModal(user)
                                  }}
                                  onResetPassword={() => {
                                    setActiveActionMenuDni(null)
                                    handleOpenResetModal(user)
                                  }}
                                  onAssignPredecessor={() => {
                                    setActiveActionMenuDni(null)
                                    handleOpenPredecessorModal(user)
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-400">
                      <RiUserLine className="mx-auto text-4xl mb-3 text-slate-300" />
                      <p className="font-medium">No se encontraron usuarios que coincidan con el DNI especificado.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Mandatory Filters Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <RiFilter3Line className="text-lg text-blue-600" />
                    <span className="font-bold text-sm">Búsqueda Inicial (Requerido)</span>
                  </div>
                  {hasSearched && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 font-semibold transition-colors"
                    >
                      <RiCloseLine className="text-sm" />
                      Limpiar todo
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Region / UGEL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">UGEL / Región *</label>
                    <select
                      value={filters.region}
                      onChange={(e) => {
                        handleFilterChange('region', e.target.value);
                        if (hasSearched) {
                          // Si ya se había buscado, al cambiar los mandatorios reseteamos la búsqueda
                          setRawResults([]);
                          setHasSearched(false);
                        }
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-700 text-sm bg-white"
                    >
                      <option value="">Seleccione una región</option>
                      {regiones.map(r => (
                        <option key={r.id} value={r.id}>{r.region}</option>
                      ))}
                    </select>
                  </div>

                  {/* Rol */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol *</label>
                    <select
                      value={filters.rol}
                      onChange={(e) => {
                        handleFilterChange('rol', e.target.value);
                        if (hasSearched) {
                          // Cambiar rol de búsqueda inicial
                          setRawResults([]);
                          setHasSearched(false);
                        }
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-700 text-sm bg-white"
                    >
                      <option value="">Seleccione un rol</option>
                      {Object.entries(ROLES_TEXT).map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Buscar Button */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSearch}
                    disabled={loading || !filters.region || !filters.rol}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <RiSearchLine className="text-sm" />
                        Buscar Usuarios
                      </>
                    )}
                  </button>
                  {hasSearched && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
                        ✓ Datos cargados en memoria
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">
                        {isDniActive ? (
                          <>Se encontraron <strong className="text-slate-800 font-bold">{rawResults.length}</strong> usuarios que coinciden con el DNI.</>
                        ) : (
                          <>Se encontraron <strong className="text-slate-800 font-bold">{initialMatchesCount}</strong> usuarios que coinciden con Región y Rol.</>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Secondary Filters Card (Only renders after first search) */}
              {hasSearched && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 text-slate-700 border-b border-slate-50 pb-2">
                    <RiFilterLine className="text-lg text-indigo-600" />
                    <span className="font-bold text-sm">Filtros Secundarios (Instantáneos en Memoria)</span>
                  </div>

                  {/* Buscador rápido en memoria */}
                  <div className="space-y-1.5 border-b border-slate-100 pb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Buscador Rápido (Nombres, Apellidos, DNI, Institución)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={localSearchQuery}
                        onChange={(e) => setLocalSearchQuery(e.target.value)}
                        placeholder="Escriba para filtrar instantáneamente..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-700 text-sm bg-white"
                      />
                      <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Distrito */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Distrito</label>
                      <select
                        value={filters.distrito}
                        onChange={(e) => handleFilterChange('distrito', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-700 text-sm bg-white"
                      >
                        <option value="">Todos los distritos</option>
                        {distritosDisponibles.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    {/* Caracteristica Curricular */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Característica Curricular</label>
                      <select
                        value={filters.caracteristicaCurricular}
                        onChange={(e) => handleFilterChange('caracteristicaCurricular', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-700 text-sm bg-white"
                      >
                        <option value="">Todas</option>
                        {caracteristicasDirectivo.map(c => (
                          <option key={c.id} value={String(c.id)}>{c.name.charAt(0).toUpperCase() + c.name.slice(1)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Tipo de Gestion */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo de Gestión</label>
                      <select
                        value={filters.tipoGestion}
                        onChange={(e) => handleFilterChange('tipoGestion', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-700 text-sm bg-white"
                      >
                        <option value="">Todos</option>
                        <option value="publico">Público</option>
                        <option value="privado">Privado</option>
                      </select>
                    </div>

                    {/* Area */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Área</label>
                      <select
                        value={filters.area}
                        onChange={(e) => handleFilterChange('area', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-700 text-sm bg-white"
                      >
                        <option value="">Todas</option>
                        {area.map(a => (
                          <option key={a.id} value={a.id}>{a.name.charAt(0).toUpperCase() + a.name.slice(1)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Nivel de Institucion - Checkboxes */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nivel de Institución</label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {nivelInstitucion.map(n => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => handleNivelToggle(String(n.id))}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                              filters.nivelDeInstitucion.includes(String(n.id))
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                            }`}
                          >
                            {n.name.charAt(0).toUpperCase() + n.name.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* Tabla de Resultados General */}
            {hasSearched && (
              <div ref={generalTableRef} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RiFilterLine className="text-lg text-indigo-600" />
                    <span className="font-bold text-slate-800 text-sm">Resultados de la Búsqueda General (UGEL y Rol)</span>
                  </div>
                </div>
                {loading ? (
                  <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-4">
                    <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div>
                    <span className="font-medium animate-pulse">Buscando usuarios...</span>
                  </div>
                ) : paginatedResults.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold text-sm">
                            <th className="p-4 pl-6 min-w-[170px]">Usuario</th>
                            <th className="p-4">DNI</th>
                            <th className="p-4">Rol</th>
                            <th className="p-4">Región</th>
                            <th className="p-4">Distrito</th>
                            <th className="p-4">Tipo</th>
                            <th className="p-4">Gestión</th>
                            <th className="p-4">Área</th>
                            <th className="p-4">Nivel</th>
                            <th className="p-4">Correo Electrónico</th>
                            <th className="p-4 pr-6 text-center w-[120px]">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {paginatedResults.map((user, index) => (
                            <tr key={user.dni} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 pl-6 min-w-[170px] max-w-[260px]">
                                <div style={{ containerType: 'inline-size' }} className="w-full">
                                  <div
                                    className="font-semibold text-slate-800 capitalize leading-snug break-words text-xs sm:text-xs md:text-sm"
                                    style={{
                                      fontSize: 'clamp(0.72rem, 5.5cqi, 0.875rem)',
                                    }}
                                    title={formatNombreCapitalize(user.nombres, user.apellidos)}
                                  >
                                    {formatNombreCapitalize(user.nombres, user.apellidos)}
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    {user.celular || 'Sin celular'}
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
                                {Number(user.rol || user.perfil?.rol) === 2 && (user.dniDirectorPredecesor || (Array.isArray(user.directoresPredecesores) && user.directoresPredecesores.length > 0)) && (
                                  <div className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-md mt-1 border border-emerald-200/50" title={`Hereda evaluaciones de DNI: ${user.dniDirectorPredecesor || user.directoresPredecesores?.join(', ')}`}>
                                    <RiHistoryLine className="text-xs shrink-0" />
                                    <span>Predecesor: {user.dniDirectorPredecesor || user.directoresPredecesores?.join(', ')}</span>
                                  </div>
                                )}
                              </td>
                              <td className="p-4 text-sm text-slate-500">
                                {user.region ? regionTexto(String(user.region)) : '—'}
                              </td>
                              <td className="p-4 text-sm text-slate-550">
                                {user.distrito || '—'}
                              </td>
                              <td className="p-4 text-sm text-slate-550">
                                {getCaracteristicasDirectivoTexto(user.caracteristicaCurricular) || '—'}
                              </td>
                              <td className="p-4 text-sm text-slate-550">
                                {user.tipoGestion ? user.tipoGestion.charAt(0).toUpperCase() + user.tipoGestion.slice(1) : '—'}
                              </td>
                              <td className="p-4 text-sm text-slate-550">
                                {getAreaTexto(user.area) || '—'}
                              </td>
                              <td className="p-4 text-sm text-slate-550">
                                {getNivelInstitucionTexto(user.nivelDeInstitucion)}
                              </td>
                              <td className="p-4 text-sm text-slate-500">
                                {user.email || `${user.dni}@competencelab.com`}
                              </td>
                              <td className="p-4 pr-6 text-center w-[120px]">
                                <UserActionsDropdown
                                  user={user}
                                  isOpen={activeActionMenuDni === user.dni}
                                  onToggle={() => setActiveActionMenuDni(prev => prev === user.dni ? null : (user.dni || null))}
                                  onClose={() => setActiveActionMenuDni(null)}
                                  onAudit={() => {
                                    setActiveActionMenuDni(null)
                                    handleStartAudit(user)
                                  }}
                                  onRoleChange={() => {
                                    setActiveActionMenuDni(null)
                                    handleOpenRoleModal(user)
                                  }}
                                  onResetPassword={() => {
                                    setActiveActionMenuDni(null)
                                    handleOpenResetModal(user)
                                  }}
                                  onAssignPredecessor={() => {
                                    setActiveActionMenuDni(null)
                                    handleOpenPredecessorModal(user)
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {filteredResults.length > 0 && (
                      <div className="bg-slate-50 border-t border-slate-100 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="text-xs text-slate-500 font-medium">
                            Página {currentPage} de {totalPages || 1} — Mostrando {paginatedResults.length} de {filteredResults.length}
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Mostrar:</span>
                            <select
                              value={pageSize}
                              onChange={e => {
                                setPageSize(Number(e.target.value))
                                setCurrentPage(1)
                              }}
                              className="px-2.5 py-1 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-sm hover:border-slate-300"
                            >
                              <option value={50}>50 filas</option>
                              <option value={100}>100 filas</option>
                              <option value={200}>200 filas</option>
                            </select>
                          </div>
                        </div>

                        {totalPages > 1 && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handlePrevPage}
                              disabled={currentPage <= 1}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-slate-200 disabled:hover:text-slate-600"
                            >
                              <RiArrowLeftSLine className="text-sm" />
                              Anterior
                            </button>
                            <span className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg min-w-[32px] text-center">
                              {currentPage}
                            </span>
                            <button
                              onClick={handleNextPage}
                              disabled={currentPage >= totalPages}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-slate-200 disabled:hover:text-slate-600"
                            >
                              Siguiente
                              <RiArrowRightSLine className="text-sm" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : hasSearched ? (
                  <div className="p-12 text-center text-slate-400">
                    <RiUserLine className="mx-auto text-4xl mb-3 text-slate-300" />
                    <p className="font-medium">No se encontraron usuarios con los filtros seleccionados.</p>
                    <p className="text-sm text-slate-400 mt-1">Intente con una combinación diferente de filtros.</p>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <RiFilterLine className="mx-auto text-4xl mb-3 text-slate-300" />
                    <p className="font-medium">Seleccione filtros y presione &quot;Buscar Usuarios&quot;.</p>
                    <p className="text-sm text-slate-400 mt-1">Use los filtros de arriba para encontrar usuarios por región, rol, área y más.</p>
                  </div>
                )}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
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

      {/* Modal Cambiar Rol de Usuario */}
      {showRoleModal && userForRoleChange && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full max-h-[min(90vh,620px)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg shrink-0 shadow-sm shadow-purple-500/10">
                  <RiShieldUserLine />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 leading-tight">Cambiar Rol de Usuario</h3>
                  <p className="text-xs text-slate-500 truncate max-w-[300px] sm:max-w-[360px]">
                    {formatNombreCapitalize(userForRoleChange.nombres, userForRoleChange.apellidos)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowRoleModal(false); setShowRoleConfirmDialog(false); setUserForRoleChange(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
                disabled={isChangingRole}
                title="Cerrar modal"
              >
                <RiCloseLine className="text-xl" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
              {/* Ficha Resumen del Usuario */}
              <div className="bg-slate-50/90 border border-slate-200/70 rounded-xl p-3 text-xs grid grid-cols-2 gap-x-4 gap-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">DNI:</span>
                  <span className="font-mono font-bold text-slate-700">{userForRoleChange.dni}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Rol Actual:</span>
                  <span className="font-bold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 text-[11px]">
                    {ROLES_TEXT[Number(userForRoleChange.rol || userForRoleChange.perfil?.rol)] || 'Desconocido'}
                  </span>
                </div>
                {userForRoleChange.institucion && (
                  <div className="flex items-center justify-between col-span-2 border-t border-slate-200/40 pt-1">
                    <span className="text-slate-400 font-medium">Institución:</span>
                    <span className="font-medium text-slate-700 truncate max-w-[280px] sm:max-w-[320px]">{userForRoleChange.institucion}</span>
                  </div>
                )}
                {userForRoleChange.region && (
                  <div className="flex items-center justify-between col-span-2 border-t border-slate-200/40 pt-1">
                    <span className="text-slate-400 font-medium">UGEL / Región:</span>
                    <span className="font-medium text-slate-700">{regionTexto(String(userForRoleChange.region))}</span>
                  </div>
                )}
              </div>

              {/* Selector de Nuevo Rol */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Seleccionar Nuevo Rol
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 2, label: 'Director', desc: 'Gestión institucional y docentes' },
                    { id: 3, label: 'Docente', desc: 'Aulas, estudiantes y evaluaciones' },
                    { id: 1, label: 'Especialista', desc: 'Monitoreo de UGEL' },
                    { id: 4, label: 'Administrador', desc: 'Control global del portal' },
                  ].map((r) => {
                    const isSelected = selectedNewRole === r.id
                    const isCurrent = Number(userForRoleChange.rol || userForRoleChange.perfil?.rol) === r.id
                    const isAllowed = r.id === 2 || r.id === 3 // Director y Docente habilitados

                    return (
                      <button
                        type="button"
                        key={r.id}
                        disabled={!isAllowed || isChangingRole}
                        onClick={() => {
                          if (isAllowed) setSelectedNewRole(r.id)
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          !isAllowed
                            ? 'border-slate-200/50 bg-slate-100/60 opacity-40 cursor-not-allowed select-none'
                            : isSelected
                            ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-500/20 shadow-xs'
                            : 'border-slate-200/80 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${
                            !isAllowed ? 'text-slate-400' : isSelected ? 'text-purple-700' : 'text-slate-700'
                          }`}>
                            {r.label}
                          </span>
                          {isCurrent ? (
                            <span className="text-[9px] bg-slate-200/80 text-slate-500 px-1.5 py-0.5 rounded font-semibold">
                              Actual
                            </span>
                          ) : !isAllowed ? (
                            <span className="text-[9px] bg-slate-200/50 text-slate-400 px-1.5 py-0.5 rounded font-medium">
                              Deshabilitado
                            </span>
                          ) : null}
                        </div>
                        <p className={`text-[10px] mt-0.5 leading-snug line-clamp-1 ${!isAllowed ? 'text-slate-300' : 'text-slate-400'}`}>
                          {r.desc}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Opción B: Input de Director Asignado cuando se selecciona Docente */}
              {selectedNewRole === 3 && (
                <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span>DNI del Director Asignado</span>
                      <span className="text-red-500">*</span>
                    </label>
                    {userForRoleChange.dniDirectorAnterior && userForRoleChange.dniDirectorAnterior !== directorDniInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setDirectorDniInput(userForRoleChange.dniDirectorAnterior!)
                          searchDirectorByDni(userForRoleChange.dniDirectorAnterior!)
                        }}
                        className="text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1"
                        title="Restaurar el director que tenía antes este docente"
                      >
                        <span>Restaurar anterior ({userForRoleChange.dniDirectorAnterior})</span>
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      maxLength={8}
                      value={directorDniInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 8)
                        setDirectorDniInput(val)
                        searchDirectorByDni(val)
                      }}
                      placeholder="Ingrese el DNI del Director (8 dígitos)"
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    />
                    {isSearchingDirector && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-3.5 h-3.5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  {/* Feedback en vivo del Director */}
                  {directorInfo?.exists ? (
                    <div className="text-[11px] bg-emerald-50/90 border border-emerald-200/80 rounded-lg p-2.5 text-emerald-800 flex items-start gap-2">
                      <RiCheckLine className="text-base text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold leading-tight">
                          {formatNombreCapitalize(directorInfo.nombres, directorInfo.apellidos)}
                        </p>
                        {directorInfo.institucion && (
                          <p className="text-[10px] text-emerald-700/80 mt-0.5">
                            I.E. {directorInfo.institucion}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : directorInfo?.notDirector ? (
                    <div className="text-[11px] bg-amber-50/90 border border-amber-200/80 rounded-lg p-2 text-amber-800 flex items-center gap-2">
                      <RiAlertLine className="text-base text-amber-600 shrink-0" />
                      <span>El usuario con DNI {directorDniInput} no tiene rol de Director.</span>
                    </div>
                  ) : directorInfo && !directorInfo.exists && directorDniInput.length === 8 ? (
                    <div className="text-[11px] bg-rose-50/90 border border-rose-200/80 rounded-lg p-2 text-rose-800 flex items-center gap-2">
                      <RiAlertLine className="text-base text-rose-600 shrink-0" />
                      <span>No se encontró ningún director registrado con el DNI {directorDniInput}.</span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 leading-snug">
                      Ingresa el DNI del Director para vincular a este docente con su institución educativa.
                    </p>
                  )}
                </div>
              )}

              {/* Notificaciones / Advertencias del cambio */}
              <div className="space-y-2">
                {selectedNewRole === 2 && (
                  <div className="text-[11px] text-purple-700 font-medium bg-purple-50/80 p-2.5 rounded-xl border border-purple-150 leading-relaxed">
                    ✨ <strong>Restauración a Director (Opción A):</strong> Se desvinculará la referencia a <code className="font-mono font-bold">dniDirector</code> y se respaldará en <code className="font-mono font-bold">dniDirectorAnterior</code>. Sus docentes y reportes se sincronizarán con sus privilegios directivos.
                  </div>
                )}

                {selectedNewRole === 3 && (
                  <div className="text-[11px] text-blue-700 font-medium bg-blue-50/80 p-2.5 rounded-xl border border-blue-150 leading-relaxed">
                    📘 <strong>Reversión a Docente (Opción B):</strong> Se vinculará al docente con el Director indicado. Sus aulas, estudiantes y evaluaciones se mantendrán intactos.
                  </div>
                )}

                {checkingStudents ? (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 p-2 bg-slate-50 rounded-lg border border-slate-150">
                    <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-purple-600 rounded-full animate-spin"></div>
                    <span>Verificando historial de estudiantes asociados...</span>
                  </div>
                ) : studentCountNotice !== null && studentCountNotice > 0 ? (
                  <div className="text-[11px] text-blue-700 font-medium bg-blue-50/70 p-2.5 rounded-xl border border-blue-100">
                    ℹ️ <strong>Historial detectado:</strong> Posee <strong>{studentCountNotice}</strong> estudiante(s) registrado(s). Sus registros no se eliminarán y permanecerán a salvo.
                  </div>
                ) : null}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => { setShowRoleModal(false); setShowRoleConfirmDialog(false); setUserForRoleChange(null); }}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/60 text-xs font-semibold transition-colors"
                disabled={isChangingRole}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setShowRoleConfirmDialog(true)}
                disabled={
                  isChangingRole ||
                  selectedNewRole === Number(userForRoleChange.rol || userForRoleChange.perfil?.rol) ||
                  (selectedNewRole === 3 && (!directorDniInput.trim() || directorDniInput.trim().length !== 8 || !directorInfo?.exists))
                }
                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  selectedNewRole === Number(userForRoleChange.rol || userForRoleChange.perfil?.rol) ||
                  (selectedNewRole === 3 && (!directorDniInput.trim() || directorDniInput.trim().length !== 8 || !directorInfo?.exists))
                    ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                    : 'bg-purple-600 hover:bg-purple-700 hover:shadow-md hover:shadow-purple-600/20 active:scale-[0.98]'
                }`}
              >
                <RiShieldUserLine className="text-sm" />
                Confirmar Cambio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Secundario de Confirmación para Cambio de Rol */}
      {showRoleConfirmDialog && userForRoleChange && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-3xl mx-auto shadow-sm shadow-purple-500/10">
                <RiShieldUserLine />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800">
                  {selectedNewRole === 2 ? '¿Confirmar cambio a Director?' : '¿Confirmar cambio a Docente?'}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  ¿Estás seguro de que deseas cambiar el rol del usuario{' '}
                  <strong className="text-slate-800 font-semibold">
                    {formatNombreCapitalize(userForRoleChange.nombres, userForRoleChange.apellidos)}
                  </strong>{' '}
                  (DNI: <span className="font-mono font-bold text-purple-700">{userForRoleChange.dni}</span>) al rol de{' '}
                  <strong className="text-purple-700 font-bold">{ROLES_TEXT[selectedNewRole]}</strong>?
                </p>

                {selectedNewRole === 2 ? (
                  <div className="bg-purple-50/80 border border-purple-100/90 rounded-xl p-3 text-left text-xs text-purple-800 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <span>✨</span> Modificación de privilegios:
                    </p>
                    <ul className="list-disc list-inside text-[11px] text-purple-700/90 pl-1 space-y-0.5">
                      <li>Se actualizarán sus credenciales y permisos a Director.</li>
                      <li>Se respaldará el director previo en <code className="font-mono font-bold">dniDirectorAnterior</code>.</li>
                      <li>Sus estudiantes y evaluaciones permanecerán seguros.</li>
                    </ul>
                  </div>
                ) : (
                  <div className="bg-blue-50/80 border border-blue-100/90 rounded-xl p-3 text-left text-xs text-blue-800 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <span>📘</span> Director asignado:
                    </p>
                    <div className="text-[11px] text-blue-900 bg-white/70 border border-blue-200/50 rounded-lg p-2 mt-1 space-y-0.5 font-medium">
                      <p>
                        <strong>Director:</strong> {formatNombreCapitalize(directorInfo?.nombres, directorInfo?.apellidos)}
                      </p>
                      <p>
                        <strong>DNI:</strong> <span className="font-mono">{directorDniInput}</span>
                      </p>
                      {directorInfo?.institucion && (
                        <p>
                          <strong>Institución:</strong> I.E. {directorInfo.institucion}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRoleConfirmDialog(false)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200/60 text-xs sm:text-sm font-semibold transition-colors"
                disabled={isChangingRole}
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmRoleChange}
                disabled={isChangingRole}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold transition-all hover:shadow-lg hover:shadow-purple-600/20 active:scale-[0.98] flex items-center gap-2"
              >
                {isChangingRole ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Cambiando rol...
                  </>
                ) : (
                  <>
                    <RiShieldUserLine className="text-base" />
                    {selectedNewRole === 2 ? 'Sí, cambiar a Director' : 'Sí, cambiar a Docente'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Vincular Director Predecesor */}
      {showPredecessorModal && directorForPredecessor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                  <RiHistoryLine />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base sm:text-lg leading-tight">
                    Director Predecesor
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Heredar y cerrar ciclo de evaluaciones anuales
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPredecessorModal(false)
                  setDirectorForPredecessor(null)
                }}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <RiCloseLine className="text-xl" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Resumen del Director Actual */}
              <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Director Titular (Entrante)
                </span>
                <div className="font-semibold text-slate-800 text-sm">
                  {formatNombreCapitalize(directorForPredecessor.nombres, directorForPredecessor.apellidos)}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>DNI: <strong className="font-mono text-slate-700">{directorForPredecessor.dni}</strong></span>
                  {directorForPredecessor.institucion && (
                    <>
                      <span>•</span>
                      <span>I.E.: <strong className="text-slate-700">{directorForPredecessor.institucion}</strong></span>
                    </>
                  )}
                </div>
              </div>

              {/* Explicación didáctica */}
              <div className="text-[11px] text-emerald-800 bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-3 leading-relaxed">
                💡 <strong>Cierre de Ciclo Escolar:</strong> Permite que este director unifique bajo su panel los resultados de etapas previas (ej. <strong>EDI</strong> y <strong>EP1</strong>) registrados por el director saliente, complementándolos con los que aplique (ej. <strong>EP2</strong>) para ver los reportes longitudinales completos.
              </div>

              {/* Predecesores vinculados actualmente */}
              {(() => {
                const linkedPredecessors = Array.from(
                  new Set([
                    ...(directorForPredecessor.dniDirectorPredecesor ? [directorForPredecessor.dniDirectorPredecesor] : []),
                    ...(Array.isArray(directorForPredecessor.directoresPredecesores) ? directorForPredecessor.directoresPredecesores : []),
                  ])
                ).filter(Boolean)

                if (linkedPredecessors.length === 0) return null

                return (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <RiLinkM className="text-sm text-amber-600" />
                      <span>{linkedPredecessors.length === 1 ? 'Predecesor vinculado actualmente:' : 'Predecesores vinculados actualmente:'}</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {linkedPredecessors.map(predDni => (
                        <div
                          key={predDni}
                          className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-3 flex items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5">
                            <div className="text-xs text-amber-800 font-mono flex items-center gap-2">
                              <span>DNI: <strong>{predDni}</strong></span>
                              {predDni === directorForPredecessor.dniDirectorPredecesor && (
                                <span className="text-[10px] bg-amber-200/70 text-amber-900 font-sans font-medium px-2 py-0.5 rounded-md">
                                  Activo
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPredecessorDniToUnlink(predDni)
                              setShowUnlinkConfirmDialog(true)
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 transition-colors flex items-center gap-1 shadow-xs shrink-0"
                          >
                            <RiLinkUnlinkM className="text-xs" />
                            <span>Desvincular</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Input DNI del Predecesor */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  DNI del Director Saliente (Predecesor):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={8}
                    value={predecessorDniInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '')
                      setPredecessorDniInput(val)
                      if (val.length === 8) {
                        searchPredecessorByDni(val)
                      } else {
                        setPredecessorInfo(null)
                      }
                    }}
                    placeholder="Ej. 12345678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  {isSearchingPredecessor && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                {/* Previsualización del predecesor encontrado */}
                {predecessorInfo && predecessorInfo.exists ? (
                  <div className="text-xs bg-emerald-50/80 border border-emerald-200/70 rounded-xl p-3 text-emerald-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                      <RiCheckLine className="text-base text-emerald-600" />
                      <span>Director Predecesor Identificado:</span>
                    </div>
                    <p className="font-semibold text-sm">
                      {formatNombreCapitalize(predecessorInfo.nombres, predecessorInfo.apellidos)}
                    </p>
                    {predecessorInfo.institucion && (
                      <p className="text-[11px] text-emerald-700">
                        I.E. {predecessorInfo.institucion}
                      </p>
                    )}
                  </div>
                ) : predecessorInfo && !predecessorInfo.exists && predecessorDniInput.length === 8 ? (
                  <div className="text-[11px] bg-rose-50/90 border border-rose-200/80 rounded-lg p-2.5 text-rose-800 flex items-center gap-2">
                    <RiAlertLine className="text-base text-rose-600 shrink-0" />
                    <span>No se encontró ningún usuario registrado con el DNI {predecessorDniInput}.</span>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400">
                    Ingresa los 8 dígitos del DNI para validar y vincular automáticamente.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPredecessorModal(false)
                  setDirectorForPredecessor(null)
                }}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200/60 text-xs sm:text-sm font-semibold transition-colors"
                disabled={isSavingPredecessor}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePredecessor}
                disabled={
                  isSavingPredecessor ||
                  predecessorDniInput.trim().length !== 8 ||
                  (predecessorInfo && !predecessorInfo.exists) ||
                  predecessorDniInput.trim() === directorForPredecessor.dni ||
                  predecessorDniInput.trim() === directorForPredecessor.dniDirectorPredecesor
                }
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold transition-all hover:shadow-lg hover:shadow-emerald-600/20 active:scale-[0.98] flex items-center gap-2"
              >
                {isSavingPredecessor ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Guardando vinculación...
                  </>
                ) : (
                  <>
                    <RiLinkM className="text-base" />
                    Guardar Vinculación
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Confirmación para Desvincular Predecesor */}
      {showUnlinkConfirmDialog && directorForPredecessor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center text-3xl">
                <RiAlertLine />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-800">
                  ¿Desvincular Director Predecesor?
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Se removerá la vinculación con el DNI <strong className="font-mono text-slate-700">{predecessorDniToUnlink || directorForPredecessor.dniDirectorPredecesor}</strong>. El director actual dejará de jalar los resultados previos y docentes de ese predecesor.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowUnlinkConfirmDialog(false)
                  setPredecessorDniToUnlink('')
                }}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200/60 text-xs sm:text-sm font-semibold transition-colors"
                disabled={isSavingPredecessor}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmUnlinkPredecessor}
                disabled={isSavingPredecessor}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold transition-all hover:shadow-lg hover:shadow-rose-600/20 active:scale-[0.98] flex items-center gap-2"
              >
                {isSavingPredecessor ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Desvinculando...
                  </>
                ) : (
                  <>
                    <RiLinkUnlinkM className="text-base" />
                    Sí, desvincular
                  </>
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
