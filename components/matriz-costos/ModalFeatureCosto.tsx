import React, { useState, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import { MdAutoAwesome, MdFormatListNumbered, MdAdd, MdDeleteOutline } from 'react-icons/md';
import { FeatureCostoItem, MatrizConfig, SubItemDetallado } from '@/features/utils/exportarMatrizCostosPDF';
import { toast } from 'react-toastify';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (feature: FeatureCostoItem) => Promise<void>;
  editingFeature: FeatureCostoItem | null;
  config: MatrizConfig;
}

const MODULOS_PREDEFINIDOS = [
  'Evaluaciones de Estudiantes',
  'Evaluaciones de Docentes',
  'Evaluaciones de Directores',
  'Módulo de Especialistas',
  'Reportes y Gráficas PDF/Excel',
  'Gestión de Usuarios y Roles',
  'Seguridad y Permisos',
  'Auditoría y Trazabilidad',
  'Cobertura Curricular',
  'Infraestructura y Base de Datos (Firestore)',
  'Diseño UI/UX y Navegación',
  'Otro'
];

const TIPOS_TRABAJO = [
  'Nueva Feature',
  'Mejora / Refactor',
  'Optimización',
  'Corrección de Bug',
  'Seguridad y Validación',
  'Migración de Datos'
];

export default function ModalFeatureCosto({
  isOpen,
  onClose,
  onSave,
  editingFeature,
  config
}: Props) {
  const [codigo, setCodigo] = useState('');
  const [titulo, setTitulo] = useState('');
  const [modulo, setModulo] = useState(MODULOS_PREDEFINIDOS[0]);
  const [moduloPersonalizado, setModuloPersonalizado] = useState('');
  const [tipo, setTipo] = useState(TIPOS_TRABAJO[0]);
  const [modalidad, setModalidad] = useState<'horas' | 'fijo'>('horas');
  const [horasEstimadas, setHorasEstimadas] = useState<number | ''>(4);
  const [horasReales, setHorasReales] = useState<number | ''>(4);
  const [tarifaPorHora, setTarifaPorHora] = useState<number | ''>(config.defaultHourlyRate || 50);
  const [costoTotal, setCostoTotal] = useState<number | ''>(200);
  const [estado, setEstado] = useState<'Planificado' | 'En Desarrollo' | 'Completado' | 'Entregado' | 'Facturado'>('Completado');
  const [prioridad, setPrioridad] = useState<'Baja' | 'Media' | 'Alta' | 'Crítica'>('Media');
  const [descripcion, setDescripcion] = useState('');
  const [tituloCliente, setTituloCliente] = useState('');
  const [descripcionCliente, setDescripcionCliente] = useState('');
  const [subItems, setSubItems] = useState<SubItemDetallado[]>([]);
  const [notas, setNotas] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (editingFeature) {
      setCodigo(editingFeature.codigo || '');
      setTitulo(editingFeature.titulo || '');
      setTituloCliente(editingFeature.tituloCliente || '');
      setDescripcionCliente(editingFeature.descripcionCliente || '');
      setSubItems(editingFeature.subItems ? [...editingFeature.subItems] : []);
      if (MODULOS_PREDEFINIDOS.includes(editingFeature.modulo)) {
        setModulo(editingFeature.modulo);
        setModuloPersonalizado('');
      } else {
        setModulo('Otro');
        setModuloPersonalizado(editingFeature.modulo || '');
      }
      setTipo(editingFeature.tipo || TIPOS_TRABAJO[0]);
      setModalidad(editingFeature.modalidad || 'horas');
      setHorasEstimadas(editingFeature.horasEstimadas ?? 0);
      setHorasReales(editingFeature.horasReales ?? 0);
      setTarifaPorHora(editingFeature.tarifaPorHora ?? config.defaultHourlyRate);
      setCostoTotal(editingFeature.costoTotal ?? 0);
      setEstado(editingFeature.estado || 'Completado');
      setPrioridad(editingFeature.prioridad || 'Media');
      setDescripcion(editingFeature.descripcion || '');
      setNotas(editingFeature.notas || '');
    } else {
      setCodigo('');
      setTitulo('');
      setTituloCliente('');
      setDescripcionCliente('');
      setSubItems([]);
      setModulo(MODULOS_PREDEFINIDOS[0]);
      setModuloPersonalizado('');
      setTipo(TIPOS_TRABAJO[0]);
      setModalidad('horas');
      setHorasEstimadas(4);
      setHorasReales(4);
      const tarifa = config.defaultHourlyRate || 50;
      setTarifaPorHora(tarifa);
      setCostoTotal(4 * tarifa);
      setEstado('Completado');
      setPrioridad('Media');
      setDescripcion('');
      setNotas('');
    }
  }, [editingFeature, isOpen, config.defaultHourlyRate]);

  const handleAddSubItem = () => {
    const parentCode = codigo.trim() ? codigo.replace(/[^0-9]/g, '') : '1';
    const nextNum = subItems.length + 1;
    const newCode = `${parentCode ? parseInt(parentCode, 10) : '1'}.${nextNum}`;
    const newItems = [...subItems, { codigo: newCode, descripcion: '', horas: 1 }];
    setSubItems(newItems);
    const sumH = newItems.reduce((acc, si) => acc + (Number(si.horas) || 0), 0);
    setHorasReales(sumH);
    setHorasEstimadas(sumH);
  };

  const handleUpdateSubItem = (
    index: number,
    field: 'codigo' | 'descripcion' | 'horas',
    value: string | number
  ) => {
    const copy = [...subItems];
    const item = { ...copy[index] };
    if (field === 'horas') {
      item.horas = isNaN(Number(value)) || Number(value) < 0 ? 0 : Number(value);
    } else if (field === 'codigo') {
      item.codigo = String(value);
    } else {
      item.descripcion = String(value);
    }
    copy[index] = item;
    setSubItems(copy);
    const sumH = copy.reduce((acc, si) => acc + (Number(si.horas) || 0), 0);
    setHorasReales(sumH);
    setHorasEstimadas(sumH);
  };

  const handleDeleteSubItem = (index: number) => {
    const copy = subItems.filter((_, i) => i !== index);
    setSubItems(copy);
    if (copy.length > 0) {
      const sumH = copy.reduce((acc, si) => acc + (Number(si.horas) || 0), 0);
      setHorasReales(sumH);
      setHorasEstimadas(sumH);
    }
  };

  const handleTranslateWithGemini = async () => {
    if (!titulo.trim()) {
      toast.warning('Por favor ingresa primero el nombre o título técnico de la feature.');
      return;
    }

    setIsTranslating(true);
    try {
      const res = await fetch('/api/dev/humanizar-features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          features: [
            {
              id: 'current',
              titulo: titulo.trim(),
              modulo: modulo === 'Otro' ? moduloPersonalizado : modulo,
              tipo,
              descripcion: descripcion.trim()
            }
          ]
        })
      });

      const data = await res.json();
      if (data.success && data.humanized && data.humanized.length > 0) {
        setTituloCliente(data.humanized[0].tituloCliente);
        setDescripcionCliente(data.humanized[0].descripcionCliente);
        toast.success('¡Generado con Gemini exitosamente en lenguaje cliente!');
      } else {
        toast.error(data.error || 'No se pudo generar la traducción.');
      }
    } catch (err) {
      console.error('Error al traducir con Gemini:', err);
      toast.error('Error de conexión al generar con Gemini.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Recalcular costo automáticamente si es por horas
  useEffect(() => {
    if (modalidad === 'horas') {
      const h = Number(horasReales) || Number(horasEstimadas) || 0;
      const t = Number(tarifaPorHora) || 0;
      setCostoTotal(Math.round(h * t * 100) / 100);
    }
  }, [horasReales, horasEstimadas, tarifaPorHora, modalidad]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.warning('Por favor ingresa el título o nombre de la feature.');
      return;
    }

    const moduloFinal = modulo === 'Otro' ? (moduloPersonalizado.trim() || 'General') : modulo;

    setIsSaving(true);
    try {
      const dataToSave: FeatureCostoItem = {
        ...(editingFeature?.id ? { id: editingFeature.id } : {}),
        codigo: codigo.trim() || undefined,
        titulo: titulo.trim(),
        tituloCliente: tituloCliente.trim() || undefined,
        modulo: moduloFinal,
        tipo,
        modalidad,
        subItems: subItems.length > 0 ? subItems : undefined,
        horasEstimadas: Number(horasEstimadas) || 0,
        horasReales: Number(horasReales) || 0,
        tarifaPorHora: Number(tarifaPorHora) || 0,
        costoTotal: Number(costoTotal) || 0,
        estado,
        prioridad,
        descripcion: descripcion.trim(),
        descripcionCliente: descripcionCliente.trim() || undefined,
        notas: notas.trim(),
        fecha: editingFeature?.fecha || new Date().toISOString().split('T')[0]
      };

      await onSave(dataToSave);
      toast.success(editingFeature ? 'Feature actualizada correctamente.' : 'Feature registrada con éxito.');
      onClose();
    } catch (err: any) {
      console.error('Error al guardar feature:', err);
      toast.error('Ocurrió un error al guardar la información.');
    } finally {
      setIsSaving(false);
    }
  };

  const currencySymbol = config.currency === 'USD' ? '$' : 'S/';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              {editingFeature ? 'Editar Funcionalidad / Tarea' : 'Nueva Funcionalidad para Matriz'}
            </h3>
            <p className="text-xs text-slate-400">
              Registra los detalles técnicos y económicos de la feature desarrollada
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <IoClose size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Código y Nombre */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Código (Ej. E-001)
              </label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="E-001"
                className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nombre de la Funcionalidad / Tarea *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Funcionalidad: Vista completa para gráfico desempeño..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Módulo y Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Módulo Afectado
              </label>
              <select
                value={modulo}
                onChange={(e) => setModulo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {MODULOS_PREDEFINIDOS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              {modulo === 'Otro' && (
                <input
                  type="text"
                  placeholder="Especifica el nombre del módulo"
                  value={moduloPersonalizado}
                  onChange={(e) => setModuloPersonalizado(e.target.value)}
                  className="mt-2 w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tipo de Trabajo
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {TIPOS_TRABAJO.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Modalidad, Estado y Complejidad */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Modalidad de Cobro
              </label>
              <select
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="horas">Por Horas</option>
                <option value="fijo">Precio Fijo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Estado
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
              >
                <option value="Planificado">Planificado</option>
                <option value="En Desarrollo">En Desarrollo</option>
                <option value="Completado">Completado</option>
                <option value="Entregado">Entregado</option>
                <option value="Facturado">Facturado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Complejidad / Prioridad
              </label>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Crítica">Crítica</option>
              </select>
            </div>
          </div>

          {/* Horas, Tarifa y Costo */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Horas Estimadas
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={horasEstimadas}
                  onChange={(e) => setHorasEstimadas(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Horas Reales
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={horasReales}
                  onChange={(e) => setHorasReales(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Tarifa / Hora ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={tarifaPorHora}
                  disabled={modalidad === 'fijo'}
                  onChange={(e) => setTarifaPorHora(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-900 mb-1">
                  Costo Total ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={costoTotal}
                  readOnly={modalidad === 'horas'}
                  onChange={(e) => setCostoTotal(e.target.value === '' ? '' : Number(e.target.value))}
                  className={`w-full px-3 py-2 text-sm border border-blue-300 rounded-lg outline-none font-bold text-emerald-700 ${
                    modalidad === 'horas' ? 'bg-blue-50/50' : 'bg-white'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Descripción Técnica */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Alcance / Descripción Técnica
            </label>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe lo realizado: componentes creados, modificaciones en hooks, endpoints, reglas de Firestore, integraciones..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {/* Desglose Detallado de Sub-tareas (Estilo Captura) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <MdFormatListNumbered className="text-indigo-600 text-sm" />
                  Sub-tareas / Desglose Detallado ({subItems.length} ítems)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Agrega los ítems específicos (ej. 1.1, 1.2) que componen esta funcionalidad
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddSubItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
              >
                <MdAdd size={14} />
                + Agregar Sub-tarea
              </button>
            </div>

            {subItems.length > 0 ? (
              <div className="space-y-2">
                {subItems.map((si, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                    <input
                      type="text"
                      value={si.codigo || ''}
                      onChange={(e) => handleUpdateSubItem(sIdx, 'codigo', e.target.value)}
                      placeholder="1.1"
                      className="w-14 text-xs font-mono font-bold text-center border border-slate-300 rounded py-1 px-1 outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={si.descripcion}
                      onChange={(e) => handleUpdateSubItem(sIdx, 'descripcion', e.target.value)}
                      placeholder="Descripción de la sub-tarea desarrollada..."
                      className="flex-1 text-xs border border-slate-300 rounded py-1 px-2 outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={si.horas}
                        onChange={(e) => handleUpdateSubItem(sIdx, 'horas', parseFloat(e.target.value))}
                        className="w-16 text-xs font-bold text-center border border-slate-300 rounded py-1 px-1 outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <span className="text-[11px] text-slate-500 font-bold">h</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubItem(sIdx)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition"
                      title="Eliminar ítem"
                    >
                      <MdDeleteOutline size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Sin sub-tareas adicionales. Las horas se toman directamente del campo general.
              </p>
            )}
          </div>

          {/* Bloque de Lenguaje para el Cliente (Generable con Gemini) */}
          <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/50 border border-emerald-200/80 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="p-1 bg-emerald-100 text-emerald-700 rounded-md">
                  <MdAutoAwesome size={15} />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                    Versión para el Cliente (Sin Tecnicismos)
                  </h4>
                  <p className="text-[11px] text-emerald-700">
                    Título y explicación de valor para directores, docentes o UGEL
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTranslateWithGemini}
                disabled={isTranslating || !titulo.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Generar automáticamente con IA de Gemini usando lenguaje amigable"
              >
                <MdAutoAwesome size={14} className={isTranslating ? 'animate-spin' : ''} />
                {isTranslating ? 'Generando con Gemini...' : '✨ Traducir con Gemini'}
              </button>
            </div>

            <div className="space-y-2 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                  Título Amigable para el Cliente:
                </label>
                <input
                  type="text"
                  value={tituloCliente}
                  onChange={(e) => setTituloCliente(e.target.value)}
                  placeholder="Ej. Reportes Oficiales de Calificaciones en PDF"
                  className="w-full px-3 py-1.5 text-xs md:text-sm bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                  Beneficio / Descripción para el Cliente:
                </label>
                <textarea
                  rows={2}
                  value={descripcionCliente}
                  onChange={(e) => setDescripcionCliente(e.target.value)}
                  placeholder="Ej. Facilita a los directores la descarga e impresión inmediata de los resultados escolares consolidados sin demoras."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Notas Adicionales */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Notas u Observaciones (Opcional)
            </label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Pendiente de aprobación por dirección, desplegado en staging..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : editingFeature ? 'Actualizar Feature' : 'Guardar en Matriz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
