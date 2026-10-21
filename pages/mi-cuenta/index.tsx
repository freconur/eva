import React, { useEffect, useState } from 'react'
import PrivateRoute from '@/components/layouts/PrivateRoutesAdmin'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import useUsuario from '@/features/hooks/useUsuario'
import ModalUpdateCliente from '@/modals/ModalUpdateCliente'
import {
  regionTexto,
  rolTexto,
  getAreaTexto,
  getCaracteristicasDirectivoTexto,
} from '@/fuctions/regiones'
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCopy,
  FiCheck,
  FiShield,
  FiBriefcase,
  FiMapPin,
  FiEdit3,
  FiExternalLink,
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi'
import {
  HiOutlineAcademicCap,
  HiOutlineBuildingOffice2,
  HiOutlineIdentification,
  HiOutlineCheckBadge,
} from 'react-icons/hi2'

const MiCuenta = () => {
  const { currentUserData } = useGlobalContext()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const { getUserData } = useUsuario()

  useEffect(() => {
    // Escucha cambios en el DNI de usuario para asegurar datos actualizados
  }, [currentUserData?.dni])

  const rolNum = Number(currentUserData?.perfil?.rol ?? currentUserData?.rol)
  const isClient = currentUserData?.perfil?.rol === 4
  const isDocenteOrDirector = rolNum === 2 || rolNum === 3
  const isAdminOrClient = isClient || rolNum === 4 || rolNum === 5 || rolNum === 0
  const canEdit = isAdminOrClient || isDocenteOrDirector

  const handleCopy = (text: string, key: string) => {
    if (!text || text === '—') return
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => {
        setCopiedKey(null)
      }, 2000)
    }
  }

  // Iniciales para el avatar en caso no exista foto de perfil
  const getInitials = (nombres?: string, apellidos?: string) => {
    const n = (nombres || '').trim().charAt(0)
    const a = (apellidos || '').trim().charAt(0)
    return (n + a).toUpperCase() || 'U'
  }

  // Nombre de región / UGEL descriptivo
  const ugelNombre = regionTexto(currentUserData?.region)
  const jurisdiccionTexto = ugelNombre
    ? `UGEL ${ugelNombre}`
    : currentUserData?.region
    ? `Región ${currentUserData.region}`
    : 'Dirección Regional de Educación (DREP)'

  // Cargo / Perfil
  const rolId = currentUserData?.perfil?.rol
  const rolNombre =
    currentUserData?.perfil?.nombre ||
    (rolId !== undefined ? rolTexto(rolId) : undefined) ||
    'Usuario del Sistema'

  // Estilos de badge semántico según el rol
  const getRoleBadgeClasses = (rol?: number) => {
    switch (rol) {
      case 1:
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 2:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 3:
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 4:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 5:
        return 'bg-purple-50 text-purple-700 border-purple-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const tienePreguntaSeguridad = Boolean(
    currentUserData?.seguridad?.configurado || currentUserData?.seguridad?.preguntaId
  )

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/70 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb de navegación */}
        <nav
          aria-label="Ruta de navegación"
          className="flex items-center gap-2 text-xs font-medium text-slate-500"
        >
          <span>Portal EVA</span>
          <span className="text-slate-300">/</span>
          <span>Gestión de Usuario</span>
          <span className="text-slate-300">/</span>
          <span className="text-blue-600 font-semibold">Mi Cuenta</span>
        </nav>

        {/* HERO BANNER CARD */}
        <section
          aria-label="Cabecera del perfil de usuario"
          className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
        >
          {/* Franja superior decorativa */}
          <div className="h-28 sm:h-32 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          </div>

          {/* Contenido principal del Hero */}
          <div className="px-5 sm:px-8 pb-6 sm:pb-8 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-14 mb-6">
              {/* Avatar con anillo */}
              <div className="flex items-end gap-4">
                <div className="relative">
                  {currentUserData?.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentUserData.foto}
                      alt={`Foto de ${currentUserData?.nombres || 'Usuario'}`}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white shadow-md bg-white"
                    />
                  ) : (
                    <div
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-2xl sm:text-3xl flex items-center justify-center ring-4 ring-white shadow-md select-none tracking-wider"
                      aria-label="Avatar de iniciales"
                    >
                      {getInitials(currentUserData?.nombres, currentUserData?.apellidos)}
                    </div>
                  )}
                  {/* Indicador de estado en línea */}
                  <span
                    className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white shadow-xs"
                    title="Usuario autenticado"
                  />
                </div>

                <div className="space-y-1 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Cuenta Activa
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeClasses(
                        rolId
                      )}`}
                    >
                      {rolNombre}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight capitalize">
                    {currentUserData?.nombres} {currentUserData?.apellidos}
                  </h1>
                </div>
              </div>

              {/* Botón de acción principal */}
              {canEdit && (
                <div className="pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all duration-150 shadow-xs hover:shadow min-h-[44px] w-full sm:w-auto cursor-pointer"
                  >
                    <FiEdit3 className="w-4 h-4 shrink-0" />
                    <span>Editar mis datos</span>
                  </button>
                </div>
              )}
            </div>

            {/* BENTO STATS BAR */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
              {/* DNI */}
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex flex-col justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Documento (DNI)
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono font-semibold text-slate-800 text-sm">
                    {currentUserData?.dni || '—'}
                  </span>
                  {currentUserData?.dni && (
                    <button
                      type="button"
                      onClick={() => handleCopy(currentUserData.dni || '', 'dni-top')}
                      aria-label="Copiar DNI al portapapeles"
                      className="p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      title="Copiar DNI"
                    >
                      {copiedKey === 'dni-top' ? (
                        <FiCheck className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <FiCopy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* JURISDICCIÓN */}
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex flex-col justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Jurisdicción
                </span>
                <p
                  className="font-semibold text-slate-800 text-sm mt-1 truncate"
                  title={jurisdiccionTexto}
                >
                  {jurisdiccionTexto}
                </p>
              </div>

              {/* ROL / PERFIL */}
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex flex-col justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Tipo de Acceso
                </span>
                <p
                  className="font-semibold text-slate-800 text-sm mt-1 truncate"
                  title={rolNombre}
                >
                  {rolNombre}
                </p>
              </div>

              {/* SEGURIDAD */}
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex flex-col justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Seguridad
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  {tienePreguntaSeguridad ? (
                    <>
                      <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-emerald-700 text-sm">Protegida</span>
                    </>
                  ) : (
                    <>
                      <FiAlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="font-semibold text-amber-700 text-sm">Básica</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TARJETAS DETALLADAS EN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* TARJETA 1: DATOS PERSONALES */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                <FiUser className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                  Datos Personales
                </h2>
                <p className="text-xs text-slate-500">
                  Identidad y credenciales registradas del usuario
                </p>
              </div>
            </div>

            <dl className="divide-y divide-slate-100 text-sm">
              <div className="py-3 flex justify-between items-center gap-4">
                <dt className="text-slate-500 font-medium">Nombres</dt>
                <dd className="text-slate-900 font-semibold text-right capitalize">
                  {currentUserData?.nombres || '—'}
                </dd>
              </div>

              <div className="py-3 flex justify-between items-center gap-4">
                <dt className="text-slate-500 font-medium">Apellidos</dt>
                <dd className="text-slate-900 font-semibold text-right capitalize">
                  {currentUserData?.apellidos || '—'}
                </dd>
              </div>

              <div className="py-3 flex justify-between items-center gap-4">
                <dt className="text-slate-500 font-medium">Documento de Identidad</dt>
                <dd className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {currentUserData?.dni || '—'}
                  </span>
                  {currentUserData?.dni && (
                    <button
                      type="button"
                      onClick={() => handleCopy(currentUserData.dni || '', 'dni-row')}
                      aria-label="Copiar número de documento"
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      title="Copiar DNI"
                    >
                      {copiedKey === 'dni-row' ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                          <FiCheck className="w-3.5 h-3.5" /> Copiado
                        </span>
                      ) : (
                        <FiCopy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </dd>
              </div>

              <div className="py-3 flex justify-between items-center gap-4">
                <dt className="text-slate-500 font-medium">Nombre de Usuario</dt>
                <dd className="font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded text-xs border border-slate-200">
                  {currentUserData?.dni || '—'}
                </dd>
              </div>

              {currentUserData?.sexo?.name && (
                <div className="py-3 flex justify-between items-center gap-4">
                  <dt className="text-slate-500 font-medium">Género</dt>
                  <dd className="text-slate-800 font-medium capitalize">
                    {currentUserData.sexo.name}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* TARJETA 2: INFORMACIÓN INSTITUCIONAL */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <HiOutlineAcademicCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                  Información Institucional
                </h2>
                <p className="text-xs text-slate-500">
                  Jurisdicción educativa, sede y función asignada
                </p>
              </div>
            </div>

            <dl className="divide-y divide-slate-100 text-sm">
              <div className="py-3 flex justify-between items-center gap-4">
                <dt className="text-slate-500 font-medium">Cargo / Función</dt>
                <dd className="text-slate-900 font-semibold text-right">
                  {rolNombre}
                </dd>
              </div>

              <div className="py-3 flex justify-between items-center gap-4">
                <dt className="text-slate-500 font-medium">Jurisdicción / UGEL</dt>
                <dd className="text-slate-900 font-semibold text-right">
                  {jurisdiccionTexto}
                </dd>
              </div>

              <div className="py-3 flex justify-between items-center gap-4">
                <dt className="text-slate-500 font-medium">Institución Educativa</dt>
                <dd className="text-slate-900 font-medium text-right max-w-[240px] truncate" title={currentUserData?.institucion || 'Sede Administrativa'}>
                  {currentUserData?.institucion || 'Sede Regional / UGEL'}
                </dd>
              </div>

              <div className="py-3 flex justify-between items-center gap-4">
                <dt className="text-slate-500 font-medium">Código Modular</dt>
                <dd className="font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded text-xs border border-slate-200">
                  {currentUserData?.modular || 'No aplica'}
                </dd>
              </div>

              {currentUserData?.area !== undefined && (
                <div className="py-3 flex justify-between items-center gap-4">
                  <dt className="text-slate-500 font-medium">Área</dt>
                  <dd className="text-slate-800 font-medium capitalize">
                    {getAreaTexto(currentUserData.area) || '—'}
                  </dd>
                </div>
              )}

              {currentUserData?.caracteristicaCurricular && (
                <div className="py-3 flex justify-between items-center gap-4">
                  <dt className="text-slate-500 font-medium">Característica</dt>
                  <dd className="text-slate-800 font-medium capitalize">
                    {getCaracteristicasDirectivoTexto(currentUserData.caracteristicaCurricular) || currentUserData.caracteristicaCurricular}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* TARJETA 3: CANALES DE CONTACTO */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                  <FiMail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                    Canales de Contacto
                  </h2>
                  <p className="text-xs text-slate-500">
                    Medios registrados para comunicaciones institucionales
                  </p>
                </div>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer"
                  title="Editar correo y teléfono"
                >
                  <FiEdit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Editar</span>
                </button>
              )}
            </div>

            <dl className="divide-y divide-slate-100 text-sm">
              <div className="py-3 flex justify-between items-center gap-4">
                <dt className="text-slate-500 font-medium">Correo Electrónico</dt>
                <dd className="flex items-center gap-2">
                  {currentUserData?.email ? (
                    <>
                      <span className="text-slate-800 font-medium text-right truncate max-w-[180px] sm:max-w-[220px]" title={currentUserData.email}>
                        {currentUserData.email}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopy(currentUserData.email || '', 'email-row')}
                          aria-label="Copiar correo electrónico"
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          title="Copiar email"
                        >
                          {copiedKey === 'email-row' ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                              <FiCheck className="w-3.5 h-3.5" /> Copiado
                            </span>
                          ) : (
                            <FiCopy className="w-4 h-4" />
                          )}
                        </button>
                        <a
                          href={`mailto:${currentUserData.email}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          title="Enviar correo"
                          aria-label="Abrir cliente de correo"
                        >
                          <FiExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </>
                  ) : canEdit ? (
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                    >
                      <FiEdit3 className="w-3 h-3" />
                      <span>+ Agregar correo</span>
                    </button>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </dd>
              </div>

              <div className="py-3 flex justify-between items-center gap-4">
                <dt className="text-slate-500 font-medium">Teléfono / Celular</dt>
                <dd className="flex items-center gap-2">
                  {currentUserData?.celular ? (
                    <>
                      <span className="font-mono text-slate-800 font-medium">
                        {currentUserData.celular}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopy(currentUserData.celular || '', 'phone-row')}
                          aria-label="Copiar número de teléfono"
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          title="Copiar teléfono"
                        >
                          {copiedKey === 'phone-row' ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                              <FiCheck className="w-3.5 h-3.5" /> Copiado
                            </span>
                          ) : (
                            <FiCopy className="w-4 h-4" />
                          )}
                        </button>
                        <a
                          href={`tel:${currentUserData.celular}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          title="Llamar"
                          aria-label="Llamar al número telefónico"
                        >
                          <FiPhone className="w-4 h-4" />
                        </a>
                      </div>
                    </>
                  ) : canEdit ? (
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                    >
                      <FiEdit3 className="w-3 h-3" />
                      <span>+ Agregar teléfono</span>
                    </button>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </dd>
              </div>

              <div className="py-3 flex justify-between items-center gap-4">
                <dt className="text-slate-500 font-medium">Notificaciones</dt>
                <dd className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <FiCheck className="w-3.5 h-3.5" /> Habilitadas
                </dd>
              </div>
            </dl>
          </div>

          {/* TARJETA 4: SEGURIDAD Y ACCESO */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                <FiShield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                  Seguridad y Acceso
                </h2>
                <p className="text-xs text-slate-500">
                  Estado de autenticación y mecanismos de recuperación
                </p>
              </div>
            </div>

            <dl className="divide-y divide-slate-100 text-sm">
              <div className="py-3 flex justify-between items-center gap-4">
                <dt className="text-slate-500 font-medium">Autenticación</dt>
                <dd className="inline-flex items-center gap-1.5 text-slate-700 text-xs font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <FiLock className="w-3.5 h-3.5 text-slate-500" /> Firebase Auth
                </dd>
              </div>

              <div className="py-3 flex justify-between items-center gap-4">
                <dt className="text-slate-500 font-medium">Pregunta Secreta</dt>
                <dd>
                  {tienePreguntaSeguridad ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <FiCheckCircle className="w-3.5 h-3.5" /> Configurada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-amber-700 text-xs font-semibold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      <FiAlertCircle className="w-3.5 h-3.5" /> Pendiente
                    </span>
                  )}
                </dd>
              </div>

              <div className="py-3 flex justify-between items-center gap-4">
                <dt className="text-slate-500 font-medium">PIN de Seguridad</dt>
                <dd className="text-xs font-medium text-slate-600">
                  {currentUserData?.seguridad?.pin ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <FiCheck className="w-3.5 h-3.5" /> Asignado
                    </span>
                  ) : (
                    <span className="text-slate-400">No configurado</span>
                  )}
                </dd>
              </div>

              <div className="py-3 flex justify-between items-center gap-4">
                <dt className="text-slate-500 font-medium">Estado de Contraseña</dt>
                <dd>
                  {currentUserData?.debeCambiarContrasena ? (
                    <span className="inline-flex items-center gap-1 text-rose-700 text-xs font-semibold bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                      Cambio requerido
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Vigente
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* MODAL DE EDICIÓN DE DATOS */}
      {isModalOpen && (
        <ModalUpdateCliente
          userData={currentUserData}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => getUserData()}
        />
      )}
    </div>
  )
}

export default MiCuenta
MiCuenta.Auth = PrivateRoute