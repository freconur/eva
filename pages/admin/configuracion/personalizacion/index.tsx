import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PrivateRoutesAdmin from '@/components/layouts/PrivateRoutesAdmin';
import { 
  RiPaletteLine, 
  RiArrowLeftLine, 
  RiSave2Line, 
  RiRefreshLine,
  RiLayout4Line,
  RiBookOpenLine,
  RiArrowRightLine,
  RiCalculatorLine,
  RiFlaskLine,
  RiShieldUserLine,
  RiGlobalLine,
  RiArrowDownSLine,
  RiLoginBoxLine,
  RiSideBarLine
} from 'react-icons/ri';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';
import { toast } from 'react-toastify';

const DEFAULT_COLORS = {
  colorPrincipal: '#163297',
  colorSecundario: '#0a47c4',
  colorTercero: '#3ABEF9',
  colorBackground: '#12235f',
  colorLoginBackground: '#0b132b',
  colorLoginAccent: '#facc15',
  colorSidebarBackground: '#141d2b',
  colorSidebarAccent: '#f5c518',
  // Colores por defecto para las materias de secundaria
  colorMateriaComunicacion: '#0891b2',
  colorMateriaMatematica: '#dc2626',
  colorMateriaCiencia: '#059669',
  colorMateriaDpcc: '#7c3aed',
  colorMateriaSociales: '#ea580c'
};

const PersonalizacionMarcaPage = () => {
  // Estados de colores generales
  const [colorPrincipal, setColorPrincipal] = useState(DEFAULT_COLORS.colorPrincipal);
  const [colorSecundario, setColorSecundario] = useState(DEFAULT_COLORS.colorSecundario);
  const [colorTercero, setColorTercero] = useState(DEFAULT_COLORS.colorTercero);
  const [colorBackground, setColorBackground] = useState(DEFAULT_COLORS.colorBackground);
  const [colorLoginBackground, setColorLoginBackground] = useState(DEFAULT_COLORS.colorLoginBackground);
  const [colorLoginAccent, setColorLoginAccent] = useState(DEFAULT_COLORS.colorLoginAccent);
  
  // Estados de colores del sidebar
  const [colorSidebarBackground, setColorSidebarBackground] = useState(DEFAULT_COLORS.colorSidebarBackground);
  const [colorSidebarAccent, setColorSidebarAccent] = useState(DEFAULT_COLORS.colorSidebarAccent);

  // Estados de colores por materia
  const [colorMateriaComunicacion, setColorMateriaComunicacion] = useState(DEFAULT_COLORS.colorMateriaComunicacion);
  const [colorMateriaMatematica, setColorMateriaMatematica] = useState(DEFAULT_COLORS.colorMateriaMatematica);
  const [colorMateriaCiencia, setColorMateriaCiencia] = useState(DEFAULT_COLORS.colorMateriaCiencia);
  const [colorMateriaDpcc, setColorMateriaDpcc] = useState(DEFAULT_COLORS.colorMateriaDpcc);
  const [colorMateriaSociales, setColorMateriaSociales] = useState(DEFAULT_COLORS.colorMateriaSociales);

  const [activeSection, setActiveSection] = useState<'general' | 'login' | 'sidebar' | 'tarjetas'>('general');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const docRef = doc(db, 'configuracion', 'branding');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.colorPrincipal) setColorPrincipal(data.colorPrincipal);
          if (data.colorSecundario) setColorSecundario(data.colorSecundario);
          if (data.colorTercero) setColorTercero(data.colorTercero);
          if (data.colorBackground) setColorBackground(data.colorBackground);
          if (data.colorLoginBackground) setColorLoginBackground(data.colorLoginBackground);
          if (data.colorLoginAccent) setColorLoginAccent(data.colorLoginAccent);
          if (data.colorSidebarBackground) setColorSidebarBackground(data.colorSidebarBackground);
          if (data.colorSidebarAccent) setColorSidebarAccent(data.colorSidebarAccent);
          
          if (data.colorMateriaComunicacion) setColorMateriaComunicacion(data.colorMateriaComunicacion);
          if (data.colorMateriaMatematica) setColorMateriaMatematica(data.colorMateriaMatematica);
          if (data.colorMateriaCiencia) setColorMateriaCiencia(data.colorMateriaCiencia);
          if (data.colorMateriaDpcc) setColorMateriaDpcc(data.colorMateriaDpcc);
          if (data.colorMateriaSociales) setColorMateriaSociales(data.colorMateriaSociales);
        }
      } catch (error) {
        console.error('Error al obtener la configuración de marca:', error);
        toast.error('No se pudo cargar la configuración de marca');
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'configuracion', 'branding');
      await setDoc(docRef, {
        colorPrincipal,
        colorSecundario,
        colorTercero,
        colorBackground,
        colorLoginBackground,
        colorLoginAccent,
        colorSidebarBackground,
        colorSidebarAccent,
        colorMateriaComunicacion,
        colorMateriaMatematica,
        colorMateriaCiencia,
        colorMateriaDpcc,
        colorMateriaSociales,
        ultimaActualizacion: new Date()
      }, { merge: true });
      toast.success('¡Branding de marca guardado exitosamente!');
    } catch (error) {
      console.error('Error al guardar branding:', error);
      toast.error('Ocurrió un error al guardar los colores de la marca');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('¿Está seguro de que desea restablecer los colores predeterminados de esta sección?')) {
      if (activeSection === 'general') {
        setColorPrincipal(DEFAULT_COLORS.colorPrincipal);
        setColorSecundario(DEFAULT_COLORS.colorSecundario);
        setColorTercero(DEFAULT_COLORS.colorTercero);
        setColorBackground(DEFAULT_COLORS.colorBackground);
      } else if (activeSection === 'login') {
        setColorLoginBackground(DEFAULT_COLORS.colorLoginBackground);
        setColorLoginAccent(DEFAULT_COLORS.colorLoginAccent);
      } else if (activeSection === 'sidebar') {
        setColorSidebarBackground(DEFAULT_COLORS.colorSidebarBackground);
        setColorSidebarAccent(DEFAULT_COLORS.colorSidebarAccent);
      } else if (activeSection === 'tarjetas') {
        setColorMateriaComunicacion(DEFAULT_COLORS.colorMateriaComunicacion);
        setColorMateriaMatematica(DEFAULT_COLORS.colorMateriaMatematica);
        setColorMateriaCiencia(DEFAULT_COLORS.colorMateriaCiencia);
        setColorMateriaDpcc(DEFAULT_COLORS.colorMateriaDpcc);
        setColorMateriaSociales(DEFAULT_COLORS.colorMateriaSociales);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <div className="mb-6">
        <Link 
          href="/admin/configuracion" 
          className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
        >
          <RiArrowLeftLine /> Volver a Configuración
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
          <RiPaletteLine className="text-2xl" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">
            Personalización de Marca
          </h1>
          <p className="text-slate-500 text-sm">
            Gestiona la paleta de colores global, tarjetas de evaluación y componentes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Panel de Controles */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            {/* Dropdown Custom */}
            <div className="relative mb-8">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Seleccionar Sección
              </label>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-slate-700 font-semibold text-sm hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-[0.99] focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  <span className="text-violet-600 text-lg">
                    {activeSection === 'general' && <RiLayout4Line />}
                    {activeSection === 'login' && <RiLoginBoxLine />}
                    {activeSection === 'sidebar' && <RiSideBarLine />}
                    {activeSection === 'tarjetas' && <RiBookOpenLine />}
                  </span>
                  <span>
                    {activeSection === 'general' && 'Tema General'}
                    {activeSection === 'login' && 'Página de Login'}
                    {activeSection === 'sidebar' && 'Barra Lateral (Sidebar)'}
                    {activeSection === 'tarjetas' && 'Tarjetas Cursos'}
                  </span>
                </div>
                <RiArrowDownSLine className={`text-slate-400 text-lg transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection('general');
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-2 text-sm text-left transition-colors ${
                        activeSection === 'general' 
                          ? 'bg-violet-50 text-violet-600 font-bold' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className={activeSection === 'general' ? 'text-violet-600 text-lg' : 'text-slate-400 text-lg'}>
                        <RiLayout4Line />
                      </span>
                      <span>Tema General</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection('login');
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-2 text-sm text-left transition-colors ${
                        activeSection === 'login' 
                          ? 'bg-violet-50 text-violet-600 font-bold' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className={activeSection === 'login' ? 'text-violet-600 text-lg' : 'text-slate-400 text-lg'}>
                        <RiLoginBoxLine />
                      </span>
                      <span>Página de Login</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection('sidebar');
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-2 text-sm text-left transition-colors ${
                        activeSection === 'sidebar' 
                          ? 'bg-violet-50 text-violet-600 font-bold' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className={activeSection === 'sidebar' ? 'text-violet-600 text-lg' : 'text-slate-400 text-lg'}>
                        <RiSideBarLine />
                      </span>
                      <span>Barra Lateral (Sidebar)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection('tarjetas');
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-2 text-sm text-left transition-colors ${
                        activeSection === 'tarjetas' 
                          ? 'bg-violet-50 text-violet-600 font-bold' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className={activeSection === 'tarjetas' ? 'text-violet-600 text-lg' : 'text-slate-400 text-lg'}>
                        <RiBookOpenLine />
                      </span>
                      <span>Tarjetas Cursos</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {activeSection === 'general' && (
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-4">Colores del Portal</h3>
                
                {/* Color de Navbar */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Color de Navbar (Cabeceras y Menús)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorPrincipal}
                      onChange={(e) => setColorPrincipal(e.target.value)}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorPrincipal}
                      onChange={(e) => setColorPrincipal(e.target.value)}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Color de Fondo */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Color de Fondo (Contenido Principal)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorSecundario}
                      onChange={(e) => setColorSecundario(e.target.value)}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorSecundario}
                      onChange={(e) => setColorSecundario(e.target.value)}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Color Tercero */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Color de Botones y Acentos (Tercero)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorTercero}
                      onChange={(e) => setColorTercero(e.target.value)}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorTercero}
                      onChange={(e) => setColorTercero(e.target.value)}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Color de Fondo (Dashboard) */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Color de Fondo (Dashboard)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorBackground}
                      onChange={(e) => setColorBackground(e.target.value)}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorBackground}
                      onChange={(e) => setColorBackground(e.target.value)}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'login' && (
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-4">Página de Login</h3>

                {/* Color de Fondo de Login */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Color de Fondo de Login
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorLoginBackground}
                      onChange={(e) => {
                        setColorLoginBackground(e.target.value);
                      }}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorLoginBackground}
                      onChange={(e) => {
                        setColorLoginBackground(e.target.value);
                      }}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Color de Acento de Login */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Color de Acento de Login (Botón y Detalles)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorLoginAccent}
                      onChange={(e) => {
                        setColorLoginAccent(e.target.value);
                      }}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorLoginAccent}
                      onChange={(e) => {
                        setColorLoginAccent(e.target.value);
                      }}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'sidebar' && (
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-4">Barra Lateral (Sidebar)</h3>

                {/* Color de Fondo de Sidebar */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Color de Fondo del Sidebar
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorSidebarBackground}
                      onChange={(e) => {
                        setColorSidebarBackground(e.target.value);
                      }}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorSidebarBackground}
                      onChange={(e) => {
                        setColorSidebarBackground(e.target.value);
                      }}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Color de Acento de Sidebar */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Color de Acento (Links Activos / Hover)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorSidebarAccent}
                      onChange={(e) => {
                        setColorSidebarAccent(e.target.value);
                      }}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorSidebarAccent}
                      onChange={(e) => {
                        setColorSidebarAccent(e.target.value);
                      }}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'tarjetas' && (
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-4">Colores por Materia (Secundaria)</h3>
                
                {/* Comunicación */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Comunicación
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorMateriaComunicacion}
                      onChange={(e) => setColorMateriaComunicacion(e.target.value)}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorMateriaComunicacion}
                      onChange={(e) => setColorMateriaComunicacion(e.target.value)}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Matemática */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Matemática
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorMateriaMatematica}
                      onChange={(e) => setColorMateriaMatematica(e.target.value)}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorMateriaMatematica}
                      onChange={(e) => setColorMateriaMatematica(e.target.value)}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Ciencia y Tecnología */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Ciencia y Tecnología
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorMateriaCiencia}
                      onChange={(e) => setColorMateriaCiencia(e.target.value)}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorMateriaCiencia}
                      onChange={(e) => setColorMateriaCiencia(e.target.value)}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* DPCC */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    DPCC (Desarrollo Personal, Ciudadanía y Cívica)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorMateriaDpcc}
                      onChange={(e) => setColorMateriaDpcc(e.target.value)}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorMateriaDpcc}
                      onChange={(e) => setColorMateriaDpcc(e.target.value)}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Ciencias Sociales */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Ciencias Sociales
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={colorMateriaSociales}
                      onChange={(e) => setColorMateriaSociales(e.target.value)}
                      className="w-12 h-12 border border-slate-200 rounded-xl cursor-pointer p-1 bg-white"
                    />
                    <input 
                      type="text" 
                      value={colorMateriaSociales}
                      onChange={(e) => setColorMateriaSociales(e.target.value)}
                      maxLength={7}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-6 mt-6 flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <RiRefreshLine /> Restablecer
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 active:scale-95"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <RiSave2Line /> Guardar Branding
                </>
              )}
            </button>
          </div>
        </div>

        {/* Panel de Previsualización en Vivo */}
        <div className="lg:col-span-7 bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-inner flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RiLayout4Line className="text-slate-400 text-lg" />
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Previsualización en Vivo
              </h3>
            </div>
          </div>

          {/* Canvas de Previsualización */}
          <div 
            className="flex-1 min-h-[460px] border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm transition-all"
            style={{ 
              backgroundColor: 
                (activeSection === 'general' || activeSection === 'sidebar')
                  ? colorSecundario
                  : activeSection === 'login' 
                    ? colorLoginBackground 
                    : '#f8fafc' 
            }}
          >
            {(activeSection === 'general' || activeSection === 'sidebar') && (
              /* VISTA 1: PANEL ADMIN */
              <>
                {/* Header simulado */}
                <div 
                  className="px-6 py-4 flex items-center justify-between border-b border-white/10"
                  style={{ backgroundColor: colorPrincipal }}
                >
                  <div className="flex items-center gap-2 text-white">
                    <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center font-bold">L</div>
                    <span className="font-extrabold text-sm tracking-wide uppercase">LOGO INSTITUCIÓN</span>
                  </div>
                  <div className="flex gap-3 text-white/80 text-xs">
                    <span>Inicio</span>
                    <span>Reportes</span>
                    <span className="underline font-semibold text-white">Configuración</span>
                  </div>
                </div>

                {/* Contenido simulado */}
                <div className="flex-1 p-8 flex gap-6">
                  {/* Sidebar simulado */}
                  <div 
                     className="w-44 rounded-xl p-4 flex flex-col gap-2 border"
                     style={{ 
                       background: `linear-gradient(160deg, ${colorSidebarBackground} 0%, color-mix(in srgb, ${colorSidebarBackground} 75%, #000000) 100%)`,
                       borderColor: `color-mix(in srgb, ${colorSidebarBackground} 120%, #2d4260)`
                     }}
                  >
                    <div className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-2">Menú</div>
                    <div 
                      className="px-3 py-2 rounded-lg text-xs font-semibold border transition-all"
                      style={{ 
                        backgroundColor: `color-mix(in srgb, ${colorSidebarAccent} 8%, transparent)`,
                        borderColor: colorSidebarAccent,
                        color: '#ffffff'
                      }}
                    >
                      Dashboard
                    </div>
                    <div className="px-3 py-2 rounded-lg text-white/50 hover:bg-white/10 text-xs transition-colors">
                      Usuarios
                    </div>
                    <div className="px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 text-xs transition-colors">
                      Evaluaciones
                    </div>
                  </div>

                  {/* Contenedor central simulado */}
                  <div className="flex-1 bg-white p-6 rounded-xl border border-slate-100 flex flex-col justify-between shadow-sm">
                    <div>
                      <h4 className="text-slate-800 font-extrabold text-base mb-1">
                        Panel de Administración
                      </h4>
                      <p className="text-slate-400 text-[11px] mb-4">
                        Este es un ejemplo de cómo se visualiza el contraste de tus colores elegidos.
                      </p>

                      <div className="flex gap-2 mb-4">
                        <span 
                          className="px-2 py-1 rounded text-[10px] font-bold text-white uppercase"
                          style={{ backgroundColor: colorSecundario }}
                        >
                          Rol Administrador
                        </span>
                        <span 
                          className="px-2 py-1 rounded text-[10px] font-bold text-slate-700 bg-slate-100 uppercase"
                        >
                          Modo Activo
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        className="flex-1 px-4 py-2 rounded-lg text-white text-xs font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
                        style={{ backgroundColor: colorTercero }}
                      >
                        Botón Destacado
                      </button>
                      <button 
                        className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold bg-white hover:bg-slate-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'tarjetas' && (
              /* VISTA 2: TARJETAS DOCENTE (Evaluaciones Secundaria) */
              <div className="p-6 flex-1 flex flex-col bg-slate-50">
                <div className="flex items-center gap-2 mb-4">
                  <RiBookOpenLine className="text-slate-400 text-lg" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Educación Secundaria (Vista Docente)
                  </span>
                </div>

                <h4 className="text-slate-800 font-extrabold text-base mb-1">
                  1ro sec. <span className="text-slate-400 font-normal text-xs">(5 materias)</span>
                </h4>
                
                {/* Cuadrícula simulada de tarjetas */}
                <div className="grid grid-cols-2 gap-4 mt-3">
                  
                  {/* Tarjeta 1 - Comunicación */}
                  <div 
                    className="relative p-4 rounded-xl border transition-all shadow-sm hover:shadow flex flex-col justify-between h-[100px] cursor-pointer group overflow-hidden"
                    style={{ 
                      backgroundColor: `color-mix(in srgb, ${colorMateriaComunicacion} 6%, #ffffff)`,
                      borderColor: `color-mix(in srgb, ${colorMateriaComunicacion} 22%, #e5e7eb)` 
                    }}
                  >
                    {/* Background Icon */}
                    <div 
                      className="absolute -right-2 -bottom-3 text-5xl pointer-events-none transition-all group-hover:scale-110 group-hover:-rotate-6 opacity-[0.09]"
                      style={{ color: colorMateriaComunicacion }}
                    >
                      <RiBookOpenLine />
                    </div>
                    
                    <h5 className="text-xs font-bold font-sans relative z-10" style={{ color: `color-mix(in srgb, ${colorMateriaComunicacion} 80%, #1f2937)` }}>
                      Comunicación
                    </h5>
                    <div className="flex items-center justify-between text-[10px] pt-2 border-t relative z-10" style={{ color: `color-mix(in srgb, ${colorMateriaComunicacion} 75%, #6b7280)`, borderColor: `color-mix(in srgb, ${colorMateriaComunicacion} 15%, rgba(0,0,0,0.05))` }}>
                      <span>Disponible</span>
                      <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Tarjeta 2 - Matemática */}
                  <div 
                    className="relative p-4 rounded-xl border transition-all shadow-sm hover:shadow flex flex-col justify-between h-[100px] cursor-pointer group overflow-hidden"
                    style={{ 
                      backgroundColor: `color-mix(in srgb, ${colorMateriaMatematica} 6%, #ffffff)`,
                      borderColor: `color-mix(in srgb, ${colorMateriaMatematica} 22%, #e5e7eb)` 
                    }}
                  >
                    {/* Background Icon */}
                    <div 
                      className="absolute -right-2 -bottom-3 text-5xl pointer-events-none transition-all group-hover:scale-110 group-hover:-rotate-6 opacity-[0.09]"
                      style={{ color: colorMateriaMatematica }}
                    >
                      <RiCalculatorLine />
                    </div>

                    <h5 className="text-xs font-bold font-sans relative z-10" style={{ color: `color-mix(in srgb, ${colorMateriaMatematica} 80%, #1f2937)` }}>
                      Matemática
                    </h5>
                    <div className="flex items-center justify-between text-[10px] pt-2 border-t relative z-10" style={{ color: `color-mix(in srgb, ${colorMateriaMatematica} 75%, #6b7280)`, borderColor: `color-mix(in srgb, ${colorMateriaMatematica} 15%, rgba(0,0,0,0.05))` }}>
                      <span>Disponible</span>
                      <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Tarjeta 3 - Ciencia y Tecnología */}
                  <div 
                    className="relative p-4 rounded-xl border transition-all shadow-sm hover:shadow flex flex-col justify-between h-[100px] cursor-pointer group overflow-hidden"
                    style={{ 
                      backgroundColor: `color-mix(in srgb, ${colorMateriaCiencia} 6%, #ffffff)`,
                      borderColor: `color-mix(in srgb, ${colorMateriaCiencia} 22%, #e5e7eb)` 
                    }}
                  >
                    {/* Background Icon */}
                    <div 
                      className="absolute -right-2 -bottom-3 text-5xl pointer-events-none transition-all group-hover:scale-110 group-hover:-rotate-6 opacity-[0.09]"
                      style={{ color: colorMateriaCiencia }}
                    >
                      <RiFlaskLine />
                    </div>

                    <h5 className="text-xs font-bold font-sans relative z-10" style={{ color: `color-mix(in srgb, ${colorMateriaCiencia} 80%, #1f2937)` }}>
                      Ciencia y Tecnología
                    </h5>
                    <div className="flex items-center justify-between text-[10px] pt-2 border-t relative z-10" style={{ color: `color-mix(in srgb, ${colorMateriaCiencia} 75%, #6b7280)`, borderColor: `color-mix(in srgb, ${colorMateriaCiencia} 15%, rgba(0,0,0,0.05))` }}>
                      <span>Disponible</span>
                      <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Tarjeta 4 - DPCC */}
                  <div 
                    className="relative p-4 rounded-xl border transition-all shadow-sm hover:shadow flex flex-col justify-between h-[100px] cursor-pointer group overflow-hidden"
                    style={{ 
                      backgroundColor: `color-mix(in srgb, ${colorMateriaDpcc} 6%, #ffffff)`,
                      borderColor: `color-mix(in srgb, ${colorMateriaDpcc} 22%, #e5e7eb)` 
                    }}
                  >
                    {/* Background Icon */}
                    <div 
                      className="absolute -right-2 -bottom-3 text-5xl pointer-events-none transition-all group-hover:scale-110 group-hover:-rotate-6 opacity-[0.09]"
                      style={{ color: colorMateriaDpcc }}
                    >
                      <RiShieldUserLine />
                    </div>

                    <h5 className="text-xs font-bold font-sans relative z-10" style={{ color: `color-mix(in srgb, ${colorMateriaDpcc} 80%, #1f2937)` }}>
                      DPCC
                    </h5>
                    <div className="flex items-center justify-between text-[10px] pt-2 border-t relative z-10" style={{ color: `color-mix(in srgb, ${colorMateriaDpcc} 75%, #6b7280)`, borderColor: `color-mix(in srgb, ${colorMateriaDpcc} 15%, rgba(0,0,0,0.05))` }}>
                      <span>Disponible</span>
                      <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Tarjeta 5 - Ciencias Sociales */}
                  <div 
                    className="relative p-4 rounded-xl border transition-all shadow-sm hover:shadow flex flex-col justify-between h-[100px] cursor-pointer group overflow-hidden"
                    style={{ 
                      backgroundColor: `color-mix(in srgb, ${colorMateriaSociales} 6%, #ffffff)`,
                      borderColor: `color-mix(in srgb, ${colorMateriaSociales} 22%, #e5e7eb)` 
                    }}
                  >
                    {/* Background Icon */}
                    <div 
                      className="absolute -right-2 -bottom-3 text-5xl pointer-events-none transition-all group-hover:scale-110 group-hover:-rotate-6 opacity-[0.09]"
                      style={{ color: colorMateriaSociales }}
                    >
                      <RiGlobalLine />
                    </div>

                    <h5 className="text-xs font-bold font-sans relative z-10" style={{ color: `color-mix(in srgb, ${colorMateriaSociales} 80%, #1f2937)` }}>
                      Ciencias Sociales
                    </h5>
                    <div className="flex items-center justify-between text-[10px] pt-2 border-t relative z-10" style={{ color: `color-mix(in srgb, ${colorMateriaSociales} 75%, #6b7280)`, borderColor: `color-mix(in srgb, ${colorMateriaSociales} 15%, rgba(0,0,0,0.05))` }}>
                      <span>Disponible</span>
                      <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                </div>
              </div>
            )}

            {activeSection === 'login' && (
              /* VISTA 3: PÁGINA LOGIN */
              <div className="relative flex-1 p-6 flex flex-col justify-center items-center overflow-hidden font-sans text-white h-full min-h-[460px]">
                {/* Simulación del overlay con gradiente */}
                <div 
                  className="absolute inset-0 pointer-events-none transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, rgba(4, 35, 84, 0.90) 0%, rgba(2, 10, 24, 0.85) 50%, color-mix(in srgb, ${colorLoginAccent} 15%, transparent) 100%)`,
                    zIndex: 1
                  }}
                ></div>

                <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                  {/* Columna Izquierda */}
                  <div className="flex-1 text-left max-w-[240px]">
                    {/* Logo */}
                    <div className="mb-4 inline-block bg-white/5 p-2 rounded-xl border border-white/10 backdrop-blur-sm">
                      <div className="w-12 h-12 rounded-lg bg-orange-500/90 flex flex-col items-center justify-center text-[8px] font-bold leading-none select-none">
                        <span className="text-white opacity-70 scale-90">competence</span>
                        <span className="text-white text-[12px] font-black tracking-tight mt-0.5">LaB</span>
                      </div>
                    </div>
                    
                    <h4 className="text-base font-extrabold tracking-tight uppercase leading-tight mb-2">
                      BIENVENIDO A COMPETENCE
                    </h4>
                    <p className="text-white/70 text-[9px] leading-relaxed mb-3">
                      Plataforma integral para el seguimiento y evaluación del desarrollo de competencias.
                    </p>
                    {/* Línea decorativa */}
                    <div 
                      className="w-12 h-1 rounded-sm transition-colors duration-300"
                      style={{ backgroundColor: colorLoginAccent }}
                    ></div>
                  </div>

                  {/* Columna Derecha - Card */}
                  <div 
                    className="w-full max-w-[220px] bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-3"
                  >
                    <div className="text-center">
                      <h5 className="text-xs font-semibold">Iniciar Sesión</h5>
                      <span className="text-[8px] text-slate-400">Ingresa tus credenciales</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="px-2 py-1.5 bg-white/5 border border-white/15 rounded-md text-[9px] text-slate-300">
                        Correo Electrónico
                      </div>
                      <div className="px-2 py-1.5 bg-white/5 border border-white/15 rounded-md text-[9px] text-slate-300">
                        Contraseña
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[7px] text-slate-400 cursor-pointer">¿Olvidaste tu contraseña?</span>
                    </div>

                    <button 
                      className="w-full py-2 rounded-lg text-slate-900 text-[10px] font-extrabold uppercase tracking-wider transition-all duration-300 hover:brightness-110 active:scale-95 animate-pulse"
                      style={{ backgroundColor: colorLoginAccent }}
                    >
                      INGRESAR
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

PersonalizacionMarcaPage.Auth = PrivateRoutesAdmin;

export default PersonalizacionMarcaPage;
