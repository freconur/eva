import { barDataLabelPlugin } from '../containers/reporte-desempeno/chartPlugins';

describe('barDataLabelPlugin', () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = {
      save: jest.fn(),
      restore: jest.fn(),
      strokeText: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn().mockImplementation((text: string) => ({ width: text.length * 6 })),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      roundRect: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      quadraticCurveTo: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      fillRect: jest.fn(),
      font: '',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      textAlign: 'left',
      textBaseline: 'alphabetic',
    };
  });

  it('renders phase name and score inside bar when isStacked is true and there is only 1 phase', () => {
    const mockChart: any = {
      data: {
        datasets: [
          {
            label: 'OCTUBRE',
            data: [16.5],
            rawScores: [16.5],
            phaseNames: ['OCTUBRE'],
          },
        ],
      },
      options: {
        indexAxis: 'y',
        scales: {
          x: { stacked: true },
          y: { stacked: true },
        },
      },
      config: {
        options: {
          plugins: {
            customItemData: [
              {
                name: 'TEST DOCENTE',
                latestScore: 16.5,
                nivelColor: '#10b981',
              },
            ],
          },
        },
      },
      getDatasetMeta: jest.fn().mockReturnValue({
        hidden: false,
        data: [
          {
            x: 200,
            y: 50,
            base: 0,
            getProps: () => ({ x: 200, y: 50, base: 0, width: 200, height: 30 }),
          },
        ],
      }),
      ctx: mockCtx,
    };

    barDataLabelPlugin.afterDatasetsDraw(mockChart);

    // Verify strokeText/fillText were called with the phase name 'OCTUBRE'
    expect(mockCtx.fillText).toHaveBeenCalledWith('OCTUBRE', expect.any(Number), expect.any(Number));
    expect(mockCtx.strokeText).toHaveBeenCalledWith('OCTUBRE', expect.any(Number), expect.any(Number));

    // Verify strokeText/fillText were called with the points '16.5 pts'
    expect(mockCtx.fillText).toHaveBeenCalledWith('16.5 pts', expect.any(Number), expect.any(Number));
    expect(mockCtx.strokeText).toHaveBeenCalledWith('16.5 pts', expect.any(Number), expect.any(Number));

    // Verify pill badge drawn at element.x + 8
    expect(mockCtx.roundRect).toHaveBeenCalled();
  });

  it('renders both phases when there are 2 phases in stacked mode', () => {
    const mockChart: any = {
      data: {
        datasets: [
          {
            label: 'OCTUBRE',
            data: [16.5],
            rawScores: [16.5],
            phaseNames: ['OCTUBRE'],
          },
          {
            label: 'OCTUBRE II',
            data: [24],
            rawScores: [24],
            phaseNames: ['OCTUBRE II'],
          },
        ],
      },
      options: {
        indexAxis: 'y',
        scales: {
          x: { stacked: true },
          y: { stacked: true },
        },
      },
      config: {
        options: {
          plugins: {
            customItemData: [
              {
                name: 'TEST DOCENTE',
                latestScore: 19.5,
                nivelColor: '#3b82f6',
              },
            ],
          },
        },
      },
      getDatasetMeta: jest.fn().mockImplementation((dsIndex: number) => {
        if (dsIndex === 0) {
          return {
            hidden: false,
            data: [
              {
                x: 100,
                y: 50,
                base: 0,
                getProps: () => ({ x: 100, y: 50, base: 0, width: 100, height: 30 }),
              },
            ],
          };
        }
        return {
          hidden: false,
          data: [
            {
              x: 240,
              y: 50,
              base: 100,
              getProps: () => ({ x: 240, y: 50, base: 100, width: 140, height: 30 }),
            },
          ],
        };
      }),
      ctx: mockCtx,
    };

    barDataLabelPlugin.afterDatasetsDraw(mockChart);

    expect(mockCtx.fillText).toHaveBeenCalledWith('OCTUBRE', expect.any(Number), expect.any(Number));
    expect(mockCtx.fillText).toHaveBeenCalledWith('OCTUBRE II', expect.any(Number), expect.any(Number));
  });

  it('filters out generic labels like "PUNTAJE" so they are not drawn as phase name', () => {
    const mockChart: any = {
      data: {
        datasets: [
          {
            label: 'Puntaje',
            data: [16.5],
            rawScores: [16.5],
            phaseNames: ['Puntaje'],
          },
        ],
      },
      options: {
        indexAxis: 'y',
        scales: {
          x: { stacked: true },
          y: { stacked: true },
        },
      },
      config: {
        options: {
          plugins: {
            customItemData: [
              {
                name: 'TEST DOCENTE',
                latestScore: 16.5,
                nivelColor: '#10b981',
              },
            ],
          },
        },
      },
      getDatasetMeta: jest.fn().mockReturnValue({
        hidden: false,
        data: [
          {
            x: 200,
            y: 50,
            base: 0,
            getProps: () => ({ x: 200, y: 50, base: 0, width: 200, height: 30 }),
          },
        ],
      }),
      ctx: mockCtx,
    };

    barDataLabelPlugin.afterDatasetsDraw(mockChart);

    // Should NOT draw 'PUNTAJE' as phase name
    expect(mockCtx.fillText).not.toHaveBeenCalledWith('PUNTAJE', expect.any(Number), expect.any(Number));
    // Should still draw the score
    expect(mockCtx.fillText).toHaveBeenCalledWith('16.5 pts', expect.any(Number), expect.any(Number));
  });
});
