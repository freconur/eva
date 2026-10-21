import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  MdAssignment,
  MdAssignmentTurnedIn,
  MdCheckCircle,
  MdSearch,
  MdAddCircle,
  MdEdit,
  MdDelete,
  MdBarChart,
  MdFilePresent,
  MdLocationOn,
  MdSchool,
  MdExpandMore,
  MdViewAgenda,
  MdViewList,
} from 'react-icons/md';
import {
  RiLoader4Line,
  RiTeamLine,
  RiTimeLine,
  RiPieChartLine,
  RiShieldCheckLine,
  RiLockLine,
  RiBookOpenLine,
} from 'react-icons/ri';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import useEvaluacionDesempenoBase from '@/features/hooks/useEvaluacionDesempenoBase';
import {
  DimensionEspecialista,
  PRDocentes,
  User,
} from '@/features/types/types';
import EvaluacionConfigMenu from './EvaluacionConfigMenu';
import EvaluacionDetalleHeroBanner, { HeroBannerMetricItem } from './EvaluacionDetalleHeroBanner';
import PadronDirectoresUgelTab from './PadronDirectoresUgelTab';
import {
  ModalAgregarDimension,
  ModalUpdateDimension,
  ModalAgregarPregunta,
  ModalUpdatePregunta,
} from '../modals';
import { regiones, regionTexto } from '@/fuctions/regiones';

export interface EvaluacionDetalleDirectorContainerProps {
  id: string;
  role: 'admin' | 'especialista';
  basePath?: string;
}

export const EvaluacionDetalleDirectorContainer: React.FC<EvaluacionDetalleDirectorContainerProps> = ({
  id: idEvaluacion,
  role,
  basePath,
}) => {
  const effectiveBasePath =
    basePath ||
    (role === 'admin'
      ? '/admin/evaluaciones-directores'
      : '/especialistas/evaluaciones-director');

  const { currentUserData, dataEvaluacionDocente, loaderPages } = useGlobalContext();

  const isUserAdmin =
    role === 'admin' ||
    currentUserData?.rol === 4 ||
    currentUserData?.rol === 0 ||
    currentUserData?.rol === 5 ||
    currentUserData?.perfil?.rol === 4 ||
    currentUserData?.perfil?.rol === 0 ||
    currentUserData?.perfil?.rol === 5 ||
    Number(currentUserData?.rol) === 4 ||
    Number(currentUserData?.rol) === 0 ||
    Number(currentUserData?.rol) === 5;

  const rawUserRegion = currentUserData?.region ?? (currentUserData as any)?.perfil?.region;
  const userRegion =
    rawUserRegion !== undefined && rawUserRegion !== null && rawUserRegion !== '' && !isNaN(Number(rawUserRegion))
      ? Number(rawUserRegion)
      : undefined;

  const [selectedRegion, setSelectedRegion] = useState<string>(
    isUserAdmin ? 'all' : userRegion !== undefined ? String(userRegion) : 'all'
  );

  const {
    getDataEvaluacion,
    getDimensiones,
    getPreguntasRespuestas,
    getEvaluados,
    deleteDimension,
    deletePreguntaRespuesta,
    buscarUsuario,
  } = useEvaluacionDesempenoBase({
    role,
    collectionName: 'evaluaciones-director',
    scopeKey: 'region',
    scopeValue: isUserAdmin ? undefined : userRegion,
  });

  const [activeTab, setActiveTab] = useState<'monitoreos' | 'padron' | 'rubrica'>('monitoreos');
  const [searchDirector, setSearchDirector] = useState<string>('');
  const [expandedDominios, setExpandedDominios] = useState<Set<string>>(new Set());

  // Estado persistente del Padrón de Directores por UGEL para mantener los directores al cambiar de pestaña
  const [selectedPadronUgel, setSelectedPadronUgel] = useState<number | ''>(() => {
    if (!isUserAdmin && userRegion !== undefined) {
      return userRegion;
    }
    return '';
  });

  // Sincronizar automáticamente la UGEL del especialista cuando se cargue currentUserData
  useEffect(() => {
    if (!isUserAdmin && userRegion !== undefined) {
      if (selectedPadronUgel !== userRegion) {
        setSelectedPadronUgel(userRegion);
      }
    }
  }, [isUserAdmin, userRegion, selectedPadronUgel]);

  const [cacheDirectoresPorUgel, setCacheDirectoresPorUgel] = useState<Record<number, User[]>>({});

  // Estados de Modales
  const [showAgregarDim, setShowAgregarDim] = useState<boolean>(false);
  const [dimToUpdate, setDimToUpdate] = useState<DimensionEspecialista | null>(null);
  const [showAgregarPregunta, setShowAgregarPregunta] = useState<boolean>(false);
  const [preguntaToUpdate, setPreguntaToUpdate] = useState<PRDocentes | null>(null);
  const [isDeletingPregunta, setIsDeletingPregunta] = useState<string | null>(null);
  const [isDeletingDimension, setIsDeletingDimension] = useState<string | null>(null);

  // 1. Suscripción a datos en tiempo real de la evaluación
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

  // Evaluaciones de directores realizadas exclusivamente por el monitor autenticado
  const currentEvaluados = useMemo(() => {
    if (!rawEvaluados || rawEvaluados.length === 0) return [];
    if (!currentUserData) return [];

    const userDni = String(
      currentUserData.dni ?? (currentUserData as any)?.perfil?.dni ?? (currentUserData as any)?.id ?? ''
    ).trim();
    const userEmail = String(currentUserData.email || '').trim().toLowerCase();
    const userId = String(currentUserData.id || '').trim();

    if (!userDni && !userEmail && !userId) return [];

    return rawEvaluados.filter((ev) => {
      const evaluadoDni = String(
        ev.dni ||
        ev.directorDni ||
        ev.evaluadoDni ||
        ev.dniDirector ||
        ev.datosDirector?.dni ||
        ''
      ).trim();

      // Recopilar posibles identificadores del monitor que realizó la evaluación
      const possibleMonitorDnis = [
        ev.evaluadorDni,
        ev.adminDni,
        ev.monitorDni,
        ev.dniMonitor,
        ev.datosMonitor?.dni,
        ev.datosMonitor?.id,
      ]
        .map((d) => (d ? String(d).trim() : ''))
        .filter(Boolean);

      // Si especialistaDni existe y no coincide con el DNI del evaluado, es el monitor
      if (ev.especialistaDni) {
        const espDni = String(ev.especialistaDni).trim();
        if (espDni && espDni !== evaluadoDni) {
          possibleMonitorDnis.push(espDni);
        }
      }

      // 1. Coincidencia por DNI
      if (userDni && possibleMonitorDnis.some((d) => d === userDni)) {
        return true;
      }

      // 2. Coincidencia por Email
      if (userEmail) {
        const monitorEmails = [
          ev.datosMonitor?.email,
          ev.evaluadorEmail,
          ev.monitorEmail,
          ev.adminEmail,
          ev.especialistaEmail,
        ]
          .map((e) => (e ? String(e).trim().toLowerCase() : ''))
          .filter(Boolean);

        if (monitorEmails.some((e) => e === userEmail)) {
          return true;
        }
      }

      // 3. Coincidencia por ID de usuario
      if (userId) {
        if (
          ev.datosMonitor?.id === userId ||
          ev.evaluadorId === userId ||
          ev.monitorId === userId
        ) {
          return true;
        }
      }

      return false;
    });
  }, [rawEvaluados, currentUserData]);

  const totalEvaluados = currentEvaluados.length;

  // Conjunto de DNIs que ya han sido evaluados en esta evaluación por este monitor
  const evaluatedDnisSet = useMemo(() => {
    const set = new Set<string>();
    currentEvaluados.forEach((item: any) => {
      const dni = String(
        item.dni ||
        item.dniDirector ||
        item.directorDni ||
        item.evaluadoDni ||
        item.datosDirector?.dni ||
        ''
      ).trim();
      if (dni) set.add(dni);
    });
    return set;
  }, [currentEvaluados]);

  // Filtro de búsqueda y región sobre los directores monitoreados
  const evaluadosFiltrados = useMemo(() => {
    let result = currentEvaluados;

    // Filtro de UGEL para Admin
    if (isUserAdmin && selectedRegion !== 'all') {
      result = result.filter((item: any) => String(item.region) === String(selectedRegion));
    }

    // Filtro de búsqueda por texto
    if (!searchDirector.trim()) return result;
    const term = searchDirector.toLowerCase().trim();

    return result.filter((item: any) => {
      const nombres = (item.nombres || item.nombreDirector || item.datosDirector?.nombres || '').toLowerCase();
      const apellidos = (item.apellidos || item.apellidoDirector || item.datosDirector?.apellidos || '').toLowerCase();
      const fullName = `${nombres} ${apellidos}`.toLowerCase();
      const invFullName = `${apellidos} ${nombres}`.toLowerCase();
      const dni = String(item.dni || item.dniDirector || item.directorDni || item.evaluadoDni || item.datosDirector?.dni || '').toLowerCase();
      const institucion = (item.institucion || item.datosDirector?.institucion || '').toLowerCase();
      const distrito = (item.distrito || item.datosDirector?.distrito || '').toLowerCase();

      return (
        nombres.includes(term) ||
        apellidos.includes(term) ||
        fullName.includes(term) ||
        invFullName.includes(term) ||
        dni.includes(term) ||
        institucion.includes(term) ||
        distrito.includes(term)
      );
    });
  }, [currentEvaluados, isUserAdmin, selectedRegion, searchDirector]);

  // Estado para alternar entre vista por UGEL (acordeón) y lista general
  const [modoVista, setModoVista] = useState<'ugel' | 'lista'>('ugel');
  const [expandedUgels, setExpandedUgels] = useState<Set<string>>(new Set());

  // Agrupación organizada de directores monitoreados por UGEL
  const gruposPorUgel = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        regionId: number | string;
        nombreUgel: string;
        directores: (User & { [key: string]: any })[];
        promedio: number;
      }
    >();

    evaluadosFiltrados.forEach((director: any) => {
      const rawReg = director.region !== undefined && director.region !== null ? director.region : 'SIN_UGEL';
      const key = String(rawReg);
      const regText = regionTexto(rawReg);
      const nombreUgel = regText
        ? regText.startsWith('UGEL')
          ? regText
          : `UGEL ${regText}`
        : rawReg !== 'SIN_UGEL'
        ? `UGEL ${rawReg}`
        : 'UGEL No Asignada';

      if (!map.has(key)) {
        map.set(key, {
          key,
          regionId: rawReg,
          nombreUgel,
          directores: [],
          promedio: 0,
        });
      }

      const item = map.get(key)!;
      item.directores.push(director);
    });

    const list = Array.from(map.values()).map((grupo) => {
      const calificados = grupo.directores.filter(
        (d) => d.calificacion !== undefined && d.calificacion !== null && !isNaN(Number(d.calificacion))
      );
      const suma = calificados.reduce((acc, d) => acc + Number(d.calificacion), 0);
      const promedio = calificados.length > 0 ? Math.round((suma / calificados.length) * 10) / 10 : 0;
      return {
        ...grupo,
        promedio,
      };
    });

    return list.sort((a, b) => a.nombreUgel.localeCompare(b.nombreUgel, 'es', { sensitivity: 'base' }));
  }, [evaluadosFiltrados]);

  // Expandir todas las UGELs inicialmente o cuando cambien los datos
  useEffect(() => {
    if (gruposPorUgel.length > 0) {
      setExpandedUgels((prev) => {
        if (prev.size === 0) {
          return new Set(gruposPorUgel.map((g) => g.key));
        }
        return prev;
      });
    }
  }, [gruposPorUgel]);

  const toggleUgel = (key: string) => {
    setExpandedUgels((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const expandAllUgels = () => {
    setExpandedUgels(new Set(gruposPorUgel.map((g) => g.key)));
  };

  const collapseAllUgels = () => {
    setExpandedUgels(new Set());
  };

  // Métricas para el Hero Banner
  const metricasDirector = useMemo<HeroBannerMetricItem[]>(
    () => [
      {
        id: 'monitoreos',
        label: 'Monitoreos Realizados',
        value: totalEvaluados,
        icon: MdAssignmentTurnedIn,
        badgeText: 'Concluidos',
        helperText: 'Evaluaciones registradas',
        colorTheme: 'emerald' as const,
        active: activeTab === 'monitoreos',
        onClick: () => setActiveTab('monitoreos'),
      },
      {
        id: 'padron',
        label: 'Padrón UGEL',
        value: 'Consultar',
        icon: RiTeamLine,
        badgeText: 'Padrón',
        helperText: 'Directores por UGEL',
        colorTheme: 'blue' as const,
        active: activeTab === 'padron',
        onClick: () => setActiveTab('padron'),
      },
      {
        id: 'criterios',
        label: 'Criterios Pedagógicos',
        value: currentPreguntas.length,
        icon: RiBookOpenLine,
        badgeText: 'Rúbrica',
        helperText: 'Criterios de evaluación',
        colorTheme: 'amber' as const,
        active: activeTab === 'rubrica',
        onClick: () => setActiveTab('rubrica'),
      },
    ],
    [totalEvaluados, currentPreguntas.length, activeTab]
  );

  const toggleDominio = (dimId: string) => {
    setExpandedDominios((prev) => {
      const next = new Set(prev);
      if (next.has(dimId)) {
        next.delete(dimId);
      } else {
        next.add(dimId);
      }
      return next;
    });
  };

  const expandAllDominios = () => {
    setExpandedDominios(new Set(currentDimensiones.map((d) => d.id).filter(Boolean) as string[]));
  };

  const collapseAllDominios = () => {
    setExpandedDominios(new Set());
  };

  const [isDeletingHuerfanos, setIsDeletingHuerfanos] = useState<boolean>(false);

  const handleDeleteDim = async (dimId?: string) => {
    if (!dimId || !idEvaluacion) return;

    const dim = currentDimensiones.find((d) => String(d.id) === String(dimId));
    const preguntasDeDim = currentPreguntas.filter(
      (p) => String(p.dimensionId || (p as any).dimencionId) === String(dimId)
    );

    const mensaje =
      preguntasDeDim.length > 0
        ? `¿Está seguro de eliminar el dominio "${dim?.nombre || 'seleccionado'}"?\n\nAdvertencia: Contiene ${preguntasDeDim.length} ${
            preguntasDeDim.length === 1 ? 'criterio pedagógico' : 'criterios pedagógicos'
          } que también se ${
            preguntasDeDim.length === 1 ? 'eliminará' : 'eliminarán'
          } definitivamente de la evaluación.`
        : `¿Está seguro de eliminar el dominio "${dim?.nombre || 'seleccionado'}"?`;

    if (window.confirm(mensaje)) {
      try {
        setIsDeletingDimension(dimId);
        await deleteDimension(idEvaluacion, dimId, true);
      } catch (err) {
        console.error('Error al eliminar dominio:', err);
        alert('Hubo un error al eliminar el dominio pedagógico. Intente nuevamente.');
      } finally {
        setIsDeletingDimension(null);
      }
    }
  };

  const handleDeleteCriteriosSinDominio = async (sinDominio: PRDocentes[]) => {
    if (!idEvaluacion || sinDominio.length === 0) return;
    if (
      window.confirm(
        `¿Está seguro de eliminar los ${sinDominio.length} criterios sin dominio asignado? Esta acción los borrará definitivamente de la evaluación.`
      )
    ) {
      try {
        setIsDeletingHuerfanos(true);
        await Promise.all(
          sinDominio.map((p) => p.id && deletePreguntaRespuesta(idEvaluacion, p.id))
        );
      } catch (err) {
        console.error('Error al purgar criterios huérfanos:', err);
        alert('Hubo un error al eliminar los criterios sin dominio. Intente nuevamente.');
      } finally {
        setIsDeletingHuerfanos(false);
      }
    }
  };

  const handleDeletePreg = async (prId?: string) => {
    if (!prId || !idEvaluacion) return;
    if (window.confirm('¿Está seguro de eliminar este criterio pedagógico?')) {
      try {
        setIsDeletingPregunta(prId);
        await deletePreguntaRespuesta(idEvaluacion, prId);
      } catch (err) {
        console.error('Error al eliminar criterio:', err);
        alert('Hubo un error al eliminar el criterio pedagógico. Intente nuevamente.');
      } finally {
        setIsDeletingPregunta(null);
      }
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Modales de Configuración Rúbrica */}
      {showAgregarDim && (
        <ModalAgregarDimension
          idEvaluacion={idEvaluacion}
          collectionName="evaluaciones-director"
          onClose={() => setShowAgregarDim(false)}
        />
      )}

      {dimToUpdate && (
        <ModalUpdateDimension
          idEvaluacion={idEvaluacion}
          collectionName="evaluaciones-director"
          dimensionUpdate={dimToUpdate}
          onClose={() => setDimToUpdate(null)}
        />
      )}

      {showAgregarPregunta && (
        <ModalAgregarPregunta
          idEvaluacion={idEvaluacion}
          collectionName="evaluaciones-director"
          dimensiones={currentDimensiones}
          escala={dataEvaluacionDocente?.escala}
          onClose={() => setShowAgregarPregunta(false)}
        />
      )}

      {preguntaToUpdate && (
        <ModalUpdatePregunta
          idEvaluacion={idEvaluacion}
          collectionName="evaluaciones-director"
          dataUpdate={preguntaToUpdate}
          dimensiones={currentDimensiones}
          escala={dataEvaluacionDocente?.escala}
          onClose={() => setPreguntaToUpdate(null)}
        />
      )}

      {/* Banner de protección cuando la evaluación está activa */}
      {dataEvaluacionDocente?.active && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <RiLockLine className="text-xl" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Evaluación en Curso (Modo Protegido)
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                La evaluación se encuentra activa. Para salvaguardar la integridad de las
                calificaciones, la edición y eliminación de dominios y criterios se encuentran
                deshabilitadas.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-800">
            Bloqueado
          </span>
        </div>
      )}

      {/* Hero Banner Moderno con Métricas */}
      <EvaluacionDetalleHeroBanner
        idEvaluacion={idEvaluacion}
        collectionName="evaluaciones-director"
        backHref={effectiveBasePath}
        selectedYear={2026}
        institucion={currentUserData?.institucion || (isUserAdmin ? 'DRE / UGEL' : 'UGEL')}
        faseNombre={dataEvaluacionDocente?.faseNombre}
        categoria={dataEvaluacionDocente?.categoria || 'GESTIÓN Y LIDERAZGO DIRECTIVO'}
        title={dataEvaluacionDocente?.name || 'EVALUACIÓN DEL DESEMPEÑO DIRECTIVO'}
        descripcion={
          dataEvaluacionDocente?.descripcion ||
          'Supervisión y acompañamiento pedagógico al desempeño directivo'
        }
        metricas={metricasDirector}
        backgroundImage={dataEvaluacionDocente?.backgroundImage}
        backgroundImageOpacity={dataEvaluacionDocente?.backgroundImageOpacity ?? 0.25}
        isAdmin={isUserAdmin}
        canEditTitleDescription={isUserAdmin}
        storageKey={`eva_eval_director_${role}_banner_variant`}
        actions={
          isUserAdmin ? (
            <div className="flex items-center gap-2 flex-wrap">
              <EvaluacionConfigMenu
                idEvaluacion={idEvaluacion}
                collectionName="evaluaciones-director"
                dimensiones={currentDimensiones}
                preguntas={currentPreguntas}
                escala={dataEvaluacionDocente?.escala}
                niveles={dataEvaluacionDocente?.niveles || (dataEvaluacionDocente as any)?.nivelYPuntaje}
                activarEvidencias={dataEvaluacionDocente?.activarEvidencias}
                titulo={dataEvaluacionDocente?.name}
                descripcion={dataEvaluacionDocente?.descripcion}
              />
            </div>
          ) : undefined
        }
      />

      {/* Navegación por Pestañas (3 Pestañas Modernas) */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('monitoreos')}
          className={`flex items-center gap-2 py-3 px-6 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'monitoreos'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MdAssignmentTurnedIn className="text-lg" />
          <span>Monitoreos Realizados ({totalEvaluados})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('padron')}
          className={`flex items-center gap-2 py-3 px-6 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'padron'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RiTeamLine className="text-lg" />
          <span>Padrón de Directores por UGEL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rubrica')}
          className={`flex items-center gap-2 py-3 px-6 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'rubrica'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MdAssignment className="text-lg" />
          <span>Estructura de Rúbricas ({currentPreguntas.length} Criterios)</span>
        </button>
      </div>

      {/* PESTAÑA 1: MONITOREOS REALIZADOS */}
      <div className={activeTab === 'monitoreos' ? 'space-y-4' : 'hidden'}>
        {/* Barra de Búsqueda, Filtro UGEL, Switcher de Vista y Acción + Monitorear */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 flex-1 bg-transparent">
            <MdSearch className="text-xl text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por director, DNI o institución educativa..."
              value={searchDirector}
              onChange={(e) => setSearchDirector(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
            />
            {searchDirector && (
              <button
                type="button"
                onClick={() => setSearchDirector('')}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded bg-slate-100 transition-colors cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:border-t lg:border-t-0 lg:border-l border-slate-200 pt-2 lg:pt-0 lg:pl-4">
            {/* Selector de UGEL para Administradores */}
            {isUserAdmin && (
              <div className="flex items-center gap-1.5">
                <MdLocationOn className="text-slate-400 text-base" />
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas las UGEL</option>
                  {regiones.map((reg) => (
                    <option key={reg.id} value={String(reg.id)}>
                      {reg.region}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selector de Vista: Por UGEL vs Lista General */}
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setModoVista('ugel')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  modoVista === 'ugel'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Organizado en acordeones por UGEL"
              >
                <MdViewAgenda className="text-sm" />
                <span>Por UGEL</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
                  {gruposPorUgel.length}
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
                title="Lista general de directores monitoreados"
              >
                <MdViewList className="text-sm" />
                <span>Lista General</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 text-slate-700 font-bold">
                  {evaluadosFiltrados.length}
                </span>
              </button>
            </div>

            {/* Botón Resultados y Analíticas */}
            <Link
              href={`${effectiveBasePath}/evaluacion/${idEvaluacion}/evaluados`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
              title="Ver panel general de directores evaluados y analíticas"
            >
              <MdBarChart className="text-base text-purple-600" />
              <span>Resultados</span>
            </Link>

            {/* Botón Acción + Monitorear */}
            <Link
              href={`${effectiveBasePath}/evaluacion/evaluar-director?idEvaluacion=${idEvaluacion}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
            >
              <MdAddCircle className="text-base" />
              <span>+ Monitorear</span>
            </Link>
          </div>
        </div>

        {/* Estado de Carga o Tabla */}
        {loaderPages ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
            <RiLoader4Line className="w-10 h-10 animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-medium text-slate-500">Cargando monitoreos registrados...</p>
          </div>
        ) : evaluadosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-slate-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <RiShieldCheckLine className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              {searchDirector || selectedRegion !== 'all'
                ? 'No se encontraron directores evaluados con los filtros aplicados'
                : 'Aún no hay monitoreos registrados en esta evaluación'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mb-4">
              {searchDirector || selectedRegion !== 'all'
                ? 'Prueba modificando el término de búsqueda o cambiando el filtro de UGEL.'
                : 'Comienza evaluando a los directivos en la pestaña "Padrón de Directores por UGEL" o haz clic en "+ Monitorear".'}
            </p>
            <Link
              href={`${effectiveBasePath}/evaluacion/evaluar-director?idEvaluacion=${idEvaluacion}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <MdAddCircle className="text-base" />
              <span>Iniciar Primer Monitoreo</span>
            </Link>
          </div>
        ) : modoVista === 'ugel' ? (
          /* VISTA ORGANIZADA POR ACORDEONES DE UGEL */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                Mostrando <strong className="text-slate-700">{gruposPorUgel.length}</strong> UGELs (
                {evaluadosFiltrados.length} monitoreos en total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={expandAllUgels}
                  className="hover:text-blue-600 font-semibold cursor-pointer transition-colors"
                >
                  Expandir todos
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={collapseAllUgels}
                  className="hover:text-blue-600 font-semibold cursor-pointer transition-colors"
                >
                  Contraer todos
                </button>
              </div>
            </div>

            {gruposPorUgel.map((grupo) => {
              const isExpanded = expandedUgels.has(grupo.key);

              return (
                <div
                  key={grupo.key}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
                >
                  {/* Header de la UGEL */}
                  <div
                    onClick={() => toggleUgel(grupo.key)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-gradient-to-r from-slate-50/60 to-white hover:from-blue-50/30 hover:to-white transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs font-bold">
                        <MdSchool className="text-xl" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-slate-800">
                            {grupo.nombreUgel}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200/60">
                            {grupo.directores.length}{' '}
                            {grupo.directores.length === 1 ? 'director evaluado' : 'directores evaluados'}
                          </span>
                          {grupo.promedio > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60">
                              Promedio: {grupo.promedio} pts
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Monitoreos realizados en directivos de esta jurisdicción
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`${effectiveBasePath}/evaluacion/${idEvaluacion}/evaluados${
                          grupo.key && grupo.key !== 'SIN_UGEL'
                            ? `?region=${encodeURIComponent(grupo.key)}`
                            : ''
                        }`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                        title={`Ver resultados y analíticas de ${grupo.nombreUgel}`}
                      >
                        <MdBarChart className="text-sm text-purple-600" />
                        <span>Resultados</span>
                      </Link>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleUgel(grupo.key);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title={isExpanded ? 'Contraer UGEL' : 'Expandir UGEL'}
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

                  {/* Tabla de Directores de la UGEL */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50/70 text-slate-500 uppercase text-[11px] tracking-wider">
                          <tr>
                            <th className="py-2.5 px-4 text-left w-12">#</th>
                            <th className="py-2.5 px-4 text-left">Director</th>
                            <th className="py-2.5 px-4 text-left">DNI</th>
                            <th className="py-2.5 px-4 text-left">Institución Educativa</th>
                            <th className="py-2.5 px-4 text-center">Fecha</th>
                            <th className="py-2.5 px-4 text-center">Calificación</th>
                            <th className="py-2.5 px-4 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {grupo.directores.map((item: any, idx: number) => {
                            const directorDni = String(
                              item.dni || item.dniDirector || item.directorDni || item.evaluadoDni || item.datosDirector?.dni || ''
                            ).trim();
                            const directorNombre = item.apellidos || item.nombres
                              ? `${item.apellidos || ''} ${item.nombres || ''}`.trim().toUpperCase()
                              : item.datosDirector?.apellidos || item.datosDirector?.nombres
                              ? `${item.datosDirector?.apellidos || ''} ${item.datosDirector?.nombres || ''}`.trim().toUpperCase()
                              : (item.nombreDirector || 'DIRECTOR EVALUADO').toUpperCase();
                            const institucionNombre = item.institucion || item.datosDirector?.institucion
                              ? (String(item.institucion || item.datosDirector?.institucion).startsWith('I.E.')
                                  ? String(item.institucion || item.datosDirector?.institucion)
                                  : `I.E. ${item.institucion || item.datosDirector?.institucion}`)
                              : 'No especificada';
                            const evalUrl = `${effectiveBasePath}/evaluacion/evaluar-director?idEvaluacion=${idEvaluacion}&idDirector=${directorDni}`;
                            const reporteUrl = `${effectiveBasePath}/evaluacion/reporte-director-individual?idDirector=${directorDni}&idEvaluacion=${idEvaluacion}${item.id ? `&sessionId=${item.id}` : ''}`;

                            return (
                              <tr key={item.id || directorDni || idx} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-4 text-xs font-bold text-slate-400">{idx + 1}</td>
                                <td className="py-3 px-4 font-semibold text-slate-800">
                                  {directorNombre}
                                </td>
                                <td className="py-3 px-4 text-xs font-mono text-slate-600">{directorDni}</td>
                                <td className="py-3 px-4 text-xs text-slate-600">
                                  {institucionNombre}
                                </td>
                                <td className="py-3 px-4 text-center text-xs text-slate-500">
                                  {item.fechaMonitoreo || 'Sin registrar'}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {item.calificacion !== undefined ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                                      {item.calificacion} pts
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                                      Registrado
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <Link
                                      href={evalUrl}
                                      className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
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
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* VISTA PLANA / LISTA GENERAL */
          <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-xs">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="py-3 px-4 text-left">#</th>
                  <th className="py-3 px-4 text-left">Director</th>
                  <th className="py-3 px-4 text-left">DNI</th>
                  <th className="py-3 px-4 text-left">Institución Educativa</th>
                  <th className="py-3 px-4 text-left">UGEL</th>
                  <th className="py-3 px-4 text-center">Fecha</th>
                  <th className="py-3 px-4 text-center">Calificación</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {evaluadosFiltrados.map((item: any, idx: number) => {
                  const directorDni = String(
                    item.dni || item.dniDirector || item.directorDni || item.evaluadoDni || item.datosDirector?.dni || ''
                  ).trim();
                  const directorNombre = item.apellidos || item.nombres
                    ? `${item.apellidos || ''} ${item.nombres || ''}`.trim().toUpperCase()
                    : item.datosDirector?.apellidos || item.datosDirector?.nombres
                    ? `${item.datosDirector?.apellidos || ''} ${item.datosDirector?.nombres || ''}`.trim().toUpperCase()
                    : (item.nombreDirector || 'DIRECTOR EVALUADO').toUpperCase();
                  const institucionNombre = item.institucion || item.datosDirector?.institucion
                    ? (String(item.institucion || item.datosDirector?.institucion).startsWith('I.E.')
                        ? String(item.institucion || item.datosDirector?.institucion)
                        : `I.E. ${item.institucion || item.datosDirector?.institucion}`)
                    : 'No especificada';
                  const evalUrl = `${effectiveBasePath}/evaluacion/evaluar-director?idEvaluacion=${idEvaluacion}&idDirector=${directorDni}`;
                  const reporteUrl = `${effectiveBasePath}/evaluacion/reporte-director-individual?idDirector=${directorDni}&idEvaluacion=${idEvaluacion}${item.id ? `&sessionId=${item.id}` : ''}`;

                  return (
                    <tr key={item.id || directorDni || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-xs font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {directorNombre}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-600">{directorDni}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {institucionNombre}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {regionTexto(item.region) || (item.region ? `UGEL ${item.region}` : '-')}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-slate-500">
                        {item.fechaMonitoreo || 'Sin registrar'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.calificacion !== undefined ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                            {item.calificacion} pts
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                            Registrado
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={evalUrl}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
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
        )}
      </div>

      {/* PESTAÑA 2: PADRÓN DE DIRECTORES POR UGEL */}
      <div className={activeTab === 'padron' ? 'space-y-4' : 'hidden'}>
        <PadronDirectoresUgelTab
          idEvaluacion={idEvaluacion}
          effectiveBasePath={effectiveBasePath}
          evaluatedDnisSet={evaluatedDnisSet}
          isAdmin={isUserAdmin}
          currentUserRegion={userRegion}
          selectedUgel={selectedPadronUgel}
          onSelectedUgelChange={isUserAdmin ? setSelectedPadronUgel : undefined}
          cacheDirectoresPorUgel={cacheDirectoresPorUgel}
          onCacheChange={setCacheDirectoresPorUgel}
          buscarUsuario={buscarUsuario}
        />
      </div>

      {/* PESTAÑA 3: ESTRUCTURA DE RÚBRICAS (DOMINIOS Y CRITERIOS) */}
      <div className={activeTab === 'rubrica' ? 'space-y-4' : 'hidden'}>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Estructura Pedagógica de la Rúbrica</h3>
              <p className="text-xs text-slate-500">
                Dominios y criterios de evaluación configurados para el monitoreo directivo.
              </p>
            </div>

            {currentDimensiones.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={expandAllDominios}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                >
                  Expandir todos
                </button>
                <button
                  type="button"
                  onClick={collapseAllDominios}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                >
                  Contraer todos
                </button>
              </div>
            )}
          </div>

          {currentDimensiones.length === 0 && currentPreguntas.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <p className="text-base font-semibold text-slate-700">Sin criterios configurados</p>
              <p className="text-sm text-slate-400 mt-1">
                Añade dominios y criterios pedagógicos para estructurar la rúbrica de monitoreo directivo.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
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
                    <div
                      onClick={() => dim.id && toggleDominio(dim.id)}
                      className="bg-gradient-to-r from-slate-50 to-white px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/60 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {dimIdx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800 truncate">{dim.nombre}</h4>
                        <span className="text-xs text-slate-500 shrink-0">
                          ({preguntasDeDim.length} criterios)
                        </span>
                      </div>
                      {isUserAdmin && !dataEvaluacionDocente?.active && (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setDimToUpdate(dim)}
                            className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors cursor-pointer"
                            title="Editar dominio"
                          >
                            <MdEdit className="text-base" />
                          </button>
                          <button
                            type="button"
                            disabled={isDeletingDimension === dim.id}
                            onClick={() => handleDeleteDim(dim.id)}
                            className="p-1 text-slate-500 hover:text-rose-600 rounded transition-colors cursor-pointer disabled:opacity-50"
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
                    </div>

                    {isDimExpanded && (
                      <div className="p-4 sm:p-5 space-y-3">
                        {preguntasDeDim.length === 0 ? (
                          <p className="text-xs text-slate-400 italic p-3">
                            No hay criterios asignados a este dominio.
                          </p>
                        ) : (
                          preguntasDeDim.map((pr, pIdx) => (
                            <div
                              key={pr.id || pIdx}
                              className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-500">
                                      Criterio {pIdx + 1}
                                    </span>
                                    {pr.requiereEvidencia && (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                                        <MdFilePresent /> Requiere Evidencias
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                                    {pr.criterio}
                                  </p>
                                </div>

                                {isUserAdmin && !dataEvaluacionDocente?.active && (
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setPreguntaToUpdate(pr)}
                                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                                      title="Editar criterio"
                                    >
                                      <MdEdit className="text-base" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isDeletingPregunta === pr.id}
                                      onClick={() => handleDeletePreg(pr.id)}
                                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                                      title="Eliminar criterio"
                                    >
                                      {isDeletingPregunta === pr.id ? (
                                        <RiLoader4Line className="text-base animate-spin text-rose-600" />
                                      ) : (
                                        <MdDelete className="text-base" />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Criterios sin Dominio asignado */}
              {(() => {
                const dominiosIds = new Set(
                  currentDimensiones
                    .map((d) => (d.id ? String(d.id) : null))
                    .filter(Boolean) as string[]
                );
                const sinDominio = currentPreguntas.filter((p) => {
                  const pDimId = p.dimensionId || (p as any).dimencionId;
                  return !pDimId || !dominiosIds.has(String(pDimId));
                });
                if (sinDominio.length === 0) return null;

                return (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                        <h4 className="text-sm font-bold text-slate-700">
                          Criterios Generales (Sin Dominio Asignado)
                        </h4>
                        <span className="text-xs text-slate-400">({sinDominio.length} criterios)</span>
                      </div>

                      {isUserAdmin && !dataEvaluacionDocente?.active && (
                        <button
                          type="button"
                          disabled={isDeletingHuerfanos}
                          onClick={() => handleDeleteCriteriosSinDominio(sinDominio)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Eliminar todos los criterios sin dominio asignado"
                        >
                          {isDeletingHuerfanos ? (
                            <RiLoader4Line className="text-sm animate-spin text-rose-600" />
                          ) : (
                            <MdDelete className="text-sm text-rose-600" />
                          )}
                          <span>Eliminar {sinDominio.length} huérfanos</span>
                        </button>
                      )}
                    </div>
                    <div className="p-4 sm:p-5 space-y-3">
                      {sinDominio.map((pr, pIdx) => (
                        <div
                          key={pr.id || pIdx}
                          className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-500">
                                  Criterio {pIdx + 1}
                                </span>
                                {pr.requiereEvidencia && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                                    <MdFilePresent /> Requiere Evidencias
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                                {pr.criterio}
                              </p>
                            </div>

                            {isUserAdmin && !dataEvaluacionDocente?.active && (
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setPreguntaToUpdate(pr)}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="Editar criterio"
                                >
                                  <MdEdit className="text-base" />
                                </button>
                                <button
                                  type="button"
                                  disabled={isDeletingPregunta === pr.id}
                                  onClick={() => handleDeletePreg(pr.id)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                                  title="Eliminar criterio"
                                >
                                  {isDeletingPregunta === pr.id ? (
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

export default EvaluacionDetalleDirectorContainer;
