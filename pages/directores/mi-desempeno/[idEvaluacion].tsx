import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores';
import { useMiDesempeno, EvaluadoSesion, DominioGroup } from '@/features/hooks/useMiDesempeno';
import {
  MdArrowBack,
  MdPrint,
  MdSchool,
  MdPerson,
  MdCalendarToday,
  MdAccessTime,
  MdCheckCircle,
  MdAssignment,
  MdFilePresent,
  MdLightbulbOutline,
  MdHandshake,
  MdTrendingUp,
} from 'react-icons/md';
import { RiLoader4Line } from 'react-icons/ri';

const DetalleMiDesempenoDirector = () => {
  const router = useRouter();
  const { idEvaluacion, sessionId } = router.query;
  const { currentUserData } = useGlobalContext();

  const { getDetalleEvaluacion, loading, error } = useMiDesempeno({
    collectionName: 'evaluaciones-especialista',
    userDni: currentUserData?.dni,
    autoFetch: false,
  });

  const [detalle, setDetalle] = useState<{
    evaluacion: any;
    sesion: EvaluadoSesion | null;
    grupos: DominioGroup[];
  } | null>(null);

  const [activeEvidenciaModal, setActiveEvidenciaModal] = useState<any | null>(null);

  useEffect(() => {
    if (idEvaluacion && typeof idEvaluacion === 'string') {
      getDetalleEvaluacion(idEvaluacion, typeof sessionId === 'string' ? sessionId : undefined).then(
        (data) => {
          if (data) {
            setDetalle({
              evaluacion: data.evaluacion,
              sesion: data.sesion,
              grupos: data.grupos,
            });
          }
        }
      );
    }
  }, [idEvaluacion, sessionId, getDetalleEvaluacion]);

  const handlePrint = () => {
    window.print();
  };

  const sesion = detalle?.sesion;
  const evaluacion = detalle?.evaluacion;
  const grupos = detalle?.grupos || [];

  return (
    <>
      <Head>
        <title>
          {evaluacion?.name ? `${evaluacion.name} | Mi Desempeño` : 'Detalle de Evaluación | UGEL EVA'}
        </title>
      </Head>

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 print:p-0 print:max-w-none">
        {/* Barra superior de navegación y acciones */}
        <div className="flex items-center justify-between gap-4 print:hidden">
          <Link
            href="/directores/mi-desempeno"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 shadow-sm transition-colors"
          >
            <MdArrowBack className="text-lg" />
            <span>Volver a Mi Desempeño</span>
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <MdPrint className="text-lg" />
            <span>Imprimir Ficha</span>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <RiLoader4Line className="text-4xl text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-600">Cargando detalle de la evaluación...</p>
          </div>
        ) : error || !sesion ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <h3 className="text-lg font-bold text-slate-800">
              No se encontraron registros de esta evaluación
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Verifica el enlace o consulta con tu especialista de la UGEL si la evaluación ya fue
              guardada.
            </p>
            <Link
              href="/directores/mi-desempeno"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl mt-2"
            >
              Volver al listado
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cabecera de la Evaluación */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {sesion.faseNombre || evaluacion?.faseNombre || 'Monitoreo de Gestión'}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Visita N° {sesion.numeroEvaluacion || 1}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                    {evaluacion?.name || sesion.tituloReporte || 'Evaluación de Gestión Directiva'}
                  </h1>

                  {evaluacion?.descripcion && (
                    <p className="text-sm text-slate-500 max-w-3xl">{evaluacion.descripcion}</p>
                  )}
                </div>

                {/* Score Banner */}
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex-shrink-0">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold block uppercase">
                      Puntaje Obtenido
                    </span>
                    <span className="text-3xl font-extrabold text-blue-600">
                      {sesion.calificacion}
                      <span className="text-sm font-semibold text-slate-400 ml-1">pts</span>
                    </span>
                  </div>

                  {sesion.nivelAlcanzado && (
                    <div
                      className="px-3 py-1.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider shadow-sm"
                      style={{ backgroundColor: sesion.colorNivel || '#3b82f6' }}
                    >
                      {sesion.nivelAlcanzado}
                    </div>
                  )}
                </div>
              </div>

              {/* Ficha Técnica de la Visita */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <MdSchool className="text-xl text-blue-600 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Director(a) Evaluado</span>
                    <span className="text-sm font-bold text-slate-800">
                      {currentUserData?.nombres} {currentUserData?.apellidos}
                    </span>
                    <span className="text-xs text-slate-500 block">DNI: {currentUserData?.dni}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <MdPerson className="text-xl text-indigo-600 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Especialista UGEL</span>
                    <span className="text-sm font-bold text-slate-800">
                      {sesion.datosMonitor?.nombres || sesion.datosMonitor?.apellidos
                        ? `${sesion.datosMonitor.nombres || ''} ${sesion.datosMonitor.apellidos || ''}`
                        : 'Especialista UGEL'}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      {sesion.datosMonitor?.cargo || 'MONITOR UGEL'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <MdCalendarToday className="text-xl text-emerald-600 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Fecha de Visita</span>
                    <span className="text-sm font-bold text-slate-800">
                      {sesion.fechaMonitoreo || 'Registrada en sistema'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <MdAccessTime className="text-xl text-amber-600 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Horario de Visita</span>
                    <span className="text-sm font-bold text-slate-800">
                      {sesion.horaInicio ? `${sesion.horaInicio} - ${sesion.horaFinal || ''}` : 'No especificado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desglose de Rúbricas por Dimensión */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <MdAssignment className="text-xl text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800">
                  Desglose de Rúbricas y Criterios Evaluados
                </h2>
              </div>

              {grupos.map((grupo) => (
                <div
                  key={grupo.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
                >
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                      {grupo.nombre}
                    </h3>
                  </div>

                  <div className="divide-y divide-slate-100 p-2 sm:p-4">
                    {grupo.criterios.map((criterio, idx) => {
                      const seleccionada = criterio.alternativas?.find((a) => a.selected);

                      return (
                        <div
                          key={criterio.id || idx}
                          className="p-4 rounded-xl hover:bg-slate-50/70 transition-colors space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                                Criterio {criterio.order || idx + 1}
                              </span>
                              <p className="text-sm font-bold text-slate-800 leading-snug">
                                {criterio.criterio}
                              </p>
                            </div>

                            {/* Puntaje / Nivel del Criterio */}
                            {seleccionada && (
                              <div className="flex items-center gap-2 self-start sm:self-auto bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 flex-shrink-0">
                                <span className="text-xs text-blue-600 font-semibold uppercase">
                                  Nivel {seleccionada.value}
                                </span>
                                <span className="text-sm font-bold text-blue-700">
                                  ({seleccionada.value} pts)
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Alternativa marcada */}
                          {seleccionada ? (
                            <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-xl">
                              <div className="flex items-start gap-2">
                                <MdCheckCircle className="text-emerald-600 text-base mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                                  {seleccionada.descripcion}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">Sin respuesta asignada</p>
                          )}

                          {/* Evidencias adjuntas al criterio */}
                          {criterio.evidencias && criterio.evidencias.length > 0 && (
                            <div className="pt-2 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-slate-500">
                                Evidencias registradas:
                              </span>
                              {criterio.evidencias.map((ev, eIdx) => (
                                <a
                                  key={eIdx}
                                  href={ev.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors border border-indigo-200"
                                >
                                  <MdFilePresent />
                                  <span>{ev.nombre || `Evidencia ${eIdx + 1}`}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Sección de Retroalimentación y Compromisos de la Visita */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2">
                <MdHandshake className="text-2xl text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800">
                  Retroalimentación Formativa y Acuerdos de la UGEL
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Fortalezas / Avances */}
                <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <MdTrendingUp className="text-lg" />
                    <span>Fortalezas y Avances</span>
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {sesion.avancesRetroalimentacion ||
                      sesion.observacionesMonitoreo?.fortalezasObservadas ||
                      'No se registraron fortalezas específicas en este monitoreo.'}
                  </p>
                </div>

                {/* Dificultades / Oportunidades de Mejora */}
                <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                    <MdLightbulbOutline className="text-lg" />
                    <span>Oportunidades de Mejora</span>
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {sesion.dificultadesRetroalimentacion ||
                      sesion.observacionesMonitoreo?.oportunidadesDeMejora ||
                      'Sin observaciones de mejora registradas.'}
                  </p>
                </div>

                {/* Compromisos Acordados */}
                <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                    <MdHandshake className="text-lg" />
                    <span>Compromisos Asumidos</span>
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {sesion.compromisosRetroalimentacion ||
                      sesion.observacionesMonitoreo?.acuerdosYCompomisos ||
                      'Sin compromisos formalizados en la sesión.'}
                  </p>
                </div>
              </div>

              {/* Retroalimentación Dinámica Adicional */}
              {sesion.retroalimentacionDinamica &&
                sesion.retroalimentacionDinamica.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Observaciones Adicionales del Especialista
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sesion.retroalimentacionDinamica.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1"
                        >
                          <span className="text-xs font-bold text-blue-600 uppercase">
                            {item.etiqueta}
                          </span>
                          <p className="text-xs text-slate-700 whitespace-pre-wrap">
                            {item.contenido}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

DetalleMiDesempenoDirector.Auth = PrivateRouteDirectores;

export default DetalleMiDesempenoDirector;
