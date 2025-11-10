import React from 'react';
import styles from '@/pages/admin/evaluaciones/evaluacion/reporte/Reporte.module.css';
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
    <div className={styles.filtersContainer}>
      <select
        name="region"
        className={styles.select}
        onChange={handleChangeFiltros}
        value={filtros.region}
      >
        <option value="">Seleccionar Ugel</option>
        {regiones.map((region, index) => (
          <option key={index} value={region.id}>
            {region.region}
          </option>
        ))}
      </select>

      <select
        name="distrito"
        className={styles.select}
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

      <select
        name="area"
        value={filtros.area}
        onChange={handleChangeFiltros}
        className={styles.select}
      >
        <option value="">Area</option>
        {area.map((are) => (
          <option key={are.id} value={are.id}>
            {are.name.toUpperCase()}
          </option>
        ))}
      </select>
      <select
        name="caracteristicaCurricular"
        value={filtros.caracteristicaCurricular}
        onChange={handleChangeFiltros}
        className={styles.select}
      >
        <option value="">Característica Curricular</option>
        {caracteristicasDirectivo.map((are) => (
          <option key={are.id} value={are.name}>
            {are.name.toUpperCase()}
          </option>
        ))}
      </select>
      <select
        name="genero"
        value={filtros.genero}
        onChange={handleChangeFiltros}
        className={styles.select}
      >
        <option value="">Género</option>
        {genero.map((gen) => (
          <option key={gen.id} value={gen.id}>
            {gen.name.toUpperCase()}
          </option>
        ))}
      </select>
     
      <button className={styles.filterButton} onClick={handleFiltrar}>
        Filtrar
      </button>
      <button className={styles.filterButton} onClick={handleRestablecerFiltros}>
        restablecer
      </button>
    </div>
  );
};

export default FiltrosReporte;

