import { toShortNumber } from '@iterpro/shared/ui/pipes';
import { Plugin } from 'chart.js';
import { min, range } from 'lodash';

const FONT_SIZE = 14;

export const verticalBarSumDatalabel: Plugin = {
	id: 'sumDatalabel',
	afterDatasetDraw: (chart, args, options) => {
		const { ctx } = chart;

		/** Get Data Length */
		const barLenght = chart.data.labels?.length;

		if (barLenght) {
			/** Get summedData for each bar */
			const summedData = range(barLenght).map((_, index) => {
				return chart.data.datasets.reduce((a, b) => a + (b ? Number(b.data[index]) : 0), 0);
			});

			/** Get datasetMeta */
			const datasetMeta = chart.getDatasetMeta(0);

			datasetMeta.data.forEach((dataPoint, index) => {
				/** Calculate y Positioning */
				const yPositions: number[] = range(barLenght).map((_, i) => {
					const metadata = chart.getDatasetMeta(i);
					return metadata.hidden ? 1000 : metadata.data[index].y;
				});

				/** Get min value */
				const minValue = min(yPositions.map(x => Math.abs(x))) as number;

				/** Print total value */
				ctx.save();
				ctx.textAlign = 'center';
				ctx.fillStyle = 'white';
				ctx.font = `${FONT_SIZE}px sans-serif`;
				ctx.fillText(toShortNumber(summedData[index], true), dataPoint.x, minValue - FONT_SIZE);
			});
		}
	}
};
