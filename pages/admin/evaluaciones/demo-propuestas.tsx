import React, { useState, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import {
  MdSearch,
  MdFolder,
  MdFolderOpen,
  MdLayers,
  MdArrowBack,
  MdEdit,
  MdDelete,
  MdAssessment,
  MdChevronRight,
  MdAddCircle,
  MdAccountTree,
  MdDescription
} from 'react-icons/md'
import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'
import styles from './demo-propuestas.module.css'

// Grados oficiales y su mapeo de nivel
const gradosDisponibles = [
  { grado: 12, nombre: 'Inicial 3, 4 y 5 años', nivel: 'inicial' },
  { grado: 1, nombre: '1° Primaria', nivel: 'primaria' },
  { grado: 2, nombre: '2° Primaria', nivel: 'primaria' },
  { grado: 3, nombre: '3° Primaria', nivel: 'primaria' },
  { grado: 4, nombre: '4° Primaria', nivel: 'primaria' },
  { grado: 5, nombre: '5° Primaria', nivel: 'primaria' },
  { grado: 6, nombre: '6° Primaria', nivel: 'primaria' },
  { grado: 7, nombre: '1° Secundaria', nivel: 'secundaria' },
  { grado: 8, nombre: '2° Secundaria', nivel: 'secundaria' },
  { grado: 9, nombre: '3° Secundaria', nivel: 'secundaria' },
  { grado: 10, nombre: '4° Secundaria', nivel: 'secundaria' },
  { grado: 11, nombre: '5° Secundaria', nivel: 'secundaria' }
];

// Helper para convertir grado a nivel y texto
const getNivelTexto = (nivel: string) => {
  if (nivel === 'inicial') return 'Inicial';
  if (nivel === 'primaria') return 'Primaria';
  if (nivel === 'secundaria') return 'Secundaria';
  return 'Otro';
};

// Generador de evaluaciones iniciales de prueba
const getEvaluacionesIniciales = () => [
  {
    id: 'eval-001',
    nombre: 'Evaluación Diagnóstica de Lectura',
    grado: 1,
    mesDelExamen: 'Marzo',
    añoDelExamen: '2026',
    active: true,
    preguntasCount: 15,
    puntuacionConfigurada: true
  },
  {
    id: 'eval-002',
    nombre: 'Evaluación Diagnóstica de Escritura',
    grado: 1,
    mesDelExamen: 'Marzo',
    añoDelExamen: '2026',
    active: true,
    preguntasCount: 12,
    puntuacionConfigurada: true
  },
  {
    id: 'eval-003',
    nombre: 'Control Bimestral de Razonamiento Matemático',
    grado: 2,
    mesDelExamen: 'Mayo',
    añoDelExamen: '2026',
    active: true,
    preguntasCount: 20,
    puntuacionConfigurada: true
  },
  {
    id: 'eval-004',
    nombre: 'Evaluación Intermedia de Comprensión Lectora',
    grado: 7,
    mesDelExamen: 'Julio',
    añoDelExamen: '2026',
    active: false,
    preguntasCount: 10,
    puntuacionConfigurada: false
  },
  {
    id: 'eval-005',
    nombre: 'Evaluación Final de Ciencia y Tecnología',
    grado: 11,
    mesDelExamen: 'Noviembre',
    añoDelExamen: '2026',
    active: false,
    preguntasCount: 25,
    puntuacionConfigurada: true
  },
  {
    id: 'eval-006',
    nombre: 'Prueba de Habilidades Comunicativas',
    grado: 12,
    mesDelExamen: 'Abril',
    añoDelExamen: '2026',
    active: true,
    preguntasCount: 8,
    puntuacionConfigurada: true
  }
];

const EvaluacionesDemo = () => {
  const [vistaActual, setVistaActual] = useState<'explorer' | 'search' | 'sidebar'>('explorer');
  const [evaluaciones, setEvaluaciones] = useState<any[]>(getEvaluacionesIniciales());
  
  // Estado de buscador
  const [searchText, setSearchText] = useState<string>('');

  // Control de Ruta del Explorador (breadcrumbs)
  // [] = Raíz (Inicial, Primaria, Secundaria)
  // ['primaria'] = Nivel seleccionado
  // ['primaria', '1'] = Grado seleccionado
  const [currentPath, setCurrentPath] = useState<string[]>([]);

  // Estado de Sidebar Tree (Propuesta D)
  const [treeOpen, setTreeOpen] = useState<Record<string, boolean>>({ inicial: true, primaria: true, secundaria: true });
  const [selectedTreeGrado, setSelectedTreeGrado] = useState<number | null>(null);

  // Simular 100 evaluaciones de forma masiva
  const simularMasivo = () => {
    const nombresAdicionales = [
      'Evaluación Diagnóstica', 'Control de Medio Término', 'Evaluación Trimestral', 
      'Examen Temático', 'Examen Mensual', 'Simulacro de Preparación'
    ];
    
    const cursos = [
      'Matemática', 'Comunicación y Lectura', 'Ciencia y Tecnología', 'Personal Social', 
      'Historia y Geografía', 'Desarrollo Cívico y Ética'
    ];

    const meses = ['Marzo', 'Abril', 'Mayo', 'Junio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre'];

    const evaluacionesNuevas = [...getEvaluacionesIniciales()];

    for (let i = 0; i < 94; i++) {
      const gradoRandomObj = gradosDisponibles[Math.floor(Math.random() * gradosDisponibles.length)];
      const mesRandom = meses[Math.floor(Math.random() * meses.length)];
      const nombreExamen = `${nombresAdicionales[Math.floor(Math.random() * nombresAdicionales.length)]} de ${cursos[Math.floor(Math.random() * cursos.length)]} - Lote ${i + 1}`;
      
      evaluacionesNuevas.push({
        id: `sim-${100 + i}`,
        nombre: nombreExamen,
        grado: gradoRandomObj.grado,
        mesDelExamen: mesRandom,
        añoDelExamen: '2026',
        active: Math.random() > 0.3,
        preguntasCount: Math.floor(Math.random() * 20) + 5,
        puntuacionConfigurada: Math.random() > 0.15
      });
    }

    setEvaluaciones(evaluacionesNuevas);
    alert('🎉 ¡Se han simulado 100 evaluaciones distribuidas automáticamente en la estructura de carpetas!');
  };

  // Resetear simulación
  const resetearDemo = () => {
    setEvaluaciones(getEvaluacionesIniciales());
    setSearchText('');
    setCurrentPath([]);
    alert('🔄 Playground reiniciado con los datos iniciales.');
  };

  // Eliminar evaluación simulada
  const eliminarEvaluacion = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta evaluación en el Playground?')) {
      setEvaluaciones(prev => prev.filter(eva => eva.id !== id));
    }
  };

  // Alternar estado Activo/Inactivo
  const toggleActiveStatus = (id: string) => {
    setEvaluaciones(prev => prev.map(eva => {
      if (eva.id === id) {
        return { ...eva, active: !eva.active };
      }
      return eva;
    }));
  };

  // --- LÓGICA DEL EXPLORADOR DE CARPETAS ---
  const explorerData = useMemo(() => {
    // Si estamos en la raíz []
    if (currentPath.length === 0) {
      const conteos = { inicial: 0, primaria: 0, secundaria: 0 };
      evaluaciones.forEach(eva => {
        const gradoObj = gradosDisponibles.find(g => g.grado === eva.grado);
        if (gradoObj && gradoObj.nivel in conteos) {
          conteos[gradoObj.nivel as keyof typeof conteos]++;
        }
      });
      return {
        tipo: 'niveles',
        items: [
          { id: 'inicial', nombre: 'Inicial', count: conteos.inicial },
          { id: 'primaria', nombre: 'Primaria', count: conteos.primaria },
          { id: 'secundaria', nombre: 'Secundaria', count: conteos.secundaria }
        ]
      };
    }

    // Si estamos en un nivel específico ['primaria']
    if (currentPath.length === 1) {
      const nivelSel = currentPath[0];
      const gradosDelNivel = gradosDisponibles.filter(g => g.nivel === nivelSel);
      
      const items = gradosDelNivel.map(g => {
        const count = evaluaciones.filter(eva => eva.grado === g.grado).length;
        return {
          id: g.grado.toString(),
          nombre: g.nombre,
          count: count
        };
      });

      return {
        tipo: 'grados',
        items
      };
    }

    // Si estamos en un grado específico ['primaria', '1']
    if (currentPath.length === 2) {
      const gradoSel = Number(currentPath[1]);
      const items = evaluaciones.filter(eva => eva.grado === gradoSel);
      return {
        tipo: 'evaluaciones',
        items
      };
    }

    return { tipo: 'vacio', items: [] };
  }, [evaluaciones, currentPath]);

  // Ir atrás en la ruta del explorador
  const navigateUp = (index: number) => {
    setCurrentPath(prev => prev.slice(0, index));
  };

  // --- LÓGICA DE BÚSQUEDA OMNIPRESENTE AGRUPADA ---
  const resultadosBusquedaAgrupados = useMemo(() => {
    if (!searchText) return {};

    const filtered = evaluaciones.filter(eva => 
      eva.nombre.toLowerCase().includes(searchText.toLowerCase()) || 
      eva.id.toLowerCase().includes(searchText.toLowerCase())
    );

    const agrupacion: Record<string, any[]> = {};

    filtered.forEach(eva => {
      const gradoObj = gradosDisponibles.find(g => g.grado === eva.grado);
      if (gradoObj) {
        const key = `${getNivelTexto(gradoObj.nivel)} / ${gradoObj.nombre}`;
        if (!agrupacion[key]) {
          agrupacion[key] = [];
        }
        agrupacion[key].push(eva);
      }
    });

    return agrupacion;
  }, [evaluaciones, searchText]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Organización de Evaluaciones - Playground</title>
      </Head>

      {/* Botón de Retorno */}
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/admin/evaluaciones" style={{ textDecoration: 'none' }}>
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            color: '#1d4ed8', 
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}>
            <MdArrowBack /> Volver a Evaluaciones Oficiales
          </span>
        </Link>
      </div>

      {/* Cabecera del Playground */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.titleContainer}>
            <h1>Playground: Archivado y Búsqueda Rápida</h1>
            <p>Comprueba cómo organizar cientos de evaluaciones mediante el sistema de carpetas o localízalas al instante con el buscador.</p>
          </div>
          
          <div className={styles.controlPanel}>
            <button onClick={simularMasivo} className={styles.simulateButton}>
              <MdAddCircle /> Simular 100 Evaluaciones
            </button>
            <button onClick={resetearDemo} className={styles.resetButton}>
              Resetear
            </button>
          </div>
        </div>

        {/* Selector de Enfoques */}
        <div className={styles.viewSelector}>
          <button 
            onClick={() => setVistaActual('explorer')} 
            className={`${styles.selectorButton} ${vistaActual === 'explorer' ? styles.selectorButtonActive : ''}`}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <MdFolder /> A: Carpetas
            </span>
          </button>
          <button 
            onClick={() => setVistaActual('search')} 
            className={`${styles.selectorButton} ${vistaActual === 'search' ? styles.selectorButtonActive : ''}`}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <MdSearch /> B: Buscador
            </span>
          </button>
          <button 
            onClick={() => setVistaActual('sidebar')} 
            className={`${styles.selectorButton} ${vistaActual === 'sidebar' ? styles.selectorButtonActive : ''}`}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <MdAccountTree /> C: Sidebar + Panel
            </span>
          </button>
        </div>
      </header>

      {/* --- ENFOQUE A: EXPLORADOR DE CARPETAS --- */}
      {vistaActual === 'explorer' && (
        <section className={styles.explorerContainer}>
          {/* Breadcrumbs de Navegación */}
          <div className={styles.breadcrumbs}>
            <span onClick={() => setCurrentPath([])} className={styles.breadcrumbItem}>
              📁 Evaluaciones 2026
            </span>
            {currentPath.map((path, idx) => {
              const esNivel = idx === 0;
              const label = esNivel 
                ? getNivelTexto(path) 
                : (gradosDisponibles.find(g => g.grado.toString() === path)?.nombre || path);
              
              return (
                <React.Fragment key={idx}>
                  <MdChevronRight className={styles.breadcrumbSeparator} />
                  <span 
                    onClick={() => navigateUp(idx + 1)} 
                    className={styles.breadcrumbItem}
                    style={{ fontWeight: idx === currentPath.length - 1 ? 700 : 500 }}
                  >
                    {label}
                  </span>
                </React.Fragment>
              );
            })}
          </div>

          {/* Renderizado del Contenido del Explorador */}
          {explorerData.tipo === 'niveles' && (
            <div className={styles.folderGrid}>
              {explorerData.items.map(folder => (
                <div 
                  key={folder.id} 
                  className={styles.folderCard}
                  onClick={() => setCurrentPath([folder.id])}
                >
                  <MdFolder className={styles.folderIcon} style={{ color: '#3b82f6' }} />
                  <div className={styles.folderInfo}>
                    <span className={styles.folderName}>{folder.nombre}</span>
                    <span className={styles.folderCount}>{folder.count} evaluaciones</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {explorerData.tipo === 'grados' && (
            <div className={styles.folderGrid}>
              {explorerData.items.map(folder => (
                <div 
                  key={folder.id} 
                  className={styles.folderCard}
                  onClick={() => setCurrentPath([currentPath[0], folder.id])}
                >
                  <MdFolderOpen className={styles.folderIcon} style={{ color: '#f59e0b' }} />
                  <div className={styles.folderInfo}>
                    <span className={styles.folderName}>{folder.nombre}</span>
                    <span className={styles.folderCount}>{folder.count} evaluaciones</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {explorerData.tipo === 'evaluaciones' && (
            <div className={styles.evaluationsListContainer}>
              <div className={styles.tableHeader}>
                <span className={styles.tableTitle}>
                  📄 Evaluaciones en este Grado ({explorerData.items.length})
                </span>
              </div>
              
              {explorerData.items.length > 0 ? (
                <table className={styles.evaluationsTable}>
                  <thead>
                    <tr>
                      <th>Evaluación</th>
                      <th>Mes</th>
                      <th>Preguntas</th>
                      <th>Estado</th>
                      <th>Puntajes</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {explorerData.items.map((eva: any) => (
                      <tr key={eva.id}>
                        <td className={styles.evalName}>{eva.nombre}</td>
                        <td>{eva.mesDelExamen} {eva.añoDelExamen}</td>
                        <td>{eva.preguntasCount}</td>
                        <td>
                          <span 
                            onClick={() => toggleActiveStatus(eva.id)}
                            className={`${styles.badge} ${eva.active ? styles.badgeActive : styles.badgeInactive}`}
                            style={{ cursor: 'pointer' }}
                            title="Haz clic para cambiar estado"
                          >
                            {eva.active ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${eva.puntuacionConfigurada ? styles.badgeActive : styles.badgeInactive}`} style={{ backgroundColor: eva.puntuacionConfigurada ? '#eff6ff' : '#fffbeb', color: eva.puntuacionConfigurada ? '#1d4ed8' : '#d97706' }}>
                            {eva.puntuacionConfigurada ? 'Configurado' : 'Pendiente'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className={styles.actionButton} title="Puntajes"><MdAssessment /></button>
                            <button className={styles.actionButton} title="Editar"><MdEdit /></button>
                            <button onClick={() => eliminarEvaluacion(eva.id)} className={`${styles.actionButton} ${styles.actionButtonDelete}`} title="Eliminar"><MdDelete /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyState}>
                  <MdFolder className={styles.emptyStateIcon} />
                  <h4 className={styles.emptyStateTitle}>Carpeta vacía</h4>
                  <p className={styles.emptyStateText}>No hay evaluaciones programadas en este grado.</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* --- ENFOQUE B: BUSCADOR PREDICTIVO OMNIPRESENTE --- */}
      {vistaActual === 'search' && (
        <section className={styles.spotlightSearchContainer}>
          <div className={styles.searchHeader}>
            <h2>Buscador Spotlight Global</h2>
            <p>Escribe el nombre de un curso, mes o palabra clave. Los resultados se agruparán automáticamente por su ubicación jerárquica.</p>
          </div>

          <div className={styles.searchBarWrapper}>
            <MdSearch className={styles.spotlightIcon} />
            <input
              type="text"
              className={styles.spotlightInput}
              placeholder="Escribe para buscar... (ej: 'lectura', 'matematica', 'entrada', 'final')"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              autoFocus
            />
          </div>

          {searchText ? (
            <div style={{ marginTop: '1rem' }}>
              {Object.keys(resultadosBusquedaAgrupados).length > 0 ? (
                Object.entries(resultadosBusquedaAgrupados).map(([grupo, evs]) => (
                  <div key={grupo} className={styles.searchResultsGroup}>
                    <div className={styles.groupTitle}>
                      <MdFolder /> {grupo}
                    </div>
                    
                    <div className={styles.resultsList}>
                      {evs.map(eva => (
                        <div key={eva.id} className={styles.resultItem}>
                          <div className={styles.resultLeft}>
                            <span className={styles.resultName}>{eva.nombre}</span>
                            <span className={styles.resultPath}>
                              Ubicación: {grupo} • {eva.mesDelExamen} {eva.añoDelExamen}
                            </span>
                          </div>

                          <div className={styles.resultRight}>
                            <span style={{ fontSize: '0.8rem', color: '#64748b', marginRight: '0.5rem' }}>
                              Preguntas: <strong>{eva.preguntasCount}</strong>
                            </span>
                            
                            <span 
                              onClick={() => toggleActiveStatus(eva.id)}
                              className={`${styles.badge} ${eva.active ? styles.badgeActive : styles.badgeInactive}`}
                              style={{ cursor: 'pointer' }}
                              title="Cambiar estado"
                            >
                              {eva.active ? 'Activa' : 'Inactiva'}
                            </span>

                            <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
                              <button className={styles.actionButton} title="Editar"><MdEdit /></button>
                              <button onClick={() => eliminarEvaluacion(eva.id)} className={`${styles.actionButton} ${styles.actionButtonDelete}`} title="Eliminar"><MdDelete /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <MdSearch className={styles.emptyStateIcon} />
                  <h4 className={styles.emptyStateTitle}>Sin coincidencias</h4>
                  <p className={styles.emptyStateText}>No se encontraron evaluaciones con el término de búsqueda &quot;{searchText}&quot;.</p>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.emptyState} style={{ background: '#fafbfc', borderStyle: 'solid' }}>
              <MdSearch className={styles.emptyStateIcon} style={{ opacity: 0.5 }} />
              <h4 className={styles.emptyStateTitle} style={{ color: '#64748b' }}>Escribe algo para empezar a buscar</h4>
              <p className={styles.emptyStateText}>El motor de búsqueda indexará al instante nombres de cursos, evaluaciones, grados e IDs.</p>
            </div>
          )}
        </section>
      )}

      {/* --- ENFOQUE C: SIDEBAR ÁRBOL + PANEL DE DETALLE --- */}
      {vistaActual === 'sidebar' && (
        <section className={styles.sidebarLayout}>
          {/* Panel Izquierdo: Árbol de Navegación */}
          <div className={styles.sidebarPanel}>
            <div className={styles.sidebarTitle}>Explorador</div>
            {['inicial', 'primaria', 'secundaria'].map(nivel => {
              const gradosDelNivel = gradosDisponibles.filter(g => g.nivel === nivel);
              const totalDelNivel = evaluaciones.filter(eva => {
                const g = gradosDisponibles.find(gr => gr.grado === eva.grado);
                return g?.nivel === nivel;
              }).length;
              const isOpen = treeOpen[nivel];

              return (
                <div key={nivel} className={styles.treeGroup}>
                  <button 
                    className={styles.treeNivelButton}
                    onClick={() => setTreeOpen(prev => ({ ...prev, [nivel]: !prev[nivel] }))}
                  >
                    <MdChevronRight className={`${styles.treeNivelIcon} ${isOpen ? styles.treeNivelIconOpen : ''}`} />
                    <span className={styles.treeNivelLabel}>{getNivelTexto(nivel)}</span>
                    <span className={styles.treeNivelCount}>{totalDelNivel}</span>
                  </button>
                  
                  {isOpen && (
                    <div className={styles.treeGradosList}>
                      {gradosDelNivel.map(g => {
                        const count = evaluaciones.filter(eva => eva.grado === g.grado).length;
                        const isActive = selectedTreeGrado === g.grado;
                        return (
                          <div
                            key={g.grado}
                            className={`${styles.treeGradoItem} ${isActive ? styles.treeGradoItemActive : ''}`}
                            onClick={() => setSelectedTreeGrado(g.grado)}
                          >
                            <MdDescription className={styles.treeGradoIcon} />
                            <span>{g.nombre}</span>
                            <span className={styles.treeGradoCount}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Panel Derecho: Detalle de Evaluaciones */}
          <div className={styles.detailPanel}>
            {selectedTreeGrado !== null ? (
              <>
                <div className={styles.detailHeader}>
                  <h3 className={styles.detailTitle}>
                    <MdFolderOpen style={{ color: '#f59e0b' }} />
                    {gradosDisponibles.find(g => g.grado === selectedTreeGrado)?.nombre || 'Grado'}
                  </h3>
                  <span className={styles.detailCount}>
                    {evaluaciones.filter(e => e.grado === selectedTreeGrado).length} evaluaciones
                  </span>
                </div>

                {evaluaciones.filter(e => e.grado === selectedTreeGrado).length > 0 ? (
                  <table className={styles.evaluationsTable}>
                    <thead>
                      <tr>
                        <th>Evaluación</th>
                        <th>Mes</th>
                        <th>Preguntas</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluaciones.filter(e => e.grado === selectedTreeGrado).map(eva => (
                        <tr key={eva.id}>
                          <td className={styles.evalName}>{eva.nombre}</td>
                          <td>{eva.mesDelExamen} {eva.añoDelExamen}</td>
                          <td>{eva.preguntasCount}</td>
                          <td>
                            <span
                              onClick={() => toggleActiveStatus(eva.id)}
                              className={`${styles.badge} ${eva.active ? styles.badgeActive : styles.badgeInactive}`}
                              style={{ cursor: 'pointer' }}
                            >
                              {eva.active ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button className={styles.actionButton}><MdAssessment /></button>
                              <button className={styles.actionButton}><MdEdit /></button>
                              <button onClick={() => eliminarEvaluacion(eva.id)} className={`${styles.actionButton} ${styles.actionButtonDelete}`}><MdDelete /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className={styles.emptyState}>
                    <MdFolder className={styles.emptyStateIcon} />
                    <h4 className={styles.emptyStateTitle}>Carpeta vacía</h4>
                    <p className={styles.emptyStateText}>No hay evaluaciones en este grado.</p>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.detailPlaceholder}>
                <MdAccountTree className={styles.detailPlaceholderIcon} />
                <span className={styles.detailPlaceholderText}>Selecciona un grado del panel izquierdo</span>
                <span className={styles.detailPlaceholderSub}>Haz clic en cualquiera de los grados del árbol de navegación para visualizar sus evaluaciones aquí.</span>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
};

export default EvaluacionesDemo;
EvaluacionesDemo.Auth = PrivateRouteAdmins;
