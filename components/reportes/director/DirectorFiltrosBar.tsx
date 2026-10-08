import React, { useState, useEffect, useRef } from 'react';
import { RiSettings4Line } from 'react-icons/ri';
import { gradosDeColegio, genero, ordernarAscDsc } from '@/fuctions/regiones';
import { Evaluaciones } from '@/features/types/types';
import styles from '@/pages/directores/evaluaciones/evaluacion/reporte/Reporte.module.css';

export interface ColumnasVisiblesState {
  showRC: boolean;
  showTP: boolean;
  showPuntaje: boolean;
  showNivel: boolean;
  showDniDocente: boolean;
}

export interface FiltrosState {
  grado: string;
  seccion: string;
  orden: string;
  genero: string;
  nivel: string;
}

interface DirectorFiltrosBarProps {
  filtros: FiltrosState;
  onFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  evaluacion: Evaluaciones;
  availableSections: Array<{ id: number | string; name: string }>;
  isDirectorRol: boolean;
  columnasVisibles: ColumnasVisiblesState;
  onToggleColumna: (col: keyof ColumnasVisiblesState) => void;
  onLimpiarFiltros: () => void;
}

export const DirectorFiltrosBar: React.FC<DirectorFiltrosBarProps> = ({
  filtros,
  onFilterChange,
  evaluacion,
  availableSections,
  isDirectorRol,
  columnasVisibles,
  onToggleColumna,
  onLimpiarFiltros,
}) => {
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const configRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú de configuración de columnas al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (configRef.current && !configRef.current.contains(event.target as Node)) {
        setShowConfig(false);
      }
    };

    if (showConfig) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showConfig]);

  return (
    <div className={styles.filtersContainer}>
      {/* Filtro: Nivel */}
      <select
        name="nivel"
        className={styles.select}
        onChange={onFilterChange}
        value={filtros.nivel}
      >
        <option value="">Nivel</option>
        {evaluacion.nivelYPuntaje?.map((nivel) => (
          <option key={nivel.id} value={nivel.nivel}>
            {nivel.nivel}
          </option>
        ))}
      </select>

      {/* Filtro: Grado */}
      <select
        name="grado"
        className={styles.select}
        onChange={onFilterChange}
        value={filtros.grado}
        disabled={isDirectorRol}
      >
        <option value="">Grado</option>
        {gradosDeColegio.map((grado) => (
          <option key={grado.id} value={grado.id}>
            {grado.name}
          </option>
        ))}
      </select>

      {/* Filtro: Sección */}
      <select
        name="seccion"
        value={filtros.seccion}
        onChange={onFilterChange}
        className={styles.select}
      >
        <option value="">Sección</option>
        {availableSections.map((seccion) => (
          <option key={seccion.id} value={seccion.id}>
            {seccion.name.toUpperCase()}
          </option>
        ))}
      </select>

      {/* Filtro: Género */}
      <select
        name="genero"
        value={filtros.genero}
        onChange={onFilterChange}
        className={styles.select}
      >
        <option value="">Género</option>
        {genero.map((gen) => (
          <option key={gen.id} value={gen.id}>
            {gen.name.toUpperCase()}
          </option>
        ))}
      </select>

      {/* Filtro: Orden */}
      <select
        className={styles.select}
        onChange={onFilterChange}
        name="orden"
        value={filtros.orden}
      >
        <option value="">Ordenar por</option>
        {ordernarAscDsc.map((orden) => (
          <option key={orden.id} value={orden.name}>
            {orden.name}
          </option>
        ))}
      </select>

      {/* Configuración de visibilidad de columnas */}
      <div className={styles.configContainer} ref={configRef}>
        <button
          type="button"
          className={styles.configButton}
          onClick={() => setShowConfig(!showConfig)}
          title="Configurar columnas"
        >
          <RiSettings4Line />
          Columnas
        </button>

        {showConfig && (
          <div className={styles.configMenu}>
            <span className={styles.configTitle}>Visibilidad de Columnas</span>
            <div className={styles.configList}>
              <label className={styles.configItem}>
                <input
                  type="checkbox"
                  checked={columnasVisibles.showRC}
                  onChange={() => onToggleColumna('showRC')}
                />
                <span>Respuestas Correctas (RC)</span>
              </label>
              <label className={styles.configItem}>
                <input
                  type="checkbox"
                  checked={columnasVisibles.showTP}
                  onChange={() => onToggleColumna('showTP')}
                />
                <span>Total Preguntas (TP)</span>
              </label>
              <label className={styles.configItem}>
                <input
                  type="checkbox"
                  checked={columnasVisibles.showPuntaje}
                  onChange={() => onToggleColumna('showPuntaje')}
                />
                <span>Puntaje</span>
              </label>
              <label className={styles.configItem}>
                <input
                  type="checkbox"
                  checked={columnasVisibles.showNivel}
                  onChange={() => onToggleColumna('showNivel')}
                />
                <span>Nivel (Logro)</span>
              </label>
              <label className={styles.configItem}>
                <input
                  type="checkbox"
                  checked={columnasVisibles.showDniDocente}
                  onChange={() => onToggleColumna('showDniDocente')}
                />
                <span>DNI Docente</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Botón para limpiar filtros */}
      <button
        type="button"
        className={styles.clearButton}
        onClick={onLimpiarFiltros}
      >
        Limpiar Filtros
      </button>
    </div>
  );
};

export default DirectorFiltrosBar;
