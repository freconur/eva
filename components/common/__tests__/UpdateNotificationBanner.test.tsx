import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UpdateNotificationBanner from '../UpdateNotificationBanner';
import { useAppVersion } from '@/features/hooks/useAppVersion';

jest.mock('@/firebase/firebase.config', () => ({
  db: {},
  app: {},
}));
jest.mock('@/features/hooks/useAppVersion');

describe('UpdateNotificationBanner Component', () => {
  const mockReloadApp = jest.fn();
  const mockDismissUpdate = jest.fn();
  const mockRestoreBanner = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('no renderiza nada si no hay actualización disponible', () => {
    (useAppVersion as jest.Mock).mockReturnValue({
      updateAvailable: false,
      serverData: null,
      reloadApp: mockReloadApp,
      isReloading: false,
      dismissUpdate: mockDismissUpdate,
      restoreBanner: mockRestoreBanner,
      isDismissed: false,
      clientVersion: '0.1.0',
    });

    const { container } = render(<UpdateNotificationBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('muestra la tarjeta flotante con título, versión y botón de actualizar', () => {
    (useAppVersion as jest.Mock).mockReturnValue({
      updateAvailable: true,
      serverData: {
        version: '0.3.0',
        titulo: 'Hay nuevas mejoras disponibles',
        mensaje: 'actualiza la aplicación para obtenerlas',
        notas: ['vista panel evaluaciones'],
        forzarActualizacion: false,
      },
      reloadApp: mockReloadApp,
      isReloading: false,
      dismissUpdate: mockDismissUpdate,
      restoreBanner: mockRestoreBanner,
      isDismissed: false,
      clientVersion: '0.2.0',
    });

    render(<UpdateNotificationBanner />);

    expect(screen.getByText('Hay nuevas mejoras disponibles')).toBeInTheDocument();
    expect(screen.getByText('v0.3.0')).toBeInTheDocument();
    expect(screen.getByText('actualiza la aplicación para obtenerlas')).toBeInTheDocument();
    expect(screen.getByText('vista panel evaluaciones')).toBeInTheDocument();

    const btnActualizar = screen.getByRole('button', { name: /actualizar ahora/i });
    expect(btnActualizar).toBeInTheDocument();
    fireEvent.click(btnActualizar);
    expect(mockReloadApp).toHaveBeenCalledTimes(1);

    const btnMasTarde = screen.getByRole('button', { name: /más tarde/i });
    expect(btnMasTarde).toBeInTheDocument();
    fireEvent.click(btnMasTarde);
    expect(mockDismissUpdate).toHaveBeenCalledTimes(1);
  });

  it('muestra la píldora flotante compacta cuando el usuario pospuso la actualización', () => {
    (useAppVersion as jest.Mock).mockReturnValue({
      updateAvailable: true,
      serverData: {
        version: '0.3.0',
        forzarActualizacion: false,
      },
      reloadApp: mockReloadApp,
      isReloading: false,
      dismissUpdate: mockDismissUpdate,
      restoreBanner: mockRestoreBanner,
      isDismissed: true,
      clientVersion: '0.2.0',
    });

    render(<UpdateNotificationBanner />);

    expect(screen.getByText(/Actualización disponible \(0.3.0\)/i)).toBeInTheDocument();
    const pill = screen.getByLabelText('Notificación de actualización pendiente');
    fireEvent.click(pill);
    expect(mockRestoreBanner).toHaveBeenCalledTimes(1);
  });

  it('oculta el botón Más tarde cuando la actualización es forzada', () => {
    (useAppVersion as jest.Mock).mockReturnValue({
      updateAvailable: true,
      serverData: {
        version: '0.3.0',
        titulo: 'Actualización obligatoria',
        forzarActualizacion: true,
      },
      reloadApp: mockReloadApp,
      isReloading: false,
      dismissUpdate: mockDismissUpdate,
      restoreBanner: mockRestoreBanner,
      isDismissed: false,
      clientVersion: '0.2.0',
    });

    render(<UpdateNotificationBanner />);

    expect(screen.queryByRole('button', { name: /más tarde/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/posponer aviso de actualización/i)).not.toBeInTheDocument();
  });
});
