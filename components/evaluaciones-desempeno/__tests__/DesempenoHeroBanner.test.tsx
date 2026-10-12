import React from 'react';
import { render, screen } from '@testing-library/react';
import DesempenoHeroBanner from '../containers/DesempenoHeroBanner';

jest.mock('@/firebase/firebase.config', () => ({
  db: {},
  storage: {},
  app: {},
  initAnalytics: jest.fn().mockResolvedValue(null),
}));

const mockBannerConfig = {
  variant: 'compact',
  backgroundImage: null,
  backgroundImageOpacity: 0.25,
  customTitle: null,
  customSubtitle: null,
  isAuditing: true,
  isSaving: false,
  isSavingTexts: false,
  isUploadingImage: false,
  setBannerVariant: jest.fn(),
  uploadBannerImage: jest.fn(),
  removeBannerImage: jest.fn(),
  updateBannerTexts: jest.fn(),
  resetBannerTexts: jest.fn(),
};

jest.mock('@/components/evaluaciones/useEvaluacionesBannerConfig', () => ({
  __esModule: true,
  default: jest.fn(() => mockBannerConfig),
}));

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: {
      institucion: 'I.E. Mariscal Castilla',
      ugel: 'UGEL Huancayo',
      rol: 4,
    },
  }),
}));

describe('DesempenoHeroBanner', () => {
  it('renderiza título, subtítulo e institución por defecto desde currentUserData', () => {
    render(
      <DesempenoHeroBanner
        routeKey="test_route"
        title="SEGUIMIENTO Y RETROALIMENTACIÓN"
        subtitle="Monitoreo pedagógico y formativo"
        badgeTema="Acompañamiento"
      />
    );

    expect(screen.getByText('SEGUIMIENTO Y RETROALIMENTACIÓN')).toBeInTheDocument();
    expect(screen.getByText('Monitoreo pedagógico y formativo')).toBeInTheDocument();
    expect(screen.getByText('I.E. Mariscal Castilla')).toBeInTheDocument();
  });

  it('renderiza métricas personalizadas y acciones secundarias', () => {
    render(
      <DesempenoHeroBanner
        routeKey="test_route"
        title="MI DESEMPEÑO PEDAGÓGICO"
        subtitle="Rúbricas y compromisos"
        metrics={[
          {
            id: 'evals',
            label: 'Monitoreos',
            value: 5,
          },
          {
            id: 'sesiones',
            label: 'Sesiones',
            value: 12,
          },
        ]}
        actions={<button type="button">Descargar Ficha</button>}
      />
    );

    expect(screen.getByText('Monitoreos')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Sesiones')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /descargar ficha/i })).toBeInTheDocument();
  });
});
