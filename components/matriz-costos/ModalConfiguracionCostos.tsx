import React, { useState, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import { MatrizConfig } from '@/features/utils/exportarMatrizCostosPDF';
import { toast } from 'react-toastify';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newConfig: MatrizConfig) => Promise<void>;
  currentConfig: MatrizConfig;
}

export default function ModalConfiguracionCostos({
  isOpen,
  onClose,
  onSave,
  currentConfig
}: Props) {
  const [developerName, setDeveloperName] = useState(currentConfig.developerName || '');
  const [developerDni, setDeveloperDni] = useState(currentConfig.developerDni || '47163626');
  const [clientName, setClientName] = useState(currentConfig.clientName || 'UGEL 13 - Yauyos');
  const [projectName, setProjectName] = useState(currentConfig.projectName || 'Sistema EVA');
  const [currency, setCurrency] = useState(currentConfig.currency || 'PEN');
  const [defaultHourlyRate, setDefaultHourlyRate] = useState<number | ''>(currentConfig.defaultHourlyRate || 50);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDeveloperName(currentConfig.developerName || 'Desarrollador Principal');
    setDeveloperDni(currentConfig.developerDni || '47163626');
    setClientName(currentConfig.clientName || 'UGEL 13 - Yauyos');
    setProjectName(currentConfig.projectName || 'Sistema EVA');
    setCurrency(currentConfig.currency || 'PEN');
    setDefaultHourlyRate(currentConfig.defaultHourlyRate || 50);
  }, [currentConfig, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        developerName: developerName.trim(),
        developerDni: developerDni.trim() || '47163626',
        clientName: clientName.trim(),
        projectName: projectName.trim(),
        currency,
        defaultHourlyRate: Number(defaultHourlyRate) || 50
      });
      toast.success('Configuración guardada correctamente.');
      onClose();
    } catch (err) {
      console.error('Error guardando configuración:', err);
      toast.error('Error al guardar configuración.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Configuración de Matriz y Reportes PDF
            </h3>
            <p className="text-xs text-slate-400">
              Datos de emisor, tarifas y moneda predeterminada
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <IoClose size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Nombre del Desarrollador
            </label>
            <input
              type="text"
              value={developerName}
              onChange={(e) => setDeveloperName(e.target.value)}
              placeholder="Ej. Juan Pérez"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                DNI / Identificador
              </label>
              <input
                type="text"
                value={developerDni}
                onChange={(e) => setDeveloperDni(e.target.value)}
                placeholder="47163626"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Moneda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="PEN">Soles (S/ - PEN)</option>
                <option value="USD">Dólares ($ - USD)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tarifa / Hora por Defecto
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={defaultHourlyRate}
                onChange={(e) => setDefaultHourlyRate(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="50"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nombre del Proyecto
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Sistema EVA"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Cliente / Institución
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="UGEL 13 - Yauyos"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
              className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-black rounded-lg transition disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Guardar Ajustes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
