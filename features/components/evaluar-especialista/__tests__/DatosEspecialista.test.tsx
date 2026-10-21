import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DatosEspecialista from '../DatosEspecialista';

describe('DatosEspecialista', () => {
    const defaultProps = {
        dataDirector: {
            institucion: 'I.E. Los Libertadores',
            nombres: 'Juan',
            apellidos: 'Pérez',
            dni: '12345678',
        },
        dataEvaluacionDocente: {
            faseActualID: 'fase-1',
            faseNombre: 'Fase I',
        },
        currentUserData: {
            nombres: 'Franco',
            apellidos: 'Condori',
            dni: '47163626',
            cargo: 'MONITOR',
        },
        isAutoreporte: false,
        emailEspecialista: '',
        setEmailEspecialista: jest.fn(),
        celularEspecialista: '',
        setCelularEspecialista: jest.fn(),
        emailMonitor: 'monitor@test.com',
        setEmailMonitor: jest.fn(),
        celularMonitor: '999888777',
        setCelularMonitor: jest.fn(),
        fechaMonitoreo: '2026-10-20',
        setFechaMonitoreo: jest.fn(),
        horaInicio: '08:00',
        setHoraInicio: jest.fn(),
        horaFinal: '10:00',
        setHoraFinal: jest.fn(),
        tituloReporte: 'Informe',
        setTituloReporte: jest.fn(),
        warningDataDocente: '',
        handleCerrarEspecialista: jest.fn(),
        fasesDisponibles: [{ id: 'fase-1', nombre: 'Fase I' }],
    };

    test('renderiza la etiqueta HORA FINAL en lugar de FECHA FINAL', () => {
        render(<DatosEspecialista {...defaultProps} />);

        expect(screen.getByText('HORA INICIO:')).toBeInTheDocument();
        expect(screen.getByText('HORA FINAL:')).toBeInTheDocument();
        expect(screen.queryByText('FECHA FINAL:')).not.toBeInTheDocument();
    });

    test('renderiza correctamente los datos del monitor y del monitoreado', () => {
        render(<DatosEspecialista {...defaultProps} />);

        expect(screen.getByText('I.E. Los Libertadores')).toBeInTheDocument();
        expect(screen.getByText('PÉREZ JUAN')).toBeInTheDocument();
        expect(screen.getByText('CONDORI FRANCO')).toBeInTheDocument();
    });
});
