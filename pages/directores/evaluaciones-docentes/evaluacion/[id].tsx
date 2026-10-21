import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  MdPeople,
  MdAssignment,
  MdCheckCircle,
  MdPendingActions,
  MdSearch,
  MdAddCircle,
  MdEdit,
  MdDelete,
  MdBarChart,
  MdArrowBack,
  MdFilePresent,
  MdSchool,
  MdExpandMore,
  MdViewAgenda,
  MdViewList,
  MdWarning,
} from 'react-icons/md';
import {
  RiLoader4Line,
  RiTeamLine,
  RiTimeLine,
  RiPieChartLine,
  RiShieldCheckLine,
} from 'react-icons/ri';
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import useEvaluacionDesempenoBase from '@/features/hooks/useEvaluacionDesempenoBase';
import {
  DimensionEspecialista,
  PRDocentes,
  User,
} from '@/features/types/types';
import {
  EvaluacionConfigMenu,
  EvaluacionDetalleHeroBanner,
  HeroBannerMetricItem,
} from '@/components/evaluaciones-desempeno/containers';
import {
  ModalAgregarDimension,
  ModalUpdateDimension,
  ModalAgregarPregunta,
  ModalUpdatePregunta,
} from '@/components/evaluaciones-desempeno/modals';

const EvaluacionDetalleDirector = () => {
  const router = useRouter();
  const idEvaluacion = (router.query.id as string) || '';

  const { currentUserData, dataEvaluacionDocente, loaderPages } = useGlobalContext();

  const isDirector =
    currentUserData?.rol === 2 ||
    currentUserData?.perfil?.rol === 2 ||
    Number(currentUserData?.rol) === 2 ||
    Number(currentUserData?.perfil?.rol) === 2;

  const isAdmin =
    currentUserData?.rol === 4 ||
    currentUserData?.rol === 0 ||
    currentUserData?.perfil?.rol === 4 ||
    currentUserData?.perfil?.rol === 0 ||
    Number(currentUserData?.rol) === 4 ||
    Number(currentUserData?.rol) === 0;

  const {
    getDataEvaluacion,
    getDimensiones,
    getPreguntasRespuestas,
    getEvaluados,
    deleteDimension,
    deletePreguntaRespuesta,
    getParrillaEvaluados,
  } = useEvaluacionDesempenoBase({
    role: 'director',
    collectionName: 'evaluaciones-docentes',
    scopeKey: 'dniDirector',
    scopeValue: currentUserData?.dni,
  });

  const [activeTab, setActiveTab] = useState<'docentes' | 'rubrica'>('docentes');
  const [modoVista, setModoVista] = useState<'colegios' | 'lista'>('colegios');
  const [filterEstado, setFilterEstado] = useState<'all' | 'evaluados' | 'pendientes'>('all');
  const [docentesPadron, setDocentesPadron] = useState<User[]>([]);
  const [evaluadosList, setEvaluadosList] = useState<User[]>([]);
  const [loadingDocentes, setLoadingDocentes] = useState<boolean>(true);
  const [searchDocente, setSearchDocente] = useState<string>('');

  // Acordeones para Instituciones Educativas (inician cerrados por defecto)
  const [expandedColegios, setExpandedColegios] = useState<Set<string>>(new Set());

  // Acordeones para Dominios de Rúbricas (inician cerrados por defecto)
  const [expandedDominios, setExpandedDominios] = useState<Set<string>>(new Set());

  // Si el usuario es administrador u otro rol distinto a director, cambiar por defecto a la pestaña rúbrica
  useEffect(() => {
    if (currentUserData && !isDirector) {
      setActiveTab('rubrica');
    }
  }, [currentUserData, isDirector]);

  // Estados de Modales
  const [showAgregarDim, setShowAgregarDim] = useState<boolean>(false);
  const [dimToUpdate, setDimToUpdate] = useState<DimensionEspecialista | null>(null);
  const [showAgregarPregunta, setShowAgregarPregunta] = useState<boolean>(false);
  const [preguntaToUpdate, setPreguntaToUpdate] = useState<PRDocentes | null>(null);

  // Estados locales para dimensiones y criterios
  const [dimensionesList, setDimensionesList] = useState<DimensionEspecialista[]>([]);
  const [preguntasList, setPreguntasList] = useState<PRDocentes[]>([]);

  // 1. Suscripción a datos de la evaluación
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

  // 2. Cargar padrón de docentes del director (SOLO si el rol es Director)
  useEffect(() => {
    let isMounted = true;
    const fetchDocentes = async () => {
      if (!isDirector || !currentUserData?.dni) {
        setLoadingDocentes(false);
        return;
      }
      setLoadingDocentes(true);
      try {
        const docentes = await getParrillaEvaluados('dniDirector', currentUserData.dni);
        if (isMounted) {
          setDocentesPadron(docentes);
        }
      } catch (error) {
        console.error('Error al cargar docentes del director:', error);
      } finally {
        if (isMounted) {
          setLoadingDocentes(false);
        }
      }
    };

    fetchDocentes();
    return () => {
      isMounted = false;
    };
  }, [isDirector, currentUserData?.dni, getParrillaEvaluados]);

  const {
    dimensionesEspecialistas,
    getPreguntaRespuestaDocentes: contextPreguntas,
    evaluadosEspecialista,
  } = useGlobalContext();

  const currentDimensiones = dimensionesEspecialistas || [];
  const currentPreguntas = contextPreguntas || [];
  const currentEvaluados = evaluadosEspecialista || [];

  // Mapeo de docentes con su estado de evaluación
  const docentesConEstado = useMemo(() => {
    return docentesPadron.map((docente) => {
      // Buscar si el docente tiene evaluación registrada en esta ficha
      const evRegistrada = currentEvaluados.find(
        (ev) =>
          ev.dni === docente.dni ||
          (ev as any).docenteDni === docente.dni ||
          (ev as any).evaluadoDni === docente.dni
      );

      return {
        ...docente,
        evaluacion: evRegistrada || null,
        isEvaluated: !!evRegistrada,
      };
    });
  }, [docentesPadron, currentEvaluados]);

  // Filtro de búsqueda y estado de docentes
  const docentesFiltrados = useMemo(() => {
    let result = docentesConEstado;

    if (filterEstado === 'evaluados') {
      result = result.filter((d) => d.isEvaluated);
    } else if (filterEstado === 'pendientes') {
      result = result.filter((d) => !d.isEvaluated);
    }

    if (!searchDocente.trim()) return result;
    const query = searchDocente.toLowerCase().trim();
    return result.filter(
      (d) =>
        (d.nombres || '').toLowerCase().includes(query) ||
        (d.apellidos || '').toLowerCase().includes(query) ||
        (d.dni || '').includes(query)
    );
  }, [docentesConEstado, filterEstado, searchDocente]);

  // Agrupación organizada por Institución Educativa para la vista de acordeón
  const gruposPorInstitucion = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        institucion: string;
        docentes: typeof docentesFiltrados;
        evaluadosCount: number;
        pendientesCount: number;
        promedio: number;
      }
    >();

    docentesFiltrados.forEach((docente) => {
      const rawInst = (docente as any).institucion ? String((docente as any).institucion).trim() : '';
      const nombre = rawInst || 'Institución Educativa Asignada';
      const key = nombre.toLowerCase().replace(/\s+/g, '-');

      if (!map.has(key)) {
        map.set(key, {
          key,
          institucion: nombre,
          docentes: [],
          evaluadosCount: 0,
          pendientesCount: 0,
          promedio: 0,
        });
      }
      const item = map.get(key)!;
      item.docentes.push(docente);
      if (docente.isEvaluated) {
        item.evaluadosCount += 1;
      } else {
        item.pendientesCount += 1;
      }
    });

    const list = Array.from(map.values()).map((g) => {
      const evaluadosConNota = g.docentes.filter((d) => d.isEvaluated && d.evaluacion?.calificacion != null);
      const suma = evaluadosConNota.reduce((acc, d) => acc + (Number(d.evaluacion?.calificacion) || 0), 0);
      g.promedio = evaluadosConNota.length > 0 ? Math.round((suma / evaluadosConNota.length) * 10) / 10 : 0;
      g.docentes.sort((a, b) =>
        (a.apellidos || '').localeCompare(b.apellidos || '', 'es', { sensitivity: 'base' })
      );
      return g;
    });

    list.sort((a, b) => a.institucion.localeCompare(b.institucion, 'es', { sensitivity: 'base' }));
    return list;
  }, [docentesFiltrados]);

  const toggleColegio = (key: string) => {
    setExpandedColegios((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAllColegios = () => {
    setExpandedColegios(new Set(gruposPorInstitucion.map((g) => g.key)));
  };

  const collapseAllColegios = () => {
    setExpandedColegios(new Set());
  };

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

  // Contadores de progreso
  const totalDocentes = docentesPadron.length;
  const evaluadosCount = docentesConEstado.filter((d) => d.isEvaluated).length;
  const pendientesCount = totalDocentes - evaluadosCount;
  const porcentajeAvance = totalDocentes > 0 ? Math.round((evaluadosCount / totalDocentes) * 100) : 0;

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const defaultNombresDirector = useMemo(
    () => ({
      padron: 'Padrón de Docentes',
      rubrica: 'Estructura de Rúbricas',
    }),
    []
  );

  const tabNombres = useMemo(
    () => ({
      padron:
        dataEvaluacionDocente?.nombresPestanas?.padron?.trim() ||
        defaultNombresDirector.padron,
      rubrica:
        dataEvaluacionDocente?.nombresPestanas?.rubrica?.trim() ||
        defaultNombresDirector.rubrica,
    }),
    [dataEvaluacionDocente?.nombresPestanas, defaultNombresDirector]
  );

  const metricasDocente = useMemo<HeroBannerMetricItem[]>(
    () => [
      {
        id: 'docentes',
        label: tabNombres.padron,
        value: isDirector ? totalDocentes : 'Por I.E.',
        icon: RiTeamLine,
        badgeText: 'Padrón',
        helperText: 'Docentes en padrón',
        colorTheme: 'blue' as const,
        active: activeTab === 'docentes' && filterEstado === 'all',
        onClick: () => {
          setActiveTab('docentes');
          setFilterEstado('all');
        },
      },
      {
        id: 'evaluados',
        label: 'Evaluados',
        value: isDirector ? evaluadosCount : '-',
        icon: RiShieldCheckLine,
        badgeText: 'Concluidos',
        helperText: 'Ver lista de evaluados',
        colorTheme: 'emerald' as const,
        href: `/directores/evaluaciones-docentes/evaluacion/${idEvaluacion}/evaluados`,
      },
      {
        id: 'pendientes',
        label: 'Pendientes',
        value: isDirector ? pendientesCount : '-',
        icon: RiTimeLine,
        badgeText: 'En curso',
        helperText: 'Pendientes de registro',
        colorTheme: 'amber' as const,
        active: activeTab === 'docentes' && filterEstado === 'pendientes',
        onClick: () => {
          setActiveTab('docentes');
          setFilterEstado('pendientes');
        },
      },
      {
        id: 'progreso',
        label: 'Progreso',
        value: isDirector ? `${porcentajeAvance}%` : '-',
        icon: RiPieChartLine,
        badgeText: 'Global',
        helperText: 'Avance del monitoreo',
        colorTheme: 'purple' as const,
      },
    ],
    [
      isDirector,
      totalDocentes,
      evaluadosCount,
      pendientesCount,
      porcentajeAvance,
      activeTab,
      filterEstado,
      idEvaluacion,
      tabNombres,
    ]
  );

  // Eliminar dimensión y sus criterios asociados
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
      await deleteDimension(idEvaluacion, dimId, true);
    }
  };

  // Eliminar criterio
  const handleDeletePreg = async (pregId?: string) => {
    if (!pregId) return;
    if (window.confirm('¿Deseas eliminar este criterio de la evaluación?')) {
      await deletePreguntaRespuesta(idEvaluacion, pregId);
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
              href="/directores/evaluaciones-docentes"
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

      {/* Banner Principal Modular Reutilizable */}
      <EvaluacionDetalleHeroBanner
        idEvaluacion={idEvaluacion}
        collectionName="evaluaciones-docentes"
        variant={(dataEvaluacionDocente as any)?.bannerVariant || (dataEvaluacionDocente as any)?.variant}
        backHref="/directores/evaluaciones-docentes"
        selectedYear={currentYear}
        institucion={currentUserData?.institucion || 'UGEL'}
        faseNombre={dataEvaluacionDocente?.faseNombre}
        categoria={dataEvaluacionDocente?.categoria || 'MONITOREO DIRECTIVO'}
        title={dataEvaluacionDocente?.name || 'RÚBRICA DE MEDIACIÓN DIDÁCTICA'}
        descripcion={
          dataEvaluacionDocente?.descripcion ||
          'Supervisión y acompañamiento pedagógico al desempeño docente en aula'
        }
        metricas={metricasDocente}
        backgroundImage={dataEvaluacionDocente?.backgroundImage}
        backgroundImageOpacity={dataEvaluacionDocente?.backgroundImageOpacity ?? 0.25}
        isAdmin={isAdmin}
        canEditTitleDescription={isAdmin || isDirector}
        storageKey="eva_eval_docente_banner_variant"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && (
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
                defaultNombresPestanas={{
                  monitoreos: 'Monitoreos Realizados',
                  padron: 'Padrón de Docentes',
                  rubrica: 'Estructura de Rúbricas',
                }}
              />
            )}

            <Link
              href={`/directores/evaluaciones-docentes/evaluacion/reporte?idEvaluacion=${idEvaluacion}`}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl border border-white/20 shadow-md shadow-blue-900/30 transition-all cursor-pointer active:scale-95"
            >
              <MdBarChart className="text-base sm:text-lg text-teal-200" />
              <span>Reporte I.E.</span>
            </Link>
          </div>
        }
      />

      {/* Navegación por Pestañas */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('docentes')}
          className={`flex items-center gap-2 py-3 px-6 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'docentes'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MdPeople className="text-lg" />
          <span>{tabNombres.padron} {isDirector ? `(${totalDocentes})` : ''}</span>
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
          <span>{tabNombres.rubrica} ({currentPreguntas.length} Criterios)</span>
        </button>
      </div>

      {/* PESTAÑA 1: PADRÓN DE DOCENTES */}
      {activeTab === 'docentes' && (
        !isDirector ? (
          <div className="text-center py-16 px-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200/60">
              <MdPeople className="text-2xl" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Padrón asignado al Director de la I.E.</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
              El padrón de docentes y el registro de sus evaluaciones es gestionado y ejecutado directamente por los Directores desde sus respectivas cuentas institucionales (rol Director). Como Administrador, puedes configurar la estructura de rúbricas y criterios en la pestaña contigua.
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setActiveTab('rubrica')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <MdAssignment className="text-base" />
                <span>Ver {tabNombres.rubrica}</span>
              </button>
            </div>
          </div>
        ) : (
        <div className="space-y-4">
          {/* Barra de Búsqueda y Filtros */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 flex-1 bg-transparent">
              <MdSearch className="text-xl text-slate-400" />
              <input
                type="text"
                placeholder="Buscar docente por nombre, apellidos o DNI..."
                value={searchDocente}
                onChange={(e) => setSearchDocente(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
              />
              {searchDocente && (
                <button
                  type="button"
                  onClick={() => setSearchDocente('')}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded bg-slate-100 transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Segmento de Estado (Todos / Evaluados / Pendientes) y Modo de Vista */}
            <div className="flex flex-wrap items-center gap-2.5 sm:border-t lg:border-t-0 lg:border-l border-slate-200 pt-2 lg:pt-0 lg:pl-4">
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setFilterEstado('all')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterEstado === 'all'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Todos</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 text-slate-700 font-bold">
                    {totalDocentes}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterEstado('evaluados')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterEstado === 'evaluados'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  <MdCheckCircle className="text-sm" />
                  <span>Evaluados</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      filterEstado === 'evaluados'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {evaluadosCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterEstado('pendientes')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterEstado === 'pendientes'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-amber-700'
                  }`}
                >
                  <MdPendingActions className="text-sm" />
                  <span>Pendientes</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      filterEstado === 'pendientes'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {pendientesCount}
                  </span>
                </button>
              </div>

              {/* Selector de Modo de Vista */}
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setModoVista('colegios')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    modoVista === 'colegios'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Ver docentes organizados por Institución / Sede"
                >
                  <MdViewAgenda className="text-sm" />
                  <span>Por Institución</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModoVista('lista')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    modoVista === 'lista'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Ver lista corrida de todos los docentes"
                >
                  <MdViewList className="text-sm" />
                  <span>Lista General</span>
                </button>
              </div>

              {/* Botón Acción Evaluar */}
              <Link
                href={`/directores/evaluaciones-docentes/evaluacion/evaluar-docente?id=${idEvaluacion}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                title="Evaluar a un docente"
              >
                <MdAddCircle className="text-base" />
                <span>+ Evaluar</span>
              </Link>
            </div>
          </div>

          {loadingDocentes ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
              <RiLoader4Line className="text-4xl text-blue-600 animate-spin mb-3" />
              <p className="text-sm font-medium text-slate-600">Cargando docentes de la institución...</p>
            </div>
          ) : docentesFiltrados.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <p className="text-base font-semibold text-slate-700">
                {filterEstado === 'evaluados'
                  ? 'No hay docentes evaluados con los filtros seleccionados'
                  : filterEstado === 'pendientes'
                  ? 'No hay docentes pendientes con los filtros seleccionados'
                  : 'No se encontraron docentes'}
              </p>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                {searchDocente || filterEstado !== 'all'
                  ? 'Prueba modificando el término de búsqueda o cambiando el filtro de estado.'
                  : 'Verifica que los docentes de tu I.E. tengan registrado tu DNI de Director.'}
              </p>
              {(searchDocente || filterEstado !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchDocente('');
                    setFilterEstado('all');
                  }}
                  className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Restablecer filtros
                </button>
              )}
            </div>
          ) : modoVista === 'colegios' ? (
            /* VISTA DE ACORDEÓN POR INSTITUCIÓN EDUCATIVA / SEDE */
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-medium">
                <span>Mostrando {gruposPorInstitucion.length} institución(es) / sede(s)</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={expandAllColegios}
                    className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    Expandir todos
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={collapseAllColegios}
                    className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
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
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200"
                  >
                    {/* Cabecera interactiva del acordeón */}
                    <div
                      onClick={() => toggleColegio(grupo.key)}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl shrink-0">
                          <MdSchool />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-800">{grupo.institucion}</h4>
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {grupo.docentes.length} {grupo.docentes.length === 1 ? 'docente' : 'docentes'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="text-emerald-600 font-medium">{grupo.evaluadosCount} evaluados</span>
                            <span>•</span>
                            <span className="text-amber-600 font-medium">{grupo.pendientesCount} pendientes</span>
                          </div>
                        </div>
                      </div>

                      {/* Métricas y Acciones del Acordeón */}
                      <div className="flex items-center gap-2.5 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                        {grupo.evaluadosCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <MdCheckCircle className="text-emerald-600" />
                            Promedio: {grupo.promedio} pts
                          </span>
                        )}

                        <Link
                          href={`/directores/evaluaciones-docentes/evaluacion/evaluar-docente?id=${idEvaluacion}`}
                          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                          title="Evaluar docente de esta institución"
                        >
                          <MdAddCircle className="text-emerald-600" />
                          <span>+ Evaluar</span>
                        </Link>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleColegio(grupo.key);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                          title={isExpanded ? 'Contraer institución' : 'Expandir institución'}
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

                    {/* Contenido animado con CSS Grid */}
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
                                  Docente
                                </th>
                                <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                  Detalles Académicos
                                </th>
                                <th scope="col" className="w-36 px-4 py-2.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                  Estado
                                </th>
                                <th scope="col" className="w-44 px-4 py-2.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                  Acciones
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {grupo.docentes.map((docente, idx) => {
                                const evalUrl = `/directores/evaluaciones-docentes/evaluacion/evaluar-docente?id=${idEvaluacion}&idDocente=${docente.dni}`;
                                const reporteUrl = `/directores/evaluaciones-docentes/evaluacion/reporte-docente-individual?idDocente=${docente.dni}&idEvaluacion=${idEvaluacion}`;

                                return (
                                  <tr key={docente.dni || idx} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-400">
                                      {idx + 1}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-xs font-bold text-slate-800 block">
                                        {docente.nombres} {docente.apellidos}
                                      </span>
                                      <span className="text-[11px] text-slate-500">DNI: {docente.dni}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-xs text-slate-600 block">
                                        {docente.caracteristicaCurricular || docente.cargo || 'Docente de Aula'}
                                      </span>
                                      {docente.celular && (
                                        <span className="text-[11px] text-slate-400">Cel: {docente.celular}</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                      {docente.isEvaluated ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          <MdCheckCircle className="text-emerald-600 text-xs" />
                                          {docente.evaluacion?.calificacion || 0} pts
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                          <MdPendingActions className="text-amber-500 text-xs" />
                                          Pendiente
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <Link
                                          href={evalUrl}
                                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                                            docente.isEvaluated
                                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                                          }`}
                                        >
                                          {docente.isEvaluated ? 'Reevaluar' : 'Evaluar'}
                                        </Link>
                                        {docente.isEvaluated && (
                                          <Link
                                            href={reporteUrl}
                                            className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                                          >
                                            Reporte
                                          </Link>
                                        )}
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
                      Detalles Académicos
                    </th>
                    <th scope="col" className="w-40 px-6 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="w-48 px-6 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {docentesFiltrados.map((docente, index) => {
                    const evalUrl = `/directores/evaluaciones-docentes/evaluacion/evaluar-docente?id=${idEvaluacion}&idDocente=${docente.dni}`;
                    const reporteUrl = `/directores/evaluaciones-docentes/evaluacion/reporte-docente-individual?idDocente=${docente.dni}&idEvaluacion=${idEvaluacion}`;

                    return (
                      <tr key={docente.dni || index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-400">
                          {index + 1}
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-800 block">
                            {docente.nombres} {docente.apellidos}
                          </span>
                          <span className="text-xs text-slate-500">DNI: {docente.dni}</span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-600 block">
                            {docente.caracteristicaCurricular || docente.cargo || 'Docente de Aula'}
                          </span>
                          {docente.celular && (
                            <span className="text-xs text-slate-400">Cel: {docente.celular}</span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {docente.isEvaluated ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <MdCheckCircle className="text-emerald-600" />
                              Evaluado ({docente.evaluacion?.calificacion || 0} pts)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <MdPendingActions className="text-amber-500" />
                              Pendiente
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={evalUrl}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                docente.isEvaluated
                                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                              }`}
                            >
                              {docente.isEvaluated ? 'Reevaluar' : 'Evaluar'}
                            </Link>

                            {docente.isEvaluated && (
                              <Link
                                href={reporteUrl}
                                className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                              >
                                Reporte
                              </Link>
                            )}
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
        )
      )}

      {/* PESTAÑA 2: CRITERIOS Y RÚBRICA */}
      {activeTab === 'rubrica' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-800">Criterios de la Ficha</h3>
              <p className="text-xs text-slate-500">
                {isAdmin
                  ? 'Organiza las dimensiones pedagógicas y los criterios de evaluación.'
                  : 'Rúbrica oficial establecida por la UGEL para el monitoreo pedagógico docente.'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {currentDimensiones.length > 0 && (
                <div className="flex items-center gap-2 mr-2">
                  <button
                    type="button"
                    onClick={expandAllDominios}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    Expandir todos
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={collapseAllDominios}
                    className="text-xs text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                  >
                    Contraer todos
                  </button>
                </div>
              )}
              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowAgregarDim(true)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <MdAddCircle /> Añadir Dominio
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAgregarPregunta(true)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <MdAddCircle /> Añadir Criterio
                  </button>
                </>
              )}
            </div>
          </div>

          {currentDimensiones.length === 0 && currentPreguntas.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <p className="text-base font-semibold text-slate-700">Sin criterios configurados</p>
              <p className="text-sm text-slate-400 mt-1">
                Añade dominios y criterios pedagógicos para estructurar la rúbrica de monitoreo.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentDimensiones.map((dim) => {
                const dimKey = dim.id || '';
                const isExpanded = dimKey ? expandedDominios.has(dimKey) : false;
                const preguntasDeDim = currentPreguntas.filter(
                  (p) => p.dimensionId === dim.id
                );

                return (
                  <div
                    key={dim.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200"
                  >
                    <div
                      onClick={() => dimKey && toggleDominio(dimKey)}
                      className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 p-4 border-b border-slate-200 cursor-pointer transition-colors select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: dim.color || '#3b82f6' }}
                        />
                        <h4 className="font-bold text-sm text-slate-800">{dim.nombre}</h4>
                        <span className="text-xs text-slate-400 font-medium">
                          ({preguntasDeDim.length} {preguntasDeDim.length === 1 ? 'criterio' : 'criterios'})
                        </span>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {isAdmin && (
                          <div className="flex items-center gap-1 mr-1">
                            <button
                              type="button"
                              onClick={() => setDimToUpdate(dim)}
                              className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors cursor-pointer"
                              title="Editar dominio"
                            >
                              <MdEdit />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDim(dim.id)}
                              className="p-1 text-slate-500 hover:text-red-600 rounded transition-colors cursor-pointer"
                              title="Eliminar dominio"
                            >
                              <MdDelete />
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => dimKey && toggleDominio(dimKey)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                          title={isExpanded ? 'Contraer dominio' : 'Expandir dominio'}
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

                    {/* Contenido animado con CSS Grid */}
                    <div
                      className={`grid transition-all duration-300 ease-in-out ${
                        isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="divide-y divide-slate-100 p-2">
                          {preguntasDeDim.length === 0 ? (
                            <p className="text-xs text-slate-400 italic p-3">
                              No hay criterios asignados a este dominio.
                            </p>
                          ) : (
                            preguntasDeDim.map((pr, idx) => (
                              <div
                                key={pr.id || idx}
                                className="p-3 hover:bg-slate-50 rounded-xl transition-colors flex items-start justify-between gap-4"
                              >
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold text-slate-800">
                                    <span className="text-blue-600 mr-2">{pr.order || idx + 1}.</span>
                                    {pr.criterio}
                                  </p>
                                  {pr.requiereEvidencia && (
                                    <span className="inline-flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                                      <MdFilePresent /> Requiere Evidencias
                                    </span>
                                  )}
                                </div>

                                {isAdmin && (
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setPreguntaToUpdate(pr)}
                                      className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                                      title="Editar criterio"
                                    >
                                      <MdEdit />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePreg(pr.id)}
                                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                      title="Eliminar criterio"
                                    >
                                      <MdDelete />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

EvaluacionDetalleDirector.Auth = PrivateRouteDirectores;
export default EvaluacionDetalleDirector;