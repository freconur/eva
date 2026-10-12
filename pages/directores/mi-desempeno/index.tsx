import React, { useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores';
import { useMiDesempeno } from '@/features/hooks/useMiDesempeno';
import {
  MdAssignment,
  MdCheckCircle,
  MdPendingActions,
  MdArrowForward,
  MdSchool,
  MdCalendarToday,
  MdPerson,
  MdInfoOutline,
} from 'react-icons/md';
import {
  RiLoader4Line,
  RiBookOpenLine,
  RiTimeLine,
  RiShieldCheckLine,
  RiGraduationCapLine,
} from 'react-icons/ri';
import {
  DesempenoHeroBanner,
  HeroBannerMetricItem,
} from '@/components/evaluaciones-desempeno';

const MiDesempenoDirector = () => {
  const { currentUserData } = useGlobalContext();

  const { loading, evaluaciones, error } = useMiDesempeno({
    collectionName: 'evaluaciones-especialista',
    userDni: currentUserData?.dni,
    autoFetch: true,
  });

  // Métricas
  const totalEvaluaciones = evaluaciones.length;
  const evaluadas = evaluaciones.filter((e) => e.estado === 'evaluado');
  const totalSesiones = evaluadas.reduce((acc, curr) => acc + curr.sesiones.length, 0);

  const promedioCalificacion =
    totalSesiones > 0
      ? (
          evaluadas.reduce(
            (acc, curr) =>
              acc +
              curr.sesiones.reduce((sAcc, s) => sAcc + (s.calificacion || 0), 0),
            0
          ) / totalSesiones
        ).toFixed(1)
      : '0.0';

  const ultimaSesion = evaluadas[0]?.ultimaSesion;

  const metricsItems = useMemo<HeroBannerMetricItem[]>(() => {
    return [
      {
        id: 'evaluaciones',
        label: 'Evaluaciones',
        value: totalEvaluaciones,
        icon: RiBookOpenLine,
        colorTheme: 'blue',
        tooltip: `${totalEvaluaciones} procesos de evaluación registrados`,
        badgeText: 'Procesos',
        helperText: 'Instrumentos aplicados',
      },
      {
        id: 'visitas',
        label: 'Visitas UGEL',
        value: totalSesiones,
        icon: RiTimeLine,
        colorTheme: 'teal',
        tooltip: `${totalSesiones} visitas y observaciones de gestión institucional`,
        badgeText: 'Visitas',
        helperText: 'Monitoreos UGEL',
      },
      {
        id: 'promedio',
        label: 'Promedio',
        value: `${promedioCalificacion} pts`,
        icon: RiShieldCheckLine,
        colorTheme: 'purple',
        tooltip: `Calificación promedio ponderada: ${promedioCalificacion} puntos`,
        badgeText: 'Rendimiento',
        helperText: 'Puntaje acumulado',
      },
      {
        id: 'logro',
        label: 'Nivel Logro',
        value: ultimaSesion?.nivelAlcanzado || 'Pendiente',
        icon: RiGraduationCapLine,
        colorTheme: 'amber',
        tooltip: `Último nivel de logro: ${ultimaSesion?.nivelAlcanzado || 'Pendiente'}`,
        badgeText: 'Logro',
        helperText: 'Última evaluación',
      },
    ];
  }, [totalEvaluaciones, totalSesiones, promedioCalificacion, ultimaSesion]);

  return (
    <>
      <Head>
        <title>Mi Desempeño Profesional | UGEL EVA</title>
      </Head>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Hero Banner Modular Reutilizable para Seguimiento y Retroalimentación */}
        <DesempenoHeroBanner
          routeKey="directores_mi_desempeno"
          title="MI DESEMPEÑO PROFESIONAL"
          subtitle="Seguimiento reflexivo a la gestión directiva, acuerdos institucionales y compromisos con la UGEL"
          badgeTema="Desempeño Directivo"
          metrics={metricsItems}
          actions={
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-white shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/30 text-indigo-200 flex items-center justify-center text-lg font-bold">
                <MdSchool />
              </div>
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-indigo-200/90 block leading-tight">Director(a)</span>
                <span className="text-xs font-bold text-white block leading-tight">
                  {currentUserData?.nombres} {currentUserData?.apellidos}
                </span>
              </div>
            </div>
          }
        />

        {/* Listado de Evaluaciones */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <RiLoader4Line className="text-4xl text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-600">
              Cargando tu historial de evaluaciones de la UGEL...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        ) : evaluaciones.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto text-3xl">
              <MdAssignment />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              Aún no tienes evaluaciones registradas
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Cuando el Especialista de la UGEL realice una visita de monitoreo a tu gestión institucional,
              los resultados y retroalimentación aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-800 px-1">
              Fichas de Monitoreo y Rúbricas Aplicadas
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {evaluaciones.map((item) => {
                const tieneSesiones = item.sesiones.length > 0;
                const ultSesion = item.ultimaSesion;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {item.faseNombre || 'Monitoreo UGEL'}
                          </span>
                          {tieneSesiones ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <MdCheckCircle className="text-emerald-500" />
                              Evaluado ({item.sesiones.length} {item.sesiones.length === 1 ? 'visita' : 'visitas'})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              <MdPendingActions className="text-amber-500" />
                              Pendiente de Evaluación
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                          {item.name}
                        </h3>
                        {item.descripcion && (
                          <p className="text-xs text-slate-500 line-clamp-2">{item.descripcion}</p>
                        )}
                      </div>

                      {/* Calificación y Acción */}
                      <div className="flex items-center gap-4 self-start lg:self-center">
                        {tieneSesiones && ultSesion ? (
                          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                            <div>
                              <span className="text-xs text-slate-400 block font-medium">Puntaje</span>
                              <span className="text-xl font-extrabold text-blue-600">
                                {ultSesion.calificacion}{' '}
                                <span className="text-xs font-medium text-slate-400">pts</span>
                              </span>
                            </div>

                            {ultSesion.nivelAlcanzado && (
                              <div
                                className="px-2.5 py-1 rounded-lg text-white text-xs font-bold uppercase tracking-wide"
                                style={{ backgroundColor: ultSesion.colorNivel || '#3b82f6' }}
                              >
                                {ultSesion.nivelAlcanzado}
                              </div>
                            )}
                          </div>
                        ) : null}

                        {tieneSesiones ? (
                          <Link
                            href={`/directores/mi-desempeno/${item.id}?sessionId=${ultSesion?.id || ''}`}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                          >
                            <span>Ver Resultados</span>
                            <MdArrowForward className="text-base" />
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-400 text-xs font-semibold rounded-xl cursor-not-allowed"
                          >
                            <MdInfoOutline className="text-base" />
                            <span>Aún sin evaluación</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Si tiene múltiples visitas / sesiones */}
                    {item.sesiones.length > 1 && (
                      <div className="pt-3 border-t border-slate-100">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2">
                          Historial de Visitas de Monitoreo
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {item.sesiones.map((ses, idx) => (
                            <Link
                              key={ses.id || idx}
                              href={`/directores/mi-desempeno/${item.id}?sessionId=${ses.id}`}
                              className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors flex items-center justify-between text-xs"
                            >
                              <div className="space-y-0.5">
                                <span className="font-semibold text-slate-700 block">
                                  {ses.faseNombre || `Visita N° ${ses.numeroEvaluacion || idx + 1}`}
                                </span>
                                <span className="text-slate-400">
                                  {ses.fechaMonitoreo || 'Sin fecha registrada'}
                                </span>
                              </div>
                              <span className="font-bold text-blue-600">{ses.calificacion} pts</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

MiDesempenoDirector.Auth = PrivateRouteDirectores;

export default MiDesempenoDirector;
