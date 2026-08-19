import React from 'react';
import Link from 'next/link';
import PrivateRoutesAdmin from '@/components/layouts/PrivateRoutesAdmin';
import { 
  RiSettings4Line, 
  RiPaletteLine,
  RiShieldUserLine
} from 'react-icons/ri';

const ConfiguracionPage = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-2">
            <RiSettings4Line className="text-blue-600 animate-spin-slow" />
            Configuración del Sistema
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Gestiona la apariencia visual del portal, colores y permisos de acciones en reportes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
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

        {/* Card: Permisos de Acciones de Reportes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group w-full flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              <RiShieldUserLine className="text-2xl" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Permisos de Reportes (Acciones)</h2>
            <p className="text-slate-500 text-sm mb-4">
              Configura globalmente los permisos de exportación (Excel, PDF) y descargas visibles para Directores y Especialistas.
            </p>
          </div>
          <Link href="/admin/configuracion/personalizacion?section=acciones" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            Configurar Permisos →
          </Link>
        </div>
      </div>
    </div>
  );
};

ConfiguracionPage.Auth = PrivateRoutesAdmin;

export default ConfiguracionPage;
