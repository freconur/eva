export const DEFAULT_DOMAIN_PALETTE = [
  '#3b82f6', // Azul
  '#10b981', // Verde Esmeralda
  '#f59e0b', // Ámbar / Naranja
  '#8b5cf6', // Púrpura
  '#00b4d8', // Celeste
  '#ec4899', // Rosa
  '#f97316', // Naranja brillante
  '#6366f1', // Índigo
  '#06b6d4', // Cian
  '#ef4444', // Rojo
  '#84cc16', // Lima
  '#64748b', // Pizarra
];

export const PRESET_COLOR_SWATCHES = [
  { label: 'Celeste', hex: '#00b4d8' },
  { label: 'Azul', hex: '#2563eb' },
  { label: 'Índigo', hex: '#6366f1' },
  { label: 'Morado', hex: '#8b5cf6' },
  { label: 'Verde', hex: '#10b981' },
  { label: 'Turquesa', hex: '#14b8a6' },
  { label: 'Lima', hex: '#84cc16' },
  { label: 'Ámbar', hex: '#f59e0b' },
  { label: 'Naranja', hex: '#f97316' },
  { label: 'Rojo', hex: '#ef4444' },
  { label: 'Rosa', hex: '#ec4899' },
  { label: 'Pizarra', hex: '#64748b' },
];

export const hexToRgba = (hex: string, alpha: number = 0.75): string => {
  if (!hex || typeof hex !== 'string') return `rgba(59, 130, 246, ${alpha})`;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getDomainColor = (dim: any, index: number): string => {
  if (dim?.color && typeof dim.color === 'string' && dim.color.startsWith('#')) {
    return dim.color;
  }
  return DEFAULT_DOMAIN_PALETTE[index % DEFAULT_DOMAIN_PALETTE.length];
};

export const drawCanvasPillBadge = (
  ctx: any,
  x: number,
  y: number,
  scoreText: string,
  isHorizontal: boolean,
  iconColor: string = '#2563eb'
) => {
  ctx.save();
  ctx.font = 'bold 10.5px Montserrat, sans-serif';
  const scoreWidth = ctx.measureText(scoreText).width;

  const iconWidth = 10;
  const iconHeight = 9.5;
  const gap = 4.5;
  const paddingX = 7;
  const badgeHeight = 18;
  const badgeWidth = iconWidth + gap + scoreWidth + paddingX * 2;
  const radius = 9;

  let rectX = x;
  let rectY = y - badgeHeight / 2;

  if (!isHorizontal) {
    rectX = x - badgeWidth / 2;
    rectY = y - badgeHeight - 4;
  }

  // Fondo redondeado del badge
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(rectX, rectY, badgeWidth, badgeHeight, radius);
  } else {
    ctx.moveTo(rectX + radius, rectY);
    ctx.lineTo(rectX + badgeWidth - radius, rectY);
    ctx.quadraticCurveTo(rectX + badgeWidth, rectY, rectX + badgeWidth, rectY + radius);
    ctx.lineTo(rectX + badgeWidth, rectY + badgeHeight - radius);
    ctx.quadraticCurveTo(rectX + badgeWidth, rectY + badgeHeight, rectX + badgeWidth - radius, rectY + badgeHeight);
    ctx.lineTo(rectX + radius, rectY + badgeHeight);
    ctx.quadraticCurveTo(rectX, rectY + badgeHeight, rectX, rectY + badgeHeight - radius);
    ctx.lineTo(rectX, rectY + radius);
    ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
    ctx.closePath();
  }
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();

  // 1. Dibujar mini ícono vectorial de barras (3 barras estilizadas: ▂▅▇)
  const iconX = rectX + paddingX;
  const iconBaseY = rectY + (badgeHeight + iconHeight) / 2;

  ctx.fillStyle = iconColor;
  // Barra 1 (4.5px)
  ctx.fillRect(iconX, iconBaseY - 4.5, 2.2, 4.5);
  // Barra 2 (7px)
  ctx.fillRect(iconX + 3.6, iconBaseY - 7, 2.2, 7);
  // Barra 3 (9.5px)
  ctx.fillRect(iconX + 7.2, iconBaseY - 9.5, 2.2, 9.5);

  // 2. Dibujar texto del puntaje
  const textX = iconX + iconWidth + gap;
  const textY = rectY + badgeHeight / 2 + 0.5;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = 'bold 10.5px Montserrat, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(scoreText, textX, textY);

  ctx.restore();
};

export const barDataLabelPlugin = {
  id: 'barDataLabelPlugin',
  afterDatasetsDraw(chart: any) {
    const { ctx } = chart;
    const datasets = chart.data.datasets;
    if (!datasets || datasets.length === 0) return;
    const customData = chart.config.options?.plugins?.customItemData;
    if (!customData || customData.length === 0) return;

    const isHorizontal = chart.options.indexAxis === 'y';
    const isStacked = chart.options.scales?.x?.stacked || chart.options.scales?.y?.stacked;

    ctx.save();
    ctx.textBaseline = 'middle';

    if (isStacked) {
      // --- MODO APILADO (MULTI-FASE O FASE ÚNICA) ---
      datasets.forEach((dataset: any, datasetIndex: number) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (meta.hidden) return;

        meta.data.forEach((element: any, index: number) => {
          const rawVal = dataset.rawDomainScores ? dataset.rawDomainScores[index] : (dataset.rawScores ? dataset.rawScores[index] : dataset.data[index]);
          const rawPhaseName = dataset.phaseNames ? dataset.phaseNames[index] : (dataset.label || '');
          const isGeneric = ['puntaje', 'puntaje promedio', 'puntaje consolidado'].includes((rawPhaseName || '').toLowerCase().trim());
          const cleanPhase = isGeneric ? '' : (rawPhaseName || '').toUpperCase();
          const displayPhaseName = cleanPhase.length > 20 ? `${cleanPhase.substring(0, 18)}...` : cleanPhase;

          if (rawVal !== undefined && rawVal !== null && rawVal > 0) {
            const rect = element.getProps(['x', 'y', 'base', 'width', 'height'], true);
            const segmentWidth = Math.abs(rect.x - rect.base);
            const segmentHeight = Math.abs(rect.y - rect.base);

            if (isHorizontal) {
              const availWidth = segmentWidth - 4;
              if (availWidth >= 12) {
                const centerX = (rect.x + rect.base) / 2;
                const centerY = element.y;

                const formattedScore = Number.isInteger(rawVal) ? `${rawVal}` : `${Number(rawVal).toFixed(1)}`;
                const fullPtsText = `${formattedScore} pts`;
                const numOnlyText = `${formattedScore}`;

                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
                ctx.lineWidth = 2.5;
                ctx.textAlign = 'center';

                ctx.font = 'bold 9px Montserrat, sans-serif';
                const phaseWidth = displayPhaseName ? ctx.measureText(displayPhaseName).width : 0;
                const ptsWidth = ctx.measureText(fullPtsText).width;

                // 1. Si el segmento es suficientemente ancho (>= 60px) y caben ambas líneas:
                if (displayPhaseName && displayPhaseName !== '—' && phaseWidth <= availWidth && ptsWidth <= availWidth && segmentWidth >= 60) {
                  const fontOffset = 5.5;
                  ctx.strokeText(displayPhaseName, centerX, centerY - fontOffset);
                  ctx.fillText(displayPhaseName, centerX, centerY - fontOffset);

                  ctx.strokeText(fullPtsText, centerX, centerY + fontOffset);
                  ctx.fillText(fullPtsText, centerX, centerY + fontOffset);
                }
                // 2. Si el segmento tiene ancho medio (>= 36px) y cabe el texto de puntos completo:
                else if (ptsWidth <= availWidth && segmentWidth >= 36) {
                  ctx.strokeText(fullPtsText, centerX, centerY);
                  ctx.fillText(fullPtsText, centerX, centerY);
                }

                ctx.restore();
              }
            } else {
              // Gráfico vertical
              const availHeight = segmentHeight - 4;
              if (availHeight >= 12) {
                const centerX = element.x;
                const centerY = (rect.y + rect.base) / 2;

                const formattedScore = Number.isInteger(rawVal) ? `${rawVal}` : `${Number(rawVal).toFixed(1)}`;
                const fullPtsText = `${formattedScore} pts`;
                const numOnlyText = `${formattedScore}`;

                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.lineWidth = 2.5;
                ctx.textAlign = 'center';

                ctx.font = 'bold 8.5px Montserrat, sans-serif';
                const ptsWidth = ctx.measureText(fullPtsText).width;
                const numWidth = ctx.measureText(numOnlyText).width;
                const barWidth = rect.width || 30;

                // 1. Si la altura del segmento permite 2 líneas (>= 24px) y hay nombre de fase:
                if (displayPhaseName && displayPhaseName !== '—' && segmentHeight >= 24) {
                  const fontOffset = 5.5;
                  ctx.strokeText(displayPhaseName, centerX, centerY - fontOffset);
                  ctx.fillText(displayPhaseName, centerX, centerY - fontOffset);

                  const scoreText = (ptsWidth <= barWidth - 2) ? fullPtsText : numOnlyText;
                  ctx.strokeText(scoreText, centerX, centerY + fontOffset);
                  ctx.fillText(scoreText, centerX, centerY + fontOffset);
                }
                // 2. Si la altura permite 1 sola línea (>= 16px):
                else if (segmentHeight >= 16) {
                  const scoreText = (ptsWidth <= barWidth - 2) ? fullPtsText : numOnlyText;
                  ctx.strokeText(scoreText, centerX, centerY);
                  ctx.fillText(scoreText, centerX, centerY);
                }
                // 3. Segmento muy angosto:
                else if (numWidth <= barWidth + 2) {
                  ctx.font = 'bold 8px Montserrat, sans-serif';
                  ctx.strokeText(numOnlyText, centerX, centerY);
                  ctx.fillText(numOnlyText, centerX, centerY);
                }

                ctx.restore();
              }
            }
          }
        });
      });

      // En vista horizontal: dibujar al final exterior de la barra total el puntaje con cápsula destacada
      if (isHorizontal) {
        const lastMeta = chart.getDatasetMeta(datasets.length - 1);
        if (lastMeta && !lastMeta.hidden) {
          lastMeta.data.forEach((element: any, index: number) => {
            const item = customData[index];
            if (!item) return;
            const latestDomainScore = item.latestScore ?? item.latestDomainScore ?? item.avg ?? 0;
            const scoreText = `${Number.isInteger(latestDomainScore) ? latestDomainScore : Number(latestDomainScore).toFixed(1)} pts`;
            const iconColor = item.nivelColor || item.color || '#2563eb';

            drawCanvasPillBadge(ctx, element.x + 8, element.y, scoreText, true, iconColor);
          });
        }
      } else {
        // En vista vertical: dibujar en el tope exterior de la barra total el puntaje con cápsula destacada
        const lastMeta = chart.getDatasetMeta(datasets.length - 1);
        if (lastMeta && !lastMeta.hidden) {
          lastMeta.data.forEach((element: any, index: number) => {
            const item = customData[index];
            if (!item) return;
            const latestDomainScore = item.latestScore ?? item.latestDomainScore ?? item.avg ?? 0;
            const scoreText = `${Number.isInteger(latestDomainScore) ? latestDomainScore : Number(latestDomainScore).toFixed(1)} pts`;
            const iconColor = item.nivelColor || item.color || '#2563eb';

            drawCanvasPillBadge(ctx, element.x, element.y, scoreText, false, iconColor);
          });
        }
      }
    } else {
      // --- MODO SIMPLE O AGRUPADO (!isStacked) ---
      datasets.forEach((dataset: any, dsIndex: number) => {
        const meta = chart.getDatasetMeta(dsIndex);
        if (!meta || meta.hidden) return;

        meta.data.forEach((bar: any, index: number) => {
          const value = dataset.data[index];
          if (value === undefined || value === null || value <= 0) return;

          const item = customData[index];
          const rawPhaseName = dataset.phaseNames?.[index] || dataset.label || '';
          const isGeneric = ['puntaje', 'puntaje promedio', 'puntaje consolidado'].includes((rawPhaseName || '').toLowerCase().trim());
          const cleanPhase = isGeneric ? '' : (rawPhaseName || '').toUpperCase();
          const phaseName = cleanPhase.length > 20 ? `${cleanPhase.substring(0, 18)}...` : cleanPhase;

          const domainVal = Number(value);
          const formattedScore = Number.isInteger(domainVal) ? `${domainVal}` : domainVal.toFixed(1);
          const domainScoreText = `${formattedScore} pts`;
          const insideLabelText = phaseName ? `${phaseName}: ${domainScoreText}` : domainScoreText;

          if (isHorizontal) {
            const barWidth = Math.abs(bar.x - bar.base);
            ctx.font = '700 10.5px Montserrat, sans-serif';
            const insideTextWidth = ctx.measureText(insideLabelText).width;

            if (barWidth > insideTextWidth + 20) {
              ctx.textAlign = 'right';
              ctx.fillStyle = '#ffffff';
              ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
              ctx.shadowBlur = 3;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 1;
              ctx.fillText(insideLabelText, bar.x - 8, bar.y);
            } else {
              ctx.shadowColor = 'transparent';
              ctx.textAlign = 'left';
              ctx.font = '600 10.5px Montserrat, sans-serif';
              ctx.fillStyle = '#475569';
              ctx.fillText(domainScoreText, bar.x + 6, bar.y);
            }
          } else {
            // En vista vertical simple / agrupada:
            const barHeight = Math.abs(bar.y - bar.base);
            const centerY = (bar.y + bar.base) / 2;

            if (barHeight >= 12) {
              ctx.save();
              ctx.fillStyle = '#ffffff';
              ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
              ctx.lineWidth = 2.5;
              ctx.font = 'bold 8.5px Montserrat, sans-serif';
              ctx.textAlign = 'center';

              if (phaseName && barHeight >= 24) {
                const fontOffset = 5.5;
                ctx.strokeText(phaseName, bar.x, centerY - fontOffset);
                ctx.fillText(phaseName, bar.x, centerY - fontOffset);

                ctx.strokeText(domainScoreText, bar.x, centerY + fontOffset);
                ctx.fillText(domainScoreText, bar.x, centerY + fontOffset);
              } else if (barHeight >= 16) {
                ctx.strokeText(domainScoreText, bar.x, centerY);
                ctx.fillText(domainScoreText, bar.x, centerY);
              }
              ctx.restore();
            }
          }
        });
      });
    }

    ctx.restore();
  },
};
