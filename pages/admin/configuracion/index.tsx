import React, { useState } from 'react';
import Link from 'next/link';
import PrivateRoutesAdmin from '@/components/layouts/PrivateRoutesAdmin';
import { 
  RiSettings4Line, 
  RiPaletteLine,
  RiShieldUserLine,
  RiRocketLine,
  RiLineChartLine,
} from 'react-icons/ri';
import { MdDonutLarge } from 'react-icons/md';
import ConfigurarNivelesActuacionModal from '@/modals/ConfigurarNivelesActuacion';
import { useDirectorTabsConfig } from '@/components/reportes/director/useDirectorTabsConfig';

const ConfiguracionPage = () => {
  const [showNivelesModal, setShowNivelesModal] = useState(false);
  const { tabVisibility, saveTabVisibility, isSaving } = useDirectorTabsConfig();

  const isEvolucionActive = tabVisibility.evolucion !== false;

  const handleToggleEvolucion = async () => {
    await saveTabVisibility('evolucion', !isEvolucionActive);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      {showNivelesModal && (
        <ConfigurarNivelesActuacionModal
          showModal={showNivelesModal}
          handleClose={() => setShowNivelesModal(false)}
        />
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-2">
            <RiSettings4Line className="text-blue-600 animate-spin-slow" />
            Configuración del Sistema
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Gestiona la apariencia visual del portal, colores, permisos de acciones, niveles pedagógicos y actualizaciones.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
        {/* Card: Personalización de Marca */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group w-full flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4 group-hover:bg-violet-600 group-hover:text-white transition-all duration-300">
              <RiPaletteLine className="text-2xl" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Personalización de Marca</h2>
            <p className="text-slate-500 text-sm mb-4">
              Gestiona los colores principales de la marca, los estilos de los botones y logotipos del portal.
            </p>
          </div>
          <Link href="/admin/configuracion/personalizacion" className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors">
            Personalizar Marca →
          </Link>
        </div>

        {/* Card: Niveles por Actuación (Evaluaciones Progresivas) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group w-full flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              <MdDonutLarge className="text-2xl" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Niveles por Actuación</h2>
            <p className="text-slate-500 text-sm mb-4">
              Configura globalmente la escala de 4 niveles formativos (Por desarrollo, Iniciándose, Consolidación, Autonomía) para la Diana Polar y reportes progresivos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNivelesModal(true)}
            className="text-left text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            Configurar Niveles Globales →
          </button>
        </div>

        {/* Card: Permisos de Acciones de Reportes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group w-full flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
              <RiShieldUserLine className="text-2xl" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Permisos de Reportes (Acciones)</h2>
            <p className="text-slate-500 text-sm mb-4">
              Configura globalmente los permisos de exportación (Excel, PDF) y descargas visibles para Directores y Especialistas.
            </p>
          </div>
          <Link href="/admin/configuracion/personalizacion?section=acciones" className="text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors">
            Configurar Permisos →
          </Link>
        </div>

        {/* Card: Control de Actualizaciones */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group w-full flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
              <RiRocketLine className="text-2xl" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Control de Actualizaciones</h2>
            <p className="text-slate-500 text-sm mb-4">
              Gestiona y notifica en tiempo real los nuevos despliegues a los usuarios conectados para que actualicen su navegador sin perder datos.
            </p>
          </div>
          <Link href="/admin/configuracion/actualizaciones" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
            Gestionar Versiones →
          </Link>
        </div>

        {/* Card: Pestaña Evolución de Estudiantes (Diana Polar & Progresión) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group w-full flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <RiLineChartLine className="text-2xl" />
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                  isEvolucionActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isEvolucionActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                {isEvolucionActive ? 'Pestaña Activa' : 'Pestaña Oculta'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">
              Evolución de Estudiantes
            </h2>
            <p className="text-slate-500 text-sm mb-4">
              Controla la visibilidad global de la pestaña de Evolución de Estudiantes y el gráfico Diana Polar en los reportes de docentes y directores.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">
              {isEvolucionActive ? 'Visible en reportes' : 'Oculto para todos'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isEvolucionActive}
              disabled={isSaving}
              onClick={handleToggleEvolucion}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isEvolucionActive ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
              title={isEvolucionActive ? 'Desactivar pestaña' : 'Activar pestaña'}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isEvolucionActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

ConfiguracionPage.Auth = PrivateRoutesAdmin;

export default ConfiguracionPage;
