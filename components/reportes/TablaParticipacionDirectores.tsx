import React from 'react';
import { MdSearch } from 'react-icons/md';
import { regiones, regionTexto } from '@/fuctions/regiones';

interface DirectorData {
  dniDirector: string;
  nombres: string;
  apellidos: string;
  institucion: string;
  region: string | number;
  totalEstudiantes: number;
  participo?: boolean;
}

interface TablaParticipacionDirectoresProps {
  styles: any;
  directorsDetailRef: React.RefObject<HTMLDivElement>;
  selectedDirectorStatus: 'participo' | 'no_participo' | 'all' | null;
  setSelectedDirectorStatus: (status: 'participo' | 'no_participo' | 'all' | null) => void;
  selectedRegionDirector: string;
  setSelectedRegionDirector: (region: string) => void;
  pageSizeDirector: number | 'all';
  setPageSizeDirector: (size: number | 'all') => void;
  searchTermDirector: string;
  setSearchTermDirector: (term: string) => void;
  filteredDirectoresByStatus: DirectorData[];
  directoresStats: { participo: number; no_participo: number; total: number };
}

const TablaParticipacionDirectores: React.FC<TablaParticipacionDirectoresProps> = ({
  styles,
  directorsDetailRef,
  selectedDirectorStatus,
  setSelectedDirectorStatus,
  selectedRegionDirector,
  setSelectedRegionDirector,
  pageSizeDirector,
  setPageSizeDirector,
  searchTermDirector,
  setSearchTermDirector,
  filteredDirectoresByStatus,
  directoresStats,
}) => {
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

  return (
    <div ref={directorsDetailRef} style={{ marginTop: '2rem' }}>
      {(selectedDirectorStatus || selectedRegionDirector !== 'all') && (
        <div className={styles.detailCard}>
          <div className={styles.detailHeader}>
            <div className={styles.detailTitleWrapper}>
              <h3 className={styles.detailTitle}>
                {selectedDirectorStatus === 'participo' ? 'Directores que Participaron' : 
                 selectedDirectorStatus === 'no_participo' ? 'Directores que No Participaron (Omisos)' : 
                 'Reporte de Participación de Directores'}
              </h3>
              <span className={styles.detailSubtitle}>
                {selectedRegionDirector !== 'all' && <strong style={{ color: '#1e293b' }}>UGEL {regionTexto(selectedRegionDirector)} | </strong>}
                Participaron: <strong style={{ color: '#10b981' }}>{directoresStats.participo}</strong> | 
                No Participaron: <strong style={{ color: '#ef4444' }}>{directoresStats.no_participo}</strong> | 
                Total: <strong>{directoresStats.total}</strong>
              </span>
            </div>
            <div className={styles.detailActions}>
              <div className={styles.filterWrapper}>
                <select 
                  className={styles.limitSelect}
                  value={pageSizeDirector}
                  onChange={(e) => setPageSizeDirector(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                >
                  <option value={50}>50 registros</option>
                  <option value={100}>100 registros</option>
                  <option value={200}>200 registros</option>
                  <option value="all">Mostrar Todos</option>
                </select>
              </div>

              <div className={styles.filterWrapper}>
                <select 
                  className={styles.limitSelect}
                  value={selectedRegionDirector}
                  onChange={(e) => setSelectedRegionDirector(e.target.value)}
                >
                  <option value="all">Todas las UGEL</option>
                  {regiones.map(r => (
                    <option key={r.id} value={r.id}>UGEL {r.region}</option>
                  ))}
                </select>
              </div>

              <div className={styles.searchWrapper}>
                <MdSearch className={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Buscar DNI, Nombre, I.E...." 
                  className={styles.searchInput}
                  value={searchTermDirector}
                  onChange={(e) => setSearchTermDirector(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.tableResponsive}>
            <table className={styles.detailTable}>
              <thead>
                <tr>
                  <th>DNI</th>
                  <th>Director</th>
                  <th>Institución Educativa</th>
                  <th>UGEL</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredDirectoresByStatus.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      No se encontraron directores que coincidan con la búsqueda o filtros.
                    </td>
                  </tr>
                ) : (
                  filteredDirectoresByStatus
                    .slice(0, pageSizeDirector === 'all' ? undefined : pageSizeDirector)
                    .map((dir, idx) => {
                      const isParticipante = !!dir.participo || (dir.totalEstudiantes > 0);
                      return (
                        <tr key={dir.dniDirector || idx}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                            {highlightText(dir.dniDirector || '', searchTermDirector)}
                          </td>
                          <td style={{ fontWeight: '500' }}>
                            {highlightText(`${dir.nombres} ${dir.apellidos}`, searchTermDirector)}
                          </td>
                          <td>
                            {highlightText(dir.institucion, searchTermDirector)}
                          </td>
                          <td>
                            <span className={styles.regionBadge}>
                              UGEL {regionTexto(dir.region)}
                            </span>
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
        </div>
      )}
    </div>
  );
};

export default TablaParticipacionDirectores;
