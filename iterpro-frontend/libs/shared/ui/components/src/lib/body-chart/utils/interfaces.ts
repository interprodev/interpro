export type BodyChart = 'front' | 'back' | '';

export interface BodyChartInterface {
	zoneClicked: any;
	zoneIn: any;
	zoneOut: any;
	position: BodyChart;
	emitZoneClicked: boolean;
	onMouseClick(e: Event): void;
	onMouseOver(e: Event): void;
	onMouseOut(e: Event): void;
}

export interface BodyLegendConfiguration {
	label: string;
	background?: string;
	patternClass?: string;
}
