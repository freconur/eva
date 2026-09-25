import React, { useState, useEffect, useMemo } from 'react';
import { IoClose } from 'react-icons/io5';
import {
  MdLayers,
  MdCheckCircle,
  MdRadioButtonUnchecked,
  MdCode,
  MdExpandMore,
  MdExpandLess,
  MdDoneAll,
  MdRemoveDone,
  MdAdd,
  MdDeleteOutline,
  MdFormatListNumbered
} from 'react-icons/md';
import {
  COMPONENTES_DESGLOSADOS,
  getDesgloseDeComponente,
  SubFeatureComponente
} from '@/features/utils/desgloseComponentesCodebase';
import { MatrizConfig, FeatureCostoItem, SubItemDetallado } from '@/features/utils/exportarMatrizCostosPDF';
import { toast } from 'react-toastify';

interface SubFeatureConEstado extends SubFeatureComponente {
  tarifaPorHora: number;
  costoTotal: number;
  fecha: string;
  seleccionada: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (subFeaturesToImport: FeatureCostoItem[]) => Promise<void>;
  config: MatrizConfig;
}

export default function ModalDesglosarComponente({
  isOpen,
  onClose,
  onImport,
  config
}: Props) {
  // Inicia por defecto con la matriz de resultados comparativa (EDI, EP1, EP2)
  const [selectedComponentId, setSelectedComponentId] = useState<string>('matriz-resultados');
  const [subFeatures, setSubFeatures] = useState<SubFeatureConEstado[]>([]);
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);

  // Cargar sub-features cuando cambia el componente seleccionado o se abre el modal
  useEffect(() => {
    if (isOpen) {
      const desglose = getDesgloseDeComponente(selectedComponentId, config.defaultHourlyRate || 50);
      if (desglose) {
        setSubFeatures(desglose.subFeatures as SubFeatureConEstado[]);
        setExpandedIndices(new Set());
      }
    }
  }, [isOpen, selectedComponentId, config.defaultHourlyRate]);

  const activeComponent = useMemo(() => {
    return COMPONENTES_DESGLOSADOS.find((c) => c.id === selectedComponentId) || COMPONENTES_DESGLOSADOS[0];
  }, [selectedComponentId]);

  const selectedSubFeatures = useMemo(() => {
    return subFeatures.filter((sf) => sf.seleccionada);
  }, [subFeatures]);

  const totalHoras = useMemo(() => {
    return selectedSubFeatures.reduce((acc, sf) => acc + (Number(sf.horasReales) || 0), 0);
  }, [selectedSubFeatures]);

  const totalCosto = useMemo(() => {
    return selectedSubFeatures.reduce((acc, sf) => acc + (Number(sf.costoTotal) || 0), 0);
  }, [selectedSubFeatures]);

  if (!isOpen) return null;

  const toggleSelectAll = (select: boolean) => {
    setSubFeatures((prev) =>
      prev.map((sf) => ({
        ...sf,
        seleccionada: select
      }))
    );
  };

  const toggleItem = (index: number) => {
    setSubFeatures((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        seleccionada: !copy[index].seleccionada
      };
      return copy;
    });
  };

  // Cambio manual de horas directas de la feature (solo si no tiene sub-items)
  const handleHoursChange = (index: number, newHours: number) => {
    setSubFeatures((prev) => {
      const copy = [...prev];
      const hours = isNaN(newHours) || newHours < 0 ? 0 : newHours;
      const rate = copy[index].tarifaPorHora || config.defaultHourlyRate || 50;
      copy[index] = {
        ...copy[index],
        horasReales: hours,
        horasEstimadas: hours,
        costoTotal: Math.round(hours * rate * 100) / 100
      };
      return copy;
    });
  };

  // Agregar un nuevo sub-item a una feature específica
  const handleAddSubItem = (featureIndex: number) => {
    setSubFeatures((prev) => {
      const copy = [...prev];
      const target = { ...copy[featureIndex] };
      const currentSubItems: SubItemDetallado[] = target.subItems ? [...target.subItems] : [];
      const parentNum = target.codigo ? target.codigo.replace(/[^0-9]/g, '') : `${featureIndex + 1}`;
      const newCode = `${parentNum ? parseInt(parentNum, 10) : featureIndex + 1}.${currentSubItems.length + 1}`;

      currentSubItems.push({
        codigo: newCode,
        descripcion: '',
        horas: 1
      });

      target.subItems = currentSubItems;
      const sumH = currentSubItems.reduce((acc, it) => acc + (Number(it.horas) || 0), 0);
      target.horasReales = sumH;
      target.horasEstimadas = sumH;
      const rate = target.tarifaPorHora || config.defaultHourlyRate || 50;
      target.costoTotal = Math.round(sumH * rate * 100) / 100;

      copy[featureIndex] = target;
      return copy;
    });
  };

  // Modificar un sub-item existente
  const handleUpdateSubItem = (
    featureIndex: number,
    subItemIndex: number,
    field: 'codigo' | 'descripcion' | 'horas',
    value: string | number
  ) => {
    setSubFeatures((prev) => {
      const copy = [...prev];
      const target = { ...copy[featureIndex] };
      if (!target.subItems) return prev;

      const subItemsCopy = [...target.subItems];
      const itemToUpdate = { ...subItemsCopy[subItemIndex] };

      if (field === 'horas') {
        const h = isNaN(Number(value)) || Number(value) < 0 ? 0 : Number(value);
        itemToUpdate.horas = h;
      } else if (field === 'codigo') {
        itemToUpdate.codigo = String(value);
      } else {
        itemToUpdate.descripcion = String(value);
      }

      subItemsCopy[subItemIndex] = itemToUpdate;
      target.subItems = subItemsCopy;

      // Recalcular total de horas de la feature
      const sumH = subItemsCopy.reduce((acc, it) => acc + (Number(it.horas) || 0), 0);
      target.horasReales = sumH;
      target.horasEstimadas = sumH;
      const rate = target.tarifaPorHora || config.defaultHourlyRate || 50;
      target.costoTotal = Math.round(sumH * rate * 100) / 100;

      copy[featureIndex] = target;
      return copy;
    });
  };

  // Eliminar un sub-item
  const handleDeleteSubItem = (featureIndex: number, subItemIndex: number) => {
    setSubFeatures((prev) => {
      const copy = [...prev];
      const target = { ...copy[featureIndex] };
      if (!target.subItems) return prev;

      const subItemsCopy = target.subItems.filter((_, idx) => idx !== subItemIndex);
      target.subItems = subItemsCopy;

      const sumH = subItemsCopy.reduce((acc, it) => acc + (Number(it.horas) || 0), 0);
      target.horasReales = sumH;
      target.horasEstimadas = sumH;
      const rate = target.tarifaPorHora || config.defaultHourlyRate || 50;
      target.costoTotal = Math.round(sumH * rate * 100) / 100;

      copy[featureIndex] = target;
      return copy;
    });
  };

  // Agregar una nueva feature completa al desglose
  const handleAddNewFeatureToComponent = () => {
    const nextIdx = subFeatures.length + 1;
    const rate = config.defaultHourlyRate || 50;
    const newFeature: SubFeatureConEstado = {
      codigo: `F-00${nextIdx}`,
      titulo: `Funcionalidad Personalizada ${nextIdx}`,
      modulo: activeComponent.modulo,
      tipo: 'Nueva Feature',
      modalidad: 'horas',
      horasEstimadas: 2,
      horasReales: 2,
      tarifaPorHora: rate,
      costoTotal: Math.round(2 * rate * 100) / 100,
      estado: 'Completado',
      prioridad: 'Alta',
      descripcion: 'Descripción del desarrollo técnico y alcance de la nueva funcionalidad.',
      subItems: [
        {
          codigo: `${nextIdx}.1`,
          descripcion: 'Desarrollo de lógica inicial y estructura de interfaz',
          horas: 2
        }
      ],
      archivos: [activeComponent.rutaPrincipal],
      fecha: new Date().toISOString().split('T')[0],
      seleccionada: true
    };

    setSubFeatures((prev) => [...prev, newFeature]);
    toast.success('Nueva funcionalidad agregada al desglose. Puedes editarla y agregar sub-tareas.');
  };

  const toggleExpand = (index: number) => {
    setExpandedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleConfirmImport = async () => {
    if (selectedSubFeatures.length === 0) {
      toast.warning('Selecciona al menos una funcionalidad para importar a la matriz.');
      return;
    }

    setIsImporting(true);
    try {
      const formattedItems: FeatureCostoItem[] = selectedSubFeatures.map((sf) => {
        const item: FeatureCostoItem = {
          titulo: sf.titulo,
          modulo: sf.modulo,
          tipo: sf.tipo,
          modalidad: sf.modalidad,
          horasEstimadas: sf.horasEstimadas,
          horasReales: sf.horasReales,
          tarifaPorHora: sf.tarifaPorHora,
          costoTotal: sf.costoTotal,
          estado: sf.estado,
          prioridad: sf.prioridad,
          descripcion: sf.descripcion,
          notas: sf.notas || (sf.archivos && sf.archivos.length > 0 ? `Archivos: ${sf.archivos.join(', ')}` : ''),
          fecha: sf.fecha || new Date().toISOString().split('T')[0]
        };

        if (sf.codigo) item.codigo = sf.codigo;
        if (sf.tituloCliente) item.tituloCliente = sf.tituloCliente;
        if (sf.descripcionCliente) item.descripcionCliente = sf.descripcionCliente;
        if (sf.subItems && sf.subItems.length > 0) {
          item.subItems = sf.subItems.map((sub, idx) => ({
            codigo: sub.codigo || `${sf.codigo ? sf.codigo.replace(/[^0-9]/g, '') : ''}.${idx + 1}`,
            descripcion: sub.descripcion || '',
            horas: Number(sub.horas) || 0
          }));
        }

        return item;
      });

      await onImport(formattedItems);
      toast.success(
        `Se importaron ${formattedItems.length} funcionalidades con sus sub-tareas a la matriz de costos.`
      );
      onClose();
    } catch (err) {
      console.error('Error al importar funcionalidades desglosadas:', err);
      toast.error('Ocurrió un error al importar las funcionalidades.');
    } finally {
      setIsImporting(false);
    }
  };

  const currencySymbol = config.currency === 'USD' ? '$' : 'S/';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6 border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30">
              <MdLayers size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Desglose y Detalle Técnico por Componente
                <span className="text-xs bg-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                  Triada EDI, EP1, EP2
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Visualiza y edita cada sub-tarea, horas y alcance implementado para que funcione la feature principal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <IoClose size={22} />
          </button>
        </div>

        {/* Selector del Componente a Analizar */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 shrink-0 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Selecciona el Módulo / Componente a Desglosar:
            </label>
            <select
              value={selectedComponentId}
              onChange={(e) => setSelectedComponentId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-semibold border border-indigo-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 shadow-xs"
            >
              {COMPONENTES_DESGLOSADOS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.rutaPrincipal})
                </option>
              ))}
            </select>
          </div>

          {/* Ficha descriptiva del componente seleccionado */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                  {activeComponent.rutaPrincipal}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {activeComponent.modulo}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddNewFeatureToComponent}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
                  title="Agregar otra funcionalidad completa a este componente"
                >
                  <MdAdd size={15} />
                  Nueva Feature al Desglose
                </button>
                <div className="text-xs font-bold text-slate-700">
                  {subFeatures.length} funcionalidades mapeadas
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {activeComponent.descripcionGeneral}
            </p>

            {/* Totalizadores en vivo */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleSelectAll(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition border border-slate-200"
                >
                  <MdDoneAll size={14} className="text-indigo-600" />
                  Seleccionar Todas
                </button>
                <button
                  type="button"
                  onClick={() => toggleSelectAll(false)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition border border-slate-200"
                >
                  <MdRemoveDone size={14} className="text-slate-400" />
                  Deseleccionar
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-600">
                  Seleccionadas: <strong className="text-indigo-600">{selectedSubFeatures.length}</strong> / {subFeatures.length}
                </span>
                <span className="text-slate-300">|</span>
                <span className="font-semibold text-slate-600">
                  Horas: <strong className="text-slate-900">{totalHoras.toFixed(1)} h</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span className="font-black text-emerald-700">
                  Inversión: {currencySymbol}{' '}
                  {totalCosto.toLocaleString('es-PE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Sub-features Desglosadas con Sub-items tipo Hoja de Cálculo */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {subFeatures.map((sf, idx) => {
            const isExpanded = expandedIndices.has(idx);
            const hasSubItems = sf.subItems && sf.subItems.length > 0;

            return (
              <div
                key={sf.codigo || sf.titulo}
                className={`rounded-2xl p-4 border transition ${
                  sf.seleccionada
                    ? 'bg-white border-indigo-300 shadow-sm'
                    : 'bg-slate-50/70 border-slate-200 opacity-60 hover:opacity-100'
                }`}
              >
                {/* Cabecera de la Feature */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleItem(idx)}
                      className="mt-1 text-indigo-600 hover:scale-110 transition"
                      title={sf.seleccionada ? 'Desmarcar' : 'Seleccionar'}
                    >
                      {sf.seleccionada ? (
                        <MdCheckCircle size={22} className="text-indigo-600" />
                      ) : (
                        <MdRadioButtonUnchecked size={22} className="text-slate-400" />
                      )}
                    </button>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                          {`F-${String(idx + 1).padStart(3, '0')}`}
                        </span>
                        <span className="font-bold text-sm text-slate-900">
                          {sf.titulo}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700">
                          {sf.tipo}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-emerald-100 text-emerald-800">
                          {sf.prioridad}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {sf.descripcion}
                      </p>

                      {/* Archivos y componentes técnicos */}
                      {sf.archivos && sf.archivos.length > 0 && (
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={() => toggleExpand(idx)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition"
                          >
                            <MdCode size={13} />
                            {sf.archivos.length} componentes/archivos vinculados
                            {isExpanded ? <MdExpandLess size={14} /> : <MdExpandMore size={14} />}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 p-2.5 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono space-y-1 border border-slate-800">
                              <p className="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-wider mb-1">
                                Código fuente analizado:
                              </p>
                              {sf.archivos.map((arc) => (
                                <div key={arc} className="flex items-center gap-1.5 text-emerald-400">
                                  <span className="text-slate-500">›</span> {arc}
                                </div>
                              ))}
                              {sf.notas && (
                                <p className="text-[10px] text-slate-400 font-sans pt-1">
                                  Nota: {sf.notas}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resumen de Horas y Costo de la Feature */}
                  <div className="flex flex-col items-end gap-1 shrink-0 pl-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500 font-medium">Horas:</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={sf.horasReales}
                        disabled={hasSubItems}
                        onChange={(e) => handleHoursChange(idx, parseFloat(e.target.value))}
                        className={`w-16 px-2 py-1 text-xs font-bold text-center border rounded-lg outline-none ${
                          hasSubItems
                            ? 'bg-slate-100 text-slate-800 border-slate-300 cursor-not-allowed'
                            : 'bg-white border-indigo-300 focus:ring-2 focus:ring-indigo-500'
                        }`}
                        title={hasSubItems ? 'Horas calculadas automáticamente desde las sub-tareas' : 'Modificar horas estimadas'}
                      />
                      <span className="text-xs font-bold text-slate-600">hrs</span>
                    </div>
                    {hasSubItems && (
                      <span className="text-[10px] font-medium text-indigo-600 italic">
                        (Suma de sub-tareas)
                      </span>
                    )}

                    <div className="text-xs font-black text-emerald-700">
                      {currencySymbol}{' '}
                      {sf.costoTotal.toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                  </div>
                </div>

                {/* Sub-tareas Detalladas (Idéntico a la Hoja de Cálculo del Usuario) */}
                <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <MdFormatListNumbered className="text-indigo-600 text-sm" />
                      <span>Descripción Detallada y Sub-tareas Desarrolladas</span>
                      <span className="ml-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        {sf.subItems?.length || 0} ítems
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddSubItem(idx)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
                      title="Agregar un ítem o sub-tarea detallada con sus horas"
                    >
                      <MdAdd size={14} />
                      + Agregar Sub-tarea
                    </button>
                  </div>

                  {/* Tabla / Lista de Sub-items */}
                  {sf.subItems && sf.subItems.length > 0 ? (
                    <div className="bg-slate-50/80 rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-200/60 text-slate-700 font-bold text-[11px]">
                            <th className="py-2 px-3 w-16 text-center">Ítem</th>
                            <th className="py-2 px-3">Descripción Detallada de lo Desarrollado</th>
                            <th className="py-2 px-3 w-28 text-center">Horas</th>
                            <th className="py-2 px-3 w-28 text-right">Subtotal</th>
                            <th className="py-2 px-2 w-10 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60 bg-white">
                          {sf.subItems.map((item, itemIdx) => {
                            const itemHours = Number(item.horas) || 0;
                            const itemSubtotal = itemHours * (sf.tarifaPorHora || config.defaultHourlyRate || 50);

                            return (
                              <tr key={itemIdx} className="hover:bg-indigo-50/20 transition">
                                {/* Código / Número */}
                                <td className="py-2 px-2 text-center">
                                  <input
                                    type="text"
                                    value={item.codigo || ''}
                                    onChange={(e) =>
                                      handleUpdateSubItem(idx, itemIdx, 'codigo', e.target.value)
                                    }
                                    placeholder="1.1"
                                    className="w-12 text-center text-xs font-mono font-bold bg-slate-100 border border-slate-300 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </td>

                                {/* Descripción de la sub-tarea */}
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={item.descripcion}
                                    onChange={(e) =>
                                      handleUpdateSubItem(idx, itemIdx, 'descripcion', e.target.value)
                                    }
                                    placeholder="Detalla lo desarrollado para este ítem..."
                                    className="w-full text-xs text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white px-1.5 py-0.5 rounded outline-none transition"
                                  />
                                </td>

                                {/* Horas */}
                                <td className="py-2 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      value={item.horas}
                                      onChange={(e) =>
                                        handleUpdateSubItem(
                                          idx,
                                          itemIdx,
                                          'horas',
                                          parseFloat(e.target.value)
                                        )
                                      }
                                      className="w-14 text-center text-xs font-bold bg-white border border-slate-300 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <span className="text-[11px] text-slate-500">h</span>
                                  </div>
                                </td>

                                {/* Subtotal */}
                                <td className="py-2 px-3 text-right font-bold text-slate-800">
                                  {currencySymbol} {itemSubtotal.toFixed(2)}
                                </td>

                                {/* Botón Eliminar Sub-item */}
                                <td className="py-2 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSubItem(idx, itemIdx)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition"
                                    title="Quitar este ítem"
                                  >
                                    <MdDeleteOutline size={15} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-3 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                      Sin sub-tareas desglosadas aún.{' '}
                      <button
                        type="button"
                        onClick={() => handleAddSubItem(idx)}
                        className="text-indigo-600 font-bold underline hover:text-indigo-800"
                      >
                        Presiona aquí para agregar la primera sub-tarea
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0">
          <div className="text-xs text-slate-600">
            Se importarán{' '}
            <strong className="text-slate-900 font-bold">
              {selectedSubFeatures.length}
            </strong>{' '}
            funcionalidades seleccionadas con un total de{' '}
            <strong className="text-indigo-700 font-bold">
              {totalHoras.toFixed(1)} horas
            </strong>{' '}
            y valor de{' '}
            <strong className="text-emerald-700 font-black">
              {currencySymbol} {totalCosto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isImporting || selectedSubFeatures.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <MdLayers size={16} />
              {isImporting
                ? 'Importando a la matriz...'
                : `Importar ${selectedSubFeatures.length} Features a la Matriz`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
