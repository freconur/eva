import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import {
  MdAddCircle,
  MdDeleteForever,
  MdEditSquare,
  MdVisibility,
  MdVisibilityOff,
  MdSearch,
} from 'react-icons/md';
import {
  RiLoader4Line,
  RiBookOpenLine,
  RiTimeLine,
  RiShieldCheckLine,
  RiGraduationCapLine,
} from 'react-icons/ri';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import useEvaluacionDesempenoBase from '@/features/hooks/useEvaluacionDesempenoBase';
import { CrearEvaluacionDocente } from '@/features/types/types';
import DesempenoHeroBanner, { HeroBannerMetricItem } from './DesempenoHeroBanner';
import ModalCrearEvaluacionDesempeno from '../modals/ModalCrearEvaluacionDesempeno';
import ModalAlertaFaseRequerida from '../modals/ModalAlertaFaseRequerida';
import DeleteEvaluacionDocente from '@/modals/DeleteEvaluacionDocente';
import DeleteEvaluacionEspecialista from '@/modals/DeleteEvaluacionEscpecialista';
import DeleteEvaluacionDirector from '@/modals/DeleteEvaluacionDirector';

export interface EvaluacionesListContainerProps {
  role: 'especialista' | 'director';
  title: string;
  collectionName?: 'evaluaciones-especialista' | 'evaluaciones-docentes' | string;
  baseDetailRoute: string; // e.g. '/admin/especialistas/evaluaciones-especialistas/evaluacion' o '/directores/evaluaciones-docentes/evaluacion'
  canCreate?: boolean;
}

export const EvaluacionesListContainer: React.FC<EvaluacionesListContainerProps> = ({
  role,
  title,
  collectionName: propCollectionName,
  baseDetailRoute,
  canCreate = true,
}) => {
  const collectionName =
    propCollectionName ||
    (role === 'director' ? 'evaluaciones-docentes' : 'evaluaciones-especialista');

  const { currentUserData, evaluacionDesempeñoDocente, loaderPages } = useGlobalContext();
  const { getEvaluaciones, updateEstadoEvaluacion } = useEvaluacionDesempenoBase({
    collectionName,
    role,
  });

  const isUserAdmin = useMemo(() => {
    const userRole = Number(currentUserData?.rol ?? currentUserData?.perfil?.rol);

    // Directores (2), Especialistas (1) y Docentes (3) no tienen permisos de administración
    if (userRole === 1 || userRole === 2 || userRole === 3) {
      return false;
    }

    // Administradores (4 o 0) y Especialistas Regionales (5)
    if (userRole === 4 || userRole === 0 || userRole === 5) {
      return true;
    }

    return Boolean(canCreate);
  }, [currentUserData, canCreate]);

  const [search, setSearch] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [deleteEvalId, setDeleteEvalId] = useState<string | null>(null);
  const [faseRequeridaModal, setFaseRequeridaModal] = useState<{
    isOpen: boolean;
    evaluacionTitulo: string;
    detailUrl: string;
  }>({
    isOpen: false,
    evaluacionTitulo: '',
    detailUrl: '',
  });

  useEffect(() => {
    const unsubscribe = getEvaluaciones();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [getEvaluaciones]);

  // Solo los administradores pueden ver evaluaciones inactivas; directores y especialistas solo acceden a las activas
  const filteredEvaluaciones = useMemo(() => {
    if (!evaluacionDesempeñoDocente) return [];
    return [...evaluacionDesempeñoDocente]
      .filter((ev) => {
        if (!isUserAdmin && !ev.active) {
          return false;
        }
        const query = search.toLowerCase().trim();
        return (
          (ev.name || '').toLowerCase().includes(query) ||
          (ev.categoria || '').toLowerCase().includes(query)
        );
      })
      .sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' })
      );
  }, [evaluacionDesempeñoDocente, search, isUserAdmin]);

  const handleToggleActive = async (
    id: string,
    currentStatus?: boolean,
    evalObj?: CrearEvaluacionDocente
  ) => {
    if (!isUserAdmin) {
      toast.warning('Solo los administradores pueden activar o desactivar evaluaciones.');
      return;
    }

    const isActivating = !currentStatus;
    if (isActivating) {
      const targetEval =
        evalObj ||
        (evaluacionDesempeñoDocente || []).find((ev) => (ev.id || (ev as any).uid) === id);

      const tieneFase = Boolean(
        targetEval?.faseNombre?.trim() ||
        (Array.isArray(targetEval?.fases) &&
          targetEval.fases.length > 0 &&
          targetEval.fases.some((f: any) => f?.nombre?.trim()))
      );

      if (!tieneFase) {
        setFaseRequeridaModal({
          isOpen: true,
          evaluacionTitulo: targetEval?.name || 'Evaluación',
          detailUrl: `${baseDetailRoute}/${id}`,
        });
        return;
      }
    }

    try {
      await updateEstadoEvaluacion(id, !currentStatus);
      toast.success(
        !currentStatus
          ? 'Evaluación activada exitosamente para todos los usuarios.'
          : 'Evaluación pausada / desactivada.'
      );
    } catch (error) {
      console.error('Error al cambiar estado de la evaluación:', error);
      toast.error('Error al cambiar estado de la evaluación.');
    }
  };

  const metricasBanner = useMemo(() => {
    const rawList = evaluacionDesempeñoDocente || [];
    // Si no es administrador, calcular sobre el universo de evaluaciones accesibles (activas)
    const list = isUserAdmin ? rawList : rawList.filter((ev) => Boolean(ev.active));
    const total = list.length;
    const activas = rawList.filter((ev) => Boolean(ev.active)).length;
    const inactivas = rawList.length - activas;
    const categoriasSet = new Set<string>();
    list.forEach((ev) => {
      if (ev.categoria) categoriasSet.add(ev.categoria);
    });
    const totalCategorias = categoriasSet.size;

    return { total, activas, inactivas, totalCategorias };
  }, [evaluacionDesempeñoDocente, isUserAdmin]);

  const metricsItems = useMemo<HeroBannerMetricItem[]>(() => {
    if (!isUserAdmin) {
      return [
        {
          id: 'total',
          label: 'Evaluaciones Disponibles',
          value: metricasBanner.total,
          icon: RiBookOpenLine,
          colorTheme: 'blue',
          tooltip: `${metricasBanner.total} instrumentos de evaluación activos y habilitados`,
          badgeText: 'Disponibles',
          helperText: 'Evaluaciones habilitadas',
        },
        {
          id: 'categorias',
          label: 'Categorías',
          value: metricasBanner.totalCategorias,
          icon: RiGraduationCapLine,
          colorTheme: 'amber',
          tooltip: `${metricasBanner.totalCategorias} categorías de rúbricas activas`,
          badgeText: 'Áreas',
          helperText: 'Categorías configuradas',
        },
      ];
    }

    return [
      {
        id: 'total',
        label: 'Evaluaciones',
        value: metricasBanner.total,
        icon: RiBookOpenLine,
        colorTheme: 'blue',
        tooltip: `${metricasBanner.total} instrumentos de evaluación registrados`,
        badgeText: 'Total',
        helperText: 'Instrumentos registrados',
      },
      {
        id: 'activas',
        label: 'Activas',
        value: metricasBanner.activas,
        icon: RiTimeLine,
        colorTheme: 'teal',
        tooltip: `${metricasBanner.activas} evaluaciones habilitadas para calificación`,
        badgeText: 'Habilitadas',
        helperText: 'En curso',
      },
      {
        id: 'inactivas',
        label: 'Inactivas',
        value: metricasBanner.inactivas,
        icon: RiShieldCheckLine,
        colorTheme: 'purple',
        tooltip: `${metricasBanner.inactivas} evaluaciones en borrador o pausadas`,
        badgeText: 'Pausadas',
        helperText: 'En edición',
      },
      {
        id: 'categorias',
        label: 'Categorías',
        value: metricasBanner.totalCategorias,
        icon: RiGraduationCapLine,
        colorTheme: 'amber',
        tooltip: `${metricasBanner.totalCategorias} categorías de rúbricas`,
        badgeText: 'Áreas',
        helperText: 'Categorías configuradas',
      },
    ];
  }, [metricasBanner, isUserAdmin]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Modal de Creación */}
      {showCreateModal && (
        <ModalCrearEvaluacionDesempeno
          idEvaluacion=""
          collectionName={collectionName}
          title={
            collectionName.includes('director')
              ? 'Crear Evaluación de Director'
              : collectionName === 'evaluaciones-docentes' || role === 'director'
              ? 'Crear Evaluación de Docente'
              : 'Crear Evaluación de Especialista'
          }
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Modal de Advertencia cuando no hay fase creada */}
      <ModalAlertaFaseRequerida
        isOpen={faseRequeridaModal.isOpen}
        onClose={() => setFaseRequeridaModal((prev) => ({ ...prev, isOpen: false }))}
        evaluacionTitulo={faseRequeridaModal.evaluacionTitulo}
        detailUrl={faseRequeridaModal.detailUrl}
      />

      {/* Modal de Eliminación */}
      {deleteEvalId && collectionName.includes('director') && (
        <DeleteEvaluacionDirector
          idEva={deleteEvalId}
          handleShowModalDelete={() => setDeleteEvalId(null)}
        />
      )}
      {deleteEvalId && (collectionName === 'evaluaciones-docentes' || role === 'director') && (
        <DeleteEvaluacionDocente
          idEva={deleteEvalId}
          handleShowModalDelete={() => setDeleteEvalId(null)}
        />
      )}
      {deleteEvalId &&
        !collectionName.includes('director') &&
        collectionName !== 'evaluaciones-docentes' &&
        role !== 'director' && (
          <DeleteEvaluacionEspecialista
            idEva={deleteEvalId}
            handleShowModalDelete={() => setDeleteEvalId(null)}
          />
        )}

      {/* Hero Banner Modular Reutilizable para Seguimiento y Retroalimentación */}
      <DesempenoHeroBanner
        routeKey={
          collectionName.includes('director')
            ? 'especialistas_evaluaciones_directores'
            : collectionName === 'evaluaciones-docentes'
            ? 'directores_evaluaciones_docentes'
            : 'admin_evaluaciones_especialistas'
        }
        title={title}
        subtitle={
          collectionName === 'evaluaciones-docentes' || role === 'director'
            ? 'Seguimiento y retroalimentación pedagógica continua al desempeño docente en aula'
            : 'Seguimiento y retroalimentación directiva a la gestión institucional'
        }
        badgeTema={
          collectionName === 'evaluaciones-docentes' || role === 'director'
            ? 'Desempeño Docente'
            : 'Desempeño Directivo'
        }
        metrics={metricsItems}
        actions={
          isUserAdmin ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white text-slate-800 hover:bg-slate-100 hover:text-blue-600 transition-all duration-200 shadow-sm border border-slate-200 cursor-pointer active:scale-95"
                title="Crear nueva evaluación"
              >
                <MdAddCircle className="text-lg text-blue-600" />
                <span className="hidden sm:inline">Nueva Evaluación</span>
              </button>
            </div>
          ) : undefined
        }
      />

      {/* Barra de Filtro y Búsqueda */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <MdSearch className="text-xl text-slate-400" />
        <input
          type="text"
          placeholder="Buscar evaluación por nombre o categoría..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded bg-slate-100"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Contenido / Tabla */}
      {loaderPages ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <RiLoader4Line className="text-4xl text-blue-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-600">Cargando evaluaciones...</p>
        </div>
      ) : filteredEvaluaciones.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-base font-semibold text-slate-700">No se encontraron evaluaciones</p>
          <p className="text-sm text-slate-400 mt-1">
            {search
              ? 'Prueba con otro término de búsqueda.'
              : isUserAdmin
              ? 'Crea una evaluación para comenzar.'
              : 'No hay evaluaciones activas disponibles en este momento.'}
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
                  Nombre del Instrumento
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th scope="col" className="w-40 px-6 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tipo / Estado
                </th>
                {isUserAdmin && (
                  <th scope="col" className="w-32 px-6 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredEvaluaciones.map((evaluacion, index) => {
                const evalId = evaluacion.id || String(index);
                const detailUrl = `${baseDetailRoute}/${evalId}`;

                return (
                  <tr key={evalId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-400">
                      {index + 1}
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={detailUrl}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors block"
                      >
                        {evaluacion.name}
                      </Link>
                      <span className="text-xs text-slate-400">
                        {evaluacion.faseNombre ? `Fase: ${evaluacion.faseNombre}` : 'Sin etapa asignada'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {evaluacion.categoria || 'General'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {isUserAdmin ? (
                        <button
                          type="button"
                          onClick={() => handleToggleActive(evalId, evaluacion.active, evaluacion)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                            evaluacion.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                          title={evaluacion.active ? 'Evaluación activa (Clic para pausar)' : 'Inactiva (Clic para activar)'}
                        >
                          {evaluacion.active ? (
                            <>
                              <MdVisibility className="text-emerald-600" /> Activa
                            </>
                          ) : (
                            <>
                              <MdVisibilityOff className="text-slate-400" /> Inactiva
                            </>
                          )}
                        </button>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            evaluacion.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {evaluacion.active ? (
                            <>
                              <MdVisibility className="text-emerald-600" /> Activa
                            </>
                          ) : (
                            <>
                              <MdVisibilityOff className="text-slate-400" /> Inactiva
                            </>
                          )}
                        </span>
                      )}
                    </td>

                    {isUserAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={detailUrl}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Configurar / Monitorear"
                          >
                            <MdEditSquare className="text-lg" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteEvalId(evalId)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar evaluación"
                          >
                            <MdDeleteForever className="text-lg" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EvaluacionesListContainer;
