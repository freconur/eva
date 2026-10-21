import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  MdAssignment,
  MdCheckCircle,
  MdSearch,
  MdAddCircle,
  MdEdit,
  MdDelete,
  MdBarChart,
  MdFilePresent,
  MdAssignmentTurnedIn,
  MdSchool,
  MdExpandMore,
  MdExpandLess,
  MdViewAgenda,
  MdViewList,
  MdFilterList,
  MdWarning,
  MdArrowBack,
  MdVisibility,
  MdVisibilityOff,
} from 'react-icons/md';
import { toast } from 'react-toastify';
import {
  RiLoader4Line,
  RiTeamLine,
  RiShieldCheckLine,
  RiBookOpenLine,
} from 'react-icons/ri';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import useEvaluacionDesempenoBase from '@/features/hooks/useEvaluacionDesempenoBase';
import { regionTexto } from '@/fuctions/regiones';
import {
  DimensionEspecialista,
  PRDocentes,
  User,
} from '@/features/types/types';
import EvaluacionConfigMenu from './EvaluacionConfigMenu';
import EvaluacionDetalleHeroBanner, {
  HeroBannerMetricItem,
} from './EvaluacionDetalleHeroBanner';
import PadronDocentesUgelTab from './PadronDocentesUgelTab';
import RubricaSectionHeader from './RubricaSectionHeader';
import {
  ModalAgregarDimension,
  ModalUpdateDimension,
  ModalAgregarPregunta,
  ModalUpdatePregunta,
  ModalEditarNombresPestanas,
  ModalAlertaEvaluacionActiva,
  ModalConfirmarEliminacion,
} from '@/components/evaluaciones-desempeno/modals';

export interface EvaluacionDetalleDocenteContainerProps {
  id?: string;
  role?: 'admin' | 'especialista' | string;
  basePath?: string;
}

export const EvaluacionDetalleDocenteContainer: React.FC<EvaluacionDetalleDocenteContainerProps> = ({
  id: propId,
  role: propRole,
  basePath: propBasePath,
}) => {
  const router = useRouter();
  const idEvaluacion = propId || (router.query.id as string) || '';

  const { currentUserData, dataEvaluacionDocente, loaderPages } = useGlobalContext();

  const isEspecialista =
    propRole === 'especialista' ||
    currentUserData?.rol === 1 ||
    currentUserData?.perfil?.rol === 1 ||
    Number(currentUserData?.rol) === 1 ||
    Number(currentUserData?.perfil?.rol) === 1;

  const isAdmin =
    propRole === 'admin' ||
    currentUserData?.rol === 4 ||
    currentUserData?.rol === 0 ||
    currentUserData?.perfil?.rol === 4 ||
    currentUserData?.perfil?.rol === 0 ||
    Number(currentUserData?.rol) === 4 ||
    Number(currentUserData?.rol) === 0;

  const effectiveRole = propRole || (isAdmin ? 'admin' : 'especialista');
  const effectiveBasePath =
    propBasePath ||
    (effectiveRole === 'admin'
      ? '/admin/evaluaciones-docentes'
      : '/especialistas/evaluaciones-docentes');

  const rawUserRegion = currentUserData?.region ?? (currentUserData as any)?.perfil?.region;
  const userRegion =
    rawUserRegion !== undefined && rawUserRegion !== null && rawUserRegion !== '' && !isNaN(Number(rawUserRegion))
      ? Number(rawUserRegion)
      : undefined;

  const {
    getDataEvaluacion,
    getDimensiones,
    getPreguntasRespuestas,
    getEvaluados,
    deleteDimension,
    deletePreguntaRespuesta,
    updateEstadoEvaluacion,
    buscarUsuario,
  } = useEvaluacionDesempenoBase({
    role: effectiveRole as any,
    collectionName: 'evaluaciones-docentes',
  });

  const [activeTab, setActiveTab] = useState<'docentes' | 'padron' | 'rubrica'>('docentes');
  const [modoVista, setModoVista] = useState<'colegios' | 'lista'>('colegios');
  const [searchDocente, setSearchDocente] = useState<string>('');
  const [selectedInstitucion, setSelectedInstitucion] = useState<string>('all');
  const [expandedColegios, setExpandedColegios] = useState<Set<string>>(new Set());

  // Estado persistente del Padrón de Docentes por UGEL para mantener los docentes al cambiar de pestaña
  const [selectedPadronUgel, setSelectedPadronUgel] = useState<number | ''>(() => {
    if (!isAdmin && userRegion !== undefined) {
      return userRegion;
    }
    return '';
  });

  // Sincronizar automáticamente la UGEL del especialista cuando se cargue currentUserData
  useEffect(() => {
    if (!isAdmin && userRegion !== undefined) {
      if (selectedPadronUgel !== userRegion) {
        setSelectedPadronUgel(userRegion);
      }
    }
  }, [isAdmin, userRegion, selectedPadronUgel]);

  const [cacheDocentesPorUgel, setCacheDocentesPorUgel] = useState<Record<number, User[]>>({});

  // Si el usuario no es especialista ni admin, cambiar por defecto a la pestaña rúbrica
  useEffect(() => {
    if (currentUserData && !isEspecialista && !isAdmin) {
      setActiveTab('rubrica');
    }
  }, [currentUserData, isEspecialista, isAdmin]);

  // Estados de Modales de Configuración Rúbrica
  const [showAgregarDim, setShowAgregarDim] = useState<boolean>(false);
  const [dimToUpdate, setDimToUpdate] = useState<DimensionEspecialista | null>(null);
  const [showAgregarPregunta, setShowAgregarPregunta] = useState<boolean>(false);
  const [preguntaToUpdate, setPreguntaToUpdate] = useState<PRDocentes | null>(null);
  const [showModalNombresPestanas, setShowModalNombresPestanas] = useState<boolean>(false);
  const [isDeletingDimension, setIsDeletingDimension] = useState<string | null>(null);
  const [isDeletingPregunta, setIsDeletingPregunta] = useState<string | null>(null);
  const [isUpdatingEstado, setIsUpdatingEstado] = useState<boolean>(false);

  // Estados para modales de advertencia en modo activo y confirmación de eliminación
  const [modalAlertaActiva, setModalAlertaActiva] = useState<{
    isOpen: boolean;
    accion: 'editar' | 'eliminar';
  }>({
    isOpen: false,
    accion: 'editar',
  });

  const [modalConfirmDelete, setModalConfirmDelete] = useState<{
    isOpen: boolean;
    titulo: string;
    nombreElemento?: string;
    advertenciaCascada?: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    titulo: '',
    onConfirm: async () => {},
  });

  const verificarSiActivoParaModificar = (accion: 'editar' | 'eliminar'): boolean => {
    if (dataEvaluacionDocente?.active) {
      setModalAlertaActiva({ isOpen: true, accion });
      return true;
    }
    return false;
  };

  const defaultNombresDocente = useMemo(
    () => ({
      monitoreos: 'Monitoreos Realizados',
      padron: isAdmin
        ? 'Padrón de Docentes por UGEL'
        : `Padrón de Docentes (${regionTexto(userRegion) || 'Mi UGEL'})`,
      rubrica: 'Estructura de Rúbricas',
    }),
    [isAdmin, userRegion]
  );

  const tabNombres = useMemo(
    () => ({
      monitoreos:
        dataEvaluacionDocente?.nombresPestanas?.monitoreos?.trim() ||
        defaultNombresDocente.monitoreos,
      padron:
        dataEvaluacionDocente?.nombresPestanas?.padron?.trim() ||
        defaultNombresDocente.padron,
      rubrica:
        dataEvaluacionDocente?.nombresPestanas?.rubrica?.trim() ||
        defaultNombresDocente.rubrica,
    }),
    [dataEvaluacionDocente?.nombresPestanas, defaultNombresDocente]
  );

  // 1. Suscripción en tiempo real a la evaluación y sus subcolecciones
  useEffect(() => {
    if (!idEvaluacion) return;
    const unsubDoc = getDataEvaluacion(idEvaluacion);
    const unsubDims = getDimensiones(idEvaluacion);
    const unsubPreg = getPreguntasRespuestas(idEvaluacion);
    const unsubEval = getEvaluados(idEvaluacion);

    return () => {
      if (typeof unsubDoc === 'function') unsubDoc();
      if (typeof unsubDims === 'function') unsubDims();
      if (typeof unsubPreg === 'function') unsubPreg();
      if (typeof unsubEval === 'function') unsubEval();
    };
  }, [idEvaluacion, getDataEvaluacion, getDimensiones, getPreguntasRespuestas, getEvaluados]);

  const {
    dimensionesEspecialistas,
    getPreguntaRespuestaDocentes: contextPreguntas,
    evaluadosEspecialista,
  } = useGlobalContext();

  const currentDimensiones = dimensionesEspecialistas || [];
  const currentPreguntas = contextPreguntas || [];
  const rawEvaluados = (evaluadosEspecialista || []) as (User & { [key: string]: any })[];

  // Filtrado de evaluaciones de monitoreo realizadas por el especialista o administrador autenticado
  // Se excluyen las evaluaciones internas realizadas por los directores de las instituciones
  const currentEvaluados = useMemo(() => {
    if (!rawEvaluados || rawEvaluados.length === 0) return [];
    if (!currentUserData) return [];

    const userDni = currentUserData.dni ? String(currentUserData.dni).trim() : '';
    if (!userDni) return [];

    return rawEvaluados.filter((ev) => {
      // 1. Excluir explícitamente evaluaciones efectuadas por el Director de la institución
      if (ev.evaluadorRol === 'director') {
        return false;
      }

      // 2. Si no tiene evaluadorRol explícito pero carece de identificador de monitor y fue guardada con dniDirector
      if (
        !ev.evaluadorRol &&
        !ev.especialistaDni &&
        !ev.adminDni &&
        ev.dniDirector &&
        (ev.evaluadorDni === ev.dniDirector || !ev.evaluadorDni)
      ) {
        return false;
      }

      // 3. Comprobar que la evaluación haya sido realizada por este especialista o administrador
      const monitorDni = String(
        ev.evaluadorDni ||
        ev.especialistaDni ||
        ev.adminDni ||
        ev.datosMonitor?.dni ||
        ''
      ).trim();

      if (monitorDni && monitorDni === userDni) {
        return true;
      }

      return false;
    });
  }, [rawEvaluados, currentUserData]);

  // Conteo total de docentes monitoreados en esta evaluación
  const totalEvaluados = currentEvaluados.length;

  // Conjunto de DNIs que ya han sido evaluados en esta evaluación por este monitor
  const evaluatedDnisSet = useMemo(() => {
    const set = new Set<string>();
    currentEvaluados.forEach((item: any) => {
      const dni = String(
        item.dni ||
        item.docenteDni ||
        item.evaluadoDni ||
        item.idDocente ||
        ''
      ).trim();
      if (dni) set.add(dni);
    });
    return set;
  }, [currentEvaluados]);

  // Clave de agrupación única por Director (dniDirector) o fallback a institución
  const getGrupoDirectorKey = (docente: User & { [key: string]: any }) => {
    const dniDir = docente.dniDirector ? String(docente.dniDirector).trim() : '';
    if (dniDir) {
      return `DIR_${dniDir}`;
    }
    const inst = docente.institucion ? String(docente.institucion).trim().toUpperCase() : 'SIN_ASIGNAR';
    return `INST_${inst}`;
  };

  // Lista de colegios / directores únicos monitoreados
  const listaInstituciones = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        nombre: string;
        dniDirector: string;
        count: number;
      }
    >();

    currentEvaluados.forEach((ev) => {
      const key = getGrupoDirectorKey(ev);
      const rawInst = ev.institucion ? String(ev.institucion).trim() : 'I.E. Sin Especificar';
      const dniDir = ev.dniDirector ? String(ev.dniDirector).trim() : '';

      if (!map.has(key)) {
        map.set(key, {
          key,
          nombre: rawInst,
          dniDirector: dniDir,
          count: 0,
        });
      }
      const item = map.get(key)!;
      item.count += 1;
      if (!item.dniDirector && dniDir) {
        item.dniDirector = dniDir;
      }
      if (item.nombre === 'I.E. Sin Especificar' && rawInst !== 'I.E. Sin Especificar') {
        item.nombre = rawInst;
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    );
  }, [currentEvaluados]);

  const totalInstituciones = listaInstituciones.length;

  // Filtro de búsqueda y de I.E./Director seleccionado
  const evaluadosFiltrados = useMemo(() => {
    let result = currentEvaluados;

    if (selectedInstitucion !== 'all') {
      result = result.filter((d) => getGrupoDirectorKey(d) === selectedInstitucion);
    }

    if (!searchDocente.trim()) return result;
    const query = searchDocente.toLowerCase().trim();
    return result.filter((d) => {
      const nombres = (d.nombres || '').toLowerCase();
      const apellidos = (d.apellidos || '').toLowerCase();
      const dni = String(d.dni || d.docenteDni || d.evaluadoDni || '').toLowerCase();
      const institucion = (d.institucion || '').toLowerCase();
      const directorDni = String(d.dniDirector || '').toLowerCase();
      return (
        nombres.includes(query) ||
        apellidos.includes(query) ||
        dni.includes(query) ||
        institucion.includes(query) ||
        directorDni.includes(query)
      );
    });
  }, [currentEvaluados, selectedInstitucion, searchDocente]);

  // Agrupación organizada por Director (dniDirector) e Institución Educativa
  const gruposPorInstitucion = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        institucion: string;
        dniDirector: string;
        nombreDirector?: string;
        docentes: (User & { [key: string]: any })[];
        promedio: number;
      }
    >();

    evaluadosFiltrados.forEach((docente) => {
      const key = getGrupoDirectorKey(docente);
      const nombre = docente.institucion ? String(docente.institucion).trim() : 'I.E. Sin Especificar';
      const dniDir = docente.dniDirector ? String(docente.dniDirector).trim() : '';
      const dirNombre = String(
        docente.nombreDirector ||
        docente.nombresDirector ||
        docente.directorNombre ||
        (typeof docente.director === 'string' ? docente.director : '') ||
        ''
      ).trim();

      if (!map.has(key)) {
        map.set(key, {
          key,
          institucion: nombre,
          dniDirector: dniDir,
          nombreDirector: dirNombre,
          docentes: [],
          promedio: 0,
        });
      }
      const item = map.get(key)!;
      item.docentes.push(docente);
      if (!item.dniDirector && dniDir) {
        item.dniDirector = dniDir;
      }
      if (!item.nombreDirector && dirNombre) {
        item.nombreDirector = dirNombre;
      }
      if (item.institucion === 'I.E. Sin Especificar' && nombre !== 'I.E. Sin Especificar') {
        item.institucion = nombre;
      }
    });

    const list = Array.from(map.values()).map((g) => {
      const suma = g.docentes.reduce((acc, d) => acc + (Number(d.calificacion) || 0), 0);
      g.promedio = g.docentes.length > 0 ? Math.round((suma / g.docentes.length) * 10) / 10 : 0;
      g.docentes.sort((a, b) =>
        (a.apellidos || '').localeCompare(b.apellidos || '', 'es', { sensitivity: 'base' })
      );
      return g;
    });

    list.sort((a, b) => a.institucion.localeCompare(b.institucion, 'es', { sensitivity: 'base' }));
    return list;
  }, [evaluadosFiltrados]);

  // Cargar nombres de directores desde la colección usuarios si no vienen en los metadatos
  const [directoresMap, setDirectoresMap] = useState<Record<string, string>>({});
  const fetchedDnisRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    const missingDnis = Array.from(
      new Set(
        gruposPorInstitucion
          .filter((g) => g.dniDirector && !g.nombreDirector && !directoresMap[g.dniDirector])
          .map((g) => String(g.dniDirector).trim())
          .filter((dni) => Boolean(dni) && !fetchedDnisRef.current.has(dni))
      )
    );

    if (missingDnis.length === 0) return;

    missingDnis.forEach((dni) => fetchedDnisRef.current.add(dni));

    Promise.all(
      missingDnis.map(async (dni) => {
        try {
          const user = await buscarUsuario(dni);
          if (user) {
            const fullName = `${user.nombres || ''} ${user.apellidos || ''}`.trim();
            if (fullName) return { dni, name: fullName };
          }
        } catch (e) {
          console.error(`Error al buscar director con DNI ${dni}:`, e);
        }
        return { dni, name: '' };
      })
    ).then((results) => {
      if (!isMounted) return;
      setDirectoresMap((prev) => {
        const next = { ...prev };
        let hasChanges = false;
        results.forEach((r) => {
          if (r.name && next[r.dni] !== r.name) {
            next[r.dni] = r.name;
            hasChanges = true;
          }
        });
        return hasChanges ? next : prev;
      });
    });

    return () => {
      isMounted = false;
    };
  }, [gruposPorInstitucion, buscarUsuario]);

  const toggleColegio = (key: string) => {
    setExpandedColegios((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedColegios(new Set(gruposPorInstitucion.map((g) => g.key)));
  };

  const collapseAll = () => {
    setExpandedColegios(new Set());
  };

  // Estado de acordeones para dominios de rúbrica (inician cerrados por defecto)
  const [expandedDominios, setExpandedDominios] = useState<Set<string>>(new Set());

  const toggleDominio = (dimId: string) => {
    setExpandedDominios((prev) => {
      const next = new Set(prev);
      if (next.has(dimId)) next.delete(dimId);
      else next.add(dimId);
      return next;
    });
  };

  const expandAllDominios = () => {
    setExpandedDominios(
      new Set(
        currentDimensiones
          .map((d) => d.id)
          .filter((id): id is string => Boolean(id))
      )
    );
  };

  const collapseAllDominios = () => {
    setExpandedDominios(new Set());
  };

  // Detección de búsqueda por DNI exacto de 8 dígitos para acción rápida
  const isDniSearch = /^\d{8}$/.test(searchDocente.trim());
  const foundExactMatch = evaluadosFiltrados.some(
    (ev) => String(ev.dni || ev.docenteDni || ev.evaluadoDni).trim() === searchDocente.trim()
  );
  const showPromptNewEval = isDniSearch && !foundExactMatch;

  // Estado para validación del docente al buscar un DNI exacto
  const [dniSearchResult, setDniSearchResult] = useState<{
    dni: string;
    loading: boolean;
    user: User | null;
    notFound: boolean;
    wrongRole?: boolean;
    actualRole?: number | string;
  }>({
    dni: '',
    loading: false,
    user: null,
    notFound: false,
    wrongRole: false,
  });

  useEffect(() => {
    const trimmedDni = searchDocente.trim();
    if (!/^\d{8}$/.test(trimmedDni) || foundExactMatch) {
      setDniSearchResult({ dni: '', loading: false, user: null, notFound: false, wrongRole: false });
      return;
    }

    let isMounted = true;
    setDniSearchResult((prev) => ({ ...prev, dni: trimmedDni, loading: true, wrongRole: false }));

    buscarUsuario(trimmedDni)
      .then((user) => {
        if (!isMounted) return;
        if (user) {
          const userRole = Number(user.rol ?? user.perfil?.rol);
          if (userRole !== 3) {
            setDniSearchResult({
              dni: trimmedDni,
              loading: false,
              user: null,
              notFound: false,
              wrongRole: true,
              actualRole: user.rol ?? user.perfil?.rol,
            });
            return;
          }
          setDniSearchResult({ dni: trimmedDni, loading: false, user, notFound: false, wrongRole: false });
        } else {
          setDniSearchResult({ dni: trimmedDni, loading: false, user: null, notFound: true, wrongRole: false });
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setDniSearchResult({ dni: trimmedDni, loading: false, user: null, notFound: true, wrongRole: false });
      });

    return () => {
      isMounted = false;
    };
  }, [searchDocente, foundExactMatch, buscarUsuario]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Métricas del Hero Banner adaptadas al acompañamiento pedagógico
  const metricasDocente = useMemo<HeroBannerMetricItem[]>(
    () => [
      {
        id: 'evaluados',
        label: tabNombres.monitoreos,
        value: totalEvaluados,
        icon: RiShieldCheckLine,
        badgeText: 'Concluidos',
        helperText: 'Ver dashboard de evaluados',
        colorTheme: 'emerald' as const,
        href: `${effectiveBasePath}/evaluacion/${idEvaluacion}/evaluados`,
      },
      {
        id: 'padron',
        label: tabNombres.padron,
        value: isAdmin ? 'Consultar' : 'Mi UGEL',
        icon: RiTeamLine,
        badgeText: 'Padrón',
        helperText: isAdmin ? 'Docentes por UGEL' : 'Docentes de mi UGEL',
        colorTheme: 'blue' as const,
        active: activeTab === 'padron',
        onClick: () => setActiveTab('padron'),
      },
      {
        id: 'instituciones',
        label: 'I.E. Monitoreadas',
        value: totalInstituciones,
        icon: RiTeamLine,
        badgeText: 'Colegios',
        helperText: 'Escuelas intervenidas',
        colorTheme: 'blue' as const,
        active: modoVista === 'colegios' && activeTab === 'docentes',
        onClick: () => {
          setActiveTab('docentes');
          setModoVista('colegios');
        },
      },
      {
        id: 'criterios',
        label: tabNombres.rubrica,
        value: currentPreguntas.length,
        icon: RiBookOpenLine,
        badgeText: 'Rúbrica',
        helperText: 'Criterios de evaluación',
        colorTheme: 'amber' as const,
        active: activeTab === 'rubrica',
        onClick: () => setActiveTab('rubrica'),
      },
    ],
    [
      totalEvaluados,
      totalInstituciones,
      currentPreguntas.length,
      activeTab,
      modoVista,
      effectiveBasePath,
      idEvaluacion,
      isAdmin,
      userRegion,
      tabNombres,
    ]
  );

  // Eliminar dimensión y sus criterios asociados
  const handleDeleteDim = (dimId?: string) => {
    if (verificarSiActivoParaModificar('eliminar')) return;
    if (!dimId || !idEvaluacion) return;

    const dim = currentDimensiones.find((d) => String(d.id) === String(dimId));
    const preguntasDeDim = currentPreguntas.filter(
      (p) => String(p.dimensionId || (p as any).dimencionId) === String(dimId)
    );

    const advertenciaCascada =
      preguntasDeDim.length > 0
        ? `Contiene ${preguntasDeDim.length} ${
            preguntasDeDim.length === 1 ? 'criterio pedagógico' : 'criterios pedagógicos'
          } que también se ${
            preguntasDeDim.length === 1 ? 'eliminará' : 'eliminarán'
          } definitivamente de la evaluación.`
        : undefined;

    setModalConfirmDelete({
      isOpen: true,
      titulo: '¿Eliminar dominio pedagógico?',
      nombreElemento: dim?.nombre || (dim as any)?.dimension || 'Dominio seleccionado',
      advertenciaCascada,
      onConfirm: async () => {
        try {
          setIsDeletingDimension(dimId);
          await deleteDimension(idEvaluacion, dimId, true);
          toast.success('Dominio pedagógico eliminado correctamente.');
        } catch (err) {
          console.error('Error al eliminar dominio:', err);
          toast.error('Hubo un error al eliminar el dominio pedagógico. Intente nuevamente.');
        } finally {
          setIsDeletingDimension(null);
        }
      },
    });
  };

  // Eliminar criterio
  const handleDeletePreg = (pregId?: string) => {
    if (verificarSiActivoParaModificar('eliminar')) return;
    if (!pregId || !idEvaluacion) return;

    const preg = currentPreguntas.find((p) => String(p.id) === String(pregId));

    setModalConfirmDelete({
      isOpen: true,
      titulo: '¿Eliminar criterio pedagógico?',
      nombreElemento: preg?.criterio || (preg as any)?.pregunta || 'Criterio seleccionado',
      advertenciaCascada: undefined,
      onConfirm: async () => {
        try {
          setIsDeletingPregunta(pregId);
          await deletePreguntaRespuesta(idEvaluacion, pregId);
          toast.success('Criterio pedagógico eliminado correctamente.');
        } catch (err) {
          console.error('Error al eliminar criterio:', err);
          toast.error('Hubo un error al eliminar el criterio pedagógico. Intente nuevamente.');
        } finally {
          setIsDeletingPregunta(null);
        }
      },
    });
  };

  const handleToggleEstadoEvaluacion = async () => {
    if (!isAdmin) {
      toast.warning('Solo los administradores pueden activar o desactivar evaluaciones.');
      return;
    }
    const currentStatus = Boolean(dataEvaluacionDocente?.active);
    const newStatus = !currentStatus;

    if (newStatus) {
      const tieneFase = Boolean(
        dataEvaluacionDocente?.faseNombre?.trim() ||
        (Array.isArray((dataEvaluacionDocente as any)?.fases) &&
          (dataEvaluacionDocente as any).fases.length > 0 &&
          (dataEvaluacionDocente as any).fases.some((f: any) => f?.nombre?.trim()))
      );

      if (!tieneFase) {
        toast.warn('Para activar la evaluación, debe configurar una fase pedagógica activa en el menú de configuración.');
        return;
      }
    }

    try {
      setIsUpdatingEstado(true);
      await updateEstadoEvaluacion(idEvaluacion, newStatus);
      toast.success(
        newStatus
          ? 'Evaluación activada exitosamente para todos los usuarios.'
          : 'Evaluación pausada / desactivada.'
      );
    } catch (err) {
      console.error('Error al cambiar estado de la evaluación:', err);
      toast.error('Error al actualizar el estado de la evaluación.');
    } finally {
      setIsUpdatingEstado(false);
    }
  };

  // Protección de acceso: si el usuario no es administrador y la evaluación está inactiva o pausada
  if (!loaderPages && dataEvaluacionDocente?.id && !dataEvaluacionDocente.active && !isAdmin) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-amber-200 space-y-6">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
            <MdWarning className="text-3xl" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
              Evaluación Inactiva o Pausada
            </h2>
            <p className="text-sm text-slate-500">
              La evaluación <strong className="text-slate-700">{dataEvaluacionDocente.name}</strong> no se encuentra activa en este momento. Solo los administradores pueden activar evaluaciones para su calificación y monitoreo.
            </p>
          </div>
          <div>
            <Link
              href={effectiveBasePath}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <MdArrowBack className="text-base" />
              <span>Volver a Evaluaciones Docentes</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Modales */}
      {showModalNombresPestanas && (
        <ModalEditarNombresPestanas
          idEvaluacion={idEvaluacion}
          collectionName="evaluaciones-docentes"
          nombresPestanasActuales={dataEvaluacionDocente?.nombresPestanas}
          defaultNombres={defaultNombresDocente}
          onClose={() => setShowModalNombresPestanas(false)}
        />
      )}

      {showAgregarDim && (
        <ModalAgregarDimension
          idEvaluacion={idEvaluacion}
          collectionName="evaluaciones-docentes"
          onClose={() => setShowAgregarDim(false)}
        />
      )}

      {dimToUpdate && (
        <ModalUpdateDimension
          idEvaluacion={idEvaluacion}
          collectionName="evaluaciones-docentes"
          dimensionUpdate={dimToUpdate}
          onClose={() => setDimToUpdate(null)}
        />
      )}

      {showAgregarPregunta && (
        <ModalAgregarPregunta
          idEvaluacion={idEvaluacion}
          collectionName="evaluaciones-docentes"
          dimensiones={currentDimensiones}
          escala={dataEvaluacionDocente?.escala}
          onClose={() => setShowAgregarPregunta(false)}
        />
      )}

      {preguntaToUpdate && (
        <ModalUpdatePregunta
          idEvaluacion={idEvaluacion}
          collectionName="evaluaciones-docentes"
          dataUpdate={preguntaToUpdate}
          dimensiones={currentDimensiones}
          escala={dataEvaluacionDocente?.escala}
          onClose={() => setPreguntaToUpdate(null)}
        />
      )}

      {/* Modal Informativo / Advertencia cuando la Evaluación está Activa */}
      <ModalAlertaEvaluacionActiva
        isOpen={modalAlertaActiva.isOpen}
        onClose={() => setModalAlertaActiva((prev) => ({ ...prev, isOpen: false }))}
        onDesactivar={isAdmin ? handleToggleEstadoEvaluacion : undefined}
        isDesactivando={isUpdatingEstado}
        accionIntentada={modalAlertaActiva.accion}
      />

      {/* Modal Accesible de Confirmación de Eliminación */}
      <ModalConfirmarEliminacion
        isOpen={modalConfirmDelete.isOpen}
        onClose={() => setModalConfirmDelete((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfirmDelete.onConfirm}
        isDeleting={Boolean(isDeletingDimension || isDeletingPregunta)}
        titulo={modalConfirmDelete.titulo}
        nombreElemento={modalConfirmDelete.nombreElemento}
        advertenciaCascada={modalConfirmDelete.advertenciaCascada}
      />

      {/* Banner Principal Modular Reutilizable */}
      <EvaluacionDetalleHeroBanner
        idEvaluacion={idEvaluacion}
        collectionName="evaluaciones-docentes"
        backHref={effectiveBasePath}
        selectedYear={currentYear}
        institucion={currentUserData?.institucion || (effectiveRole === 'admin' ? 'DRE / UGEL' : 'UGEL')}
        faseNombre={dataEvaluacionDocente?.faseNombre}
        categoria={dataEvaluacionDocente?.categoria || 'ACOMPAÑAMIENTO PEDAGÓGICO'}
        title={dataEvaluacionDocente?.name || 'RÚBRICA DE MEDIACIÓN DIDÁCTICA'}
        descripcion={
          dataEvaluacionDocente?.descripcion ||
          'Supervisión y acompañamiento pedagógico al desempeño docente en aula'
        }
        isProtected={!!dataEvaluacionDocente?.active}
        metricas={metricasDocente}
        backgroundImage={dataEvaluacionDocente?.backgroundImage}
        backgroundImageOpacity={dataEvaluacionDocente?.backgroundImageOpacity ?? 0.25}
        isAdmin={isAdmin}
        canEditTitleDescription={isAdmin}
        storageKey={`eva_eval_docente_${effectiveRole}_banner_variant`}
        actions={
          isAdmin ? (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Botón Activar / Pausar Evaluación */}
              <button
                type="button"
                onClick={handleToggleEstadoEvaluacion}
                disabled={isUpdatingEstado}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer backdrop-blur-sm border shadow-xs ${
                  dataEvaluacionDocente?.active
                    ? 'bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-200 border-emerald-400/40'
                    : 'bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 border-amber-400/40'
                } ${isUpdatingEstado ? 'opacity-60 cursor-not-allowed' : ''}`}
                title={
                  dataEvaluacionDocente?.active
                    ? 'Evaluación activa en modo protegido. Haz clic para pausar o desactivar'
                    : 'Evaluación inactiva. Haz clic para activar'
                }
              >
                {isUpdatingEstado ? (
                  <RiLoader4Line className="w-3.5 h-3.5 animate-spin" />
                ) : dataEvaluacionDocente?.active ? (
                  <MdVisibility className="text-base text-emerald-300" />
                ) : (
                  <MdVisibilityOff className="text-base text-amber-300" />
                )}
                <span>{dataEvaluacionDocente?.active ? 'Activa' : 'Inactiva'}</span>
              </button>

              <Link
                href={`${effectiveBasePath}/evaluacion/reporte?idEvaluacion=${idEvaluacion}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-xs transition-all backdrop-blur-sm cursor-pointer"
                title="Ver reporte general y analíticas consolidadas"
              >
                <MdBarChart className="text-base text-teal-300" />
                <span>Reporte General</span>
              </Link>
              <EvaluacionConfigMenu
                idEvaluacion={idEvaluacion}
                collectionName="evaluaciones-docentes"
                dimensiones={currentDimensiones}
                preguntas={currentPreguntas}
                escala={dataEvaluacionDocente?.escala}
                niveles={dataEvaluacionDocente?.niveles || (dataEvaluacionDocente as any)?.nivelYPuntaje}
                activarEvidencias={dataEvaluacionDocente?.activarEvidencias}
                titulo={dataEvaluacionDocente?.name}
                descripcion={dataEvaluacionDocente?.descripcion}
                faseActual={dataEvaluacionDocente?.faseNombre}
                nombresPestanasActuales={dataEvaluacionDocente?.nombresPestanas}
                defaultNombresPestanas={defaultNombresDocente}
              />
            </div>
          ) : undefined
        }
      />

      {/* Navegación por Pestañas */}
      <div className="flex items-center justify-between border-b border-slate-200 flex-wrap gap-2">
        <div className="flex items-center overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('docentes')}
            className={`flex items-center gap-2 py-3 px-6 font-semibold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'docentes'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MdAssignmentTurnedIn className="text-lg" />
            <span>{tabNombres.monitoreos} ({totalEvaluados})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('padron')}
            className={`flex items-center gap-2 py-3 px-6 font-semibold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'padron'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RiTeamLine className="text-lg" />
            <span>{tabNombres.padron}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rubrica')}
            className={`flex items-center gap-2 py-3 px-6 font-semibold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rubrica'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MdAssignment className="text-lg" />
            <span>{tabNombres.rubrica} ({currentPreguntas.length} Criterios)</span>
          </button>
        </div>

        {isAdmin && (
          <div className="pb-1.5 pr-2">
            <button
              type="button"
              onClick={() => setShowModalNombresPestanas(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Personalizar nombres de las pestañas"
            >
              <MdEdit className="text-sm text-blue-500" />
              <span>Personalizar pestañas</span>
            </button>
          </div>
        )}
      </div>

      {/* PESTAÑA 1: MONITOREOS REALIZADOS (ORGANIZADOS POR COLEGIO) */}
      <div className={activeTab === 'docentes' ? 'block' : 'hidden'}>
        <div className="space-y-4">
          {/* Barra de Filtros, Búsqueda y Selector de Modo de Vista */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            {/* Buscador de Docente / I.E. */}
            <div className="flex items-center gap-3 flex-1 bg-transparent">
              <MdSearch className="text-xl text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por docente, DNI, institución o director..."
                value={searchDocente}
                onChange={(e) => setSearchDocente(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
              />
              {searchDocente && (
                <button
                  type="button"
                  onClick={() => setSearchDocente('')}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded bg-slate-100 transition-colors cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Selector de Institución Educativa / Director */}
            {totalInstituciones > 1 && (
              <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
                <MdSchool className="text-slate-400 text-base shrink-0" />
                <select
                  value={selectedInstitucion}
                  onChange={(e) => setSelectedInstitucion(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">Todas las sedes / I.E. ({totalInstituciones})</option>
                  {listaInstituciones.map((inst) => (
                    <option key={inst.key} value={inst.key}>
                      {inst.nombre} {inst.dniDirector ? `(Dir: ${inst.dniDirector})` : ''} ({inst.count})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selector de Vista: Por Colegios vs Lista Plana */}
            <div className="flex items-center gap-2 border-t lg:border-t-0 lg:border-l border-slate-200 pt-2 lg:pt-0 lg:pl-3">
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setModoVista('colegios')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    modoVista === 'colegios'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Organizado por Institución Educativa"
                >
                  <MdViewAgenda className="text-sm" />
                  <span>Por Colegios</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
                    {totalInstituciones}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setModoVista('lista')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    modoVista === 'lista'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Lista completa de todos los docentes monitoreados"
                >
                  <MdViewList className="text-sm" />
                  <span>Lista General</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 text-slate-700 font-bold">
                    {totalEvaluados}
                  </span>
                </button>
              </div>

              {/* Botón Acción Nuevo Monitoreo */}
              <Link
                href={`${effectiveBasePath}/evaluacion/evaluar-docente?id=${idEvaluacion}`}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
              >
                <MdAddCircle className="text-base" />
                <span>+ Monitorear</span>
              </Link>
            </div>
          </div>

          {/* Prompt de acción rápida cuando se busca un DNI no registrado */}
          {showPromptNewEval && (() => {
            const targetUser = dniSearchResult.user;
            const isDocenteNotFound = dniSearchResult.notFound;
            const isDocenteSearching = dniSearchResult.loading;

            const isSpecialist = effectiveRole === 'especialista' || !isAdmin;
            const userRegion =
              targetUser?.region !== undefined && targetUser?.region !== null
                ? Number(targetUser.region)
                : null;
            const myRegion =
              currentUserData?.region !== undefined && currentUserData?.region !== null
                ? Number(currentUserData.region)
                : null;
            const isDifferentRegion =
              isSpecialist &&
              myRegion !== null &&
              userRegion !== null &&
              myRegion !== userRegion;

            const rawTargetUgel = userRegion !== null ? regionTexto(userRegion) : '';
            const targetUgelName = rawTargetUgel
              ? rawTargetUgel.startsWith('UGEL')
                ? rawTargetUgel
                : `UGEL ${rawTargetUgel}`
              : userRegion !== null
              ? `UGEL ${userRegion}`
              : '';

            const rawMyUgel = myRegion !== null ? regionTexto(myRegion) : '';
            const myUgelName = rawMyUgel
              ? rawMyUgel.startsWith('UGEL')
                ? rawMyUgel
                : `UGEL ${rawMyUgel}`
              : myRegion !== null
              ? `UGEL ${myRegion}`
              : '';

            return (
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <MdSearch className="text-xl" />
                  </div>
                  <div>
                    {isDocenteSearching ? (
                      <p className="text-xs text-slate-500">Verificando docente en el sistema...</p>
                    ) : dniSearchResult.wrongRole ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-amber-800">
                            El usuario con DNI {searchDocente.trim()} no tiene rol de Docente
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Rol no válido
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          El usuario se encuentra registrado pero tiene asignado{' '}
                          <strong>
                            {Number(dniSearchResult.actualRole) === 2
                              ? 'rol de Director (Rol 2)'
                              : `rol ${dniSearchResult.actualRole ?? 'N/A'}`}
                          </strong>
                          . En esta ruta de evaluaciones a docentes solo se permite buscar y evaluar usuarios con rol de Docente (Rol 3).
                        </p>
                      </div>
                    ) : isDocenteNotFound ? (
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">
                          No existen resultados del docente con DNI {searchDocente.trim()} en su UGEL
                        </h4>
                        <p className="text-xs text-slate-600">
                          Verifique que el número de DNI ingresado sea correcto o que el docente se encuentre registrado.
                        </p>
                      </div>
                    ) : isDifferentRegion ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-red-700">
                            Docente no pertenece a su UGEL
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                            Sin autorización
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          El docente pertenece a la {targetUgelName}. Solo puede monitorear a docentes adscritos a su jurisdicción.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">
                          {targetUser ? (
                            <>
                              Docente {targetUser.nombres || ''} {targetUser.apellidos || ''} no registra monitoreos en esta evaluación
                            </>
                          ) : (
                            <>
                              Docente con DNI {searchDocente.trim()} no registra monitoreos en esta evaluación
                            </>
                          )}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <p className="text-xs text-slate-600">
                            {isAdmin
                              ? `El docente pertenece a la ${targetUgelName}`
                              : `El docente pertenece a su UGEL (${myUgelName})`}
                          </p>
                          {targetUser?.institucion && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-800">
                              {targetUser.institucion}
                            </span>
                          )}
                          {targetUgelName && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                              {targetUgelName}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {!isDocenteSearching && !isDocenteNotFound && !dniSearchResult.wrongRole && !isDifferentRegion && (
                  <Link
                    href={`${effectiveBasePath}/evaluacion/evaluar-docente?id=${idEvaluacion}&idDocente=${searchDocente.trim()}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
                  >
                    <MdAddCircle className="text-sm" />
                    <span>Evaluar DNI {searchDocente.trim()}</span>
                  </Link>
                )}
              </div>
            );
          })()}

          {/* Estado de Carga o Lista Vacía */}
          {loaderPages ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
              <RiLoader4Line className="w-10 h-10 animate-spin text-blue-600 mb-3" />
              <p className="text-sm font-medium text-slate-500">Cargando monitoreos docentes...</p>
            </div>
          ) : evaluadosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-slate-200 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <RiShieldCheckLine className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                {searchDocente || selectedInstitucion !== 'all'
                  ? 'No se encontraron docentes con los filtros aplicados'
                  : 'Aún no hay monitoreos registrados en esta evaluación'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mb-4">
                {searchDocente || selectedInstitucion !== 'all'
                  ? 'Prueba modificando el término de búsqueda o seleccionando otra institución educativa.'
                  : 'Comienza evaluando a los docentes de las instituciones educativas asignadas.'}
              </p>
              <Link
                href={`${effectiveBasePath}/evaluacion/evaluar-docente?id=${idEvaluacion}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <MdAddCircle className="text-base" />
                <span>Iniciar Primer Monitoreo</span>
              </Link>
            </div>
          ) : modoVista === 'colegios' ? (
            /* VISTA ORGANIZADA POR INSTITUCIÓN EDUCATIVA (CARDS CON ACORDEÓN) */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  Mostrando <strong className="text-slate-700">{gruposPorInstitucion.length}</strong> instituciones educativas
                  ({evaluadosFiltrados.length} monitoreos en total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={expandAll}
                    className="hover:text-blue-600 font-semibold cursor-pointer transition-colors"
                  >
                    Expandir todos
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={collapseAll}
                    className="hover:text-blue-600 font-semibold cursor-pointer transition-colors"
                  >
                    Contraer todos
                  </button>
                </div>
              </div>

              {gruposPorInstitucion.map((grupo) => {
                const isExpanded = expandedColegios.has(grupo.key);

                return (
                  <div
                    key={grupo.key}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
                  >
                    {/* Header del Colegio */}
                    <div
                      onClick={() => toggleColegio(grupo.key)}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-gradient-to-r from-slate-50/60 to-white hover:from-blue-50/30 hover:to-white transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs font-bold">
                          <MdSchool className="text-xl" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate" title={grupo.institucion}>
                              {grupo.institucion}
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200/60">
                              {grupo.docentes.length} {grupo.docentes.length === 1 ? 'docente' : 'docentes'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-0.5 flex-wrap">
                            {grupo.dniDirector ? (
                              <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                                {grupo.nombreDirector || directoresMap[grupo.dniDirector] ? (
                                  <span>
                                    {grupo.nombreDirector || directoresMap[grupo.dniDirector]}{' '}
                                    <span className="text-slate-400 font-normal">DNI: {grupo.dniDirector}</span>
                                  </span>
                                ) : (
                                  <span>Director DNI: {grupo.dniDirector}</span>
                                )}
                              </span>
                            ) : (
                              <span className="italic text-slate-400">Sin DNI de director asignado</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Acciones del Colegio */}
                      <div className="flex items-center gap-2.5 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`${effectiveBasePath}/evaluacion/reporte?idEvaluacion=${idEvaluacion}&institucion=${encodeURIComponent(grupo.institucion)}${grupo.dniDirector ? `&dniDirector=${encodeURIComponent(grupo.dniDirector)}` : ''}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                          title={`Ver reporte detallado de ${grupo.institucion}`}
                        >
                          <MdBarChart className="text-sm text-blue-600" />
                          <span>Reporte I.E.</span>
                        </Link>

                        <Link
                          href={`${effectiveBasePath}/evaluacion/${idEvaluacion}/evaluados?institucion=${encodeURIComponent(grupo.institucion)}${grupo.dniDirector ? `&dniDirector=${encodeURIComponent(grupo.dniDirector)}` : ''}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                          title={`Ver resultados y analíticas de ${grupo.institucion}`}
                        >
                          <MdBarChart className="text-sm text-purple-600" />
                          <span>Resultados & Analíticas</span>
                        </Link>

                        <Link
                          href={`${effectiveBasePath}/evaluacion/evaluar-docente?id=${idEvaluacion}`}
                          className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                          title="Evaluar a otro docente de esta institución"
                        >
                          <MdAddCircle className="text-emerald-600" />
                          <span>+ Evaluar Docente</span>
                        </Link>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleColegio(grupo.key);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title={isExpanded ? 'Contraer colegio' : 'Expandir colegio'}
                          aria-expanded={isExpanded}
                        >
                          <MdExpandMore
                            className={`text-2xl text-slate-600 transition-transform duration-300 ease-in-out ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Tabla de Docentes Monitoreados en este Colegio con animación suave de acordeón */}
                    <div
                      className={`grid transition-all duration-300 ease-in-out ${
                        isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="overflow-x-auto border-t border-slate-100">
                        <table className="min-w-full divide-y divide-slate-100">
                          <thead className="bg-slate-50/70">
                            <tr>
                              <th scope="col" className="w-12 px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                #
                              </th>
                              <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                Docente Monitoreado
                              </th>
                              <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                Cargo / Especialidad
                              </th>
                              <th scope="col" className="px-4 py-2.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                Fecha Monitoreo
                              </th>
                              <th scope="col" className="w-32 px-4 py-2.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                Puntaje
                              </th>
                              <th scope="col" className="w-44 px-4 py-2.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {grupo.docentes.map((docente, idx) => {
                              const docenteDni = docente.dni || docente.docenteDni || docente.evaluadoDni || '';
                              const evalUrl = `${effectiveBasePath}/evaluacion/evaluar-docente?id=${idEvaluacion}&idDocente=${docenteDni}`;
                              const sessionParam = docente.id ? `&sessionId=${docente.id}` : '';
                              const reporteUrl = `${effectiveBasePath}/evaluacion/reporte-docente-individual?idDocente=${docenteDni}&idEvaluacion=${idEvaluacion}${sessionParam}`;

                              return (
                                <tr key={docente.id || docenteDni || idx} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-400">
                                    {idx + 1}
                                  </td>

                                  <td className="px-4 py-3">
                                    <span className="text-xs font-bold text-slate-800 block">
                                      {docente.nombres} {docente.apellidos}
                                    </span>
                                    <span className="text-[11px] text-slate-500">DNI: {docenteDni}</span>
                                  </td>

                                  <td className="px-4 py-3">
                                    <span className="text-xs text-slate-600 block">
                                      {docente.caracteristicaCurricular || docente.cargo || 'Docente de Aula'}
                                    </span>
                                    {docente.celular && (
                                      <span className="text-[11px] text-slate-400">Cel: {docente.celular}</span>
                                    )}
                                  </td>

                                  <td className="px-4 py-3 text-center whitespace-nowrap">
                                    <span className="text-xs font-medium text-slate-700 block">
                                      {docente.fechaMonitoreo || 'Sin fecha'}
                                    </span>
                                    {docente.faseNombre && (
                                      <span className="inline-block mt-0.5 px-2 py-0.2 text-[9px] font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                                        {docente.faseNombre}
                                      </span>
                                    )}
                                  </td>

                                  <td className="px-4 py-3 whitespace-nowrap text-center">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <MdCheckCircle className="text-emerald-600 text-xs" />
                                      {docente.calificacion || 0} pts
                                    </span>
                                  </td>

                                  <td className="px-4 py-3 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <Link
                                        href={evalUrl}
                                        className="px-2.5 py-1 text-xs font-bold rounded-lg transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                                      >
                                        Reevaluar
                                      </Link>

                                      <Link
                                        href={reporteUrl}
                                        className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                                      >
                                        Reporte
                                      </Link>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            /* VISTA DE LISTA GENERAL CONTINUA */
            <div className="overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="w-16 px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      #
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Docente
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Institución Educativa
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Fecha / Etapa
                    </th>
                    <th scope="col" className="w-40 px-6 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Resultado
                    </th>
                    <th scope="col" className="w-48 px-6 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {evaluadosFiltrados.map((docente, index) => {
                    const docenteDni = docente.dni || docente.docenteDni || docente.evaluadoDni || '';
                    const evalUrl = `${effectiveBasePath}/evaluacion/evaluar-docente?id=${idEvaluacion}&idDocente=${docenteDni}`;
                    const sessionParam = docente.id ? `&sessionId=${docente.id}` : '';
                    const reporteUrl = `${effectiveBasePath}/evaluacion/reporte-docente-individual?idDocente=${docenteDni}&idEvaluacion=${idEvaluacion}${sessionParam}`;

                    return (
                      <tr key={docente.id || docenteDni || index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-400">
                          {index + 1}
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-800 block">
                            {docente.nombres} {docente.apellidos}
                          </span>
                          <span className="text-xs text-slate-500">DNI: {docenteDni}</span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-slate-700 block">
                            {docente.institucion ? `I.E. ${docente.institucion}` : 'I.E. No especificada'}
                          </span>
                          {docente.dniDirector && (
                            <span className="text-[11px] text-slate-400 block">
                              Director DNI: {docente.dniDirector}
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-xs font-medium text-slate-700 block">
                            {docente.fechaMonitoreo || 'Sin fecha'}
                          </span>
                          {docente.faseNombre && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                              {docente.faseNombre}
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <MdCheckCircle className="text-emerald-600" />
                            {docente.calificacion || 0} pts
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={evalUrl}
                              className="px-3 py-1 text-xs font-bold rounded-lg transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                            >
                              Reevaluar
                            </Link>

                            <Link
                              href={reporteUrl}
                              className="px-3 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Reporte
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* PESTAÑA 2: PADRÓN DE DOCENTES POR UGEL */}
      <div className={activeTab === 'padron' ? 'space-y-4' : 'hidden'}>
        <PadronDocentesUgelTab
          idEvaluacion={idEvaluacion}
          effectiveBasePath={effectiveBasePath}
          evaluatedDnisSet={evaluatedDnisSet}
          isAdmin={isAdmin}
          currentUserRegion={userRegion}
          selectedUgel={selectedPadronUgel}
          onSelectedUgelChange={isAdmin ? setSelectedPadronUgel : undefined}
          cacheDocentesPorUgel={cacheDocentesPorUgel}
          onCacheChange={setCacheDocentesPorUgel}
          buscarUsuario={buscarUsuario}
        />
      </div>

      {/* PESTAÑA 3: ESTRUCTURA DE RÚBRICAS (DOMINIOS Y CRITERIOS) */}
      <div className={activeTab === 'rubrica' ? 'block' : 'hidden'}>
        <div className="space-y-6">
          {/* Header de la sección de Rúbricas con acciones */}
          <RubricaSectionHeader
            titulo="Criterios de la Ficha"
            subtitulo={
              isAdmin
                ? 'Organiza las dimensiones pedagógicas y los criterios de evaluación.'
                : 'Rúbrica oficial establecida por la UGEL para el monitoreo pedagógico docente.'
            }
            isAdmin={isAdmin}
            hasItems={currentDimensiones.length > 0}
            onExpandAll={expandAllDominios}
            onCollapseAll={collapseAllDominios}
            onAgregarDominio={() => {
              if (verificarSiActivoParaModificar('editar')) return;
              setShowAgregarDim(true);
            }}
            onAgregarCriterio={() => {
              if (verificarSiActivoParaModificar('editar')) return;
              setShowAgregarPregunta(true);
            }}
          />

          {/* Listado de Dominios y Criterios */}
          {currentDimensiones.length === 0 && currentPreguntas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <MdAssignment className="text-2xl" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 mb-1">Sin criterios registrados</h4>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                Esta evaluación aún no tiene dominios ni criterios configurados en su rúbrica.
              </p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    if (verificarSiActivoParaModificar('editar')) return;
                    setShowAgregarPregunta(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all cursor-pointer"
                >
                  <MdAddCircle className="text-base" />
                  <span>Crear Primer Criterio</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Dominios con Acordeón Inteligente */}
              {currentDimensiones.map((dim, dimIdx) => {
                const preguntasDeDim = currentPreguntas.filter(
                  (p) => String(p.dimensionId || (p as any).dimencionId) === String(dim.id)
                );
                const isDimExpanded = Boolean(dim.id && expandedDominios.has(dim.id));

                return (
                  <div
                    key={dim.id || dimIdx}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
                  >
                    {/* Header del Dominio (Click para abrir/cerrar acordeón) */}
                    <div
                      onClick={() => dim.id && toggleDominio(dim.id)}
                      className="bg-gradient-to-r from-slate-50 to-white px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/60 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {dimIdx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800 truncate">
                          {dim.nombre || (dim as any).dimension}
                        </h4>
                        <span className="text-xs text-slate-500 shrink-0">
                          ({preguntasDeDim.length} criterios)
                        </span>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              if (verificarSiActivoParaModificar('editar')) return;
                              setDimToUpdate(dim);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Editar dominio"
                          >
                            <MdEdit className="text-base" />
                          </button>
                          <button
                            type="button"
                            disabled={isDeletingDimension === dim.id}
                            onClick={() => handleDeleteDim(dim.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                            title="Eliminar dominio"
                          >
                            {isDeletingDimension === dim.id ? (
                              <RiLoader4Line className="text-base animate-spin text-rose-600" />
                            ) : (
                              <MdDelete className="text-base" />
                            )}
                          </button>
                        </div>
                      )}
                      <div className="flex items-center pl-2 text-slate-400">
                        <MdExpandMore
                          className={`text-xl transition-transform duration-200 ${
                            isDimExpanded ? 'rotate-180 text-blue-600' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Contenido Acordeón de Criterios del Dominio */}
                    {isDimExpanded && (
                      <div className="p-4 sm:p-5">
                        {preguntasDeDim.length === 0 ? (
                          <p className="text-xs text-slate-400 italic text-center py-4">
                            No hay criterios asignados a este dominio.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {preguntasDeDim.map((preg, pIdx) => (
                              <div
                                key={preg.id || pIdx}
                                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-slate-500">
                                        Criterio {pIdx + 1}
                                      </span>
                                      {(preg as any).puntaje !== undefined && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                          Puntaje: {(preg as any).puntaje}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                                      {preg.criterio || (preg as any).pregunta}
                                    </p>
                                    {(preg as any).descripcion && (
                                      <p className="text-xs text-slate-500 leading-relaxed">
                                        {(preg as any).descripcion}
                                      </p>
                                    )}
                                  </div>

                                  {isAdmin && (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (verificarSiActivoParaModificar('editar')) return;
                                          setPreguntaToUpdate(preg);
                                        }}
                                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                                        title="Editar criterio"
                                      >
                                        <MdEdit className="text-base" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isDeletingPregunta === preg.id}
                                        onClick={() => handleDeletePreg(preg.id)}
                                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                                        title="Eliminar criterio"
                                      >
                                        {isDeletingPregunta === preg.id ? (
                                          <RiLoader4Line className="text-base animate-spin text-rose-600" />
                                        ) : (
                                          <MdDelete className="text-base" />
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Criterios sin Dominio asignado */}
              {(() => {
                const sinDominio = currentPreguntas.filter((p) => !p.dimensionId && !(p as any).dimencionId);
                if (sinDominio.length === 0) return null;

                return (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                        <h4 className="text-sm font-bold text-slate-700">
                          Criterios Generales (Sin Dominio)
                        </h4>
                        <span className="text-xs text-slate-400">({sinDominio.length})</span>
                      </div>
                    </div>
                    <div className="p-4 sm:p-5 space-y-3">
                      {sinDominio.map((preg, pIdx) => (
                        <div
                          key={preg.id || pIdx}
                          className="p-4 rounded-xl border border-slate-100 bg-slate-50/50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <span className="text-xs font-bold text-slate-500">
                                Criterio {pIdx + 1}
                              </span>
                              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                                {preg.criterio || (preg as any).pregunta}
                              </p>
                            </div>
                            {isAdmin && (
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (verificarSiActivoParaModificar('editar')) return;
                                    setPreguntaToUpdate(preg);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                                >
                                  <MdEdit className="text-base" />
                                </button>
                                <button
                                  type="button"
                                  disabled={isDeletingPregunta === preg.id}
                                  onClick={() => handleDeletePreg(preg.id)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {isDeletingPregunta === preg.id ? (
                                    <RiLoader4Line className="text-base animate-spin text-rose-600" />
                                  ) : (
                                    <MdDelete className="text-base" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvaluacionDetalleDocenteContainer;
