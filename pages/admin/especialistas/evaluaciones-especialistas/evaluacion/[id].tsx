import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  MdEditSquare,
  MdDelete,
  MdAddCircle,
  MdSettings,
  MdPlaylistAdd,
  MdAssignment,
  MdDescription,
  MdKeyboardArrowDown,
  MdPeople,
  MdToggleOn,
  MdToggleOff,
  MdArrowBack,
  MdCheckCircle,
  MdPendingActions,
  MdSearch,
  MdFilterList,
  MdSchool,
  MdBarChart,
  MdExpandMore,
  MdViewAgenda,
  MdViewList,
} from 'react-icons/md';
import {
  RiAwardLine,
  RiLoader4Line,
  RiTeamLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiPieChartLine,
} from 'react-icons/ri';

import { useGlobalContext } from '@/features/context/GlolbalContext';
import UseEvaluacionEspecialistas from '@/features/hooks/UseEvaluacionEspecialistas';
import useEvaluacionDesempenoBase from '@/features/hooks/useEvaluacionDesempenoBase';
import { PRDocentes, DimensionEspecialista, User } from '@/features/types/types';
import {
  EvaluacionConfigMenu,
  EvaluacionDetalleHeroBanner,
  HeroBannerMetricItem,
} from '@/components/evaluaciones-desempeno/containers';
import { regiones, regionTexto } from '@/fuctions/regiones';
import styles from './index.module.css';

// Modales existentes
import AgregarPreguntasRespuestasEspecialistas from '@/modals/AgregarPreguntasRespuestasEspecialistas';
import UpdatePreguntaRespuestaEspecialistas from '@/modals/updatePrEspecialistas';
import AgregarDimensionEspecialistas from '@/modals/AgregarDimensionEspecialistas';
import UpdateDimensionEspecialistas from '@/modals/UpdateDimensionEspecialistas';
import ConfigurarEscalaEspecialistas from '@/modals/ConfigurarEscalaEspecialistas';
import ConfigurarNivelesEspecialistas from '@/modals/ConfigurarNivelesEspecialistas';
import ConfigurarFaseEspecialistas from '@/modals/ConfigurarFaseEspecialistas';
import ConfigurarDescripcionEspecialistas from '@/modals/ConfigurarDescripcionEspecialistas';
import ConfigurarNivelesPorDominio from '@/modals/ConfigurarNivelesPorDominio';

const EvaluacionDetalleEspecialista = () => {
  const router = useRouter();
  const idEvaluacion = (router.query.id as string) || '';

  const {
    getPreguntaRespuestaDocentes,
    dataEvaluacionDocente,
    currentUserData,
    loaderPages,
    dimensionesEspecialistas,
    evaluadosEspecialista,
  } = useGlobalContext();

  const {
    getPreguntasRespuestasEspecialistas,
    getDataEvaluacion,
    getDimensionesEspecialistas,
    deletePreguntaRespuestaEspecialista,
    deleteDimensionEspecialista,
    getEspecialistasEvaluados,
    updateActivacionEvidencias,
  } = UseEvaluacionEspecialistas();

  const { getParrillaEvaluados } = useEvaluacionDesempenoBase({
    role: 'admin',
    collectionName: 'evaluaciones-especialista',
  });

  // Roles y jurisdicción
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

  const isAdminOrDrep = isAdmin || isDrep;

  // Estados de navegación por pestañas y filtros
  const [activeTab, setActiveTab] = useState<'especialistas' | 'rubrica'>('especialistas');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [searchEspecialista, setSearchEspecialista] = useState<string>('');
  const [filterEstado, setFilterEstado] = useState<'all' | 'evaluados' | 'pendientes'>('all');
  const [especialistasPadron, setEspecialistasPadron] = useState<User[]>([]);
  const [loadingEspecialistas, setLoadingEspecialistas] = useState<boolean>(true);

  // Si el usuario no es Administrador ni DREP, enfocar por defecto la pestaña de rúbrica
  useEffect(() => {
    if (currentUserData && !isAdminOrDrep) {
      setActiveTab('rubrica');
    }
  }, [currentUserData, isAdminOrDrep]);

  // Estados de Modales
  const [showAgregarPreguntas, setShowAgregarPreguntas] = useState<boolean>(false);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [showAgregarDimension, setShowAgregarDimension] = useState<boolean>(false);
  const [showUpdateDimension, setShowUpdateDimension] = useState<boolean>(false);
  const [showConfigurarEscala, setShowConfigurarEscala] = useState<boolean>(false);
  const [showConfigurarNiveles, setShowConfigurarNiveles] = useState<boolean>(false);
  const [showConfigurarNivelesDominio, setShowConfigurarNivelesDominio] = useState<boolean>(false);
  const [initialDimIdForModal, setInitialDimIdForModal] = useState<string | undefined>(undefined);
  const [dimensionToUpdate, setDimensionToUpdate] = useState<DimensionEspecialista>({});
  const [dataUpdate, setDataUpdate] = useState<PRDocentes>({});
  const [showConfigurarFase, setShowConfigurarFase] = useState<boolean>(false);
  const [showConfigurarDescripcion, setShowConfigurarDescripcion] = useState<boolean>(false);

  // Inicialización de región según rol (DREP: 'all', UGEL: region del especialista o 'all' para Admin)
  useEffect(() => {
    if (currentUserData) {
      if (isAdmin || isDrep) {
        if (!selectedRegion) setSelectedRegion('all');
      } else if (currentUserData.region !== undefined && !selectedRegion) {
        setSelectedRegion(String(currentUserData.region));
      }
    }
  }, [currentUserData, isAdmin, isDrep, selectedRegion]);

  // Cargar datos principales de la evaluación
  useEffect(() => {
    if (idEvaluacion) {
      getDataEvaluacion(idEvaluacion);
      getPreguntasRespuestasEspecialistas(idEvaluacion);
      getDimensionesEspecialistas(idEvaluacion);
      getEspecialistasEvaluados(idEvaluacion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idEvaluacion]);

  // Cargar padrón de especialistas (SOLO si el usuario es Administrador o DREP)
  useEffect(() => {
    let isMounted = true;
    const fetchEspecialistas = async () => {
      if (!isAdminOrDrep || !currentUserData?.dni) {
        setLoadingEspecialistas(false);
        return;
      }
      setLoadingEspecialistas(true);
      try {
        const target = selectedRegion && selectedRegion !== 'all' ? selectedRegion : 'all';
        const especialistas = await getParrillaEvaluados('region', target);
        if (isMounted) {
          setEspecialistasPadron(especialistas);
        }
      } catch (error) {
        console.error('Error al cargar especialistas para la evaluación:', error);
      } finally {
        if (isMounted) {
          setLoadingEspecialistas(false);
        }
      }
    };

    if (isAdminOrDrep) {
      fetchEspecialistas();
    } else {
      setLoadingEspecialistas(false);
    }
    return () => {
      isMounted = false;
    };
  }, [selectedRegion, isAdminOrDrep, currentUserData?.dni, getParrillaEvaluados]);

  const userDni = currentUserData?.dni ? String(currentUserData.dni).trim() : '';

  // Evaluaciones de especialistas realizadas exclusivamente por el monitor autenticado
  const misEvaluacionesEspecialistas = useMemo(() => {
    if (!evaluadosEspecialista || evaluadosEspecialista.length === 0 || !userDni) return [];
    return evaluadosEspecialista.filter((ev: any) => {
      const monitorDni = String(
        ev.evaluadorDni ||
        ev.adminDni ||
        ev.datosMonitor?.dni ||
        ev.monitorDni ||
        ''
      ).trim();
      return monitorDni === userDni;
    });
  }, [evaluadosEspecialista, userDni]);

  // Evaluaciones aplicables: si es Administrador o DREP se visualizan todas las evaluaciones globales
  const evaluadosAplicables = useMemo(() => {
    return isAdminOrDrep
      ? (evaluadosEspecialista || [])
      : misEvaluacionesEspecialistas;
  }, [isAdminOrDrep, evaluadosEspecialista, misEvaluacionesEspecialistas]);

  // Mapear especialistas con estado de evaluación
  const especialistasConEstado = useMemo(() => {
    const evaluados = evaluadosAplicables;
    return especialistasPadron.map((especialista) => {
      const espDni = String(especialista.dni || '').trim();
      const evalsRegistradas = evaluados.filter((ev: any) => {
        const evDni = String(
          ev.dni ||
          ev.especialistaDni ||
          ev.evaluadoDni ||
          ev.directorDni ||
          ev.info?.dni ||
          ''
        ).trim();
        return evDni && evDni === espDni;
      });

      // Tomar la evaluación más reciente si existen múltiples
      const evRegistrada = evalsRegistradas.length > 0
        ? [...evalsRegistradas].sort((a: any, b: any) => {
            const timeA = a.fechaCreacion?.seconds || (a.fechaMonitoreo ? new Date(a.fechaMonitoreo).getTime() : 0);
            const timeB = b.fechaCreacion?.seconds || (b.fechaMonitoreo ? new Date(b.fechaMonitoreo).getTime() : 0);
            return timeB - timeA;
          })[0]
        : null;

      return {
        ...especialista,
        evaluacion: evRegistrada || null,
        isEvaluated: !!evRegistrada,
      };
    });
  }, [especialistasPadron, evaluadosAplicables]);

  // Filtrar especialistas por estado (todos / evaluados / pendientes) y búsqueda
  const especialistasFiltrados = useMemo(() => {
    let result = especialistasConEstado;

    if (filterEstado === 'evaluados') {
      result = result.filter((e) => e.isEvaluated);
    } else if (filterEstado === 'pendientes') {
      result = result.filter((e) => !e.isEvaluated);
    }

    if (!searchEspecialista.trim()) return result;
    const query = searchEspecialista.toLowerCase().trim();
    return result.filter((e) => {
      const nombres = (e.nombres || '').toLowerCase();
      const apellidos = (e.apellidos || '').toLowerCase();
      const dni = (e.dni || '').toLowerCase();
      const cargo = (e.cargo || (e as any).caracteristicaCurricular || '').toLowerCase();
      const ugel = (regionTexto(e.region) || '').toLowerCase();
      return (
        nombres.includes(query) ||
        apellidos.includes(query) ||
        dni.includes(query) ||
        cargo.includes(query) ||
        ugel.includes(query)
      );
    });
  }, [especialistasConEstado, filterEstado, searchEspecialista]);

  // Estado para alternar entre vista por UGEL (acordeón) y lista general
  const [modoVista, setModoVista] = useState<'ugel' | 'lista'>('ugel');
  const [expandedUgels, setExpandedUgels] = useState<Set<string>>(new Set());

  // Agrupación de especialistas por UGEL en acordeones
  const gruposPorUgel = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        regionId: number | string;
        nombreUgel: string;
        especialistas: typeof especialistasFiltrados;
        evaluadosCount: number;
        totalCount: number;
        promedio: number;
      }
    >();

    especialistasFiltrados.forEach((esp) => {
      const rawReg = esp.region !== undefined && esp.region !== null ? esp.region : 'SIN_UGEL';
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
          especialistas: [],
          evaluadosCount: 0,
          totalCount: 0,
          promedio: 0,
        });
      }

      const item = map.get(key)!;
      item.especialistas.push(esp);
      item.totalCount += 1;
      if (esp.isEvaluated) {
        item.evaluadosCount += 1;
      }
    });

    // Calcular promedios para especialistas evaluados en cada UGEL
    const list = Array.from(map.values()).map((grupo) => {
      const calificados = grupo.especialistas.filter(
        (e) => e.isEvaluated && e.evaluacion?.calificacion !== undefined && e.evaluacion?.calificacion !== null
      );
      const suma = calificados.reduce((acc, e) => acc + Number(e.evaluacion?.calificacion ?? 0), 0);
      const promedio = calificados.length > 0 ? Math.round((suma / calificados.length) * 10) / 10 : 0;
      return {
        ...grupo,
        promedio,
      };
    });

    return list.sort((a, b) =>
      a.nombreUgel.localeCompare(b.nombreUgel, 'es', { sensitivity: 'base' })
    );
  }, [especialistasFiltrados]);

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

  // Contadores y métricas de progreso
  const totalEspecialistas = especialistasPadron.length;

  const uniqueEvaluadosDnis = useMemo(() => {
    const set = new Set<string>();
    evaluadosAplicables.forEach((ev: any) => {
      const dni = String(
        ev.dni ||
        ev.especialistaDni ||
        ev.evaluadoDni ||
        ev.directorDni ||
        ev.info?.dni ||
        ''
      ).trim();
      if (dni) set.add(dni);
    });
    return set;
  }, [evaluadosAplicables]);

  const evaluadosPadronCount = especialistasConEstado.filter((d) => d.isEvaluated).length;
  const evaluadosCount = totalEspecialistas > 0
    ? (selectedRegion && selectedRegion !== 'all' ? evaluadosPadronCount : Math.max(evaluadosPadronCount, uniqueEvaluadosDnis.size))
    : uniqueEvaluadosDnis.size;
  const pendientesCount = Math.max(0, totalEspecialistas - evaluadosCount);
  const porcentajeAvance =
    totalEspecialistas > 0 ? Math.round((evaluadosCount / totalEspecialistas) * 100) : 0;

  const metricasEspecialistas = useMemo<HeroBannerMetricItem[]>(
    () => [
      {
        id: 'total',
        label: 'Especialistas Asignados',
        value: isAdminOrDrep ? totalEspecialistas : 'Regional / DREP',
        icon: RiTeamLine,
        colorTheme: 'blue',
        badgeText: 'Padrón',
        helperText: 'Especialistas asignados',
        active: activeTab === 'especialistas' && filterEstado === 'all',
        onClick: () => {
          setActiveTab('especialistas');
          setFilterEstado('all');
        },
      },
      {
        id: 'evaluados',
        label: 'Evaluados',
        value: isAdminOrDrep ? evaluadosCount : '-',
        icon: RiShieldCheckLine,
        colorTheme: 'emerald',
        badgeText: 'Finalizados',
        helperText: 'Ver lista de evaluados',
        href: `/admin/especialistas/evaluaciones-especialistas/evaluacion/${idEvaluacion}/evaluados`,
      },
      {
        id: 'pendientes',
        label: 'Pendientes',
        value: isAdminOrDrep ? pendientesCount : '-',
        icon: RiTimeLine,
        colorTheme: 'amber',
        badgeText: 'Por evaluar',
        helperText: 'Pendientes de visita',
        active: activeTab === 'especialistas' && filterEstado === 'pendientes',
        onClick: () => {
          setActiveTab('especialistas');
          setFilterEstado('pendientes');
        },
      },
      {
        id: 'progreso',
        label: 'Progreso Global',
        value: isAdminOrDrep ? `${porcentajeAvance}%` : '-',
        icon: RiPieChartLine,
        colorTheme: 'teal',
        badgeText: 'Avance',
        helperText: 'Cobertura del padrón',
        onClick: () => {
          setActiveTab('especialistas');
        },
      },
    ],
    [
      isAdminOrDrep,
      totalEspecialistas,
      evaluadosCount,
      pendientesCount,
      porcentajeAvance,
      activeTab,
      filterEstado,
      idEvaluacion,
    ]
  );

  // Encontrar nivel alcanzado
  const getNivelEvaluado = (calificacion?: number) => {
    if (calificacion === undefined || !dataEvaluacionDocente?.niveles) return null;
    return dataEvaluacionDocente.niveles.find(
      (n: any) => calificacion >= (n.min || 0) && calificacion <= (n.max || 0)
    );
  };

  // Handlers de Modales
  const handleShowConfigurarNivelesDominio = (dimId?: string) => {
    setInitialDimIdForModal(dimId);
    setShowConfigurarNivelesDominio(!showConfigurarNivelesDominio);
  };
  const handleShowModalPreguntas = () => setShowAgregarPreguntas(!showAgregarPreguntas);
  const handleShowUpdateModal = () => setShowUpdateModal(!showUpdateModal);
  const handleShowModalDimension = () => setShowAgregarDimension(!showAgregarDimension);
  const handleShowUpdateDimension = () => setShowUpdateDimension(!showUpdateDimension);
  const handleShowConfigurarEscala = () => setShowConfigurarEscala(!showConfigurarEscala);
  const handleShowConfigurarNiveles = () => setShowConfigurarNiveles(!showConfigurarNiveles);
  const handleShowConfigurarFase = () => setShowConfigurarFase(!showConfigurarFase);
  const handleShowConfigurarDescripcion = () => setShowConfigurarDescripcion(!showConfigurarDescripcion);

  const handleDeletePregunta = async (idPregunta: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta pregunta?')) {
      await deletePreguntaRespuestaEspecialista(idEvaluacion, idPregunta);
    }
  };

  const handleDeleteDimension = async (idDimension: string) => {
    const dim = dimensionesEspecialistas?.find((d: any) => String(d.id) === String(idDimension));
    const preguntasDeDim = getPreguntaRespuestaDocentes?.filter(
      (p: any) => String(p.dimensionId || p.dimencionId) === String(idDimension)
    ) || [];

    const mensaje =
      preguntasDeDim.length > 0
        ? `¿Está seguro de eliminar el dominio "${dim?.nombre || 'seleccionado'}"?\n\nAdvertencia: Contiene ${preguntasDeDim.length} ${
            preguntasDeDim.length === 1 ? 'criterio pedagógico' : 'criterios pedagógicos'
          } que también se ${
            preguntasDeDim.length === 1 ? 'eliminará' : 'eliminarán'
          } definitivamente de la evaluación.`
        : `¿Está seguro de eliminar el dominio "${dim?.nombre || 'seleccionado'}"?`;

    if (window.confirm(mensaje)) {
      await deleteDimensionEspecialista(idEvaluacion, idDimension);
    }
  };

  const handleToggleEvidencias = async () => {
    if (idEvaluacion) {
      const newStatus = !dataEvaluacionDocente?.activarEvidencias;
      await updateActivacionEvidencias(idEvaluacion, newStatus);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Modales de Configuración */}
      {showUpdateModal && (
        <UpdatePreguntaRespuestaEspecialistas
          id={idEvaluacion}
          dataUpdate={dataUpdate}
          handleShowUpdateModal={handleShowUpdateModal}
        />
      )}
      {showAgregarPreguntas && (
        <AgregarPreguntasRespuestasEspecialistas
          idEvaluacion={idEvaluacion}
          handleShowModalPreguntas={handleShowModalPreguntas}
        />
      )}
      {showAgregarDimension && (
        <AgregarDimensionEspecialistas
          idEvaluacion={idEvaluacion}
          handleShowModalDimension={handleShowModalDimension}
        />
      )}
      {showUpdateDimension && (
        <UpdateDimensionEspecialistas
          idEvaluacion={idEvaluacion}
          dimensionUpdate={dimensionToUpdate}
          handleShowUpdateDimension={handleShowUpdateDimension}
        />
      )}
      {showConfigurarEscala && (
        <ConfigurarEscalaEspecialistas
          idEvaluacion={idEvaluacion}
          escalaActual={dataEvaluacionDocente?.escala}
          handleShowConfigurarEscala={handleShowConfigurarEscala}
        />
      )}
      {showConfigurarNiveles && (
        <ConfigurarNivelesEspecialistas
          idEvaluacion={idEvaluacion}
          nivelesActuales={dataEvaluacionDocente?.niveles}
          handleShowConfigurarNiveles={handleShowConfigurarNiveles}
        />
      )}
      {showConfigurarFase && (
        <ConfigurarFaseEspecialistas
          idEvaluacion={idEvaluacion}
          faseActual={dataEvaluacionDocente?.faseNombre}
          handleShowConfigurarFase={handleShowConfigurarFase}
        />
      )}
      {showConfigurarDescripcion && (
        <ConfigurarDescripcionEspecialistas
          idEvaluacion={idEvaluacion}
          descripcionActual={dataEvaluacionDocente?.descripcion}
          handleShowConfigurarDescripcion={handleShowConfigurarDescripcion}
        />
      )}
      {showConfigurarNivelesDominio && (
        <ConfigurarNivelesPorDominio
          idEvaluacion={idEvaluacion}
          dimensiones={dimensionesEspecialistas || []}
          preguntas={getPreguntaRespuestaDocentes || []}
          escala={dataEvaluacionDocente?.escala || []}
          initialDimensionId={initialDimIdForModal}
          handleShowModal={() => setShowConfigurarNivelesDominio(false)}
        />
      )}

      {/* Banner Principal Modular Reutilizable */}
      <EvaluacionDetalleHeroBanner
        idEvaluacion={idEvaluacion}
        collectionName="evaluaciones-especialista"
        variant={(dataEvaluacionDocente as any)?.bannerVariant || (dataEvaluacionDocente as any)?.variant}
        backHref="/admin/especialistas/evaluaciones-especialistas"
        selectedYear={new Date().getFullYear()}
        institucion={
          isDrep
            ? 'Jurisdicción Regional DREP'
            : `UGEL ${regionTexto(currentUserData?.region) || 'Asignada'}`
        }
        faseNombre={dataEvaluacionDocente?.faseNombre}
        categoria={
          dataEvaluacionDocente?.categoria ||
          'PANEL DE MONITOREO AL DESEMPEÑO DEL ESPECIALISTA'
        }
        title={
          dataEvaluacionDocente?.name
            ? dataEvaluacionDocente.name.toUpperCase()
            : 'EVALUACIÓN DE DESEMPEÑO DEL ESPECIALISTA'
        }
        descripcion={
          dataEvaluacionDocente?.descripcion ||
          'Supervisión, monitoreo y acompañamiento pedagógico a especialistas'
        }
        metricas={metricasEspecialistas}
        backgroundImage={dataEvaluacionDocente?.backgroundImage}
        backgroundImageOpacity={dataEvaluacionDocente?.backgroundImageOpacity ?? 0.25}
        isAdmin={isAdminOrDrep}
        canEditTitleDescription={isAdminOrDrep}
        storageKey="eva_eval_especialista_banner_variant"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/admin/especialistas/evaluaciones-especialistas/evaluacion/reporte?idEvaluacion=${idEvaluacion}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-xs transition-all backdrop-blur-sm cursor-pointer"
              title="Ver reporte por UGEL y analíticas consolidadas"
            >
              <MdBarChart className="text-base text-teal-300" />
              <span>Reporte UGEL</span>
            </Link>

            <EvaluacionConfigMenu
              idEvaluacion={idEvaluacion}
              collectionName="evaluaciones-especialista"
              dimensiones={dimensionesEspecialistas || []}
              preguntas={getPreguntaRespuestaDocentes || []}
              escala={dataEvaluacionDocente?.escala}
              niveles={dataEvaluacionDocente?.niveles || (dataEvaluacionDocente as any)?.nivelYPuntaje}
              activarEvidencias={dataEvaluacionDocente?.activarEvidencias}
              titulo={dataEvaluacionDocente?.name}
              descripcion={dataEvaluacionDocente?.descripcion}
              faseActual={dataEvaluacionDocente?.faseNombre}
              onRefresh={() => getDataEvaluacion(idEvaluacion)}
              onAgregarDominio={handleShowModalDimension}
              onAgregarPreguntas={handleShowModalPreguntas}
            />
          </div>
        }
      />

      {/* Navegación por Pestañas */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('especialistas')}
          className={`flex items-center gap-2 py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'especialistas'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MdPeople className="text-lg" />
          <span>Padrón de Especialistas {isAdminOrDrep ? `(${totalEspecialistas})` : ''}</span>
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
          <span>Estructura de Rúbricas ({getPreguntaRespuestaDocentes?.length ?? 0} Criterios)</span>
        </button>
      </div>

      {/* PESTAÑA 1: PADRÓN DE ESPECIALISTAS */}
      {activeTab === 'especialistas' && (
        !isAdminOrDrep ? (
          <div className="text-center py-16 px-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200/60">
              <MdPeople className="text-2xl" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Padrón reservado para Administradores y DREP</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
              El padrón de especialistas y el registro de sus evaluaciones es gestionado y evaluado por el Administrador y DREP. Puedes consultar la estructura de rúbricas y criterios en la pestaña contigua.
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
            {/* Barra de Filtros y Búsqueda */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              {/* Buscador */}
              <div className="flex items-center gap-2 flex-1">
                <MdSearch className="text-xl text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar especialista por nombre, apellidos, DNI o UGEL..."
                  value={searchEspecialista}
                  onChange={(e) => setSearchEspecialista(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
                />
                {searchEspecialista && (
                  <button
                    type="button"
                    onClick={() => setSearchEspecialista('')}
                    className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded bg-slate-100 transition-colors"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Filtros: Estado (Todos / Evaluados / Pendientes) y UGEL */}
              <div className="flex flex-wrap items-center gap-2.5 sm:border-t lg:border-t-0 lg:border-l border-slate-200 pt-2 lg:pt-0 lg:pl-4">
                {/* Segmento de Estado */}
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
                      {totalEspecialistas}
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

                {/* Selector de UGEL */}
                <div className="flex items-center gap-1.5">
                  <MdFilterList className="text-lg text-purple-600" />
                  <select
                    id="ugel-select"
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">🏛️ Todas las UGELs</option>
                    {regiones.map((reg) => (
                      <option key={reg.id} value={String(reg.id)}>
                        UGEL {reg.region}
                      </option>
                    ))}
                  </select>
                </div>

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
                    title="Lista general de especialistas"
                  >
                    <MdViewList className="text-sm" />
                    <span>Lista General</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 text-slate-700 font-bold">
                      {especialistasFiltrados.length}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabla / Acordeones de Especialistas */}
            {loadingEspecialistas ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
                <RiLoader4Line className="text-4xl text-blue-600 animate-spin mb-3" />
                <p className="text-sm font-medium text-slate-600">Cargando especialistas de la jurisdicción...</p>
              </div>
            ) : especialistasFiltrados.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <p className="text-base font-semibold text-slate-700">
                  {filterEstado === 'evaluados'
                    ? 'No hay especialistas evaluados por usted con los filtros seleccionados'
                    : filterEstado === 'pendientes'
                    ? 'No hay especialistas pendientes con los filtros seleccionados'
                    : 'No se encontraron especialistas'}
                </p>
                <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                  {searchEspecialista || filterEstado !== 'all'
                    ? 'Prueba modificando el término de búsqueda o cambiando el filtro de estado.'
                    : 'No hay especialistas registrados en la UGEL seleccionada.'}
                </p>
                {(searchEspecialista || filterEstado !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchEspecialista('');
                      setFilterEstado('all');
                    }}
                    className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Restablecer filtros
                  </button>
                )}
              </div>
            ) : modoVista === 'ugel' ? (
              /* VISTA ORGANIZADA POR ACORDEONES DE UGEL */
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>
                    Mostrando <strong className="text-slate-700">{gruposPorUgel.length}</strong> UGELs (
                    {especialistasFiltrados.length} especialistas {filterEstado === 'evaluados' ? 'evaluados' : filterEstado === 'pendientes' ? 'pendientes' : 'en total'})
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
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60">
                                {grupo.evaluadosCount} {grupo.evaluadosCount === 1 ? 'evaluado' : 'evaluados'}
                              </span>
                              {grupo.totalCount - grupo.evaluadosCount > 0 && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200/60">
                                  {grupo.totalCount - grupo.evaluadosCount} pendientes
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                                Total: {grupo.totalCount}
                              </span>
                              {grupo.promedio > 0 && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200/60">
                                  Promedio: {grupo.promedio} pts
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Especialistas pedagógicos adscritos a esta jurisdicción
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
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

                      {/* Sub-tabla de Especialistas de la UGEL */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 overflow-x-auto">
                          <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/70">
                              <tr>
                                <th scope="col" className="w-14 px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                  #
                                </th>
                                <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                  Especialista
                                </th>
                                <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                  Cargo
                                </th>
                                <th scope="col" className="w-44 px-4 py-2.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                  Estado
                                </th>
                                <th scope="col" className="w-48 px-4 py-2.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                  Acciones
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white text-sm">
                              {grupo.especialistas.map((especialista, index) => {
                                const evalUrl = `/admin/especialistas/evaluaciones-especialistas/evaluacion/evaluar-especialista?id=${idEvaluacion}&idDirector=${especialista.dni}`;
                                const sessionParam = especialista.evaluacion?.id ? `&sessionId=${especialista.evaluacion.id}` : '';
                                const reporteUrl = `/admin/especialistas/evaluaciones-especialistas/evaluacion/reporte-especialista-individual?idEvaluacion=${idEvaluacion}&idDirector=${especialista.dni}${sessionParam}`;
                                const nivel = getNivelEvaluado(especialista.evaluacion?.calificacion);

                                return (
                                  <tr key={especialista.dni || index} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-400">
                                      {index + 1}
                                    </td>

                                    <td className="px-4 py-3">
                                      <span className="text-sm font-bold text-slate-800 block">
                                        {especialista.nombres} {especialista.apellidos}
                                      </span>
                                      <span className="text-xs text-slate-500 font-mono">DNI: {especialista.dni}</span>
                                    </td>

                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                                        <MdSchool className="text-slate-400" />
                                        <span>{especialista.cargo || 'Especialista de UGEL'}</span>
                                      </div>
                                      {especialista.celular && (
                                        <div className="text-xs text-slate-400 mt-0.5">Cel: {especialista.celular}</div>
                                      )}
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                      {especialista.isEvaluated ? (
                                        <div className="inline-flex flex-col items-center gap-1">
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <MdCheckCircle className="text-emerald-600" />
                                            Evaluado ({especialista.evaluacion?.calificacion ?? 0} pts)
                                          </span>
                                          {nivel?.nivel && (
                                            <span className="text-[11px] font-semibold text-slate-500">
                                              {nivel.nivel}
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                          <MdPendingActions className="text-amber-500" />
                                          Pendiente
                                        </span>
                                      )}
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <Link
                                          href={evalUrl}
                                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                                            especialista.isEvaluated
                                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                          }`}
                                        >
                                          {especialista.isEvaluated ? 'Reevaluar' : 'Evaluar'}
                                        </Link>

                                        {especialista.isEvaluated && (
                                          <Link
                                            href={reporteUrl}
                                            className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
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
                  );
                })}
              </div>
            ) : (
              /* VISTA GENERAL / PLANA */
              <div className="overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="w-14 px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        #
                      </th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Especialista
                      </th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        UGEL / Cargo
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
                    {especialistasFiltrados.map((especialista, index) => {
                      const evalUrl = `/admin/especialistas/evaluaciones-especialistas/evaluacion/evaluar-especialista?id=${idEvaluacion}&idDirector=${especialista.dni}`;
                      const sessionParam = especialista.evaluacion?.id ? `&sessionId=${especialista.evaluacion.id}` : '';
                      const reporteUrl = `/admin/especialistas/evaluaciones-especialistas/evaluacion/reporte-especialista-individual?idEvaluacion=${idEvaluacion}&idDirector=${especialista.dni}${sessionParam}`;
                      const nivel = getNivelEvaluado(especialista.evaluacion?.calificacion);

                      return (
                        <tr key={especialista.dni || index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-400">
                            {index + 1}
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-slate-800 block">
                              {especialista.nombres} {especialista.apellidos}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">DNI: {especialista.dni}</span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                              <MdSchool className="text-slate-400" />
                              <span>{especialista.cargo || 'Especialista de UGEL'}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">
                                UGEL {regionTexto(especialista.region) || '-'}
                              </span>
                              {especialista.celular && (
                                <span className="text-xs text-slate-400">Cel: {especialista.celular}</span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {especialista.isEvaluated ? (
                              <div className="inline-flex flex-col items-center gap-1">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <MdCheckCircle className="text-emerald-600" />
                                  Evaluado ({especialista.evaluacion?.calificacion ?? 0} pts)
                                </span>
                                {nivel?.nivel && (
                                  <span className="text-[11px] font-semibold text-slate-500">
                                    {nivel.nivel}
                                  </span>
                                )}
                              </div>
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
                                  especialista.isEvaluated
                                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                }`}
                              >
                                {especialista.isEvaluated ? 'Reevaluar' : 'Evaluar'}
                              </Link>

                              {especialista.isEvaluated && (
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

      {/* PESTAÑA 2: ESTRUCTURA DE RÚBRICAS */}
      {activeTab === 'rubrica' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-800">Criterios de la Ficha</h3>
              <p className="text-xs text-slate-500">
                Organiza los dominios y criterios de evaluación para el monitoreo.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShowModalDimension}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors"
              >
                <MdAddCircle className="text-base" />
                <span>Agregar Dominio</span>
              </button>
              <button
                type="button"
                onClick={handleShowModalPreguntas}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
              >
                <MdPlaylistAdd className="text-base" />
                <span>Agregar Preguntas</span>
              </button>
            </div>
          </div>

          {loaderPages ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
              <RiLoader4Line className="text-4xl text-blue-600 animate-spin mb-3" />
              <p className="text-sm font-medium text-slate-600">Cargando criterios de la evaluación...</p>
            </div>
          ) : (
            <div className={styles.preguntasContainer}>
              {dimensionesEspecialistas?.map((dimension) => {
                const preguntasDeDimension = getPreguntaRespuestaDocentes?.filter(
                  (pq) => pq.dimensionId === dimension.id
                );

                return (
                  <div key={dimension.id} className={styles.dimensionSection}>
                    <h2 className={styles.dimensionTitle}>
                      {dimension.nombre}
                      <div
                        className={styles.editButton}
                        style={{ marginLeft: '1rem', display: 'inline-flex' }}
                        title="Editar nombre del dominio"
                      >
                        <MdEditSquare
                          onClick={() => {
                            setDimensionToUpdate(dimension);
                            handleShowUpdateDimension();
                          }}
                        />
                      </div>
                      <div
                        className={styles.editButton}
                        style={{ marginLeft: '0.4rem', display: 'inline-flex' }}
                        title="Configurar niveles de logro de este dominio"
                      >
                        <RiAwardLine
                          style={{ color: '#2563eb', cursor: 'pointer', fontSize: '1.25rem' }}
                          onClick={() => handleShowConfigurarNivelesDominio(dimension.id)}
                        />
                      </div>
                      {preguntasDeDimension?.length === 0 && (
                        <div
                          className={styles.deleteButton}
                          style={{ marginLeft: '0.4rem', display: 'inline-flex' }}
                          title="Eliminar dominio"
                        >
                          <MdDelete onClick={() => dimension.id && handleDeleteDimension(dimension.id)} />
                        </div>
                      )}
                    </h2>
                    <ul className={styles.preguntasList}>
                      {preguntasDeDimension?.length === 0 && (
                        <li className={styles.preguntaItem} style={{ opacity: 0.6, borderStyle: 'dashed' }}>
                          <p className={styles.preguntaTitle}>Sin preguntas en este dominio aún.</p>
                        </li>
                      )}
                      {preguntasDeDimension?.map((pq, index) => (
                        <li key={pq.id || index} className={styles.preguntaItem}>
                          <div className={styles.preguntaHeader}>
                            <p className={styles.preguntaNumber}>{index + 1}.</p>
                            <h3 className={styles.preguntaTitle}>{pq.criterio}</h3>
                            <div className={styles.editButton}>
                              <MdEditSquare
                                onClick={() => {
                                  handleShowUpdateModal();
                                  setDataUpdate(pq);
                                }}
                              />
                            </div>
                            <div className={styles.deleteButton}>
                              <MdDelete onClick={() => handleDeletePregunta(`${pq.id}`)} />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

              {/* Preguntas sin dominio asignado */}
              {getPreguntaRespuestaDocentes?.some((pq) => !pq.dimensionId) && (
                <div className={styles.dimensionSection}>
                  <h2 className={styles.dimensionTitle}>Sin Dominio Asignado</h2>
                  <ul className={styles.preguntasList}>
                    {getPreguntaRespuestaDocentes
                      ?.filter((pq) => !pq.dimensionId)
                      ?.map((pq, index) => (
                        <li key={pq.id || index} className={styles.preguntaItem}>
                          <div className={styles.preguntaHeader}>
                            <p className={styles.preguntaNumber}>{index + 1}.</p>
                            <h3 className={styles.preguntaTitle}>{pq.criterio}</h3>
                            <div className={styles.editButton}>
                              <MdEditSquare
                                onClick={() => {
                                  handleShowUpdateModal();
                                  setDataUpdate(pq);
                                }}
                              />
                            </div>
                            <div className={styles.deleteButton}>
                              <MdDelete onClick={() => handleDeletePregunta(`${pq.id}`)} />
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EvaluacionDetalleEspecialista;
