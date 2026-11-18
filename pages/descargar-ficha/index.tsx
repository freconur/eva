import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  MdDownload,
  MdCheckCircle,
  MdWarning,
  MdSchool,
  MdPerson,
  MdAutoGraph,
  MdOutlineVerified,
} from 'react-icons/md';
import { RiLoader4Line } from 'react-icons/ri';
import type { EstudianteEvolutivoPDFProps } from '@/features/utils/exportarFichaEvolutivaEstudiantePDF';

export default function DescargarFichaPublicPage() {
  const router = useRouter();
  const { dni, evalId, token } = router.query;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [propsEstudiante, setPropsEstudiante] = useState<EstudianteEvolutivoPDFProps | null>(null);
  const [isCompilingPdf, setIsCompilingPdf] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const hasAutoDownloaded = useRef<boolean>(false);

  // 1. Consultar la API segura con el token del QR
  useEffect(() => {
    if (!router.isReady) return;

    if (!dni || !evalId || !token) {
      setError(
        'El enlace escaneado está incompleto. Por favor vuelve a escanear el código QR impreso en la ficha.'
      );
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/descargar-ficha?dni=${encodeURIComponent(
            String(dni)
          )}&evalId=${encodeURIComponent(String(evalId))}&token=${encodeURIComponent(
            String(token)
          )}`
        );

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(
            data?.error || 'No se pudo obtener la información de la ficha del estudiante.'
          );
        }

        setPropsEstudiante(data.props);
      } catch (err: any) {
        console.error('Error al consultar ficha:', err);
        setError(err?.message || 'Error al conectar con el servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router.isReady, dni, evalId, token]);

  // 2. Función para compilar y descargar el PDF oficial
  const handleDownloadPdf = async (customProps?: EstudianteEvolutivoPDFProps) => {
    const targetProps = customProps || propsEstudiante;
    if (!targetProps || isCompilingPdf) return;

    try {
      setIsCompilingPdf(true);
      const { exportarFichaEvolutivaEstudiantePDF } = await import(
        '@/features/utils/exportarFichaEvolutivaEstudiantePDF'
      );
      await exportarFichaEvolutivaEstudiantePDF(targetProps);
      setDownloadSuccess(true);
    } catch (err: any) {
      console.error('Error al generar PDF en el celular:', err);
    } finally {
      setIsCompilingPdf(false);
    }
  };

  // 3. Auto-descarga al estar listos los datos
  useEffect(() => {
    if (propsEstudiante && !hasAutoDownloaded.current) {
      hasAutoDownloaded.current = true;
      // Breve retardo para permitir renderizar la interfaz antes de invocar la descarga
      const timer = setTimeout(() => {
        handleDownloadPdf(propsEstudiante);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [propsEstudiante]);

  const estudiante = propsEstudiante?.estudiante;
  const evaluacion = propsEstudiante?.evaluacionActual;

  return (
    <>
      <Head>
        <title>
          {estudiante?.nombres
            ? `Ficha de Progreso - ${estudiante.nombres} ${estudiante.apellidos}`
            : 'Ficha de Progreso del Estudiante'}
        </title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </Head>

      <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between py-6 px-4 sm:px-6">
        <div className="w-full max-w-md mx-auto space-y-4">
          {/* Cabecera institucional sobria */}
          <header className="text-center pt-2 pb-1">
            <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-blue-50 text-blue-600 mb-2.5 shadow-2xs">
              <MdAutoGraph className="w-7 h-7" />
            </div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
              Evaluación de Aprendizajes
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Ficha Oficial de Progreso y Evolución Pedagógica
            </p>
          </header>

          {/* Estado de Carga */}
          {loading && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs text-center flex flex-col items-center justify-center">
              <RiLoader4Line className="w-9 h-9 text-blue-600 animate-spin mb-3" />
              <h2 className="text-sm font-bold text-slate-800">
                Verificando credenciales oficiales
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Cargando el informe pedagógico del estudiante desde el servidor institucional...
              </p>
            </div>
          )}

          {/* Estado de Error */}
          {!loading && error && (
            <div className="bg-rose-50 rounded-2xl border border-rose-200 p-6 shadow-xs text-center flex flex-col items-center">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-full mb-2.5">
                <MdWarning className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-rose-900 mb-1">
                No se pudo validar el enlace
              </h2>
              <p className="text-xs text-rose-700 leading-relaxed mb-4">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer"
              >
                Volver a intentar
              </button>
            </div>
          )}

          {/* Información del Estudiante y Acción de Descarga */}
          {!loading && !error && propsEstudiante && (
            <main className="space-y-4 animate-fadeIn">
              {/* Tarjeta de Identificación del Alumno */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-13 h-16 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {estudiante?.fotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={estudiante.fotoUrl}
                        alt="Foto carnet"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <MdPerson className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-0.5">
                      Estudiante Evaluado
                    </span>
                    <h2 className="text-base font-extrabold text-slate-900 leading-snug">
                      {estudiante?.apellidos}, {estudiante?.nombres}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      DNI: <span className="font-bold text-slate-700">{estudiante?.dni}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Institución
                    </span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {propsEstudiante.nombreColegio || 'I.E. Oficial'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Grado y Sección
                    </span>
                    <span className="font-semibold text-slate-800 block">
                      {evaluacion?.grado
                        ? `${evaluacion.grado}° Grado`
                        : 'Grado regular'}{' '}
                      {estudiante?.seccion ? `"${estudiante.seccion}"` : ''}
                    </span>
                  </div>
                </div>

                {/* Resumen de etapas evaluadas */}
                {propsEstudiante.historialEtapas && propsEstudiante.historialEtapas.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1.5">
                      Progreso de Evaluaciones
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      {propsEstudiante.historialEtapas.map((etapa) => (
                        <div
                          key={`etapa-${etapa.etapaKey}`}
                          className="p-1.5 rounded-lg bg-slate-50 border border-slate-100"
                        >
                          <span className="text-[9px] font-bold text-slate-600 uppercase block">
                            {etapa.label?.match(/^(EDI|EP1|EP2)/i)?.[1] || etapa.label?.substring(0, 5)}
                          </span>
                          <span className="text-xs font-black text-slate-800 block mt-0.5">
                            {etapa.puntaje} pts
                          </span>
                          <span className="text-[9px] font-medium text-emerald-700 block truncate capitalize">
                            {etapa.nivel || 'Logro'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Botón Principal de Descarga */}
              <div className="bg-white rounded-2xl border border-blue-100 p-5 shadow-xs text-center">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf()}
                  disabled={isCompilingPdf}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isCompilingPdf ? (
                    <>
                      <RiLoader4Line className="w-5 h-5 animate-spin" />
                      <span>Generando archivo PDF...</span>
                    </>
                  ) : downloadSuccess ? (
                    <>
                      <MdCheckCircle className="w-5 h-5 text-emerald-300" />
                      <span>Descargar nuevamente PDF</span>
                    </>
                  ) : (
                    <>
                      <MdDownload className="w-5 h-5" />
                      <span>Descargar Ficha en PDF (Oficial)</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
                  {downloadSuccess
                    ? '✓ Tu archivo fue descargado. Si no se abrió automáticamente, puedes presionar el botón de arriba.'
                    : 'La descarga comenzará automáticamente. Puedes pulsar el botón si tu teléfono la bloqueó.'}
                </p>
              </div>

              {/* Consejo de lectura en celular */}
              <div className="bg-blue-50/70 rounded-2xl border border-blue-100 p-4 text-xs text-blue-900 leading-relaxed flex items-start gap-2.5">
                <MdSchool className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Consejo para el padre de familia:</strong> Al abrir el PDF en tu celular,
                  puedes pellizcar la pantalla con dos dedos (zoom) para ver con total nitidez cada una
                  de las actuaciones y recomendaciones pedagógicas.
                </p>
              </div>
            </main>
          )}
        </div>

        {/* Pie de página institucional */}
        <footer className="w-full max-w-md mx-auto text-center pt-6 pb-2">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
            <MdOutlineVerified className="w-4 h-4 text-emerald-600" />
            <span>Documento Oficial Verificado • UGEL</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Plataforma EVA — Monitoreo de Aprendizajes
          </p>
        </footer>
      </div>
    </>
  );
}
