import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PrivateRoutesAdmin from '@/components/layouts/PrivateRoutesAdmin';
import { 
  RiArrowLeftLine, 
  RiRocketLine, 
  RiRefreshLine, 
  RiCheckLine, 
  RiAlertLine, 
  RiNotificationOffLine, 
  RiInformationLine, 
  RiHistoryLine, 
  RiShieldCheckLine,
  RiSendPlane2Line,
  RiCloseLine
} from 'react-icons/ri';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { toast } from 'react-toastify';
import { 
  AppVersionData, 
  CURRENT_CLIENT_VERSION, 
  CURRENT_BUILD_TIME,
  VERSION_COLLECTION, 
  VERSION_DOCUMENT,
  compareSemver
} from '@/features/version/version.config';

interface HistorialItem extends AppVersionData {
  id: string;
  createdAt?: string;
}

const ActualizacionesPage = () => {
  const { currentUserData } = useGlobalContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentFirestoreVersion, setCurrentFirestoreVersion] = useState<AppVersionData | null>(null);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);

  // Estados del formulario
  const [versionInput, setVersionInput] = useState(CURRENT_CLIENT_VERSION);
  const [tituloInput, setTituloInput] = useState('Nueva actualización disponible');
  const [mensajeInput, setMensajeInput] = useState('Hemos desplegado mejoras y optimizaciones en la plataforma. Te sugerimos guardar tu trabajo pendiente y actualizar la aplicación.');
  const [notasInput, setNotasInput] = useState('');
  const [forzarActualizacion, setForzarActualizacion] = useState(false);

  // Modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Cargar estado actual de Firestore
  const fetchCurrentVersion = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, VERSION_COLLECTION, VERSION_DOCUMENT);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as AppVersionData;
        setCurrentFirestoreVersion(data);
        if (data.version) {
          // Si la versión en Firestore ya existe, sugerir el siguiente patch si coincide con el build
          setVersionInput(data.version);
        }
        if (data.titulo) setTituloInput(data.titulo);
        if (data.mensaje) setMensajeInput(data.mensaje);
        if (data.notas) {
          setNotasInput(Array.isArray(data.notas) ? data.notas.join('\n') : data.notas);
        }
        setForzarActualizacion(Boolean(data.forzarActualizacion));
      } else {
        // Documento inicial por defecto
        setVersionInput(CURRENT_CLIENT_VERSION);
      }

      // Cargar historial
      try {
        const histCol = collection(db, VERSION_COLLECTION, VERSION_DOCUMENT, 'historial');
        const q = query(histCol, orderBy('createdAt', 'desc'), limit(10));
        const histSnap = await getDocs(q);
        const list: HistorialItem[] = [];
        histSnap.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as HistorialItem);
        });
        setHistorial(list);
      } catch (err) {
        console.warn('Historial de versiones no disponible aún:', err);
      }
    } catch (err: any) {
      console.error('Error al cargar versión de Firestore:', err);
      toast.error('No se pudo consultar el estado actual de versiones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentVersion();
  }, []);

  // Función para sugerir el siguiente número de versión semver (+1 patch)
  const incrementarPatch = () => {
    const base = versionInput || CURRENT_CLIENT_VERSION || '1.0.0';
    const parts = base.trim().replace(/^v/i, '').split('.');
    if (parts.length >= 3) {
      const patch = parseInt(parts[2], 10) || 0;
      setVersionInput(`${parts[0]}.${parts[1]}.${patch + 1}`);
    } else {
      setVersionInput(`${base}.1`);
    }
  };

  // Función para sincronizar con la versión del build local
  const usarVersionLocal = () => {
    setVersionInput(CURRENT_CLIENT_VERSION);
  };

  // Publicar y emitir notificación
  const handlePublicarActualizacion = async () => {
    if (!versionInput.trim()) {
      toast.warning('Debes ingresar un número de versión.');
      return;
    }

    try {
      setSaving(true);
      const notasArray = notasInput
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const nombreUsuario = currentUserData?.nombres
        ? `${currentUserData.nombres} ${currentUserData.apellidos || ''}`.trim()
        : 'Administrador';

      const nuevaData: AppVersionData = {
        version: versionInput.trim(),
        titulo: tituloInput.trim() || 'Nueva actualización disponible',
        mensaje: mensajeInput.trim(),
        notas: notasArray.length > 0 ? notasArray : '',
        activo: true,
        forzarActualizacion: forzarActualizacion,
        fechaLanzamiento: new Date().toLocaleString('es-PE', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        actualizadoPor: nombreUsuario,
        buildTimestamp: Date.now(),
      };

      // 1. Guardar documento principal que escuchan los clientes
      const docRef = doc(db, VERSION_COLLECTION, VERSION_DOCUMENT);
      await setDoc(docRef, nuevaData, { merge: true });

      // 2. Guardar en subcolección historial para trazabilidad
      try {
        const histCol = collection(db, VERSION_COLLECTION, VERSION_DOCUMENT, 'historial');
        await addDoc(histCol, {
          ...nuevaData,
          createdAt: new Date().toISOString(),
          autorDni: currentUserData?.dni || null,
        });
      } catch (histErr) {
        console.warn('No se pudo guardar registro en historial:', histErr);
      }

      setCurrentFirestoreVersion(nuevaData);
      setShowConfirmModal(false);
      toast.success('Nueva actualización disponible');
      
      // Recargar historial
      fetchCurrentVersion();
    } catch (err: any) {
      console.error('Error al emitir actualización:', err);
      toast.error('Ocurrió un error al guardar la actualización en Firestore.');
    } finally {
      setSaving(false);
    }
  };

  // Desactivar notificación (silenciar banner en todos los clientes)
  const handleDesactivarNotificacion = async () => {
    try {
      setSaving(true);
      const docRef = doc(db, VERSION_COLLECTION, VERSION_DOCUMENT);
      await setDoc(docRef, { activo: false }, { merge: true });

      setCurrentFirestoreVersion((prev) => (prev ? { ...prev, activo: false } : null));
      toast.info('La notificación ha sido desactivada. Ningún usuario verá el banner.');
    } catch (err) {
      console.error('Error al desactivar notificación:', err);
      toast.error('No se pudo desactivar la notificación.');
    } finally {
      setSaving(false);
    }
  };

  const isServerActive = Boolean(currentFirestoreVersion?.activo);
  const serverVersionStr = currentFirestoreVersion?.version || 'Sin configurar';

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto min-h-screen text-slate-800">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 mb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/admin/configuracion"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-slate-100 px-2.5 py-1 rounded-lg"
            >
              <RiArrowLeftLine />
              Volver a Configuración
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 flex items-center gap-2.5">
            <RiRocketLine className="text-emerald-600" />
            Control y Despliegue de Actualizaciones
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestiona la notificación en tiempo real a los navegadores de los usuarios cuando se despliega una nueva versión.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={fetchCurrentVersion}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
          >
            <RiRefreshLine className={loading ? 'animate-spin' : ''} />
            Actualizar datos
          </button>
        </div>
      </div>

      {/* Tarjetas de Diagnóstico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Versión del Build Local */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Versión en este Build
            </span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              APP
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 mb-1">
            v{CURRENT_CLIENT_VERSION}
          </div>
          <p className="text-xs text-slate-500">
            Definida en <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">package.json</code>
          </p>
          {CURRENT_BUILD_TIME && (
            <p className="text-[11px] text-slate-400 mt-2 truncate">
              Compilado: {new Date(CURRENT_BUILD_TIME).toLocaleString('es-PE')}
            </p>
          )}
        </div>

        {/* Versión Publicada en Firestore */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Versión en Producción
            </span>
            {isServerActive ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Activa
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                Silenciada
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-slate-800 mb-1">
            {currentFirestoreVersion ? `v${serverVersionStr}` : 'No configurada'}
          </div>
          <p className="text-xs text-slate-500">
            {currentFirestoreVersion?.fechaLanzamiento
              ? `Emitida: ${currentFirestoreVersion.fechaLanzamiento}`
              : 'Aún no se ha emitido ninguna versión'}
          </p>
          {currentFirestoreVersion?.actualizadoPor && (
            <p className="text-[11px] text-slate-400 mt-2">
              Por: {currentFirestoreVersion.actualizadoPor}
            </p>
          )}
        </div>

        {/* Estado de Sincronización */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Estado de Aviso
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
              <RiShieldCheckLine />
            </div>
          </div>
          {serverVersionStr === CURRENT_CLIENT_VERSION && isServerActive ? (
            <div>
              <div className="text-lg font-bold text-emerald-600 flex items-center gap-1.5 mb-1">
                <RiCheckLine />
                Sincronizado
              </div>
              <p className="text-xs text-slate-500">
                Los clientes que ya tienen la versión v{CURRENT_CLIENT_VERSION} no verán el banner. Solo los que tengan versiones anteriores lo verán.
              </p>
            </div>
          ) : (
            <div>
              <div className="text-lg font-bold text-blue-600 flex items-center gap-1.5 mb-1">
                <RiInformationLine />
                {isServerActive ? 'Aviso Activo' : 'Aviso Pausado'}
              </div>
              <p className="text-xs text-slate-500">
                {isServerActive
                  ? `Se está notificando la versión v${serverVersionStr} a los clientes conectados.`
                  : 'Las notificaciones están inactivas actualmente.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sección Principal: Formulario + Vista Previa */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        {/* Formulario de Emisión (7 columnas) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Emitir Notificación de Actualización
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Al guardar, todos los navegadores conectados recibirán la alerta al instante vía Firebase.
              </p>
            </div>
            {isServerActive && (
              <button
                type="button"
                onClick={handleDesactivarNotificacion}
                disabled={saving}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
                title="Oculta el banner a todos los usuarios"
              >
                <RiNotificationOffLine />
                Desactivar Aviso
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Campo: Número de Versión */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Número de Versión a Notificar <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-sm">
                    v
                  </span>
                  <input
                    type="text"
                    value={versionInput}
                    onChange={(e) => setVersionInput(e.target.value)}
                    placeholder="1.0.1"
                    className="w-full pl-7 pr-3 py-2 text-sm font-mono font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={usarVersionLocal}
                  className="px-3 py-2 text-xs font-medium rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Usar la versión actual del package.json"
                >
                  Usar local ({CURRENT_CLIENT_VERSION})
                </button>
                <button
                  type="button"
                  onClick={incrementarPatch}
                  className="px-3 py-2 text-xs font-medium rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                  title="Sumar +1 a la versión patch"
                >
                  +1 Patch
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Los clientes que tengan una versión menor a esta verán el aviso para actualizar.
              </p>
            </div>

            {/* Campo: Título */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Título del Aviso
              </label>
              <input
                type="text"
                value={tituloInput}
                onChange={(e) => setTituloInput(e.target.value)}
                placeholder="Nueva versión disponible"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Campo: Mensaje Descriptivo */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Mensaje para los Usuarios
              </label>
              <textarea
                rows={3}
                value={mensajeInput}
                onChange={(e) => setMensajeInput(e.target.value)}
                placeholder="Explica brevemente la razón de la actualización..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Campo: Notas / Cambios */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Novedades o Cambios (Opcional, 1 línea por elemento)
              </label>
              <textarea
                rows={3}
                value={notasInput}
                onChange={(e) => setNotasInput(e.target.value)}
                placeholder="• Corrección en cálculo de reportes&#10;• Mejora en carga de preguntas&#10;• Nuevo botón de descarga"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Checkbox: Forzar Actualización */}
            <div className="pt-2">
              <label className="relative flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={forzarActualizacion}
                  onChange={(e) => setForzarActualizacion(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800">
                    Hacer actualización obligatoria (No permitir posponer)
                  </span>
                  <p className="text-slate-500 mt-0.5">
                    Oculta el botón &quot;Más tarde&quot;. Se recomienda mantenerlo desmarcado para que los docentes o estudiantes no pierdan respuestas sin guardar.
                  </p>
                </div>
              </label>
            </div>

            {/* Botón de acción */}
            <div className="pt-4">
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={saving || !versionInput.trim()}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-[0.99] transition-all disabled:opacity-60"
              >
                <RiSendPlane2Line className="text-lg" />
                <span>Emitir Notificación a Todos los Usuarios</span>
              </button>
            </div>
          </div>
        </div>

        {/* Vista Previa Interactiva (5 columnas) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-slate-100/80 p-6 rounded-2xl border border-slate-200 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <RiInformationLine className="text-blue-600 text-sm" />
                  Vista previa en vivo del banner
                </span>
                <span className="text-[11px] text-slate-400">Así lo verá el usuario</span>
              </div>

              {/* Simulación del Banner */}
              <div className="relative overflow-hidden bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-700/80">
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
                      <RiRocketLine className="text-xl" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white">
                          {tituloInput || 'Nueva versión disponible'}
                        </h4>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                          v{versionInput || '1.0.0'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Versión actual en tu navegador: v{CURRENT_CLIENT_VERSION}
                      </p>
                    </div>
                  </div>

                  {!forzarActualizacion && (
                    <div className="text-slate-400 p-1">
                      <RiCloseLine className="text-lg" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {mensajeInput || 'Mensaje de actualización...'}
                </p>

                {notasInput.trim() && (
                  <div className="mb-3 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300 max-h-24 overflow-y-auto">
                    <span className="font-semibold text-slate-200 block mb-1">Novedades:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                      {notasInput
                        .split('\n')
                        .filter((l) => l.trim().length > 0)
                        .map((l, i) => (
                          <li key={i}>{l}</li>
                        ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow">
                    <RiRefreshLine />
                    Actualizar ahora
                  </div>
                  {!forzarActualizacion && (
                    <div className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium">
                      Más tarde
                    </div>
                  )}
                </div>
              </div>

              {/* Simulación de la píldora minimizada */}
              <div className="mt-5 pt-4 border-t border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                  Si el usuario hace clic en &quot;Más tarde&quot;, verá esta píldora para no perder su trabajo:
                </span>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white border border-blue-500/40 shadow text-xs font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  <RiRefreshLine className="text-blue-400" />
                  <span>Actualización disponible (v{versionInput || '1.0.0'})</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-3 rounded-xl bg-blue-50/80 border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
              <RiInformationLine className="text-blue-600 text-base shrink-0 mt-0.5" />
              <span>
                <strong>Flujo recomendado:</strong> Haz tu push a la rama principal, espera que el hosting termine de desplegar, y luego emite la notificación desde este panel con el nuevo número de versión.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Emisiones */}
      {historial.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm mb-10">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <RiHistoryLine className="text-slate-500" />
            Historial de Notificaciones Emitidas
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Versión</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Autor</th>
                  <th className="py-2.5 px-3">Mensaje</th>
                  <th className="py-2.5 px-3">Tipo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {historial.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                      v{item.version}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {item.fechaLanzamiento || (item.createdAt ? new Date(item.createdAt).toLocaleString('es-PE') : '-')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {item.actualizadoPor || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={item.mensaje}>
                      {item.mensaje || '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      {item.forzarActualizacion ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700">
                          Obligatoria
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          Sugerida
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mb-4">
              <RiRocketLine />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              ¿Emitir versión v{versionInput} a todos los usuarios?
            </h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Esta acción actualizará inmediatamente el documento en Firestore. Todos los usuarios conectados que tengan una versión anterior verán el aviso flotante recomendándoles guardar sus cambios y recargar.
            </p>
            {forzarActualizacion && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <RiAlertLine className="text-base text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Atención:</strong> Has seleccionado &quot;Actualización obligatoria&quot;. Los usuarios no podrán posponer el banner.
                </span>
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePublicarActualizacion}
                disabled={saving}
                className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <RiRefreshLine className="animate-spin" />
                    Publicando...
                  </>
                ) : (
                  'Sí, Emitir Ahora'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ActualizacionesPage.Auth = PrivateRoutesAdmin;

export default ActualizacionesPage;
