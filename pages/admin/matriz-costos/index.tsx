import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { db } from '@/firebase/firebase.config';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  query,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import {
  FeatureCostoItem,
  MatrizConfig,
  PeriodoCostoItem,
  exportarMatrizCostosPDF,
  sanitizeForFirestore,
  SubItemDetallado
} from '@/features/utils/exportarMatrizCostosPDF';
import ModalFeatureCosto from '@/components/matriz-costos/ModalFeatureCosto';
import ModalConfiguracionCostos from '@/components/matriz-costos/ModalConfiguracionCostos';
import ModalDetectarFeatures from '@/components/matriz-costos/ModalDetectarFeatures';
import ModalDesglosarComponente from '@/components/matriz-costos/ModalDesglosarComponente';
import SortableFeatureRow from '@/components/matriz-costos/SortableFeatureRow';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { DetectedFeature } from '@/features/utils/catalogFeaturesCodebase';
import {
  MdAdd,
  MdPictureAsPdf,
  MdSettings,
  MdSearch,
  MdDeleteOutline,
  MdEdit,
  MdCheckCircle,
  MdHourglassEmpty,
  MdTrendingUp,
  MdSecurity,
  MdOutlineFilterAlt,
  MdExpandMore,
  MdExpandLess,
  MdAutoFixHigh,
  MdLayers,
  MdAttachMoney,
  MdAutoAwesome,
  MdWorkOutline,
  MdCode,
  MdFormatListNumbered,
  MdDragIndicator,
  MdCalendarToday,
  MdLock,
  MdLockOpen,
  MdDoneAll
} from 'react-icons/md';
import { IoClose } from 'react-icons/io5';
import { toast } from 'react-toastify';

const DEFAULT_CONFIG: MatrizConfig = {
  developerName: 'Desarrollador Principal',
  developerDni: '47163626',
  clientName: 'UGEL 13 - Yauyos',
  projectName: 'Sistema EVA',
  currency: 'PEN',
  defaultHourlyRate: 50
};

// Formatea "YYYY-MM" a "Noviembre 2024"
const formatPeriodoNombre = (yearMonth: string) => {
  try {
    const [y, m] = yearMonth.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    const monthName = d.toLocaleDateString('es-PE', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${y}`;
  } catch {
    return yearMonth;
  }
};

// Retorna "YYYY-MM" del mes actual
const getCurrentPeriodoId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const TIPO_CLIENTE_MAP: Record<string, string> = {
  'Nueva Feature': 'Nueva Solución',
  'Mejora / Refactor': 'Optimización',
  'Seguridad y Validación': 'Seguridad y Control',
  'Optimización': 'Rendimiento',
  'Corrección de Bug': 'Mantenimiento',
  'Migración de Datos': 'Gestión de Datos'
};

export default function MatrizCostosPage() {
  const router = useRouter();
  const { currentUserData } = useGlobalContext();

  const [features, setFeatures] = useState<FeatureCostoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<MatrizConfig>(DEFAULT_CONFIG);
  const [inputHourlyRate, setInputHourlyRate] = useState<number | ''>(50);
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);

  // Vista de presentación: Técnico vs Cliente
  const [modoVista, setModoVista] = useState<'tecnico' | 'cliente'>('tecnico');
  const [isHumanizingAll, setIsHumanizingAll] = useState(false);
  const [humanizingId, setHumanizingId] = useState<string | null>(null);

  // Períodos y Cierres Mensuales
  const [periodos, setPeriodos] = useState<PeriodoCostoItem[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>('TODOS');
  const [isNewPeriodoModalOpen, setIsNewPeriodoModalOpen] = useState(false);
  const [newPeriodoMes, setNewPeriodoMes] = useState(getCurrentPeriodoId());
  const [periodoToClose, setPeriodoToClose] = useState<PeriodoCostoItem | null>(null);
  const [isClosingPeriod, setIsClosingPeriod] = useState(false);

  // Modals
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureCostoItem | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isDetectModalOpen, setIsDetectModalOpen] = useState(false);
  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false);
  const [featureToDelete, setFeatureToDelete] = useState<FeatureCostoItem | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModulo, setSelectedModulo] = useState('TODOS');
  const [selectedEstado, setSelectedEstado] = useState('TODOS');
  const [selectedTipo, setSelectedTipo] = useState('TODOS');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sinHumanizarCount = useMemo(() => {
    return features.filter((f) => !f.tituloCliente).length;
  }, [features]);

  // Verificación de permiso estricto (Rol 4 Administrador AND DNI 47163626)
  const isDevUser = useMemo(() => {
    if (!currentUserData || Object.keys(currentUserData).length === 0) return false;
    const userRol = currentUserData?.rol || currentUserData?.perfil?.rol;
    const isAdmin = Number(userRol) === 4;
    const dni = String(currentUserData?.dni || '').trim();
    const id = String(currentUserData?.id || '').trim();
    const docNum = String((currentUserData as any)?.documento || '').trim();
    const email = String(currentUserData?.email || '').trim();

    const isMatch =
      dni === '47163626' ||
      id === '47163626' ||
      docNum === '47163626' ||
      email.includes('47163626');

    return isAdmin && isMatch;
  }, [currentUserData]);

  // Cargar configuración desde Firestore
  useEffect(() => {
    const configDocRef = doc(db, 'dev_features_costos_config', 'general');
    const unsubConfig = onSnapshot(
      configDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const loaded = { ...DEFAULT_CONFIG, ...docSnap.data() } as MatrizConfig;
          setConfig(loaded);
          setInputHourlyRate(loaded.defaultHourlyRate || 50);
        }
      },
      (error) => {
        console.error('Error al escuchar config:', error);
      }
    );

    return () => unsubConfig();
  }, []);

  // Cargar features en tiempo real desde Firestore
  useEffect(() => {
    const q = query(collection(db, 'dev_features_costos'), orderBy('createdAt', 'desc'));
    const unsubFeatures = onSnapshot(
      q,
      (snapshot) => {
        const items: FeatureCostoItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({
            id: docSnap.id,
            ...(docSnap.data() as any)
          });
        });

        // Ordenar respetando el campo `orden` ascendente (1, 2, 3...)
        items.sort((a, b) => {
          if (a.orden !== undefined && b.orden !== undefined) {
            return a.orden - b.orden;
          }
          if (a.orden !== undefined) return -1;
          if (b.orden !== undefined) return 1;
          return 0; // mantener orden de createdAt desc
        });

        setFeatures(items);
        setLoading(false);
      },
      (error) => {
        console.error('Error al escuchar dev_features_costos:', error);
        setLoading(false);
      }
    );

    return () => unsubFeatures();
  }, []);

  // Cargar períodos y cierres mensuales en tiempo real desde Firestore
  useEffect(() => {
    const qPeriodos = query(collection(db, 'dev_periodos_costos'), orderBy('id', 'desc'));
    const unsubPeriodos = onSnapshot(
      qPeriodos,
      async (snapshot) => {
        const items: PeriodoCostoItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({
            id: docSnap.id,
            ...(docSnap.data() as any)
          });
        });

        // Si no existen períodos en Firestore aún, inicializar mes actual y anterior
        if (items.length === 0) {
          const currentId = getCurrentPeriodoId();
          const prevDate = new Date();
          prevDate.setMonth(prevDate.getMonth() - 1);
          const prevId = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

          try {
            await setDoc(doc(db, 'dev_periodos_costos', currentId), {
              id: currentId,
              nombre: formatPeriodoNombre(currentId),
              estado: 'abierto',
              createdAt: serverTimestamp()
            });
            await setDoc(doc(db, 'dev_periodos_costos', prevId), {
              id: prevId,
              nombre: formatPeriodoNombre(prevId),
              estado: 'cerrado',
              fechaCierre: new Date().toISOString(),
              createdAt: serverTimestamp()
            });
          } catch (e) {
            console.error('Error auto-inicializando períodos:', e);
          }
        } else {
          setPeriodos(items);
        }
      },
      (error) => {
        console.error('Error al escuchar dev_periodos_costos:', error);
      }
    );

    return () => unsubPeriodos();
  }, [config.montoAbonoMensual, config.horasBolsaMensual, config.tarifaHoraExcedente]);

  // Sensores de Dnd-kit configurados con margen de 5px para no interferir con clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Manejo de fin de arrastre (Reordenamiento con persistencia)
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = features.findIndex((f) => f.id === active.id);
    const newIndex = features.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newFeatures = arrayMove(features, oldIndex, newIndex);
    const withUpdatedOrder = newFeatures.map((f, idx) => ({
      ...f,
      orden: idx + 1
    }));
    setFeatures(withUpdatedOrder);

    try {
      const updatePromises = withUpdatedOrder.map((feat) => {
        if (!feat.id) return Promise.resolve();
        const ref = doc(db, 'dev_features_costos', feat.id);
        return updateDoc(ref, { orden: feat.orden, updatedAt: serverTimestamp() });
      });
      await Promise.all(updatePromises);
    } catch (err) {
      console.error('Error guardando nuevo orden en Firestore:', err);
      toast.error('Error al guardar el nuevo orden de funcionalidades.');
    }
  };

  // Edición directa de horas desde la tabla
  const handleInlineUpdateHours = async (f: FeatureCostoItem, newHours: number) => {
    const hours = isNaN(newHours) || newHours < 0 ? 0 : newHours;
    const globalRate = Number(config.defaultHourlyRate) || 50;
    const newCosto = Math.round(hours * globalRate * 100) / 100;

    setFeatures((prev) =>
      prev.map((item) =>
        item.id === f.id
          ? {
              ...item,
              horasEstimadas: hours,
              horasReales: hours,
              costoTotal: newCosto
            }
          : item
      )
    );

    if (f.id) {
      try {
        const ref = doc(db, 'dev_features_costos', f.id);
        await updateDoc(ref, {
          horasEstimadas: hours,
          horasReales: hours,
          costoTotal: newCosto,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Error al actualizar horas inline:', err);
      }
    }
  };

  // Edición directa de descripción desde la tabla
  const handleInlineUpdateDescription = async (
    f: FeatureCostoItem,
    newDesc: string,
    isCliente: boolean
  ) => {
    setFeatures((prev) =>
      prev.map((item) =>
        item.id === f.id
          ? {
              ...item,
              [isCliente ? 'descripcionCliente' : 'descripcion']: newDesc
            }
          : item
      )
    );

    if (f.id) {
      try {
        const ref = doc(db, 'dev_features_costos', f.id);
        await updateDoc(ref, {
          [isCliente ? 'descripcionCliente' : 'descripcion']: newDesc,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Error al actualizar descripción inline:', err);
      }
    }
  };

  // Edición directa de sub-tareas (horas o descripción) desde la tabla expandida
  const handleInlineUpdateSubItem = async (
    f: FeatureCostoItem,
    subItemIdx: number,
    field: 'descripcion' | 'horas',
    value: string | number
  ) => {
    if (!f.subItems) return;
    const currentSubItems = [...f.subItems];
    if (!currentSubItems[subItemIdx]) return;

    const target = { ...currentSubItems[subItemIdx] };
    if (field === 'horas') {
      const val = isNaN(Number(value)) || Number(value) < 0 ? 0 : Number(value);
      target.horas = val;
    } else {
      target.descripcion = String(value);
    }
    currentSubItems[subItemIdx] = target;

    const sumHours = currentSubItems.reduce((acc, si) => acc + (Number(si.horas) || 0), 0);
    const globalRate = Number(config.defaultHourlyRate) || 50;
    const newCosto = Math.round(sumHours * globalRate * 100) / 100;

    setFeatures((prev) =>
      prev.map((item) =>
        item.id === f.id
          ? {
              ...item,
              subItems: currentSubItems,
              horasEstimadas: sumHours,
              horasReales: sumHours,
              costoTotal: newCosto
            }
          : item
      )
    );

    if (f.id) {
      try {
        const ref = doc(db, 'dev_features_costos', f.id);
        await updateDoc(ref, {
          subItems: currentSubItems,
          horasEstimadas: sumHours,
          horasReales: sumHours,
          costoTotal: newCosto,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Error al actualizar sub-item inline:', err);
      }
    }
  };

  // Agregar nueva sub-tarea directamente desde la tabla expandida
  const handleInlineAddSubItem = async (f: FeatureCostoItem, featureIdx: number) => {
    const currentSubItems = f.subItems ? [...f.subItems] : [];
    const newSubCode = `${featureIdx + 1}.${currentSubItems.length + 1}`;
    const newSubItem: SubItemDetallado = {
      codigo: newSubCode,
      descripcion: 'Nueva tarea desarrollada',
      horas: 1
    };
    currentSubItems.push(newSubItem);

    const sumHours = currentSubItems.reduce((acc, si) => acc + (Number(si.horas) || 0), 0);
    const globalRate = Number(config.defaultHourlyRate) || 50;
    const newCosto = Math.round(sumHours * globalRate * 100) / 100;

    setFeatures((prev) =>
      prev.map((item) =>
        item.id === f.id
          ? {
              ...item,
              subItems: currentSubItems,
              horasEstimadas: sumHours,
              horasReales: sumHours,
              costoTotal: newCosto
            }
          : item
      )
    );

    if (f.id) {
      try {
        const ref = doc(db, 'dev_features_costos', f.id);
        await updateDoc(ref, {
          subItems: currentSubItems,
          horasEstimadas: sumHours,
          horasReales: sumHours,
          costoTotal: newCosto,
          updatedAt: serverTimestamp()
        });
        toast.success('Nueva sub-tarea agregada.');
      } catch (err) {
        console.error('Error al agregar sub-item:', err);
      }
    }
  };

  // Eliminar sub-tarea directamente desde la tabla expandida
  const handleInlineDeleteSubItem = async (f: FeatureCostoItem, subItemIdx: number) => {
    if (!f.subItems) return;
    const currentSubItems = f.subItems.filter((_, idx) => idx !== subItemIdx);

    const sumHours = currentSubItems.reduce((acc, si) => acc + (Number(si.horas) || 0), 0);
    const globalRate = Number(config.defaultHourlyRate) || 50;
    const newCosto = Math.round(sumHours * globalRate * 100) / 100;

    setFeatures((prev) =>
      prev.map((item) =>
        item.id === f.id
          ? {
              ...item,
              subItems: currentSubItems,
              horasEstimadas: sumHours,
              horasReales: sumHours,
              costoTotal: newCosto
            }
          : item
      )
    );

    if (f.id) {
      try {
        const ref = doc(db, 'dev_features_costos', f.id);
        await updateDoc(ref, {
          subItems: currentSubItems,
          horasEstimadas: sumHours,
          horasReales: sumHours,
          costoTotal: newCosto,
          updatedAt: serverTimestamp()
        });
        toast.info('Sub-tarea eliminada.');
      } catch (err) {
        console.error('Error al eliminar sub-item:', err);
      }
    }
  };

  // Guardar o Actualizar Feature
  const handleSaveFeature = async (item: FeatureCostoItem) => {
    const defaultPeriodo = selectedPeriodo !== 'TODOS' ? selectedPeriodo : getCurrentPeriodoId();
    const finalPeriodo = item.periodo || defaultPeriodo;
    const matchedP = periodos.find((p) => p.id === finalPeriodo);
    const finalMesNombre = item.mesNombre || (matchedP ? matchedP.nombre : formatPeriodoNombre(finalPeriodo));

    if (item.id) {
      // Actualizar
      const ref = doc(db, 'dev_features_costos', item.id);
      const updateData = {
        ...item,
        periodo: finalPeriodo,
        mesNombre: finalMesNombre,
        updatedAt: serverTimestamp()
      };
      delete updateData.id;
      const cleanData = sanitizeForFirestore(updateData);
      await setDoc(ref, cleanData, { merge: true });
    } else {
      // Crear nueva con orden al final de la lista
      const maxOrder = features.reduce((max, feat) => Math.max(max, feat.orden || 0), 0);
      const copy = {
        ...item,
        orden: maxOrder + 1,
        periodo: finalPeriodo,
        mesNombre: finalMesNombre
      };
      delete copy.id;
      const cleanItem = sanitizeForFirestore({
        ...copy,
        creadoPor: currentUserData?.dni || '47163626',
        createdAt: serverTimestamp()
      });
      await addDoc(collection(db, 'dev_features_costos'), cleanItem);
    }
  };

  // Importar features detectadas del código
  const handleImportDetectedFeatures = async (detected: DetectedFeature[]) => {
    const defaultPeriodo = selectedPeriodo !== 'TODOS' ? selectedPeriodo : getCurrentPeriodoId();
    const matchedP = periodos.find((p) => p.id === defaultPeriodo);
    const mesNombreAssigned = matchedP ? matchedP.nombre : formatPeriodoNombre(defaultPeriodo);

    let currentMaxOrder = features.reduce((max, f) => Math.max(max, f.orden || 0), 0);
    for (const item of detected) {
      currentMaxOrder += 1;
      const itemToSave = { ...item };
      delete (itemToSave as any).seleccionada;
      delete (itemToSave as any).archivos;
      delete (itemToSave as any).id;
      const cleanItem = sanitizeForFirestore({
        ...itemToSave,
        orden: currentMaxOrder,
        periodo: defaultPeriodo,
        mesNombre: mesNombreAssigned,
        notas: item.notas || (item.archivos && item.archivos.length > 0 ? `Archivos: ${item.archivos.join(', ')}` : ''),
        creadoPor: currentUserData?.dni || '47163626',
        createdAt: serverTimestamp()
      });
      await addDoc(collection(db, 'dev_features_costos'), cleanItem);
    }
  };

  // Importar sub-features desglosadas por componente
  const handleImportSubFeatures = async (subFeaturesToImport: FeatureCostoItem[]) => {
    const defaultPeriodo = selectedPeriodo !== 'TODOS' ? selectedPeriodo : getCurrentPeriodoId();
    const matchedP = periodos.find((p) => p.id === defaultPeriodo);
    const mesNombreAssigned = matchedP ? matchedP.nombre : formatPeriodoNombre(defaultPeriodo);

    let currentMaxOrder = features.reduce((max, f) => Math.max(max, f.orden || 0), 0);
    for (const item of subFeaturesToImport) {
      currentMaxOrder += 1;
      const copy = { ...item };
      delete copy.id;
      const cleanItem = sanitizeForFirestore({
        ...copy,
        orden: currentMaxOrder,
        periodo: defaultPeriodo,
        mesNombre: mesNombreAssigned,
        creadoPor: currentUserData?.dni || '47163626',
        createdAt: serverTimestamp()
      });
      await addDoc(collection(db, 'dev_features_costos'), cleanItem);
    }
  };

  // Aperturar un nuevo mes / período
  const handleCrearNuevoPeriodo = async () => {
    if (!newPeriodoMes || !/^\d{4}-\d{2}$/.test(newPeriodoMes)) {
      toast.warning('Ingresa un período válido en formato AAAA-MM (ej. 2026-11)');
      return;
    }
    const id = newPeriodoMes.trim();
    try {
      const ref = doc(db, 'dev_periodos_costos', id);
      await setDoc(
        ref,
        {
          id,
          nombre: formatPeriodoNombre(id),
          estado: 'abierto',
          createdAt: serverTimestamp()
        },
        { merge: true }
      );
      toast.success(`Período "${formatPeriodoNombre(id)}" aperturado con éxito.`);
      setSelectedPeriodo(id);
      setIsNewPeriodoModalOpen(false);
    } catch (err) {
      console.error('Error al aperturar período:', err);
      toast.error('No se pudo aperturar el período.');
    }
  };

  // Cambiar estado de período (Cerrar / Reabrir / Marcar Facturado)
  const handleToggleEstadoPeriodo = async (
    periodoItem: PeriodoCostoItem,
    nuevoEstado: 'abierto' | 'cerrado' | 'facturado'
  ) => {
    setIsClosingPeriod(true);
    try {
      const ref = doc(db, 'dev_periodos_costos', periodoItem.id);
      const updatePayload: Record<string, any> = {
        estado: nuevoEstado,
        updatedAt: serverTimestamp()
      };

      if (nuevoEstado === 'cerrado') {
        updatePayload.fechaCierre = new Date().toISOString();
        updatePayload.horasConsumidas = stats.totalHoras;
        updatePayload.totalPagar = stats.totalCosto;
      } else if (nuevoEstado === 'abierto') {
        updatePayload.fechaCierre = null;
      }

      await updateDoc(ref, updatePayload);
      toast.success(
        nuevoEstado === 'cerrado'
          ? `Período "${periodoItem.nombre}" cerrado con éxito. Listo para cobro.`
          : nuevoEstado === 'facturado'
          ? `Período marcado como Facturado / Cobrado.`
          : `Período "${periodoItem.nombre}" reabierto para edición.`
      );
      setPeriodoToClose(null);
    } catch (err) {
      console.error('Error al actualizar estado del período:', err);
      toast.error('No se pudo cambiar el estado del período.');
    } finally {
      setIsClosingPeriod(false);
    }
  };

  // Aplicar nueva tarifa por hora global a todas las features
  const handleApplyGlobalHourlyRate = async (customRate?: number) => {
    const rateVal = customRate !== undefined ? customRate : Number(inputHourlyRate);
    if (isNaN(rateVal) || rateVal <= 0) {
      toast.warning('Por favor ingresa una tarifa válida mayor a 0.');
      setInputHourlyRate(config.defaultHourlyRate || 50);
      return;
    }

    if (rateVal === config.defaultHourlyRate && customRate === undefined) {
      return;
    }

    setIsUpdatingRate(true);
    try {
      const updatedConfig = { ...config, defaultHourlyRate: rateVal };
      setConfig(updatedConfig);
      setInputHourlyRate(rateVal);

      // Guardar configuración general en Firestore
      const configDocRef = doc(db, 'dev_features_costos_config', 'general');
      await setDoc(configDocRef, { ...updatedConfig, updatedAt: serverTimestamp() }, { merge: true });

      // Actualizar en lote en Firestore todas las features por horas
      const featuresToUpdate = features.filter((f) => f.id && f.modalidad !== 'fijo');
      if (featuresToUpdate.length > 0) {
        const updatePromises = featuresToUpdate.map((f) => {
          const horas = Number(f.horasReales) || Number(f.horasEstimadas) || 0;
          const ref = doc(db, 'dev_features_costos', f.id!);
          return updateDoc(ref, {
            tarifaPorHora: rateVal,
            costoTotal: Math.round(horas * rateVal * 100) / 100,
            updatedAt: serverTimestamp()
          });
        });
        await Promise.all(updatePromises);
      }

      toast.success(
        `Tarifa actualizada a ${config.currency === 'USD' ? '$' : 'S/'} ${rateVal}/hr en ${featuresToUpdate.length} features.`
      );
    } catch (err) {
      console.error('Error al actualizar tarifa global:', err);
      toast.error('Ocurrió un error al actualizar la tarifa en todas las features.');
    } finally {
      setIsUpdatingRate(false);
    }
  };

  // Guardar Configuración
  const handleSaveConfig = async (newConfig: MatrizConfig) => {
    const oldRate = config.defaultHourlyRate;
    const newRate = Number(newConfig.defaultHourlyRate) || 50;
    const configDocRef = doc(db, 'dev_features_costos_config', 'general');
    await setDoc(configDocRef, { ...newConfig, updatedAt: serverTimestamp() }, { merge: true });
    setConfig(newConfig);
    setInputHourlyRate(newRate);

    if (oldRate !== newRate) {
      await handleApplyGlobalHourlyRate(newRate);
    }
  };

  // Eliminar Feature
  const handleDeleteFeature = async () => {
    if (!featureToDelete?.id) return;
    try {
      await deleteDoc(doc(db, 'dev_features_costos', featureToDelete.id));
      toast.success('Funcionalidad eliminada de la matriz.');
      setFeatureToDelete(null);
    } catch (err) {
      console.error('Error al eliminar feature:', err);
      toast.error('No se pudo eliminar la funcionalidad.');
    }
  };

  // Humanizar una sola feature con Gemini
  const handleHumanizeSingle = async (item: FeatureCostoItem) => {
    if (!item.id) return;
    setHumanizingId(item.id);
    try {
      const res = await fetch('/api/dev/humanizar-features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          features: [
            {
              id: item.id,
              titulo: item.titulo,
              modulo: item.modulo,
              tipo: item.tipo,
              descripcion: item.descripcion
            }
          ]
        })
      });

      const data = await res.json();
      if (data.success && data.humanized && data.humanized.length > 0) {
        const trans = data.humanized[0];
        const ref = doc(db, 'dev_features_costos', item.id);
        const updatePayload: Record<string, any> = {
          updatedAt: serverTimestamp()
        };
        if (trans.tituloCliente) updatePayload.tituloCliente = trans.tituloCliente;
        if (trans.descripcionCliente) updatePayload.descripcionCliente = trans.descripcionCliente;
        await updateDoc(ref, updatePayload);
        toast.success(`Feature adaptada para cliente: "${trans.tituloCliente}"`);
      } else {
        toast.error(data.error || 'Error al traducir con Gemini.');
      }
    } catch (err) {
      console.error('Error al humanizar feature:', err);
      toast.error('Error de conexión con Gemini.');
    } finally {
      setHumanizingId(null);
    }
  };

  // Humanizar en lote features con Gemini
  const handleHumanizeAll = async (forceAll = false) => {
    const targets = forceAll ? features : features.filter((f) => !f.tituloCliente);
    if (targets.length === 0) {
      toast.info('Todas las funcionalidades ya tienen su versión adaptada para el cliente.');
      return;
    }

    setIsHumanizingAll(true);
    toast.info(`Traduciendo ${targets.length} features a lenguaje cliente con Gemini...`, { autoClose: 3000 });

    try {
      const payload = targets.map((f) => ({
        id: f.id,
        titulo: f.titulo,
        modulo: f.modulo,
        tipo: f.tipo,
        descripcion: f.descripcion
      }));

      const res = await fetch('/api/dev/humanizar-features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: payload })
      });

      const data = await res.json();
      if (data.success && data.humanized && Array.isArray(data.humanized)) {
        const updatePromises = data.humanized.map((trans: any) => {
          if (!trans.id) return Promise.resolve();
          const ref = doc(db, 'dev_features_costos', trans.id);
          const updatePayload: Record<string, any> = {
            updatedAt: serverTimestamp()
          };
          if (trans.tituloCliente) updatePayload.tituloCliente = trans.tituloCliente;
          if (trans.descripcionCliente) updatePayload.descripcionCliente = trans.descripcionCliente;
          return updateDoc(ref, updatePayload);
        });
        await Promise.all(updatePromises);
        toast.success(`¡Éxito! ${data.humanized.length} features adaptadas a lenguaje cliente.`);
      } else {
        toast.error(data.error || 'No se pudo completar la traducción en lote.');
      }
    } catch (err) {
      console.error('Error al humanizar en lote:', err);
      toast.error('Error de conexión al procesar con Gemini.');
    } finally {
      setIsHumanizingAll(false);
    }
  };

  // Pre-cargar plantillas típicas de EVA si la matriz está vacía
  const handleSeedDefaults = async () => {
    const plantillas: Omit<FeatureCostoItem, 'id'>[] = [
      {
        titulo: 'Reglas de Negocio para Activación de Evaluaciones',
        modulo: 'Evaluaciones de Estudiantes',
        tipo: 'Seguridad y Validación',
        modalidad: 'horas',
        horasEstimadas: 6,
        horasReales: 6,
        tarifaPorHora: config.defaultHourlyRate || 50,
        costoTotal: 6 * (config.defaultHourlyRate || 50),
        estado: 'Completado',
        prioridad: 'Alta',
        descripcion:
          'Validaciones previas a la activación de evaluaciones (nivelYPuntaje configurado, al menos una pregunta, puntaje >= 1, suma total exacta del nivel más alto).',
        fecha: new Date().toISOString().split('T')[0]
      },
      {
        titulo: 'Modo de Protección y Bloqueo para Evaluaciones Activas',
        modulo: 'Evaluaciones de Estudiantes',
        tipo: 'Mejora / Refactor',
        modalidad: 'horas',
        horasEstimadas: 8,
        horasReales: 8,
        tarifaPorHora: config.defaultHourlyRate || 50,
        costoTotal: 8 * (config.defaultHourlyRate || 50),
        estado: 'Completado',
        prioridad: 'Crítica',
        descripcion:
          'Bloqueo de edición, eliminación, dnd-kit drag-and-drop y visualización en badge de solo lectura cuando evaluacion.active === true.',
        fecha: new Date().toISOString().split('T')[0]
      },
      {
        titulo: 'Exportación de Matriz Heatmap a PDF',
        modulo: 'Reportes y Gráficas PDF/Excel',
        tipo: 'Nueva Feature',
        modalidad: 'horas',
        horasEstimadas: 10,
        horasReales: 10,
        tarifaPorHora: config.defaultHourlyRate || 50,
        costoTotal: 10 * (config.defaultHourlyRate || 50),
        estado: 'Completado',
        prioridad: 'Alta',
        descripcion:
          'Generación de informe en formato PDF apaisado (A4) con cálculo de promedios, colores por nivel de logro y tabla autogenerada con jsPDF.',
        fecha: new Date().toISOString().split('T')[0]
      }
    ];

    try {
      for (const item of plantillas) {
        await addDoc(collection(db, 'dev_features_costos'), {
          ...item,
          creadoPor: '47163626',
          createdAt: serverTimestamp()
        });
      }
      toast.success('Plantillas de features agregadas con éxito.');
    } catch (e) {
      console.error('Error insertando plantillas:', e);
      toast.error('Error al insertar plantillas.');
    }
  };

  // Features con costos, tarifas y períodos sincronizados
  const computedFeatures = useMemo(() => {
    const globalRate = Number(config.defaultHourlyRate) || 50;
    return features.map((f) => {
      let per = f.periodo;
      if (!per) {
        if (f.fecha && /^\d{4}-\d{2}/.test(f.fecha)) {
          per = f.fecha.substring(0, 7);
        } else {
          per = '2024-10';
        }
      }
      const matchedP = periodos.find((p) => p.id === per);

      if (f.modalidad === 'fijo') {
        return {
          ...f,
          periodo: per,
          mesNombre: f.mesNombre || (matchedP ? matchedP.nombre : formatPeriodoNombre(per))
        };
      }
      const horas = Number(f.horasReales) || Number(f.horasEstimadas) || 0;
      return {
        ...f,
        periodo: per,
        mesNombre: f.mesNombre || (matchedP ? matchedP.nombre : formatPeriodoNombre(per)),
        tarifaPorHora: globalRate,
        costoTotal: Math.round(horas * globalRate * 100) / 100
      };
    });
  }, [features, config.defaultHourlyRate, periodos]);

  // Filtrado de la lista
  const modulosDisponibles = useMemo(() => {
    const setMod = new Set<string>();
    computedFeatures.forEach((f) => {
      if (f.modulo) setMod.add(f.modulo);
    });
    return Array.from(setMod);
  }, [computedFeatures]);

  const filteredFeatures = useMemo(() => {
    return computedFeatures.filter((f) => {
      const matchPeriodo = selectedPeriodo === 'TODOS' || f.periodo === selectedPeriodo;
      if (!matchPeriodo) return false;

      const matchSearch =
        searchTerm === '' ||
        f.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.codigo && f.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (f.tituloCliente && f.tituloCliente.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (f.descripcion && f.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (f.descripcionCliente && f.descripcionCliente.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (f.subItems &&
          f.subItems.some(
            (si) =>
              si.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (si.codigo && si.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
          )) ||
        f.modulo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchModulo = selectedModulo === 'TODOS' || f.modulo === selectedModulo;
      const matchEstado = selectedEstado === 'TODOS' || f.estado === selectedEstado;
      const matchTipo = selectedTipo === 'TODOS' || f.tipo === selectedTipo;

      return matchSearch && matchModulo && matchEstado && matchTipo;
    });
  }, [computedFeatures, selectedPeriodo, searchTerm, selectedModulo, selectedEstado, selectedTipo]);

  // Cálculos estadísticos
  const stats = useMemo(() => {
    const totalHoras = filteredFeatures.reduce(
      (acc, f) => acc + (Number(f.horasReales) || Number(f.horasEstimadas) || 0),
      0
    );
    const totalCosto = filteredFeatures.reduce((acc, f) => acc + (Number(f.costoTotal) || 0), 0);
    const completadas = filteredFeatures.filter(
      (f) => f.estado === 'Completado' || f.estado === 'Entregado' || f.estado === 'Facturado'
    ).length;
    const enDesarrollo = filteredFeatures.filter((f) => f.estado === 'En Desarrollo').length;
    const planificadas = filteredFeatures.filter((f) => f.estado === 'Planificado').length;

    return {
      totalHoras,
      totalCosto,
      completadas,
      enDesarrollo,
      planificadas,
      porcentajeCompletado:
        filteredFeatures.length > 0
          ? Math.round((completadas / filteredFeatures.length) * 100)
          : 0
    };
  }, [filteredFeatures]);

  // Período actualmente seleccionado y estadísticas del Abono Mensual (Retainer)
  const currentPeriodoObj = useMemo(() => {
    if (selectedPeriodo === 'TODOS') return null;
    return periodos.find((p) => p.id === selectedPeriodo) || null;
  }, [selectedPeriodo, periodos]);

  const periodoStats = useMemo(() => {
    if (!currentPeriodoObj) return null;
    return {
      horasTotales: stats.totalHoras,
      totalLiquidacion: stats.totalCosto,
      completadas: stats.completadas,
      totalFeatures: filteredFeatures.length,
      porcentajeCompletado: stats.porcentajeCompletado
    };
  }, [currentPeriodoObj, stats, filteredFeatures.length]);

  const currencySymbol = config.currency === 'USD' ? '$' : 'S/';

  // Pantalla de acceso restringido si no es el DNI 47163626
  if (!isDevUser && !loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <MdSecurity size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Acceso Restringido</h2>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          Esta vista está reservada exclusivamente para el administrador principal (DNI: 47163626 con rol 4).
        </p>
        <button
          onClick={() => router.push('/admin/evaluaciones')}
          className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition"
        >
          Volver al Portal
        </button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Matriz de Costos de Desarrollo | EVA</title>
      </Head>

      <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-6">
        {/* Cabecera Principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 rounded-md">
                Dev Tool
              </span>
              <span className="text-xs text-slate-500">DNI: {config.developerDni || '47163626'}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              {modoVista === 'cliente' ? 'Propuesta y Entregables del Sistema' : 'Matriz de Funcionalidades y Costos'}
            </h1>
            <p className="text-xs md:text-sm text-slate-500">
              {modoVista === 'cliente'
                ? 'Catálogo ejecutivo de soluciones y beneficios pedagógicos en lenguaje claro y comprensible.'
                : 'Control de horas invertidas, alcance técnico y liquidación financiera por feature.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de Modo: Técnico vs Cliente */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setModoVista('tecnico')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  modoVista === 'tecnico'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista para desarrolladores con detalles de código, componentes y arquitectura"
              >
                <MdCode size={15} />
                Técnico
              </button>
              <button
                type="button"
                onClick={() => setModoVista('cliente')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  modoVista === 'cliente'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista ejecutiva sin tecnicismos para directores de UGEL y clientes"
              >
                <MdWorkOutline size={15} />
                Cliente
                {sinHumanizarCount > 0 && (
                  <span
                    className="ml-0.5 px-1.5 py-0.2 text-[10px] rounded-full bg-amber-400 text-amber-950 font-bold"
                    title={`${sinHumanizarCount} features sin versión cliente`}
                  >
                    {sinHumanizarCount}
                  </span>
                )}
              </button>
            </div>

            {/* Botón Humanizar con Gemini AI */}
            <button
              onClick={() => handleHumanizeAll(sinHumanizarCount === 0)}
              disabled={isHumanizingAll || features.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-950 bg-gradient-to-r from-emerald-100 via-teal-100 to-emerald-200 hover:from-emerald-200 hover:to-teal-300 border border-emerald-300 rounded-xl transition shadow-xs disabled:opacity-50"
              title="Transformar automáticamente títulos y descripciones a un lenguaje natural no técnico comprensible para el cliente usando Gemini"
            >
              <MdAutoAwesome size={15} className={isHumanizingAll ? 'animate-spin text-emerald-700' : 'text-emerald-700'} />
              {isHumanizingAll
                ? 'Procesando con Gemini...'
                : sinHumanizarCount > 0
                ? `✨ Humanizar con IA (${sinHumanizarCount})`
                : '✨ Re-Humanizar Todo'}
            </button>

            {/* Control Rápido de Tarifa Global */}
            <div className="flex items-center gap-1.5 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-300 px-3 py-1.5 rounded-xl transition shadow-2xs">
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1">
                <MdAttachMoney className="text-emerald-600 text-sm -mr-1" />
                Tarifa / Hora:
              </span>
              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-300">
                <span className="text-xs font-bold text-slate-500">{currencySymbol}</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={inputHourlyRate}
                  onChange={(e) => setInputHourlyRate(e.target.value === '' ? '' : Number(e.target.value))}
                  onBlur={() => handleApplyGlobalHourlyRate()}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyGlobalHourlyRate()}
                  className="w-14 text-xs font-black text-slate-800 text-center outline-none bg-transparent"
                  title="Cambia la tarifa por hora y presiona Enter o fuera del recuadro"
                />
              </div>
              <span className="text-[11px] font-semibold text-slate-500">/hr</span>
              {Number(inputHourlyRate) !== Number(config.defaultHourlyRate) && (
                <button
                  type="button"
                  onClick={() => handleApplyGlobalHourlyRate()}
                  disabled={isUpdatingRate}
                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition shadow-2xs disabled:opacity-50"
                  title="Guardar y actualizar todas las features"
                >
                  {isUpdatingRate ? '...' : 'Aplicar'}
                </button>
              )}
            </div>

            <button
              onClick={() => setIsComponentModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition shadow-xs"
              title="Elegir un componente específico y desglosar todas sus sub-features internas"
            >
              <MdLayers size={16} />
              Desglosar por Componente
            </button>

            <button
              onClick={() => setIsDetectModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition shadow-xs"
              title="Escanear y autodetectar funcionalidades implementadas en el código"
            >
              <MdAutoFixHigh size={16} />
              Detectar Todo el Proyecto
            </button>

            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition shadow-xs"
              title="Ajustar tarifas, proyecto y moneda"
            >
              <MdSettings size={16} />
              Configuración
            </button>

            <button
              onClick={() =>
                exportarMatrizCostosPDF({
                  features: filteredFeatures,
                  config,
                  modoVista,
                  periodoActual: currentPeriodoObj
                })
              }
              disabled={filteredFeatures.length === 0}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-xl transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed ${
                modoVista === 'cliente'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-slate-800 hover:bg-slate-900'
              }`}
              title={
                currentPeriodoObj
                  ? (modoVista === 'cliente' ? 'Descargar informe formal de conformidad mensual para la UGEL' : 'Descargar informe técnico del período en PDF')
                  : (modoVista === 'cliente' ? 'Descargar propuesta ejecutiva en PDF' : 'Descargar informe técnico general en PDF')
              }
            >
              <MdPictureAsPdf size={16} />
              {currentPeriodoObj
                ? (modoVista === 'cliente' ? `Exportar Cierre ${currentPeriodoObj.nombre}` : `Exportar Liquidación ${currentPeriodoObj.id}`)
                : (modoVista === 'cliente' ? 'Exportar Propuesta PDF' : 'Exportar Matriz PDF')}
            </button>

            <button
              onClick={() => {
                setEditingFeature(null);
                setIsFeatureModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs"
            >
              <MdAdd size={18} />
              Nueva Feature
            </button>
          </div>
        </div>

        {/* Barra de Períodos y Cierres Mensuales */}
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1 whitespace-nowrap">
              <MdCalendarToday className="text-indigo-600" size={15} />
              Período:
            </span>

            {/* Tab: Todos los Tiempos */}
            <button
              type="button"
              onClick={() => setSelectedPeriodo('TODOS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
                selectedPeriodo === 'TODOS'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos los Tiempos
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                selectedPeriodo === 'TODOS' ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-600'
              }`}>
                {computedFeatures.length}
              </span>
            </button>

            {/* Tabs de Meses */}
            {periodos.map((p) => {
              const countInP = computedFeatures.filter((f) => f.periodo === p.id).length;
              const isSelected = selectedPeriodo === p.id;
              const isCerrado = p.estado === 'cerrado' || p.estado === 'facturado';

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPeriodo(p.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : isCerrado
                      ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {isCerrado ? (
                    <MdLock size={13} className={isSelected ? 'text-white' : 'text-slate-400'} />
                  ) : (
                    <MdLockOpen size={13} className={isSelected ? 'text-white' : 'text-emerald-600'} />
                  )}
                  {p.nombre}
                  <span
                    className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                      isSelected
                        ? 'bg-blue-800 text-white'
                        : isCerrado
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-emerald-200 text-emerald-950'
                    }`}
                  >
                    {countInP}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setNewPeriodoMes(getCurrentPeriodoId());
              setIsNewPeriodoModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition whitespace-nowrap shadow-2xs self-start md:self-auto"
          >
            <MdAdd size={15} />
            + Aperturar Mes
          </button>
        </div>

        {/* Panel Destacado de Liquidación Mensual (Cuando hay un mes seleccionado) */}
        {selectedPeriodo !== 'TODOS' && currentPeriodoObj && (
          <div className={`p-5 rounded-2xl border shadow-sm transition space-y-4 ${
            currentPeriodoObj.estado === 'cerrado' || currentPeriodoObj.estado === 'facturado'
              ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white border-slate-800'
              : 'bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 text-slate-900 border-emerald-200'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b pb-3 border-slate-200/40">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${
                  currentPeriodoObj.estado === 'cerrado' || currentPeriodoObj.estado === 'facturado'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  <MdCalendarToday size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black tracking-tight">
                      Cierre Mensual: {currentPeriodoObj.nombre}
                    </h3>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                      currentPeriodoObj.estado === 'cerrado'
                        ? 'bg-blue-500/30 text-blue-200 border border-blue-400/40'
                        : currentPeriodoObj.estado === 'facturado'
                        ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {currentPeriodoObj.estado === 'cerrado'
                        ? '🔒 Cerrado / Para Cobro'
                        : currentPeriodoObj.estado === 'facturado'
                        ? '✓ Facturado / Pagado'
                        : '🟢 Abierto / En Curso'}
                    </span>
                  </div>
                  <p className={`text-xs ${
                    currentPeriodoObj.estado === 'cerrado' || currentPeriodoObj.estado === 'facturado'
                      ? 'text-slate-300'
                      : 'text-slate-500'
                  }`}>
                    {currentPeriodoObj.estado === 'cerrado'
                      ? 'Período cerrado formalmente. Horas y liquidación calculadas según las tareas realizadas.'
                      : 'Liquidación mensual calculada según las horas y tarifas de las tareas realizadas en este ciclo.'}
                  </p>
                </div>
              </div>

              {/* Botones de Acción del Período */}
              <div className="flex flex-wrap items-center gap-2">
                {currentPeriodoObj.estado === 'abierto' ? (
                  <button
                    type="button"
                    onClick={() => setPeriodoToClose(currentPeriodoObj)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-xs"
                    title="Cerrar el período del mes y congelar las horas para la UGEL"
                  >
                    <MdLock size={15} />
                    Cerrar Mes para Cobro
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleEstadoPeriodo(currentPeriodoObj, 'abierto')}
                      disabled={isClosingPeriod}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-300 bg-white/10 hover:bg-white/20 rounded-xl transition border border-white/20"
                      title="Reabrir mes para permitir registrar o corregir funcionalidades"
                    >
                      <MdLockOpen size={14} />
                      Reabrir Mes
                    </button>
                    {currentPeriodoObj.estado !== 'facturado' && (
                      <button
                        type="button"
                        onClick={() => handleToggleEstadoPeriodo(currentPeriodoObj, 'facturado')}
                        disabled={isClosingPeriod}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs"
                      >
                        <MdDoneAll size={15} />
                        Marcar como Pagado
                      </button>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={() =>
                    exportarMatrizCostosPDF({
                      features: filteredFeatures,
                      config,
                      modoVista,
                      periodoActual: currentPeriodoObj
                    })
                  }
                  disabled={filteredFeatures.length === 0}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs"
                  title="Exportar informe oficial de conformidad mensual en PDF con firmas"
                >
                  <MdPictureAsPdf size={15} />
                  Descargar Informe del Mes
                </button>
              </div>
            </div>

            {/* Barra de Progreso de Tareas */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className={currentPeriodoObj.estado === 'cerrado' || currentPeriodoObj.estado === 'facturado' ? 'text-slate-300' : 'text-slate-600'}>
                  Avance de Funcionalidades: <strong>{stats.completadas} de {filteredFeatures.length} completadas</strong>
                </span>
                <span className="font-bold text-emerald-500">
                  {stats.porcentajeCompletado}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-emerald-500"
                  style={{ width: `${stats.porcentajeCompletado}%` }}
                />
              </div>
            </div>

            {/* 4 Métricas Clave de las Tareas Realizadas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {/* Horas Totales Realizadas */}
              <div className={`p-3 rounded-xl border ${
                currentPeriodoObj.estado === 'cerrado' || currentPeriodoObj.estado === 'facturado'
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white border-slate-200'
              }`}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Horas Totales Invertidas
                </p>
                <p className={`text-lg font-black mt-0.5 ${
                  currentPeriodoObj.estado === 'cerrado' || currentPeriodoObj.estado === 'facturado'
                    ? 'text-white'
                    : 'text-slate-800'
                }`}>
                  {stats.totalHoras.toFixed(1)} <span className="text-xs font-normal text-slate-400">hrs</span>
                </p>
                <p className="text-[10px] text-slate-400">En {filteredFeatures.length} funcionalidades</p>
              </div>

              {/* Entregables */}
              <div className={`p-3 rounded-xl border ${
                currentPeriodoObj.estado === 'cerrado' || currentPeriodoObj.estado === 'facturado'
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white border-slate-200'
              }`}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Entregables / Features
                </p>
                <p className={`text-lg font-black mt-0.5 ${
                  currentPeriodoObj.estado === 'cerrado' || currentPeriodoObj.estado === 'facturado'
                    ? 'text-white'
                    : 'text-slate-800'
                }`}>
                  {stats.completadas} / {filteredFeatures.length}
                </p>
                <p className="text-[10px] text-slate-400">{stats.porcentajeCompletado}% finalizado</p>
              </div>

              {/* Tarifa / Hora */}
              <div className={`p-3 rounded-xl border ${
                currentPeriodoObj.estado === 'cerrado' || currentPeriodoObj.estado === 'facturado'
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white border-slate-200'
              }`}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Tarifa de Desarrollo
                </p>
                <p className={`text-lg font-black mt-0.5 ${
                  currentPeriodoObj.estado === 'cerrado' || currentPeriodoObj.estado === 'facturado'
                    ? 'text-white'
                    : 'text-slate-800'
                }`}>
                  {currencySymbol} {config.defaultHourlyRate || 50}/hr
                </p>
                <p className="text-[10px] text-slate-400">Tarifa horaria pactada</p>
              </div>

              {/* Total a Liquidar (Costo Real de las Tareas) */}
              <div className={`p-3 rounded-xl border ${
                currentPeriodoObj.estado === 'cerrado' || currentPeriodoObj.estado === 'facturado'
                  ? 'bg-emerald-950/60 border-emerald-500/40'
                  : 'bg-emerald-50 border-emerald-300'
              }`}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                  Total Liquidación del Mes
                </p>
                <p className="text-xl font-black mt-0.5 text-emerald-500">
                  {currencySymbol} {stats.totalCosto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-emerald-600/80 font-medium">Monto según tareas realizadas</p>
              </div>
            </div>
          </div>
        )}

        {/* Métricas / KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Costo Total */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Inversión Total
              </p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">
                {currencySymbol}{' '}
                {stats.totalCosto.toLocaleString('es-PE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {filteredFeatures.length} feature(s) listada(s)
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <MdTrendingUp size={24} />
            </div>
          </div>

          {/* Horas Totales y Tarifa Global */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Horas Registradas
              </p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">
                {stats.totalHoras.toFixed(1)} <span className="text-sm font-medium text-slate-500">hrs</span>
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                <span>Tarifa global:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {currencySymbol} {config.defaultHourlyRate}/hr
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <MdHourglassEmpty size={24} />
            </div>
          </div>

          {/* Completadas */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Completadas
              </p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">
                {stats.completadas}{' '}
                <span className="text-xs font-medium text-emerald-600">
                  ({stats.porcentajeCompletado}%)
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Listo para entrega o cobro
              </p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <MdCheckCircle size={24} />
            </div>
          </div>

          {/* En Desarrollo / Pendientes */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                En Progreso / Plan
              </p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">
                {stats.enDesarrollo + stats.planificadas}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {stats.enDesarrollo} en curso, {stats.planificadas} planificadas
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <MdOutlineFilterAlt size={24} />
            </div>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por funcionalidad, módulo o detalle técnico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs md:text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Filtro Módulo */}
            <select
              value={selectedModulo}
              onChange={(e) => setSelectedModulo(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="TODOS">Todos los Módulos</option>
              {modulosDisponibles.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* Filtro Estado */}
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="Planificado">Planificado</option>
              <option value="En Desarrollo">En Desarrollo</option>
              <option value="Completado">Completado</option>
              <option value="Entregado">Entregado</option>
              <option value="Facturado">Facturado</option>
            </select>

            {/* Filtro Tipo */}
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="TODOS">Todos los Tipos</option>
              <option value="Nueva Feature">Nueva Feature</option>
              <option value="Mejora / Refactor">Mejora / Refactor</option>
              <option value="Optimización">Optimización</option>
              <option value="Corrección de Bug">Corrección de Bug</option>
              <option value="Seguridad y Validación">Seguridad y Validación</option>
            </select>
          </div>
        </div>

        {/* Tabla de Features */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              Cargando matriz de costos desde Firestore...
            </div>
          ) : filteredFeatures.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-600">
                No se encontraron funcionalidades registradas con los filtros actuales.
              </p>
              {features.length === 0 && (
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <button
                    onClick={() => setIsComponentModalOpen(true)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                  >
                    <MdLayers size={16} />
                    Desglosar por Componente
                  </button>
                  <button
                    onClick={() => setIsDetectModalOpen(true)}
                    className="px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                  >
                    <MdAutoFixHigh size={16} />
                    Detectar Todo el Proyecto
                  </button>
                  <button
                    onClick={handleSeedDefaults}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  >
                    Insertar Plantillas Básicas
                  </button>
                  <button
                    onClick={() => {
                      setEditingFeature(null);
                      setIsFeatureModalOpen(true);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
                  >
                    Registrar Manualmente
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-3 w-16 text-center">#</th>
                      <th className="py-3 px-4">
                        {modoVista === 'cliente' ? 'Funcionalidad y Valor para el Cliente' : 'Funcionalidad / Módulo'}
                      </th>
                      <th className="py-3 px-4">
                        {modoVista === 'cliente' ? 'Tipo Solución' : 'Tipo'}
                      </th>
                      <th className="py-3 px-4 text-center">Modalidad</th>
                      <th className="py-3 px-4 text-right">Horas</th>
                      <th className="py-3 px-4 text-right">Tarifa</th>
                      <th className="py-3 px-4 text-right">
                        {modoVista === 'cliente' ? 'Inversión' : 'Costo Total'}
                      </th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4 text-center w-28">Acciones</th>
                    </tr>
                  </thead>
                  <SortableContext
                    items={filteredFeatures.map((f, idx) => f.id || `feature-${idx}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {filteredFeatures.map((f, idx) => {
                        let badgeEstadoClass = 'bg-slate-100 text-slate-700';
                        if (f.estado === 'Completado' || f.estado === 'Entregado' || f.estado === 'Facturado') {
                          badgeEstadoClass = 'bg-emerald-100 text-emerald-800 font-semibold';
                        } else if (f.estado === 'En Desarrollo') {
                          badgeEstadoClass = 'bg-blue-100 text-blue-800 font-semibold';
                        } else if (f.estado === 'Planificado') {
                          badgeEstadoClass = 'bg-amber-100 text-amber-800';
                        }

                        return (
                          <SortableFeatureRow
                            key={f.id || idx}
                            feature={f}
                            index={idx}
                            isExpanded={expandedId === f.id}
                            onToggleExpand={() => setExpandedId(expandedId === f.id ? null : (f.id || ''))}
                            modoVista={modoVista}
                            currencySymbol={currencySymbol}
                            tarifa={Number(f.tarifaPorHora) || (config.defaultHourlyRate || 50)}
                            badgeEstadoClass={badgeEstadoClass}
                            humanizingId={humanizingId}
                            onHumanizeSingle={handleHumanizeSingle}
                            onEdit={(item) => {
                              setEditingFeature(item);
                              setIsFeatureModalOpen(true);
                            }}
                            onDelete={(item) => setFeatureToDelete(item)}
                            onUpdateHours={handleInlineUpdateHours}
                            onUpdateDescription={handleInlineUpdateDescription}
                            onUpdateSubItem={handleInlineUpdateSubItem}
                            onAddSubItem={handleInlineAddSubItem}
                            onDeleteSubItem={handleInlineDeleteSubItem}
                          />
                        );
                      })}
                    </tbody>
                  </SortableContext>
                <tfoot>
                  <tr className="bg-slate-100/80 font-bold text-xs text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={4} className="py-3 px-4 text-right uppercase">
                      Totales ({filteredFeatures.length} items)
                    </td>
                    <td className="py-3 px-4 text-right">
                      {stats.totalHoras.toFixed(1)} h
                    </td>
                    <td className="py-3 px-4 text-right">--</td>
                    <td className="py-3 px-4 text-right text-emerald-800 text-sm font-black">
                      {currencySymbol}{' '}
                      {stats.totalCosto.toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                    <td colSpan={2} className="py-3 px-4 text-center text-slate-500 font-medium">
                      {stats.porcentajeCompletado}% completado
                    </td>
                  </tr>
                </tfoot>
              </table>
            </DndContext>
          </div>
          )}
        </div>
      </div>

      {/* Modal Crear / Editar Feature */}
      <ModalFeatureCosto
        isOpen={isFeatureModalOpen}
        onClose={() => {
          setIsFeatureModalOpen(false);
          setEditingFeature(null);
        }}
        onSave={handleSaveFeature}
        editingFeature={editingFeature}
        config={config}
        periodosDisponibles={periodos}
        defaultPeriodoId={selectedPeriodo !== 'TODOS' ? selectedPeriodo : getCurrentPeriodoId()}
      />

      {/* Modal Ajustes / Configuración */}
      <ModalConfiguracionCostos
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={handleSaveConfig}
        currentConfig={config}
      />

      {/* Modal Detectar Features del Código */}
      <ModalDetectarFeatures
        isOpen={isDetectModalOpen}
        onClose={() => setIsDetectModalOpen(false)}
        onImport={handleImportDetectedFeatures}
        config={config}
      />

      {/* Modal Desglosar por Componente */}
      <ModalDesglosarComponente
        isOpen={isComponentModalOpen}
        onClose={() => setIsComponentModalOpen(false)}
        onImport={handleImportSubFeatures}
        config={config}
      />

      {/* Modal Aperturar Nuevo Mes / Período */}
      {isNewPeriodoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <MdCalendarToday className="text-indigo-400" size={18} />
                  Aperturar Nuevo Período Mensual
                </h3>
                <p className="text-xs text-slate-400">
                  Inicia un nuevo ciclo de liquidación y seguimiento de features
                </p>
              </div>
              <button
                onClick={() => setIsNewPeriodoModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <IoClose size={22} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Mes / Período (Formato AAAA-MM)
                </label>
                <input
                  type="month"
                  value={newPeriodoMes}
                  onChange={(e) => setNewPeriodoMes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Nombre visible: <strong>{formatPeriodoNombre(newPeriodoMes)}</strong>
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewPeriodoModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCrearNuevoPeriodo}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
                >
                  Aperturar Período
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Cierre de Mes */}
      {periodoToClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
              <MdLock size={28} className="shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ¿Cerrar Período {periodoToClose.nombre}?
                </h3>
                <p className="text-xs text-slate-600">
                  Al cerrar el mes se congelarán las horas y el total liquidado según las tareas realizadas.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Horas Trabajadas:</span>
                <strong className="text-slate-800">{stats.totalHoras.toFixed(1)} hrs</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Funcionalidades:</span>
                <strong className="text-slate-800">{filteredFeatures.length} entregables ({stats.completadas} completadas)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tarifa / Hora:</span>
                <strong className="text-slate-800">{currencySymbol} {config.defaultHourlyRate || 50}/hr</strong>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-emerald-700">
                <span>Total Liquidación del Mes:</span>
                <span>{currencySymbol} {stats.totalCosto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              * Podrás reabrir el período en cualquier momento si necesitas agregar o corregir tareas.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPeriodoToClose(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleToggleEstadoPeriodo(periodoToClose, 'cerrado')}
                disabled={isClosingPeriod}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-xs disabled:opacity-50"
              >
                {isClosingPeriod ? 'Cerrando...' : 'Confirmar Cierre de Mes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación */}
      {featureToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              ¿Eliminar funcionalidad?
            </h3>
            <p className="text-xs text-slate-600">
              Se eliminará <strong>&quot;{featureToDelete.titulo}&quot;</strong> de la matriz de costos. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setFeatureToDelete(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteFeature}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-xs"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
