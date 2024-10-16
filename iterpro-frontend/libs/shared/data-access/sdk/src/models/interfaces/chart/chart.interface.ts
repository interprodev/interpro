import { ChartOptions, ChartType, PluginChartOptions } from 'chart.js';

export interface PluginChartOptionsWithLabels<TType extends ChartType>
	extends Omit<PluginChartOptions<TType>, 'plugins'> {
	plugins: { datalabels: any; legend: any; tooltip: any };
}

export type ChartOptionsWithLabels = ChartOptions<any> & PluginChartOptionsWithLabels<any>;
