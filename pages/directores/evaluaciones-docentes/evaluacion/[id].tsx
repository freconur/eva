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
  const [docentesPadron, setDocentesPadron] = useState<User[]>([]);
  const [evaluadosList, setEvaluadosList] = useState<User[]>([]);
  const [loadingDocentes, setLoadingDocentes] = useState<boolean>(true);
  const [searchDocente, setSearchDocente] = useState<string>('');

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

  // Filtro de búsqueda de docentes
  const docentesFiltrados = useMemo(() => {
    if (!searchDocente.trim()) return docentesConEstado;
    const query = searchDocente.toLowerCase().trim();
    return docentesConEstado.filter(
      (d) =>
        (d.nombres || '').toLowerCase().includes(query) ||
        (d.apellidos || '').toLowerCase().includes(query) ||
        (d.dni || '').includes(query)
    );
  }, [docentesConEstado, searchDocente]);

  // Contadores de progreso
  const totalDocentes = docentesPadron.length;
  const evaluadosCount = docentesConEstado.filter((d) => d.isEvaluated).length;
  const pendientesCount = totalDocentes - evaluadosCount;
  const porcentajeAvance = totalDocentes > 0 ? Math.round((evaluadosCount / totalDocentes) * 100) : 0;

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const metricasDocente = useMemo(
    () => [
      {
        id: 'docentes',
        label: 'DOCENTES',
        value: isDirector ? totalDocentes : 'Por I.E.',
        icon: RiTeamLine,
        badgeText: 'PADRÓN',
        helperText: 'Docentes en padrón',
        theme: {
          iconBg: 'bg-blue-400/20 border-blue-300/30 text-blue-200',
          labelColor: 'text-blue-200/80',
          cardBorder: 'hover:border-blue-400/40',
          badgeBg: 'bg-blue-400/15 text-blue-200 border-blue-300/25',
        },
      },
      {
        id: 'evaluados',
        label: 'EVALUADOS',
        value: isDirector ? evaluadosCount : '-',
        icon: RiShieldCheckLine,
        badgeText: 'CONCLUIDOS',
        helperText: 'Fichas registradas',
        theme: {
          iconBg: 'bg-emerald-400/20 border-emerald-300/30 text-emerald-200',
          labelColor: 'text-emerald-200/80',
          cardBorder: 'hover:border-emerald-400/40',
          badgeBg: 'bg-emerald-400/15 text-emerald-200 border-emerald-300/25',
        },
      },
      {
        id: 'pendientes',
        label: 'PENDIENTES',
        value: isDirector ? pendientesCount : '-',
        icon: RiTimeLine,
        badgeText: 'EN CURSO',
        helperText: 'Pendientes de registro',
        theme: {
          iconBg: 'bg-amber-400/20 border-amber-300/30 text-amber-200',
          labelColor: 'text-amber-200/80',
          cardBorder: 'hover:border-amber-400/40',
          badgeBg: 'bg-amber-400/15 text-amber-200 border-amber-300/25',
        },
      },
      {
        id: 'progreso',
        label: 'PROGRESO',
        value: isDirector ? `${porcentajeAvance}%` : '-',
        icon: RiPieChartLine,
        badgeText: 'GLOBAL',
        helperText: 'Avance del monitoreo',
        theme: {
          iconBg: 'bg-purple-400/20 border-purple-300/30 text-purple-200',
          labelColor: 'text-purple-200/80',
          cardBorder: 'hover:border-purple-400/40',
          badgeBg: 'bg-purple-400/15 text-purple-200 border-purple-300/25',
        },
      },
    ],
    [isDirector, totalDocentes, evaluadosCount, pendientesCount, porcentajeAvance]
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
                activarEvidencias={dataEvaluacionDocente?.activarEvidencias}
                titulo={dataEvaluacionDocente?.name}
                descripcion={dataEvaluacionDocente?.descripcion}
                faseActual={dataEvaluacionDocente?.faseNombre}
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
          className={`flex items-center gap-2 py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'docentes'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MdPeople className="text-lg" />
          <span>Padrón de Docentes {isDirector ? `(${totalDocentes})` : ''}</span>
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
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
              >
                <MdAssignment className="text-base" />
                <span>Ver Estructura de Rúbricas</span>
              </button>
            </div>
          </div>
        ) : (
        <div className="space-y-4">
          {/* Barra de Búsqueda */}
          <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
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
                onClick={() => setSearchDocente('')}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded bg-slate-100"
              >
                Limpiar
              </button>
            )}
          </div>

          {loadingDocentes ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
              <RiLoader4Line className="text-4xl text-blue-600 animate-spin mb-3" />
              <p className="text-sm font-medium text-slate-600">Cargando docentes de la institución...</p>
            </div>
          ) : docentesFiltrados.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <p className="text-base font-semibold text-slate-700">No se encontraron docentes</p>
              <p className="text-sm text-slate-400 mt-1">
                Verifica que los docentes de tu I.E. tengan registrado tu DNI de Director.
              </p>
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
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-800">Criterios de la Ficha</h3>
              <p className="text-xs text-slate-500">
                {isAdmin
                  ? 'Organiza las dimensiones pedagógicas y los criterios de evaluación.'
                  : 'Rúbrica oficial establecida por la UGEL para el monitoreo pedagógico docente.'}
              </p>
            </div>
            {isAdmin && (
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
                      {isAdmin && (
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

                            {isAdmin && (
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

EvaluacionDetalleDirector.Auth = PrivateRouteDirectores;
export default EvaluacionDetalleDirector;