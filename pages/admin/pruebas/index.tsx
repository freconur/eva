import React, { useState, useRef, useCallback, useEffect } from 'react';
import PrivateRoutesAdmin from '@/components/layouts/PrivateRoutesAdmin';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { db, storage } from '@/firebase/firebase.config';
import { ref as sRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import {
  RiCursorLine,
  RiRectangleLine,
  RiCircleLine,
  RiText,
  RiEraserLine,
  RiDeleteBin6Line,
  RiPaletteLine,
  RiArrowRightUpLine,
  RiBringToFront,
  RiSendToBack,
  RiHand,
  RiZoomInLine,
  RiZoomOutLine,
  RiRestartLine,
  RiArrowDownSLine,
  RiFolderOpenLine,
  RiAddLine,
  RiCloudLine,
  RiUser3Line,
} from 'react-icons/ri';

// ─── Tipos ───────────────────────────────────────────────
type AnchorPoint = 'top' | 'right' | 'bottom' | 'left' | 'tl' | 'tr' | 'bl' | 'br';

interface Shape {
  id: string;
  type: 'rect' | 'circle' | 'text' | 'arrow' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  text?: string;
  x2?: number;
  y2?: number;
  startShapeId?: string | null;
  endShapeId?: string | null;
  startAnchor?: AnchorPoint | null;
  endAnchor?: AnchorPoint | null;
  // Campos de Autor
  creadoPorNombre?: string;
  creadoPorDni?: string;
}

type Tool = 'select' | 'pan' | 'rect' | 'circle' | 'text' | 'eraser' | 'arrow';
type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'arrow-start' | 'arrow-end' | null;

interface Board {
  id: string;
  titulo: string;
  shapes: Shape[];
  creadoPorNombre: string;
  creadoPorDni: string;
  creadoEn: any;
  actualizadoEn: any;
}

// ─── Constantes ──────────────────────────────────────────
const PALETTE = [
  '#1e293b', '#475569', '#94a3b8',
  '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#06b6d4', '#3b82f6',
  '#8b5cf6', '#ec4899', '#ffffff',
];
const uid = () => Math.random().toString(36).slice(2, 10);
const SNAP_RADIUS = 20;

const RECT_ANCHORS: AnchorPoint[] = ['top', 'right', 'bottom', 'left', 'tl', 'tr', 'bl', 'br'];
const CIRCLE_ANCHORS: AnchorPoint[] = ['top', 'right', 'bottom', 'left'];

// ─── Componente Principal ────────────────────────────────
const PruebasPage = () => {
  const { currentUserData } = useGlobalContext();
  const userName = currentUserData?.perfil?.nombre || currentUserData?.nombres || 'Usuario';
  const userDni = currentUserData?.dni || '';

  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [fillColor, setFillColor] = useState('#3b82f6');
  const [strokeColor, setStrokeColor] = useState('#1e293b');

  // Estados de Proyectos (Boards) en Firestore
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [showBoardList, setShowBoardList] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Estados de Pizarra Infinita (Pan & Zoom)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Estados de dibujo / drag / resize
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [resizeOrigin, setResizeOrigin] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const [textInput, setTextInput] = useState<{ x: number; y: number; editingId?: string | null } | null>(null);
  const [textValue, setTextValue] = useState('');

  // Dropdowns de color
  const [showFillDropdown, setShowFillDropdown] = useState(false);
  const [showStrokeDropdown, setShowStrokeDropdown] = useState(false);

  // Hover de conexión
  const [hoverShapeId, setHoverShapeId] = useState<string | null>(null);
  const [hoverAnchor, setHoverAnchor] = useState<AnchorPoint | null>(null);
  const [, setMousePos] = useState({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // ─── ESCUCHAR PROYECTOS DESDE FIRESTORE ────────────────
  useEffect(() => {
    const q = query(collection(db, 'pizarras_pruebas'), orderBy('actualizadoEn', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Board[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Board);
      });
      setBoards(list);
      // Auto-seleccionar la primera pizarra si no hay ninguna seleccionada
      if (list.length > 0 && !selectedBoardId) {
        setSelectedBoardId(list[0].id);
      }
    });
    return () => unsubscribe();
  }, [selectedBoardId]);

  // Refs para prevenir bucles infinitos de sincronización y guardado
  const shapesRef = useRef<Shape[]>(shapes);
  const lastRemoteShapesRef = useRef<string>('');

  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);

  // Refs de interacciones para evitar re-suscripciones innecesarias de onSnapshot
  const isDrawingRef = useRef(isDrawing);
  const isDraggingRef = useRef(isDragging);
  const isResizingRef = useRef(isResizing);
  const textInputRefVal = useRef(textInput);

  useEffect(() => { isDrawingRef.current = isDrawing; }, [isDrawing]);
  useEffect(() => { isDraggingRef.current = isDragging; }, [isDragging]);
  useEffect(() => { isResizingRef.current = isResizing; }, [isResizing]);
  useEffect(() => { textInputRefVal.current = textInput; }, [textInput]);

  // ─── ESCUCHAR PIZARRA ACTIVA (Tiempo Real Colaborativo) ───
  useEffect(() => {
    if (!selectedBoardId) return;
    const unsubscribe = onSnapshot(doc(db, 'pizarras_pruebas', selectedBoardId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const remoteShapes = data.shapes || [];
        
        // Almacenar el string de la versión remota
        lastRemoteShapesRef.current = JSON.stringify(remoteShapes);
        
        // Solo actualizar si no estamos interactuando localmente y las formas cambiaron realmente
        if (!isDrawingRef.current && !isDraggingRef.current && !isResizingRef.current && !textInputRefVal.current) {
          if (JSON.stringify(remoteShapes) !== JSON.stringify(shapesRef.current)) {
            setShapes(remoteShapes);
          }
        }
      }
    });
    return () => unsubscribe();
  }, [selectedBoardId]);

  // ─── GUARDADO AUTOMÁTICO (DEBOUNCE 1.5S) ───────────────
  useEffect(() => {
    if (!selectedBoardId) return;
    
    const localShapesStr = JSON.stringify(shapes);
    // Si coincide con la última versión remota conocida, no es un cambio local nuevo
    if (localShapesStr === lastRemoteShapesRef.current) {
      setSaveStatus('saved');
      return;
    }

    setSaveStatus('saving');
    const delay = setTimeout(async () => {
      try {
        const docRef = doc(db, 'pizarras_pruebas', selectedBoardId);
        await updateDoc(docRef, {
          shapes: shapes,
          actualizadoEn: new Date(),
        });
        lastRemoteShapesRef.current = localShapesStr;
        setSaveStatus('saved');
      } catch (e) {
        console.error("Error auto-saving board:", e);
        setSaveStatus('error');
      }
    }, 1500);

    return () => clearTimeout(delay);
  }, [shapes, selectedBoardId]);

  // Refs para atajos de teclado (evita stale closures y re-suscripciones)
  const selectedIdRefForShortcut = useRef(selectedId);
  selectedIdRefForShortcut.current = selectedId;

  const deleteSelectedRefForShortcut = useRef<() => void>();

  // Detectar Barra Espaciadora para Pan temporizado y Atajos de Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(true);
        return;
      }

      // Atajos de herramientas
      switch (e.key.toLowerCase()) {
        case 'v':
          setTool('select');
          break;
        case 'h':
          setTool('pan');
          break;
        case 'r':
          setTool('rect');
          break;
        case 'o':
        case 'c':
          setTool('circle');
          break;
        case 'a':
        case 'l':
          setTool('arrow');
          break;
        case 't':
          setTool('text');
          break;
        case 'e':
          setTool('eraser');
          break;
        case 'delete':
        case 'backspace':
          if (selectedIdRefForShortcut.current) {
            deleteSelectedRefForShortcut.current?.();
          }
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ─── PEGAR IMÁGENES / CAPTURAS DESDE EL PORTAPAPELES ───
  useEffect(() => {
    const compressImage = (file: File): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Límite máximo de dimensiones (ancho/alto) de 1600px para ahorrar espacio
            const MAX_LIMIT = 1600;
            if (width > MAX_LIMIT || height > MAX_LIMIT) {
              if (width > height) {
                height = Math.round((height * MAX_LIMIT) / width);
                width = MAX_LIMIT;
              } else {
                width = Math.round((width * MAX_LIMIT) / height);
                height = MAX_LIMIT;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(file); // fallback a archivo original
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            
            // Exportar como JPEG comprimido al 75%
            canvas.toBlob(
              (blob) => {
                if (blob) resolve(blob);
                else resolve(file);
              },
              'image/jpeg',
              0.75
            );
          };
          img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
      });
    };

    const uploadImageToStorage = async (file: File): Promise<string> => {
      const compressedBlob = await compressImage(file);
      const nameWithoutExtension = (file.name || 'captura.png').replace(/\.[^/.]+$/, "");
      const fileRef = sRef(storage, `pizarras_capturas/${uid()}_${nameWithoutExtension}.jpg`);
      const snapshot = await uploadBytes(fileRef, compressedBlob);
      return getDownloadURL(snapshot.ref);
    };

    const handlePaste = async (e: ClipboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            setIsUploadingImage(true);
            setSaveStatus('saving');
            try {
              const url = await uploadImageToStorage(file);
              
              // Centrar la imagen pegada en la vista actual
              const svg = svgRef.current;
              let x = 100;
              let y = 100;
              if (svg) {
                const rect = svg.getBoundingClientRect();
                x = (rect.width / 2 - pan.x) / zoom;
                y = (rect.height / 2 - pan.y) / zoom;
              }
              
              const newShape: Shape = {
                id: uid(),
                type: 'image',
                x: x - 150,
                y: y - 100,
                width: 300,
                height: 200,
                fill: 'transparent',
                stroke: 'transparent',
                strokeWidth: 0,
                text: url,
                creadoPorNombre: userName,
                creadoPorDni: userDni,
              };
              
              setShapes(prev => [...prev, newShape]);
              setIsUploadingImage(false);
            } catch (err) {
              console.error("Error al subir captura pegada:", err);
              alert("Hubo un error al procesar y subir la captura.");
              setIsUploadingImage(false);
              setSaveStatus('error');
            }
          }
        }
      }
    };
    
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [pan, zoom, userName, userDni]);

  // Cerrar dropdowns si se hace click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowFillDropdown(false);
        setShowStrokeDropdown(false);
        setShowBoardList(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (textInput && textInputRef.current) textInputRef.current.focus();
  }, [textInput]);

  // ─── Convertir coordenadas cliente a plano canvas ───
  const getSVGPoint = useCallback((e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    return {
      x: (clientX - pan.x) / zoom,
      y: (clientY - pan.y) / zoom,
    };
  }, [pan, zoom]);

  // ─── Puntos de anclaje ────────────────────────────────
  const getAnchorPos = useCallback((shape: Shape, anchor: AnchorPoint): { x: number; y: number } => {
    const cx = shape.x + shape.width / 2;
    const cy = shape.y + shape.height / 2;

    if (shape.type === 'circle') {
      const rx = shape.width / 2;
      const ry = shape.height / 2;
      switch (anchor) {
        case 'top': return { x: cx, y: cy - ry };
        case 'bottom': return { x: cx, y: cy + ry };
        case 'left': return { x: cx - rx, y: cy };
        case 'right': return { x: cx + rx, y: cy };
        default: return { x: cx, y: cy };
      }
    }

    switch (anchor) {
      case 'top': return { x: cx, y: shape.y };
      case 'bottom': return { x: cx, y: shape.y + shape.height };
      case 'left': return { x: shape.x, y: cy };
      case 'right': return { x: shape.x + shape.width, y: cy };
      case 'tl': return { x: shape.x, y: shape.y };
      case 'tr': return { x: shape.x + shape.width, y: shape.y };
      case 'bl': return { x: shape.x, y: shape.y + shape.height };
      case 'br': return { x: shape.x + shape.width, y: shape.y + shape.height };
      default: return { x: cx, y: cy };
    }
  }, []);

  const getAnchorsForShape = useCallback((shape: Shape): AnchorPoint[] => {
    if (shape.type === 'circle') return CIRCLE_ANCHORS;
    if (shape.type === 'rect' || shape.type === 'text' || shape.type === 'image') return RECT_ANCHORS;
    return [];
  }, []);

  const findClosestAnchor = useCallback((point: { x: number; y: number }, excludeId?: string): { shape: Shape; anchor: AnchorPoint } | null => {
    let best: { shape: Shape; anchor: AnchorPoint; dist: number } | null = null;

    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      if (s.type === 'arrow' || s.id === excludeId) continue;

      const anchors = getAnchorsForShape(s);
      for (const a of anchors) {
        const pos = getAnchorPos(s, a);
        const dist = Math.hypot(point.x - pos.x, point.y - pos.y);
        if (dist <= SNAP_RADIUS && (!best || dist < best.dist)) {
          best = { shape: s, anchor: a, dist };
        }
      }
    }

    return best ? { shape: best.shape, anchor: best.anchor } : null;
  }, [shapes, getAnchorsForShape, getAnchorPos]);

  const getArrowCoords = useCallback((arrow: Shape) => {
    let sx = arrow.x, sy = arrow.y;
    let ex = arrow.x2 ?? arrow.x, ey = arrow.y2 ?? arrow.y;

    if (arrow.startShapeId && arrow.startAnchor) {
      const s = shapes.find(sh => sh.id === arrow.startShapeId);
      if (s) {
        const pos = getAnchorPos(s, arrow.startAnchor);
        sx = pos.x; sy = pos.y;
      }
    }
    if (arrow.endShapeId && arrow.endAnchor) {
      const s = shapes.find(sh => sh.id === arrow.endShapeId);
      if (s) {
        const pos = getAnchorPos(s, arrow.endAnchor);
        ex = pos.x; ey = pos.y;
      }
    }

    return { sx, sy, ex, ey };
  }, [shapes, getAnchorPos]);

  // Zoom Rueda del Mouse (Imperativo para evitar warning de passive listener)
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);

  useEffect(() => {
    panRef.current = pan;
    zoomRef.current = zoom;
  }, [pan, zoom]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheelRaw = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const currentPan = panRef.current;
      const currentZoom = zoomRef.current;

      const canvasX = (mouseX - currentPan.x) / currentZoom;
      const canvasY = (mouseY - currentPan.y) / currentZoom;

      const zoomFactor = 1.1;
      let newZoom = currentZoom;
      if (e.deltaY < 0) {
        newZoom = Math.min(newZoom * zoomFactor, 5);
      } else {
        newZoom = Math.max(newZoom / zoomFactor, 0.2);
      }

      const newPanX = mouseX - canvasX * newZoom;
      const newPanY = mouseY - canvasY * newZoom;

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    };

    svg.addEventListener('wheel', handleWheelRaw, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheelRaw);
  }, []);

  const zoomIn = () => setZoom(z => Math.min(z * 1.2, 5));
  const zoomOut = () => setZoom(z => Math.max(z / 1.2, 0.2));
  const resetZoomPan = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // ─── CREAR PROYECTO NUEVO EN FIRESTORE ────────────────
  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) return;
    try {
      const docRef = await addDoc(collection(db, 'pizarras_pruebas'), {
        titulo: newBoardTitle.trim(),
        shapes: [],
        creadoPorNombre: userName,
        creadoPorDni: userDni,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
      });
      setSelectedBoardId(docRef.id);
      setNewBoardTitle('');
      setShowCreateModal(false);
    } catch (e) {
      console.error("Error creating board:", e);
    }
  };

  // Auxiliar para borrar imagen física de Firebase Storage
  const deleteImageFromStorage = useCallback(async (url: string) => {
    try {
      const fileRef = sRef(storage, url);
      await deleteObject(fileRef);
    } catch (e) {
      console.error("Error al borrar captura de Storage:", e);
    }
  }, []);

  // ─── ELIMINAR PROYECTO ────────────────────────────────
  const handleDeleteBoard = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Seguro que deseas eliminar permanentemente este proyecto?')) {
      try {
        const boardToDelete = boards.find(b => b.id === id);
        if (boardToDelete && boardToDelete.shapes) {
          boardToDelete.shapes.forEach(s => {
            if (s.type === 'image' && s.text) {
              deleteImageFromStorage(s.text);
            }
          });
        }
        await deleteDoc(doc(db, 'pizarras_pruebas', id));
        if (selectedBoardId === id) {
          setSelectedBoardId(null);
          setShapes([]);
        }
      } catch (e) {
        console.error("Error deleting board:", e);
      }
    }
  };

  // ─── Eventos del Lienzo ────────────────────────────────
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button === 1 || tool === 'pan' || isSpacePressed) {
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        return;
      }

      if (e.button !== 0) return;

      const point = getSVGPoint(e);

      if (tool === 'select') {
        setSelectedId(null);
        return;
      }

      if (tool === 'text') {
        e.preventDefault();
        if (textInput && textValue.trim()) {
          if (textInput.editingId) {
            setShapes(prev => prev.map(s => s.id === textInput.editingId ? { ...s, text: textValue, width: textValue.length * (s.height * 0.6), creadoPorNombre: userName, creadoPorDni: userDni } : s));
          } else {
            setShapes(prev => [...prev, {
              id: uid(), type: 'text' as const,
              x: textInput.x, y: textInput.y,
              width: textValue.length * 10, height: 24,
              fill: fillColor, stroke: 'transparent', strokeWidth: 0,
              text: textValue,
              creadoPorNombre: userName, creadoPorDni: userDni
            }]);
          }
        }
        setTextInput({ x: point.x, y: point.y });
        setTextValue('');
        return;
      }

      if (tool === 'rect' || tool === 'circle') {
        setCurrentShape({
          id: uid(), type: tool,
          x: point.x, y: point.y, width: 0, height: 0,
          fill: fillColor, stroke: strokeColor, strokeWidth: 2,
          creadoPorNombre: userName, creadoPorDni: userDni
        });
        setDrawStart(point);
        setIsDrawing(true);
      }

      if (tool === 'arrow') {
        const snap = findClosestAnchor(point);
        const startPt = snap ? getAnchorPos(snap.shape, snap.anchor) : point;
        setCurrentShape({
          id: uid(), type: 'arrow',
          x: startPt.x, y: startPt.y,
          x2: startPt.x, y2: startPt.y,
          width: 0, height: 0,
          fill: 'none', stroke: strokeColor, strokeWidth: 2,
          startShapeId: snap?.shape.id ?? null,
          startAnchor: snap?.anchor ?? null,
          endShapeId: null, endAnchor: null,
          creadoPorNombre: userName, creadoPorDni: userDni
        });
        setIsDrawing(true);
      }
    },
    [tool, fillColor, strokeColor, getSVGPoint, findClosestAnchor, getAnchorPos, isSpacePressed, pan, textInput, textValue, userName, userDni]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        return;
      }

      const point = getSVGPoint(e);
      setMousePos(point);

      if (tool === 'arrow' && !isDrawing) {
        const snap = findClosestAnchor(point);
        setHoverShapeId(snap?.shape.id ?? null);
        setHoverAnchor(snap?.anchor ?? null);
      }

      if (isDrawing && currentShape && (currentShape.type === 'rect' || currentShape.type === 'circle')) {
        const w = point.x - drawStart.x;
        const h = point.y - drawStart.y;
        setCurrentShape({
          ...currentShape,
          x: w < 0 ? point.x : drawStart.x,
          y: h < 0 ? point.y : drawStart.y,
          width: Math.abs(w), height: Math.abs(h),
        });
        return;
      }

      if (isDrawing && currentShape && currentShape.type === 'arrow') {
        const snap = findClosestAnchor(point, currentShape.startShapeId ?? undefined);
        if (snap) {
          const pos = getAnchorPos(snap.shape, snap.anchor);
          setCurrentShape({ ...currentShape, x2: pos.x, y2: pos.y, endShapeId: snap.shape.id, endAnchor: snap.anchor });
          setHoverShapeId(snap.shape.id);
          setHoverAnchor(snap.anchor);
        } else {
          setCurrentShape({ ...currentShape, x2: point.x, y2: point.y, endShapeId: null, endAnchor: null });
          setHoverShapeId(null);
          setHoverAnchor(null);
        }
        return;
      }

      if (isResizing && selectedId && resizeHandle) {
        if (resizeHandle === 'arrow-start' || resizeHandle === 'arrow-end') {
          const snap = findClosestAnchor(point, selectedId);
          setHoverShapeId(snap?.shape.id ?? null);
          setHoverAnchor(snap?.anchor ?? null);
          const snapPt = snap ? getAnchorPos(snap.shape, snap.anchor) : point;

          if (resizeHandle === 'arrow-start') {
            setShapes(prev => prev.map(s =>
              s.id === selectedId
                ? { ...s, x: snapPt.x, y: snapPt.y, startShapeId: snap?.shape.id ?? null, startAnchor: snap?.anchor ?? null }
                : s
            ));
          } else {
            setShapes(prev => prev.map(s =>
              s.id === selectedId
                ? { ...s, x2: snapPt.x, y2: snapPt.y, endShapeId: snap?.shape.id ?? null, endAnchor: snap?.anchor ?? null }
                : s
            ));
          }
          return;
        }

        const { x: ox, y: oy, w: ow, h: oh } = resizeOrigin;
        let newX = ox, newY = oy, newW = ow, newH = oh;
        if (resizeHandle === 'se') { newW = Math.max(10, point.x - ox); newH = Math.max(10, point.y - oy); }
        else if (resizeHandle === 'sw') { newW = Math.max(10, (ox + ow) - point.x); newH = Math.max(10, point.y - oy); newX = Math.min(point.x, ox + ow - 10); }
        else if (resizeHandle === 'ne') { newW = Math.max(10, point.x - ox); newH = Math.max(10, (oy + oh) - point.y); newY = Math.min(point.y, oy + oh - 10); }
        else if (resizeHandle === 'nw') { newW = Math.max(10, (ox + ow) - point.x); newH = Math.max(10, (oy + oh) - point.y); newX = Math.min(point.x, ox + ow - 10); newY = Math.min(point.y, oy + oh - 10); }
        
        setShapes(prev => prev.map(s => {
          if (s.id === selectedId) {
            if (s.type === 'text') {
              const textLen = s.text ? s.text.length : 1;
              const scaleW = newH * textLen * 0.6;
              let adjustedX = newX;
              if (resizeHandle === 'sw' || resizeHandle === 'nw') {
                adjustedX = (ox + ow) - scaleW;
              }
              return { ...s, x: adjustedX, y: newY, width: scaleW, height: newH };
            }
            return { ...s, x: newX, y: newY, width: newW, height: newH };
          }
          return s;
        }));
        return;
      }

      if (isDragging && selectedId) {
        setShapes(prev => prev.map(s =>
          s.id === selectedId ? { ...s, x: point.x - dragOffset.x, y: point.y - dragOffset.y } : s
        ));
      }
    },
    [isPanning, panStart, isDrawing, currentShape, drawStart, isResizing, selectedId, resizeHandle, resizeOrigin, isDragging, dragOffset, tool, getSVGPoint, findClosestAnchor, getAnchorPos]
  );

  const handleCanvasMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing && currentShape) {
      if (currentShape.type === 'arrow') {
        const dx = (currentShape.x2 ?? currentShape.x) - currentShape.x;
        const dy = (currentShape.y2 ?? currentShape.y) - currentShape.y;
        if (Math.hypot(dx, dy) > 10) {
          setShapes(prev => [...prev, currentShape]);
          setSelectedId(currentShape.id);
        }
      } else {
        if (currentShape.width > 5 || currentShape.height > 5) {
          setShapes(prev => [...prev, currentShape]);
          setSelectedId(currentShape.id);
        }
      }
      setCurrentShape(null);
      setIsDrawing(false);
      setHoverShapeId(null);
      setHoverAnchor(null);
    }
    if (isDragging) setIsDragging(false);
    if (isResizing) { setIsResizing(false); setResizeHandle(null); setHoverShapeId(null); setHoverAnchor(null); }
  }, [isPanning, isDrawing, currentShape, isDragging, isResizing]);

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle, shape: Shape) => {
      e.stopPropagation();
      setResizeHandle(handle);
      setResizeOrigin({ x: shape.x, y: shape.y, w: shape.width, h: shape.height });
      setIsResizing(true);
    }, []
  );

  const handleShapeMouseDown = useCallback(
    (e: React.MouseEvent, shape: Shape) => {
      if (tool === 'pan' || isSpacePressed) return;

      e.stopPropagation();
      const point = getSVGPoint(e);

      if (tool === 'eraser') {
        if (shape.type === 'image' && shape.text) {
          deleteImageFromStorage(shape.text);
        }
        setShapes(prev => prev
          .filter(s => s.id !== shape.id)
          .map(s => {
            if (s.type !== 'arrow') return s;
            const u: Partial<Shape> = {};
            if (s.startShapeId === shape.id) { const c = getArrowCoords(s); u.startShapeId = null; u.startAnchor = null; u.x = c.sx; u.y = c.sy; }
            if (s.endShapeId === shape.id) { const c = getArrowCoords(s); u.endShapeId = null; u.endAnchor = null; u.x2 = c.ex; u.y2 = c.ey; }
            return Object.keys(u).length ? { ...s, ...u } : s;
          })
        );
        setSelectedId(null);
        return;
      }

      if (tool === 'select') {
        setSelectedId(shape.id);
        setDragOffset({ x: point.x - shape.x, y: point.y - shape.y });
        setIsDragging(true);
      }
    },
    [tool, getSVGPoint, getArrowCoords, isSpacePressed, deleteImageFromStorage]
  );

  // Confirmar texto
  const handleTextConfirm = useCallback((force?: boolean) => {
    if (textInput) {
      if (textInput.editingId) {
        if (textValue.trim()) {
          setShapes(prev => prev.map(s => s.id === textInput.editingId ? { ...s, text: textValue, width: textValue.length * (s.height * 0.6) } : s));
        } else {
          setShapes(prev => prev.filter(s => s.id !== textInput.editingId));
        }
      } else if (textValue.trim()) {
        setShapes(prev => [...prev, {
          id: uid(), type: 'text' as const,
          x: textInput.x, y: textInput.y,
          width: textValue.length * 10, height: 24,
          fill: fillColor, stroke: 'transparent', strokeWidth: 0,
          text: textValue,
          creadoPorNombre: userName, creadoPorDni: userDni
        }]);
      }
      setTextInput(null);
      setTextValue('');
    } else if (force) {
      setTextInput(null);
      setTextValue('');
    }
  }, [textInput, textValue, fillColor, userName, userDni]);

  const updateSelectedFill = (c: string) => { if (selectedId) setShapes(p => p.map(s => s.id === selectedId ? { ...s, fill: c } : s)); };
  const updateSelectedStroke = (c: string) => { if (selectedId) setShapes(p => p.map(s => s.id === selectedId ? { ...s, stroke: c } : s)); };

  const bringToFront = () => {
    if (!selectedId) return;
    setShapes(prev => {
      const shape = prev.find(s => s.id === selectedId);
      if (!shape) return prev;
      return [...prev.filter(s => s.id !== selectedId), shape];
    });
  };

  const sendToBack = () => {
    if (!selectedId) return;
    setShapes(prev => {
      const shape = prev.find(s => s.id === selectedId);
      if (!shape) return prev;
      return [shape, ...prev.filter(s => s.id !== selectedId)];
    });
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    const shape = shapes.find(s => s.id === selectedId);
    if (shape && shape.type !== 'arrow') {
      if (shape.type === 'image' && shape.text) {
        deleteImageFromStorage(shape.text);
      }
      setShapes(prev => prev
        .filter(s => s.id !== selectedId)
        .map(s => {
          if (s.type !== 'arrow') return s;
          const u: Partial<Shape> = {};
          if (s.startShapeId === selectedId) { const c = getArrowCoords(s); u.startShapeId = null; u.startAnchor = null; u.x = c.sx; u.y = c.sy; }
          if (s.endShapeId === selectedId) { const c = getArrowCoords(s); u.endShapeId = null; u.endAnchor = null; u.x2 = c.ex; u.y2 = c.ey; }
          return Object.keys(u).length ? { ...s, ...u } : s;
        })
      );
    } else {
      setShapes(prev => prev.filter(s => s.id !== selectedId));
    }
    setSelectedId(null);
  };
  deleteSelectedRefForShortcut.current = deleteSelected;

  const clearAll = () => {
    if (shapes.length === 0) return;
    if (window.confirm('¿Deseas limpiar toda la pizarra?')) {
      shapes.forEach(s => {
        if (s.type === 'image' && s.text) {
          deleteImageFromStorage(s.text);
        }
      });
      setShapes([]);
      setSelectedId(null);
    }
  };

  const toolsList: { id: Tool; label: string; shortcut: string; icon: React.ReactNode }[] = [
    { id: 'select', label: 'Seleccionar', shortcut: 'V', icon: <RiCursorLine /> },
    { id: 'pan', label: 'Mano (Pan)', shortcut: 'H', icon: <RiHand /> },
    { id: 'rect', label: 'Rectángulo', shortcut: 'R', icon: <RiRectangleLine /> },
    { id: 'circle', label: 'Círculo', shortcut: 'O/C', icon: <RiCircleLine /> },
    { id: 'arrow', label: 'Flecha', shortcut: 'A/L', icon: <RiArrowRightUpLine /> },
    { id: 'text', label: 'Texto', shortcut: 'T', icon: <RiText /> },
    { id: 'eraser', label: 'Borrador', shortcut: 'E', icon: <RiEraserLine /> },
  ];

  const selectedShape = shapes.find(s => s.id === selectedId);
  const activeBoard = boards.find(b => b.id === selectedBoardId);

  // Render anclajes
  const renderAnchorPoints = () => {
    if (tool !== 'arrow' && !(isResizing && (resizeHandle === 'arrow-start' || resizeHandle === 'arrow-end'))) return null;

    return shapes
      .filter(s => s.type !== 'arrow')
      .map(s => {
        const anchors = getAnchorsForShape(s);
        return anchors.map(a => {
          const pos = getAnchorPos(s, a);
          const isHovered = s.id === hoverShapeId && a === hoverAnchor;
          const r = (isHovered ? 6 : 4) / zoom;
          const strokeW = (isHovered ? 2.5 : 1.5) / zoom;

          return (
            <circle
              key={`anchor-${s.id}-${a}`}
              cx={pos.x} cy={pos.y}
              r={r}
              fill={isHovered ? '#7c3aed' : '#ffffff'}
              stroke={isHovered ? '#7c3aed' : '#94a3b8'}
              strokeWidth={strokeW}
              opacity={isHovered ? 1 : 0.7}
              pointerEvents="none"
              style={{ transition: 'r 0.1s, fill 0.1s, opacity 0.1s' }}
            />
          );
        });
      });
  };

  // Handles redimensionamiento
  const renderResizeHandles = (shape: Shape) => {
    const handleSize = 8 / zoom;
    const strokeW = 1.5 / zoom;
    const rxRy = 2 / zoom;

    if (shape.type === 'arrow') {
      const { sx, sy, ex, ey } = getArrowCoords(shape);
      const r = 5 / zoom;
      const selectStrokeW = 2 / zoom;
      return (
        <>
          <circle cx={sx} cy={sy} r={r}
            fill={shape.startShapeId ? '#7c3aed' : '#ffffff'}
            stroke={shape.startShapeId ? '#ffffff' : '#7c3aed'}
            strokeWidth={selectStrokeW} style={{ cursor: 'grab' }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'arrow-start', shape)}
          />
          <circle cx={ex} cy={ey} r={r}
            fill={shape.endShapeId ? '#7c3aed' : '#ffffff'}
            stroke={shape.endShapeId ? '#ffffff' : '#7c3aed'}
            strokeWidth={selectStrokeW} style={{ cursor: 'grab' }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'arrow-end', shape)}
          />
        </>
      );
    }

    const positions = [
      { handle: 'nw' as const, x: shape.x, y: shape.y, cursor: 'nwse-resize' },
      { handle: 'ne' as const, x: shape.x + shape.width, y: shape.y, cursor: 'nesw-resize' },
      { handle: 'sw' as const, x: shape.x, y: shape.y + shape.height, cursor: 'nesw-resize' },
      { handle: 'se' as const, x: shape.x + shape.width, y: shape.y + shape.height, cursor: 'nwse-resize' },
    ];

    return positions.map(pos => (
      <rect key={`h-${pos.handle}`}
        x={pos.x - handleSize / 2} y={pos.y - handleSize / 2}
        width={handleSize} height={handleSize}
        fill="#ffffff" stroke="#7c3aed" strokeWidth={strokeW} rx={rxRy}
        style={{ cursor: pos.cursor }}
        onMouseDown={(e) => handleResizeMouseDown(e, pos.handle, shape)}
      />
    ));
  };

  // Render formas
  const renderShape = (shape: Shape, isPreview = false) => {
    const isSelected = !isPreview && shape.id === selectedId;
    const strokeW = (isSelected ? 3 : shape.strokeWidth) / zoom;
    const outlineStrokeW = 2 / zoom;

    const commonProps = {
      onMouseDown: isPreview ? undefined : (e: React.MouseEvent) => handleShapeMouseDown(e, shape),
      style: { cursor: (tool === 'pan' || isSpacePressed) ? 'grab' : tool === 'select' ? 'move' : tool === 'eraser' ? 'pointer' : 'default' } as React.CSSProperties,
    };

    if (shape.type === 'arrow') {
      const { sx, sy, ex, ey } = getArrowCoords(shape);
      const mid = `ah-${shape.id}`;
      return (
        <g key={shape.id} {...commonProps}>
          <defs>
            <marker id={mid} markerWidth={12 / zoom} markerHeight={8 / zoom} refX={10 / zoom} refY={4 / zoom} orient="auto" markerUnits="userSpaceOnUse">
              <path d={`M0,0 L${12/zoom},${4/zoom} L0,${8/zoom} L${3/zoom},${4/zoom} Z`} fill={isSelected ? '#7c3aed' : shape.stroke} />
            </marker>
          </defs>
          <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="transparent" strokeWidth={16 / zoom} />
          <line x1={sx} y1={sy} x2={ex} y2={ey}
            stroke={isSelected ? '#7c3aed' : shape.stroke}
            strokeWidth={strokeW}
            markerEnd={`url(#${mid})`} strokeLinecap="round"
          />
          {isSelected && renderResizeHandles(shape)}
        </g>
      );
    }

    if (shape.type === 'rect') {
      return (
        <g key={shape.id} {...commonProps}>
          <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height}
            fill={shape.fill} stroke={isSelected ? '#7c3aed' : shape.stroke}
            strokeWidth={strokeW} rx={4 / zoom} ry={4 / zoom}
          />
          {isSelected && (
            <>
              <rect x={shape.x - 1/zoom} y={shape.y - 1/zoom} width={shape.width + 2/zoom} height={shape.height + 2/zoom}
                fill="none" stroke="#7c3aed" strokeWidth={outlineStrokeW} strokeDasharray={`${6/zoom} ${3/zoom}`} rx={4 / zoom} ry={4 / zoom} pointerEvents="none"
              />
              {renderResizeHandles(shape)}
            </>
          )}
        </g>
      );
    }

    if (shape.type === 'circle') {
      const cx = shape.x + shape.width / 2, cy = shape.y + shape.height / 2;
      const rx = shape.width / 2, ry = shape.height / 2;
      return (
        <g key={shape.id} {...commonProps}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
            fill={shape.fill} stroke={isSelected ? '#7c3aed' : shape.stroke}
            strokeWidth={strokeW}
          />
          {isSelected && (
            <>
              <ellipse cx={cx} cy={cy} rx={rx + 2/zoom} ry={ry + 2/zoom}
                fill="none" stroke="#7c3aed" strokeWidth={outlineStrokeW} strokeDasharray={`${6/zoom} ${3/zoom}`} pointerEvents="none"
              />
              {renderResizeHandles(shape)}
            </>
          )}
        </g>
      );
    }

    if (shape.type === 'text') {
      const fontSize = shape.height * 0.8;
      return (
        <g key={shape.id} {...commonProps} onDoubleClick={(e) => {
          if (tool !== 'select') return;
          e.stopPropagation();
          setTextInput({ x: shape.x, y: shape.y, editingId: shape.id });
          setTextValue(shape.text || '');
        }}>
          {isSelected && (
            <>
              <rect x={shape.x - 2/zoom} y={shape.y - 2/zoom} width={shape.width + 4/zoom} height={shape.height + 4/zoom}
                fill="none" stroke="#7c3aed" strokeWidth={outlineStrokeW} strokeDasharray={`${6/zoom} ${3/zoom}`} rx={4 / zoom} ry={4 / zoom} pointerEvents="none"
              />
              {renderResizeHandles(shape)}
            </>
          )}
          <text x={shape.x} y={shape.y + shape.height * 0.85} fill={shape.fill} fontSize={fontSize} fontFamily="Inter, system-ui, sans-serif" fontWeight={600}>
            {shape.text}
          </text>
        </g>
      );
    }

    if (shape.type === 'image') {
      return (
        <g key={shape.id} {...commonProps}>
          <image
            href={shape.text}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            preserveAspectRatio="xMidYMid meet"
          />
          {isSelected && (
            <>
              <rect x={shape.x - 2/zoom} y={shape.y - 2/zoom} width={shape.width + 4/zoom} height={shape.height + 4/zoom}
                fill="none" stroke="#7c3aed" strokeWidth={outlineStrokeW} strokeDasharray={`${6/zoom} ${3/zoom}`} rx={4 / zoom} ry={4 / zoom} pointerEvents="none"
              />
              {renderResizeHandles(shape)}
            </>
          )}
        </g>
      );
    }

    return null;
  };

  return (
    <div className="relative w-full h-[calc(100vh-2rem)] min-h-[600px] overflow-hidden bg-slate-50 rounded-3xl border border-slate-200 shadow-inner flex">
      
      {/* ─── LIENZO SVG (Completo) ──────────────── */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full select-none"
        style={{
          cursor:
            isSpacePressed || isPanning ? 'grabbing'
            : tool === 'pan' ? 'grab'
            : tool === 'rect' || tool === 'circle' || tool === 'arrow' ? 'crosshair'
            : tool === 'text' ? 'text'
            : tool === 'eraser' ? 'pointer'
            : 'default',
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        <defs>
          <pattern id="grid-small" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
          </pattern>
          <pattern id="grid-large" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#grid-small)" />
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#cbd5e1" strokeWidth="1" />
          </pattern>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          <rect x="-50000" y="-50000" width="100000" height="100000" fill="url(#grid-large)" pointerEvents="none" />

          {/* Renderizar formas */}
          {shapes.map(s => renderShape(s))}
          {currentShape && renderShape(currentShape, true)}

          {renderAnchorPoints()}
        </g>
      </svg>

      {/* ─── SELECTOR DE PROYECTOS / PIZARRAS (Top Left) ────────── */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/85 backdrop-blur-md border border-slate-200/50 shadow-xl px-3 py-1.5 rounded-2xl">
        <div className="relative">
          <button
            onClick={() => { setShowBoardList(!showBoardList); setShowFillDropdown(false); setShowStrokeDropdown(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100/70 transition-all text-xs font-bold text-slate-700"
          >
            <RiFolderOpenLine className="text-sm text-slate-500" />
            <span>{activeBoard ? activeBoard.titulo : 'Seleccionar Proyecto'}</span>
            <RiArrowDownSLine className="text-slate-400" />
          </button>
          
          {showBoardList && (
            <div className="absolute top-11 left-0 z-20 w-64 bg-white/95 backdrop-blur-md border border-slate-200/60 shadow-2xl rounded-2xl p-2 flex flex-col gap-1 max-h-80 overflow-y-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">Proyectos</span>
              {boards.map(b => (
                <div
                  key={b.id}
                  onClick={() => { setSelectedBoardId(b.id); setShapes(b.shapes || []); setShowBoardList(false); }}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                    selectedBoardId === b.id ? 'bg-violet-50 text-violet-700 font-semibold' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate">{b.titulo}</span>
                    <span className="text-[9px] text-slate-400 truncate">Por: {b.creadoPorNombre}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteBoard(b.id, e)}
                    className="p-1 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95"
                    title="Eliminar proyecto"
                  >
                    <RiDeleteBin6Line className="text-xs" />
                  </button>
                </div>
              ))}
              {boards.length === 0 && (
                <span className="text-xs text-slate-400 italic text-center py-4">No hay proyectos</span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="p-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/20 text-xs transition-all active:scale-95"
          title="Nuevo Proyecto"
        >
          <RiAddLine />
        </button>
      </div>

      {/* ─── BARRA DE HERRAMIENTAS FLOTANTE (Top Central) ────────── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 bg-white/85 backdrop-blur-md border border-slate-200/50 shadow-xl px-4 py-2 rounded-2xl max-w-[90vw] overflow-x-auto">
        <div className="flex items-center gap-1 bg-slate-100/75 p-1 rounded-xl">
          {toolsList.map(t => (
            <button key={t.id}
              onClick={() => { setTool(t.id); if (t.id !== 'select') setSelectedId(null); }}
              title={`${t.label} (${t.shortcut})`}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                tool === t.id ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30' : 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm'
              }`}
            >{t.icon}</button>
          ))}
        </div>

        <div className="w-px h-8 bg-slate-200" />

        {/* Dropdown Relleno */}
        <div className="relative">
          <button
            onClick={() => { setShowFillDropdown(!showFillDropdown); setShowStrokeDropdown(false); setShowBoardList(false); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-all text-xs font-semibold text-slate-600 border border-slate-200/60"
            title="Color de Relleno"
          >
            <span className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: fillColor }} />
            <span className="hidden md:inline">Relleno</span>
            <RiArrowDownSLine className="text-slate-400" />
          </button>
          
          {showFillDropdown && (
            <div className="absolute top-11 left-0 z-20 bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-2 grid grid-cols-4 gap-1.5 min-w-[128px]">
              {PALETTE.map(c => (
                <button
                  key={`f-${c}`}
                  onClick={() => { setFillColor(c); setShowFillDropdown(false); }}
                  className={`w-6 h-6 rounded-md border transition-all hover:scale-110 ${fillColor === c ? 'border-violet-500 scale-110 shadow-sm' : 'border-slate-200'}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
              <div className="col-span-4 flex items-center justify-between border-t border-slate-100 pt-2 mt-1 px-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Más</span>
                <input type="color" value={fillColor} onChange={e => setFillColor(e.target.value)}
                  className="w-5 h-5 rounded-md border border-slate-200 cursor-pointer p-0 bg-transparent"
                />
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-8 bg-slate-200" />

        {/* Dropdown Borde */}
        <div className="relative">
          <button
            onClick={() => { setShowStrokeDropdown(!showStrokeDropdown); setShowFillDropdown(false); setShowBoardList(false); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-all text-xs font-semibold text-slate-600 border border-slate-200/60"
            title="Color de Borde"
          >
            <span className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: strokeColor }} />
            <span className="hidden md:inline">Borde</span>
            <RiArrowDownSLine className="text-slate-400" />
          </button>
          
          {showStrokeDropdown && (
            <div className="absolute top-11 left-0 z-20 bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-2 grid grid-cols-4 gap-1.5 min-w-[128px]">
              {PALETTE.map(c => (
                <button
                  key={`s-${c}`}
                  onClick={() => { setStrokeColor(c); setShowStrokeDropdown(false); }}
                  className={`w-6 h-6 rounded-md border transition-all hover:scale-110 ${strokeColor === c ? 'border-violet-500 scale-110 shadow-sm' : 'border-slate-200'}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
              <div className="col-span-4 flex items-center justify-between border-t border-slate-100 pt-2 mt-1 px-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Más</span>
                <input type="color" value={strokeColor} onChange={e => setStrokeColor(e.target.value)}
                  className="w-5 h-5 rounded-md border border-slate-200 cursor-pointer p-0 bg-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── CONTROLES DE ZOOM, AUTO-GUARDADO Y ACCIONES (Bottom Left) ─── */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 bg-white/85 backdrop-blur-md border border-slate-200/50 shadow-xl px-2 py-1.5 rounded-xl">
        <button onClick={zoomOut} title="Alejar" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800">
          <RiZoomOutLine className="text-lg" />
        </button>
        <span className="text-xs font-bold text-slate-600 px-2 min-w-[48px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button onClick={zoomIn} title="Acercar" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800">
          <RiZoomInLine className="text-lg" />
        </button>
        <button onClick={resetZoomPan} title="Reestablecer vista" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 ml-1">
          <RiRestartLine className="text-lg" />
        </button>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* Indicador de Sincronización en la Nube */}
        {selectedBoardId && (
          <div className="flex items-center gap-1 px-1.5 py-1 rounded-lg text-slate-500" title={saveStatus === 'saved' ? 'Guardado en la nube' : saveStatus === 'saving' ? 'Guardando...' : 'Error de guardado'}>
            <RiCloudLine className={`text-base ${
              saveStatus === 'saving' ? 'animate-pulse text-amber-500' :
              saveStatus === 'saved' ? 'text-emerald-500' :
              saveStatus === 'error' ? 'text-rose-500' : 'text-slate-400'
            }`} />
            <span className="text-[10px] font-bold uppercase hidden md:inline">
              {saveStatus === 'saving' ? 'Guardando' : saveStatus === 'saved' ? 'Sincronizado' : ''}
            </span>
          </div>
        )}

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <button onClick={clearAll} title="Limpiar Pizarra" className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:text-rose-600">
          <RiDeleteBin6Line className="text-lg" />
        </button>
      </div>

      {/* ─── MODAL FLOTANTE: CREAR NUEVO PROYECTO ──────────────── */}
      {showCreateModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-30 flex items-center justify-center">
          <div className="w-80 bg-white border border-slate-200/60 shadow-2xl rounded-2xl p-4 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-800">Nuevo Proyecto de Pizarra</h3>
            <input
              type="text"
              value={newBoardTitle}
              onChange={e => setNewBoardTitle(e.target.value)}
              placeholder="Nombre del requerimiento..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 font-semibold"
              onKeyDown={e => { if (e.key === 'Enter') handleCreateBoard(); }}
              autoFocus
            />
            <div className="flex gap-2 justify-end mt-1">
              <button
                onClick={() => { setShowCreateModal(false); setNewBoardTitle(''); }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateBoard}
                className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition-all"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PANEL DE PROPIEDADES FLOTANTE (Right Side) ─────────── */}
      {selectedShape && tool === 'select' && (
        <div className="absolute top-4 right-4 z-10 w-56 bg-white/85 backdrop-blur-md border border-slate-200/50 shadow-2xl rounded-2xl p-4 flex flex-col gap-4 max-h-[calc(100%-8rem)] overflow-y-auto">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Propiedades</h3>

          {/* Información del Autor del Cambio */}
          {selectedShape.creadoPorNombre && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Creado por</span>
              <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100 text-xs font-semibold text-slate-600">
                <RiUser3Line className="text-slate-400" />
                <span className="truncate">{selectedShape.creadoPorNombre}</span>
              </div>
            </div>
          )}

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tipo</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-50 text-violet-600 border border-violet-100 inline-block">
              {selectedShape.type === 'rect' ? 'Rectángulo' : selectedShape.type === 'circle' ? 'Círculo' : selectedShape.type === 'arrow' ? 'Flecha' : 'Texto'}
            </span>
          </div>

          {selectedShape.type === 'arrow' && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Conexiones</span>
              <div className="flex flex-col gap-1 text-xs text-slate-500 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${selectedShape.startShapeId ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  Inicio: {selectedShape.startAnchor ? selectedShape.startAnchor.toUpperCase() : 'Libre'}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${selectedShape.endShapeId ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  Fin: {selectedShape.endAnchor ? selectedShape.endAnchor.toUpperCase() : 'Libre'}
                </div>
              </div>
            </div>
          )}

          {selectedShape.type !== 'arrow' && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Color de Relleno</span>
              <div className="flex gap-1 flex-wrap">
                {PALETTE.slice(0, 10).map(c => (
                  <button key={`sf-${c}`} onClick={() => updateSelectedFill(c)}
                    className={`w-6 h-6 rounded-md border transition-all hover:scale-110 ${selectedShape.fill === c ? 'border-violet-500 scale-110 shadow-sm' : 'border-slate-200'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input type="color" value={selectedShape.fill} onChange={e => updateSelectedFill(e.target.value)}
                  className="w-6 h-6 rounded-md border border-slate-200 cursor-pointer p-0"
                />
              </div>
            </div>
          )}

          {selectedShape.type !== 'text' && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                {selectedShape.type === 'arrow' ? 'Color de Flecha' : 'Color de Borde'}
              </span>
              <div className="flex gap-1 flex-wrap">
                {PALETTE.slice(0, 10).map(c => (
                  <button key={`ss-${c}`} onClick={() => updateSelectedStroke(c)}
                    className={`w-6 h-6 rounded-md border transition-all hover:scale-110 ${selectedShape.stroke === c ? 'border-violet-500 scale-110 shadow-sm' : 'border-slate-200'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input type="color" value={selectedShape.stroke} onChange={e => updateSelectedStroke(e.target.value)}
                  className="w-6 h-6 rounded-md border border-slate-200 cursor-pointer p-0"
                />
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 pt-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Posición</span>
            <div className="flex gap-2 mb-3">
              <button
                onClick={bringToFront}
                className="flex-1 px-2 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
                title="Traer al frente"
              >
                <RiBringToFront /> Frente
              </button>
              <button
                onClick={sendToBack}
                className="flex-1 px-2 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
                title="Enviar al fondo"
              >
                <RiSendToBack /> Fondo
              </button>
            </div>

            <button onClick={deleteSelected}
              className="w-full px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <RiDeleteBin6Line /> Eliminar
            </button>
          </div>
        </div>
      )}

      {/* ─── INPUT FLOTANTE DE TEXTO ──────────────────────── */}
      {textInput && (
        <div className="absolute z-20" style={{ left: textInput.x * zoom + pan.x, top: textInput.y * zoom + pan.y }}>
          <input ref={textInputRef} type="text" value={textValue}
            onChange={e => setTextValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleTextConfirm(); if (e.key === 'Escape') handleTextConfirm(true); }}
            onBlur={() => setTimeout(() => handleTextConfirm(), 200)}
            placeholder="Escribe aquí..."
            className="px-2 py-1 text-sm font-semibold border-2 border-violet-500 rounded-lg bg-white shadow-lg shadow-violet-600/10 focus:outline-none min-w-[140px]"
            style={{ color: fillColor }}
          />
        </div>
      )}
      {/* Banner flotante de carga de imágenes */}
      {isUploadingImage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-35 bg-violet-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-violet-600/30 flex items-center gap-2 animate-bounce">
          <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Procesando y subiendo captura...
        </div>
      )}
    </div>
  );
};

PruebasPage.Auth = PrivateRoutesAdmin;

export default PruebasPage;
