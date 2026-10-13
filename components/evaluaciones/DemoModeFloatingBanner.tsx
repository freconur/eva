import React from 'react'
import { RiPresentationLine, RiLogoutBoxRLine, RiShieldCheckLine } from 'react-icons/ri'
import { MdSchool } from 'react-icons/md'

interface Props {
  directorName: string
  institucionName: string
  onExitDemo: () => void
}

const DemoModeFloatingBanner: React.FC<Props> = ({
  directorName,
  institucionName,
  onExitDemo,
}) => {
  return (
    <>
      <div
        role="status"
        aria-label="Aviso de Modo Demostración"
        className="relative w-full rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 text-white px-4 py-3 shadow-md border border-purple-500/30 mb-4 sm:mb-5 overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/30 border border-purple-400/40 text-purple-200 tracking-wide uppercase">
              <RiPresentationLine className="w-4 h-4 text-purple-300" />
              <span>Modo Demo Activo</span>
            </span>

            <div className="flex items-center gap-1.5 text-xs text-slate-200">
              <span className="inline-flex items-center gap-1 font-semibold text-white">
                <MdSchool className="w-3.5 h-3.5 text-purple-300" />
                <span>{institucionName}</span>
              </span>
              <span className="text-purple-400">•</span>
              <span className="text-slate-300">
                {directorName}
              </span>
            </div>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <RiShieldCheckLine className="w-3.5 h-3.5 text-emerald-400" />
              <span>Respuestas Reales · PII Anonimizada (Pool 400)</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onExitDemo}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-purple-600/70 hover:bg-red-600 active:bg-red-700 transition-all shadow-xs border border-purple-400/40 hover:border-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 shrink-0 cursor-pointer"
            title="Desactivar modo demo (volver a nombres originales)"
          >
            <RiLogoutBoxRLine className="w-3.5 h-3.5" />
            <span>Desactivar Demo</span>
          </button>
        </div>
      </div>

      {/* Botón flotante discreto en la esquina inferior para salir de la demo cómodamente al desplazarse por tablas largas */}
      <div className="fixed bottom-5 right-5 z-[900] print:hidden">
        <button
          type="button"
          onClick={onExitDemo}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold text-white bg-slate-900/90 hover:bg-red-600 backdrop-blur-md shadow-lg border border-purple-500/40 hover:border-red-500 transition-all cursor-pointer group"
          title="Salir del Modo Demo"
          aria-label="Finalizar demo flotante"
        >
          <RiPresentationLine className="w-3.5 h-3.5 text-purple-400 group-hover:text-white" />
          <span>Demo</span>
          <span className="text-slate-500 group-hover:text-white">•</span>
          <span className="text-purple-300 group-hover:text-white flex items-center gap-1">
            <RiLogoutBoxRLine className="w-3.5 h-3.5" />
            <span>Salir</span>
          </span>
        </button>
      </div>
    </>
  )
}

export default DemoModeFloatingBanner
