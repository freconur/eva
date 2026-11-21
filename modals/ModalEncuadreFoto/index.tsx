import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { compressCarnetImage } from '@/features/utils/compressCarnetImage'
import {
  FiZoomIn,
  FiZoomOut,
  FiRotateCcw,
  FiCheck,
  FiX,
  FiMove,
  FiInfo,
} from 'react-icons/fi'
import { RiLoader4Line } from 'react-icons/ri'
import { toast } from 'react-toastify'

interface ModalEncuadreFotoProps {
  isOpen: boolean
  file: File | null
  onClose: () => void
  onConfirm: (blob: Blob, dataUrl: string, sizeInKb: number) => Promise<void> | void
}

// Dimensiones fijas del visor de recorte en píxeles de pantalla (proporción 5:6 carnet)
const FRAME_WIDTH = 250
const FRAME_HEIGHT = 300

const clamp = (val: number, min: number, max: number) => {
  return Math.min(Math.max(val, min), max)
}

const ModalEncuadreFoto: React.FC<ModalEncuadreFotoProps> = ({
  isOpen,
  file,
  onClose,
  onConfirm,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [naturalDimensions, setNaturalDimensions] = useState<{
    width: number
    height: number
  } | null>(null)

  const [zoom, setZoom] = useState<number>(1)
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  // Referencias para el control de arrastre con puntero y pinch touch
  const pointerStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const offsetStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const initialTouchDistanceRef = useRef<number | null>(null)
  const initialTouchZoomRef = useRef<number>(1)
  const frameRef = useRef<HTMLDivElement | null>(null)

  // Cargar imagen al abrir
  useEffect(() => {
    if (!isOpen || !file) {
      setImageSrc(null)
      setNaturalDimensions(null)
      setZoom(1)
      setOffset({ x: 0, y: 0 })
      setIsProcessing(false)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      setImageSrc(src)

      const img = new Image()
      img.onload = () => {
        setNaturalDimensions({
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        })
        setZoom(1)
        setOffset({ x: 0, y: 0 })
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }, [isOpen, file])

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isProcessing, onClose])

  // Cálculos de escala para cubrir completamente el visor
  const baseScale = naturalDimensions
    ? Math.max(
        FRAME_WIDTH / naturalDimensions.width,
        FRAME_HEIGHT / naturalDimensions.height
      )
    : 1

  const currentScale = baseScale * zoom
  const dispW = naturalDimensions ? naturalDimensions.width * currentScale : 0
  const dispH = naturalDimensions ? naturalDimensions.height * currentScale : 0

  const maxOffsetX = Math.max(0, (dispW - FRAME_WIDTH) / 2)
  const maxOffsetY = Math.max(0, (dispH - FRAME_HEIGHT) / 2)

  // Función para re-limitar el offset al cambiar de zoom
  const updateZoomWithClampedOffset = useCallback(
    (newZoom: number) => {
      const clampedZoom = clamp(newZoom, 1, 3.5)
      setZoom(clampedZoom)

      if (naturalDimensions) {
        const nextScale = baseScale * clampedZoom
        const nextDispW = naturalDimensions.width * nextScale
        const nextDispH = naturalDimensions.height * nextScale
        const nextMaxX = Math.max(0, (nextDispW - FRAME_WIDTH) / 2)
        const nextMaxY = Math.max(0, (nextDispH - FRAME_HEIGHT) / 2)

        setOffset((prev) => ({
          x: clamp(prev.x, -nextMaxX, nextMaxX),
          y: clamp(prev.y, -nextMaxY, nextMaxY),
        }))
      }
    },
    [baseScale, naturalDimensions]
  )

  // Controladores de Puntero (Mouse & Touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isProcessing) return
    setIsDragging(true)
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
    offsetStartRef.current = { ...offset }
    if (frameRef.current && typeof frameRef.current.setPointerCapture === 'function') {
      try {
        frameRef.current.setPointerCapture(e.pointerId)
      } catch (_) {}
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isProcessing) return
    const dx = e.clientX - pointerStartRef.current.x
    const dy = e.clientY - pointerStartRef.current.y

    setOffset({
      x: clamp(offsetStartRef.current.x + dx, -maxOffsetX, maxOffsetX),
      y: clamp(offsetStartRef.current.y + dy, -maxOffsetY, maxOffsetY),
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    if (
      frameRef.current &&
      typeof frameRef.current.hasPointerCapture === 'function' &&
      frameRef.current.hasPointerCapture(e.pointerId) &&
      typeof frameRef.current.releasePointerCapture === 'function'
    ) {
      try {
        frameRef.current.releasePointerCapture(e.pointerId)
      } catch (_) {}
    }
  }

  // Soporte para rueda del ratón
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (isProcessing) return
    const delta = -e.deltaY * 0.0018
    updateZoomWithClampedOffset(zoom + delta)
  }

  // Soporte táctil para 2 dedos (Pinch-to-zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      initialTouchDistanceRef.current = dist
      initialTouchZoomRef.current = zoom
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialTouchDistanceRef.current) {
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      const factor = dist / initialTouchDistanceRef.current
      updateZoomWithClampedOffset(initialTouchZoomRef.current * factor)
    }
  }

  const handleTouchEnd = () => {
    initialTouchDistanceRef.current = null
  }

  // Restablecer posición y zoom al centro
  const handleReset = () => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }

  // Aplicar recorte y compresión carnet
  const handleApply = async () => {
    if (!file || !naturalDimensions || isProcessing) return

    try {
      setIsProcessing(true)

      // 1. Calcular rectángulo de recorte exacto en coordenadas naturales de la imagen fuente
      const displayToNatural = naturalDimensions.width / dispW
      const frameLeftInDisplay = (dispW - FRAME_WIDTH) / 2 - offset.x
      const frameTopInDisplay = (dispH - FRAME_HEIGHT) / 2 - offset.y

      const cropX = Math.max(0, frameLeftInDisplay * displayToNatural)
      const cropY = Math.max(0, frameTopInDisplay * displayToNatural)
      const cropWidth = Math.min(
        naturalDimensions.width - cropX,
        FRAME_WIDTH * displayToNatural
      )
      const cropHeight = Math.min(
        naturalDimensions.height - cropY,
        FRAME_HEIGHT * displayToNatural
      )

      // 2. Procesar con compresión de carnet (5:6, max 45 KB)
      const result = await compressCarnetImage(file, {
        targetWidth: 300,
        targetHeight: 360,
        maxSizeBytes: 45 * 1024,
        customCrop: {
          cropX,
          cropY,
          cropWidth,
          cropHeight,
        },
      })

      // 3. Confirmar hacia el componente padre
      await onConfirm(result.blob, result.dataUrl, result.sizeInKb)
    } catch (err: any) {
      console.error('Error al encuadrar la imagen:', err)
      toast.error(err?.message || 'Error al procesar el encuadre de la foto.')
      setIsProcessing(false)
    }
  }

  if (!isOpen || !file) return null

  let portalContainer: HTMLElement | null = null
  if (typeof window !== 'undefined') {
    portalContainer =
      document.getElementById('portal-modal') || document.body
  }
  if (!portalContainer) return null

  const isLandscape =
    naturalDimensions && naturalDimensions.width > naturalDimensions.height

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-crop-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          onClose()
        }
      }}
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* CABECERA */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          <div>
            <h2
              id="modal-crop-title"
              className="text-base sm:text-lg font-bold text-slate-900 tracking-tight"
            >
              Encuadrar Foto de Perfil
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Arrastra y acerca para ubicar tu rostro dentro del visor carnet.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Cerrar modal de encuadre"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* ÁREA INTERACTIVA DE ENCUADRE */}
        <div className="p-5 flex flex-col items-center justify-center space-y-4 bg-slate-100/60 overflow-y-auto">
          {/* VISOR PRINCIPAL CARNET (250x300 px, 5:6) */}
          <div className="relative">
            <div
              ref={frameRef}
              role="region"
              aria-label="Visor interactivo de foto carnet"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                width: `${FRAME_WIDTH}px`,
                height: `${FRAME_HEIGHT}px`,
                touchAction: 'none',
              }}
              className={`relative overflow-hidden rounded-2xl bg-slate-950 border-2 border-blue-600 shadow-lg select-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              {/* IMAGEN RENDERIZADA CON TRANSFORM EN TIEMPO REAL */}
              {imageSrc && naturalDimensions && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc}
                  alt="Previsualización para encuadre"
                  draggable={false}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: `${dispW}px`,
                    height: `${dispH}px`,
                    maxWidth: 'none',
                    maxHeight: 'none',
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* GUÍAS VISUALES / MÁSCARA TAMAÑO CARNET */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Cuadrícula sutil de tercios */}
                <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-25">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-white" />
                  <div className="border-r border-white" />
                  <div />
                </div>

                {/* Silueta guía para el rostro */}
                <div className="absolute inset-x-7 top-6 bottom-10 rounded-full border border-dashed border-white/45 flex items-center justify-center">
                  <span className="text-[10px] text-white/70 font-medium px-2 py-0.5 rounded-full bg-slate-900/50 backdrop-blur-xs select-none">
                    Centrar rostro
                  </span>
                </div>

                {/* Badge de proporción en esquina */}
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-900/70 text-white/90 backdrop-blur-xs">
                  5:6 Carnet
                </span>
              </div>
            </div>

            {/* Microindicador de arrastre */}
            <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-slate-500 select-none">
              <FiMove className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>Arrastra para encuadrar {isLandscape ? 'horizontalmente' : ''}</span>
            </div>
          </div>

          {/* CONTROLES DE ZOOM Y RESTABLECIMIENTO */}
          <div className="w-full max-w-xs space-y-2.5 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1">
                <FiZoomIn className="w-3.5 h-3.5 text-blue-600" />
                Zoom
              </span>
              <span className="font-mono text-blue-600">
                {zoom.toFixed(2)}x
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => updateZoomWithClampedOffset(zoom - 0.15)}
                disabled={zoom <= 1 || isProcessing}
                aria-label="Reducir zoom"
                title="Alejar"
                className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <FiZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="1"
                max="3.5"
                step="0.01"
                value={zoom}
                onChange={(e) =>
                  updateZoomWithClampedOffset(parseFloat(e.target.value))
                }
                disabled={isProcessing}
                aria-label="Control deslizante de zoom"
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={() => updateZoomWithClampedOffset(zoom + 0.15)}
                disabled={zoom >= 3.5 || isProcessing}
                aria-label="Aumentar zoom"
                title="Acercar"
                className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <FiZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={isProcessing || (zoom === 1 && offset.x === 0 && offset.y === 0)}
                aria-label="Restablecer encuadre y zoom"
                title="Restablecer"
                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 transition-colors ml-1"
              >
                <FiRotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* TIP INFORMATIVO */}
          <div className="flex items-start gap-2 text-[11px] text-slate-500 max-w-xs leading-relaxed">
            <FiInfo className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <span>
              La imagen final se optimizará automáticamente a tamaño carnet (≤ 45 KB) conservando alta resolución para tus credenciales y reportes.
            </span>
          </div>
        </div>

        {/* ACCIONES DEL MODAL */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-slate-100 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={isProcessing}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm transition-all disabled:opacity-60 cursor-pointer min-h-[38px]"
          >
            {isProcessing ? (
              <>
                <RiLoader4Line className="w-4 h-4 animate-spin text-white" />
                <span>Optimizando...</span>
              </>
            ) : (
              <>
                <FiCheck className="w-4 h-4" />
                <span>Aplicar foto de perfil</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    portalContainer
  )
}

export default ModalEncuadreFoto
