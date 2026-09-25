import React, { useState, useMemo, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import {
  MdCheckCircle,
  MdRadioButtonUnchecked,
  MdSearch,
  MdCode,
  MdExpandMore,
  MdExpandLess,
  MdDoneAll,
  MdRemoveDone
} from 'react-icons/md';
import {
  DetectedFeature,
  getFeaturesDetectadas
} from '@/features/utils/catalogFeaturesCodebase';
import { MatrizConfig } from '@/features/utils/exportarMatrizCostosPDF';
import { toast } from 'react-toastify';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (featuresToImport: DetectedFeature[]) => Promise<void>;
  config: MatrizConfig;
}

export default function ModalDetectarFeatures({
  isOpen,
  onClose,
  onImport,
  config
}: Props) {
  const [items, setItems] = useState<DetectedFeature[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModulo, setSelectedModulo] = useState('TODOS');
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);

  // Inicializar items cada vez que se abre el modal
  useEffect(() => {
    if (isOpen) {
      const initial = getFeaturesDetectadas(config.defaultHourlyRate || 50);
      setItems(initial);
      setSearchTerm('');
      setSelectedModulo('TODOS');
      setExpandedIndices(new Set());
    }
  }, [isOpen, config.defaultHourlyRate]);

  // Lista de módulos únicos para filtrar
  const modulosDisponibles = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => s.add(i.modulo));
    return Array.from(s);
  }, [items]);

  // Items filtrados por búsqueda y módulo
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        searchTerm === '' ||
        item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.modulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchModulo = selectedModulo === 'TODOS' || item.modulo === selectedModulo;

      return matchSearch && matchModulo;
    });
  }, [items, searchTerm, selectedModulo]);

  // Resumen de seleccionadas
  const selectedItems = useMemo(() => {
    return items.filter((i) => i.seleccionada);
  }, [items]);

  const totalHorasSeleccionadas = useMemo(() => {
    return selectedItems.reduce((acc, i) => acc + (Number(i.horasReales) || 0), 0);
  }, [selectedItems]);

  const totalCostoSeleccionado = useMemo(() => {
    return selectedItems.reduce((acc, i) => acc + (Number(i.costoTotal) || 0), 0);
  }, [selectedItems]);

  if (!isOpen) return null;

  const toggleSelectAll = (select: boolean) => {
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        seleccionada: select
      }))
    );
  };

  const toggleItem = (originalIndex: number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[originalIndex] = {
        ...copy[originalIndex],
        seleccionada: !copy[originalIndex].seleccionada
      };
      return copy;
    });
  };

  const handleHoursChange = (originalIndex: number, newHours: number) => {
    setItems((prev) => {
      const copy = [...prev];
      const hours = isNaN(newHours) || newHours < 0 ? 0 : newHours;
      const rate = copy[originalIndex].tarifaPorHora || config.defaultHourlyRate || 50;
      copy[originalIndex] = {
        ...copy[originalIndex],
        horasReales: hours,
        horasEstimadas: hours,
        costoTotal: Math.round(hours * rate * 100) / 100
      };
      return copy;
    });
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
    if (selectedItems.length === 0) {
      toast.warning('Selecciona al menos una feature para importar a la matriz.');
      return;
    }

    setIsImporting(true);
    try {
      await onImport(selectedItems);
      toast.success(`Se importaron exitosamente ${selectedItems.length} features a la matriz.`);
      onClose();
    } catch (err) {
      console.error('Error importando features:', err);
      toast.error('Ocurrió un error al importar las features.');
    } finally {
      setIsImporting(false);
    }
  };

  const currencySymbol = config.currency === 'USD' ? '$' : 'S/';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6 border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
              <MdCode size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Features Detectadas en la Arquitectura de EVA
                <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full font-semibold">
                  {items.length} identificadas
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Funcionalidades mapeadas a partir de rutas, modales, controladores y componentes del proyecto
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

        {/* Resumen de selección y filtros */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Buscador */}
            <div className="relative flex-1 w-full">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Filtrar por nombre, módulo o componente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Selector de Módulo */}
            <select
              value={selectedModulo}
              onChange={(e) => setSelectedModulo(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700"
            >
              <option value="TODOS">Todos los Módulos ({items.length})</option>
              {modulosDisponibles.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Botones de acción rápida y totalizador */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleSelectAll(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition bg-white border border-slate-200 shadow-xs"
              >
                <MdDoneAll size={14} className="text-blue-600" />
                Seleccionar Todas
              </button>
              <button
                type="button"
                onClick={() => toggleSelectAll(false)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition bg-white border border-slate-200 shadow-xs"
              >
                <MdRemoveDone size={14} className="text-slate-400" />
                Deseleccionar
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="font-semibold text-slate-600">
                Seleccionadas:{' '}
                <strong className="text-blue-600">{selectedItems.length}</strong> / {items.length}
              </span>
              <span className="text-slate-300">|</span>
              <span className="font-semibold text-slate-600">
                Horas: <strong className="text-slate-900">{totalHorasSeleccionadas.toFixed(1)} h</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span className="font-bold text-emerald-700">
                Total:{' '}
                {currencySymbol}{' '}
                {totalCostoSeleccionado.toLocaleString('es-PE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Lista de Features Detectadas (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100">
          {filteredItems.map((item) => {
            const originalIndex = items.findIndex((it) => it.titulo === item.titulo);
            const isExpanded = expandedIndices.has(originalIndex);

            return (
              <div
                key={item.titulo}
                className={`pt-2.5 rounded-xl p-3 border transition ${
                  item.seleccionada
                    ? 'bg-blue-50/40 border-blue-200 shadow-xs'
                    : 'bg-white border-slate-200 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Checkbox y Título */}
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleItem(originalIndex)}
                      className="mt-0.5 text-blue-600 hover:scale-110 transition"
                      title={item.seleccionada ? 'Desmarcar' : 'Seleccionar'}
                    >
                      {item.seleccionada ? (
                        <MdCheckCircle size={20} className="text-blue-600" />
                      ) : (
                        <MdRadioButtonUnchecked size={20} className="text-slate-400" />
                      )}
                    </button>

                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {item.titulo}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700">
                          {item.modulo}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-emerald-100 text-emerald-800">
                          {item.prioridad}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.descripcion}
                      </p>

                      {/* Botón para ver archivos técnicos vinculados */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => toggleExpand(originalIndex)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition"
                        >
                          <MdCode size={13} />
                          {item.archivos.length} archivos/componentes vinculados
                          {isExpanded ? <MdExpandLess size={14} /> : <MdExpandMore size={14} />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 p-2.5 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono space-y-1 border border-slate-800">
                            <p className="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-wider mb-1">
                              Rutas e Implementaciones Detectadas:
                            </p>
                            {item.archivos.map((arc) => (
                              <div key={arc} className="flex items-center gap-1.5 text-emerald-400">
                                <span className="text-slate-500">›</span> {arc}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Horas y Costo Estimado */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">
                        Horas:
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={item.horasReales}
                        onChange={(e) =>
                          handleHoursChange(originalIndex, parseFloat(e.target.value))
                        }
                        className="w-16 px-2 py-1 text-xs border border-slate-300 rounded-lg text-center font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-700">
                        {currencySymbol}{' '}
                        {item.costoTotal.toLocaleString('es-PE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {currencySymbol} {item.tarifaPorHora}/hr
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-100 border-t border-slate-200 shrink-0">
          <div className="text-xs text-slate-600 text-center sm:text-left">
            Total a importar:{' '}
            <strong className="text-slate-900">{selectedItems.length} features</strong> con un total de{' '}
            <strong className="text-emerald-700 font-bold">
              {currencySymbol}{' '}
              {totalCostoSeleccionado.toLocaleString('es-PE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={isImporting || selectedItems.length === 0}
              onClick={handleConfirmImport}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isImporting ? (
                <>Importando a Firestore...</>
              ) : (
                <>
                  <MdDoneAll size={16} />
                  Importar {selectedItems.length} Features a la Matriz
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
