import React, { useState, useEffect, useCallback } from 'react';
import { useGlobalContext, useGlobalContextDispatch } from '@/features/context/GlolbalContext';
import { AppAction } from '@/features/actions/appAction';
import { currentYear } from '@/fuctions/dates';
import { getAllMonths } from '@/fuctions/dates';
interface RangoMesProps {
  onRangoChange?: (mesInicio: number, mesFin: number, año: number, mesesIds: number[]) => void;
  className?: string;
  setRangoMes?: (rangoMes: number[]) => void;
}

const RangoMes: React.FC<RangoMesProps> = ({ onRangoChange, className = '', setRangoMes }) => {
  const dispatch = useGlobalContextDispatch();
  const { currentUserData } = useGlobalContext();
  
  const [mesInicio, setMesInicio] = useState<number>(0);
  const [mesFin, setMesFin] = useState<number>(11);
  const [año, setAño] = useState<number>(currentYear);
  const [error, setError] = useState<string>('');

  const meses = getAllMonths.map((mes) => ({
    valor: mes.id,
    nombre: mes.name
  }));

  const añosDisponibles = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const obtenerIdsMesesEnRango = useCallback(() => {
    const mesesIds = [];
    for (let mes = mesInicio; mes <= mesFin; mes++) {
      mesesIds.push(mes);
    }
    return mesesIds;
  }, [mesInicio, mesFin]);

  // Solo establecer el rango inicial una vez al montar
  useEffect(() => {
    const mesesIds = obtenerIdsMesesEnRango();
    if (setRangoMes) {
      setRangoMes(mesesIds);
    }
  }, []);

  // Validar y actualizar cuando cambien los valores
  useEffect(() => {
    if (mesInicio > mesFin) {
      setError('El mes de inicio no puede ser mayor que el mes de fin');
    } else {
      setError('');
    }
  }, [mesInicio, mesFin]);

  const handleMesInicioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoMes = parseInt(e.target.value);
    setMesInicio(nuevoMes);
    
    // Si el mes de fin es menor que el nuevo mes de inicio, ajustar automáticamente
    if (nuevoMes > mesFin) {
      setMesFin(nuevoMes);
    }

    // Solo actualizar rangoMes local, no ejecutar onRangoChange
    setTimeout(() => {
      const mesesIds = obtenerIdsMesesEnRango();
      if (setRangoMes) {
        setRangoMes(mesesIds);
      }
    }, 0);
  };

  const handleMesFinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoMes = parseInt(e.target.value);
    setMesFin(nuevoMes);

    // Solo actualizar rangoMes local, no ejecutar onRangoChange
    setTimeout(() => {
      const mesesIds = obtenerIdsMesesEnRango();
      if (setRangoMes) {
        setRangoMes(mesesIds);
      }
    }, 0);
  };

  const handleAñoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAño(parseInt(e.target.value));
    
    // Solo actualizar rangoMes local, no ejecutar onRangoChange
    setTimeout(() => {
      const mesesIds = obtenerIdsMesesEnRango();
      if (setRangoMes) {
        setRangoMes(mesesIds);
      }
    }, 0);
  };

  const obtenerMesesEnRango = () => {
    const mesesEnRango = [];
    for (let mes = mesInicio; mes <= mesFin; mes++) {
      mesesEnRango.push(meses.find(m => m.valor === mes)?.nombre);
    }
    return mesesEnRango;
  };

  const resetearRango = () => {
    setMesInicio(0);
    setMesFin(11);
    setAño(currentYear);
    setError('');
    
    // Solo actualizar rangoMes local, no ejecutar onRangoChange
    setTimeout(() => {
      const mesesIds = obtenerIdsMesesEnRango();
      if (setRangoMes) {
        setRangoMes(mesesIds);
      }
    }, 0);
  };
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Seleccionar Rango de Meses
        </h3>
        <p className="text-sm text-gray-600">
          Elige el período de tiempo para generar reportes y gráficos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Año */}
        {/* <div>
          <label htmlFor="año" className="block text-sm font-medium text-gray-700 mb-2">
            Año
          </label>
          <select
            id="año"
            value={año}
            onChange={handleAñoChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {añosDisponibles.map(añoOption => (
              <option key={añoOption} value={añoOption}>
                {añoOption}
              </option>
            ))}
          </select>
        </div> */}

        {/* Mes de Inicio */}
        <div>
          <label htmlFor="mesInicio" className="block text-sm font-medium text-gray-700 mb-2">
            Mes de Inicio
          </label>
          <select
            id="mesInicio"
            value={mesInicio}
            onChange={handleMesInicioChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {meses.map(mes => (
              <option key={mes.valor} value={mes.valor}>
                {mes.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Mes de Fin */}
        <div>
          <label htmlFor="mesFin" className="block text-sm font-medium text-gray-700 mb-2">
            Mes de Fin
          </label>
          <select
            id="mesFin"
            value={mesFin}
            onChange={handleMesFinChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {meses.map(mes => (
              <option key={mes.valor} value={mes.valor}>
                {mes.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mensaje de Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}


      {/* Botones de Acción */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={resetearRango}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Restablecer
        </button>
        
        <button
          onClick={() => {
            const mesesIds = obtenerIdsMesesEnRango();
            onRangoChange?.(mesInicio, mesFin, año, mesesIds);
          }}
          disabled={!!error}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Aplicar Rango
        </button>
      </div>
    </div>
  );
};

export default RangoMes;