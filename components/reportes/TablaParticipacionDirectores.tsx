import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MdSearch, MdClose } from 'react-icons/md';
import {
  regiones,
  regionTexto,
  getAreaTexto,
  getCaracteristicasDirectivoTexto,
  nivelInstitucion
} from '@/fuctions/regiones';
import drawerStyles from './BarChartDirectores.module.css';

interface DirectorData {
  dniDirector: string;
  nombres: string;
  apellidos: string;
  institucion: string;
  region: string | number;
  totalEstudiantes: number;
  participo?: boolean;
  area?: string | number;
  caracteristicaCurricular?: string | number;
  tipoGestion?: string;
  nivelDeInstitucion?: number[] | number | string;
}

interface TablaParticipacionDirectoresProps {
  styles: any;
  directorsDetailRef: React.RefObject<HTMLDivElement>;
  selectedDirectorStatus: 'participo' | 'no_participo' | 'all' | null;
  setSelectedDirectorStatus: (status: 'participo' | 'no_participo' | 'all' | null) => void;
  selectedRegionDirector: string;
  setSelectedRegionDirector: (region: string) => void;
  selectedNivelDirector: string;
  setSelectedNivelDirector: (nivel: string) => void;
  pageSizeDirector: number | 'all';
  setPageSizeDirector: (size: number | 'all') => void;
  searchTermDirector: string;
  setSearchTermDirector: (term: string) => void;
  filteredDirectoresByStatus: DirectorData[];
  directoresStats: { participo: number; no_participo: number; total: number };
}

const getNivelTexto = (nivel: any) => {
  if (Array.isArray(nivel)) {
    const list = nivel
      .map((n) => nivelInstitucion.find((item) => item.id === Number(n))?.name)
      .filter(Boolean);
    return list.map((s) => s!.charAt(0).toUpperCase() + s!.slice(1)).join(', ') || '-';
  }
  if (nivel !== undefined && nivel !== null && nivel !== '') {
    const item = nivelInstitucion.find((i) => i.id === Number(nivel));
    return item ? item.name.charAt(0).toUpperCase() + item.name.slice(1) : String(nivel);
  }
  return '-';
};

const TablaParticipacionDirectores: React.FC<TablaParticipacionDirectoresProps> = ({
  styles,
  directorsDetailRef,
  selectedDirectorStatus,
  setSelectedDirectorStatus,
  selectedRegionDirector,
  setSelectedRegionDirector,
  selectedNivelDirector,
  setSelectedNivelDirector,
  pageSizeDirector,
  setPageSizeDirector,
  searchTermDirector,
  setSearchTermDirector,
  filteredDirectoresByStatus,
  directoresStats,
}) => {
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    setCurrentPage(0);
  }, [pageSizeDirector, selectedRegionDirector, selectedNivelDirector, searchTermDirector, selectedDirectorStatus]);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedDirectorStatus) {
        setSelectedDirectorStatus(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDirectorStatus, setSelectedDirectorStatus]);

  // Función para resaltar el texto buscado
  const highlightText = (text: string, term: string) => {
    if (!term.trim() || !text) return text;
    const parts = String(text).split(new RegExp(`(${term})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === term.toLowerCase() 
            ? <mark key={i} style={{ backgroundColor: '#fde047', color: '#000', padding: '0 2px', borderRadius: '2px' }}>{part}</mark> 
            : part
        )}
      </>
    );
  };

  const totalPages = pageSizeDirector === 'all' 
    ? 1 
    : Math.max(1, Math.ceil(filteredDirectoresByStatus.length / Number(pageSizeDirector)));

  const paginatedDirectores = pageSizeDirector === 'all'
    ? filteredDirectoresByStatus
    : filteredDirectoresByStatus.slice(currentPage * Number(pageSizeDirector), (currentPage + 1) * Number(pageSizeDirector));

  const renderPaginationControls = () => (
    pageSizeDirector !== 'all' && totalPages > 1 && (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '8px 0', borderTop: '1px solid #f1f5f9' }}>
        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
          Mostrando {currentPage * Number(pageSizeDirector) + 1} a {Math.min((currentPage + 1) * Number(pageSizeDirector), filteredDirectoresByStatus.length)} de {filteredDirectoresByStatus.length} directores
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            style={{
              padding: '6px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              backgroundColor: currentPage === 0 ? '#f1f5f9' : '#ffffff',
              color: currentPage === 0 ? '#94a3b8' : '#334155',
              cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            ← Anterior
          </button>
          <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
            Página {currentPage + 1} de {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            style={{
              padding: '6px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              backgroundColor: currentPage >= totalPages - 1 ? '#f1f5f9' : '#ffffff',
              color: currentPage >= totalPages - 1 ? '#94a3b8' : '#334155',
              cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            Siguiente →
          </button>
        </div>
      </div>
    )
  );

  const renderTableContent = () => (
    <>
      <div className={styles.tableResponsive}>
        <table className={styles.customTable}>
          <thead>
            <tr>
              <th>DNI</th>
              <th>Director</th>
              <th>Institución Educativa</th>
              <th>Nivel</th>
              <th>Área</th>
              <th>Característica Curricular</th>
              <th>UGEL / Región</th>
              <th>Tipo Gestión</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredDirectoresByStatus.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  No se encontraron directores que coincidan con la búsqueda o filtros.
                </td>
              </tr>
            ) : (
              paginatedDirectores
                .map((dir, idx) => {
                  const isParticipante = !!dir.participo || (dir.totalEstudiantes > 0);
                  return (
                    <tr key={dir.dniDirector || idx}>
                      <td style={{ fontWeight: '600', color: '#334155', letterSpacing: '0.025em' }}>
                        {highlightText(dir.dniDirector || '', searchTermDirector)}
                      </td>
                      <td style={{ fontWeight: '600', color: '#1e293b' }}>
                        {highlightText(`${dir.nombres} ${dir.apellidos}`, searchTermDirector)}
                      </td>
                      <td style={{ color: '#475569' }}>
                        {highlightText(dir.institucion || '', searchTermDirector)}
                      </td>
                      <td style={{ color: '#475569', fontWeight: '500' }}>
                        {getNivelTexto(dir.nivelDeInstitucion)}
                      </td>
                      <td style={{ color: '#475569' }}>
                        {getAreaTexto(dir.area) || '-'}
                      </td>
                      <td style={{ color: '#475569' }}>
                        {getCaracteristicasDirectivoTexto(dir.caracteristicaCurricular) || '-'}
                      </td>
                      <td style={{ color: '#475569', fontWeight: '500' }}>
                        UGEL {regionTexto(dir.region) || '-'}
                      </td>
                      <td style={{ color: '#475569' }}>
                        {dir.tipoGestion ? dir.tipoGestion.charAt(0).toUpperCase() + dir.tipoGestion.slice(1) : '-'}
                      </td>
                      <td>
                        <span className={isParticipante ? styles.statusBadgeActive : styles.statusBadgePending}>
                          {isParticipante ? 'Participó' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>
      {renderPaginationControls()}
    </>
  );

  return (
    <div ref={directorsDetailRef}>
      {/* FULLSCREEN DRAWER MODAL */}
      {selectedDirectorStatus && mounted && typeof window !== 'undefined' && createPortal(
        <>
          <div className={drawerStyles.drawerBackdrop} onClick={() => setSelectedDirectorStatus(null)} />
          <div className={drawerStyles.drawer}>
            <div className={drawerStyles.drawerHeader}>
              <div>
                <h2 className={drawerStyles.drawerTitle}>
                  {selectedDirectorStatus === 'participo' ? 'Directores que Participaron' : 
                   selectedDirectorStatus === 'no_participo' ? 'Directores que No Participaron (Omisos)' : 
                   'Reporte de Participación de Directores'}
                </h2>
                <p className={drawerStyles.drawerSubtitle}>
                  {selectedRegionDirector !== 'all' && <strong>UGEL {regionTexto(selectedRegionDirector)} | </strong>}
                  Participaron: <strong style={{ color: '#10b981' }}>{directoresStats.participo}</strong> | 
                  No Participaron: <strong style={{ color: '#ef4444' }}>{directoresStats.no_participo}</strong> | 
                  Total: <strong>{directoresStats.total}</strong>
                </p>
              </div>
              <button className={drawerStyles.drawerClose} onClick={() => setSelectedDirectorStatus(null)}>
                <MdClose size={24} /> Cerrar
              </button>
            </div>

            <div className={drawerStyles.drawerBody} style={{ padding: '24px 32px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
                <div className={drawerStyles.drawerSearchGroup} style={{ flex: 1, minWidth: '280px' }}>
                  <MdSearch style={{ color: '#64748b', fontSize: '1.2rem', marginLeft: '12px' }} />
                  <input 
                    type="text" 
                    placeholder="Buscar DNI, Nombre o Institución Educativa..." 
                    className={drawerStyles.drawerSearchInput}
                    value={searchTermDirector}
                    onChange={(e) => setSearchTermDirector(e.target.value)}
                  />
                </div>

                <div className={drawerStyles.drawerFilterGroup}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Nivel:</span>
                  <select 
                    className={drawerStyles.drawerRowsPerPageSelect}
                    value={selectedNivelDirector}
                    onChange={(e) => setSelectedNivelDirector(e.target.value)}
                    style={{ minWidth: '150px' }}
                  >
                    <option value="all">Todos los Niveles</option>
                    {nivelInstitucion.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name.charAt(0).toUpperCase() + n.name.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={drawerStyles.drawerFilterGroup}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>UGEL:</span>
                  <select 
                    className={drawerStyles.drawerRowsPerPageSelect}
                    value={selectedRegionDirector}
                    onChange={(e) => setSelectedRegionDirector(e.target.value)}
                    style={{ minWidth: '160px' }}
                  >
                    <option value="all">Todas las UGEL</option>
                    {regiones.map(r => (
                      <option key={r.id} value={r.id}>UGEL {r.region}</option>
                    ))}
                  </select>
                </div>

                <div className={drawerStyles.drawerFilterGroup}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Filas:</span>
                  <select 
                    className={drawerStyles.drawerRowsPerPageSelect}
                    value={pageSizeDirector}
                    onChange={(e) => setPageSizeDirector(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  >
                    <option value={25}>25 registros</option>
                    <option value={50}>50 registros</option>
                    <option value={100}>100 registros</option>
                    <option value={200}>200 registros</option>
                    <option value="all">Mostrar Todos</option>
                  </select>
                </div>
              </div>

              {renderTableContent()}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* VISTA TRADICIONAL EN PÁGINA (Al fondo si no hay modal activo) */}
      {!selectedDirectorStatus && selectedRegionDirector !== 'all' && (
        <div className={styles.detailCard} style={{ marginTop: '2rem' }}>
          <div className={styles.detailHeader}>
            <div className={styles.detailTitleWrapper}>
              <h3 className={styles.detailTitle}>Reporte de Participación de Directores</h3>
              <span className={styles.detailSubtitle}>
                {selectedRegionDirector !== 'all' && <strong style={{ color: '#1e293b' }}>UGEL {regionTexto(selectedRegionDirector)} | </strong>}
                Participaron: <strong style={{ color: '#10b981' }}>{directoresStats.participo}</strong> | 
                No Participaron: <strong style={{ color: '#ef4444' }}>{directoresStats.no_participo}</strong> | 
                Total: <strong>{directoresStats.total}</strong>
              </span>
            </div>
          </div>
          {renderTableContent()}
        </div>
      )}
    </div>
  );
};

export default TablaParticipacionDirectores;
