import { User } from '@/features/types/types';

export const stackedColors = [
	{ bg: '#84cc16', border: '#65a30d' }, // Lime Green (Eval 1)
	{ bg: '#ea580c', border: '#c2410c' }, // Orange (Eval 2)
	{ bg: '#dc2626', border: '#991b1b' }, // Dark Red (Eval 3)
	{ bg: '#94a3b8', border: '#475569' }, // Slate Grey (Eval 4)
	{ bg: '#8b5cf6', border: '#6d28d9' }, // Purple (Eval 5)
	{ bg: '#0284c7', border: '#0369a1' }, // Cyan (Eval 6)
];

export const barSegmentScorePlugin = {
	id: 'barSegmentScorePlugin',
	afterDatasetsDraw(chart: any) {
		if (chart.config.type !== 'bar') return;
		const { ctx } = chart;
		ctx.save();
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		const isHorizontal = chart.options.indexAxis === 'y';

		chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
			const meta = chart.getDatasetMeta(datasetIndex);
			if (!meta.hidden) {
				meta.data.forEach((element: any, index: number) => {
					const rawVal = dataset.rawScores ? dataset.rawScores[index] : dataset.data[index];
					const phaseName = dataset.phaseNames ? dataset.phaseNames[index] : '';

					if (rawVal !== undefined && rawVal !== null && rawVal > 0) {
						const rect = element.getProps(['x', 'y', 'base', 'width', 'height'], true);
						const segmentWidth = Math.abs(rect.x - rect.base);
						const segmentHeight = Math.abs(rect.y - rect.base);
						const size = isHorizontal ? segmentWidth : segmentHeight;

						if (size >= 10) {
							const centerX = isHorizontal ? (rect.x + rect.base) / 2 : element.x;
							const centerY = isHorizontal ? element.y : (rect.y + rect.base) / 2;

							ctx.fillStyle = '#ffffff';
							ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
							ctx.lineWidth = 2.5;

							if (phaseName && isHorizontal && size >= 45) {
								ctx.font = 'bold 9px Inter, sans-serif';
								const cleanPhase = phaseName.length > 20 ? `${phaseName.substring(0, 18)}...` : phaseName;
								const line2 = `${rawVal} pts`;
								const fontOffset = 6;

								ctx.strokeText(cleanPhase, centerX, centerY - fontOffset);
								ctx.fillText(cleanPhase, centerX, centerY - fontOffset);

								ctx.font = 'bold 10px Inter, sans-serif';
								ctx.strokeText(line2, centerX, centerY + fontOffset);
								ctx.fillText(line2, centerX, centerY + fontOffset);
							} else if (phaseName && isHorizontal && size >= 30) {
								ctx.font = 'bold 9px Inter, sans-serif';
								const labelText = `${rawVal} pts`;
								ctx.strokeText(labelText, centerX, centerY);
								ctx.fillText(labelText, centerX, centerY);
							} else {
								ctx.font = 'bold 9px Inter, sans-serif';
								const labelText = size >= 20 ? `${rawVal} pts` : `${rawVal}`;
								ctx.strokeText(labelText, centerX, centerY);
								ctx.fillText(labelText, centerX, centerY);
							}
						}
					}
				});
			}
		});
		ctx.restore();
	}
};

export const pieSegmentLabelPlugin = {
	id: 'pieSegmentLabelPlugin',
	afterDatasetsDraw(chart: any) {
		if (chart.config.type !== 'pie') return;
		const { ctx } = chart;
		ctx.save();
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
			const meta = chart.getDatasetMeta(datasetIndex);
			if (!meta.hidden) {
				const total = dataset.data.reduce((a: number, b: number) => a + (b || 0), 0);

				meta.data.forEach((element: any, index: number) => {
					const value = dataset.data[index];
					if (value !== undefined && value !== null && value > 0 && total > 0) {
						const { x, y, startAngle, endAngle, innerRadius, outerRadius } = element.getProps(
							['x', 'y', 'startAngle', 'endAngle', 'innerRadius', 'outerRadius'],
							true
						);

						const angleRange = endAngle - startAngle;
						if (angleRange >= 0.25) {
							const midAngle = startAngle + angleRange / 2;
							const radius = innerRadius + (outerRadius - innerRadius) * 0.58;
							const labelX = x + Math.cos(midAngle) * radius;
							const labelY = y + Math.sin(midAngle) * radius;
							const pct = ((value / total) * 100).toFixed(1);

							ctx.fillStyle = '#ffffff';
							ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
							ctx.lineWidth = 2.5;

							if (angleRange >= 0.5) {
								ctx.font = 'bold 10px Inter, sans-serif';
								const line1 = `${value} (${pct}%)`;
								ctx.strokeText(line1, labelX, labelY);
								ctx.fillText(line1, labelX, labelY);
							} else {
								ctx.font = 'bold 9px Inter, sans-serif';
								const line = `${pct}%`;
								ctx.strokeText(line, labelX, labelY);
								ctx.fillText(line, labelX, labelY);
							}
						}
					}
				});
			}
		});
		ctx.restore();
	}
};

export const getTimestamp = (val: any): number => {
	if (!val) return 0;
	if (typeof val === 'object' && val.seconds !== undefined) {
		return val.seconds * 1000 + (val.nanoseconds || 0) / 1000000;
	}
	const d = new Date(val);
	return isNaN(d.getTime()) ? 0 : d.getTime();
};

export const getMonitoreoTimestamp = (evalu: User): number => {
	const fecha = evalu.fechaMonitoreo || evalu.fechaCreacion;
	if (!fecha) return 0;
	if (typeof fecha === 'string' && fecha.length >= 10) {
		const timeStr = evalu.horaInicio ? `T${evalu.horaInicio}:00` : 'T00:00:00';
		const dateObj = new Date(`${fecha.substring(0, 10)}${timeStr}`);
		if (!isNaN(dateObj.getTime())) return dateObj.getTime();
	}
	return getTimestamp(fecha);
};

export const formatTime = (val: any): string => {
	if (!val) return '';
	const date = new Date(getTimestamp(val));
	if (isNaN(date.getTime())) return '';
	return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

export const getCleanPhaseName = (faseNombre?: string, idFase?: string) => {
	if (faseNombre) return faseNombre;
	if (!idFase) return '—';

	const parts = idFase.split('_');
	if (parts.length > 1 && !isNaN(Number(parts[parts.length - 1]))) {
		return parts.slice(0, -1).join(' ').replace(/_/g, ' ');
	}
	return idFase.replace(/_/g, ' ');
};

export const getLocalDateString = (val: any): string => {
	if (!val) return '—';
	if (typeof val === 'string' && val.length >= 10) {
		const datePart = val.substring(0, 10);
		const parts = datePart.split('-');
		if (parts.length === 3) {
			const [year, month, day] = parts;
			if (year.length === 4 && month && day) {
				return `${day}/${month}/${year}`;
			}
		}
	}
	const timestamp = getTimestamp(val);
	if (timestamp > 0) {
		const dateObj = new Date(timestamp);
		const day = String(dateObj.getDate()).padStart(2, '0');
		const month = String(dateObj.getMonth() + 1).padStart(2, '0');
		const year = dateObj.getFullYear();
		return `${day}/${month}/${year}`;
	}
	return String(val);
};

export const getShortDateString = (val: any): string => {
	if (!val) return '';
	if (typeof val === 'string' && val.length >= 10) {
		const datePart = val.substring(0, 10);
		const parts = datePart.split('-');
		if (parts.length === 3) {
			const [year, month, day] = parts;
			const shortYear = year.length === 4 ? year.substring(2) : year;
			return `${day}-${month}-${shortYear}`;
		}
	}
	const timestamp = getTimestamp(val);
	if (timestamp > 0) {
		const dateObj = new Date(timestamp);
		const day = String(dateObj.getDate()).padStart(2, '0');
		const month = String(dateObj.getMonth() + 1).padStart(2, '0');
		const shortYear = String(dateObj.getFullYear()).substring(2);
		return `${day}-${month}-${shortYear}`;
	}
	return String(val);
};
