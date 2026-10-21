import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  MdSearch,
  MdSchool,
  MdCheckCircle,
  MdAddCircle,
  MdWarning,
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdFirstPage,
  MdLastPage,
  MdClose,
} from 'react-icons/md';
import {
  RiLoader4Line,
  RiTeamLine,
  RiRefreshLine,
  RiFlashlightLine,
  RiTimeLine,
  RiLockLine,
  RiShieldCheckLine,
} from 'react-icons/ri';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase.config';
import { regiones, regionTexto } from '@/fuctions/regiones';
import { User } from '@/features/types/types';

export interface PadronDirectoresUgelTabProps {
  idEvaluacion: string;
  effectiveBasePath: string;
  evaluatedDnisSet: Set<string>;
  isAdmin: boolean;
  currentUserRegion?: number | string;
  selectedUgel?: number | '';
  onSelectedUgelChange?: (newUgelId: number | '') => void;
  cacheDirectoresPorUgel?: Record<number, User[]>;
  onCacheChange?: (newCache: Record<number, User[]>) => void;
  buscarUsuario?: (dni: string, expectedRole?: number | number[]) => Promise<User | null>;
}

export const PadronDirectoresUgelTab: React.FC<PadronDirectoresUgelTabProps> = ({
  idEvaluacion,
  effectiveBasePath,
  evaluatedDnisSet,
  isAdmin,
  currentUserRegion,
  selectedUgel: propSelectedUgel,
  onSelectedUgelChange,
  cacheDirectoresPorUgel: propCache,
  onCacheChange,
  buscarUsuario,
}) => {
  // Estado local para selectedUgel si no se pasa de forma controlada
  const [internalSelectedUgel, setInternalSelectedUgel] = useState<number | ''>(() => {
    if (!isAdmin && currentUserRegion !== undefined && currentUserRegion !== null && currentUserRegion !== '' && !isNaN(Number(currentUserRegion))) {
      return Number(currentUserRegion);
    }
    return '';
  });
  const selectedUgel = propSelectedUgel !== undefined ? propSelectedUgel : internalSelectedUgel;

  // Sincronizar automáticamente la UGEL asignada para especialistas
  useEffect(() => {
    if (!isAdmin && currentUserRegion !== undefined && currentUserRegion !== null && currentUserRegion !== '') {
      const reg = Number(currentUserRegion);
      if (!isNaN(reg) && selectedUgel !== reg) {
        if (onSelectedUgelChange) {
          onSelectedUgelChange(reg);
        } else {
          setInternalSelectedUgel(reg);
        }
      }
    }
  }, [isAdmin, currentUserRegion, selectedUgel, onSelectedUgelChange]);

  // Estado local para el caché si no se pasa de forma controlada
  const [internalCache, setInternalCache] = useState<Record<number, User[]>>({});
  const cacheDirectoresPorUgel = propCache !== undefined ? propCache : internalCache;

  const updateCache = useCallback(
    (updater: (prev: Record<number, User[]>) => Record<number, User[]>) => {
      if (onCacheChange && propCache !== undefined) {
        const next = updater(propCache);
        onCacheChange(next);
      } else {
        setInternalCache(updater);
      }
    },
    [onCacheChange, propCache]
  );

  const [loadingUgel, setLoadingUgel] = useState<boolean>(false);
  const [errorUgel, setErrorUgel] = useState<string | null>(null);

  // Estados para Búsqueda Directa por DNI en Base de Datos
  const [inputDni, setInputDni] = useState<string>('');
  const [isSearchingDni, setIsSearchingDni] = useState<boolean>(false);
  const [dniSearchResult, setDniSearchResult] = useState<{
    searchedDni: string;
    director: User | null;
    wrongRoleUser?: User | null;
  } | null>(null);

  const myRegion = useMemo(() => {
    if (currentUserRegion === undefined || currentUserRegion === null || currentUserRegion === '') {
      return null;
    }
    const num = Number(currentUserRegion);
    return isNaN(num) ? null : num;
  }, [currentUserRegion]);

  const myUgelName = useMemo(() => {
    if (myRegion === null) return '';
    const txt = regionTexto(myRegion);
    return txt ? (txt.startsWith('UGEL') ? txt : `UGEL ${txt}`) : `UGEL ${myRegion}`;
  }, [myRegion]);

  const handleSearchDni = useCallback(
    async (dniToQuery?: string) => {
      const cleanDni = (dniToQuery !== undefined ? dniToQuery : inputDni).trim();
      if (!cleanDni || cleanDni.length < 8) return;

      setIsSearchingDni(true);
      try {
        let user: User | null = null;
        if (buscarUsuario) {
          user = await buscarUsuario(cleanDni);
        } else {
          const q = query(collection(db, 'usuarios'), where('dni', '==', cleanDni));
          const snap = await getDocs(q);
          if (!snap.empty) {
            user = { id: snap.docs[0].id, ...snap.docs[0].data() } as User;
          } else {
            const directSnap = await getDoc(doc(db, 'usuarios', cleanDni));
            if (directSnap.exists()) {
              user = { id: directSnap.id, ...directSnap.data() } as User;
            }
          }
        }

        // En la ruta de evaluaciones-directores, SOLO debe arrojar resultados que sean directores (rol 2)
        const userRole = user ? Number(user.rol ?? user.perfil?.rol) : null;
        const isDirector = userRole === 2;

        if (user && !isDirector) {
          setDniSearchResult({
            searchedDni: cleanDni,
            director: null,
            wrongRoleUser: user,
          });
        } else {
          setDniSearchResult({
            searchedDni: cleanDni,
            director: user,
            wrongRoleUser: null,
          });
        }
      } catch (err) {
        console.error('Error al buscar director por DNI en la base de datos:', err);
        setDniSearchResult({
          searchedDni: cleanDni,
          director: null,
          wrongRoleUser: null,
        });
      } finally {
        setIsSearchingDni(false);
      }
    },
    [inputDni, buscarUsuario]
  );

  const handleDniFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchDni();
  };

  const handleClearDniSearch = () => {
    setInputDni('');
    setDniSearchResult(null);
  };

  // Filtros de búsqueda en memoria y estado de monitoreo
  const [searchPadron, setSearchPadron] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'monitoreado' | 'pendiente'>('all');

  // Paginación en cliente para rendimiento fluido del DOM
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Función para obtener directores de una UGEL (con caché en memoria)
  const fetchDirectoresUgel = useCallback(
    async (ugelId: number, forceRefresh = false) => {
      if (!forceRefresh && cacheDirectoresPorUgel[ugelId]) {
        return;
      }

      setLoadingUgel(true);
      setErrorUgel(null);
      try {
        const usuariosRef = collection(db, 'usuarios');
        const q = query(
          usuariosRef,
          where('rol', '==', 2), // Rol 2: Directores
          where('region', '==', Number(ugelId))
        );
        const snap = await getDocs(q);
        const list: User[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as User);
        });

        // Ordenar alfabéticamente por apellidos
        list.sort((a, b) =>
          (a.apellidos || '').localeCompare(b.apellidos || '', 'es', { sensitivity: 'base' })
        );

        updateCache((prev) => ({
          ...prev,
          [ugelId]: list,
        }));
      } catch (err: any) {
        console.error(`Error al cargar directores de la UGEL ${ugelId}:`, err);
        setErrorUgel(
          'Ocurrió un error al cargar los directores de la base de datos. Por favor, intente nuevamente.'
        );
      } finally {
        setLoadingUgel(false);
      }
    },
    [cacheDirectoresPorUgel, updateCache]
  );

  // Manejar cambio de UGEL (solo administradores pueden elegir la UGEL)
  const handleUgelChange = (newUgelId: number | '') => {
    if (!isAdmin) return;
    if (onSelectedUgelChange) {
      onSelectedUgelChange(newUgelId);
    } else {
      setInternalSelectedUgel(newUgelId);
    }
    setSearchPadron('');
    setFilterStatus('all');
    setCurrentPage(1);
  };

  // Cargar si ya se inicializó con una región por defecto
  useEffect(() => {
    if (selectedUgel && !cacheDirectoresPorUgel[selectedUgel]) {
      fetchDirectoresUgel(selectedUgel);
    }
  }, [selectedUgel, fetchDirectoresUgel, cacheDirectoresPorUgel]);

  // Lista de directores cargados de la UGEL actual
  const currentUgelDirectores = useMemo(() => {
    if (!selectedUgel) return [];
    return cacheDirectoresPorUgel[selectedUgel] || [];
  }, [selectedUgel, cacheDirectoresPorUgel]);

  // Estadísticas de la UGEL cargada
  const statsUgel = useMemo(() => {
    const total = currentUgelDirectores.length;
    let monitoreados = 0;
    currentUgelDirectores.forEach((d) => {
      const dni = String(d.dni || '').trim();
      if (dni && evaluatedDnisSet.has(dni)) {
        monitoreados += 1;
      }
    });
    const pendientes = total - monitoreados;
    return { total, monitoreados, pendientes };
  }, [currentUgelDirectores, evaluatedDnisSet]);

  // Filtrado instantáneo en memoria por texto y estado
  const filteredDirectores = useMemo(() => {
    let result = currentUgelDirectores;

    // Filtro por estado
    if (filterStatus === 'monitoreado') {
      result = result.filter((d) => {
        const dni = String(d.dni || '').trim();
        return dni && evaluatedDnisSet.has(dni);
      });
    } else if (filterStatus === 'pendiente') {
      result = result.filter((d) => {
        const dni = String(d.dni || '').trim();
        return !dni || !evaluatedDnisSet.has(dni);
      });
    }

    // Filtro por término de búsqueda
    const term = searchPadron.toLowerCase().trim();
    if (!term) return result;

    return result.filter((d) => {
      const nombres = (d.nombres || '').toLowerCase();
      const apellidos = (d.apellidos || '').toLowerCase();
      const dni = String(d.dni || '').toLowerCase();
      const institucion = (d.institucion || '').toLowerCase();
      const distrito = (d.distrito || '').toLowerCase();

      return (
        nombres.includes(term) ||
        apellidos.includes(term) ||
        `${nombres} ${apellidos}`.includes(term) ||
        `${apellidos} ${nombres}`.includes(term) ||
        dni.includes(term) ||
        institucion.includes(term) ||
        distrito.includes(term)
      );
    });
  }, [currentUgelDirectores, filterStatus, searchPadron, evaluatedDnisSet]);

  // Reiniciar página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchPadron, filterStatus, selectedUgel, pageSize]);

  // Paginación en cliente
  const totalItems = filteredDirectores.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedDirectores = useMemo(() => {
    return filteredDirectores.slice(startIndex, startIndex + pageSize);
  }, [filteredDirectores, startIndex, pageSize]);

  const selectedUgelName = useMemo(() => {
    if (!selectedUgel) return '';
    const name = regionTexto(selectedUgel);
    if (!name) return `UGEL ${selectedUgel}`;
    return name.startsWith('UGEL') ? name : `UGEL ${name}`;
  }, [selectedUgel]);

  return (
    <div className="space-y-4">
      {/* SECCIÓN 1: BUSCADOR DE DIRECTOR POR DNI EN BASE DE DATOS (CON DETECCIÓN DE ADMIN Y ESPECIALISTA) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base shrink-0 border border-blue-100 shadow-2xs">
              <MdSearch className="text-xl" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Búsqueda de Director por DNI (Base de Datos)
              </h3>
              <p className="text-xs text-slate-500">
                Consulta en tiempo real en la colección de usuarios de la base de datos regional.
              </p>
            </div>
          </div>

          <div>
            {isAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span>Modo Administrador • Acceso Regional</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Modo Especialista • {myUgelName || 'Mi UGEL'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Formulario de Búsqueda por DNI */}
        <form onSubmit={handleDniFormSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              placeholder="Ingrese DNI del director (8 dígitos) para buscar en la base de datos..."
              value={inputDni}
              onChange={(e) => setInputDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
              className="w-full pl-3.5 pr-20 py-2.5 text-sm bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800 placeholder-slate-400 transition-all"
            />
            {inputDni && (
              <button
                type="button"
                onClick={handleClearDniSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isSearchingDni || inputDni.trim().length < 8}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
          >
            {isSearchingDni ? (
              <>
                <RiLoader4Line className="animate-spin text-base" />
                <span>Buscando en BD...</span>
              </>
            ) : (
              <>
                <MdSearch className="text-base" />
                <span>Buscar en Base de Datos</span>
              </>
            )}
          </button>
        </form>

        {/* ESTADOS DEL RESULTADO DE BÚSQUEDA POR DNI */}
        {isSearchingDni && (
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center gap-3">
            <RiLoader4Line className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
            <p className="text-xs font-semibold text-blue-800">
              Consultando en la base de datos de usuarios para el DNI <span className="font-mono font-bold">{inputDni}</span>...
            </p>
          </div>
        )}

        {!isSearchingDni && dniSearchResult && (
          <div>
            {dniSearchResult.wrongRoleUser ? (
              /* USUARIO EXISTE EN BD PERO NO TIENE ROL 2 (DIRECTOR) */
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <MdWarning className="text-xl" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                      El usuario con DNI {dniSearchResult.searchedDni} no está registrado como Director
                    </h4>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Se encontró a{' '}
                      <strong>
                        {dniSearchResult.wrongRoleUser.nombres || ''} {dniSearchResult.wrongRoleUser.apellidos || ''}
                      </strong>
                      , pero su perfil corresponde a{' '}
                      <strong>
                        {Number(dniSearchResult.wrongRoleUser.rol ?? dniSearchResult.wrongRoleUser.perfil?.rol) === 3
                          ? 'Docente (Rol 3)'
                          : `Rol ${dniSearchResult.wrongRoleUser.rol ?? dniSearchResult.wrongRoleUser.perfil?.rol ?? 'N/A'}`}
                      </strong>
                      . En esta ruta de evaluaciones a directores solo se permite buscar y evaluar usuarios con rol de Director (Rol 2).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearDniSearch}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer shrink-0"
                >
                  Cerrar
                </button>
              </div>
            ) : !dniSearchResult.director ? (
              /* NO ENCONTRADO EN BD */
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <MdWarning className="text-xl" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                      No se encontró ningún director con DNI {dniSearchResult.searchedDni} en la base de datos
                    </h4>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Verifique que el número de DNI sea correcto o que el directivo se encuentre registrado en el sistema.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearDniSearch}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer shrink-0"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              /* ENCONTRADO EN BD - DETECCIÓN DE ROL (ADMIN VS ESPECIALISTA) */
              (() => {
                const director = dniSearchResult.director;
                const directorDni = String(director.dni || dniSearchResult.searchedDni).trim();
                const directorName =
                  director.apellidos || director.nombres
                    ? `${director.apellidos || ''} ${director.nombres || ''}`.trim().toUpperCase()
                    : 'DIRECTOR REGISTRADO';
                const institucionName = director.institucion
                  ? `I.E. ${director.institucion}`
                  : 'I.E. No especificada';
                const distritoName = director.distrito ? `Distrito: ${director.distrito}` : '';
                const cargoName = director.cargo || (director.rol === 2 ? 'Director(a)' : 'Directivo');

                const directorRegionNum =
                  director.region !== undefined && director.region !== null && !isNaN(Number(director.region))
                    ? Number(director.region)
                    : null;

                const rawDirectorUgel = directorRegionNum !== null ? regionTexto(directorRegionNum) : '';
                const directorUgelName = rawDirectorUgel
                  ? rawDirectorUgel.startsWith('UGEL')
                    ? rawDirectorUgel
                    : `UGEL ${rawDirectorUgel}`
                  : directorRegionNum !== null
                  ? `UGEL ${directorRegionNum}`
                  : 'Sin UGEL asignada';

                const isMonitoreado = directorDni ? evaluatedDnisSet.has(directorDni) : false;

                // Validación de jurisdicción por rol:
                const isDifferentRegion =
                  !isAdmin &&
                  myRegion !== null &&
                  directorRegionNum !== null &&
                  myRegion !== directorRegionNum;

                const isSameRegion =
                  !isAdmin &&
                  myRegion !== null &&
                  directorRegionNum !== null &&
                  myRegion === directorRegionNum;

                const evalUrl = `${effectiveBasePath}/evaluacion/evaluar-director?idEvaluacion=${idEvaluacion}&idDirector=${directorDni}`;
                const reporteUrl = `${effectiveBasePath}/evaluacion/reporte-director-individual?idDirector=${directorDni}&idEvaluacion=${idEvaluacion}`;

                return (
                  <div
                    className={`rounded-2xl p-4 sm:p-5 border shadow-xs transition-all ${
                      isDifferentRegion
                        ? 'bg-gradient-to-r from-red-50/90 via-rose-50/70 to-red-50/90 border-red-200'
                        : 'bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-emerald-50/60 border-blue-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      {/* Información del Director */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 font-bold shadow-2xs ${
                            isDifferentRegion
                              ? 'bg-red-600 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {isDifferentRegion ? <MdWarning /> : <MdSchool />}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                              {directorName}
                            </h4>

                            {/* Badge de Estado Monitoreado */}
                            {isMonitoreado ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                                <MdCheckCircle className="text-emerald-600 text-xs" />
                                <span>Monitoreado</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                <RiTimeLine className="text-slate-500 text-xs" />
                                <span>Pendiente</span>
                              </span>
                            )}

                            {/* Badge de Detección de Rol */}
                            {isAdmin ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                <RiShieldCheckLine className="text-indigo-600 text-xs" />
                                <span>Acceso Regional (Admin)</span>
                              </span>
                            ) : isSameRegion ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <MdCheckCircle className="text-emerald-600 text-xs" />
                                <span>Su Jurisdicción ({myUgelName})</span>
                              </span>
                            ) : isDifferentRegion ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                                <RiLockLine className="text-red-600 text-xs" />
                                <span>Sin Autorización</span>
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                            <span className="font-mono font-bold text-slate-800">DNI: {directorDni}</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700">{institucionName}</span>
                            {distritoName && (
                              <>
                                <span>•</span>
                                <span>{distritoName}</span>
                              </>
                            )}
                            <span>•</span>
                            <span className="px-2 py-0.5 rounded bg-white/80 border border-slate-200 font-semibold text-slate-700">
                              {directorUgelName}
                            </span>
                            {cargoName && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                {cargoName}
                              </span>
                            )}
                          </div>

                          {/* Mensajes de Jurisdicción por Rol */}
                          {isAdmin ? (
                            <p className="text-xs text-slate-600 pt-0.5">
                              El directivo pertenece a la <strong>{directorUgelName}</strong>. Como <strong>Administrador</strong>, cuenta con autorización para monitorear directores de todas las UGELs de la región.
                            </p>
                          ) : isSameRegion ? (
                            <p className="text-xs text-emerald-700 font-medium pt-0.5">
                              El directivo está adscrito a su jurisdicción (<strong>{myUgelName}</strong>). Está habilitado para realizar el monitoreo.
                            </p>
                          ) : isDifferentRegion ? (
                            <div className="mt-1 p-2.5 bg-red-100/70 border border-red-300 rounded-xl text-xs text-red-900 space-y-0.5">
                              <p className="font-bold flex items-center gap-1">
                                <MdWarning className="text-red-700 text-sm" />
                                <span>Director no pertenece a su UGEL</span>
                              </p>
                              <p className="text-red-800">
                                El director pertenece a la <strong>{directorUgelName}</strong>. Como especialista adscrito a la <strong>{myUgelName}</strong>, únicamente cuenta con autorización para monitorear a directores de su propia UGEL.
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200">
                        {isDifferentRegion ? (
                          <div
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 border border-slate-300 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed select-none"
                            title="Monitoreo bloqueado: El directivo pertenece a otra UGEL"
                          >
                            <RiLockLine className="text-base text-slate-400" />
                            <span>Monitoreo Bloqueado</span>
                          </div>
                        ) : isMonitoreado ? (
                          <div className="flex items-center gap-2">
                            <Link
                              href={evalUrl}
                              className="inline-flex items-center justify-center gap-1 px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                            >
                              <span>Reevaluar Director</span>
                            </Link>
                            <Link
                              href={reporteUrl}
                              className="inline-flex items-center justify-center gap-1 px-3.5 py-2 text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all cursor-pointer"
                            >
                              <span>Ver Reporte</span>
                            </Link>
                          </div>
                        ) : (
                          <Link
                            href={evalUrl}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm shadow-emerald-900/20 transition-all cursor-pointer active:scale-95"
                          >
                            <MdAddCircle className="text-base" />
                            <span>Monitorear Director</span>
                          </Link>
                        )}

                        {/* Botón de acceso rápido a la UGEL en la tabla para Admin */}
                        {isAdmin &&
                          directorRegionNum !== null &&
                          selectedUgel !== directorRegionNum &&
                          onSelectedUgelChange && (
                            <button
                              type="button"
                              onClick={() => handleUgelChange(directorRegionNum)}
                              className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                              title={`Cargar y mostrar el padrón de ${directorUgelName} en la tabla inferior`}
                            >
                              <span>Ver {directorUgelName} en tabla</span>
                            </button>
                          )}

                        <button
                          type="button"
                          onClick={handleClearDniSearch}
                          className="px-2.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}
      </div>

      {/* Barra Superior: Selector de UGEL, Búsqueda en Memoria y Filtros */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Selector de UGEL (Admin) / UGEL Asignada (Especialista) */}
        <div className="flex items-center gap-2">
          <MdSchool className="text-blue-600 text-lg shrink-0" />
          <span className="text-xs font-bold text-slate-700 whitespace-nowrap">UGEL:</span>
          {isAdmin ? (
            <select
              value={selectedUgel}
              onChange={(e) => handleUgelChange(e.target.value ? Number(e.target.value) : '')}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[200px]"
            >
              <option value="">-- Seleccionar UGEL --</option>
              {regiones.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  UGEL {reg.region}
                </option>
              ))}
            </select>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-900 shadow-2xs">
              <span>
                {selectedUgelName ||
                  (currentUserRegion
                    ? `UGEL ${regionTexto(currentUserRegion) || currentUserRegion}`
                    : 'Sin UGEL asignada')}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-200/80 text-blue-800">
                Mi UGEL
              </span>
            </div>
          )}
        </div>

        {/* Buscador Rápido en Memoria (solo activo si hay UGEL seleccionada) */}
        {selectedUgel !== '' && (
          <div className="flex items-center gap-2 flex-1 border-t lg:border-t-0 lg:border-l border-slate-200 pt-2 lg:pt-0 lg:pl-3">
            <MdSearch className="text-xl text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder={`Buscar en ${currentUgelDirectores.length} directores por DNI, nombre, colegio...`}
              value={searchPadron}
              onChange={(e) => setSearchPadron(e.target.value)}
              disabled={loadingUgel}
              className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none disabled:opacity-50"
            />
            {searchPadron && (
              <button
                type="button"
                onClick={() => setSearchPadron('')}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                Limpiar
              </button>
            )}
          </div>
        )}

        {/* Filtro de Estado: Todos / Monitoreados / Pendientes */}
        {selectedUgel !== '' && currentUgelDirectores.length > 0 && (
          <div className="flex items-center gap-2 border-t lg:border-t-0 lg:border-l border-slate-200 pt-2 lg:pt-0 lg:pl-3 flex-wrap">
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({statsUgel.total})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('monitoreado')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  filterStatus === 'monitoreado'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MdCheckCircle className="text-emerald-600 text-xs" />
                <span>Monitoreados ({statsUgel.monitoreados})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('pendiente')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  filterStatus === 'pendiente'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <RiTimeLine className="text-amber-600 text-xs" />
                <span>Pendientes ({statsUgel.pendientes})</span>
              </button>
            </div>

            {/* Botón de refresco manual de la UGEL */}
            <button
              type="button"
              onClick={() => fetchDirectoresUgel(selectedUgel, true)}
              disabled={loadingUgel}
              title="Volver a sincronizar datos de esta UGEL desde Firestore"
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <RiRefreshLine className={`text-base ${loadingUgel ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Indicador de Caché en Memoria Activo */}
      {selectedUgel !== '' && !loadingUgel && currentUgelDirectores.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <RiFlashlightLine className="text-blue-600 text-xs" />
              <span>Memoria activa</span>
            </span>
            <span>
              <strong>{currentUgelDirectores.length}</strong> directores cargados de <strong>{selectedUgelName}</strong>
              {searchPadron || filterStatus !== 'all' ? (
                <> (filtrados: <strong className="text-blue-700">{filteredDirectores.length}</strong>)</>
              ) : null}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span>Mostrar:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-white border border-slate-200 text-xs rounded-lg px-2 py-0.5 text-slate-700 font-semibold cursor-pointer"
            >
              <option value={25}>25 por pág.</option>
              <option value={50}>50 por pág.</option>
              <option value={100}>100 por pág.</option>
            </select>
          </div>
        </div>
      )}

      {/* ESTADO 1: Ninguna UGEL Seleccionada */}
      {selectedUgel === '' && (
        <div className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mb-4 border border-blue-100">
            <RiTeamLine />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {isAdmin ? 'Consulta del Padrón de Directores por UGEL' : 'UGEL no detectada o sin asignar'}
          </h3>
          <p className="text-sm text-slate-500 max-w-lg mb-6 leading-relaxed">
            {isAdmin ? (
              <>
                Para optimizar el rendimiento y evitar lecturas masivas en la base de datos, seleccione
                una de las <strong>14 UGELs</strong> en el menú superior. Los directores se cargarán en
                memoria para permitirle realizar búsquedas instantáneas por DNI, nombres o institución.
              </>
            ) : (
              <>
                No se ha detectado una UGEL configurada en su cuenta de especialista. Por favor, comuníquese
                con el administrador del sistema para que configure su UGEL correspondiente.
              </>
            )}
          </p>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <select
                value=""
                onChange={(e) => e.target.value && handleUgelChange(Number(e.target.value))}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl px-4 py-2.5 shadow-sm transition-all cursor-pointer focus:outline-none"
              >
                <option value="" className="bg-white text-slate-800">
                  Seleccionar UGEL para comenzar...
                </option>
                {regiones.map((reg) => (
                  <option key={reg.id} value={reg.id} className="bg-white text-slate-800">
                    UGEL {reg.region}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* ESTADO 2: Cargando Directores de la UGEL */}
      {selectedUgel !== '' && loadingUgel && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 text-center">
          <RiLoader4Line className="w-10 h-10 animate-spin text-blue-600 mb-3" />
          <h4 className="text-sm font-bold text-slate-800 mb-1">
            Cargando directores de {selectedUgelName}...
          </h4>
          <p className="text-xs text-slate-500">
            Descargando los registros en memoria para permitir búsquedas instantáneas.
          </p>
        </div>
      )}

      {/* ESTADO 3: Error al cargar */}
      {selectedUgel !== '' && !loadingUgel && errorUgel && (
        <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-center">
          <MdWarning className="text-3xl text-red-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-red-800 mb-1">{errorUgel}</h4>
          <button
            type="button"
            onClick={() => fetchDirectoresUgel(selectedUgel, true)}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Reintentar carga
          </button>
        </div>
      )}

      {/* ESTADO 4: UGEL sin directores registrados */}
      {selectedUgel !== '' && !loadingUgel && !errorUgel && currentUgelDirectores.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-slate-200 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <RiTeamLine className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">
            No hay directores registrados en {selectedUgelName}
          </h3>
          <p className="text-xs text-slate-500 max-w-md">
            No se encontraron usuarios con rol de director (rol 2) adscritos a esta UGEL en la base de datos.
          </p>
        </div>
      )}

      {/* ESTADO 5: Búsqueda sin resultados */}
      {selectedUgel !== '' &&
        !loadingUgel &&
        !errorUgel &&
        currentUgelDirectores.length > 0 &&
        filteredDirectores.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-slate-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-3 border border-amber-200">
              <MdSearch className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Sin resultados para los filtros aplicados
            </h3>
            <p className="text-xs text-slate-500 max-w-md mb-4">
              {searchPadron
                ? `Ningún director en ${selectedUgelName} coincide con el término "${searchPadron}".`
                : 'No hay directores con el estado seleccionado.'}
            </p>
            {/^\d{8}$/.test(searchPadron.trim()) && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-center max-w-md">
                <p className="text-xs text-blue-800 mb-2">
                  ¿El director no está registrado en {selectedUgelName}? Puede buscar el DNI{' '}
                  <strong className="font-mono">{searchPadron.trim()}</strong> directamente en toda la base de datos:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setInputDni(searchPadron.trim());
                    handleSearchDni(searchPadron.trim());
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  Buscar DNI {searchPadron.trim()} en Base de Datos
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setSearchPadron('');
                setFilterStatus('all');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Limpiar búsqueda y filtros
            </button>
          </div>
        )}

      {/* TABLA DE RESULTADOS PAGINADA */}
      {selectedUgel !== '' && !loadingUgel && !errorUgel && paginatedDirectores.length > 0 && (
        <div className="space-y-3">
          <div className="overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="w-16 px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      #
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      Director
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      Institución Educativa
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      UGEL / Región
                    </th>
                    <th
                      scope="col"
                      className="w-40 px-4 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      Estado
                    </th>
                    <th
                      scope="col"
                      className="w-44 px-6 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedDirectores.map((director, idx) => {
                    const rowNumber = startIndex + idx + 1;
                    const directorDni = String(director.dni || '').trim();
                    const isMonitoreado = directorDni ? evaluatedDnisSet.has(directorDni) : false;
                    const evalUrl = `${effectiveBasePath}/evaluacion/evaluar-director?idEvaluacion=${idEvaluacion}&idDirector=${directorDni}`;
                    const reporteUrl = `${effectiveBasePath}/evaluacion/reporte-director-individual?idDirector=${directorDni}&idEvaluacion=${idEvaluacion}`;

                    return (
                      <tr key={director.id || directorDni || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-medium text-slate-400">
                          {rowNumber}
                        </td>

                        <td className="px-6 py-3.5">
                          <span className="text-sm font-bold text-slate-800 block">
                            {director.apellidos || director.nombres ? (
                              `${director.apellidos || ''} ${director.nombres || ''}`.trim().toUpperCase()
                            ) : (
                              'Sin nombre registrado'
                            )}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500 font-mono">DNI: {directorDni || 'N/A'}</span>
                            {director.cargo && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                {director.cargo}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-3.5">
                          <span className="text-xs font-semibold text-slate-700 block">
                            {director.institucion ? `I.E. ${director.institucion}` : 'I.E. No especificada'}
                          </span>
                          {director.distrito && (
                            <span className="text-[11px] text-slate-400 block">
                              Distrito: {director.distrito}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap text-center">
                          <span className="inline-block px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg">
                            {regionTexto(director.region) || selectedUgelName}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap text-center">
                          {isMonitoreado ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <MdCheckCircle className="text-emerald-600" />
                              <span>Monitoreado</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              <RiTimeLine className="text-slate-400" />
                              <span>Pendiente</span>
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-3.5 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            {isMonitoreado ? (
                              <>
                                <Link
                                  href={evalUrl}
                                  className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                                >
                                  Reevaluar
                                </Link>
                                <Link
                                  href={reporteUrl}
                                  className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                                >
                                  Reporte
                                </Link>
                              </>
                            ) : (
                              <Link
                                href={evalUrl}
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                              >
                                <MdAddCircle className="text-sm" />
                                <span>Monitorear</span>
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

            {/* Pie de Tabla con Controles de Paginación */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Mostrando <strong>{startIndex + 1}</strong> -{' '}
                <strong>{Math.min(startIndex + pageSize, totalItems)}</strong> de{' '}
                <strong>{totalItems}</strong> directores
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Primera página"
                >
                  <MdFirstPage className="text-base" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Página anterior"
                >
                  <MdKeyboardArrowLeft className="text-base" />
                </button>

                <span className="px-3 py-1 font-semibold text-slate-700">
                  Página {safeCurrentPage} de {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Página siguiente"
                >
                  <MdKeyboardArrowRight className="text-base" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Última página"
                >
                  <MdLastPage className="text-base" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PadronDirectoresUgelTab;
