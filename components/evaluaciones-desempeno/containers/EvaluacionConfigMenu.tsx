import React, { useState, useRef, useEffect } from 'react';
import {
  MdSettings,
  MdPlaylistAdd,
  MdAssignment,
  MdDescription,
  MdToggleOn,
  MdToggleOff,
  MdKeyboardArrowDown,
  MdAddCircle,
  MdEdit,
} from 'react-icons/md';
import { RiAwardLine } from 'react-icons/ri';
import useEvaluacionDesempenoBase from '@/features/hooks/useEvaluacionDesempenoBase';
import {
  ModalConfigurarEscala,
  ModalConfigurarFase,
  ModalConfigurarNiveles,
  ModalConfigurarNivelesPorDominio,
  ModalConfigurarDescripcion,
  ModalAgregarDimension,
  ModalAgregarPregunta,
  ModalEditarTituloDescripcion,
} from '../modals';
import { DimensionEspecialista, PRDocentes, AlternativasDocente, NivelYPuntaje } from '@/features/types/types';

export interface EvaluacionConfigMenuProps {
  idEvaluacion: string;
  collectionName?: string;
  dimensiones?: DimensionEspecialista[];
  preguntas?: PRDocentes[];
  escala?: AlternativasDocente[];
  niveles?: NivelYPuntaje[];
  activarEvidencias?: boolean;
  titulo?: string;
  descripcion?: string;
  faseActual?: string;
  onRefresh?: () => void;
  onAgregarDominio?: () => void;
  onAgregarPreguntas?: () => void;
}

export const EvaluacionConfigMenu: React.FC<EvaluacionConfigMenuProps> = ({
  idEvaluacion,
  collectionName,
  dimensiones = [],
  preguntas = [],
  escala = [],
  niveles = [],
  activarEvidencias = false,
  titulo = '',
  descripcion = '',
  faseActual = '',
  onRefresh,
  onAgregarDominio,
  onAgregarPreguntas,
}) => {
  const { updateActivacionEvidencias } = useEvaluacionDesempenoBase({ collectionName });

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<
    | 'agregarDominio'
    | 'escala'
    | 'niveles'
    | 'nivelesDominio'
    | 'fase'
    | 'descripcion'
    | 'editarTituloDescripcion'
    | 'agregarPregunta'
    | null
  >(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleEvidencias = async () => {
    try {
      await updateActivacionEvidencias(idEvaluacion, !activarEvidencias);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error al cambiar activación de evidencias:', error);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Botón Principal del Menú */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
      >
        <MdSettings className="text-lg text-slate-500" />
        <span>Configuración</span>
        <MdKeyboardArrowDown className={`text-lg transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black ring-opacity-5 border border-slate-100 z-50 animate-fadeIn">
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onAgregarDominio) {
                  onAgregarDominio();
                } else {
                  setModalOpen('agregarDominio');
                }
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors font-medium text-left"
            >
              <MdAddCircle className="text-lg text-blue-500" />
              <span>Agregar dominio</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setModalOpen('escala');
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors font-medium text-left"
            >
              <MdPlaylistAdd className="text-lg text-blue-500" />
              <span>Configurar Escala</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setModalOpen('niveles');
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors font-medium text-left"
            >
              <MdSettings className="text-lg text-blue-500" />
              <span>Niveles de Logro (Global)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setModalOpen('nivelesDominio');
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors font-medium text-left"
            >
              <RiAwardLine className="text-lg text-blue-500" />
              <span>Niveles por Dominio</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setModalOpen('fase');
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors font-medium text-left"
            >
              <MdAssignment className="text-lg text-blue-500" />
              <span>Nueva Etapa de Evaluación</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setModalOpen('editarTituloDescripcion');
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors font-medium text-left"
            >
              <MdEdit className="text-lg text-blue-500" />
              <span>Editar título y descripción</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setModalOpen('descripcion');
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors font-medium text-left"
            >
              <MdDescription className="text-lg text-blue-500" />
              <span>Título PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onAgregarPreguntas) {
                  onAgregarPreguntas();
                } else {
                  setModalOpen('agregarPregunta');
                }
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors font-medium text-left"
            >
              <MdPlaylistAdd className="text-lg text-blue-500" />
              <span>Agregar preguntas</span>
            </button>

            <div className="h-px bg-slate-100 my-1" />

            {/* Toggle de Evidencias */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                handleToggleEvidencias();
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium text-left"
            >
              {activarEvidencias ? (
                <MdToggleOn className="text-2xl text-emerald-500" />
              ) : (
                <MdToggleOff className="text-2xl text-slate-400" />
              )}
              <span>
                Evidencias:{' '}
                <strong className={activarEvidencias ? 'text-emerald-600' : 'text-slate-500'}>
                  {activarEvidencias ? 'Activadas' : 'Desactivadas'}
                </strong>
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Modales Vinculados */}
      {modalOpen === 'agregarDominio' && (
        <ModalAgregarDimension
          idEvaluacion={idEvaluacion}
          collectionName={collectionName}
          onClose={() => setModalOpen(null)}
          onSuccess={onRefresh}
        />
      )}

      {modalOpen === 'escala' && (
        <ModalConfigurarEscala
          idEvaluacion={idEvaluacion}
          collectionName={collectionName}
          escalaActual={escala}
          onClose={() => setModalOpen(null)}
          onSuccess={onRefresh}
        />
      )}

      {modalOpen === 'fase' && (
        <ModalConfigurarFase
          idEvaluacion={idEvaluacion}
          collectionName={collectionName}
          faseActual={faseActual}
          onClose={() => setModalOpen(null)}
          onSuccess={onRefresh}
        />
      )}

      {modalOpen === 'niveles' && (
        <ModalConfigurarNiveles
          idEvaluacion={idEvaluacion}
          collectionName={collectionName}
          nivelesActuales={niveles}
          onClose={() => setModalOpen(null)}
          onSuccess={onRefresh}
        />
      )}

      {modalOpen === 'nivelesDominio' && (
        <ModalConfigurarNivelesPorDominio
          idEvaluacion={idEvaluacion}
          collectionName={collectionName}
          dimensiones={dimensiones}
          preguntas={preguntas}
          escala={escala}
          onClose={() => setModalOpen(null)}
          onSuccess={onRefresh}
        />
      )}

      {modalOpen === 'editarTituloDescripcion' && (
        <ModalEditarTituloDescripcion
          idEvaluacion={idEvaluacion}
          collectionName={collectionName}
          tituloActual={titulo}
          descripcionActual={descripcion}
          onClose={() => setModalOpen(null)}
          onSuccess={onRefresh}
        />
      )}

      {modalOpen === 'descripcion' && (
        <ModalConfigurarDescripcion
          idEvaluacion={idEvaluacion}
          collectionName={collectionName}
          descripcionActual={descripcion}
          onClose={() => setModalOpen(null)}
          onSuccess={onRefresh}
        />
      )}

      {modalOpen === 'agregarPregunta' && (
        <ModalAgregarPregunta
          idEvaluacion={idEvaluacion}
          collectionName={collectionName}
          dimensiones={dimensiones}
          escala={escala}
          onClose={() => setModalOpen(null)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
};

export default EvaluacionConfigMenu;
