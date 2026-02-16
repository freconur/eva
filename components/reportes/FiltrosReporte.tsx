import React from 'react';
import styles from './QuestionReport.module.css';
import {
  genero,
  regiones,
  area,
  caracteristicasDirectivo,
} from '@/fuctions/regiones';

interface FiltrosReporteProps {
  filtros: {
    region: string;
    distrito: string;
    caracteristicaCurricular: string;
    genero: string;
    area: string;
  };
  distritosDisponibles: string[];
  handleChangeFiltros: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleFiltrar: () => void;
  handleRestablecerFiltros: () => void;
}

const FiltrosReporte: React.FC<FiltrosReporteProps> = ({
  filtros,
  distritosDisponibles,
  handleChangeFiltros,
  handleFiltrar,
  handleRestablecerFiltros,
}) => {
  return (
    <div className={styles.filtersSection}>
      <div className={styles.filtersGrid}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>UGEL</label>
          <select
            name="region"
            className={styles.filterSelect}
            onChange={handleChangeFiltros}
            value={filtros.region}
          >
            <option value="">Todas las UGEL</option>
            {regiones.map((region, index) => (
              <option key={index} value={region.id}>
                {region.region}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Distrito</label>
          <select
            name="distrito"
            className={styles.filterSelect}
            onChange={handleChangeFiltros}
            value={filtros.distrito}
            disabled={!filtros.region}
          >
            <option value="">Seleccionar Distrito</option>
            {distritosDisponibles.map((distrito, index) => (
              <option key={index} value={distrito}>
                {distrito}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Área</label>
          <select
            name="area"
            value={filtros.area}
            onChange={handleChangeFiltros}
            className={styles.filterSelect}
          >
            <option value="">Todas las Áreas</option>
            {area.map((are) => (
              <option key={are.id} value={are.id}>
                {are.name.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Curricular</label>
          <select
            name="caracteristicaCurricular"
            value={filtros.caracteristicaCurricular}
            onChange={handleChangeFiltros}
            className={styles.filterSelect}
          >
            <option value="">Todas</option>
            {caracteristicasDirectivo.map((are) => (
              <option key={are.id} value={are.name}>
                {are.name.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Género</label>
          <select
            name="genero"
            value={filtros.genero}
            onChange={handleChangeFiltros}
            className={styles.filterSelect}
          >
            <option value="">Todos</option>
            {genero.map((gen) => (
              <option key={gen.id} value={gen.id}>
                {gen.name.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterActions}>
          <button className={styles.primaryAction} onClick={handleFiltrar}>
            Filtrar
          </button>
          <button className={styles.secondaryAction} onClick={handleRestablecerFiltros}>
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiltrosReporte;
