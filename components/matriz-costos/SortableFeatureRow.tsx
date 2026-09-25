import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  MdDragIndicator,
  MdExpandMore,
  MdExpandLess,
  MdFormatListNumbered,
  MdAutoAwesome,
  MdEdit,
  MdDeleteOutline,
  MdAdd,
  MdCheck
} from 'react-icons/md';
import { FeatureCostoItem, SubItemDetallado } from '@/features/utils/exportarMatrizCostosPDF';

interface SortableFeatureRowProps {
  feature: FeatureCostoItem;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  modoVista: 'tecnico' | 'cliente';
  currencySymbol: string;
  tarifa: number;
  badgeEstadoClass: string;
  humanizingId: string | null;
  onHumanizeSingle: (f: FeatureCostoItem) => void;
  onEdit: (f: FeatureCostoItem) => void;
  onDelete: (f: FeatureCostoItem) => void;
  onUpdateHours: (f: FeatureCostoItem, newHours: number) => void;
  onUpdateDescription: (f: FeatureCostoItem, newDesc: string, isCliente: boolean) => void;
  onUpdateSubItem: (
    f: FeatureCostoItem,
    subItemIndex: number,
    field: 'descripcion' | 'horas',
    value: string | number
  ) => void;
  onAddSubItem: (f: FeatureCostoItem, featureIndex: number) => void;
  onDeleteSubItem: (f: FeatureCostoItem, subItemIndex: number) => void;
}

const TIPO_CLIENTE_MAP: Record<string, string> = {
  'Nueva Feature': 'Nueva Solución',
  'Mejora / Refactor': 'Optimización',
  'Seguridad y Validación': 'Seguridad y Control',
  'Optimización': 'Rendimiento',
  'Corrección de Bug': 'Mantenimiento',
  'Migración de Datos': 'Gestión de Datos'
};

const SortableFeatureRow: React.FC<SortableFeatureRowProps> = ({
  feature,
  index,
  isExpanded,
  onToggleExpand,
  modoVista,
  currencySymbol,
  tarifa,
  badgeEstadoClass,
  humanizingId,
  onHumanizeSingle,
  onEdit,
  onDelete,
  onUpdateHours,
  onUpdateDescription,
  onUpdateSubItem,
  onAddSubItem,
  onDeleteSubItem
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: feature.id || `feature-${index}` });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : 'auto',
    position: isDragging ? 'relative' : 'initial'
  };

  // Código dinámico autocorrector: F-001, F-002... F-008, etc.
  const dynamicCode = `F-${String(index + 1).padStart(3, '0')}`;
  const horas = Number(feature.horasReales) || Number(feature.horasEstimadas) || 0;
  const costo = Number(feature.costoTotal) || Math.round(horas * tarifa * 100) / 100;

  // Estados locales para edición inline de descripción y horas
  const [localHours, setLocalHours] = useState<number | string>(horas);
  const currentDesc = modoVista === 'cliente'
    ? (feature.descripcionCliente || '')
    : (feature.descripcion || '');
  const [localDesc, setLocalDesc] = useState<string>(currentDesc);

  useEffect(() => {
    setLocalHours(horas);
  }, [horas]);

  useEffect(() => {
    setLocalDesc(currentDesc);
  }, [currentDesc]);

  const handleHoursBlur = () => {
    const val = Number(localHours);
    if (!isNaN(val) && val >= 0 && val !== horas) {
      onUpdateHours(feature, val);
    } else {
      setLocalHours(horas);
    }
  };

  const handleDescBlur = () => {
    if (localDesc !== currentDesc) {
      onUpdateDescription(feature, localDesc, modoVista === 'cliente');
    }
  };

  return (
    <>
      {/* Fila Principal de la Feature */}
      <tr
        ref={setNodeRef}
        style={style}
        onClick={onToggleExpand}
        className={`cursor-pointer transition select-none ${
          isDragging
            ? 'bg-indigo-50/80 shadow-lg'
            : isExpanded
            ? 'bg-slate-50/90'
            : 'hover:bg-slate-50/70'
        }`}
        title="Clic en la fila para expandir/colapsar detalles"
      >
        {/* Columna 1: Drag & Drop + Número de Orden */}
        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-indigo-600 rounded transition hover:bg-slate-100"
              title="Arrastrar para mover y reordenar esta funcionalidad"
            >
              <MdDragIndicator size={17} />
            </button>
            <span className="text-slate-400 font-bold text-xs w-4 text-center">
              {index + 1}
            </span>
          </div>
        </td>

        {/* Columna 2: Chevron, Código Dinámico, Título, Edición Inline de Descripción */}
        <td className="py-3 px-4">
          <div className="flex items-start gap-2.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="mt-0.5 text-slate-400 hover:text-slate-700 transition"
              title={isExpanded ? 'Colapsar' : 'Expandir'}
            >
              {isExpanded ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}
            </button>

            <div className="flex-1 min-w-0">
              {/* Código dinámico y Título */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-blue-100 text-blue-800 border border-blue-200">
                  {dynamicCode}
                </span>

                <span className="font-bold text-slate-900 text-sm">
                  {modoVista === 'cliente'
                    ? (feature.tituloCliente || feature.titulo)
                    : feature.titulo}
                </span>

                {feature.subItems && feature.subItems.length > 0 && (
                  <span
                    className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1"
                    title={`${feature.subItems.length} sub-tareas detalladas`}
                  >
                    <MdFormatListNumbered size={12} />
                    {feature.subItems.length} tareas
                  </span>
                )}

                {modoVista === 'cliente' && feature.tituloCliente && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded flex items-center gap-0.5">
                    <MdAutoAwesome size={10} /> IA
                  </span>
                )}

                {modoVista === 'cliente' && !feature.tituloCliente && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onHumanizeSingle(feature);
                    }}
                    disabled={humanizingId === feature.id}
                    className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded hover:bg-amber-200 transition flex items-center gap-1"
                    title="Generar traducción para cliente con Gemini"
                  >
                    <MdAutoAwesome size={10} className={humanizingId === feature.id ? 'animate-spin' : ''} />
                    {humanizingId === feature.id ? '...' : 'Traducir'}
                  </button>
                )}
              </div>

              {/* Edición Inline de Descripción directamente desde la tabla */}
              <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={localDesc}
                  placeholder={
                    modoVista === 'cliente'
                      ? 'Clic para editar descripción amigable para el cliente...'
                      : 'Clic para editar descripción técnica de la funcionalidad...'
                  }
                  onChange={(e) => setLocalDesc(e.target.value)}
                  onBlur={handleDescBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  }}
                  className="w-full text-xs text-slate-600 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-0.5 transition shadow-none focus:shadow-2xs"
                  title="Puedes editar la descripción directamente aquí. Se guarda al salir del campo o presionar Enter."
                />
              </div>

              <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                {feature.modulo}
              </div>
            </div>
          </div>
        </td>

        {/* Columna 3: Tipo de Trabajo / Solución */}
        <td className="py-3 px-4">
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 text-slate-700">
            {modoVista === 'cliente'
              ? (TIPO_CLIENTE_MAP[feature.tipo] || feature.tipo || 'Solución')
              : (feature.tipo || 'Feature')}
          </span>
        </td>

        {/* Columna 4: Modalidad */}
        <td className="py-3 px-4 text-center">
          <span className="text-[11px] font-medium text-slate-600">
            {feature.modalidad === 'fijo' ? 'Fijo' : 'Por Horas'}
          </span>
        </td>

        {/* Columna 5: Horas (Editable Directamente en la Tabla) */}
        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
          {feature.modalidad === 'fijo' ? (
            <span className="text-slate-400 text-xs">-</span>
          ) : (
            <div className="flex items-center justify-end gap-1">
              <input
                type="number"
                min="0"
                step="0.5"
                value={localHours}
                onChange={(e) => setLocalHours(e.target.value)}
                onBlur={handleHoursBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
                className="w-16 px-1.5 py-1 text-right text-xs font-bold text-slate-900 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded transition shadow-2xs"
                title="Editar horas estimadas directamente. Presiona Enter o haz clic afuera para guardar."
              />
              <span className="text-slate-500 font-medium text-xs">h</span>
            </div>
          )}
        </td>

        {/* Columna 6: Tarifa por Hora */}
        <td className="py-3 px-4 text-right text-slate-600">
          {currencySymbol} {tarifa.toFixed(2)}
        </td>

        {/* Columna 7: Costo Total */}
        <td className="py-3 px-4 text-right font-black text-emerald-700 text-sm">
          {currencySymbol}{' '}
          {costo.toLocaleString('es-PE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </td>

        {/* Columna 8: Estado */}
        <td className="py-3 px-4 text-center">
          <span className={`px-2.5 py-1 text-[11px] rounded-full inline-block ${badgeEstadoClass}`}>
            {feature.estado || 'Planificado'}
          </span>
        </td>

        {/* Columna 9: Acciones */}
        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => onHumanizeSingle(feature)}
              disabled={humanizingId === feature.id}
              className="p-1 text-slate-400 hover:text-emerald-600 rounded-md hover:bg-slate-100 transition"
              title="Traducir / Humanizar con Gemini"
            >
              <MdAutoAwesome size={16} className={humanizingId === feature.id ? 'animate-spin text-emerald-600' : ''} />
            </button>
            <button
              onClick={() => onEdit(feature)}
              className="p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 transition"
              title="Editar detalle completo en modal"
            >
              <MdEdit size={16} />
            </button>
            <button
              onClick={() => onDelete(feature)}
              className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100 transition"
              title="Eliminar funcionalidad"
            >
              <MdDeleteOutline size={16} />
            </button>
          </div>
        </td>
      </tr>

      {/* Fila Expandida con Sub-tareas (Editable directamente como en la captura) */}
      {isExpanded && !isDragging && (
        <tr className="bg-slate-50/90 border-t border-b border-slate-200">
          <td colSpan={9} className="p-4 pl-12">
            <div className="space-y-3 text-xs text-slate-700">
              {/* Vistas de descripción extendida */}
              {modoVista === 'cliente' ? (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3">
                  <span className="font-bold text-emerald-950 flex items-center gap-1 mb-1">
                    <MdAutoAwesome size={14} className="text-emerald-600" />
                    Beneficio y Solución para la Institución:
                  </span>
                  <p className="text-slate-700 text-xs">
                    {feature.descripcionCliente || (
                      <span className="italic text-slate-400">
                        Aún no se ha generado la versión para el cliente. Puedes presionar el botón de la varita ✨ para crearla con Gemini.
                      </span>
                    )}
                  </p>
                </div>
              ) : (
                feature.descripcionCliente && (
                  <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-lg p-2.5">
                    <span className="font-bold text-emerald-900 text-[11px] flex items-center gap-1">
                      <MdAutoAwesome size={12} className="text-emerald-600" />
                      Versión amigable para el cliente:
                    </span>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      {feature.descripcionCliente}
                    </p>
                  </div>
                )
              )}

              {/* TABLA DESGLOSADA DE SUB-TAREAS CON ÍTEMS DINÁMICOS Y EDICIÓN INLINE */}
              {feature.subItems && feature.subItems.length > 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs mt-2">
                  <div className="bg-slate-100/90 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <MdFormatListNumbered className="text-indigo-600 text-sm" />
                      Descripción Detallada de Tareas Desarrolladas ({feature.subItems.length} ítems)
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-indigo-700">
                        Tarifa: {currencySymbol} {tarifa.toFixed(2)}/hr
                      </span>
                      <button
                        type="button"
                        onClick={() => onAddSubItem(feature, index)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-md transition"
                      >
                        <MdAdd size={13} /> Agregar Tarea
                      </button>
                    </div>
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase border-b border-slate-200">
                        <th className="py-2 px-3 w-16 text-center">Ítem</th>
                        <th className="py-2 px-3">Descripción Detallada (Editable)</th>
                        <th className="py-2 px-3 w-36 text-center">Estimado (Horas)</th>
                        <th className="py-2 px-3 w-32 text-right">Costo Calculado</th>
                        <th className="py-2 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {feature.subItems.map((si, sIdx) => {
                        const subItemHours = Number(si.horas) || 0;
                        const subItemCost = subItemHours * tarifa;
                        // Ítem dinámico: 1.1, 1.2... 9.1, 9.2 correlacionado a la posición de la feature
                        const dynamicSubCode = `${index + 1}.${sIdx + 1}`;

                        return (
                          <tr key={sIdx} className="hover:bg-indigo-50/20 transition">
                            {/* Código Dinámico de la Sub-tarea */}
                            <td className="py-2 px-3 text-center font-mono font-bold text-indigo-700 bg-slate-50/60">
                              {dynamicSubCode}
                            </td>

                            {/* Descripción Detallada Editable Directamente */}
                            <td className="py-1.5 px-3">
                              <input
                                type="text"
                                defaultValue={si.descripcion}
                                onBlur={(e) => {
                                  if (e.target.value !== si.descripcion) {
                                    onUpdateSubItem(feature, sIdx, 'descripcion', e.target.value);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                }}
                                className="w-full px-2 py-1 text-xs text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded transition"
                                title="Edita la descripción y presiona Enter o haz clic afuera"
                              />
                            </td>

                            {/* Estimado de Horas Editable Directamente */}
                            <td className="py-1.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  defaultValue={subItemHours}
                                  onBlur={(e) => {
                                    const val = Number(e.target.value);
                                    if (!isNaN(val) && val >= 0 && val !== subItemHours) {
                                      onUpdateSubItem(feature, sIdx, 'horas', val);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                  }}
                                  className="w-16 px-1.5 py-1 text-center text-xs font-bold text-slate-800 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded transition shadow-2xs"
                                  title="Edita las horas. El costo y horas totales se actualizarán automáticamente."
                                />
                                <span className="text-slate-500 font-medium">h</span>
                              </div>
                            </td>

                            {/* Costo Calculado */}
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                              {currencySymbol}{' '}
                              {subItemCost.toLocaleString('es-PE', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </td>

                            {/* Eliminar Sub-item */}
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => onDeleteSubItem(feature, sIdx)}
                                className="p-1 text-slate-300 hover:text-red-600 rounded transition"
                                title="Eliminar esta sub-tarea"
                              >
                                <MdDeleteOutline size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100/90 font-bold text-[11px] text-slate-900 border-t border-slate-200">
                        <td colSpan={2} className="py-2 px-3 uppercase text-right">
                          Total Sub-tareas ({feature.subItems.length} ítems)
                        </td>
                        <td className="py-2 px-3 text-center text-indigo-700">
                          {horas.toFixed(1)} h
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-800 font-black">
                          {currencySymbol}{' '}
                          {costo.toLocaleString('es-PE', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-dashed border-slate-300">
                  <span className="text-slate-500 text-xs italic">
                    Esta funcionalidad no tiene sub-tareas detalladas todavía.
                  </span>
                  <button
                    type="button"
                    onClick={() => onAddSubItem(feature, index)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg transition"
                  >
                    <MdAdd size={14} /> Desglosar en Sub-tareas
                  </button>
                </div>
              )}

              {feature.notas && (
                <div className="pt-1">
                  <span className="font-bold text-slate-900">Notas adicionales:</span>{' '}
                  <span className="text-slate-600">{feature.notas}</span>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default SortableFeatureRow;
