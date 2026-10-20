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
  MdFilterList,
} from 'react-icons/md';
import {
  RiLoader4Line,
  RiTeamLine,
  RiTimeLine,
  RiPieChartLine,
  RiShieldCheckLine,
} from 'react-icons/ri';
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista';
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
import { regiones, regionTexto } from '@/fuctions/regiones';

const EvaluacionDetalleDirector = () => {
  const router = useRouter();
  const idEvaluacion = (router.query.id as string) || '';

  const { currentUserData, dataEvaluacionDocente, loaderPages } = useGlobalContext();

  const isEspecialista =
    currentUserData?.rol === 1 ||
    currentUserData?.perfil?.rol === 1 ||
    Number(currentUserData?.rol) === 1 ||
    Number(currentUserData?.perfil?.rol) === 1;

  const isAdmin =
    currentUserData?.rol === 4 ||
    currentUserData?.rol === 0 ||
    currentUserData?.perfil?.rol === 4 ||
    currentUserData?.perfil?.rol === 0 ||
    Number(currentUserData?.rol) === 4 ||
    Number(currentUserData?.rol) === 0;

  const isDrep =
    currentUserData?.rol === 5 ||
    currentUserData?.perfil?.rol === 5 ||
    Number(currentUserData?.rol) === 5;

  const [selectedRegion, setSelectedRegion] = useState<string>(
    currentUserData?.region ? String(currentUserData.region) : 'all'
  );

  const {
    getDataEvaluacion,
    getDimensiones,
    getPreguntasRespuestas,
    getEvaluados,
    deleteDimension,
    deletePreguntaRespuesta,
    getParrillaEvaluados,
  } = useEvaluacionDesempenoBase({
    role: 'especialista',
    collectionName: 'evaluaciones-director',
    scopeKey: 'region',
    scopeValue: currentUserData?.region,
  });

  const [activeTab, setActiveTab] = useState<'directores' | 'rubrica'>('directores');
  const [filterEstado, setFilterEstado] = useState<'all' | 'evaluados' | 'pendientes'>('all');
  const [directoresPadron, setDirectoresPadron] = useState<User[]>([]);
  const [loadingDirectores, setLoadingDirectores] = useState<boolean>(true);
  const [searchDirector, setSearchDirector] = useState<string>('');

  // Si el usuario es administrador u otro rol distinto a especialista, cambiar por defecto a la pestaña rúbrica
  useEffect(() => {
    if (currentUserData && !isEspecialista) {
      setActiveTab('rubrica');
    }
  }, [currentUserData, isEspecialista]);

  // Estados de Modales
  const [showAgregarDim, setShowAgregarDim] = useState<boolean>(false);
  const [dimToUpdate, setDimToUpdate] = useState<DimensionEspecialista | null>(null);
  const [showAgregarPregunta, setShowAgregarPregunta] = useState<boolean>(false);
  const [preguntaToUpdate, setPreguntaToUpdate] = useState<PRDocentes | null>(null);

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

  // 2. Cargar padrón de directores (SOLO si el rol es Especialista)
  useEffect(() => {
    let isMounted = true;
    const fetchDirectores = async () => {
      if (!isEspecialista) {
        setLoadingDirectores(false);
        return;
      }
      setLoadingDirectores(true);
      try {
        const target =
          selectedRegion === 'all'
            ? undefined
            : selectedRegion || (!isDrep ? currentUserData?.region : undefined);
        const directores = await getParrillaEvaluados('region', target);
        if (isMounted) {
          setDirectoresPadron(directores);
        }
      } catch (error) {
        console.error('Error al cargar directores para la evaluación:', error);
      } finally {
        if (isMounted) {
          setLoadingDirectores(false);
        }
      }
    };

    fetchDirectores();
    return () => {
      isMounted = false;
    };
  }, [isEspecialista, currentUserData?.region, currentUserData?.rol, isDrep, selectedRegion, getParrillaEvaluados]);

  const {
    dimensionesEspecialistas,
    getPreguntaRespuestaDocentes: contextPreguntas,
    evaluadosEspecialista,
  } = useGlobalContext();

  const currentDimensiones = dimensionesEspecialistas || [];
  const currentPreguntas = contextPreguntas || [];
  const currentEvaluados = evaluadosEspecialista || [];

  // Mapeo de directores con su estado de evaluación
  const directoresConEstado = useMemo(() => {
    return directoresPadron.map((director) => {
      const directorDni = String(director.dni || '').trim();
      const evRegistrada = currentEvaluados.find((ev) => {
        const evDni = String(
          (ev as any).directorDni ||
          (ev as any).evaluadoDni ||
          ev.dni ||
          ''
        ).trim();
        return evDni === directorDni;
      });

      return {
        ...director,
        evaluacion: evRegistrada || null,
        isEvaluated: !!evRegistrada,
      };
    });
  }, [directoresPadron, currentEvaluados]);

  // Filtro de búsqueda y estado de directores
  const directoresFiltrados = useMemo(() => {
    let result = directoresConEstado;

    if (filterEstado === 'evaluados') {
      result = result.filter((d) => d.isEvaluated);
    } else if (filterEstado === 'pendientes') {
      result = result.filter((d) => !d.isEvaluated);
    }

    if (!searchDirector.trim()) return result;
    const query = searchDirector.toLowerCase().trim();
    return result.filter(
      (d) =>
        (d.nombres || '').toLowerCase().includes(query) ||
        (d.apellidos || '').toLowerCase().includes(query) ||
        (d.dni || '').includes(query) ||
        (d.institucion || '').toLowerCase().includes(query)
    );
  }, [directoresConEstado, filterEstado, searchDirector]);

  // Contadores de progreso
  const totalDirectores = directoresPadron.length;
  const evaluadosCount = directoresConEstado.filter((d) => d.isEvaluated).length;
  const pendientesCount = totalDirectores - evaluadosCount;
  const porcentajeAvance =
    totalDirectores > 0 ? Math.round((evaluadosCount / totalDirectores) * 100) : 0;

  const metricasDirector = useMemo<HeroBannerMetricItem[]>(
    () => [
      {
        id: 'directores',
        label: 'Directores Asignados',
        value: isEspecialista ? totalDirectores : 'Por UGEL',
        icon: RiTeamLine,
        badgeText: 'Padrón',
        helperText: 'Directores asignados',
        colorTheme: 'blue' as const,
        active: activeTab === 'directores' && filterEstado === 'all',
        onClick: () => {
          setActiveTab('directores');
          setFilterEstado('all');
        },
      },
      {
        id: 'evaluados',
        label: 'Evaluados',
        value: isEspecialista ? evaluadosCount : '-',
        icon: RiShieldCheckLine,
        badgeText: 'Concluidos',
        helperText: 'Ver lista de evaluados',
        colorTheme: 'emerald' as const,
        href: `/especialistas/evaluaciones-director/evaluacion/${idEvaluacion}/evaluados`,
      },
      {
        id: 'pendientes',
        label: 'Pendientes',
        value: isEspecialista ? pendientesCount : '-',
        icon: RiTimeLine,
        badgeText: 'En curso',
        helperText: 'Pendientes de monitoreo',
        colorTheme: 'amber' as const,
        active: activeTab === 'directores' && filterEstado === 'pendientes',
        onClick: () => {
          setActiveTab('directores');
          setFilterEstado('pendientes');
        },
      },
      {
        id: 'progreso',
        label: 'Progreso',
        value: isEspecialista ? `${porcentajeAvance}%` : '-',
        icon: RiPieChartLine,
        badgeText: 'Global',
        helperText: 'Avance del monitoreo',
        colorTheme: 'purple' as const,
      },
    ],
    [
      isEspecialista,
      totalDirectores,
      evaluadosCount,
      pendientesCount,
      porcentajeAvance,
      activeTab,
      filterEstado,
      idEvaluacion,
    ]
  );

  // Eliminar dimensión
  const handleDeleteDim = async (dimId?: string) => {
    if (!dimId) return;
    if (
      window.confirm(
        '¿Deseas eliminar este dominio? Los criterios asociados quedarán sin dominio asignado.'
      )
    ) {
      await deleteDimension(idEvaluacion, dimId);
    }
  };

  // Eliminar criterio
  const handleDeletePreg = async (pregId?: string) => {
    if (!pregId) return;
    if (window.confirm('¿Deseas eliminar este criterio de la evaluación?')) {
      await deletePreguntaRespuesta(idEvaluacion, pregId);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Modales */}
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

      {/* Banner Principal Modular Reutilizable */}
      <EvaluacionDetalleHeroBanner
        idEvaluacion={idEvaluacion}
        collectionName="evaluaciones-director"
        variant={(dataEvaluacionDocente as any)?.bannerVariant || (dataEvaluacionDocente as any)?.variant}
        backHref="/especialistas/evaluaciones-director"
        selectedYear={new Date().getFullYear()}
        institucion={
          isDrep
            ? 'Jurisdicción Regional DREP'
            : `UGEL ${regionTexto(currentUserData?.region) || 'Asignada'}`
        }
        faseNombre={dataEvaluacionDocente?.faseNombre}
        categoria={dataEvaluacionDocente?.categoria || 'MONITOREO AL DESEMPEÑO DIRECTIVO'}
        title={dataEvaluacionDocente?.name || 'EVALUACIÓN DE DESEMPEÑO DIRECTIVO'}
        descripcion={
          dataEvaluacionDocente?.descripcion ||
          'Supervisión, monitoreo y acompañamiento al liderazgo pedagógico directivo'
        }
        metricas={metricasDirector}
        backgroundImage={dataEvaluacionDocente?.backgroundImage}
        backgroundImageOpacity={dataEvaluacionDocente?.backgroundImageOpacity ?? 0.25}
        isAdmin={isAdmin}
        canEditTitleDescription={isAdmin || isEspecialista || isDrep}
        storageKey="eva_eval_director_banner_variant"
        actions={
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
              faseActual={dataEvaluacionDocente?.faseNombre}
              onAgregarDominio={() => setShowAgregarDim(true)}
              onAgregarPreguntas={() => setShowAgregarPregunta(true)}
            />

            <Link
              href={`/admin/directores/reporte?idEvaluacion=${idEvaluacion}`}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl border border-white/20 shadow-md shadow-blue-900/30 transition-all cursor-pointer active:scale-95"
            >
              <MdBarChart className="text-base sm:text-lg text-teal-200" />
              <span>Reporte UGEL</span>
            </Link>
          </div>
        }
      />

      {/* Navegación por Pestañas */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('directores')}
          className={`flex items-center gap-2 py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'directores'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MdPeople className="text-lg" />
          <span>Padrón de Directores {isEspecialista ? `(${totalDirectores})` : ''}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rubrica')}
          className={`flex items-center gap-2 py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'rubrica'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MdAssignment className="text-lg" />
          <span>Estructura de Rúbricas ({currentPreguntas.length} Criterios)</span>
        </button>
      </div>

      {/* PESTAÑA 1: PADRÓN DE DIRECTORES */}
      {activeTab === 'directores' && (
        !isEspecialista ? (
          <div className="text-center py-16 px-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200/60">
              <MdPeople className="text-2xl" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Padrón reservado para Especialistas de UGEL</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
              El padrón de directores y la aplicación de sus evaluaciones de desempeño corresponden a los Especialistas de cada UGEL en su respectiva jurisdicción (rol Especialista). Como Administrador, puedes diseñar y configurar las dimensiones, criterios, escalas y niveles de la evaluación.
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setActiveTab('rubrica')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
              >
                <MdAssignment className="text-base" />
                <span>Ver Estructura de Rúbricas</span>
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
                placeholder="Buscar director por nombre, apellidos, DNI o I.E...."
                value={searchDirector}
                onChange={(e) => setSearchDirector(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
              />
              {searchDirector && (
                <button
                  type="button"
                  onClick={() => setSearchDirector('')}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded bg-slate-100 transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Segmento de Estado (Todos / Evaluados / Pendientes) y Filtro UGEL */}
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
                    {totalDirectores}
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

              {isDrep && (
                <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                  <MdFilterList className="text-slate-400" />
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">Todas las UGELs</option>
                    {regiones?.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.region}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {loadingDirectores ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
              <RiLoader4Line className="text-4xl text-blue-600 animate-spin mb-3" />
              <p className="text-sm font-medium text-slate-600">Cargando directores de la jurisdicción...</p>
            </div>
          ) : directoresFiltrados.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <p className="text-base font-semibold text-slate-700">
                {filterEstado === 'evaluados'
                  ? 'No hay directores evaluados con los filtros seleccionados'
                  : filterEstado === 'pendientes'
                  ? 'No hay directores pendientes con los filtros seleccionados'
                  : 'No se encontraron directores'}
              </p>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                {searchDirector || filterEstado !== 'all'
                  ? 'Prueba modificando el término de búsqueda o cambiando el filtro de estado.'
                  : 'Verifica los filtros aplicados o que existan directivos registrados en la jurisdicción.'}
              </p>
              {(searchDirector || filterEstado !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchDirector('');
                    setFilterEstado('all');
                  }}
                  className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Restablecer filtros
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="w-16 px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      #
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Director / DNI
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Institución / UGEL
                    </th>
                    <th scope="col" className="w-44 px-6 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="w-48 px-6 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {directoresFiltrados.map((director, index) => {
                    const evalUrl = `/especialistas/evaluaciones-director/evaluacion/evaluar-director?id=${idEvaluacion}&idDirector=${director.dni}`;
                    const sessionParam = director.evaluacion?.id ? `&sessionId=${director.evaluacion.id}` : '';
                    const reporteUrl = `/especialistas/evaluaciones-director/evaluacion/reporte-director-individual?idEvaluacion=${idEvaluacion}&idDirector=${director.dni}${sessionParam}`;

                    return (
                      <tr key={director.dni || index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-400">
                          {index + 1}
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-800 block">
                            {director.nombres} {director.apellidos}
                          </span>
                          <span className="text-xs text-slate-500">DNI: {director.dni}</span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-700 font-medium block">
                            {director.institucion || 'I.E. No Asignada'}
                          </span>
                          <span className="text-xs text-slate-400">
                            UGEL: {regionTexto(director.region) || 'Asignada'}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {director.isEvaluated ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <MdCheckCircle className="text-emerald-600" />
                              Evaluado ({director.evaluacion?.calificacion || 0} pts)
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
                                director.isEvaluated
                                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                              }`}
                            >
                              {director.isEvaluated ? 'Reevaluar' : 'Evaluar'}
                            </Link>

                            {director.isEvaluated && (
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
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-800">Criterios de la Ficha</h3>
              <p className="text-xs text-slate-500">
                Organiza las dimensiones pedagógicas y los criterios de evaluación para el monitoreo.
              </p>
            </div>
            {(isAdmin || isEspecialista) && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAgregarDim(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                >
                  <MdAddCircle /> Añadir Dominio
                </button>
                <button
                  type="button"
                  onClick={() => setShowAgregarPregunta(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                >
                  <MdAddCircle /> Añadir Criterio
                </button>
              </div>
            )}
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
                const preguntasDeDim = currentPreguntas.filter(
                  (p) => p.dimensionId === dim.id
                );

                return (
                  <div
                    key={dim.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    <div className="flex items-center justify-between bg-slate-50 p-4 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: dim.color || '#3b82f6' }}
                        />
                        <h4 className="font-bold text-sm text-slate-800">{dim.nombre}</h4>
                        <span className="text-xs text-slate-400">
                          ({preguntasDeDim.length} criterios)
                        </span>
                      </div>
                      {(isAdmin || isEspecialista) && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDimToUpdate(dim)}
                            className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors"
                            title="Editar dominio"
                          >
                            <MdEdit />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDim(dim.id)}
                            className="p-1 text-slate-500 hover:text-red-600 rounded transition-colors"
                            title="Eliminar dominio"
                          >
                            <MdDelete />
                          </button>
                        </div>
                      )}
                    </div>

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

                            {(isAdmin || isEspecialista) && (
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setPreguntaToUpdate(pr)}
                                  className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                                  title="Editar criterio"
                                >
                                  <MdEdit />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePreg(pr.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
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
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

EvaluacionDetalleDirector.Auth = PrivateRouteEspecialista;
export default EvaluacionDetalleDirector;